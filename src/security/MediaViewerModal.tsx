import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Loader2, FileWarning } from 'lucide-react';
import { fetchDriveFile } from './api';

interface MediaViewerModalProps {
  driveLink: string;
  title: string;
  onClose: () => void;
}

function extensionForMimeType(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('image/')) return mimeType.split('/')[1].split('+')[0];
  return 'file';
}

export function MediaViewerModal({ driveLink, title, onClose }: MediaViewerModalProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    fetchDriveFile(driveLink)
      .then((file) => {
        if (cancelled) {
          URL.revokeObjectURL(file.url);
          return;
        }
        objectUrl = file.url;
        setUrl(file.url);
        setMimeType(file.mimeType);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load file');
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [driveLink]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleDownload = () => {
    if (!url) return;
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${title.replace(/[^a-zA-Z0-9]+/g, '_')}.${extensionForMimeType(mimeType)}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const isImage = mimeType.startsWith('image/');
  const isPdf = mimeType === 'application/pdf';

  return createPortal(
    <div
      className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 p-4 border-b border-[var(--border-color)] shrink-0">
          <h3 className="font-bold text-sm text-[var(--text-primary)] truncate">{title}</h3>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!url}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase transition-all disabled:opacity-40"
              title="Download"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-[var(--bg-color)] hover:bg-rose-500/10 text-[var(--text-secondary)] hover:text-rose-500 transition-all"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-[300px] overflow-auto flex items-center justify-center bg-[var(--bg-color)]/40 p-4">
          {!url && !error && <Loader2 className="w-8 h-8 animate-spin text-blue-500" />}
          {error && (
            <div className="text-center text-[var(--text-secondary)]">
              <FileWarning className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          {url && isImage && (
            <img src={url} alt={title} className="max-w-full max-h-[75vh] object-contain rounded-lg" />
          )}
          {url && isPdf && (
            <iframe src={url} title={title} className="w-full h-[75vh] rounded-lg bg-white" />
          )}
          {url && !isImage && !isPdf && (
            <div className="text-center text-[var(--text-secondary)]">
              <FileWarning className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Preview not available for this file type.</p>
              <p className="text-xs mt-1 opacity-70">Use the download button above.</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
