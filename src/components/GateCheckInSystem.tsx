import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scan, 
  UserPlus, 
  CheckCircle2, 
  Mail, 
  MessageSquare, 
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function GateCheckInSystem() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<null | 'success'>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    hostEmail: '',
    purpose: ''
  });

  const handleScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanResult(null);

    // Simulated scanning process
    setTimeout(() => {
      setIsScanning(false);
      setScanResult('success');
      
      // Simulated Email/WhatsApp Notification
      console.log(`NOTIFICATION TRIGGERED: Host (${formData.hostEmail || 'sarah.chen@clove.io'}) informed via WhatsApp/Email.`);
      
      // Auto-clear success message after 3s
      setTimeout(() => setScanResult(null), 3000);
    }, 2500);
  };

  return (
    <div className="min-h-[800px] bg-[var(--bg-color)] p-8 rounded-[3rem] border border-[var(--border-color)] relative font-sans shadow-2xl transition-colors duration-300 selection:bg-blue-500/10">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      {/* Header */}
      <div className="mb-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[var(--panel-bg)] rounded-2xl flex items-center justify-center shadow-lg border border-[var(--border-color)] transition-colors">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Gate Access Operations</h2>
            <p className="text-xs text-[var(--text-secondary)] opacity-40 font-medium uppercase tracking-[0.2em] mt-1">Enterprise Registration Hub</p>
          </div>
        </div>
        <div className="px-4 py-2 bg-[var(--panel-bg)] rounded-full border border-[var(--border-color)] shadow-sm flex items-center gap-3 transition-colors">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-[var(--text-secondary)] opacity-60 uppercase tracking-widest">System_Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Section: Registration */}
        <section className="space-y-8">
          <div className="flex items-center gap-3 px-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-[var(--text-primary)] opacity-80 tracking-tight">Visitor Pre-Registration</h3>
          </div>

          <form className="space-y-6 bg-[var(--panel-bg)] backdrop-blur-2xl border border-[var(--border-color)] p-8 rounded-[2.5rem] shadow-xl hover:border-blue-500/20 transition-all duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--text-secondary)] opacity-40 uppercase tracking-widest px-1">Visitor Full Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="EX: Alex J. Hunter"
                  className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all text-[var(--text-primary)] placeholder:opacity-20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--text-secondary)] opacity-40 uppercase tracking-widest px-1">Visitor Email</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="alex@company.com"
                  className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all text-[var(--text-primary)] placeholder:opacity-20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--text-secondary)] opacity-40 uppercase tracking-widest px-1">Internal Host Entity</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] opacity-30" />
                <input 
                  type="email" 
                  value={formData.hostEmail}
                  onChange={e => setFormData({ ...formData, hostEmail: e.target.value })}
                  placeholder="host@enterprise.io"
                  className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-2xl py-4 pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--text-secondary)] opacity-40 uppercase tracking-widest px-1">Operational Purpose</label>
              <textarea 
                value={formData.purpose}
                onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="Brief description of visit..."
                className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-2xl p-4 text-sm font-medium h-32 resize-none outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all text-[var(--text-primary)] placeholder:opacity-20"
              />
            </div>

            <button type="button" className="w-full bg-blue-600 text-white rounded-[1.5rem] py-5 font-bold uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
              Generate Identity Token <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </section>

        {/* Right Section: Scanner */}
        <section className="space-y-8">
          <div className="flex items-center gap-3 px-2">
            <Scan className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-[var(--text-primary)] opacity-80 tracking-tight">Access Terminal</h3>
          </div>

          <div className="bg-[var(--panel-bg)] backdrop-blur-2xl border border-[var(--border-color)] p-12 rounded-[2.5rem] shadow-xl hover:border-blue-500/20 transition-all duration-500 flex flex-col items-center justify-center text-center space-y-10 min-h-[500px]">
            <div className="relative">
              <motion.div 
                animate={isScanning ? { 
                  scale: [1, 1.05, 1],
                  borderColor: ["rgba(37,99,235,0.2)", "rgba(37,99,235,0.6)", "rgba(37,99,235,0.2)"]
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-64 h-64 border-4 border-[var(--border-color)] rounded-[3rem] bg-[var(--bg-color)] flex items-center justify-center relative shadow-inner overflow-hidden"
              >
                {/* Scanning Animation */}
                {isScanning && (
                  <motion.div 
                    initial={{ top: '0%' }}
                    animate={{ top: '100%' }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] z-10"
                  />
                )}

                <AnimatePresence mode="wait">
                  {scanResult === 'success' ? (
                    <motion.div 
                      key="success"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center"
                    >
                      <CheckCircle2 className="w-20 h-20 text-green-500 mb-4" />
                      <span className="text-[10px] font-black uppercase text-green-600 tracking-widest">Authenticated</span>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center text-[var(--text-secondary)] opacity-30 group cursor-pointer"
                      onClick={handleScan}
                    >
                      <Smartphone className={cn("w-24 h-24 transition-all duration-500", isScanning ? "text-blue-500 scale-90 opacity-100" : "group-hover:text-blue-500 group-hover:scale-110 group-hover:opacity-100")} />
                      {isScanning ? (
                        <div className="flex items-center gap-2 mt-4 text-blue-500 opacity-100">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Decrypting...</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-widest mt-4">Place Device Here</span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Toast Notification Simulation */}
              <AnimatePresence>
                {scanResult === 'success' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute -top-16 left-1/2 -translate-x-1/2 bg-[var(--text-primary)] text-[var(--bg-color)] px-6 py-3 rounded-2xl shadow-2xl whitespace-nowrap flex items-center gap-3 z-50"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <div className="text-left">
                      <p className="text-[10px] font-bold">Access Granted</p>
                      <p className="text-[8px] opacity-60 uppercase tracking-widest">Host notified via Secure-Channel</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-4 max-w-xs">
              <p className="text-sm font-medium text-[var(--text-secondary)] opacity-70">
                Place your unique digital identity token or company QR code within the scanning perimeter.
              </p>
              <div className="flex items-center justify-center gap-6 pt-4 text-[var(--text-secondary)] opacity-30 border-t border-[var(--border-color)]">
                <div className="flex flex-col items-center gap-1 group cursor-help hover:opacity-100 transition-opacity">
                  <Smartphone className="w-5 h-5 group-hover:text-blue-500 transition-colors" />
                  <span className="text-[8px] uppercase font-bold tracking-widest">App Access</span>
                </div>
                <div className="flex flex-col items-center gap-1 group cursor-help hover:opacity-100 transition-opacity">
                  <Mail className="w-5 h-5 group-hover:text-blue-500 transition-colors" />
                  <span className="text-[8px] uppercase font-bold tracking-widest">Email Token</span>
                </div>
                <div className="flex flex-col items-center gap-1 group cursor-help hover:opacity-100 transition-opacity">
                  <MessageSquare className="w-5 h-5 group-hover:text-blue-500 transition-colors" />
                  <span className="text-[8px] uppercase font-bold tracking-widest">WhatsApp</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
