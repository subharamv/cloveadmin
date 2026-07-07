import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Phone, UserCheck, Loader2, CalendarClock, Building2 } from 'lucide-react';
import { fetchExpectedVisitors, checkInVisitor, VisitorLog } from './api';
import { CameraCapture } from './CameraCapture';
import { DriveImage } from './DriveImage';
import { MediaViewerModal } from './MediaViewerModal';

interface ExpectedVisitorsProps {
  onCheckedIn?: () => void;
}

export function ExpectedVisitors({ onCheckedIn }: ExpectedVisitorsProps) {
  const [expected, setExpected] = useState<VisitorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [capturingFor, setCapturingFor] = useState<VisitorLog | null>(null);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ driveLink: string; title: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchExpectedVisitors();
      setExpected(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load pre-registered guests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, [load]);

  const handleCapture = async (file: File) => {
    if (!capturingFor) return;
    setCheckingInId(capturingFor.logId);
    setCapturingFor(null);
    try {
      await checkInVisitor(capturingFor.logId, file);
      setExpected((prev) => prev.filter((e) => e.logId !== capturingFor.logId));
      onCheckedIn?.();
    } catch (err: any) {
      setError(err.message || 'Failed to check in guest.');
    } finally {
      setCheckingInId(null);
    }
  };

  if (!loading && expected.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wide flex items-center gap-2 mb-3">
        <CalendarClock className="w-4 h-4 text-amber-500" /> Pre-Registered — Awaiting Arrival ({expected.length})
      </h2>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="space-y-3">
        <AnimatePresence>
          {expected.map((guest) => (
            <motion.div
              key={guest.logId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 flex items-center gap-4"
            >
              <button
                type="button"
                onClick={() => guest.photoDriveLink && setViewer({ driveLink: guest.photoDriveLink, title: `${guest.name || guest.phone} — Photo` })}
                disabled={!guest.photoDriveLink}
                className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-amber-500/20 bg-amber-500/10"
              >
                {guest.photoDriveLink ? (
                  <DriveImage driveLink={guest.photoDriveLink} alt={guest.name || guest.phone} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-amber-600">
                    <CalendarClock className="w-5 h-5" />
                  </div>
                )}
              </button>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[var(--text-primary)] truncate">{guest.name || guest.phone}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-secondary)] flex-wrap">
                  {guest.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{guest.phone}</span>}
                  {guest.expectedTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{guest.expectedTime}</span>}
                  {guest.host && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{guest.host}</span>}
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">{guest.purpose}</p>
              </div>

              <button
                type="button"
                onClick={() => setCapturingFor(guest)}
                disabled={checkingInId === guest.logId}
                className="shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase rounded-xl transition-all active:scale-95 disabled:opacity-50"
              >
                {checkingInId === guest.logId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                Check In
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {capturingFor && (
        <CameraCapture onCapture={handleCapture} onClose={() => setCapturingFor(null)} />
      )}

      {viewer && (
        <MediaViewerModal driveLink={viewer.driveLink} title={viewer.title} onClose={() => setViewer(null)} />
      )}
    </div>
  );
}
