import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import {
  Bell, ArrowLeft, Check, CheckCheck, AlertTriangle, AlertOctagon, Send, CalendarCheck, ShieldCheck, ClipboardList,
} from 'lucide-react';

export const PharmacyNotificationsPage: React.FC = () => {
  const { currentUser, notifications, markNotificationAsRead, markAllNotificationsAsRead, sources } = useApp();

  const pharmId = currentUser.sourceId || 'SRC-PHARM-001';
  const pharmSource = sources.find((s) => s.id === pharmId);

  // Filter notifications targeting pharmacy
  const myNotifications = useMemo(() => {
    return notifications.filter(
      (n) => n.targetRole === 'PHARMACY' || (n as any).sourceId === pharmId || n.targetRole === 'ALL'
    );
  }, [notifications, pharmId]);

  const getIcon = (type?: string) => {
    switch (type) {
      case 'EMERGENCY':
        return <AlertOctagon style={{ width: 18, height: 18, color: '#dc2626' }} />;
      case 'WARNING':
        return <AlertTriangle style={{ width: 18, height: 18, color: '#d97706' }} />;
      case 'RESERVATION':
        return <CalendarCheck style={{ width: 18, height: 18, color: '#1d4ed8' }} />;
      case 'SUCCESS':
        return <ShieldCheck style={{ width: 18, height: 18, color: '#059669' }} />;
      default:
        return <Bell style={{ width: 18, height: 18, color: '#0d9488' }} />;
    }
  };

  return (
    <ConsoleLayout>
      <div style={{ padding: '24px 28px', maxWidth: 1000, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
        
        {/* Back Link */}
        <div style={{ marginBottom: 16 }}>
          <Link
            to="/pharmacy/dashboard"
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
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
              Pharmacy System Notifications
            </h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              {pharmSource?.name || currentUser.name} · Real-time alerts for hospital requests, reservations, and low stock warnings
            </p>
          </div>

          {myNotifications.some((n) => !n.read) && (
            <button
              onClick={() => markAllNotificationsAsRead()}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', background: '#fff', color: '#1d4ed8',
                fontWeight: 700, fontSize: 13, borderRadius: 10,
                border: '1px solid #bfdbfe', cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <CheckCheck style={{ width: 16, height: 16 }} />
              Mark All as Read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div style={{
          background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
          boxShadow: '0 1px 6px rgba(0,0,0,0.04)', overflow: 'hidden',
        }}>
          {myNotifications.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <Bell style={{ width: 44, height: 44, color: '#cbd5e1', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
                No notifications right now
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                You're all caught up! New emergency requests and stock alerts will appear here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {myNotifications.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: '18px 24px', borderBottom: '1px solid #f1f5f9',
                    background: n.read ? '#fff' : '#f0fdfa',
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
                    transition: 'background 0.12s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: n.read ? '#f1f5f9' : '#ccfbf1',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {getIcon(n.type)}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h4 style={{ fontSize: 14, fontWeight: n.read ? 700 : 800, color: '#0f172a', margin: 0 }}>
                          {n.title}
                        </h4>
                        {!n.read && (
                          <span style={{
                            fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 99,
                            background: '#0d9488', color: '#fff', textTransform: 'uppercase',
                          }}>
                            NEW
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 6px', lineHeight: 1.5 }}>
                        {n.message}
                      </p>
                      <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
                        {n.timestamp || 'Recently'}
                      </span>
                    </div>
                  </div>

                  {!n.read && (
                    <button
                      onClick={() => markNotificationAsRead(n.id)}
                      title="Mark as Read"
                      style={{
                        background: 'none', border: 'none', color: '#0d9488',
                        fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      <Check style={{ width: 14, height: 14 }} />
                      Mark Read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </ConsoleLayout>
  );
};
