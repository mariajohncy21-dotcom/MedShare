import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  HeartPulse, LayoutDashboard, Package, Plus, Upload, ClipboardList,
  AlertOctagon, BookOpen, ArrowLeftRight, Bell, User, Settings, LogOut,
  ChevronLeft, ChevronRight, Menu, X, Users, Building2, Hospital,
  ShieldCheck, TrendingUp, FileText, Activity, Search, Map, Stethoscope,
  CalendarCheck, Boxes, Send, RefreshCw, BarChart2,
} from 'lucide-react';
import { UserRole } from '../../types';
import { NotificationDropdown } from './NotificationDropdown';

// ─── Sidebar nav definitions by role ──────────────────────────────────────────
const NAV_ITEMS: Record<UserRole, { label: string; href: string; icon: React.ElementType; badge?: string }[]> = {
  PATIENT: [
    { label: 'Dashboard', href: '/patient/dashboard', icon: LayoutDashboard },
    { label: 'Find Medicine', href: '/patient/search', icon: Search },
    { label: 'Search by Image', href: '/patient/image-search', icon: Activity },
    { label: 'Nearby Sources', href: '/patient/nearby', icon: Building2 },
    { label: 'Live Map', href: '/patient/map', icon: Map },
    { label: 'My Reservations', href: '/patient/reservations', icon: CalendarCheck },
    { label: 'My Requests', href: '/patient/requests', icon: ClipboardList },
    { label: 'Notifications', href: '/patient/notifications', icon: Bell },
    { label: 'Profile', href: '/patient/profile', icon: User },
    { label: 'Settings', href: '/patient/settings', icon: Settings },
  ],
  PHARMACY: [
    { label: 'Dashboard', href: '/pharmacy/dashboard', icon: LayoutDashboard },
    { label: 'Inventory', href: '/pharmacy/inventory', icon: Package },
    { label: 'Add Medicine', href: '/pharmacy/inventory/add', icon: Plus },
    { label: 'Update Stock', href: '/pharmacy/inventory/update', icon: RefreshCw },
    { label: 'Bulk Upload', href: '/pharmacy/inventory/bulk-upload', icon: Upload },
    { label: 'Stock History', href: '/pharmacy/inventory/history', icon: FileText },
    { label: 'Emergency Requests', href: '/pharmacy/emergency-requests', icon: AlertOctagon, badge: 'REQUESTS' },
    { label: 'Reservations', href: '/pharmacy/reservations', icon: CalendarCheck },
    { label: 'Daily Reports', href: '/pharmacy/daily-reports', icon: ClipboardList },
    { label: 'Notifications', href: '/pharmacy/notifications', icon: Bell },
    { label: 'Pharmacy Profile', href: '/pharmacy/profile', icon: Building2 },
    { label: 'Settings', href: '/pharmacy/settings', icon: Settings },
  ],
  HOSPITAL: [
    { label: 'Dashboard', href: '/hospital/dashboard', icon: LayoutDashboard },
    { label: 'Patients', href: '/hospital/patients', icon: Stethoscope },
    { label: 'Inventory', href: '/hospital/inventory', icon: Package },
    { label: 'Add Medicine', href: '/hospital/inventory/add', icon: Plus },
    { label: 'Bulk Upload', href: '/hospital/inventory/bulk-upload', icon: Upload },
    { label: 'Stock History', href: '/hospital/inventory/history', icon: FileText },
    { label: 'Requests', href: '/hospital/requests', icon: Send },
    { label: 'Pharmacy Search', href: '/hospital/pharmacy-search', icon: Search },
    { label: 'Emergency Requests', href: '/hospital/emergency-requests', icon: AlertOctagon, badge: 'EMERGENCY' },
    { label: 'Smart Allocation', href: '/hospital/allocation', icon: Activity },
    { label: 'Reservations', href: '/hospital/reservations', icon: CalendarCheck },
    { label: 'Transfers', href: '/hospital/transfers', icon: ArrowLeftRight },
    { label: 'Daily Reports', href: '/hospital/daily-reports', icon: ClipboardList },
    { label: 'Notifications', href: '/hospital/notifications', icon: Bell },
    { label: 'Hospital Profile', href: '/hospital/profile', icon: Hospital },
    { label: 'Settings', href: '/hospital/settings', icon: Settings },
  ],
  ADMIN: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Pharmacies', href: '/admin/pharmacies', icon: Building2 },
    { label: 'Hospitals', href: '/admin/hospitals', icon: Hospital },
    { label: 'Verification', href: '/admin/verification', icon: ShieldCheck, badge: 'VERIFY' },
    { label: 'Medicine Catalog', href: '/admin/medicines', icon: BookOpen },
    { label: 'Inventory Monitor', href: '/admin/inventory', icon: Boxes },
    { label: 'Shortage Monitor', href: '/admin/shortages', icon: AlertOctagon },
    { label: 'Medicine Requests', href: '/admin/requests', icon: ClipboardList },
    { label: 'Reservations', href: '/admin/reservations', icon: CalendarCheck },
    { label: 'Stock Transfers', href: '/admin/transfers', icon: ArrowLeftRight },
    { label: 'Analytics', href: '/admin/analytics', icon: BarChart2 },
    { label: 'Audit Logs', href: '/admin/audit-logs', icon: FileText },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ],
};

const ROLE_CONFIG: Record<UserRole, { color: string; bg: string; border: string; label: string; accent: string }> = {
  PATIENT:  { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', label: 'Patient Console',  accent: '#3b82f6' },
  PHARMACY: { color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4', label: 'Pharmacy Console', accent: '#14b8a6' },
  HOSPITAL: { color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe', label: 'Hospital Console', accent: '#8b5cf6' },
  ADMIN:    { color: '#9d174d', bg: '#fdf2f8', border: '#fbcfe8', label: 'Admin Console',    accent: '#ec4899' },
};

interface ConsoleLayoutProps {
  children: React.ReactNode;
}

export const ConsoleLayout: React.FC<ConsoleLayoutProps> = ({ children }) => {
  const { currentUser, logout, unreadCount } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const role = currentUser.role;
  const navItems = NAV_ITEMS[role] || NAV_ITEMS.PATIENT;
  const rc = ROLE_CONFIG[role] || ROLE_CONFIG.PATIENT;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(href + '/');

  const SidebarContent = () => (
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
              {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <p style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.name}
              </p>
              <p style={{ fontSize: 10, color: '#94a3b8', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.email}
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
        <button
          onClick={handleLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            gap: 8, padding: '8px 10px', borderRadius: 8,
            background: 'transparent', border: '1px solid #fee2e2',
            color: '#dc2626', fontWeight: 600, fontSize: 12.5,
            cursor: 'pointer', transition: 'background 0.15s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <LogOut style={{ width: 14, height: 14, flexShrink: 0 }} />
          {!sidebarCollapsed && <span>Sign Out</span>}
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
        // Show on desktop via media query workaround using inline block
      }}
        className="sidebar-desktop"
      >
        <SidebarContent />
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
        <SidebarContent />
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
                  {currentUser.name}
                </span>
                {currentUser.verificationStatus === 'APPROVED' && (
                  <span
                    title="Verified Facility"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 3,
                      fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 99,
                      background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0',
                    }}
                  >
                    <ShieldCheck style={{ width: 12, height: 12, color: '#059669' }} />
                    Verified ✓
                  </span>
                )}
              </div>
            )}
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
              {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
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
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .sidebar-mobile { display: block !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
};
