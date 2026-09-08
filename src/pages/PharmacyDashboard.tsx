import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { InventoryItem, PharmacyEmergencyRequest, PharmacyRequestStatus } from '../types';
import {
  Building2,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  TrendingUp,
  Search,
  Edit2,
  ShieldCheck,
  X,
  ArrowRight,
  AlertOctagon,
  Check,
  XCircle,
  FileSpreadsheet,
  Trash2,
  Phone,
  MapPin,
  Calendar,
  Activity,
  User,
  ShieldAlert,
  HelpCircle,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Timer,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const PharmacyDashboard: React.FC = () => {
  const {
    currentUser,
    inventory,
    medicines,
    sources,
    reservations,
    pharmacyRequests,
    stockChangeLogs,
    addInventoryItem,
    updateInventoryQuantity,
    deleteInventoryItem,
    updatePharmacyAvailability,
    acceptPharmacyEmergencyRequest,
    declinePharmacyEmergencyRequest,
    completePharmacyDispense,
    cancelReservation,
  } = useApp();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'INVENTORY' | 'QUEUE' | 'RESERVATIONS' | 'HISTORY'>('OVERVIEW');

  // Search & Filter States
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRED'>('ALL');
  
  // History Filter States
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'ALL' | 'COMPLETED' | 'DECLINED' | 'EXPIRED'>('ALL');
  const [historyDateFilter, setHistoryDateFilter] = useState('');

  // Modals state
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editQuantityValue, setEditQuantityValue] = useState<number>(0);
  const [editReason, setEditReason] = useState<string>('Stock received from distributor');

  // Contribution modal state for emergency request
  const [contributionRequest, setContributionRequest] = useState<PharmacyEmergencyRequest | null>(null);
  const [contributeQuantity, setContributeQuantity] = useState<number>(1);

  // Decline modal state
  const [declineModalReq, setDeclineModalReq] = useState<PharmacyEmergencyRequest | null>(null);
  const [declineReason, setDeclineReason] = useState<string>('Stock reserved for local walk-in critical care patients');

  // Add Stock Form states
  const [newMedId, setNewMedId] = useState(medicines[0]?.id || '');
  const [newBatch, setNewBatch] = useState('BT-CP-994');
  const [newQuantity, setNewQuantity] = useState(50);
  const [newExpiry, setNewExpiry] = useState('2027-08-20');
  const [newPrice, setNewPrice] = useState(25);

  // Live timer tick for reservation countdowns (updates every second)
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Pharmacy identity resolution
  const pharmacySourceId = currentUser.sourceId || 'SRC-PHARM-001';
  const currentPharmacySource = sources.find((s) => s.id === pharmacySourceId) || {
    id: pharmacySourceId,
    name: currentUser.name || 'Apollo Pharmacy – Tisaiyanvilai Main',
    type: 'PHARMACY' as const,
    address: 'Main Bazaar Road, Tisaiyanvilai - 627657',
    phone: '+91 4637 271240',
    email: currentUser.email || 'apollo@pharm.com',
    operatingHours: '08:00 AM - 10:00 PM',
    isVerified: true,
    verificationStatus: 'APPROVED' as const,
    accountStatus: 'ACTIVE' as const,
    availabilityStatus: 'ACTIVE_ONLINE' as const,
    registrationNumber: 'TN-PHARM-2021-9921',
  };

  // Verification gating
  const isVerified = currentPharmacySource.verificationStatus === 'APPROVED' && currentPharmacySource.isVerified;
  const currentAvailability = currentPharmacySource.availabilityStatus || 'ACTIVE_ONLINE';

  // Pharmacy's isolated inventory
  const pharmacyInventory = useMemo(() => {
    return inventory.filter((i) => i.sourceId === pharmacySourceId);
  }, [inventory, pharmacySourceId]);

  // Compute status for an inventory line
  const computeItemStatus = (item: InventoryItem) => {
    const today = new Date().toISOString().split('T')[0];
    if (item.expiryDate < today || item.expiryStatus === 'EXPIRED') {
      return 'EXPIRED';
    }
    const avail = item.quantity - (item.reservedQuantity || 0);
    if (avail <= 0) {
      return 'OUT_OF_STOCK';
    }
    if (avail <= 15) {
      return 'LOW_STOCK';
    }
    return 'AVAILABLE';
  };

  // KPI calculations
  const totalMedicinesCount = pharmacyInventory.length;
  const availableMedicinesCount = pharmacyInventory.filter((i) => computeItemStatus(i) === 'AVAILABLE').length;
  const lowStockCount = pharmacyInventory.filter((i) => computeItemStatus(i) === 'LOW_STOCK' || computeItemStatus(i) === 'OUT_OF_STOCK').length;
  
  // Requests relevant to this pharmacy
  const myPharmacyRequests = useMemo(() => {
    return pharmacyRequests.filter((r) => r.pharmacyId === pharmacySourceId);
  }, [pharmacyRequests, pharmacySourceId]);

  // Emergency Queue: Priority-Sorted (1. Critical -> 2. Urgent -> 3. Normal)
  const priorityQueue = useMemo(() => {
    const priorityWeight: Record<string, number> = {
      CRITICAL: 1,
      URGENT: 2,
      NORMAL: 3,
    };

    return myPharmacyRequests
      .filter((r) => r.status === 'PENDING' || r.status === 'ACCEPTED' || r.status === 'RESERVED')
      .sort((a, b) => {
        const weightA = priorityWeight[a.urgency] || 4;
        const weightB = priorityWeight[b.urgency] || 4;
        if (weightA !== weightB) return weightA - weightB;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [myPharmacyRequests]);

  const activeEmergencyRequestsCount = priorityQueue.filter((r) => r.status === 'PENDING').length;

  // Active reservations (holds) for this pharmacy
  const activeReservations = useMemo(() => {
    return reservations.filter(
      (r) =>
        r.allocationBreakdown.some((b) => b.sourceId === pharmacySourceId) &&
        (r.status === 'CONFIRMED' || r.status === 'PENDING')
    );
  }, [reservations, pharmacySourceId]);

  const activeReservationsCount = activeReservations.length;

  // Request History: Completed, Declined, Expired
  const requestHistory = useMemo(() => {
    return myPharmacyRequests
      .filter((r) => r.status === 'COMPLETED' || r.status === 'DECLINED' || r.status === 'EXPIRED')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [myPharmacyRequests]);

  // Filtered inventory list
  const filteredInventory = useMemo(() => {
    return pharmacyInventory.filter((item) => {
      const matchesSearch =
        item.medicineName.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        item.batchNumber.toLowerCase().includes(inventorySearch.toLowerCase());
      const status = computeItemStatus(item);
      const matchesStatus = inventoryStatusFilter === 'ALL' || status === inventoryStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [pharmacyInventory, inventorySearch, inventoryStatusFilter]);

  // Filtered history list
  const filteredHistory = useMemo(() => {
    return requestHistory.filter((item) => {
      const matchesSearch =
        item.medicineName.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.id.toLowerCase().includes(historySearch.toLowerCase()) ||
        (item.reservationId && item.reservationId.toLowerCase().includes(historySearch.toLowerCase()));
      const matchesStatus = historyStatusFilter === 'ALL' || item.status === historyStatusFilter;
      const matchesDate = !historyDateFilter || item.createdAt.startsWith(historyDateFilter);
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [requestHistory, historySearch, historyStatusFilter, historyDateFilter]);

  // Add stock submission
  const handleAddStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const med = medicines.find((m) => m.id === newMedId);
    if (!med) return;

    addInventoryItem({
      medicineId: newMedId,
      medicineName: med.name,
      sourceId: pharmacySourceId,
      sourceName: currentPharmacySource?.name || currentUser.name || 'Dispensary',
      sourceType: 'PHARMACY',
      quantity: Math.max(0, newQuantity),
      batchNumber: newBatch,
      expiryDate: newExpiry,
      unitPrice: newPrice,
      dosage: med.dosage,
      unit: med.unit,
    });

    setIsAddStockOpen(false);
  };

  // Quantity edit submission
  const handleSaveQuantityEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    updateInventoryQuantity(editingItem.id, Math.max(0, editQuantityValue), editReason);
    setEditingItem(null);
  };

  // Open contribution modal for accepting emergency request
  const openContributionModal = (req: PharmacyEmergencyRequest) => {
    setContributionRequest(req);
    // Find current available stock in pharmacy
    const stockItem = pharmacyInventory.find(
      (i) => i.medicineId === req.medicineId || i.medicineName.toLowerCase() === req.medicineName.toLowerCase()
    );
    const available = stockItem ? Math.max(0, stockItem.quantity - (stockItem.reservedQuantity || 0)) : req.pharmacyAvailableStock;
    // Default contribution: min of required quantity and available stock, or half
    const defaultContribution = Math.min(req.requiredQuantity, Math.max(1, available));
    setContributeQuantity(defaultContribution);
  };

  // Confirm Contribution
  const handleConfirmContribution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributionRequest) return;
    acceptPharmacyEmergencyRequest(contributionRequest.id, pharmacySourceId, contributeQuantity);
    setContributionRequest(null);
  };

  // Decline request submission
  const handleConfirmDecline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!declineModalReq) return;
    declinePharmacyEmergencyRequest(declineModalReq.id, pharmacySourceId, declineReason);
    setDeclineModalReq(null);
  };

  // Format seconds into MM:SS
  const formatTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - currentTime;
    if (diff <= 0) return '00:00 (Expired)';
    const totalSeconds = Math.floor(diff / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* 1. TOP HEADER & PHARMACY NETWORK STATUS BAR */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-teal-600" />
            </div>
            {isVerified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified Dispensary
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Pending Verification
              </span>
            )}
            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              Lic: {currentPharmacySource.registrationNumber || 'TN-PHARM-2021-9921'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {currentPharmacySource.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {currentPharmacySource.address}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Hours: {currentPharmacySource.operatingHours}
            </span>
          </p>
        </div>

        {/* NETWORK AVAILABILITY STATUS CONTROLLER (Requirement #2) */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              Dispensary Network Status
            </span>
            <span
              className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                currentAvailability === 'ACTIVE_ONLINE'
                  ? 'bg-emerald-100 text-emerald-800'
                  : currentAvailability === 'BUSY'
                  ? 'bg-amber-100 text-amber-800'
                  : currentAvailability === 'OFFLINE'
                  ? 'bg-slate-200 text-slate-700'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {currentAvailability === 'ACTIVE_ONLINE' && '🟢 Active / Online'}
              {currentAvailability === 'BUSY' && '🟡 Busy'}
              {currentAvailability === 'OFFLINE' && '⚪ Offline'}
              {currentAvailability === 'CLOSED' && '🔴 Closed'}
            </span>
          </div>

          {/* Quick status selector buttons */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {[
              { status: 'ACTIVE_ONLINE', label: 'Online', color: 'hover:bg-emerald-50 text-emerald-700' },
              { status: 'BUSY', label: 'Busy', color: 'hover:bg-amber-50 text-amber-700' },
              { status: 'OFFLINE', label: 'Offline', color: 'hover:bg-slate-100 text-slate-600' },
              { status: 'CLOSED', label: 'Closed', color: 'hover:bg-red-50 text-red-700' },
            ].map(({ status, label, color }) => (
              <button
                key={status}
                type="button"
                onClick={() => updatePharmacyAvailability(pharmacySourceId, status as any)}
                className={`text-[11px] font-bold py-1.5 px-2 rounded-lg border transition-all cursor-pointer ${color} ${
                  currentAvailability === status
                    ? 'bg-white shadow-xs border-slate-300 font-black'
                    : 'border-transparent bg-transparent opacity-70'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* VERIFICATION GATING WARNING BANNER (Requirement #1 & #9) */}
      {!isVerified && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs">
            <p className="font-extrabold text-amber-900">
              Account Status: {currentPharmacySource.verificationStatus || 'PENDING_VERIFICATION'}
            </p>
            <p className="text-amber-700 leading-relaxed">
              Your pharmacy registration is undergoing regulatory license review by the Drug Control Authority.
              <strong> Only verified pharmacies can receive and accept emergency medicine requests.</strong> You can
              manage your inventory below while approval is processed.
            </p>
          </div>
        </div>
      )}

      {/* 2. SUMMARY KPI STATS CARDS (Requirement #2) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          {
            label: 'Total Medicines',
            value: totalMedicinesCount,
            sub: 'Catalog items',
            icon: Package,
            color: 'text-blue-600',
            bg: 'bg-blue-50 border-blue-200',
          },
          {
            label: 'Available Medicines',
            value: availableMedicinesCount,
            sub: 'In stock & unexpired',
            icon: CheckCircle2,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50 border-emerald-200',
          },
          {
            label: 'Low Stock Medicines',
            value: lowStockCount,
            sub: 'Restock recommended',
            icon: AlertTriangle,
            color: 'text-amber-600',
            bg: 'bg-amber-50 border-amber-200',
          },
          {
            label: 'Active Emergency Requests',
            value: activeEmergencyRequestsCount,
            sub: 'Live priority queue',
            icon: AlertOctagon,
            color: 'text-red-600',
            bg: 'bg-red-50 border-red-200',
            badge: activeEmergencyRequestsCount > 0 ? 'Urgent' : undefined,
          },
          {
            label: 'Active Reservations',
            value: activeReservationsCount,
            sub: '15-min countdown holds',
            icon: Clock,
            color: 'text-teal-600',
            bg: 'bg-teal-50 border-teal-200',
          },
        ].map(({ label, value, sub, icon: Icon, color, bg, badge }) => (
          <div
            key={label}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</span>
              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${bg}`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-black ${color}`}>{value}</span>
                {badge && (
                  <span className="text-[10px] font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-full animate-pulse">
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 3. TABS NAVIGATION BAR */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/60 rounded-2xl overflow-x-auto">
        {[
          { key: 'OVERVIEW', label: 'Overview', icon: Activity },
          { key: 'INVENTORY', label: `Medicine Inventory (${pharmacyInventory.length})`, icon: Package },
          {
            key: 'QUEUE',
            label: `Emergency Requests (${priorityQueue.length})`,
            icon: AlertOctagon,
            badge: activeEmergencyRequestsCount > 0 ? activeEmergencyRequestsCount : undefined,
          },
          {
            key: 'RESERVATIONS',
            label: `Active Reservations (${activeReservationsCount})`,
            icon: Clock,
          },
          { key: 'HISTORY', label: `Request History (${requestHistory.length})`, icon: Calendar },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black animate-pulse">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW DASHBOARD */}
      {/* ========================================================================= */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Priority Emergency Requests Feed */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-red-600 animate-pulse" />
                <h2 className="text-base font-extrabold text-slate-900">Priority Emergency Medicine Requests</h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('QUEUE')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Queue</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {priorityQueue.length > 0 ? (
              <div className="space-y-3">
                {priorityQueue.slice(0, 3).map((req) => (
                  <div
                    key={req.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      req.urgency === 'CRITICAL'
                        ? 'bg-red-50/70 border-red-200'
                        : req.urgency === 'URGENT'
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                              req.urgency === 'CRITICAL'
                                ? 'bg-red-600 text-white animate-pulse'
                                : req.urgency === 'URGENT'
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-700 text-white'
                            }`}
                          >
                            {req.urgency}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-500">{req.id}</span>
                          <span className="text-xs font-semibold text-slate-400">
                            • {req.distanceKm.toFixed(1)} km away
                          </span>
                        </div>

                        <h3 className="text-sm font-black text-slate-900 mt-1">
                          {req.medicineName}
                        </h3>
                        <p className="text-xs text-slate-600">
                          Required Quantity: <strong className="text-slate-900">{req.requiredQuantity} units</strong> |
                          Your Available Stock: <strong className="text-teal-700">{req.pharmacyAvailableStock} units</strong>
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Requested by: {req.requesterName} ({req.requesterType}) • {req.requesterPhone}
                        </p>
                      </div>

                      <span
                        className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full ${
                          req.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : req.status === 'RESERVED'
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    {/* Quick action buttons if PENDING */}
                    {req.status === 'PENDING' && (
                      <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center gap-2">
                        <button
                          type="button"
                          disabled={!isVerified}
                          onClick={() => openContributionModal(req)}
                          className={`flex-1 py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 text-white shadow-xs cursor-pointer ${
                            isVerified ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-300 cursor-not-allowed'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept Request (Choose Units)</span>
                        </button>

                        <button
                          type="button"
                          disabled={!isVerified}
                          onClick={() => {
                            setDeclineModalReq(req);
                            setDeclineReason('Low stock reserved for local emergency patients');
                          }}
                          className="py-2 px-3 rounded-xl font-bold text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto opacity-70" />
                <p className="text-sm font-bold text-slate-700">All Emergency Requests Cleared</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Your dispensary is live on the MedShare grid. Any nearby citizen emergency requests will appear here instantly.
                </p>
              </div>
            )}
          </div>

          {/* Quick Dispensary Stock Telemetry */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900">Stock & Expiry Telemetry</h2>
              <button
                type="button"
                onClick={() => setIsAddStockOpen(true)}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Medicine</span>
              </button>
            </div>

            <div className="space-y-3">
              {pharmacyInventory.slice(0, 5).map((item) => {
                const status = computeItemStatus(item);
                const avail = item.quantity - (item.reservedQuantity || 0);

                return (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-extrabold text-slate-900">{item.medicineName}</p>
                      <p className="text-[11px] text-slate-500">
                        Available: <strong className="text-slate-800">{avail} units</strong> • Batch: {item.batchNumber}
                      </p>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        status === 'AVAILABLE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : status === 'LOW_STOCK'
                          ? 'bg-amber-100 text-amber-800'
                          : status === 'OUT_OF_STOCK'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-purple-100 text-purple-900'
                      }`}
                    >
                      {status === 'AVAILABLE' && 'Available'}
                      {status === 'LOW_STOCK' && 'Low Stock'}
                      {status === 'OUT_OF_STOCK' && 'Out of Stock'}
                      {status === 'EXPIRED' && 'Expired'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MEDICINE INVENTORY MANAGEMENT (Requirement #3) */}
      {/* ========================================================================= */}
      {activeTab === 'INVENTORY' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Medicine Inventory Management</h2>
              <p className="text-xs text-slate-500">
                Manage stock batches, expiry dates, and real-time available stock for the MedShare network.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddStockOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Medicine Batch</span>
            </button>
          </div>

          {/* Filter and Search Controls */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search medicine name or batch..."
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(['ALL', 'AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRED'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setInventoryStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    inventoryStatusFilter === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Inventory Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Medicine Name</th>
                  <th className="py-3 px-4">Batch Number</th>
                  <th className="py-3 px-4">Available Qty</th>
                  <th className="py-3 px-4">Total Qty</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filteredInventory.length > 0 ? (
                  filteredInventory.map((item) => {
                    const status = computeItemStatus(item);
                    const avail = item.quantity - (item.reservedQuantity || 0);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-black text-slate-900">
                          {item.medicineName}
                          <span className="block text-[11px] font-normal text-slate-400">
                            MRP ₹{item.unitPrice || 25} • {item.dosage || 'Standard'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                          {item.batchNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-sm font-black text-teal-700">{avail}</span> units
                          {item.reservedQuantity && item.reservedQuantity > 0 ? (
                            <span className="block text-[10px] text-amber-600 font-bold">
                              ({item.reservedQuantity} reserved on hold)
                            </span>
                          ) : null}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {item.quantity} units
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={status === 'EXPIRED' ? 'text-purple-900 font-black' : 'text-slate-600'}>
                            {item.expiryDate}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                              status === 'AVAILABLE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : status === 'LOW_STOCK'
                                ? 'bg-amber-100 text-amber-800'
                                : status === 'OUT_OF_STOCK'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-purple-100 text-purple-900'
                            }`}
                          >
                            {status === 'AVAILABLE' && 'Available'}
                            {status === 'LOW_STOCK' && 'Low Stock'}
                            {status === 'OUT_OF_STOCK' && 'Out of Stock'}
                            {status === 'EXPIRED' && 'Expired'}
                          </span>
                          {status === 'EXPIRED' && (
                            <span className="block text-[10px] text-purple-700 mt-0.5 font-bold">
                              ⚠️ Excluded from search results
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingItem(item);
                                setEditQuantityValue(item.quantity);
                              }}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                              title="Update Quantity & Reason"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Delete medicine batch ${item.batchNumber} (${item.medicineName})?`)) {
                                  deleteInventoryItem(item.id, 'Deleted by pharmacy operator');
                                }
                              }}
                              className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
                              title="Delete / Archive Medicine"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No medicines match the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: EMERGENCY REQUESTS QUEUE (Requirements #4, #5, #7) */}
      {/* ========================================================================= */}
      {activeTab === 'QUEUE' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900">Emergency Medicine Request Queue</h2>
              <p className="text-xs text-slate-500">
                Sorted strictly by clinical urgency: <strong>1. Critical</strong> → <strong>2. Urgent</strong> → <strong>3. Normal</strong>.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500">
              Total Active: <strong>{priorityQueue.length}</strong>
            </span>
          </div>

          {priorityQueue.length > 0 ? (
            <div className="space-y-4">
              {priorityQueue.map((req) => (
                <div
                  key={req.id}
                  className={`p-5 rounded-3xl border transition-all ${
                    req.urgency === 'CRITICAL'
                      ? 'bg-red-50/60 border-red-300 shadow-xs'
                      : req.urgency === 'URGENT'
                      ? 'bg-amber-50/60 border-amber-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-xs font-black px-2.5 py-0.5 rounded-full uppercase ${
                            req.urgency === 'CRITICAL'
                              ? 'bg-red-600 text-white animate-pulse'
                              : req.urgency === 'URGENT'
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-700 text-white'
                          }`}
                        >
                          {req.urgency} Priority
                        </span>
                        <span className="text-xs font-mono font-black text-slate-600">
                          ID: {req.id}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          • {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h3 className="text-base font-black text-slate-900">
                        {req.medicineName}
                      </h3>

                      <div className="text-xs text-slate-600 flex flex-wrap gap-4 pt-1">
                        <span>
                          Patient Required: <strong className="text-slate-900">{req.requiredQuantity} units</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Your Available Stock: <strong className="text-teal-700">{req.pharmacyAvailableStock} units</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Distance: <strong>{req.distanceKm.toFixed(1)} km</strong>
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500">
                        Requester: <strong>{req.requesterName}</strong> ({req.requesterPhone}) • {req.requesterType}
                      </p>
                      {req.notes && <p className="text-[11px] text-slate-500 italic">"{req.notes}"</p>}
                    </div>

                    <div className="flex flex-col sm:flex-row items-end md:items-center gap-2">
                      <span
                        className={`text-xs font-black px-3 py-1 rounded-full ${
                          req.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : req.status === 'RESERVED'
                            ? 'bg-teal-100 text-teal-800'
                            : req.status === 'ACCEPTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                  </div>

                  {/* ACTION CONTROLS (Accept with custom units / Decline) */}
                  {req.status === 'PENDING' && (
                    <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-slate-500">
                        💡 <em>You are not required to give all stock. Choose how many units to contribute.</em>
                      </p>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={!isVerified}
                          onClick={() => {
                            setDeclineModalReq(req);
                            setDeclineReason('Low stock reserved for walk-in critical care patients');
                          }}
                          className="py-2 px-4 rounded-xl font-bold text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer"
                        >
                          Decline Request
                        </button>

                        <button
                          type="button"
                          disabled={!isVerified}
                          onClick={() => openContributionModal(req)}
                          className={`py-2 px-5 rounded-xl font-black text-xs text-white shadow-md flex items-center gap-1.5 cursor-pointer ${
                            isVerified ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <Check className="w-4 h-4" />
                          <span>Accept & Select Contribution Units</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto opacity-70" />
              <h3 className="text-sm font-bold text-slate-800">No Pending Emergency Requests</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Any incoming emergency broadcasts within your service radius will be automatically queued here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: TEMPORARY RESERVATIONS & DISPENSING (Requirement #6) */}
      {/* ========================================================================= */}
      {activeTab === 'RESERVATIONS' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900">Active Medicine Reservations & Holds</h2>
              <p className="text-xs text-slate-500">
                15-minute countdown holds. Reserved stock is safely locked to prevent double-allocation and automatically released upon expiry.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-xl border border-teal-200">
              Active Holds: {activeReservations.length}
            </span>
          </div>

          {activeReservations.length > 0 ? (
            <div className="space-y-4">
              {activeReservations.map((res) => {
                const breakdown = res.allocationBreakdown.find((b) => b.sourceId === pharmacySourceId);
                const reservedQty = breakdown ? breakdown.quantity : res.totalQuantity;
                const timeRemaining = formatTimeRemaining(res.expiresAt);

                return (
                  <div
                    key={res.id}
                    className="p-5 bg-teal-50/40 rounded-3xl border border-teal-200 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-teal-800 bg-teal-100 px-2.5 py-1 rounded-lg">
                            Reservation ID: {res.id}
                          </span>
                          <span className="text-xs font-bold text-slate-500">
                            Held at: {new Date(res.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <h3 className="text-base font-black text-slate-900 mt-1.5">
                          {reservedQty} units of {res.medicineName}
                        </h3>

                        <p className="text-xs text-slate-600 mt-0.5">
                          Patient: <strong className="text-slate-900">{res.userName}</strong> • Phone:{' '}
                          <strong className="text-slate-900">{res.userPhone}</strong>
                        </p>
                      </div>

                      {/* Live 15-Minute Countdown Indicator */}
                      <div className="bg-white p-3 rounded-2xl border border-teal-200 text-center min-w-[140px]">
                        <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                          <Timer className="w-3.5 h-3.5 text-teal-600 animate-spin" />
                          <span>Hold Expiry</span>
                        </div>
                        <p className="text-lg font-mono font-black text-teal-700 mt-0.5">
                          {timeRemaining}
                        </p>
                      </div>
                    </div>

                    {/* Dispense Action Buttons */}
                    <div className="pt-3 border-t border-teal-200/60 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs text-teal-800">
                        Verify Patient's Reservation ID / QR Code upon collection.
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Release hold for ${res.id}? Reserved stock will immediately return to available stock.`)) {
                              cancelReservation(res.id, 'Hold cancelled by dispensary');
                            }
                          }}
                          className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                        >
                          Release Hold
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            completePharmacyDispense(res.id);
                          }}
                          className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Mark as Collected & Completed</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 space-y-2">
              <Clock className="w-10 h-10 text-teal-500 mx-auto opacity-70" />
              <h3 className="text-sm font-bold text-slate-800">No Active Reservation Holds</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                When you accept an emergency request, the reserved units will be held here for 15 minutes awaiting patient collection.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: REQUEST HISTORY (Requirement #8) */}
      {/* ========================================================================= */}
      {activeTab === 'HISTORY' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div>
            <h2 className="text-lg font-black text-slate-900">Pharmacy Request History</h2>
            <p className="text-xs text-slate-500">
              Audit archive of Completed Requests, Declined Requests, and Expired Holds with full date and status filters.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search medicine or Request ID..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
              />
            </div>

            {/* Status filters */}
            <div className="flex items-center gap-1.5">
              {(['ALL', 'COMPLETED', 'DECLINED', 'EXPIRED'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setHistoryStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    historyStatusFilter === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Date filter */}
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={historyDateFilter}
                onChange={(e) => setHistoryDateFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700"
              />
              {historyDateFilter && (
                <button
                  type="button"
                  onClick={() => setHistoryDateFilter('')}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* History List */}
          <div className="space-y-3">
            {filteredHistory.length > 0 ? (
              filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-500">{item.id}</span>
                      {item.reservationId && (
                        <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          Hold: {item.reservationId}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString()} at{' '}
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="font-black text-slate-900 text-sm">
                      {item.medicineName}
                    </p>

                    <p className="text-slate-600">
                      Required: {item.requiredQuantity} units
                      {item.contributedQuantity ? (
                        <span> • Contributed: <strong>{item.contributedQuantity} units</strong></span>
                      ) : null}
                      <span> • Requester: {item.requesterName} ({item.requesterType})</span>
                    </p>

                    {item.declinedReason && (
                      <p className="text-[11px] text-red-700 italic">Decline reason: "{item.declinedReason}"</p>
                    )}
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black self-start sm:self-center ${
                      item.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.status === 'DECLINED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-xs text-slate-400">
                No request history found matching the selected filters.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CONTRIBUTION MODAL (Requirement #5) */}
      {/* ========================================================================= */}
      {contributionRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Select Contribution Quantity</h3>
              </div>
              <button
                type="button"
                onClick={() => setContributionRequest(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <p className="font-bold">
                Emergency Request: {contributionRequest.medicineName}
              </p>
              <p>
                Patient Required: <strong>{contributionRequest.requiredQuantity} units</strong> | Your Available Stock:{' '}
                <strong>{contributionRequest.pharmacyAvailableStock} units</strong>
              </p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are <strong>not forced</strong> to provide your entire stock. Enter how many units your pharmacy can allocate for this patient:
            </p>

            <form onSubmit={handleConfirmContribution} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Contribution Input (Units to Reserve)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, contributionRequest.pharmacyAvailableStock)}
                    required
                    value={contributeQuantity}
                    onChange={(e) => setContributeQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-black text-lg text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-bold text-slate-500">units</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Upon confirmation, a 15-minute hold with a Reservation ID will be generated.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setContributionRequest(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm Contribution</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DECLINE REQUEST MODAL */}
      {/* ========================================================================= */}
      {declineModalReq && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">Decline Emergency Request</h3>
            <p className="text-xs text-slate-500">
              Provide a reason for declining the request for <strong>{declineModalReq.medicineName}</strong>.
            </p>

            <form onSubmit={handleConfirmDecline} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Decline Reason</label>
                <textarea
                  rows={3}
                  required
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 font-semibold text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeclineModalReq(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold shadow-md"
                >
                  Confirm Decline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD MEDICINE STOCK */}
      {/* ========================================================================= */}
      {isAddStockOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-0">
            <div className="p-6 bg-gradient-to-r from-teal-700 to-blue-700 text-white relative">
              <button
                type="button"
                onClick={() => setIsAddStockOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-black">Register Medicine Batch</h3>
              <p className="text-xs text-blue-100/90 mt-1">
                Add authentic pharmaceutical stock to your live dispensary inventory.
              </p>
            </div>

            <form onSubmit={handleAddStockSubmit} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Medicine</label>
                <select
                  value={newMedId}
                  onChange={(e) => setNewMedId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.dosage})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Batch Number</label>
                  <input
                    type="text"
                    required
                    value={newBatch}
                    onChange={(e) => setNewBatch(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Total Quantity</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={10000}
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-extrabold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={newExpiry}
                    onChange={(e) => setNewExpiry(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Unit MRP (₹)</label>
                  <input
                    type="number"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddStockOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Register Batch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: UPDATE STOCK QUANTITY (Requirement #3) */}
      {/* ========================================================================= */}
      {editingItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">Update Medicine Stock</h3>
            <p className="text-xs text-slate-500">
              Editing: <strong>{editingItem.medicineName}</strong> (Batch: {editingItem.batchNumber})
            </p>

            <form onSubmit={handleSaveQuantityEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">New Available Quantity</label>
                <input
                  type="number"
                  min={0}
                  max={10000}
                  required
                  value={editQuantityValue}
                  onChange={(e) => setEditQuantityValue(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-extrabold text-base text-slate-900"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Current stock: {editingItem.quantity} units → New: {editQuantityValue} units
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Update Reason / Audit Note</label>
                <input
                  type="text"
                  required
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md cursor-pointer"
                >
                  Save Stock Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
