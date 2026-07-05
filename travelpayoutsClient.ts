import crypto from 'crypto';

// Lazy env reads — this module can be imported before dotenv.config() runs in
// the importing file (ES module imports execute before the rest of that
// file's top-level code), which would otherwise capture "".
const getMarker = () => process.env.TRAVELPAYOUTS_MARKER || '';
const getToken = () => process.env.TRAVELPAYOUTS_TOKEN || '';
const getHost = () => process.env.TRAVELPAYOUTS_HOST || 'localhost';

const SEARCH_INIT_URL = 'https://api.travelpayouts.com/v1/flight_search';
const SEARCH_RESULTS_URL = 'https://api.travelpayouts.com/v1/flight_search_results';

export interface FlightSearchParams {
  from: string;
  to: string;
  date: string; // yyyy-MM-dd
  passengers: number;
}

export interface FlightOfferSegment {
  carrierCode: string;
  flightNumber: string;
  departureAirport: string;
  departureTime: string;
  arrivalAirport: string;
  arrivalTime: string;
  duration: string;
}

export interface FlightOffer {
  id: string;
  price: string;
  currency: string;
  seatsAvailable: number | null;
  segments: FlightOfferSegment[];
  agency: string;
  bookingUrl: string;
}

// Travelpayouts' documented signature scheme is under-specified for nested
// fields (confirmed ambiguous even in their own docs) — this is the commonly
// referenced field order, but treat it as provisional until verified against
// a real search with live credentials.
function buildSignature(payload: {
  marker: string;
  host: string;
  locale: string;
  trip_class: string;
  passengers: { adults: number; children: number; infants: number };
  segments: { origin: string; destination: string; date: string }[];
  user_ip: string;
}): string {
  const token = getToken();
  const parts = [
    token,
    payload.marker,
    payload.host,
    payload.locale,
    payload.trip_class,
    String(payload.passengers.adults),
    String(payload.passengers.children),
    String(payload.passengers.infants),
    payload.segments[0].date,
    payload.segments[0].destination,
    payload.segments[0].origin,
    payload.user_ip,
  ];
  return crypto.createHash('md5').update(parts.join(':')).digest('hex');
}

async function initiateSearch(params: FlightSearchParams): Promise<string> {
  const marker = getMarker();
  const token = getToken();
  if (!marker || !token) {
    throw new Error('Travelpayouts is not configured (TRAVELPAYOUTS_MARKER / TRAVELPAYOUTS_TOKEN missing)');
  }

  const body = {
    marker,
    host: getHost(),
    user_ip: '127.0.0.1',
    locale: 'en',
    trip_class: 'Y',
    passengers: { adults: params.passengers || 1, children: 0, infants: 0 },
    segments: [{ origin: params.from, destination: params.to, date: params.date }],
  };
  const signature = buildSignature(body);

  const res = await fetch(SEARCH_INIT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, signature }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Travelpayouts search init failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  if (!data.search_id) {
    throw new Error('Travelpayouts did not return a search_id');
  }
  return data.search_id;
}

function parseProposals(raw: any[]): FlightOffer[] {
  const offers: FlightOffer[] = [];
  for (const chunk of raw) {
    const proposals = chunk?.proposals || [];
    for (const proposal of proposals) {
      const segment = proposal.segment?.[0];
      const flightSegments: FlightOfferSegment[] = (segment?.flight || []).map((f: any) => ({
        carrierCode: f.marketing_carrier,
        flightNumber: `${f.marketing_carrier}${f.number}`,
        departureAirport: f.departure,
        departureTime: f.local_departure_timestamp ? new Date(f.local_departure_timestamp * 1000).toISOString() : '',
        arrivalAirport: f.arrival,
        arrivalTime: f.local_arrival_timestamp ? new Date(f.local_arrival_timestamp * 1000).toISOString() : '',
        duration: String(f.duration || ''),
      }));

      const terms = proposal.terms ? Object.values(proposal.terms)[0] as any : null;

      offers.push({
        id: proposal.sign || `${chunk.search_id}-${offers.length}`,
        price: terms?.price != null ? String(terms.price) : '',
        currency: chunk.currency || 'INR',
        seatsAvailable: proposal.meta?.seats ?? null,
        segments: flightSegments,
        agency: terms?.gate_id ? `Agency #${terms.gate_id}` : 'Partner agency',
        bookingUrl: terms?.url ? `https://www.aviasales.com${terms.url}` : '',
      });
    }
  }
  return offers;
}

async function pollResults(searchId: string, maxAttempts = 6): Promise<FlightOffer[]> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await fetch(`${SEARCH_RESULTS_URL}?uuid=${searchId}`);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Travelpayouts results fetch failed (${res.status}): ${text.slice(0, 300)}`);
    }
    const data = await res.json();
    const hasProposals = Array.isArray(data) && data.some((chunk: any) => (chunk.proposals || []).length > 0);
    if (hasProposals) {
      return parseProposals(data);
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  return [];
}

export async function searchFlightOffers(params: FlightSearchParams): Promise<FlightOffer[]> {
  const searchId = await initiateSearch(params);
  return pollResults(searchId);
}
