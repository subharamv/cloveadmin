import { useState, useEffect, useCallback } from 'react';
import { Search, Clock, FileText, History, RefreshCw, Timer, PhoneCall, Activity, CalendarDays, Users } from 'lucide-react';
import { fetchVisitorLogs, VisitorLog } from './api';
import { DriveImage } from './DriveImage';
import { MediaViewerModal } from './MediaViewerModal';
import { durationBetween } from './timeUtils';

function formatDateTime(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

const ITEMS_PER_PAGE = 10;

export function HistoryLogs() {
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [viewer, setViewer] = useState<{ driveLink: string; title: string } | null>(null);

  const load = useCallback(async (searchTerm?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVisitorLogs({ search: searchTerm });
      setLogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load visitor logs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => load(search || undefined), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="max-w-3xl mx-auto pb-8">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2 shrink-0">
          <History className="w-5 h-5 text-blue-600" /> Visit History
        </h2>
        <button
          type="button"
          onClick={() => load(search || undefined)}
          className="p-2 rounded-lg bg-[var(--panel-bg)] border border-[var(--border-color)] hover:border-blue-500/40 transition-colors shrink-0"
          title="Refresh"
        >
          <RefreshCw className={loading ? 'w-4 h-4 animate-spin text-blue-500' : 'w-4 h-4 text-[var(--text-secondary)]'} />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 mb-5">
        {[
          { label: 'Today', visits: logs.filter(l => l.entryTime?.startsWith(new Date().toISOString().slice(0, 10))).length, visitors: new Set(logs.filter(l => l.entryTime?.startsWith(new Date().toISOString().slice(0, 10))).map(l => l.phone)).size, icon: Activity, color: 'text-blue-500' },
          { label: 'This Month', visits: logs.filter(l => l.entryTime?.slice(0, 7) === new Date().toISOString().slice(0, 7)).length, visitors: new Set(logs.filter(l => l.entryTime?.slice(0, 7) === new Date().toISOString().slice(0, 7)).map(l => l.phone)).size, icon: CalendarDays, color: 'text-indigo-500' },
          { label: 'Total', visits: logs.length, visitors: new Set(logs.map(l => l.phone)).size, icon: Users, color: 'text-amber-500' },
        ].map(stat => (
          <div key={stat.label} className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-xl p-3 flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg bg-[var(--bg-color)] border border-[var(--border-color)] flex items-center justify-center shrink-0 ${stat.color}`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--text-secondary)]">{stat.label}</p>
              <p className="text-sm font-black text-[var(--text-primary)] leading-tight">{stat.visits} <span className="text-[9px] font-medium text-[var(--text-secondary)]">Visits</span></p>
              <p className="text-sm font-black text-[var(--text-primary)] leading-tight">{stat.visitors} <span className="text-[9px] font-medium text-[var(--text-secondary)]">Visitors</span></p>
            </div>
          </div>
        ))}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, phone, or ID card number..."
          className="w-full pl-11 pr-4 py-3 text-sm bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {!loading && logs.length === 0 && (
        <div className="text-center py-16 text-[var(--text-secondary)]">
          <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No visitor logs found.</p>
        </div>
      )}

      {!loading && (
        <>
          <div className="space-y-2.5">
            {logs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE).map((log) => (
              <div key={log.logId} className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => log.photoDriveLink && setViewer({ driveLink: log.photoDriveLink, title: `${log.name} — Photo` })}
                      disabled={!log.photoDriveLink}
                      className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl overflow-hidden shrink-0 border border-[var(--border-color)] bg-[var(--bg-color)]"
                    >
                      <DriveImage driveLink={log.photoDriveLink} alt={log.name} className="w-full h-full object-cover" />
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)] truncate">{log.name}</h3>
                        <span className={
                          log.entryType === 'New'
                            ? 'text-[8px] sm:text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 border border-blue-500/20'
                            : 'text-[8px] sm:text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        }>
                          {log.entryType}
                        </span>
                        <span className={
                          log.status === 'Active'
                            ? 'text-[8px] sm:text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20'
                            : 'text-[8px] sm:text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-500/10 text-[var(--text-secondary)] border border-[var(--border-color)]'
                        }>
                          {log.status}
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] mt-1">
                        {log.phone} · {log.purpose}{log.occupation && ` · ${log.occupation}`} · ID {log.visitorIdCardNumber}
                        {log.numberOfPersons > 1 && ` · ${log.numberOfPersons} pax`}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1.5 text-[10px] sm:text-[11px] text-[var(--text-secondary)] font-mono">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /><span className="font-bold text-[var(--text-primary)]">In:</span> {formatDateTime(log.entryTime)}</span>
                        {log.exitTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /><span className="font-bold text-[var(--text-primary)]">Out:</span> {formatDateTime(log.exitTime)}</span>}
                        {log.exitTime && (
                          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
                            <Timer className="w-3 h-3" /> {durationBetween(log.entryTime, log.exitTime)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 sm:shrink-0">
                    <a
                      href={`tel:${log.phone}`}
                      className="w-8 sm:w-9 h-8 sm:h-9 rounded-full bg-green-600 hover:bg-green-500 text-white flex items-center justify-center transition-all active:scale-90"
                      title={`Call ${log.phone}`}
                    >
                      <PhoneCall className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                    </a>
                    {log.documentDriveLink && (
                      <button
                        type="button"
                        onClick={() => setViewer({ driveLink: log.documentDriveLink, title: `${log.name} — Document` })}
                        className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-blue-600 underline shrink-0"
                      >
                        <FileText className="w-3 h-3" /> Document
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {logs.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--panel-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-blue-600 disabled:opacity-30 transition-colors"
              >
                Prev
              </button>
              {Array.from({ length: Math.ceil(logs.length / ITEMS_PER_PAGE) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={
                    'w-8 h-8 rounded-lg text-xs font-bold transition-colors ' +
                    (p === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-[var(--panel-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-blue-600')
                  }
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(logs.length / ITEMS_PER_PAGE)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--panel-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-blue-600 disabled:opacity-30 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {viewer && (
        <MediaViewerModal driveLink={viewer.driveLink} title={viewer.title} onClose={() => setViewer(null)} />
      )}
    </div>
  );
}
