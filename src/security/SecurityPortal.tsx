import { useState, FormEvent, useEffect } from 'react';
import { ShieldCheck, UserPlus, Users, History, LogOut, Loader2, Activity, Sun, Moon, Eye, EyeOff, KeyRound, Lock, QrCode } from 'lucide-react';
import { login, logout, getStoredSession, AppUser } from '../lib/auth';
import { fetchActiveVisitors, fetchVisitorLogs } from './api';
import { EntryForm } from './EntryForm';
import { ActiveEntries } from './ActiveEntries';
import { HistoryLogs } from './HistoryLogs';
import { QuickCheckoutList } from './QuickCheckoutList';
import { QrScanModal } from './QrScanModal';
import { PinInput } from '../components/PinInput';

type View = 'entry' | 'active' | 'history';

const ALLOWED_ROLES = ['Security', 'Master Admin'];

const REMEMBERED_EMAILS_KEY = 'security_login_emails';
const DEFAULT_SECURITY_EMAIL = 'security@clovetech.com';

function getRememberedEmails(): string[] {
  try {
    const raw = localStorage.getItem(REMEMBERED_EMAILS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function rememberEmail(email: string) {
  const existing = getRememberedEmails();
  const updated = [email, ...existing.filter((e) => e !== email)].slice(0, 8);
  try {
    localStorage.setItem(REMEMBERED_EMAILS_KEY, JSON.stringify(updated));
  } catch {
    // storage unavailable — dropdown just won't persist this session
  }
}

function SecurityLoginScreen({ onLoggedIn }: { onLoggedIn: (user: AppUser) => void }) {
  const [email, setEmail] = useState(() => getRememberedEmails()[0] || DEFAULT_SECURITY_EMAIL);
  const [authMode, setAuthMode] = useState<'pin' | 'password'>('pin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rememberedEmails = getRememberedEmails();

  const handleModeSwitch = (mode: 'pin' | 'password') => {
    setAuthMode(mode);
    setShowPassword(false);
    setError(null);
    setPassword('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (authMode === 'pin' && password.length !== 4) {
      setError('PIN must be 4 digits.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const user = await login(email, password);
      if (!ALLOWED_ROLES.includes(user.role)) {
        logout();
        setError('This account does not have security check-in access.');
        return;
      }
      rememberEmail(email);
      onLoggedIn(user);
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-color)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-3xl shadow-xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg mb-4">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">Security Check-In</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Gate & Visitor Access Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-secondary)] ml-1">Security Email</label>
            <input
              type="email"
              list="security-email-options"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="security@company.com"
              autoComplete="username"
              required
              className="w-full px-4 py-3.5 text-sm bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            <datalist id="security-email-options">
              {[DEFAULT_SECURITY_EMAIL, ...rememberedEmails.filter((e) => e !== DEFAULT_SECURITY_EMAIL)].map((e) => (
                <option key={e} value={e} />
              ))}
            </datalist>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-secondary)]">
                {authMode === 'pin' ? '4-Digit PIN' : 'Password'}
              </label>
              <button
                type="button"
                onClick={() => handleModeSwitch(authMode === 'pin' ? 'password' : 'pin')}
                className="flex items-center gap-1 text-[10px] font-bold text-blue-500 hover:text-blue-400 transition-colors cursor-pointer"
              >
                {authMode === 'pin' ? <Lock className="w-3 h-3" /> : <KeyRound className="w-3 h-3" />}
                Use {authMode === 'pin' ? 'password' : 'PIN'} instead
              </button>
            </div>
            {authMode === 'pin' ? (
              <div className="flex items-center justify-center gap-2.5">
                <PinInput value={password} onChange={setPassword} showValue={showPassword} autoFocus />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="shrink-0 text-[var(--text-secondary)] hover:text-blue-500 transition-colors cursor-pointer"
                  title={showPassword ? 'Hide' : 'Show'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3.5 pr-11 text-sm bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-blue-500 transition-colors cursor-pointer"
                  title={showPassword ? 'Hide' : 'Show'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-600 text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm uppercase tracking-wide py-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

export function SecurityPortal() {
  const [user, setUser] = useState<AppUser | null>(() => getStoredSession());
  const [view, setView] = useState<View>('entry');
  const [activeCount, setActiveCount] = useState(0);
  const [todayVisits, setTodayVisits] = useState(0);
  const [todayVisitors, setTodayVisitors] = useState(0);
  // Bumped whenever a visitor entry is logged, so sibling panels (Quick
  // Checkout, the counters below) refresh immediately instead of waiting on
  // their own polling interval or a tab switch.
  const [refreshSignal, setRefreshSignal] = useState(0);
  const bumpRefresh = () => setRefreshSignal((n) => n + 1);
  const [showScanModal, setShowScanModal] = useState(false);
  const [scannedPhone, setScannedPhone] = useState('');
  const [scanSignal, setScanSignal] = useState(0);

  const handleScan = (decodedText: string) => {
    const digits = decodedText.replace(/[^0-9]/g, '').slice(0, 10);
    setShowScanModal(false);
    if (!digits) return;
    setView('entry');
    setScannedPhone(digits);
    setScanSignal((n) => n + 1);
  };
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem('securityDarkMode');
    if (stored !== null) return stored === 'true';
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('securityDarkMode', String(isDarkMode));
  }, [isDarkMode]);

  // Registers the installable-PWA service worker, scoped to /visitor only —
  // the rest of the app is not affected.
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/visitor' }).catch(() => {
        // offline shell is a nice-to-have, not required for the portal to function
      });
    }
  }, []);

  useEffect(() => {
    if (!user || !ALLOWED_ROLES.includes(user.role)) return;
    const loadCount = async () => {
      try {
        const data = await fetchActiveVisitors();
        setActiveCount(data.length);
      } catch {
        // ignore — badge just won't update this cycle
      }
    };
    loadCount();
    const interval = setInterval(loadCount, 20000);
    return () => clearInterval(interval);
  }, [user, refreshSignal]);

  useEffect(() => {
    if (!user || !ALLOWED_ROLES.includes(user.role)) return;
    const loadTodayStats = async () => {
      try {
        const logs = await fetchVisitorLogs();
        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);
        const todayLogs = logs.filter(l => l.entryTime?.startsWith(todayStr));
        setTodayVisits(todayLogs.length);
        setTodayVisitors(new Set(todayLogs.map(l => l.phone)).size);
      } catch { /* ignore */ }
    };
    loadTodayStats();
    const interval = setInterval(loadTodayStats, 30000);
    return () => clearInterval(interval);
  }, [user, refreshSignal]);

  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return <SecurityLoginScreen onLoggedIn={setUser} />;
  }

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  const TABS: { id: View; label: string; icon: typeof UserPlus }[] = [
    { id: 'entry', label: 'New Entry', icon: UserPlus },
    { id: 'active', label: 'On-Site', icon: Users },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-color)] pb-20 md:pb-6">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-[var(--glass-bg)] backdrop-blur-lg border-b border-[var(--border-color)] px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0">
            <ShieldCheck className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight leading-none">Gate Security</h1>
            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{user.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsDarkMode((prev) => !prev)}
            className="p-2.5 rounded-xl bg-[var(--bg-color)] hover:bg-[var(--bg-color)] text-[var(--text-secondary)] hover:text-blue-500 transition-colors"
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-[var(--bg-color)] hover:bg-rose-50 text-[var(--text-secondary)] hover:text-rose-500 transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Desktop top tabs */}
      <div className="hidden md:flex items-center gap-2 px-6 pt-5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ' +
              (view === tab.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-[var(--panel-bg)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-blue-500/30')
            }
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
            {tab.id === 'active' && activeCount > 0 && (
              <span
                className={
                  'px-1.5 py-0.5 rounded-md text-[10px] font-black leading-none ' +
                  (view === tab.id ? 'bg-white/20 text-white' : 'bg-blue-500/10 text-blue-600')
                }
              >
                {activeCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 md:p-6">
        {view === 'entry' && (
          <div className="max-w-xl mx-auto mb-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setView('active')}
              className="flex items-center gap-3 bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl p-4 hover:border-blue-500/30 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">Active Checkins</p>
                <p className="text-2xl font-black text-[var(--text-primary)] leading-none mt-0.5">
                  {activeCount} <span className="text-xs font-medium text-[var(--text-secondary)] normal-case">on-site now</span>
                </p>
              </div>
            </button>
            <div className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">Today</p>
                <p className="text-lg font-black text-[var(--text-primary)] leading-none mt-0.5">
                  {todayVisits} <span className="text-[10px] font-medium text-[var(--text-secondary)] normal-case">Visits</span>
                </p>
                <p className="text-lg font-black text-[var(--text-primary)] leading-none mt-0.5">
                  {todayVisitors} <span className="text-[10px] font-medium text-[var(--text-secondary)] normal-case">Visitors</span>
                </p>
              </div>
            </div>
          </div>
        )}
        {view === 'entry' && <EntryForm onEntryLogged={bumpRefresh} prefillPhone={scannedPhone} prefillSignal={scanSignal} />}
        {view === 'entry' && <QuickCheckoutList refreshSignal={refreshSignal} />}
        {view === 'active' && <ActiveEntries />}
        {view === 'history' && <HistoryLogs />}
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-[var(--glass-bg)] backdrop-blur-lg border-t border-[var(--border-color)] flex items-stretch">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={
              'flex-1 relative flex flex-col items-center gap-1 py-3 transition-colors ' +
              (view === tab.id ? 'text-blue-600' : 'text-[var(--text-secondary)]')
            }
          >
            <span className="relative">
              <tab.icon className="w-5 h-5" />
              {tab.id === 'active' && activeCount > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-blue-600 text-white text-[9px] font-black flex items-center justify-center leading-none">
                  {activeCount}
                </span>
              )}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wide">{tab.label}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowScanModal(true)}
          className="flex-1 relative flex flex-col items-center gap-1 py-3 text-[var(--text-secondary)] transition-colors"
        >
          <QrCode className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wide">Scan</span>
        </button>
      </div>

      {showScanModal && (
        <QrScanModal
          title="Scan Visitor QR to Check In"
          onScan={handleScan}
          onClose={() => setShowScanModal(false)}
        />
      )}
    </div>
  );
}
