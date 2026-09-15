import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import {
  Settings, ArrowLeft, Lock, Bell, Shield, Key, CheckCircle2, AlertCircle, Eye, EyeOff,
} from 'lucide-react';

export const HospitalSettingsPage: React.FC = () => {
  const { currentUser, sources } = useApp();
  const hospId = currentUser.sourceId || 'SRC-HOSP-001';
  const hospSource = sources.find((s) => s.id === hospId);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Notification Preferences
  const [notifEmergency, setNotifEmergency] = useState(true);
  const [notifShortage, setNotifShortage] = useState(true);
  const [notifDailyReminder, setNotifDailyReminder] = useState(true);
  const [notifTransfers, setNotifTransfers] = useState(true);
  const [notifSavedMsg, setNotifSavedMsg] = useState(false);

  // Department Stock Thresholds
  const [criticalThreshold, setCriticalThreshold] = useState(15);
  const [lowThreshold, setLowThreshold] = useState(35);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordMsg({ type: 'error', text: 'Please enter your current password.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPasswordMsg({ type: 'success', text: 'Institutional password updated successfully!' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordMsg(null), 4000);
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
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
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            Hospital Console Security &amp; Settings
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            {hospSource?.name || currentUser.name} · Configure account credentials, critical emergency alerts, and institutional thresholds
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
          
          {/* Security & Password Card */}
          <div style={{
            background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 28px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Lock style={{ width: 18, height: 18, color: '#6d28d9' }} />
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Account Security &amp; Password Update
              </h2>
            </div>

            <form onSubmit={handlePasswordSubmit} style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {passwordMsg && (
                <div style={{
                  padding: '12px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: passwordMsg.type === 'success' ? '#ecfdf5' : '#fef2f2',
                  color: passwordMsg.type === 'success' ? '#065f46' : '#dc2626',
                  border: passwordMsg.type === 'success' ? '1px solid #a7f3d0' : '1px solid #fecaca',
                }}>
                  {passwordMsg.type === 'success' ? <CheckCircle2 style={{ width: 16, height: 16 }} /> : <AlertCircle style={{ width: 16, height: 16 }} />}
                  {passwordMsg.text}
                </div>
              )}

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>
                  Current Institutional Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>
                    New Password (Min. 8 characters)
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>
                    Confirm New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                <button
                  type="submit"
                  style={{
                    padding: '9px 20px', background: '#6d28d9', color: '#fff',
                    border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', boxShadow: '0 2px 8px rgba(109,40,217,0.25)',
                  }}
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>

          {/* Operational Alerts & Dispatch Notifications */}
          <div style={{
            background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 28px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Bell style={{ width: 18, height: 18, color: '#6d28d9' }} />
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Institutional Dispatch Alert Subscriptions
              </h2>
            </div>

            <form onSubmit={handleSaveNotifications} style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {notifSavedMsg && (
                <div style={{
                  padding: '12px 16px', borderRadius: 8, background: '#ecfdf5',
                  color: '#065f46', border: '1px solid #a7f3d0', fontSize: 13, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <CheckCircle2 style={{ width: 16, height: 16 }} />
                  Alert preferences saved!
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f8fafc' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>Emergency Network Broadcasts</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>Audio alarm and high-priority banner when nearby cases require critical medicine allocation</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifEmergency}
                  onChange={(e) => setNotifEmergency(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: '#6d28d9', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f8fafc' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>Low Stock &amp; Critical Threshold Alerts</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>Automatic dispatch notification when hospital inventory falls below defined thresholds</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifShortage}
                  onChange={(e) => setNotifShortage(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: '#6d28d9', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f8fafc' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>Inter-Facility Stock Transfer Updates</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>Notifications on transfer dispatch, in-transit status, and delivery acknowledgments</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifTransfers}
                  onChange={(e) => setNotifTransfers(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: '#6d28d9', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>11:00 AM Daily Operational Report Reminder</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>Reminder alerts at 09:30 AM and 10:30 AM before the mandatory state filing deadline</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifDailyReminder}
                  onChange={(e) => setNotifDailyReminder(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: '#6d28d9', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <button
                  type="submit"
                  style={{
                    padding: '9px 20px', background: '#6d28d9', color: '#fff',
                    border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', boxShadow: '0 2px 8px rgba(109,40,217,0.25)',
                  }}
                >
                  Save Alert Settings
                </button>
              </div>
            </form>
          </div>

          {/* Department Stock Thresholds */}
          <div style={{
            background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 28px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Shield style={{ width: 18, height: 18, color: '#6d28d9' }} />
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Institutional Stock Level Definitions
              </h2>
            </div>

            <div style={{ padding: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: '#fef2f2', padding: 18, borderRadius: 12, border: '1px solid #fecaca' }}>
                <label style={{ fontSize: 12.5, fontWeight: 800, color: '#991b1b', display: 'block', marginBottom: 4 }}>
                  Critical Shortage Threshold
                </label>
                <p style={{ fontSize: 11.5, color: '#7f1d1d', margin: '0 0 10px' }}>
                  Medicines with units below this count trigger network emergency warnings.
                </p>
                <input
                  type="number"
                  value={criticalThreshold}
                  onChange={(e) => setCriticalThreshold(parseInt(e.target.value, 10) || 0)}
                  style={{ width: '100%', padding: '8px 12px', fontSize: 14, fontWeight: 800, border: '1px solid #fecaca', borderRadius: 8, background: '#fff' }}
                />
              </div>

              <div style={{ background: '#fffbeb', padding: 18, borderRadius: 12, border: '1px solid #fde68a' }}>
                <label style={{ fontSize: 12.5, fontWeight: 800, color: '#92400e', display: 'block', marginBottom: 4 }}>
                  Low Stock Reorder Threshold
                </label>
                <p style={{ fontSize: 11.5, color: '#78350f', margin: '0 0 10px' }}>
                  Medicines approaching this level display warning badges for routine procurement.
                </p>
                <input
                  type="number"
                  value={lowThreshold}
                  onChange={(e) => setLowThreshold(parseInt(e.target.value, 10) || 0)}
                  style={{ width: '100%', padding: '8px 12px', fontSize: 14, fontWeight: 800, border: '1px solid #fde68a', borderRadius: 8, background: '#fff' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ConsoleLayout>
  );
};
