import { useState } from 'react';
import { X, Loader2, Save, User } from 'lucide-react';
import { createPortal } from 'react-dom';
import { OccupationField } from './OccupationField';
import { updateVisitorProfile, VisitorRecord } from './api';

interface EditVisitorModalProps {
  phone: string;
  name: string;
  occupation: string;
  onClose: () => void;
  onSaved: (visitor: VisitorRecord) => void;
}

export function EditVisitorModal({ phone, name: initialName, occupation: initialOccupation, onClose, onSaved }: EditVisitorModalProps) {
  const [name, setName] = useState(initialName);
  const [occupation, setOccupation] = useState(initialOccupation);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await updateVisitorProfile({ phone, name: name.trim(), occupation: occupation.trim() });
      onSaved(result.visitor);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update visitor.');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-extrabold text-[var(--text-primary)] uppercase tracking-wide">Edit Visitor Details</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-color)] text-[var(--text-secondary)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">
              <User className="w-3.5 h-3.5" /> Visitor Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full px-4 py-3 text-sm bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <OccupationField value={occupation} onChange={setOccupation} />

          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm uppercase tracking-wide py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
