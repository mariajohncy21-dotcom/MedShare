import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import {
  AlertOctagon, ArrowLeft, Hospital, Clock, CheckCircle2, XCircle, AlertTriangle,
  Send, ShieldAlert, Check, X, Building2, Package,
} from 'lucide-react';
import { PharmacyEmergencyRequest } from '../../types';

export const PharmacyEmergencyRequestsPage: React.FC = () => {
  const {
    currentUser, pharmacyRequests, inventory, sources,
    acceptPharmacyEmergencyRequest, declinePharmacyEmergencyRequest,
  } = useApp();

  const pharmId = currentUser.sourceId || 'SRC-PHARM-001';
  const pharmSource = sources.find((s) => s.id === pharmId);

  // Filter requests targeting this pharmacy
  const myRequests = useMemo(() => {
    return pharmacyRequests.filter((r) => r.pharmacyId === pharmId);
  }, [pharmacyRequests, pharmId]);

  // Modals state
  const [acceptFullReq, setAcceptFullReq] = useState<PharmacyEmergencyRequest | null>(null);
  const [contributeReq, setContributeReq] = useState<PharmacyEmergencyRequest | null>(null);
  const [contributeQty, setContributeQty] = useState<number>(1);
  const [rejectReq, setRejectReq] = useState<PharmacyEmergencyRequest | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Insufficient stock');
  const [customRejectReason, setCustomRejectReason] = useState<string>('');

  // Helper to find available stock for a request
  const getAvailableQtyForRequest = (medicineId: string, medicineName: string) => {
    const item = inventory.find(
      (i) => i.sourceId === pharmId && (i.medicineId === medicineId || i.medicineName.toLowerCase() === medicineName.toLowerCase())
    );
    return item ? item.quantity : 0;
  };

  const handleFullAcceptSubmit = () => {
    if (!acceptFullReq) return;
    const avail = getAvailableQtyForRequest(acceptFullReq.medicineId, acceptFullReq.medicineName);
    const qtyToContribute = Math.min(acceptFullReq.requestedQuantity, avail);

    acceptPharmacyEmergencyRequest(acceptFullReq.id, qtyToContribute);
    setAcceptFullReq(null);
  };

  const handlePartialAcceptSubmit = () => {
    if (!contributeReq) return;
    if (contributeQty <= 0) {
      alert('Contribution quantity must be greater than 0.');
      return;
    }
    const avail = getAvailableQtyForRequest(contributeReq.medicineId, contributeReq.medicineName);
    if (contributeQty > avail) {
      alert(`Cannot contribute ${contributeQty} units. Your available stock is ${avail}.`);
      return;
    }

    acceptPharmacyEmergencyRequest(contributeReq.id, contributeQty);
    setContributeReq(null);
  };

  const handleRejectSubmit = () => {
    if (!rejectReq) return;
    const finalReason = rejectReason === 'Other' ? customRejectReason.trim() || 'Cannot fulfill emergency request' : rejectReason;

    declinePharmacyEmergencyRequest(rejectReq.id, finalReason);
    setRejectReq(null);
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
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              Hospital Emergency Medicine Requests
            </h1>
            <span style={{
              fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 99,
              background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
            }}>
              {myRequests.filter((r) => r.status === 'PENDING').length} Pending
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            {pharmSource?.name || currentUser.name} · Direct hospital emergency requisitions requiring immediate stock allocation
          </p>
        </div>

        {/* Requests Cards List */}
        {myRequests.length === 0 ? (
          <div style={{
            background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
            padding: '48px 24px', textAlign: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
          }}>
            <AlertOctagon style={{ width: 48, height: 48, color: '#cbd5e1', margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
              No emergency hospital requests
            </h3>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              When nearby hospitals issue urgent medicine requisitions for critical patients, they will appear here in real-time.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {myRequests.map((req) => {
              const avail = getAvailableQtyForRequest(req.medicineId, req.medicineName);
              const isPending = req.status === 'PENDING';
              const isAccepted = req.status === 'ACCEPTED' || req.status === 'PARTIALLY_ACCEPTED';
              const isRejected = req.status === 'REJECTED';

              return (
                <div
                  key={req.id}
                  style={{
                    background: '#fff', borderRadius: 16, border: `1px solid ${isPending ? '#fcd34d' : '#e2e8f0'}`,
                    padding: 22, boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                    display: 'flex', flexDirection: 'column', gap: 16,
                  }}
                >
                  {/* Top Bar: Hospital & Urgency */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: 12, background: '#f0fdf4',
                        border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Hospital style={{ width: 20, height: 20, color: '#16a34a' }} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                          {req.hospitalName}
                        </h3>
                        <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
                          Request ID: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{req.id}</span> · Issued: {req.createdAt || 'Just now'}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 99,
                        background: req.urgency === 'CRITICAL' ? '#fef2f2' : '#fffbeb',
                        color: req.urgency === 'CRITICAL' ? '#dc2626' : '#d97706',
                        border: `1px solid ${req.urgency === 'CRITICAL' ? '#fecaca' : '#fde68a'}`,
                        textTransform: 'uppercase', letterSpacing: '0.04em',
                      }}>
                        ⚡ {req.urgency || 'HIGH'} URGENCY
                      </span>

                      {isPending && (
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 99, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                          PENDING ACTION
                        </span>
                      )}
                      {isAccepted && (
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 99, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                          ACCEPTED ({req.acceptedQuantity || req.requestedQuantity} UNITS)
                        </span>
                      )}
                      {isRejected && (
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 99, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                          REJECTED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div style={{
                    background: '#f8fafc', borderRadius: 12, padding: 16, border: '1px solid #f1f5f9',
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, fontSize: 13,
                  }}>
                    <div>
                      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', display: 'block' }}>
                        Requested Medicine
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                        {req.medicineName}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', display: 'block' }}>
                        Requested Quantity
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#1d4ed8' }}>
                        {req.requestedQuantity} units
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', display: 'block' }}>
                        Your Available Stock
                      </span>
                      <span style={{
                        fontSize: 14, fontWeight: 800,
                        color: avail >= req.requestedQuantity ? '#059669' : avail > 0 ? '#d97706' : '#dc2626',
                      }}>
                        {avail} units {avail < req.requestedQuantity && avail > 0 ? '(Partial Available)' : avail === 0 ? '(Out of Stock)' : ''}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', display: 'block' }}>
                        Patient Requisition Notes
                      </span>
                      <span style={{ color: '#334155', fontWeight: 500 }}>
                        {req.patientName ? `Patient: ${req.patientName}` : 'Urgent Emergency Requirement'}
                      </span>
                    </div>
                  </div>

                  {/* Action Bar for Pending Requests */}
                  {isPending && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                      <button
                        onClick={() => {
                          setRejectReq(req);
                          setRejectReason('Insufficient stock');
                        }}
                        style={{
                          padding: '9px 16px', background: '#fef2f2', color: '#dc2626',
                          fontWeight: 700, fontSize: 13, border: '1px solid #fecaca', borderRadius: 9, cursor: 'pointer',
                        }}
                      >
                        Reject Request
                      </button>

                      {avail < req.requestedQuantity && avail > 0 && (
                        <button
                          onClick={() => {
                            setContributeReq(req);
                            setContributeQty(avail);
                          }}
                          style={{
                            padding: '9px 16px', background: '#fffbeb', color: '#d97706',
                            fontWeight: 700, fontSize: 13, border: '1px solid #fde68a', borderRadius: 9, cursor: 'pointer',
                          }}
                        >
                          Accept Partial ({avail} available)
                        </button>
                      )}

                      <button
                        onClick={() => setAcceptFullReq(req)}
                        disabled={avail === 0}
                        style={{
                          padding: '9px 20px', background: avail === 0 ? '#93c5fd' : '#059669',
                          color: '#fff', fontWeight: 800, fontSize: 13, border: 'none', borderRadius: 9,
                          cursor: avail === 0 ? 'not-allowed' : 'pointer', boxShadow: '0 2px 8px rgba(5,150,105,0.25)',
                        }}
                      >
                        {avail >= req.requestedQuantity ? 'Accept Full Request (20 units)' : 'Accept Available Stock'}
                      </button>
                    </div>
                  )}

                  {/* Rejected Details */}
                  {isRejected && req.rejectionReason && (
                    <div style={{ fontSize: 12, color: '#7f1d1d', background: '#fef2f2', padding: '8px 12px', borderRadius: 8, border: '1px solid #fecaca' }}>
                      <strong>Rejection Reason:</strong> {req.rejectionReason}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

        {/* Accept Full Request Modal */}
        {acceptFullReq && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: '#fff', borderRadius: 16, maxWidth: 460, width: '100%', padding: 24, border: '1px solid #e2e8f0', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>
                Confirm Emergency Request Acceptance
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px', lineHeight: 1.5 }}>
                You are accepting the emergency medicine requisition from <strong>{acceptFullReq.hospitalName}</strong>.
              </p>
              
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Requested Quantity:</span>
                  <span style={{ fontWeight: 800, color: '#0f172a' }}>{acceptFullReq.requestedQuantity} units</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Your Available Stock:</span>
                  <span style={{ fontWeight: 800, color: '#059669' }}>
                    {getAvailableQtyForRequest(acceptFullReq.medicineId, acceptFullReq.medicineName)} units
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px dashed #cbd5e1' }}>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>Quantity to Contribute:</span>
                  <span style={{ fontWeight: 900, color: '#059669', fontSize: 15 }}>
                    {Math.min(acceptFullReq.requestedQuantity, getAvailableQtyForRequest(acceptFullReq.medicineId, acceptFullReq.medicineName))} units
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button onClick={() => setAcceptFullReq(null)} style={{ padding: '9px 16px', background: '#f1f5f9', color: '#475569', fontWeight: 600, fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleFullAcceptSubmit} style={{ padding: '9px 20px', background: '#059669', color: '#fff', fontWeight: 800, fontSize: 13, border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                  Confirm &amp; Allocate Stock
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Accept Partial Request Modal */}
        {contributeReq && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: '#fff', borderRadius: 16, maxWidth: 460, width: '100%', padding: 24, border: '1px solid #e2e8f0', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>
                Partial Request Contribution
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px', lineHeight: 1.5 }}>
                Select the exact stock quantity you wish to contribute to <strong>{contributeReq.hospitalName}</strong>'s request.
              </p>

              <div style={{ background: '#fafbfc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Hospital Requested Quantity:</span>
                  <span style={{ fontWeight: 800, color: '#0f172a' }}>{contributeReq.requestedQuantity} units</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Your Available Stock:</span>
                  <span style={{ fontWeight: 800, color: '#d97706' }}>
                    {getAvailableQtyForRequest(contributeReq.medicineId, contributeReq.medicineName)} units
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Contribution Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  max={getAvailableQtyForRequest(contributeReq.medicineId, contributeReq.medicineName)}
                  value={contributeQty}
                  onChange={(e) => setContributeQty(parseInt(e.target.value, 10) || 0)}
                  style={{ width: '100%', padding: '10px 14px', fontSize: 15, fontWeight: 800, borderRadius: 8, border: '1.5px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
                />
                <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                  Remaining unfulfilled quantity: <strong>{Math.max(0, contributeReq.requestedQuantity - contributeQty)}</strong> units will remain open for Smart Allocation across other verified pharmacies.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button onClick={() => setContributeReq(null)} style={{ padding: '9px 16px', background: '#f1f5f9', color: '#475569', fontWeight: 600, fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handlePartialAcceptSubmit} style={{ padding: '9px 20px', background: '#d97706', color: '#fff', fontWeight: 800, fontSize: 13, border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                  Confirm Partial Contribution ({contributeQty} units)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Request Modal */}
        {rejectReq && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: '#fff', borderRadius: 16, maxWidth: 460, width: '100%', padding: 24, border: '1px solid #e2e8f0', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>
                Reason for Rejection
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px', lineHeight: 1.5 }}>
                Please specify why your pharmacy cannot fulfill <strong>{rejectReq.hospitalName}</strong>'s emergency request.
              </p>

              <div style={{ marginBottom: 16 }}>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: '1.5px solid #cbd5e1', outline: 'none', background: '#fafbfc', marginBottom: 10 }}
                >
                  <option value="Insufficient stock">Insufficient stock</option>
                  <option value="Medicine unavailable">Medicine unavailable</option>
                  <option value="Cannot fulfill emergency request">Cannot fulfill emergency request</option>
                  <option value="Other">Other (Custom reason)</option>
                </select>

                {rejectReason === 'Other' && (
                  <textarea
                    placeholder="Enter rejection reason..."
                    value={customRejectReason}
                    onChange={(e) => setCustomRejectReason(e.target.value)}
                    rows={3}
                    style={{ width: '100%', padding: '10px', fontSize: 13, borderRadius: 8, border: '1.5px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
                  />
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button onClick={() => setRejectReq(null)} style={{ padding: '9px 16px', background: '#f1f5f9', color: '#475569', fontWeight: 600, fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleRejectSubmit} style={{ padding: '9px 20px', background: '#dc2626', color: '#fff', fontWeight: 800, fontSize: 13, border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </ConsoleLayout>
  );
};
