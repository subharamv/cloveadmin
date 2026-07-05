import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Phone, Plus, Trash2, CheckCircle2, Clock, AlertCircle, History, X, ArrowUpDown, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

import { DataTable } from './DataTable';

interface CallLog {
  id: string;
  vendorName: string;
  contactNumber: string;
  purpose: string;
  notes: string;
  status: 'pending' | 'completed' | 'follow-up';
  timestamp: any;
  adminId: string;
}

export function CallLogs({ searchTerm: globalSearchTerm = '' }: { searchTerm?: string }) {
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [vendorFilter, setVendorFilter] = useState('All Vendors');
  const [formData, setFormData] = useState({
    vendorName: '',
    contactNumber: '',
    purpose: '',
    notes: '',
    status: 'pending' as const
  });

  useEffect(() => {
    const q = query(collection(db, 'callLogs'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CallLog)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'callLogs'));
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'callLogs'), {
        ...formData,
        adminId: auth.currentUser?.uid,
        timestamp: serverTimestamp()
      });
      setFormData({ vendorName: '', contactNumber: '', purpose: '', notes: '', status: 'pending' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'callLogs');
    }
  };

  const deleteLog = async (id: string) => {
    if (!confirm('Permanently delete this record?')) return;
    try {
      await deleteDoc(doc(db, 'callLogs', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `callLogs/${id}`);
    }
  };

  const vendors = ['All Vendors', ...Array.from(new Set(logs.map(l => l.vendorName)))];

  const effectiveSearch = globalSearchTerm || localSearchTerm;

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.vendorName.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
                         log.contactNumber.includes(effectiveSearch) ||
                         log.purpose.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
                         log.notes.toLowerCase().includes(effectiveSearch.toLowerCase());
    const matchesVendor = vendorFilter === 'All Vendors' || log.vendorName.toLowerCase() === vendorFilter.toLowerCase();
    return matchesSearch && matchesVendor;
  });

  const columns = [
    {
      header: 'Vendor / Contact',
      accessor: (log: CallLog) => (
        <div className="flex flex-col">
          <span className="font-bold text-[var(--text-primary)]">{log.vendorName}</span>
          <span className="text-[10px] font-mono text-[var(--text-secondary)] opacity-60">{log.contactNumber}</span>
        </div>
      )
    },
    {
      header: 'Purpose & Notes',
      accessor: (log: CallLog) => (
        <div className="flex flex-col max-w-sm">
          <span className="text-sm font-medium text-[var(--text-primary)] opacity-90">{log.purpose}</span>
          <span className="text-[11px] text-[var(--text-secondary)] italic line-clamp-1 group-hover:line-clamp-none transition-all opacity-60">
            {log.notes || 'No description provided.'}
          </span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: (log: CallLog) => (
        <span className={cn(
          "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border",
          log.status === 'completed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
          log.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-100" :
          "bg-blue-50 text-blue-600 border-blue-100"
        )}>
          {log.status === 'follow-up' ? 'Follow Up' : log.status}
        </span>
      )
    },
    {
      header: 'Time Recorded',
      accessor: (log: CallLog) => (
        <div className="flex flex-col text-right">
          <span className="text-xs font-bold text-[var(--text-primary)]">
            {log.timestamp?.toDate() ? format(log.timestamp.toDate(), 'dd MMM yyyy') : '...'}
          </span>
          <span className="text-[10px] font-mono text-[var(--text-secondary)] opacity-60">
            {log.timestamp?.toDate() ? format(log.timestamp.toDate(), 'HH:mm') : '--:--'}
          </span>
        </div>
      )
    },
    {
      header: 'Actions',
      accessor: (log: CallLog) => (
        <div className="flex justify-end pr-2">
          <button 
            onClick={() => deleteLog(log.id)}
            className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-color)] p-8 space-y-8 font-sans transition-colors duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Vendor Call Intelligence</h1>
          <p className="text-[var(--text-secondary)] font-medium opacity-70">Log and monitor multi-vendor communication protocols.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group/filter">
            <select
              value={vendorFilter}
              onChange={e => setVendorFilter(e.target.value)}
              className="bg-[var(--panel-bg)] backdrop-blur-sm border border-[var(--border-color)] rounded-2xl py-3 px-6 text-xs font-bold text-[var(--text-primary)] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 transition-all appearance-none cursor-pointer uppercase tracking-widest min-w-[160px] shadow-sm pr-10"
            >
              {vendors.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            <ArrowUpDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-secondary)] pointer-events-none" />
          </div>
          <div className="relative group/search">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] group-focus-within/search:text-blue-500 transition-colors" />
            <input 
              value={localSearchTerm}
              onChange={e => setLocalSearchTerm(e.target.value)}
              placeholder="Filter archives..."
              className="bg-[var(--panel-bg)] backdrop-blur-sm border border-[var(--border-color)] rounded-2xl py-3 pl-12 pr-6 text-xs font-bold text-[var(--text-primary)] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 transition-all w-64 md:w-80 shadow-sm placeholder:text-[var(--text-secondary)]/40 uppercase tracking-widest"
            />
          </div>
        </div>
      </div>

      {/* Entry Form */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--panel-bg)] border border-[var(--border-color)] p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(37,99,235,0.1)] hover:border-blue-500/20"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-blue-600" />
        <h3 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-6 flex items-center gap-2 opacity-60">
          <Plus className="w-3 h-3" /> Initialize_New_Record
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest px-1 opacity-60">Vendor Entity</label>
            <input 
              required
              value={formData.vendorName}
              onChange={e => setFormData({ ...formData, vendorName: e.target.value })}
              className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3 text-sm font-medium outline-none focus:bg-[var(--bg-color)] focus:border-blue-500/50 transition-all text-[var(--text-primary)]"
              placeholder="Company name..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest px-1 opacity-60">Contact Point</label>
            <input 
              required
              value={formData.contactNumber}
              onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
              className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3 text-sm font-mono outline-none focus:bg-[var(--bg-color)] focus:border-blue-500/50 transition-all font-bold text-[var(--text-primary)]"
              placeholder="+91..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest px-1 opacity-60">Engagement Status</label>
            <select 
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3 text-sm font-bold outline-none cursor-pointer appearance-none text-[var(--text-primary)]"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="follow-up">Follow Up</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest px-1 opacity-60">Operational Purpose</label>
            <input 
              required
              value={formData.purpose}
              onChange={e => setFormData({ ...formData, purpose: e.target.value })}
              className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3 text-sm font-medium outline-none focus:bg-[var(--bg-color)] focus:border-blue-500/50 transition-all text-[var(--text-primary)]"
              placeholder="Reason for call..."
            />
          </div>
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest px-1 opacity-60">Intelligence Notes</label>
            <input 
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-3 text-sm font-medium outline-none focus:bg-[var(--bg-color)] focus:border-blue-500/50 transition-all text-[var(--text-primary)]"
              placeholder="Crucial details and feedback..."
            />
          </div>
          <div className="flex items-end">
            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white rounded-xl p-3 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-[0.98]"
            >
              Commit Record
            </button>
          </div>
        </form>
      </motion.div>

      {/* History Table */}
      <div className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-[2.5rem] shadow-sm overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(37,99,235,0.1)] hover:border-blue-500/20">
        <div className="p-8 border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <History className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Intelligence Ledger</h3>
          </div>
          <span className="text-[10px] font-black text-[var(--text-secondary)] font-mono uppercase tracking-[0.2em] opacity-60">{filteredLogs.length} Entries Detected</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[var(--bg-color)] border-b border-[var(--border-color)]">
                {columns.map((col, i) => (
                  <th key={i} className="px-8 py-5 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] opacity-60">{col.header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="group hover:bg-slate-500/5 transition-colors">
                  {columns.map((col, i) => (
                    <td key={i} className="px-8 py-5">
                      {col.accessor(log)}
                    </td>
                  ))}
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="px-8 py-12 text-center text-slate-400 font-medium italic">
                    Zero communication records matched the search parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
