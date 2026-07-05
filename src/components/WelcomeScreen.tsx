import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Command } from 'lucide-react';
import DarkVeil from './DarkVeil';

interface WelcomeScreenProps {
  onEnter: () => void;
  isDarkMode: boolean;
}

export function WelcomeScreen({ onEnter }: WelcomeScreenProps) {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      html, body {
        margin: 0;
        padding: 0;
        height: 100%;
        width: 100%;
        overflow: hidden;
      }
    `;
    document.head.appendChild(style);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        onEnter();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.head.removeChild(style);
    };
  }, [onEnter]);

  return (
    <div className="min-h-screen relative overflow-hidden font-sans selection:bg-blue-500/30 bg-[#050505]">
      <div className="fixed inset-0 z-0 h-full w-full pointer-events-none">
        <DarkVeil
          speed={0.2}
          scanlineIntensity={1.0}
          warpAmount={0.12}
          noiseIntensity={0.03}
          scanlineFrequency={2.5}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505] opacity-60" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <div className="max-w-4xl w-full flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="mb-8"
          >
            <div className="relative">
              <ShieldCheck className="w-14 h-14 text-blue-500 drop-shadow-[0_0_20px_rgba(59,130,246,0.6)]" />
              <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-30 animate-pulse" />
            </div>
          </motion.div>

          <div className="space-y-2 mb-10">
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-base font-bold tracking-[0.5em] uppercase text-blue-400/60"
            >
              The Admins of
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="text-7xl font-black italic tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-200 to-slate-500 drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
            >
              Clove
            </motion.h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mb-12"
          >
            <div className="border rounded-full px-8 py-3 flex items-center gap-3 bg-blue-950/40 border-blue-500/20 backdrop-blur-md shadow-lg">
              <div className="w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_12px_rgba(96,165,250,1)] animate-pulse" />
              <span className="text-[11px] font-mono font-black uppercase tracking-[0.5em] text-blue-300">Biometric_Auth_Confirmed</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="space-y-2 mb-16 font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500/80"
          >
            <p className="flex items-center justify-center gap-2">
              <span className="w-1 h-1 rounded-full bg-slate-700" />
              System_OS: V5.2.0_FINAL
            </p>
            <p className="flex items-center justify-center gap-2">
              <span className="w-1 h-1 rounded-full bg-slate-700" />
              Encryption: X25519_REALTIME | Node: AP-SOUTHEAST-ADMIN_PORTAL
            </p>
          </motion.div>

          <motion.button
            onClick={onEnter}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative w-full max-w-sm group"
          >
            <div className="absolute inset-0 bg-blue-500/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="relative backdrop-blur-2xl border border-white/10 rounded-full p-2.5 flex items-center justify-between bg-white/5 shadow-2xl transition-all duration-500 group-hover:border-white/30 group-hover:shadow-blue-500/10">
              <div className="flex items-center gap-5 pl-5">
                <Command className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                <span className="text-sm font-black uppercase tracking-[0.2em] text-white">Initialize Systems</span>
              </div>

              <div className="px-8 py-4 rounded-full bg-white text-slate-900 text-xs font-black tracking-[0.2em] shadow-xl hover:bg-blue-50 transition-all">
                ENTER
              </div>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
