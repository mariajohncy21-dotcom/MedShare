import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import { MedicalSource } from '../../types';
import {
  Hospital, Search, ShieldCheck, ShieldAlert, Phone, MapPin, Clock,
  Package, CheckCircle2, AlertOctagon, HeartPulse, X, ExternalLink
} from 'lucide-react';

export const AdminHospitalsPage: React.FC = () => {
  const {
    sources, inventory, emergencyRequests, approveSource, rejectSource,
    suspendSource, reactivateSource
  } = useApp();

  const hospitals = useMemo(() => sources.filter(s => s.type === 'HOSPITAL' && !s.isDeleted), [sources]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedHospital, setSelectedHospital] = useState<MedicalSource | null>(null);

  const filteredHospitals = useMemo(() => {
    return hospitals.filter(h => {
      const matchStatus = statusFilter === 'ALL' ||
        (statusFilter === 'VERIFIED' && h.isVerified && h.accountStatus === 'ACTIVE') ||
        (statusFilter === 'PENDING' && h.verificationStatus === 'PENDING') ||
        (statusFilter === 'SUSPENDED' && h.accountStatus === 'SUSPENDED');
      const matchSearch = !searchQuery ||
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.phone.includes(searchQuery);
      return matchStatus && matchSearch;
    });
  }, [hospitals, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = hospitals.length;
    const verified = hospitals.filter(h => h.isVerified && h.accountStatus === 'ACTIVE').length;
    const pending = hospitals.filter(h => h.verificationStatus === 'PENDING').length;
    const emergency24x7 = hospitals.filter(h => h.emergencySupport24x7).length;
    const suspended = hospitals.filter(h => h.accountStatus === 'SUSPENDED').length;
    return { total, verified, pending, emergency24x7, suspended };
  }, [hospitals]);

  const getHospitalInventoryCount = (sourceId: string) => {
    return inventory.filter(i => i.sourceId === sourceId).length;
  };

  const getHospitalActiveEmergencyCount = (sourceId: string) => {
    return emergencyRequests.filter(r => r.sourceId === sourceId && (r.status === 'PENDING' || r.status === 'ALLOCATED')).length;
  };

  return (
    <ConsoleLayout>
      <div style={{ padding: '24px 28px', maxWidth: 1300, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Hospital style={{ width: 26, height: 26, color: '#6d28d9' }} />
              Hospital & Trauma Centers Directory
            </h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              Multi-speciality hospitals, emergency trauma wings, and ICUs in Tisaiyanvilai medical cluster.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 24 }}>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0, fontWeight: 600 }}>Total Hospitals</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '4px 0 0' }}>{stats.total}</p>
          </div>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #ddd6fe', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#6d28d9', margin: 0, fontWeight: 600 }}>Active & Verified</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#6d28d9', margin: '4px 0 0' }}>{stats.verified}</p>
          </div>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #fed7aa', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#c2410c', margin: 0, fontWeight: 600 }}>Trauma & Emergency</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#c2410c', margin: '4px 0 0' }}>{stats.emergency24x7}</p>
          </div>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #fde68a', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#d97706', margin: 0, fontWeight: 600 }}>Pending Inspection</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#d97706', margin: '4px 0 0' }}>{stats.pending}</p>
          </div>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #fecaca', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#dc2626', margin: 0, fontWeight: 600 }}>Suspended</p>
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
              placeholder="Search hospital by name, area, or registration..."
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
              <option value="ALL">All Hospitals</option>
              <option value="VERIFIED">Verified & Active</option>
              <option value="PENDING">Pending Inspection</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>

        {/* Hospitals Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 18 }}>
          {filteredHospitals.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', background: '#fff', padding: 40, borderRadius: 14, textAlign: 'center', color: '#94a3b8', border: '1px solid #e2e8f0' }}>
              No hospitals match the filter criteria.
            </div>
          ) : (
            filteredHospitals.map(hosp => {
              const invCount = getHospitalInventoryCount(hosp.id);
              const activeEmergencies = getHospitalActiveEmergencyCount(hosp.id);
              const isSuspended = hosp.accountStatus === 'SUSPENDED';
              const isPending = hosp.verificationStatus === 'PENDING';

              return (
                <div
                  key={hosp.id}
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
                          width: 42, height: 42, borderRadius: 10, background: '#f5f3ff',
                          border: '1px solid #ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#6d28d9', flexShrink: 0,
                        }}>
                          <Hospital style={{ width: 20, height: 20 }} />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: '#0f172a' }}>
                            {hosp.name}
                          </h3>
                          <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#64748b' }}>
                            {hosp.area} · {hosp.city}
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
                        <span>{hosp.phone}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock style={{ width: 13, height: 13, color: '#94a3b8' }} />
                        <span>{hosp.operatingHours}</span>
                        {hosp.emergencySupport24x7 && (
                          <span style={{ fontSize: 9.5, fontWeight: 800, color: '#b91c1c', background: '#fee2e2', padding: '1px 5px', borderRadius: 4 }}>
                            ICU & TRAUMA
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Package style={{ width: 13, height: 13, color: '#94a3b8' }} />
                        <span><strong>{invCount}</strong> Emergency SKUs stocked</span>
                      </div>
                      {activeEmergencies > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626', fontWeight: 700 }}>
                          <AlertOctagon style={{ width: 13, height: 13 }} />
                          <span>{activeEmergencies} Active Emergency Alerts</span>
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                        Reg: <span style={{ fontFamily: 'monospace' }}>{hosp.registrationNumber}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: 12, marginTop: 4 }}>
                    <button
                      onClick={() => setSelectedHospital(hosp)}
                      style={{
                        padding: '6px 12px', borderRadius: 8, background: '#f8fafc',
                        border: '1px solid #e2e8f0', color: '#334155', fontSize: 12,
                        fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      Inspect Facility
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isPending && (
                        <button
                          onClick={() => approveSource(hosp.id)}
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
                          onClick={() => reactivateSource(hosp.id)}
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
                          onClick={() => suspendSource(hosp.id, 'Administrative review')}
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

        {/* Hospital Inspection Modal */}
        {selectedHospital && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
          }}>
            <div style={{
              background: '#fff', borderRadius: 16, maxWidth: 540, width: '100%',
              padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', position: 'relative',
            }}>
              <button
                onClick={() => setSelectedHospital(null)}
                style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X style={{ width: 20, height: 20 }} />
              </button>
              <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                Hospital Inspection Dossier: {selectedHospital.name}
              </h3>
              <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
                <div><strong>Registration Number:</strong> <span style={{ fontFamily: 'monospace' }}>{selectedHospital.registrationNumber}</span></div>
                <div><strong>Chief Medical Officer / Admin:</strong> {selectedHospital.ownerName || 'Dr. In-Charge'}</div>
                <div><strong>Emergency Helpline:</strong> {selectedHospital.phone}</div>
                <div><strong>Email:</strong> {selectedHospital.email}</div>
                <div><strong>Address:</strong> {selectedHospital.address}, {selectedHospital.pincode}</div>
                <div><strong>Trauma / ICU 24x7:</strong> {selectedHospital.emergencySupport24x7 ? 'YES' : 'NO'}</div>
                <div><strong>Verification Status:</strong> {selectedHospital.verificationStatus}</div>
                <div><strong>Account Status:</strong> {selectedHospital.accountStatus}</div>
                <div><strong>Geo Location:</strong> {selectedHospital.latitude}, {selectedHospital.longitude}</div>
              </div>
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  onClick={() => setSelectedHospital(null)}
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

      </div>
    </ConsoleLayout>
  );
};
