import { getAuthToken } from '../lib/auth';

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

export async function fetchFlightOffers(params: {
  from: string;
  to: string;
  date: string;
  passengers: number;
}): Promise<FlightOffer[]> {
  const token = getAuthToken();
  const query = new URLSearchParams({
    from: params.from,
    to: params.to,
    date: params.date,
    passengers: String(params.passengers),
  });
  const res = await fetch(`/api/travel/flight-offers?${query.toString()}`, {
    headers: { Authorization: token || '' },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch flight offers');
  return data;
}
