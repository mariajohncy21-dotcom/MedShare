import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import { calculateDistanceKm } from '../../services/smartAllocation';
import {
  Search, MapPin, Building2, ShieldCheck, ArrowLeft, Map,
  CheckCircle2, AlertTriangle, Send, Package, Filter, Navigation,
} from 'lucide-react';

export const HospitalPharmacySearchPage: React.FC = () => {
  const { currentUser, sources, inventory, medicines, sendDirectHospitalRequest } = useApp();
  const navigate = useNavigate();

  const hospId = currentUser.sourceId || 'SRC-HOSP-001';
  const hospSource = sources.find((s) => s.id === hospId);

  // Hospital default location
  const hospLat = hospSource?.latitude || 8.4184;
  const hospLng = hospSource?.longitude || 77.8732;

  const [medicineQuery, setMedicineQuery] = useState('Paracetamol');
  const [selectedRadius, setSelectedRadius] = useState<number>(10); // 2, 5, 10, 25 km
  const [requiredQty, setRequiredQty] = useState<number>(20);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter verified pharmacies with calculated distance
  const pharmacyResults = useMemo(() => {
    const verifiedPharmacies = sources.filter(
      (s) => s.type === 'PHARMACY' && s.verificationStatus === 'APPROVED' && s.accountStatus === 'ACTIVE'
    );

    return verifiedPharmacies
      .map((pharm) => {
        const distKm = calculateDistanceKm(hospLat, hospLng, pharm.latitude, pharm.longitude);

        // Check inventory in this pharmacy for medicineQuery
        const pharmStock = inventory.filter(
          (inv) =>
            inv.sourceId === pharm.id &&
            inv.medicineName.toLowerCase().includes(medicineQuery.toLowerCase().trim())
        );

        const totalAvail = pharmStock.reduce((acc, i) => acc + i.quantity, 0);

        return {
          ...pharm,
          distanceKm: parseFloat(distKm.toFixed(1)),
          stockItems: pharmStock,
          totalAvailable: totalAvail,
          lastUpdated: pharmStock[0]?.updatedAt || 'Recently',
          isAvailable: totalAvail >= requiredQty,
          statusBadge: totalAvail >= requiredQty ? 'GOOD' : totalAvail > 0 ? 'LOW' : 'OUT_OF_STOCK',
        };
      })
      .filter((p) => p.distanceKm <= selectedRadius)
      .sort((a, b) => {
        // Prioritize availability then distance
        if (a.isAvailable && !b.isAvailable) return -1;
        if (!a.isAvailable && b.isAvailable) return 1;
        return a.distanceKm - b.distanceKm;
      });
  }, [sources, inventory, medicineQuery, selectedRadius, requiredQty, hospLat, hospLng]);

  const handleQuickRequest = (pharm: any) => {
    try {
      const req = sendDirectHospitalRequest({
        hospitalId: hospId,
        hospitalName: hospSource?.name || currentUser.name,
        hospitalPhone: hospSource?.phone || currentUser.phone || '+91 94431 88200',
        hospitalAddress: hospSource?.address || 'Tisaiyanvilai',
        pharmacyId: pharm.id,
        pharmacyName: pharm.name,
        medicineId: pharm.stockItems[0]?.medicineId || 'MED-001',
        medicineName: medicineQuery,
        requestedQuantity: requiredQty,
        urgency: 'URGENT',
        requiredBy: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        message: `Hospital urgent procurement via Pharmacy Search (${pharm.distanceKm} km away)`,
      });

      setSuccessMsg(`Procurement request ${req.id} dispatched to ${pharm.name}!`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch request.');
    }
  };

  return (
    <ConsoleLayout>
      <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
        
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
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Nearby Verified Pharmacy Locator &amp; Requisition
              </h1>
              <span style={{
                fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe',
              }}>
                {pharmacyResults.length} In Range
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
              Locate active licensed retail and hospital supplier pharmacies with real-time stock availability
            </p>
          </div>

          <Link
            to="/hospital/pharmacy-search/map"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', background: '#6d28d9', color: '#fff',
              fontSize: 13, fontWeight: 700, borderRadius: 10, textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(109,40,217,0.3)',
            }}
          >
            <Map style={{ width: 16, height: 16 }} />
            View Map &amp; Geo Route
          </Link>
        </div>

        {successMsg && (
          <div style={{
            padding: '12px 16px', background: '#ecfdf5', border: '1px solid #a7f3d0',
            borderRadius: 10, color: '#065f46', fontSize: 13, fontWeight: 600,
            marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <CheckCircle2 style={{ width: 16, height: 16, color: '#059669' }} />
            {successMsg}
          </div>
        )}

        {/* Search & Radius Filter Bar */}
        <div style={{
          background: '#fff', borderRadius: 16, padding: '20px 24px',
          border: '1px solid #e2e8f0', marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16, alignItems: 'center' }}>
            
            {/* Medicine Input */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>
                Required Medicine
              </label>
              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search medicine name..."
                  value={medicineQuery}
                  onChange={(e) => setMedicineQuery(e.target.value)}
                  style={{
                    width: '100%', padding: '9px 12px 9px 36px', fontSize: 13.5,
                    border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>
                Quantity Needed
              </label>
              <input
                type="number"
                min="1"
                value={requiredQty}
                onChange={(e) => setRequiredQty(parseInt(e.target.value, 10) || 1)}
                style={{
                  width: '100%', padding: '9px 12px', fontSize: 13.5,
                  border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none',
                }}
              />
            </div>

            {/* Radius Options */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>
                Search Radius
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[2, 5, 10, 25].map((rad) => (
                  <button
                    key={rad}
                    onClick={() => setSelectedRadius(rad)}
                    style={{
                      flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 700,
                      borderRadius: 8, cursor: 'pointer',
                      border: selectedRadius === rad ? '1.5px solid #6d28d9' : '1.5px solid #e2e8f0',
                      background: selectedRadius === rad ? '#f5f3ff' : '#fff',
                      color: selectedRadius === rad ? '#6d28d9' : '#475569',
                    }}
                  >
                    {rad} km
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {pharmacyResults.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 16, padding: 48, textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <Building2 style={{ width: 36, height: 36, color: '#cbd5e1', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>No Pharmacies Found Within {selectedRadius} km</p>
              <p style={{ fontSize: 13, color: '#64748b', margin: '6px 0 16px' }}>
                Try expanding your search radius to 25 km or adjusting the medicine search keyword.
              </p>
              <button
                onClick={() => setSelectedRadius(25)}
                style={{ padding: '8px 16px', background: '#6d28d9', color: '#fff', fontSize: 12.5, fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer' }}
              >
                Expand Radius to 25 km
              </button>
            </div>
          ) : (
            pharmacyResults.map((pharm) => {
              const isGood = pharm.statusBadge === 'GOOD';
              const isLow = pharm.statusBadge === 'LOW';

              return (
                <div
                  key={pharm.id}
                  style={{
                    background: '#fff', borderRadius: 16, padding: '20px 24px',
                    border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: '#f5f3ff', color: '#6d28d9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Building2 style={{ width: 22, height: 22 }} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                          {pharm.name}
                        </h3>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 99,
                          background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0',
                        }}>
                          <ShieldCheck style={{ width: 12, height: 12 }} /> Verified
                        </span>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                          background: '#f1f5f9', color: '#475569',
                        }}>
                          {pharm.distanceKm} km away
                        </span>
                      </div>

                      <p style={{ fontSize: 12.5, color: '#64748b', margin: '4px 0 8px' }}>
                        <MapPin style={{ width: 12, height: 12, display: 'inline', marginRight: 4 }} />
                        {pharm.address}, {pharm.city} · Ph: {pharm.phone || 'N/A'}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Package style={{ width: 14, height: 14, color: '#6d28d9' }} />
                          <span style={{ fontSize: 12.5, color: '#1e293b' }}>
                            {medicineQuery}:{' '}
                            <strong style={{ color: isGood ? '#059669' : isLow ? '#d97706' : '#dc2626' }}>
                              {pharm.totalAvailable} units in stock
                            </strong>
                          </span>
                        </div>

                        <span style={{
                          fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 99,
                          background: isGood ? '#ecfdf5' : isLow ? '#fffbeb' : '#fef2f2',
                          color: isGood ? '#059669' : isLow ? '#d97706' : '#dc2626',
                          border: `1px solid ${isGood ? '#a7f3d0' : isLow ? '#fde68a' : '#fecaca'}`,
                        }}>
                          {isGood ? 'Adequate for Order' : isLow ? 'Partial Stock' : 'Out of Stock'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Link
                      to={`/hospital/pharmacy-search/map?target=${pharm.id}`}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '9px 14px', background: '#f8fafc', color: '#475569',
                        border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 12.5,
                        fontWeight: 600, textDecoration: 'none',
                      }}
                    >
                      <Navigation style={{ width: 14, height: 14, color: '#6d28d9' }} />
                      View on Map
                    </Link>

                    <button
                      onClick={() => handleQuickRequest(pharm)}
                      disabled={pharm.totalAvailable === 0}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '9px 16px',
                        background: pharm.totalAvailable > 0 ? '#6d28d9' : '#cbd5e1',
                        color: '#fff', border: 'none', borderRadius: 9,
                        fontSize: 12.5, fontWeight: 700,
                        cursor: pharm.totalAvailable > 0 ? 'pointer' : 'not-allowed',
                        boxShadow: pharm.totalAvailable > 0 ? '0 2px 8px rgba(109,40,217,0.25)' : 'none',
                      }}
                    >
                      <Send style={{ width: 14, height: 14 }} />
                      Request Medicine
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </ConsoleLayout>
  );
};
