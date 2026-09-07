import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  Users,
  Building2,
  Hospital,
  Package,
  AlertOctagon,
  TrendingUp,
  Activity,
  CheckCircle2,
  XCircle,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  FileText,
  Trash2,
  Lock,
  Unlock,
  Eye,
  AlertTriangle,
  Clock,
  Send,
  ExternalLink,
  X,
  FileCheck,
  Check,
  Edit3,
  Radio,
  Megaphone,
  BellRing,
  CheckCircle,
  Phone,
  Mail,
  ShieldAlert,
  Building,
  Save,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { MedMap } from '../components/map/MedMap';
import { MedicalSource, VerificationStatus } from '../types';

// Realistic Analytics for Tisaiyanvilai 627657
const DEMAND_DATA = [
  { time: '00:00', emergency: 8, standard: 24 },
  { time: '04:00', emergency: 5, standard: 14 },
  { time: '08:00', emergency: 22, standard: 85 },
  { time: '12:00', emergency: 38, standard: 110 },
  { time: '16:00', emergency: 30, standard: 95 },
  { time: '20:00', emergency: 26, standard: 68 },
  { time: '23:59', emergency: 14, standard: 35 },
];

export const AdminDashboard: React.FC = () => {
  const {
    sources,
    medicines,
    inventory,
    emergencyRequests,
    reservations,
    transfers,
    auditLogs,
    approveSource,
    rejectSource,
    suspendSource,
    reactivateSource,
    updateSource,
    softDeleteSource,
    broadcastShortageAlert,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'VERIFICATIONS' | 'ORGANIZATIONS' | 'SHORTAGE_MONITOR' | 'AUDIT_LOGS' | 'MAP'>('ANALYTICS');
  const [verificationSubTab, setVerificationSubTab] = useState<VerificationStatus>('PENDING');
  const [orgTypeFilter, setOrgTypeFilter] = useState<'ALL' | 'PHARMACY' | 'HOSPITAL'>('ALL');
  const [sourceSearch, setSourceSearch] = useState('');

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Rejection Modal State
  const [rejectingSource, setRejectingSource] = useState<MedicalSource | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Suspension Modal State
  const [suspendingSource, setSuspendingSource] = useState<MedicalSource | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');

  // Deletion Modal State
  const [deletingSource, setDeletingSource] = useState<MedicalSource | null>(null);

  // Document Viewer Modal State
  const [viewingDocSource, setViewingDocSource] = useState<MedicalSource | null>(null);

  // View Organization Details Modal State
  const [viewingDetailsSource, setViewingDetailsSource] = useState<MedicalSource | null>(null);

  // Edit / Modify Organization Modal State
  const [editingSource, setEditingSource] = useState<MedicalSource | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<MedicalSource>>({});

  // Shortage Broadcast Composer Modal State
  const [broadcastingAlert, setBroadcastingAlert] = useState<{
    medicineName: string;
    shortageType: 'OUT_OF_STOCK' | 'CRITICAL_LOW';
    currentStock: number;
    threshold: number;
    targetRole: 'ALL' | 'PHARMACY' | 'HOSPITAL';
    customMessage: string;
  } | null>(null);

  // Filter sources
  const nonDeletedSources = sources.filter((s) => !s.isDeleted);
  const verifiedPharmacies = nonDeletedSources.filter((s) => s.type === 'PHARMACY' && s.verificationStatus === 'APPROVED' && s.accountStatus === 'ACTIVE');
  const verifiedHospitals = nonDeletedSources.filter((s) => s.type === 'HOSPITAL' && s.verificationStatus === 'APPROVED' && s.accountStatus === 'ACTIVE');
  const pendingSources = nonDeletedSources.filter((s) => s.verificationStatus === 'PENDING');
  const rejectedSources = nonDeletedSources.filter((s) => s.verificationStatus === 'REJECTED');
  const suspendedSources = nonDeletedSources.filter((s) => s.verificationStatus === 'SUSPENDED' || s.accountStatus === 'SUSPENDED');

  // Network Shortage Calculation
  const networkShortages = medicines.map((med) => {
    const activeSourceIds = new Set(verifiedPharmacies.concat(verifiedHospitals).map((s) => s.id));
    const activeInventories = inventory.filter((inv) => activeSourceIds.has(inv.sourceId) && inv.medicineId === med.id);
    const totalNetworkStock = activeInventories.reduce((acc, curr) => acc + curr.quantity, 0);
    const activeSourcesCount = activeInventories.filter((inv) => inv.quantity > 0).length;

    const isCriticalNetworkShortage = totalNetworkStock <= med.criticalThreshold;
    const isLowNetworkShortage = totalNetworkStock <= med.lowThreshold && !isCriticalNetworkShortage;
    const isOutOfStock = totalNetworkStock === 0;

    const alertLevel: 'NONE' | 'LOW' | 'CRITICAL' | 'OUT_OF_STOCK' = isOutOfStock
      ? 'OUT_OF_STOCK'
      : isCriticalNetworkShortage
      ? 'CRITICAL'
      : isLowNetworkShortage
      ? 'LOW'
      : 'NONE';

    return {
      medicine: med,
      totalNetworkStock,
      activeSourcesCount,
      alertLevel,
      demandLevel: totalNetworkStock < med.criticalThreshold ? 'High' : totalNetworkStock < med.lowThreshold ? 'Moderate' : 'Normal',
      affectedArea: 'Tisaiyanvilai (627657) & District Health Corridor',
      sourcesWithStock: activeInventories,
    };
  });

  const outOfStockCount = networkShortages.filter((s) => s.alertLevel === 'OUT_OF_STOCK').length;
  const criticalCount = networkShortages.filter((s) => s.alertLevel === 'CRITICAL').length;
  const lowStockCount = networkShortages.filter((s) => s.alertLevel === 'LOW').length;
  const criticalAlerts = networkShortages.filter((s) => s.alertLevel === 'CRITICAL' || s.alertLevel === 'OUT_OF_STOCK');

  // Handlers
  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingSource) return;
    rejectSource(rejectingSource.id, rejectionReason || 'Documentation mismatch with regulatory authority.');
    showToast(`Rejected verification for ${rejectingSource.name}`);
    setRejectingSource(null);
    setRejectionReason('');
  };

  const handleConfirmSuspend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendingSource) return;
    suspendSource(suspendingSource.id, suspensionReason || 'Suspended pending inventory audit review.');
    showToast(`Suspended ${suspendingSource.name}`);
    setSuspendingSource(null);
    setSuspensionReason('');
  };

  const handleConfirmDelete = () => {
    if (!deletingSource) return;
    softDeleteSource(deletingSource.id, 'Permanently decommissioned by State Drug Controller.');
    showToast(`Soft-deleted ${deletingSource.name} (Audit logs preserved)`);
    setDeletingSource(null);
  };

  const handleOpenEdit = (src: MedicalSource) => {
    setEditingSource(src);
    setEditFormData({
      name: src.name,
      type: src.type,
      ownerName: src.ownerName || '',
      phone: src.phone,
      email: src.email,
      registrationNumber: src.registrationNumber,
      address: src.address,
      area: src.area,
      city: src.city,
      state: src.state,
      pincode: src.pincode,
      operatingHours: src.operatingHours,
      emergencySupport24x7: src.emergencySupport24x7,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSource) return;
    updateSource(editingSource.id, editFormData);
    showToast(`Updated facility details for "${editFormData.name || editingSource.name}" and saved to MongoDB.`);
    setEditingSource(null);
  };

  const handleOpenBroadcastModal = (
    medicineName: string,
    shortageType: 'OUT_OF_STOCK' | 'CRITICAL_LOW',
    currentStock: number,
    threshold: number
  ) => {
    const isOut = shortageType === 'OUT_OF_STOCK';
    const defaultMsg = isOut
      ? `🚨 EMERGENCY ALERT: ${medicineName} is completely OUT OF STOCK across Tisaiyanvilai (627657). All hospitals and pharmacies are requested to reserve units for emergency trauma patients and report incoming supply.`
      : `⚠️ URGENT SHORTAGE NOTICE: ${medicineName} stock has fallen below the critical threshold (${currentStock}/${threshold} units). Please initiate replenishment or inter-facility transfers immediately.`;

    setBroadcastingAlert({
      medicineName,
      shortageType,
      currentStock,
      threshold,
      targetRole: 'ALL',
      customMessage: defaultMsg,
    });
  };

  const handleDispatchInstantAlert = (
    medicineName: string,
    shortageType: 'OUT_OF_STOCK' | 'CRITICAL_LOW',
    currentStock: number,
    threshold: number
  ) => {
    broadcastShortageAlert(medicineName, shortageType, currentStock, threshold, 'ALL');
    showToast(`🚨 Shortage alert for "${medicineName}" broadcasted to all Tisaiyanvilai pharmacies & hospitals!`);
  };

  const handleConfirmBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastingAlert) return;
    broadcastShortageAlert(
      broadcastingAlert.medicineName,
      broadcastingAlert.shortageType,
      broadcastingAlert.currentStock,
      broadcastingAlert.threshold,
      broadcastingAlert.targetRole,
      broadcastingAlert.customMessage
    );
    showToast(`📢 Shortage alert broadcasted to ${broadcastingAlert.targetRole} network!`);
    setBroadcastingAlert(null);
  };

  const filteredOrgs = nonDeletedSources
    .filter((s) => {
      if (orgTypeFilter === 'ALL') return true;
      return s.type === orgTypeFilter;
    })
    .filter((s) => {
      if (!sourceSearch.trim()) return true;
      const q = sourceSearch.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.registrationNumber.toLowerCase().includes(q) ||
        s.phone.includes(q)
      );
    });

  const getVerificationSourcesList = () => {
    switch (verificationSubTab) {
      case 'PENDING':
        return pendingSources;
      case 'APPROVED':
        return verifiedPharmacies.concat(verifiedHospitals);
      case 'REJECTED':
        return rejectedSources;
      case 'SUSPENDED':
        return suspendedSources;
      default:
        return pendingSources;
    }
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 64px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Central Regulatory & Operations Grid</h1>
            <p className="text-sm text-purple-200/80 mt-1 max-w-2xl">
              Real-time monitoring of licensed pharmacies, multi-speciality trauma hospitals, active batch allocations, and network-wide medicine shortage dispatcher.
            </p>
          </div>

          {/* Quick Critical Alert Banner if shortages exist */}
          {criticalAlerts.length > 0 && (
            <div
              onClick={() => setActiveTab('SHORTAGE_MONITOR')}
              className="bg-red-500/20 border border-red-500/40 hover:bg-red-500/30 p-4 rounded-2xl cursor-pointer transition-all flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shrink-0 animate-pulse">
                <AlertOctagon className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xs font-black uppercase text-red-300 tracking-wider">Shortage Dispatch</span>
                <p className="text-xs font-bold text-white mt-0.5">
                  {outOfStockCount > 0 ? `${outOfStockCount} Out of Stock` : ''}
                  {outOfStockCount > 0 && criticalCount > 0 ? ' • ' : ''}
                  {criticalCount > 0 ? `${criticalCount} Critical Minimums` : ''}
                </p>
                <span className="text-[11px] text-red-200 underline">Send network alerts →</span>
              </div>
            </div>
          )}
        </div>

        {/* PRIMARY NAVIGATION TABS */}
        <div className="flex items-center gap-2 overflow-x-auto mt-6 pt-4 border-t border-white/10 text-xs font-bold scrollbar-none">
          {[
            { id: 'ANALYTICS', label: 'Network Analytics', icon: Activity },
            { id: 'VERIFICATIONS', label: `Verifications (${pendingSources.length})`, icon: FileCheck },
            { id: 'ORGANIZATIONS', label: `Manage Facilities (${nonDeletedSources.length})`, icon: Building2 },
            { id: 'SHORTAGE_MONITOR', label: `Shortage Dispatcher (${criticalAlerts.length})`, icon: Megaphone },
            { id: 'AUDIT_LOGS', label: 'Audit Trail', icon: FileText },
            { id: 'MAP', label: 'Tisaiyanvilai Map', icon: MapPin },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-white text-purple-950 shadow-md font-extrabold scale-102'
                    : 'text-purple-200/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: NETWORK ANALYTICS */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }} className="lg:grid-cols-4">
            {[
              {
                label: 'Tisaiyanvilai Facilities', value: nonDeletedSources.length, icon: Building2, color: '#7c3aed', bg: '#f5f3ff',
                sub: `${verifiedPharmacies.length} Pharmacies · ${verifiedHospitals.length} Hospitals`,
              },
              {
                label: 'Total Stock Count',
                value: inventory.reduce((acc, curr) => acc + curr.quantity, 0).toLocaleString() + ' units',
                icon: Package, color: '#1d4ed8', bg: '#eff6ff',
                sub: `${medicines.length} Cataloged formulations`,
              },
              {
                label: 'Active Reservations', value: reservations.length, icon: CheckCircle2, color: '#059669', bg: '#ecfdf5',
                sub: '15-Min Hold Protection Active',
              },
              {
                label: 'Emergency Dispatches', value: emergencyRequests.length, icon: AlertTriangle, color: '#dc2626', bg: '#fef2f2',
                sub: 'Instant Smart Broadcast',
              },
            ].map(({ label, value, icon: Icon, color, bg, sub }) => (
              <div key={label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon style={{ width: 14, height: 14, color }} />
                  </div>
                </div>
                <p style={{ fontSize: 26, fontWeight: 900, color, margin: '0 0 3px', fontFamily: 'var(--font-heading)', lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, fontWeight: 500 }}>{sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Tisaiyanvilai Demand & Emergency Trend</h3>
                  <p className="text-xs text-slate-500">24-hour cycle patient searches vs trauma hospital requests</p>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-purple-50 text-purple-700 rounded-full">Live Telemetry</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={DEMAND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="emergencyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="standardGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="emergency" stroke="#ef4444" fillOpacity={1} fill="url(#emergencyGrad)" name="Emergency Surge" />
                    <Area type="monotone" dataKey="standard" stroke="#8b5cf6" fillOpacity={1} fill="url(#standardGrad)" name="Standard Search" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-extrabold text-slate-900">Tisaiyanvilai Node Distribution</h3>
              <p className="text-xs text-slate-500">Breakdown of healthcare facilities and active status</p>
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-teal-50 border border-teal-100">
                  <div className="flex items-center gap-2.5">
                    <Building className="w-4 h-4 text-teal-700" />
                    <span className="text-xs font-bold text-teal-900">Retail & 24/7 Pharmacies</span>
                  </div>
                  <span className="text-sm font-black text-teal-800">{verifiedPharmacies.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50 border border-indigo-100">
                  <div className="flex items-center gap-2.5">
                    <Hospital className="w-4 h-4 text-indigo-700" />
                    <span className="text-xs font-bold text-indigo-900">Multi-Speciality Hospitals</span>
                  </div>
                  <span className="text-sm font-black text-indigo-800">{verifiedHospitals.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 border border-amber-100">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-amber-700" />
                    <span className="text-xs font-bold text-amber-900">Pending Verification</span>
                  </div>
                  <span className="text-sm font-black text-amber-800">{pendingSources.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VERIFICATION CONSOLE */}
      {activeTab === 'VERIFICATIONS' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Organization Verification Console</h3>
              <p className="text-xs text-slate-500">Review official drug license documents and approve grid operations.</p>
            </div>

            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
              {(['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] as VerificationStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setVerificationSubTab(st)}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    verificationSubTab === st ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {getVerificationSourcesList().length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getVerificationSourcesList().map((src) => (
                <div
                  key={src.id}
                  className="p-5 rounded-3xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                            src.type === 'HOSPITAL' ? 'bg-indigo-100 text-indigo-800' : 'bg-teal-100 text-teal-800'
                          }`}
                        >
                          {src.type}
                        </span>
                        <h4 className="font-extrabold text-slate-900 text-sm mt-1">{src.name}</h4>
                      </div>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          src.verificationStatus === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : src.verificationStatus === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {src.verificationStatus}
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-600 bg-white p-3 rounded-2xl border border-slate-100">
                      <p><strong>Owner:</strong> {src.ownerName || 'Authorized Officer'}</p>
                      <p><strong>Phone:</strong> {src.phone}</p>
                      <p><strong>Email:</strong> {src.email}</p>
                      <p><strong>Address:</strong> {src.address}</p>
                      <p><strong>License Reg:</strong> <span className="font-mono font-bold text-blue-700">{src.registrationNumber}</span></p>
                      {src.rejectionReason && (
                        <p className="text-red-700 font-bold mt-1">Rejection: {src.rejectionReason}</p>
                      )}
                      {src.suspensionReason && (
                        <p className="text-amber-800 font-bold mt-1">Suspension: {src.suspensionReason}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewingDocSource(src)}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Document</span>
                      </button>
                    </div>

                    {src.verificationStatus === 'PENDING' && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            approveSource(src.id);
                            showToast(`Approved ${src.name} for network operations.`);
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectingSource(src)}
                          className="flex-1 py-2 px-3 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-600">No {verificationSubTab.toLowerCase()} applications</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MANAGE FACILITIES (VIEW, MODIFY, SUSPEND, DELETE) */}
      {activeTab === 'ORGANIZATIONS' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Manage Tisaiyanvilai Healthcare Facilities</h3>
              <p className="text-xs text-slate-500">View complete details, modify licenses/contacts, suspend or delete pharmacies and hospitals.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setOrgTypeFilter('ALL')}
                  className={`px-3 py-1 rounded-lg cursor-pointer ${orgTypeFilter === 'ALL' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'}`}
                >
                  All ({nonDeletedSources.length})
                </button>
                <button
                  onClick={() => setOrgTypeFilter('PHARMACY')}
                  className={`px-3 py-1 rounded-lg cursor-pointer ${orgTypeFilter === 'PHARMACY' ? 'bg-white text-teal-700 shadow-2xs' : 'text-slate-600'}`}
                >
                  Pharmacies ({nonDeletedSources.filter(s => s.type === 'PHARMACY').length})
                </button>
                <button
                  onClick={() => setOrgTypeFilter('HOSPITAL')}
                  className={`px-3 py-1 rounded-lg cursor-pointer ${orgTypeFilter === 'HOSPITAL' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600'}`}
                >
                  Hospitals ({nonDeletedSources.filter(s => s.type === 'HOSPITAL').length})
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search name, phone, address..."
                  value={sourceSearch}
                  onChange={(e) => setSourceSearch(e.target.value)}
                  className="pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-purple-500 w-60"
                />
              </div>
            </div>
          </div>

          {/* Organizations Table with Full View, Edit, Suspend, Delete */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Facility Name & License</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Address / Ward</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filteredOrgs.map((src) => (
                  <tr key={src.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <strong className="font-extrabold text-slate-900 text-sm block">{src.name}</strong>
                      <span className="text-[11px] text-slate-400 font-mono">{src.registrationNumber}</span>
                      {src.emergencySupport24x7 && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-red-100 text-red-700">
                          24x7 Emergency
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${src.type === 'HOSPITAL' ? 'bg-indigo-100 text-indigo-800' : 'bg-teal-100 text-teal-800'}`}>
                        {src.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      <p>{src.address}</p>
                      <span className="text-[10px] text-slate-400">{src.operatingHours}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <p className="font-bold">{src.phone}</p>
                      <p className="text-[10px] text-slate-400">{src.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${src.isVerified ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'}`}>
                        {src.verificationStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${src.accountStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {src.accountStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 1. VIEW BUTTON */}
                        <button
                          type="button"
                          onClick={() => setViewingDetailsSource(src)}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                          title="View Full Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* 2. MODIFY / EDIT BUTTON */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(src)}
                          className="p-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors cursor-pointer"
                          title="Modify / Edit Facility"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* 3. SUSPEND / REACTIVATE BUTTON */}
                        {src.accountStatus === 'ACTIVE' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSuspendingSource(src);
                              setSuspensionReason('Physical stock and regulatory audit required.');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 text-[11px] font-bold cursor-pointer"
                            title="Suspend Facility"
                          >
                            <Lock className="w-3 h-3 inline mr-1" /> Suspend
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              reactivateSource(src.id);
                              showToast(`Reactivated ${src.name}`);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold cursor-pointer"
                            title="Reactivate Facility"
                          >
                            <Unlock className="w-3 h-3 inline mr-1" /> Reactivate
                          </button>
                        )}

                        {/* 4. DELETE BUTTON */}
                        <button
                          type="button"
                          onClick={() => setDeletingSource(src)}
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                          title="Delete Organization"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: NETWORK-WIDE SHORTAGE MONITOR & ALERT DISPATCHER */}
      {activeTab === 'SHORTAGE_MONITOR' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-red-950 via-slate-900 to-purple-950 p-6 rounded-3xl text-white">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-200 text-xs font-bold mb-2 border border-red-400/30">
                <BellRing className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                <span>Tisaiyanvilai (627657) Real-Time Shortage Command</span>
              </div>
              <h3 className="text-xl font-black">Out of Stock & Minimum Stock Alert Dispatcher</h3>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Broadcast instant procurement, reallocation, and emergency shortage alerts directly to all 10 Pharmacies and 5 Multi-Speciality Hospitals.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenBroadcastModal(
                medicines[0]?.name || 'Essential Medicine',
                'CRITICAL_LOW',
                0,
                50
              )}
              className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg hover:shadow-red-500/30 transition-all cursor-pointer whitespace-nowrap self-start md:self-auto"
            >
              <Megaphone className="w-4 h-4" />
              <span>Broadcast Custom Alert</span>
            </button>
          </div>

          {/* Shortage Summary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-red-600 uppercase">Out of Stock Medicines</span>
                <p className="text-2xl font-black text-red-900 mt-0.5">{outOfStockCount}</p>
                <span className="text-[10px] text-red-600 font-semibold">Zero units in network</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold">
                0
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-700 uppercase">Critical Minimum Stock</span>
                <p className="text-2xl font-black text-amber-900 mt-0.5">{criticalCount + lowStockCount}</p>
                <span className="text-[10px] text-amber-700 font-semibold">Below critical threshold</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase">Adequately Stocked</span>
                <p className="text-2xl font-black text-emerald-900 mt-0.5">
                  {medicines.length - (outOfStockCount + criticalCount + lowStockCount)}
                </p>
                <span className="text-[10px] text-emerald-700 font-semibold">Healthy supply</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Medicines Grid with Stock and Instant Alert Dispatch Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {networkShortages.map((item) => {
              const isOut = item.alertLevel === 'OUT_OF_STOCK';
              const isCrit = item.alertLevel === 'CRITICAL';
              const isLow = item.alertLevel === 'LOW';
              const hasShortage = isOut || isCrit || isLow;

              return (
                <div
                  key={item.medicine.id}
                  className={`p-5 rounded-3xl border flex flex-col justify-between space-y-4 transition-all ${
                    isOut
                      ? 'bg-red-50/80 border-red-300 shadow-xs'
                      : isCrit
                      ? 'bg-red-50/60 border-red-200'
                      : isLow
                      ? 'bg-amber-50/60 border-amber-200'
                      : 'bg-emerald-50/40 border-emerald-200'
                  }`}
                >
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-500 block">
                          {item.medicine.category}
                        </span>
                        <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">{item.medicine.name}</h4>
                        <span className="text-[11px] text-slate-500">{item.medicine.dosage}</span>
                      </div>
                      <span
                        className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                          isOut
                            ? 'bg-red-600 text-white animate-pulse'
                            : isCrit
                            ? 'bg-red-600 text-white'
                            : isLow
                            ? 'bg-amber-600 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {item.alertLevel === 'NONE' ? 'STABLE' : item.alertLevel.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Stock Meter */}
                    <div className="p-3 bg-white rounded-2xl border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-semibold">Total Tisaiyanvilai Stock:</span>
                        <span className={`font-black text-sm ${isOut ? 'text-red-600' : isCrit ? 'text-red-700' : 'text-slate-900'}`}>
                          {item.totalNetworkStock} {item.medicine.unit}
                        </span>
                      </div>

                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isOut
                              ? 'w-0'
                              : isCrit
                              ? 'bg-red-500'
                              : isLow
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{
                            width: `${Math.min(100, (item.totalNetworkStock / (item.medicine.criticalThreshold * 3)) * 100)}%`,
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Threshold: {item.medicine.criticalThreshold} {item.medicine.unit}</span>
                        <span className="font-bold text-slate-600">{item.activeSourcesCount} Facility Nodes</span>
                      </div>
                    </div>
                  </div>

                  {/* Dispatch Action Buttons */}
                  <div className="pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row items-center gap-2">
                    {hasShortage ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleDispatchInstantAlert(
                            item.medicine.name,
                            isOut ? 'OUT_OF_STOCK' : 'CRITICAL_LOW',
                            item.totalNetworkStock,
                            item.medicine.criticalThreshold
                          )}
                          className="flex-1 w-full py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                        >
                          <Radio className="w-3.5 h-3.5 animate-pulse" />
                          <span>🚨 Alert Network</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenBroadcastModal(
                            item.medicine.name,
                            isOut ? 'OUT_OF_STOCK' : 'CRITICAL_LOW',
                            item.totalNetworkStock,
                            item.medicine.criticalThreshold
                          )}
                          className="py-2 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                          title="Configure Target Audience & Message"
                        >
                          <Megaphone className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="w-full py-2 px-3 rounded-xl bg-emerald-100/70 text-emerald-800 text-center text-xs font-bold flex items-center justify-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Inventory Status Normal</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-lg font-extrabold text-slate-900">Regulatory Administrative & Transaction Audit Logs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Event ID</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target / Organization</th>
                  <th className="py-3 px-4">Performed By</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Audit Reason / Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-slate-400">{log.id}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-50 text-purple-800 border border-purple-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-slate-900">{log.organizationName}</td>
                    <td className="py-3 px-4 text-slate-600">{log.performedBy}</td>
                    <td className="py-3 px-4 text-[11px] text-slate-400">{log.date} {log.time}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-sm">{log.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: TISAIYANVILAI MAP */}
      {activeTab === 'MAP' && (
        <div className="space-y-4">
          <h3 className="text-lg font-extrabold text-slate-900">Tisaiyanvilai Municipal Healthcare Node Map (627657)</h3>
          <MedMap sources={nonDeletedSources} inventories={inventory} />
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: VIEW ORGANIZATION DETAILS */}
      {/* ========================================================= */}
      {viewingDetailsSource && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-5 p-6 sm:p-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${viewingDetailsSource.type === 'HOSPITAL' ? 'bg-indigo-100 text-indigo-800' : 'bg-teal-100 text-teal-800'}`}>
                  {viewingDetailsSource.type}
                </span>
                <h3 className="text-xl font-black text-slate-900">{viewingDetailsSource.name}</h3>
                <p className="text-xs text-slate-500">Facility ID: <span className="font-mono font-bold text-slate-700">{viewingDetailsSource.id}</span></p>
              </div>
              <button onClick={() => setViewingDetailsSource(null)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl space-y-1.5 border border-slate-100">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Contact Details</span>
                <p><strong>Owner / In-Charge:</strong> {viewingDetailsSource.ownerName || 'Chief Medical Officer'}</p>
                <p><strong>Phone:</strong> {viewingDetailsSource.phone}</p>
                <p><strong>Email:</strong> {viewingDetailsSource.email}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl space-y-1.5 border border-slate-100">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Regulatory Status</span>
                <p><strong>License Reg:</strong> <span className="font-mono font-bold text-blue-700">{viewingDetailsSource.registrationNumber}</span></p>
                <p><strong>Verification:</strong> <span className="font-bold text-emerald-700">{viewingDetailsSource.verificationStatus}</span></p>
                <p><strong>Account Status:</strong> <span className="font-bold text-slate-800">{viewingDetailsSource.accountStatus}</span></p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl space-y-1.5 border border-slate-100 sm:col-span-2">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Location & Operations</span>
                <p><strong>Address:</strong> {viewingDetailsSource.address}, {viewingDetailsSource.city} - {viewingDetailsSource.pincode}</p>
                <p><strong>Operating Hours:</strong> {viewingDetailsSource.operatingHours}</p>
                <p><strong>24x7 Emergency Services:</strong> {viewingDetailsSource.emergencySupport24x7 ? 'Yes, Active Emergency Ward & Dispensary' : 'Standard Daytime Dispensary'}</p>
              </div>
            </div>

            {/* Live Inventory in this facility */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                Current Stock In This Facility ({inventory.filter(i => i.sourceId === viewingDetailsSource.id).length} Batches)
              </h4>
              <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 text-xs">
                {inventory.filter(i => i.sourceId === viewingDetailsSource.id).length > 0 ? (
                  inventory.filter(i => i.sourceId === viewingDetailsSource.id).map(inv => (
                    <div key={inv.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <strong className="text-slate-900 font-bold">{inv.medicineName}</strong>
                        <span className="text-[10px] text-slate-400 ml-2">Batch: {inv.batchNumber} • Exp: {inv.expiryDate}</span>
                      </div>
                      <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg">
                        {inv.quantity} units
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-center text-slate-400 font-medium">No stock logged currently.</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const src = viewingDetailsSource;
                  setViewingDetailsSource(null);
                  handleOpenEdit(src);
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Modify Facility</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingDetailsSource(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: MODIFY / EDIT ORGANIZATION (PERSISTS TO MONGODB) */}
      {/* ========================================================= */}
      {editingSource && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-6 sm:p-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-purple-600">Admin Modification</span>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">Modify Facility Profile & License</h3>
                <p className="text-xs text-slate-500">Changes will be saved directly into MongoDB <span className="font-mono text-purple-700 font-bold">medshare_db.medical_sources</span></p>
              </div>
              <button onClick={() => setEditingSource(null)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Organization Name</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Facility Type</label>
                  <select
                    value={editFormData.type || 'PHARMACY'}
                    onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value as any })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="PHARMACY">Pharmacy</option>
                    <option value="HOSPITAL">Multi-Speciality Hospital</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Owner / Chief Officer Name</label>
                  <input
                    type="text"
                    value={editFormData.ownerName || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, ownerName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Drug License / Registration No.</label>
                  <input
                    type="text"
                    required
                    value={editFormData.registrationNumber || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, registrationNumber: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-purple-500 text-blue-700"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Contact</label>
                  <input
                    type="text"
                    required
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    required
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Full Street Address</label>
                  <input
                    type="text"
                    required
                    value={editFormData.address || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Operating Hours</label>
                  <input
                    type="text"
                    value={editFormData.operatingHours || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, operatingHours: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <label className="relative flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={Boolean(editFormData.emergencySupport24x7)}
                      onChange={(e) => setEditFormData({ ...editFormData, emergencySupport24x7: e.target.checked })}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>24x7 Emergency Services Enabled</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSource(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: BROADCAST SHORTAGE ALERT COMPOSER */}
      {/* ========================================================= */}
      {broadcastingAlert && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-red-600 flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 animate-pulse" /> Emergency Network Dispatch
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">Send Stock Shortage Alert</h3>
                <p className="text-xs text-slate-500">Alert pharmacies and hospitals in Tisaiyanvilai 627657.</p>
              </div>
              <button onClick={() => setBroadcastingAlert(null)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmBroadcast} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Medicine</label>
                <select
                  value={broadcastingAlert.medicineName}
                  onChange={(e) => {
                    const selMed = medicines.find(m => m.name === e.target.value);
                    const netStock = inventory
                      .filter(i => i.medicineId === selMed?.id)
                      .reduce((acc, c) => acc + c.quantity, 0);
                    const isOut = netStock === 0;

                    setBroadcastingAlert({
                      ...broadcastingAlert,
                      medicineName: e.target.value,
                      shortageType: isOut ? 'OUT_OF_STOCK' : 'CRITICAL_LOW',
                      currentStock: netStock,
                      threshold: selMed?.criticalThreshold || 50,
                      customMessage: isOut
                        ? `🚨 EMERGENCY ALERT: ${e.target.value} is completely OUT OF STOCK across Tisaiyanvilai (627657). Facilities are requested to reserve emergency stock and notify supply coordinators.`
                        : `⚠️ URGENT SHORTAGE NOTICE: ${e.target.value} stock is below critical threshold (${netStock} units). Please replenish immediately.`,
                    });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-purple-500 text-slate-900"
                >
                  {medicines.map(m => (
                    <option key={m.id} value={m.name}>{m.name} ({m.dosage})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Alert Severity</label>
                  <select
                    value={broadcastingAlert.shortageType}
                    onChange={(e) => setBroadcastingAlert({ ...broadcastingAlert, shortageType: e.target.value as any })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="OUT_OF_STOCK">🚨 Out of Stock (0 units)</option>
                    <option value="CRITICAL_LOW">⚠️ Critical Minimum Stock</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Facilities</label>
                  <select
                    value={broadcastingAlert.targetRole}
                    onChange={(e) => setBroadcastingAlert({ ...broadcastingAlert, targetRole: e.target.value as any })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="ALL">All Facilities (15 Nodes)</option>
                    <option value="PHARMACY">Pharmacies Only (10 Nodes)</option>
                    <option value="HOSPITAL">Hospitals Only (5 Nodes)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alert Message & Instructions</label>
                <textarea
                  required
                  rows={4}
                  value={broadcastingAlert.customMessage}
                  onChange={(e) => setBroadcastingAlert({ ...broadcastingAlert, customMessage: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBroadcastingAlert(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black flex items-center gap-1.5 shadow-lg shadow-red-500/20 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Dispatch Alert Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectingSource && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">Reject Organization Application</h3>
            <p className="text-xs text-slate-500">
              Provide an official rejection justification for <strong>{rejectingSource.name}</strong>.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Rejection Reason</label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Drug license number could not be authenticated on TN Pharmacy Council database."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectingSource(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUSPEND MODAL */}
      {suspendingSource && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">Suspend Organization Account</h3>
            <p className="text-xs text-slate-500">
              Suspended organizations cannot receive reservations or emergency requests. Records will be preserved.
            </p>

            <form onSubmit={handleConfirmSuspend} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Suspension Reason</label>
                <input
                  type="text"
                  required
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSuspendingSource(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold cursor-pointer"
                >
                  Confirm Suspension
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingSource && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="font-extrabold text-slate-900 text-base">
              Are you sure you want to remove this organization from MedShare?
            </h3>
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs space-y-1">
              <p><strong>Organization:</strong> {deletingSource.name}</p>
              <p><strong>Type:</strong> {deletingSource.type}</p>
              <p><strong>Location:</strong> {deletingSource.address}</p>
            </div>
            <p className="text-[11px] text-slate-500">
              Note: A soft deletion will be performed and saved in MongoDB. Historical transaction logs and reservations will be safely retained for auditing compliance.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingSource(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md cursor-pointer"
              >
                Yes, Delete Organization
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {viewingDocSource && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Official Verification Document</h3>
                <p className="text-xs text-slate-500">{viewingDocSource.name} • License: {viewingDocSource.registrationNumber}</p>
              </div>
              <button onClick={() => setViewingDocSource(null)} className="p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-80 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
              <img
                src={viewingDocSource.documentUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80'}
                alt="License Document"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setViewingDocSource(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
