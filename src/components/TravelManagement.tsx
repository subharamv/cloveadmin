import React, { useState } from 'react';
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
  Map as MapIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps';

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

export function TravelManagement() {
  const [activeType, setActiveType] = useState<'flight' | 'train'>('flight');
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    passengers: '1'
  });
  const [suggestions, setSuggestions] = useState<typeof INDIAN_HUBS>([]);
  const [activeInput, setActiveInput] = useState<'from' | 'to' | null>(null);
  const [showPopupWarning, setShowPopupWarning] = useState(false);
  const [selectedHub, setSelectedHub] = useState<typeof INDIAN_HUBS[0] | null>(null);

  const handleInputChange = (field: 'from' | 'to', value: string) => {
    setFormData({ ...formData, [field]: value });
    if (value.length > 0) {
      const filtered = INDIAN_HUBS.filter(h => 
        h.city.toLowerCase().includes(value.toLowerCase()) || 
        h.code.toLowerCase().includes(value.toLowerCase()) ||
        h.name.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
      setActiveInput(field);
    } else {
      setSuggestions([]);
      setActiveInput(null);
    }
  };

  const handleSmartSearch = () => {
    const { from, to, date, passengers } = formData;
    if (!from || !to) return;

    const urls = activeType === 'flight' ? [
      `https://www.makemytrip.com/flight/search?itinerary=${from}-${to}-${format(new Date(date), 'dd/MM/yyyy')}&paxType=A-${passengers}_C-0_I-0&tripType=O&cabinClass=E`,
      `https://www.goibibo.com/flights/air-${from}-${to}-${format(new Date(date), 'yyyyMMdd')}--${passengers}-0-0-E-D/`,
      `https://www.skyscanner.co.in/transport/flights/${from.toLowerCase()}/${to.toLowerCase()}/${format(new Date(date), 'yyMMdd')}/?adults=${passengers}`
    ] : [
      `https://www.makemytrip.com/railways/listing?fromCity=${from}&toCity=${to}&date=${format(new Date(date), 'yyyyMMdd')}`,
      `https://www.goibibo.com/trains/check-train-between-stations/${from}/${to}/${format(new Date(date), 'yyyyMMdd')}/`,
      `https://www.confirmtkt.com/train-running-status/${from}-to-${to}?date=${format(new Date(date), 'dd-MM-yyyy')}`
    ];

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

  const swapStations = () => {
    setFormData({ ...formData, from: formData.to, to: formData.from });
  };

const MapView = () => {
    const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
    const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

    if (!hasValidKey) {
      return (
        <div className="h-[400px] w-full bg-[var(--bg-color)] rounded-[2.5rem] flex items-center justify-center border border-[var(--border-color)] shadow-2xl transition-colors duration-300 p-8 text-center">
          <div className="max-w-md">
            <h3 className="text-xl font-black text-[var(--text-primary)] mb-4 uppercase tracking-tighter">Google Maps API Key Required</h3>
            <p className="text-xs text-[var(--text-secondary)] font-medium mb-6 leading-relaxed">
              To activate the Network Topology Interface, please add your Google Maps API Key in the <strong>Secrets</strong> panel (Settings ⚙️ → Secrets) under the name <code>GOOGLE_MAPS_PLATFORM_KEY</code>.
            </p>
            <a 
              href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
            >
              Get API Key
            </a>
          </div>
        </div>
      );
    }

    return (
      <div className="h-[400px] w-full bg-[var(--bg-color)] rounded-[2.5rem] relative overflow-hidden border border-[var(--border-color)] shadow-2xl transition-colors duration-300">
        <APIProvider apiKey={API_KEY}>
          <Map
            defaultCenter={{ lat: 20.5937, lng: 78.9629 }}
            defaultZoom={4.5}
            gestureHandling="greedy"
            disableDefaultUI={true}
            mapId="travel_hubs_map"
            style={{ width: '100%', height: '100%' }}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          >
          {INDIAN_HUBS.map(hub => (
            <Marker 
              key={hub.code}
              position={{ lat: hub.lat, lng: hub.lng }}
              onClick={() => setSelectedHub(hub)}
            />
          ))}

          {selectedHub && (
            <InfoWindow 
              position={{ lat: selectedHub.lat, lng: selectedHub.lng }}
              onCloseClick={() => setSelectedHub(null)}
            >
              <div className="p-2 min-w-[150px] bg-[var(--panel-bg)] backdrop-blur-md">
                <h4 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest">{selectedHub.city}</h4>
                <p className="text-[10px] text-[var(--text-secondary)] font-bold mb-2 opacity-60">{selectedHub.name}</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setFormData({ ...formData, from: selectedHub.code });
                      setSelectedHub(null);
                    }}
                    className="flex-1 bg-blue-600 text-white text-[9px] font-black uppercase py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    From
                  </button>
                  <button 
                    onClick={() => {
                      setFormData({ ...formData, to: selectedHub.code });
                      setSelectedHub(null);
                    }}
                    className="flex-1 bg-[var(--text-primary)] text-[var(--bg-color)] text-[9px] font-black uppercase py-1.5 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    To
                  </button>
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
      <div className="absolute top-6 left-6 z-10 flex items-center gap-3 bg-[var(--panel-bg)] backdrop-blur-md px-4 py-2 rounded-xl border border-[var(--border-color)]">
        <MapIcon className="w-4 h-4 text-blue-500" />
        <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest opacity-80">Network_Topology_Interface</span>
      </div>
    </div>
  );
};

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-1 bg-blue-600 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Travel_Logistics_Center</span>
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">Expedite Your Journey</h1>
          <p className="text-[var(--text-secondary)] font-medium mt-2 opacity-70">Smart multi-portal booking for Flights and Trains across the Indian subcontinent.</p>
        </div>

        <div className="bg-[var(--panel-bg)] p-1.5 rounded-2xl flex gap-1 border border-[var(--border-color)]">
          <button 
            onClick={() => setActiveType('flight')}
            className={cn(
              "px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2",
              activeType === 'flight' ? "bg-blue-600 text-white shadow-lg" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] opacity-60 hover:opacity-100"
            )}
          >
            <Plane className="w-4 h-4" /> Flights
          </button>
          <button 
            onClick={() => setActiveType('train')}
            className={cn(
              "px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2",
              activeType === 'train' ? "bg-blue-600 text-white shadow-lg" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] opacity-60 hover:opacity-100"
            )}
          >
            <Train className="w-4 h-4" /> Trains
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Map Integration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <MapView />
        </motion.div>

        {/* Search Card */}
        <motion.div 
          layout
          className="bg-[var(--panel-bg)] border-[var(--border-color)] border-2 rounded-[3rem] p-10 shadow-2xl transition-all duration-500 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none dark:opacity-10">
            {activeType === 'flight' ? <Plane className="w-64 h-64 -rotate-12 text-blue-500" /> : <Train className="w-64 h-64 rotate-12 text-blue-500" />}
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            {/* Origin */}
            <div className="lg:col-span-4 relative group">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-2 px-6 opacity-40">Departure Node</label>
              <div className="relative">
                <MapPin className={cn("absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors", formData.from ? "text-blue-500" : "text-[var(--text-secondary)] opacity-30")} />
                <input 
                  type="text"
                  value={formData.from}
                  onChange={e => handleInputChange('from', e.target.value)}
                  placeholder="DEL, BOM, Delhi..."
                  className="w-full bg-[var(--bg-color)] border-2 border-[var(--border-color)] rounded-3xl py-5 pl-14 pr-6 text-sm font-bold placeholder:opacity-20 outline-none focus:border-blue-500/50 focus:bg-[var(--panel-bg)] transition-all text-[var(--text-primary)]"
                />
                <AnimatePresence>
                  {activeInput === 'from' && suggestions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl"
                    >
                      {suggestions.map(s => (
                        <button 
                          key={s.code}
                          onClick={() => {
                            setFormData({ ...formData, from: s.code });
                            setSuggestions([]);
                            setActiveInput(null);
                          }}
                          className="w-full p-4 text-left hover:bg-blue-500/5 border-b border-[var(--border-color)] last:border-0 flex items-center justify-between group"
                        >
                          <div>
                            <p className="text-sm font-bold text-[var(--text-primary)]">{s.city}</p>
                            <p className="text-[10px] text-[var(--text-secondary)] font-medium uppercase tracking-tighter opacity-60">{s.name}</p>
                          </div>
                          <span className="bg-[var(--bg-color)] px-2 py-1 rounded text-[10px] font-mono group-hover:bg-blue-500 group-hover:text-white transition-all border border-[var(--border-color)] text-[var(--text-secondary)]">{s.code}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Swap Button */}
            <div className="lg:col-span-1 flex justify-center pb-2">
              <button 
                onClick={swapStations}
                className="w-12 h-12 bg-[var(--bg-color)] border-2 border-[var(--border-color)] rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:text-blue-500 hover:border-blue-500 hover:shadow-lg transition-all opacity-40 hover:opacity-100"
              >
                <ArrowRightLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Destination */}
            <div className="lg:col-span-4 relative group">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-2 px-6 opacity-40">Arrival Target</label>
              <div className="relative">
                <Search className={cn("absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors", formData.to ? "text-blue-600" : "text-[var(--text-secondary)] opacity-30")} />
                <input 
                  type="text"
                  value={formData.to}
                  onChange={e => handleInputChange('to', e.target.value)}
                  placeholder="BLR, MAA, Bangalore..."
                  className="w-full bg-[var(--bg-color)] border-2 border-[var(--border-color)] rounded-3xl py-5 pl-14 pr-6 text-sm font-bold placeholder:opacity-20 outline-none focus:border-blue-500/50 focus:bg-[var(--panel-bg)] transition-all text-[var(--text-primary)]"
                />
                <AnimatePresence>
                  {activeInput === 'to' && suggestions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl"
                    >
                      {suggestions.map(s => (
                        <button 
                          key={s.code}
                          onClick={() => {
                            setFormData({ ...formData, to: s.code });
                            setSuggestions([]);
                            setActiveInput(null);
                          }}
                          className="w-full p-4 text-left hover:bg-blue-500/5 border-b border-[var(--border-color)] last:border-0 flex items-center justify-between group"
                        >
                          <div>
                            <p className="text-sm font-bold text-[var(--text-primary)]">{s.city}</p>
                            <p className="text-[10px] text-[var(--text-secondary)] font-medium uppercase tracking-tighter opacity-60">{s.name}</p>
                          </div>
                          <span className="bg-[var(--bg-color)] px-2 py-1 rounded text-[10px] font-mono group-hover:bg-blue-500 group-hover:text-white transition-all border border-[var(--border-color)] text-[var(--text-secondary)]">{s.code}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Date */}
            <div className="lg:col-span-3 relative group">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-2 px-6 opacity-40">Departure Schedule</label>
              <div className="relative">
                <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)] opacity-30" />
                <input 
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-[var(--bg-color)] border-2 border-[var(--border-color)] rounded-3xl py-5 pl-14 pr-6 text-sm font-bold outline-none focus:border-blue-500/50 focus:bg-[var(--panel-bg)] transition-all text-[var(--text-primary)]"
                />
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-6 pt-10 border-t border-[var(--border-color)]">
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[var(--text-secondary)] opacity-40" />
                <select 
                  value={formData.passengers}
                  onChange={e => setFormData({ ...formData, passengers: e.target.value })}
                  className="bg-transparent text-sm font-bold uppercase tracking-widest outline-none cursor-pointer text-[var(--text-primary)]"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <option key={num} value={num.toString()} className="bg-[var(--bg-color)]">
                      {num} {num === 1 ? 'Passenger' : 'Passengers'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="h-6 w-px bg-[var(--border-color)] hidden md:block" />
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-30">
                <Search className="w-3.5 h-3.5" /> Intelligence Driven Search Enabled
              </div>
            </div>

            <button 
              onClick={handleSmartSearch}
              className="w-full md:w-auto bg-blue-600 text-white px-10 py-5 rounded-[2rem] font-bold uppercase text-xs tracking-[0.2em] shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
            >
              Initialize Smart Search <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[var(--panel-bg)] p-8 rounded-[2.5rem] border border-[var(--border-color)] group hover:border-blue-500/30 transition-all shadow-sm">
            <h4 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest mb-4">MakeMyTrip Core</h4>
            <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed opacity-60">Integrated API access for premium lodging and rapid flight transit across Tier 1 Indian cities.</p>
          </div>
          <div className="bg-[var(--panel-bg)] p-8 rounded-[2.5rem] border border-[var(--border-color)] group hover:border-blue-500/30 transition-all shadow-sm">
            <h4 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest mb-4">Goibibo Gateway</h4>
            <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed opacity-60">High-velocity booking protocol optimized for rail network status and budget-aligned flight logistics.</p>
          </div>
          <div className="bg-[var(--panel-bg)] p-8 rounded-[2.5rem] border border-[var(--border-color)] group hover:border-blue-500/30 transition-all shadow-sm">
            <h4 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest mb-4">Skyscanner Intel</h4>
            <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed opacity-60">Global meta-search synchronization ensuring absolute price parity across all commercial carriers.</p>
          </div>
        </div>
      </div>

      {/* Pop-up Warning Toast */}
      <AnimatePresence>
        {showPopupWarning && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-10 left-1/2 z-[100] w-full max-w-md"
          >
            <div className="mx-4 bg-rose-600 text-white p-5 rounded-[2rem] shadow-2xl flex items-center gap-4 border border-rose-500">
              <div className="p-3 bg-white/20 rounded-2xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold uppercase tracking-tight">Pop-up Blocker Detected</p>
                <p className="text-[10px] opacity-80 font-medium">Please allow pop-ups for this site to open all search portals simultaneously.</p>
              </div>
              <button 
                onClick={() => setShowPopupWarning(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
