import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Phone, LogOut, Loader2, Users, Timer } from 'lucide-react';
import { fetchActiveVisitors, markVisitorExit, VisitorLog } from './api';
import { DriveImage } from './DriveImage';
import { elapsedSince } from './timeUtils';

export function QuickCheckoutList() {
  const [entries, setEntries] = useState<VisitorLog[]>([]);
  const [search, setSearch] = useState('');
  const [exitingId, setExitingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  const load = useCallback(async () => {
    try {
      const data = await fetchActiveVisitors();
      setEntries(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load on-site visitors.');
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const handleExit = async (logId: string) => {
    setExitingId(logId);
    try {
      await markVisitorExit(logId);
      setEntries((prev) => prev.filter((e) => e.logId !== logId));
    } catch (err: any) {
      setError(err.message || 'Failed to record exit.');
    } finally {
      setExitingId(null);
    }
  };

  const filtered = entries.filter(
    (e) => e.name.toLowerCase().includes(search.toLowerCase()) || e.phone.includes(search),
  );

  if (entries.length === 0) return null;

  return (
    <div className="max-w-xl mx-auto mt-8">
      <h2 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wide flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-blue-500" /> Quick Checkout — On-Site ({entries.length})
      </h2>

      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          className="w-full pl-11 pr-4 py-3 text-sm bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="space-y-2.5">
        <AnimatePresence>
          {filtered.map((entry) => (
            <motion.div
              key={entry.logId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl p-3 flex items-center gap-3 shadow-sm"
            >
              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-[var(--border-color)]">
                <DriveImage driveLink={entry.photoDriveLink} alt={entry.name} className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-[var(--text-primary)] truncate">{entry.name}</h3>
                <div className="flex items-center gap-2.5 text-[11px] text-[var(--text-secondary)] flex-wrap">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{entry.phone}</span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <Timer className="w-3 h-3" /> {elapsedSince(entry.entryTime, now)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleExit(entry.logId)}
                disabled={exitingId === entry.logId}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold uppercase rounded-xl transition-all active:scale-95 disabled:opacity-50"
              >
                {exitingId === entry.logId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                Exit
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <p className="text-center text-xs text-[var(--text-secondary)] opacity-50 py-6">No matching on-site visitors.</p>
        )}
      </div>
    </div>
  );
}
