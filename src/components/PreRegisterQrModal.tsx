import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { QRCodeCanvas } from 'qrcode.react';
import { X, Loader2, Copy, Check, Download, MessageCircle, Clock } from 'lucide-react';
import { generatePreRegisterLink } from '../security/api';

interface PreRegisterQrModalProps {
  onClose: () => void;
}

export function PreRegisterQrModal({ onClose }: PreRegisterQrModalProps) {
  const [link, setLink] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const canvasWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await generatePreRegisterLink();
        if (cancelled) return;
        setLink(result.link);
        setExpiresAt(result.expiresAt);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to generate link.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCopy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    if (!link) return;
    const message = `You've been invited! Please pre-register for your visit using this link (valid for 24 hours): ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleDownload = () => {
    const canvas = canvasWrapRef.current?.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'visitor-preregister-qr.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return createPortal(
    <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-3xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-black text-sm text-[var(--text-primary)] uppercase tracking-wide">Guest Self Pre-Registration</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-lg bg-[var(--bg-color)] hover:bg-rose-500/10 text-[var(--text-secondary)] hover:text-rose-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-[var(--text-secondary)]">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-xs">Generating link...</p>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500 font-medium text-center py-6">{error}</p>
        )}

        {link && !loading && (
          <div className="space-y-4">
            <div ref={canvasWrapRef} className="flex items-center justify-center bg-white p-4 rounded-2xl border border-[var(--border-color)]">
              <QRCodeCanvas value={link} size={200} level="M" />
            </div>

            {expiresAt && (
              <p className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-600">
                <Clock className="w-3 h-3" /> Expires {new Date(expiresAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}

            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)]">
              <input
                type="text"
                readOnly
                value={link}
                className="flex-1 min-w-0 bg-transparent text-xs text-[var(--text-secondary)] outline-none truncate"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--panel-bg)] border border-[var(--border-color)] hover:border-blue-500/40 text-xs font-bold text-[var(--text-secondary)] hover:text-blue-600 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wide transition-all active:scale-[0.98]"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)] hover:border-blue-500/40 text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)] hover:text-blue-600 transition-all active:scale-[0.98]"
              >
                <Download className="w-4 h-4" /> Download QR
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>,
    document.body
  );
}
