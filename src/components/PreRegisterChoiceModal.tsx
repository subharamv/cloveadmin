import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { X, UserPlus, QrCode } from 'lucide-react';

interface PreRegisterChoiceModalProps {
  onClose: () => void;
  onChooseManual: () => void;
  onChooseQr: () => void;
}

export function PreRegisterChoiceModal({ onClose, onChooseManual, onChooseQr }: PreRegisterChoiceModalProps) {
  return createPortal(
    <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-3xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-black text-sm text-[var(--text-primary)] uppercase tracking-wide">Pre-Register Guest</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-lg bg-[var(--bg-color)] hover:bg-rose-500/10 text-[var(--text-secondary)] hover:text-rose-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={onChooseManual}
            className="w-full flex items-center gap-3 p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-color)] hover:border-blue-500/40 hover:bg-blue-500/5 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-[var(--text-primary)]">Enter Manually</p>
              <p className="text-xs text-[var(--text-secondary)] opacity-70">You fill in the guest's details yourself</p>
            </div>
          </button>

          <button
            type="button"
            onClick={onChooseQr}
            className="w-full flex items-center gap-3 p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-color)] hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-[var(--text-primary)]">Generate QR / Link</p>
              <p className="text-xs text-[var(--text-secondary)] opacity-70">Share a link (expires in 24h) so the guest registers themselves</p>
            </div>
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
