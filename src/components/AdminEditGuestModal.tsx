import { useState, FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { X, Pencil, Loader2 } from 'lucide-react';
import { updatePreRegistration } from '../security/api';
import { VisitorLog } from '../security/api';

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

interface AdminEditGuestModalProps {
  guest: VisitorLog;
  onClose: () => void;
  onUpdated: () => void;
}

export function AdminEditGuestModal({ guest, onClose, onUpdated }: AdminEditGuestModalProps) {
  const [name, setName] = useState(guest.name || '');
  const [phone, setPhone] = useState(guest.phone || '');
  const [purpose, setPurpose] = useState(PURPOSE_OPTIONS.includes(guest.purpose) ? guest.purpose : PURPOSE_OPTIONS[0]);
  const [host, setHost] = useState(guest.host || '');
  const [expectedTime, setExpectedTime] = useState(guest.expectedTime || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() && !phone.trim()) {
      setError('Provide at least a guest name or phone number.');
      return;
    }

    setSubmitting(true);
    try {
      await updatePreRegistration(guest.logId, {
        name: name.trim(),
        phone: phone.trim(),
        purpose,
        host,
        expectedTime,
      });
      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update guest details.');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-3xl shadow-2xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-[var(--text-primary)] uppercase tracking-wide">Edit Guest Details</h3>
              <p className="text-[10px] text-[var(--text-secondary)] opacity-70">Updates the pre-registration before arrival</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg bg-[var(--bg-color)] hover:bg-rose-500/10 text-[var(--text-secondary)] hover:text-rose-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">
              Guest Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Hunter"
              className="w-full px-4 py-3 text-sm bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">
              Phone
            </label>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="10-digit mobile number"
              maxLength={10}
              className="w-full px-4 py-3 text-sm bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">
              Purpose of Visit
            </label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-4 py-3 text-sm bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
            >
              {PURPOSE_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">
                Host (Dept)
              </label>
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="Sarah Chen (HR)"
                className="w-full px-4 py-3 text-sm bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">
                ETA
              </label>
              <input
                type="text"
                value={expectedTime}
                onChange={(e) => setExpectedTime(e.target.value)}
                placeholder="10:30 AM"
                className="w-full px-4 py-3 text-sm bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm uppercase tracking-wide py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </motion.div>
    </div>,
    document.body
  );
}
