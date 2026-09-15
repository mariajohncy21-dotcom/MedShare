import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import { StockTransfer } from '../../types';
import {
  ArrowLeftRight, ArrowLeft, Search, Plus, Filter, Clock, CheckCircle2,
  XCircle, Truck, Building2, Package, X, Check,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { bg: string; color: string; border: string }> = {
  PENDING: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  APPROVED: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  IN_TRANSIT: { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' },
  COMPLETED: { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
  CANCELLED: { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' },
};

export const HospitalTransfersPage: React.FC = () => {
  const { currentUser, transfers, sources, createStockTransfer, updateTransferStatus } = useApp();

  const hospId = currentUser.sourceId || 'SRC-HOSP-001';
  const hospSource = sources.find((s) => s.id === hospId);

  // Transfers involving this hospital as source or destination
  const hospitalTransfers = useMemo(() => {
    return transfers.filter(
      (t) => t.fromSourceId === hospId || t.toSourceId === hospId || true
    );
  }, [transfers, hospId]);

  const otherFacilities = useMemo(() => {
    return sources.filter((s) => s.id !== hospId && !s.isDeleted && s.verificationStatus === 'APPROVED');
  }, [sources, hospId]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null);

  // New Transfer Form
  const [formMedName, setFormMedName] = useState('');
  const [formQty, setFormQty] = useState(25);
  const [formToSourceId, setFormToSourceId] = useState(otherFacilities[0]?.id || '');
  const [formReason, setFormReason] = useState('Critical Institutional Relocation');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filteredTransfers = useMemo(() => {
    return hospitalTransfers.filter((t) => {
      const matchesSearch =
        t.medicineName.toLowerCase().includes(search.toLowerCase()) ||
        t.fromSourceName.toLowerCase().includes(search.toLowerCase()) ||
        t.toSourceName.toLowerCase().includes(search.toLowerCase()) ||
        t.id.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [hospitalTransfers, search, statusFilter]);

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMedName.trim()) {
      alert('Please specify the medicine to transfer.');
      return;
    }
    const destSource = sources.find((s) => s.id === formToSourceId);
    if (!destSource) {
      alert('Please select a valid destination healthcare facility.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newT = createStockTransfer({
        medicineId: `MED-${formMedName.toUpperCase().replace(/\s+/g, '-')}`,
        medicineName: formMedName.trim(),
        quantity: Number(formQty),
        batchNumber: `BT-HOSP-${Date.now().toString().slice(-4)}`,
        expiryDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
        fromSourceId: hospId,
        fromSourceName: hospSource?.name || currentUser.name,
        toSourceId: destSource.id,
        toSourceName: destSource.name,
        reason: 'CRITICAL_SHORTAGE_RELIEF',
        estimatedDeliveryHours: 2,
      });

      setSuccessMsg(`Transfer requisition ${newT.id} initiated to ${destSource.name}!`);
      setShowModal(false);
      setFormMedName('');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch transfer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = (id: string, newStatus: StockTransfer['status']) => {
    updateTransferStatus(id, newStatus);
    setSuccessMsg(`Transfer status updated to ${newStatus}.`);
    setTimeout(() => setSuccessMsg(null), 3000);
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
                Inter-Facility Stock Redistribution &amp; Transfers
              </h1>
              <span style={{
                fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe',
              }}>
                {hospitalTransfers.length} Transfers
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
              {hospSource?.name || currentUser.name} · Surplus medicine redistribution, emergency hospital mutual aid, and logistics tracking
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', background: '#6d28d9', color: '#fff',
              fontSize: 13, fontWeight: 700, borderRadius: 10, border: 'none',
              cursor: 'pointer', boxShadow: '0 4px 14px rgba(109,40,217,0.3)',
            }}
          >
            <Plus style={{ width: 16, height: 16 }} />
            Initiate Transfer
          </button>
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

        {/* Filters */}
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
              placeholder="Search by ID, medicine, source, or destination..."
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
              <option value="PENDING">Pending Approval</option>
              <option value="APPROVED">Approved / Staged</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Transfers Table */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
          {filteredTransfers.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <ArrowLeftRight style={{ width: 36, height: 36, color: '#cbd5e1', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>No Transfers Found</p>
              <p style={{ fontSize: 13, color: '#64748b', margin: '6px 0 16px' }}>
                Relocate surplus inventory to prevent expiry or support neighboring health centers.
              </p>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  padding: '8px 16px', background: '#6d28d9', color: '#fff',
                  fontSize: 12.5, fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer',
                }}
              >
                Initiate Transfer
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#fafbfc', borderBottom: '1.5px solid #f1f5f9', textAlign: 'left' }}>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Transfer ID</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Medicine</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Quantity</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Source Facility</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Destination Facility</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Status</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransfers.map((t) => {
                    const st = STATUS_CONFIG[t.status] || STATUS_CONFIG.PENDING;

                    return (
                      <tr key={t.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontWeight: 700, color: '#6d28d9' }}>
                          {t.id}
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <p style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>{t.medicineName}</p>
                          <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>{t.reason}</p>
                        </td>

                        <td style={{ padding: '14px 18px', fontWeight: 800, color: '#0f172a' }}>
                          {t.quantity} units
                        </td>

                        <td style={{ padding: '14px 18px', color: '#334155' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Building2 style={{ width: 13, height: 13, color: '#64748b' }} />
                            <span>{t.fromSourceName}</span>
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px', color: '#334155' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Building2 style={{ width: 13, height: 13, color: '#6d28d9' }} />
                            <span style={{ fontWeight: 600 }}>{t.toSourceName}</span>
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 99,
                            background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                          }}>
                            {t.status === 'IN_TRANSIT' && <Truck style={{ width: 12, height: 12 }} />}
                            {t.status}
                          </span>
                        </td>

                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                            {t.status === 'PENDING' && (
                              <button
                                onClick={() => handleStatusChange(t.id, 'APPROVED')}
                                style={{
                                  padding: '5px 9px', background: '#eff6ff', border: '1px solid #bfdbfe',
                                  borderRadius: 7, color: '#1d4ed8', fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                                }}
                              >
                                Approve
                              </button>
                            )}

                            {t.status === 'APPROVED' && (
                              <button
                                onClick={() => handleStatusChange(t.id, 'IN_TRANSIT')}
                                style={{
                                  padding: '5px 9px', background: '#f5f3ff', border: '1px solid #ddd6fe',
                                  borderRadius: 7, color: '#6d28d9', fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                                }}
                              >
                                Dispatch
                              </button>
                            )}

                            {t.status === 'IN_TRANSIT' && (
                              <button
                                onClick={() => handleStatusChange(t.id, 'COMPLETED')}
                                style={{
                                  padding: '5px 9px', background: '#ecfdf5', border: '1px solid #a7f3d0',
                                  borderRadius: 7, color: '#059669', fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                                }}
                              >
                                Mark Received
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedTransfer(t)}
                              style={{
                                padding: '5px 9px', background: '#f8fafc', border: '1px solid #e2e8f0',
                                borderRadius: 7, color: '#475569', fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                              }}
                            >
                              Details
                            </button>
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

        {/* Create Transfer Modal */}
        {showModal && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
            backdropFilter: 'blur(3px)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}>
            <div style={{
              background: '#fff', borderRadius: 16, maxWidth: 500, width: '100%',
              border: '1px solid #e2e8f0', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', overflow: 'hidden',
            }}>
              <div style={{
                padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ArrowLeftRight style={{ width: 16, height: 16, color: '#6d28d9' }} />
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Initiate Stock Transfer
                  </h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X style={{ width: 18, height: 18 }} />
                </button>
              </div>

              <form onSubmit={handleCreateTransfer} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>
                    Destination Healthcare Node *
                  </label>
                  <select
                    required
                    value={formToSourceId}
                    onChange={(e) => setFormToSourceId(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none', background: '#fff' }}
                  >
                    {otherFacilities.map((f) => (
                      <option key={f.id} value={f.id}>{f.name} ({f.type} · {f.city})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>
                    Medicine Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paracetamol 500mg, Atorvastatin..."
                    value={formMedName}
                    onChange={(e) => setFormMedName(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>
                    Transfer Quantity (Units) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formQty}
                    onChange={(e) => setFormQty(parseInt(e.target.value, 10) || 1)}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>
                    Transfer Purpose / Reason
                  </label>
                  <select
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none', background: '#fff' }}
                  >
                    <option value="Critical Institutional Relocation">Critical Institutional Relocation</option>
                    <option value="Surplus Redistribution to Avoid Expiry">Surplus Redistribution to Avoid Expiry</option>
                    <option value="Mutual Aid Emergency Supply">Mutual Aid Emergency Supply</option>
                    <option value="Batch Recall Quarantine Transfer">Batch Recall Quarantine Transfer</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{ padding: '8px 14px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12.5, fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{ padding: '8px 18px', background: '#6d28d9', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
                  >
                    {isSubmitting ? 'Dispatching...' : 'Dispatch Transfer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Details Modal */}
        {selectedTransfer && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
            backdropFilter: 'blur(3px)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}>
            <div style={{
              background: '#fff', borderRadius: 16, maxWidth: 440, width: '100%',
              border: '1px solid #e2e8f0', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', overflow: 'hidden',
            }}>
              <div style={{
                padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Transfer Log: {selectedTransfer.id}
                </h3>
                <button
                  onClick={() => setSelectedTransfer(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X style={{ width: 18, height: 18 }} />
                </button>
              </div>

              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
                <div><span style={{ color: '#64748b' }}>Medicine:</span> <strong>{selectedTransfer.medicineName}</strong></div>
                <div><span style={{ color: '#64748b' }}>Quantity:</span> <strong>{selectedTransfer.quantity} units</strong></div>
                <div><span style={{ color: '#64748b' }}>Origin:</span> <strong>{selectedTransfer.fromSourceName}</strong></div>
                <div><span style={{ color: '#64748b' }}>Destination:</span> <strong>{selectedTransfer.toSourceName}</strong></div>
                <div><span style={{ color: '#64748b' }}>Status:</span> <strong>{selectedTransfer.status}</strong></div>
                <div><span style={{ color: '#64748b' }}>Reason:</span> {selectedTransfer.reason}</div>
                <div><span style={{ color: '#64748b' }}>Created:</span> {new Date(selectedTransfer.createdAt).toLocaleString()}</div>

                <div style={{ textAlign: 'right', marginTop: 10 }}>
                  <button
                    onClick={() => setSelectedTransfer(null)}
                    style={{ padding: '8px 16px', background: '#6d28d9', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
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
