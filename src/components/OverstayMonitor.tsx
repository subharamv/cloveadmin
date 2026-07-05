import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, AlertTriangle, BellRing, User, ShieldAlert } from 'lucide-react';
import { formatDistanceToNow, differenceInHours } from 'date-fns';
import { cn } from '../lib/utils';

interface Visitor {
  id: string;
  name: string;
  host: string;
  checkInTime: Date;
}

const MOCK_VISITORS: Visitor[] = [
  { id: '1', name: 'James Wilson', host: 'Sarah Chen', checkInTime: new Date(Date.now() - 5 * 60 * 60 * 1000) }, // 5 hours ago
  { id: '2', name: 'Maria Garcia', host: 'David Miller', checkInTime: new Date(Date.now() - 2 * 60 * 60 * 1000) }, // 2 hours ago
  { id: '3', name: 'Robert Brown', host: 'Alex Kumar', checkInTime: new Date(Date.now() - 4.5 * 60 * 60 * 1000) }, // 4.5 hours ago
  { id: '4', name: 'Lisa Zhang', host: 'Sarah Chen', checkInTime: new Date(Date.now() - 30 * 60 * 1000) }, // 30 mins ago
];

export default function OverstayMonitor() {
  const [visitors, setVisitors] = useState<Visitor[]>(MOCK_VISITORS);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handlePingHost = (visitorName: string, hostName: string) => {
    // Simulated notification
    alert(`AUTOMATED REMINDER SENT: ${hostName}, please escort your guest (${visitorName}) out of the facility as their session has exceeded the temporal limit.`);
  };

  return (
    <div className="w-full bg-[var(--panel-bg)] backdrop-blur-3xl border border-[var(--border-color)] rounded-[2rem] overflow-hidden shadow-2xl transition-colors duration-300">
      {/* Header */}
      <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-color)]/30">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-[0_0_20px_rgba(239,44,68,0.15)]">
            <ShieldAlert className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold text-[var(--text-primary)] tracking-tight">Overstay Monitor</h3>
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--text-secondary)] opacity-40">Temporal_Boundary_Protection</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
          <span className="text-[9px] font-mono text-green-400 font-bold uppercase tracking-widest leading-none">Scanning_Live</span>
        </div>
      </div>

      {/* Grid Header */}
      <div className="grid grid-cols-12 px-8 py-4 bg-[var(--bg-color)]/50 border-b border-[var(--border-color)] text-[9px] font-mono uppercase tracking-[0.2em] text-[var(--text-secondary)] opacity-30 font-black">
        <div className="col-span-4">Visitor_Identity</div>
        <div className="col-span-3">Host_Entity</div>
        <div className="col-span-3">Check-In_T</div>
        <div className="col-span-2 text-right">Operational_Action</div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-[var(--border-color)] max-h-[400px] overflow-y-auto custom-scrollbar">
        <AnimatePresence>
          {visitors.map((visitor) => {
            const hoursIn = differenceInHours(currentTime, visitor.checkInTime);
            const isOverstay = hoursIn >= 4;

            return (
              <motion.div 
                key={visitor.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "grid grid-cols-12 px-8 py-5 items-center transition-all group relative",
                  isOverstay ? "bg-red-500/[0.03]" : "hover:bg-blue-500/5"
                )}
              >
                {/* Left Indicator */}
                {isOverstay && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600 shadow-[2px_0_10px_rgba(220,38,38,0.5)]" />
                )}

                <div className="col-span-4 flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center border",
                    isOverstay ? "bg-red-500/20 border-red-500/30" : "bg-[var(--bg-color)] border-[var(--border-color)]"
                  )}>
                    <User className={cn("w-4 h-4", isOverstay ? "text-red-400" : "text-[var(--text-secondary)] opacity-30")} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[var(--text-primary)] opacity-90 group-hover:text-[var(--text-primary)] transition-colors">{visitor.name}</span>
                    {isOverstay && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[8px] font-mono font-black uppercase text-red-500 tracking-[0.2em]">Flagged: Overstay</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-span-3">
                  <span className="text-xs text-[var(--text-secondary)] opacity-60">{visitor.host}</span>
                </div>

                <div className="col-span-3">
                  <div className="flex items-center gap-2 text-[var(--text-secondary)] opacity-40 group-hover:text-[var(--text-secondary)] group-hover:opacity-60 transition-colors">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs font-mono font-bold">
                      {formatDistanceToNow(visitor.checkInTime, { addSuffix: false })}
                    </span>
                  </div>
                </div>

                <div className="col-span-2 text-right">
                  <button 
                    onClick={() => handlePingHost(visitor.name, visitor.host)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all inline-flex items-center gap-2 shadow-sm",
                      isOverstay 
                        ? "bg-red-600 text-white hover:bg-red-500 shadow-red-500/20" 
                        : "bg-[var(--bg-color)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--panel-bg)] hover:text-blue-500 hover:border-blue-500/30"
                    )}
                  >
                    <BellRing className="w-3 h-3" />
                    Ping_Host
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer Meta */}
      <div className="p-4 bg-[var(--bg-color)]/30 border-t border-[var(--border-color)] flex justify-between items-center px-8">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3 h-3 text-[var(--text-secondary)] opacity-20" />
          <span className="text-[8px] font-mono text-[var(--text-secondary)] opacity-20 uppercase tracking-widest">Protocol: 4HR_STAY_CAP_ENFORCED</span>
        </div>
        <p className="text-[8px] font-mono text-[var(--text-secondary)] opacity-10 uppercase tracking-widest">Node: {currentTime.toLocaleTimeString()}</p>
      </div>
    </div>
  );
}
