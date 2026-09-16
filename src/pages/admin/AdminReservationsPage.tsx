import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import { Reservation, ReservationStatus } from '../../types';
import {
  CalendarCheck, Search, Filter, Clock, CheckCircle2, XCircle,
  Building2, Phone, MapPin, User, Tag, X
} from 'lucide-react';

export const AdminReservationsPage: React.FC = () => {
  const { reservations, updateReservationStatus } = useApp();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  const filteredReservations = useMemo(() => {
    return reservations.filter(res => {
      const matchStatus = statusFilter === 'ALL' || res.status === statusFilter;
      const matchSearch = !searchQuery ||
        res.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.medicineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.sourceName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [reservations, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = reservations.length;
    const pending = reservations.filter(r => r.status === 'PENDING').length;
    const confirmed = reservations.filter(r => r.status === 'CONFIRMED').length;
    const collected = reservations.filter(r => r.status === 'COLLECTED').length;
    const totalValue = reservations.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
    return { total, pending, confirmed, collected, totalValue };
  }, [reservations]);

  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case 'PENDING': return { bg: '#fffbeb', text: '#d97706', label: 'Hold Active' };
      case 'CONFIRMED': return { bg: '#eff6ff', text: '#1d4ed8', label: 'Confirmed Ready' };
      case 'COLLECTED': return { bg: '#f0fdf4', text: '#166534', label: 'Collected / Paid' };
      case 'EXPIRED': return { bg: '#fef2f2', text: '#dc2626', label: 'Expired' };
      case 'CANCELLED': return { bg: '#f8fafc', text: '#64748b', label: 'Cancelled' };
    }
  };

  return (
    <ConsoleLayout>
      <div style={{ padding: '24px 28px', maxWidth: 1300, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <CalendarCheck style={{ width: 26, height: 26, color: '#1d4ed8' }} />
            Citizen Reservations Oversight
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            Live tracking of reserved medicine holds, pickup compliance, and counter dispensations.
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 24 }}>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0, fontWeight: 600 }}>Total Reservations</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '4px 0 0' }}>{stats.total}</p>
          </div>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #fde68a', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#d97706', margin: 0, fontWeight: 600 }}>Active Hold Window</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#d97706', margin: '4px 0 0' }}>{stats.pending}</p>
          </div>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #bfdbfe', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#1d4ed8', margin: 0, fontWeight: 600 }}>Ready for Pickup</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#1d4ed8', margin: '4px 0 0' }}>{stats.confirmed}</p>
          </div>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #bbf7d0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#166534', margin: 0, fontWeight: 600 }}>Collected Today</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#166534', margin: '4px 0 0' }}>{stats.collected}</p>
          </div>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#475569', margin: 0, fontWeight: 600 }}>Total Value Held</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '4px 0 0' }}>₹{stats.totalValue.toLocaleString()}</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div style={{
          background: '#fff', borderRadius: 14, padding: '14px 18px',
          border: '1px solid #e2e8f0', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: 8, padding: '8px 12px', flex: 1, minWidth: 260,
          }}>
            <Search style={{ width: 16, height: 16, color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by reservation ID, patient name, pharmacy, or medicine..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                border: 'none', background: 'transparent', outline: 'none',
                fontSize: 13, width: '100%', color: '#0f172a',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
                background: '#f8fafc', fontSize: 13, fontWeight: 600, color: '#334155',
                outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="ALL">All Reservation Statuses</option>
              <option value="PENDING">Hold Active</option>
              <option value="CONFIRMED">Ready for Pickup</option>
              <option value="COLLECTED">Collected</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        </div>

        {/* Reservations Table */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Hold ID / Code</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Patient / Citizen</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Medicine Reserved</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Pickup Pharmacy</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Hold Expiry</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Status</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                      No medicine reservations match the current criteria.
                    </td>
                  </tr>
                ) : (
                  filteredReservations.map(res => {
                    const sBadge = getStatusBadge(res.status);
                    return (
                      <tr key={res.id} style={{ borderBottom: '1px solid #f1f5f9' }} onMouseEnter={e => e.currentTarget.style.background = '#fafafa'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ fontWeight: 800, fontSize: 13, fontFamily: 'monospace', color: '#1d4ed8' }}>
                            {res.reservationCode || res.id}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>
                            {res.patientName}
                          </p>
                          <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#64748b' }}>
                            {res.patientPhone}
                          </p>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                            {res.medicineName}
                          </div>
                          <div style={{ fontSize: 11.5, color: '#64748b' }}>
                            Quantity: <strong>{res.quantity} units</strong> · ₹{res.totalPrice || 0}
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Building2 style={{ width: 14, height: 14, color: '#0f766e' }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                              {res.sourceName}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock style={{ width: 13, height: 13, color: '#94a3b8' }} />
                            {res.expiresAt?.slice(11, 16) || '4h window'}
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            padding: '3px 8px', borderRadius: 99,
                            background: sBadge.bg, color: sBadge.text,
                            fontSize: 11, fontWeight: 700,
                          }}>
                            {sBadge.label}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <button
                            onClick={() => setSelectedReservation(res)}
                            style={{
                              padding: '6px 12px', borderRadius: 7,
                              background: '#f8fafc', border: '1px solid #e2e8f0',
                              color: '#334155', fontSize: 12, fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reservation Details Modal */}
        {selectedReservation && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
          }}>
            <div style={{
              background: '#fff', borderRadius: 16, maxWidth: 480, width: '100%',
              padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', position: 'relative',
            }}>
              <button
                onClick={() => setSelectedReservation(null)}
                style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X style={{ width: 20, height: 20 }} />
              </button>
              <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                Hold Reservation Dossier: {selectedReservation.reservationCode || selectedReservation.id}
              </h3>
              <div style={{ display: 'grid', gap: 10, fontSize: 13, background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div><strong>Patient Name:</strong> {selectedReservation.patientName}</div>
                <div><strong>Contact Phone:</strong> {selectedReservation.patientPhone}</div>
                <div><strong>Dispensing Pharmacy:</strong> {selectedReservation.sourceName}</div>
                <div><strong>Medicine:</strong> {selectedReservation.medicineName} ({selectedReservation.quantity} units)</div>
                <div><strong>Total Amount:</strong> ₹{selectedReservation.totalPrice || 0}</div>
                <div><strong>Status:</strong> {selectedReservation.status}</div>
                <div><strong>Expires At:</strong> {selectedReservation.expiresAt}</div>
              </div>

              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                {selectedReservation.status !== 'COLLECTED' && (
                  <button
                    onClick={() => {
                      updateReservationStatus(selectedReservation.id, 'COLLECTED');
                      setSelectedReservation(null);
                    }}
                    style={{ padding: '8px 16px', borderRadius: 8, background: '#059669', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                  >
                    Mark Collected
                  </button>
                )}
                <button
                  onClick={() => setSelectedReservation(null)}
                  style={{ padding: '8px 16px', borderRadius: 8, background: '#f1f5f9', color: '#334155', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
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
