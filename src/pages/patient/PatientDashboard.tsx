import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import {
  Search, Map, CalendarCheck, AlertOctagon, Bell, Activity,
  ArrowRight, Package, Clock, CheckCircle2, MapPin, HeartPulse,
} from 'lucide-react';

const StatCard: React.FC<{
  label: string; value: string | number; icon: React.ElementType;
  color: string; bg: string; border: string;
}> = ({ label, value, icon: Icon, color, bg, border }) => (
  <div style={{
    background: '#fff', borderRadius: 14, padding: '20px',
    border: `1px solid ${border}`, boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
    display: 'flex', alignItems: 'center', gap: 14,
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
      background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon style={{ width: 20, height: 20, color }} />
    </div>
    <div>
      <p style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0', fontWeight: 500 }}>{label}</p>
    </div>
  </div>
);

const QuickAction: React.FC<{
  href: string; label: string; desc: string; icon: React.ElementType;
  color: string; bg: string;
}> = ({ href, label, desc, icon: Icon, color, bg }) => (
  <Link to={href} style={{
    background: '#fff', borderRadius: 14, padding: '20px',
    border: '1px solid #e2e8f0', textDecoration: 'none',
    display: 'flex', alignItems: 'center', gap: 14,
    transition: 'all 0.15s ease', boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
  }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
  >
    <div style={{
      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
      background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon style={{ width: 20, height: 20, color }} />
    </div>
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>{label}</p>
      <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>{desc}</p>
    </div>
    <ArrowRight style={{ width: 16, height: 16, color: '#94a3b8' }} />
  </Link>
);

export const PatientDashboard: React.FC = () => {
  const { currentUser, reservations, emergencyRequests, notifications } = useApp();
  const { t } = useTranslation();

  const currentUserId = currentUser?.id || '';
  const myReservations = (reservations || []).filter(r => currentUserId && r.userId === currentUserId);
  const activeRes = myReservations.filter(r => r.status === 'CONFIRMED' || r.status === 'PENDING');
  const unreadNotifs = (notifications || []).filter(n => !n.read).length;
  const safeEmergencyRequests = emergencyRequests || [];

  const recentReservations = myReservations.slice(0, 3);

  // Aggregate user's frequently reserved medicines
  const medCounts = myReservations.reduce((acc, r) => {
    const key = r.medicineName;
    if (!acc[key]) {
      acc[key] = {
        name: r.medicineName,
        count: 0,
        lastReserved: r.createdAt,
        medicineId: r.medicineId,
        requiresPrescription: Boolean(r.prescriptionRequired),
      };
    }
    acc[key].count += 1;
    return acc;
  }, {} as Record<string, { name: string; count: number; lastReserved: string; medicineId: string; requiresPrescription: boolean }>);

  const userFrequentMedicines = Object.values(medCounts).sort((a, b) => b.count - a.count);

  const popularDefaults = [
    { name: 'Metformin 500mg', category: 'Diabetes Care', rx: true, count: 0 },
    { name: 'Paracetamol 650mg', category: 'Fever & Pain', rx: false, count: 0 },
    { name: 'Amlodipine 5mg', category: 'Cardiovascular / BP', rx: true, count: 0 },
    { name: 'Pantoprazole 40mg', category: 'Antacid / Gastric', rx: false, count: 0 },
  ];

  return (
    <ConsoleLayout>
      <div className="console-page-container" style={{ maxWidth: 1100 }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <HeartPulse style={{ width: 18, height: 18, color: '#1d4ed8' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {t('patient.welcome')}, {currentUser?.name ? currentUser.name.split(' ')[0] : 'Patient'}
              </h1>
              <p style={{ fontSize: 12.5, color: '#64748b', margin: 0 }}>
                {t('patient.tagline')}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-7">
          <StatCard label={t('patient.activeHoldsCount')} value={activeRes.length} icon={CalendarCheck} color="#1d4ed8" bg="#eff6ff" border="#bfdbfe" />
          <StatCard label={t('patient.myReservations')} value={myReservations.length} icon={Package} color="#0f766e" bg="#f0fdfa" border="#99f6e4" />
          <StatCard label={t('navigation.notifications')} value={unreadNotifs} icon={Bell} color="#d97706" bg="#fffbeb" border="#fde68a" />
          <StatCard label={t('navigation.emergencyRequests')} value={safeEmergencyRequests.length} icon={AlertOctagon} color="#dc2626" bg="#fef2f2" border="#fecaca" />
        </div>

        {/* Frequently Used Medicines Section */}
        <div style={{
          background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
          borderRadius: 16,
          padding: '16px clamp(12px, 3vw, 24px)',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
          marginBottom: 28,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Clock style={{ width: 15, height: 15, color: '#d97706' }} />
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  {t('patient.frequentMedicines', { defaultValue: 'Frequently Used Medicines' })}
                </h2>
                <p style={{ fontSize: 11.5, color: '#64748b', margin: '2px 0 0' }}>
                  {t('patient.frequentMedicinesDesc', { defaultValue: 'Quick 1-click reorder and availability check' })}
                </p>
              </div>
            </div>
            <Link
              to="/patient/search"
              style={{ fontSize: 12.5, color: '#1d4ed8', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              {t('common.search', { defaultValue: 'Search all' })} <ArrowRight style={{ width: 13, height: 13 }} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12 }}>
            {userFrequentMedicines.length > 0 ? (
              userFrequentMedicines.slice(0, 4).map((med, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#fff',
                    borderRadius: 12,
                    padding: '14px 16px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{med.name}</span>
                      {med.requiresPrescription && (
                        <span style={{ fontSize: 10, fontWeight: 700, background: '#fee2e2', color: '#b91c1c', padding: '1px 6px', borderRadius: 4 }}>
                          Rx
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
                      Reserved {med.count} {med.count === 1 ? 'time' : 'times'}
                    </p>
                  </div>
                  <Link
                    to={`/patient/search?q=${encodeURIComponent(med.name)}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '7px 12px',
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: 'none',
                      border: '1px solid #bfdbfe',
                    }}
                  >
                    <Search style={{ width: 12, height: 12 }} /> Quick Reserve
                  </Link>
                </div>
              ))
            ) : (
              popularDefaults.map((med, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#fff',
                    borderRadius: 12,
                    padding: '14px 16px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{med.name}</span>
                      {med.rx && (
                        <span style={{ fontSize: 10, fontWeight: 700, background: '#fee2e2', color: '#b91c1c', padding: '1px 6px', borderRadius: 4 }}>
                          Rx
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
                      {med.category} · Popular
                    </p>
                  </div>
                  <Link
                    to={`/patient/search?q=${encodeURIComponent(med.name.split(' ')[0])}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '7px 12px',
                      background: '#f8fafc',
                      color: '#334155',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: 'none',
                      border: '1px solid #cbd5e1',
                    }}
                  >
                    <Search style={{ width: 12, height: 12 }} /> Check Stock
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 14px' }}>{t('patient.quickActions')}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            <QuickAction href="/patient/search" label={t('navigation.findMedicine')} desc={t('patient.findMedicineDesc')} icon={Search} color="#1d4ed8" bg="#eff6ff" />
            <QuickAction href="/patient/image-search" label={t('navigation.imageSearch')} desc={t('patient.photoSearchDesc')} icon={Activity} color="#7c3aed" bg="#f5f3ff" />
            <QuickAction href="/patient/map" label={t('navigation.liveMap')} desc={t('patient.liveMapDesc')} icon={Map} color="#0f766e" bg="#f0fdfa" />
            <QuickAction href="/patient/nearby" label={t('navigation.nearbySources')} desc={t('patient.nearbyPharmacies')} icon={MapPin} color="#d97706" bg="#fffbeb" />
            <QuickAction href="/patient/reservations" label={t('navigation.myReservations')} desc={t('reservations.subtitle')} icon={CalendarCheck} color="#059669" bg="#f0fdf4" />
            <QuickAction href="/patient/requests" label={t('navigation.emergencyRequests')} desc={t('emergencyQueue', { defaultValue: 'Emergency Requests' })} icon={AlertOctagon} color="#dc2626" bg="#fef2f2" />
          </div>
        </div>

        {/* Recent Reservations */}
        {recentReservations.length > 0 && (
          <div style={{
            background: '#fff', borderRadius: 16, padding: '20px 24px',
            border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>{t('patient.recentReservations')}</h2>
              <Link to="/patient/reservations" style={{ fontSize: 12.5, color: '#1d4ed8', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                {t('common.view')} {t('common.all')} <ArrowRight style={{ width: 13, height: 13 }} />
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentReservations.map(res => {
                const isActive = res.status === 'CONFIRMED' || res.status === 'PENDING';
                return (
                  <div key={res.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px', borderRadius: 10,
                    background: isActive ? '#f0fdf4' : '#f8fafc',
                    border: `1px solid ${isActive ? '#bbf7d0' : '#f1f5f9'}`,
                  }}>
                    <div>
                      <p style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', margin: 0 }}>{res.medicineName}</p>
                      <p style={{ fontSize: 11.5, color: '#64748b', margin: '2px 0 0' }}>
                        {res.totalQuantity} units · {res.id}
                      </p>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 99,
                      background: isActive ? '#dcfce7' : '#f1f5f9',
                      color: isActive ? '#166534' : '#475569',
                      border: `1px solid ${isActive ? '#bbf7d0' : '#e2e8f0'}`,
                      textTransform: 'uppercase' as const, letterSpacing: '0.05em',
                    }}>
                      {res.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {recentReservations.length === 0 && (
          <div style={{
            background: '#fff', borderRadius: 16, padding: '40px 24px',
            border: '1px solid #e2e8f0', textAlign: 'center',
          }}>
            <Package style={{ width: 40, height: 40, color: '#cbd5e1', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: '#64748b', margin: '0 0 4px' }}>No reservations yet</p>
            <p style={{ fontSize: 12.5, color: '#94a3b8', margin: '0 0 16px' }}>Search for a medicine to create your first reservation.</p>
            <Link to="/patient/search" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 20px', background: '#1d4ed8', color: '#fff',
              borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 700,
            }}>
              <Search style={{ width: 14, height: 14 }} /> Find Medicine
            </Link>
          </div>
        )}
      </div>
    </ConsoleLayout>
  );
};
