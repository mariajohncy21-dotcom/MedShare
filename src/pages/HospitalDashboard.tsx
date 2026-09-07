import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { calculateDistanceKm } from '../services/smartAllocation';
import {
  Hospital,
  AlertOctagon,
  AlertTriangle,
  RefreshCw,
  Package,
  Plus,
  ArrowRight,
  ShieldCheck,
  Send,
  Building2,
  CheckCircle2,
  Clock,
  Search,
  X,
  Sparkles,
  MapPin,
  Edit2,
  Check,
  Trash2,
} from 'lucide-react';
import { MedicalSource, InventoryItem, UrgencyLevel } from '../types';

export const HospitalDashboard: React.FC = () => {
  const {
    currentUser,
    inventory,
    medicines,
    sources,
    emergencyRequests,
    directRequests,
    transfers,
    stockChangeLogs,
    createStockTransfer,
    updateTransferStatus,
    sendDirectHospitalRequest,
    addInventoryItem,
    updateInventoryQuantity,
    deleteInventoryItem,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'EMERGENCY_CREATOR' | 'REQUEST_TRACKER' | 'SHORTAGES' | 'INVENTORY' | 'TRANSFERS'>('EMERGENCY_CREATOR');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);

  // Hospital Emergency Request Form
  const [reqMedicineId, setReqMedicineId] = useState(medicines[0]?.id || 'MED-02');
  const [reqQuantity, setReqQuantity] = useState(20);
  const [reqUrgency, setReqUrgency] = useState<UrgencyLevel>('CRITICAL');
  const [requiredByTime, setRequiredByTime] = useState('Immediate (< 45 mins)');
  const [reqNotes, setReqNotes] = useState('Emergency ICU requirement for 3 acute trauma patients.');
  const [requestSentSuccess, setRequestSentSuccess] = useState<string | null>(null);

  // Hospital Ward Add Stock Form
  const [newMedId, setNewMedId] = useState(medicines[0]?.id || '');
  const [newBatch, setNewBatch] = useState('BT-HOSP-WARD-11');
  const [newQuantity, setNewQuantity] = useState(30);
  const [newExpiry, setNewExpiry] = useState('2027-10-15');

  // Edit stock quantity
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editQty, setEditQty] = useState(0);

  // Transfer Form state
  const [targetMedicineId, setTargetMedicineId] = useState(medicines[0]?.id || '');
  const [fromSourceId, setFromSourceId] = useState('SRC-PHARM-001');
  const [transferQty, setTransferQty] = useState(15);
  const [transferReason, setTransferReason] = useState<'CRITICAL_SHORTAGE_RELIEF' | 'EXPIRY_MITIGATION' | 'ROUTINE_BALANCING'>('CRITICAL_SHORTAGE_RELIEF');

  const hospitalSourceId = currentUser.sourceId || 'SRC-HOSP-001';
  const currentHospitalSource = sources.find((s) => s.id === hospitalSourceId);
  const isApproved = currentHospitalSource?.verificationStatus === 'APPROVED' && currentHospitalSource?.accountStatus === 'ACTIVE';

  // Hospital's own inventory
  const hospitalInventory = inventory.filter((i) => i.sourceId === hospitalSourceId);

  // Direct requests initiated by this hospital
  const hospitalDirectRequests = directRequests.filter(
    (r) => r.hospitalId === hospitalSourceId || (currentHospitalSource && r.hospitalName === currentHospitalSource.name)
  );

  const hospitalTransfers = transfers.filter(
    (t) => t.toSourceId === hospitalSourceId || t.fromSourceId === hospitalSourceId
  );

  const criticalShortages = medicines.filter((m) => {
    const inv = hospitalInventory.find((i) => i.medicineId === m.id);
    const qty = inv ? inv.quantity : 0;
    return qty <= m.criticalThreshold;
  });

  // Nearby verified pharmacies for target medicine
  const selectedReqMed = medicines.find((m) => m.id === reqMedicineId);
  const hospitalLat = currentHospitalSource?.latitude || 8.4280;
  const hospitalLon = currentHospitalSource?.longitude || 77.8650;

  const nearbyPharmaciesWithMedicine = inventory
    .filter((inv) => inv.medicineId === reqMedicineId && inv.sourceType === 'PHARMACY' && inv.quantity > 0)
    .map((inv) => {
      const pharm = sources.find((s) => s.id === inv.sourceId);
      if (!pharm || pharm.isDeleted || pharm.accountStatus !== 'ACTIVE' || !pharm.isVerified) return null;
      const distance = calculateDistanceKm(hospitalLat, hospitalLon, pharm.latitude, pharm.longitude);
      return {
        pharmacy: pharm,
        inventory: inv,
        distance,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .sort((a, b) => a.distance - b.distance);

  const handleSendDirectEmergencyRequest = (pharmacy: MedicalSource, availableStock: number) => {
    if (!selectedReqMed) return;

    sendDirectHospitalRequest({
      hospitalId: hospitalSourceId,
      hospitalName: currentHospitalSource?.name || currentUser.name || 'Tisaiyanvilai Government Hospital',
      hospitalPhone: currentHospitalSource?.phone || '+91 98450 77889',
      hospitalAddress: currentHospitalSource?.address || 'Udangudi Road, Tisaiyanvilai - 627657',
      pharmacyId: pharmacy.id,
      pharmacyName: pharmacy.name,
      medicineId: reqMedicineId,
      medicineName: selectedReqMed.name,
      requestedQuantity: reqQuantity,
      urgency: reqUrgency,
      requiredBy: requiredByTime,
      message: reqNotes,
    });

    setRequestSentSuccess(`Emergency request for ${reqQuantity} units dispatched to ${pharmacy.name}!`);
    setTimeout(() => setRequestSentSuccess(null), 4000);
  };

  const handleCreateTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const med = medicines.find((m) => m.id === targetMedicineId);
    const fromSrc = sources.find((s) => s.id === fromSourceId);
    const toSrc = sources.find((s) => s.id === hospitalSourceId);

    if (!med || !fromSrc || !toSrc) return;

    createStockTransfer({
      medicineId: targetMedicineId,
      medicineName: med.name,
      fromSourceId,
      fromSourceName: fromSrc.name,
      toSourceId: hospitalSourceId,
      toSourceName: toSrc.name,
      quantity: transferQty,
      batchNumber: `BT-TRF-${Math.floor(100 + Math.random() * 900)}`,
      expiryDate: '2027-08-30',
      reason: transferReason,
      estimatedDeliveryHours: 2,
    });

    setIsTransferModalOpen(false);
  };

  const handleAddWardStock = (e: React.FormEvent) => {
    e.preventDefault();
    const med = medicines.find((m) => m.id === newMedId);
    if (!med) return;

    addInventoryItem({
      medicineId: newMedId,
      medicineName: med.name,
      sourceId: hospitalSourceId,
      sourceName: currentHospitalSource?.name || currentUser.name || 'Tisaiyanvilai Government Hospital',
      sourceType: 'HOSPITAL',
      quantity: Math.max(0, newQuantity),
      batchNumber: newBatch,
      expiryDate: newExpiry,
      unitPrice: 0.0,
      dosage: med.dosage,
      unit: med.unit,
    });

    setIsAddStockOpen(false);
  };

  const handleSaveStockEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    updateInventoryQuantity(editingItem.id, Math.max(0, editQty), 'Hospital ICU ward replenishment');
    setEditingItem(null);
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Hospital style={{ width: 18, height: 18, color: '#7c3aed' }} />
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 99, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <ShieldCheck style={{ width: 11, height: 11 }} />
              Level-1 Trauma Hub
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 900, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            {currentHospitalSource?.name || currentUser.name}
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>ICU emergency broadcasts · Pharmacy dispatches · Ward inventory</p>
        </div>
        <button
          onClick={() => setActiveTab('EMERGENCY_CREATOR')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 9, background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(220,38,38,0.28)', whiteSpace: 'nowrap' }}
        >
          <AlertOctagon style={{ width: 15, height: 15 }} />
          🚨 Dispatch Emergency Request
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }} className="lg:grid-cols-4">
        {[
          { label: 'Hospital Requests', value: hospitalDirectRequests.length, sub: 'Active stock dispatches', icon: AlertOctagon, color: '#dc2626', bg: '#fef2f2' },
          { label: 'Critical Shortages', value: criticalShortages.length, sub: 'Below critical threshold', icon: AlertTriangle, color: '#d97706', bg: '#fffbeb' },
          { label: 'Ward Stock Lines', value: hospitalInventory.length, sub: 'Tracked formulations', icon: Package, color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Stock Transfers', value: hospitalTransfers.length, sub: 'Inter-facility transfers', icon: RefreshCw, color: '#0d9488', bg: '#f0fdfa' },
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
          { key: 'EMERGENCY_CREATOR', label: '🚨 Emergency Request' },
          { key: 'REQUEST_TRACKER', label: `Dispatched (${hospitalDirectRequests.length})` },
          { key: 'INVENTORY', label: `Ward Inventory (${hospitalInventory.length})` },
          { key: 'SHORTAGES', label: `Shortages (${criticalShortages.length})` },
          { key: 'TRANSFERS', label: `Transfers (${hospitalTransfers.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '7px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 700,
              border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.12s ease',
              ...(activeTab === tab.key
                ? { background: '#fff', color: '#7c3aed', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }
                : { background: 'transparent', color: '#64748b' }),
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: HOSPITAL -> PHARMACY EMERGENCY REQUEST (Requirement #19) */}
      {activeTab === 'EMERGENCY_CREATOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Request Creator Form */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-red-600" />
              <h3 className="font-extrabold text-slate-900 text-base">Create Hospital Emergency Stock Request</h3>
            </div>
            <p className="text-xs text-slate-500">
              Broadcast critical drug demands directly to nearby verified dispensaries in Tisaiyanvilai.
            </p>

            {requestSentSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{requestSentSuccess}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Medicine</label>
                <select
                  value={reqMedicineId}
                  onChange={(e) => setReqMedicineId(e.target.value)}
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
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantity Units Required</label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={reqQuantity}
                    onChange={(e) => setReqQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-extrabold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Urgency Level</label>
                  <select
                    value={reqUrgency}
                    onChange={(e) => setReqUrgency(e.target.value as UrgencyLevel)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-red-300 bg-red-50 text-red-800 font-extrabold"
                  >
                    <option value="CRITICAL">🔴 Critical (ICU / Emergency)</option>
                    <option value="URGENT">🟡 Urgent (&lt; 2 Hours)</option>
                    <option value="NORMAL">🟢 Standard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Required By Window</label>
                <input
                  type="text"
                  value={requiredByTime}
                  onChange={(e) => setRequiredByTime(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinical Note / Department</label>
                <textarea
                  rows={2}
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Nearby Verified Pharmacies (Requirement #19) */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Nearby Verified Pharmacies with {selectedReqMed?.name}
                </h3>
                <p className="text-xs text-slate-500">Sorted by proximity to {currentHospitalSource?.name}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-xs">
                {nearbyPharmaciesWithMedicine.length} nearby
              </span>
            </div>

            {nearbyPharmaciesWithMedicine.length > 0 ? (
              <div className="space-y-3">
                {nearbyPharmaciesWithMedicine.map(({ pharmacy, inventory: inv, distance }) => (
                  <div
                    key={pharmacy.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-colors flex items-center justify-between text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-slate-900">{pharmacy.name}</h4>
                        {pharmacy.isVerified && (
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 inline" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" /> {pharmacy.address} •{' '}
                        <strong className="text-blue-700">{distance} km away</strong>
                      </p>
                      <p className="text-emerald-700 font-black text-xs">
                        ✓ {inv.quantity} {selectedReqMed?.unit} In Stock (Batch: {inv.batchNumber})
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSendDirectEmergencyRequest(pharmacy, inv.quantity)}
                      className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Request Stock</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-8 text-center">
                No verified pharmacies within range currently have stock for {selectedReqMed?.name}.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: REQUEST TRACKER & PARTIAL FULFILLMENT (Requirements 20, 21) */}
      {activeTab === 'REQUEST_TRACKER' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base">Dispatched Emergency Requests Status</h3>
          {hospitalDirectRequests.length > 0 ? (
            <div className="space-y-3">
              {hospitalDirectRequests.map((req) => (
                <div key={req.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-slate-900 text-sm">Dispatched to: {req.pharmacyName}</h4>
                        <span className="font-mono text-xs text-slate-400 font-semibold">{req.id}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Medicine: <strong className="text-slate-900">{req.medicineName}</strong> • Required:{' '}
                        <strong>{req.requestedQuantity} units</strong> ({req.urgency})
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black ${
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

                  {/* Partial Fulfillment Progress Tracker (Requirement #21) */}
                  {req.status === 'PARTIALLY_ACCEPTED' && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-2">
                      <div className="flex items-center justify-between font-bold text-amber-900">
                        <span>Fulfillment Progress:</span>
                        <span>
                          {req.acceptedQuantity} / {req.requestedQuantity} Units Received ({( (req.acceptedQuantity || 0) / req.requestedQuantity * 100).toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-amber-200 overflow-hidden">
                        <div
                          className="h-full bg-amber-600"
                          style={{
                            width: `${((req.acceptedQuantity || 0) / req.requestedQuantity) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-[11px] text-amber-800">
                        Smart Allocation Engine activated for remaining {req.requestedQuantity - (req.acceptedQuantity || 0)} units.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-8 text-center">No emergency requests dispatched yet.</p>
          )}
        </div>
      )}

      {/* TAB 3: WARD INVENTORY MANAGEMENT (Requirement #7) */}
      {activeTab === 'INVENTORY' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Emergency Trauma & ICU Ward Inventory</h3>
              <p className="text-xs text-slate-500">Only authorized dispensary personnel can modify hospital stock.</p>
            </div>
            <button
              onClick={() => setIsAddStockOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Ward Medicine</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Medicine</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4">Available Quantity</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Stock Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {hospitalInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{item.medicineName}</td>
                    <td className="py-3 px-4 font-mono">{item.batchNumber}</td>
                    <td className="py-3 px-4">
                      <span className="font-black text-slate-900 text-sm">{item.quantity}</span> {item.unit || 'units'}
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
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(item);
                            setEditQty(item.quantity);
                          }}
                          className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                          title="Update Quantity"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete/archive batch ${item.batchNumber} of ${item.medicineName}?`)) {
                              deleteInventoryItem(item.id, 'Archived from hospital ward');
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

      {/* TAB 4: SHORTAGES */}
      {activeTab === 'SHORTAGES' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base">Critical Stock Depletion Alerts</h3>
          {criticalShortages.length > 0 ? (
            <div className="space-y-3">
              {criticalShortages.map((med) => (
                <div key={med.id} className="p-4 bg-red-50 rounded-2xl border border-red-200 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-extrabold text-red-900 text-sm">{med.name}</h4>
                    <p className="text-red-700 text-[11px]">
                      Ward stock below critical threshold ({med.criticalThreshold} {med.unit}). Daily Demand: ~{med.averageDailyDemand} {med.unit}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setReqMedicineId(med.id);
                      setActiveTab('EMERGENCY_CREATOR');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-colors"
                  >
                    Request Stock Now
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-8 text-center">No critical shortages in ward inventory.</p>
          )}
        </div>
      )}

      {/* TAB 5: TRANSFERS */}
      {activeTab === 'TRANSFERS' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-base">Inter-Facility Stock Transfers</h3>
            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
            >
              Authorize Transfer
            </button>
          </div>

          <div className="space-y-3">
            {hospitalTransfers.map((t) => (
              <div key={t.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono text-blue-700 font-bold">{t.id}</span>
                  <h4 className="font-bold text-slate-900 mt-1">{t.quantity} units of {t.medicineName}</h4>
                  <p className="text-slate-500">From: {t.fromSourceName} → To: {t.toSourceName}</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-800 font-black">
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD WARD STOCK MODAL */}
      {isAddStockOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-0 animate-scale-up">
            <div className="p-6 bg-gradient-to-r from-indigo-700 to-blue-700 text-white relative">
              <button
                onClick={() => setIsAddStockOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-black">Register Ward Medicine Stock</h2>
              <p className="text-xs text-blue-100/90 mt-1">
                Add formulary line from Admin-Approved Medicine Catalog.
              </p>
            </div>

            <form onSubmit={handleAddWardStock} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Catalog Medicine</label>
                <select
                  value={newMedId}
                  onChange={(e) => setNewMedId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold"
                >
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.dosage})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ward Batch No.</label>
                  <input
                    type="text"
                    required
                    value={newBatch}
                    onChange={(e) => setNewBatch(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-extrabold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Expiry Date</label>
                <input
                  type="date"
                  required
                  value={newExpiry}
                  onChange={(e) => setNewExpiry(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddStockOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-md"
                >
                  Add to Ward Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT QUANTITY MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">Update Ward Medicine Stock</h3>
            <p className="text-xs text-slate-500">Editing: <strong>{editingItem.medicineName}</strong></p>

            <form onSubmit={handleSaveStockEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">New Available Units</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={editQty}
                  onChange={(e) => setEditQty(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-extrabold text-base text-slate-900"
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
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold"
                >
                  Save Quantity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSFER MODAL */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">Request Stock Transfer</h3>
            <form onSubmit={handleCreateTransferSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Medicine</label>
                <select
                  value={targetMedicineId}
                  onChange={(e) => setTargetMedicineId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                >
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Source Dispensary</label>
                <select
                  value={fromSourceId}
                  onChange={(e) => setFromSourceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                >
                  {sources.filter(s => s.id !== hospitalSourceId && !s.isDeleted && s.isVerified).map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.address})</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold"
                >
                  Submit Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
