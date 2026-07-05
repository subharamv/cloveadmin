import React, { useState } from 'react';
import { 
  Shield, 
  Sparkles, 
  Zap, 
  Droplet, 
  Wind, 
  Layers, 
  Truck, 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  SlidersHorizontal,
  LayoutGrid,
  ChevronRight,
  ChevronDown,
  Activity,
  Trash2,
  FileOutput,
  Check,
  X,
  UserPlus,
  CalendarClock,
  DoorOpen,
  Thermometer,
  Gauge,
  Waves,
  Building,
  CloudRain,
  CarFront,
  Flame,
  Siren,
  Wrench,
  ShieldCheck,
  Package,
  ShoppingCart,
  Wallet,
  Briefcase,
  Percent,
  Banknote
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

// Data models for the 13 Pillars configuring the active layout state
const PILLARS = {
  housekeeping: { label: 'Housekeeping & Office Boys', icon: Sparkles, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  security: { label: 'Security', icon: Shield, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  electrical: { label: 'Electrical & Lighting', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  plumbing: { label: 'Plumbing', icon: Droplet, color: 'text-sky-500', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
  windows_doors: { label: 'Windows & Doors', icon: Layers, color: 'text-teal-500', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
  hvac: { label: 'HVAC & Elevators', icon: Wind, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  structural: { label: 'Building Exterior', icon: Layers, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  logistics: { label: 'Transportation & Parking Lots', icon: Truck, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  security_systems: { label: 'Security Systems & Safety Requirements', icon: Shield, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  asset_mgt: { label: 'Asset Mgt, Repairs & Maintenance', icon: Activity, color: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
  procurement: { label: 'Purchase/Procurement', icon: FileText, color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  vendor_mgt: { label: 'Vendor Mgt & Payment Co-ordination', icon: FileText, color: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  general_maint: { label: 'General Maintenance', icon: SlidersHorizontal, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' }
};

const TECHNICIANS = ['Tech Team Alpha', 'Vendor Support', 'Internal Maintenance'];

// Dictionary mapping scopes/pillars to reviewers
export const REVIEWER_MAP: { [key: string]: string } = {
  housekeeping: 'PSR Dhanwantri',
  security: 'PSR Dhanwantri',
  electrical: 'J Murali Krishna',
  plumbing: 'J Murali Krishna',
  windows_doors: 'J Murali Krishna',
  hvac: 'PSR Dhanwantri',
  structural: 'PSR Dhanwantri',
  logistics: 'PSR Dhanwantri',
  security_systems: 'PSR Dhanwantri',
  asset_mgt: 'J Murali Krishna',
  procurement: 'PSR Dhanwantri',
  vendor_mgt: 'PSR Dhanwantri',
  general_maint: 'PSR Dhanwantri',

  'Housekeeping & Office Boys': 'PSR Dhanwantri',
  'Security': 'PSR Dhanwantri',
  'Electrical & Lighting': 'J Murali Krishna',
  'Plumbing': 'J Murali Krishna',
  'Windows & Doors': 'J Murali Krishna',
  'HVAC & Elevators': 'PSR Dhanwantri',
  'Building Exterior': 'PSR Dhanwantri',
  'Transportation & Parking Lots': 'PSR Dhanwantri',
  'Security Systems & Safety Requirements': 'PSR Dhanwantri',
  'Asset Mgt, Repairs & Maintenance': 'J Murali Krishna',
  'Purchase/Procurement': 'PSR Dhanwantri',
  'Vendor Mgt & Payment Co-ordination': 'PSR Dhanwantri',
  'General Maintenance': 'PSR Dhanwantri'
};

export const FacilityManagementTab: React.FC = () => {
  const [selectedPillar, setSelectedPillar] = useState('housekeeping');
  const [subScope, setSubScope] = useState<string>('Workspaces');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDesk, setSelectedDesk] = useState<'all' | 'dhanwantri' | 'krishna'>('all');

  const handlePillarChange = (val: string) => {
    setSelectedPillar(val);
    if (val === 'security') {
      setSubScope('Security Conduct');
    } else if (val === 'housekeeping') {
      setSubScope('Workspaces');
    } else {
      setSubScope('');
    }
    if (val !== 'procurement') {
      setPettyCash('');
      setAccountsSync('Pending');
    }
  };
  
  // Interactive Enhanced States for Row Selection
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([]);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  
  // Technician Assignment States
  const [assigningIssueId, setAssigningIssueId] = useState<string | null>(null);
  const [tempSelectedTech, setTempSelectedTech] = useState<{ [key: string]: string }>({});
  
  // Authorization and Routing Session and Filter states
  const [activeUserSession, setActiveUserSession] = useState<string>('Master Control');
  const [approvalsFilter, setApprovalsFilter] = useState<'all' | 'mine'>('all');
  const [selectedZone, setSelectedZone] = useState<string>('All Zones');

  // Preventative Maintenance & Restock Reminder Engine state
  const [reminders, setReminders] = useState([
    {
      id: "REM-001",
      title: "Restock Canteen Water Bottles",
      pillar: "housekeeping",
      frequency: "Weekly",
      dueDate: "Tomorrow",
      status: "Active"
    },
    {
      id: "REM-002",
      title: "HVAC Coil Deep Clean",
      pillar: "hvac",
      frequency: "Monthly",
      dueDate: "In 3 Days",
      status: "Active"
    },
    {
      id: "REM-003",
      title: "Electrical Control Panel Oil Check",
      pillar: "electrical",
      frequency: "Half-Yearly",
      dueDate: "In 5 Days",
      status: "Active"
    },
    {
      id: "REM-004",
      title: "Fire Extinguisher & Safety Audit",
      pillar: "security",
      frequency: "Yearly",
      dueDate: "In 10 Days",
      status: "Active"
    },
    {
      id: "REM-005",
      title: "Water Tank Drainage & Disinfection",
      pillar: "plumbing",
      frequency: "Half-Yearly",
      dueDate: "In 12 Days",
      status: "Active"
    }
  ]);

  const handleSnoozeReminder = (id: string, title: string) => {
    setReminders(prev => prev.map(rem => {
      if (rem.id === id) {
        return { ...rem, dueDate: "In 7 Days" };
      }
      return rem;
    }));
    setToast({
      show: true,
      title: "Reminder Snoozed",
      desc: `Snoozed task "${title}" by 1 week (In 7 Days).`
    });
    setTimeout(() => setToast(null), 3000);
  };

  const handleMarkCompletedReminder = (id: string, title: string) => {
    setReminders(prev => prev.map(rem => {
      if (rem.id === id) {
        return { ...rem, status: "Completed" };
      }
      return rem;
    }));
    setToast({
      show: true,
      title: "Reminder Completed",
      desc: `Successfully resolved and closed task "${title}".`
    });
    setTimeout(() => setToast(null), 3000);
  };
  
  // Local active states mapping submitted issues & collection telemetry tracking log records
  const [issues, setIssues] = useState([
    { 
      id: 'TKT-2026-001', 
      pillar: 'electrical', 
      reporter: 'Area Incharge', 
      description: 'DB-Main phase imbalance detected. Phase B fluctuating outside normal load margins.', 
      urgency: 'High', 
      priorityScore: 12, 
      status: 'Dispatched', 
      completionProgress: 45,
      evaluationStatus: 'Flag' as 'Pass' | 'Flag' | 'Fail',
      measurement: { value: 242, unit: 'V' },
      pettyCash: undefined as number | undefined,
      accountsSync: undefined as string | undefined,
      isFinancialFlag: undefined as boolean | undefined,
      assignedReviewer: 'J Murali Krishna'
    },
    { 
      id: 'TKT-2026-002', 
      pillar: 'hvac', 
      reporter: 'Business Head', 
      description: 'AHU-3 server block breakdown. Room ambient temperature spikes past 28°C.', 
      urgency: 'Critical', 
      priorityScore: 16, 
      status: 'In_Progress', 
      completionProgress: 15,
      evaluationStatus: 'Fail' as 'Pass' | 'Flag' | 'Fail',
      measurement: { value: 28.5, unit: '°C' },
      pettyCash: undefined as number | undefined,
      accountsSync: undefined as string | undefined,
      isFinancialFlag: undefined as boolean | undefined,
      assignedReviewer: 'PSR Dhanwantri'
    },
    { 
      id: 'TKT-2026-003', 
      pillar: 'plumbing', 
      reporter: 'Employee', 
      description: 'Minor structural leak in sensor tap layout lines, washroom block B.', 
      urgency: 'Low', 
      priorityScore: 3, 
      status: 'Unassigned', 
      completionProgress: 0,
      evaluationStatus: 'Pass' as 'Pass' | 'Flag' | 'Fail',
      measurement: { value: 1.2, unit: 'bar' },
      pettyCash: undefined as number | undefined,
      accountsSync: undefined as string | undefined,
      isFinancialFlag: undefined as boolean | undefined,
      assignedReviewer: 'J Murali Krishna'
    },
    {
      id: 'TKT-2026-004',
      pillar: 'procurement',
      reporter: 'Area Incharge',
      description: 'Critical procurement delay for replacement chillers SLA mismatch.',
      urgency: 'Critical',
      priorityScore: 16,
      status: 'Unassigned',
      completionProgress: 10,
      evaluationStatus: 'Fail' as 'Pass' | 'Flag' | 'Fail',
      measurement: undefined,
      pettyCash: 4500,
      accountsSync: 'Pending',
      isFinancialFlag: true,
      assignedReviewer: 'PSR Dhanwantri'
    }
  ]);

  // Form Field State Maps
  const [formData, setFormData] = useState({
    reporterRole: 'Employee',
    assetCriticality: '3',
    severityStatus: '3',
    description: '',
    telemetryFieldA: '',
    telemetryFieldB: '',
    evaluationStatus: 'Pass' as 'Pass' | 'Flag' | 'Fail',
    telemetryValue: '',
    telemetryUnit: '',
    productionLoad: '',
    nonProductionLoad: '',
    pressurePsi: '',
    chlorinationPpm: '',
    sealantScore: '',
    closingSpeedSec: '',
    ahuSupplyTempC: '',
    compressorPressurePsi: '',
    vibrationAmplitudeMms: '',
    facadeScore: '',
    drainageClearancePct: '',
    fleetReadinessPct: '',
    parkingVacancyPct: '',
    extinguisherCheckDays: '',
    drillCompliancePct: '',
    activeAmcPct: '',
    sparePartsStockPct: '',
    pettyCashInr: '',
    accountsSyncStatus: 'Pending',
    slaVariancePct: '',
    escrowStatus: 'Pending'
  });

  const [pettyCash, setPettyCash] = useState<string>('');
  const [accountsSync, setAccountsSync] = useState<string>('Pending');

  // --- MODALS SYSTEM STATE HOOKS ---
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Manual Work Order Modal Fields
  const [woTargetPillar, setWoTargetPillar] = useState('electrical');
  const [woAssetLocation, setWoAssetLocation] = useState('');
  const [woDescription, setWoDescription] = useState('');
  const [woUrgency, setWoUrgency] = useState('3'); // 1-5 scale

  // Report Generator Modal Fields
  const [reportDateRange, setReportDateRange] = useState('Last 7 Days');
  const [reportScopes, setReportScopes] = useState({
    slaBreaches: true,
    complianceLogs: true,
    financialDelta: false
  });
  const [reportFormat, setReportFormat] = useState<'PDF' | 'Excel'>('PDF');

  // Interactive Toast State
  const [toast, setToast] = useState<{ show: boolean; title: string; desc: string } | null>(null);

  // Manual Work Order Form Submission
  const handleManualWorkOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!woDescription) return;

    // Calculate priority using the existing calculatePriority matrix
    // reporterRole: 'Employee', assetCriticality: '3', severityStatus: woUrgency
    const { score, urgency } = calculatePriority('Employee', '3', woUrgency);

    const newIssue = {
      id: `TKT-2026-0${issues.length + 1}`,
      pillar: woTargetPillar,
      reporter: 'Manual Despatch',
      description: `${woAssetLocation ? `[${woAssetLocation}] ` : ''}${woDescription}`,
      urgency: urgency,
      priorityScore: score,
      status: 'Unassigned' as const,
      completionProgress: 0,
      evaluationStatus: 'Flag' as const,
      measurement: undefined,
      assignedReviewer: REVIEWER_MAP[woTargetPillar] || 'PSR Dhanwantri'
    };

    setIssues([newIssue, ...issues]);
    setShowWorkOrderModal(false);

    // Reset Fields
    setWoTargetPillar('electrical');
    setWoAssetLocation('');
    setWoDescription('');
    setWoUrgency('3');

    // Trigger Success Toast
    setToast({
      show: true,
      title: 'Work Order Dispatched',
      desc: `Created Incident Ref ${newIssue.id} for sector ${woTargetPillar.toUpperCase()} successfully.`
    });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Report Generator Simulation
  const handleGenerateReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingReport(true);

    setTimeout(() => {
      setIsGeneratingReport(false);
      setShowReportModal(false);

      // Trigger success toast
      setToast({
        show: true,
        title: 'Report Generated Successfully',
        desc: `Compiled requested metrics in ${reportFormat} format for range: ${reportDateRange}.`
      });

      setTimeout(() => {
        setToast(null);
      }, 4500);
    }, 2000);
  };

  // Desk-to-pillar index scope definitions
  const DESK_PILLARS = {
    all: [
      'housekeeping', 'security', 'electrical', 'plumbing', 'windows_doors', 
      'hvac', 'structural', 'logistics', 'security_systems', 'asset_mgt', 
      'procurement', 'vendor_mgt', 'general_maint'
    ],
    dhanwantri: [
      'housekeeping', 'security', 'hvac', 'structural', 'logistics', 
      'security_systems', 'procurement', 'vendor_mgt', 'general_maint'
    ],
    krishna: [
      'electrical', 'plumbing', 'windows_doors', 'asset_mgt'
    ]
  };

  // Analytics Aggregation Mock Data matching recharts data requirements
  const complianceData = [
    { name: 'Housekeeping & Office Boys', Compliance: selectedZone === 'Zone A' ? 98 : selectedZone === 'Zone B' ? 92 : 96, Energy: selectedZone === 'Zone A' ? 85 : selectedZone === 'Zone B' ? 110 : 96, OpenIssues: 0, key: 'housekeeping' },
    { name: 'Security', Compliance: 100, Energy: selectedZone === 'Zone A' ? 40 : selectedZone === 'Zone B' ? 60 : 50, OpenIssues: 0, key: 'security' },
    { name: 'Electrical & Lighting', Compliance: selectedZone === 'Zone A' ? 80 : selectedZone === 'Zone B' ? 88 : 84, Energy: selectedZone === 'Zone A' ? 220 : selectedZone === 'Zone B' ? 260 : 242, OpenIssues: 1, key: 'electrical' },
    { name: 'Plumbing', Compliance: selectedZone === 'Zone A' ? 95 : selectedZone === 'Zone B' ? 87 : 91, Energy: selectedZone === 'Zone A' ? 12 : selectedZone === 'Zone B' ? 18 : 15, OpenIssues: 1, key: 'plumbing' },
    { name: 'Windows & Doors', Compliance: selectedZone === 'Zone A' ? 97 : selectedZone === 'Zone B' ? 94 : 95, Energy: selectedZone === 'Zone A' ? 5 : selectedZone === 'Zone B' ? 8 : 6, OpenIssues: 0, key: 'windows_doors' },
    { name: 'HVAC & Elevators', Compliance: selectedZone === 'Zone A' ? 74 : selectedZone === 'Zone B' ? 82 : 78, Energy: selectedZone === 'Zone A' ? 180 : selectedZone === 'Zone B' ? 220 : 205, OpenIssues: 1, key: 'hvac' },
    { name: 'Building Exterior', Compliance: 95, Energy: selectedZone === 'Zone A' ? 5 : selectedZone === 'Zone B' ? 10 : 8, OpenIssues: 0, key: 'structural' },
    { name: 'Transportation & Parking Lots', Compliance: selectedZone === 'Zone A' ? 90 : selectedZone === 'Zone B' ? 94 : 92, Energy: selectedZone === 'Zone A' ? 120 : selectedZone === 'Zone B' ? 140 : 130, OpenIssues: 0, key: 'logistics' },
    { name: 'Security Systems & Safety Requirements', Compliance: 99, Energy: selectedZone === 'Zone A' ? 30 : selectedZone === 'Zone B' ? 45 : 38, OpenIssues: 0, key: 'security_systems' },
    { name: 'Asset Mgt, Repairs & Maintenance', Compliance: 93, Energy: selectedZone === 'Zone A' ? 45 : selectedZone === 'Zone B' ? 65 : 55, OpenIssues: 0, key: 'asset_mgt' },
    { name: 'Purchase/Procurement', Compliance: selectedZone === 'Zone A' ? 85 : selectedZone === 'Zone B' ? 93 : 89, Energy: selectedZone === 'Zone A' ? 15 : selectedZone === 'Zone B' ? 25 : 20, OpenIssues: 0, key: 'procurement' },
    { name: 'Vendor Mgt & Payment Co-ordination', Compliance: 91, Energy: selectedZone === 'Zone A' ? 8 : selectedZone === 'Zone B' ? 12 : 10, OpenIssues: 0, key: 'vendor_mgt' },
    { name: 'General Maintenance', Compliance: 94, Energy: selectedZone === 'Zone A' ? 50 : selectedZone === 'Zone B' ? 70 : 60, OpenIssues: 0, key: 'general_maint' }
  ];

  // Dynamic filter according to desk indexing
  const filteredComplianceData = complianceData.filter(item => 
    DESK_PILLARS[selectedDesk].includes(item.key)
  );

  // Automated Formula Evaluation Engine for Dynamic Priority System Score ($1--25)
  const calculatePriority = (role: string, criticality: string, severity: string) => {
    const roleWeights = { 'Employee': 1, 'Area_Incharge': 2, 'Facility_Manager': 3, 'Business_Head': 4, 'Master_Control': 5 };
    const userWeight = roleWeights[role as keyof typeof roleWeights] || 1;
    const computedSeverity = parseInt(severity) || 1;
    
    const score = userWeight * computedSeverity;
    let urgency = 'Low';
    if (score >= 4) urgency = 'Medium';
    if (score >= 8) urgency = 'High';
    if (score >= 15) urgency = 'Critical';
    
    return { score, urgency };
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { score, urgency } = calculatePriority(formData.reporterRole, formData.assetCriticality, formData.severityStatus);
    
    let extraDesc = '';
    if (selectedPillar === 'electrical' && formData.productionLoad && formData.nonProductionLoad) {
      const prod = parseFloat(formData.productionLoad);
      const nonProd = parseFloat(formData.nonProductionLoad);
      if (!isNaN(prod) && !isNaN(nonProd) && prod > 0) {
        const varianceVal = Math.round((Math.abs(prod - nonProd) / prod) * 100);
        extraDesc = ` | Production: ${formData.productionLoad} kWh, Non-Production: ${formData.nonProductionLoad} kWh (Diff variance: ${varianceVal}%)`;
      }
    } else if (selectedPillar === 'plumbing' && (formData.pressurePsi || formData.chlorinationPpm)) {
      extraDesc = ` | Pressure: ${formData.pressurePsi || 'N/A'} psi, Chlorination: ${formData.chlorinationPpm || 'N/A'} ppm`;
    } else if (selectedPillar === 'windows_doors' && (formData.sealantScore || formData.closingSpeedSec)) {
      extraDesc = ` | Sealant Integrity: ${formData.sealantScore || 'N/A'}/5, Closing Speed: ${formData.closingSpeedSec || 'N/A'} sec`;
    } else if (selectedPillar === 'hvac' && (formData.ahuSupplyTempC || formData.compressorPressurePsi || formData.vibrationAmplitudeMms)) {
      extraDesc = ` | AHU Temp: ${formData.ahuSupplyTempC || 'N/A'}°C, Compressor: ${formData.compressorPressurePsi || 'N/A'} psi, Vibration: ${formData.vibrationAmplitudeMms || 'N/A'} mm/s`;
    } else if ((selectedPillar === 'structural' || selectedPillar === 'Building Exterior') && (formData.facadeScore || formData.drainageClearancePct)) {
      extraDesc = ` | Facade Integrity: ${formData.facadeScore || 'N/A'}/5, Drainage Clearance: ${formData.drainageClearancePct || 'N/A'}%`;
    } else if ((selectedPillar === 'logistics' || selectedPillar === 'Transportation & Parking Lots') && (formData.fleetReadinessPct || formData.parkingVacancyPct)) {
      extraDesc = ` | Fleet Readiness: ${formData.fleetReadinessPct || 'N/A'}%, Parking Vacancy: ${formData.parkingVacancyPct || 'N/A'}%`;
    } else if ((selectedPillar === 'security_systems' || selectedPillar === 'Security Systems & Safety Requirements') && (formData.extinguisherCheckDays || formData.drillCompliancePct)) {
      extraDesc = ` | Fire Extinguisher Status: ${formData.extinguisherCheckDays || 'N/A'} days, Evacuation Drill Readiness: ${formData.drillCompliancePct || 'N/A'}%`;
    } else if ((selectedPillar === 'asset_mgt' || selectedPillar === 'Asset Mgt, Repairs & Maintenance') && (formData.activeAmcPct || formData.sparePartsStockPct)) {
      extraDesc = ` | AMC / Warranty Coverage: ${formData.activeAmcPct || 'N/A'}%, Critical Spares Stock: ${formData.sparePartsStockPct || 'N/A'}%`;
    } else if ((selectedPillar === 'procurement' || selectedPillar === 'Purchase/Procurement') && (formData.pettyCashInr || formData.accountsSyncStatus)) {
      extraDesc = ` | Petty Cash Utilized: ₹${formData.pettyCashInr || '0'} INR, Accounts Sync: ${formData.accountsSyncStatus}`;
    } else if ((selectedPillar === 'vendor_mgt' || selectedPillar === 'Vendor Mgt & Payment Co-ordination') && (formData.slaVariancePct || formData.escrowStatus)) {
      extraDesc = ` | SLA Compliance Variance: ${formData.slaVariancePct || 'N/A'}%, Invoice Escrow Status: ${formData.escrowStatus}`;
    }

    // Force high-priority financial flag on pending Accounts Sync for Procurement
    const isProcurementPending = selectedPillar === 'procurement' && accountsSync === 'Pending';
    const finalEvaluationStatus = isProcurementPending ? 'Fail' : formData.evaluationStatus;
    const finalUrgency = isProcurementPending ? 'Critical' : (formData.evaluationStatus === 'Fail' ? 'Critical' : formData.evaluationStatus === 'Flag' ? 'High' : urgency);
    const finalPriorityScore = isProcurementPending ? 20 : score;
    const pettyCashVal = selectedPillar === 'procurement' ? (parseFloat(pettyCash) || 0) : undefined;
    const accountsSyncVal = selectedPillar === 'procurement' ? accountsSync : undefined;

    const newIssue = {
      id: `TKT-2026-0${issues.length + 1}`,
      pillar: selectedPillar,
      subScope: ['security', 'housekeeping'].includes(selectedPillar) ? subScope : undefined,
      reporter: formData.reporterRole.replace('_', ' '),
      description: formData.description || `Periodic inspection logged. Status: ${finalEvaluationStatus.toUpperCase()}${formData.telemetryValue ? ` | Value: ${formData.telemetryValue}${formData.telemetryUnit}` : ''}${extraDesc}${isProcurementPending ? ' [FINANCIAL AUDIT: ACCOUNTS PENDING]' : ''}`,
      urgency: finalUrgency,
      priorityScore: finalPriorityScore,
      status: finalEvaluationStatus === 'Pass' ? ('Resolved' as const) : ('Unassigned' as const),
      completionProgress: finalEvaluationStatus === 'Pass' ? 100 : finalEvaluationStatus === 'Flag' ? 40 : 10,
      evaluationStatus: finalEvaluationStatus,
      measurement: formData.telemetryValue ? {
        value: parseFloat(formData.telemetryValue) || formData.telemetryValue,
        unit: formData.telemetryUnit || ''
      } : undefined,
      pettyCash: pettyCashVal,
      accountsSync: accountsSyncVal,
      isFinancialFlag: isProcurementPending,
      assignedReviewer: REVIEWER_MAP[selectedPillar] || 'PSR Dhanwantri'
    };

    setIssues([newIssue, ...issues]);

    // Dispatch operational telemetry document block to MongoDB Datastore in real-time
    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pillar: newIssue.pillar,
        reviewer: newIssue.assignedReviewer,
        priorityScore: newIssue.priorityScore,
        telemetryData: {
          id: newIssue.id,
          reporter: newIssue.reporter,
          description: newIssue.description,
          subScope: newIssue.subScope,
          evaluationStatus: newIssue.evaluationStatus,
          measurement: newIssue.measurement,
          pettyCash: newIssue.pettyCash,
          accountsSync: newIssue.accountsSync,
          isFinancialFlag: newIssue.isFinancialFlag,
          telemetryFieldA: formData.telemetryFieldA,
          telemetryFieldB: formData.telemetryFieldB,
          productionLoad: formData.productionLoad,
          nonProductionLoad: formData.nonProductionLoad,
          pressurePsi: formData.pressurePsi,
          chlorinationPpm: formData.chlorinationPpm,
          sealantScore: formData.sealantScore,
          closingSpeedSec: formData.closingSpeedSec,
          ahuSupplyTempC: formData.ahuSupplyTempC,
          compressorPressurePsi: formData.compressorPressurePsi,
          vibrationAmplitudeMms: formData.vibrationAmplitudeMms,
          facadeScore: formData.facadeScore,
          drainageClearancePct: formData.drainageClearancePct,
          fleetReadinessPct: formData.fleetReadinessPct,
          parkingVacancyPct: formData.parkingVacancyPct,
          extinguisherCheckDays: formData.extinguisherCheckDays,
          drillCompliancePct: formData.drillCompliancePct,
          activeAmcPct: formData.activeAmcPct,
          sparePartsStockPct: formData.sparePartsStockPct,
          pettyCashInr: formData.pettyCashInr,
          slaVariancePct: formData.slaVariancePct,
          escrowStatus: formData.escrowStatus
        }
      })
    })
    .then(res => {
      if (res.ok) console.log('Successfully written operational log block to datastore');
      else console.error('Data connector returned failure response');
    })
    .catch(err => console.error('Data pipeline failure:', err));

    setFormData({ 
      reporterRole: 'Employee', 
      assetCriticality: '3', 
      severityStatus: '3', 
      description: '', 
      telemetryFieldA: '', 
      telemetryFieldB: '',
      evaluationStatus: 'Pass',
      telemetryValue: '',
      telemetryUnit: '',
      productionLoad: '',
      nonProductionLoad: '',
      pressurePsi: '',
      chlorinationPpm: '',
      sealantScore: '',
      closingSpeedSec: '',
      ahuSupplyTempC: '',
      compressorPressurePsi: '',
      vibrationAmplitudeMms: '',
      facadeScore: '',
      drainageClearancePct: '',
      fleetReadinessPct: '',
      parkingVacancyPct: '',
      extinguisherCheckDays: '',
      drillCompliancePct: '',
      activeAmcPct: '',
      sparePartsStockPct: '',
      pettyCashInr: '',
      accountsSyncStatus: 'Pending',
      slaVariancePct: '',
      escrowStatus: 'Pending'
    });
    setPettyCash('');
    setAccountsSync('Pending');
  };

  // Bulk Selection and Filter Logic Operations mapping the spreadsheet Index lists
  const filteredIssues = issues.filter(i => {
    const matchesSearch = i.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          i.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDesk = DESK_PILLARS[selectedDesk].includes(i.pillar);
    const matchesReviewer = approvalsFilter === 'all' || (i as any).assignedReviewer === activeUserSession;
    const matchesPillar = !selectedPillar || i.pillar === selectedPillar;
    return matchesSearch && matchesDesk && matchesReviewer && matchesPillar;
  });
  
  const toggleSelectAll = () => {
    if (filteredIssues.length > 0 && selectedIssueIds.length === filteredIssues.length) {
      setSelectedIssueIds([]);
    } else {
      setSelectedIssueIds(filteredIssues.map(i => i.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    if (selectedIssueIds.includes(id)) {
      setSelectedIssueIds(selectedIssueIds.filter(rowId => rowId !== id));
    } else {
      setSelectedIssueIds([...selectedIssueIds, id]);
    }
  };

  const handleDeleteSelected = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIssueIds.length} selected issues?`)) {
      setIssues(issues.filter(issue => !selectedIssueIds.includes(issue.id)));
      setSelectedIssueIds([]);
    }
  };

  const handleExportSelected = () => {
    const selectedData = issues.filter(issue => selectedIssueIds.includes(issue.id));
    console.log('Exporting data:', selectedData);
    alert(`Exporting ${selectedIssueIds.length} items to CSV... (Mock)`);
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    let newProgress = 0;
    if (newStatus === 'Resolved') newProgress = 100;
    else if (newStatus === 'In_Progress') newProgress = 60;
    else if (newStatus === 'Dispatched') newProgress = 30;
    else if (newStatus === 'Unassigned') newProgress = 0;

    setIssues(prevIssues => prevIssues.map(issue => {
      if (issue.id === id) {
        return {
          ...issue,
          status: newStatus as any,
          completionProgress: newProgress
        };
      }
      return issue;
    }));
  };

  // Enhanced Status Badge Renderer with High-Fidelity Glowing Indicators
  const renderStatusBadge = (status: string) => {
    const configs = {
      Resolved: { bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', dot: 'bg-emerald-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]' },
      In_Progress: { bg: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20', dot: 'bg-indigo-500 animate-pulse shadow-[0_0_12px_rgba(99,102,241,0.6)]' },
      Dispatched: { bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20', dot: 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]' },
      Unassigned: { bg: 'bg-[var(--text-secondary)]/10 text-[var(--text-secondary)] border-[var(--text-secondary)]/20', dot: 'bg-[var(--text-secondary)]/50' }
    };
    const current = configs[status as keyof typeof configs] || configs.Unassigned;

    return (
      <span className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest backdrop-blur-md",
        current.bg
      )}>
        <span className={cn("w-1.5 h-1.5 rounded-full", current.dot)} />
        {status.replace('_', ' ')}
      </span>
    );
  };

  // Interactive drop-down status switcher
  const renderStatusDropdown = (issue: any) => {
    const statusOptions = ['Unassigned', 'Dispatched', 'In_Progress', 'Resolved'];
    const configs = {
      Resolved: { label: 'Resolved', bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/15', dot: 'bg-emerald-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]' },
      In_Progress: { label: 'In Progress', bg: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20 hover:bg-indigo-500/15', dot: 'bg-indigo-500 animate-pulse shadow-[0_0_12px_rgba(99,102,241,0.6)]' },
      Dispatched: { label: 'Dispatched', bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/15', dot: 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]' },
      Unassigned: { label: 'Unassigned', bg: 'bg-[var(--text-secondary)]/10 text-[var(--text-secondary)] border-[var(--text-secondary)]/20 hover:bg-[var(--text-secondary)]/15', dot: 'bg-[var(--text-secondary)]/50' }
    };
    
    const isOpen = activeDropdownId === issue.id;
    const current = configs[issue.status as keyof typeof configs] || configs.Unassigned;

    return (
      <div 
        className="relative min-w-[130px]"
        onMouseLeave={() => {
          if (activeDropdownId === issue.id) {
            setActiveDropdownId(null);
          }
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveDropdownId(isOpen ? null : issue.id);
          }}
          className={cn(
            "inline-flex items-center justify-between gap-2 px-3 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-widest backdrop-blur-md transition-all active:scale-95 cursor-pointer w-full text-left",
            current.bg
          )}
        >
          <span className="flex items-center gap-2">
            <span className={cn("w-1.5 h-1.5 rounded-full", current.dot)} />
            {current.label}
          </span>
          <ChevronDown size={10} className={cn("opacity-40 transition-transform duration-300", isOpen ? "rotate-180" : "")} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 mt-2 w-44 rounded-2xl bg-[var(--panel-bg)]/95 border border-[var(--border-color)] shadow-2xl z-50 p-1.5 backdrop-blur-2xl flex flex-col gap-1 overflow-hidden"
              style={{ bottom: '100%' }}
            >
              {statusOptions.map((option) => {
                const isSelected = issue.status === option;
                const optConfig = configs[option as keyof typeof configs] || configs.Unassigned;
                return (
                  <button
                    key={option}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(issue.id, option);
                      setActiveDropdownId(null);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 text-left",
                      isSelected 
                        ? "bg-blue-600/15 text-blue-500 border border-blue-500/20" 
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-color)]/50 border border-transparent"
                    )}
                  >
                    <span className={cn("w-1.5 h-1.5 rounded-full", optConfig.dot)} />
                    {optConfig.label}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderUrgencyBadge = (urgency: string) => {
    const styles = {
      Low: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      Medium: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      High: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      Critical: 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.2)] pulsing-red-glow'
    };
    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest transition-all duration-300",
        styles[urgency as keyof typeof styles]
      )}>
        {urgency === 'Critical' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />}
        {urgency}
      </span>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-700 relative z-10 p-6 md:p-10 pb-20 bg-panel border-grid rounded-[2.5rem] shadow-2xl backdrop-blur-xl transition-colors duration-300">
      
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20 shadow-inner">
              <LayoutGrid size={22} className="text-blue-500" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-[var(--text-primary)] brightness-110 drop-shadow-[0_0_15px_rgba(59,130,246,0.2)] uppercase">
              Facility Management
            </h1>
          </div>
          <p className="text-[var(--text-secondary)] opacity-60 font-medium max-w-2xl text-base leading-relaxed">
            Enterprise-grade monitoring for infrastructure health, maintenance cycles, and network risk assessments.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Active Session Dropdown */}
          <div className="relative group/session flex items-center bg-[var(--bg-color)]/50 backdrop-blur-xl border border-[var(--border-color)] rounded-2xl py-1.5 px-4 pr-9 hover:border-blue-500/30 transition-all select-none">
            <div className="flex flex-col text-left">
              <span className="text-[7.5px] font-black uppercase text-[var(--text-secondary)] opacity-50 tracking-widest leading-none mb-1">Active Session</span>
              <select
                value={activeUserSession}
                onChange={(e) => {
                  setActiveUserSession(e.target.value);
                  setToast({
                    show: true,
                    title: 'Identity Swapped',
                    desc: `Simulated identity set to: ${e.target.value.toUpperCase()}`
                  });
                  setTimeout(() => setToast(null), 3000);
                }}
                className="bg-transparent text-[10px] font-black uppercase tracking-wider text-[var(--text-primary)] outline-none cursor-pointer appearance-none"
              >
                <option value="Field Employee" className="bg-[var(--panel-bg)] text-[var(--text-primary)]">Field Employee</option>
                <option value="PSR Dhanwantri" className="bg-[var(--panel-bg)] text-[var(--text-primary)]">PSR Dhanwantri</option>
                <option value="J Murali Krishna" className="bg-[var(--panel-bg)] text-[var(--text-primary)]">J Murali Krishna</option>
                <option value="Master Control" className="bg-[var(--panel-bg)] text-[var(--text-primary)]">Master Control</option>
              </select>
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)] opacity-40">
              <ChevronDown size={12} className="stroke-[3.5]" />
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowWorkOrderModal(true)}
            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2.5 transition-all shadow-[0_10px_20px_-5px_rgba(37,99,235,0.4)] cursor-pointer"
          >
            <Plus size={16} />
            Create Work Order
          </motion.button>
          <button 
            type="button"
            onClick={() => setShowReportModal(true)}
            className="px-5 py-3 rounded-2xl bg-[var(--panel-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2.5 transition-all backdrop-blur-xl cursor-pointer"
          >
            <Download size={16} />
            Generate Report
          </button>
        </div>
      </div>

      {/* Assigned Reviewer Desk Selector */}
      <div className="bg-[var(--panel-bg)]/60 backdrop-blur-xl p-5 rounded-3xl border border-[var(--border-color)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-primary)]">Assigned Reviewer Desk:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All Desks' },
            { id: 'dhanwantri', label: 'PSR Dhanwantri Desk' },
            { id: 'krishna', label: 'J Murali Krishna Desk' }
          ].map((desk) => {
            const active = selectedDesk === desk.id;
            return (
              <button
                key={desk.id}
                onClick={() => setSelectedDesk(desk.id as any)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 border",
                  active 
                    ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20" 
                    : "bg-[var(--bg-color)]/50 text-[var(--text-secondary)] border-[var(--border-color)] hover:text-[var(--text-primary)]"
                )}
              >
                {desk.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Telemetry Metric Cards Grid Dashboard Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { 
            label: 'Total Compliance', 
            value: '91.8%', 
            sub: 'Avg across 8 facilities', 
            icon: CheckCircle2, 
            color: 'text-emerald-500', 
            colorHex: '#10b981',
            badge: { text: 'Optimal', bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
            sparkData: [
              { value: 85 }, { value: 88 }, { value: 87 }, { value: 91 }, { value: 89 }, { value: 92 }, { value: 91.8 }
            ]
          },
          { 
            label: 'System Faults', 
            value: issues.length.toString(), 
            sub: `${issues.filter(i => i.urgency === 'Critical' || i.urgency === 'High').length} High priority`, 
            icon: AlertTriangle, 
            color: 'text-rose-500', 
            colorHex: '#f43f5e',
            badge: { text: 'Attention Needed', bg: 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.1)]' },
            sparkData: [
              { value: 6 }, { value: 5 }, { value: 4 }, { value: 5 }, { value: 4 }, { value: 3 }, { value: issues.length }
            ]
          },
          { 
            label: 'Audit Registry', 
            value: '24 / 24', 
            sub: 'All shift cycles cleared', 
            icon: Clock, 
            color: 'text-blue-500', 
            colorHex: '#3b82f6',
            badge: { text: 'Active Sync', bg: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
            sparkData: [
              { value: 24 }, { value: 24 }, { value: 24 }, { value: 24 }, { value: 24 }, { value: 24 }, { value: 24 }
            ]
          },
          selectedPillar === 'procurement' ? {
            label: 'Unreconciled Invoices',
            value: `${issues.filter(i => i.pillar === 'procurement' && i.accountsSync !== 'Reconciled').length} Invoices`,
            sub: `₹${issues.filter(i => i.pillar === 'procurement' && i.accountsSync !== 'Reconciled').reduce((sum, i) => sum + (i.pettyCash || 0), 0)} Mismatches`,
            icon: FileText,
            color: 'text-cyan-500',
            colorHex: '#06b6d4',
            badge: { text: 'Audit Pending', bg: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
            sparkData: [
              { value: 4 }, { value: 3 }, { value: 5 }, { value: 2 }, { value: 4 }, { value: 3 }, { value: issues.filter(i => i.pillar === 'procurement' && i.accountsSync !== 'Reconciled').length }
            ]
          } : { 
            label: 'SLA Rechecks', 
            value: '1', 
            sub: 'Procurement looping', 
            icon: FileText, 
            color: 'text-amber-500', 
            colorHex: '#f59e0b',
            badge: { text: 'In Review', bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
            sparkData: [
              { value: 3 }, { value: 2 }, { value: 4 }, { value: 2 }, { value: 3 }, { value: 1 }, { value: 1 }
            ]
          }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[var(--panel-bg)]/80 backdrop-blur-xl p-6 rounded-3xl border border-[var(--border-color)] shadow-sm hover:border-blue-500/30 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start text-[var(--text-secondary)] mb-2.5">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-50">{stat.label}</span>
                <span className={cn("text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border leading-none", stat.badge.bg)}>
                  {stat.badge.text}
                </span>
              </div>
              
              <div className="flex items-baseline justify-between">
                <h3 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">{stat.value}</h3>
                <stat.icon size={16} className={cn("transition-transform group-hover:scale-110", stat.color)} />
              </div>
              
              <p className="text-[10px] font-medium text-[var(--text-secondary)] opacity-40 mt-1 uppercase tracking-wider">{stat.sub}</p>
            </div>

            {/* Premium Sparkline */}
            <div className="h-10 w-full mt-4 overflow-hidden rounded-lg opacity-85 group-hover:opacity-100 transition-opacity">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stat.sparkData} margin={{ top: 2, bottom: 2, left: 2, right: 2 }}>
                  <defs>
                    <linearGradient id={`sparkGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={stat.colorHex} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={stat.colorHex} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke={stat.colorHex} 
                    strokeWidth={1.5} 
                    fill={`url(#sparkGrad-${i})`} 
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Critical Assets Under AMC Ribbon */}
      <div className="bg-[var(--panel-bg)]/80 backdrop-blur-xl rounded-3xl border border-[var(--border-color)] p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xs font-black tracking-[0.2em] text-[var(--text-primary)] uppercase flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-blue-500 animate-pulse" />
              Critical Assets Under AMC Contract Dashboard
            </h3>
            <p className="text-[10px] text-[var(--text-secondary)] opacity-50 uppercase tracking-widest mt-0.5">Real-time tracking of vendor agreements, SLA check cycles, and renewal count-downs.</p>
          </div>
          <span className="text-[9px] font-black bg-blue-500/10 text-blue-500 border border-blue-500/20 px-3 py-1 rounded-full uppercase tracking-widest">
            4 Active Vendor Pools
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { asset: 'AHU-3 Server Block Temp', vendor: 'Daishin HVAC Solutions', daysLeft: 182, progress: 82, status: 'stable', color: 'from-blue-500 to-indigo-500', text: 'STABLE AGREEMENT' },
            { asset: 'DB-Main Phase Imbalance', vendor: 'Tesla Electro-Grid Corp', daysLeft: 45, progress: 45, status: 'renewing', color: 'from-amber-500 to-orange-500', text: 'RENEWAL PROCESSING' },
            { asset: 'Elevator Lift A Motor Cable', vendor: 'Schindler Elevator Systems', daysLeft: 12, progress: 12, status: 'critical', color: 'from-rose-500 to-red-600', text: 'SLA EXPIRING IN 12D' },
            { asset: 'Plumbing Pump Inlet Valve', vendor: 'FlowTech Hydraulics Ltd', daysLeft: 320, progress: 95, status: 'active', color: 'from-emerald-500 to-teal-500', text: 'LONG TERM ACTIVE' }
          ].map((item, idx) => (
            <div key={idx} className="bg-[var(--bg-color)]/40 p-3.5 rounded-2xl border border-[var(--border-color)]/65 flex flex-col justify-between hover:border-blue-500/20 transition-all group">
              <div>
                <div className="flex justify-between items-start mb-1.5">
                  <span className="text-[10px] font-black text-[var(--text-primary)] truncate max-w-[150px]">{item.asset}</span>
                  <span className={cn(
                    "text-[8px] font-mono px-2 py-0.5 rounded-full font-black",
                    item.status === 'critical' ? 'bg-rose-500/15 text-rose-500 animate-pulse' :
                    item.status === 'renewing' ? 'bg-amber-500/15 text-amber-500' :
                    'bg-emerald-500/15 text-emerald-500'
                  )}>
                    {item.daysLeft}D LEFT
                  </span>
                </div>
                <span className="text-[8px] text-[var(--text-secondary)] opacity-50 uppercase tracking-wider block mb-2">{item.vendor}</span>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[8px] font-mono opacity-80">
                  <span className="text-[var(--text-secondary)]">{item.text}</span>
                  <span className="font-bold text-[var(--text-primary)]">{item.progress}%</span>
                </div>
                <div className="w-full bg-[var(--border-color)]/20 rounded-full h-[3px] overflow-hidden">
                  <div className={cn("h-full rounded-full bg-gradient-to-r", item.color)} style={{ width: `${item.progress}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preventative Maintenance & Restock Schedules Ribbon */}
      <div className="bg-[var(--panel-bg)]/80 backdrop-blur-xl rounded-3xl border border-[var(--border-color)] p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-black tracking-[0.2em] text-[var(--text-primary)] uppercase flex items-center gap-2">
              <CalendarClock size={16} className="text-blue-500 animate-pulse" />
              Preventative Maintenance & Restock Schedules
            </h3>
            <p className="text-[10px] text-[var(--text-secondary)] opacity-50 uppercase tracking-widest mt-0.5">
              Automated high-frequency replenishment cycles, critical inspections, and routine asset cleanings.
            </p>
          </div>
          <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-widest">
            {reminders.filter(r => r.status !== 'Completed').length} Pending Tasks
          </span>
        </div>

        <div className="overflow-x-auto flex gap-4 pb-2.5 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-700">
          {reminders.filter(r => r.status !== 'Completed').length === 0 ? (
            <div className="w-full text-center py-6 text-xs text-[var(--text-secondary)] opacity-60 font-mono uppercase tracking-widest">
              🎉 All preventative maintenance cycles cleared & restocked!
            </div>
          ) : (
            reminders.filter(r => r.status !== 'Completed').map((reminder) => {
              const pillarData = PILLARS[reminder.pillar as keyof typeof PILLARS];
              const PillarIcon = pillarData?.icon || Sparkles;

              return (
                <div
                  key={reminder.id}
                  className="bg-[var(--panel-bg)]/80 border border-[var(--border-color)] shadow-sm rounded-xl min-w-[280px] p-4 flex flex-col justify-between hover:shadow-md transition-all group"
                >
                  <div>
                    {/* Top Row: Icon + Frequency badge */}
                    <div className="flex justify-between items-start mb-2.5">
                      <div className={cn("p-2 rounded-lg border", pillarData?.bg, pillarData?.color, pillarData?.border)}>
                        <PillarIcon size={14} />
                      </div>
                      <span className="text-[8px] font-mono font-black uppercase tracking-wider bg-[var(--bg-color)] text-[var(--text-secondary)] px-2 py-0.5 rounded-md border border-[var(--border-color)]/50">
                        CYCLE: {reminder.frequency.toUpperCase()}
                      </span>
                    </div>

                    {/* Title & Stats */}
                    <h4 className="text-[11px] font-black text-[var(--text-primary)] line-clamp-1 group-hover:text-blue-500 transition-colors uppercase tracking-tight" title={reminder.title}>
                      {reminder.title}
                    </h4>
                    <p className="text-[9px] text-[var(--text-secondary)] opacity-60 uppercase tracking-wider mt-0.5">
                      Pillar: <span className="font-bold">{pillarData?.label.split(' & ')[0]}</span>
                    </p>

                    {/* Due Date Indicator */}
                    <div className="flex items-center gap-1.5 mt-3 px-2 py-1 rounded-lg bg-[var(--bg-color)]/60 text-[9px] font-mono text-[var(--text-secondary)] border border-[var(--border-color)]/30 w-fit">
                      <Clock size={10} className="text-amber-500 animate-pulse" />
                      <span>Due: <span className="font-bold text-[var(--text-primary)]">{reminder.dueDate}</span></span>
                    </div>
                  </div>

                  {/* Micro Action Buttons */}
                  <div className="flex items-center gap-2 mt-4 pt-3.5 border-t border-[var(--border-color)]/40">
                    <button
                      type="button"
                      onClick={() => handleSnoozeReminder(reminder.id, reminder.title)}
                      className="flex-1 py-1 px-2 text-center text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-color)]/50 rounded-lg transition-all cursor-pointer active:scale-95"
                    >
                      Snooze
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMarkCompletedReminder(reminder.id, reminder.title)}
                      className="flex-[1.5] py-1 px-3 bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer active:scale-95 shadow-sm shadow-emerald-500/10 hover:shadow-emerald-500/20 text-center flex items-center justify-center gap-1"
                    >
                      <Check size={9} className="stroke-[3]" />
                      Mark Completed
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 13-Point Operational Index Category Sub-Navigation Ribbon */}
      <div className="bg-[var(--panel-bg)]/60 backdrop-blur-xl p-4.5 rounded-[2rem] border border-[var(--border-color)]">
        <div className="flex items-center justify-between mb-2 px-1 select-none">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-primary)]">
              Operational Category Filters
            </span>
          </div>
          <span className="text-[8.5px] font-mono text-[var(--text-secondary)] opacity-50 uppercase tracking-wider">
            {selectedPillar ? `Filtering: ${PILLARS[selectedPillar as keyof typeof PILLARS]?.label}` : "All Categories Active"}
          </span>
        </div>

        <div className="overflow-x-auto flex gap-2 pb-2 mr-[-4px] scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 custom-scrollbar select-none">
          <button
            onClick={() => handlePillarChange('')}
            className={cn(
              "px-4.5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 border flex items-center gap-2 flex-shrink-0 cursor-pointer",
              !selectedPillar
                ? "bg-[var(--text-primary)] text-[var(--bg-color)] border-[var(--text-primary)] shadow-lg"
                : "bg-[var(--bg-color)]/30 text-[var(--text-secondary)] border-[var(--border-color)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-color)]/50"
            )}
          >
            <LayoutGrid size={13} />
            Show All
          </button>

          {Object.entries(PILLARS).map(([key, item]) => {
            const isActive = selectedPillar === key;
            const Icon = item.icon;
            
            // Dynamic theme maps for colors specified in requirements
            const activeStyle = key === 'housekeeping' ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-500/20' :
              key === 'security' ? 'bg-blue-500 border-blue-500 text-white shadow-blue-500/20' :
              key === 'electrical' ? 'bg-amber-500 border-amber-500 text-white shadow-amber-500/20' :
              key === 'plumbing' ? 'bg-sky-500 border-sky-500 text-white shadow-sky-500/20' :
              key === 'windows_doors' ? 'bg-teal-500 border-teal-500 text-white shadow-teal-500/20' :
              key === 'hvac' ? 'bg-purple-500 border-purple-500 text-white shadow-purple-500/20' :
              key === 'structural' ? 'bg-rose-500 border-rose-500 text-white shadow-rose-500/20' :
              key === 'logistics' ? 'bg-indigo-500 border-indigo-500 text-white shadow-indigo-500/20' :
              key === 'security_systems' ? 'bg-red-500 border-red-500 text-white shadow-red-500/20' :
              key === 'asset_mgt' ? 'bg-violet-500 border-violet-500 text-white shadow-violet-500/20' :
              key === 'procurement' ? 'bg-cyan-500 border-cyan-500 text-white shadow-cyan-500/20' :
              key === 'vendor_mgt' ? 'bg-pink-500 border-pink-500 text-white shadow-pink-500/20' :
              'bg-orange-500 border-orange-500 text-white shadow-orange-500/20'; // general_maint

            return (
              <button
                key={key}
                onClick={() => handlePillarChange(key)}
                className={cn(
                  "px-4.5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 border flex items-center gap-2 flex-shrink-0 cursor-pointer shadow-sm",
                  isActive
                    ? `${activeStyle} font-black hover:brightness-105 border-transparent`
                    : "bg-[var(--bg-color)]/30 text-[var(--text-secondary)] border-[var(--border-color)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-color)]/50"
                )}
              >
                <Icon size={13} className={cn("transition-transform duration-300", isActive ? "scale-110" : item.color)} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Structural Twin Columns Split Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Log Entry Form */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          <div className="bg-[var(--panel-bg)]/80 backdrop-blur-xl rounded-[2rem] border border-[var(--border-color)] shadow-sm p-8 h-fit">
            <div className="border-b border-[var(--border-color)] pb-5 mb-6">
              <h3 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-3">
                <Plus size={20} className="text-blue-500" /> 
                ANOMALY TELEMETRY
              </h3>
              <p className="text-xs font-medium text-[var(--text-secondary)] opacity-60 mt-1 uppercase tracking-wider">Submit runtime values for assessment.</p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2.5 opacity-50">Operational Pillar</label>
                <select 
                  value={selectedPillar} 
                  onChange={(e) => handlePillarChange(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-2xl font-bold text-sm outline-none focus:border-blue-500/40 text-[var(--text-primary)] transition-all"
                >
                  {Object.entries(PILLARS).map(([key, item]) => (
                    <option key={key} value={key}>{item.label}</option>
                  ))}
                </select>
              </div>

              {['security', 'housekeeping'].includes(selectedPillar) && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2.5 opacity-50">Specific Scope of Work</label>
                  <select
                    value={subScope}
                    onChange={(e) => setSubScope(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-2xl font-bold text-sm outline-none focus:border-blue-500/40 text-[var(--text-primary)] transition-all cursor-pointer"
                  >
                    {selectedPillar === 'security' ? (
                      <>
                        <option value="Security Conduct">Security Conduct</option>
                        <option value="Securing the Premise">Securing the Premise</option>
                        <option value="Patrolling the Property">Patrolling the Property</option>
                      </>
                    ) : (
                      <>
                        <option value="Workspaces">Workspaces</option>
                        <option value="Washrooms">Washrooms</option>
                        <option value="Common Areas">Common Areas</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              <div className="p-5 bg-[var(--bg-color)]/50 rounded-2xl border border-[var(--border-color)] space-y-4">
                <span className="text-[9px] font-black text-blue-500/60 tracking-[0.3em] uppercase block mb-1">Pillar Specific Fields</span>
                
                {selectedPillar === 'housekeeping' && (
                  <>
                    <input type="text" placeholder="Stock Level % (e.g. 45)" className="w-full px-4 py-3 text-sm bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500/40" value={formData.telemetryFieldA} onChange={e=>setFormData({...formData, telemetryFieldA: e.target.value})} required/>
                    <input type="text" placeholder="Supervisor Employee ID" className="w-full px-4 py-3 text-sm bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500/40" value={formData.telemetryFieldB} onChange={e=>setFormData({...formData, telemetryFieldB: e.target.value})} required/>
                  </>
                )}
                {selectedPillar === 'security' && (
                  <>
                    <input type="number" placeholder="Visitor Variance Delta" className="w-full px-4 py-3 text-sm bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500/40" value={formData.telemetryFieldA} onChange={e=>setFormData({...formData, telemetryFieldA: e.target.value})} required/>
                    <input type="text" placeholder="CCTV Uptime %" className="w-full px-4 py-3 text-sm bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500/40" value={formData.telemetryFieldB} onChange={e=>setFormData({...formData, telemetryFieldB: e.target.value})} required/>
                  </>
                )}
                {selectedPillar === 'electrical' && (
                  <>
                    <input type="text" placeholder="Thermal Scan Temp (°C)" className="w-full px-4 py-3 text-sm bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500/40" value={formData.telemetryFieldA} onChange={e=>setFormData({...formData, telemetryFieldA: e.target.value})} required/>
                    <input type="text" placeholder="Emergency Switchover (sec)" className="w-full px-4 py-3 text-sm bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500/40" value={formData.telemetryFieldB} onChange={e=>setFormData({...formData, telemetryFieldB: e.target.value})} required/>
                  </>
                )}
                {selectedPillar === 'procurement' && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-[8.5px] font-black text-[var(--text-secondary)] uppercase tracking-wider opacity-60">Vendor SLA Target %</label>
                      <input type="text" placeholder="e.g. 95%" className="w-full px-4 py-3 text-sm bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500/40" value={formData.telemetryFieldA} onChange={e=>setFormData({...formData, telemetryFieldA: e.target.value})} required/>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[8.5px] font-black text-[var(--text-secondary)] uppercase tracking-wider opacity-60">Purchase Order / Contract Ref ID</label>
                      <input type="text" placeholder="e.g. PO-2026-X812" className="w-full px-4 py-3 text-sm bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500/40" value={formData.telemetryFieldB} onChange={e=>setFormData({...formData, telemetryFieldB: e.target.value})} required/>
                    </div>
                    <div className="pt-3.5 border-t border-[var(--border-color)]/30 space-y-3.5">
                      <span className="text-[10px] font-black text-cyan-500 tracking-[0.2em] uppercase block mb-1">Financial Sync Integration</span>
                      <div>
                        <label className="block text-[9.5px] font-black text-[var(--text-secondary)] uppercase tracking-[0.1em] mb-1.5 opacity-60">Petty Cash Utilized (INR)</label>
                        <input
                          type="number"
                          step="any"
                          required
                          placeholder="e.g. 1500"
                          className="w-full px-4 py-3 text-sm bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500/40 font-mono text-[var(--text-primary)]"
                          value={pettyCash}
                          onChange={(e) => setPettyCash(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[9.5px] font-black text-[var(--text-secondary)] uppercase tracking-[0.1em] mb-1.5 opacity-60">Accounts Dept. Sync Status</label>
                        <select
                          value={accountsSync}
                          onChange={(e) => setAccountsSync(e.target.value)}
                          className="w-full px-4 py-3 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-2xl font-bold text-sm outline-none focus:border-blue-500/40 text-[var(--text-primary)] transition-all cursor-pointer"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Invoice Uploaded">Invoice Uploaded</option>
                          <option value="Reconciled">Reconciled</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}
                {!['housekeeping', 'security', 'electrical', 'procurement'].includes(selectedPillar) && (
                  <>
                    <input type="text" placeholder="Primary Metric Value" className="w-full px-4 py-3 text-sm bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500/40" value={formData.telemetryFieldA} onChange={e=>setFormData({...formData, telemetryFieldA: e.target.value})} required/>
                    <input type="text" placeholder="Audit Validation ID" className="w-full px-4 py-3 text-sm bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500/40" value={formData.telemetryFieldB} onChange={e=>setFormData({...formData, telemetryFieldB: e.target.value})} required/>
                  </>
                )}
              </div>

              {selectedPillar === 'electrical' && (
                /* Energy Audit Micro-Module */
                <div className="p-4 bg-[var(--bg-color)]/50 rounded-xl border border-[var(--border-color)] space-y-3 mt-3 animate-tab-enter">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={14} className="text-amber-500" />
                    <h4 className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-wider">Meter Readings: Load Profiling</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Production Hours Load (kWh)</label>
                      <input
                        type="number"
                        placeholder="e.g. 1450"
                        className="w-full px-3 py-2 text-xs bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg outline-none focus:ring-2 focus:ring-amber-500/20"
                        value={formData.productionLoad}
                        onChange={e => setFormData({...formData, productionLoad: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Non-Production Hours Load (kWh)</label>
                      <input
                        type="number"
                        placeholder="e.g. 420"
                        className="w-full px-3 py-2 text-xs bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg outline-none focus:ring-2 focus:ring-amber-500/20"
                        value={formData.nonProductionLoad}
                        onChange={e => setFormData({...formData, nonProductionLoad: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Dynamic Variance Calculation Indicator */}
                  {formData.productionLoad && formData.nonProductionLoad && (
                    <div className="pt-2 border-t border-[var(--border-color)]/60 mt-2">
                      <p className="text-[10px] font-mono font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                        <Zap size={10} className="text-amber-500" />
                        Off-peak variance: 
                        <span className={
                          Number(formData.nonProductionLoad) > Number(formData.productionLoad) * 0.5 
                            ? 'text-rose-500' // Bad: Off-peak is more than 50% of production
                            : 'text-emerald-500' // Good: Off-peak is low
                        }>
                          {Math.round(((Number(formData.productionLoad) - Number(formData.nonProductionLoad)) / Number(formData.productionLoad)) * 100)}%
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {selectedPillar === 'plumbing' && (
                /* Plumbing Telemetry Micro-Module */
                <div className="p-4 bg-[var(--bg-color)]/50 rounded-xl border border-[var(--border-color)] space-y-3 mt-3 animate-tab-enter">
                  <div className="flex items-center gap-2 mb-1">
                    <Droplet size={14} className="text-sky-500" />
                    <h4 className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-wider">Plumbing System Telemetry</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Main Line Pressure Card */}
                    <div className="bg-[var(--panel-bg)] rounded-xl p-3 border border-[var(--border-color)]/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                      <div className="absolute -right-2 -top-2 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none"><Activity size={64} /></div>
                      <div className="flex justify-between items-start mb-3 relative z-10">
                        <label className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider leading-tight w-20">Main Line<br/>Pressure</label>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border tracking-wider ${
                          Number(formData.pressurePsi) >= 40 && Number(formData.pressurePsi) <= 80 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : (formData.pressurePsi === '' ? 'bg-[var(--bg-color)] text-[var(--text-secondary)] border-[var(--border-color)]' : 'bg-rose-500/10 text-rose-500 border-rose-500/20')
                        }`}>
                          {formData.pressurePsi === '' ? 'Awaiting' : (Number(formData.pressurePsi) >= 40 && Number(formData.pressurePsi) <= 80 ? 'Optimal' : 'Warning')}
                        </span>
                      </div>
                      <div className="flex items-end gap-1.5 relative z-10">
                        <input
                          type="number"
                          placeholder="68"
                          className="w-16 px-2 py-1 text-lg font-mono font-black text-[var(--text-primary)] bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg outline-none focus:ring-2 focus:ring-sky-500/20 transition-all placeholder:text-[var(--text-secondary)]/50 text-left"
                          value={formData.pressurePsi || ''}
                          onChange={e => setFormData({...formData, pressurePsi: e.target.value})}
                        />
                        <span className="text-[11px] font-bold text-[var(--text-secondary)] mb-1.5">psi</span>
                      </div>
                    </div>

                    {/* Chlorination Level Card */}
                    <div className="bg-[var(--panel-bg)] rounded-xl p-3 border border-[var(--border-color)]/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                      <div className="absolute -right-2 -top-2 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none"><Droplet size={64} /></div>
                      <div className="flex justify-between items-start mb-3 relative z-10">
                        <label className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider leading-tight w-20">Chlorination<br/>Level</label>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border tracking-wider ${
                          Number(formData.chlorinationPpm) >= 1.0 && Number(formData.chlorinationPpm) <= 4.0 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : (formData.chlorinationPpm === '' ? 'bg-[var(--bg-color)] text-[var(--text-secondary)] border-[var(--border-color)]' : 'bg-amber-500/10 text-amber-500 border-amber-500/20')
                        }`}>
                          {formData.chlorinationPpm === '' ? 'Awaiting' : (Number(formData.chlorinationPpm) >= 1.0 && Number(formData.chlorinationPpm) <= 4.0 ? 'Safe' : 'Check')}
                        </span>
                      </div>
                      <div className="flex items-end gap-1.5 relative z-10">
                        <input
                          type="number"
                          step="0.1"
                          placeholder="2.4"
                          className="w-16 px-2 py-1 text-lg font-mono font-black text-[var(--text-primary)] bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg outline-none focus:ring-2 focus:ring-sky-500/20 transition-all placeholder:text-[var(--text-secondary)]/50 text-left"
                          value={formData.chlorinationPpm || ''}
                          onChange={e => setFormData({...formData, chlorinationPpm: e.target.value})}
                        />
                        <span className="text-[11px] font-bold text-[var(--text-secondary)] mb-1.5">ppm</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedPillar === 'windows_doors' && (
                /* Windows & Doors Telemetry Micro-Module */
                <div className="p-4 bg-[var(--bg-color)]/50 rounded-xl border border-[var(--border-color)] space-y-3 mt-3 animate-tab-enter">
                  <div className="flex items-center gap-2 mb-1">
                    <DoorOpen size={14} className="text-teal-500" />
                    <h4 className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-wider">Windows & Doors Telemetry</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Sealant Integrity Card */}
                    <div className="bg-[var(--panel-bg)] rounded-xl p-3 border border-[var(--border-color)]/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                      <div className="absolute -right-2 -top-2 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none"><Shield size={64} /></div>
                      <div className="flex justify-between items-start mb-3 relative z-10">
                        <label className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider leading-tight w-20">Sealant<br/>Integrity</label>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border tracking-wider ${
                          Number(formData.sealantScore) >= 4 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : (formData.sealantScore === '' ? 'bg-[var(--bg-color)] text-[var(--text-secondary)] border-[var(--border-color)]' : 'bg-amber-500/10 text-amber-500 border-amber-500/20')
                        }`}>
                          {formData.sealantScore === '' ? 'Awaiting' : (Number(formData.sealantScore) >= 4 ? 'Optimal' : 'Warning')}
                        </span>
                      </div>
                      <div className="flex items-end gap-1.5 relative z-10">
                        <input
                          type="number"
                          min="1"
                          max="5"
                          placeholder="4"
                          className="w-16 px-2 py-1 text-lg font-mono font-black text-[var(--text-primary)] bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg outline-none focus:ring-2 focus:ring-teal-500/20 transition-all placeholder:text-[var(--text-secondary)]/50"
                          value={formData.sealantScore}
                          onChange={e => setFormData({...formData, sealantScore: e.target.value})}
                        />
                        <span className="text-[11px] font-bold text-[var(--text-secondary)] mb-1.5">/ 5</span>
                      </div>
                    </div>

                    {/* Mechanical Closing Speed Card */}
                    <div className="bg-[var(--panel-bg)] rounded-xl p-3 border border-[var(--border-color)]/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                      <div className="absolute -right-2 -top-2 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none"><DoorOpen size={64} /></div>
                      <div className="flex justify-between items-start mb-3 relative z-10">
                        <label className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider leading-tight w-20">Mechanical<br/>Closing Speed</label>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border tracking-wider ${
                          Number(formData.closingSpeedSec) >= 3.0 && Number(formData.closingSpeedSec) <= 5.0 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : (formData.closingSpeedSec === '' ? 'bg-[var(--bg-color)] text-[var(--text-secondary)] border-[var(--border-color)]' : 'bg-amber-500/10 text-amber-500 border-amber-500/20')
                        }`}>
                          {formData.closingSpeedSec === '' ? 'Awaiting' : (Number(formData.closingSpeedSec) >= 3.0 && Number(formData.closingSpeedSec) <= 5.0 ? 'Optimal' : 'Check')}
                        </span>
                      </div>
                      <div className="flex items-end gap-1.5 relative z-10">
                        <input
                          type="number"
                          step="0.1"
                          placeholder="3.5"
                          className="w-16 px-2 py-1 text-lg font-mono font-black text-[var(--text-primary)] bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg outline-none focus:ring-2 focus:ring-teal-500/20 transition-all placeholder:text-[var(--text-secondary)]/50"
                          value={formData.closingSpeedSec}
                          onChange={e => setFormData({...formData, closingSpeedSec: e.target.value})}
                        />
                        <span className="text-[11px] font-bold text-[var(--text-secondary)] mb-1.5">sec</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(selectedPillar === 'hvac' || selectedPillar === 'HVAC & Elevators') && (
                /* HVAC & Elevators Telemetry Micro-Module */
                <div className="p-4 bg-[var(--bg-color)]/50 rounded-xl border border-[var(--border-color)] space-y-3 mt-3 animate-tab-enter">
                  <div className="flex items-center gap-2 mb-1">
                    <Wind size={14} className="text-purple-500" />
                    <h4 className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-wider">HVAC & Elevators Telemetry</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    
                    {/* AHU Supply Temp Card */}
                    <div className="bg-[var(--panel-bg)] rounded-xl p-3 border border-[var(--border-color)]/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                      <div className="absolute -right-2 -top-2 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none"><Thermometer size={60} /></div>
                      <div className="flex justify-between items-start mb-3 relative z-10">
                        <label className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider leading-tight w-20">AHU Supply<br/>Temp</label>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border tracking-wider ${
                          Number(formData.ahuSupplyTempC) >= 16 && Number(formData.ahuSupplyTempC) <= 24 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : (formData.ahuSupplyTempC === '' ? 'bg-[var(--bg-color)] text-[var(--text-secondary)] border-[var(--border-color)]' : 'bg-rose-500/10 text-rose-500 border-rose-500/20')
                        }`}>
                          {formData.ahuSupplyTempC === '' ? 'Awaiting' : (Number(formData.ahuSupplyTempC) >= 16 && Number(formData.ahuSupplyTempC) <= 24 ? 'Optimal' : 'Warning')}
                        </span>
                      </div>
                      <div className="flex items-end gap-1.5 relative z-10">
                        <input
                          type="number"
                          step="0.1"
                          placeholder="18.5"
                          className="w-14 px-2 py-1 text-lg font-mono font-black text-[var(--text-primary)] bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg outline-none focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-[var(--text-secondary)]/50"
                          value={formData.ahuSupplyTempC}
                          onChange={e => setFormData({...formData, ahuSupplyTempC: e.target.value})}
                        />
                        <span className="text-[11px] font-bold text-[var(--text-secondary)] mb-1.5">°C</span>
                      </div>
                    </div>

                    {/* Compressor Pressure Card */}
                    <div className="bg-[var(--panel-bg)] rounded-xl p-3 border border-[var(--border-color)]/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                      <div className="absolute -right-2 -top-2 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none"><Gauge size={60} /></div>
                      <div className="flex justify-between items-start mb-3 relative z-10">
                        <label className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider leading-tight w-20">Compressor<br/>Pressure</label>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border tracking-wider ${
                          Number(formData.compressorPressurePsi) >= 80 && Number(formData.compressorPressurePsi) <= 130 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : (formData.compressorPressurePsi === '' ? 'bg-[var(--bg-color)] text-[var(--text-secondary)] border-[var(--border-color)]' : 'bg-rose-500/10 text-rose-500 border-rose-500/20')
                        }`}>
                          {formData.compressorPressurePsi === '' ? 'Awaiting' : (Number(formData.compressorPressurePsi) >= 80 && Number(formData.compressorPressurePsi) <= 130 ? 'Safe' : 'Warning')}
                        </span>
                      </div>
                      <div className="flex items-end gap-1.5 relative z-10">
                        <input
                          type="number"
                          placeholder="110"
                          className="w-16 px-2 py-1 text-lg font-mono font-black text-[var(--text-primary)] bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg outline-none focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-[var(--text-secondary)]/50"
                          value={formData.compressorPressurePsi}
                          onChange={e => setFormData({...formData, compressorPressurePsi: e.target.value})}
                        />
                        <span className="text-[11px] font-bold text-[var(--text-secondary)] mb-1.5">psi</span>
                      </div>
                    </div>

                    {/* Vibration Amplitude Card */}
                    <div className="bg-[var(--panel-bg)] rounded-xl p-3 border border-[var(--border-color)]/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                      <div className="absolute -right-2 -top-2 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none"><Waves size={60} /></div>
                      <div className="flex justify-between items-start mb-3 relative z-10">
                        <label className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider leading-tight w-20">Vibration<br/>Amplitude</label>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border tracking-wider ${
                          Number(formData.vibrationAmplitudeMms) < 2.0 && formData.vibrationAmplitudeMms !== ''
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : (Number(formData.vibrationAmplitudeMms) >= 2.0 && Number(formData.vibrationAmplitudeMms) <= 4.5
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                : (formData.vibrationAmplitudeMms === '' ? 'bg-[var(--bg-color)] text-[var(--text-secondary)] border-[var(--border-color)]' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'))
                        }`}>
                          {formData.vibrationAmplitudeMms === '' ? 'Awaiting' : (Number(formData.vibrationAmplitudeMms) < 2.0 ? 'Optimal' : (Number(formData.vibrationAmplitudeMms) <= 4.5 ? 'Check' : 'Danger'))}
                        </span>
                      </div>
                      <div className="flex items-end gap-1.5 relative z-10">
                        <input
                          type="number"
                          step="0.1"
                          placeholder="2.4"
                          className="w-14 px-2 py-1 text-lg font-mono font-black text-[var(--text-primary)] bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg outline-none focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-[var(--text-secondary)]/50"
                          value={formData.vibrationAmplitudeMms}
                          onChange={e => setFormData({...formData, vibrationAmplitudeMms: e.target.value})}
                        />
                        <span className="text-[11px] font-bold text-[var(--text-secondary)] mb-1.5">mm/s</span>
                      </div>
                    </div>
                    
                  </div>
                </div>
              )}

              {(selectedPillar === 'structural' || selectedPillar === 'Building Exterior') && (
                /* Building Exterior Telemetry Micro-Module */
                <div className="p-4 bg-[var(--bg-color)]/50 rounded-xl border border-[var(--border-color)] space-y-3 mt-3 animate-tab-enter">
                  <div className="flex items-center gap-2 mb-1">
                    <Building size={14} className="text-stone-500" />
                    <h4 className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-wider">Exterior Telemetry</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Facade Integrity Card */}
                    <div className="bg-[var(--panel-bg)] rounded-xl p-3 border border-[var(--border-color)]/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                      <div className="absolute -right-2 -top-2 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none"><Building size={64} /></div>
                      <div className="flex justify-between items-start mb-3 relative z-10">
                        <label className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider leading-tight w-20">Facade<br/>Integrity</label>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border tracking-wider ${
                          Number(formData.facadeScore) >= 4 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : (formData.facadeScore === '' ? 'bg-[var(--bg-color)] text-[var(--text-secondary)] border-[var(--border-color)]' : 'bg-amber-500/10 text-amber-500 border-amber-500/20')
                        }`}>
                          {formData.facadeScore === '' ? 'Awaiting' : (Number(formData.facadeScore) >= 4 ? 'Optimal' : 'Warning')}
                        </span>
                      </div>
                      <div className="flex items-end gap-1.5 relative z-10">
                        <input
                          type="number"
                          min="1"
                          max="5"
                          placeholder="4"
                          className="w-16 px-2 py-1 text-lg font-mono font-black text-[var(--text-primary)] bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg outline-none focus:ring-2 focus:ring-stone-500/20 transition-all placeholder:text-[var(--text-secondary)]/50"
                          value={formData.facadeScore}
                          onChange={e => setFormData({...formData, facadeScore: e.target.value})}
                        />
                        <span className="text-[11px] font-bold text-[var(--text-secondary)] mb-1.5">/ 5</span>
                      </div>
                    </div>

                    {/* Drainage Clearance Card */}
                    <div className="bg-[var(--panel-bg)] rounded-xl p-3 border border-[var(--border-color)]/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                      <div className="absolute -right-2 -top-2 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none"><CloudRain size={64} /></div>
                      <div className="flex justify-between items-start mb-3 relative z-10">
                        <label className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider leading-tight w-20">Drainage<br/>Clearance</label>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border tracking-wider ${
                          Number(formData.drainageClearancePct) >= 90 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : (formData.drainageClearancePct === '' ? 'bg-[var(--bg-color)] text-[var(--text-secondary)] border-[var(--border-color)]' : 'bg-rose-500/10 text-rose-500 border-rose-500/20')
                        }`}>
                          {formData.drainageClearancePct === '' ? 'Awaiting' : (Number(formData.drainageClearancePct) >= 90 ? 'Clear' : 'Check')}
                        </span>
                      </div>
                      <div className="flex items-end gap-1.5 relative z-10">
                        <input
                          type="number"
                          placeholder="95"
                          className="w-16 px-2 py-1 text-lg font-mono font-black text-[var(--text-primary)] bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg outline-none focus:ring-2 focus:ring-stone-500/20 transition-all placeholder:text-[var(--text-secondary)]/50"
                          value={formData.drainageClearancePct}
                          onChange={e => setFormData({...formData, drainageClearancePct: e.target.value})}
                        />
                        <span className="text-[11px] font-bold text-[var(--text-secondary)] mb-1.5">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Transport & Parking Telemetry Micro-Module */}
              {(selectedPillar === 'logistics' || selectedPillar === 'Transportation & Parking Lots') && (
                <div className="p-4 bg-[var(--bg-color)]/50 rounded-xl border border-[var(--border-color)] space-y-3 mt-3 animate-tab-enter">
                  <div className="flex items-center gap-2 mb-1">
                    <Truck size={14} className="text-indigo-500" />
                    <h4 className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-wider">Transport & Parking Telemetry</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Fleet Readiness Card */}
                    <div className="bg-[var(--panel-bg)] rounded-xl p-3 border border-[var(--border-color)]/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                      <div className="absolute -right-2 -top-2 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none"><Truck size={64} /></div>
                      <div className="flex justify-between items-start mb-3 relative z-10">
                        <label className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider leading-tight w-20">Fleet<br/>Readiness</label>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border tracking-wider ${
                          Number(formData.fleetReadinessPct) >= 90 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : (formData.fleetReadinessPct === '' ? 'bg-[var(--bg-color)] text-[var(--text-secondary)] border-[var(--border-color)]' : 'bg-amber-500/10 text-amber-500 border-amber-500/20')
                        }`}>
                          {formData.fleetReadinessPct === '' ? 'Awaiting' : (Number(formData.fleetReadinessPct) >= 90 ? 'Optimal' : 'Warning')}
                        </span>
                      </div>
                      <div className="flex items-end gap-1.5 relative z-10">
                        <input
                          type="number"
                          placeholder="100"
                          className="w-16 px-2 py-1 text-lg font-mono font-black text-[var(--text-primary)] bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-[var(--text-secondary)]/50"
                          value={formData.fleetReadinessPct}
                          onChange={e => setFormData({...formData, fleetReadinessPct: e.target.value})}
                        />
                        <span className="text-[11px] font-bold text-[var(--text-secondary)] mb-1.5">%</span>
                      </div>
                    </div>

                    {/* Parking Vacancy Card */}
                    <div className="bg-[var(--panel-bg)] rounded-xl p-3 border border-[var(--border-color)]/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                      <div className="absolute -right-2 -top-2 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none"><CarFront size={64} /></div>
                      <div className="flex justify-between items-start mb-3 relative z-10">
                        <label className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider leading-tight w-20">Parking<br/>Vacancy</label>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border tracking-wider ${
                          Number(formData.parkingVacancyPct) >= 15 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : (formData.parkingVacancyPct === '' ? 'bg-[var(--bg-color)] text-[var(--text-secondary)] border-[var(--border-color)]' : 'bg-rose-500/10 text-rose-500 border-rose-500/20')
                        }`}>
                          {formData.parkingVacancyPct === '' ? 'Awaiting' : (Number(formData.parkingVacancyPct) >= 15 ? 'Clear' : 'Full')}
                        </span>
                      </div>
                      <div className="flex items-end gap-1.5 relative z-10">
                        <input
                          type="number"
                          placeholder="42"
                          className="w-16 px-2 py-1 text-lg font-mono font-black text-[var(--text-primary)] bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-[var(--text-secondary)]/50"
                          value={formData.parkingVacancyPct}
                          onChange={e => setFormData({...formData, parkingVacancyPct: e.target.value})}
                        />
                        <span className="text-[11px] font-bold text-[var(--text-secondary)] mb-1.5">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Fire Safety & Emergency Preparedness Micro-Module */}
              {(selectedPillar === 'security_systems' || selectedPillar === 'Security Systems & Safety Requirements') && (
                <div className="p-4 bg-[var(--bg-color)]/50 rounded-xl border border-[var(--border-color)] space-y-3 mt-3 animate-tab-enter">
                  <div className="flex items-center gap-2 mb-1">
                    <Flame size={14} className="text-rose-500" />
                    <h4 className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-wider">Fire Safety & Emergency Preparedness</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Fire Extinguisher Status Card */}
                    <div className="bg-[var(--panel-bg)] rounded-xl p-3 border border-[var(--border-color)]/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                      <div className="absolute -right-2 -top-2 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none"><Flame size={64} /></div>
                      <div className="flex justify-between items-start mb-3 relative z-10">
                        <label className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider leading-tight w-20">Fire Extinguisher<br/>Status</label>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border tracking-wider ${
                          Number(formData.extinguisherCheckDays) <= 30 && formData.extinguisherCheckDays !== ''
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : (formData.extinguisherCheckDays === '' ? 'bg-[var(--bg-color)] text-[var(--text-secondary)] border-[var(--border-color)]' : 'bg-rose-500/10 text-rose-500 border-rose-500/20')
                        }`}>
                          {formData.extinguisherCheckDays === '' ? 'Awaiting' : (Number(formData.extinguisherCheckDays) <= 30 ? 'Optimal' : 'Warning')}
                        </span>
                      </div>
                      <div className="flex items-end gap-1.5 relative z-10">
                        <input
                          type="number"
                          placeholder="12"
                          className="w-16 px-2 py-1 text-lg font-mono font-black text-[var(--text-primary)] bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 transition-all placeholder:text-[var(--text-secondary)]/50"
                          value={formData.extinguisherCheckDays}
                          onChange={e => setFormData({...formData, extinguisherCheckDays: e.target.value})}
                        />
                        <span className="text-[11px] font-bold text-[var(--text-secondary)] mb-1.5">days</span>
                      </div>
                    </div>

                    {/* Evacuation Drill Readiness Card */}
                    <div className="bg-[var(--panel-bg)] rounded-xl p-3 border border-[var(--border-color)]/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                      <div className="absolute -right-2 -top-2 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none"><Siren size={64} /></div>
                      <div className="flex justify-between items-start mb-3 relative z-10">
                        <label className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider leading-tight w-24">Evacuation Drill<br/>Readiness</label>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border tracking-wider ${
                          Number(formData.drillCompliancePct) >= 90 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : (formData.drillCompliancePct === '' ? 'bg-[var(--bg-color)] text-[var(--text-secondary)] border-[var(--border-color)]' : 'bg-amber-500/10 text-amber-500 border-amber-500/20')
                        }`}>
                          {formData.drillCompliancePct === '' ? 'Awaiting' : (Number(formData.drillCompliancePct) >= 90 ? 'Optimal' : 'Check')}
                        </span>
                      </div>
                      <div className="flex items-end gap-1.5 relative z-10">
                        <input
                          type="number"
                          placeholder="98"
                          className="w-16 px-2 py-1 text-lg font-mono font-black text-[var(--text-primary)] bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 transition-all placeholder:text-[var(--text-secondary)]/50"
                          value={formData.drillCompliancePct}
                          onChange={e => setFormData({...formData, drillCompliancePct: e.target.value})}
                        />
                        <span className="text-[11px] font-bold text-[var(--text-secondary)] mb-1.5">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Asset Management & Repairs Micro-Module */}
              {(selectedPillar === 'asset_mgt' || selectedPillar === 'Asset Mgt, Repairs & Maintenance') && (
                <div className="p-4 bg-[var(--bg-color)]/50 rounded-xl border border-[var(--border-color)] space-y-3 mt-3 animate-tab-enter">
                  <div className="flex items-center gap-2 mb-1">
                    <Wrench size={14} className="text-orange-500" />
                    <h4 className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-wider">Asset Lifecycle & Maintenance</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* AMC/Warranty Coverage Card */}
                    <div className="bg-[var(--panel-bg)] rounded-xl p-3 border border-[var(--border-color)]/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                      <div className="absolute -right-2 -top-2 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none"><ShieldCheck size={64} /></div>
                      <div className="flex justify-between items-start mb-3 relative z-10">
                        <label className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider leading-tight w-24">AMC / Warranty<br/>Coverage</label>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border tracking-wider ${
                          Number(formData.activeAmcPct) >= 95 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : (formData.activeAmcPct === '' ? 'bg-[var(--bg-color)] text-[var(--text-secondary)] border-[var(--border-color)]' : 'bg-amber-500/10 text-amber-500 border-amber-500/20')
                        }`}>
                          {formData.activeAmcPct === '' ? 'Awaiting' : (Number(formData.activeAmcPct) >= 95 ? 'Optimal' : 'Check')}
                        </span>
                      </div>
                      <div className="flex items-end gap-1.5 relative z-10">
                        <input
                          type="number"
                          placeholder="98"
                          className="w-16 px-2 py-1 text-lg font-mono font-black text-[var(--text-primary)] bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg outline-none focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-[var(--text-secondary)]/50"
                          value={formData.activeAmcPct}
                          onChange={e => setFormData({...formData, activeAmcPct: e.target.value})}
                        />
                        <span className="text-[11px] font-bold text-[var(--text-secondary)] mb-1.5">%</span>
                      </div>
                    </div>

                    {/* Critical Spares Stock Card */}
                    <div className="bg-[var(--panel-bg)] rounded-xl p-3 border border-[var(--border-color)]/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                      <div className="absolute -right-2 -top-2 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none"><Package size={64} /></div>
                      <div className="flex justify-between items-start mb-3 relative z-10">
                        <label className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider leading-tight w-20">Critical Spares<br/>Stock</label>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border tracking-wider ${
                          Number(formData.sparePartsStockPct) >= 80 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : (formData.sparePartsStockPct === '' ? 'bg-[var(--bg-color)] text-[var(--text-secondary)] border-[var(--border-color)]' : 'bg-rose-500/10 text-rose-500 border-rose-500/20')
                        }`}>
                          {formData.sparePartsStockPct === '' ? 'Awaiting' : (Number(formData.sparePartsStockPct) >= 80 ? 'Optimal' : 'Low Stock')}
                        </span>
                      </div>
                      <div className="flex items-end gap-1.5 relative z-10">
                        <input
                          type="number"
                          placeholder="85"
                          className="w-16 px-2 py-1 text-lg font-mono font-black text-[var(--text-primary)] bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg outline-none focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-[var(--text-secondary)]/50"
                          value={formData.sparePartsStockPct}
                          onChange={e => setFormData({...formData, sparePartsStockPct: e.target.value})}
                        />
                        <span className="text-[11px] font-bold text-[var(--text-secondary)] mb-1.5">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Purchase & Procurement Telemetry Micro-Module */}
              {(selectedPillar === 'procurement' || selectedPillar === 'Purchase/Procurement') && (
                <div className="p-4 bg-[var(--bg-color)]/50 rounded-xl border border-[var(--border-color)] space-y-3 mt-3 animate-tab-enter">
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingCart size={14} className="text-pink-500" />
                    <h4 className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-wider">Purchase & Procurement Telemetry</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Petty Cash Utilized Card */}
                    <div className="bg-[var(--panel-bg)] rounded-xl p-3 border border-[var(--border-color)]/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                      <div className="absolute -right-2 -top-2 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none"><Wallet size={64} /></div>
                      <div className="flex justify-between items-start mb-3 relative z-10">
                        <label className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider leading-tight w-24">Petty Cash<br/>Utilized</label>
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border tracking-wider bg-[var(--bg-color)] text-[var(--text-secondary)] border-[var(--border-color)]">
                          Tracked
                        </span>
                      </div>
                      <div className="flex items-end gap-1.5 relative z-10">
                        <input
                          type="number"
                          placeholder="12500"
                          className="w-20 px-2 py-1 text-lg font-mono font-black text-[var(--text-primary)] bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg outline-none focus:ring-2 focus:ring-pink-500/20 transition-all placeholder:text-[var(--text-secondary)]/50"
                          value={formData.pettyCashInr}
                          onChange={e => setFormData({...formData, pettyCashInr: e.target.value})}
                        />
                        <span className="text-[11px] font-bold text-[var(--text-secondary)] mb-1.5">INR</span>
                      </div>
                    </div>

                    {/* Accounts Dept. Sync Card */}
                    <div className="bg-[var(--panel-bg)] rounded-xl p-3 border border-[var(--border-color)]/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                      <div className="absolute -right-2 -top-2 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none"><FileText size={64} /></div>
                      <div className="flex justify-between items-start mb-3 relative z-10">
                        <label className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider leading-tight w-24">Accounts Dept.<br/>Sync</label>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border tracking-wider ${
                          formData.accountsSyncStatus === 'Reconciled' 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : (formData.accountsSyncStatus === 'Uploaded' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-500/10 text-amber-500 border-amber-500/20')
                        }`}>
                          {formData.accountsSyncStatus === 'Pending' ? 'Pending' : formData.accountsSyncStatus}
                        </span>
                      </div>
                      <div className="flex items-end gap-1.5 relative z-10 w-full mt-1">
                        <select
                          className="w-full px-2 py-1.5 text-xs font-bold text-[var(--text-primary)] bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg outline-none focus:ring-2 focus:ring-pink-500/20 transition-all cursor-pointer"
                          value={formData.accountsSyncStatus}
                          onChange={e => setFormData({...formData, accountsSyncStatus: e.target.value})}
                        >
                          <option value="Pending">Pending Sync</option>
                          <option value="Uploaded">Invoice Uploaded</option>
                          <option value="Reconciled">Reconciled</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Vendor Management & Payment Pipeline Micro-Module */}
              {(selectedPillar === 'vendor_mgt' || selectedPillar === 'Vendor Mgt & Payment Co-ordination') && (
                <div className="p-4 bg-[var(--bg-color)]/50 rounded-xl border border-[var(--border-color)] space-y-3 mt-3 animate-tab-enter">
                  <div className="flex items-center gap-2 mb-1">
                    <Briefcase size={14} className="text-amber-600" />
                    <h4 className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-wider">Vendor Management & Payment Pipeline</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* SLA Compliance Variance Card */}
                    <div className="bg-[var(--panel-bg)] rounded-xl p-3 border border-[var(--border-color)]/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                      <div className="absolute -right-2 -top-2 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none"><Percent size={64} /></div>
                      <div className="flex justify-between items-start mb-3 relative z-10">
                        <label className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider leading-tight w-24">SLA Compliance<br/>Variance</label>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border tracking-wider ${
                          Number(formData.slaVariancePct) >= 90 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : (formData.slaVariancePct === '' ? 'bg-[var(--bg-color)] text-[var(--text-secondary)] border-[var(--border-color)]' : 'bg-amber-500/10 text-amber-500 border-amber-500/20')
                        }`}>
                          {formData.slaVariancePct === '' ? 'Awaiting' : (Number(formData.slaVariancePct) >= 90 ? 'Optimal' : 'Warning')}
                        </span>
                      </div>
                      <div className="flex items-end gap-1.5 relative z-10">
                        <input
                          type="number"
                          step="0.1"
                          placeholder="94.2"
                          className="w-16 px-2 py-1 text-lg font-mono font-black text-[var(--text-primary)] bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg outline-none focus:ring-2 focus:ring-amber-600/20 transition-all placeholder:text-[var(--text-secondary)]/50"
                          value={formData.slaVariancePct}
                          onChange={e => setFormData({...formData, slaVariancePct: e.target.value})}
                        />
                        <span className="text-[11px] font-bold text-[var(--text-secondary)] mb-1.5">%</span>
                      </div>
                    </div>

                    {/* Invoice Escrow Status Card */}
                    <div className="bg-[var(--panel-bg)] rounded-xl p-3 border border-[var(--border-color)]/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                      <div className="absolute -right-2 -top-2 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none"><Banknote size={64} /></div>
                      <div className="flex justify-between items-start mb-3 relative z-10">
                        <label className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider leading-tight w-24">Invoice Escrow<br/>Status</label>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border tracking-wider ${
                          formData.escrowStatus === 'Released' 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : (formData.escrowStatus === 'Pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-[var(--bg-color)] text-[var(--text-secondary)] border-[var(--border-color)]')
                        }`}>
                          {formData.escrowStatus === 'Awaiting' ? 'Awaiting' : formData.escrowStatus}
                        </span>
                      </div>
                      <div className="flex items-end gap-1.5 relative z-10 w-full mt-1">
                        <select
                          className="w-full px-2 py-1.5 text-xs font-bold text-[var(--text-primary)] bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg outline-none focus:ring-2 focus:ring-amber-600/20 transition-all cursor-pointer"
                          value={formData.escrowStatus}
                          onChange={e => setFormData({...formData, escrowStatus: e.target.value})}
                        >
                          <option value="Awaiting">Awaiting Invoice</option>
                          <option value="Pending">Pending Sign-off</option>
                          <option value="Released">Escrow Released</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* High-Fidelity Interactive Trinary Status Buttons */}
              <div>
                <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2.5 opacity-50">Evaluation Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Pass', label: 'Pass', color: 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10', activeColor: 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20' },
                    { id: 'Flag', label: 'Flag', color: 'border-amber-500/30 text-amber-500 hover:bg-amber-500/10', activeColor: 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/20 shadow-orange-500/10' },
                    { id: 'Fail', label: 'Fail', color: 'border-rose-500/30 text-rose-500 hover:bg-rose-500/10', activeColor: 'bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/20' },
                  ].map((statusOption) => {
                    const active = formData.evaluationStatus === statusOption.id;
                    return (
                      <button
                        key={statusOption.id}
                        type="button"
                        onClick={() => setFormData({...formData, evaluationStatus: statusOption.id as any})}
                        className={cn(
                          "py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300",
                          active ? statusOption.activeColor : `bg-transparent ${statusOption.color}`
                        )}
                      >
                        {statusOption.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Telemetry Measurements secondary inline row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2 opacity-50 font-sans">Measurement Value</label>
                  <input 
                    type="number" 
                    step="any"
                    placeholder="e.g. 1.8" 
                    className="w-full px-4 py-3 text-sm bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500/40 text-[var(--text-primary)] transition-all font-mono"
                    value={formData.telemetryValue}
                    onChange={e => setFormData({...formData, telemetryValue: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2 opacity-50 font-sans">Unit (if any)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Ohms, V, °C" 
                    className="w-full px-4 py-3 text-sm bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl outline-none focus:border-blue-500/40 text-[var(--text-primary)] transition-all font-mono"
                    value={formData.telemetryUnit}
                    onChange={e => setFormData({...formData, telemetryUnit: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2 opacity-50">Reporter Position</label>
                  <select value={formData.reporterRole} onChange={e=>setFormData({...formData, reporterRole: e.target.value})} className="w-full px-3 py-3 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl text-xs font-bold outline-none text-[var(--text-primary)]">
                    <option value="Employee">Employee</option>
                    <option value="Area_Incharge">Area Incharge</option>
                    <option value="Facility_Manager">Facility Manager</option>
                    <option value="Business_Head">Business Head</option>
                    <option value="Master_Control">Master Director</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2 opacity-50">Impact LVL</label>
                  <select value={formData.severityStatus} onChange={e=>setFormData({...formData, severityStatus: e.target.value})} className="w-full px-3 py-3 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl text-xs font-bold outline-none text-[var(--text-primary)]">
                    <option value="1">1 - Cosmetic</option>
                    <option value="2">2 - Minor Issue</option>
                    <option value="3">3 - Blockade</option>
                    <option value="4">4 - Hazard</option>
                    <option value="5">5 - Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2 opacity-50">Anomaly Details</label>
                <textarea 
                  rows={4} 
                  placeholder="Clearly detail found exceptions..." 
                  className="w-full px-4 py-3 text-sm bg-[var(--bg-color)] border border-[var(--border-color)] rounded-2xl outline-none focus:border-blue-500/40 text-[var(--text-primary)] transition-all resize-none"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-4 rounded-2xl transition-all shadow-[0_10px_20px_-5px_rgba(37,99,235,0.4)] text-[11px] uppercase tracking-[0.3em]"
              >
                Publish Log Entry
              </motion.button>
            </form>
          </div>
        </div>

        {/* Right Column: Analytics & Table Grid */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Upgraded High-Fidelity Bento Analytics & Health Row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Operational Analytics Panel */}
            <div className="xl:col-span-2 bg-[var(--panel-bg)]/90 backdrop-blur-xl rounded-[2.5rem] border border-[var(--border-color)] p-8 shadow-sm group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.06] transition-opacity">
                <Activity size={120} />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight uppercase">Energy Consumption & Compliance (24h)</h3>
                  <p className="text-xs font-medium text-[var(--text-secondary)] opacity-60 uppercase tracking-widest mt-1">Live telemetry mapping vs. identified exceptions.</p>
                </div>
                
                {/* Glassmorphic Zone Dropdown */}
                <div className="relative flex items-center bg-[var(--bg-color)]/50 backdrop-blur-xl border border-[var(--border-color)] rounded-xl py-1.5 px-3 pr-8 shadow-sm hover:border-blue-500/30 transition-all select-none w-fit">
                  <div className="flex flex-col text-left">
                    <span className="text-[7.5px] font-black uppercase text-[var(--text-secondary)] opacity-50 tracking-widest leading-none mb-1">Filter Zone</span>
                    <select
                      value={selectedZone}
                      onChange={(e) => {
                        setSelectedZone(e.target.value);
                        setToast({
                          show: true,
                          title: 'Zone Filter Applied',
                          desc: `Telemetry mapped to tracking grid parameters for: ${e.target.value.toUpperCase()}`
                        });
                        setTimeout(() => setToast(null), 3000);
                      }}
                      className="bg-transparent text-[9px] font-black uppercase tracking-wider text-[var(--text-primary)] outline-none cursor-pointer appearance-none"
                    >
                      <option value="All Zones" className="bg-[var(--panel-bg)] text-[var(--text-primary)]">All Zones</option>
                      <option value="Zone A" className="bg-[var(--panel-bg)] text-[var(--text-primary)]">Zone A</option>
                      <option value="Zone B" className="bg-[var(--panel-bg)] text-[var(--text-primary)]">Zone B</option>
                    </select>
                  </div>
                  <div className="absolute right-2 px-1 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)] opacity-40">
                    <ChevronDown size={11} className="stroke-[3.5]" />
                  </div>
                </div>
              </div>

              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredComplianceData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorComplianceMain" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorEnergyMain" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 700, opacity: 0.5}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fill: 'var(--text-secondary)', fontSize: 10, opacity: 0.5}} domain={[0, 'auto']} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--panel-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 15px 35px rgba(0,0,0,0.1)', fontSize: '10px', color: 'var(--text-primary)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '10px' }} />
                    <Area type="monotone" dataKey="Compliance" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorComplianceMain)" name="Compliance Index %" />
                    <Area type="monotone" dataKey="Energy" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEnergyMain)" name="Energy Load Index" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 'Critical Systems' Health Widget */}
            <div className="xl:col-span-1 bg-[var(--panel-bg)]/90 backdrop-blur-xl rounded-[2.5rem] border border-[var(--border-color)] p-8 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-5">
                <div>
                  <h4 className="text-lg font-black text-[var(--text-primary)] tracking-tight uppercase">Critical Systems</h4>
                  <p className="text-[10px] font-medium text-[var(--text-secondary)] opacity-60 uppercase tracking-widest mt-0.5">Real-time Node Health Assessments</p>
                </div>
                
                <div className="space-y-3.5">
                  {[
                    { name: 'HVAC & Air Management', status: 'Online', health: 94, subtitle: 'Zone A/B Servers stable', border: 'border-emerald-500/20', badge: 'bg-emerald-500/10 text-emerald-500' },
                    { name: 'Elevator Cable Hoists', status: 'Online', health: 92, subtitle: 'Lift A active under SLA', border: 'border-emerald-500/20', badge: 'bg-emerald-500/10 text-emerald-500' },
                    { name: 'Electrical Grid Transformers', status: 'Degraded', health: 84, subtitle: 'Phase B fluctuation alert', border: 'border-amber-500/25', badge: 'bg-amber-500/10 text-amber-500 animate-pulse' },
                    { name: 'Property Patrol & Security', status: 'Online', health: 100, subtitle: 'Uptime: 24/24 cameras live', border: 'border-emerald-500/20', badge: 'bg-emerald-500/10 text-emerald-500' }
                  ].map((system, idx) => (
                    <div key={idx} className="p-3 bg-[var(--bg-color)]/50 rounded-2xl border border-[var(--border-color)]/60 hover:border-blue-500/20 transition-all group/sys">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-[10.5px] font-black text-[var(--text-primary)] tracking-tight block uppercase">{system.name}</span>
                          <span className="text-[8.5px] text-[var(--text-secondary)] opacity-50 block uppercase tracking-wider">{system.subtitle}</span>
                        </div>
                        <span className={cn(
                          "text-[8px] font-mono font-black uppercase px-2 py-0.5 rounded-full border",
                          system.border,
                          system.badge
                        )}>
                          {system.status}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[8.5px] font-mono">
                          <span className="text-[var(--text-secondary)] opacity-60 uppercase tracking-widest leading-none">System Integrity</span>
                          <span className={cn(
                            "font-bold font-black leading-none",
                            system.health >= 90 ? 'text-emerald-500' : 'text-amber-500'
                          )}>{system.health}%</span>
                        </div>
                        <div className="w-full bg-[var(--border-color)]/20 rounded-full h-[3.5px] overflow-hidden">
                          <div className={cn(
                            "h-full rounded-full transition-all duration-1000",
                            system.health >= 90 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                          )} style={{ width: `${system.health}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Exception Registry Table with Enhanced Interactive Toolbar */}
          <div className="bg-[var(--panel-bg)]/90 backdrop-blur-xl rounded-[2.5rem] border border-[var(--border-color)] overflow-hidden shadow-sm flex flex-col relative transition-all duration-300">
            
            {/* Advanced Glassmorphic Filter Toolbar */}
            <div className="p-6 border-b border-[var(--border-color)] flex flex-col sm:flex-row justify-between items-center gap-6 bg-gradient-to-r from-[var(--bg-color)]/20 via-[var(--panel-bg)]/40 to-transparent">
              <div>
                <h4 className="font-black text-[var(--text-primary)] text-lg uppercase tracking-tight">Active Exception Registry</h4>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] font-black text-[var(--text-secondary)] opacity-50 uppercase tracking-[0.2em]">Real-time Workflow Monitor</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] opacity-30" size={14} />
                  <input 
                    type="text" 
                    placeholder="Search exceptions..." 
                    className="w-full sm:w-60 pl-11 pr-4 py-2.5 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-blue-500/40 shadow-sm transition-all"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <AnimatePresence>
                  {selectedIssueIds.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, x: 20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9, x: 20 }}
                      className="flex items-center gap-2"
                    >
                      <div className="hidden lg:flex flex-col items-end mr-2">
                         <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest leading-none mb-0.5">Bulk Action</span>
                         <span className="text-[8px] font-mono text-[var(--text-secondary)] opacity-40">{selectedIssueIds.length} Nodes</span>
                      </div>
                      <div className="flex items-center gap-2 bg-blue-600/5 p-1 rounded-2xl border border-blue-500/10">
                        <button 
                          onClick={handleExportSelected}
                          className="p-2.5 bg-[var(--bg-color)] text-blue-500 rounded-xl hover:bg-blue-500/10 transition-all shadow-sm border border-blue-500/20 flex items-center gap-2"
                          title="Export Selected"
                        >
                          <FileOutput size={14} />
                          <span className="text-[9px] font-black uppercase tracking-wider hidden md:inline">Export</span>
                        </button>
                        <button 
                          onClick={handleDeleteSelected}
                          className="p-2.5 bg-[var(--bg-color)] text-rose-500 rounded-xl hover:bg-rose-500/10 transition-all shadow-sm border border-rose-500/20 flex items-center gap-2"
                          title="Delete Selected"
                        >
                          <Trash2 size={14} />
                          <span className="text-[9px] font-black uppercase tracking-wider hidden md:inline">Delete</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button className="p-3 bg-[var(--bg-color)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-blue-500/40 hover:text-blue-500 rounded-2xl transition-all flex items-center gap-2 group">
                  <SlidersHorizontal size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Advanced</span>
                </button>
              </div>
            </div>

            {/* My Approvals / View Queue Filter Selector */}
            <div className="px-6 py-4 bg-[var(--bg-color)]/30 border-b border-[var(--border-color)]/40 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)] opacity-55">Exception Queue:</span>
                <span className="px-2.5 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-[9px] font-black uppercase tracking-wider">
                  ROLE: {activeUserSession}
                </span>
              </div>
              <div className="flex bg-[var(--bg-color)]/80 p-1.5 rounded-2xl border border-[var(--border-color)]/60 shadow-inner">
                <button
                  type="button"
                  onClick={() => setApprovalsFilter('all')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                    approvalsFilter === 'all'
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  View All Network Exceptions
                </button>
                <button
                  type="button"
                  onClick={() => setApprovalsFilter('mine')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2",
                    approvalsFilter === 'mine'
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  My Pending Approvals
                  {issues.filter(i => (i as any).assignedReviewer === activeUserSession).length > 0 && (
                    <span className={cn(
                      "w-4.5 h-4.5 rounded-full flex items-center justify-center text-[8.5px] font-black",
                      approvalsFilter === 'mine' ? "bg-[var(--bg-color)] text-blue-500 font-black" : "bg-blue-600 text-white animate-pulse"
                    )}>
                      {issues.filter(i => (i as any).assignedReviewer === activeUserSession).length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* High-Density Enhanced Table View */}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left whitespace-nowrap border-separate border-spacing-0">
                <thead>
                  <tr className="bg-[var(--bg-color)]/20 text-[var(--text-secondary)] text-[9px] font-black uppercase tracking-[0.2em] border-b border-[var(--border-color)] select-none">
                    <th className="p-5 w-14 text-center sticky left-0 z-20 bg-[var(--panel-bg)]/90 backdrop-blur-xl">
                      <div className="flex items-center justify-center">
                        <input 
                          type="checkbox"
                          className="rounded-md border-[var(--border-color)] bg-[var(--bg-color)] text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer accent-blue-600 transition-all checked:scale-110"
                          checked={filteredIssues.length > 0 && selectedIssueIds.length === filteredIssues.length}
                          onChange={toggleSelectAll}
                        />
                      </div>
                    </th>
                    <th className="p-5">Incident_Ref</th>
                    <th className="p-5">Operational_Node</th>
                    <th className="p-5">Exception_Core</th>
                    <th className="p-5">Matrix_Weight</th>
                    <th className="p-5">Resolution_Cycle</th>
                    <th className="p-5">Status_Protocol</th>
                    <th className="p-5 text-right pr-8">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]/30 text-[11px] text-[var(--text-primary)]">
                  {filteredIssues.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-20 text-center opacity-20 font-mono text-[10px] tracking-[0.3em] uppercase">No localized anomalies detected</td>
                    </tr>
                  ) : (
                    filteredIssues.map((issue, idx) => {
                      const pillarMeta = PILLARS[issue.pillar as keyof typeof PILLARS];
                      const PillarIcon = pillarMeta?.icon || AlertTriangle;
                      const isRowChecked = selectedIssueIds.includes(issue.id);
                      const isUserClipped = (issue as any).assignedReviewer && activeUserSession !== (issue as any).assignedReviewer && activeUserSession !== 'Master Control';
                      
                      return (
                        <React.Fragment key={issue.id}>
                          <motion.tr 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={cn(
                              "transition-all duration-300 group hover:z-10 relative",
                              isRowChecked ? 'bg-blue-600/10' : 'hover:bg-[var(--bg-color)]/40',
                              issue.evaluationStatus === 'Fail' ? 'bg-rose-500/[0.02]' : issue.evaluationStatus === 'Flag' ? 'bg-amber-500/[0.01]' : ''
                            )}
                          >
                            <td className="p-5 w-14 text-center sticky left-0 z-20 bg-[var(--panel-bg)]/80 backdrop-blur-xl group-hover:bg-transparent transition-colors">
                              <div className="flex items-center justify-center">
                                <input 
                                  type="checkbox"
                                  className="rounded-md border-[var(--border-color)] bg-[var(--bg-color)] text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer accent-blue-600 transition-all checked:scale-110"
                                  checked={isRowChecked}
                                  onChange={() => toggleSelectRow(issue.id)}
                                />
                              </div>
                            </td>
                            <td className="p-5">
                              <div className="flex items-center gap-2.5">
                                {issue.isFinancialFlag && (
                                  <div className="p-1 rounded-lg bg-red-600/20 border border-red-500/35 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.7)] flex-shrink-0 animate-[pulsing-red-glow_1.5s_infinite]" title="Accounts Sync Pending Warning: Forced Financial Flag">
                                    <AlertTriangle size={12} className="text-red-500" />
                                  </div>
                                )}
                                {!issue.isFinancialFlag && issue.evaluationStatus === 'Flag' && (
                                  <div className="p-1 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)] flex-shrink-0 animate-pulse" title="System Flagged Warning">
                                    <AlertTriangle size={12} className="text-amber-500" />
                                  </div>
                                )}
                                {!issue.isFinancialFlag && issue.evaluationStatus === 'Fail' && (
                                  <div className="p-1 rounded-lg bg-rose-500/20 border border-rose-500/35 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.7)] flex-shrink-0 animate-[pulsing-red-glow_1.5s_infinite]" title="Critical System Failure">
                                    <AlertTriangle size={12} className="text-rose-500" />
                                  </div>
                                )}
                                <div className="flex flex-col">
                                  <span className="font-mono font-black text-blue-500 tracking-tighter text-xs group-hover:brightness-125 transition-all">{issue.id}</span>
                                  <span className="text-[8px] font-mono text-[var(--text-secondary)] opacity-30 uppercase tracking-widest mt-0.5">SY_NET_1.4</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-5">
                              <div className="flex items-center gap-3 font-bold text-[var(--text-primary)]">
                                <div className={cn(
                                  "p-2 rounded-xl border transition-all duration-500 group-hover:rotate-[360deg] shadow-lg",
                                  pillarMeta?.bg, pillarMeta?.color, pillarMeta?.border
                                )}>
                                  <PillarIcon size={14} />
                                </div>
                                <div className="flex flex-col">
                                  <span className="uppercase tracking-wide">{pillarMeta?.label.split(' & ')[0]}</span>
                                  <span className="text-[8px] font-mono opacity-40 uppercase tracking-tighter">Sector_{issue.pillar.slice(0, 3)}</span>
                                  {issue.subScope && (
                                    <span className="font-mono text-[8.5px] font-black uppercase tracking-wider text-blue-500 px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 max-w-fit mt-1 select-none">
                                      SCOPE: {issue.subScope.toUpperCase()}
                                    </span>
                                  )}
                                  {(issue as any).accountsSync && (
                                    <span className={cn(
                                      "font-mono text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border max-w-fit mt-1 select-none flex items-center gap-1",
                                      (issue as any).accountsSync === 'Pending'
                                        ? "bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse text-[8px]"
                                        : (issue as any).accountsSync === 'Invoice Uploaded'
                                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                          : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                    )}>
                                      Sync: {(issue as any).accountsSync}
                                      {(issue as any).pettyCash !== undefined && ` (₹${(issue as any).pettyCash})`}
                                    </span>
                                  )}
                                  {(issue as any).assignedReviewer && (
                                    <span className="font-mono text-[8.5px] font-black uppercase tracking-wider text-indigo-500 px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 max-w-fit mt-1 select-none">
                                      Reviewer: {(issue as any).assignedReviewer}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-5 max-w-[240px]">
                              <div className="flex flex-col gap-1">
                                <p className="truncate font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors leading-relaxed" title={issue.description}>
                                  {issue.description}
                                </p>
                                {issue.measurement && (
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[8px] font-mono uppercase text-[var(--text-secondary)] opacity-50">MEASUREDValue:</span>
                                    <span className="font-mono text-[9px] font-black tracking-normal px-2 py-0.5 rounded-md bg-[var(--bg-color)] border border-[var(--border-color)] text-blue-500">
                                      {issue.measurement.value} {issue.measurement.unit}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-5">
                              <div className="flex items-center gap-2">
                                 <div className={cn(
                                   "w-1 h-8 rounded-full opacity-50",
                                   issue.priorityScore >= 15 ? "bg-rose-500" : issue.priorityScore >= 8 ? "bg-amber-500" : "bg-emerald-500"
                                 )} />
                                 <div className="flex flex-col">
                                    <span className="font-mono text-[10px] font-black text-[var(--text-primary)] mb-0.5">
                                      NW: <span className={cn(
                                        "brightness-125 underline decoration-2 underline-offset-4",
                                        issue.priorityScore >= 15 ? "decoration-rose-500" : issue.priorityScore >= 8 ? "decoration-amber-500" : "decoration-emerald-500"
                                      )}>{issue.priorityScore}</span>
                                    </span>
                                    <span className="text-[8px] font-black opacity-30 uppercase tracking-widest">Weight_Cap 25</span>
                                 </div>
                              </div>
                            </td>
                            
                            {/* Integrated Resolution Progress Cycle Indicators */}
                            <td className="p-5">
                              <div className="flex flex-col gap-1.5 w-[110px]">
                                <div className="flex justify-between items-end">
                                  <span className="text-[8px] font-mono text-[var(--text-secondary)] opacity-40 uppercase">Progress</span>
                                  <span className="font-mono text-[9px] font-black text-blue-500">{issue.completionProgress}%</span>
                                </div>
                                <div className="w-full bg-[var(--bg-color)] rounded-full h-[3px] overflow-hidden border border-[var(--border-color)]/30 p-[1px]">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${issue.completionProgress}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    className={cn(
                                      "h-full rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]",
                                      issue.completionProgress > 80 ? 'bg-emerald-500 shadow-emerald-500/50' : 
                                      issue.completionProgress > 40 ? 'bg-blue-500 shadow-blue-500/50' : 
                                      'bg-indigo-500 shadow-indigo-500/50'
                                    )}
                                  />
                                </div>
                              </div>
                            </td>
                            
                            <td className="p-5 text-left select-none">
                              {isUserClipped ? (
                                <div className="flex flex-col gap-1.5 min-w-[130px] relative">
                                  {renderUrgencyBadge(issue.urgency)}
                                  <div className="h-7.5 w-full flex items-center justify-center">
                                    <span className="px-3 py-1 bg-[var(--text-secondary)]/10 border border-[var(--text-secondary)]/20 text-[var(--text-secondary)] text-[8px] sm:text-[9px] font-black uppercase tracking-wider rounded-xl text-center truncate max-w-[140px] select-none" title={`Requires review/approval by ${(issue as any).assignedReviewer}`}>
                                      Awaiting {(issue as any).assignedReviewer}
                                    </span>
                                  </div>
                                  {issue.assignee && (
                                    <span className="text-[8px] font-mono font-black text-[var(--text-secondary)]/60 uppercase tracking-widest block bg-[var(--text-secondary)]/5 border border-[var(--text-secondary)]/10 rounded-md px-1.5 py-0.5 text-center truncate max-w-[130px] transition-all duration-300">
                                      Assigned: {issue.assignee}
                                    </span>
                                  )}
                                </div>
                              ) : assigningIssueId === issue.id ? (
                                <div className="flex flex-col gap-1.5 w-[160px] bg-[var(--text-secondary)]/5 hover:bg-[var(--text-secondary)]/10 border border-[var(--text-secondary)]/15 rounded-2xl p-2.5 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
                                  <div className="flex items-center justify-between text-[8px] font-black text-blue-500 uppercase tracking-widest px-0.5">
                                    <span>Dispatch Node</span>
                                    <button 
                                      type="button" 
                                      onClick={() => setAssigningIssueId(null)} 
                                      className="text-[var(--text-secondary)] hover:text-rose-500 transition-colors cursor-pointer"
                                    >
                                      <X size={10} />
                                    </button>
                                  </div>
                                  <div className="relative">
                                    <select
                                      value={tempSelectedTech[issue.id] || TECHNICIANS[0]}
                                      onChange={(e) => setTempSelectedTech(prev => ({ ...prev, [issue.id]: e.target.value }))}
                                      className="w-full text-[10px] font-bold uppercase tracking-wider text-[var(--text-primary)] bg-[var(--bg-color)]/50 border border-[var(--border-color)] rounded-lg px-2.5 py-1 outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer appearance-none pr-6"
                                    >
                                      {TECHNICIANS.map(tech => (
                                        <option key={tech} value={tech} className="bg-[var(--panel-bg)] text-[var(--text-primary)]">
                                          {tech}
                                        </option>
                                      ))}
                                    </select>
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
                                      <ChevronDown size={10} />
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const chosenTech = tempSelectedTech[issue.id] || TECHNICIANS[0];
                                      setIssues(prevIssues => prevIssues.map(i => {
                                        if (i.id === issue.id) {
                                          return {
                                            ...i,
                                            status: 'Dispatched',
                                            completionProgress: 30,
                                            assignee: chosenTech
                                          };
                                        }
                                        return i;
                                      }));
                                      setAssigningIssueId(null);
                                    }}
                                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[9px] uppercase font-black tracking-widest flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-md shadow-blue-500/25"
                                  >
                                    <Check size={11} className="stroke-[3]" />
                                    Dispatch
                                  </button>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-1.5 min-w-[130px] relative">
                                  {renderUrgencyBadge(issue.urgency)}
                                  
                                  <div className="relative h-7.5 w-full flex items-center justify-center">
                                    <div className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-0 group-hover:pointer-events-none flex items-center justify-center">
                                      {renderStatusDropdown(issue)}
                                    </div>
                                    
                                    {['Unassigned', 'In_Progress'].includes(issue.status) && (
                                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto flex items-center justify-center">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setAssigningIssueId(issue.id);
                                            if (!tempSelectedTech[issue.id]) {
                                              setTempSelectedTech(prev => ({ ...prev, [issue.id]: TECHNICIANS[0] }));
                                            }
                                          }}
                                          className="w-full py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-500 transition-all duration-300 shadow-md shadow-blue-500/15 active:scale-95 cursor-pointer border border-blue-500/30 text-center flex items-center justify-center gap-1"
                                        >
                                          <UserPlus size={10} />
                                          Assign Tech
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {issue.assignee && (
                                    <span className="text-[8px] font-mono font-black text-blue-500 uppercase tracking-widest block bg-blue-500/5 border border-blue-500/10 rounded-md px-1.5 py-0.5 text-center truncate max-w-[130px] transition-all duration-300">
                                      Assigned: {issue.assignee}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>

                            <td className="p-5 text-right pr-8">
                               <motion.button 
                                 whileHover={{ scale: 1.1, x: 5 }}
                                 whileTap={{ scale: 0.9 }}
                                 className="p-2.5 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-blue-500 hover:border-blue-500/40 transition-all shadow-sm"
                               >
                                 <ChevronRight size={14} />
                               </motion.button>
                            </td>
                          </motion.tr>

                          {/* Expanded Detail Layout for FAIL status records */}
                          {issue.evaluationStatus === 'Fail' && (
                            <tr className="bg-rose-500/[0.02]">
                              <td />
                              <td colSpan={7} className="p-4 pl-0">
                                <motion.div 
                                  initial={{ opacity: 0, y: -5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="mx-5 p-4 rounded-2xl bg-rose-500/[0.03] border border-rose-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-inner"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-[pulsing-red-glow_1.2s_infinite] shadow-[0_0_12px_rgba(244,63,94,0.8)]" />
                                    <div className="flex flex-col">
                                      <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">CRITICAL EXCEPTION RECONSTRUCTION</span>
                                      <p className="text-[11px] font-medium text-[var(--text-secondary)] mt-1">{issue.description}</p>
                                    </div>
                                  </div>

                                  {issue.measurement && (
                                    <div className="flex items-center gap-2.5 bg-rose-500/10 border border-rose-500/20 px-3.5 py-1.5 rounded-xl">
                                      <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest font-sans">Measurement Logs:</span>
                                      <span className="font-mono text-xs font-black text-rose-500 bg-black/15 px-2.5 py-0.5 rounded-lg border border-rose-500/10">
                                        {issue.measurement.value} {issue.measurement.unit}
                                      </span>
                                    </div>
                                  )}
                                </motion.div>
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

            {/* Pagination / Summary Footer */}
            <div className="p-5 border-t border-[var(--border-color)] bg-[var(--bg-color)]/20 flex justify-between items-center text-[9px] font-mono text-[var(--text-secondary)] opacity-40 uppercase tracking-[0.2em] px-8">
               <span>Showing {filteredIssues.length} Anomaly Nodes</span>
               <div className="flex gap-4">
                  <span>Latency: <span className="text-emerald-500">14ms</span></span>
                  <span>Sync: <span className="text-blue-500 font-bold tracking-normal uppercase">Active</span></span>
               </div>
            </div>
          </div>

        </div>
      </div>

      {/* ================= MODAL: WORK ORDER CREATION ================= */}
      <AnimatePresence>
        {showWorkOrderModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-[var(--panel-bg)]/95 border border-[var(--border-color)] backdrop-blur-xl rounded-[2rem] shadow-2xl p-8 max-w-lg w-full relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                <LayoutGrid size={150} />
              </div>

              {/* Header */}
              <div className="flex justify-between items-start mb-6 border-b border-[var(--border-color)] pb-4">
                <div>
                  <h3 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-tight">
                    <Plus size={20} className="text-blue-500" />
                    Dispatch Team Order
                  </h3>
                  <p className="text-[10px] uppercase font-black tracking-widest text-[var(--text-secondary)] opacity-50 mt-1">Manual node escalation protocol</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWorkOrderModal(false)}
                  className="p-1 px-2.5 text-[var(--text-secondary)] hover:text-rose-500 rounded-lg bg-[var(--bg-color)]/40 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleManualWorkOrderSubmit} className="space-y-5">
                <div>
                  <label className="block text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2 opacity-60">Target Pillar Sector</label>
                  <select
                    value={woTargetPillar}
                    onChange={(e) => setWoTargetPillar(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--bg-color)]/50 border border-[var(--border-color)] text-[var(--text-primary)] focus:ring-blue-500/20 focus:border-blue-500/40 rounded-xl outline-none transition-all font-sans font-black text-xs cursor-pointer"
                  >
                    {Object.entries(PILLARS).map(([key, item]) => (
                      <option key={key} value={key} className="text-[var(--text-primary)] bg-[var(--panel-bg)]">
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2 opacity-60">Asset / Location ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ELEC-PANEL-3, WASHROOM-B-2"
                    className="w-full px-4 py-3 text-xs bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl outline-none focus:border-blue-500/40"
                    value={woAssetLocation}
                    onChange={(e) => setWoAssetLocation(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2 opacity-60">Urgency Override</label>
                  <div className="grid grid-cols-5 gap-2">
                    {['1', '2', '3', '4', '5'].map((num) => {
                      const isSelected = woUrgency === num;
                      const colors = {
                        '1': 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
                        '2': 'bg-teal-500/15 text-teal-500 border-teal-500/30',
                        '3': 'bg-blue-500/15 text-blue-500 border-blue-500/30',
                        '4': 'bg-amber-500/15 text-amber-500 border-amber-500/30',
                        '5': 'bg-rose-500/15 text-rose-500 border-rose-500/30 font-black animate-pulse'
                      };
                      const activeColors = {
                        '1': 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20',
                        '2': 'bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-500/20',
                        '3': 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/20',
                        '4': 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20',
                        '5': 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20 shadow-orange-500/10'
                      };
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setWoUrgency(num)}
                          className={cn(
                            "py-2 px-1 text-[10px] font-black uppercase tracking-wider border rounded-xl transition-all duration-300 cursor-pointer",
                            isSelected
                              ? activeColors[num as keyof typeof activeColors]
                              : `bg-transparent ${colors[num as keyof typeof colors]}`
                          )}
                        >
                          Lvl {num}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2 opacity-60">Issue Description</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide specific details about the issue to assist internal maintenance teams..."
                    className="w-full px-4 py-3 text-xs bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-2xl outline-none focus:border-blue-500/40 resize-none"
                    value={woDescription}
                    onChange={(e) => setWoDescription(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowWorkOrderModal(false)}
                    className="flex-1 py-3.5 bg-[var(--bg-color)]/70 hover:bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-xl transition-all shadow-lg shadow-blue-500/20 text-[10px] uppercase tracking-widest cursor-pointer"
                  >
                    Dispatch Team
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: REPORT GENERATION ================= */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-[var(--panel-bg)]/95 border border-[var(--border-color)] backdrop-blur-xl rounded-[2rem] shadow-2xl p-8 max-w-lg w-full relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                <FileText size={150} />
              </div>

              {/* Header */}
              <div className="flex justify-between items-start mb-6 border-b border-[var(--border-color)] pb-4">
                <div>
                  <h3 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-tight">
                    <Download size={20} className="text-blue-500 animate-bounce" />
                    Operational Compliances
                  </h3>
                  <p className="text-[10px] uppercase font-black tracking-widest text-[var(--text-secondary)] opacity-50 mt-1">Export system audit parameters</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="p-1 px-2.5 text-[var(--text-secondary)] hover:text-rose-500 rounded-lg bg-[var(--bg-color)]/40 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleGenerateReportSubmit} className="space-y-5">
                <div>
                  <label className="block text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2 opacity-60">Date Range Span</label>
                  <select
                    value={reportDateRange}
                    onChange={(e) => setReportDateRange(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--bg-color)]/50 border border-[var(--border-color)] text-[var(--text-primary)] focus:ring-blue-500/20 focus:border-blue-500/40 rounded-xl outline-none transition-all font-sans font-black text-xs cursor-pointer"
                  >
                    <option value="Last 7 Days" className="text-[var(--text-primary)] bg-[var(--panel-bg)]">Last 7 Days</option>
                    <option value="This Month" className="text-[var(--text-primary)] bg-[var(--panel-bg)]">This Month</option>
                    <option value="Last Quarter" className="text-[var(--text-primary)] bg-[var(--panel-bg)]">Last Quarter (90D)</option>
                    <option value="YTD" className="text-[var(--text-primary)] bg-[var(--panel-bg)]">Year to Date (YTD)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2 opacity-60">Data Scopes Injected</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    {[
                      { key: 'slaBreaches', label: 'SLA Breaches' },
                      { key: 'complianceLogs', label: 'Compliance Logs' },
                      { key: 'financialDelta', label: 'Financial Delta' },
                    ].map((scope) => {
                      const isChecked = reportScopes[scope.key as keyof typeof reportScopes];
                      return (
                        <button
                          key={scope.key}
                          type="button"
                          onClick={() => setReportScopes(prev => ({ ...prev, [scope.key]: !isChecked }))}
                          className={cn(
                            "py-3 px-1.5 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all duration-300 border flex items-center justify-center gap-2 cursor-pointer",
                            isChecked
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                              : "bg-[var(--bg-color)]/40 text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--text-secondary)]/5 hover:text-[var(--text-primary)]"
                          )}
                        >
                          {isChecked ? <Check size={11} className="stroke-[3]" /> : <X size={10} className="opacity-40" />}
                          {scope.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2.5 opacity-60">Format Protocol</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['PDF', 'Excel'].map((format) => {
                      const isSelected = reportFormat === format;
                      return (
                        <button
                          key={format}
                          type="button"
                          onClick={() => setReportFormat(format as any)}
                          className={cn(
                            "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300 cursor-pointer",
                            isSelected
                              ? "bg-blue-600 border-blue-600 text-white shadow-lg"
                              : "bg-[var(--bg-color)]/50 text-[var(--text-secondary)] border-[var(--border-color)] hover:text-[var(--text-primary)]"
                          )}
                        >
                          {format === 'PDF' ? 'PDF Document' : 'Excel Spread'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isGeneratingReport}
                    onClick={() => setShowReportModal(false)}
                    className="flex-1 py-3.5 bg-[var(--bg-color)]/70 hover:bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer disabled:pointer-events-none"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isGeneratingReport}
                    type="submit"
                    className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-xl transition-all shadow-lg shadow-blue-500/20 text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isGeneratingReport ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Compiling...
                      </>
                    ) : (
                      'Build Document'
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= DYNAMIC TOAST HUD ================= */}
      <AnimatePresence>
        {toast?.show && (
          <motion.div
            initial={{ opacity: 0, y: -25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -25, scale: 0.95 }}
            className="fixed top-6 right-6 z-[100] max-w-sm w-full bg-[var(--panel-bg)]/95 border border-emerald-500/30 shadow-2xl rounded-2xl p-4.5 backdrop-blur-xl flex items-start gap-3.5 select-none"
          >
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20 shadow-inner flex-shrink-0">
              <CheckCircle2 size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-sans font-black text-[var(--text-primary)] text-xs uppercase tracking-wider">{toast.title}</h4>
              <p className="text-[10px] text-[var(--text-secondary)] opacity-80 mt-1 leading-normal">{toast.desc}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1 cursor-pointer"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Embedded Global Styles for Pulsing Red Glow */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulsing-red-glow {
          0% { box-shadow: 0 0 5px rgba(244, 63, 94, 0.2); }
          50% { box-shadow: 0 0 15px rgba(244, 63, 94, 0.4); }
          100% { box-shadow: 0 0 5px rgba(244, 63, 94, 0.2); }
        }
        .pulsing-red-glow {
          animation: pulsing-red-glow 2s infinite;
        }
      `}} />
    </div>
  );
};

export default FacilityManagementTab;
