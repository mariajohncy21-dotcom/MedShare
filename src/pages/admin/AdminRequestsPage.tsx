import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import { EmergencyRequest, UrgencyLevel } from '../../types';
import {
  ClipboardList, AlertOctagon, Search, Clock, CheckCircle2,
  Truck, User, MapPin, Phone, Hospital, Building2, X
} from 'lucide-react';

export const AdminRequestsPage: React.FC = () => {
  const { emergencyRequests, directRequests, updateEmergencyStatus } = useApp();

  const [urgencyFilter, setUrgencyFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReq, setSelectedReq] = useState<EmergencyRequest | null>(null);

  const filteredRequests = useMemo(() => {
    return emergencyRequests.filter(req => {
      const matchUrgency = urgencyFilter === 'ALL' || req.urgency === urgencyFilter;
      const matchStatus = statusFilter === 'ALL' || req.status === statusFilter;
      const matchSearch = !searchQuery ||
        req.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.medicineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.patientPhone.includes(searchQuery);
      return matchUrgency && matchStatus && matchSearch;
    });
  }, [emergencyRequests, urgencyFilter, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = emergencyRequests.length;
    const critical = emergencyRequests.filter(r => r.urgency === 'CRITICAL').length;
    const pending = emergencyRequests.filter(r => r.status === 'PENDING').length;
    const inTransit = emergencyRequests.filter(r => r.status === 'IN_TRANSIT' || r.status === 'ALLOCATED').length;
    const completed = emergencyRequests.filter(r => r.status === 'COMPLETED').length;
    return { total, critical, pending, inTransit, completed };
  }, [emergencyRequests]);

  const getUrgencyBadge = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case 'CRITICAL': return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', label: 'SOS CRITICAL' };
      case 'URGENT': return { bg: '#fffbeb', text: '#d97706', border: '#fde68a', label: 'URGENT' };
      case 'NORMAL': return { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0', label: 'STANDARD' };
    }
  };

  const getStatusBadge = (status: EmergencyRequest['status']) => {
    switch (status) {
      case 'PENDING': return { bg: '#fffbeb', text: '#d97706', label: 'Pending Allocation' };
      case 'ALLOCATED': return { bg: '#eff6ff', text: '#1d4ed8', label: 'Allocated' };
      case 'IN_TRANSIT': return { bg: '#faf5ff', text: '#7c3aed', label: 'In Transit' };
      case 'COMPLETED': return { bg: '#f0fdf4', text: '#166534', label: 'Dispensed / Completed' };
      case 'CANCELLED': return { bg: '#f8fafc', text: '#64748b', label: 'Cancelled' };
    }
  };

  return (
    <ConsoleLayout>
      <div style={{ padding: '24px 28px', maxWidth: 1300, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <ClipboardList style={{ width: 26, height: 26, color: '#d97706' }} />
            Emergency Medicine Requests Command
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            Live monitoring of emergency patient requisitions, ambulance dispatches, and inter-hospital SOS requests.
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 24 }}>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0, fontWeight: 600 }}>Total Requisitions</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '4px 0 0' }}>{stats.total}</p>
          </div>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #fecaca', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#dc2626', margin: 0, fontWeight: 600 }}>SOS Critical Alerts</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#dc2626', margin: '4px 0 0' }}>{stats.critical}</p>
          </div>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #fde68a', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#d97706', margin: 0, fontWeight: 600 }}>Pending Dispatch</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#d97706', margin: '4px 0 0' }}>{stats.pending}</p>
          </div>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #ddd6fe', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#6d28d9', margin: 0, fontWeight: 600 }}>In Transit</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#6d28d9', margin: '4px 0 0' }}>{stats.inTransit}</p>
          </div>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #bbf7d0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#166534', margin: 0, fontWeight: 600 }}>Delivered / Dispensed</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#166534', margin: '4px 0 0' }}>{stats.completed}</p>
          </div>
        </div>

        {/* Filter Controls */}
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
              placeholder="Search by patient name, medicine, or address..."
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
              value={urgencyFilter}
              onChange={e => setUrgencyFilter(e.target.value)}
              style={{
                padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
                background: '#f8fafc', fontSize: 13, fontWeight: 600, color: '#334155',
                outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="ALL">All Urgencies</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="URGENT">Urgent</option>
              <option value="NORMAL">Normal</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
                background: '#f8fafc', fontSize: 13, fontWeight: 600, color: '#334155',
                outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ALLOCATED">Allocated</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        {/* Requests Table */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Request ID / Time</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Patient / Requester</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Medicine & Quantity</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Urgency</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Status</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                      No emergency requests match the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map(req => {
                    const uBadge = getUrgencyBadge(req.urgency);
                    const sBadge = getStatusBadge(req.status);

                    return (
                      <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }} onMouseEnter={e => e.currentTarget.style.background = '#fafafa'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                        <td style={{ padding: '14px 18px' }}>
                          <p style={{ margin: 0, fontWeight: 800, fontSize: 13, fontFamily: 'monospace', color: '#0f172a' }}>
                            {req.id}
                          </p>
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8' }}>
                            {req.createdAt?.slice(0, 10)} {req.createdAt?.slice(11, 16)}
                          </p>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>
                            {req.patientName}
                          </p>
                          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                            {req.patientPhone} · {req.deliveryAddress}
                          </p>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                            {req.medicineName}
                          </div>
                          <div style={{ fontSize: 11.5, color: '#64748b' }}>
                            Qty: <strong style={{ color: '#1d4ed8' }}>{req.quantity} units</strong>
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            padding: '3px 8px', borderRadius: 99,
                            background: uBadge.bg, color: uBadge.text,
                            border: `1px solid ${uBadge.border}`,
                            fontSize: 10.5, fontWeight: 800,
                          }}>
                            {uBadge.label}
                          </span>
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
                            onClick={() => setSelectedReq(req)}
                            style={{
                              padding: '6px 12px', borderRadius: 7,
                              background: '#f8fafc', border: '1px solid #e2e8f0',
                              color: '#334155', fontSize: 12, fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Manage
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

        {/* Request Management Modal */}
        {selectedReq && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
          }}>
            <div style={{
              background: '#fff', borderRadius: 16, maxWidth: 500, width: '100%',
              padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', position: 'relative',
            }}>
              <button
                onClick={() => setSelectedReq(null)}
                style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X style={{ width: 20, height: 20 }} />
              </button>
              <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                Emergency Dispatch: {selectedReq.id}
              </h3>
              <div style={{ display: 'grid', gap: 10, fontSize: 13, background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div><strong>Patient Name:</strong> {selectedReq.patientName}</div>
                <div><strong>Phone Number:</strong> {selectedReq.patientPhone}</div>
                <div><strong>Destination Address:</strong> {selectedReq.deliveryAddress}</div>
                <div><strong>Medicine Needed:</strong> {selectedReq.medicineName} ({selectedReq.quantity} units)</div>
                <div><strong>Urgency Level:</strong> {selectedReq.urgency}</div>
                <div><strong>Current Status:</strong> {selectedReq.status}</div>
                {selectedReq.notes && <div><strong>Clinical Notes:</strong> {selectedReq.notes}</div>}
              </div>

              <div style={{ marginTop: 20 }}>
                <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#475569' }}>
                  Administrative Status Override:
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      updateEmergencyStatus(selectedReq.id, 'IN_TRANSIT');
                      setSelectedReq(null);
                    }}
                    style={{ padding: '7px 14px', borderRadius: 8, background: '#7c3aed', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Set In Transit
                  </button>
                  <button
                    onClick={() => {
                      updateEmergencyStatus(selectedReq.id, 'COMPLETED');
                      setSelectedReq(null);
                    }}
                    style={{ padding: '7px 14px', borderRadius: 8, background: '#059669', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Mark Dispensed
                  </button>
                  <button
                    onClick={() => {
                      updateEmergencyStatus(selectedReq.id, 'CANCELLED');
                      setSelectedReq(null);
                    }}
                    style={{ padding: '7px 14px', borderRadius: 8, background: '#dc2626', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Cancel Requisition
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
