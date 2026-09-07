import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Settings,
  Bell,
  Shield,
  MapPin,
  Smartphone,
  Save,
  CheckCircle2,
  Lock,
  Globe,
  RefreshCw,
  Info,
} from 'lucide-react';
import { DEFAULT_CITY, DEFAULT_PINCODE } from '../data/mockData';

export const SettingsPage: React.FC = () => {
  const { currentUser, resetToDemoData } = useApp();

  const [smsAlerts, setSmsAlerts] = useState(true);
  const [criticalShortageAlerts, setCriticalShortageAlerts] = useState(true);
  const [autoSmartAllocation, setAutoSmartAllocation] = useState(true);
  const [demoCity, setDemoCity] = useState(DEFAULT_CITY);
  const [demoPincode, setDemoPincode] = useState(DEFAULT_PINCODE);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Settings & Controls</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure telemetry, live SMS notification channels, and demo city parameters for {currentUser.name}.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: Demo City Configuration */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
            <MapPin className="w-4 h-4 text-blue-600" />
            <h3>Municipal Health Operations Sector (Demo City)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Assigned Demo City</label>
              <input
                type="text"
                value={demoCity}
                onChange={(e) => setDemoCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold bg-slate-50"
                disabled
              />
              <p className="text-[10px] text-slate-400 mt-1">Locked to hackathon evaluation hub: Tisaiyanvilai</p>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Postal Code (PIN)</label>
              <input
                type="text"
                value={demoPincode}
                onChange={(e) => setDemoPincode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold bg-slate-50 font-mono"
                disabled
              />
              <p className="text-[10px] text-slate-400 mt-1">Tisaiyanvilai Nodal Postal Zone 627657</p>
            </div>
          </div>
        </div>

        {/* Section 2: Alert Notification Rules */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
            <Bell className="w-4 h-4 text-amber-600" />
            <h3>Emergency Telemetry & Notifications</h3>
          </div>
          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/80 transition-colors">
              <div>
                <p className="font-bold text-slate-800">Critical Shortage & ICU Broadcast Alerts</p>
                <p className="text-[11px] text-slate-500">
                  Receive instant high-priority notifications when emergency medicine drops below threshold in Tisaiyanvilai.
                </p>
              </div>
              <input
                type="checkbox"
                checked={criticalShortageAlerts}
                onChange={(e) => setCriticalShortageAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/80 transition-colors">
              <div>
                <p className="font-bold text-slate-800">SMS / WhatsApp Emergency Token Dispatch</p>
                <p className="text-[11px] text-slate-500">
                  Deliver QR token and reservation pickup codes directly to {currentUser.phone || 'registered phone'}.
                </p>
              </div>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/80 transition-colors">
              <div>
                <p className="font-bold text-slate-800">Autonomous Smart Allocation Optimization</p>
                <p className="text-[11px] text-slate-500">
                  Enable greedy multi-source solver to combine stocks from nearest verified facilities automatically.
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoSmartAllocation}
                onChange={(e) => setAutoSmartAllocation(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>
        </div>

        {/* Section 3: Data Reset & System State */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
            <RefreshCw className="w-4 h-4 text-purple-600" />
            <h3>Demo Simulation State Control</h3>
          </div>
          <p className="text-xs text-slate-500">
            Reset all localized mock data, reservations, emergency requests, and verification logs to default clean states for Smart India Hackathon jury presentation.
          </p>
          <button
            type="button"
            onClick={() => {
              if (confirm('Reset all localStorage simulation data to clean Tisaiyanvilai (627657) seed state?')) {
                resetToDemoData();
                alert('All data restored to default Tisaiyanvilai demo state!');
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-300 hover:border-red-300 font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Entire Simulation to Default Seed State</span>
          </button>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess && (
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Settings successfully saved!</span>
            </div>
          )}
          <button
            type="submit"
            className="ml-auto px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};
