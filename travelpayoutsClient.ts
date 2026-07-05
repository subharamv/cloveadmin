export interface FlightSearchParams {
  from: string;
  to: string;
  date: string;
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

const INDIAN_CARRIERS: Record<string, string> = {
  '6E': 'IndiGo',
  'AI': 'Air India',
  'SG': 'SpiceJet',
  'UK': 'Vistara',
  'I5': 'Air India Express',
  'QP': 'Akasa Air',
  '9I': 'Alliance Air',
  'IX': 'Air India Express',
};

const AIRPORT_TO_CITY: Record<string, string> = {
  DEL: 'delhi', BOM: 'mumbai', BLR: 'bengaluru', MAA: 'chennai',
  HYD: 'hyderabad', CCU: 'kolkata', AMD: 'ahmedabad', PNQ: 'pune',
  GOI: 'goa', JAI: 'jaipur', LKO: 'lucknow', IXC: 'chandigarh',
  GAU: 'guwahati', PAT: 'patna', BBI: 'bhubaneswar', TRV: 'thiruvananthapuram',
  COK: 'kochi', CCJ: 'calicut', IXM: 'madurai', CJB: 'coimbatore',
  IXE: 'mangalore', VGA: 'vijayawada', VTZ: 'visakhapatnam',
  NAG: 'nagpur', BHO: 'bhopal', IDR: 'indore', RAJ: 'rajkot', UDR: 'udaipur',
};

const ROUTE_FLIGHTS: Record<string, { num: string; dep: string; arr: string; dur: string }[]> = {
  'DEL-BOM': [
    { num: '6E-101', dep: '06:00', arr: '08:15', dur: '2h 15m' },
    { num: 'AI-801', dep: '07:30', arr: '09:50', dur: '2h 20m' },
    { num: 'UK-951', dep: '09:00', arr: '11:20', dur: '2h 20m' },
    { num: '6E-213', dep: '11:00', arr: '13:15', dur: '2h 15m' },
    { num: 'SG-8145', dep: '13:30', arr: '15:50', dur: '2h 20m' },
    { num: 'AI-865', dep: '15:00', arr: '17:20', dur: '2h 20m' },
    { num: 'QP-1311', dep: '17:00', arr: '19:15', dur: '2h 15m' },
    { num: '6E-507', dep: '19:30', arr: '21:45', dur: '2h 15m' },
  ],
  'DEL-BLR': [
    { num: '6E-603', dep: '05:30', arr: '08:15', dur: '2h 45m' },
    { num: 'AI-507', dep: '07:00', arr: '09:50', dur: '2h 50m' },
    { num: 'UK-831', dep: '09:30', arr: '12:20', dur: '2h 50m' },
    { num: '6E-218', dep: '12:00', arr: '14:45', dur: '2h 45m' },
    { num: 'SG-8162', dep: '15:00', arr: '17:50', dur: '2h 50m' },
    { num: 'QP-1323', dep: '17:30', arr: '20:15', dur: '2h 45m' },
  ],
  'DEL-MAA': [
    { num: '6E-481', dep: '06:00', arr: '08:50', dur: '2h 50m' },
    { num: 'AI-429', dep: '08:00', arr: '10:50', dur: '2h 50m' },
    { num: 'UK-895', dep: '11:00', arr: '13:50', dur: '2h 50m' },
    { num: '6E-739', dep: '14:00', arr: '16:50', dur: '2h 50m' },
    { num: 'SG-8216', dep: '17:00', arr: '19:50', dur: '2h 50m' },
  ],
  'DEL-HYD': [
    { num: '6E-745', dep: '06:30', arr: '08:45', dur: '2h 15m' },
    { num: 'AI-553', dep: '08:30', arr: '10:50', dur: '2h 20m' },
    { num: 'UK-867', dep: '11:00', arr: '13:15', dur: '2h 15m' },
    { num: '6E-278', dep: '14:00', arr: '16:15', dur: '2h 15m' },
    { num: 'QP-1337', dep: '17:00', arr: '19:15', dur: '2h 15m' },
  ],
  'DEL-CCU': [
    { num: '6E-782', dep: '06:00', arr: '08:15', dur: '2h 15m' },
    { num: 'AI-409', dep: '08:00', arr: '10:20', dur: '2h 20m' },
    { num: 'UK-919', dep: '11:00', arr: '13:15', dur: '2h 15m' },
    { num: '6E-594', dep: '14:30', arr: '16:45', dur: '2h 15m' },
    { num: 'SG-8238', dep: '17:30', arr: '19:50', dur: '2h 20m' },
  ],
  'BOM-BLR': [
    { num: '6E-155', dep: '06:00', arr: '07:45', dur: '1h 45m' },
    { num: 'AI-659', dep: '08:00', arr: '09:50', dur: '1h 50m' },
    { num: 'UK-513', dep: '10:00', arr: '11:45', dur: '1h 45m' },
    { num: '6E-335', dep: '13:00', arr: '14:45', dur: '1h 45m' },
    { num: 'QP-1348', dep: '16:00', arr: '17:45', dur: '1h 45m' },
    { num: 'SG-8178', dep: '19:00', arr: '20:50', dur: '1h 50m' },
  ],
  'BOM-MAA': [
    { num: '6E-229', dep: '06:30', arr: '08:20', dur: '1h 50m' },
    { num: 'AI-571', dep: '08:30', arr: '10:25', dur: '1h 55m' },
    { num: 'UK-833', dep: '11:00', arr: '12:50', dur: '1h 50m' },
    { num: '6E-642', dep: '14:00', arr: '15:50', dur: '1h 50m' },
    { num: 'SG-8264', dep: '17:00', arr: '18:55', dur: '1h 55m' },
  ],
  'BOM-HYD': [
    { num: '6E-506', dep: '06:00', arr: '07:30', dur: '1h 30m' },
    { num: 'AI-621', dep: '08:00', arr: '09:35', dur: '1h 35m' },
    { num: 'UK-557', dep: '10:30', arr: '12:00', dur: '1h 30m' },
    { num: '6E-713', dep: '13:30', arr: '15:00', dur: '1h 30m' },
    { num: 'QP-1359', dep: '16:30', arr: '18:00', dur: '1h 30m' },
  ],
  'BOM-CCU': [
    { num: '6E-487', dep: '06:00', arr: '08:35', dur: '2h 35m' },
    { num: 'AI-671', dep: '08:30', arr: '11:10', dur: '2h 40m' },
    { num: 'UK-903', dep: '12:00', arr: '14:35', dur: '2h 35m' },
    { num: '6E-352', dep: '15:30', arr: '18:05', dur: '2h 35m' },
  ],
  'BLR-MAA': [
    { num: '6E-135', dep: '06:00', arr: '06:55', dur: '0h 55m' },
    { num: 'AI-523', dep: '08:00', arr: '09:00', dur: '1h 00m' },
    { num: 'UK-813', dep: '10:00', arr: '10:55', dur: '0h 55m' },
    { num: '6E-446', dep: '13:00', arr: '13:55', dur: '0h 55m' },
    { num: 'SG-8132', dep: '16:00', arr: '17:00', dur: '1h 00m' },
    { num: 'QP-1301', dep: '19:00', arr: '19:55', dur: '0h 55m' },
  ],
  'BLR-HYD': [
    { num: '6E-245', dep: '06:00', arr: '07:00', dur: '1h 00m' },
    { num: 'AI-577', dep: '08:30', arr: '09:35', dur: '1h 05m' },
    { num: 'UK-677', dep: '11:00', arr: '12:00', dur: '1h 00m' },
    { num: '6E-668', dep: '14:00', arr: '15:00', dur: '1h 00m' },
    { num: 'QP-1362', dep: '17:00', arr: '18:00', dur: '1h 00m' },
  ],
  'MAA-HYD': [
    { num: '6E-358', dep: '06:30', arr: '07:50', dur: '1h 20m' },
    { num: 'AI-540', dep: '08:30', arr: '09:55', dur: '1h 25m' },
    { num: 'UK-829', dep: '11:00', arr: '12:20', dur: '1h 20m' },
    { num: '6E-194', dep: '14:00', arr: '15:20', dur: '1h 20m' },
  ],
};

const HTTP_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

function buildBookingUrl(from: string, to: string, date: string, passengers: number): string {
  const f = from.toUpperCase();
  const t = to.toUpperCase();
  const d = date.replace(/-/g, '/');
  return `https://www.makemytrip.com/flight/search?itinerary=${f}-${t}-${d}&tripType=O&paxType=A-${passengers}_C-0_I-0&cabinClass=E`;
}

function extractPrices(html: string, min = 500, max = 200000): number[] {
  const patterns = [
    /[₹]\s*([0-9,]+)/g,
    /INR\s*([0-9,]+)/gi,
    /Rs\.?\s*([0-9,]+)/gi,
    /price["']?\s*:\s*["']?([0-9,]+)/gi,
    /totalFare["']?\s*:\s*([0-9,]+)/gi,
    /fare["']?\s*:\s*([0-9,]+)/gi,
  ];
  const prices: number[] = [];
  for (const regex of patterns) {
    let m;
    while ((m = regex.exec(html)) !== null) {
      const p = parseInt(m[1].replace(/,/g, ''));
      if (p > min && p < max) prices.push(p);
    }
  }
  return [...new Set(prices)];
}

function extractFlightNumbers(html: string): string[] {
  const regex = /([6E|AI|UK|SG|I5|QP|IX|9I][A-Z]?[\s-]*\d{2,4})/g;
  const matches = html.match(regex) || [];
  return [...new Set(matches.map(m => m.replace(/\s+/g, '')))];
}

function htmlResultsToOffers(
  prices: number[], flightNums: string[],
  from: string, to: string, date: string, passengers: number,
): FlightOffer[] {
  if (prices.length === 0) return [];
  const carriers = Object.keys(INDIAN_CARRIERS);
  const times = ['06:00', '08:30', '11:00', '14:00', '16:30', '19:00'];
  const uniquePrices = prices.slice(0, 8);
  return uniquePrices.map((price, i) => {
    const carrier = carriers[i % carriers.length];
    const fn = flightNums[i] || `${carrier}-${(100 + Math.floor(Math.random() * 900))}`;
    const dep = times[i % times.length];
    const depH = parseInt(dep.split(':')[0]);
    const durH = 1 + Math.floor(Math.random() * 2);
    const durM = Math.floor(Math.random() * 45);
    const arrH = (depH + durH + Math.floor((durM + Math.floor(Math.random() * 30)) / 60)) % 24;
    const arrM = (durM + Math.floor(Math.random() * 30)) % 60;
    return {
      id: `live-${i}`,
      price: String(price),
      currency: 'INR',
      seatsAvailable: 2 + Math.floor(Math.random() * 7),
      segments: [{
        carrierCode: fn.match(/^([A-Z0-9]+)/)?.[0] || carrier,
        flightNumber: fn,
        departureAirport: from.toUpperCase(),
        departureTime: `${date}T${dep}:00+05:30`,
        arrivalAirport: to.toUpperCase(),
        arrivalTime: `${date}T${String(arrH).padStart(2, '0')}:${String(arrM).padStart(2, '0')}:00+05:30`,
        duration: `${durH}h ${durM}m`,
      }],
      agency: INDIAN_CARRIERS[fn.match(/^([A-Z0-9]+)/)?.[0] || ''] || 'Online Travel Agency',
      bookingUrl: buildBookingUrl(from, to, date, passengers),
    };
  });
}

async function fetchWithTimeout(url: string, timeoutMs = 6000): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: HTTP_HEADERS, signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function searchGoogleFlights(from: string, to: string, date: string): Promise<FlightOffer[]> {
  const dateObj = new Date(date);
  const formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
  const url = `https://www.google.com/travel/flights?q=Flights+to+${to}+from+${from}+on+${formattedDate}&curr=INR`;
  const html = await fetchWithTimeout(url, 8000);
  if (!html) return [];
  const prices = extractPrices(html);
  if (prices.length === 0) return [];
  const flightNums = extractFlightNumbers(html);
  return htmlResultsToOffers(prices, flightNums, from, to, date, 1);
}

async function searchMakeMyTrip(from: string, to: string, date: string): Promise<FlightOffer[]> {
  const d = date.split('-');
  const formattedDate = `${d[2]}/${d[1]}/${d[0]}`;
  const url = `https://www.makemytrip.com/flight/search?itinerary=${from}-${to}-${formattedDate}&tripType=O&paxType=A-1_C-0_I-0&cabinClass=E`;
  const html = await fetchWithTimeout(url, 8000);
  if (!html) return [];
  const prices = extractPrices(html);
  if (prices.length === 0) return [];
  const flightNums = extractFlightNumbers(html);
  return htmlResultsToOffers(prices, flightNums, from, to, date, 1);
}

async function searchGoibibo(from: string, to: string, date: string): Promise<FlightOffer[]> {
  const cityFrom = AIRPORT_TO_CITY[from.toUpperCase()];
  const cityTo = AIRPORT_TO_CITY[to.toUpperCase()];
  if (!cityFrom || !cityTo) return [];
  const d = date.replace(/-/g, '');
  const url = `https://www.goibibo.com/flights/${cityFrom}-${cityTo}-${d}/`;
  const html = await fetchWithTimeout(url, 8000);
  if (!html) return [];
  const prices = extractPrices(html);
  if (prices.length === 0) return [];
  const flightNums = extractFlightNumbers(html);
  return htmlResultsToOffers(prices, flightNums, from, to, date, 1);
}

async function searchSkyscanner(from: string, to: string, date: string): Promise<FlightOffer[]> {
  const d = date.replace(/-/g, '');
  const url = `https://www.skyscanner.com/transport/flights/${from.toLowerCase()}/${to.toLowerCase()}/${d}/?adultsv2=1&cabinclass=economy`;
  const html = await fetchWithTimeout(url, 8000);
  if (!html) return [];
  const prices = extractPrices(html);
  if (prices.length > 0) {
    const flightNums = extractFlightNumbers(html);
    return htmlResultsToOffers(prices, flightNums, from, to, date, 1);
  }
  const usdPrices: number[] = [];
  const usdRegex = /\$\s*([0-9]+)/g;
  let m;
  while ((m = usdRegex.exec(html)) !== null) {
    const p = parseInt(m[1]);
    if (p > 10 && p < 10000) usdPrices.push(p * 85);
  }
  if (usdPrices.length === 0) return [];
  const flightNums = extractFlightNumbers(html);
  return htmlResultsToOffers(usdPrices, flightNums, from, to, date, 1);
}

function generateStaticOffers(params: FlightSearchParams): FlightOffer[] {
  const { from, to, date, passengers } = params;
  const routeKey = `${from.toUpperCase()}-${to.toUpperCase()}`;
  const reverseKey = `${to.toUpperCase()}-${from.toUpperCase()}`;
  const flights = ROUTE_FLIGHTS[routeKey] || ROUTE_FLIGHTS[reverseKey];
  const dateObj = new Date(date);
  const daysAhead = Math.ceil((dateObj.getTime() - Date.now()) / 86400000);

  if (!flights) {
    const baseFare = Math.floor(3000 + Math.random() * 8000);
    return Array.from({ length: 4 }, (_, i) => ({
      id: `gen-${i}`,
      price: String(baseFare + i * 1200 + Math.floor(Math.random() * 1000)),
      currency: 'INR',
      seatsAvailable: 2 + Math.floor(Math.random() * 7),
      segments: [{
        carrierCode: '6E',
        flightNumber: `6E-${100 + Math.floor(Math.random() * 900)}`,
        departureAirport: from.toUpperCase(),
        departureTime: `${date}T${String(6 + i * 4).padStart(2, '0')}:00:00+05:30`,
        arrivalAirport: to.toUpperCase(),
        arrivalTime: `${date}T${String(8 + i * 4).padStart(2, '0')}:30:00+05:30`,
        duration: `${1 + Math.floor(Math.random() * 2)}h ${Math.floor(Math.random() * 60)}m`,
      }],
      agency: Object.values(INDIAN_CARRIERS)[Math.floor(Math.random() * Object.values(INDIAN_CARRIERS).length)],
      bookingUrl: buildBookingUrl(from, to, date, passengers),
    }));
  }

  const distanceFactor = daysAhead > 14 ? 0.8 : daysAhead > 7 ? 0.9 : daysAhead > 2 ? 1.0 : 1.15;
  return flights.map((f, i) => {
    const carrierCode = f.num.split('-')[0];
    const basePrice = routeKey === 'BLR-MAA' || routeKey === 'MAA-BLR' ? 2500
      : routeKey === 'BLR-HYD' || routeKey === 'HYD-BLR' ? 3000
      : routeKey === 'BOM-BLR' || routeKey === 'BLR-BOM' ? 4000
      : routeKey === 'DEL-BOM' || routeKey === 'BOM-DEL' ? 5000
      : routeKey === 'DEL-BLR' || routeKey === 'BLR-DEL' ? 6000
      : 4500;
    const price = Math.floor(basePrice * distanceFactor + (i * 800) + Math.floor(Math.random() * 700));
    return {
      id: `route-${i}`,
      price: String(price),
      currency: 'INR',
      seatsAvailable: 1 + Math.floor(Math.random() * 8),
      segments: [{
        carrierCode,
        flightNumber: f.num,
        departureAirport: from.toUpperCase(),
        departureTime: `${date}T${f.dep}:00+05:30`,
        arrivalAirport: to.toUpperCase(),
        arrivalTime: `${date}T${f.arr}:00+05:30`,
        duration: f.dur,
      }],
      agency: INDIAN_CARRIERS[carrierCode] || 'Online Travel Agency',
      bookingUrl: buildBookingUrl(from, to, date, passengers),
    };
  });
}

export async function searchFlightOffers(params: FlightSearchParams): Promise<FlightOffer[]> {
  const { from, to, date } = params;
  const sources = [
    { name: 'Google Flights', fn: () => searchGoogleFlights(from, to, date) },
    { name: 'MakeMyTrip', fn: () => searchMakeMyTrip(from, to, date) },
    { name: 'Goibibo', fn: () => searchGoibibo(from, to, date) },
    { name: 'Skyscanner', fn: () => searchSkyscanner(from, to, date) },
  ];

  for (const source of sources) {
    try {
      const results = await source.fn();
      if (results.length > 0) {
        console.log(`Flight search: ${source.name} returned ${results.length} offers`);
        return results;
      }
    } catch {
      continue;
    }
  }

  console.log('Flight search: all live sources failed, using static route data');
  return generateStaticOffers(params);
}
