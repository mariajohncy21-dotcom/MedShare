import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import { MedicalSource } from '../../types';
import {
  Building2, Search, ShieldCheck, ShieldAlert, Clock, Phone, MapPin,
  CheckCircle2, XCircle, AlertOctagon, Star, ExternalLink, Package,
  Pause, Play, Trash2, X, Plus
} from 'lucide-react';

export const AdminPharmaciesPage: React.FC = () => {
  const {
    sources, inventory, approveSource, rejectSource, suspendSource,
    reactivateSource, softDeleteSource
  } = useApp();

  const pharmacies = useMemo(() => sources.filter(s => s.type === 'PHARMACY' && !s.isDeleted), [sources]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedPharmacy, setSelectedPharmacy] = useState<MedicalSource | null>(null);
  const [suspendModalId, setSuspendModalId] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  const filteredPharmacies = useMemo(() => {
    return pharmacies.filter(p => {
      const matchStatus = statusFilter === 'ALL' ||
        (statusFilter === 'VERIFIED' && p.isVerified && p.accountStatus === 'ACTIVE') ||
        (statusFilter === 'PENDING' && p.verificationStatus === 'PENDING') ||
        (statusFilter === 'SUSPENDED' && p.accountStatus === 'SUSPENDED');
      const matchSearch = !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone.includes(searchQuery);
      return matchStatus && matchSearch;
    });
  }, [pharmacies, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = pharmacies.length;
    const verified = pharmacies.filter(p => p.isVerified && p.accountStatus === 'ACTIVE').length;
    const pending = pharmacies.filter(p => p.verificationStatus === 'PENDING').length;
    const emergency24x7 = pharmacies.filter(p => p.emergencySupport24x7).length;
    const suspended = pharmacies.filter(p => p.accountStatus === 'SUSPENDED').length;
    return { total, verified, pending, emergency24x7, suspended };
  }, [pharmacies]);

  const getPharmacyInventoryCount = (sourceId: string) => {
    return inventory.filter(i => i.sourceId === sourceId).length;
  };

  const handleConfirmSuspend = () => {
    if (!suspendModalId) return;
    suspendSource(suspendModalId, suspendReason || 'Administrative suspension pending review');
    setSuspendModalId(null);
    setSuspendReason('');
  };

  return (
    <ConsoleLayout>
      <div style={{ padding: '24px 28px', maxWidth: 1300, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Building2 style={{ width: 26, height: 26, color: '#0f766e' }} />
              Pharmacy Network Directory
            </h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              Verified retail pharmacies, 24x7 dispensaries, and distribution depots in Tisaiyanvilai cluster.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 24 }}>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0, fontWeight: 600 }}>Total Pharmacies</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '4px 0 0' }}>{stats.total}</p>
          </div>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #99f6e4', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#0f766e', margin: 0, fontWeight: 600 }}>Active & Verified</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#0f766e', margin: '4px 0 0' }}>{stats.verified}</p>
          </div>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #fed7aa', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#c2410c', margin: 0, fontWeight: 600 }}>24x7 Emergency Units</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#c2410c', margin: '4px 0 0' }}>{stats.emergency24x7}</p>
          </div>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #fde68a', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#d97706', margin: 0, fontWeight: 600 }}>Pending Verification</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#d97706', margin: '4px 0 0' }}>{stats.pending}</p>
          </div>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #fecaca', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#dc2626', margin: 0, fontWeight: 600 }}>Suspended Units</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#dc2626', margin: '4px 0 0' }}>{stats.suspended}</p>
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
              placeholder="Search by pharmacy name, area, registration number, or phone..."
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
              <option value="ALL">All Pharmacies</option>
              <option value="VERIFIED">Verified & Active</option>
              <option value="PENDING">Pending Verification</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>

        {/* Pharmacies Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 18 }}>
          {filteredPharmacies.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', background: '#fff', padding: 40, borderRadius: 14, textAlign: 'center', color: '#94a3b8', border: '1px solid #e2e8f0' }}>
              No pharmacies match the filter criteria.
            </div>
          ) : (
            filteredPharmacies.map(pharm => {
              const invCount = getPharmacyInventoryCount(pharm.id);
              const isSuspended = pharm.accountStatus === 'SUSPENDED';
              const isPending = pharm.verificationStatus === 'PENDING';

              return (
                <div
                  key={pharm.id}
                  style={{
                    background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)', padding: 20,
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 42, height: 42, borderRadius: 10, background: '#f0fdfa',
                          border: '1px solid #ccfbf1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#0f766e', flexShrink: 0,
                        }}>
                          <Building2 style={{ width: 20, height: 20 }} />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: '#0f172a' }}>
                            {pharm.name}
                          </h3>
                          <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#64748b' }}>
                            {pharm.area} · {pharm.city}
                          </p>
                        </div>
                      </div>

                      <span style={{
                        padding: '3px 8px', borderRadius: 99, fontSize: 10.5, fontWeight: 800,
                        background: isSuspended ? '#fef2f2' : isPending ? '#fffbeb' : '#f0fdf4',
                        color: isSuspended ? '#dc2626' : isPending ? '#d97706' : '#166534',
                        border: `1px solid ${isSuspended ? '#fecaca' : isPending ? '#fde68a' : '#bbf7d0'}`,
                        flexShrink: 0,
                      }}>
                        {isSuspended ? 'Suspended' : isPending ? 'Pending' : 'Verified'}
                      </span>
                    </div>

                    <div style={{ fontSize: 12.5, color: '#475569', display: 'grid', gap: 6, margin: '14px 0', borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Phone style={{ width: 13, height: 13, color: '#94a3b8' }} />
                        <span>{pharm.phone}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock style={{ width: 13, height: 13, color: '#94a3b8' }} />
                        <span>{pharm.operatingHours}</span>
                        {pharm.emergencySupport24x7 && (
                          <span style={{ fontSize: 9.5, fontWeight: 800, color: '#c2410c', background: '#ffedd5', padding: '1px 5px', borderRadius: 4 }}>
                            24x7 EMERGENCY
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Package style={{ width: 13, height: 13, color: '#94a3b8' }} />
                        <span><strong>{invCount}</strong> Medicine SKUs in stock</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                        Reg: <span style={{ fontFamily: 'monospace' }}>{pharm.registrationNumber}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: 12, marginTop: 4 }}>
                    <button
                      onClick={() => setSelectedPharmacy(pharm)}
                      style={{
                        padding: '6px 12px', borderRadius: 8, background: '#f8fafc',
                        border: '1px solid #e2e8f0', color: '#334155', fontSize: 12,
                        fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      Inspect Profile
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isPending && (
                        <button
                          onClick={() => approveSource(pharm.id)}
                          style={{
                            padding: '6px 12px', borderRadius: 8, background: '#ecfdf5',
                            border: '1px solid #a7f3d0', color: '#059669', fontSize: 12,
                            fontWeight: 700, cursor: 'pointer',
                          }}
                        >
                          Approve
                        </button>
                      )}
                      {isSuspended ? (
                        <button
                          onClick={() => reactivateSource(pharm.id)}
                          style={{
                            padding: '6px 12px', borderRadius: 8, background: '#eff6ff',
                            border: '1px solid #bfdbfe', color: '#1d4ed8', fontSize: 12,
                            fontWeight: 700, cursor: 'pointer',
                          }}
                        >
                          Reactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => setSuspendModalId(pharm.id)}
                          style={{
                            padding: '6px 12px', borderRadius: 8, background: '#fff1f2',
                            border: '1px solid #fecdd3', color: '#e11d48', fontSize: 12,
                            fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          Suspend
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pharmacy Details Modal */}
        {selectedPharmacy && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
          }}>
            <div style={{
              background: '#fff', borderRadius: 16, maxWidth: 540, width: '100%',
              padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', position: 'relative',
            }}>
              <button
                onClick={() => setSelectedPharmacy(null)}
                style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X style={{ width: 20, height: 20 }} />
              </button>
              <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                Pharmacy Details: {selectedPharmacy.name}
              </h3>
              <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
                <div><strong>Registration:</strong> <span style={{ fontFamily: 'monospace' }}>{selectedPharmacy.registrationNumber}</span></div>
                <div><strong>Owner / Pharmacist:</strong> {selectedPharmacy.ownerName || 'Licensed Partner'}</div>
                <div><strong>Contact Phone:</strong> {selectedPharmacy.phone}</div>
                <div><strong>Email:</strong> {selectedPharmacy.email}</div>
                <div><strong>Address:</strong> {selectedPharmacy.address}, {selectedPharmacy.pincode}</div>
                <div><strong>Operating Hours:</strong> {selectedPharmacy.operatingHours}</div>
                <div><strong>24x7 Emergency Support:</strong> {selectedPharmacy.emergencySupport24x7 ? 'YES' : 'NO'}</div>
                <div><strong>Verification Status:</strong> {selectedPharmacy.verificationStatus}</div>
                <div><strong>GPS Coordinates:</strong> {selectedPharmacy.latitude}, {selectedPharmacy.longitude}</div>
              </div>
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  onClick={() => setSelectedPharmacy(null)}
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

        {/* Suspend Confirmation Modal */}
        {suspendModalId && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
          }}>
            <div style={{
              background: '#fff', borderRadius: 16, maxWidth: 460, width: '100%',
              padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 17, fontWeight: 800, color: '#dc2626' }}>
                Suspend Pharmacy Account
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 14px' }}>
                Suspending this pharmacy will temporarily remove its medicines from public citizen searches and pause inter-facility transfers.
              </p>
              <textarea
                value={suspendReason}
                onChange={e => setSuspendReason(e.target.value)}
                placeholder="Reason for suspension (e.g. Drug license inspection pending, regulatory compliance)..."
                rows={3}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8,
                  border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box', outline: 'none',
                }}
              />
              <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  onClick={() => setSuspendModalId(null)}
                  style={{ padding: '8px 16px', borderRadius: 8, background: '#f1f5f9', color: '#334155', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSuspend}
                  style={{ padding: '8px 18px', borderRadius: 8, background: '#dc2626', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  Confirm Suspension
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </ConsoleLayout>
  );
};
