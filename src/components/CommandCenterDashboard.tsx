import React, { useState, useEffect } from 'react';
import {
  Users,
  Car,
  ShieldCheck,
  Clock,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Globe,
  LogIn,
  LogOut,
  Wallet
} from 'lucide-react';
import { fetchVisitorLogs, VisitorLog } from '../security/api';
import { fetchBills, fetchAllBillHistory, Bill, BillPayment } from '../bills/api';
import { daysUntil, formatCurrency } from '../bills/billUtils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  Legend,
  ReferenceLine
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import GlareHover from './GlareHover';

const DATA = [
  { day: 'Mon', value: 45 },
  { day: 'Tue', value: 52 },
  { day: 'Wed', value: 38 },
  { day: 'Thu', value: 65 },
  { day: 'Fri', value: 48 },
  { day: 'Sat', value: 24 },
  { day: 'Sun', value: 18 },
];

const BASE_STATS = [
  { label: 'Total Occupancy', value: '1,284', trend: '+12%', icon: ShieldCheck, color: 'text-blue-500' },
  { label: 'Active Users', value: '342', trend: '24/7', icon: Users, color: 'text-indigo-600' },
  { label: 'Active Cabs', value: '42', trend: '+5%', icon: Car, color: 'text-blue-500' },
  { label: 'System Uptime', value: '99.9%', trend: 'Stable', icon: Zap, color: 'text-rose-500' },
  { label: 'Response Time', value: '240ms', trend: '-18%', icon: Clock, color: 'text-amber-500' },
];

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

interface FeedItem {
  id: string;
  type: 'cab' | 'gate' | 'visit' | 'bill';
  title: string;
  user: string;
  time: string;
  details: string;
  ts: number;
  dotColor: 'green' | 'yellow' | 'red' | 'amber' | 'blue';
}

const OVERSTAY_HOURS = 2;

function visitorDotColor(log: VisitorLog): 'green' | 'yellow' | 'red' {
  if (log.status === 'Completed') return 'green';
  const hoursInside = (Date.now() - new Date(log.entryTime).getTime()) / 3600000;
  return hoursInside > OVERSTAY_HOURS ? 'red' : 'yellow';
}

function isToday(iso: string): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

// Due today/tomorrow (or already overdue) is red, due within a week is
// yellow, anything further out isn't urgent enough for the feed yet.
function billDotColor(bill: Bill): 'red' | 'yellow' | null {
  if (bill.status === 'Completed') return null;
  const days = daysUntil(bill.dueDate);
  if (days <= 1) return 'red';
  if (days <= 7) return 'yellow';
  return null;
}

function billDueLabel(days: number): string {
  if (days < 0) return `Overdue ${Math.abs(days)}d`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days}d`;
}

export default function CommandCenterDashboard({ searchTerm = '', isDarkMode = true, onNavigateToVisitors, onViewFullLogs }: { searchTerm?: string, isDarkMode?: boolean, onNavigateToVisitors?: () => void, onViewFullLogs?: () => void }) {
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [billHistory, setBillHistory] = useState<BillPayment[]>([]);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowBanner(false), 9000);
    const load = async () => {
      try {
        const data = await fetchVisitorLogs();
        setVisitorLogs(data);
      } catch {
        // Dashboard just shows zeroed-out gate stats until signed in.
      }
      try {
        const [billsData, historyData] = await Promise.all([fetchBills(), fetchAllBillHistory()]);
        setBills(billsData);
        setBillHistory(historyData);
      } catch {
        // Bill logs just don't show up in the feed until signed in.
      }
    };
    load();
    const interval = setInterval(load, 20000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const todayLogs = visitorLogs.filter((l) => isToday(l.entryTime));
  const todayVisits = todayLogs.length;
  const todayVisitors = new Set(todayLogs.map((l) => l.phone)).size;

  const STATS = [
    ...BASE_STATS.slice(0, 3),
    { label: 'Gate Entries', value: String(todayVisits), trend: `${todayVisitors} Visitors`, icon: Activity, color: 'text-emerald-500', onClick: onNavigateToVisitors },
    ...BASE_STATS.slice(3),
  ];

  const liveFeed: FeedItem[] = [];
  visitorLogs.forEach((log) => {
    if (log.entryTime) {
      // Reflects the visitor's *current* state: green once they've left, yellow
      // while still inside, red if they've overstayed past the threshold.
      liveFeed.push({
        id: `${log.logId}-in`,
        type: 'visit',
        title: 'Visitor Checked In',
        user: log.name || log.phone,
        time: formatRelativeTime(log.entryTime),
        details: `${log.purpose || 'Visit'} • ${log.phone}`,
        ts: new Date(log.entryTime).getTime(),
        dotColor: visitorDotColor(log),
      });
    }
    if (log.exitTime) {
      liveFeed.push({
        id: `${log.logId}-out`,
        type: 'visit',
        title: 'Visitor Checked Out',
        user: log.name || log.phone,
        time: formatRelativeTime(log.exitTime),
        details: `${log.purpose || 'Visit'} • ${log.phone}`,
        ts: new Date(log.exitTime).getTime(),
        dotColor: 'green',
      });
    }
  });
  // Dashboard widget only surfaces today's activity — the full history lives on the "View Full Logs" page.
  const recentActivities = liveFeed.filter((item) => isToday(new Date(item.ts).toISOString()));

  const labelForIdentifier = (identifier: string) => bills.find((b) => b.identifier === identifier)?.label || identifier;

  const billFeed: FeedItem[] = [];
  bills.forEach((bill) => {
    // Due-soon/due-today/overdue reminders persist across days until paid —
    // unlike visitor check-ins, "today only" doesn't make sense for these.
    const dotColor = billDotColor(bill);
    if (!dotColor) return;
    const days = daysUntil(bill.dueDate);
    billFeed.push({
      id: `bill-due-${bill.billId}`,
      type: 'bill',
      title: days < 0 ? 'Bill Overdue' : 'Bill Due Soon',
      user: bill.label || bill.identifier,
      time: billDueLabel(days),
      details: `${bill.category} • ${formatCurrency(bill.amount)}`,
      ts: new Date(bill.dueDate).getTime(),
      dotColor,
    });
  });
  billHistory
    .filter((payment) => isToday(payment.paidDate))
    .forEach((payment) => {
      billFeed.push({
        id: `bill-paid-${payment.paymentId}`,
        type: 'bill',
        title: 'Bill Paid',
        user: labelForIdentifier(payment.identifier),
        time: formatRelativeTime(payment.paidDate),
        details: `${payment.category} • ${formatCurrency(payment.amount)}`,
        ts: new Date(payment.paidDate).getTime(),
        dotColor: 'green',
      });
    });

  const combinedFeed = [...billFeed, ...recentActivities];
  const priorityOf = (color: FeedItem['dotColor']) => (color === 'red' ? 0 : color === 'yellow' ? 1 : 2);
  combinedFeed.sort((a, b) => {
    const pa = priorityOf(a.dotColor);
    const pb = priorityOf(b.dotColor);
    if (pa !== pb) return pa - pb;
    // Red/yellow: most urgent (soonest due, or longest overstay) first.
    // Everything else: most recent first.
    return pa <= 1 ? a.ts - b.ts : b.ts - a.ts;
  });

  const filteredActivities = combinedFeed.filter(activity =>
    activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Welcome Banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, height: 0, marginBottom: 0, padding: 0, overflow: 'hidden' }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 dark:from-indigo-950 dark:via-slate-900 dark:to-indigo-900 p-8 text-white shadow-2xl shadow-indigo-500/10"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
                <h1 className="text-2xl md:text-4xl font-black tracking-tighter">Good Evening, Admin <span className="inline-block" style={{ animation: 'wave 1.5s ease-in-out infinite', transformOrigin: '70% 70%' }}>👋</span></h1>
              </div>
              <p className="text-blue-100/70 max-w-xl text-sm md:text-base font-medium leading-relaxed mt-2">
                All systems are operational across the Clove HQ network. Real-time metrics indicate optimal performance in core sectors.
              </p>
            </div>
            
            <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15)_0%,transparent_70%)] pointer-events-none" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Stats and Chart Area */}
        <div className="xl:col-span-2 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {STATS.map((stat, idx) => (
              <GlareHover
                key={stat.label}
                className="w-full h-full rounded-xl"
                borderRadius="0.75rem"
                borderColor="transparent"
                glareOpacity={0.2}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={(stat as any).onClick}
                  className={cn(
                    "bg-[var(--panel-bg)] backdrop-blur-xl border border-[var(--border-color)] p-5 shadow-sm group h-full rounded-xl transition-colors duration-300",
                    (stat as any).onClick && "cursor-pointer hover:border-blue-500/40"
                  )}
                  title={(stat as any).onClick ? 'View visitor tracking' : undefined}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className={cn("p-2.5 rounded-xl bg-[var(--bg-color)] shadow-sm ring-1 ring-[var(--border-color)] transition-transform group-hover:scale-110", stat.color)}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <div className={cn(
                      "flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-full",
                      stat.trend.startsWith('+') ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" :
                      stat.trend.startsWith('-') ? "text-rose-600 bg-rose-50 dark:bg-rose-900/20" :
                      "text-[var(--text-secondary)] bg-[var(--bg-color)]"
                    )}>
                      {stat.trend.startsWith('+') && <ArrowUpRight className="w-3 h-3" />}
                      {stat.trend.startsWith('-') && <ArrowDownRight className="w-3 h-3" />}
                      {stat.trend}
                    </div>
                  </div>
                  <p className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest mb-1 opacity-70">{stat.label}</p>
                  <h3 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">{stat.value}</h3>
                </motion.div>
              </GlareHover>
            ))}
          </div>

          {/* Activity Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--panel-bg)] backdrop-blur-xl border border-[var(--border-color)] rounded-3xl p-8 shadow-sm hover:shadow-[0_0_40px_rgba(37,99,235,0.1)] hover:border-blue-500/20 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Weekly Activity</h3>
                <p className="text-[var(--text-secondary)] text-xs font-medium mt-1 opacity-70">Movement and engagement tracking per day.</p>
              </div>
              <div className="flex gap-2">
                {['Daily', 'Weekly', 'Monthly'].map(period => (
                  <button key={period} className={cn(
                    "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                    period === 'Weekly' ? "bg-blue-600 text-white shadow-lg" : "text-[var(--text-secondary)] hover:bg-[var(--bg-color)]"
                  )}>
                    {period}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DATA}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4F46E5" />
                      <stop offset="100%" stopColor="#818CF8" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: isDarkMode ? '#94A3B8' : '#475569', fontSize: 12, fontWeight: 700 }}
                    dy={12}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: isDarkMode ? '#94A3B8' : '#475569', fontSize: 12, fontWeight: 700 }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(59, 130, 246, 0.05)', radius: 12 }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className={cn(
                            "backdrop-blur-xl border p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] animate-in zoom-in-95 duration-200",
                            isDarkMode ? "bg-black/90 border-blue-500/20" : "bg-white/95 border-blue-500/20"
                          )}>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
                              <p className={cn("text-[10px] font-black uppercase tracking-[0.2em]", isDarkMode ? "text-slate-500" : "text-slate-400")}>{label} Statistics</p>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <p className={cn("text-3xl font-black tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>{payload[0].value.toLocaleString()}</p>
                              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Active Units</p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ 
                      paddingBottom: '30px', 
                      fontSize: '10px', 
                      textTransform: 'uppercase', 
                      fontWeight: 900, 
                      letterSpacing: '0.2em',
                      color: '#94A3B8'
                    }}
                  />
                  <ReferenceLine 
                    y={50} 
                    stroke="#4F46E5" 
                    strokeDasharray="8 4" 
                    strokeWidth={2}
                    label={{ 
                      value: 'DAILY TARGET: 50', 
                      position: 'insideTopRight', 
                      fill: '#4F46E5', 
                      fontSize: 10, 
                      fontWeight: 900,
                      letterSpacing: '0.1em'
                    }} 
                  />
                  <Bar 
                    name="Active Units"
                    dataKey="value" 
                    radius={[12, 12, 12, 12]} 
                    barSize={40}
                    animationDuration={1500}
                    animationEasing="ease-out"
                    activeBar={({ x, y, width, height, fill }: any) => (
                      <g>
                        <rect 
                          x={x} 
                          y={y - 8} 
                          width={width} 
                          height={height + 8} 
                          fill={fill} 
                          opacity={0.9}
                          rx={12}
                          ry={12}
                          className="transition-all duration-300"
                        />
                        <rect 
                          x={x} 
                          y={y - 8} 
                          width={width} 
                          height={height + 8} 
                          fill="transparent"
                          stroke="rgba(59, 130, 246, 0.2)"
                          strokeWidth={2}
                          rx={12}
                          ry={12}
                        />
                      </g>
                    )}
                  >
                    {DATA.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === 3 ? "url(#barGradient)" : "#E2E8F0"}
                        className="transition-all duration-500 hover:opacity-80 cursor-pointer"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
        {/* Live Feed Timeline */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[var(--panel-bg)] backdrop-blur-3xl border border-[var(--border-color)] rounded-3xl p-8 shadow-sm flex flex-col relative overflow-hidden group transition-colors duration-300"
        >
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] pointer-events-none" />
          
          <div className="flex items-center gap-4 mb-8 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.05)] dark:bg-blue-600/20 dark:text-blue-400 dark:border-blue-500/20 dark:shadow-[0_0_20px_rgba(37,99,235,0.1)]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Live Feed</h3>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em] opacity-60">Real-time Stream</p>
              </div>
            </div>
          </div>

          <div className="space-y-10 max-h-[640px] overflow-y-auto pr-2 custom-scrollbar relative z-10 py-2">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-20 opacity-20 uppercase font-mono text-[10px] tracking-widest text-[var(--text-secondary)]">
                {searchTerm ? 'No matching activities' : 'No visitor or bill activity yet today'}
              </div>
            ) : (
              filteredActivities.map((activity, idx) => (
                <motion.div 
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
                transition={{ delay: 0.3 + (idx * 0.1) }}
                className="relative pl-10 group/item cursor-pointer"
              >
                {/* Visual Timeline Connector */}
                <div className="absolute left-[7px] top-6 bottom-[-3rem] w-[2px] bg-blue-500/20 group-last/item:hidden" />
                
                {/* Status Indicator with Glow — green: checked out, yellow: still inside, red: overstayed 2h+ */}
                <div className={cn(
                  "absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-[var(--bg-color)] z-10 transition-all duration-500 group-hover/item:scale-[1.4] group-hover/item:shadow-[0_0_15px_rgba(37,99,235,0.8)]",
                  activity.dotColor === 'green' ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]" :
                  activity.dotColor === 'yellow' ? "bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.3)] animate-pulse" :
                  activity.dotColor === 'red' ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)] animate-pulse" :
                  activity.dotColor === 'amber' ? "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]" :
                  "bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.3)]"
                )} />

                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-base font-black text-[var(--text-primary)] tracking-wide group-hover/item:text-blue-500 dark:group-hover/item:text-blue-400 transition-colors uppercase">{activity.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest opacity-60">{activity.type === 'bill' ? 'Bill:' : 'Operator:'}</span>
                        <span className="text-[10px] text-blue-600 dark:text-blue-300 font-black uppercase tracking-[0.1em]">{activity.user}</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-black text-[var(--text-secondary)] tabular-nums uppercase tracking-widest bg-[var(--bg-color)] px-2 py-1 rounded-lg border border-[var(--border-color)] group-hover/item:bg-blue-500 group-hover/item:text-white dark:group-hover/item:bg-blue-500/20 dark:group-hover/item:text-blue-200 transition-colors">{activity.time}</span>
                  </div>

                  <div className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-2xl p-4 group-hover/item:bg-[var(--bg-color)]/80 group-hover/item:border-blue-500/40 group-hover/item:shadow-[0_0_30px_rgba(37,99,235,0.1)] transition-all duration-300">
                    <p className="text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-3">
                      {activity.type === 'bill' ? (
                        <Wallet className="w-4 h-4 text-blue-500 dark:text-blue-400 animate-pulse" />
                      ) : (
                        <Zap className="w-4 h-4 text-blue-500 dark:text-blue-400 animate-pulse" />
                      )}
                      {activity.details}
                    </p>
                  </div>
                </div>
              </motion.div>
            )))}
          </div>

          <div className="mt-10 pt-8 border-t border-[var(--border-color)] relative z-10">
            <motion.button
              onClick={onViewFullLogs}
              whileHover={{ scale: 1.02, backgroundColor: "var(--text-primary)", color: "var(--bg-color)" }}
              whileTap={{ scale: 0.95 }}
              className="w-full py-5 rounded-[1.5rem] bg-[var(--bg-color)] text-[var(--text-primary)] text-[11px] font-black uppercase tracking-[0.2em] border border-[var(--border-color)] transition-all duration-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              View Full Visitor Logs
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
