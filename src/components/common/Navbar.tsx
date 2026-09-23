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
  Home,
} from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

export const Navbar: React.FC = () => {
  const { currentUser, logout, isAuthenticated } = useApp();
  const { t } = useTranslation();
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

  // Lock background body scroll whenever the mobile navigation menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [mobileMenuOpen]);

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
      case 'PATIENT': return t('nav.patientPortal');
      case 'PHARMACY': return t('nav.pharmacyPortal');
      case 'HOSPITAL': return t('nav.hospitalPortal');
      case 'ADMIN': return t('nav.adminPortal');
      default: return t('nav.portal');
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

  // Navigation Links: Home, Find Medicine, Live Map, Reservations, Emergency
  const primaryLinks = [
    { name: 'Home', href: '/', icon: Home },
    { name: t('nav.findMedicine'), href: '/search', icon: Search },
    { name: t('nav.liveMap'), href: '/map', icon: MapPin },
    { name: t('nav.reservations'), href: '/reservations', icon: CalendarCheck },
    { name: t('nav.emergency'), href: '/emergency', icon: AlertOctagon, isEmergency: true },
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
              <div className="flex flex-col">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 900,
                      fontSize: 16,
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
                <p className="hidden sm:block" style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, margin: 0, lineHeight: 1 }}>
                  Emergency Medicine Network
                </p>
              </div>
            </Link>

            {/* ── Desktop Navigation on Right (Hidden on mobile < md) ── */}
            <div className="hidden md:flex items-center gap-2 ml-auto flex-nowrap">
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

              {/* Language Switcher */}
              <LanguageSwitcher />

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
                    <span>{t('nav.signIn')}</span>
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
                    <span>{t('nav.register')}</span>
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
                            label: t('navigation.profile'),
                            action: () => {
                              setProfileDropdownOpen(false);
                              setIsProfileModalOpen(true);
                            },
                          },
                          { icon: Settings, label: t('navigation.settings'), href: '/settings' },
                          { icon: CalendarCheck, label: t('navigation.myReservations'), href: '/reservations' },
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
                          <span>{t('nav.signOut')}</span>
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
                aria-label={mobileMenuOpen ? "Close Navigation Menu" : "Open Navigation Menu"}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer flex items-center justify-center shadow-xs"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>

        {/* ── Mobile Drawer & Backdrop Overlay ── */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <div
              className="fixed inset-0 top-[62px] bg-slate-950/40 backdrop-blur-xs z-40 md:hidden animate-fade-in"
              onClick={() => setMobileMenuOpen(false)}
              onTouchMove={(e) => e.preventDefault()}
            />

            {/* Mobile Navigation Drawer */}
            <div
              className="fixed top-[62px] left-0 right-0 z-50 md:hidden bg-white/98 backdrop-blur-md border-b border-slate-200 shadow-2xl max-h-[calc(100vh-62px)] overflow-y-auto overscroll-contain p-4 space-y-4 animate-slide-down"
              style={{
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {/* Language Switcher bar */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500">Language / மொழி:</span>
                <LanguageSwitcher />
              </div>

              {/* User Info or Auth Callout */}
              {isGuest ? (
                <div className="grid grid-cols-2 gap-2.5 pb-1">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-sm transition-all"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{t('nav.signIn')}</span>
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold border border-slate-200 transition-all"
                  >
                    <UserPlus className="w-4 h-4 text-slate-600" />
                    <span>{t('nav.register')}</span>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shrink-0"
                      style={{ background: roleColors.bg, color: roleColors.text, border: `2px solid ${roleColors.dot}40` }}
                    >
                      {(currentUser?.name || currentUser?.organizationName || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate max-w-[150px]">
                      <p className="text-xs font-extrabold text-slate-900 truncate m-0">
                        {currentUser?.name || currentUser?.organizationName || 'User'}
                      </p>
                      <span
                        className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full inline-block mt-0.5"
                        style={{ background: roleColors.bg, color: roleColors.text }}
                      >
                        {getRoleLabel()}
                      </span>
                    </div>
                  </div>
                  <Link
                    to={getDashboardLink()}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-xs hover:bg-blue-700 transition-all"
                  >
                    {t('nav.portal')}
                  </Link>
                </div>
              )}

              {/* Main Navigation Pages Links */}
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 block mb-1">
                  Navigation Pages
                </span>
                {primaryLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        item.isEmergency
                          ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                          : isActive
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${item.isEmergency ? 'text-red-600 animate-pulse' : isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                        <span>{item.name}</span>
                      </div>
                      {item.isEmergency && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-red-600 text-white">
                          Urgent
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Profile & Settings (Only for logged-in users) */}
              {!isGuest && (
                <div className="pt-3 border-t border-slate-100 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 block mb-1">
                    Account Controls
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all text-left cursor-pointer"
                  >
                    <UserCircle className="w-4 h-4 text-slate-500" />
                    <span>Edit Profile</span>
                  </button>
                  <Link
                    to="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>Settings</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-all text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-red-600" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </header>

      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </>
  );
};
