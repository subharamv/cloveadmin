import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Radar, RotateCw, Loader2 } from 'lucide-react';
import { startApepdclLookup, refreshApepdclCaptcha, verifyApepdclCaptcha, cancelApepdclSession } from './api';
import { parseApepdclDate, parseApepdclAmount } from './billUtils';

export interface ApepdclFetchResult {
  amount: number;
  dueDate: string;
  consumerName: string;
}

interface ApepdclFetchModalProps {
  serviceNumber: string;
  onClose: () => void;
  onSuccess: (result: ApepdclFetchResult) => void;
}

// A human operator reads the CAPTCHA image served below and types it in
// themselves, exactly as they would on APEPDCL's own site — we only automate
// the surrounding navigation and parsing, never the CAPTCHA check itself.
export function ApepdclFetchModal({ serviceNumber, onClose, onSuccess }: ApepdclFetchModalProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [captchaImage, setCaptchaImage] = useState<string | null>(null);
  const [captchaInput, setCaptchaInput] = useState('');
  const [starting, setStarting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    let cancelled = false;

    (async () => {
      try {
        const result = await startApepdclLookup(serviceNumber);
        if (cancelled) {
          cancelApepdclSession(result.sessionId).catch(() => {});
          return;
        }
        setSessionId(result.sessionId);
        setCaptchaImage(result.captchaImage);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Could not reach APEPDCL');
      } finally {
        if (!cancelled) setStarting(false);
      }
    })();

    return () => {
      cancelled = true;
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceNumber]);

  const handleClose = () => {
    if (sessionId) cancelApepdclSession(sessionId).catch(() => {});
    onClose();
  };

  const handleRefreshCaptcha = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const { captchaImage } = await refreshApepdclCaptcha(sessionId);
      setCaptchaImage(captchaImage);
      setCaptchaInput('');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Could not refresh captcha');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!sessionId || !captchaInput.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await verifyApepdclCaptcha(sessionId, captchaInput.trim());
      if (result.status === 'success') {
        const parsedDue = parseApepdclDate(result.bill.dueDate);
        const amountSource = result.bill.totalAmountToPay || result.bill.presentBillAmount;
        onSuccess({
          amount: amountSource !== '' ? parseApepdclAmount(amountSource) : 0,
          dueDate: parsedDue,
          consumerName: result.bill.consumerName,
        });
      } else if (result.status === 'invalid_captcha') {
        setCaptchaImage(result.captchaImage);
        setCaptchaInput('');
        setError('Incorrect captcha — a fresh one has been loaded, try again');
      } else if (result.status === 'otp_required') {
        setError('This connection needs OTP verification on APEPDCL — please enter the bill manually');
        setSessionId(null);
      } else if (result.status === 'not_found') {
        setError('No bill found for this service number');
        setSessionId(null);
      } else {
        setError(result.status === 'error' ? result.message : 'Lookup failed');
        setSessionId(null);
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2">
            <Radar size={16} className="text-blue-500" /> Fetch Live Bill
          </h3>
          <button onClick={handleClose} className="p-1 rounded-lg hover:bg-[var(--bg-color)] text-[var(--text-secondary)]">
            <X size={16} />
          </button>
        </div>

        <p className="text-[10px] font-mono text-[var(--text-secondary)] opacity-60 mb-4">Service Number: {serviceNumber}</p>

        {starting ? (
          <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)] uppercase tracking-wider py-6 justify-center">
            <Loader2 size={14} className="animate-spin" /> Connecting to APEPDCL...
          </div>
        ) : captchaImage ? (
          <div className="space-y-3">
            <p className="text-[9px] font-black uppercase tracking-wider text-blue-500">Read the code below and type what you see</p>
            <div className="flex items-center gap-2">
              <img src={captchaImage} alt="APEPDCL captcha" className="h-10 rounded-lg border border-[var(--border-color)] bg-white" />
              <button
                type="button"
                onClick={handleRefreshCaptcha}
                disabled={loading}
                className="p-2 rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-color)] text-[var(--text-secondary)] transition-all"
                title="Refresh captcha"
              >
                <RotateCw size={13} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="Enter the code shown above"
                autoFocus
                className="flex-1 h-9 px-3 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                type="button"
                onClick={handleVerify}
                disabled={loading || !captchaInput.trim()}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all active:scale-95"
              >
                {loading ? 'Checking...' : 'Verify'}
              </button>
            </div>
          </div>
        ) : null}

        {error && <p className="text-[10px] text-rose-500 font-bold mt-3">{error}</p>}
      </div>
    </div>,
    document.body
  );
}
