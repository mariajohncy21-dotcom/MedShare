import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import { MedicalSource } from '../../types';
import {
  ShieldCheck, ShieldAlert, Clock, CheckCircle2, XCircle, FileText,
  Building2, Hospital, MapPin, Phone, Mail, ExternalLink, X, Eye
} from 'lucide-react';

export const AdminVerificationPage: React.FC = () => {
  const { sources, approveSource, rejectSource, suspendSource, reactivateSource } = useApp();

  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [inspectSource, setInspectSource] = useState<MedicalSource | null>(null);
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const pendingSources = useMemo(() => sources.filter(s => s.verificationStatus === 'PENDING' && !s.isDeleted), [sources]);
  const approvedSources = useMemo(() => sources.filter(s => s.verificationStatus === 'APPROVED' && !s.isDeleted), [sources]);
  const rejectedSources = useMemo(() => sources.filter(s => s.verificationStatus === 'REJECTED' && !s.isDeleted), [sources]);

  const displayedSources = useMemo(() => {
    switch (activeTab) {
      case 'PENDING': return pendingSources;
      case 'APPROVED': return approvedSources;
      case 'REJECTED': return rejectedSources;
      case 'ALL': return sources.filter(s => !s.isDeleted);
    }
  }, [activeTab, pendingSources, approvedSources, rejectedSources, sources]);

  const handleConfirmReject = () => {
    if (!rejectModalId) return;
    rejectSource(rejectModalId, rejectReason || 'Drug license documentation invalid or illegible');
    setRejectModalId(null);
    setRejectReason('');
  };

  return (
    <ConsoleLayout>
      <div style={{ padding: '24px 28px', maxWidth: 1300, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldCheck style={{ width: 26, height: 26, color: '#d97706' }} />
            Facility Verification Queue
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            Inspect official pharmacy licenses, hospital accreditations, and drug regulatory documents.
          </p>
        </div>

        {/* Summary Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
          <div
            onClick={() => setActiveTab('PENDING')}
            style={{
              background: '#fff', padding: '16px 20px', borderRadius: 12,
              border: `1.5px solid ${activeTab === 'PENDING' ? '#d97706' : '#fde68a'}`,
              cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#d97706' }}>Pending Approvals</span>
              <Clock style={{ width: 16, height: 16, color: '#d97706' }} />
            </div>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#d97706', margin: '6px 0 0' }}>{pendingSources.length}</p>
          </div>

          <div
            onClick={() => setActiveTab('APPROVED')}
            style={{
              background: '#fff', padding: '16px 20px', borderRadius: 12,
              border: `1.5px solid ${activeTab === 'APPROVED' ? '#059669' : '#bbf7d0'}`,
              cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>Verified Facilities</span>
              <CheckCircle2 style={{ width: 16, height: 16, color: '#059669' }} />
            </div>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#059669', margin: '6px 0 0' }}>{approvedSources.length}</p>
          </div>

          <div
            onClick={() => setActiveTab('REJECTED')}
            style={{
              background: '#fff', padding: '16px 20px', borderRadius: 12,
              border: `1.5px solid ${activeTab === 'REJECTED' ? '#dc2626' : '#fecaca'}`,
              cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626' }}>Rejected Submissions</span>
              <XCircle style={{ width: 16, height: 16, color: '#dc2626' }} />
            </div>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#dc2626', margin: '6px 0 0' }}>{rejectedSources.length}</p>
          </div>

          <div
            onClick={() => setActiveTab('ALL')}
            style={{
              background: '#fff', padding: '16px 20px', borderRadius: 12,
              border: `1.5px solid ${activeTab === 'ALL' ? '#334155' : '#e2e8f0'}`,
              cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Total Network Nodes</span>
              <Building2 style={{ width: 16, height: 16, color: '#64748b' }} />
            </div>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '6px 0 0' }}>{sources.length}</p>
          </div>
        </div>

        {/* Verification Items List */}
        <div style={{ display: 'grid', gap: 14 }}>
          {displayedSources.length === 0 ? (
            <div style={{ background: '#fff', padding: 48, borderRadius: 14, textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <CheckCircle2 style={{ width: 42, height: 42, color: '#10b981', margin: '0 auto 10px' }} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                No facilities in {activeTab.toLowerCase()} queue
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
                All submitted licenses have been reviewed and adjudicated.
              </p>
            </div>
          ) : (
            displayedSources.map(src => {
              const isPharm = src.type === 'PHARMACY';
              const isPending = src.verificationStatus === 'PENDING';
              const isApproved = src.verificationStatus === 'APPROVED';

              return (
                <div
                  key={src.id}
                  style={{
                    background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0',
                    padding: '20px 24px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: isPharm ? '#f0fdfa' : '#f5f3ff',
                      border: `1px solid ${isPharm ? '#99f6e4' : '#ddd6fe'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isPharm ? '#0f766e' : '#6d28d9', flexShrink: 0,
                    }}>
                      {isPharm ? <Building2 style={{ width: 24, height: 24 }} /> : <Hospital style={{ width: 24, height: 24 }} />}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                          {src.name}
                        </h3>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                          background: isPharm ? '#f0fdfa' : '#f5f3ff',
                          color: isPharm ? '#0f766e' : '#6d28d9',
                        }}>
                          {src.type}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#64748b' }}>
                        Reg: <strong style={{ fontFamily: 'monospace', color: '#334155' }}>{src.registrationNumber}</strong> · Owner: {src.ownerName || 'Licensed Entity'} · {src.area}, {src.city}
                      </p>
                      <p style={{ margin: '3px 0 0', fontSize: 12, color: '#94a3b8' }}>
                        Phone: {src.phone} · Email: {src.email}
                      </p>
                    </div>
                  </div>

                  {/* Right side status & action buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      onClick={() => setInspectSource(src)}
                      style={{
                        padding: '8px 14px', borderRadius: 8, background: '#f8fafc',
                        border: '1px solid #e2e8f0', color: '#334155', fontSize: 12.5,
                        fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      <Eye style={{ width: 14, height: 14 }} />
                      Inspect Documents
                    </button>

                    {isPending && (
                      <>
                        <button
                          onClick={() => approveSource(src.id)}
                          style={{
                            padding: '8px 16px', borderRadius: 8, background: '#059669',
                            color: '#fff', border: 'none', fontSize: 12.5,
                            fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                            boxShadow: '0 2px 6px rgba(5,150,105,0.25)',
                          }}
                        >
                          <CheckCircle2 style={{ width: 14, height: 14 }} />
                          Verify & Approve
                        </button>
                        <button
                          onClick={() => setRejectModalId(src.id)}
                          style={{
                            padding: '8px 14px', borderRadius: 8, background: '#fff1f2',
                            border: '1px solid #fecdd3', color: '#e11d48', fontSize: 12.5,
                            fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {isApproved && (
                      <span style={{
                        padding: '5px 12px', borderRadius: 99, background: '#ecfdf5',
                        color: '#059669', border: '1px solid #a7f3d0', fontSize: 12,
                        fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        <CheckCircle2 style={{ width: 14, height: 14 }} />
                        Verified Active
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Inspection Modal */}
        {inspectSource && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
          }}>
            <div style={{
              background: '#fff', borderRadius: 16, maxWidth: 560, width: '100%',
              padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', position: 'relative',
            }}>
              <button
                onClick={() => setInspectSource(null)}
                style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X style={{ width: 20, height: 20 }} />
              </button>
              <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                Regulatory License Dossier: {inspectSource.name}
              </h3>
              <div style={{ display: 'grid', gap: 10, fontSize: 13, background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div><strong>Registration / License Number:</strong> <span style={{ fontFamily: 'monospace', color: '#1d4ed8' }}>{inspectSource.registrationNumber}</span></div>
                <div><strong>Facility Classification:</strong> {inspectSource.type}</div>
                <div><strong>Registered Owner / Pharmacist:</strong> {inspectSource.ownerName || 'Verified Practitioner'}</div>
                <div><strong>Official Phone:</strong> {inspectSource.phone}</div>
                <div><strong>Official Email:</strong> {inspectSource.email}</div>
                <div><strong>Physical Premises:</strong> {inspectSource.address}, {inspectSource.city}, {inspectSource.pincode}</div>
                <div><strong>Operating Hours:</strong> {inspectSource.operatingHours}</div>
                <div><strong>24x7 Emergency Ready:</strong> {inspectSource.emergencySupport24x7 ? 'YES' : 'NO'}</div>
                <div><strong>Verification Status:</strong> {inspectSource.verificationStatus}</div>
                {inspectSource.rejectionReason && (
                  <div style={{ color: '#dc2626' }}><strong>Rejection Reason:</strong> {inspectSource.rejectionReason}</div>
                )}
              </div>
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                {inspectSource.verificationStatus === 'PENDING' && (
                  <button
                    onClick={() => {
                      approveSource(inspectSource.id);
                      setInspectSource(null);
                    }}
                    style={{
                      padding: '8px 18px', borderRadius: 8, background: '#059669',
                      color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    }}
                  >
                    Verify & Approve
                  </button>
                )}
                <button
                  onClick={() => setInspectSource(null)}
                  style={{
                    padding: '8px 16px', borderRadius: 8,
                    background: '#f1f5f9', color: '#334155', border: 'none',
                    fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {rejectModalId && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
          }}>
            <div style={{
              background: '#fff', borderRadius: 16, maxWidth: 460, width: '100%',
              padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 17, fontWeight: 800, color: '#dc2626' }}>
                Reject Facility Application
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 14px' }}>
                Please specify the compliance reason for rejecting this facility registration.
              </p>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Reason (e.g. Drug license expired, mismatch in physical address, missing pharmacist seal)..."
                rows={3}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8,
                  border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box', outline: 'none',
                }}
              />
              <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  onClick={() => setRejectModalId(null)}
                  style={{ padding: '8px 16px', borderRadius: 8, background: '#f1f5f9', color: '#334155', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReject}
                  style={{ padding: '8px 18px', borderRadius: 8, background: '#dc2626', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
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
