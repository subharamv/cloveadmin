import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, QrCode, Loader2 } from 'lucide-react';

interface QrScanModalProps {
  title?: string;
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

const ELEMENT_ID = 'qr-scan-region';

export function QrScanModal({ title = 'Scan Visitor QR', onScan, onClose }: QrScanModalProps) {
  const scannerRef = useRef<any>(null);
  const hasScannedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled) return;
        const scanner = new Html5Qrcode(ELEMENT_ID);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText: string) => {
            if (hasScannedRef.current) return;
            hasScannedRef.current = true;
            scanner.pause(true);
            onScan(decodedText);
          },
          () => {
            // per-frame "no QR found" callback — expected constantly while aiming, ignore
          }
        );
        if (!cancelled) setReady(true);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Could not access the camera.');
      }
    })();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      if (scanner) {
        scanner.stop().then(() => scanner.clear()).catch(() => {});
      }
    };
  }, [onScan]);

  return createPortal(
    <div className="fixed inset-0 z-[400] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-3xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="flex items-center gap-2 font-black text-sm text-[var(--text-primary)] uppercase tracking-wide">
            <QrCode className="w-4 h-4" /> {title}
          </h3>
          <button type="button" onClick={onClose} className="p-2 rounded-lg bg-[var(--bg-color)] hover:bg-rose-500/10 text-[var(--text-secondary)] hover:text-rose-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error ? (
          <p className="text-sm text-red-500 font-medium text-center py-8">{error}</p>
        ) : (
          <>
            {!ready && (
              <div className="flex flex-col items-center justify-center gap-2 py-6 text-[var(--text-secondary)]">
                <Loader2 className="w-5 h-5 animate-spin" />
                <p className="text-xs">Starting camera...</p>
              </div>
            )}
            <div id={ELEMENT_ID} className="rounded-2xl overflow-hidden" />
            <p className="text-xs text-[var(--text-secondary)] text-center mt-3 opacity-70">Point the camera at the visitor's QR pass</p>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
