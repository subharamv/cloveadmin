import React, { useState, useEffect } from 'react';
import InteractiveSidebar from './InteractiveSidebar';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import DotField from './DotField';

import { 
  LayoutDashboard, 
  PhoneCall, 
  Plane,
  ClipboardList, 
  User as UserIcon,
  Search,
  Sun,
  Moon,
  Home,
  Building2,
  Shield,
  Database,
  Wallet,
  LogOut
} from 'lucide-react';

const NAVIGATION_ITEMS = [
  { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
  { id: 'securityHub', label: 'GATE & VISITORS', icon: Shield },
  { id: 'travelHub', label: 'TRAVEL & CABS', icon: Plane },
  { id: 'billPayments', label: 'BILL PAYMENTS', icon: Wallet },
  { id: 'calls', label: 'CALLS', icon: PhoneCall },
  { id: 'tasks', label: 'TASKS', icon: ClipboardList },
  { id: 'facility', label: 'FACILITY', icon: Building2 },
  { id: 'backend_viewer', label: 'DB CORE MONITOR', icon: Database },
  { id: 'profile', label: 'PROFILE', icon: UserIcon },
];

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: { username: string; role: string };
  onLogout: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}

export function Layout({ children, activeTab, setActiveTab, user, onLogout, searchTerm, setSearchTerm, isDarkMode, setIsDarkMode }: LayoutProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex h-screen bg-[var(--bg-color)]/2 text-[var(--text-primary)] font-sans overflow-hidden relative">
      {/* Global Particle Background Underlay */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40 dark:opacity-25 translate-z-0">
        <DotField 
          cursorForce={0.4} 
          dotSpacing={7} 
          gradientFrom={isDarkMode ? "rgba(59, 130, 246, 0.18)" : "rgba(37, 99, 235, 0.08)"} 
          gradientTo={isDarkMode ? "rgba(99, 102, 241, 0.08)" : "rgba(224, 231, 255, 0.05)"}
          bulgeStrength={12} 
          glowColor={isDarkMode ? "rgba(59, 130, 246, 0.15)" : "rgba(219, 234, 254, 0.4)"}
          className="w-full h-full"
        />
      </div>

      <InteractiveSidebar activeTab={activeTab} setActiveTab={setActiveTab} user={{ displayName: user.username, email: user.username }} isDarkMode={isDarkMode} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Remove the redundant underlay from here */}
        {/* Immersive Top Navbar Dock */}
        <div className="h-auto min-h-[68px] md:h-[68px] border-b border-[var(--border-color)] bg-[var(--panel-bg)]/80 backdrop-blur-3xl flex items-center px-8 pl-12 relative overflow-hidden group transition-all duration-300">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(59,130,246,0.15),transparent_70%)] pointer-events-none" />
          <div className="scanline opacity-[0.01]" />
          <div className="absolute inset-0 bg-grid opacity-[0.02] pointer-events-none" />
          
          {/* Static Accent Line */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/10 to-transparent pointer-events-none" />
          
          {/* Decorative Corner Accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-l border-t border-blue-500/20" />
          <div className="absolute top-0 right-0 w-4 h-4 border-r border-t border-blue-500/20" />
          
          {/* Status Row */}
          <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between py-2 md:py-0 gap-4 md:gap-0 select-none">
            <div className="flex items-center gap-3">
              {(() => {
                const nav = NAVIGATION_ITEMS.find(item => item.id === activeTab);
                const Icon = nav?.icon;
                return Icon ? <Icon size={16} className="text-blue-500 dark:text-blue-400" /> : null;
              })()}
              <div className="h-4 w-[1px] bg-[var(--border-color)] opacity-30 mx-1 hidden md:block" />
              <span className="text-[11px] font-display font-bold uppercase tracking-[0.25em] text-[var(--text-primary)] opacity-95">
                {NAVIGATION_ITEMS.find(item => item.id === activeTab)?.label || 'DASHBOARD'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 md:gap-5">
              {/* Home Button */}
              <div className="flex flex-col items-center">
                <span className={cn(
                  "text-[7px] font-mono uppercase tracking-[0.4em] mb-1 transition-opacity",
                  isDarkMode ? "text-[var(--text-secondary)] opacity-30" : "text-[var(--text-secondary)] opacity-60"
                )}>Return</span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab('dashboard')}
                  className="p-2 rounded-lg bg-[var(--bg-color)] border border-[var(--border-color)] hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group/home shadow-sm cursor-pointer"
                  title="Return to Dashboard"
                >
                  <Home size={12} className="text-blue-500" />
                </motion.button>
              </div>

              <div className="w-px h-6 bg-[var(--border-color)] opacity-20" />

              {/* Theme Toggle */}
              <div className="flex flex-col items-center">
                <span className={cn(
                  "text-[7px] font-mono uppercase tracking-[0.4em] mb-1 transition-opacity",
                  isDarkMode ? "text-[var(--text-secondary)] opacity-30" : "text-[var(--text-secondary)] opacity-60"
                )}>Display</span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-2 rounded-lg bg-[var(--bg-color)] border border-[var(--border-color)] hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group/mode shadow-sm cursor-pointer"
                  title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={isDarkMode ? 'dark' : 'light'}
                      initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                      transition={{ duration: 0.3 }}
                    >
                      {isDarkMode ? (
                        <Sun size={12} className="text-amber-400" />
                      ) : (
                        <Moon size={12} className="text-blue-600" />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </motion.button>
              </div>

              <div className="w-px h-6 bg-[var(--border-color)] opacity-20" />

              {/* Log Out */}
              <div className="flex flex-col items-center">
                <span className={cn(
                  "text-[7px] font-mono uppercase tracking-[0.4em] mb-1 transition-opacity",
                  isDarkMode ? "text-[var(--text-secondary)] opacity-30" : "text-[var(--text-secondary)] opacity-60"
                )}>Exit</span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onLogout}
                  className="p-2 rounded-lg bg-[var(--bg-color)] border border-[var(--border-color)] hover:border-red-500/40 hover:bg-red-500/5 transition-all group/exit shadow-sm text-red-500 cursor-pointer"
                  title="Disconnect Station (Log Out)"
                >
                  <LogOut size={12} className="text-rose-500 opacity-80 group-hover/exit:opacity-100 transition-opacity" />
                </motion.button>
              </div>

              <div className="w-px h-6 bg-[var(--border-color)] hidden lg:block opacity-20" />

              <div className="flex flex-col">
                <span className={cn(
                  "text-[7px] font-mono uppercase tracking-[0.4em] mb-1 transition-opacity",
                  isDarkMode ? "text-[var(--text-secondary)] opacity-30" : "text-[var(--text-secondary)] opacity-60"
                )}>Health</span>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1 h-3 items-end bg-[var(--bg-color)] p-0.5 rounded-sm border border-[var(--border-color)]">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 4, opacity: 0.2 }}
                        animate={{ 
                          height: [4, 10, 6],
                          opacity: [0.2, 1, 0.6],
                          backgroundColor: i > 5 ? '#3b82f6' : '#22c55e'
                        }}
                        transition={{ 
                          duration: 1.5, 
                          delay: i * 0.1,
                          ease: "easeOut"
                        }}
                        className="w-[1.5px] rounded-full"
                      />
                    ))}
                  </div>
                  <span className="text-[9px] font-bold text-green-500/90 uppercase tracking-widest flex items-center gap-1.5">
                    <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                    LIVE
                  </span>
                </div>
              </div>

              <div className="w-px h-6 bg-[var(--border-color)] opacity-20" />

              {/* Global Search Bar */}
              <div className="hidden xl:flex flex-col items-start">
                <span className={cn(
                  "text-[7px] font-mono uppercase tracking-[0.4em] mb-1 ml-3 transition-opacity",
                  isDarkMode ? "text-[var(--text-secondary)] opacity-20" : "text-[var(--text-secondary)] opacity-50"
                )}>Search</span>
                <div className="relative group/search">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search size={10} className={cn(
                      "transition-all",
                      isDarkMode ? "text-[var(--text-secondary)] opacity-30 group-focus-within/search:text-blue-500 group-focus-within/search:opacity-100" : "text-[var(--text-secondary)] opacity-50 group-focus-within/search:text-blue-600 group-focus-within/search:opacity-100"
                    )} />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="SYS_QUERY..."
                    className="h-8 w-48 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg pl-8 pr-3 text-[9px] font-mono text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] placeholder:opacity-20 focus:outline-none focus:border-blue-500/50 focus:bg-[var(--bg-color)] transition-all tracking-widest uppercase shadow-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className={cn(
                  "text-[7px] font-mono uppercase tracking-[0.4em] mb-0.5 transition-opacity",
                  isDarkMode ? "text-[var(--text-secondary)] opacity-30" : "text-[var(--text-secondary)] opacity-60"
                )}>Time</span>
                <div className="text-lg font-display font-black tracking-tighter text-[var(--text-primary)] opacity-90">
                  {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                </div>
              </div>
            </div>
          </div>

        </div>
        
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative bg-transparent">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.03),transparent_50%)] pointer-events-none" />
          <div className="absolute inset-0 bg-grid opacity-[0.1]" />
          <div className="relative z-10 w-full max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
