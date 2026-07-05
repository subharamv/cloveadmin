import { useState, useEffect, FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Smartphone, Car, Zap, Radar } from 'lucide-react';
import { Bill, BillCategory, BillFrequency, createBill, updateBill } from './api';
import { VEHICLE_BILL_TYPES, FREQUENCY_LABELS, addFrequencyInterval } from './billUtils';
import { ApepdclFetchModal } from './ApepdclFetchModal';

const CATEGORY_META: Record<BillCategory, { label: string; icon: any; identifierLabel: string; placeholder: string }> = {
  Mobile: { label: 'Mobile Recharge', icon: Smartphone, identifierLabel: 'Mobile Number', placeholder: 'e.g. 9876543210' },
  Vehicle: { label: 'Vehicle Bill', icon: Car, identifierLabel: 'Vehicle Number', placeholder: 'e.g. KA01AB1234' },
  Electricity: { label: 'Electricity Bill', icon: Zap, identifierLabel: 'Consumer / Account Number', placeholder: 'e.g. 123456789' },
};

const FREQUENCY_OPTIONS: BillFrequency[] = ['Monthly', 'Quarterly', 'HalfYearly', 'Annually', 'OneTime'];

interface BillFormModalProps {
  category: BillCategory;
  bill?: Bill | null;
  onClose: () => void;
  onSaved: () => void;
}

export function BillFormModal({ category, bill, onClose, onSaved }: BillFormModalProps) {
  const meta = CATEGORY_META[category];
  const isEdit = !!bill;

  const [label, setLabel] = useState(bill?.label || '');
  const [identifier, setIdentifier] = useState(bill?.identifier || '');
  const [subType, setSubType] = useState(bill?.subType || VEHICLE_BILL_TYPES[0]);
  const [amount, setAmount] = useState(bill ? String(bill.amount) : '');
  const [frequency, setFrequency] = useState<BillFrequency>(bill?.frequency || 'Monthly');
  const [dueDate, setDueDate] = useState(bill?.dueDate || '');
  const [notes, setNotes] = useState(bill?.notes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showApepdclModal, setShowApepdclModal] = useState(false);
  const [apepdclError, setApepdclError] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleOpenApepdclModal = () => {
    if (!identifier.trim()) {
      setApepdclError('Enter the service number above first');
      return;
    }
    setApepdclError(null);
    setShowApepdclModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!identifier || !amount || !dueDate) return;
    setLoading(true);
    setError(null);
    try {
      const payload = {
        category,
        subType: category === 'Vehicle' ? subType : '',
        identifier: identifier.trim(),
        amount: Number(amount),
        frequency,
        dueDate,
        notes,
        label: category === 'Mobile' ? label.trim() : '',
      };
      if (isEdit && bill) {
        await updateBill(bill.billId, payload);
      } else {
        await createBill(payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save bill');
    } finally {
      setLoading(false);
    }
  };

  const Icon = meta.icon;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2">
            <Icon size={16} className="text-blue-500" /> {isEdit ? 'Edit' : 'Add'} {meta.label}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--bg-color)] text-[var(--text-secondary)]">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {category === 'Mobile' && (
            <div>
              <label className="text-[9px] font-black uppercase tracking-wider text-[var(--text-secondary)] block mb-1">Name / Label</label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full h-9 px-3 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="e.g. Dad's Airtel, Office SIM"
              />
            </div>
          )}
          <div>
            <label className="text-[9px] font-black uppercase tracking-wider text-[var(--text-secondary)] block mb-1">{meta.identifierLabel}</label>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="w-full h-9 px-3 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-colors"
              placeholder={meta.placeholder}
            />
          </div>

          {category === 'Electricity' && (
            <button
              type="button"
              onClick={handleOpenApepdclModal}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[var(--bg-color)] border border-blue-500/30 hover:border-blue-500 text-blue-500 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95"
            >
              <Radar size={13} /> Fetch Live Bill from APEPDCL
            </button>
          )}

          {category === 'Electricity' && apepdclError && (
            <p className="text-[10px] text-rose-500 font-bold -mt-2">{apepdclError}</p>
          )}

          {category === 'Vehicle' && (
            <div>
              <label className="text-[9px] font-black uppercase tracking-wider text-[var(--text-secondary)] block mb-1">Bill Type</label>
              <select
                value={subType}
                onChange={(e) => setSubType(e.target.value)}
                className="w-full h-9 px-3 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-colors"
              >
                {VEHICLE_BILL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-black uppercase tracking-wider text-[var(--text-secondary)] block mb-1">Amount (₹)</label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                type="number"
                min="0"
                step="0.01"
                className="w-full h-9 px-3 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-wider text-[var(--text-secondary)] block mb-1">{isEdit ? 'Next Due Date' : 'Due Date'}</label>
              <input
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                type="date"
                className="w-full h-9 px-3 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-[9px] font-black uppercase tracking-wider text-[var(--text-secondary)] block mb-1">Recurring Setup</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as BillFrequency)}
              className="w-full h-9 px-3 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-colors"
            >
              {FREQUENCY_OPTIONS.map((f) => <option key={f} value={f}>{FREQUENCY_LABELS[f]}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[9px] font-black uppercase tracking-wider text-[var(--text-secondary)] block mb-1">Notes (optional)</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-9 px-3 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Any additional details"
            />
          </div>

          {error && <p className="text-[10px] text-rose-500 font-bold">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-[var(--text-secondary)] border border-[var(--border-color)] rounded-xl hover:bg-[var(--bg-color)] transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95">
              {loading ? 'Saving...' : <><Save size={12} /> {isEdit ? 'Save' : 'Create'}</>}
            </button>
          </div>
        </form>
      </div>

      {showApepdclModal && (
        <ApepdclFetchModal
          serviceNumber={identifier.trim()}
          onClose={() => setShowApepdclModal(false)}
          onSuccess={(result) => {
            // If APEPDCL hasn't posted the next cycle yet, don't let the due
            // date regress backward from what's already on file.
            const fetchedDue = result.dueDate;
            const nextDueDate = fetchedDue && (!dueDate || new Date(fetchedDue) > new Date(dueDate))
              ? fetchedDue
              : (dueDate ? addFrequencyInterval(dueDate, frequency) : fetchedDue);
            if (nextDueDate) setDueDate(nextDueDate);
            setAmount(String(result.amount));
            if (result.consumerName) setNotes(`${result.consumerName} (fetched from APEPDCL)`);
            setShowApepdclModal(false);
          }}
        />
      )}
    </div>,
    document.body
  );
}
