import React, { useState } from 'react';
import { 
  Shield, 
  Settings, 
  LogOut, 
  Activity, 
  Map as MapIcon, 
  Users, 
  AlertTriangle, 
  BarChart3, 
  Lock, 
  Clock, 
  CreditCard,
  CheckCircle2,
  ChevronRight,
  User as UserIcon,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { signOut } from '../lib/firebase';
import GlareHover from './GlareHover';

type Tier = 'Standard' | 'Admin' | 'Master';

export function UserProfileDashboard() {
  const [tier, setTier] = useState<Tier>('Master');

  const tierMeta = {
    Standard: {
      label: 'User Account',
      borderColor: 'border-slate-800',
      accentColor: 'text-slate-400',
      badge: 'bg-slate-900/50 text-slate-500 border-slate-800',
      glare: 'rgba(148, 163, 184, 0.1)'
    },
    Admin: {
      label: 'System Admin',
      borderColor: 'border-blue-500/50',
      accentColor: 'text-blue-500',
      badge: 'bg-blue-900/20 text-blue-400 border-blue-500/30',
      glare: 'rgba(59, 130, 246, 0.2)'
    },
    Master: {
      label: 'System Director',
      borderColor: 'border-white/40',
      accentColor: 'text-white',
      badge: 'bg-white/10 text-white border-white/20',
      glare: 'rgba(255, 255, 255, 0.3)'
    }
  };

  const renderModules = () => {
    switch (tier) {
      case 'Master':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
            <ModuleCard 
              title="Full System Overview" 
              subtitle="Map View • Node Status" 
              icon={MapIcon} 
              tier="Master"
              content={<div className="h-24 bg-slate-900/50 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('https://api.placeholder.com/400/200')] bg-cover opacity-10 grayscale invert" />
                <div className="relative flex flex-col items-center">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
                  <span className="text-[10px] font-mono mt-2 text-white/50 tracking-widest uppercase">742 Nodes Active</span>
                </div>
              </div>}
            />
            <ModuleCard 
              title="Total User Control" 
              subtitle="Permissions • Groups" 
              icon={Users} 
              tier="Master"
              content={<div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-white/40 border-b border-white/5 pb-2">
                  <span>ROOT_ADMIN</span>
                  <span className="text-blue-400 font-mono">1.2.0v</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-white/40">
                  <span>GROUP_POLICIES</span>
                  <span className="text-green-400 uppercase">Enforced</span>
                </div>
              </div>}
            />
            <ModuleCard 
              title="Critical Alerts Hub" 
              subtitle="Threats • Logs" 
              icon={AlertTriangle} 
              tier="Master"
              content={<div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-rose-500 text-[10px] font-black tracking-widest animate-pulse">
                  <div className="w-1 h-1 bg-rose-500 rounded-full" />
                  SEV_0_INTRUSION_DETECTED
                </div>
                <div className="text-[9px] font-mono text-white/20 uppercase tracking-tighter">14:22:04 [BLOCK] 192.168.1.1</div>
              </div>}
            />
            <ModuleCard 
              title="System Health" 
              subtitle="Detailed Graphs" 
              icon={Activity} 
              tier="Master"
              content={<div className="flex items-end gap-1 h-16 pt-4">
                {[40, 70, 45, 90, 65, 85, 45].map((h, i) => (
                  <div key={i} className="flex-1 bg-white/10 rounded-t-sm" style={{ height: `${h}%` }} />
                ))}
              </div>}
            />
          </div>
        );
      case 'Admin':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
            <ModuleCard 
              title="System Overview" 
              subtitle="Charts • Performance" 
              icon={BarChart3} 
              tier="Admin"
              content={<div className="flex flex-col gap-3">
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 w-[72%] h-full" />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>CPU LOAD</span>
                  <span>72%</span>
                </div>
              </div>}
            />
            <ModuleCard 
              title="User Management" 
              subtitle="Focused View" 
              icon={Users} 
              tier="Admin"
              content={<div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">U{i}</div>)}
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">+ 14 Pending</span>
              </div>}
            />
            <ModuleCard 
              title="Security Logs" 
              subtitle="Tabbed Views" 
              icon={Lock} 
              tier="Admin"
              content={<div className="bg-slate-900/50 p-3 rounded-lg border border-blue-500/10 font-mono text-[9px] text-slate-400 leading-relaxed">
                {">"} LOGIN_SUCCESS [UID: 94...]<br />
                {">"} AUTH_TOKEN_REFRESHED<br />
                {">"} IP_VERIFIED_ASIA_SE1
              </div>}
            />
            <ModuleCard 
              title="Analytics" 
              subtitle="Detailed Graphs" 
              icon={Activity} 
              tier="Admin"
              content={<div className="h-16 flex items-center justify-center border-t border-slate-800 mt-2">
                <span className="text-[10px] font-black text-blue-400/50 uppercase tracking-[0.4em]">Optimizing...</span>
              </div>}
            />
          </div>
        );
      case 'Standard':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
            <ModuleCard 
              title="My Activity Feed" 
              subtitle="Recent Actions" 
              icon={Clock} 
              tier="Standard"
              content={<div className="space-y-2">
                <div className="flex items-center gap-3 text-[11px] text-slate-400 border-b border-white/5 pb-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>Profile updated yesterday</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <Lock className="w-3 h-3 text-blue-500" />
                  <span>Password changed 2w ago</span>
                </div>
              </div>}
            />
            <ModuleCard 
              title="Account Settings" 
              subtitle="Preferences" 
              icon={Settings} 
              tier="Standard"
              content={<div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500">2FA_SECURE</span>
                  <div className="w-8 h-4 bg-emerald-500/20 border border-emerald-500/50 rounded-full flex items-center justify-end px-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  </div>
                </div>
              </div>}
            />
            <ModuleCard 
              title="My Tickets & Support" 
              subtitle="Open Tickets" 
              icon={Users} 
              tier="Standard"
              content={<div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400">#4492 - LOGIN_ISSUE</span>
                <span className="text-[9px] bg-slate-800 px-2 py-1 rounded text-slate-500">CLOSED</span>
              </div>}
            />
            <ModuleCard 
              title="Personalized Preferences" 
              subtitle="Custom View" 
              icon={Settings} 
              tier="Standard"
              content={<div className="flex gap-2">
                <div className="w-6 h-6 rounded bg-slate-800" />
                <div className="w-6 h-6 rounded bg-blue-500" />
                <div className="w-6 h-6 rounded bg-rose-500" />
              </div>}
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-full bg-[var(--bg-color)] overflow-hidden relative flex flex-col items-center justify-center p-8 transition-colors duration-300">
      {/* Background Cinematic Bokeh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 dark:bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/5 dark:bg-purple-600/10 blur-[120px] rounded-full delay-1000 animate-pulse" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] dark:opacity-20 contrast-150 brightness-50" />
      </div>

      {/* CloveHQ Platform Label */}
      <div className="absolute top-10 left-10 z-50">
        <p className="text-[10px] font-mono tracking-[0.8em] text-[var(--text-secondary)] uppercase font-black opacity-20">CloveHQ Platform</p>
      </div>

      {/* Tier Switcher (For Demo purposes in this task) */}
      <div className="absolute top-10 right-10 z-50 flex gap-2">
        {(['Standard', 'Admin', 'Master'] as Tier[]).map(t => (
          <button 
            key={t}
            onClick={() => setTier(t)}
            className={cn(
              "px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border transition-all",
              tier === t ? "bg-[var(--text-primary)] text-[var(--bg-color)] border-[var(--text-primary)]" : "border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center gap-12">
        {/* Main Identity Block */}
        <div className="w-full max-w-md">
          <GlareHover 
            className="w-full"
            borderRadius="2rem"
            borderColor={tier === 'Standard' ? 'rgba(51, 65, 85, 0.2)' : tier === 'Admin' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.2)'}
            glareOpacity={tier === 'Master' ? 0.3 : 0.15}
            glareColor={tier === 'Master' ? '#ffffff' : tier === 'Admin' ? '#3b82f6' : '#94a3b8'}
          >
            <div className={cn(
              "bg-[var(--panel-bg)] backdrop-blur-3xl border-2 p-10 rounded-[2rem] transition-all duration-700 relative overflow-hidden",
              tierMeta[tier].borderColor
            )}>
              {/* Inner Decorative Elements for Hierarchy */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-20" />
              
              <div className="flex flex-col items-center text-center">
                <span className={cn("text-[10px] font-black uppercase tracking-[0.6em] mb-6 animate-in fade-in slide-in-from-top-4 duration-1000", tierMeta[tier].accentColor)}>
                  {tierMeta[tier].label}
                </span>

                {/* Blue Avatar */}
                <motion.div 
                  layoutId="avatar"
                  className={cn(
                    "w-32 h-32 bg-blue-600 rounded-3xl mb-8 flex items-center justify-center relative shadow-2xl",
                    tier === 'Master' ? "shadow-white/5" : "shadow-blue-500/10"
                  )}
                >
                  <UserIcon className="w-16 h-16 text-white/90" />
                  {tier === 'Master' && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute -inset-2 border border-[var(--text-primary)]/20 rounded-[2.2rem] -z-10"
                    />
                  )}
                  {/* Status Indicator */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[var(--bg-color)] rounded-full border-4 border-[var(--bg-color)] flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                  </div>
                </motion.div>

                <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tighter mb-1 uppercase italic">VISHAL DAS</h1>
                <p className="text-xs font-mono text-[var(--text-secondary)] tracking-wider mb-6 opacity-60">vishaldas6599@gmail.com</p>

                {tier === 'Master' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-2 mb-2"
                  >
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                      <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">All Nodes Online</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </GlareHover>
        </div>

        {/* Dynamic Modules */}
        <motion.div 
          layout
          className="w-full"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={tier}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {renderModules()}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Universal Log Out Button */}
        <div className="mt-12 flex flex-col items-center gap-8">
          <div className="w-px h-16 bg-gradient-to-b from-white/10 to-transparent" />
          <button 
            onClick={signOut}
            className="group relative px-12 py-5 bg-transparent overflow-hidden"
          >
            <div className="absolute inset-0 border border-red-500/40 group-hover:border-red-500 rounded-xl transition-all duration-300" />
            <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/5 transition-all duration-300" />
            <div className="relative flex items-center gap-3">
              <LogOut className="w-4 h-4 text-red-500 transition-transform group-hover:translate-x-1" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500 transition-all group-hover:tracking-[0.6em] duration-500">Log Out</span>
            </div>
          </button>
          
          <div className="flex items-center gap-4 text-[var(--text-secondary)] mb-8 opacity-20">
            <div className="w-8 h-[1px] bg-[var(--border-color)]" />
            <p className="text-[8px] font-mono tracking-[0.5em] uppercase">Security Protocol 8.4.1</p>
            <div className="w-8 h-[1px] bg-[var(--border-color)]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ModuleCard({ title, subtitle, icon: Icon, content, tier }: { title: string, subtitle: string, icon: any, content: React.ReactNode, tier: Tier }) {
  return (
    <GlareHover 
      borderRadius="1.5rem"
      borderColor={tier === 'Master' ? 'rgba(255,255,255,0.05)' : 'rgba(var(--text-primary-rgb), 0.05)'}
      glareOpacity={0.1}
      className="group"
    >
      <div className="bg-[var(--panel-bg)] backdrop-blur-md border border-[var(--border-color)] p-6 rounded-3xl h-full flex flex-col hover:bg-[var(--panel-bg)]/80 transition-colors">
        <div className="flex items-start justify-between mb-4">
          <div className="p-2.5 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)] group-hover:bg-blue-500/10 group-hover:border-blue-500 group-hover:text-blue-500 transition-colors">
            <Icon className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-current transition-colors" />
          </div>
          <ChevronRight className="w-3 h-3 text-[var(--border-color)] group-hover:text-[var(--text-primary)] transition-colors" />
        </div>
        <div>
          <h4 className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-widest mb-1 group-hover:translate-x-1 transition-transform">{title}</h4>
          <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-tighter mb-4 opacity-40">{subtitle}</p>
        </div>
        <div className="flex-1 text-[var(--text-primary)]">
          {content}
        </div>
      </div>
    </GlareHover>
  );
}
