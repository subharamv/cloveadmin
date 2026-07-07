import { useState, useEffect, FormEvent, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, FileText, CheckCircle2, Loader2, IdCard, ClipboardList, User, Upload, Image as ImageIcon, Users, Minus, Plus, Pencil } from 'lucide-react';
import { PhoneSearchField } from './PhoneSearchField';
import { OccupationField } from './OccupationField';
import { CameraCapture } from './CameraCapture';
import { DriveImage } from './DriveImage';
import { MediaViewerModal } from './MediaViewerModal';
import { EditVisitorModal } from './EditVisitorModal';
import { lookupVisitor, submitVisitorEntry, VisitorRecord } from './api';

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

export function EntryForm({ onEntryLogged, prefillPhone, prefillSignal }: { onEntryLogged?: () => void; prefillPhone?: string; prefillSignal?: number } = {}) {
  const [phone, setPhone] = useState('');
  const [matchedName, setMatchedName] = useState<string | null>(null);
  const [lookupState, setLookupState] = useState<'idle' | 'checking' | 'found' | 'not-found'>('idle');
  const [existingVisitor, setExistingVisitor] = useState<VisitorRecord | null>(null);

  const [name, setName] = useState('');
  const [occupation, setOccupation] = useState('');
  const [purpose, setPurpose] = useState(PURPOSE_OPTIONS[0]);
  const [purposeOther, setPurposeOther] = useState('');
  const [documentType, setDocumentType] = useState(DOCUMENT_TYPES[0]);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [numberOfPersons, setNumberOfPersons] = useState(1);
  const [visitorIdCardNumbers, setVisitorIdCardNumbers] = useState<string[]>(['']);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [documentFileName, setDocumentFileName] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [viewer, setViewer] = useState<{ driveLink: string; title: string } | null>(null);
  const [changingPhoto, setChangingPhoto] = useState(false);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const docUploadRef = useRef<HTMLInputElement>(null);
  const docCameraRef = useRef<HTMLInputElement>(null);
  const photoUploadRef = useRef<HTMLInputElement>(null);

  const isOldVisitor = lookupState === 'found';

  // A QR scan from the bottom nav (outside this form) lands here — bump
  // prefillSignal to push the decoded phone number into the lookup flow,
  // same as if it had been typed in.
  useEffect(() => {
    if (prefillSignal && prefillPhone) {
      setPhone(prefillPhone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillSignal]);

  useEffect(() => {
    if (phone.length < 10) {
      setLookupState('idle');
      setExistingVisitor(null);
      return;
    }
    let cancelled = false;
    setLookupState('checking');
    const timer = setTimeout(async () => {
      try {
        const result = await lookupVisitor(phone);
        if (cancelled) return;
        if (result.found && result.visitor) {
          setExistingVisitor(result.visitor);
          setName(result.visitor.name);
          setOccupation(result.visitor.occupation || '');
          setLookupState('found');
        } else {
          setExistingVisitor(null);
          setLookupState('not-found');
        }
        setChangingPhoto(false);
        setPhotoFile(null);
        setPhotoFileName(null);
      } catch {
        if (!cancelled) setLookupState('not-found');
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [phone]);

  const resetForm = () => {
    setPhone('');
    setMatchedName(null);
    setLookupState('idle');
    setExistingVisitor(null);
    setName('');
    setOccupation('');
    setPurpose(PURPOSE_OPTIONS[0]);
    setPurposeOther('');
    setDocumentType(DOCUMENT_TYPES[0]);
    setDocumentFile(null);
    setDocumentFileName(null);
    setPhotoFile(null);
    setPhotoFileName(null);
    setShowCamera(false);
    setChangingPhoto(false);
    setNumberOfPersons(1);
    setVisitorIdCardNumbers(['']);
  };

  const MAX_PERSONS = 20;

  const handlePersonsChange = (next: number) => {
    const clamped = Math.max(1, Math.min(MAX_PERSONS, next));
    setNumberOfPersons(clamped);
    setVisitorIdCardNumbers((prev) => {
      const arr = prev.slice(0, clamped);
      while (arr.length < clamped) arr.push('');
      return arr;
    });
  };

  const updateIdCardNumber = (index: number, value: string) => {
    setVisitorIdCardNumbers((prev) => prev.map((v, i) => (i === index ? value : v)));
  };

  const canReuseExistingPhoto = isOldVisitor && !!existingVisitor?.lastPhotoDriveLink;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedIdCardNumbers = visitorIdCardNumbers.map((v) => v.trim());
    if (!phone || !name || trimmedIdCardNumbers.some((v) => !v)) {
      setError('Phone, name, and a visitor ID card number for each person are required.');
      return;
    }
    if (!occupation.trim()) {
      setError('Occupation is required.');
      return;
    }
    if (!photoFile && !canReuseExistingPhoto) {
      setError('A visitor photo is required.');
      return;
    }
    if (!isOldVisitor && !documentFile) {
      setError('Document proof is required for a new visitor.');
      return;
    }

    const finalPurpose = purpose === 'Other' ? purposeOther.trim() : purpose;
    if (!finalPurpose) {
      setError('Please specify the purpose of visit.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set('phone', phone);
      formData.set('name', name);
      formData.set('occupation', occupation.trim());
      formData.set('purpose', finalPurpose);
      formData.set('entryType', isOldVisitor ? 'Old' : 'New');
      formData.set('numberOfPersons', String(numberOfPersons));
      formData.set('visitorIdCardNumber', trimmedIdCardNumbers.join(', '));
      if (photoFile) formData.set('photoFile', photoFile);
      if (!isOldVisitor) {
        formData.set('documentType', documentType);
        if (documentFile) formData.set('documentFile', documentFile);
      }

      await submitVisitorEntry(formData);
      setSuccess(`Entry logged for ${name}.`);
      resetForm();
      onEntryLogged?.();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to log visitor entry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl mx-auto pb-8">
      <PhoneSearchField
        value={phone}
        matchedName={matchedName}
        onChange={(newPhone, matched) => {
          setPhone(newPhone);
          setMatchedName(matched);
          if (matched) setName(matched);
        }}
      />

      {lookupState === 'checking' && (
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking visitor records...
        </div>
      )}

      <AnimatePresence mode="wait">
        {(lookupState === 'found' || lookupState === 'not-found') && (
          <motion.div
            key={lookupState}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            <div
              className={
                isOldVisitor
                  ? 'flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wide'
                  : 'flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wide'
              }
            >
              <CheckCircle2 className="w-4 h-4" />
              {isOldVisitor ? 'Returning Visitor — Document on File' : 'New Visitor — Full Registration Required'}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">
                <User className="w-3.5 h-3.5" /> Visitor Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isOldVisitor}
                placeholder="Full name"
                required
                className="w-full px-4 py-3.5 text-base bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-70 disabled:bg-[var(--bg-color)]"
              />
            </div>

            {isOldVisitor && <OccupationField value={occupation} onChange={setOccupation} required />}

            {isOldVisitor && existingVisitor && (
              <div className="space-y-3">
                <div className="flex flex-col items-center gap-2.5">
                  <div className="w-[300px] h-[300px] max-w-full rounded-2xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-color)]">
                    {photoPreviewUrl ? (
                      <img src={photoPreviewUrl} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <DriveImage driveLink={existingVisitor.lastPhotoDriveLink} alt={existingVisitor.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (changingPhoto) {
                        setPhotoFile(null);
                        setPhotoFileName(null);
                      }
                      setChangingPhoto((prev) => !prev);
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-500 underline"
                  >
                    {changingPhoto ? 'Cancel — Keep Current Photo' : 'Change Photo'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(true)}
                    className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)] hover:text-blue-600 underline"
                  >
                    <Pencil className="w-3 h-3" /> Edit Name / Occupation
                  </button>
                </div>

                {changingPhoto && (
                  <div>
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
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] hover:bg-blue-50 text-[var(--text-secondary)] hover:text-blue-600 text-sm font-bold transition-colors"
                      >
                        <Upload className="w-4 h-4" /> Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCamera(true)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] hover:bg-emerald-50 text-[var(--text-secondary)] hover:text-emerald-600 text-sm font-bold transition-colors"
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
                )}

                <div className="px-4 py-3 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)] space-y-1">
                  <p className="font-bold text-[10px] uppercase tracking-wide opacity-60">Last visit on file — verify identity match</p>
                  <p><span className="font-bold">Document:</span> {existingVisitor.documentType || 'N/A'}</p>
                  {existingVisitor.documentDriveLink && (
                    <button
                      type="button"
                      onClick={() => setViewer({ driveLink: existingVisitor.documentDriveLink, title: `${existingVisitor.name} — Document` })}
                      className="text-blue-600 underline font-semibold block"
                    >
                      View document proof
                    </button>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">
                <ClipboardList className="w-3.5 h-3.5" /> Purpose of Visit
              </label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-4 py-3.5 text-base bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
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
                  className="w-full mt-2 px-4 py-3 text-sm bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              )}
            </div>

            {!isOldVisitor && <OccupationField value={occupation} onChange={setOccupation} required />}

            {!isOldVisitor && (
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">
                  Document Type
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full px-4 py-3.5 text-base bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                >
                  {DOCUMENT_TYPES.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}

            {!isOldVisitor && (
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
                <input
                  ref={docCameraRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
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
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] hover:bg-blue-50 text-[var(--text-secondary)] hover:text-blue-600 text-sm font-bold transition-colors"
                  >
                    <Upload className="w-4 h-4" /> Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => docCameraRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] hover:bg-emerald-50 text-[var(--text-secondary)] hover:text-emerald-600 text-sm font-bold transition-colors"
                  >
                    <Camera className="w-4 h-4" /> Photo
                  </button>
                </div>
                {documentFileName && (
                  <p className="mt-1 text-xs text-[var(--text-secondary)] truncate">{documentFileName}</p>
                )}
              </div>
            )}

            {!isOldVisitor && (
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">
                  <ImageIcon className="w-3.5 h-3.5" /> Visitor Photo (this visit)
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
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] hover:bg-blue-50 text-[var(--text-secondary)] hover:text-blue-600 text-sm font-bold transition-colors"
                  >
                    <Upload className="w-4 h-4" /> Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCamera(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] hover:bg-emerald-50 text-[var(--text-secondary)] hover:text-emerald-600 text-sm font-bold transition-colors"
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
            )}

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">
                <Users className="w-3.5 h-3.5" /> Number of Persons
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handlePersonsChange(numberOfPersons - 1)}
                  disabled={numberOfPersons <= 1}
                  className="w-11 h-11 flex items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] text-[var(--text-secondary)] hover:text-blue-600 hover:border-blue-500/30 disabled:opacity-30 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center text-lg font-black text-[var(--text-primary)]">{numberOfPersons}</span>
                <button
                  type="button"
                  onClick={() => handlePersonsChange(numberOfPersons + 1)}
                  disabled={numberOfPersons >= MAX_PERSONS}
                  className="w-11 h-11 flex items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] text-[var(--text-secondary)] hover:text-blue-600 hover:border-blue-500/30 disabled:opacity-30 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <span className="text-xs text-[var(--text-secondary)] opacity-70">{numberOfPersons === 1 ? 'person entering' : 'people entering together'}</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">
                <IdCard className="w-3.5 h-3.5" /> Visitor ID Card Number{numberOfPersons > 1 ? 's' : ''}
              </label>
              {visitorIdCardNumbers.map((value, index) => (
                <input
                  key={index}
                  type="text"
                  value={value}
                  onChange={(e) => updateIdCardNumber(index, e.target.value)}
                  placeholder={numberOfPersons > 1 ? `Badge / gate pass number — person ${index + 1}` : 'Badge / gate pass number issued'}
                  required
                  className="w-full px-4 py-3.5 text-base bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              ))}
            </div>

            {error && (
              <p className="text-sm text-red-600 font-medium">{error}</p>
            )}
            {success && (
              <p className="text-sm text-emerald-600 font-medium">{success}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm uppercase tracking-wide py-4 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {submitting ? 'Logging Entry...' : 'Log Visitor Entry'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {viewer && (
        <MediaViewerModal driveLink={viewer.driveLink} title={viewer.title} onClose={() => setViewer(null)} />
      )}

      {showEditModal && existingVisitor && (
        <EditVisitorModal
          phone={existingVisitor.phone}
          name={existingVisitor.name}
          occupation={existingVisitor.occupation}
          onClose={() => setShowEditModal(false)}
          onSaved={(updated) => {
            setExistingVisitor(updated);
            setName(updated.name);
            setOccupation(updated.occupation || '');
          }}
        />
      )}
    </form>
  );
}
