import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Search, FileText, Clock, Timer, LogOut, RefreshCw, History } from 'lucide-react';
import { cn } from '../lib/utils';
import { fetchVisitorLogs, markVisitorExit, VisitorLog } from '../security/api';
import { DriveImage } from '../security/DriveImage';
import { MediaViewerModal } from '../security/MediaViewerModal';
import { elapsedSince, durationBetween } from '../security/timeUtils';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 'all'] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

const PURPOSE_OPTIONS = [
  'Meeting',
  'Interview',
  'Vendor / Delivery',
  'Maintenance / Service',
  'VIP Guest',
  'Contractor / Site Work',
  'Personal Visit',
  'Other',
];

const DATE_PRESETS = [
  { value: '', label: 'All Dates' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7', label: 'Past 7 Days' },
  { value: 'last30', label: 'Past 30 Days' },
  { value: 'custom', label: 'Custom Range' },
] as const;
type DatePreset = (typeof DATE_PRESETS)[number]['value'];

const TYPE_FILTERS = [
  { value: '', label: 'All Types' },
  { value: 'New', label: 'New' },
  { value: 'Old', label: 'Old' },
  { value: 'Pre-Registered', label: 'Pre-Registered' },
] as const;
type TypeFilter = (typeof TYPE_FILTERS)[number]['value'];

const STATUS_FILTERS = [
  { value: '', label: 'All Statuses' },
  { value: 'Active', label: 'Active' },
  { value: 'Completed', label: 'Completed' },
] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number]['value'];

function getDateRange(preset: DatePreset, customFrom: string, customTo: string): { from: Date; to: Date } | null {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 86400000 - 1);

  switch (preset) {
    case 'today':
      return { from: startOfToday, to: endOfToday };
    case 'yesterday': {
      const start = new Date(startOfToday.getTime() - 86400000);
      return { from: start, to: new Date(start.getTime() + 86400000 - 1) };
    }
    case 'last7':
      return { from: new Date(startOfToday.getTime() - 6 * 86400000), to: now };
    case 'last30':
      return { from: new Date(startOfToday.getTime() - 29 * 86400000), to: now };
    case 'custom':
      if (!customFrom && !customTo) return null;
      return {
        from: customFrom ? new Date(`${customFrom}T00:00:00`) : new Date(0),
        to: customTo ? new Date(`${customTo}T23:59:59`) : now,
      };
    default:
      return null;
  }
}

function formatDateTime(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function LogRow({ log, onExit }: { log: VisitorLog; onExit: (logId: string) => void }) {
  const [viewer, setViewer] = useState<{ driveLink: string; title: string } | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (log.status !== 'Active') return;
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, [log.status]);

  return (
    <div className="p-4 flex items-center gap-3.5 hover:bg-[var(--bg-color)]/40 transition-all">
      <button
        type="button"
        onClick={() => log.photoDriveLink && setViewer({ driveLink: log.photoDriveLink, title: `${log.name} — Photo` })}
        disabled={!log.photoDriveLink}
        className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-[var(--border-color)] bg-[var(--bg-color)]"
      >
        <DriveImage driveLink={log.photoDriveLink} alt={log.name} className="w-full h-full object-cover" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h5 className="font-extrabold text-[var(--text-primary)] text-sm truncate">{log.name || log.phone}</h5>
          <span className={cn(
            "text-[8px] font-black uppercase px-1.5 py-0.5 rounded border",
            log.status === 'Expected'
              ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
              : log.entryType === 'New'
                ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
          )}>
            {log.status === 'Expected' ? 'Pre-Registered' : log.entryType}
          </span>
          <span className={cn(
            "text-[8px] font-black uppercase px-1.5 py-0.5 rounded border",
            log.status === 'Active'
              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
              : 'bg-[var(--border-color)]/40 text-[var(--text-secondary)] border-[var(--border-color)]'
          )}>
            {log.status}
          </span>
        </div>
        <p className="text-[11px] text-[var(--text-secondary)] opacity-70 mt-0.5 truncate">
          {log.phone} · {log.purpose} · ID {log.visitorIdCardNumber}
        </p>
        <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-[var(--text-secondary)] opacity-60 flex-wrap">
          <span className="flex items-center gap-1"><Clock size={10} /><span className="font-bold text-[var(--text-primary)] opacity-100">In:</span> {formatDateTime(log.entryTime)}</span>
          {log.exitTime ? (
            <>
              <span className="flex items-center gap-1"><Clock size={10} /><span className="font-bold text-[var(--text-primary)] opacity-100">Out:</span> {formatDateTime(log.exitTime)}</span>
              <span className="flex items-center gap-1 text-blue-500 opacity-100 font-semibold">
                <Timer size={10} /> {durationBetween(log.entryTime, log.exitTime)}
              </span>
            </>
          ) : log.entryTime ? (
            <span className="flex items-center gap-1 text-emerald-500 opacity-100 font-semibold">
              <Timer size={10} /> {elapsedSince(log.entryTime, now)} inside
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        {log.documentDriveLink && (
          <button
            type="button"
            onClick={() => setViewer({ driveLink: log.documentDriveLink, title: `${log.name} — Document` })}
            className="flex items-center gap-1 text-[10px] font-bold text-blue-500 hover:text-blue-400 underline"
          >
            <FileText size={11} /> Verify Document
          </button>
        )}
        {log.status === 'Active' && (
          <button
            type="button"
            onClick={() => onExit(log.logId)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-[9px] font-black uppercase rounded-lg transition-all active:scale-95"
          >
            <LogOut size={11} /> Mark Exit
          </button>
        )}
      </div>

      {viewer && (
        <MediaViewerModal driveLink={viewer.driveLink} title={viewer.title} onClose={() => setViewer(null)} />
      )}
    </div>
  );
}

interface FullVisitorLogsPageProps {
  onBack: () => void;
}

export function FullVisitorLogsPage({ onBack }: FullVisitorLogsPageProps) {
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(20);
  const [datePreset, setDatePreset] = useState<DatePreset>('');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVisitorLogs();
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

  const handleExit = async (logId: string) => {
    try {
      await markVisitorExit(logId);
      load();
    } catch (err: any) {
      setError(err.message || 'Failed to record exit.');
    }
  };

  const dateRange = getDateRange(datePreset, customFrom, customTo);

  const filtered = logs.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search) ||
      l.purpose.toLowerCase().includes(search.toLowerCase()) ||
      l.visitorIdCardNumber.toLowerCase().includes(search.toLowerCase());
    const matchesDate = !dateRange || !l.entryTime || (() => {
      const t = new Date(l.entryTime).getTime();
      return t >= dateRange.from.getTime() && t <= dateRange.to.getTime();
    })();
    const matchesPurpose = !purposeFilter || l.purpose === purposeFilter;
    const matchesType =
      !typeFilter ||
      (typeFilter === 'Pre-Registered' ? l.status === 'Expected' : l.entryType === typeFilter && l.status !== 'Expected');
    const matchesStatus = !statusFilter || l.status === statusFilter;
    return matchesSearch && matchesDate && matchesPurpose && matchesType && matchesStatus;
  });

  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = pageSize === 'all' ? filtered : filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [filtered.length, totalPages, page]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="p-2.5 rounded-xl bg-[var(--panel-bg)] border border-[var(--border-color)] hover:border-blue-500/40 transition-colors text-[var(--text-secondary)] hover:text-blue-500"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-tight">
            <History className="text-blue-600" /> Full Visitor Logs
          </h1>
          <p className="text-[var(--text-secondary)] opacity-70 text-sm mt-0.5">Complete gate entry history from the Google Sheets visitor log.</p>
        </div>
      </div>

      <div className="bg-[var(--panel-bg)]/70 backdrop-blur-xl rounded-3xl border border-[var(--border-color)] shadow-sm overflow-hidden">
        {/* Search & Filters */}
        <div className="p-6 border-b border-[var(--border-color)] space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by name, phone, purpose, or ID card..."
                className="w-full pl-11 pr-4 py-2.5 text-sm bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <button
              type="button"
              onClick={load}
              className="p-2.5 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)] hover:border-blue-500/40 transition-colors shrink-0"
              title="Refresh"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin text-blue-500")} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={datePreset}
              onChange={(e) => { setDatePreset(e.target.value as DatePreset); setPage(1); }}
              className="px-3 py-2.5 text-sm bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-[var(--text-primary)] cursor-pointer"
            >
              {DATE_PRESETS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>

            {datePreset === 'custom' && (
              <>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => { setCustomFrom(e.target.value); setPage(1); }}
                  className="px-3 py-2.5 text-sm bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-[var(--text-primary)]"
                  title="From date"
                />
                <span className="text-xs text-[var(--text-secondary)]">to</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => { setCustomTo(e.target.value); setPage(1); }}
                  className="px-3 py-2.5 text-sm bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-[var(--text-primary)]"
                  title="To date"
                />
              </>
            )}

            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value as TypeFilter); setPage(1); }}
              className="px-3 py-2.5 text-sm bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-[var(--text-primary)] cursor-pointer"
            >
              {TYPE_FILTERS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setPage(1); }}
              className="px-3 py-2.5 text-sm bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-[var(--text-primary)] cursor-pointer"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            <select
              value={purposeFilter}
              onChange={(e) => { setPurposeFilter(e.target.value); setPage(1); }}
              className="px-3 py-2.5 text-sm bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-[var(--text-primary)] cursor-pointer"
            >
              <option value="">All Purposes</option>
              {PURPOSE_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {(datePreset || purposeFilter || typeFilter || statusFilter) && (
              <button
                type="button"
                onClick={() => {
                  setDatePreset('');
                  setCustomFrom('');
                  setCustomTo('');
                  setPurposeFilter('');
                  setTypeFilter('');
                  setStatusFilter('');
                  setPage(1);
                }}
                className="px-3 py-2.5 text-xs font-bold text-[var(--text-secondary)] hover:text-rose-500 border border-[var(--border-color)] rounded-xl transition-colors whitespace-nowrap"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {error && <p className="px-6 pt-4 text-xs text-red-500">{error}</p>}

        <div className="divide-y divide-[var(--border-color)]/40">
          <AnimatePresence mode="popLayout">
            {paginated.map((log) => (
              <motion.div key={log.logId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <LogRow log={log} onExit={handleExit} />
              </motion.div>
            ))}
          </AnimatePresence>
          {!loading && filtered.length === 0 && (
            <p className="p-8 text-center text-xs text-[var(--text-secondary)] opacity-50">No visitor logs match these filters.</p>
          )}
        </div>

        {/* Pagination + per-view control */}
        {!loading && filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-[var(--border-color)]">
            {totalPages > 1 ? (
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-blue-600 disabled:opacity-30 transition-colors"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={cn(
                      'w-8 h-8 rounded-lg text-xs font-bold transition-colors',
                      p === safePage ? 'bg-blue-600 text-white' : 'bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-blue-600'
                    )}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-blue-600 disabled:opacity-30 transition-colors"
                >
                  Next
                </button>
              </div>
            ) : (
              <span className="text-xs text-[var(--text-secondary)] opacity-60">{filtered.length} record{filtered.length === 1 ? '' : 's'}</span>
            )}

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-secondary)] opacity-60">Per view</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value) as PageSize); setPage(1); }}
                className="px-2.5 py-1.5 text-xs font-bold bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg outline-none focus:border-blue-500 text-[var(--text-primary)] cursor-pointer"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>{size === 'all' ? 'All' : size}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
