import { useState, FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { X, UserPlus, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { PhoneSearchField } from '../security/PhoneSearchField';
import { createPreRegistration } from '../security/api';

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

interface AdminPreRegisterModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export function AdminPreRegisterModal({ onClose, onCreated }: AdminPreRegisterModalProps) {
  const [phone, setPhone] = useState('');
  const [matchedName, setMatchedName] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [purpose, setPurpose] = useState(PURPOSE_OPTIONS[0]);
  const [host, setHost] = useState('');
  const [expectedTime, setExpectedTime] = useState('');
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
      await createPreRegistration({ name: name.trim(), phone: phone.trim(), purpose, host, expectedTime });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to pre-register guest.');
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
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-[var(--text-primary)] uppercase tracking-wide">Pre-Register Guest</h3>
              <p className="text-[10px] text-[var(--text-secondary)] opacity-70">Sends to the security check-in dashboard</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg bg-[var(--bg-color)] hover:bg-rose-500/10 text-[var(--text-secondary)] hover:text-rose-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <PhoneSearchField
            value={phone}
            matchedName={matchedName}
            onChange={(newPhone, matched) => {
              setPhone(newPhone);
              setMatchedName(matched);
              if (matched) setName(matched);
            }}
          />

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

          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide"
          >
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showDetails ? 'Hide details' : 'Add more details (optional)'}
          </button>

          {showDetails && (
            <div className="space-y-4 pt-1">
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
            </div>
          )}

          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm uppercase tracking-wide py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {submitting ? 'Sending...' : 'Authorize Pre-Registration'}
          </button>
        </form>
      </motion.div>
    </div>,
    document.body
  );
}
