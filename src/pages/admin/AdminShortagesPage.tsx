import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import {
  AlertOctagon, Radio, ArrowRight, ShieldAlert, CheckCircle2,
  Building2, Hospital, RefreshCw, Send, X, ArrowLeftRight
} from 'lucide-react';

export const AdminShortagesPage: React.FC = () => {
  const { medicines, inventory, sources, broadcastShortageAlert, createStockTransfer } = useApp();

  const [broadcastMedicineId, setBroadcastMedicineId] = useState<string | null>(null);
  const [broadcastNote, setBroadcastNote] = useState('');
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferMed, setTransferMed] = useState<any>(null);

  // Analyze network-wide shortage per medicine
  const shortageAnalysis = useMemo(() => {
    return medicines.map(med => {
      const items = inventory.filter(i => i.medicineId === med.id);
      const totalAvailable = items.reduce((sum, i) => sum + i.quantity, 0);
      const isCritical = totalAvailable <= med.criticalThreshold;
      const isLow = totalAvailable <= med.lowThreshold;

      // Group facilities into Surplus vs Deficit
      const facilities = items.map(i => ({
        sourceId: i.sourceId,
        sourceName: i.sourceName,
        sourceType: i.sourceType,
        quantity: i.quantity,
        isDeficit: i.quantity <= 10,
        isSurplus: i.quantity >= 40,
      }));

      return {
        medicine: med,
        totalAvailable,
        isCritical,
        isLow,
        status: isCritical ? 'CRITICAL' : isLow ? 'LOW' : 'STABLE',
        facilities,
        deficitFacilities: facilities.filter(f => f.isDeficit),
        surplusFacilities: facilities.filter(f => f.isSurplus),
      };
    }).filter(a => a.isLow || a.isCritical);
  }, [medicines, inventory]);

  const handleBroadcast = (medId: string) => {
    const med = medicines.find(m => m.id === medId);
    broadcastShortageAlert(
      med?.name || medId,
      'CRITICAL_LOW',
      0,
      10,
      'ALL',
      broadcastNote || 'Urgent cluster inventory shortfall. Please update stock or offer surplus redistribution.'
    );
    setBroadcastSuccess(`Emergency broadcast alert sent to all 15 Tisaiyanvilai network nodes!`);
    setBroadcastMedicineId(null);
    setBroadcastNote('');
    setTimeout(() => setBroadcastSuccess(null), 5000);
  };

  return (
    <ConsoleLayout>
      <div style={{ padding: '24px 28px', maxWidth: 1300, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertOctagon style={{ width: 26, height: 26, color: '#dc2626' }} />
              Emergency Shortage Radar & Redistribution
            </h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              Automated detection of network deficits and smart rebalancing between surplus and deficit healthcare nodes.
            </p>
          </div>
        </div>

        {broadcastSuccess && (
          <div style={{
            background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 12,
            padding: '12px 18px', color: '#065f46', fontSize: 13, fontWeight: 700,
            marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <CheckCircle2 style={{ width: 18, height: 18, color: '#059669' }} />
            {broadcastSuccess}
          </div>
        )}

        {/* Summary Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
          <div style={{ background: '#fff', padding: '16px 20px', borderRadius: 12, border: '1px solid #fecaca', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#dc2626', margin: 0, fontWeight: 700 }}>Critical Cluster Shortages</p>
            <p style={{ fontSize: 28, fontWeight: 900, color: '#dc2626', margin: '4px 0 0' }}>
              {shortageAnalysis.filter(s => s.isCritical).length}
            </p>
          </div>
          <div style={{ background: '#fff', padding: '16px 20px', borderRadius: 12, border: '1px solid #fde68a', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#d97706', margin: 0, fontWeight: 700 }}>Low Stock Warnings</p>
            <p style={{ fontSize: 28, fontWeight: 900, color: '#d97706', margin: '4px 0 0' }}>
              {shortageAnalysis.filter(s => s.isLow && !s.isCritical).length}
            </p>
          </div>
          <div style={{ background: '#fff', padding: '16px 20px', borderRadius: 12, border: '1px solid #bfdbfe', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#1d4ed8', margin: 0, fontWeight: 700 }}>Total Deficit Facilities</p>
            <p style={{ fontSize: 28, fontWeight: 900, color: '#1d4ed8', margin: '4px 0 0' }}>
              {shortageAnalysis.reduce((sum, s) => sum + s.deficitFacilities.length, 0)}
            </p>
          </div>
          <div style={{ background: '#fff', padding: '16px 20px', borderRadius: 12, border: '1px solid #bbf7d0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#166534', margin: 0, fontWeight: 700 }}>Active Surplus Nodes</p>
            <p style={{ fontSize: 28, fontWeight: 900, color: '#166534', margin: '4px 0 0' }}>
              {shortageAnalysis.reduce((sum, s) => sum + s.surplusFacilities.length, 0)}
            </p>
          </div>
        </div>

        {/* Shortage Cards */}
        <div style={{ display: 'grid', gap: 16 }}>
          {shortageAnalysis.length === 0 ? (
            <div style={{ background: '#fff', padding: 48, borderRadius: 14, textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <CheckCircle2 style={{ width: 44, height: 44, color: '#10b981', margin: '0 auto 12px' }} />
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
                All Network Formulations are Well-Stocked
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
                No medicine in the Tisaiyanvilai cluster is currently below safety critical thresholds.
              </p>
            </div>
          ) : (
            shortageAnalysis.map(item => {
              const med = item.medicine;
              return (
                <div
                  key={med.id}
                  style={{
                    background: '#fff', borderRadius: 14, border: `1.5px solid ${item.isCritical ? '#fecaca' : '#fed7aa'}`,
                    padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
                          {med.name}
                        </h3>
                        <span style={{
                          padding: '3px 8px', borderRadius: 99,
                          background: item.isCritical ? '#fef2f2' : '#fffbeb',
                          color: item.isCritical ? '#dc2626' : '#d97706',
                          border: `1px solid ${item.isCritical ? '#fecaca' : '#fde68a'}`,
                          fontSize: 11, fontWeight: 800,
                        }}>
                          {item.isCritical ? 'CRITICAL SHORTAGE' : 'LOW STOCK WARNING'}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                        Generic: <strong>{med.genericName}</strong> ({med.dosage}) · Category: {med.category.replace(/_/g, ' ')}
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#334155' }}>
                        Cluster Stock: <strong style={{ color: item.isCritical ? '#dc2626' : '#d97706' }}>{item.totalAvailable} units</strong> (Critical Safety Threshold: {med.criticalThreshold} units)
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button
                        onClick={() => setBroadcastMedicineId(med.id)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '9px 16px', borderRadius: 8, background: '#dc2626',
                          color: '#fff', border: 'none', fontWeight: 700, fontSize: 13,
                          cursor: 'pointer', boxShadow: '0 2px 6px rgba(220,38,38,0.25)',
                        }}
                      >
                        <Radio style={{ width: 15, height: 15 }} />
                        Broadcast Alert
                      </button>
                    </div>
                  </div>

                  {/* Redistribution Matrix */}
                  <div style={{
                    marginTop: 18, paddingTop: 16, borderTop: '1px solid #f1f5f9',
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14,
                  }}>
                    {/* Deficit Facilities */}
                    <div style={{ background: '#fef2f2', padding: 14, borderRadius: 10, border: '1px solid #fecaca' }}>
                      <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 800, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        🚨 Deficit Facilities ({item.deficitFacilities.length})
                      </p>
                      {item.deficitFacilities.length === 0 ? (
                        <p style={{ margin: 0, fontSize: 12, color: '#991b1b' }}>No facility in severe deficit.</p>
                      ) : (
                        <div style={{ display: 'grid', gap: 6 }}>
                          {item.deficitFacilities.map(f => (
                            <div key={f.sourceId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#7f1d1d' }}>
                              <span>{f.sourceName}</span>
                              <strong style={{ color: '#dc2626' }}>{f.quantity} units left</strong>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Surplus Facilities */}
                    <div style={{ background: '#f0fdf4', padding: 14, borderRadius: 10, border: '1px solid #bbf7d0' }}>
                      <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        📦 Surplus Stock Potential Sources ({item.surplusFacilities.length})
                      </p>
                      {item.surplusFacilities.length === 0 ? (
                        <p style={{ margin: 0, fontSize: 12, color: '#166534' }}>No facility currently holds excess surplus.</p>
                      ) : (
                        <div style={{ display: 'grid', gap: 6 }}>
                          {item.surplusFacilities.map(f => (
                            <div key={f.sourceId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#14532d' }}>
                              <span>{f.sourceName}</span>
                              <strong style={{ color: '#059669' }}>{f.quantity} units available</strong>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Broadcast Modal */}
        {broadcastMedicineId && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
          }}>
            <div style={{
              background: '#fff', borderRadius: 16, maxWidth: 480, width: '100%',
              padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', position: 'relative',
            }}>
              <button
                onClick={() => setBroadcastMedicineId(null)}
                style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X style={{ width: 20, height: 20 }} />
              </button>
              <h3 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 800, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Radio style={{ width: 20, height: 20 }} />
                Broadcast Emergency Stock Shortage
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>
                This priority push alert will immediately notify pharmacists and hospital inventory controllers in Tisaiyanvilai to confirm reserves or volunteer surplus.
              </p>
              <textarea
                value={broadcastNote}
                onChange={e => setBroadcastNote(e.target.value)}
                placeholder="Optional custom instructions for pharmacies..."
                rows={3}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8,
                  border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box', outline: 'none',
                }}
              />
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  onClick={() => setBroadcastMedicineId(null)}
                  style={{ padding: '8px 16px', borderRadius: 8, background: '#f1f5f9', color: '#334155', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleBroadcast(broadcastMedicineId)}
                  style={{ padding: '8px 18px', borderRadius: 8, background: '#dc2626', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  Send Network Broadcast
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </ConsoleLayout>
  );
};
