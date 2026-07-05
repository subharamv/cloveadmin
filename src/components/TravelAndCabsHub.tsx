import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  Plane, 
  Train, 
  Search, 
  MapPin, 
  Calendar, 
  Users, 
  ArrowRightLeft,
  ExternalLink,
  AlertCircle,
  X,
  Map as MapIcon,
  Car, 
  Plus, 
  User, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Navigation,
  Package,
  Trash2,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AIRPORTS, Airport } from '../data/airports';
import { TRAIN_STATIONS, TrainStation } from '../data/trainStations';
import { fetchFlightOffers, FlightOffer } from '../travel/flightOffersApi';

/* hide Leaflet / OpenStreetMap branding */
const style = document.createElement('style');
style.textContent = '.leaflet-control-attribution{display:none!important}.routeFlowLine{animation:routeDash 1.2s linear infinite}@keyframes routeDash{to{stroke-dashoffset:-24}}';
document.head.appendChild(style);

// Small circular div-icon avoids Leaflet's default marker image paths, which
// break under Vite bundling unless manually reconfigured.
const hubIcon = L.divIcon({
  className: '',
  html: '<div style="width:14px;height:14px;border-radius:50%;background:#2563eb;border:2px solid white;box-shadow:0 0 8px rgba(37,99,235,0.7);"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

// Endpoint markers for a selected route — amber for departure, blue for
// arrival, with a pulsing ring so both ends stand out against baseline hubs.
const departureIcon = L.divIcon({
  className: '',
  html: '<div style="position:relative;width:18px;height:18px;"><div style="position:absolute;inset:0;border-radius:50%;background:#f59e0b;opacity:0.35;animation:pulseRing 1.6s ease-out infinite;"></div><div style="position:absolute;left:4px;top:4px;width:10px;height:10px;border-radius:50%;background:#f59e0b;border:2px solid white;box-shadow:0 0 8px rgba(245,158,11,0.8);"></div></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});
const arrivalIcon = L.divIcon({
  className: '',
  html: '<div style="position:relative;width:18px;height:18px;"><div style="position:absolute;inset:0;border-radius:50%;background:#2563eb;opacity:0.35;animation:pulseRing 1.6s ease-out infinite;"></div><div style="position:absolute;left:4px;top:4px;width:10px;height:10px;border-radius:50%;background:#2563eb;border:2px solid white;box-shadow:0 0 8px rgba(37,99,235,0.8);"></div></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// Pans/zooms the map to frame both endpoints whenever a route is selected.
function FitRouteBounds({ from, to }: { from: [number, number] | null; to: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (from && to) {
      map.fitBounds([from, to], { padding: [40, 40], maxZoom: 6 });
    }
  }, [from?.[0], from?.[1], to?.[0], to?.[1], map]);
  return null;
}

if (typeof document !== 'undefined' && !document.getElementById('route-pulse-ring-keyframes')) {
  const pulseStyle = document.createElement('style');
  pulseStyle.id = 'route-pulse-ring-keyframes';
  pulseStyle.textContent = '@keyframes pulseRing{0%{transform:scale(0.6);opacity:0.6}100%{transform:scale(2.2);opacity:0}}';
  document.head.appendChild(pulseStyle);
}

// Indian Travel Hubs data
const INDIAN_HUBS = [
  { code: 'DEL', city: 'Delhi', name: 'Indira Gandhi International', type: 'both', lat: 28.5562, lng: 77.1000 },
  { code: 'BOM', city: 'Mumbai', name: 'Chhatrapati Shivaji Maharaj', type: 'both', lat: 19.0896, lng: 72.8656 },
  { code: 'BLR', city: 'Bengaluru', name: 'Kempegowda International', type: 'both', lat: 13.1986, lng: 77.7066 },
  { code: 'CCU', city: 'Kolkata', name: 'Netaji Subhash Chandra Bose', type: 'both', lat: 22.6547, lng: 88.4467 },
  { code: 'MAA', city: 'Chennai', name: 'Chennai International', type: 'both', lat: 12.9941, lng: 80.1709 },
  { code: 'HYD', city: 'Hyderabad', name: 'Rajiv Gandhi International', type: 'both', lat: 17.2403, lng: 78.4294 },
  { code: 'AMD', city: 'Ahmedabad', name: 'Sardar Vallabhbhai Patel', type: 'both', lat: 23.0772, lng: 72.6347 },
  { code: 'PNQ', city: 'Pune', name: 'Pune Junction', type: 'train', lat: 18.5289, lng: 73.8744 },
  { code: 'MAS', city: 'Chennai', name: 'Chennai Central', type: 'train', lat: 13.0827, lng: 80.2707 },
  { code: 'NDLS', city: 'Delhi', name: 'New Delhi Railway Station', type: 'train', lat: 28.6430, lng: 77.2223 },
  { code: 'CSMT', city: 'Mumbai', name: 'Mumbai CSMT', type: 'train', lat: 18.9400, lng: 72.8353 },
];

// Vizag Landmarks for Cabs
const VIZAG_LANDMARKS = [
  { name: 'Visakhapatnam International Airport (VTZ)', area: 'NAD' },
  { name: 'Visakhapatnam Railway Station', area: 'Daba Gardens' },
  { name: 'RTC Complex', area: 'Asilmetta' },
  { name: 'Jagadamba Centre', area: 'Jagadamba' },
  { name: 'Siripuram Junction', area: 'Siripuram' },
  { name: 'RK Beach (Ramakrishna Beach)', area: 'Beach Road' },
  { name: 'Rishikonda Beach', area: 'Madhurawada' },
  { name: 'MVP Sector - 1', area: 'MVP Colony' },
  { name: 'MVP Sector - 2', area: 'MVP Colony' },
  { name: 'MVP Sector - 3', area: 'MVP Colony' },
  { name: 'MVP Sector - 4', area: 'MVP Colony' },
  { name: 'MVP Sector - 5', area: 'MVP Colony' },
  { name: 'MVP Sector - 6', area: 'MVP Colony' },
  { name: 'MVP Sector - 7', area: 'MVP Colony' },
  { name: 'MVP Sector - 8', area: 'MVP Colony' },
  { name: 'MVP Sector - 9', area: 'MVP Colony' },
  { name: 'MVP Sector - 10', area: 'MVP Colony' },
  { name: 'MVP Sector - 11', area: 'MVP Colony' },
  { name: 'MVP Sector - 12', area: 'MVP Colony' },
  { name: 'Vuda Park', area: 'Beach Road' },
  { name: 'Tenneti Park', area: 'Isukathota' },
  { name: 'Kailasagiri Hill Top', area: 'Adarsh Nagar' },
  { name: 'Gajuwaka Junction', area: 'Gajuwaka' },
  { name: 'Madhurawada Junction', area: 'Madhurawada' },
  { name: 'Dwaraka Nagar', area: 'Dwaraka Nagar' },
  { name: 'Seethammadhara', area: 'Seethammadhara' },
  { name: 'Murali Nagar', area: 'Madhavadhara' },
  { name: 'Akkayyapalem', area: 'Akkayyapalem' },
  { name: 'Nad Junction', area: 'NAD' },
  { name: 'Gopalapatnam', area: 'Gopalapatnam' },
  { name: 'Simhachalam Temple', area: 'Simhachalam' },
  { name: 'Kurmannapalem Junction', area: 'Kurmannapalem' },
  { name: 'Sagar Nagar', area: 'Beach Road' },
  { name: 'GITAM University', area: 'Rushikonda' },
  { name: 'Andhra University', area: 'Siripuram' },
  { name: 'CMR Central Mall', area: 'Isukathota' },
  { name: 'Inox Varun Beach', area: 'Beach Road' },
  { name: 'Seven Hills Hospital', area: 'Ram Nagar' },
  { name: 'Care Hospital', area: 'Waltair Main Road' },
  { name: 'Port Trust Stadium', area: 'Akkayyapalem' },
];

interface CabTrip {
  id: string;
  passengerName: string;
  vehicleType: string;
  serviceType: 'Ride' | 'Delivery';
  provider: 'Uber' | 'Ola';
  date: string;
  time: string;
  pickup: string;
  drop: string;
  status: 'Confirmed' | 'Scheduled' | 'Pending' | 'Completed';
  timestamp: any;
}

interface VendorSLAContract {
  id: string;
  vendorName: string;
  onboarding: 'Approved' | 'Pending';
  slaCompliance: number;
  invoiceStatus: 'Awaiting Sign-off' | 'Escrow Released' | 'Under Audit' | 'Payment Processed';
  escrowAmount: string;
  updatedAt: string;
}

export function TravelAndCabsHub({ searchTerm = '', isDarkMode = false }: { searchTerm?: string; isDarkMode?: boolean }) {
  // Travelpayouts affiliate attribution script — scoped to this page only
  // (booking/search happens here), loaded on mount and removed on unmount
  // rather than injected globally into every admin page.
  useEffect(() => {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://tp-em.com/NTQ2NTk0.js?t=546594';
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // --------- Vendor SLA Tracking Dock State ---------
  const [vendors, setVendors] = useState<VendorSLAContract[]>(() => {
    const saved = localStorage.getItem('clove_vendor_sla_contracts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return [
      {
        id: "VND-2026-X812",
        vendorName: "GMR Visakha Transit Liaison",
        onboarding: "Approved",
        slaCompliance: 98.4,
        invoiceStatus: "Escrow Released",
        escrowAmount: "₹4,25,000",
        updatedAt: "21 May 2026"
      },
      {
        id: "VND-2026-Y409",
        vendorName: "Deccan Cargo Sentry Logistics",
        onboarding: "Approved",
        slaCompliance: 94.2,
        invoiceStatus: "Awaiting Sign-off",
        escrowAmount: "₹8,50,000",
        updatedAt: "20 May 2026"
      },
      {
        id: "VND-2026-Z711",
        vendorName: "Coastal Corridors Cabs & Shuttle",
        onboarding: "Pending",
        slaCompliance: 89.6,
        invoiceStatus: "Under Audit",
        escrowAmount: "₹2,10,000",
        updatedAt: "19 May 2026"
      },
      {
        id: "VND-2026-A103",
        vendorName: "Vara Lakshmi Heavy Haulage Co.",
        onboarding: "Approved",
        slaCompliance: 91.5,
        invoiceStatus: "Escrow Released",
        escrowAmount: "₹12,40,000",
        updatedAt: "18 May 2026"
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('clove_vendor_sla_contracts', JSON.stringify(vendors));
  }, [vendors]);

  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorFilterStatus, setVendorFilterStatus] = useState<'All' | 'Approved' | 'Pending'>('All');
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [newVendorForm, setNewVendorForm] = useState({
    vendorName: '',
    onboarding: 'Approved' as 'Approved' | 'Pending',
    slaCompliance: '95.0',
    invoiceStatus: 'Awaiting Sign-off' as any,
    escrowAmount: '₹5,00,000'
  });

  const handleCreateVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorForm.vendorName) return;
    
    const newVendor: VendorSLAContract = {
      id: `VND-2026-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      vendorName: newVendorForm.vendorName,
      onboarding: newVendorForm.onboarding,
      slaCompliance: parseFloat(newVendorForm.slaCompliance) || 95.0,
      invoiceStatus: newVendorForm.invoiceStatus,
      escrowAmount: newVendorForm.escrowAmount.startsWith('₹') ? newVendorForm.escrowAmount : `₹${newVendorForm.escrowAmount}`,
      updatedAt: format(new Date(), 'dd MMM yyyy')
    };

    setVendors(prev => [newVendor, ...prev]);
    setShowAddVendor(false);
    setNewVendorForm({
      vendorName: '',
      onboarding: 'Approved',
      slaCompliance: '95.0',
      invoiceStatus: 'Awaiting Sign-off',
      escrowAmount: '₹5,00,000'
    });
  };

  const deleteVendor = (id: string) => {
    if (window.confirm('Delete this vendor contract entry?')) {
      setVendors(prev => prev.filter(v => v.id !== id));
    }
  };

  const updateVendorInvoiceStatus = (id: string, newStatus: any) => {
    setVendors(prev => prev.map(v => v.id === id ? { ...v, invoiceStatus: newStatus } : v));
  };

  const updateVendorOnboarding = (id: string, newStatus: any) => {
    setVendors(prev => prev.map(v => v.id === id ? { ...v, onboarding: newStatus } : v));
  };

  // --------- Flights & Trains Logic State ---------
  const [activeType, setActiveType] = useState<'flight' | 'train'>('flight');
  const [travelFormData, setTravelFormData] = useState({
    from: '',
    to: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    passengers: '1'
  });
  const [travelSuggestions, setTravelSuggestions] = useState<(Airport | TrainStation)[]>([]);
  const [activeTravelInput, setActiveTravelInput] = useState<'from' | 'to' | null>(null);
  const [showPopupWarning, setShowPopupWarning] = useState(false);
  const [selectedHub, setSelectedHub] = useState<typeof INDIAN_HUBS[0] | null>(null);
  const [flightOffers, setFlightOffers] = useState<FlightOffer[] | null>(null);
  const [flightOffersLoading, setFlightOffersLoading] = useState(false);
  const [flightOffersError, setFlightOffersError] = useState<string | null>(null);

  // --------- Cab Bookings Logic State ---------
  const [trips, setTrips] = useState<CabTrip[]>([]);
  const [cabFormData, setCabFormData] = useState({
    passengerName: '',
    vehicleType: 'Sedan',
    serviceType: 'Ride' as 'Ride' | 'Delivery',
    provider: 'Uber' as 'Uber' | 'Ola',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
    pickup: '',
    drop: ''
  });
  const [cabSuggestions, setCabSuggestions] = useState<typeof VIZAG_LANDMARKS>([]);
  const [activeCabInput, setActiveCabInput] = useState<'pickup' | 'drop' | null>(null);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Completed' | 'Scheduled'>('All');
  const [cabNotification, setCabNotification] = useState<{
    show: boolean;
    provider: 'Uber' | 'Ola';
    status: string;
  }>({ show: false, provider: 'Uber', status: '' });

  // --------- Fleet Safety Compliance States ---------
  const [safetyMetrics, setSafetyMetrics] = useState<{
    [tripId: string]: {
      driverName: string;
      licensePlate: string;
      preTripVerified: boolean;
      speedLimitCompliant: boolean;
      maintenanceValid: boolean;
    }
  }>({});

  useEffect(() => {
    if (trips.length > 0) {
      setSafetyMetrics(prev => {
        const updated = { ...prev };
        let updatedAny = false;
        const driverNames = ['K. Srinivasa Rao', 'M. Appalaraju', 'P. Satish Kumar', 'G. Rambabu', 'Ch. Vasu', 'K. Jagadeesh'];
        const plates = ['AP-31-TV-4829', 'AP-39-UL-1024', 'AP-31-TC-8890', 'AP-35-MX-5002', 'AP-02-ZZ-3311', 'AP-31-BW-1212'];
        trips.forEach((trip, index) => {
          if (!updated[trip.id]) {
            const mIndex = index % driverNames.length;
            updated[trip.id] = {
              driverName: driverNames[mIndex],
              licensePlate: plates[mIndex],
              preTripVerified: index % 3 !== 2, // 1 in 3 failed safety check by default
              speedLimitCompliant: index % 4 !== 3, // 1 in 4 speed violation by default
              maintenanceValid: true,
            };
            updatedAny = true;
          }
        });
        if (updatedAny) {
          return updated;
        }
        return prev;
      });
    }
  }, [trips]);

  const toggleSafetyField = (tripId: string, field: 'preTripVerified' | 'speedLimitCompliant' | 'maintenanceValid') => {
    setSafetyMetrics(prev => {
      const metric = prev[tripId];
      if (!metric) return prev;
      return {
        ...prev,
        [tripId]: {
          ...metric,
          [field]: !metric[field]
        }
      };
    });
  };

  // --------- Active Network Sync ---------
  useEffect(() => {
    const q = query(collection(db, 'cabTrips'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTrips(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CabTrip)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'cabTrips'));
    return () => unsubscribe();
  }, []);

  // --------- Travel Autocomplete and Swap ---------
  // Flights search the airport dataset (India + major international); trains
  // search the Indian Railways station dataset — swapped based on the active tab.
  const handleTravelInputChange = (field: 'from' | 'to', value: string) => {
    setTravelFormData(prev => ({ ...prev, [field]: value }));
    if (value.length > 0) {
      const dataset: (Airport | TrainStation)[] = activeType === 'flight' ? AIRPORTS : TRAIN_STATIONS;
      const filtered = dataset.filter(h =>
        h.city.toLowerCase().includes(value.toLowerCase()) ||
        h.code.toLowerCase().includes(value.toLowerCase()) ||
        h.name.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 6);
      setTravelSuggestions(filtered);
      setActiveTravelInput(field);
    } else {
      setTravelSuggestions([]);
      setActiveTravelInput(null);
    }
  };

  const handleTravelTypeChange = (type: 'flight' | 'train') => {
    setActiveType(type);
    setTravelFormData(prev => ({ ...prev, from: '', to: '' }));
    setTravelSuggestions([]);
    setActiveTravelInput(null);
  };

  const swapStations = () => {
    setTravelFormData(prev => ({ ...prev, from: prev.to, to: prev.from }));
  };

  const getBookingUrls = (from: string, to: string, date: string, passengers: string) => {
    return activeType === 'flight' ? [
      `https://www.makemytrip.com/flight/search?itinerary=${from}-${to}-${format(new Date(date), 'dd/MM/yyyy')}&paxType=A-${passengers}_C-0_I-0&tripType=O&cabinClass=E`,
      `https://www.goibibo.com/flights/air-${from}-${to}-${format(new Date(date), 'yyyyMMdd')}--${passengers}-0-0-E-D/`,
      `https://www.skyscanner.co.in/transport/flights/${from.toLowerCase()}/${to.toLowerCase()}/${format(new Date(date), 'yyMMdd')}/?adults=${passengers}`
    ] : [
      `https://www.makemytrip.com/railways/listing?fromCity=${from}&toCity=${to}&date=${format(new Date(date), 'yyyyMMdd')}`,
      `https://www.goibibo.com/trains/check-train-between-stations/${from}/${to}/${format(new Date(date), 'yyyyMMdd')}/`,
      `https://www.confirmtkt.com/train-running-status/${from}-to-${to}?date=${format(new Date(date), 'dd-MM-yyyy')}`
    ];
  };

  const handleSmartSearch = () => {
    const { from, to, date, passengers } = travelFormData;
    if (!from || !to) return;

    const urls = getBookingUrls(from, to, date, passengers);

    let blocked = false;
    urls.forEach(url => {
      const newTab = window.open(url, '_blank');
      if (!newTab) blocked = true;
    });

    if (blocked) {
      setShowPopupWarning(true);
      setTimeout(() => setShowPopupWarning(false), 5000);
    }
  };

  // Real flight offers (price + schedule) via the Travelpayouts flight search
  // API — an official, ToS-compliant data source, not a scrape of any OTA site.
  const handleCheckAvailability = async () => {
    const { from, to, date, passengers } = travelFormData;
    if (!from || !to || activeType !== 'flight') return;

    setFlightOffersLoading(true);
    setFlightOffersError(null);
    setFlightOffers(null);
    try {
      const offers = await fetchFlightOffers({ from, to, date, passengers: Number(passengers) });
      setFlightOffers(offers);
    } catch (err: any) {
      setFlightOffersError(err.message || 'Failed to fetch flight offers');
    } finally {
      setFlightOffersLoading(false);
    }
  };

  // Travelpayouts returns a per-offer agency deep link where available —
  // use that first since it lands the user closest to the exact fare shown.
  // Otherwise (or if the OTA doesn't support deep-linking one exact flight),
  // fall back to a live search on the booking platform for the same route/date.
  const handleBookOffer = (offer: FlightOffer) => {
    if (offer.bookingUrl) {
      window.open(offer.bookingUrl, '_blank');
      return;
    }
    const { from, to, date, passengers } = travelFormData;
    if (!from || !to) return;
    const url = getBookingUrls(from, to, date, passengers)[0];
    window.open(url, '_blank');
  };

  // --------- Cab Autocomplete and Booking ---------
  const handleCabLocationSearch = (field: 'pickup' | 'drop', value: string) => {
    setCabFormData(prev => ({ ...prev, [field]: value }));
    if (value.length > 0) {
      const filtered = VIZAG_LANDMARKS.filter(l => 
        l.name.toLowerCase().includes(value.toLowerCase()) || 
        l.area.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      setCabSuggestions(filtered);
      setActiveCabInput(field);
    } else {
      setCabSuggestions([]);
      setActiveCabInput(null);
    }
  };

  const handleLiveCabBook = (provider: 'Uber' | 'Ola', pickup: string, drop: string) => {
    const citySuffix = ", Visakhapatnam, Andhra Pradesh, India";
    const encodedPickup = encodeURIComponent(pickup + citySuffix);
    const encodedDrop = encodeURIComponent(drop + citySuffix);

    setCabNotification({ show: true, provider, status: 'Initiating Relay...' });
    
    setTimeout(() => {
      if (provider === 'Uber') {
        const uberUrl = `https://m.uber.com/ul/?action=setPickup&pickup[formatted_address]=${encodedPickup}&dropoff[formatted_address]=${encodedDrop}`;
        window.open(uberUrl, '_blank');
      } else {
        const olaUrl = `https://www.olacabs.com/mobile/search?pickup_name=${encodedPickup}&dropoff_name=${encodedDrop}`;
        window.open(olaUrl, '_blank');
      }
      setCabNotification(prev => ({ ...prev, status: 'Handover Complete' }));
      setTimeout(() => setCabNotification({ show: false, provider: 'Uber', status: '' }), 3000);
    }, 1200);
  };

  const completeCabTrip = async (id: string) => {
    try {
      await updateDoc(doc(db, 'cabTrips', id), {
        status: 'Completed'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `cabTrips/${id}`);
    }
  };

  const deleteCabTrip = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this trip record?')) return;
    try {
      await deleteDoc(doc(db, 'cabTrips', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `cabTrips/${id}`);
    }
  };

  const handleCabSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'cabTrips'), {
        ...cabFormData,
        status: 'Scheduled',
        timestamp: serverTimestamp()
      });
      
      handleLiveCabBook(cabFormData.provider, cabFormData.pickup, cabFormData.drop);

      setCabFormData({ 
        passengerName: '', 
        vehicleType: 'Sedan', 
        serviceType: 'Ride',
        provider: 'Uber',
        date: format(new Date(), 'yyyy-MM-dd'), 
        time: format(new Date(), 'HH:mm'), 
        pickup: '', 
        drop: '' 
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'cabTrips');
    }
  };

  // Filter Cab trips based on Search term and status
  const filteredCabTrips = trips.filter(trip => {
    const matchesSearch = searchTerm.trim() === '' || 
      trip.passengerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.pickup.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.drop.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'All' || trip.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const cabCounts = {
    All: trips.length,
    Pending: trips.filter(t => t.status === 'Pending').length,
    Completed: trips.filter(t => t.status === 'Completed').length,
    Scheduled: trips.filter(t => t.status === 'Scheduled').length,
  };

  // OpenStreetMap renderer via Leaflet — free, no API key required.
  const tileUrl = isDarkMode
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const MapView = () => {
    // Route endpoints come from whichever dataset the active tab searches
    // (airports for flights, stations for trains) — not the small static
    // INDIAN_HUBS list, so the arc works for any selected pair, not just
    // the 11 baseline hubs shown on the map by default.
    const routeDataset: (Airport | TrainStation)[] = activeType === 'flight' ? AIRPORTS : TRAIN_STATIONS;
    const fromHub = routeDataset.find(h => h.code === travelFormData.from);
    const toHub = routeDataset.find(h => h.code === travelFormData.to);
    let arcPoints: [number, number][] | null = null;
    if (fromHub && toHub) {
      const steps = 40;
      const mid = { lat: (fromHub.lat + toHub.lat) / 2, lng: (fromHub.lng + toHub.lng) / 2 };
      const dist = Math.sqrt((toHub.lat - fromHub.lat) ** 2 + (toHub.lng - fromHub.lng) ** 2);
      const bulge = dist * 0.35;
      arcPoints = Array.from({ length: steps + 1 }, (_, i) => {
        const t = i / steps;
        const lat = fromHub.lat + (toHub.lat - fromHub.lat) * t;
        const lng = fromHub.lng + (toHub.lng - fromHub.lng) * t;
        const arc = bulge * Math.sin(t * Math.PI);
        return [lat + arc, lng - arc * 0.4] as [number, number];
      });
    }

    return (
      <div className="h-[250px] w-full bg-[var(--bg-color)] rounded-3xl relative overflow-hidden border border-[var(--border-color)] shadow-sm">
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={4}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            url={tileUrl}
          />
          <FitRouteBounds
            from={fromHub ? [fromHub.lat, fromHub.lng] : null}
            to={toHub ? [toHub.lat, toHub.lng] : null}
          />
          {arcPoints && fromHub && toHub && (
            <>
              <Polyline positions={arcPoints} color="#1e3a5f" weight={10} opacity={0.25} />
              <Polyline positions={arcPoints} color="#2563eb" weight={6} opacity={0.5} />
              <Polyline positions={arcPoints} color="#3b82f6" weight={4} opacity={0.8} />
              <Polyline positions={arcPoints} color="#93c5fd" weight={1.5} opacity={1} />
              <Polyline positions={arcPoints} color="#60a5fa" weight={3} opacity={0.9} dashArray="12 8" pathOptions={{ className: 'routeFlowLine' }} />
              <Marker position={[fromHub.lat, fromHub.lng]} icon={departureIcon}>
                <Popup>
                  <div className="p-1 min-w-[100px]">
                    <h4 className="text-[10px] font-black uppercase tracking-wide text-amber-600">Departure</h4>
                    <p className="text-xs font-bold">{fromHub.city}</p>
                    <p className="text-[8px] font-bold opacity-65">{fromHub.name}</p>
                  </div>
                </Popup>
              </Marker>
              <Marker position={[toHub.lat, toHub.lng]} icon={arrivalIcon}>
                <Popup>
                  <div className="p-1 min-w-[100px]">
                    <h4 className="text-[10px] font-black uppercase tracking-wide text-blue-600">Arrival</h4>
                    <p className="text-xs font-bold">{toHub.city}</p>
                    <p className="text-[8px] font-bold opacity-65">{toHub.name}</p>
                  </div>
                </Popup>
              </Marker>
            </>
          )}
          {INDIAN_HUBS.map(hub => (
            <Marker
              key={hub.code}
              position={[hub.lat, hub.lng]}
              icon={hubIcon}
              eventHandlers={{ click: () => setSelectedHub(hub) }}
            >
              <Popup>
                <div className="p-1 min-w-[120px]">
                  <h4 className="text-[10px] font-black uppercase tracking-wide">{hub.city}</h4>
                  <p className="text-[8px] font-bold mb-1 opacity-65">{hub.name}</p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setTravelFormData(prev => ({ ...prev, from: hub.code }))}
                      className="flex-1 bg-blue-600 text-white text-[8px] font-black uppercase py-1 rounded"
                    >
                      From
                    </button>
                    <button
                      onClick={() => setTravelFormData(prev => ({ ...prev, to: hub.code }))}
                      className="flex-1 bg-gray-800 text-white text-[8px] font-black uppercase py-1 rounded"
                    >
                      To
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Dynamic Consolidated Stats header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-8 bg-[var(--panel-bg)]/80 backdrop-blur-xl border border-[var(--border-color)] rounded-[2.5rem] shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Network Integrated Logistics Hub</span>
          </div>
          <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Travel & Cabs Suite</h1>
          <p className="text-xs text-[var(--text-secondary)] font-medium opacity-70">Seamless coordination between Air, Rail, and local Ground dispatches across India.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-[var(--bg-color)]/50 px-5 py-3.5 rounded-2xl border border-[var(--border-color)]/60 text-center min-w-[110px]">
            <span className="block text-[8px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-50 mb-0.5">Air Network</span>
            <span className="text-lg font-black text-blue-500">{INDIAN_HUBS.length} HUBS</span>
          </div>
          <div className="bg-[var(--bg-color)]/50 px-5 py-3.5 rounded-2xl border border-[var(--border-color)]/60 text-center min-w-[110px]">
            <span className="block text-[8px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-50 mb-0.5">Cab Pending</span>
            <span className="text-lg font-black text-amber-500">{cabCounts.Pending + cabCounts.Scheduled} rides</span>
          </div>
          <div className="bg-[var(--bg-color)]/50 px-5 py-3.5 rounded-2xl border border-[var(--border-color)]/60 text-center min-w-[110px]">
            <span className="block text-[8px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-50 mb-0.5">Integrations</span>
            <span className="text-xs font-black text-[var(--text-primary)] block py-1 uppercase bg-emerald-500/10 text-emerald-500 rounded-md mt-0.5">5 GATEWAYS</span>
          </div>
        </div>
      </div>

      {/* Main Dual-Pane Dashboard Columns Grid with High-Fidelity Enterprise Framing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ================= PANE 1: Air & Rail Logistics (Left Side 7 cols on XL/LG) ================= */}
        <div className="lg:col-span-7 bg-[var(--panel-bg)]/80 backdrop-blur-xl border border-[var(--border-color)] rounded-[2.5rem] p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--border-color)]/40 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-500 flex items-center justify-center">
                <Plane className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider">Air & Rail Navigation</h3>
                <p className="text-[10px] text-[var(--text-secondary)] opacity-60 leading-none mt-0.5 font-bold">Multi-Portal Sync Engine</p>
              </div>
            </div>

            {/* Toggle Switch */}
            <div className="bg-[var(--bg-color)]/80 border border-[var(--border-color)] p-1 rounded-xl flex gap-1 items-center">
              <button
                type="button"
                onClick={() => handleTravelTypeChange('flight')}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5",
                  activeType === 'flight' ? "bg-blue-600 text-white shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                )}
              >
                <Plane size={11} /> Flights
              </button>
              <button
                type="button"
                onClick={() => handleTravelTypeChange('train')}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5",
                  activeType === 'train' ? "bg-blue-600 text-white shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                )}
              >
                <Train size={11} /> Trains
              </button>
            </div>
          </div>

          {/* Interactive OpenStreetMap underlay */}
          <MapView />

          {/* Booking Inputs */}
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-9 gap-4 items-end">
              
              {/* Origin input */}
              <div className="md:col-span-4 relative">
                <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-1.5 px-3 opacity-50">Departure Node</label>
                <div className="relative">
                  <MapPin className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]", travelFormData.from ? "text-blue-500 opacity-100" : "opacity-30")} />
                  <input
                    type="text"
                    value={travelFormData.from}
                    onChange={e => handleTravelInputChange('from', e.target.value)}
                    placeholder={activeType === 'flight' ? 'e.g. DEL, BOM, Delhi...' : 'e.g. NDLS, HWH, Delhi...'}
                    className="w-full bg-[var(--bg-color)]/60 border border-[var(--border-color)] rounded-xl py-3 pl-10 pr-4 text-xs font-bold outline-none focus:border-blue-500/50 focus:bg-[var(--panel-bg)]/80 transition-all text-[var(--text-primary)]"
                  />
                  
                  {/* Suggestions Dropdown */}
                  <AnimatePresence>
                    {activeTravelInput === 'from' && travelSuggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute left-0 right-0 mt-1 bg-[var(--panel-bg)]/95 border border-[var(--border-color)] rounded-xl shadow-xl z-50 overflow-hidden backdrop-blur-xl"
                      >
                        {travelSuggestions.map(s => (
                          <button
                            key={s.code}
                            type="button"
                            onClick={() => {
                              setTravelFormData(prev => ({ ...prev, from: s.code }));
                              setTravelSuggestions([]);
                              setActiveTravelInput(null);
                            }}
                            className="w-full px-4 py-2.5 text-left hover:bg-blue-500/10 border-b border-[var(--border-color)]/20 last:border-0 flex items-center justify-between group"
                          >
                            <div className="max-w-[70%] truncate">
                              <p className="text-xs font-bold text-[var(--text-primary)]">{s.city}</p>
                              <p className="text-[8px] text-[var(--text-secondary)] truncate opacity-50 font-bold">{s.name}</p>
                            </div>
                            <span className="text-[8px] font-mono font-black px-1.5 py-0.5 rounded bg-[var(--bg-color)] border border-[var(--border-color)] group-hover:bg-blue-500 group-hover:text-white transition-colors">{s.code}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Swap Button */}
              <div className="md:col-span-1 flex justify-center pb-1">
                <button
                  type="button"
                  onClick={swapStations}
                  className="w-9 h-9 rounded-lg bg-[var(--bg-color)]/80 border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] hover:text-blue-500 transition-colors cursor-pointer hover:border-blue-500/30"
                >
                  <ArrowRightLeft className="w-4 h-4 rotate-90 md:rotate-0" />
                </button>
              </div>

              {/* Destination input */}
              <div className="md:col-span-4 relative">
                <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-1.5 px-3 opacity-50">Arrival Target</label>
                <div className="relative">
                  <Search className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]", travelFormData.to ? "text-blue-500 opacity-100" : "opacity-30")} />
                  <input
                    type="text"
                    value={travelFormData.to}
                    onChange={e => handleTravelInputChange('to', e.target.value)}
                    placeholder={activeType === 'flight' ? 'e.g. BLR, MAA, Bangalore...' : 'e.g. SBC, MAS, Bangalore...'}
                    className="w-full bg-[var(--bg-color)]/60 border border-[var(--border-color)] rounded-xl py-3 pl-10 pr-4 text-xs font-bold outline-none focus:border-blue-500/50 focus:bg-[var(--panel-bg)]/80 transition-all text-[var(--text-primary)]"
                  />

                  {/* Suggestions dropdown */}
                  <AnimatePresence>
                    {activeTravelInput === 'to' && travelSuggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute left-0 right-0 mt-1 bg-[var(--panel-bg)]/95 border border-[var(--border-color)] rounded-xl shadow-xl z-50 overflow-hidden backdrop-blur-xl"
                      >
                        {travelSuggestions.map(s => (
                          <button
                            key={s.code}
                            type="button"
                            onClick={() => {
                              setTravelFormData(prev => ({ ...prev, to: s.code }));
                              setTravelSuggestions([]);
                              setActiveTravelInput(null);
                            }}
                            className="w-full px-4 py-2.5 text-left hover:bg-blue-500/10 border-b border-[var(--border-color)]/20 last:border-0 flex items-center justify-between group"
                          >
                            <div className="max-w-[70%] truncate">
                              <p className="text-xs font-bold text-[var(--text-primary)]">{s.city}</p>
                              <p className="text-[8px] text-[var(--text-secondary)] truncate opacity-50 font-bold">{s.name}</p>
                            </div>
                            <span className="text-[8px] font-mono font-black px-1.5 py-0.5 rounded bg-[var(--bg-color)] border border-[var(--border-color)] group-hover:bg-blue-500 group-hover:text-white transition-colors">{s.code}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date */}
              <div>
                <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-1.5 px-3 opacity-50">Departure Schedule</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] opacity-35" />
                  <input
                    type="date"
                    value={travelFormData.date}
                    onChange={e => setTravelFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-[var(--bg-color)]/60 border border-[var(--border-color)] rounded-xl py-3 pl-11 pr-4 text-xs font-bold outline-none text-[var(--text-primary)] focus:bg-[var(--panel-bg)]/80 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Passengers dropdown */}
              <div>
                <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-1.5 px-3 opacity-50">Passengers Count</label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] opacity-35" />
                  <select
                    value={travelFormData.passengers}
                    onChange={e => setTravelFormData(prev => ({ ...prev, passengers: e.target.value }))}
                    className="w-full bg-[var(--bg-color)]/60 border border-[var(--border-color)] rounded-xl py-3 pl-11 pr-4 text-xs font-bold outline-none text-[var(--text-primary)] focus:bg-[var(--panel-bg)]/80 transition-all cursor-pointer appearance-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(num => (
                      <option key={num} value={num.toString()} className="bg-[var(--bg-color)] text-[var(--text-primary)] font-bold">
                        {num} {num === 1 ? 'Passenger' : 'Passengers'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--border-color)]/30">
            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-40 flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Auto Redirect Portals Enabled
            </span>
            <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
              {activeType === 'flight' && (
                <button
                  onClick={handleCheckAvailability}
                  disabled={!travelFormData.from || !travelFormData.to || flightOffersLoading}
                  className="w-full md:w-auto bg-[var(--bg-color)] border border-blue-500/30 hover:border-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-blue-500 px-6 py-4 rounded-xl font-bold uppercase text-[10px] tracking-[0.15em] flex items-center justify-center gap-2 active:scale-95 transition-all text-center cursor-pointer"
                >
                  {flightOffersLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  Check Availability
                </button>
              )}
              <button
                onClick={handleSmartSearch}
                disabled={!travelFormData.from || !travelFormData.to}
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl font-bold uppercase text-[10px] tracking-[0.15em] flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 active:scale-95 transition-all text-center cursor-pointer"
              >
                Start Search Logistics <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Live Flight Offers (Travelpayouts flight search API) */}
          {activeType === 'flight' && (flightOffersLoading || flightOffersError || flightOffers) && (
            <div className="space-y-3 pt-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-60">Live Flight Offers</h4>
              {flightOffersLoading ? (
                <div className="text-center py-8 text-[10px] text-[var(--text-secondary)] opacity-50 font-mono uppercase tracking-widest">Fetching real-time offers...</div>
              ) : flightOffersError ? (
                <p className="text-[10px] text-rose-500 font-bold">{flightOffersError}</p>
              ) : flightOffers && flightOffers.length === 0 ? (
                <p className="text-[10px] text-[var(--text-secondary)] opacity-50 font-mono uppercase tracking-widest text-center py-4">No offers found for this route/date</p>
              ) : (
                <div className="space-y-2 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
                  {flightOffers?.map(offer => (
                    <div key={offer.id} className="bg-[var(--bg-color)]/60 border border-[var(--border-color)] rounded-xl p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        {offer.segments.map((seg, i) => (
                          <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-primary)]">
                            <span className="font-mono px-1.5 py-0.5 rounded bg-[var(--panel-bg)] border border-[var(--border-color)]">{seg.flightNumber}</span>
                            <span>{seg.departureAirport} {new Date(seg.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <ArrowRightLeft className="w-3 h-3 opacity-40" />
                            <span>{seg.arrivalAirport} {new Date(seg.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        ))}
                        <p className="text-[8px] text-[var(--text-secondary)] opacity-60 mt-1">
                          {offer.agency}
                          {offer.seatsAvailable !== null && ` • ${offer.seatsAvailable} seats left at this fare`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-black text-[var(--text-primary)]">{offer.currency} {offer.price}</span>
                        <button
                          onClick={() => handleBookOffer(offer)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all active:scale-95"
                        >
                          Book
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Partner widgets */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { title: 'MakeMyTrip Portal', desc: 'Secure flights & hotels' },
              { title: 'Goibibo Terminal', desc: 'Fast rail & routes' },
              { title: 'Skyscanner Engine', desc: 'SLA global flight search' }
            ].map((p, idx) => (
              <div key={idx} className="bg-[var(--bg-color)]/40 p-3 rounded-xl border border-[var(--border-color)]/40">
                <span className="block text-[9px] font-black text-[var(--text-primary)] uppercase tracking-wide truncate">{p.title}</span>
                <span className="block text-[8px] text-[var(--text-secondary)] opacity-60 leading-tight mt-0.5">{p.desc}</span>
              </div>
            ))}
          </div>

        </div>

        {/* ================= PANE 2: Grounds Dispatch & Cabs Form (Right Side 5 cols on XL/LG) ================= */}
        <div className="lg:col-span-5 bg-[var(--panel-bg)]/80 backdrop-blur-xl border border-[var(--border-color)] rounded-[2.5rem] p-8 shadow-sm space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 border-b border-[var(--border-color)]/40 pb-5">
              <div className="w-9 h-9 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider">Ground Dispatch Scheduler</h3>
                <p className="text-[10px] text-[var(--text-secondary)] opacity-60 leading-none mt-0.5 font-bold">Uber & Ola Instant Handover</p>
              </div>
            </div>

            {/* Cab form tab selector */}
            <div className="bg-[var(--bg-color)]/80 border border-[var(--border-color)] p-1 rounded-xl flex gap-1 items-center mt-5 mb-5">
              <button
                type="button"
                onClick={() => setCabFormData(prev => ({ ...prev, serviceType: 'Ride' }))}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                  cabFormData.serviceType === 'Ride' ? "bg-[var(--bg-color)] text-blue-600 shadow-sm" : "text-[var(--text-secondary)]"
                )}
              >
                <Car className="w-3.5 h-3.5" /> Classic Ride
              </button>
              <button
                type="button"
                onClick={() => setCabFormData(prev => ({ ...prev, serviceType: 'Delivery' }))}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                  cabFormData.serviceType === 'Delivery' ? "bg-[var(--bg-color)] text-blue-600 shadow-sm" : "text-[var(--text-secondary)]"
                )}
              >
                <Package className="w-3.5 h-3.5" /> Parcel Mail
              </button>
            </div>

            <form onSubmit={handleCabSubmit} className="space-y-4">
              
              {/* Provider switcher */}
              <div>
                <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-1.5 px-3 opacity-50">Select Provider</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Uber', 'Ola'].map(p => {
                    const active = cabFormData.provider === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setCabFormData(prev => ({ ...prev, provider: p as any }))}
                        className={cn(
                          "py-2 px-4 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border",
                          active
                            ? "bg-[var(--text-primary)] text-[var(--bg-color)] border-[var(--text-primary)] shadow-md"
                            : "bg-[var(--bg-color)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-blue-500/25"
                        )}
                      >
                        {p} Logistics
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Passenger name */}
              <div>
                <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-1 px-3 opacity-50">
                  {cabFormData.serviceType === 'Ride' ? 'Passenger Name' : 'Sender/Company Name'}
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] opacity-40 focus-within:opacity-100" />
                  <input
                    required
                    type="text"
                    value={cabFormData.passengerName}
                    onChange={e => setCabFormData(prev => ({ ...prev, passengerName: e.target.value }))}
                    placeholder={cabFormData.serviceType === 'Ride' ? "e.g. John Doe, Sarah" : "e.g. Clove Admin Dept"}
                    className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl py-3 pl-10 pr-4 text-xs font-bold outline-none text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Vehicle type */}
                <div>
                  <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-1 px-3 opacity-50">Vehicle Preference</label>
                  <select
                    value={cabFormData.vehicleType}
                    onChange={e => setCabFormData(prev => ({ ...prev, vehicleType: e.target.value }))}
                    className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl py-3 px-4 text-xs font-bold outline-none text-[var(--text-primary)] cursor-pointer"
                  >
                    <option value="Sedan">Sedan (Executive)</option>
                    <option value="SUV">SUV (Group Base)</option>
                    <option value="Luxury">Luxury (VIP Cabin)</option>
                  </select>
                </div>

                {/* Pickup Date & Time */}
                <div>
                  <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-1 px-3 opacity-50">Dispatch Date</label>
                  <input
                    required
                    type="date"
                    value={cabFormData.date}
                    onChange={e => setCabFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl py-2 px-3 text-xs font-bold outline-none text-[var(--text-primary)] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Pickup Time */}
                <div>
                  <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-1 px-3 opacity-50">Pickup Time</label>
                  <input
                    required
                    type="time"
                    value={cabFormData.time}
                    onChange={e => setCabFormData(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl py-2 px-3 text-xs font-bold outline-none text-[var(--text-primary)] font-mono"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <span className="text-[7px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-40 mb-1 leading-none font-sans px-1">Schedules Auto Backup</span>
                  <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2.5 text-emerald-500">
                    <ShieldCheck size={12} />
                    <span className="text-[8px] tracking-wider uppercase font-black">Sync Engine Live</span>
                  </div>
                </div>
              </div>

              {/* Route elements (Pickup & Drop) */}
              <div className="relative pt-2 space-y-3 pb-2">
                <div className="absolute left-[1.25rem] top-[1.5rem] bottom-6 w-[1.5px] bg-[var(--border-color)] border-dashed border-l" />

                <div className="relative z-10">
                  <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-1 px-5 opacity-50 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Pickup Route Location
                  </label>
                  <div className="relative">
                    <input
                      required
                      type="text"
                      value={cabFormData.pickup}
                      onChange={e => handleCabLocationSearch('pickup', e.target.value)}
                      placeholder="e.g. Airport, Railway Station..."
                      className="w-full bg-[var(--bg-color)] border-2 border-emerald-500/20 rounded-xl py-3 pl-8 pr-4 text-xs font-bold outline-none focus:border-emerald-500/60 text-[var(--text-primary)]"
                    />

                    {/* Autocomplete */}
                    <AnimatePresence>
                      {activeCabInput === 'pickup' && cabSuggestions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute left-0 right-0 mt-1 bg-[var(--panel-bg)] border border-[var(--border-color)] shadow-xl z-50 overflow-hidden rounded-xl"
                        >
                          {cabSuggestions.map(s => (
                            <button
                              key={s.name}
                              type="button"
                              onClick={() => {
                                setCabFormData(prev => ({ ...prev, pickup: s.name }));
                                setCabSuggestions([]);
                                setActiveCabInput(null);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-[var(--bg-color)] border-b border-[var(--border-color)] last:border-0 flex flex-col"
                            >
                              <span className="text-xs font-bold text-[var(--text-primary)]">{s.name}</span>
                              <span className="text-[8px] text-[var(--text-secondary)] font-bold uppercase tracking-tight">{s.area}, Vizag</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="relative z-10">
                  <label className="block text-[8px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-1 px-5 opacity-50 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Destination Drop Target
                  </label>
                  <div className="relative">
                    <input
                      required
                      type="text"
                      value={cabFormData.drop}
                      onChange={e => handleCabLocationSearch('drop', e.target.value)}
                      placeholder="e.g. Jagadamba, RK Beach..."
                      className="w-full bg-[var(--bg-color)] border-2 border-rose-500/20 rounded-xl py-3 pl-8 pr-4 text-xs font-bold outline-none focus:border-rose-500/60 text-[var(--text-primary)]"
                    />

                    {/* Autocomplete */}
                    <AnimatePresence>
                      {activeCabInput === 'drop' && cabSuggestions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute left-0 right-0 mt-1 bg-[var(--panel-bg)] border border-[var(--border-color)] shadow-xl z-50 overflow-hidden rounded-xl"
                        >
                          {cabSuggestions.map(s => (
                            <button
                              key={s.name}
                              type="button"
                              onClick={() => {
                                setCabFormData(prev => ({ ...prev, drop: s.name }));
                                setCabSuggestions([]);
                                setActiveCabInput(null);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-[var(--bg-color)] border-b border-[var(--border-color)] last:border-0 flex flex-col"
                            >
                              <span className="text-xs font-bold text-[var(--text-primary)]">{s.name}</span>
                              <span className="text-[8px] text-[var(--text-secondary)] font-bold uppercase tracking-tight">{s.area}, Vizag</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-500/15 cursor-pointer hover:-translate-y-0.5 transition-all mt-4 active:scale-95"
              >
                Schedule & Open Redirect Dispatcher <Plus size={14} />
              </button>

            </form>
          </div>
        </div>

      </div>

      {/* ================= SECTION 3: Fleet Allocations & Safety Operations Suite ================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Column: Active Fleet Allocations list */}
        <div className="xl:col-span-7 bg-[var(--panel-bg)]/80 backdrop-blur-xl border border-[var(--border-color)] rounded-[2.5rem] p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[var(--border-color)]/30 pb-5">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider">Ground Fleet Logs & Scheduled dispatches</h3>
            <p className="text-xs text-[var(--text-secondary)] opacity-60">Status of scheduled local transit across the regional corporate network</p>
          </div>

          {/* Filters */}
          <div className="flex bg-[var(--bg-color)]/80 border border-[var(--border-color)] p-1 rounded-full items-center">
            {(['All', 'Pending', 'Scheduled', 'Completed'] as const).map(s => {
              const active = filterStatus === s;
              return (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5",
                    active 
                      ? "bg-[var(--bg-color)] text-blue-600 shadow-sm font-black border border-[var(--border-color)]" 
                      : "text-[var(--text-secondary)] hover:text-blue-500"
                  )}
                >
                  {s}
                  <span className={cn(
                    "text-[8px] font-mono px-1.5 py-0.5 rounded-md",
                    active ? "bg-blue-600 text-white" : "bg-[var(--border-color)] text-[var(--text-secondary)]"
                  )}>
                    {cabCounts[s]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cab Journeys List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredCabTrips.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-16 text-center"
              >
                <Car className="w-10 h-10 text-[var(--border-color)] mx-auto mb-3 opacity-40" />
                <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest opacity-40">No matching grounds transit found</p>
              </motion.div>
            ) : (
              filteredCabTrips.map((trip, idx) => (
                <motion.div
                  key={trip.id}
                  layout
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: Math.min(idx * 0.05, 0.4) }}
                  className="group bg-[var(--bg-color)]/40 hover:bg-[var(--panel-bg)]/60 border border-[var(--border-color)] rounded-2xl p-5 hover:border-blue-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  {/* Left segment */}
                  <div className="flex items-center gap-4 min-w-[240px]">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center border transition-all shrink-0",
                      trip.serviceType === 'Delivery' 
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                        : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                    )}>
                      {trip.serviceType === 'Delivery' ? <Package size={18} /> : <User size={18} />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="block text-sm font-black text-[var(--text-primary)] truncate">{trip.passengerName}</span>
                        {(() => {
                          const metric = safetyMetrics[trip.id];
                          if (metric && (!metric.preTripVerified || !metric.speedLimitCompliant)) {
                            return (
                              <span 
                                className={cn(
                                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono font-black uppercase tracking-wider animate-pulse border",
                                  !metric.preTripVerified 
                                    ? "bg-rose-500/10 text-rose-500 border-rose-500/20" 
                                    : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                )}
                                title={!metric.preTripVerified ? "Pre-Trip Check Failed!" : "Speed Telemetry Violation!"}
                              >
                                <AlertCircle size={9} className="text-current" />
                                {!metric.preTripVerified ? "SAFETY FAIL" : "SPEED ALERT"}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[8px] font-black uppercase tracking-wider text-[var(--text-secondary)] opacity-70">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[8px]",
                          trip.status === 'Completed' ? 'bg-emerald-500/15 text-emerald-500' :
                          trip.status === 'Scheduled' ? 'bg-indigo-500/15 text-indigo-500' :
                          'bg-amber-500/15 text-amber-500'
                        )}>
                          {trip.provider} • {trip.status}
                        </span>
                        <span>•</span>
                        <span>{trip.serviceType === 'Delivery' ? 'Express parcel' : trip.vehicleType}</span>
                        {safetyMetrics[trip.id] && (
                          <>
                            <span>•</span>
                            <span className="text-blue-500 font-mono text-[8.5px]">
                              {safetyMetrics[trip.id].driverName} • {safetyMetrics[trip.id].licensePlate}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle Segment: Routes */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-[var(--bg-color)] flex items-center justify-center border border-[var(--border-color)]/60 text-emerald-500 text-[10px] shrink-0 font-bold">A</div>
                      <div>
                        <span className="block text-[8px] font-black uppercase text-[var(--text-secondary)] tracking-wider opacity-50">Origin Pickup</span>
                        <span className="text-xs font-bold text-[var(--text-primary)] line-clamp-1">{trip.pickup}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-[var(--bg-color)] flex items-center justify-center border border-[var(--border-color)]/60 text-rose-500 text-[10px] shrink-0 font-bold">B</div>
                      <div>
                        <span className="block text-[8px] font-black uppercase text-[var(--text-secondary)] tracking-wider opacity-50">Drop Target</span>
                        <span className="text-xs font-bold text-[var(--text-primary)] line-clamp-1">{trip.drop}</span>
                      </div>
                    </div>
                  </div>

                  {/* Date & Time Segment */}
                  <div className="flex items-center gap-3">
                    <div className="bg-[var(--bg-color)] px-3 py-2 rounded-xl border border-[var(--border-color)] text-center font-mono">
                      <span className="text-[9px] font-bold text-[var(--text-primary)] block leading-none">{format(new Date(trip.date), 'dd MMM yyyy')}</span>
                    </div>
                    <div className="bg-blue-600 text-white px-3 py-2 rounded-xl text-center font-mono">
                      <span className="text-[9px] font-black block leading-none">{trip.time}</span>
                    </div>
                  </div>

                  {/* Actions segment */}
                  <div className="flex items-center gap-2 border-t md:border-t-0 border-[var(--border-color)]/30 pt-3 md:pt-0">
                    {trip.status !== 'Completed' && (
                      <button
                        onClick={() => completeCabTrip(trip.id)}
                        className="p-2.5 bg-[var(--bg-color)]/60 border border-[var(--border-color)] hover:border-emerald-500/30 hover:bg-emerald-500/10 text-[var(--text-secondary)] hover:text-emerald-500 rounded-xl transition-all cursor-pointer"
                        title="Mark as completed"
                      >
                        <CheckCircle2 size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteCabTrip(trip.id)}
                      className="p-2.5 bg-[var(--bg-color)]/60 border border-[var(--border-color)] hover:border-rose-500/30 hover:bg-rose-500/10 text-[var(--text-secondary)] hover:text-rose-500 rounded-xl transition-all cursor-pointer"
                      title="Delete record"
                    >
                      <Trash2 size={13} />
                    </button>
                    <button
                      onClick={() => handleLiveCabBook(trip.provider, trip.pickup, trip.drop)}
                      className="flex-1 md:flex-initial bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all shadow shadow-blue-500/10 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      Live Dispatch <ExternalLink size={11} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Column: Driver Compliance & Safety Matrix card */}
      <div className="xl:col-span-5 bg-[var(--panel-bg)]/80 backdrop-blur-xl border border-[var(--border-color)] rounded-[2.5rem] p-8 shadow-sm space-y-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-[var(--border-color)]/30 pb-5 mb-5">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 animate-pulse" /> Driver Compliance & Safety Grid
              </h3>
              <p className="text-xs text-[var(--text-secondary)] opacity-60">Telemetry checks & pre-trip inspections</p>
            </div>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 select-none">
            {Object.keys(safetyMetrics).length === 0 ? (
              <div className="py-12 text-center text-[var(--text-secondary)] opacity-50 text-[10px] font-black uppercase tracking-widest font-mono">
                No active driver nodes loaded
              </div>
            ) : (
              (Object.entries(safetyMetrics) as [string, {
                driverName: string;
                licensePlate: string;
                preTripVerified: boolean;
                speedLimitCompliant: boolean;
                maintenanceValid: boolean;
              }][]).map(([tripId, metrics]) => {
                const hasWarning = !metrics.preTripVerified || !metrics.speedLimitCompliant;
                return (
                  <div 
                    key={tripId} 
                    className={cn(
                      "p-4 rounded-2xl border transition-all duration-300 flex flex-col gap-3.5",
                      hasWarning 
                        ? "bg-rose-500/[0.02] border-rose-500/15 hover:border-rose-500/30 shadow-inner" 
                        : "bg-[var(--bg-color)]/25 border-[var(--border-color)] hover:border-blue-500/25"
                    )}
                  >
                    {/* Log Node Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-mono font-black text-blue-500 block tracking-wider uppercase">
                          NODE: {tripId} • {metrics.licensePlate}
                        </span>
                        <h4 className="text-xs font-black text-[var(--text-primary)] tracking-tight mt-0.5 leading-snug">
                          {metrics.driverName}
                        </h4>
                      </div>
                      
                      {/* Safety Status indicator badge */}
                      <span className={cn(
                        "text-[8px] font-black px-2 py-0.5 rounded font-mono uppercase tracking-wider",
                        hasWarning 
                          ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" 
                          : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      )}>
                        {hasWarning ? "ALERT ⚠️" : "SECURE ✓"}
                      </span>
                    </div>

                    {/* Matrix toggles */}
                    <div className="grid grid-cols-3 gap-2">
                      {/* Toggle Pre-Trip Safety */}
                      <button
                        type="button"
                        onClick={() => toggleSafetyField(tripId, 'preTripVerified')}
                        className={cn(
                          "p-2 rounded-xl border text-[8px] font-black uppercase tracking-wider text-center transition-all duration-200 cursor-pointer flex flex-col items-center gap-1.5 justify-center min-h-[56px]",
                          metrics.preTripVerified 
                            ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10" 
                            : "bg-rose-500/5 text-rose-500 border-rose-500/20 hover:bg-rose-500/10"
                        )}
                        title="Toggle Pre-Trip Checks"
                      >
                        <span className="opacity-60 text-[7px] leading-none">Pre-Trip Checks</span>
                        <span className="font-bold text-[9px] truncate w-full">{metrics.preTripVerified ? "VERIFIED" : "FAIL"}</span>
                      </button>

                      {/* Toggle Speed Limit */}
                      <button
                        type="button"
                        onClick={() => toggleSafetyField(tripId, 'speedLimitCompliant')}
                        className={cn(
                          "p-2 rounded-xl border text-[8px] font-black uppercase tracking-wider text-center transition-all duration-200 cursor-pointer flex flex-col items-center gap-1.5 justify-center min-h-[56px]",
                          metrics.speedLimitCompliant 
                            ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10" 
                            : "bg-amber-500/5 text-amber-500 border-amber-500/20 hover:bg-amber-500/10"
                        )}
                        title="Toggle Speed telemetry"
                      >
                        <span className="opacity-60 text-[7px] leading-none">Speed limit</span>
                        <span className="font-bold text-[9px] truncate w-full">{metrics.speedLimitCompliant ? "COMPLIANT" : "VIOLATION"}</span>
                      </button>

                      {/* Toggle Maintenance record */}
                      <button
                        type="button"
                        onClick={() => toggleSafetyField(tripId, 'maintenanceValid')}
                        className={cn(
                          "p-2 rounded-xl border text-[8px] font-black uppercase tracking-wider text-center transition-all duration-200 cursor-pointer flex flex-col items-center gap-1.5 justify-center min-h-[56px]",
                          metrics.maintenanceValid 
                            ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10" 
                            : "bg-rose-500/5 text-rose-500 border-rose-500/20 hover:bg-rose-500/10"
                        )}
                        title="Toggle Maintenance checks"
                      >
                        <span className="opacity-60 text-[7px] leading-none">Maintenance</span>
                        <span className="font-bold text-[9px] truncate w-full">{metrics.maintenanceValid ? "VALID" : "INVALID"}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Dynamic Warning Notice banner panel */}
        <div className="bg-amber-500/5 border border-amber-500/20 p-4.5 rounded-2xl space-y-2 mt-auto">
          <div className="flex items-center gap-2 text-amber-500">
            <AlertCircle size={15} />
            <h4 className="text-[10px] font-black uppercase tracking-wider">Fleet Safety Warning Protocol</h4>
          </div>
          <p className="text-[9.5px] text-[var(--text-secondary)] opacity-85 leading-normal">
            Enforcing strict compliance with regional transportation speed limits (under 80 km/h) & pre-trip inspections. Unverified vehicles are automatically flagged in the active allocation list with a yellow warning tag.
          </p>
        </div>
      </div>

    </div>

    {/* ================= SECTION 4: Vendor Logistics & Escrow Milestones Dock ================= */}
      <div className="bg-[var(--panel-bg)]/60 backdrop-blur-md border border-[var(--border-color)] rounded-[2.5rem] p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[var(--border-color)]/30 pb-5">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-500" /> Vendor Logistics & Escrow Milestones
            </h3>
            <p className="text-xs text-[var(--text-secondary)] opacity-60">High-density tracking panel for third-party logistics agreements, compliance indexing, and escrow payments.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Vendor */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search vendor parameters..."
                value={vendorSearch}
                onChange={e => setVendorSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 w-48 bg-[var(--bg-color)]/80 border border-[var(--border-color)] rounded-xl text-[11px] outline-none focus:border-indigo-500/50 transition-all font-bold focus:ring-4 focus:ring-indigo-500/10 text-[var(--text-primary)]"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-secondary)] opacity-50" />
            </div>

            {/* Filter */}
            <div className="flex bg-[var(--bg-color)]/80 border border-[var(--border-color)] p-0.5 rounded-xl items-center">
              {(['All', 'Approved', 'Pending'] as const).map(f => {
                const active = vendorFilterStatus === f;
                return (
                  <button
                    key={f}
                    onClick={() => setVendorFilterStatus(f)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
                      active ? "bg-[var(--bg-color)] text-indigo-600 shadow-sm" : "text-[var(--text-secondary)] hover:text-indigo-500"
                    )}
                  >
                    {f}
                  </button>
                );
              })}
            </div>

            {/* Expand mini-form trigger */}
            <button
              onClick={() => setShowAddVendor(!showAddVendor)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1 cursor-pointer active:scale-95"
            >
              {showAddVendor ? <X size={10} /> : <Plus size={10} />} Add Contract
            </button>
          </div>
        </div>

        {/* Expandable New Contract Form Container */}
        <AnimatePresence>
          {showAddVendor && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 'auto', height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden bg-[var(--bg-color)]/35 border border-[var(--border-color)]/60 rounded-2xl p-5"
            >
              <form onSubmit={handleCreateVendor} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="block text-[8px] font-black uppercase tracking-wider text-[var(--text-secondary)] mb-1 opacity-60">Vendor Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Visakha Air-Cargo Sentry"
                    value={newVendorForm.vendorName}
                    onChange={e => setNewVendorForm({ ...newVendorForm, vendorName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl outline-none focus:border-indigo-500/50 transition-all font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-black uppercase tracking-wider text-[var(--text-secondary)] mb-1 opacity-60">Compliance SLA %</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="100"
                    required
                    value={newVendorForm.slaCompliance}
                    onChange={e => setNewVendorForm({ ...newVendorForm, slaCompliance: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl outline-none focus:border-indigo-500/50 transition-all font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-black uppercase tracking-wider text-[var(--text-secondary)] mb-1 opacity-60">Escrow Value Allocated</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ₹5,60,000"
                    value={newVendorForm.escrowAmount}
                    onChange={e => setNewVendorForm({ ...newVendorForm, escrowAmount: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl outline-none focus:border-indigo-500/50 transition-all font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-black uppercase tracking-wider text-[var(--text-secondary)] mb-1 opacity-60">Onboarding Status</label>
                  <select
                    value={newVendorForm.onboarding}
                    onChange={e => setNewVendorForm({ ...newVendorForm, onboarding: e.target.value as any })}
                    className="w-full px-2 py-2 bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
                <div className="md:col-span-1">
                  <label className="block text-[8px] font-black uppercase tracking-wider text-[var(--text-secondary)] mb-1 opacity-60">Invoice Status</label>
                  <select
                    value={newVendorForm.invoiceStatus}
                    onChange={e => setNewVendorForm({ ...newVendorForm, invoiceStatus: e.target.value as any })}
                    className="w-full px-2 py-2 bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="Awaiting Sign-off">Awaiting Sign-off</option>
                    <option value="Escrow Released">Escrow Released</option>
                    <option value="Under Audit">Under Audit</option>
                    <option value="Payment Processed">Payment Processed</option>
                  </select>
                </div>
                <div className="md:col-span-4" />
                <div className="md:col-span-1">
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] py-2.5 rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <Plus size={11} /> Log SLA Contract
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SLA Grid / Content cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vendors
            .filter(v => {
              const matchedSearch = !vendorSearch.trim() || 
                v.vendorName.toLowerCase().includes(vendorSearch.toLowerCase()) ||
                v.id.toLowerCase().includes(vendorSearch.toLowerCase()) ||
                v.invoiceStatus.toLowerCase().includes(vendorSearch.toLowerCase());
              const matchedFilter = vendorFilterStatus === 'All' || v.onboarding === vendorFilterStatus;
              return matchedSearch && matchedFilter;
            })
            .map((v) => {
              // SLA compliance visual ranges helper
              const slaColor = v.slaCompliance >= 95 
                ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' 
                : v.slaCompliance >= 90 
                  ? 'text-indigo-500 border-indigo-500/20 bg-indigo-500/10' 
                  : 'text-rose-500 border-rose-500/20 bg-rose-500/5';

              return (
                <div 
                  key={v.id} 
                  className="group bg-[var(--bg-color)]/30 hover:bg-[var(--panel-bg)]/50 border border-[var(--border-color)]/70 hover:border-indigo-500/30 rounded-2xl p-5 shadow-sm transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Header line */}
                    <div className="flex justify-between items-start gap-3 border-b border-[var(--border-color)]/20 pb-3 mb-3.5">
                      <div>
                        <span className="text-[8px] font-mono font-black text-indigo-500 block tracking-wider uppercase">{v.id}</span>
                        <h4 className="text-xs font-black text-[var(--text-primary)] mt-1 tracking-tight leading-snug">{v.vendorName}</h4>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {v.onboarding === 'Approved' ? (
                          <span 
                            onClick={() => updateVendorOnboarding(v.id, 'Pending')}
                            className="text-[8px] font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 px-2 py-0.5 rounded-md cursor-pointer transition-colors hover:bg-rose-500 hover:text-white hover:border-rose-500"
                            title="Click to toggle status"
                          >
                            Approved
                          </span>
                        ) : (
                          <span 
                            onClick={() => updateVendorOnboarding(v.id, 'Approved')}
                            className="text-[8px] font-black uppercase tracking-wider bg-amber-500/10 border border-amber-500/25 text-amber-500 px-2 py-0.5 rounded-md cursor-pointer transition-colors hover:bg-emerald-500 hover:text-white hover:border-emerald-500"
                            title="Click to toggle status"
                          >
                            Pending
                          </span>
                        )}
                        <button
                          onClick={() => deleteVendor(v.id)}
                          className="p-1 hover:bg-rose-500/10 hover:text-rose-500 text-[var(--text-secondary)] rounded-md transition-all cursor-pointer"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>

                    {/* Matrix Row */}
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                      {/* SLA */}
                      <div className="bg-[var(--bg-color)]/50 p-2.5 rounded-xl border border-[var(--border-color)]/30">
                        <span className="block text-[7px] font-black uppercase text-[var(--text-secondary)] opacity-50 tracking-wider mb-1">SLA Variance</span>
                        <span className={cn("font-mono font-black py-0.5 px-1.5 rounded-md text-xs inline-block", slaColor)}>
                          {v.slaCompliance.toFixed(1)}%
                        </span>
                      </div>
                      
                      {/* Escrow balance */}
                      <div className="bg-[var(--bg-color)]/50 p-2.5 rounded-xl border border-[var(--border-color)]/30">
                        <span className="block text-[7px] font-black uppercase text-[var(--text-secondary)] opacity-50 tracking-wider mb-1">Escrow Fund</span>
                        <span className="font-mono font-bold text-[var(--text-primary)] text-xs block truncate mt-0.5">
                          {v.escrowAmount}
                        </span>
                      </div>

                      {/* Invoice Status Badge */}
                      <div className="bg-[var(--bg-color)]/50 p-2.5 rounded-xl border border-[var(--border-color)]/30 flex flex-col justify-between">
                        <span className="block text-[7px] font-black uppercase text-[var(--text-secondary)] opacity-50 tracking-wider mb-1">Invoice State</span>
                        <span className={cn(
                          "px-1 py-0.5 rounded text-[8px] font-bold block truncate",
                          v.invoiceStatus === 'Escrow Released' ? 'bg-emerald-500/15 text-emerald-500' :
                          v.invoiceStatus === 'Payment Processed' ? 'bg-indigo-500/15 text-indigo-500' :
                          v.invoiceStatus === 'Under Audit' ? 'bg-rose-500/15 text-rose-500' :
                          'bg-amber-500/15 text-amber-500'
                        )}>
                          {v.invoiceStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions drawer inside vendor card */}
                  <div className="mt-4 pt-3 border-t border-[var(--border-color)]/10 flex items-center justify-between text-[8px] font-bold text-[var(--text-secondary)]">
                    <span className="font-mono opacity-50">Last Audit: {v.updatedAt}</span>
                    <div className="flex gap-1 items-center">
                      {v.invoiceStatus !== 'Escrow Released' && v.invoiceStatus !== 'Payment Processed' ? (
                        <button
                          onClick={() => updateVendorInvoiceStatus(v.id, 'Escrow Released')}
                          className="px-2 py-1 bg-[var(--bg-color)] border border-[var(--border-color)] hover:border-emerald-500/30 hover:bg-emerald-500/5 text-emerald-600 rounded-lg cursor-pointer transition-colors"
                        >
                          Release Escrow
                        </button>
                      ) : (
                        <span className="px-2 py-1 bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded-lg opacity-40">
                          Released ✓
                        </span>
                      )}
                      
                      <select
                        value={v.invoiceStatus}
                        onChange={e => updateVendorInvoiceStatus(v.id, e.target.value as any)}
                        className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg px-1 py-0.5 outline-none cursor-pointer"
                      >
                        <option value="Awaiting Sign-off">Awaiting</option>
                        <option value="Escrow Released">Released</option>
                        <option value="Under Audit">Audit</option>
                        <option value="Payment Processed">Processed</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}

          {vendors.filter(v => {
            const matchedSearch = !vendorSearch.trim() || 
              v.vendorName.toLowerCase().includes(vendorSearch.toLowerCase()) ||
              v.id.toLowerCase().includes(vendorSearch.toLowerCase()) ||
              v.invoiceStatus.toLowerCase().includes(vendorSearch.toLowerCase());
            const matchedFilter = vendorFilterStatus === 'All' || v.onboarding === vendorFilterStatus;
            return matchedSearch && matchedFilter;
          }).length === 0 && (
            <div className="col-span-2 py-12 text-center text-[var(--text-secondary)] opacity-50 text-[10px] font-black uppercase tracking-wide">
              No registered vendor contracts matched the state queries.
            </div>
          )}
        </div>
      </div>

      {/* Pop-up Warning Toast */}
      <AnimatePresence>
        {showPopupWarning && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-10 left-1/2 z-[100] w-full max-w-sm"
          >
            <div className="mx-4 bg-rose-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-rose-500">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-tight">Pop-up Blocker Active</p>
                <p className="text-[9px] opacity-90 font-medium">Please authorize pop-ups to trigger all portal queries simultaneously.</p>
              </div>
              <button 
                onClick={() => setShowPopupWarning(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cab Dispatch Handover Notification Toast */}
      <AnimatePresence>
        {cabNotification.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: 20, scale: 0.95, x: '-50%' }}
            className="fixed bottom-12 left-1/2 z-[100] w-full max-w-sm px-4"
          >
            <div className="bg-[var(--panel-bg)]/90 border border-[var(--border-color)] rounded-2xl p-4 shadow-xl backdrop-blur-2xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 relative overflow-hidden">
                <Car className="w-5 h-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <span className="block text-[var(--text-primary)] font-black text-xs tracking-tight uppercase leading-none mb-1">{cabNotification.provider} Handover</span>
                <span className="text-[8px] font-mono text-blue-400 tracking-wider uppercase">{cabNotification.status}</span>
              </div>

              <CheckCircle2 className={cn(
                "w-5 h-5 transition-colors duration-300",
                cabNotification.status === 'Handover Complete' ? "text-emerald-500" : "text-white/10"
              )} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
