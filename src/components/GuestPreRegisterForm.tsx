import { useState, useEffect, useRef, FormEvent } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { ShieldCheck, Loader2, CheckCircle2, User, Phone, ClipboardList, FileText, Image as ImageIcon, Upload, Camera, Users, Minus, Plus, Pencil, Download } from 'lucide-react';
import { OccupationField } from '../security/OccupationField';
import { CameraCapture } from '../security/CameraCapture';

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

const DOCUMENT_TYPES = ['Aadhaar', 'PAN Card', 'Passport', 'Driving Licence', 'Company ID', 'Other'];

const MAX_PERSONS = 20;

type Step = 'form' | 'preview' | 'done';

export function GuestPreRegisterForm() {
  const token = new URLSearchParams(window.location.search).get('token') || '';

  const [step, setStep] = useState<Step>('form');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState(PURPOSE_OPTIONS[0]);
  const [purposeOther, setPurposeOther] = useState('');
  const [occupation, setOccupation] = useState('');
  const [documentType, setDocumentType] = useState(DOCUMENT_TYPES[0]);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentFileName, setDocumentFileName] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);
  const [numberOfPersons, setNumberOfPersons] = useState(1);
  const [showCamera, setShowCamera] = useState(false);
  const [showDocCamera, setShowDocCamera] = useState(false);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const docUploadRef = useRef<HTMLInputElement>(null);
  const photoUploadRef = useRef<HTMLInputElement>(null);
  const qrCanvasWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const handlePersonsChange = (next: number) => {
    setNumberOfPersons(Math.max(1, Math.min(MAX_PERSONS, next)));
  };

  const finalPurpose = purpose === 'Other' ? purposeOther.trim() : purpose;

  const handleReview = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !phone.trim() || !finalPurpose || !occupation.trim() || !documentType) {
      setError('Please fill in all required fields.');
      return;
    }
    if (phone.trim().length !== 10) {
      setError('Mobile number must be 10 digits.');
      return;
    }
    if (!documentFile) {
      setError('Document proof is required.');
      return;
    }
    if (!photoFile) {
      setError('A photo is required.');
      return;
    }

    setError(null);
    setStep('preview');
  };

  const handleConfirmSubmit = async () => {
    if (!documentFile || !photoFile) return;
    setError(null);
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set('token', token);
      formData.set('name', name.trim());
      formData.set('phone', phone.trim());
      formData.set('purpose', finalPurpose);
      formData.set('occupation', occupation.trim());
      formData.set('documentType', documentType);
      formData.set('numberOfPersons', String(numberOfPersons));
      formData.set('documentFile', documentFile);
      formData.set('photoFile', photoFile);

      const res = await fetch('/api/visitors/guest-preregister', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit your pre-registration.');
      setStep('done');
    } catch (err: any) {
      setError(err.message || 'Failed to submit your pre-registration.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadQr = () => {
    const qrCanvas = qrCanvasWrapRef.current?.querySelector('canvas');
    if (!qrCanvas) return;

    // Compose a standalone image: white card, the QR, and the visitor's name
    // printed underneath, so the downloaded file is self-explanatory on its own.
    const padding = 24;
    const qrSize = qrCanvas.width;
    const nameFontSize = 22;
    const canvas = document.createElement('canvas');
    canvas.width = qrSize + padding * 2;
    canvas.height = qrSize + padding * 2 + nameFontSize + 20;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(qrCanvas, padding, padding);
    ctx.fillStyle = '#111111';
    ctx.font = `bold ${nameFontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(name.trim(), canvas.width / 2, qrSize + padding + nameFontSize + 4);

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.trim().replace(/\s+/g, '_') || 'visitor'}_pass.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] flex items-center justify-center p-4">
        <p className="text-sm text-red-500 font-medium">This registration link is missing or invalid.</p>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-3xl shadow-xl p-8 text-center">
          <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg mb-4 mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h1 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight">Thank You, {name.trim()}!</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-2">You're pre-registered. Show this QR to security at the gate on arrival.</p>

          <div ref={qrCanvasWrapRef} className="flex flex-col items-center justify-center bg-white p-5 rounded-2xl border border-[var(--border-color)] mt-5">
            <QRCodeCanvas value={phone.trim()} size={180} level="M" />
            <p className="mt-3 font-bold text-base text-black">{name.trim()}</p>
          </div>

          <div className="mt-5 text-left text-xs text-[var(--text-secondary)] space-y-1 bg-[var(--bg-color)] rounded-xl p-4 border border-[var(--border-color)]">
            <p><span className="font-bold text-[var(--text-primary)]">Phone:</span> {phone.trim()}</p>
            <p><span className="font-bold text-[var(--text-primary)]">Purpose:</span> {finalPurpose}</p>
            <p><span className="font-bold text-[var(--text-primary)]">Occupation:</span> {occupation.trim()}</p>
            {numberOfPersons > 1 && <p><span className="font-bold text-[var(--text-primary)]">Persons:</span> {numberOfPersons}</p>}
          </div>

          <button
            type="button"
            onClick={handleDownloadQr}
            className="w-full mt-5 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm uppercase tracking-wide py-3.5 rounded-xl transition-all active:scale-[0.98]"
          >
            <Download className="w-4 h-4" /> Download QR Pass
          </button>
        </div>
      </div>
    );
  }

  if (step === 'preview') {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] flex items-center justify-center p-4 py-10">
        <div className="w-full max-w-sm md:max-w-lg bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-3xl shadow-xl p-6 md:p-8">
          <div className="flex flex-col items-center mb-6">
            <h1 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">Review Your Details</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1 text-center">Double-check everything before submitting</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
            {photoPreviewUrl && (
              <img
                src={photoPreviewUrl}
                alt={name}
                className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl object-cover border border-[var(--border-color)] shrink-0"
              />
            )}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div><span className="text-xs font-bold text-[var(--text-secondary)] uppercase block">Name</span>{name}</div>
              <div><span className="text-xs font-bold text-[var(--text-secondary)] uppercase block">Phone</span>{phone}</div>
              <div><span className="text-xs font-bold text-[var(--text-secondary)] uppercase block">Purpose</span>{finalPurpose}</div>
              <div><span className="text-xs font-bold text-[var(--text-secondary)] uppercase block">Occupation</span>{occupation}</div>
              <div><span className="text-xs font-bold text-[var(--text-secondary)] uppercase block">Document Type</span>{documentType}</div>
              <div><span className="text-xs font-bold text-[var(--text-secondary)] uppercase block">Document File</span>{documentFileName}</div>
              <div><span className="text-xs font-bold text-[var(--text-secondary)] uppercase block">Persons</span>{numberOfPersons}</div>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 font-medium mt-4">{error}</p>}

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              type="button"
              onClick={() => setStep('form')}
              className="flex-1 flex items-center justify-center gap-2 border border-[var(--border-color)] bg-[var(--bg-color)] hover:bg-blue-50 text-[var(--text-secondary)] hover:text-blue-600 font-bold text-sm uppercase tracking-wide py-3.5 rounded-xl transition-all active:scale-[0.98]"
            >
              <Pencil className="w-4 h-4" /> Edit Details
            </button>
            <button
              type="button"
              onClick={handleConfirmSubmit}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm uppercase tracking-wide py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {submitting ? 'Submitting...' : 'Confirm & Submit'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-color)] flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-sm md:max-w-2xl bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-3xl shadow-xl p-6 md:p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg mb-4">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">Visitor Pre-Registration</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 text-center">Fill in your details ahead of your visit</p>
        </div>

        <form onSubmit={handleReview} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">
                <User className="w-3.5 h-3.5" /> Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                className="w-full px-4 py-3.5 text-base bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">
                <Phone className="w-3.5 h-3.5" /> Mobile Number
              </label>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="10-digit mobile number"
                maxLength={10}
                required
                className="w-full px-4 py-3.5 text-base bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">
                <ClipboardList className="w-3.5 h-3.5" /> Purpose of Visit
              </label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-4 py-3.5 text-base bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
              >
                {PURPOSE_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {purpose === 'Other' && (
                <input
                  type="text"
                  value={purposeOther}
                  onChange={(e) => setPurposeOther(e.target.value)}
                  placeholder="Specify purpose"
                  required
                  className="w-full mt-2 px-4 py-3 text-sm bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              )}
            </div>

            <OccupationField value={occupation} onChange={setOccupation} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">
                Document Type
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-4 py-3.5 text-base bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
              >
                {DOCUMENT_TYPES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">
                <Users className="w-3.5 h-3.5" /> Number of Persons
              </label>
              <div className="flex items-center gap-3 h-[52px]">
                <button
                  type="button"
                  onClick={() => handlePersonsChange(numberOfPersons - 1)}
                  disabled={numberOfPersons <= 1}
                  className="w-11 h-11 flex items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-secondary)] hover:text-blue-600 hover:border-blue-500/30 disabled:opacity-30 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center text-lg font-black text-[var(--text-primary)]">{numberOfPersons}</span>
                <button
                  type="button"
                  onClick={() => handlePersonsChange(numberOfPersons + 1)}
                  disabled={numberOfPersons >= MAX_PERSONS}
                  className="w-11 h-11 flex items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-secondary)] hover:text-blue-600 hover:border-blue-500/30 disabled:opacity-30 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <span className="text-xs text-[var(--text-secondary)] opacity-70">{numberOfPersons === 1 ? 'person' : 'people'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">
                <FileText className="w-3.5 h-3.5" /> Document Proof
              </label>
              <input
                ref={docUploadRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setDocumentFile(file);
                  setDocumentFileName(file ? file.name : null);
                }}
                className="hidden"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => docUploadRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)] hover:bg-blue-50 text-[var(--text-secondary)] hover:text-blue-600 text-sm font-bold transition-colors"
                >
                  <Upload className="w-4 h-4" /> Upload
                </button>
                <button
                  type="button"
                  onClick={() => setShowDocCamera(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)] hover:bg-emerald-50 text-[var(--text-secondary)] hover:text-emerald-600 text-sm font-bold transition-colors"
                >
                  <Camera className="w-4 h-4" /> Photo
                </button>
              </div>
              {showDocCamera && (
                <CameraCapture
                  onCapture={(file) => {
                    setDocumentFile(file);
                    setDocumentFileName(file.name);
                    setShowDocCamera(false);
                  }}
                  onClose={() => setShowDocCamera(false)}
                />
              )}
              {documentFileName && (
                <p className="mt-1 text-xs text-[var(--text-secondary)] truncate">{documentFileName}</p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">
                <ImageIcon className="w-3.5 h-3.5" /> Your Photo
              </label>
              <input
                ref={photoUploadRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setPhotoFile(file);
                  setPhotoFileName(file ? file.name : null);
                }}
                className="hidden"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => photoUploadRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)] hover:bg-blue-50 text-[var(--text-secondary)] hover:text-blue-600 text-sm font-bold transition-colors"
                >
                  <Upload className="w-4 h-4" /> Upload
                </button>
                <button
                  type="button"
                  onClick={() => setShowCamera(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)] hover:bg-emerald-50 text-[var(--text-secondary)] hover:text-emerald-600 text-sm font-bold transition-colors"
                >
                  <Camera className="w-4 h-4" /> Photo
                </button>
              </div>
              {showCamera && (
                <CameraCapture
                  onCapture={(file) => {
                    setPhotoFile(file);
                    setPhotoFileName(file.name);
                    setShowCamera(false);
                  }}
                  onClose={() => setShowCamera(false)}
                />
              )}
              {photoFileName && (
                <p className="mt-1 text-xs text-[var(--text-secondary)] truncate">{photoFileName}</p>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm uppercase tracking-wide py-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> Review Details
          </button>
        </form>
      </div>
    </div>
  );
}
