import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { InventoryItem, DirectPharmacyRequest } from '../types';
import {
  Building2,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  RefreshCw,
  TrendingUp,
  Search,
  SlidersHorizontal,
  Edit2,
  ShieldCheck,
  X,
  ArrowRight,
  Send,
  Calendar,
  AlertOctagon,
  Check,
  XCircle,
  HelpCircle,
  FileSpreadsheet,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const PharmacyDashboard: React.FC = () => {
  const {
    currentUser,
    inventory,
    medicines,
    sources,
    reservations,
    directRequests,
    stockChangeLogs,
    updateReservationStatus,
    addInventoryItem,
    updateInventoryQuantity,
    deleteInventoryItem,
    respondToDirectHospitalRequest,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'INVENTORY' | 'REQUESTS' | 'RESERVATIONS' | 'EXPIRY_ALERTS' | 'AUDIT'>('OVERVIEW');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editQuantityValue, setEditQuantityValue] = useState<number>(0);
  const [editReason, setEditReason] = useState<string>('Stock received from distributor');

  // Partial accept modal state for direct hospital request
  const [partialModalReq, setPartialModalReq] = useState<DirectPharmacyRequest | null>(null);
  const [partialQuantity, setPartialQuantity] = useState<number>(10);

  // Form states for Add Stock
  const [newMedId, setNewMedId] = useState(medicines[0]?.id || '');
  const [newBatch, setNewBatch] = useState('BT-CP-994');
  const [newQuantity, setNewQuantity] = useState(50);
  const [newExpiry, setNewExpiry] = useState('2027-08-20');
  const [newPrice, setNewPrice] = useState(25);

  // RBAC verification check
  const pharmacySourceId = currentUser.sourceId || 'SRC-PHARM-001';
  const currentPharmacySource = sources.find((s) => s.id === pharmacySourceId);

  // Check if unapproved or suspended
  const isApproved = currentPharmacySource?.verificationStatus === 'APPROVED' && currentPharmacySource?.accountStatus === 'ACTIVE';

  // Pharmacy's own inventory (filtered by sourceId, strictly excluding other orgs)
  const pharmacyInventory = inventory.filter((i) => i.sourceId === pharmacySourceId);

  // Incoming hospital emergency requests
  const incomingRequests = directRequests.filter(
    (req) => req.pharmacyId === pharmacySourceId || (currentPharmacySource && req.pharmacyName === currentPharmacySource.name)
  );

  // Incoming reservations for this pharmacy
  const incomingReservations = reservations.filter((r) =>
    r.allocationBreakdown.some((b) => b.sourceId === pharmacySourceId)
  );

  const lowStockItems = pharmacyInventory.filter((i) => i.stockStatus === 'LOW' || i.stockStatus === 'CRITICAL');
  const expiringItems = pharmacyInventory.filter((i) => i.expiryStatus === 'EXPIRING_SOON');

  // Stock logs for this pharmacy
  const pharmacyLogs = stockChangeLogs.filter((l) => l.sourceId === pharmacySourceId);

  const handleAddStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const med = medicines.find((m) => m.id === newMedId);
    if (!med) return;

    addInventoryItem({
      medicineId: newMedId,
      medicineName: med.name,
      sourceId: pharmacySourceId,
      sourceName: currentPharmacySource?.name || currentUser.name || 'CarePoint 24/7 Pharmacy',
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

  const handleSaveQuantityEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    updateInventoryQuantity(editingItem.id, Math.max(0, editQuantityValue), editReason);
    setEditingItem(null);
  };

  const handlePartialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partialModalReq) return;

    respondToDirectHospitalRequest(
      partialModalReq.id,
      'PARTIALLY_ACCEPTED',
      partialQuantity,
      `Accepted available stock (${partialQuantity} units). Remainder auto-directed to secondary network facilities.`
    );
    setPartialModalReq(null);
  };

  const filteredInventory = pharmacyInventory.filter((item) =>
    item.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 style={{ width: 18, height: 18, color: '#0d9488' }} />
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 99, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <ShieldCheck style={{ width: 11, height: 11 }} />
              Verified Dispensary
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 900, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            {currentPharmacySource?.name || currentUser.name}
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Inventory management · Hospital dispatches · Reservation verification</p>
        </div>
        <button
          onClick={() => setIsAddStockOpen(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 9, background: '#1d4ed8', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(29,78,216,0.25)', whiteSpace: 'nowrap' }}
        >
          <Plus style={{ width: 15, height: 15 }} />
          Add Medicine Stock
        </button>
      </div>

      {/* Verification Status Warning if pending / suspended */}
      {!isApproved && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 18px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12 }}>
          <AlertTriangle style={{ width: 16, height: 16, color: '#d97706', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#92400e', margin: '0 0 2px' }}>Verification Status: {currentPharmacySource?.verificationStatus || 'PENDING'}</p>
            <p style={{ fontSize: 12, color: '#b45309', margin: 0 }}>Your account is undergoing regulatory verification. Public search distribution is inactive until approval.</p>
          </div>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }} className="lg:grid-cols-4">
        {[
          { label: 'Tracked Batches', value: pharmacyInventory.length, sub: 'Active catalog lines', icon: Package, color: '#1d4ed8', bg: '#eff6ff' },
          { label: 'Hospital Requests', value: incomingRequests.length, sub: 'ICU stock dispatches', icon: AlertOctagon, color: '#dc2626', bg: '#fef2f2' },
          { label: 'Active Holds', value: incomingReservations.length, sub: '15-minute countdowns', icon: Clock, color: '#0d9488', bg: '#f0fdfa' },
          { label: 'Low Stock Alerts', value: lowStockItems.length, sub: 'Reorder recommended', icon: AlertTriangle, color: '#d97706', bg: '#fffbeb' },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon style={{ width: 14, height: 14, color }} />
              </div>
            </div>
            <p style={{ fontSize: 28, fontWeight: 900, color, margin: '0 0 3px', fontFamily: 'var(--font-heading)', lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, fontWeight: 500 }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, overflowX: 'auto' }}>
        {[
          { key: 'OVERVIEW', label: 'Overview' },
          { key: 'INVENTORY', label: `Inventory (${pharmacyInventory.length})` },
          { key: 'REQUESTS', label: `Hospital Requests (${incomingRequests.length})` },
          { key: 'RESERVATIONS', label: `Reservations (${incomingReservations.length})` },
          { key: 'EXPIRY_ALERTS', label: `Expiry Alerts (${expiringItems.length})` },
          { key: 'AUDIT', label: 'Audit Log' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.12s ease',
              ...(activeTab === tab.key
                ? { background: '#fff', color: '#1d4ed8', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }
                : { background: 'transparent', color: '#64748b' }),
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Urgent Hospital Requests Panel */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-red-600 animate-pulse" />
                <h3 className="font-extrabold text-slate-900 text-sm">Emergency Hospital Requests</h3>
              </div>
              <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                Action Required
              </span>
            </div>

            {incomingRequests.length > 0 ? (
              <div className="space-y-3">
                {incomingRequests.map((req) => (
                  <div key={req.id} className="p-4 rounded-2xl bg-red-50/60 border border-red-200 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-xs font-black text-slate-900">{req.hospitalName}</strong>
                          <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                            {req.urgency}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Requested: <strong className="text-slate-900">{req.requestedQuantity} units</strong> of {req.medicineName}
                        </p>
                        <p className="text-[10px] text-slate-500">Required by: {req.requiredBy}</p>
                      </div>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          req.status === 'ACCEPTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'PARTIALLY_ACCEPTED'
                            ? 'bg-amber-100 text-amber-800'
                            : req.status === 'REJECTED'
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-red-200 text-red-900'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    {req.status === 'PENDING' && (
                      <div className="flex items-center gap-2 pt-2 border-t border-red-200/60">
                        <button
                          type="button"
                          onClick={() => respondToDirectHospitalRequest(req.id, 'ACCEPTED')}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept Full ({req.requestedQuantity})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPartialModalReq(req);
                            setPartialQuantity(Math.floor(req.requestedQuantity / 2) || 5);
                          }}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>Partially Accept</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => respondToDirectHospitalRequest(req.id, 'REJECTED', 0, 'Out of stock in current dispensary')}
                          className="py-1.5 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No pending emergency hospital requests.</p>
            )}
          </div>

          {/* Low Stock Telemetry */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm">Dispensary Stock Alerts</h3>
            {lowStockItems.length > 0 ? (
              <div className="space-y-2.5">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{item.medicineName}</p>
                      <p className="text-[10px] text-amber-800">Batch: {item.batchNumber} • In Stock: {item.quantity} units</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(item);
                        setEditQuantityValue(item.quantity);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-600 text-white text-[11px] font-bold hover:bg-amber-700 cursor-pointer"
                    >
                      Update
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">All inventory lines above threshold.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: INVENTORY MANAGEMENT (Requirement #6) */}
      {activeTab === 'INVENTORY' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search medicine or batch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setIsAddStockOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Stock from Catalog</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Medicine</th>
                  <th className="py-3 px-4">Dosage</th>
                  <th className="py-3 px-4">Batch Number</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Stock Status</th>
                  <th className="py-3 px-4">Last Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{item.medicineName}</td>
                    <td className="py-3 px-4 text-slate-500">{item.dosage || 'Standard'}</td>
                    <td className="py-3 px-4 font-mono">{item.batchNumber}</td>
                    <td className="py-3 px-4">
                      <span className="font-extrabold text-slate-900 text-sm">{item.quantity}</span> {item.unit || 'units'}
                    </td>
                    <td className="py-3 px-4">{item.expiryDate}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          item.stockStatus === 'GOOD'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.stockStatus === 'LOW'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.stockStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-400">
                      {new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(item);
                            setEditQuantityValue(item.quantity);
                          }}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                          title="Update Stock"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete/archive batch ${item.batchNumber} of ${item.medicineName}?`)) {
                              deleteInventoryItem(item.id, 'Archived by facility operator');
                            }
                          }}
                          className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
                          title="Delete / Archive Batch"
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

      {/* TAB 3: HOSPITAL REQUESTS */}
      {activeTab === 'REQUESTS' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-900 text-sm">Emergency Hospital Requests Telemetry</h3>
          <div className="space-y-3">
            {incomingRequests.length > 0 ? (
              incomingRequests.map((req) => (
                <div key={req.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">{req.hospitalName}</h4>
                      <span className="font-mono text-xs font-bold text-slate-400">{req.id}</span>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                        req.status === 'ACCEPTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'PARTIALLY_ACCEPTED'
                          ? 'bg-amber-100 text-amber-800'
                          : req.status === 'REJECTED'
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p>
                      Requested Medicine: <strong className="text-slate-900">{req.medicineName}</strong> ({req.requestedQuantity} units)
                    </p>
                    <p>Urgency Level: <strong className="text-red-600">{req.urgency}</strong></p>
                    <p>Required by: {req.requiredBy}</p>
                    {req.message && <p className="text-slate-500 italic">Note: "{req.message}"</p>}
                  </div>

                  {req.status === 'PENDING' && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => respondToDirectHospitalRequest(req.id, 'ACCEPTED')}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept Full ({req.requestedQuantity})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPartialModalReq(req);
                          setPartialQuantity(Math.floor(req.requestedQuantity / 2) || 5);
                        }}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>Partially Accept</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => respondToDirectHospitalRequest(req.id, 'REJECTED', 0, 'Out of stock in current dispensary')}
                        className="py-1.5 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No incoming hospital requests found.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: RESERVATIONS */}
      {activeTab === 'RESERVATIONS' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-900 text-sm">Active Patient Medicine Holds</h3>
          <div className="space-y-3">
            {incomingReservations.map((res) => (
              <div key={res.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {res.id}
                  </span>
                  <p className="font-bold text-slate-900 mt-1">{res.userName} • {res.userPhone}</p>
                  <p className="text-slate-500">{res.totalQuantity} units of {res.medicineName}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  {res.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: EXPIRY ALERTS */}
      {activeTab === 'EXPIRY_ALERTS' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-900 text-sm">Near-Expiry Medicine Alert Monitoring</h3>
          {expiringItems.length > 0 ? (
            <div className="space-y-3">
              {expiringItems.map((item) => (
                <div key={item.id} className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900">{item.medicineName}</h4>
                    <p className="text-amber-800 text-[11px]">Batch: {item.batchNumber} • Expiry: {item.expiryDate}</p>
                  </div>
                  <span className="px-3 py-1 bg-amber-200 text-amber-900 font-bold rounded-xl">
                    Expiring in &lt; 90 Days
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">No medicines near expiry date.</p>
          )}
        </div>
      )}

      {/* TAB 6: INVENTORY AUDIT LOGS (Requirement #5) */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-900 text-sm">Dispensary Stock Change History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Medicine</th>
                  <th className="py-2.5 px-4">Previous Qty</th>
                  <th className="py-2.5 px-4">New Qty</th>
                  <th className="py-2.5 px-4">Updated By</th>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {pharmacyLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-2.5 px-4 font-bold text-slate-900">{log.medicineName}</td>
                    <td className="py-2.5 px-4">{log.previousQuantity}</td>
                    <td className="py-2.5 px-4 font-black text-blue-700">{log.newQuantity}</td>
                    <td className="py-2.5 px-4 text-slate-500">{log.updatedBy}</td>
                    <td className="py-2.5 px-4 text-[11px] text-slate-400">
                      {new Date(log.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{log.reason || 'Manual Update'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD STOCK MODAL (Requirement #6: Catalog Constrained) */}
      {isAddStockOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-0 animate-scale-up">
            <div className="p-6 bg-gradient-to-r from-teal-700 to-blue-700 text-white relative">
              <button
                onClick={() => setIsAddStockOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-black">Add Medicine Stock</h2>
              <p className="text-xs text-blue-100/90 mt-1">
                Only Admin-approved catalog medicines can be registered into live inventory.
              </p>
            </div>

            <form onSubmit={handleAddStockSubmit} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Approved Catalog Medicine</label>
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
                  <label className="block font-bold text-slate-700">Quantity Units</label>
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
                  <span>Register Stock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT QUANTITY MODAL (Requirement #6: Tracking previous vs new quantity) */}
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
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md"
                >
                  Save Stock Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PARTIAL ACCEPT MODAL (Requirement #21) */}
      {partialModalReq && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">Partially Fulfill Hospital Request</h3>
            <p className="text-xs text-slate-500">
              Hospital requested <strong>{partialModalReq.requestedQuantity} units</strong> of {partialModalReq.medicineName}.
            </p>

            <form onSubmit={handlePartialSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Units to Fulfill from this Pharmacy</label>
                <input
                  type="number"
                  min={1}
                  max={partialModalReq.requestedQuantity - 1}
                  required
                  value={partialQuantity}
                  onChange={(e) => setPartialQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-extrabold text-base text-slate-900"
                />
                <p className="text-[11px] text-teal-700 font-semibold mt-1">
                  Remaining {partialModalReq.requestedQuantity - partialQuantity} units will be automatically allocated to other verified facilities via Smart Allocation.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPartialModalReq(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold shadow-md"
                >
                  Dispatch Partial Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
