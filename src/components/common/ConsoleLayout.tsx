import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  HeartPulse, LayoutDashboard, Package, Plus, Upload, ClipboardList,
  AlertOctagon, BookOpen, ArrowLeftRight, Bell, User, Settings, LogOut,
  ChevronLeft, ChevronRight, Menu, Users, Building2, Hospital,
  ShieldCheck, FileText, Activity, Search, Map, Stethoscope,
  CalendarCheck, Boxes, Send, RefreshCw, BarChart2, Globe
} from 'lucide-react';
import { UserRole } from '../../types';
import { NotificationDropdown } from './NotificationDropdown';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

// ─── Sidebar nav definitions by role (Dynamic i18n) ───────────────────────────
const getNavItems = (t: (key: string) => string): Record<UserRole, { label: string; href: string; icon: React.ElementType; badge?: string }[]> => ({
  PATIENT: [
    { label: t('navigation.dashboard'), href: '/patient/dashboard', icon: LayoutDashboard },
    { label: t('navigation.findMedicine'), href: '/patient/search', icon: Search },
    { label: t('navigation.imageSearch'), href: '/patient/image-search', icon: Activity },
    { label: t('navigation.nearbySources'), href: '/patient/nearby', icon: Building2 },
    { label: t('navigation.liveMap'), href: '/patient/map', icon: Map },
    { label: t('navigation.myReservations'), href: '/patient/reservations', icon: CalendarCheck },
    { label: t('navigation.myRequests'), href: '/patient/requests', icon: ClipboardList },
    { label: t('navigation.notifications'), href: '/patient/notifications', icon: Bell },
    { label: t('navigation.profile'), href: '/patient/profile', icon: User },
    { label: t('navigation.settings'), href: '/patient/settings', icon: Settings },
  ],
  PHARMACY: [
    { label: t('navigation.dashboard'), href: '/pharmacy/dashboard', icon: LayoutDashboard },
    { label: t('navigation.inventory'), href: '/pharmacy/inventory', icon: Package },
    { label: t('navigation.addMedicine'), href: '/pharmacy/inventory/add', icon: Plus },
    { label: t('navigation.updateStock'), href: '/pharmacy/inventory/update', icon: RefreshCw },
    { label: t('navigation.bulkUpload'), href: '/pharmacy/inventory/bulk-upload', icon: Upload },
    { label: t('navigation.stockHistory'), href: '/pharmacy/inventory/history', icon: FileText },
    { label: t('navigation.emergencyRequests'), href: '/pharmacy/emergency-requests', icon: AlertOctagon, badge: 'REQUESTS' },
    { label: t('navigation.reservations'), href: '/pharmacy/reservations', icon: CalendarCheck },
    { label: t('navigation.dailyReports'), href: '/pharmacy/daily-reports', icon: ClipboardList },
    { label: t('navigation.notifications'), href: '/pharmacy/notifications', icon: Bell },
    { label: t('navigation.pharmacyProfile'), href: '/pharmacy/profile', icon: Building2 },
    { label: t('navigation.settings'), href: '/pharmacy/settings', icon: Settings },
  ],
  HOSPITAL: [
    { label: t('navigation.dashboard'), href: '/hospital/dashboard', icon: LayoutDashboard },
    { label: t('navigation.patients'), href: '/hospital/patients', icon: Stethoscope },
    { label: t('navigation.inventory'), href: '/hospital/inventory', icon: Package },
    { label: t('navigation.addMedicine'), href: '/hospital/inventory/add', icon: Plus },
    { label: t('navigation.bulkUpload'), href: '/hospital/inventory/bulk-upload', icon: Upload },
    { label: t('navigation.stockHistory'), href: '/hospital/inventory/history', icon: FileText },
    { label: t('navigation.requests'), href: '/hospital/requests', icon: Send },
    { label: t('navigation.pharmacySearch'), href: '/hospital/pharmacy-search', icon: Search },
    { label: t('navigation.emergencyRequests'), href: '/hospital/emergency-requests', icon: AlertOctagon, badge: 'EMERGENCY' },
    { label: t('navigation.smartAllocation'), href: '/hospital/allocation', icon: Activity },
    { label: t('navigation.reservations'), href: '/hospital/reservations', icon: CalendarCheck },
    { label: t('navigation.transfers'), href: '/hospital/transfers', icon: ArrowLeftRight },
    { label: t('navigation.dailyReports'), href: '/hospital/daily-reports', icon: ClipboardList },
    { label: t('navigation.notifications'), href: '/hospital/notifications', icon: Bell },
    { label: t('navigation.hospitalProfile'), href: '/hospital/profile', icon: Hospital },
    { label: t('navigation.settings'), href: '/hospital/settings', icon: Settings },
  ],
  ADMIN: [
    { label: t('navigation.dashboard'), href: '/admin/dashboard', icon: LayoutDashboard },
    { label: t('navigation.users'), href: '/admin/users', icon: Users },
    { label: t('navigation.pharmacies'), href: '/admin/pharmacies', icon: Building2 },
    { label: t('navigation.hospitals'), href: '/admin/hospitals', icon: Hospital },
    { label: t('navigation.verification'), href: '/admin/verification', icon: ShieldCheck, badge: 'VERIFY' },
    { label: t('navigation.medicineCatalog'), href: '/admin/medicines', icon: BookOpen },
    { label: t('navigation.inventoryMonitor'), href: '/admin/inventory', icon: Boxes },
    { label: t('navigation.shortageMonitor'), href: '/admin/shortages', icon: AlertOctagon },
    { label: t('navigation.medicineRequests'), href: '/admin/requests', icon: ClipboardList },
    { label: t('navigation.reservations'), href: '/admin/reservations', icon: CalendarCheck },
    { label: t('navigation.stockTransfers'), href: '/admin/transfers', icon: ArrowLeftRight },
    { label: t('navigation.analytics'), href: '/admin/analytics', icon: BarChart2 },
    { label: t('navigation.auditLogs'), href: '/admin/audit-logs', icon: FileText },
    { label: t('navigation.settings'), href: '/admin/settings', icon: Settings },
  ],
});

const getRoleConfig = (t: (key: string) => string): Record<UserRole, { color: string; bg: string; border: string; label: string; accent: string }> => ({
  PATIENT:  { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', label: t('nav.patientPortal'),  accent: '#3b82f6' },
  PHARMACY: { color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4', label: t('nav.pharmacyPortal'), accent: '#14b8a6' },
  HOSPITAL: { color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe', label: t('nav.hospitalPortal'), accent: '#8b5cf6' },
  ADMIN:    { color: '#9d174d', bg: '#fdf2f8', border: '#fbcfe8', label: t('nav.adminPortal'),    accent: '#ec4899' },
});

interface ConsoleLayoutProps {
  children: React.ReactNode;
}

export const ConsoleLayout: React.FC<ConsoleLayoutProps> = ({ children }) => {
  const { currentUser, logout, unreadCount, sources } = useApp();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const roleRaw = (currentUser?.role || 'PATIENT').toUpperCase();
  const role: UserRole = (['PATIENT', 'PHARMACY', 'HOSPITAL', 'ADMIN'].includes(roleRaw) ? roleRaw : 'PATIENT') as UserRole;
  const allNavItems = getNavItems(t);
  const navItems = allNavItems[role] || allNavItems.PATIENT;
  const roleConfigs = getRoleConfig(t);
  const rc = roleConfigs[role] || roleConfigs.PATIENT;

  const userName = currentUser?.name || currentUser?.organizationName || 'User';
  const userEmail = currentUser?.email || '';
  const userInitial = (userName && userName.length > 0) ? userName.charAt(0).toUpperCase() : 'U';

  const pendingVerificationsCount = sources ? sources.filter(s => s.verificationStatus === 'PENDING' && !s.isDeleted).length : 0;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(href + '/');

  const renderSidebarContent = () => (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#fff', borderRight: '1px solid #e2e8f0',
    }}>
      {/* Brand */}
      <Link
        to={`/${role.toLowerCase()}/dashboard`}
        style={{
          padding: sidebarCollapsed ? '20px 12px' : '20px 20px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center',
          gap: 12, minHeight: 68, textDecoration: 'none',
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: `linear-gradient(135deg, ${rc.color}, ${rc.accent})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 12px ${rc.color}40`,
        }}>
          <HeartPulse style={{ width: 18, height: 18, color: '#fff' }} />
        </div>
        {!sidebarCollapsed && (
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontWeight: 900, fontSize: 16, letterSpacing: '-0.03em', color: '#0f172a', margin: 0 }}>
              Med<span style={{ color: rc.color }}>Share</span>
            </p>
            <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, margin: 0, whiteSpace: 'nowrap' }}>
              {rc.label}
            </p>
          </div>
        )}
      </Link>

      {/* Nav items */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px', scrollbarWidth: 'thin' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setMobileSidebarOpen(false)}
              title={sidebarCollapsed ? item.label : undefined}
              className="console-nav-item"
              style={{
                display: 'flex', alignItems: 'center',
                gap: 10, padding: sidebarCollapsed ? '10px 12px' : '9px 12px',
                borderRadius: 9, marginBottom: 2,
                background: active ? rc.bg : 'transparent',
                color: active ? rc.color : '#64748b',
                fontWeight: active ? 700 : 500,
                fontSize: 13, textDecoration: 'none',
                border: `1px solid ${active ? rc.border : 'transparent'}`,
                transition: 'all 0.15s ease',
                position: 'relative',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              }}
            >
              <Icon style={{ width: 16, height: 16, flexShrink: 0 }} />
              {!sidebarCollapsed && (
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.label}
                </span>
              )}
              {!sidebarCollapsed && item.badge === 'REQUESTS' && unreadCount > 0 && (
                <span style={{
                  marginLeft: 'auto', background: rc.color, color: '#fff',
                  fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 99,
                }}>
                  {unreadCount}
                </span>
              )}
              {!sidebarCollapsed && item.badge === 'VERIFY' && pendingVerificationsCount > 0 && (
                <span style={{
                  marginLeft: 'auto', background: '#d97706', color: '#fff',
                  fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 99,
                }}>
                  {pendingVerificationsCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div style={{
        borderTop: '1px solid #f1f5f9',
        padding: sidebarCollapsed ? '12px 8px' : '12px 12px',
      }}>
        {!sidebarCollapsed && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 10px', background: '#f8fafc',
            borderRadius: 10, marginBottom: 8, border: '1px solid #f1f5f9',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: `linear-gradient(135deg, ${rc.color}, ${rc.accent})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 800, color: '#fff',
            }}>
              {userInitial}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <p style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userName}
              </p>
              <p style={{ fontSize: 10, color: '#94a3b8', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userEmail}
              </p>
            </div>
            <span style={{
              fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 99,
              background: rc.bg, color: rc.color, border: `1px solid ${rc.border}`,
              textTransform: 'uppercase' as const, letterSpacing: '0.06em', flexShrink: 0,
            }}>
              {role}
            </span>
          </div>
        )}
        {role === 'PATIENT' && (
          <Link
            to="/"
            title={t('navigation.publicWebsite')}
            className="sidebar-website-btn"
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              gap: 8, padding: '8px 10px', borderRadius: 8,
              background: 'transparent', border: '1px solid #e2e8f0',
              color: '#334151', fontWeight: 600, fontSize: 12.5,
              textDecoration: 'none', marginBottom: 6,
              transition: 'background 0.15s ease',
            }}
          >
            <Globe style={{ width: 14, height: 14, color: '#2563eb', flexShrink: 0 }} />
            {!sidebarCollapsed && <span>{t('navigation.publicWebsite')}</span>}
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="sidebar-logout-btn"
          style={{
            width: '100%', display: 'flex', alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            gap: 8, padding: '8px 10px', borderRadius: 8,
            background: 'transparent', border: '1px solid #fee2e2',
            color: '#dc2626', fontWeight: 600, fontSize: 12.5,
            cursor: 'pointer', transition: 'background 0.15s ease',
          }}
        >
          <LogOut style={{ width: 14, height: 14, flexShrink: 0 }} />
          {!sidebarCollapsed && <span>{t('nav.signOut')}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 200, display: 'block',
          }}
        />
      )}

      {/* Desktop sidebar */}
      <aside style={{
        width: sidebarCollapsed ? 64 : 240,
        flexShrink: 0,
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: 'width 0.2s ease',
        position: 'relative', zIndex: 10,
        display: 'none',
      }}
        className="sidebar-desktop"
      >
        {renderSidebarContent()}
        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{
            position: 'absolute', top: 72, right: -12,
            width: 24, height: 24, borderRadius: '50%',
            background: '#fff', border: '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 20,
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          }}
        >
          {sidebarCollapsed
            ? <ChevronRight style={{ width: 12, height: 12, color: '#64748b' }} />
            : <ChevronLeft style={{ width: 12, height: 12, color: '#64748b' }} />}
        </button>
      </aside>

      {/* Mobile sidebar (drawer) */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 256,
        transform: mobileSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease',
        zIndex: 300,
        display: 'block',
      }}
        className="sidebar-mobile"
      >
        {renderSidebarContent()}
      </aside>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Topbar */}
        <header style={{
          background: '#fff', borderBottom: '1px solid #e2e8f0',
          padding: '0 24px', height: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0, zIndex: 50,
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 6, borderRadius: 8, color: '#64748b',
                display: 'flex', alignItems: 'center',
              }}
              className="mobile-menu-btn"
            >
              <Menu style={{ width: 20, height: 20 }} />
            </button>
            <div>
              <span style={{
                fontSize: 9, fontWeight: 800, textTransform: 'uppercase' as const,
                letterSpacing: '0.1em', color: '#94a3b8', display: 'block',
              }}>
                MedShare / {rc.label}
              </span>
              <span style={{
                fontSize: 13, fontWeight: 700, color: '#0f172a', display: 'block',
              }}>
                {navItems.find(n => isActive(n.href))?.label || rc.label}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Facility Name & Verified Badge for Pharmacy & Hospital */}
            {(role === 'PHARMACY' || role === 'HOSPITAL') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                  {userName}
                </span>
                {currentUser?.verificationStatus === 'APPROVED' && (
                  <span
                    title={t('common.verified')}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 3,
                      fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 99,
                      background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0',
                    }}
                  >
                    <ShieldCheck style={{ width: 12, height: 12, color: '#059669' }} />
                    {t('common.verified')} ✓
                  </span>
                )}
              </div>
            )}

            {/* Public website link - only visible for patients */}
            {role === 'PATIENT' && (
              <Link
                to="/"
                title={t('navigation.publicWebsite')}
                className="topbar-website-link"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 8,
                  background: '#f1f5f9', border: '1px solid #e2e8f0',
                  color: '#334151', fontSize: 12, fontWeight: 700,
                  textDecoration: 'none', transition: 'all 0.12s ease',
                }}
              >
                <Globe style={{ width: 13, height: 13, color: '#2563eb' }} />
                <span className="hidden sm:inline">{t('navigation.publicWebsite')}</span>
              </Link>
            )}

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Role badge */}
            <span style={{
              fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 99,
              background: rc.bg, color: rc.color, border: `1px solid ${rc.border}`,
              textTransform: 'uppercase' as const, letterSpacing: '0.06em',
            }}>
              {role}
            </span>
            <NotificationDropdown />
            <Link
              to={`/${role.toLowerCase()}/profile`}
              title="View Profile"
              style={{
                width: 34, height: 34, borderRadius: 9,
                background: `linear-gradient(135deg, ${rc.color}, ${rc.accent})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: 13, textDecoration: 'none',
              }}
            >
              {userInitial}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden',
          background: '#f8fafc',
          padding: 0,
        }}>
          {children}
        </main>
      </div>

      <style>{`
        .sidebar-desktop { display: flex !important; flex-direction: column; }
        .sidebar-mobile { display: none !important; }
        .mobile-menu-btn { display: none !important; }
        .console-nav-item:hover { background: #f8fafc; }
        .sidebar-website-btn:hover { background: #f8fafc !important; }
        .sidebar-logout-btn:hover { background: #fef2f2 !important; }
        .topbar-website-link:hover { background: #e2e8f0 !important; }
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .sidebar-mobile { display: block !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
};
export default ConsoleLayout;
