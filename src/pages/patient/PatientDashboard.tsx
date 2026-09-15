import React from 'react';
import { Link } from 'react-router-dom';
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

  const myReservations = reservations.filter(r => r.userId === currentUser.id);
  const activeRes = myReservations.filter(r => r.status === 'CONFIRMED' || r.status === 'PENDING');
  const unreadNotifs = notifications.filter(n => !n.read).length;

  const recentReservations = myReservations.slice(0, 3);

  return (
    <ConsoleLayout>
      <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <HeartPulse style={{ width: 18, height: 18, color: '#1d4ed8' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Welcome back, {currentUser.name?.split(' ')[0] || 'Patient'}
              </h1>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                Every Minute Matters — Find. Match. Reserve. Share.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
          <StatCard label="Active Reservations" value={activeRes.length} icon={CalendarCheck} color="#1d4ed8" bg="#eff6ff" border="#bfdbfe" />
          <StatCard label="Total Reservations" value={myReservations.length} icon={Package} color="#0f766e" bg="#f0fdfa" border="#99f6e4" />
          <StatCard label="Notifications" value={unreadNotifs} icon={Bell} color="#d97706" bg="#fffbeb" border="#fde68a" />
          <StatCard label="Emergency Requests" value={emergencyRequests.length} icon={AlertOctagon} color="#dc2626" bg="#fef2f2" border="#fecaca" />
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 14px' }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            <QuickAction href="/patient/search" label="Find Medicine" desc="Search by name, type or category" icon={Search} color="#1d4ed8" bg="#eff6ff" />
            <QuickAction href="/patient/image-search" label="Search by Image" desc="Identify medicine from a photo" icon={Activity} color="#7c3aed" bg="#f5f3ff" />
            <QuickAction href="/patient/map" label="Live Map" desc="See pharmacies and hospitals near you" icon={Map} color="#0f766e" bg="#f0fdfa" />
            <QuickAction href="/patient/nearby" label="Nearby Sources" desc="Find verified pharmacies & hospitals" icon={MapPin} color="#d97706" bg="#fffbeb" />
            <QuickAction href="/patient/reservations" label="My Reservations" desc="Track and manage your holds" icon={CalendarCheck} color="#059669" bg="#f0fdf4" />
            <QuickAction href="/patient/requests" label="Emergency Requests" desc="Create or track urgent requests" icon={AlertOctagon} color="#dc2626" bg="#fef2f2" />
          </div>
        </div>

        {/* Recent Reservations */}
        {recentReservations.length > 0 && (
          <div style={{
            background: '#fff', borderRadius: 16, padding: '20px 24px',
            border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Recent Reservations</h2>
              <Link to="/patient/reservations" style={{ fontSize: 12.5, color: '#1d4ed8', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                View all <ArrowRight style={{ width: 13, height: 13 }} />
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
