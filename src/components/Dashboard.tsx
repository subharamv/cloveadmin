import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Users,
  Search,
  ArrowUpRight,
  Filter,
  Zap,
  Shield,
  Activity,
  AlertCircle,
  Phone,
  Plane,
  Car,
  ShieldAlert,
  ArrowRightLeft
} from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { fetchVisitorLogs } from '../security/api';

function TelemetryBar({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[8px] font-mono text-[var(--text-secondary)] uppercase tracking-widest opacity-60">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-[var(--bg-color)] rounded-full overflow-hidden border border-[var(--border-color)]">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={`h-full ${color} shadow-[0_0_10px_rgba(59,130,246,0.3)]`}
        />
      </div>
    </div>
  );
}

export function Dashboard({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const [stats, setStats] = useState({
    calls: 0,
    bookings: 0,
    cabs: 0,
    vendors: 0
  });

  const [systemLoad, setSystemLoad] = useState(42);
  const [todayVisits, setTodayVisits] = useState(0);
  const [todayVisitors, setTodayVisitors] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSystemLoad(prev => {
        const next = prev + (Math.random() * 4 - 2);
        return Math.min(Math.max(next, 30), 85);
      });
    }, 3000);

    const unsubCalls = onSnapshot(collection(db, 'callLogs'), (s) => setStats(prev => ({ ...prev, calls: s.size })));
    const unsubBookings = onSnapshot(collection(db, 'bookings'), (s) => setStats(prev => ({ ...prev, bookings: s.size })));
    const unsubCabs = onSnapshot(collection(db, 'cabs'), (s) => setStats(prev => ({ ...prev, cabs: s.size })));
    const unsubVendors = onSnapshot(collection(db, 'vendorRegistrations'), (s) => setStats(prev => ({ ...prev, vendors: s.size })));

    const loadVisitorStats = async () => {
      try {
        const logs = await fetchVisitorLogs();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayLogs = logs.filter((l) => {
          const d = new Date(l.entryTime);
          return d >= today;
        });
        setTodayVisits(todayLogs.length);
        setTodayVisitors(new Set(todayLogs.map((l) => l.phone)).size);
      } catch { /* ignore */ }
    };
    loadVisitorStats();

    return () => {
      clearInterval(interval);
      unsubCalls();
      unsubBookings();
      unsubCabs();
      unsubVendors();
    };
  }, []);

  const cards = [
    { label: 'Vendor Interactions', value: stats.calls, icon: BarChart3, change: '+12%', color: '#141414', onClick: undefined },
    { label: 'Active Bookings', value: stats.bookings, icon: TrendingUp, change: '+5%', color: '#141414', onClick: undefined },
    { label: 'Cab Schedules', value: stats.cabs, icon: Clock, change: '0', color: '#141414', onClick: undefined },
    { label: 'Gate Entries', value: stats.vendors, icon: Users, change: '+24%', color: '#141414', onClick: undefined },
    { label: "Today's Visitors", value: `${todayVisits} / ${todayVisitors}`, icon: Shield, change: 'LIVE', color: '#2563eb', onClick: () => setActiveTab('securityHub') },
  ];

  return (
    <div className="relative space-y-12 pb-12">
      {/* Visual Overlays */}
      <div className="scanline" />
      
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
          <h2 className="text-4xl font-display font-bold uppercase tracking-tighter text-[var(--text-primary)]">Dashboard</h2>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--text-secondary)] opacity-40">Admin Management</p>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Stats and Activity */}
        <div className="lg:col-span-8 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cards.map((card, idx) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                key={card.label}
                onClick={card.onClick}
                className={cn("bg-panel border-grid p-6 rounded-2xl flex flex-col justify-between group hover:border-blue-500/30 transition-all hover:bg-white/5 relative overflow-hidden", card.onClick && "cursor-pointer")}
              >
                <div className="absolute top-0 right-0 p-2 font-mono text-[6px] text-[var(--text-secondary)] uppercase tracking-[0.5em] opacity-20">Auth_Session_Valid</div>
                <div className="flex justify-between items-start mb-6">
                  <div className={cn("p-3 rounded-xl transition-colors", card.onClick ? "bg-blue-500/20 text-blue-500 group-hover:bg-blue-600 group-hover:text-white" : "bg-blue-500/10 text-blue-500 group-hover:bg-blue-600 group-hover:text-white")}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <span className={cn("font-mono text-[10px] font-bold px-2 py-0.5 rounded transition-colors", card.onClick ? "text-white bg-blue-500 group-hover:bg-blue-600" : "text-blue-500 bg-blue-500/10 group-hover:bg-blue-500 group-hover:text-white")}>{card.change}</span>
                </div>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-2 opacity-40">{card.label}</p>
                  <h3 className="text-4xl font-display font-bold tracking-tighter text-[var(--text-primary)] leading-none">{card.value}</h3>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="accent-line opacity-20" />

          {/* Activity Log */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-[0.2em] flex items-center gap-3">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                // Recent_Activity
              </h3>
              <button className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-[0.2em] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all opacity-40 hover:opacity-100">
                View All <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            
            <div className="bg-panel border-grid rounded-2xl overflow-hidden backdrop-blur-xl group shadow-sm transition-colors duration-300">
              <table className="w-full text-left font-mono text-[11px]">
                <thead className="bg-[var(--bg-color)] text-[var(--text-secondary)] uppercase text-[9px] tracking-widest border-b border-[var(--border-color)] opacity-60">
                  <tr className="h-12 px-6">
                    <th className="px-6">Protocol</th>
                    <th className="px-6">Subject</th>
                    <th className="px-6 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="text-[var(--text-primary)] divide-y divide-[var(--border-color)]">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <tr key={item} className="h-14 hover:bg-blue-500/5 transition-colors cursor-pointer group/row">
                      <td className="px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full group-hover/row:scale-125 transition-transform" />
                          <span className="font-bold text-blue-600 dark:text-blue-400">CALL_LOG</span>
                        </div>
                      </td>
                      <td className="px-6 opacity-70 italic font-sans text-xs">Vendor: Reliance Logistics</td>
                      <td className="px-6 text-right opacity-30 text-[10px]">14:20:05 UTC</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Actions and Telemetry */}
        <div className="lg:col-span-4 space-y-8">
          {/* QUICK ACTIONS */}
          <div className="bg-blue-600 p-8 rounded-2xl shadow-xl shadow-blue-500/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap className="w-24 h-24 rotate-12 text-white" />
            </div>
            <h3 className="text-xs font-mono font-bold text-white/70 uppercase tracking-[0.2em] mb-6 relative z-10 opacity-70">Quick_Actions</h3>
            <div className="space-y-3 relative z-10">
              {[
                { id: 'calls', label: 'Log New Call' },
                { id: 'travelHub', label: 'Travel Hub' },
                { id: 'securityHub', label: 'Gate & Visitors' }
              ].map((act) => (
                <button 
                  key={act.id}
                  onClick={() => setActiveTab(act.id)}
                  className="w-full flex items-center justify-between text-[11px] uppercase font-bold tracking-widest p-4 bg-white/10 hover:bg-white text-white hover:text-blue-600 transition-all rounded-xl group/btn"
                >
                  {act.label}
                  <ArrowUpRight className="w-4 h-4 group-hover/btn:rotate-45 transition-transform" />
                </button>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div className="bg-panel border-grid p-8 rounded-2xl space-y-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-[0.3em] flex items-center gap-2">
                <Activity className="w-4 h-4" />
                System_Status
              </h4>
              <div className="flex gap-1">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-1 h-3 bg-blue-500/20 rounded-full overflow-hidden">
                    <motion.div 
                      animate={{ height: ["0%", "100%", "40%"] }} 
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                      className="w-full bg-blue-500" 
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-5">
              <TelemetryBar label="System Load" value={Math.round(systemLoad)} color="bg-blue-500" />
              <TelemetryBar label="Network Latency" value={12} color="bg-green-500" />
              <TelemetryBar label="DB Integrity" value={98} color="bg-purple-500" />
            </div>

            <div className="pt-4 border-t border-[var(--border-color)]">
              <div className="flex items-start gap-4 p-3 bg-[var(--bg-color)]/50 rounded-xl border border-[var(--border-color)] group transition-colors">
                <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-1" />
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-tight">Security Protocol</p>
                  <p className="text-[9px] text-[var(--text-secondary)] leading-relaxed uppercase tracking-widest opacity-60">AES-256 Enabled // End-to-End Encryption active on all nodes.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-panel border-grid p-8 rounded-2xl space-y-6">
            <h4 className="text-[10px] font-mono font-bold text-amber-500/80 uppercase tracking-[0.3em] flex items-center gap-2">
              <span className="w-1 h-3 bg-amber-500 rounded-full" />
              Intelligence_Alerts
            </h4>
            <div className="space-y-6">
              <div className="flex gap-4 group">
                <div className="w-1 bg-amber-500/50 group-hover:bg-amber-500 transition-colors rounded-full" />
                <p className="text-[11px] leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">Vendor "Azure Logistics" has not responded to 3 follow-up calls.</p>
              </div>
              <div className="flex gap-4 group">
                <div className="w-1 bg-red-500/50 group-hover:bg-red-500 transition-colors rounded-full" />
                <p className="text-[11px] leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">Director flight schedule conflict detected for Flight AI-304.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

