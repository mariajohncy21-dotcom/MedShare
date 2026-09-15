import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import {
  CalendarCheck, ArrowLeft, Clock, CheckCircle2, AlertTriangle, Eye, X, Check, Search, ShieldCheck,
} from 'lucide-react';
import { Reservation } from '../../types';

export const PharmacyReservationsPage: React.FC = () => {
  const { currentUser, reservations, confirmReservation, completeReservation, cancelReservation, sources } = useApp();

  const pharmId = currentUser.sourceId || 'SRC-PHARM-001';
  const pharmSource = sources.find((s) => s.id === pharmId);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  // Filter reservations associated with this pharmacy
  const myReservations = useMemo(() => {
    return reservations.filter((r) =>
      r.allocationBreakdown?.some((a) => a.sourceId === pharmId) ||
      (r as any).sourceId === pharmId
    );
  }, [reservations, pharmId]);

  const filteredReservations = useMemo(() => {
    return myReservations.filter((r) => {
      const matchesSearch =
        !searchQuery ||
        r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.medicineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.userName && r.userName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [myReservations, searchQuery, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 99, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
            CONFIRMED (15-MIN HOLD)
          </span>
        );
      case 'COLLECTED':
        return (
          <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 99, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
            COLLECTED ✓
          </span>
        );
      case 'EXPIRED':
        return (
          <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 99, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
            EXPIRED
          </span>
        );
      case 'CANCELLED':
        return (
          <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 99, background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}>
            CANCELLED
          </span>
        );
      default:
        return (
          <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 99, background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>
            PENDING
          </span>
        );
    }
  };

  return (
    <ConsoleLayout>
      <div style={{ padding: '24px 28px', maxWidth: 1280, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
        
        {/* Back Link */}
        <div style={{ marginBottom: 16 }}>
          <Link
            to="/pharmacy/dashboard"
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
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
              Pharmacy Patient &amp; Hospital Reservations
            </h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              {pharmSource?.name || currentUser.name} · Real-time 15-minute emergency stock reservation holding desk
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <span style={{
              fontSize: 12, fontWeight: 700, padding: '8px 14px', borderRadius: 10,
              background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0',
            }}>
              Active Passes: <strong>{myReservations.filter((r) => r.status === 'CONFIRMED' || r.status === 'PENDING').length}</strong>
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={{
          background: '#fff', borderRadius: 14, padding: 18,
          border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by Reservation ID, Patient Name, Medicine..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px 9px 36px', fontSize: 13,
                borderRadius: 9, border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ minWidth: 180 }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px', fontSize: 13, fontWeight: 600,
                borderRadius: 9, border: '1px solid #cbd5e1', outline: 'none', background: '#fafbfc',
              }}
            >
              <option value="ALL">All Reservation Statuses</option>
              <option value="CONFIRMED">Active / Confirmed</option>
              <option value="COLLECTED">Collected</option>
              <option value="EXPIRED">Expired</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div style={{
          background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0',
          boxShadow: '0 1px 6px rgba(0,0,0,0.04)', overflow: 'hidden',
        }}>
          {filteredReservations.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <CalendarCheck style={{ width: 48, height: 48, color: '#cbd5e1', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
                No active reservations
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                When citizens or hospitals reserve medicine stock at your pharmacy, their 15-minute QR reservation passes will appear here.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Reservation ID</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Patient / Requester</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Medicine &amp; Qty</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Expiry Time</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Rx Notice</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map((res) => {
                    const isRx = Boolean(res.prescriptionRequired);

                    return (
                      <tr
                        key={res.id}
                        style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s ease' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#fafbfc')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* Reservation ID */}
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#1d4ed8', fontSize: 13 }}>
                            {res.id}
                          </span>
                        </td>

                        {/* Patient Name */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{res.userName || 'Citizen Patient'}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{res.userPhone || 'Phone on file'}</div>
                        </td>

                        {/* Medicine */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{res.medicineName}</div>
                          <div style={{ fontSize: 11, color: '#1e40af', fontWeight: 700 }}>
                            {res.totalQuantity} units reserved
                          </div>
                        </td>

                        {/* Expiry Time */}
                        <td style={{ padding: '14px 16px', color: '#64748b', fontSize: 12 }}>
                          {res.expiresAt ? new Date(res.expiresAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '15 mins hold'}
                        </td>

                        {/* Prescription Notice */}
                        <td style={{ padding: '14px 16px' }}>
                          {isRx ? (
                            <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 99, background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>
                              ⚠️ Rx Required
                            </span>
                          ) : (
                            <span style={{ fontSize: 10, color: '#94a3b8' }}>OTC</span>
                          )}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '14px 16px' }}>
                          {getStatusBadge(res.status)}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <button
                              onClick={() => setSelectedReservation(res)}
                              title="View Full Pass Details"
                              style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '6px 10px', borderRadius: 7, color: '#475569', cursor: 'pointer' }}
                            >
                              <Eye style={{ width: 14, height: 14 }} />
                            </button>

                            {(res.status === 'CONFIRMED' || res.status === 'PENDING') && (
                              <button
                                onClick={() => completeReservation(res.id)}
                                title="Mark Stock Collected"
                                style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '6px 10px', borderRadius: 7, color: '#059669', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                              >
                                Mark Collected
                              </button>
                            )}

                            {(res.status === 'CONFIRMED' || res.status === 'PENDING') && (
                              <button
                                onClick={() => cancelReservation(res.id)}
                                title="Cancel & Release Hold"
                                style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '6px 10px', borderRadius: 7, color: '#dc2626', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
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

        {/* Reservation Detail Modal */}
        {selectedReservation && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: '#fff', borderRadius: 16, maxWidth: 500, width: '100%', padding: 24, border: '1px solid #e2e8f0', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Reservation Pass Details
                  </h3>
                  <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: '#1d4ed8' }}>
                    {selectedReservation.id}
                  </span>
                </div>
                <button onClick={() => setSelectedReservation(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#64748b' }}>
                  <X style={{ width: 18, height: 18 }} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Patient / Customer:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{selectedReservation.userName || 'Citizen Patient'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Contact Phone:</span>
                  <span style={{ fontWeight: 600, color: '#334155' }}>{selectedReservation.userPhone || 'Not provided'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Reserved Medicine:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{selectedReservation.medicineName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Quantity Reserved:</span>
                  <span style={{ fontWeight: 800, color: '#1d4ed8' }}>{selectedReservation.totalQuantity} units</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Reservation Status:</span>
                  <span>{getStatusBadge(selectedReservation.status)}</span>
                </div>
              </div>

              {selectedReservation.prescriptionRequired && (
                <div style={{
                  marginTop: 16, padding: '12px 14px', background: '#fffbeb',
                  borderRadius: 10, border: '1px solid #fde68a', fontSize: 12.5, color: '#92400e',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}>
                  <AlertTriangle style={{ width: 18, height: 18, color: '#d97706', flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <strong style={{ display: 'block', marginBottom: 2 }}>Prescription required for collection.</strong>
                    Please verify that the customer presents a valid, authentic medical prescription before releasing this medicine batch.
                  </div>
                </div>
              )}

              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                {(selectedReservation.status === 'CONFIRMED' || selectedReservation.status === 'PENDING') && (
                  <button
                    onClick={() => { completeReservation(selectedReservation.id); setSelectedReservation(null); }}
                    style={{ padding: '9px 18px', background: '#059669', color: '#fff', fontWeight: 800, fontSize: 13, border: 'none', borderRadius: 8, cursor: 'pointer' }}
                  >
                    Mark Stock Collected
                  </button>
                )}
                <button onClick={() => setSelectedReservation(null)} style={{ padding: '9px 16px', background: '#f1f5f9', color: '#475569', fontWeight: 600, fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </ConsoleLayout>
  );
};
