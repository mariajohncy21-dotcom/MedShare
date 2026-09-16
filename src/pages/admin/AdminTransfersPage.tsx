import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import { StockTransfer, TransferStatus } from '../../types';
import {
  ArrowLeftRight, Search, Filter, Clock, CheckCircle2, XCircle,
  Truck, Building2, Hospital, ArrowRight, Package, X
} from 'lucide-react';

export const AdminTransfersPage: React.FC = () => {
  const { transfers, updateTransferStatus } = useApp();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null);

  const filteredTransfers = useMemo(() => {
    return transfers.filter(t => {
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchSearch = !searchQuery ||
        t.medicineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.fromSourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.toSourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [transfers, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = transfers.length;
    const pending = transfers.filter(t => t.status === 'PENDING').length;
    const inTransit = transfers.filter(t => t.status === 'IN_TRANSIT' || t.status === 'APPROVED').length;
    const completed = transfers.filter(t => t.status === 'COMPLETED').length;
    return { total, pending, inTransit, completed };
  }, [transfers]);

  const getStatusBadge = (status: TransferStatus) => {
    switch (status) {
      case 'PENDING': return { bg: '#fffbeb', text: '#d97706', label: 'Pending Approval' };
      case 'APPROVED': return { bg: '#eff6ff', text: '#1d4ed8', label: 'Approved' };
      case 'IN_TRANSIT': return { bg: '#faf5ff', text: '#7c3aed', label: 'In Transit' };
      case 'COMPLETED': return { bg: '#f0fdf4', text: '#166534', label: 'Completed' };
      case 'REJECTED': return { bg: '#fef2f2', text: '#dc2626', label: 'Declined' };
    }
  };

  return (
    <ConsoleLayout>
      <div style={{ padding: '24px 28px', maxWidth: 1300, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <ArrowLeftRight style={{ width: 26, height: 26, color: '#7c3aed' }} />
            Inter-Facility Stock Transfers
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            Logistics oversight for medicine rebalancing, emergency hospital transfers, and courier tracking.
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0, fontWeight: 600 }}>Total Transfers Logged</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '4px 0 0' }}>{stats.total}</p>
          </div>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #fde68a', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#d97706', margin: 0, fontWeight: 600 }}>Pending Approval</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#d97706', margin: '4px 0 0' }}>{stats.pending}</p>
          </div>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #ddd6fe', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#6d28d9', margin: 0, fontWeight: 600 }}>Active In-Transit</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#6d28d9', margin: '4px 0 0' }}>{stats.inTransit}</p>
          </div>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #bbf7d0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#166534', margin: 0, fontWeight: 600 }}>Completed Transfers</p>
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
              placeholder="Search transfer by ID, medicine, source, or recipient..."
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
              <option value="ALL">All Transfer Statuses</option>
              <option value="PENDING">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Declined</option>
            </select>
          </div>
        </div>

        {/* Transfers Table */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Transfer ID</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Medicine & Quantity</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Origin (From)</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Destination (To)</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Status</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransfers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                      No stock transfers match the current filter.
                    </td>
                  </tr>
                ) : (
                  filteredTransfers.map(tr => {
                    const sBadge = getStatusBadge(tr.status);
                    return (
                      <tr key={tr.id} style={{ borderBottom: '1px solid #f1f5f9' }} onMouseEnter={e => e.currentTarget.style.background = '#fafafa'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ fontWeight: 800, fontSize: 13, fontFamily: 'monospace', color: '#7c3aed' }}>
                            {tr.id}
                          </span>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                            {tr.createdAt?.slice(0, 10)}
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>
                            {tr.medicineName}
                          </p>
                          <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#64748b' }}>
                            Qty: <strong style={{ color: '#0f172a' }}>{tr.quantity} units</strong> · Batch: {tr.batchNumber}
                          </p>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                            {tr.fromSourceName}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                            {tr.toSourceName}
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
                            onClick={() => setSelectedTransfer(tr)}
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

        {/* Transfer Management Modal */}
        {selectedTransfer && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
          }}>
            <div style={{
              background: '#fff', borderRadius: 16, maxWidth: 480, width: '100%',
              padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', position: 'relative',
            }}>
              <button
                onClick={() => setSelectedTransfer(null)}
                style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X style={{ width: 20, height: 20 }} />
              </button>
              <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                Stock Transfer Order: {selectedTransfer.id}
              </h3>
              <div style={{ display: 'grid', gap: 10, fontSize: 13, background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div><strong>Medicine:</strong> {selectedTransfer.medicineName} ({selectedTransfer.quantity} units)</div>
                <div><strong>Dispatching Facility:</strong> {selectedTransfer.fromSourceName}</div>
                <div><strong>Receiving Facility:</strong> {selectedTransfer.toSourceName}</div>
                <div><strong>Batch Number:</strong> {selectedTransfer.batchNumber}</div>
                <div><strong>Status:</strong> {selectedTransfer.status}</div>
                <div><strong>Requested At:</strong> {selectedTransfer.createdAt}</div>
                {selectedTransfer.reason && <div><strong>Transfer Justification:</strong> {selectedTransfer.reason}</div>}
              </div>

              <div style={{ marginTop: 20 }}>
                <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#475569' }}>
                  Update Logistics State:
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {selectedTransfer.status === 'PENDING' && (
                    <button
                      onClick={() => {
                        updateTransferStatus(selectedTransfer.id, 'APPROVED');
                        setSelectedTransfer(null);
                      }}
                      style={{ padding: '7px 14px', borderRadius: 8, background: '#1d4ed8', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Approve Transfer
                    </button>
                  )}
                  {selectedTransfer.status === 'APPROVED' && (
                    <button
                      onClick={() => {
                        updateTransferStatus(selectedTransfer.id, 'IN_TRANSIT');
                        setSelectedTransfer(null);
                      }}
                      style={{ padding: '7px 14px', borderRadius: 8, background: '#7c3aed', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Mark Dispatched
                    </button>
                  )}
                  {selectedTransfer.status === 'IN_TRANSIT' && (
                    <button
                      onClick={() => {
                        updateTransferStatus(selectedTransfer.id, 'COMPLETED');
                        setSelectedTransfer(null);
                      }}
                      style={{ padding: '7px 14px', borderRadius: 8, background: '#059669', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Confirm Delivered
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedTransfer(null)}
                    style={{ padding: '7px 14px', borderRadius: 8, background: '#f1f5f9', color: '#334155', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
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
