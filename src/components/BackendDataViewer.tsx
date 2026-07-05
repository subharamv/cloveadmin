import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  RefreshCw, 
  LogOut, 
  Terminal, 
  User, 
  Key, 
  ChevronDown, 
  ChevronUp, 
  Server, 
  Wifi, 
  AlertCircle, 
  Calendar, 
  Sliders,
  Send,
  DatabaseBackup,
  LockKeyhole,
  CheckCircle,
  Clock,
  TerminalSquare
} from 'lucide-react';

interface TelemetryPayload {
  [key: string]: any;
}

interface FacilityLog {
  _id: string;
  pillar: string;
  reviewer: string;
  submittedAt: string;
  priorityScore: number;
  telemetryData: TelemetryPayload;
  createdAt?: string;
}

export const BackendDataViewer: React.FC = () => {
  // Authentication State
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('backend_auth_token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Configuration State for flexible API endpoints
  const [apiBaseUrl, setApiBaseUrl] = useState(() => {
    return window.location.origin;
  });

  // Logs Table Data
  const [logs, setLogs] = useState<FacilityLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Seeder Simulator State
  const [isSeeding, setIsSeeding] = useState(false);
  const [seederStatus, setSeederStatus] = useState<string | null>(null);

  // Connection Indicator State
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);

  // Verify Backend Health on Mount
  useEffect(() => {
    const checkServerHealth = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/health`);
        if (response.ok) {
          setServerOnline(true);
        } else {
          setServerOnline(false);
        }
      } catch {
        setServerOnline(false);
      }
    };
    checkServerHealth();
    // Check every 30 seconds
    const interval = setInterval(checkServerHealth, 30000);
    return () => clearInterval(interval);
  }, [apiBaseUrl]);

  // Fetch Logs when user gets authenticated
  useEffect(() => {
    if (token) {
      fetchLogs();
    }
  }, [token, apiBaseUrl]);

  const fetchLogs = async () => {
    if (!token) return;
    setLogsLoading(true);
    setLogsError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/logs`, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        // Token expired or invalid
        handleLogout();
        setLogsError('Session expired. Please re-authenticate.');
        return;
      }

      if (!response.ok) {
        throw new Error(`Server returned status code ${response.status}`);
      }

      const data = await response.json();
      setLogs(data);
    } catch (err: any) {
      console.error('Failed to fetch backend logs:', err);
      setLogsError(`Connection failed: Verify server is running on ${apiBaseUrl}`);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoginLoading(true);
    setLoginError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication rejected');
      }

      // Store Auth Token
      localStorage.setItem('backend_auth_token', data.token);
      setToken(data.token);
      setUsername('');
      setPassword('');
    } catch (err: any) {
      console.error('Login request failed:', err);
      setLoginError(err.message || 'Could not establish connection to authorization container.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('backend_auth_token');
    setToken(null);
    setLogs([]);
  };

  // Seeder Simulator: Easy generation of test documents directly through our client portal
  const handleSeedTestLogs = async () => {
    setIsSeeding(true);
    setSeederStatus('Publishing test matrices...');
    try {
      const randomNumber = Math.floor(Math.random() * 1000);
      const testScenarios = [
        {
          pillar: 'electrical',
          reviewer: 'J Murali Krishna',
          priorityScore: 12,
          telemetryData: { thermalScanTempC: 38.5, emergencySwitchoverSeconds: 1.25, productionLoadKwh: 1250 }
        },
        {
          pillar: 'hvac',
          reviewer: 'PSR Dhanwantri',
          priorityScore: 16,
          telemetryData: { ahuSupplyTempC: 18.2, compressorPressurePsi: 112, vibrationAmplitudeMms: 2.4 }
        },
        {
          pillar: 'plumbing',
          reviewer: 'J Murali Krishna',
          priorityScore: 8,
          telemetryData: { pressurePsi: 68, chlorinationPpm: 2.4 }
        },
        {
          pillar: 'security_systems',
          reviewer: 'PSR Dhanwantri',
          priorityScore: 15,
          telemetryData: { extinguisherCheckDays: 12, drillCompliancePct: 98 }
        },
        {
          pillar: 'structural',
          reviewer: 'PSR Dhanwantri',
          priorityScore: 6,
          telemetryData: { facadeScore: 4.8, drainageClearancePct: 92 }
        },
        {
          pillar: 'procurement',
          reviewer: 'PSR Dhanwantri',
          priorityScore: 20,
          telemetryData: { pettyCashInr: 12500, accountsSyncStatus: 'Pending', contractRef: `PO-2026-X${randomNumber}` }
        }
      ];

      // Pick a random scenario
      const scenario = testScenarios[Math.floor(Math.random() * testScenarios.length)];

      const response = await fetch(`${apiBaseUrl}/api/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(scenario)
      });

      if (!response.ok) {
        throw new Error('Failed to record test document');
      }

      setSeederStatus('Successfully saved test document!');
      setTimeout(() => setSeederStatus(null), 3000);
      
      // Refresh list
      fetchLogs();
    } catch (err: any) {
      setSeederStatus(`Seeder failed: ${err.message}`);
      setTimeout(() => setSeederStatus(null), 4000);
    } finally {
      setIsSeeding(false);
    }
  };

  const getPillarLabel = (pillar: string) => {
    const mapper: {[key: string]: string} = {
      housekeeping: 'Housekeeping & Office Boys',
      security: 'Security',
      electrical: 'Electrical & Lighting',
      plumbing: 'Plumbing',
      windows_doors: 'Windows & Doors',
      hvac: 'HVAC & Elevators',
      structural: 'Building Exterior',
      logistics: 'Transportation & Parking Lots',
      security_systems: 'Security Systems & Safety Requirements',
      asset_mgt: 'Asset Mgt, Repairs & Maintenance',
      procurement: 'Purchase/Procurement',
      vendor_mgt: 'Vendor Mgt & Payment Co-ordination',
      general_maint: 'General Maintenance'
    };
    return mapper[pillar] || pillar;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#E2E8F0] font-mono relative p-4 md:p-8 flex flex-col justify-between overflow-x-hidden selection:bg-blue-500/20 selection:text-blue-400">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.03),transparent_40%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Outer wrapper to restrict width */}
      <div className="max-w-7xl mx-auto w-full flex-grow flex flex-col justify-center">

        {/* Global Connection Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6 mb-8 select-none">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <Database className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white">Database Core Monitor</h2>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">ADMIN SECURE GATEWAY PANEL</p>
            </div>
          </div>

          {/* Micro Server State Controls */}
          <div className="flex items-center gap-4 bg-zinc-900/60 border border-zinc-800/80 rounded-xl px-4 py-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Host:</span>
              <input 
                type="text" 
                value={apiBaseUrl}
                onChange={e => setApiBaseUrl(e.target.value)}
                className="bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-blue-500/50 outline-none font-bold text-[10px] text-blue-400 w-44"
                placeholder="http://localhost:5000"
              />
            </div>
            
            <div className="h-4 w-[1px] bg-zinc-800" />

            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                serverOnline === true 
                  ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                  : (serverOnline === false ? 'bg-rose-500 animate-ping' : 'bg-amber-500 animate-pulse')
              }`} />
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                {serverOnline === true ? 'CONNECTED' : (serverOnline === false ? 'OFFLINE' : 'DIALING...')}
              </span>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!token ? (
            /* --- STATE 1: SECURE AUTHENTICATION TERMINAL --- */
            <motion.div
              key="auth-state"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md w-full mx-auto my-12"
            >
              <div className="bg-zinc-950/80 border border-zinc-800/60 rounded-2xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
                
                <div className="flex flex-col items-center mb-8">
                  <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.1)] mb-4">
                    <LockKeyhole className="w-6 h-6 animate-pulse" />
                  </div>
                  <h1 className="text-lg font-black uppercase tracking-[0.4em] text-white">MASTER CONTROL</h1>
                  <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">DATABASE SIGN-IN CHALLENGE Protocol</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-[#94A3B8]">Identity Credential</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. admin"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 focus:border-blue-500/50 rounded-xl py-3.5 pl-12 pr-4 text-xs font-mono text-white outline-none transition-all placeholder:text-zinc-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-[#94A3B8]">Secret Cipher Key</label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input 
                        type="password" 
                        required
                        placeholder="e.g. admin123"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 focus:border-blue-500/50 rounded-xl py-3.5 pl-12 pr-4 text-xs font-mono text-white outline-none transition-all placeholder:text-zinc-600"
                      />
                    </div>
                  </div>

                  {loginError && (
                    <motion.div 
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl flex items-start gap-2.5"
                    >
                      <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                      <span className="text-[10px] text-rose-400 font-bold leading-tight uppercase tracking-wider">{loginError}</span>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full group relative overflow-hidden rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black py-4 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 select-none text-[10px] uppercase tracking-[0.3em] cursor-pointer"
                  >
                    {loginLoading ? 'DECRYPTING SIGNATURE...' : 'ESTABLISH AUTHORIZATION SESSION'}
                  </button>
                </form>

                {/* Secure Hints Banner */}
                <div className="mt-8 pt-6 border-t border-zinc-800/60 text-center">
                  <span className="text-[8px] font-extrabold text-zinc-500 uppercase tracking-widest">Protocol Setup Credentials</span>
                  <div className="flex items-center justify-center gap-2 mt-2 font-mono text-[9px] text-[#38BDF8] pb-4 border-b border-zinc-900/60">
                    <span>Username: <strong className="text-white">admin</strong></span>
                    <span className="text-zinc-700">|</span>
                    <span>Password: <strong className="text-white">admin123</strong></span>
                  </div>
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        window.location.hash = '';
                        window.location.pathname = '/';
                      }}
                      className="text-[8px] font-black text-rose-500/70 hover:text-rose-400 uppercase tracking-widest transition-all font-mono cursor-pointer flex items-center justify-center gap-1.5 mx-auto active:scale-95"
                    >
                      ← DETACH TERMINAL / RETURN PROTOCOL
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* --- STATE 2: PROTECTED DATA MONITOR DASHBOARD --- */
            <motion.div
              key="dashboard-state"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="space-y-8"
            >
              {/* Authenticated Dashboard Header Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-950/60 border border-zinc-800/40 p-6 rounded-2xl select-none">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] font-black uppercase tracking-widest rounded">
                      SESSION GRANTED
                    </span>
                    <span className="text-zinc-600 font-bold text-xs">•</span>
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest font-mono">ROLE: ROOTADMINISTRATOR</span>
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">Active Datastore Logging Tunnel</h3>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Test Seeder Button */}
                  <button
                    onClick={handleSeedTestLogs}
                    disabled={isSeeding}
                    className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-[9px] uppercase tracking-wider rounded-xl transition-all active:scale-95 flex items-center gap-2 cursor-pointer shadow-md shadow-amber-500/10 hover:shadow-amber-500/20"
                    title="Generate a random logged item and publish directly into MongoDB"
                  >
                    <DatabaseBackup className="w-3.5 h-3.5" />
                    Seed Test Document
                  </button>

                  {/* Refresh Button */}
                  <button
                    onClick={fetchLogs}
                    disabled={logsLoading}
                    className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white font-black text-[9px] uppercase tracking-wider rounded-xl transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
                    Refresh Datastore
                  </button>

                  {/* Terminate Button */}
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2.5 bg-rose-950/20 border border-rose-900/30 hover:bg-rose-500 hover:text-white text-rose-400 hover:border-transparent font-black text-[9px] uppercase tracking-wider rounded-xl transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Terminate Session
                  </button>
                </div>
              </div>

              {/* Seeder status notifications toast */}
              <AnimatePresence>
                {seederStatus && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-zinc-900 border border-zinc-850 rounded-xl text-[10px] font-semibold text-emerald-400 text-center uppercase tracking-widest flex items-center justify-center gap-2.5"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-500 animate-bounce" />
                    <span>{seederStatus}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Server State Mismatch or Log fetching errors */}
              {logsError && (
                <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 animate-bounce" />
                  <div className="flex-1">
                    <h5 className="font-extrabold text-[10px] text-rose-400 uppercase tracking-widest">CRITICAL DISCOVERY FAULT: DATABASE UNREACHABLE</h5>
                    <p className="text-[9px] text-[#F87171] mt-0.5 font-mono uppercase tracking-wider">{logsError}</p>
                  </div>
                  <button 
                    onClick={fetchLogs}
                    className="px-3 py-1.5 text-[9px] font-black uppercase tracking-wider bg-rose-500 text-white rounded-lg active:scale-95 transition-all outline-none"
                  >
                    Retry Query
                  </button>
                </div>
              )}

              {/* Datatree Log Registry Grid Container */}
              <div className="bg-zinc-950/60 border border-zinc-800/40 rounded-3xl overflow-hidden shadow-2xl">
                
                {/* Header title */}
                <div className="p-6 border-b border-zinc-800/40 bg-zinc-950/40 flex justify-between items-center select-none">
                  <div className="flex items-center gap-3">
                    <TerminalSquare className="w-5 h-5 text-blue-500 animate-pulse" />
                    <div>
                      <h4 className="font-black text-white text-sm uppercase tracking-wider">DOCUMENT STORE REGISTRY ({logs.length} RECORDS)</h4>
                      <p className="text-[8px] text-zinc-500 uppercase tracking-widest mt-0.5">DIRECT MONGODB DOCUMENT DUMP</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest px-3 py-1 bg-zinc-900 rounded-lg">
                    TUNNEL: SECURE // ESTABLISHED
                  </span>
                </div>

                {/* Responsive Dense Log Table Grid */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left whitespace-nowrap border-separate border-spacing-0">
                    <thead>
                      <tr className="bg-zinc-950 text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em] border-b border-zinc-800 select-none">
                        <th className="p-4.5 w-8"></th>
                        <th className="p-4.5">DOCUMENT_ID</th>
                        <th className="p-4.5">SUBMISSION_TIME</th>
                        <th className="p-4.5">OPERATIONAL_NODE</th>
                        <th className="p-4.5">MATRIX_REVIEWER</th>
                        <th className="p-4.5">WEIGHT_SCORE</th>
                        <th className="p-4.5 text-right pr-6">DATA_INTEGRATION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900/60 font-mono text-[10px] text-zinc-300">
                      {logsLoading ? (
                        <tr>
                          <td colSpan={7} className="p-20 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 animate-pulse">Decrypting Datastore Blocks...</span>
                            </div>
                          </td>
                        </tr>
                      ) : logs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-20 text-center">
                            <div className="flex flex-col items-center gap-4">
                              <DatabaseBackup className="w-10 h-10 text-zinc-700 animate-pulse" />
                              <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">NO EXCEPTION DOCUMENTS FOUND IN COLLECTION</span>
                                <span className="text-[8px] text-zinc-600 uppercase tracking-wider block">SEED A TEST DOCUMENT TO VERIFY THE SYSTEM DATABASE END-TO-END</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        logs.map((log) => {
                          const isExpanded = expandedRow === log._id;
                          return (
                            <React.Fragment key={log._id}>
                              <tr 
                                onClick={() => setExpandedRow(isExpanded ? null : log._id)}
                                className={`group cursor-pointer transition-all duration-250 ${
                                  isExpanded 
                                    ? 'bg-blue-500/[0.04] text-white border-l-2 border-blue-500' 
                                    : 'hover:bg-zinc-900/40 text-zinc-400 hover:text-white'
                                }`}
                              >
                                <td className="p-4.5 text-center">
                                  {isExpanded ? (
                                    <ChevronUp size={14} className="text-blue-500" />
                                  ) : (
                                    <ChevronDown size={14} className="text-zinc-600 group-hover:text-zinc-400" />
                                  )}
                                </td>
                                <td className="p-4.5 font-bold tracking-tight text-blue-500 font-mono group-hover:underline">
                                  {log._id}
                                </td>
                                <td className="p-4.5 text-zinc-500 flex items-center gap-1 w-52">
                                  <Clock size={11} className="text-zinc-600" />
                                  <span className="truncate" title={new Date(log.submittedAt).toLocaleString()}>
                                    {new Date(log.submittedAt).toLocaleString()}
                                  </span>
                                </td>
                                <td className="p-4.5">
                                  <span className="bg-zinc-900 text-zinc-300 font-bold px-2 py-0.5 rounded border border-zinc-800 uppercase text-[9px] tracking-wide">
                                    {getPillarLabel(log.pillar)}
                                  </span>
                                </td>
                                <td className="p-4.5 text-zinc-300 font-black">
                                  {log.reviewer}
                                </td>
                                <td className="p-4.5">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      log.priorityScore >= 15 ? 'bg-rose-500 animate-pulse' : (log.priorityScore >= 8 ? 'bg-amber-500' : 'bg-emerald-500')
                                    }`} />
                                    <span className="font-extrabold">{log.priorityScore} (Weight)</span>
                                  </div>
                                </td>
                                <td className="p-4.5 text-right pr-6">
                                  <span className="text-[10px] text-zinc-500 group-hover:text-blue-400 transition-colors uppercase select-none font-bold">
                                    View Payload JSON ({Object.keys(log.telemetryData || {}).length} variables)
                                  </span>
                                </td>
                              </tr>

                              {/* Nested collpapsible telemetry data payload view */}
                              {isExpanded && (
                                <tr>
                                  <td />
                                  <td colSpan={6} className="bg-black/40 p-6 border-t border-zinc-850">
                                    <div className="space-y-4 max-w-full overflow-hidden">
                                      <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-2">
                                        <h5 className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Decrypted Raw Telemetry Package Dump</h5>
                                        <span className="text-[8px] text-zinc-600 font-display">TYPE: mongoose.Schema.Types.Mixed</span>
                                      </div>

                                      <div className="bg-[#070709] rounded-xl p-4.5 border border-zinc-900 max-h-72 overflow-y-auto font-mono text-zinc-300 custom-scrollbar select-all">
                                        <pre className="text-[11px] leading-relaxed select-text whitespace-pre-wrap word-break">
                                          {JSON.stringify(log.telemetryData, null, 2)}
                                        </pre>
                                      </div>

                                      {/* Secondary parsed payload stats */}
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 select-none">
                                        {[
                                          { label: 'DB DOCUMENT KEY', val: log._id },
                                          { label: 'INDEXED CHANNELS', val: Object.keys(log.telemetryData || {}).join(', ') || 'N/A' },
                                          { label: 'PRIORITY ESCALATED', val: log.priorityScore >= 12 ? 'HIGH PROTOCOL' : 'ROUTINE VERIFICATION' },
                                          { label: 'RECORD STORAGE', val: 'Indexed (MongoDB)' }
                                        ].map((stat, sIdx) => (
                                          <div key={sIdx} className="bg-zinc-900/45 border border-zinc-900 rounded-lg p-2.5">
                                            <span className="text-[8px] text-zinc-600 uppercase tracking-widest block">{stat.label}</span>
                                            <span className="text-[9px] font-bold text-zinc-400 block mt-0.5 truncate uppercase">{stat.val}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer paginator */}
                <div className="p-5 border-t border-zinc-900 bg-zinc-950/40 flex justify-between items-center text-[9px] font-mono text-zinc-500 uppercase tracking-[0.2em] px-8 select-none">
                  <span>Datastore Stream: <strong className="text-emerald-500">LIVE CONNECTION</strong></span>
                  <div className="flex gap-4">
                    <span>SECTOR_DUMPS: <strong className="text-zinc-400">{logs.length}</strong></span>
                    <span>RESTORE_POOL: <strong className="text-zinc-400">AVAILABLE</strong></span>
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Embedded footer disclaimer matching highly-technical guidelines */}
      <div className="mt-12 text-center text-[8px] font-mono text-zinc-600 uppercase tracking-[0.3em] select-none border-t border-zinc-900/60 pt-6">
        <span>AES_256 SECURED CLIENT INTERCONNECTION TERMINAL PORTAL • CloveHQ</span>
      </div>
    </div>
  );
};
