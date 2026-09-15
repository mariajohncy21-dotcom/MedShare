import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import { DirectPharmacyRequest, UrgencyLevel } from '../../types';
import {
  Send, ArrowLeft, Search, Plus, Filter, Clock, CheckCircle2,
  XCircle, AlertTriangle, Building2, Package, X,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { bg: string; color: string; border: string }> = {
  PENDING: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  ACCEPTED: { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
  REJECTED: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  FULFILLED: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  CANCELLED: { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' },
};

export const HospitalRequestsPage: React.FC = () => {
  const { currentUser, directRequests, sources, medicines, sendDirectHospitalRequest, respondToDirectHospitalRequest } = useApp();
  const hospId = currentUser.sourceId || 'SRC-HOSP-001';
  const hospSource = sources.find((s) => s.id === hospId);

  // Pharmacy list for dropdown
  const pharmacies = useMemo(() => {
    return sources.filter((s) => s.type === 'PHARMACY' && s.verificationStatus === 'APPROVED');
  }, [sources]);

  // Requests originated by this hospital
  const myRequests = useMemo(() => {
    return directRequests.filter(
      (r) => r.hospitalId === hospId || r.hospitalName === (hospSource?.name || currentUser.name)
    );
  }, [directRequests, hospId, hospSource, currentUser]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DirectPharmacyRequest | null>(null);

  // New Request Form
  const [formMedicine, setFormMedicine] = useState('');
  const [formDosage, setFormDosage] = useState('');
  const [formQty, setFormQty] = useState(20);
  const [formPharmacyId, setFormPharmacyId] = useState(pharmacies[0]?.id || '');
  const [formUrgency, setFormUrgency] = useState<UrgencyLevel>('URGENT');
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filteredRequests = useMemo(() => {
    return myRequests.filter((req) => {
      const matchesSearch =
        req.medicineName.toLowerCase().includes(search.toLowerCase()) ||
        req.pharmacyName.toLowerCase().includes(search.toLowerCase()) ||
        req.id.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [myRequests, search, statusFilter]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMedicine.trim()) {
      alert('Please specify the required medicine.');
      return;
    }
    const targetPharm = sources.find((s) => s.id === formPharmacyId);
    if (!targetPharm) {
      alert('Please select a target pharmacy.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newReq = sendDirectHospitalRequest({
        hospitalId: hospId,
        hospitalName: hospSource?.name || currentUser.name,
        hospitalPhone: hospSource?.phone || currentUser.phone || '+91 94431 88200',
        hospitalAddress: hospSource?.address || 'Tisaiyanvilai',
        pharmacyId: targetPharm.id,
        pharmacyName: targetPharm.name,
        medicineId: `MED-${Date.now().toString().slice(-5)}`,
        medicineName: formMedicine.trim(),
        requestedQuantity: Number(formQty),
        urgency: formUrgency,
        requiredBy: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        message: formNotes || `Emergency institutional requisition from ${hospSource?.name || 'Hospital'}`,
      });

      setSuccessMsg(`Medicine request ${newReq.id} transmitted to ${targetPharm.name}!`);
      setShowModal(false);
      setFormMedicine('');
      setFormNotes('');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this medicine requisition?')) return;
    respondToDirectHospitalRequest(id, 'REJECTED', undefined, 'Cancelled by requesting hospital');
    setSuccessMsg('Requisition cancelled.');
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
                Pharmacy Medicine Requisitions
              </h1>
              <span style={{
                fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe',
              }}>
                {myRequests.length} Dispatched Requests
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
              {hospSource?.name || currentUser.name} · Direct peer-to-peer medication requests to verified retail and distributor pharmacies
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
            New Requisition
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
              placeholder="Search by medicine, target pharmacy, or ID..."
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
            <Filter style={{ width: 14, height: 14, color: '#64748b' }} />
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
              <option value="ACCEPTED">Accepted / Reserved</option>
              <option value="FULFILLED">Fulfilled</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Requests Table */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
          {filteredRequests.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <Send style={{ width: 36, height: 36, color: '#cbd5e1', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>No Requisitions Found</p>
              <p style={{ fontSize: 13, color: '#64748b', margin: '6px 0 16px' }}>
                {search ? 'No requests match your filter.' : 'Request urgent stock from nearby verified pharmacies when your supply is low.'}
              </p>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  padding: '8px 16px', background: '#6d28d9', color: '#fff',
                  fontSize: 12.5, fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer',
                }}
              >
                Create Requisition
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#fafbfc', borderBottom: '1.5px solid #f1f5f9', textAlign: 'left' }}>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Request ID</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Target Pharmacy</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Medicine Required</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Quantity</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Urgency</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Status</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Timestamp</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((req) => {
                    const st = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;
                    const canCancel = req.status === 'PENDING';

                    return (
                      <tr key={req.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontWeight: 700, color: '#6d28d9' }}>
                          {req.id}
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Building2 style={{ width: 14, height: 14, color: '#64748b' }} />
                            <span style={{ fontWeight: 600, color: '#1e293b' }}>{req.pharmacyName}</span>
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Package style={{ width: 14, height: 14, color: '#6d28d9' }} />
                            <div>
                              <p style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>{req.medicineName}</p>
                              <p style={{ fontSize: 11, color: '#64748b', margin: '1px 0 0' }}>Req: {req.requiredBy}</p>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px', fontWeight: 800, color: '#0f172a' }}>
                          {req.requestedQuantity} units
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 99,
                            background: req.urgency === 'CRITICAL' ? '#fef2f2' : req.urgency === 'URGENT' ? '#fffbeb' : '#f0fdf4',
                            color: req.urgency === 'CRITICAL' ? '#dc2626' : req.urgency === 'URGENT' ? '#d97706' : '#166534',
                          }}>
                            {req.urgency}
                          </span>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 99,
                            background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                          }}>
                            {req.status}
                          </span>
                        </td>

                        <td style={{ padding: '14px 18px', color: '#64748b', fontSize: 12 }}>
                          {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                        </td>

                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                            <button
                              onClick={() => setSelectedRequest(req)}
                              style={{
                                padding: '5px 9px', background: '#f8fafc', border: '1px solid #e2e8f0',
                                borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#475569', cursor: 'pointer',
                              }}
                            >
                              Details
                            </button>
                            {canCancel && (
                              <button
                                onClick={() => handleCancel(req.id)}
                                style={{
                                  padding: '5px 9px', background: '#fef2f2', border: '1px solid #fecaca',
                                  borderRadius: 7, fontSize: 12, fontWeight: 700, color: '#dc2626', cursor: 'pointer',
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

        {/* Create Requisition Modal */}
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
                  <Send style={{ width: 16, height: 16, color: '#6d28d9' }} />
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Create Medicine Requisition
                  </h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X style={{ width: 18, height: 18 }} />
                </button>
              </div>

              <form onSubmit={handleCreate} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>
                    Target Verified Pharmacy *
                  </label>
                  <select
                    required
                    value={formPharmacyId}
                    onChange={(e) => setFormPharmacyId(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none', background: '#fff' }}
                  >
                    {pharmacies.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.address || p.city})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>
                    Required Medicine Name *
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Glyceryl Trinitrate, Ceftriaxone..."
                      value={formMedicine}
                      onChange={(e) => setFormMedicine(e.target.value)}
                      style={{ flex: 1, padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none' }}
                    />
                    <select
                      onChange={(e) => {
                        const med = medicines.find((m) => m.name === e.target.value);
                        if (med) {
                          setFormMedicine(med.name);
                          setFormDosage(med.dosage || '');
                        }
                      }}
                      style={{ padding: '9px 10px', fontSize: 12, border: '1.5px solid #e2e8f0', borderRadius: 8, background: '#fafbfc' }}
                    >
                      <option value="">Catalog...</option>
                      {medicines.map((m) => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Dosage / Strength</label>
                    <input
                      type="text"
                      placeholder="e.g. 500mg, 2ml"
                      value={formDosage}
                      onChange={(e) => setFormDosage(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Quantity (Units) *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formQty}
                      onChange={(e) => setFormQty(parseInt(e.target.value, 10) || 1)}
                      style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Clinical Urgency</label>
                  <select
                    value={formUrgency}
                    onChange={(e: any) => setFormUrgency(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none', background: '#fff' }}
                  >
                    <option value="CRITICAL">Critical (Immediate Ward / ICU Case)</option>
                    <option value="HIGH">High Urgency (Next 2 Hours)</option>
                    <option value="NORMAL">Normal Restock (Same Day)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Clinical Justification / Ward</label>
                  <textarea
                    rows={2}
                    placeholder="Patient condition, admitting doctor, ward bed number..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none' }}
                  />
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
                    {isSubmitting ? 'Transmitting...' : 'Dispatch Requisition'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Details Modal */}
        {selectedRequest && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
            backdropFilter: 'blur(3px)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}>
            <div style={{
              background: '#fff', borderRadius: 16, maxWidth: 460, width: '100%',
              border: '1px solid #e2e8f0', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', overflow: 'hidden',
            }}>
              <div style={{
                padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Requisition Details: {selectedRequest.id}
                </h3>
                <button
                  onClick={() => setSelectedRequest(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X style={{ width: 18, height: 18 }} />
                </button>
              </div>

              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
                <div>
                  <span style={{ color: '#64748b' }}>Medicine:</span>{' '}
                  <strong>{selectedRequest.medicineName}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Target Pharmacy:</span>{' '}
                  <strong>{selectedRequest.pharmacyName}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Quantity Requested:</span>{' '}
                  <strong>{selectedRequest.requestedQuantity} units</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Required By:</span>{' '}
                  <strong>{selectedRequest.requiredBy}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Urgency:</span>{' '}
                  <span style={{ fontWeight: 700, color: selectedRequest.urgency === 'CRITICAL' ? '#dc2626' : '#d97706' }}>
                    {selectedRequest.urgency}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Status:</span>{' '}
                  <span style={{ fontWeight: 800 }}>{selectedRequest.status}</span>
                </div>
                {selectedRequest.message && (
                  <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', margin: '0 0 4px' }}>Requisition Message</p>
                    <p style={{ margin: 0, color: '#1e293b' }}>{selectedRequest.message}</p>
                  </div>
                )}
                {selectedRequest.rejectionReason && (
                  <div style={{ background: '#fef2f2', padding: 10, borderRadius: 8, border: '1px solid #fecaca' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', margin: '0 0 4px' }}>Decline / Note Reason</p>
                    <p style={{ margin: 0, color: '#991b1b' }}>{selectedRequest.rejectionReason}</p>
                  </div>
                )}
                <div style={{ textAlign: 'right', marginTop: 10 }}>
                  <button
                    onClick={() => setSelectedRequest(null)}
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
