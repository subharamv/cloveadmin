import { useState, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { fetchDriveFileBlobUrl } from './api';

interface DriveImageProps {
  driveLink: string;
  alt: string;
  className?: string;
}

export function DriveImage({ driveLink, alt, className }: DriveImageProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    setBlobUrl(null);
    setFailed(false);

    if (!driveLink) {
      setFailed(true);
      return;
    }

    fetchDriveFileBlobUrl(driveLink)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setBlobUrl(url);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [driveLink]);

  if (failed || !driveLink) {
    return (
      <div className={`flex items-center justify-center bg-[var(--bg-color)] ${className || ''}`}>
        <ImageIcon className="w-5 h-5 text-[var(--text-secondary)] opacity-30" />
      </div>
    );
  }

  if (!blobUrl) {
    return <div className={`bg-[var(--bg-color)] animate-pulse ${className || ''}`} />;
  }

  return <img src={blobUrl} alt={alt} className={className} onError={() => setFailed(true)} />;
}
