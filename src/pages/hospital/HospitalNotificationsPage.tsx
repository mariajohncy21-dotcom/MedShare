import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import {
  Bell, ArrowLeft, Check, CheckCheck, AlertTriangle, AlertOctagon,
  Send, CalendarCheck, ShieldCheck, ClipboardList, ArrowLeftRight, Clock,
} from 'lucide-react';

export const HospitalNotificationsPage: React.FC = () => {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useApp();

  const [filterType, setFilterType] = useState<string>('ALL');

  const filtered = useMemo(() => {
    return notifications.filter((n) => filterType === 'ALL' || n.type === filterType);
  }, [notifications, filterType]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'EMERGENCY': return <AlertOctagon style={{ width: 18, height: 18, color: '#dc2626' }} />;
      case 'SHORTAGE': return <AlertTriangle style={{ width: 18, height: 18, color: '#d97706' }} />;
      case 'RESERVATION': return <CalendarCheck style={{ width: 18, height: 18, color: '#2563eb' }} />;
      case 'TRANSFER': return <ArrowLeftRight style={{ width: 18, height: 18, color: '#6d28d9' }} />;
      case 'DAILY_REPORT': return <ClipboardList style={{ width: 18, height: 18, color: '#059669' }} />;
      default: return <Bell style={{ width: 18, height: 18, color: '#64748b' }} />;
    }
  };

  const getSafeLink = (link?: string) => {
    if (!link) return '/hospital/dashboard';
    if (link.startsWith('/reservations')) return '/hospital/reservations';
    if (link.startsWith('/emergency')) return '/hospital/emergency-requests';
    if (link.startsWith('/inventory')) return '/hospital/inventory';
    if (link.startsWith('/transfers')) return '/hospital/transfers';
    if (link.startsWith('/daily-reports')) return '/hospital/daily-reports';
    if (link.startsWith('/hospital')) return link;
    return '/hospital/dashboard';
  };

  return (
    <ConsoleLayout>
      <div style={{ padding: '24px 28px', maxWidth: 960, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
        
        {/* Back Link */}
        <div style={{ marginBottom: 16 }}>
          <Link
            to="/hospital/dashboard"
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
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Hospital Alerts &amp; Dispatch Feed
              </h1>
              {unreadCount > 0 && (
                <span style={{
                  fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 99,
                  background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                }}>
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
              Real-time synchronization across state drug authorities, emergency dispatches, and pharmacy network nodes
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllNotificationsRead}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', background: '#f5f3ff', color: '#6d28d9',
                border: '1px solid #ddd6fe', borderRadius: 8, fontSize: 13,
                fontWeight: 700, cursor: 'pointer',
              }}
            >
              <CheckCheck style={{ width: 15, height: 15 }} />
              Mark All Read
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {['ALL', 'EMERGENCY', 'SHORTAGE', 'RESERVATION', 'TRANSFER', 'DAILY_REPORT'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterType(tab)}
              style={{
                padding: '6px 14px', fontSize: 12, fontWeight: 700, borderRadius: 99,
                border: filterType === tab ? '1.5px solid #6d28d9' : '1px solid #e2e8f0',
                background: filterType === tab ? '#6d28d9' : '#fff',
                color: filterType === tab ? '#fff' : '#475569',
                cursor: 'pointer',
              }}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 16, padding: 48, textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <Bell style={{ width: 36, height: 36, color: '#cbd5e1', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>No Notifications</p>
              <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>Your hospital dispatch feed is fully up to date.</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                style={{
                  background: item.read ? '#fff' : '#faf5ff',
                  borderRadius: 14, padding: '16px 20px',
                  border: item.read ? '1px solid #e2e8f0' : '1.5px solid #ddd6fe',
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                  gap: 16, transition: 'all 0.12s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: item.read ? '#f8fafc' : '#f5f3ff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {getIcon(item.type)}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h4 style={{ fontSize: 14.5, fontWeight: item.read ? 700 : 800, color: '#0f172a', margin: 0 }}>
                        {item.title}
                      </h4>
                      {!item.read && (
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6d28d9' }} />
                      )}
                    </div>

                    <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 8px', lineHeight: 1.5 }}>
                      {item.message}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock style={{ width: 12, height: 12 }} />
                        {item.timestamp}
                      </span>

                      {item.link && (
                        <Link
                          to={getSafeLink(item.link)}
                          onClick={() => markNotificationRead(item.id)}
                          style={{ fontSize: 12, fontWeight: 700, color: '#6d28d9', textDecoration: 'none' }}
                        >
                          View Console Details &rarr;
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {!item.read && (
                  <button
                    onClick={() => markNotificationRead(item.id)}
                    title="Mark as read"
                    style={{
                      padding: '6px 10px', background: '#fff', border: '1px solid #e2e8f0',
                      borderRadius: 7, color: '#475569', fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    <Check style={{ width: 12, height: 12, display: 'inline', marginRight: 4 }} />
                    Read
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </ConsoleLayout>
  );
};
