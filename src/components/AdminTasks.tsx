import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter,
  Plus,
  MoreVertical,
  Calendar,
  User,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

type TaskStatus = 'All' | 'Pending' | 'Completed' | 'Urgent';

interface Task {
  id: string;
  title: string;
  assignee: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'Completed';
  dueDate: string;
  category: string;
}

const MOCK_TASKS: Task[] = [
  { id: 'TSK-001', title: 'Verify Vendor Invoices', assignee: 'Sarah Chen', priority: 'High', status: 'Pending', dueDate: '2026-05-19', category: 'Finance' },
  { id: 'TSK-002', title: 'Update Gate Protocols', assignee: 'John Wick', priority: 'Medium', status: 'Completed', dueDate: '2026-05-15', category: 'Security' },
  { id: 'TSK-003', title: 'Cab Vendor Audit', assignee: 'Sarah Chen', priority: 'High', status: 'Pending', dueDate: '2026-05-22', category: 'Logistics' },
  { id: 'TSK-004', title: 'Room Booking System Sync', assignee: 'Alex Kumar', priority: 'Low', status: 'Completed', dueDate: '2026-05-19', category: 'Operations' },
  { id: 'TSK-005', title: 'Emergency Drill Schedule', assignee: 'David Miller', priority: 'High', status: 'Pending', dueDate: '2026-05-12', category: 'Safety' },
  { id: 'TSK-006', title: 'New Visitor Badge Design', assignee: 'Maria Garcia', priority: 'Medium', status: 'Pending', dueDate: '2026-05-21', category: 'Admin' },
];

export function AdminTasks({ searchTerm = '' }: { searchTerm?: string }) {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [filter, setFilter] = useState<TaskStatus>('All');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const assignees: string[] = ['All', ...(Array.from(new Set(tasks.map(t => t.assignee))) as string[])];
  const categories: string[] = ['All', ...(Array.from(new Set(tasks.map(t => t.category))) as string[])];

  const getDueDateStatus = (dueDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    if (dueDate === today) return 'today';
    if (dueDate < today) return 'overdue';
    return 'upcoming';
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         task.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.assignee.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filter === 'All' || 
                         (filter === 'Urgent' ? task.priority === 'High' : task.status === filter);
    const matchesAssignee = selectedAssignee === 'All' || task.assignee === selectedAssignee;
    const matchesCategory = selectedCategory === 'All' || task.category === selectedCategory;
    
    return matchesSearch && matchesStatus && matchesAssignee && matchesCategory;
  });

  const counts = {
    All: tasks.length,
    Pending: tasks.filter(t => t.status === 'Pending').length,
    Completed: tasks.filter(t => t.status === 'Completed').length,
    Urgent: tasks.filter(t => t.priority === 'High').length
  };

  const toggleTaskStatus = (id: string) => {
    setTasks(prev => prev.map(task => 
      task.id === id 
        ? { ...task, status: task.status === 'Completed' ? 'Pending' : 'Completed' } 
        : task
    ));
  };

  return (
    <div className="space-y-8 pb-20 transition-colors duration-300">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-1 bg-blue-600 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">Task_Management_Hub</span>
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">Administrative Backlog</h1>
          <p className="text-[var(--text-secondary)] font-medium mt-2 opacity-60">Monitor, filter and resolve critical administrative operations Across Clove HQ.</p>
        </div>

        <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2 self-start md:self-auto">
          <Plus className="w-4 h-4" /> New Operational Task
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex flex-wrap items-center gap-3">
          {(['All', 'Pending', 'Completed', 'Urgent'] as TaskStatus[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 border shadow-sm",
                filter === f 
                  ? "bg-blue-600 border-blue-500 text-white" 
                  : "bg-[var(--panel-bg)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-blue-500/30"
              )}
            >
              {f}
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[8px] font-mono",
                filter === f ? "bg-white/20 text-white" : "bg-[var(--bg-color)] text-[var(--text-secondary)] opacity-60"
              )}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        <div className="h-10 w-px bg-[var(--border-color)] hidden md:block" />

        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] opacity-30 mb-1.5 ml-1">Commander_Filter</span>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-secondary)] opacity-40 group-focus-within:text-blue-500 transition-colors" />
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="pl-10 pr-10 py-3 bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50 appearance-none transition-all cursor-pointer hover:border-blue-500/30 min-w-[180px]"
              >
                {assignees.map(a => (
                  <option key={a} value={a}>{a === 'All' ? 'ALL_OPERATORS' : a.toUpperCase()}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)] opacity-40">
                <Filter className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] opacity-30 mb-1.5 ml-1">Category_Filter</span>
            <div className="relative group">
              <AlertCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-secondary)] opacity-40 group-focus-within:text-blue-500 transition-colors" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-10 pr-10 py-3 bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50 appearance-none transition-all cursor-pointer hover:border-blue-500/30 min-w-[180px]"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c === 'All' ? 'ALL_DIVISIONS' : c.toUpperCase()}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)] opacity-40">
                <Filter className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Grid */}
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredTasks.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 flex flex-col items-center justify-center bg-[var(--panel-bg)] border border-dashed border-[var(--border-color)] rounded-[3rem]"
            >
              <div className="w-16 h-16 rounded-full bg-[var(--bg-color)] flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-[var(--text-secondary)] opacity-20" />
              </div>
              <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em] opacity-40">Zero_Tasks_Found_Protocol</p>
            </motion.div>
          ) : (
            filteredTasks.map((task) => {
              const dueDateStatus = getDueDateStatus(task.dueDate);
              const isCompleted = task.status === 'Completed';

              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ 
                    opacity: isCompleted ? 0.6 : 1, 
                    y: 0,
                    scale: isCompleted ? 0.98 : 1
                  }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    "bg-[var(--panel-bg)] border rounded-[2rem] p-7 transition-all group relative overflow-hidden",
                    isCompleted ? "border-[var(--border-color)] grayscale-[0.3] opacity-60" : "border-[var(--border-color)] hover:shadow-2xl hover:shadow-blue-500/5",
                    task.priority === 'High' && !isCompleted && "border-rose-500/30 bg-rose-500/[0.02] shadow-[0_0_40px_rgba(244,63,94,0.08)]",
                    task.priority === 'Medium' && !isCompleted && "border-amber-500/25 bg-amber-500/[0.015]"
                  )}
                >
                  {/* High Priority Glow Effect */}
                  {task.priority === 'High' && !isCompleted && (
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent pointer-events-none" />
                  )}

                  {/* Priority Status Indicator */}
                  <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-1.5 transition-all",
                    task.priority === 'High' ? "bg-rose-500 shadow-[2px_0_10px_rgba(244,63,94,0.4)]" : 
                    task.priority === 'Medium' ? "bg-amber-500" : "bg-blue-500",
                    isCompleted && "opacity-20"
                  )} />

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    <div className="lg:col-span-1">
                      <button 
                        onClick={() => toggleTaskStatus(task.id)}
                        className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 active:scale-90 shadow-inner",
                          isCompleted 
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-500" 
                            : "bg-[var(--bg-color)] border-[var(--border-color)] text-[var(--text-secondary)] opacity-40 hover:bg-blue-500 hover:text-white hover:border-blue-500 hover:scale-110 hover:rotate-12"
                        )}
                        title={isCompleted ? "Mark as Pending" : "Mark as Completed"}
                      >
                        {isCompleted ? <CheckCircle2 className="w-7 h-7" /> : <Clock className="w-6 h-6" />}
                      </button>
                    </div>

                    <div className="lg:col-span-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg",
                          task.priority === 'High' ? "bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse" : 
                          task.priority === 'Medium' ? "bg-amber-500 text-white" : "bg-blue-500 text-white"
                        )}>
                          {task.priority}_PRIORITY
                        </span>
                        {isCompleted ? (
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                            VERIFIED_TASK
                          </span>
                        ) : dueDateStatus === 'overdue' && (
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg bg-rose-600 text-white animate-bounce shadow-lg">
                            CRITICAL_OVERDUE
                          </span>
                        )}
                      </div>
                      <h4 className={cn(
                        "text-lg font-black text-[var(--text-primary)] uppercase tracking-tight transition-all",
                        isCompleted ? "line-through opacity-40" : "group-hover:text-blue-500"
                      )}>
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] font-mono text-[var(--text-secondary)] opacity-40">{task.id}</span>
                        <span className="w-1 h-1 bg-[var(--border-color)] rounded-full" />
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border transition-colors",
                          task.category === 'Security' ? "text-rose-400 border-rose-400/20" :
                          task.category === 'Finance' ? "text-emerald-400 border-emerald-400/20" :
                          task.category === 'Logistics' ? "text-blue-400 border-blue-400/20" :
                          "text-slate-400 border-slate-400/20"
                        )}>{task.category}</span>
                      </div>
                    </div>

                    <div className="lg:col-span-3 flex items-center gap-10">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] opacity-30 mb-2">Ops_Commander</span>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                            <User className="w-4 h-4 text-blue-500" />
                          </div>
                          <span className="text-xs font-bold text-[var(--text-primary)] opacity-80">{task.assignee}</span>
                        </div>
                      </div>
                      <div className={cn(
                        "flex flex-col p-2 rounded-xl border transition-all duration-300",
                        !isCompleted && dueDateStatus === 'today' && "bg-yellow-400 border-yellow-500 shadow-[0_0_15px_rgba(250,204,21,0.2)]",
                        !isCompleted && dueDateStatus === 'overdue' && "bg-red-500 border-red-600 shadow-[0_0_15px_rgba(239,68,68,0.2)]",
                        (isCompleted || dueDateStatus === 'upcoming') && "border-transparent"
                      )}>
                        <span className={cn(
                          "text-[8px] font-black uppercase tracking-[0.2em] mb-1 px-1",
                          !isCompleted && dueDateStatus === 'today' ? "text-slate-900/80" : 
                          !isCompleted && dueDateStatus === 'overdue' ? "text-white/90" : 
                          "text-[var(--text-secondary)] opacity-30"
                        )}>Deadline_T</span>
                        <div className="flex items-center gap-2 px-1">
                          <Calendar className={cn(
                            "w-3.5 h-3.5",
                            !isCompleted && dueDateStatus === 'today' ? "text-slate-900" : 
                            !isCompleted && dueDateStatus === 'overdue' ? "text-white" : 
                            "text-[var(--text-secondary)] opacity-40"
                          )} />
                          <span className={cn(
                            "text-[10px] font-mono font-bold",
                            !isCompleted && dueDateStatus === 'today' ? "text-slate-900" : 
                            !isCompleted && dueDateStatus === 'overdue' ? "text-white" : 
                            "text-[var(--text-primary)] opacity-80"
                          )}>
                            {task.dueDate}
                          </span>
                        </div>
                      </div>
                    </div>

                  <div className="lg:col-span-2 flex flex-col items-end gap-2">
                    <span className="text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] opacity-30 px-1">Task_Status</span>
                    <button
                      onClick={() => toggleTaskStatus(task.id)}
                      className={cn(
                        "relative w-20 h-10 rounded-full transition-all duration-500 flex items-center p-1 group/switch",
                        isCompleted ? "bg-emerald-500" : "bg-[var(--border-color)]"
                      )}
                    >
                      <motion.div
                        layout
                        className="w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center relative z-10"
                        animate={{ x: isCompleted ? 40 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        {isCompleted ? (
                          <CheckCircle2 size={16} className="text-emerald-500" />
                        ) : (
                          <Clock size={16} className="text-slate-400" />
                        )}
                      </motion.div>
                      
                      <span className={cn(
                        "absolute text-[7px] font-black uppercase tracking-tighter transition-all duration-300",
                        isCompleted ? "left-3 text-white opacity-80" : "right-3 text-[var(--text-secondary)] opacity-40"
                      )}>
                        {isCompleted ? "DONE" : "PEND"}
                      </span>
                    </button>
                  </div>

                  <div className="lg:col-span-2 flex justify-end gap-2.5">
                    <button className="p-3.5 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-2xl text-[var(--text-secondary)] opacity-40 hover:opacity-100 hover:text-blue-500 hover:border-blue-500/50 hover:shadow-lg transition-all active:scale-95">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button className="p-3.5 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-2xl text-[var(--text-secondary)] opacity-40 hover:opacity-100 hover:bg-white/5 transition-all">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </AnimatePresence>
    </div>

      {/* Intelligence Insights */}
      <div className="bg-blue-600/5 border border-blue-500/10 rounded-[2.5rem] p-8 flex items-start gap-6">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 shrink-0">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h5 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-2">Backlog_Intelligence_Node</h5>
          <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed opacity-70">
            System analysis suggests focusing on <span className="font-black text-[var(--text-primary)]">3 Urgent Tasks</span> with high operational impact. Two tasks related to Security protocols are pending approval since 48 hours.
          </p>
        </div>
      </div>
    </div>
  );
}
