import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Camera, RotateCw } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setError(null);
    } catch {
      setError('Camera access denied. Please allow camera permissions and try again.');
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [facingMode, startCamera]);

  const flip = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
        onCapture(file);
      },
      'image/jpeg',
      0.92,
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <button type="button" onClick={onClose} className="text-white/70 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
        <span className="text-sm font-bold text-white">Capture Photo</span>
        <button type="button" onClick={flip} className="text-white/70 hover:text-white transition-colors">
          <RotateCw className="w-5 h-5" />
        </button>
      </div>

      {error ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-red-400 text-sm text-center">{error}</p>
        </div>
      ) : (
        <div className="flex-1 relative flex items-center justify-center bg-black">
          <video ref={videoRef} autoPlay playsInline className="max-h-full max-w-full" />
        </div>
      )}

      <div className="flex justify-center py-6 bg-black/80">
        <button
          type="button"
          onClick={capture}
          disabled={!!error}
          className="w-16 h-16 rounded-full bg-white flex items-center justify-center disabled:opacity-40 transition-transform active:scale-90"
        >
          <Camera className="w-7 h-7 text-black" />
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
