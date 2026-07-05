import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Search, RefreshCw, History, Wallet, RotateCw, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Bill, BillCategory, BillPayment, fetchBills, fetchAllBillHistory } from './api';
import { getDueStatus, formatDueDate, formatCurrency, FREQUENCY_LABELS } from './billUtils';
import { StatusBadge } from './BillPaymentsHub';

const CATEGORY_FILTERS = [
  { value: '', label: 'All Categories' },
  { value: 'Mobile', label: 'Mobile' },
  { value: 'Vehicle', label: 'Vehicle' },
  { value: 'Electricity', label: 'Electricity' },
] as const;
type CategoryFilter = (typeof CATEGORY_FILTERS)[number]['value'];

const BILL_STATUS_FILTERS = [
  { value: '', label: 'All Statuses' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'dueSoon', label: 'Due Soon' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
] as const;
type BillStatusFilter = (typeof BILL_STATUS_FILTERS)[number]['value'];

const PAGE_SIZE_OPTIONS = [10, 20, 50, 'all'] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

function matchesBillStatus(bill: Bill, filter: BillStatusFilter): boolean {
  if (!filter) return true;
  if (filter === 'completed') return bill.status === 'Completed';
  return bill.status !== 'Completed' && getDueStatus(bill.dueDate) === filter;
}

interface FullBillLogsPageProps {
  onBack: () => void;
}

export function FullBillLogsPage({ onBack }: FullBillLogsPageProps) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [history, setHistory] = useState<BillPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('');
  const [statusFilter, setStatusFilter] = useState<BillStatusFilter>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(20);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [billsData, historyData] = await Promise.all([fetchBills(), fetchAllBillHistory()]);
      setBills(billsData);
      setHistory(historyData);
    } catch (err: any) {
      setError(err.message || 'Failed to load bill logs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const labelForIdentifier = (identifier: string) => bills.find((b) => b.identifier === identifier)?.label || '';

  const filteredBills = bills.filter((bill) => {
    const matchesSearch =
      (bill.label || '').toLowerCase().includes(search.toLowerCase()) ||
      bill.identifier.toLowerCase().includes(search.toLowerCase()) ||
      bill.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || bill.category === categoryFilter;
    return matchesSearch && matchesCategory && matchesBillStatus(bill, statusFilter);
  });

  const filteredHistory = history.filter((payment) => {
    const label = labelForIdentifier(payment.identifier);
    const matchesSearch =
      label.toLowerCase().includes(search.toLowerCase()) ||
      payment.identifier.toLowerCase().includes(search.toLowerCase()) ||
      payment.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || payment.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(filteredBills.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedBills = pageSize === 'all' ? filteredBills : filteredBills.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [filteredBills.length, totalPages, page]);

  const overdueCount = bills.filter((b) => matchesBillStatus(b, 'overdue')).length;
  const dueSoonCount = bills.filter((b) => matchesBillStatus(b, 'dueSoon')).length;

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
            <Wallet className="text-blue-600" /> Full Bill Logs
          </h1>
          <p className="text-[var(--text-secondary)] opacity-70 text-sm mt-0.5">Complete bill status across all categories — upcoming, due, overdue, and paid.</p>
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
                placeholder="Search by label, identifier, or category..."
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
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value as CategoryFilter); setPage(1); }}
              className="px-3 py-2.5 text-sm bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-[var(--text-primary)] cursor-pointer"
            >
              {CATEGORY_FILTERS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as BillStatusFilter); setPage(1); }}
              className="px-3 py-2.5 text-sm bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-[var(--text-primary)] cursor-pointer"
            >
              {BILL_STATUS_FILTERS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            {overdueCount > 0 && (
              <span className="text-[9px] font-black uppercase px-2 py-1 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20">
                {overdueCount} overdue
              </span>
            )}
            {dueSoonCount > 0 && (
              <span className="text-[9px] font-black uppercase px-2 py-1 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                {dueSoonCount} due soon
              </span>
            )}

            {(categoryFilter || statusFilter) && (
              <button
                type="button"
                onClick={() => { setCategoryFilter(''); setStatusFilter(''); setPage(1); }}
                className="px-3 py-2.5 text-xs font-bold text-[var(--text-secondary)] hover:text-rose-500 border border-[var(--border-color)] rounded-xl transition-colors whitespace-nowrap"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {error && <p className="px-6 pt-4 text-xs text-red-500">{error}</p>}

        {/* Bills */}
        <div className="divide-y divide-[var(--border-color)]/40">
          <AnimatePresence mode="popLayout">
            {paginatedBills.map((bill) => (
              <motion.div
                key={bill.billId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 flex items-center gap-3.5 hover:bg-[var(--bg-color)]/40 transition-all"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h5 className="font-extrabold text-[var(--text-primary)] text-sm truncate">{bill.label || bill.identifier}</h5>
                    <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded border bg-blue-500/10 text-blue-500 border-blue-500/20">
                      {bill.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] opacity-70 mt-0.5 truncate">
                    {bill.identifier} {bill.subType ? `· ${bill.subType}` : ''}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-[var(--text-secondary)] opacity-60 flex-wrap">
                    <span className="flex items-center gap-1"><span className="font-bold text-[var(--text-primary)] opacity-100">Due:</span> {formatDueDate(bill.dueDate)}</span>
                    {bill.lastPaidDate && (
                      <span className="flex items-center gap-1"><span className="font-bold text-[var(--text-primary)] opacity-100">Last Paid:</span> {formatDueDate(bill.lastPaidDate)}</span>
                    )}
                    <span className="flex items-center gap-1"><RotateCw size={10} /> {FREQUENCY_LABELS[bill.frequency]}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-base font-black text-[var(--text-primary)]">{formatCurrency(bill.amount)}</span>
                  <StatusBadge bill={bill} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {!loading && filteredBills.length === 0 && (
            <p className="p-8 text-center text-xs text-[var(--text-secondary)] opacity-50">No bills match these filters.</p>
          )}
        </div>

        {/* Pagination + per-view control */}
        {!loading && filteredBills.length > 0 && (
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
              <span className="text-xs text-[var(--text-secondary)] opacity-60">{filteredBills.length} bill{filteredBills.length === 1 ? '' : 's'}</span>
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

      {/* Payment History */}
      <div className="space-y-3">
        <h2 className="text-sm font-black text-[var(--text-primary)] tracking-tight uppercase flex items-center gap-2">
          <History size={16} className="text-blue-500" /> Paid Bills History
        </h2>
        <div className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl overflow-hidden backdrop-blur-xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[11px]">
              <thead className="bg-[var(--bg-color)] text-[var(--text-secondary)] uppercase text-[9px] tracking-widest border-b border-[var(--border-color)] opacity-60">
                <tr className="h-10">
                  <th className="px-4">Paid On</th>
                  <th className="px-4">Bill</th>
                  <th className="px-4">Category</th>
                  <th className="px-4">Amount</th>
                  <th className="px-4">Paid By</th>
                </tr>
              </thead>
              <tbody className="text-[var(--text-primary)] divide-y divide-[var(--border-color)]">
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--text-secondary)] opacity-50 text-[10px]">Loading history...</td></tr>
                ) : filteredHistory.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--text-secondary)] opacity-50 text-[10px]">No payments match these filters</td></tr>
                ) : (
                  filteredHistory
                    .slice()
                    .sort((a, b) => new Date(b.paidDate).getTime() - new Date(a.paidDate).getTime())
                    .map((payment) => (
                      <tr key={payment.paymentId} className="h-11 hover:bg-blue-500/5 transition-colors">
                        <td className="px-4 font-bold">{formatDueDate(payment.paidDate)}</td>
                        <td className="px-4">
                          <span className="font-bold">{labelForIdentifier(payment.identifier) || payment.identifier}</span>
                          {labelForIdentifier(payment.identifier) && (
                            <span className="text-[9px] text-[var(--text-secondary)] opacity-60 ml-1.5">{payment.identifier}</span>
                          )}
                        </td>
                        <td className="px-4">
                          <span className="flex items-center gap-1 text-[9px] font-black uppercase px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 w-fit">
                            <CheckCircle2 size={10} /> {payment.category}
                          </span>
                        </td>
                        <td className="px-4 font-bold">{formatCurrency(payment.amount)}</td>
                        <td className="px-4 text-[var(--text-secondary)] opacity-70">{payment.paidBy}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
