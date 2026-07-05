import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Clock, Phone, PhoneCall, FileText, LogOut, RefreshCw, Users, Timer } from 'lucide-react';
import { fetchActiveVisitors, markVisitorExit, VisitorLog } from './api';
import { DriveImage } from './DriveImage';
import { MediaViewerModal } from './MediaViewerModal';
import { ExpectedVisitors } from './ExpectedVisitors';
import { elapsedSince } from './timeUtils';

function formatTime(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

const ITEMS_PER_PAGE = 5;

export function ActiveEntries() {
  const [entries, setEntries] = useState<VisitorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exitingId, setExitingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [viewer, setViewer] = useState<{ driveLink: string; title: string } | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchActiveVisitors();
      setEntries(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load active visitors.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, [load]);

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
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.phone.includes(search) ||
      e.purpose.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [filtered.length, totalPages, page]);

  return (
    <div className="max-w-2xl mx-auto pb-8">
      <ExpectedVisitors onCheckedIn={load} />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" /> On-Site Now ({entries.length})
        </h2>
        <button
          type="button"
          onClick={() => { setLoading(true); load(); }}
          className="p-2 rounded-lg bg-[var(--panel-bg)] border border-[var(--border-color)] hover:border-blue-500/40 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={loading ? 'w-4 h-4 animate-spin text-blue-500' : 'w-4 h-4 text-[var(--text-secondary)]'} />
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, phone, or purpose..."
          className="w-full pl-11 pr-4 py-3 text-sm bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-[var(--text-secondary)]">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">{search ? 'No visitors match your search.' : 'No visitors currently on-site.'}</p>
        </div>
      )}

      <div className="space-y-3">
        <AnimatePresence>
          {paginated.map((entry) => (
            <motion.div
              key={entry.logId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl p-3 sm:p-4 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => entry.photoDriveLink && setViewer({ driveLink: entry.photoDriveLink, title: `${entry.name} — Photo` })}
                    disabled={!entry.photoDriveLink}
                    className={
                      'w-12 sm:w-14 h-12 sm:h-14 rounded-xl shrink-0 overflow-hidden border transition-colors ' +
                      (entry.photoDriveLink
                        ? 'border-transparent hover:border-blue-400 cursor-pointer'
                        : 'bg-[var(--bg-color)] border-[var(--border-color)] pointer-events-none')
                    }
                    title={entry.photoDriveLink ? 'View entry photo' : 'No photo on file'}
                  >
                    <DriveImage driveLink={entry.photoDriveLink} alt={entry.name} className="w-full h-full object-cover" />
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)] truncate">{entry.name}</h3>
                      <span className={
                        entry.entryType === 'New'
                          ? 'text-[8px] sm:text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 border border-blue-500/20'
                          : 'text-[8px] sm:text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      }>
                        {entry.entryType}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1 text-[11px] sm:text-xs text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{entry.phone}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /><span className="font-bold text-[var(--text-primary)]">In:</span> {formatTime(entry.entryTime)}</span>
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <Timer className="w-3 h-3" /> {elapsedSince(entry.entryTime, now)} inside
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] mt-0.5 truncate">{entry.purpose}</p>
                    {entry.documentDriveLink && (
                      <button
                        type="button"
                        onClick={() => setViewer({ driveLink: entry.documentDriveLink, title: `${entry.name} — Document` })}
                        className="inline-flex items-center gap-1 mt-1 text-[10px] sm:text-[11px] text-blue-600 underline font-semibold"
                      >
                        <FileText className="w-3 h-3" /> Document
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 sm:shrink-0">
                  <a
                    href={`tel:${entry.phone}`}
                    className="w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-green-600 hover:bg-green-500 text-white flex items-center justify-center transition-all active:scale-90"
                    title={`Call ${entry.phone}`}
                  >
                    <PhoneCall className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleExit(entry.logId)}
                    disabled={exitingId === entry.logId}
                    className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-rose-600 hover:bg-rose-500 text-white text-[9px] sm:text-[10px] font-bold uppercase rounded-xl transition-all active:scale-95 disabled:opacity-50"
                  >
                    <LogOut className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> Exit
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--panel-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-blue-600 disabled:opacity-30 transition-colors"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={
                'w-8 h-8 rounded-lg text-xs font-bold transition-colors ' +
                (p === safePage
                  ? 'bg-blue-600 text-white'
                  : 'bg-[var(--panel-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-blue-600')
              }
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--panel-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-blue-600 disabled:opacity-30 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {viewer && (
        <MediaViewerModal driveLink={viewer.driveLink} title={viewer.title} onClose={() => setViewer(null)} />
      )}
    </div>
  );
}
