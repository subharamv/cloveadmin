/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signOut as firebaseSignOut } from './lib/firebase';
import { login as sheetsLogin, logout as sheetsLogout, getStoredSession, storeSession, AppUser } from './lib/auth';
import { Layout } from './components/Layout';
import { CallLogs } from './components/CallLogs';
import { TravelAndCabsHub } from './components/TravelAndCabsHub';
import { VisitorAndGateHub } from './components/VisitorAndGateHub';
import { WelcomeScreen } from './components/WelcomeScreen';
import { AdminTasks } from './components/AdminTasks';
import { FacilityManagementTab } from './tabs/FacilityManagementTab';
import { LogIn, ShieldCheck, Database, Eye, EyeOff, KeyRound, Lock } from 'lucide-react';
import { PinInput } from './components/PinInput';
import { motion, AnimatePresence } from 'motion/react';
import CommandCenterDashboard from './components/CommandCenterDashboard';
import { AdminPortal } from './components/AdminPortal';
import GlareHover from './components/GlareHover';
import { BackendDataViewer } from './components/BackendDataViewer';
import { FullVisitorLogsPage } from './components/FullVisitorLogsPage';
import { SecurityPortal } from './security/SecurityPortal';
import { BillPaymentsHub } from './bills/BillPaymentsHub';
import { FullBillLogsPage } from './bills/FullBillLogsPage';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [sheetsUser, setSheetsUser] = useState<AppUser | null>(() => getStoredSession());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hasEntered, setHasEntered] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem('adminDarkMode');
    return stored !== null ? stored === 'true' : false;
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginAuthMode, setLoginAuthMode] = useState<'password' | 'pin'>('password');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showLoginPw, setShowLoginPw] = useState(false);

  const handleLoginModeSwitch = (mode: 'password' | 'pin') => {
    setLoginAuthMode(mode);
    setShowLoginPw(false);
    setLoginError(null);
    setLoginPassword('');
  };

  const isAuthenticated = !!user || !!sheetsUser;
  const effectiveUser = user
    ? { username: user.email || user.uid, role: 'Google Account' }
    : sheetsUser
      ? { username: sheetsUser.username, role: sheetsUser.role }
      : null;

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    if (loginAuthMode === 'pin' && loginPassword.length !== 4) {
      setLoginError('PIN must be 4 digits.');
      return;
    }
    setLoginLoading(true);
    setLoginError(null);
    try {
      const loggedInUser = await sheetsLogin(loginEmail, loginPassword);
      setSheetsUser(loggedInUser);
      setLoginEmail('');
      setLoginPassword('');
    } catch (err: any) {
      setLoginError(err.message || 'Could not authenticate. Check your email and password.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    if (user) await firebaseSignOut();
    if (sheetsUser) {
      sheetsLogout();
      setSheetsUser(null);
    }
  };

  const GOOGLE_OAUTH_ERROR_MESSAGES: Record<string, string> = {
    unauthorized: 'This Google account is not registered. Ask a Master Admin to add it under Account Management first.',
    inactive: 'This account has been deactivated. Contact your administrator.',
    no_email: 'Could not read an email address from your Google account.',
    auth_failed: 'Google sign-in failed. Please try again.',
  };

  // Completes the server-side Google OAuth redirect (/api/auth/google -> /api/auth/google/callback),
  // which only issues a token when the email already exists in Account Management.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userParam = params.get('user');
    const oauthError = params.get('error');

    if (token && userParam) {
      try {
        const loggedInUser = JSON.parse(userParam) as AppUser;
        // The callback hands back a raw JWT; every other call site expects
        // the "Bearer " prefix already baked into the stored token string.
        storeSession(`Bearer ${token}`, loggedInUser);
        setSheetsUser(loggedInUser);
      } catch {
        setLoginError('Could not complete Google sign-in. Please try again.');
      }
      window.history.replaceState({}, '', window.location.pathname);
    } else if (oauthError) {
      setLoginError(GOOGLE_OAUTH_ERROR_MESSAGES[oauthError] || 'Google sign-in failed. Please try again.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Custom secure admin path routing for the MongoDB backend logs portal
  const [isBackendRoute, setIsBackendRoute] = useState(() => {
    return window.location.pathname === '/system-backend' || window.location.hash === '#/system-backend';
  });

  // Standalone mobile-first security check-in portal, bypasses the main app entirely
  const [isVisitorRoute, setIsVisitorRoute] = useState(() => {
    return window.location.pathname === '/visitor' || window.location.hash === '#/visitor';
  });

  useEffect(() => {
    const handleLocationChange = () => {
      setIsBackendRoute(window.location.pathname === '/system-backend' || window.location.hash === '#/system-backend');
      setIsVisitorRoute(window.location.pathname === '/visitor' || window.location.hash === '#/visitor');
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  if (isBackendRoute) {
    return <BackendDataViewer />;
  }

  if (isVisitorRoute) {
    return <SecurityPortal />;
  }

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('adminDarkMode', String(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <CommandCenterDashboard searchTerm={searchTerm} isDarkMode={isDarkMode} onNavigateToVisitors={() => setActiveTab('securityHub')} onViewFullLogs={() => setActiveTab('fullVisitorLogs')} onViewFullBillLogs={() => setActiveTab('fullBillLogs')} />;
      case 'calls': return <CallLogs searchTerm={searchTerm} />;
      case 'travelHub': return <TravelAndCabsHub searchTerm={searchTerm} isDarkMode={isDarkMode} />;
      case 'tasks': return <AdminTasks searchTerm={searchTerm} />;
      case 'securityHub': return <VisitorAndGateHub searchTerm={searchTerm} />;
      case 'billPayments': return <BillPaymentsHub />;
      case 'facility': return <FacilityManagementTab />;
      case 'backend_viewer': return <BackendDataViewer />;
      case 'profile': return <AdminPortal />;
      case 'fullVisitorLogs': return <FullVisitorLogsPage onBack={() => setActiveTab('dashboard')} />;
      case 'fullBillLogs': return <FullBillLogsPage onBack={() => setActiveTab('dashboard')} />;
      default: return <CommandCenterDashboard searchTerm={searchTerm} isDarkMode={isDarkMode} onNavigateToVisitors={() => setActiveTab('securityHub')} onViewFullLogs={() => setActiveTab('fullVisitorLogs')} onViewFullBillLogs={() => setActiveTab('fullBillLogs')} />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div 
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-[#0A0A0B] flex items-center justify-center font-mono"
        >
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-b-2 border-blue-500 rounded-full"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse blur-[1px]" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-[0.6em] text-blue-500/80 animate-pulse">Logging_in...</p>
              <p className="text-[8px] font-mono uppercase tracking-[0.4em] text-white/20">System ready</p>
            </div>
          </div>
        </motion.div>
      ) : !isAuthenticated ? (
        <motion.div 
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: 'blur(20px)' }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-4 relative overflow-hidden bg-grid"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)] pointer-events-none" />
          <div className="scanline" />
          
          <div className="absolute top-10 left-10 z-50">
            <p className="text-[10px] font-mono tracking-[0.8em] text-white/20 uppercase font-black">CloveHQ Platform</p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full"
          >
            <GlareHover
              borderRadius="1.5rem"
              glareOpacity={0.15}
              borderColor="rgba(255,255,255,0.05)"
            >
              <div className="glass-panel p-12 rounded-[1.5rem] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                
                <div className="flex flex-col items-center mb-10">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-[0_0_40px_rgba(59,130,246,0.3)] mb-6 animate-pulse">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h1 className="text-4xl font-display font-black uppercase tracking-tighter text-white mb-1">CORE_ADMIN</h1>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-blue-500 rounded-full" />
                    <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-blue-500/60 font-bold">Secure Access Terminal</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 ml-1">Identity Protocol</label>
                      <div className="relative group">
                        <input
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="identity@clovehq.com"
                          autoComplete="username"
                          className="w-full bg-black/40 border border-white/5 rounded-xl py-4 px-5 text-xs font-mono text-white outline-none focus:border-blue-500/30 transition-all placeholder:text-white/20"
                        />
                        <div className="absolute inset-0 bg-blue-500/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between ml-1">
                        <label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">
                          {loginAuthMode === 'pin' ? '4-Digit PIN' : 'Access Key'}
                        </label>
                        <button
                          type="button"
                          onClick={() => handleLoginModeSwitch(loginAuthMode === 'pin' ? 'password' : 'pin')}
                          className="flex items-center gap-1 text-[9px] font-black text-blue-500/70 hover:text-blue-400 uppercase tracking-widest transition-colors cursor-pointer"
                        >
                          {loginAuthMode === 'pin' ? <Lock className="w-3 h-3" /> : <KeyRound className="w-3 h-3" />}
                          Use {loginAuthMode === 'pin' ? 'password' : 'PIN'} instead
                        </button>
                      </div>
                      {loginAuthMode === 'pin' ? (
                        <div className="flex items-center justify-center gap-2.5">
                          <PinInput
                            value={loginPassword}
                            onChange={setLoginPassword}
                            showValue={showLoginPw}
                            autoFocus
                            boxClassName="h-12 flex-1 max-w-12 text-center text-lg font-black bg-black/40 border border-white/5 rounded-xl text-white outline-none focus:border-blue-500/30 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPw(!showLoginPw)}
                            className="shrink-0 text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                          >
                            {showLoginPw ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      ) : (
                        <div className="relative group">
                          <input
                            type={showLoginPw ? 'text' : 'password'}
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            className="w-full bg-black/40 border border-white/5 rounded-xl py-4 px-5 pr-11 text-xs font-mono text-white outline-none focus:border-blue-500/30 transition-all placeholder:text-white/20"
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPw(!showLoginPw)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                          >
                            {showLoginPw ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <div className="absolute inset-0 bg-blue-500/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl" />
                        </div>
                      )}
                    </div>

                    {loginError && (
                      <p className="text-[10px] font-mono text-red-400 text-center">{loginError}</p>
                    )}

                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full group relative overflow-hidden rounded-xl bg-blue-600 py-5 px-8 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl disabled:opacity-50 disabled:hover:scale-100"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 group-hover:translate-x-full transition-transform duration-1000 opacity-50" />
                      <div className="relative flex items-center justify-center gap-4">
                        <LogIn className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">
                          {loginLoading ? 'Authorizing...' : 'Sign In'}
                        </span>
                      </div>
                    </button>
                  </form>

                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/20">Or</span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>

                  <div>
                    <button
                      onClick={() => window.location.href = '/api/auth/google'}
                      className="w-full group relative overflow-hidden rounded-xl bg-white/5 border border-white/10 py-4 px-8 transition-all hover:scale-[1.02] active:scale-[0.98] hover:border-white/20"
                    >
                      <div className="relative flex items-center justify-center gap-4">
                        <ShieldCheck className="w-4 h-4 text-white/70 group-hover:translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/80">Continue with Google</span>
                      </div>
                    </button>

                    <div className="mt-4 text-center">
                      <button
                        onClick={() => {
                          window.location.hash = '#/system-backend';
                          setIsBackendRoute(true);
                        }}
                        className="text-[9px] font-black text-blue-500/70 hover:text-blue-400 uppercase tracking-widest transition-colors font-mono cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                      >
                        <Database className="w-3.5 h-3.5 text-blue-500" />
                        Access Master Datastore Control Portal Directly
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    <p className="text-[8px] font-mono uppercase tracking-[0.4em] text-white/20">System_Status: Operational</p>
                  </div>
                  <p className="text-[7px] font-mono uppercase tracking-[0.2em] text-white/10">Encrypted By AES_256 & RSA_4096</p>
                </div>
              </div>
            </GlareHover>
          </motion.div>
        </motion.div>
      ) : !hasEntered ? (
        <motion.div
          key="welcome"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        >
          <WelcomeScreen onEnter={() => setHasEntered(true)} isDarkMode={isDarkMode} />
        </motion.div>
      ) : (
        <motion.div
          key="main"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="h-full w-full relative"
        >
          <Layout
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            user={effectiveUser!}
            onLogout={handleLogout}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                className="h-full"
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </Layout>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
