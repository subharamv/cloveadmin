import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  User as UserIcon,
  Network,
  AlertCircle,
  Zap,
  FileText,
  CheckCircle,
  Moon,
  Key,
  Plus,
  Pencil,
  Trash2,
  KeyRound,
  Power,
  PowerOff,
  X,
  Save,
  Eye,
  EyeOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { signOut } from '../lib/firebase';
import { logout as sheetsLogout, getStoredSession, fetchUsers, createUser, updateUser, deleteUser, resetPassword, setUserPin, setUserActive, AppUser } from '../lib/auth';
import ProfileCard from './ProfileCard';

type Tier = 'Standard' | 'Admin' | 'Master';

const PROFILE_TIERS = [
  {
    tier: 'Master' as Tier,
    label: 'System Director',
    handle: 'root_admin',
    name: 'VISHAL DAS',
    status: 'SYSTEM_ONLINE',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=2662&auto=format&fit=crop',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
    glow: 'rgba(59, 130, 246, 0.5)',
    metrics: [
      { label: 'System Uptime', value: '99.99%', icon: Shield },
      { label: 'Active Nodes', value: '742', icon: Network },
      { label: 'Threat Level', value: 'Alpha', icon: AlertCircle }
    ]
  },
  {
    tier: 'Admin' as Tier,
    label: 'Network Admin',
    handle: 'system_operator',
    name: 'SARAH CONNOR',
    status: 'ACTIVE_NODE',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=2787&auto=format&fit=crop',
    gradient: 'linear-gradient(135deg, #020617 0%, #1e293b 100%)',
    glow: 'rgba(71, 85, 105, 0.4)',
    metrics: [
      { label: 'Node Latency', value: '14ms', icon: Zap },
      { label: 'Managed Users', value: '1,240', icon: Users },
      { label: 'Access Logs', value: 'SECURE', icon: FileText }
    ]
  },
  {
    tier: 'Standard' as Tier,
    label: 'Field Tech',
    handle: 'field_ops_01',
    name: 'JOHN SMITH',
    status: 'AUTHENTICATED',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2787&auto=format&fit=crop',
    gradient: 'linear-gradient(135deg, #09090b 0%, #27272a 100%)',
    glow: 'rgba(31, 41, 55, 0.2)',
    metrics: [
      { label: 'Daily Tasks', value: '8/12', icon: CheckCircle },
      { label: 'Shift Time', value: 'Night', icon: Moon },
      { label: 'Auth Level', value: 'Level 4', icon: Key }
    ]
  }
];

export function AdminPortal() {
  const [activeTier, setActiveTier] = useState<Tier>('Master');
  const currentTierData = PROFILE_TIERS.find(t => t.tier === activeTier) || PROFILE_TIERS[0];
  const [users, setUsers] = useState<AppUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Modal states
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<AppUser | null>(null);
  const [showResetPw, setShowResetPw] = useState<AppUser | null>(null);
  const [showSetPin, setShowSetPin] = useState<AppUser | null>(null);
  const [showDelete, setShowDelete] = useState<AppUser | null>(null);

  // Form fields
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState('Admin');
  const [createName, setCreateName] = useState('');
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [resetPw, setResetPw] = useState('');
  const [setPinValue, setSetPinValue] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showCreatePw, setShowCreatePw] = useState(false);
  const [showResetPwField, setShowResetPwField] = useState(false);
  const [showSetPinField, setShowSetPinField] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const loadUsers = async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err: any) {
      setUsersError(err.message || 'Failed to load accounts');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    try {
      await createUser(createEmail, createPassword, createRole, createName);
      setShowCreate(false);
      setCreateEmail('');
      setCreatePassword('');
      setCreateRole('Admin');
      setCreateName('');
      loadUsers();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEdit) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await updateUser(showEdit.email, { name: editName, role: editRole });
      setShowEdit(null);
      loadUsers();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showResetPw) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await resetPassword(showResetPw.email, resetPw);
      setShowResetPw(null);
      setResetPw('');
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showSetPin) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await setUserPin(showSetPin.email, setPinValue);
      setShowSetPin(null);
      setSetPinValue('');
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!showDelete) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await deleteUser(showDelete.email);
      setShowDelete(null);
      loadUsers();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (user: AppUser) => {
    try {
      await setUserActive(user.email, !user.active);
      loadUsers();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const currentUser = getStoredSession();

  return (
    <div className="min-h-full bg-transparent overflow-hidden relative flex flex-col items-center p-8 transition-colors duration-300">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full delay-1000 animate-pulse" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] dark:opacity-20 contrast-150 brightness-50" />
      </div>

      {/* Top Controls */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-12 relative z-50">
        <div className="flex flex-col">
          <p className="text-[10px] font-mono tracking-[0.8em] text-[var(--text-primary)] opacity-20 uppercase font-black">CloveHQ_Identity</p>
          <p className="text-[8px] font-mono text-blue-500/40 uppercase tracking-[0.4em] mt-1">Terminal_v2.0.4</p>
        </div>

        <div className="flex gap-3 bg-[var(--panel-bg)] p-1 rounded-xl border border-[var(--border-color)] backdrop-blur-md">
          {PROFILE_TIERS.map(t => (
            <button
              key={t.tier}
              onClick={() => setActiveTier(t.tier)}
              className={cn(
                "px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] rounded-lg transition-all duration-500",
                activeTier === t.tier
                  ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              {t.tier}
            </button>
          ))}
        </div>
      </div>

      {/* Account Management Section */}
      <div className="w-full max-w-6xl mb-16 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tighter uppercase flex items-center gap-3">
              <Users size={20} className="text-blue-500" /> Account Management
            </h2>
            <p className="text-[10px] font-mono text-[var(--text-secondary)] opacity-50 uppercase tracking-[0.3em] mt-1">
              Manage login accounts, roles, and access permissions
            </p>
          </div>
          {currentUser?.role === 'Master Admin' && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-500/20"
            >
              <Plus size={14} /> Create User
            </button>
          )}
        </div>

        <div className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl overflow-hidden backdrop-blur-xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[11px]">
              <thead className="bg-[var(--bg-color)] text-[var(--text-secondary)] uppercase text-[9px] tracking-widest border-b border-[var(--border-color)] opacity-60">
                <tr className="h-10">
                  <th className="px-4">Name</th>
                  <th className="px-4">Email</th>
                  <th className="px-4">Role</th>
                  <th className="px-4">Status</th>
                  <th className="px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[var(--text-primary)] divide-y divide-[var(--border-color)]">
                {usersLoading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--text-secondary)] opacity-50 text-[10px]">Loading accounts...</td></tr>
                ) : usersError ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-rose-500 font-bold text-[10px]">{usersError}</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--text-secondary)] opacity-50 text-[10px]">No accounts found</td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.email} className="h-12 hover:bg-blue-500/5 transition-colors">
                      <td className="px-4 font-bold">{u.name || '—'}</td>
                      <td className="px-4 opacity-70">{u.email}</td>
                      <td className="px-4">
                        <span className={cn(
                          "text-[9px] font-black uppercase px-2 py-0.5 rounded border",
                          u.role === 'Master Admin' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                          u.role === 'Security' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                          'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        )}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4">
                        <span className={cn(
                          "flex items-center gap-1.5 text-[9px] font-black uppercase",
                          u.active ? "text-emerald-500" : "text-rose-500"
                        )}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", u.active ? "bg-emerald-500" : "bg-rose-500")} />
                          {u.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleToggleActive(u)}
                            className="p-1.5 rounded-lg hover:bg-[var(--bg-color)] text-[var(--text-secondary)] hover:text-blue-500 transition-all"
                            title={u.active ? 'Deactivate' : 'Activate'}
                          >
                            {u.active ? <PowerOff size={13} /> : <Power size={13} />}
                          </button>
                          {currentUser?.role === 'Master Admin' && (
                            <>
                              <button
                                onClick={() => { setShowEdit(u); setEditName(u.name || ''); setEditRole(u.role); }}
                                className="p-1.5 rounded-lg hover:bg-[var(--bg-color)] text-[var(--text-secondary)] hover:text-blue-500 transition-all"
                                title="Edit"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => { setShowResetPw(u); setResetPw(''); }}
                                className="p-1.5 rounded-lg hover:bg-[var(--bg-color)] text-[var(--text-secondary)] hover:text-amber-500 transition-all"
                                title="Reset Password"
                              >
                                <KeyRound size={13} />
                              </button>
                              <button
                                onClick={() => { setShowSetPin(u); setSetPinValue(''); }}
                                className="p-1.5 rounded-lg hover:bg-[var(--bg-color)] text-[var(--text-secondary)] hover:text-blue-500 transition-all"
                                title="Set PIN"
                              >
                                <Lock size={13} />
                              </button>
                              <button
                                onClick={() => setShowDelete(u)}
                                className="p-1.5 rounded-lg hover:bg-[var(--bg-color)] text-[var(--text-secondary)] hover:text-rose-500 transition-all"
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Profile Card Content (moved below) */}
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-16 relative z-10">
        <motion.div
          key={activeTier}
          initial={{ opacity: 0, x: -50, filter: 'blur(10px)' }}
          animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative group shrink-0"
        >
          <ProfileCard
            name={currentTierData.name}
            title={currentTierData.label}
            handle={currentTierData.handle}
            status={currentTierData.status}
            avatarUrl={currentTierData.avatar}
            innerGradient={currentTierData.gradient}
            behindGlowColor={currentTierData.glow}
            behindGlowEnabled={true}
            contactText="Update Credentials"
            onContactClick={() => console.log('Update Triggered')}
          />

          <div className="absolute -top-6 -left-6 border-t border-l border-[var(--border-color)] w-12 h-12 pointer-events-none" />
          <div className="absolute -bottom-6 -right-6 border-b border-r border-[var(--border-color)] w-12 h-12 pointer-events-none" />
          <div className="absolute -top-4 right-0 text-[8px] font-mono text-[var(--text-secondary)] opacity-30 tracking-[0.4em] uppercase">Security_Encapsulation</div>
        </motion.div>

        <div className="flex-1 w-full max-w-xl space-y-8">
          <div className="space-y-2">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] font-black uppercase tracking-[0.6em] text-blue-500/60"
            >
              Access_Level: {currentTierData.tier.toUpperCase()}
            </motion.span>
            <motion.h2
              key={`${activeTier}-title`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-black text-[var(--text-primary)] tracking-tighter uppercase italic"
            >
              Identity_Terminal
            </motion.h2>
            <p className="text-sm text-[var(--text-secondary)] max-w-md leading-relaxed">
              Managing secure node access and system permissions across the global CloveHQ network.
              {activeTier === 'Master' ? ' Full administrative control active.' : ' Standard operational protocol enforced.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {currentTierData.metrics.map((metric, i) => (
              <motion.div
                key={`${activeTier}-metric-${i}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-[var(--panel-bg)] border border-[var(--border-color)] p-5 rounded-2xl backdrop-blur-xl group hover:border-blue-500/30 transition-colors shadow-sm"
              >
                <metric.icon className="w-5 h-5 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{metric.label}</span>
                  <span className="text-xl font-bold text-[var(--text-primary)] tracking-tight">{metric.value}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-between px-6 py-5 bg-blue-600 rounded-2xl group hover:scale-[1.02] active:scale-[0.98] transition-all">
              <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Network Settings</span>
              <Settings className="w-4 h-4 text-white group-hover:rotate-90 transition-transform duration-500" />
            </button>
            <button
              onClick={() => { signOut(); sheetsLogout(); }}
              className="flex items-center justify-between px-6 py-5 bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl group hover:bg-red-500/10 hover:border-red-500/30 transition-all shadow-sm"
            >
              <span className="text-[10px] font-black text-[var(--text-secondary)] group-hover:text-red-500 uppercase tracking-[0.3em] transition-colors">Log Out</span>
              <LogOut className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer System Status */}
      <div className="mt-auto pt-12 flex flex-col items-center gap-6 w-full">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-[var(--border-color)] to-transparent" />
        <div className="flex items-center gap-8 text-[var(--text-secondary)] opacity-30">
          <p className="text-[8px] font-mono tracking-[0.4em] uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            Encrypted Payload: AES_256
          </p>
          <div className="w-1 h-1 bg-[var(--text-secondary)] rounded-full" />
          <p className="text-[8px] font-mono tracking-[0.4em] uppercase">Node_Hash: 0x4F...E2</p>
        </div>
      </div>

      {/* Create User Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                  <Plus size={16} className="text-blue-500" /> Create User
                </h3>
                <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-[var(--bg-color)] text-[var(--text-secondary)]">
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-[var(--text-secondary)] block mb-1">Name</label>
                  <input value={createName} onChange={(e) => setCreateName(e.target.value)} className="w-full h-9 px-3 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-colors" placeholder="Full Name" />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-[var(--text-secondary)] block mb-1">Email</label>
                  <input value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} required className="w-full h-9 px-3 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-colors" placeholder="email@domain.com" />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-[var(--text-secondary)] block mb-1">Password</label>
                  <div className="relative">
                    <input value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} required type={showCreatePw ? 'text' : 'password'} className="w-full h-9 px-3 pr-9 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-colors" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowCreatePw(!showCreatePw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">
                      {showCreatePw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-[var(--text-secondary)] block mb-1">Role</label>
                  <select value={createRole} onChange={(e) => setCreateRole(e.target.value)} className="w-full h-9 px-3 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-colors">
                    <option value="Admin">Admin</option>
                    <option value="Security">Security</option>
                    <option value="Master Admin">Master Admin</option>
                  </select>
                </div>
                {actionError && <p className="text-[10px] text-rose-500 font-bold">{actionError}</p>}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-xs font-bold text-[var(--text-secondary)] border border-[var(--border-color)] rounded-xl hover:bg-[var(--bg-color)] transition-colors">Cancel</button>
                  <button type="submit" disabled={actionLoading} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95">
                    {actionLoading ? 'Creating...' : <><Save size={12} /> Create</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {showEdit && (
          <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                  <Pencil size={16} className="text-blue-500" /> Edit User
                </h3>
                <button onClick={() => setShowEdit(null)} className="p-1 rounded-lg hover:bg-[var(--bg-color)] text-[var(--text-secondary)]">
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleEdit} className="space-y-4">
                <p className="text-[10px] text-[var(--text-secondary)] opacity-70 font-mono">{showEdit.email}</p>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-[var(--text-secondary)] block mb-1">Name</label>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full h-9 px-3 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-[var(--text-secondary)] block mb-1">Role</label>
                  <select value={editRole} onChange={(e) => setEditRole(e.target.value)} className="w-full h-9 px-3 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-colors">
                    <option value="Admin">Admin</option>
                    <option value="Security">Security</option>
                    <option value="Master Admin">Master Admin</option>
                  </select>
                </div>
                {actionError && <p className="text-[10px] text-rose-500 font-bold">{actionError}</p>}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowEdit(null)} className="px-4 py-2 text-xs font-bold text-[var(--text-secondary)] border border-[var(--border-color)] rounded-xl hover:bg-[var(--bg-color)] transition-colors">Cancel</button>
                  <button type="submit" disabled={actionLoading} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95">
                    {actionLoading ? 'Saving...' : <><Save size={12} /> Save</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Password Modal */}
      <AnimatePresence>
        {showResetPw && (
          <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                  <KeyRound size={16} className="text-amber-500" /> Reset Password
                </h3>
                <button onClick={() => setShowResetPw(null)} className="p-1 rounded-lg hover:bg-[var(--bg-color)] text-[var(--text-secondary)]">
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleResetPw} className="space-y-4">
                <p className="text-[10px] text-[var(--text-secondary)] opacity-70 font-mono">{showResetPw.email}</p>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-[var(--text-secondary)] block mb-1">New Password</label>
                  <div className="relative">
                    <input value={resetPw} onChange={(e) => setResetPw(e.target.value)} required type={showResetPwField ? 'text' : 'password'} className="w-full h-9 px-3 pr-9 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-colors" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowResetPwField(!showResetPwField)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">
                      {showResetPwField ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                {actionError && <p className="text-[10px] text-rose-500 font-bold">{actionError}</p>}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowResetPw(null)} className="px-4 py-2 text-xs font-bold text-[var(--text-secondary)] border border-[var(--border-color)] rounded-xl hover:bg-[var(--bg-color)] transition-colors">Cancel</button>
                  <button type="submit" disabled={actionLoading} className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-400 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95">
                    {actionLoading ? 'Resetting...' : <><KeyRound size={12} /> Reset</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Set PIN Modal */}
      <AnimatePresence>
        {showSetPin && (
          <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                  <Lock size={16} className="text-blue-500" /> Set PIN
                </h3>
                <button onClick={() => setShowSetPin(null)} className="p-1 rounded-lg hover:bg-[var(--bg-color)] text-[var(--text-secondary)]">
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleSetPin} className="space-y-4">
                <p className="text-[10px] text-[var(--text-secondary)] opacity-70 font-mono">{showSetPin.email}</p>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-[var(--text-secondary)] block mb-1">4-Digit PIN</label>
                  <div className="relative">
                    <input
                      value={setPinValue}
                      onChange={(e) => setSetPinValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      required
                      type={showSetPinField ? 'text' : 'password'}
                      inputMode="numeric"
                      pattern="\d{4}"
                      maxLength={4}
                      className="w-full h-9 px-3 pr-9 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] tracking-widest focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="••••"
                    />
                    <button type="button" onClick={() => setShowSetPinField(!showSetPinField)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">
                      {showSetPinField ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                {actionError && <p className="text-[10px] text-rose-500 font-bold">{actionError}</p>}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowSetPin(null)} className="px-4 py-2 text-xs font-bold text-[var(--text-secondary)] border border-[var(--border-color)] rounded-xl hover:bg-[var(--bg-color)] transition-colors">Cancel</button>
                  <button type="submit" disabled={actionLoading || setPinValue.length !== 4} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95">
                    {actionLoading ? 'Saving...' : <><Lock size={12} /> Save PIN</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDelete && (
          <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-6 max-w-sm w-full"
            >
              <h4 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2 mb-2">
                <Trash2 size={16} className="text-rose-500" /> Delete User?
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mb-1 font-mono">{showDelete.email}</p>
              <p className="text-[10px] text-[var(--text-secondary)] opacity-60 mb-5">This will clear the account from the system. This action cannot be undone.</p>
              {actionError && <p className="text-[10px] text-rose-500 font-bold mb-3">{actionError}</p>}
              <div className="flex items-center justify-end gap-3">
                <button onClick={() => setShowDelete(null)} disabled={actionLoading} className="px-4 py-2 text-xs font-bold text-[var(--text-secondary)] border border-[var(--border-color)] rounded-xl hover:bg-[var(--bg-color)] transition-colors">Cancel</button>
                <button onClick={handleDelete} disabled={actionLoading} className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-400 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95">
                  {actionLoading ? 'Deleting...' : <><Trash2 size={12} /> Delete</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
