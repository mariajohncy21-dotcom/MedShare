import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import { Reservation, ReservationStatus } from '../../types';
import {
  CalendarCheck, ArrowLeft, Clock, CheckCircle2, AlertTriangle, Eye,
  X, Check, Search, ShieldCheck, Building2, QrCode,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { bg: string; color: string; border: string }> = {
  PENDING: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  CONFIRMED: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  COLLECTED: { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
  EXPIRED: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  CANCELLED: { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' },
};

export const HospitalReservationsPage: React.FC = () => {
  const { currentUser, reservations, sources, cancelReservation } = useApp();

  const hospId = currentUser.sourceId || 'SRC-HOSP-001';
  const hospSource = sources.find((s) => s.id === hospId);

  // Filter reservations made by this hospital (or containing hospital allocations)
  const hospitalReservations = useMemo(() => {
    return reservations.filter(
      (r) =>
        r.userId === currentUser.id ||
        r.userName === (hospSource?.name || currentUser.name) ||
        r.userName?.toLowerCase().includes('hospital') ||
        true // Institutional view includes all active reservations for tracking
    );
  }, [reservations, currentUser, hospSource]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [showQrModal, setShowQrModal] = useState<Reservation | null>(null);

  const filteredReservations = useMemo(() => {
    return hospitalReservations.filter((res) => {
      const matchesSearch =
        res.id.toLowerCase().includes(search.toLowerCase()) ||
        res.medicineName.toLowerCase().includes(search.toLowerCase()) ||
        res.allocationBreakdown.some((b) => b.sourceName.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || res.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [hospitalReservations, search, statusFilter]);

  const handleCancel = (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this institutional medicine reservation? Reserved stocks will be released back to pharmacies.')) return;
    cancelReservation(id);
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
                Institutional Medicine Reservations
              </h1>
              <span style={{
                fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe',
              }}>
                {hospitalReservations.length} Active Records
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
              {hospSource?.name || currentUser.name} · Real-time pharmacy locks, 15-minute verification tokens, and dispensation tracking
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={{
          background: '#fff', borderRadius: 14, padding: '16px 20px',
          border: '1px solid #e2e8f0', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 14,
        }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260, maxWidth: 380 }}>
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by ID, medicine, or pharmacy node..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px 9px 36px', fontSize: 13,
                border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none',
                background: '#f8fafc',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '7px 10px', fontSize: 12.5, borderRadius: 8,
                border: '1.5px solid #e2e8f0', background: '#fff', outline: 'none',
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Pickup</option>
              <option value="CONFIRMED">Confirmed / Reserved</option>
              <option value="COLLECTED">Dispensed &amp; Collected</option>
              <option value="EXPIRED">Expired (Released)</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Reservations Table */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
          {filteredReservations.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <CalendarCheck style={{ width: 36, height: 36, color: '#cbd5e1', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>No Reservations Found</p>
              <p style={{ fontSize: 13, color: '#64748b', margin: '6px 0 0' }}>
                Perform medicine searches or Smart Allocations to create instant pharmacy reservations.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#fafbfc', borderBottom: '1.5px solid #f1f5f9', textAlign: 'left' }}>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Reservation ID</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Medicine Required</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Quantity</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Target Pharmacies</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Reserved At</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Status</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map((res) => {
                    const st = STATUS_CONFIG[res.status] || STATUS_CONFIG.PENDING;
                    const canCancel = res.status === 'PENDING' || res.status === 'CONFIRMED';

                    return (
                      <tr key={res.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontWeight: 700, color: '#6d28d9' }}>
                          {res.id}
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <p style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>{res.medicineName}</p>
                          <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>Urgency: {res.urgency}</p>
                        </td>

                        <td style={{ padding: '14px 18px', fontWeight: 800, color: '#0f172a' }}>
                          {res.totalQuantity} units
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {res.allocationBreakdown.map((b, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Building2 style={{ width: 13, height: 13, color: '#64748b' }} />
                                <span style={{ fontSize: 12, color: '#1e293b', fontWeight: 600 }}>
                                  {b.sourceName} ({b.quantity}u)
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px', color: '#64748b', fontSize: 12 }}>
                          <div>
                            <span>{new Date(res.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <p style={{ fontSize: 10.5, color: '#94a3b8', margin: '2px 0 0' }}>
                              Exp: {new Date(res.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 99,
                            background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                          }}>
                            {res.status}
                          </span>
                        </td>

                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                            <button
                              onClick={() => setShowQrModal(res)}
                              title="Show Verification QR"
                              style={{
                                padding: '6px 10px', background: '#f5f3ff', border: '1px solid #ddd6fe',
                                borderRadius: 7, cursor: 'pointer', color: '#6d28d9', fontSize: 12, fontWeight: 700,
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                              }}
                            >
                              <QrCode style={{ width: 13, height: 13 }} />
                              QR Code
                            </button>

                            <button
                              onClick={() => setSelectedRes(res)}
                              style={{
                                padding: '6px 9px', background: '#f8fafc', border: '1px solid #e2e8f0',
                                borderRadius: 7, cursor: 'pointer', color: '#475569', fontSize: 12, fontWeight: 600,
                              }}
                            >
                              Details
                            </button>

                            {canCancel && (
                              <button
                                onClick={() => handleCancel(res.id)}
                                style={{
                                  padding: '6px 9px', background: '#fef2f2', border: '1px solid #fecaca',
                                  borderRadius: 7, cursor: 'pointer', color: '#dc2626', fontSize: 12, fontWeight: 700,
                                }}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* QR Modal */}
        {showQrModal && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
            backdropFilter: 'blur(3px)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}>
            <div style={{
              background: '#fff', borderRadius: 20, maxWidth: 400, width: '100%',
              border: '1px solid #e2e8f0', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              overflow: 'hidden', textAlign: 'center', padding: 28,
            }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowQrModal(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X style={{ width: 20, height: 20 }} />
                </button>
              </div>

              <div style={{
                width: 180, height: 180, margin: '10px auto 20px',
                background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: 16,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <QrCode style={{ width: 100, height: 100, color: '#6d28d9' }} />
                <span style={{ fontSize: 10, color: '#64748b', marginTop: 8, fontFamily: 'monospace' }}>
                  {showQrModal.qrToken || showQrModal.id}
                </span>
              </div>

              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                Reservation Token: {showQrModal.id}
              </h3>
              <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 20px' }}>
                Present this token at the pharmacy counter for instant stock verification and release.
              </p>

              <button
                onClick={() => setShowQrModal(null)}
                style={{
                  width: '100%', padding: '10px 0', background: '#6d28d9', color: '#fff',
                  border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {selectedRes && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
            backdropFilter: 'blur(3px)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}>
            <div style={{
              background: '#fff', borderRadius: 18, maxWidth: 500, width: '100%',
              border: '1px solid #e2e8f0', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', overflow: 'hidden',
            }}>
              <div style={{
                padding: '16px 20px', borderBottom: '1.5px solid #f1f5f9', background: '#fafbfc',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Reservation Breakdown: {selectedRes.id}
                </h3>
                <button
                  onClick={() => setSelectedRes(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X style={{ width: 18, height: 18 }} />
                </button>
              </div>

              <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                    {selectedRes.medicineName} · {selectedRes.totalQuantity} Units
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                    Status: <strong style={{ color: '#6d28d9' }}>{selectedRes.status}</strong> · Urgency: {selectedRes.urgency}
                  </p>
                </div>

                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#475569', margin: '6px 0 0' }}>
                  Allocated Pharmacy Pickups:
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedRes.allocationBreakdown.map((item, idx) => (
                    <div key={idx} style={{
                      padding: '10px 14px', borderRadius: 8, background: '#fff',
                      border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', margin: 0 }}>{item.sourceName}</p>
                        <p style={{ fontSize: 11.5, color: '#64748b', margin: '2px 0 0' }}>{item.address} · {item.phone}</p>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#6d28d9', background: '#f5f3ff', padding: '3px 8px', borderRadius: 6 }}>
                        {item.quantity} units
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ textAlign: 'right', marginTop: 10 }}>
                  <button
                    onClick={() => setSelectedRes(null)}
                    style={{ padding: '8px 18px', background: '#6d28d9', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ConsoleLayout>
  );
};
