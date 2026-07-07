import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Users, History, FileText, Clock, LogOut, RefreshCw, KeyRound, Search, CalendarDays, Activity, UserCheck, Timer, Trash2, CheckSquare, Phone, Pencil } from 'lucide-react';
import { cn } from '../lib/utils';
import { getAuthToken } from '../lib/auth';
import { fetchActiveVisitors, fetchVisitorLogs, markVisitorExit, deleteVisitorLog, bulkDeleteVisitorLogs, VisitorLog } from '../security/api';
import { DriveImage } from '../security/DriveImage';
import { MediaViewerModal } from '../security/MediaViewerModal';
import { EditVisitorModal } from '../security/EditVisitorModal';
import { elapsedSince, durationBetween } from '../security/timeUtils';

function formatDateTime(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function VisitorRow({ log, onExit, selected, onToggle, onProfileUpdated }: { log: VisitorLog; onExit?: (logId: string) => void; selected?: boolean; onToggle?: () => void; onProfileUpdated?: () => void }) {
  const [viewer, setViewer] = useState<{ driveLink: string; title: string } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (log.status !== 'Active') return;
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, [log.status]);

  return (
    <div className={cn("p-3.5 flex items-center gap-3.5 transition-all cursor-pointer", selected && "bg-blue-500/5")} onClick={onToggle}>
      <div className="flex items-center gap-1 shrink-0 pointer-events-none">
        <div
          className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all shrink-0", selected ? "border-blue-500 bg-blue-500" : "border-[var(--border-color)] bg-transparent")}
        >
          {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
        </div>
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); log.photoDriveLink && setViewer({ driveLink: log.photoDriveLink, title: `${log.name} — Photo` }); }}
        disabled={!log.photoDriveLink}
        className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-[var(--border-color)] bg-[var(--bg-color)]"
      >
        <DriveImage driveLink={log.photoDriveLink} alt={log.name} className="w-full h-full object-cover" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h5 className="font-extrabold text-[var(--text-primary)] text-sm truncate">{log.name}</h5>
          <span className={cn(
            "text-[8px] font-black uppercase px-1.5 py-0.5 rounded border",
            log.entryType === 'New'
              ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
              : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
          )}>
            {log.entryType}
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
          {log.phone} · {log.purpose}{log.occupation && ` · ${log.occupation}`} · ID {log.visitorIdCardNumber}
          {log.numberOfPersons > 1 && ` · ${log.numberOfPersons} pax`}
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
          ) : (
            <span className="flex items-center gap-1 text-emerald-500 opacity-100 font-semibold">
              <Timer size={10} /> {elapsedSince(log.entryTime, now)} inside
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        {log.documentDriveLink && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setViewer({ driveLink: log.documentDriveLink, title: `${log.name} — Document` }); }}
            className="flex items-center gap-1 text-[10px] font-bold text-blue-500 hover:text-blue-400 underline"
          >
            <FileText size={11} /> Verify Document
          </button>
        )}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowEditModal(true); }}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[var(--bg-color)] border border-[var(--border-color)] hover:border-blue-500/30 text-[var(--text-secondary)] hover:text-blue-600 text-[9px] font-black uppercase rounded-lg transition-all active:scale-95"
            title="Edit visitor details"
          >
            <Pencil size={11} /> Edit
          </button>
          {log.phone && (
            <a
              href={`tel:${log.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black uppercase rounded-lg transition-all active:scale-95"
            >
              <Phone size={11} /> Call
            </a>
          )}
          {log.status === 'Active' && onExit && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onExit(log.logId); }}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-[9px] font-black uppercase rounded-lg transition-all active:scale-95"
            >
              <LogOut size={11} /> Mark Exit
            </button>
          )}
        </div>
      </div>

      {viewer && (
        <MediaViewerModal driveLink={viewer.driveLink} title={viewer.title} onClose={() => setViewer(null)} />
      )}

      {showEditModal && (
        <EditVisitorModal
          phone={log.phone}
          name={log.name}
          occupation={log.occupation}
          onClose={() => setShowEditModal(false)}
          onSaved={() => onProfileUpdated?.()}
        />
      )}
    </div>
  );
}

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

function isToday(iso: string): boolean {
  if (!iso) return false;
  try {
    const d = new Date(iso);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  } catch { return false; }
}

function isThisMonth(iso: string): boolean {
  if (!iso) return false;
  try {
    const d = new Date(iso);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  } catch { return false; }
}

export function AdminVisitorVerification() {
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [active, setActive] = useState<VisitorLog[]>([]);
  const [history, setHistory] = useState<VisitorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(() => !!getAuthToken());
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [datePreset, setDatePreset] = useState<DatePreset>('');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    if (!getAuthToken()) {
      setHasToken(false);
      return;
    }
    setHasToken(true);
    setLoading(true);
    setError(null);
    try {
      const [activeData, historyData] = await Promise.all([fetchActiveVisitors(), fetchVisitorLogs()]);
      setActive(activeData);
      setHistory(historyData);
    } catch (err: any) {
      setError(err.message || 'Failed to load visitor verification data.');
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

  const toggleId = (logId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) next.delete(logId);
      else next.add(logId);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((l) => l.logId)));
    }
  };

  const handleDelete = async () => {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    try {
      if (selectedIds.size === 1) {
        await deleteVisitorLog([...selectedIds][0]);
      } else {
        await bulkDeleteVisitorLogs([...selectedIds]);
      }
      setSelectedIds(new Set());
      setConfirmDelete(false);
      load();
    } catch (err: any) {
      setError(err.message || 'Failed to delete entries.');
    } finally {
      setDeleting(false);
    }
  };

  const allLogs = [...active, ...history];

  const todayLogs = allLogs.filter((l) => isToday(l.entryTime));
  const monthLogs = allLogs.filter((l) => isThisMonth(l.entryTime));

  const todayVisits = todayLogs.length;
  const todayVisitors = new Set(todayLogs.map((l) => l.phone)).size;
  const monthVisits = monthLogs.length;
  const monthVisitors = new Set(monthLogs.map((l) => l.phone)).size;
  const totalVisits = allLogs.length;
  const totalVisitors = new Set(allLogs.map((l) => l.phone)).size;

  const dateRange = getDateRange(datePreset, customFrom, customTo);

  const currentList = tab === 'active' ? active : history;
  const filtered = currentList.filter((l) => {
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

  if (!hasToken) {
    return (
      <div className="bg-white/80 dark:bg-zinc-800/10 backdrop-blur-xl rounded-3xl shadow-sm border border-[var(--border-color)] p-8 text-center">
        <KeyRound className="w-8 h-8 text-blue-500 mx-auto mb-3 opacity-70" />
        <h3 className="text-sm font-extrabold text-[var(--text-primary)] uppercase tracking-wide">Sign in Required for Live Verification</h3>
        <p className="text-xs text-[var(--text-secondary)] opacity-70 mt-1.5 max-w-md mx-auto">
          Sign out and sign back in using the email/password option on the login screen to view real gate entries, photos, and document links here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 dark:bg-zinc-800/10 backdrop-blur-xl rounded-3xl shadow-sm border border-[var(--border-color)] overflow-hidden">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-6 pb-0">
        <div className="bg-[var(--panel-bg)]/70 backdrop-blur-xl p-4 rounded-2xl border border-[var(--border-color)] shadow-sm">
          <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-2">
            <Activity size={14} className="text-blue-500" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Active Members</span>
          </div>
          <p className="text-2xl font-black text-[var(--text-primary)]">{active.length}</p>
        </div>
        <div className="bg-[var(--panel-bg)]/70 backdrop-blur-xl p-4 rounded-2xl border border-[var(--border-color)] shadow-sm">
          <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-2">
            <UserCheck size={14} className="text-emerald-500" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Today</span>
          </div>
          <div className="flex items-baseline gap-2">
            <div>
              <p className="text-2xl font-black text-[var(--text-primary)]">{todayVisits}</p>
              <p className="text-[9px] text-[var(--text-secondary)] opacity-60 font-medium">Visits</p>
            </div>
            <div className="w-px h-8 bg-[var(--border-color)]/50" />
            <div>
              <p className="text-xl font-bold text-[var(--text-primary)]">{todayVisitors}</p>
              <p className="text-[9px] text-[var(--text-secondary)] opacity-60 font-medium">Visitors</p>
            </div>
          </div>
        </div>
        <div className="bg-[var(--panel-bg)]/70 backdrop-blur-xl p-4 rounded-2xl border border-[var(--border-color)] shadow-sm">
          <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-2">
            <CalendarDays size={14} className="text-indigo-500" />
            <span className="text-[9px] font-bold uppercase tracking-wider">This Month</span>
          </div>
          <div className="flex items-baseline gap-2">
            <div>
              <p className="text-2xl font-black text-[var(--text-primary)]">{monthVisits}</p>
              <p className="text-[9px] text-[var(--text-secondary)] opacity-60 font-medium">Visits</p>
            </div>
            <div className="w-px h-8 bg-[var(--border-color)]/50" />
            <div>
              <p className="text-xl font-bold text-[var(--text-primary)]">{monthVisitors}</p>
              <p className="text-[9px] text-[var(--text-secondary)] opacity-60 font-medium">Visitors</p>
            </div>
          </div>
        </div>
        <div className="bg-[var(--panel-bg)]/70 backdrop-blur-xl p-4 rounded-2xl border border-[var(--border-color)] shadow-sm">
          <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-2">
            <Users size={14} className="text-amber-500" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Total</span>
          </div>
          <div className="flex items-baseline gap-2">
            <div>
              <p className="text-2xl font-black text-[var(--text-primary)]">{totalVisits}</p>
              <p className="text-[9px] text-[var(--text-secondary)] opacity-60 font-medium">Visits</p>
            </div>
            <div className="w-px h-8 bg-[var(--border-color)]/50" />
            <div>
              <p className="text-xl font-bold text-[var(--text-primary)]">{totalVisitors}</p>
              <p className="text-[9px] text-[var(--text-secondary)] opacity-60 font-medium">Visitors</p>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="p-6 pb-4 border-b border-[var(--border-color)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-wide">
            <ShieldCheck size={16} className="text-blue-600" /> Live Visitor Verification
          </h3>
          <p className="text-[10px] text-[var(--text-secondary)] opacity-60 mt-0.5">Real gate entries from the Google Sheets visitor log, with photo and document verification.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[var(--bg-color)]/50 border border-[var(--border-color)] rounded-xl p-1">
            <button
              type="button"
              onClick={() => { setTab('active'); setPage(1); }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all",
                tab === 'active' ? 'bg-blue-600 text-white shadow-sm' : 'text-[var(--text-secondary)]'
              )}
            >
              <Users size={12} /> Active ({active.length})
            </button>
            <button
              type="button"
              onClick={() => { setTab('history'); setPage(1); }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all",
                tab === 'history' ? 'bg-blue-600 text-white shadow-sm' : 'text-[var(--text-secondary)]'
              )}
            >
              <History size={12} /> History
            </button>
          </div>
          <button
            type="button"
            onClick={load}
            className="p-2 rounded-lg bg-[var(--bg-color)]/50 border border-[var(--border-color)] hover:border-blue-500/40 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin text-blue-500")} />
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="px-6 py-4 border-b border-[var(--border-color)] space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, phone, purpose, or ID card..."
            className="w-full pl-11 pr-4 py-2.5 text-sm bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={datePreset}
            onChange={(e) => { setDatePreset(e.target.value as DatePreset); setPage(1); }}
            className="px-3 py-2.5 text-sm bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-[var(--text-primary)] cursor-pointer"
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
                className="px-3 py-2.5 text-sm bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-[var(--text-primary)]"
                title="From date"
              />
              <span className="text-xs text-[var(--text-secondary)]">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => { setCustomTo(e.target.value); setPage(1); }}
                className="px-3 py-2.5 text-sm bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-[var(--text-primary)]"
                title="To date"
              />
            </>
          )}

          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value as TypeFilter); setPage(1); }}
            className="px-3 py-2.5 text-sm bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-[var(--text-primary)] cursor-pointer"
          >
            {TYPE_FILTERS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setPage(1); }}
            className="px-3 py-2.5 text-sm bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-[var(--text-primary)] cursor-pointer"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <select
            value={purposeFilter}
            onChange={(e) => { setPurposeFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 text-sm bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-[var(--text-primary)] cursor-pointer"
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

      <div className="divide-y divide-[var(--border-color)]/40 custom-scrollbar">
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-[var(--bg-color)]/20 border-b border-[var(--border-color)]/20">
            <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-[var(--text-secondary)] cursor-pointer select-none" onClick={toggleAll}>
              <div
                className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all shrink-0", paginated.length > 0 && selectedIds.size === paginated.length ? "border-blue-500 bg-blue-500" : "border-[var(--border-color)] bg-transparent")}
              >
                {paginated.length > 0 && selectedIds.size === paginated.length && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              Select All
            </label>
            {selectedIds.size > 0 && (
              <span className="text-[10px] text-[var(--text-secondary)]">{selectedIds.size} selected</span>
            )}
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {paginated.map((log) => (
            <motion.div key={log.logId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <VisitorRow log={log} onExit={tab === 'active' ? handleExit : undefined} selected={selectedIds.has(log.logId)} onToggle={() => toggleId(log.logId)} onProfileUpdated={load} />
            </motion.div>
          ))}
        </AnimatePresence>
        {!loading && filtered.length === 0 && (
          <p className="p-8 text-center text-xs text-[var(--text-secondary)] opacity-50">
            {search ? 'No visitors match your search.' : (tab === 'active' ? 'No visitors currently on-site.' : 'No visitor logs found.')}
          </p>
        )}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="sticky bottom-0 left-0 right-0 border-t border-[var(--border-color)] bg-[var(--panel-bg)]/95 backdrop-blur-xl px-4 py-3 flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--text-secondary)]">{selectedIds.size} record{selectedIds.size === 1 ? '' : 's'} selected</span>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={deleting}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-400 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95"
          >
            <Trash2 size={12} /> Delete Selected
          </button>
        </div>
      )}

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-6 max-w-sm w-full"
            >
              <h4 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2 mb-2">
                <Trash2 size={16} className="text-rose-500" /> Delete {selectedIds.size} record{selectedIds.size === 1 ? '' : 's'}?
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mb-5">This action cannot be undone. The selected log entries will be permanently removed.</p>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  className="px-4 py-2 text-xs font-bold text-[var(--text-secondary)] border border-[var(--border-color)] rounded-xl hover:bg-[var(--bg-color)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-400 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95"
                >
                  {deleting ? 'Deleting...' : `Delete ${selectedIds.size}`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pagination + per-view control */}
      {!loading && filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-[var(--border-color)]">
          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-2">
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
                  className={cn(
                    'w-8 h-8 rounded-lg text-xs font-bold transition-colors',
                    p === safePage ? 'bg-blue-600 text-white' : 'bg-[var(--panel-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-blue-600'
                  )}
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
          ) : (
            <span className="text-xs text-[var(--text-secondary)] opacity-60">{filtered.length} record{filtered.length === 1 ? '' : 's'}</span>
          )}

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-secondary)] opacity-60">Per view</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value) as PageSize); setPage(1); }}
              className="px-2.5 py-1.5 text-xs font-bold bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-lg outline-none focus:border-blue-500 text-[var(--text-primary)] cursor-pointer"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>{size === 'all' ? 'All' : size}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
