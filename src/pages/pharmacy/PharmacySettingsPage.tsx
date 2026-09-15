import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import {
  Settings, ArrowLeft, Lock, Bell, Shield, Key, CheckCircle2, AlertCircle, Eye, EyeOff,
} from 'lucide-react';

export const PharmacySettingsPage: React.FC = () => {
  const { currentUser, sources } = useApp();

  const pharmId = currentUser.sourceId || 'SRC-PHARM-001';
  const pharmSource = sources.find((s) => s.id === pharmId);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'SUCCESS' | 'ERROR'; text: string } | null>(null);

  // Notification Preferences state
  const [notifState, setNotifState] = useState({
    hospitalEmergencyAlerts: true,
    reservationHoldingAlerts: true,
    lowStockWarnings: true,
    dailyReportReminders: true,
    emailNotifications: true,
  });
  const [notifSavedMsg, setNotifSavedMsg] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!currentPassword) {
      setPasswordMsg({ type: 'ERROR', text: 'Please enter your current password.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'ERROR', text: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'ERROR', text: 'New password and confirm password do not match.' });
      return;
    }

    // Success simulation
    setPasswordMsg({ type: 'SUCCESS', text: 'Password changed successfully!' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleNotifSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNotifSavedMsg(true);
    setTimeout(() => setNotifSavedMsg(false), 3000);
  };

  return (
    <ConsoleLayout>
      <div style={{ padding: '24px 28px', maxWidth: 960, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
        
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
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            Pharmacy Security &amp; Console Settings
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            {pharmSource?.name || currentUser.name} · Configure account credentials, stock alert thresholds, and operational notification preferences
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
          
          {/* Security & Password Card */}
          <div style={{
            background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 28px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Lock style={{ width: 18, height: 18, color: '#0d9488' }} />
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Account Security &amp; Password Update
              </h2>
            </div>

            <form onSubmit={handlePasswordSubmit} style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {passwordMsg && (
                <div style={{
                  padding: '10px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700,
                  background: passwordMsg.type === 'SUCCESS' ? '#ecfdf5' : '#fef2f2',
                  color: passwordMsg.type === 'SUCCESS' ? '#047857' : '#dc2626',
                  border: `1px solid ${passwordMsg.type === 'SUCCESS' ? '#a7f3d0' : '#fecaca'}`,
                }}>
                  {passwordMsg.text}
                </div>
              )}

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 5 }}>
                  Current Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px 13px', fontSize: 13, borderRadius: 8, border: '1.5px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 5 }}>
                    New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ width: '100%', padding: '10px 13px', fontSize: 13, borderRadius: 8, border: '1.5px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 5 }}>
                    Confirm New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ width: '100%', padding: '10px 13px', fontSize: 13, borderRadius: 8, border: '1.5px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 }}>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  {showPassword ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
                  {showPassword ? 'Hide Passwords' : 'Show Passwords'}
                </button>

                <button
                  type="submit"
                  style={{ padding: '9px 20px', background: '#0d9488', color: '#fff', fontWeight: 800, fontSize: 13, border: 'none', borderRadius: 8, cursor: 'pointer' }}
                >
                  Update Password
                </button>
              </div>

            </form>
          </div>

          {/* Notification Preferences Card */}
          <div style={{
            background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 28px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Bell style={{ width: 18, height: 18, color: '#0d9488' }} />
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Operational Notification &amp; Alert Preferences
              </h2>
            </div>

            <form onSubmit={handleNotifSubmit} style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {notifSavedMsg && (
                <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                  Notification preferences saved!
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={notifState.hospitalEmergencyAlerts}
                    onChange={(e) => setNotifState({ ...notifState, hospitalEmergencyAlerts: e.target.checked })}
                    style={{ width: 17, height: 17, accentColor: '#0d9488' }}
                  />
                  <span>Hospital Emergency Requisitions Alert (Instant sound &amp; banner)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={notifState.reservationHoldingAlerts}
                    onChange={(e) => setNotifState({ ...notifState, reservationHoldingAlerts: e.target.checked })}
                    style={{ width: 17, height: 17, accentColor: '#0d9488' }}
                  />
                  <span>Citizen 15-Minute Reservation Pass Notifications</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={notifState.lowStockWarnings}
                    onChange={(e) => setNotifState({ ...notifState, lowStockWarnings: e.target.checked })}
                    style={{ width: 17, height: 17, accentColor: '#0d9488' }}
                  />
                  <span>Automatic Low Stock &amp; Critical Shortage Alerts</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={notifState.dailyReportReminders}
                    onChange={(e) => setNotifState({ ...notifState, dailyReportReminders: e.target.checked })}
                    style={{ width: 17, height: 17, accentColor: '#0d9488' }}
                  />
                  <span>Daily Stock Report 11:00 AM Deadline Reminders</span>
                </label>

              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10 }}>
                <button
                  type="submit"
                  style={{ padding: '9px 20px', background: '#0d9488', color: '#fff', fontWeight: 800, fontSize: 13, border: 'none', borderRadius: 8, cursor: 'pointer' }}
                >
                  Save Preferences
                </button>
              </div>

            </form>
          </div>

        </div>

      </div>
    </ConsoleLayout>
  );
};
