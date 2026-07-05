import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  UserPlus, 
  ClipboardList, 
  Plus, 
  Search, 
  CheckCircle2, 
  UserCheck, 
  Truck, 
  Users, 
  Clock, 
  Video, 
  AlertOctagon, 
  Activity, 
  Lock, 
  Unlock, 
  Map, 
  Wifi, 
  WifiOff, 
  AlertTriangle,
  QrCode,
  Download,
  Printer,
  ExternalLink,
  Share2,
  Copy,
  Check,
  X,
  RefreshCw,
  Smartphone
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { AdminVisitorVerification } from './AdminVisitorVerification';
import { AdminPreRegisterModal } from './AdminPreRegisterModal';
import { fetchExpectedVisitors, fetchVisitorLogs, VisitorLog as SheetVisitorLog } from '../security/api';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

const VisitorTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 dark:bg-zinc-950/95 border border-slate-800 dark:border-zinc-800 text-white p-3.5 rounded-2xl shadow-xl backdrop-blur-md text-xs font-sans text-left">
        <p className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider mb-2">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full font-sans" style={{ backgroundColor: entry.color || entry.fill }} />
              <span className="text-slate-300 font-medium">{entry.name}:</span>
              <span className="font-black text-white">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const TypeTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 dark:bg-zinc-950/95 border border-slate-800 dark:border-zinc-800 text-white p-3.5 rounded-2xl shadow-xl backdrop-blur-md text-xs font-sans text-left">
        <p className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider mb-1">{payload[0].name}</p>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          <span className="text-slate-300 font-medium">Clearances:</span>
          <span className="font-black text-white">{payload[0].value}</span>
        </div>
      </div>
    );
  }
  return null;
};

export function VisitorAndGateHub({ searchTerm: initialSearchTerm = '' }: { searchTerm?: string }) {
  // --- INTEGRATED FIREBASE & LOCAL VISITOR & GATE STATE ---
  const [invites, setInvites] = useState([
    { id: 'INV-2026-881', guest: 'Dr. Amit Patel', host: 'Rohan Sharma (R&D)', time: '10:30 AM', type: 'VIP Guest', status: 'Expected', qrCode: 'PASS-INV-2026-881' },
    { id: 'INV-2026-882', guest: 'Ananya Rao', host: 'Meera Reddy (HR)', time: '02:15 PM', type: 'Interviewee', status: 'Checked In', qrCode: 'PASS-INV-2026-882' }
  ]);
  const [inviteForm, setInviteForm] = useState({ guest: '', host: '', time: '', type: 'Interviewee' });

  const [entries, setEntries] = useState([
    { id: 'GTE-991', vendor: 'XYZ Logistics', items: 'Office Chairs', qty: '15 units', origin: 'Warehouse A', vehicle: 'DL-1C-4567', purpose: 'Delivery', time: '10:15 AM' }
  ]);
  const [gateForm, setGateForm] = useState({ vendor: '', items: '', qty: '', origin: '', vehicle: '', purpose: 'Delivery' });
  
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; title: string; desc: string } | null>(null);
  const [activeTab, setActiveTab] = useState('analytics');
  const [sheetOnline, setSheetOnline] = useState<boolean | null>(null);
  const [showPreRegisterModal, setShowPreRegisterModal] = useState(false);
  const [expectedGuests, setExpectedGuests] = useState<SheetVisitorLog[]>([]);
  const [expectedError, setExpectedError] = useState<string | null>(null);
  const [sheetLogs, setSheetLogs] = useState<SheetVisitorLog[]>([]);

  const loadExpectedGuests = async () => {
    try {
      const data = await fetchExpectedVisitors();
      setExpectedGuests(data);
      setExpectedError(null);
    } catch (err: any) {
      setExpectedError(err.message || 'Sign in with the email/password option to view pre-registered guests.');
    }
  };

  const loadSheetLogs = async () => {
    try {
      const data = await fetchVisitorLogs();
      setSheetLogs(data);
    } catch {
      // Analytics charts just fall back to an empty dataset until signed in.
    }
  };

  useEffect(() => {
    loadExpectedGuests();
    loadSheetLogs();
    const interval = setInterval(() => {
      loadExpectedGuests();
      loadSheetLogs();
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${window.location.origin}/api/health`);
        setSheetOnline(res.ok);
      } catch {
        setSheetOnline(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // QR Code Pass overlay states
  const [selectedInviteForQr, setSelectedInviteForQr] = useState<any | null>(null);
  const [isScanningQr, setIsScanningQr] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    setSearchTerm(initialSearchTerm);
  }, [initialSearchTerm]);

  // Real-time synchronization with Firestore collection 'visitor_logs'
  useEffect(() => {
    const q = query(collection(db, 'visitor_logs'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          guest: data.guestName || 'Anonymous',
          host: data.hostName || 'Staff',
          time: data.meetingTime || '12:00 PM',
          type: data.type || 'Interviewee',
          status: data.status || 'Expected',
          qrCode: data.qrCode || `PASS-${docSnapshot.id}`,
          timestamp: data.timestamp
        };
      });
      if (logs.length > 0) {
        setInvites(logs);
      }
    }, (error) => {
      console.warn("Firestore collection visitor_logs notice (unsigned in or database preparing):", error.message);
    });
    return () => unsubscribe();
  }, []);

  // --- NEW: SOC INCIDENT FEED STATE ---
  const [incidents] = useState([
    { id: 1, time: '11:02 AM', type: 'Alert', text: 'Motion detected at Perimeter Gate 3.', level: 'Medium' },
    { id: 2, time: '10:45 AM', type: 'Access', text: 'Badge denied: Expired credentials (ID: 8892).', level: 'High' },
    { id: 3, time: '10:15 AM', type: 'System', text: 'Camera C-04 (Lobby) connection restored.', level: 'Low' },
    { id: 4, time: '09:30 AM', type: 'Patrol', text: 'Shift handover complete. 4 guards active.', level: 'Low' },
  ]);

  // --- VISITOR ANALYTICS CALCULATION LOGIC (live from the Google Sheets visitor log) ---
  const PURPOSE_CATEGORIES = [
    'Meeting',
    'Interview',
    'Vendor / Delivery',
    'Maintenance / Service',
    'VIP Guest',
    'Contractor / Site Work',
    'Personal Visit',
    'Other',
  ];

  const getTrafficData = () => {
    const countsByDay: { [key: string]: { date: string; expected: number; checkedIn: number; checkedOut: number; total: number } } = {};

    // Standard pre-populated 7 days timeline to guarantee dynamic continuous rendering
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      const fullDate = d.toISOString().split('T')[0];
      countsByDay[fullDate] = {
        date: label,
        expected: 0,
        checkedIn: 0,
        checkedOut: 0,
        total: 0
      };
    }

    sheetLogs.forEach(log => {
      // Pre-registered guests without an entry time yet are bucketed into today.
      const dateKey = log.entryTime
        ? new Date(log.entryTime).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      if (!countsByDay[dateKey]) return; // outside the 7-day rolling window

      countsByDay[dateKey].total += 1;
      if (log.status === 'Expected') {
        countsByDay[dateKey].expected += 1;
      } else if (log.status === 'Active') {
        countsByDay[dateKey].checkedIn += 1;
      } else if (log.status === 'Completed') {
        countsByDay[dateKey].checkedOut += 1;
      }
    });

    return Object.keys(countsByDay)
      .sort()
      .map(key => countsByDay[key]);
  };

  const getTypeData = () => {
    const counts: { [key: string]: number } = {};
    PURPOSE_CATEGORIES.forEach(p => { counts[p] = 0; });

    sheetLogs.forEach(log => {
      const purpose = log.purpose || 'Other';
      if (counts[purpose] !== undefined) {
        counts[purpose] += 1;
      } else {
        counts['Other'] += 1;
      }
    });

    return Object.keys(counts).map(key => ({
      name: key,
      visitors: counts[key]
    }));
  };

  const trafficData = getTrafficData();
  const typeData = getTypeData();

  // --- HANDLERS ---
  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.guest || !inviteForm.host) return;

    const plainId = `INV-2026-${Math.floor(100 + Math.random() * 900)}`;
    const passCode = `PASS-${plainId}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newLocalInvite = {
      id: plainId,
      guest: inviteForm.guest,
      host: inviteForm.host,
      time: inviteForm.time || '12:00 PM',
      type: inviteForm.type,
      status: 'Expected',
      qrCode: passCode
    };

    // Responsive local save fallback
    setInvites(prev => [newLocalInvite, ...prev]);

    // Push into Firestore visitor_logs
    try {
      await addDoc(collection(db, 'visitor_logs'), {
        guestName: inviteForm.guest,
        hostName: inviteForm.host,
        meetingTime: inviteForm.time || '12:00 PM',
        status: 'Expected',
        qrCode: passCode,
        type: inviteForm.type,
        timestamp: serverTimestamp()
      });
      
      setSelectedInviteForQr(newLocalInvite);
      setToast({
        show: true,
        title: 'Visitor Pass Configured',
        desc: `Authorized pre-clearance for ${inviteForm.guest} seamlessly synced with Firestore.`
      });
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      console.warn("Firestore writing notice:", err);
      // Fallback local visual overlay popup
      setSelectedInviteForQr(newLocalInvite);
      setToast({
        show: true,
        title: 'Visitor Pass Created (Local)',
        desc: `Pre-Registered ${inviteForm.guest} locally. Connect network to synchronization cloud.`
      });
      setTimeout(() => setToast(null), 4000);
    }

    setInviteForm({ guest: '', host: '', time: '', type: 'Interviewee' });
  };

  const handleUpdateStatus = async (inviteId: string, newStatus: 'Expected' | 'Checked In' | 'Checked Out') => {
    // Optimistic local state update
    setInvites(prev => prev.map(inv => inv.id === inviteId ? { ...inv, status: newStatus } : inv));
    
    // Assure visual modal updates as well
    if (selectedInviteForQr && selectedInviteForQr.id === inviteId) {
      setSelectedInviteForQr(prev => prev ? { ...prev, status: newStatus } : null);
    }

    try {
      // If it's a real Firestore document ID (doesn't start with static template string)
      if (!inviteId.startsWith('INV-')) {
        await updateDoc(doc(db, 'visitor_logs', inviteId), {
          status: newStatus,
          timestamp: serverTimestamp() // compliant with timestamp validations
        });
      }
    } catch (err) {
      console.warn("Firestore document update failed (local fallback preserved):", err);
    }
  };

  const handleSimulateGateScan = (targetStatus: 'Expected' | 'Checked In' | 'Checked Out') => {
    if (isScanningQr) return;
    setIsScanningQr(true);
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsScanningQr(false);
            handleUpdateStatus(selectedInviteForQr.id, targetStatus);
            setToast({
              show: true,
              title: `Credential Scanned`,
              desc: `${selectedInviteForQr.guest} badge authorized at gate GT-SEC-03. Status: ${targetStatus}.`
            });
            setTimeout(() => setToast(null), 3500);
          }, 350);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  const handleCopyPassPayload = (code: string) => {
    navigator.clipboard.writeText(code);
    setToast({
      show: true,
      title: 'Passcode Copied',
      desc: `Visitor signature payload copied to system clipboard.`
    });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDownloadPassSvg = (invite: any) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(invite, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `GatePass-${invite.id}-${invite.guest.replace(/\s+/g, '-')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setToast({
      show: true,
      title: 'Credentials Exported',
      desc: `Secure credentials JSON pass successfully exported.`
    });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePrintPass = () => {
    setToast({
      show: true,
      title: 'Badge Spooled',
      desc: `Transferring printer queue task into security check-point laser console.`
    });
    setTimeout(() => setToast(null), 3000);
  };

  const handleGateRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gateForm.vendor || !gateForm.items) return;
    setEntries([{ id: `GTE-${Math.floor(100 + Math.random() * 900)}`, ...gateForm, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, ...entries]);
    setGateForm({ vendor: '', items: '', qty: '', origin: '', vehicle: '', purpose: 'Delivery' });
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 4000);
  };

  const handleExportCSV = () => {
    if (!invites || invites.length === 0) {
      setToast({
        show: true,
        title: 'Export Failed',
        desc: 'No visitor logs available to export.'
      });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    // Header row
    const headers = ['Record ID', 'Guest Name', 'Clearance Type', 'Host Staff', 'ETA/Time', 'Status', 'Secure Pass Code'];
    
    // Data rows, properly escaped from any comma/quote interference
    const rows = invites.map(inv => [
      inv.id || '',
      `"${(inv.guest || '').replace(/"/g, '""')}"`,
      `"${(inv.type || '').replace(/"/g, '""')}"`,
      `"${(inv.host || '').replace(/"/g, '""')}"`,
      `"${(inv.time || '').replace(/"/g, '""')}"`,
      `"${(inv.status || '').replace(/"/g, '""')}"`,
      `"${(inv.qrCode || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create the download link and trigger download
    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `visitor_logs_historical_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setToast({
        show: true,
        title: 'Access Database Exported',
        desc: `Exported ${invites.length} historical visitor logs into a structured CSV archive.`
      });
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      console.error("CSV Export Error:", err);
      setToast({
        show: true,
        title: 'Export Unsuccessful',
        desc: 'An error occurred during CSV parsing.'
      });
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-tab-enter relative z-10 p-6 md:p-10 pb-20 bg-[var(--panel-bg)]/70 backdrop-blur-xl border border-[var(--border-color)] rounded-[2.5rem] shadow-2xl transition-colors duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-tight">
            <Shield className="text-blue-600" /> Security Operations Center (SOC)
          </h2>
          <p className="hidden md:block text-[var(--text-secondary)] opacity-70 text-sm mt-1">Live threat monitoring, perimeter control, and inward logistics registry.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 hover:scale-[1.02] active:scale-95 border border-blue-500/20 rounded-xl shadow-md shadow-blue-500/10 cursor-pointer transition-all uppercase tracking-wider"
            title="Download historical logs as a CSV file"
          >
            <Download size={14} className="stroke-[2.5]" />
            <span>Export Logs (CSV)</span>
          </button>
          <button
            type="button"
            onClick={() => setShowPreRegisterModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.02] active:scale-95 border border-emerald-500/20 rounded-xl shadow-md shadow-emerald-500/10 cursor-pointer transition-all uppercase tracking-wider"
            title="Pre-register an expected guest for security check-in"
          >
            <UserPlus size={14} className="stroke-[2.5]" />
            <span>Pre-Register</span>
          </button>
          <div className="flex items-center justify-center shrink-0" title={sheetOnline === null ? 'Checking...' : sheetOnline ? 'Sheets Connected' : 'Sheets Disconnected'}>
            <div className={cn(
              "w-2.5 h-2.5 rounded-full",
              sheetOnline === null ? 'bg-amber-500 animate-pulse' : sheetOnline ? 'bg-emerald-500' : 'bg-rose-500'
            )} />
          </div>
        </div>
      </div>

      {/* Floating Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center bg-[var(--glass-bg)] backdrop-blur-xl text-[var(--text-primary)] px-5 py-4 rounded-2xl shadow-[0_12px_40px_-10px_rgba(0,0,0,0.25)] border border-emerald-500/20 animate-toast text-left">
          <div className="bg-gradient-to-tr from-emerald-400 to-emerald-500 p-2 rounded-full mr-4 text-white shadow-md"><CheckCircle2 size={20} /></div>
          <div>
            <h4 className="font-extrabold text-sm">Gate Entry Logged</h4>
            <p className="text-xs text-[var(--text-secondary)] opacity-70 font-medium mt-0.5 font-sans">Vehicle authorization record saved securely.</p>
          </div>
        </div>
      )}

      {/* LIVE VISITOR VERIFICATION (real Google Sheets + Drive backed gate entries) */}
      <AdminVisitorVerification />

      {/* Pre-Registered Guests — real Google Sheets-backed manifest, checked in from the security portal */}
      <div className="bg-[var(--panel-bg)]/90 backdrop-blur-xl rounded-3xl shadow-sm border border-[var(--border-color)] overflow-hidden">
        <div className="p-6 pb-4 border-b border-[var(--border-color)] flex justify-between items-center gap-2">
          <div>
            <h3 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-wide">
              <UserPlus size={16} className="text-blue-600" /> Pre-Registered Guests
            </h3>
            <p className="text-[10px] text-[var(--text-secondary)] opacity-60 mt-0.5">Awaiting arrival — security checks them in with a photo from the Gate Security dashboard.</p>
          </div>
          <Users size={14} className="text-[var(--text-secondary)] opacity-50 shrink-0" />
        </div>
        {expectedError && <p className="px-6 pt-4 text-xs text-red-500">{expectedError}</p>}
        <div className="divide-y divide-[var(--border-color)]/40 max-h-[300px] overflow-y-auto custom-scrollbar">
          {expectedGuests.length === 0 && !expectedError && (
            <p className="p-6 text-center text-xs text-[var(--text-secondary)] opacity-50">No guests pre-registered yet.</p>
          )}
          {expectedGuests.map(guest => (
            <div key={guest.logId} className="p-3.5 hover:bg-[var(--bg-color)]/45 flex justify-between items-center text-xs group/item transition-all duration-300">
              <div className="flex gap-3 items-center min-w-0">
                <span className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-xl shrink-0"><UserCheck size={14} /></span>
                <div className="truncate">
                  <h5 className="font-extrabold text-[var(--text-primary)] truncate">{guest.name || guest.phone}</h5>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[9.5px] text-[var(--text-secondary)] opacity-60 font-medium">
                    {guest.expectedTime && (
                      <span className="font-mono flex items-center gap-1">
                        <Clock size={10} className="inline" />{guest.expectedTime}
                      </span>
                    )}
                    {guest.host && (
                      <>
                        <span>•</span>
                        <span className="truncate">{guest.host}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-[9px] font-black border uppercase tracking-wider shadow-sm bg-blue-500/10 border-blue-500/20 text-blue-500 animate-pulse shrink-0">
                Expected
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ================= SOC DASHBOARD TABS ================= */}
      <div className="bg-[var(--panel-bg)]/70 backdrop-blur-xl rounded-3xl border border-[var(--border-color)] shadow-sm overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex flex-nowrap border-b border-[var(--border-color)] overflow-x-auto overflow-y-hidden no-scrollbar">
          {[
            { key: 'analytics', label: 'Analytics', icon: ClipboardList },
            { key: 'overview', label: 'Command Center', icon: Activity },
            { key: 'surveillance', label: 'Surveillance', icon: Video },
            { key: 'logistics', label: 'Logistics', icon: Truck },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-5 py-3.5 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 border-b-2 -mb-px",
                activeTab === tab.key
                  ? 'text-blue-600 border-blue-600 bg-blue-500/5'
                  : 'text-[var(--text-secondary)] opacity-60 hover:opacity-100 border-transparent hover:border-[var(--border-color)]'
              )}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* OVERVIEW: HUD Metrics */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[var(--panel-bg)]/70 backdrop-blur-xl p-5 rounded-3xl border border-[var(--border-color)] shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start text-[var(--text-secondary)]"><span className="text-[10px] font-bold uppercase tracking-wider">Threat Level</span><AlertOctagon size={16} className="text-emerald-500" /></div>
                <div className="mt-3">
                  <h3 className="text-2xl font-black text-emerald-500 tracking-tight">DEFCON 5</h3>
                  <p className="text-xs text-[var(--text-secondary)] opacity-60 mt-0.5 font-medium">Standard Operations</p>
                </div>
              </div>
              <div className="bg-[var(--panel-bg)]/70 backdrop-blur-xl p-5 rounded-3xl border border-[var(--border-color)] shadow-sm flex flex-col justify-between relative overflow-hidden font-sans">
                <div className="absolute -right-4 -bottom-4 opacity-5"><Video size={80} /></div>
                <div className="flex justify-between items-start text-[var(--text-secondary)] relative z-10"><span className="text-[10px] font-bold uppercase tracking-wider">Camera Network</span><Wifi size={16} className="text-blue-500" /></div>
                <div className="mt-3 relative z-10">
                  <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">98.4%</h3>
                  <p className="text-xs text-[var(--text-secondary)] opacity-60 mt-0.5 font-medium flex items-center gap-1"><span className="text-rose-500 font-bold">2</span> Nodes Offline</p>
                </div>
              </div>
              <div className="bg-[var(--panel-bg)]/70 backdrop-blur-xl p-5 rounded-3xl border border-[var(--border-color)] shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start text-[var(--text-secondary)]"><span className="text-[10px] font-bold uppercase tracking-wider">Access Control (24h)</span><Lock size={16} className="text-indigo-500" /></div>
                <div className="mt-3 flex items-end gap-3">
                  <div>
                    <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">842</h3>
                    <p className="text-xs text-emerald-500 font-bold mt-0.5">Granted</p>
                  </div>
                  <div className="w-px h-8 bg-[var(--border-color)]/50" />
                  <div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">14</h3>
                    <p className="text-xs text-rose-500 font-bold mt-0.5">Denied</p>
                  </div>
                </div>
              </div>
              <div className="bg-[var(--panel-bg)]/70 backdrop-blur-xl p-5 rounded-3xl border border-[var(--border-color)] shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start text-[var(--text-secondary)]"><span className="text-[10px] font-bold uppercase tracking-wider">Active Patrols</span><Activity size={16} className="text-amber-500" /></div>
                <div className="mt-3">
                  <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">4 / 4</h3>
                  <p className="text-xs text-[var(--text-secondary)] opacity-60 mt-0.5 font-medium">All zones covered</p>
                </div>
              </div>
            </div>
          )}

          {/* ANALYTICS: Charts */}
          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 bg-[var(--panel-bg)]/80 backdrop-blur-xl rounded-3xl p-6 border border-[var(--border-color)] shadow-sm flex flex-col justify-between">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[var(--border-color)] pb-4 mb-4 gap-2 text-left">
                  <div>
                    <h3 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-wide">
                      <Activity size={16} className="text-blue-600" /> Daily Visitor Security Traffic Trend
                    </h3>
                    <p className="text-[10px] text-[var(--text-secondary)] opacity-60 mt-0.5">7-day rolling window of authorized pre-clearance and in-gate traffic spikes.</p>
                  </div>
                  <div className="text-xs bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-xl font-bold text-blue-500 uppercase tracking-widest text-[9px]">
                    Live Feed Connected
                  </div>
                </div>
                <div className="w-full h-[260px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorCheckedIn" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorCheckedOut" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-zinc-800/40" />
                      <XAxis dataKey="date" stroke="currentColor" className="text-slate-400 font-mono text-[10px]" tickLine={false} />
                      <YAxis stroke="currentColor" className="text-slate-400 font-mono text-[10px]" tickLine={false} axisLine={false} />
                      <Tooltip content={<VisitorTooltip />} />
                      <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                      <Area type="monotone" dataKey="expected" name="Expected" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorExpected)" />
                      <Area type="monotone" dataKey="checkedIn" name="Checked In" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCheckedIn)" />
                      <Area type="monotone" dataKey="checkedOut" name="Checked Out" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorCheckedOut)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-[var(--panel-bg)]/80 backdrop-blur-xl rounded-3xl p-6 border border-[var(--border-color)] shadow-sm flex flex-col justify-between">
                <div className="border-b border-[var(--border-color)] pb-4 mb-4 text-left">
                  <h3 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-wide">
                    <ClipboardList size={16} className="text-indigo-600" /> Clearance Type Distribution
                  </h3>
                  <p className="text-[10px] text-[var(--text-secondary)] opacity-60 mt-0.5">Classification breakdown of active & pre-registered badges.</p>
                </div>
                <div className="w-full h-[260px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={typeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-zinc-800/40" />
                      <XAxis dataKey="name" stroke="currentColor" className="text-slate-400 font-mono text-[10px]" tickLine={false} />
                      <YAxis stroke="currentColor" className="text-slate-400 font-mono text-[10px]" tickLine={false} axisLine={false} />
                      <Tooltip content={<TypeTooltip />} />
                      <Bar dataKey="visitors" name="Clearances" fill="#6366f1" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* SURVEILLANCE: Map + Incident Feed */}
          {activeTab === 'surveillance' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-12 xl:col-span-7 bg-[var(--panel-bg)]/80 backdrop-blur-xl rounded-3xl shadow-sm border border-[var(--border-color)] p-6 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-wide">
                    <Map size={16} className="text-blue-600" /> Facility Topology & Sensor Grid
                  </h3>
                  <div className="flex gap-3 text-[10px] font-bold text-[var(--text-secondary)] opacity-80 uppercase">
                    <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Online</span>
                    <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" /> Alert</span>
                    <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Offline</span>
                  </div>
                </div>
                <div className="flex-1 min-h-[300px] bg-slate-950 rounded-2xl relative overflow-hidden border border-slate-900">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
                  <div className="absolute top-[20%] left-[10%] w-[40%] h-[60%] border border-blue-500/20 bg-blue-500/5 rounded-2xl" />
                  <div className="absolute top-[30%] right-[15%] w-[25%] h-[40%] border border-blue-500/20 bg-blue-500/5 rounded-2xl" />
                  <div className="absolute top-[20%] left-[25%] group cursor-pointer">
                    <div className="absolute -inset-2 bg-emerald-500/20 rounded-full animate-ping" />
                    <Video size={16} className="text-emerald-400 relative z-10" />
                    <span className="absolute -bottom-5 -left-2 text-[8px] bg-black/60 px-1 py-0.5 rounded text-emerald-400 font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">CAM-01</span>
                  </div>
                  <div className="absolute top-[45%] left-[45%] group cursor-pointer">
                    <div className="absolute -inset-2 bg-amber-500/20 rounded-full animate-ping" />
                    <Video size={16} className="text-amber-400 relative z-10" />
                    <span className="absolute -bottom-5 -left-2 text-[8px] bg-black/60 px-1 py-0.5 rounded text-amber-400 font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">CAM-02 (Motion)</span>
                  </div>
                  <div className="absolute bottom-[25%] right-[30%] group cursor-pointer">
                    <div className="absolute -inset-2 bg-rose-500/30 rounded-full animate-ping" />
                    <WifiOff size={16} className="text-rose-400 relative z-10" />
                    <span className="absolute -bottom-5 -left-2 text-[8px] bg-black/60 px-1 py-0.5 rounded text-rose-400 font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">CAM-03 (Offline)</span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-12 xl:col-span-5 bg-[var(--panel-bg)]/90 backdrop-blur-xl rounded-3xl shadow-sm border border-[var(--border-color)] overflow-hidden flex flex-col">
                <div className="p-5 border-b border-[var(--border-color)] bg-[var(--bg-color)]/30">
                  <h4 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-wide">
                    <Activity size={16} className="text-indigo-600 animate-pulse" /> Live Incident Log
                  </h4>
                </div>
                <div className="p-5 flex-1 overflow-y-auto space-y-4 max-h-[300px] custom-scrollbar text-left">
                  {incidents.map((inc) => (
                    <div key={inc.id} className="flex gap-3 relative before:absolute before:left-[11px] before:top-8 before:bottom-[-20px] before:w-px before:bg-[var(--border-color)] last:before:hidden">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10",
                        inc.level === 'High' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : inc.level === 'Medium' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-[var(--bg-color)]/70 text-[var(--text-secondary)] border border-[var(--border-color)]'
                      )}>
                        {inc.level === 'High' ? <AlertTriangle size={12} /> : inc.type === 'Access' ? <Lock size={12} /> : <AlertOctagon size={12} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-[var(--text-secondary)] opacity-60">{inc.time}</span>
                          <span className={cn(
                            "text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded",
                            inc.level === 'High' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-[var(--bg-color)]/80 text-[var(--text-secondary)] border border-[var(--border-color)]'
                          )}>{inc.type}</span>
                        </div>
                        <p className="text-xs text-[var(--text-primary)] font-medium mt-1">{inc.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* LOGISTICS: Freight + Roster */}
          {activeTab === 'logistics' && (
            <div className="flex flex-col gap-6">
              <div className="bg-[var(--panel-bg)]/80 backdrop-blur-xl rounded-3xl shadow-sm border border-[var(--border-color)] p-6">
                <h3 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3 mb-4 uppercase tracking-wide">
                  <ClipboardList size={16} className="text-indigo-600" /> Inward Freight & Vendor Checkpoint
                </h3>
                <form onSubmit={handleGateRegister} className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1.5 opacity-60">Vendor Name</label>
                    <input type="text" className="w-full px-4 py-2.5 text-xs bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] outline-none focus:border-blue-500/40" value={gateForm.vendor} onChange={e => setGateForm({...gateForm, vendor: e.target.value})} required placeholder="e.g. DHL Express" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1.5 opacity-60">Material</label>
                    <input type="text" className="w-full px-4 py-2.5 text-xs bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] outline-none focus:border-blue-500/40" value={gateForm.items} onChange={e => setGateForm({...gateForm, items: e.target.value})} required placeholder="e.g. Server Rails" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1.5 opacity-60">Vehicle No.</label>
                    <input type="text" className="w-full px-4 py-2.5 text-xs bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl outline-none focus:border-blue-500/40 font-mono uppercase" value={gateForm.vehicle} onChange={e => setGateForm({...gateForm, vehicle: e.target.value})} required placeholder="e.g. DL-3C-7890" />
                  </div>
                  <button type="submit" className="col-span-1 sm:col-span-3 bg-blue-600 text-white hover:bg-blue-500 hover:brightness-105 font-bold text-[10px] uppercase tracking-wider py-3.5 rounded-xl mt-1 flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95">
                    <Plus size={14} /> Log Checkpoint Clearance
                  </button>
                </form>
              </div>
              <div className="bg-[var(--panel-bg)]/90 backdrop-blur-xl rounded-2xl shadow-sm border border-[var(--border-color)] overflow-hidden flex flex-col flex-1">
                <div className="p-4 border-b border-[var(--border-color)] flex flex-col sm:flex-row justify-between items-center gap-4 bg-[var(--bg-color)]/30">
                  <div>
                    <h4 className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-wide">Live Perimeter Roster</h4>
                  </div>
                  <div className="relative w-40">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] opacity-40" size={13} />
                    <input type="text" placeholder="Filter roster..." className="w-full pl-8 pr-2 py-1.5 bg-[var(--bg-color)] text-[var(--text-primary)] border border-[var(--border-color)] focus:border-blue-500/40 rounded-lg text-xs outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  </div>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left whitespace-nowrap text-xs border-separate border-spacing-0">
                    <thead>
                      <tr className="bg-[var(--bg-color)]/20 text-[var(--text-secondary)] text-[10px] uppercase font-bold border-b border-[var(--border-color)] select-none">
                        <th className="p-3.5 pl-5">Time In</th>
                        <th className="p-3.5">Vendor</th>
                        <th className="p-3.5">Cargo</th>
                        <th className="p-3.5 pr-5">Vehicle Code</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]/35 text-[var(--text-primary)] font-medium">
                      {entries.filter(e => e.vendor.toLowerCase().includes(searchTerm.toLowerCase())).map(entry => (
                        <tr key={entry.id} className="hover:bg-[var(--bg-color)]/20">
                          <td className="p-3.5 pl-5 text-[var(--text-secondary)] opacity-70 font-mono font-bold">{entry.time}</td>
                          <td className="p-3.5 font-bold">{entry.vendor}</td>
                          <td className="p-3.5 opacity-90 font-semibold">{entry.items}</td>
                          <td className="p-3.5 pr-5 font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase">{entry.vehicle}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL: DIGITAL GUEST QR PASS & SIMULATION ================= */}
      <AnimatePresence>
        {selectedInviteForQr && (
          <div className="fixed inset-0 z-50 bg-black/40 w-full h-full backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-[2.5rem] shadow-2xl p-6 sm:p-8 max-w-md w-full relative overflow-hidden"
            >
              {/* Scan simulating background glow */}
              {isScanningQr && (
                <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-b from-blue-500/30 to-transparent animate-pulse" />
              )}
              
              {/* Decorative glows */}
              <div className="absolute -right-12 -top-12 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />

              {/* Close & Header */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-500">
                    <Shield size={16} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-extrabold text-[var(--text-primary)] text-sm uppercase tracking-wider">Gate Clearance Pass</h3>
                    <p className="text-[8px] font-mono text-[var(--text-secondary)] opacity-50 uppercase tracking-widest mt-0.5">Secure Entry Credential</p>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setSelectedInviteForQr(null);
                    setScanProgress(0);
                    setIsScanningQr(false);
                  }}
                  className="p-1.5 px-2.5 text-slate-400 hover:text-rose-500 rounded-lg bg-[var(--bg-color)] hover:bg-rose-500/10 border border-[var(--border-color)] hover:border-rose-500/20 transition-all cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Secure iOS Wallet Badge Pass content */}
              <div className="space-y-6 relative z-10">
                <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 text-white relative shadow-2xl overflow-hidden group">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:15px_15px] pointer-events-none" />

                  {/* Top line metadata */}
                  <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-3.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">CLOVE DIGITAL GATEWAY</span>
                    </div>
                    <span className="font-mono font-black text-[9px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-md">
                      {selectedInviteForQr.id}
                    </span>
                  </div>

                  {/* Core layout */}
                  <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 text-left">
                    <div>
                      <label className="block text-[7.5px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Passholder Name</label>
                      <h4 className="text-xs font-black text-white truncate max-w-[130px]">{selectedInviteForQr.guest}</h4>
                    </div>
                    <div>
                      <label className="block text-[7.5px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Clearance Type</label>
                      <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-slate-300 text-[8px] font-extrabold uppercase tracking-widest rounded-md inline-block">
                        {selectedInviteForQr.type}
                      </span>
                    </div>
                    <div>
                      <label className="block text-[7.5px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Host Entity</label>
                      <p className="text-xs font-semibold text-slate-300 truncate max-w-[130px]">{selectedInviteForQr.host}</p>
                    </div>
                    <div>
                      <label className="block text-[7.5px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Meeting Time</label>
                      <span className="text-xs font-mono font-black text-slate-100 flex items-center gap-1">
                        <Clock size={10} className="text-slate-400" /> {selectedInviteForQr.time}
                      </span>
                    </div>
                  </div>

                  {/* Dashed divider */}
                  <div className="relative my-5 border-t border-dashed border-slate-700">
                    <div className="absolute -left-[29px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[var(--panel-bg)] border-r border-[var(--border-color)]" />
                    <div className="absolute -right-[29px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[var(--panel-bg)] border-l border-[var(--border-color)]" />
                  </div>

                  {/* dynamic QR renderer box */}
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="relative p-4 bg-white rounded-2xl shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center">
                      {isScanningQr && (
                        <motion.div
                          initial={{ top: '8%' }}
                          animate={{ top: '88%' }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                          className="absolute inset-x-4 h-[3px] bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)] z-20"
                        />
                      )}
                      
                      <QRCodeSVG
                        value={JSON.stringify({
                          id: selectedInviteForQr.id,
                          guest: selectedInviteForQr.guest,
                          host: selectedInviteForQr.host,
                          time: selectedInviteForQr.time,
                          type: selectedInviteForQr.type,
                          passCode: selectedInviteForQr.qrCode
                        })}
                        size={140}
                        level="H"
                        includeMargin={true}
                      />
                    </div>

                    <div className="text-center font-mono select-none">
                      <span className="text-[8px] font-black tracking-widest text-slate-500 uppercase block">PASS ID PAYLOAD</span>
                      <p className="text-[10px] font-bold text-slate-300 tracking-wider mt-0.5 uppercase">{selectedInviteForQr.qrCode}</p>
                    </div>
                  </div>

                  {/* footer badge */}
                  <div className="mt-5 border-t border-white/[0.06] pt-3.5 flex justify-between items-center select-none">
                    <div className="flex flex-col items-start">
                      <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-widest">GATEWAY POLICY</span>
                      <span className="text-[9px] text-emerald-400 font-extrabold uppercase mt-0.5">Biometry Cleared</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">STATUS</span>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-lg text-[8px] font-black border uppercase tracking-widest",
                        selectedInviteForQr.status === 'Checked In' || selectedInviteForQr.status === 'Checked_In'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : selectedInviteForQr.status === 'Checked Out' || selectedInviteForQr.status === 'Checked_Out'
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                            : 'bg-blue-500/15 border-blue-500/20 text-blue-400 animate-pulse'
                      )}>
                        {selectedInviteForQr.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                </div>

                {/* Laser scan simulator bar */}
                <div className="p-4 bg-[var(--bg-color)]/50 rounded-2xl border border-[var(--border-color)] space-y-3 relative overflow-hidden">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-wider opacity-60">Access Scanner Automation</span>
                    <Smartphone size={14} className="text-blue-500 opacity-60" />
                  </div>

                  {isScanningQr ? (
                    <div className="space-y-2 py-1 text-left">
                      <div className="flex justify-between items-center font-mono text-[9px] font-black text-rose-500">
                        <span className="animate-pulse">DECRYPTING ACCESS TOKEN...</span>
                        <span>{Math.round(scanProgress)}%</span>
                      </div>
                      <div className="w-full bg-[var(--border-color)] rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-rose-500 duration-100 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.7)]" style={{ width: `${scanProgress}%` }} />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      {selectedInviteForQr.status === 'Expected' && (
                        <button
                          type="button"
                          onClick={() => handleSimulateGateScan('Checked In')}
                          className="py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[9.5px] font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-md shadow-blue-500/20"
                        >
                          <Smartphone size={12} className="stroke-[3]" />
                          Simulate Check-In
                        </button>
                      )}
                      {(selectedInviteForQr.status === 'Checked In' || selectedInviteForQr.status === 'Checked_In') && (
                        <button
                          type="button"
                          onClick={() => handleSimulateGateScan('Checked Out')}
                          className="py-2.5 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-[9.5px] font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-md shadow-rose-500/20"
                        >
                          <Smartphone size={12} className="stroke-[3]" />
                          Simulate Check-Out
                        </button>
                      )}
                      {(selectedInviteForQr.status === 'Checked Out' || selectedInviteForQr.status === 'Checked_Out') && (
                        <button
                          type="button"
                          onClick={() => handleSimulateGateScan('Expected')}
                          className="py-2.5 px-3 bg-[var(--bg-color)]/60 hover:bg-[var(--panel-bg)]/50 text-[var(--text-primary)] rounded-xl text-[9.5px] font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                        >
                          <RefreshCw size={12} className="stroke-[3]" />
                          Reset Status
                        </button>
                      )}
                      
                      <button
                        type="button"
                        onClick={handlePrintPass}
                        className="py-2.5 px-3 bg-[var(--bg-color)]/80 hover:bg-[var(--panel-bg)]/50 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl text-[9.5px] font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95 border border-[var(--border-color)] cursor-pointer text-center"
                      >
                        <Printer size={12} />
                        Print Badge
                      </button>
                    </div>
                  )}
                </div>

                {/* Print download actions row */}
                <div className="flex justify-between items-center select-none pt-2 border-t border-[var(--border-color)]">
                  <div className="flex items-center gap-1 text-[9px] text-[var(--text-secondary)] opacity-50">
                    <span>Gate Reference ID:</span>
                    <span className="font-mono font-bold">GT-SEC-03</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopyPassPayload(selectedInviteForQr.qrCode)}
                      className="p-2 rounded-xl bg-[var(--bg-color)]/80 hover:bg-[var(--panel-bg)]/50 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                      title="Copy Passcode"
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      onClick={() => handleDownloadPassSvg(selectedInviteForQr)}
                      className="p-2 rounded-xl bg-[var(--bg-color)]/80 hover:bg-[var(--panel-bg)]/50 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                      title="Download Pass Card Data"
                    >
                      <Download size={13} />
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showPreRegisterModal && (
        <AdminPreRegisterModal
          onClose={() => setShowPreRegisterModal(false)}
          onCreated={loadExpectedGuests}
        />
      )}

      {/* ================= GLOBAL FLOATING COMPACT TOAST HUD ================= */}
      <AnimatePresence>
        {toast?.show && (
          <motion.div
            initial={{ opacity: 0, y: -25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -25, scale: 0.95 }}
            className="fixed top-6 right-6 z-[100] max-w-sm w-full bg-[var(--glass-bg)] border border-blue-500/30 shadow-2xl rounded-2xl p-4.5 backdrop-blur-xl flex items-start gap-3.5 select-none text-left"
          >
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/20 shadow-inner flex-shrink-0">
              <CheckCircle2 size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-sans font-black text-[var(--text-primary)] text-xs uppercase tracking-wider">{toast.title}</h4>
              <p className="text-[10px] text-[var(--text-secondary)] opacity-80 mt-1 leading-normal font-medium">{toast.desc}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1 cursor-pointer"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default VisitorAndGateHub;
