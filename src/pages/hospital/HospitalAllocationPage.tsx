import React, { useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import { calculateDistanceKm } from '../../services/smartAllocation';
import {
  Sparkles, ArrowLeft, Search, Building2, CheckCircle2, AlertTriangle,
  Package, MapPin, Check, ArrowRight, ShieldCheck, Clock,
} from 'lucide-react';

export const HospitalAllocationPage: React.FC = () => {
  const { currentUser, sources, inventory, medicines, createReservation } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const hospId = currentUser.sourceId || 'SRC-HOSP-001';
  const hospSource = sources.find((s) => s.id === hospId);

  const hospLat = hospSource?.latitude || 8.4184;
  const hospLng = hospSource?.longitude || 77.8732;

  // Read URL query params if linked from emergency requests
  const searchParams = new URLSearchParams(location.search);
  const initialMed = searchParams.get('med') || 'Paracetamol';
  const initialQty = parseInt(searchParams.get('qty') || '20', 10);

  const [selectedMedName, setSelectedMedName] = useState(initialMed);
  const [requiredQuantity, setRequiredQuantity] = useState(initialQty);
  const [isReserving, setIsReserving] = useState(false);
  const [reservationSuccess, setReservationSuccess] = useState<string | null>(null);

  // Active verified pharmacies with inventory for selected medicine
  const allocationPlan = useMemo(() => {
    const verifiedPharmacies = sources.filter(
      (s) => s.type === 'PHARMACY' && s.verificationStatus === 'APPROVED' && s.accountStatus === 'ACTIVE'
    );

    // Collect available stock per pharmacy for this exact medicine (NO substitutes)
    const sourceCandidates = verifiedPharmacies
      .map((pharm) => {
        const matchingStock = inventory.filter(
          (i) =>
            i.sourceId === pharm.id &&
            i.medicineName.toLowerCase().includes(selectedMedName.toLowerCase().trim())
        );
        const availableQty = matchingStock.reduce((sum, item) => sum + (item.quantity - (item.reservedQuantity || 0)), 0);
        const distanceKm = parseFloat(calculateDistanceKm(hospLat, hospLng, pharm.latitude, pharm.longitude).toFixed(1));

        return {
          source: pharm,
          availableQuantity: Math.max(0, availableQty),
          distanceKm,
          stockItem: matchingStock[0] || null,
        };
      })
      .filter((candidate) => candidate.availableQuantity > 0)
      .sort((a, b) => {
        // Sort primarily by availability descending, then distance ascending
        if (b.availableQuantity !== a.availableQuantity) {
          return b.availableQuantity - a.availableQuantity;
        }
        return a.distanceKm - b.distanceKm;
      });

    // Multi-source greedy distribution algorithm
    let needed = requiredQuantity;
    const allocatedBreakdown: {
      sourceId: string;
      sourceName: string;
      address: string;
      phone: string;
      available: number;
      allocated: number;
      distanceKm: number;
    }[] = [];

    for (const cand of sourceCandidates) {
      if (needed <= 0) break;
      const take = Math.min(cand.availableQuantity, needed);
      if (take > 0) {
        allocatedBreakdown.push({
          sourceId: cand.source.id,
          sourceName: cand.source.name,
          address: `${cand.source.address}, ${cand.source.city}`,
          phone: cand.source.phone || '+91 94431 88200',
          available: cand.availableQuantity,
          allocated: take,
          distanceKm: cand.distanceKm,
        });
        needed -= take;
      }
    }

    const totalAllocated = allocatedBreakdown.reduce((sum, item) => sum + item.allocated, 0);
    const remainingQty = Math.max(0, requiredQuantity - totalAllocated);
    const avgDistance =
      allocatedBreakdown.length > 0
        ? parseFloat((allocatedBreakdown.reduce((sum, i) => sum + i.distanceKm, 0) / allocatedBreakdown.length).toFixed(1))
        : 0;

    return {
      sources: allocatedBreakdown,
      totalRequired: requiredQuantity,
      totalAllocated,
      remainingQuantity: remainingQty,
      sourcesCount: allocatedBreakdown.length,
      averageDistanceKm: avgDistance,
      isFullyFulfilled: remainingQty === 0,
    };
  }, [sources, inventory, selectedMedName, requiredQuantity, hospLat, hospLng]);

  const handleConfirmReservation = () => {
    if (allocationPlan.sources.length === 0) {
      alert('No verified pharmacies currently hold stock for this medicine.');
      return;
    }

    setIsReserving(true);
    try {
      const planPayload: any = {
        id: `PLAN-${Date.now().toString().slice(-6)}`,
        medicineId: `MED-${selectedMedName.toUpperCase().replace(/\s+/g, '-')}`,
        medicineName: selectedMedName,
        requestedQuantity: requiredQuantity,
        fulfilledQuantity: allocationPlan.totalAllocated,
        isFullyFulfilled: allocationPlan.isFullyFulfilled,
        urgency: 'CRITICAL',
        totalDistanceKm: allocationPlan.averageDistanceKm,
        totalSourcesCount: allocationPlan.sourcesCount,
        allocatedSources: allocationPlan.sources.map((s) => ({
          sourceId: s.sourceId,
          sourceName: s.sourceName,
          address: s.address,
          phone: s.phone,
          allocatedQuantity: s.allocated,
          distanceKm: s.distanceKm,
        })),
      };

      const res = createReservation(planPayload, {
        name: hospSource?.name || currentUser.name,
        phone: hospSource?.phone || currentUser.phone || '+91 94431 88200',
      });

      setReservationSuccess(`Smart Allocation Reserved! Reservation ID: ${res.id}`);
      setTimeout(() => {
        navigate('/hospital/reservations');
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to complete allocation reservations.');
      setIsReserving(false);
    }
  };

  return (
    <ConsoleLayout>
      <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
        
        {/* Back Link */}
        <div style={{ marginBottom: 16 }}>
          <Link
            to="/hospital/dashboard"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 600, color: '#475569',
              textDecoration: 'none', background: '#fff', padding: '6px 12px',
              borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <ArrowLeft style={{ width: 14, height: 14 }} />
            Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f5f3ff', color: '#6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Smart Multi-Source Medicine Allocation Engine
              </h1>
              <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
                Algorithmic multi-pharmacy stock distribution (e.g. 5 + 8 + 7 = 20) with proximity routing and 1-click lock
              </p>
            </div>
          </div>
        </div>

        {reservationSuccess && (
          <div style={{
            padding: '14px 18px', background: '#ecfdf5', border: '1px solid #a7f3d0',
            borderRadius: 12, color: '#065f46', fontSize: 13.5, fontWeight: 700,
            marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <CheckCircle2 style={{ width: 18, height: 18, color: '#059669' }} />
            {reservationSuccess}
          </div>
        )}

        {/* Calculation Input Controls */}
        <div style={{
          background: '#fff', borderRadius: 16, padding: '20px 24px',
          border: '1px solid #e2e8f0', marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, alignItems: 'center' }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
                Critical Medicine Required (Exact Match Only)
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  placeholder="e.g. Paracetamol, Glyceryl Trinitrate, Adrenaline..."
                  value={selectedMedName}
                  onChange={(e) => setSelectedMedName(e.target.value)}
                  style={{ flex: 1, padding: '10px 14px', fontSize: 13.5, border: '1.5px solid #e2e8f0', borderRadius: 9, outline: 'none' }}
                />
                <select
                  onChange={(e) => setSelectedMedName(e.target.value)}
                  style={{ padding: '10px 14px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 9, background: '#fafbfc' }}
                >
                  <option value="">Choose Catalog...</option>
                  {medicines.map((m) => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
                Total Quantity Required (Units)
              </label>
              <input
                type="number"
                min="1"
                value={requiredQuantity}
                onChange={(e) => setRequiredQuantity(parseInt(e.target.value, 10) || 1)}
                style={{ width: '100%', padding: '10px 14px', fontSize: 14, fontWeight: 700, border: '1.5px solid #e2e8f0', borderRadius: 9, outline: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* Algorithm Metrics Bar */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24,
        }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, margin: 0 }}>Total Required</p>
            <p style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: '4px 0 0' }}>{allocationPlan.totalRequired}</p>
          </div>

          <div style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, margin: 0 }}>Total Allocated</p>
            <p style={{ fontSize: 22, fontWeight: 900, color: '#6d28d9', margin: '4px 0 0' }}>
              {allocationPlan.totalAllocated}
            </p>
          </div>

          <div style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, margin: 0 }}>Remaining Deficit</p>
            <p style={{ fontSize: 22, fontWeight: 900, color: allocationPlan.remainingQuantity === 0 ? '#059669' : '#dc2626', margin: '4px 0 0' }}>
              {allocationPlan.remainingQuantity}
            </p>
          </div>

          <div style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, margin: 0 }}>Sources Involved</p>
            <p style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: '4px 0 0' }}>
              {allocationPlan.sourcesCount} nodes
            </p>
          </div>

          <div style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, margin: 0 }}>Avg Distance</p>
            <p style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: '4px 0 0' }}>
              {allocationPlan.averageDistanceKm} km
            </p>
          </div>
        </div>

        {/* Breakdown Table */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.03)', marginBottom: 24 }}>
          <div style={{ padding: '16px 22px', borderBottom: '1.5px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package style={{ width: 16, height: 16, color: '#6d28d9' }} />
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Calculated Allocation Breakdown
              </h3>
            </div>
            {allocationPlan.isFullyFulfilled ? (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 99,
                background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0',
              }}>
                <CheckCircle2 style={{ width: 13, height: 13 }} /> 100% Demand Fulfilled
              </span>
            ) : (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 99,
                background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a',
              }}>
                <AlertTriangle style={{ width: 13, height: 13 }} /> Partial Allocation Available
              </span>
            )}
          </div>

          {allocationPlan.sources.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <AlertTriangle style={{ width: 36, height: 36, color: '#f59e0b', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>No Stock Available for {selectedMedName}</p>
              <p style={{ fontSize: 13, color: '#64748b', margin: '6px 0 0' }}>
                None of the verified pharmacies in the network currently carry unreserved units of this medicine.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#fafbfc', borderBottom: '1.5px solid #f1f5f9', textAlign: 'left' }}>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Source Pharmacy</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Distance</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Available Stock</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Smart Allocated</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Share of Demand</th>
                  </tr>
                </thead>
                <tbody>
                  {allocationPlan.sources.map((item, idx) => {
                    const percentage = ((item.allocated / requiredQuantity) * 100).toFixed(0);

                    return (
                      <tr key={item.sourceId} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: 8,
                              background: '#f5f3ff', color: '#6d28d9',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 800, fontSize: 12,
                            }}>
                              #{idx + 1}
                            </div>
                            <div>
                              <p style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>{item.sourceName}</p>
                              <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>{item.address}</p>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>{item.distanceKm} km</span>
                        </td>

                        <td style={{ padding: '14px 18px', color: '#475569', fontWeight: 600 }}>
                          {item.available} units
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            fontSize: 14, fontWeight: 800, color: '#6d28d9',
                            background: '#f5f3ff', padding: '3px 10px', borderRadius: 8,
                          }}>
                            {item.allocated} units
                          </span>
                        </td>

                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <span style={{ fontWeight: 800, color: '#0f172a' }}>{percentage}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Confirm Allocation CTA */}
        {allocationPlan.sources.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
            borderRadius: 16, padding: '24px 28px', border: '1.5px solid #ddd6fe',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 16,
          }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#4c1d95', margin: 0 }}>
                Ready to Lock &amp; Reserve Allocation ({allocationPlan.totalAllocated} units across {allocationPlan.sourcesCount} pharmacies)
              </h3>
              <p style={{ fontSize: 12.5, color: '#6d28d9', margin: '4px 0 0' }}>
                Dispatches reservation QR tokens and holds medicine stocks for 15 minutes across all allocated pharmacy nodes.
              </p>
            </div>

            <button
              onClick={handleConfirmReservation}
              disabled={isReserving}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 24px', background: '#6d28d9', color: '#fff',
                fontSize: 14, fontWeight: 800, borderRadius: 10, border: 'none',
                cursor: isReserving ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(109,40,217,0.35)',
              }}
            >
              {isReserving ? 'Reserving...' : 'Confirm Allocation & Reserve'}
              <ArrowRight style={{ width: 16, height: 16 }} />
            </button>
          </div>
        )}
      </div>
    </ConsoleLayout>
  );
};
