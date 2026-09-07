import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  RefreshCw,
  AlertTriangle,
  Building2,
  Hospital,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Send,
  X,
} from 'lucide-react';

export const RedistributionHub: React.FC = () => {
  const { inventory, medicines, sources, createStockTransfer, transfers } = useApp();
  const [selectedOpportunity, setSelectedOpportunity] = useState<any | null>(null);

  // Identify smart redistribution opportunities:
  // Find items expiring soon in pharmacies, and matching medicines in hospitals with LOW/CRITICAL stock
  const redistributionOpportunities = [
    {
      id: 'OPP-01',
      medicineId: 'MED-03',
      medicineName: 'Remdesivir 100mg Injection',
      source: {
        id: 'SRC-PHARM-01',
        name: 'CarePoint 24/7 Pharmacy',
        type: 'PHARMACY',
        availableUnits: 2,
        batch: 'BT-RMD-984',
        expiryDate: '2026-09-25',
        daysUntilExpiry: 19,
      },
      destination: {
        id: 'SRC-HOSP-01',
        name: 'City Central Hospital & Trauma Care',
        type: 'HOSPITAL',
        currentStock: 0,
        demand: 'HIGH (ICU Ward)',
        criticalThreshold: 8,
      },
      matchReason: 'Expires in 19 days at pharmacy while trauma ICU has 0 units available.',
      recommendedTransferQty: 2,
    },
    {
      id: 'OPP-02',
      medicineId: 'MED-05',
      medicineName: 'Ceftriaxone 1g Injection',
      source: {
        id: 'SRC-PHARM-02',
        name: 'Apex Life Pharmacy',
        type: 'PHARMACY',
        availableUnits: 45,
        batch: 'BT-CFT-401',
        expiryDate: '2027-07-15',
        daysUntilExpiry: 310,
      },
      destination: {
        id: 'SRC-HOSP-01',
        name: 'City Central Hospital & Trauma Care',
        type: 'HOSPITAL',
        currentStock: 8,
        demand: 'CRITICAL (Daily Demand: 40 vials)',
        criticalThreshold: 25,
      },
      matchReason: 'Pharmacy has surplus of 45 vials. Hospital is below critical buffer.',
      recommendedTransferQty: 20,
    },
  ];

  const handleCreateTransfer = (opp: any) => {
    createStockTransfer({
      medicineId: opp.medicineId,
      medicineName: opp.medicineName,
      fromSourceId: opp.source.id,
      fromSourceName: opp.source.name,
      toSourceId: opp.destination.id,
      toSourceName: opp.destination.name,
      quantity: opp.recommendedTransferQty,
      batchNumber: opp.source.batch,
      expiryDate: opp.source.expiryDate,
      reason: opp.source.daysUntilExpiry < 45 ? 'EXPIRY_MITIGATION' : 'CRITICAL_SHORTAGE_RELIEF',
      estimatedDeliveryHours: 1,
    });

    setSelectedOpportunity(null);
    alert(`Transfer request authorized between ${opp.source.name} and ${opp.destination.name}!`);
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Smart Stock Redistribution & Expiry Mitigation
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
          MedShare proactively detects surplus or near-expiry batches across commercial dispensaries and pairs them with critical ICU deficits in emergency hospitals.
        </p>
      </div>

      {/* Recommended Redistribution Opportunities Cards */}
      <div className="space-y-6">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
          Algorithmically Detected Redistribution Matches
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {redistributionOpportunities.map((opp) => (
            <div
              key={opp.id}
              className="bg-white rounded-3xl p-6 shadow-md border-2 border-teal-500/80 relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="bg-teal-100 text-teal-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Potential Redistribution Opportunity
                  </span>
                  <span className="text-xs font-bold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-lg">
                    {opp.source.daysUntilExpiry < 45 ? `Expires in ${opp.source.daysUntilExpiry} days` : 'Surplus Rebalancing'}
                  </span>
                </div>

                <h3 className="text-lg font-extrabold text-slate-900 mb-2">
                  {opp.medicineName}
                </h3>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100 mb-4 leading-relaxed">
                  {opp.matchReason}
                </p>

                {/* Source vs Destination comparison */}
                <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                  {/* Origin */}
                  <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-100 space-y-1">
                    <div className="flex items-center gap-1.5 text-teal-800 font-bold">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Origin (Excess Stock)</span>
                    </div>
                    <p className="font-bold text-slate-900">{opp.source.name}</p>
                    <p className="text-slate-600">Available: <strong className="text-teal-700 font-bold">{opp.source.availableUnits} units</strong></p>
                    <p className="text-[11px] text-slate-400 font-mono">Batch: {opp.source.batch}</p>
                  </div>

                  {/* Destination */}
                  <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100 space-y-1">
                    <div className="flex items-center gap-1.5 text-rose-800 font-bold">
                      <Hospital className="w-3.5 h-3.5" />
                      <span>Destination (Deficit)</span>
                    </div>
                    <p className="font-bold text-slate-900">{opp.destination.name}</p>
                    <p className="text-slate-600">Current Stock: <strong className="text-red-600 font-bold">{opp.destination.currentStock} units</strong></p>
                    <p className="text-[11px] text-rose-600 font-semibold">{opp.destination.demand}</p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={() => handleCreateTransfer(opp)}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white text-xs font-extrabold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Authorize Transfer of {opp.recommendedTransferQty} Units &rarr;</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Inter-Facility Transfer Requests */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
        <h3 className="text-base font-bold text-slate-900">
          Dispatched Redistribution Transits ({transfers.length})
        </h3>

        <div className="space-y-3">
          {transfers.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900">{t.id}</span>
                  <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                    {t.status}
                  </span>
                  <span className="text-slate-400 font-medium">Batch: {t.batchNumber}</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {t.quantity} units of {t.medicineName}
                </h4>
                <p className="text-slate-600">
                  Route: <strong>{t.fromSourceName}</strong> &rarr; <strong>{t.toSourceName}</strong>
                </p>
              </div>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                Coordinated via MedShare Grid
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
