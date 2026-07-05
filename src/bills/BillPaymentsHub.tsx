import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Smartphone, Car, Zap, Plus, Pencil, Trash2, CheckCircle2,
  CalendarClock, AlertTriangle, RotateCw, Wallet, RefreshCw, History,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Bill, BillCategory, BillPayment, deleteBill, fetchBills, fetchAllBillHistory, markBillPaid, updateBill } from './api';
import { getDueStatus, formatDueDate, daysUntil, formatCurrency, FREQUENCY_LABELS, addFrequencyInterval } from './billUtils';
import { BillFormModal } from './BillFormModal';
import { ApepdclFetchModal } from './ApepdclFetchModal';

const CATEGORY_TABS: { id: BillCategory; label: string; icon: any }[] = [
  { id: 'Mobile', label: 'Mobile', icon: Smartphone },
  { id: 'Vehicle', label: 'Vehicle', icon: Car },
  { id: 'Electricity', label: 'Electricity', icon: Zap },
];

function StatusBadge({ bill }: { bill: Bill }) {
  if (bill.status === 'Completed') {
    return (
      <span className="flex items-center gap-1 text-[9px] font-black uppercase px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
        <CheckCircle2 size={11} /> Completed
      </span>
    );
  }
  const status = getDueStatus(bill.dueDate);
  const days = daysUntil(bill.dueDate);
  if (status === 'overdue') {
    return (
      <span className="flex items-center gap-1 text-[9px] font-black uppercase px-2 py-1 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20">
        <AlertTriangle size={11} /> Overdue {Math.abs(days)}d
      </span>
    );
  }
  if (status === 'dueSoon') {
    return (
      <span className="flex items-center gap-1 text-[9px] font-black uppercase px-2 py-1 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
        <CalendarClock size={11} /> Due in {days}d
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[9px] font-black uppercase px-2 py-1 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
      <CalendarClock size={11} /> Upcoming
    </span>
  );
}

export function BillPaymentsHub() {
  const [activeCategory, setActiveCategory] = useState<BillCategory>('Mobile');
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editBill, setEditBill] = useState<Bill | null>(null);
  const [showDelete, setShowDelete] = useState<Bill | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [refreshingBill, setRefreshingBill] = useState<Bill | null>(null);
  const [history, setHistory] = useState<BillPayment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadBills = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchBills(activeCategory);
      setBills(data);
    } catch {
      // ignore, keep previous list
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await fetchAllBillHistory(activeCategory);
      setHistory(data);
    } catch {
      // ignore, keep previous list
    } finally {
      setHistoryLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    loadBills();
    loadHistory();
  }, [loadBills, loadHistory]);

  const handleMarkPaid = async (bill: Bill) => {
    setPayingId(bill.billId);
    try {
      await markBillPaid(bill.billId);
      await Promise.all([loadBills(), loadHistory()]);
    } catch {
      // ignore
    } finally {
      setPayingId(null);
    }
  };

  const handleApepdclFetched = async (result: { amount: number; dueDate: string; consumerName: string }) => {
    if (!refreshingBill) return;
    try {
      // APEPDCL doesn't always have next cycle's bill posted yet — if what it
      // returns isn't newer than what we already have on file, the site is
      // just showing the last (already-paid) cycle. Advance by our own
      // recurrence instead of letting the due date regress backward.
      const existingDue = refreshingBill.dueDate;
      const fetchedDue = result.dueDate;
      const dueDate = fetchedDue && (!existingDue || new Date(fetchedDue) > new Date(existingDue))
        ? fetchedDue
        : addFrequencyInterval(existingDue, refreshingBill.frequency);

      await updateBill(refreshingBill.billId, {
        amount: result.amount,
        dueDate,
        notes: result.consumerName ? `${result.consumerName} (fetched from APEPDCL)` : refreshingBill.notes,
      });
      await loadBills();
    } catch {
      // ignore
    } finally {
      setRefreshingBill(null);
    }
  };

  const handleDelete = async () => {
    if (!showDelete) return;
    try {
      await deleteBill(showDelete.billId);
      setShowDelete(null);
      await loadBills();
    } catch {
      // ignore
    }
  };

  const overdueCount = bills.filter((b) => b.status !== 'Completed' && getDueStatus(b.dueDate) === 'overdue').length;
  const dueSoonCount = bills.filter((b) => b.status !== 'Completed' && getDueStatus(b.dueDate) === 'dueSoon').length;

  const labelForIdentifier = (identifier: string) => bills.find((b) => b.identifier === identifier)?.label || '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-[var(--text-primary)] tracking-tighter uppercase flex items-center gap-3">
          <Wallet size={20} className="text-blue-500" /> Bill Payments
        </h1>
        <p className="text-[10px] font-mono text-[var(--text-secondary)] opacity-50 uppercase tracking-[0.3em] mt-1">
          Recurring bills, due dates, and payment tracking
        </p>
      </div>

      {/* Category Sub-Tabs */}
      <div className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl p-2 backdrop-blur-xl shadow-sm inline-flex gap-1 flex-wrap">
        {CATEGORY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={cn(
                'flex flex-col items-center gap-1.5 px-6 py-3 rounded-xl transition-all min-w-[92px]',
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-color)]'
              )}
            >
              <Icon size={20} className={isActive ? 'text-white' : ''} />
              <span className="text-[10px] font-bold uppercase tracking-wide">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Summary + Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[10px] font-mono text-[var(--text-secondary)] opacity-60 uppercase tracking-wider">
            {bills.length} bill{bills.length !== 1 ? 's' : ''}
          </span>
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
        </div>
        <button
          onClick={() => { setEditBill(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-500/20 w-fit"
        >
          <Plus size={14} /> Add {activeCategory} Bill
        </button>
      </div>

      {/* Bill List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 text-[10px] text-[var(--text-secondary)] opacity-50 font-mono uppercase tracking-widest">Loading bills...</div>
        ) : bills.length === 0 ? (
          <div className="col-span-full text-center py-12 text-[10px] text-[var(--text-secondary)] opacity-50 font-mono uppercase tracking-widest">No {activeCategory.toLowerCase()} bills set up yet</div>
        ) : (
          bills.map((bill) => (
            <div key={bill.billId} className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl p-4 backdrop-blur-xl shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">{bill.label || bill.identifier}</p>
                  {bill.label && (
                    <p className="text-[9px] font-mono text-[var(--text-secondary)] opacity-60 mt-0.5">{bill.identifier}</p>
                  )}
                  {bill.subType && (
                    <p className="text-[9px] font-mono text-[var(--text-secondary)] opacity-60 uppercase tracking-wider mt-0.5">{bill.subType}</p>
                  )}
                </div>
                <StatusBadge bill={bill} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-[var(--text-primary)]">{formatCurrency(bill.amount)}</span>
                <span className="text-[9px] font-black uppercase px-2 py-1 rounded-lg bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-secondary)] flex items-center gap-1">
                  <RotateCw size={10} /> {FREQUENCY_LABELS[bill.frequency]}
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-secondary)]">
                <span>Due: <span className="text-[var(--text-primary)] font-bold">{formatDueDate(bill.dueDate)}</span></span>
                {bill.lastPaidDate && <span className="opacity-60">Last paid: {formatDueDate(bill.lastPaidDate)}</span>}
              </div>

              {bill.notes && <p className="text-[10px] text-[var(--text-secondary)] opacity-70 italic">{bill.notes}</p>}

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleMarkPaid(bill)}
                  disabled={bill.status === 'Completed' || payingId === bill.billId}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[9px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95"
                >
                  <CheckCircle2 size={12} /> {payingId === bill.billId ? 'Paying...' : 'Mark Paid'}
                </button>
                {bill.category === 'Electricity' && (
                  <button
                    onClick={() => setRefreshingBill(bill)}
                    className="p-2 rounded-xl border border-[var(--border-color)] hover:bg-[var(--bg-color)] text-[var(--text-secondary)] hover:text-blue-500 transition-all"
                    title="Fetch live bill from APEPDCL"
                  >
                    <RefreshCw size={13} />
                  </button>
                )}
                <button
                  onClick={() => { setEditBill(bill); setShowForm(true); }}
                  className="p-2 rounded-xl border border-[var(--border-color)] hover:bg-[var(--bg-color)] text-[var(--text-secondary)] hover:text-blue-500 transition-all"
                  title="Edit"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => setShowDelete(bill)}
                  className="p-2 rounded-xl border border-[var(--border-color)] hover:bg-[var(--bg-color)] text-[var(--text-secondary)] hover:text-rose-500 transition-all"
                  title="Delete"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Transaction History */}
      <div className="space-y-3">
        <h2 className="text-sm font-black text-[var(--text-primary)] tracking-tight uppercase flex items-center gap-2">
          <History size={16} className="text-blue-500" /> Transaction History
        </h2>
        <div className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl overflow-hidden backdrop-blur-xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[11px]">
              <thead className="bg-[var(--bg-color)] text-[var(--text-secondary)] uppercase text-[9px] tracking-widest border-b border-[var(--border-color)] opacity-60">
                <tr className="h-10">
                  <th className="px-4">Paid On</th>
                  <th className="px-4">Bill</th>
                  <th className="px-4">Amount</th>
                  <th className="px-4">Paid By</th>
                </tr>
              </thead>
              <tbody className="text-[var(--text-primary)] divide-y divide-[var(--border-color)]">
                {historyLoading ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-[var(--text-secondary)] opacity-50 text-[10px]">Loading history...</td></tr>
                ) : history.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-[var(--text-secondary)] opacity-50 text-[10px]">No payments recorded yet for {activeCategory.toLowerCase()} bills</td></tr>
                ) : (
                  history.map((payment) => (
                    <tr key={payment.paymentId} className="h-11 hover:bg-blue-500/5 transition-colors">
                      <td className="px-4 font-bold">{formatDueDate(payment.paidDate)}</td>
                      <td className="px-4">
                        <span className="font-bold">{labelForIdentifier(payment.identifier) || payment.identifier}</span>
                        {labelForIdentifier(payment.identifier) && (
                          <span className="text-[9px] text-[var(--text-secondary)] opacity-60 ml-1.5">{payment.identifier}</span>
                        )}
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

      {refreshingBill && (
        <ApepdclFetchModal
          serviceNumber={refreshingBill.identifier}
          onClose={() => setRefreshingBill(null)}
          onSuccess={handleApepdclFetched}
        />
      )}

      {showForm && (
        <BillFormModal
          category={activeCategory}
          bill={editBill}
          onClose={() => { setShowForm(false); setEditBill(null); }}
          onSaved={loadBills}
        />
      )}

      {showDelete && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h4 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2 mb-2">
              <Trash2 size={16} className="text-rose-500" /> Delete Bill?
            </h4>
            <p className="text-xs text-[var(--text-secondary)] mb-1 font-mono">{showDelete.identifier}</p>
            <p className="text-[10px] text-[var(--text-secondary)] opacity-60 mb-5">This will remove the bill and its recurring setup. This action cannot be undone.</p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setShowDelete(null)} className="px-4 py-2 text-xs font-bold text-[var(--text-secondary)] border border-[var(--border-color)] rounded-xl hover:bg-[var(--bg-color)] transition-colors">Cancel</button>
              <button onClick={handleDelete} className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95">
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default BillPaymentsHub;
