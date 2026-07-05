import React, { useRef, useState, useCallback, useLayoutEffect, useEffect } from 'react';
import {
  LayoutDashboard,
  PhoneCall,
  ClipboardList,
  Building2,
  Shield,
  Database,
  Plane,
  Wallet,
  User as UserIcon,
  LogOut,
  ChevronLeft,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { signOut } from '../lib/firebase';
import { gsap } from 'gsap';

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

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  user: {
    displayName?: string | null;
    email?: string | null;
  };
  isDarkMode: boolean;
}

const COLLAPSED_WIDTH = 68;
const EXPANDED_WIDTH = 224;
const ANIMATION_DURATION = 0.25;

export default function InteractiveSidebar({ activeTab, setActiveTab, user, isDarkMode }: SidebarProps) {
  const [expanded, setExpanded] = useState(() => localStorage.getItem('sidebarExpanded') === 'true');
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const iconRef = useRef<HTMLDivElement>(null);
  const userLabelRef = useRef<HTMLDivElement>(null);
  const disconnectLabelRef = useRef<HTMLSpanElement>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    localStorage.setItem('sidebarExpanded', String(expanded));
  }, [expanded]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const handleMobileNav = (tabId: string) => {
    setActiveTab(tabId);
    setMobileOpen(false);
  };

  const animateLabels = useCallback((show: boolean) => {
    const targets = labelsRef.current.filter(Boolean);
    if (!targets.length) return;
    gsap.killTweensOf(targets);
    if (show) {
      gsap.set(targets, { display: 'inline-block' });
      gsap.fromTo(targets, 
        { opacity: 0, x: -8 },
        { opacity: 1, x: 0, duration: ANIMATION_DURATION * 0.6, ease: 'power2.out', stagger: 0.02 }
      );
    } else {
      gsap.to(targets, {
        opacity: 0, x: -8, duration: ANIMATION_DURATION * 0.4, ease: 'power1.in',
        onComplete: () => gsap.set(targets, { display: 'none' })
      });
    }
  }, []);

  const animateUserLabel = useCallback((show: boolean) => {
    const el = userLabelRef.current;
    if (!el) return;
    gsap.killTweensOf(el);
    if (show) {
      gsap.set(el, { display: 'block' });
      gsap.fromTo(el, { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: ANIMATION_DURATION * 0.5, ease: 'power2.out' });
    } else {
      gsap.to(el, { opacity: 0, x: -6, duration: ANIMATION_DURATION * 0.35, ease: 'power1.in', onComplete: () => gsap.set(el, { display: 'none' }) });
    }
  }, []);

  const animateDisconnectLabel = useCallback((show: boolean) => {
    const el = disconnectLabelRef.current;
    if (!el) return;
    gsap.killTweensOf(el);
    if (show) {
      gsap.set(el, { display: 'inline-block' });
      gsap.fromTo(el, { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: ANIMATION_DURATION * 0.5, ease: 'power2.out' });
    } else {
      gsap.to(el, { opacity: 0, x: -6, duration: ANIMATION_DURATION * 0.35, ease: 'power1.in', onComplete: () => gsap.set(el, { display: 'none' }) });
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;

    const target = !expanded;
    const sidebar = sidebarRef.current;
    if (!sidebar) { busyRef.current = false; return; }

    const tl = gsap.timeline({
      onComplete: () => {
        setExpanded(target);
        busyRef.current = false;
      }
    });

    tl.to(sidebar, {
      width: target ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
      duration: ANIMATION_DURATION,
      ease: 'power3.out',
      overwrite: 'auto'
    }, 0);

    if (iconRef.current) {
      tl.to(iconRef.current, {
        rotation: target ? 180 : 0,
        duration: ANIMATION_DURATION * 0.6,
        ease: 'power2.out',
        overwrite: 'auto'
      }, 0);
    }

    tl.call(() => {
      if (target) {
        animateLabels(true);
        animateUserLabel(true);
        animateDisconnectLabel(true);
      } else {
        animateLabels(false);
        animateUserLabel(false);
        animateDisconnectLabel(false);
      }
    }, [], 0, ANIMATION_DURATION * 0.5);
  }, [expanded, animateLabels, animateUserLabel, animateDisconnectLabel]);

  return (
    <>
    {/* Mobile hamburger trigger — desktop keeps the collapsible rail above, this is mobile-only */}
    <button
      onClick={() => setMobileOpen(true)}
      className="md:hidden fixed top-4 left-4 z-[70] p-2 rounded-lg bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-secondary)] shadow-sm active:scale-95 transition-transform"
      title="Open menu"
    >
      <Menu size={16} strokeWidth={2.5} />
    </button>

    {/* Mobile Drawer + Backdrop */}
    <AnimatePresence>
      {mobileOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="md:hidden fixed inset-y-0 left-0 w-[78vw] max-w-[280px] z-[90] bg-[var(--panel-bg)] border-r border-[var(--border-color)] flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between h-16 px-4 border-b border-[var(--border-color)] shrink-0">
              <span className="text-[11px] font-mono font-black uppercase tracking-[0.3em] text-[var(--text-primary)] opacity-80">Menu</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-blue-500 hover:border-blue-500/50 transition-colors"
                title="Close menu"
              >
                <X size={16} />
              </button>
            </div>

            <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto custom-scrollbar">
              {NAVIGATION_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMobileNav(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer group",
                      isActive
                        ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-color)] border border-transparent"
                    )}
                  >
                    <div className="flex items-center justify-center w-8 h-8 shrink-0">
                      <Icon size={16} className={cn(isActive ? "text-blue-500" : "group-hover:text-blue-500 transition-colors")} />
                    </div>
                    <span className="text-[11px] font-mono font-bold tracking-wider uppercase truncate">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-[var(--border-color)] p-3 space-y-2 shrink-0">
              <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
                  <UserIcon size={13} />
                </div>
                <div>
                  <p className="text-[9px] font-mono font-bold tracking-wider text-[var(--text-primary)] truncate max-w-[160px]">
                    {user?.displayName || user?.email || 'USER'}
                  </p>
                  <p className="text-[7px] font-mono text-[var(--text-secondary)] opacity-50 truncate max-w-[160px]">
                    CONNECTED
                  </p>
                </div>
              </div>

              <button
                onClick={signOut}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-red-500/10 bg-red-500/[0.02] hover:bg-red-500/10 hover:border-red-500/30 text-red-500/60 hover:text-red-500 transition-colors cursor-pointer w-full"
                title="Log Out"
              >
                <LogOut size={14} className="shrink-0" />
                <span className="text-[9px] font-mono font-bold tracking-widest uppercase">
                  DISCONNECT
                </span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

    {/* Desktop collapsible rail — hidden on mobile in favor of the hamburger drawer above */}
    <div
      ref={sidebarRef}
      className="hidden md:flex h-screen bg-[var(--panel-bg)]/60 border-r border-[var(--border-color)] relative z-[60] flex-col backdrop-blur-xl overflow-hidden"
      style={{ width: COLLAPSED_WIDTH }}
    >
      {/* Toggle Button */}
      <div className="flex items-center justify-center h-16 border-b border-[var(--border-color)] shrink-0">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg bg-[var(--bg-color)] border border-[var(--border-color)] hover:border-blue-500/50 hover:bg-blue-500/5 transition-colors cursor-pointer text-[var(--text-secondary)] hover:text-blue-500"
          title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <div ref={iconRef}>
            {expanded ? <ChevronLeft size={14} strokeWidth={3} /> : <Menu size={14} strokeWidth={3} />}
          </div>
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto custom-scrollbar">
        {NAVIGATION_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer group",
                isActive
                  ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-color)] border border-transparent"
              )}
              title={item.label}
            >
              <div className="flex items-center justify-center w-8 h-8 shrink-0">
                <Icon size={16} className={cn(isActive ? "text-blue-500" : "group-hover:text-blue-500 transition-colors")} />
              </div>
              <span
                ref={el => { labelsRef.current[NAVIGATION_ITEMS.indexOf(item)] = el; }}
                className="text-[10px] font-mono font-bold tracking-wider uppercase truncate"
                style={{ display: 'none' }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-[var(--border-color)] p-3 space-y-2 shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
          <div className="w-7 h-7 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
            <UserIcon size={13} />
          </div>
          <div ref={userLabelRef} style={{ display: 'none' }}>
            <p className="text-[9px] font-mono font-bold tracking-wider text-[var(--text-primary)] truncate max-w-[120px]">
              {user?.displayName || user?.email || 'USER'}
            </p>
            <p className="text-[7px] font-mono text-[var(--text-secondary)] opacity-50 truncate max-w-[120px]">
              CONNECTED
            </p>
          </div>
        </div>

        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-red-500/10 bg-red-500/[0.02] hover:bg-red-500/10 hover:border-red-500/30 text-red-500/60 hover:text-red-500 transition-colors cursor-pointer w-full"
          title="Log Out"
        >
          <LogOut size={14} className="shrink-0" />
          <span
            ref={disconnectLabelRef}
            className="text-[9px] font-mono font-bold tracking-widest uppercase"
            style={{ display: 'none' }}
          >
            DISCONNECT
          </span>
        </button>
      </div>
    </div>
    </>
  );
}
