import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  Car, 
  Plus, 
  User, 
  MapPin, 
  Calendar, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Navigation,
  MoreVertical,
  LayoutDashboard,
  Package,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

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

export function CabManagement({ searchTerm = '' }: { searchTerm?: string }) {
  const [trips, setTrips] = useState<CabTrip[]>([]);
  const [formData, setFormData] = useState({
    passengerName: '',
    vehicleType: 'Sedan',
    serviceType: 'Ride' as 'Ride' | 'Delivery',
    provider: 'Uber' as 'Uber' | 'Ola',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
    pickup: '',
    drop: ''
  });

  const [suggestions, setSuggestions] = useState<typeof VIZAG_LANDMARKS>([]);
  const [activeInput, setActiveInput] = useState<'pickup' | 'drop' | null>(null);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Completed' | 'Scheduled'>('All');

  const handleLocationSearch = (field: 'pickup' | 'drop', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (value.length > 0) {
      const filtered = VIZAG_LANDMARKS.filter(l => 
        l.name.toLowerCase().includes(value.toLowerCase()) || 
        l.area.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
      setActiveInput(field);
    } else {
      setSuggestions([]);
      setActiveInput(null);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'cabTrips'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTrips(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CabTrip)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'cabTrips'));
    return () => unsubscribe();
  }, []);

  const [notification, setNotification] = useState<{
    show: boolean;
    provider: 'Uber' | 'Ola';
    status: string;
  }>({ show: false, provider: 'Uber', status: '' });

  const handleLiveBook = (provider: 'Uber' | 'Ola', pickup: string, drop: string) => {
    const citySuffix = ", Visakhapatnam, Andhra Pradesh, India";
    const encodedPickup = encodeURIComponent(pickup + citySuffix);
    const encodedDrop = encodeURIComponent(drop + citySuffix);

    setNotification({ show: true, provider, status: 'Initiating Relay...' });
    
    setTimeout(() => {
      if (provider === 'Uber') {
        const uberUrl = `https://m.uber.com/ul/?action=setPickup&pickup[formatted_address]=${encodedPickup}&dropoff[formatted_address]=${encodedDrop}`;
        window.open(uberUrl, '_blank');
      } else {
        const olaUrl = `https://www.olacabs.com/mobile/search?pickup_name=${encodedPickup}&dropoff_name=${encodedDrop}`;
        window.open(olaUrl, '_blank');
      }
      setNotification(prev => ({ ...prev, status: 'Handover Complete' }));
      setTimeout(() => setNotification({ show: false, provider: 'Uber', status: '' }), 3000);
    }, 1200);
  };

  const completeTrip = async (id: string) => {
    try {
      await updateDoc(doc(db, 'cabTrips', id), {
        status: 'Completed'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `cabTrips/${id}`);
    }
  };

  const deleteTrip = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this trip record?')) return;
    try {
      await deleteDoc(doc(db, 'cabTrips', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `cabTrips/${id}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'cabTrips'), {
        ...formData,
        status: 'Scheduled',
        timestamp: serverTimestamp()
      });
      
      // Auto-trigger live booking on schedule create
      handleLiveBook(formData.provider, formData.pickup, formData.drop);

      setFormData({ 
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

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.passengerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.pickup.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.drop.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'All' || trip.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const counts = {
    All: trips.length,
    Pending: trips.filter(t => t.status === 'Pending').length,
    Completed: trips.filter(t => t.status === 'Completed').length,
    Scheduled: trips.filter(t => t.status === 'Scheduled').length,
  };

  return (
    <div className="min-h-screen bg-[var(--panel-bg)] rounded-[3rem] shadow-2xl border border-[var(--border-color)] overflow-hidden flex flex-col xl:flex-row font-sans transition-colors duration-300">
      {/* Sidebar Form */}
      <div className="w-full xl:w-[400px] bg-[var(--bg-color)] p-10 border-r border-[var(--border-color)] shrink-0 transition-colors duration-300">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Cab Booking</h2>
            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest leading-none opacity-60">Dispatcher_v.2</p>
          </div>
        </div>

        <div className="flex bg-[var(--panel-bg)] p-1.5 rounded-2xl mb-8 border border-[var(--border-color)]">
          <button 
            type="button"
            onClick={() => setFormData({ ...formData, serviceType: 'Ride' })}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              formData.serviceType === 'Ride' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Car className="w-4 h-4" /> Ride
          </button>
          <button 
            type="button"
            onClick={() => setFormData({ ...formData, serviceType: 'Delivery' })}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              formData.serviceType === 'Delivery' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Package className="w-4 h-4" /> Parcel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] px-1 flex items-center gap-2">
              <ShieldCheck className="w-3 h-3 text-blue-500" /> Booking_Provider
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['Uber', 'Ola'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFormData({ ...formData, provider: p })}
                  className={cn(
                    "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all",
                    formData.provider === p 
                      ? "bg-slate-900 text-white border-slate-900 shadow-lg dark:bg-blue-600 dark:border-blue-600" 
                      : "bg-[var(--panel-bg)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-blue-500/30"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] px-1 flex items-center gap-2">
              <User className="w-3 h-3" /> {formData.serviceType === 'Ride' ? 'Passenger_Name' : 'Sender_Name'}
            </label>
            <input
              required
              value={formData.passengerName}
              onChange={e => setFormData({ ...formData, passengerName: e.target.value })}
              className="w-full bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 transition-all text-[var(--text-primary)]"
              placeholder={formData.serviceType === 'Ride' ? "John Doe..." : "Clove Logistics..."}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] px-1 flex items-center gap-2">
              <Car className="w-3 h-3" /> Vehicle_Preference
            </label>
            <select
              value={formData.vehicleType}
              onChange={e => setFormData({ ...formData, vehicleType: e.target.value })}
              className="w-full bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl px-5 py-4 text-sm font-bold outline-none cursor-pointer appearance-none text-[var(--text-primary)]"
            >
              <option value="Sedan">Sedan (Executive)</option>
              <option value="SUV">SUV (Group)</option>
              <option value="Luxury">Luxury (VIP)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Date
              </label>
              <input
                required
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl px-5 py-4 text-sm font-bold outline-none text-[var(--text-primary)]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                <Clock className="w-3 h-3" /> Time
              </label>
              <input
                required
                type="time"
                value={formData.time}
                onChange={e => setFormData({ ...formData, time: e.target.value })}
                className="w-full bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl px-5 py-4 text-sm font-bold outline-none text-[var(--text-primary)]"
              />
            </div>
          </div>

          <div className="space-y-6 pt-4 relative">
             <div className="absolute left-6 top-[3.5rem] bottom-8 w-0.5 bg-slate-200 border-dashed border-l" />
             
             <div className="space-y-2 relative z-10">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                <MapPin className="w-3 h-3 text-emerald-500" /> Pickup_Point
              </label>
              <div className="relative">
                <input
                  required
                  value={formData.pickup}
                  onChange={e => handleLocationSearch('pickup', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-emerald-500/50 transition-all"
                  placeholder="Sector 42 HQ..."
                />
                <AnimatePresence>
                  {activeInput === 'pickup' && suggestions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                      {suggestions.map(s => (
                        <button 
                          key={s.name}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, pickup: s.name });
                            setSuggestions([]);
                            setActiveInput(null);
                          }}
                          className="w-full p-4 text-left hover:bg-slate-50 border-b border-slate-50 last:border-0"
                        >
                          <p className="text-sm font-bold text-slate-700">{s.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{s.area}, Visakhapatnam</p>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="space-y-2 relative z-10">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                <MapPin className="w-3 h-3 text-rose-500" /> Drop_Target
              </label>
              <div className="relative">
                <input
                  required
                  value={formData.drop}
                  onChange={e => handleLocationSearch('drop', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-rose-500/50 transition-all"
                  placeholder="International Airport..."
                />
                <AnimatePresence>
                  {activeInput === 'drop' && suggestions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                      {suggestions.map(s => (
                        <button 
                          key={s.name}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, drop: s.name });
                            setSuggestions([]);
                            setActiveInput(null);
                          }}
                          className="w-full p-4 text-left hover:bg-slate-50 border-b border-slate-50 last:border-0"
                        >
                          <p className="text-sm font-bold text-slate-700">{s.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{s.area}, Visakhapatnam</p>
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
            className="w-full bg-blue-600 text-white rounded-[2rem] py-5 font-bold uppercase text-xs tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3 mt-8"
          >
            Create Schedule <Plus className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Main Area */}
      <div className="flex-1 p-12 bg-[var(--panel-bg)] space-y-12 transition-colors duration-300">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Upcoming Journeys</h1>
            <p className="text-[var(--text-secondary)] font-medium mt-1">Real-time status of scheduled transit across the corporate network.</p>
          </div>
          
          <div className="flex items-center gap-2 bg-[var(--bg-color)] p-1.5 rounded-[2rem] border border-[var(--border-color)]">
            {(['All', 'Pending', 'Scheduled', 'Completed'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={cn(
                  "px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all relative flex items-center gap-2",
                  filterStatus === s ? "bg-[var(--panel-bg)] text-blue-600 shadow-sm border border-[var(--border-color)]" : "text-[var(--text-secondary)] hover:text-blue-500"
                )}
              >
                {s}
                <span className={cn(
                  "px-1.5 py-0.5 rounded-md text-[8px] min-w-[18px] text-center",
                  filterStatus === s ? "bg-blue-600 text-white" : "bg-[var(--border-color)] text-[var(--text-secondary)]"
                )}>
                  {counts[s]}
                </span>
              </button>
            ))}
          </div>

          <div className="flex -space-x-3 hidden md:flex">
            {[1,2,3].map(i => (
              <div key={i} className="w-10 h-10 rounded-full border-4 border-[var(--panel-bg)] bg-[var(--bg-color)] flex items-center justify-center text-[10px] font-black text-[var(--text-secondary)]">U{i}</div>
            ))}
            <div className="w-10 h-10 rounded-full border-4 border-[var(--panel-bg)] bg-blue-50 flex items-center justify-center text-[10px] font-black text-blue-600">+12</div>
          </div>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {filteredTrips.length === 0 ? (
               <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-32 text-center"
               >
                 <Car className="w-16 h-16 text-[var(--border-color)] mx-auto mb-6" />
                 <p className="text-[var(--text-secondary)] font-bold uppercase tracking-[0.2em] opacity-40">No Trips Detected</p>
               </motion.div>
            ) : (
              filteredTrips.map((trip, idx) => (
                <motion.div
                  key={trip.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-[2.5rem] p-8 hover:shadow-[0_0_50px_rgba(37,99,235,0.1)] hover:border-blue-500/20 transition-all flex flex-col lg:flex-row lg:items-center gap-8 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
                    <Navigation className="w-32 h-32 rotate-45 text-[var(--text-primary)]" />
                  </div>

                    <div className="flex items-center gap-6 min-w-[280px]">
                    <div className={cn(
                      "w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-500",
                      trip.serviceType === 'Delivery' ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white" : "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white"
                    )}>
                      {trip.serviceType === 'Delivery' ? <Package className="w-7 h-7" /> : <User className="w-7 h-7" />}
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-[var(--text-primary)] tracking-tight">{trip.passengerName}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                          trip.status === 'Scheduled' ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" : 
                          trip.status === 'Pending' ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                          trip.status === 'Completed' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" :
                          "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                        )}>
                          {trip.provider} • {trip.status}
                        </span>
                        <div className="w-1 h-1 bg-[var(--border-color)] rounded-full" />
                        <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-tighter opacity-70">{trip.serviceType === 'Delivery' ? 'Parcel' : trip.vehicleType}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-xl bg-[var(--bg-color)] flex items-center justify-center text-emerald-500 border border-[var(--border-color)]">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest leading-none mb-1 opacity-50">Pickup</p>
                          <p className="text-sm font-bold text-[var(--text-primary)] opacity-80">{trip.pickup}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-xl bg-[var(--bg-color)] flex items-center justify-center text-rose-500 border border-[var(--border-color)]">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest leading-none mb-1 opacity-50">Drop</p>
                          <p className="text-sm font-bold text-[var(--text-primary)] opacity-80">{trip.drop}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col justify-center gap-4 md:items-end">
                      <div className="flex items-center gap-3 bg-[var(--bg-color)] px-4 py-2 rounded-2xl border border-[var(--border-color)]">
                        <Calendar className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-xs font-bold text-[var(--text-primary)] tabular-nums">{format(new Date(trip.date), 'dd MMM yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-3 bg-blue-600 px-4 py-2 rounded-2xl text-white shadow-lg shadow-blue-600/20">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold tabular-nums">{trip.time}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t lg:border-t-0 lg:border-l border-[var(--border-color)] pt-6 lg:pt-0 lg:pl-8">
                    {trip.status !== 'Completed' && (
                      <button 
                        onClick={() => completeTrip(trip.id)}
                        className="p-4 bg-[var(--bg-color)] text-[var(--text-secondary)] rounded-2xl hover:bg-emerald-50 hover:text-emerald-500 dark:hover:bg-emerald-500/10 transition-all active:scale-95 group/done"
                        title="Mark as completed"
                      >
                        <CheckCircle2 className="w-5 h-5 group-hover/done:scale-110 transition-transform" />
                      </button>
                    )}
                    <button 
                      onClick={() => deleteTrip(trip.id)}
                      className="p-4 bg-[var(--bg-color)] text-[var(--text-secondary)] rounded-2xl hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10 transition-all active:scale-95 group/del"
                      title="Delete trip record"
                    >
                      <Trash2 className="w-5 h-5 group-hover/del:scale-110 transition-transform" />
                    </button>
                    <button 
                      onClick={() => handleLiveBook(trip.provider, trip.pickup, trip.drop)}
                      className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-slate-900 transition-all active:scale-95 shadow-lg shadow-blue-600/20"
                    >
                      Log & Open {trip.provider} <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )))}
            </AnimatePresence>
          </div>
      </div>
      {/* Notification Toast */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-6"
          >
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-600/40 relative overflow-hidden">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-30"
                />
                <Car className="w-6 h-6 relative z-10" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-white font-black text-sm tracking-tight uppercase">{notification.provider} DISPATCH</h3>
                  <span className="text-[9px] font-mono text-blue-400 tracking-widest uppercase">Live_Node</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1,2,3].map(i => (
                      <motion.div
                        key={i}
                        animate={{ height: [4, 12, 4], opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                        className="w-[2px] bg-blue-500 rounded-full"
                      />
                    ))}
                  </div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{notification.status}</p>
                </div>
              </div>
              <div className="pr-2">
                <CheckCircle2 className={cn(
                  "w-6 h-6 transition-colors duration-500",
                  notification.status === 'Handover Complete' ? "text-emerald-500" : "text-white/10"
                )} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
