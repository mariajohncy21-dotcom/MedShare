import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import { DEFAULT_CITY, DEFAULT_PINCODE, DEFAULT_DISTRICT, DEFAULT_STATE } from '../../data/mockData';
import {
  Settings, MapPin, Phone, ShieldCheck, Bell, RefreshCw,
  Save, CheckCircle2, AlertTriangle
} from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const { currentUser, resetToDemoData } = useApp();

  const [city, setCity] = useState(DEFAULT_CITY);
  const [district, setDistrict] = useState(DEFAULT_DISTRICT);
  const [state, setState] = useState(DEFAULT_STATE);
  const [pincode, setPincode] = useState(DEFAULT_PINCODE);
  const [emergencyHotline, setEmergencyHotline] = useState('+91 4637 271240');
  const [reservationHoldHours, setReservationHoldHours] = useState('4');
  const [enableSmsAlerts, setEnableSmsAlerts] = useState(true);
  const [enableAutoShortageAlerts, setEnableAutoShortageAlerts] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <ConsoleLayout>
      <div style={{ padding: '24px 28px', maxWidth: 1000, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Settings style={{ width: 26, height: 26, color: '#475569' }} />
            System Administration Settings
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            Configure municipal healthcare sector parameters, emergency hotline routing, and automation rules.
          </p>
        </div>

        {savedSuccess && (
          <div style={{
            background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 12,
            padding: '12px 18px', color: '#065f46', fontSize: 13, fontWeight: 700,
            marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <CheckCircle2 style={{ width: 18, height: 18, color: '#059669' }} />
            System configuration successfully updated and broadcasted to local services!
          </div>
        )}

        <form onSubmit={handleSaveSettings} style={{ display: 'grid', gap: 20 }}>

          {/* Section 1: Geographic Operations Hub */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 22, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin style={{ width: 18, height: 18, color: '#2563eb' }} />
              Municipal Operations Sector
            </h3>
            <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 16px' }}>
              Base jurisdiction for smart allocation distance calculations and ambulance routing.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Assigned City / Town</label>
                <input
                  type="text" required
                  value={city} onChange={e => setCity(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Postal Pincode</label>
                <input
                  type="text" required
                  value={pincode} onChange={e => setPincode(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>District</label>
                <input
                  type="text" required
                  value={district} onChange={e => setDistrict(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>State</label>
                <input
                  type="text" required
                  value={state} onChange={e => setState(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Emergency Response & Automation */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 22, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Phone style={{ width: 18, height: 18, color: '#dc2626' }} />
              Emergency Response Protocols
            </h3>
            <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 16px' }}>
              Hotline dispatch channels and automated reserve hold policies.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>District Emergency Hotline</label>
                <input
                  type="text" required
                  value={emergencyHotline} onChange={e => setEmergencyHotline(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Citizen Hold Window (Hours)</label>
                <input
                  type="number" min={1} max={24} required
                  value={reservationHoldHours} onChange={e => setReservationHoldHours(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={enableSmsAlerts} onChange={e => setEnableSmsAlerts(e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                Enable Instant SMS Dispatch to on-call duty pharmacists for CRITICAL requests
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={enableAutoShortageAlerts} onChange={e => setEnableAutoShortageAlerts(e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                Automatically notify district drug controller when regional stock drops below 15 units
              </label>
            </div>
          </div>

          {/* Section 3: Save Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button
              type="submit"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '11px 24px', borderRadius: 10, background: '#0f172a',
                color: '#fff', border: 'none', fontWeight: 800, fontSize: 13.5,
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(15,23,42,0.25)',
              }}
            >
              <Save style={{ width: 16, height: 16 }} />
              Save Configuration
            </button>
          </div>

        </form>

      </div>
    </ConsoleLayout>
  );
};
