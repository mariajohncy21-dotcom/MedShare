import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { NotificationDropdown } from './NotificationDropdown';
import { ProfileModal } from './ProfileModal';
import {
  HeartPulse,
  Search,
  AlertOctagon,
  LayoutDashboard,
  Menu,
  X,
  LogOut,
  UserCircle,
  ChevronDown,
  CalendarCheck,
  Settings,
  MapPin,
  LogIn,
  UserPlus,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentUser, logout, isAuthenticated } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const isGuest = !isAuthenticated || !currentUser || currentUser.id === 'guest';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const prevPathRef = useRef(location.pathname);
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      setMobileMenuOpen(false);
    }
  }, [location.pathname]);

  const getDashboardLink = () => {
    switch (currentUser?.role) {
      case 'PATIENT': return '/patient/dashboard';
      case 'PHARMACY': return '/pharmacy/dashboard';
      case 'HOSPITAL': return '/hospital/dashboard';
      case 'ADMIN': return '/admin/dashboard';
      default: return '/';
    }
  };

  const getDashboardLabel = () => {
    switch (currentUser?.role) {
      case 'PATIENT': return 'Patient Console';
      case 'PHARMACY': return 'Pharmacy Console';
      case 'HOSPITAL': return 'Hospital Console';
      case 'ADMIN': return 'Admin Console';
      default: return 'Console';
    }
  };

  const getRoleLabel = () => {
    if (!currentUser) return '';
    return currentUser.role === 'PATIENT' ? 'USER' : currentUser.role;
  };

  const getRoleColors = () => {
    switch (currentUser?.role) {
      case 'PATIENT': return { bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6' };
      case 'PHARMACY': return { bg: '#f0fdfa', text: '#0d9488', dot: '#14b8a6' };
      case 'HOSPITAL': return { bg: '#f5f3ff', text: '#7c3aed', dot: '#8b5cf6' };
      case 'ADMIN': return { bg: '#fdf4ff', text: '#a21caf', dot: '#d946ef' };
      default: return { bg: '#f1f5f9', text: '#475569', dot: '#94a3b8' };
    }
  };

  const roleColors = getRoleColors();

  // Navigation Links explicitly requested: Home, Find Medicine, Live Map, Emergency
  const primaryLinks = [
    { name: 'Home', href: '/', icon: HeartPulse },
    { name: 'Find Medicine', href: '/search', icon: Search },
    { name: 'Live Map', href: '/map', icon: MapPin },
    { name: 'Emergency', href: '/emergency', icon: AlertOctagon, isEmergency: true },
  ];

  return (
    <>
      <header
        style={{
          background: 'rgba(255,255,255,0.98)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid #e2e8f0',
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 62 }}>

            {/* ── App Name / Brand Logo (Left) ── */}
            <Link
              to="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #1d4ed8, #0d9488)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: '0 2px 8px rgba(29,78,216,0.28)',
                  flexShrink: 0,
                }}
              >
                <HeartPulse style={{ width: 18, height: 18 }} />
              </div>
              <div className="hidden sm:block">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 900,
                      fontSize: 17,
                      letterSpacing: '-0.03em',
                      color: '#0f172a',
                    }}
                  >
                    Med<span style={{ color: '#1d4ed8' }}>Share</span>
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      padding: '2px 6px',
                      borderRadius: 99,
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      border: '1px solid #bfdbfe',
                      textTransform: 'uppercase',
                    }}
                  >
                    Grid
                  </span>
                </div>
                <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, margin: 0, lineHeight: 1 }}>
                  Emergency Medicine Network
                </p>
              </div>
            </Link>

            {/* ── Middle Gap & All Buttons on Right (Home -> Find Medicine -> Emergency -> Notification -> Dashboard -> Profile) ── */}
            <div
              className="hidden md:flex"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'nowrap',
                marginLeft: 'auto',
              }}
            >
              {/* 1. Home, 2. Find Medicine, 3. Emergency */}
              {primaryLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      height: 36,
                      padding: '0 13px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.12s ease',
                      flexShrink: 0,
                      ...(item.isEmergency
                        ? {
                            color: '#dc2626',
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                          }
                        : isActive
                        ? {
                            color: '#1d4ed8',
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                          }
                        : {
                            color: '#475569',
                            background: 'transparent',
                            border: '1px solid transparent',
                          }),
                    }}
                    onMouseEnter={(e) => {
                      if (!item.isEmergency && !isActive) {
                        (e.currentTarget as HTMLElement).style.background = '#f8fafc';
                        (e.currentTarget as HTMLElement).style.color = '#1d4ed8';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!item.isEmergency && !isActive) {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = '#475569';
                      }
                    }}
                  >
                    <Icon
                      style={{
                        width: 15,
                        height: 15,
                        ...(item.isEmergency ? { animation: 'pulse 1.5s infinite' } : {}),
                      }}
                    />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {isGuest ? (
                <>
                  {/* Sign In Button */}
                  <Link
                    to="/login"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      height: 36,
                      padding: '0 16px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#fff',
                      background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 8px rgba(29,78,216,0.28)',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                    }}
                  >
                    <LogIn style={{ width: 14, height: 14 }} />
                    <span>Sign In</span>
                  </Link>

                  {/* Register Button */}
                  <Link
                    to="/register"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      height: 36,
                      padding: '0 14px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#0f172a',
                      background: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                    }}
                  >
                    <UserPlus style={{ width: 14, height: 14, color: '#64748b' }} />
                    <span>Register</span>
                  </Link>
                </>
              ) : (
                <>
                  {/* 4. Notification Button */}
                  <NotificationDropdown />

                  {/* 5. Dashboard / Console Button */}
                  <Link
                    to={getDashboardLink()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      height: 36,
                      padding: '0 14px',
                      borderRadius: 8,
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: '#fff',
                      background: '#0f172a',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.16)',
                      transition: 'all 0.12s ease',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = '#1d4ed8';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = '#0f172a';
                    }}
                  >
                    <LayoutDashboard style={{ width: 14, height: 14, color: '#60a5fa' }} />
                    <span>{getDashboardLabel()}</span>
                  </Link>

                  {/* 6. User Profile Button & Dropdown */}
                  <div ref={dropdownRef} style={{ position: 'relative', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        height: 36,
                        padding: '0 10px 0 4px',
                        borderRadius: 99,
                        background: '#f8fafc',
                        borderWidth: 1.5,
                        borderStyle: 'solid',
                        borderColor: '#e2e8f0',
                        cursor: 'pointer',
                        transition: 'all 0.12s ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = '#cbd5e1';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0';
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: roleColors.bg,
                          border: `2px solid ${roleColors.dot}40`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {currentUser.avatarUrl ? (
                          <img
                            src={currentUser.avatarUrl}
                            alt={currentUser?.name || 'User'}
                            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <span style={{ fontSize: 12, fontWeight: 800, color: roleColors.text }}>
                            {(currentUser?.name || currentUser?.organizationName || 'U').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div style={{ textAlign: 'left', maxWidth: 90 }}>
                        <p
                          style={{
                            fontSize: 12,
                            fontWeight: 800,
                            color: '#0f172a',
                            margin: 0,
                            lineHeight: 1.1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {(currentUser?.name || currentUser?.organizationName || 'User').split(' ')[0]}
                        </p>
                        <p
                          style={{
                            fontSize: 9.5,
                            fontWeight: 700,
                            color: roleColors.text,
                            margin: 0,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            lineHeight: 1,
                          }}
                        >
                          {getRoleLabel()}
                        </p>
                      </div>
                      <ChevronDown
                        style={{
                          width: 13,
                          height: 13,
                          color: '#94a3b8',
                          transform: profileDropdownOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.15s ease',
                        }}
                      />
                    </button>

                    {profileDropdownOpen && (
                      <div
                        className="animate-slide-down"
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: 'calc(100% + 8px)',
                          width: 240,
                          background: '#fff',
                          border: '1px solid #e2e8f0',
                          borderRadius: 14,
                          boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                          overflow: 'hidden',
                          zIndex: 200,
                        }}
                      >
                        {/* User header */}
                        <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
                          <p
                            style={{
                              fontWeight: 800,
                              fontSize: 13,
                              color: '#0f172a',
                              margin: '0 0 2px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {currentUser?.name || currentUser?.organizationName || 'User'}
                          </p>
                          <p
                            style={{
                              fontSize: 11,
                              color: '#64748b',
                              margin: '0 0 6px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {currentUser?.email || ''}
                          </p>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: 99,
                              background: roleColors.bg,
                              color: roleColors.text,
                              border: `1px solid ${roleColors.dot}40`,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                            }}
                          >
                            {getRoleLabel()}
                          </span>
                        </div>

                        {/* Console Link */}
                        <Link
                          to={getDashboardLink()}
                          onClick={() => setProfileDropdownOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 16px',
                            fontSize: 12.5,
                            fontWeight: 700,
                            color: '#1d4ed8',
                            textDecoration: 'none',
                            background: '#eff6ff',
                            transition: 'background 0.1s ease',
                          }}
                        >
                          <LayoutDashboard style={{ width: 15, height: 15, color: '#1d4ed8' }} />
                          <span>{getDashboardLabel()}</span>
                        </Link>

                        {[
                          {
                            icon: UserCircle,
                            label: 'Manage Profile',
                            action: () => {
                              setProfileDropdownOpen(false);
                              setIsProfileModalOpen(true);
                            },
                          },
                          { icon: Settings, label: 'Settings', href: '/settings' },
                          { icon: CalendarCheck, label: 'My Active Holds', href: '/reservations' },
                        ].map((item, i) =>
                          item.href ? (
                            <Link
                              key={i}
                              to={item.href}
                              onClick={() => setProfileDropdownOpen(false)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '10px 16px',
                                fontSize: 12.5,
                                fontWeight: 600,
                                color: '#374151',
                                textDecoration: 'none',
                                transition: 'background 0.1s ease',
                              }}
                              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#f8fafc')}
                              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                            >
                              <item.icon style={{ width: 15, height: 15, color: '#94a3b8' }} />
                              <span>{item.label}</span>
                            </Link>
                          ) : (
                            <button
                              key={i}
                              type="button"
                              onClick={item.action}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '10px 16px',
                                fontSize: 12.5,
                                fontWeight: 600,
                                color: '#374151',
                                background: 'transparent',
                                border: 'none',
                                width: '100%',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'background 0.1s ease',
                              }}
                              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#f8fafc')}
                              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                            >
                              <item.icon style={{ width: 15, height: 15, color: '#94a3b8' }} />
                              <span>{item.label}</span>
                            </button>
                          )
                        )}

                        <div style={{ borderTop: '1px solid #f1f5f9', marginTop: 4 }} />
                        <button
                          type="button"
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            logout();
                            navigate('/login');
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 16px',
                            fontSize: 12.5,
                            fontWeight: 700,
                            color: '#dc2626',
                            background: 'transparent',
                            border: 'none',
                            width: '100%',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'background 0.1s ease',
                          }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#fef2f2')}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                        >
                          <LogOut style={{ width: 15, height: 15, color: '#dc2626' }} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* ── Mobile Hamburger Toggle on Small Screens (< md) ── */}
            <div className="flex md:hidden items-center gap-2 ml-auto">
              {!isGuest && <NotificationDropdown />}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{
                  padding: 7,
                  borderRadius: 8,
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  cursor: 'pointer',
                  color: '#475569',
                }}
              >
                {mobileMenuOpen ? <X style={{ width: 18, height: 18 }} /> : <Menu style={{ width: 18, height: 18 }} />}
              </button>
            </div>

          </div>
        </div>

        {/* ── Mobile Drawer ── */}
        {mobileMenuOpen && (
          <div
            className="animate-slide-down"
            style={{
              borderTop: '1px solid #e2e8f0',
              background: '#fff',
              padding: '12px 16px 20px',
            }}
          >
            {/* User Info or Auth Callout */}
            {isGuest ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '10px', borderRadius: 8,
                      background: '#1d4ed8', color: '#fff',
                      fontSize: 13, fontWeight: 800, textDecoration: 'none',
                    }}
                  >
                    <LogIn style={{ width: 15, height: 15 }} />
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '10px', borderRadius: 8,
                      background: '#f8fafc', color: '#0f172a', border: '1.5px solid #cbd5e1',
                      fontSize: 13, fontWeight: 800, textDecoration: 'none',
                    }}
                  >
                    <UserPlus style={{ width: 15, height: 15 }} />
                    Register
                  </Link>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: '#f8fafc',
                  borderRadius: 10,
                  marginBottom: 8,
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: roleColors.bg,
                      border: `2px solid ${roleColors.dot}40`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 800, color: roleColors.text }}>
                      {(currentUser?.name || currentUser?.organizationName || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      {currentUser?.name || currentUser?.organizationName || 'User'}
                    </p>
                    <p
                      style={{
                        fontSize: 10,
                        color: roleColors.text,
                        fontWeight: 700,
                        margin: 0,
                        textTransform: 'uppercase',
                      }}
                    >
                      {getRoleLabel()}
                    </p>
                  </div>
                </div>
                <Link
                  to={getDashboardLink()}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 7,
                    background: '#1d4ed8',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  Console
                </Link>
              </div>
            )}

            {/* Nav Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 8 }}>
              {primaryLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '9px 12px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      textDecoration: 'none',
                      ...(item.isEmergency
                        ? { color: '#dc2626', background: '#fef2f2' }
                        : { color: '#374151', background: 'transparent' }),
                    }}
                  >
                    <Icon style={{ width: 16, height: 16 }} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div
              style={{
                borderTop: '1px solid #f1f5f9',
                paddingTop: 8,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsProfileModalOpen(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  borderRadius: 8,
                  background: 'transparent',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#374151',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <UserCircle style={{ width: 16, height: 16, color: '#94a3b8' }} />
                <span>Edit Profile</span>
              </button>
              <Link
                to="/settings"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#374151',
                  textDecoration: 'none',
                }}
              >
                <Settings style={{ width: 16, height: 16, color: '#94a3b8' }} />
                <span>Settings</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                  navigate('/auth/login');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  borderRadius: 8,
                  background: 'transparent',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#dc2626',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <LogOut style={{ width: 16, height: 16 }} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </>
  );
};
