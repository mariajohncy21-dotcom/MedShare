import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import { api } from '../../services/api';
import {
  Building2, ArrowLeft, ShieldCheck, Clock, MapPin, Phone, Mail, FileText,
  Edit2, CheckCircle2, AlertTriangle, User, ShieldAlert,
} from 'lucide-react';

export const PharmacyProfilePage: React.FC = () => {
  const { currentUser, sources, updateSource } = useApp();

  const pharmId = currentUser.sourceId || 'SRC-PHARM-001';
  const pharmSource = sources.find((s) => s.id === pharmId);

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: pharmSource?.name || currentUser.name,
    ownerName: pharmSource?.ownerName || currentUser.name,
    email: pharmSource?.email || currentUser.email,
    phone: pharmSource?.phone || currentUser.phone || '',
    address: pharmSource?.address || 'Tisaiyanvilai Main Road',
    city: pharmSource?.city || 'Tisaiyanvilai',
    district: pharmSource?.district || 'Tirunelveli',
    state: pharmSource?.state || 'Tamil Nadu',
    pincode: pharmSource?.pincode || '627657',
    registrationNumber: pharmSource?.registrationNumber || 'TN-PHA-2026-9921',
    operatingHours: pharmSource?.operatingHours || '08:00 AM - 09:00 PM',
    openingTime: pharmSource?.openingTime || '08:00 AM',
    closingTime: pharmSource?.closingTime || '09:00 PM',
    is24Hours: Boolean(pharmSource?.is24Hours),
    latitude: pharmSource?.latitude || 8.4184,
    longitude: pharmSource?.longitude || 77.8732,
    emergencySupport24x7: Boolean(pharmSource?.emergencySupport24x7),
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isApproved = pharmSource?.verificationStatus === 'APPROVED' || currentUser.verificationStatus === 'APPROVED';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);

    // If license number changed, set verification to PENDING
    const licenseChanged = form.registrationNumber !== (pharmSource?.registrationNumber || 'TN-PHA-2026-9921');
    const newStatus = licenseChanged ? 'PENDING' : (pharmSource?.verificationStatus || 'APPROVED');

    try {
      if (pharmSource) {
        updateSource(pharmSource.id, {
          ...form,
          verificationStatus: newStatus,
          isVerified: newStatus === 'APPROVED',
        });
      }

      setIsSaving(false);
      setIsEditing(false);
      setSuccessMessage(
        licenseChanged
          ? 'Profile updated! Registration license number change submitted for Admin re-verification.'
          : 'Pharmacy profile updated successfully!'
      );
    } catch (err: any) {
      setIsSaving(false);
      alert(err.message || 'Failed to update pharmacy profile.');
    }
  };

  return (
    <ConsoleLayout>
      <div className="console-page-container" style={{ maxWidth: 960, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
        
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Pharmacy Official Profile
              </h1>
              {isApproved ? (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 99,
                  background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0',
                }}>
                  <ShieldCheck style={{ width: 13, height: 13 }} />
                  Verified ✓
                </span>
              ) : (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 99,
                  background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a',
                }}>
                  <AlertTriangle style={{ width: 13, height: 13 }} />
                  Verification Pending
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
              Official drug control license details and public map locator information
            </p>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '9px 16px', background: isEditing ? '#f1f5f9' : '#0d9488',
              color: isEditing ? '#475569' : '#fff', fontWeight: 700, fontSize: 13,
              border: isEditing ? '1px solid #cbd5e1' : 'none', borderRadius: 10, cursor: 'pointer',
            }}
          >
            <Edit2 style={{ width: 15, height: 15 }} />
            {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </button>
        </div>

        {successMessage && (
          <div style={{
            padding: '12px 16px', background: '#ecfdf5', border: '1px solid #a7f3d0',
            borderRadius: 12, fontSize: 13, color: '#047857', fontWeight: 700, marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <CheckCircle2 style={{ width: 16, height: 16 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Profile Card */}
        <div style={{
          background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden',
        }}>
          {!isEditing ? (
            <div style={{ padding: 'clamp(16px, 4vw, 32px)', display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* Brand Top Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 20, borderBottom: '1px solid #f1f5f9' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                  fontSize: 24, fontWeight: 900, boxShadow: '0 4px 12px rgba(13,148,136,0.3)',
                }}>
                  {form.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                    {form.name}
                  </h2>
                  <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                    Authorized Person: <strong>{form.ownerName}</strong>
                  </p>
                </div>
              </div>

              {/* Grid Information */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, fontSize: 13.5 }}>
                
                <div style={{ background: '#fafbfc', padding: 16, borderRadius: 12, border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>
                    License &amp; Registration
                  </div>
                  <div style={{ fontWeight: 800, color: '#1e40af', fontFamily: 'monospace', fontSize: 14 }}>
                    {form.registrationNumber}
                  </div>
                  <div style={{ fontSize: 12, color: '#059669', fontWeight: 700, marginTop: 4 }}>
                    Status: {isApproved ? 'APPROVED ✓' : 'PENDING APPROVAL'}
                  </div>
                </div>

                <div style={{ background: '#fafbfc', padding: 16, borderRadius: 12, border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>
                    Contact Information
                  </div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{form.phone || 'No phone set'}</div>
                  <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{form.email}</div>
                </div>

                <div style={{ background: '#fafbfc', padding: 16, borderRadius: 12, border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>
                    Facility Location
                  </div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{form.address}</div>
                  <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
                    {form.city}, {form.district}, {form.state} - {form.pincode}
                  </div>
                </div>

                <div style={{ background: '#fafbfc', padding: 16, borderRadius: 12, border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>
                    Operating Hours &amp; Schedule
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{form.operatingHours}</div>
                    <span style={{
                      fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 99,
                      background: form.is24Hours ? '#ecfdf5' : '#fffbeb',
                      color: form.is24Hours ? '#065f46' : '#92400e',
                      border: form.is24Hours ? '1px solid #a7f3d0' : '1px solid #fde68a',
                    }}>
                      {form.is24Hours ? '🟢 24 Hours Open (Full Day)' : '🕒 08:00 AM - 09:00 PM'}
                    </span>
                  </div>
                  <div style={{ color: '#475569', fontSize: 12, marginTop: 4 }}>
                    Opening: <strong>{form.openingTime || '08:00 AM'}</strong> • Closing: <strong>{form.closingTime || '09:00 PM'}</strong>
                  </div>
                  <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
                    GPS Coordinates: {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <form onSubmit={handleSave} style={{ padding: 'clamp(16px, 4vw, 32px)', display: 'flex', flexDirection: 'column', gap: 18 }}>
              
              <div className="responsive-form-grid" style={{ gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Pharmacy Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 13, borderRadius: 8, border: '1.5px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Owner / Authorized Person</label>
                  <input
                    type="text"
                    value={form.ownerName}
                    onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 13, borderRadius: 8, border: '1.5px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div className="responsive-form-grid" style={{ gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Contact Phone Number</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 13, borderRadius: 8, border: '1.5px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                    License / Registration Number (Triggers Re-Verification)
                  </label>
                  <input
                    type="text"
                    value={form.registrationNumber}
                    onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 13, fontFamily: 'monospace', fontWeight: 700, borderRadius: 8, border: '1.5px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13, borderRadius: 8, border: '1.5px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, borderRadius: 7, border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>District</label>
                  <input
                    type="text"
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, borderRadius: 7, border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Pincode</label>
                  <input
                    type="text"
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, borderRadius: 7, border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Operating Hours & Timing Presets */}
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 800, color: '#1e293b' }}>
                    Pharmacy Operating Hours &amp; Schedule Presets
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => setForm({
                        ...form,
                        is24Hours: true,
                        openingTime: '12:00 AM',
                        closingTime: '11:59 PM',
                        operatingHours: '24 Hours Open (Full Day)',
                        emergencySupport24x7: true,
                      })}
                      style={{
                        padding: '4px 10px', fontSize: 11, fontWeight: 800, borderRadius: 6,
                        background: form.is24Hours ? '#065f46' : '#ecfdf5',
                        color: form.is24Hours ? '#fff' : '#047857',
                        border: '1px solid #a7f3d0', cursor: 'pointer',
                      }}
                    >
                      🟢 24h Full Day Preset
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({
                        ...form,
                        is24Hours: false,
                        openingTime: '08:00 AM',
                        closingTime: '09:00 PM',
                        operatingHours: '08:00 AM - 09:00 PM',
                        emergencySupport24x7: false,
                      })}
                      style={{
                        padding: '4px 10px', fontSize: 11, fontWeight: 800, borderRadius: 6,
                        background: !form.is24Hours ? '#92400e' : '#fffbeb',
                        color: !form.is24Hours ? '#fff' : '#b45309',
                        border: '1px solid #fde68a', cursor: 'pointer',
                      }}
                    >
                      🕒 08:00 AM - 09:00 PM Preset
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 3 }}>Opening Time</label>
                    <input
                      type="text"
                      value={form.openingTime}
                      onChange={(e) => {
                        const newOpen = e.target.value;
                        setForm({
                          ...form,
                          openingTime: newOpen,
                          operatingHours: form.is24Hours ? '24 Hours Open (Full Day)' : `${newOpen} - ${form.closingTime}`,
                        });
                      }}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, borderRadius: 7, border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 3 }}>Closing Time</label>
                    <input
                      type="text"
                      value={form.closingTime}
                      onChange={(e) => {
                        const newClose = e.target.value;
                        setForm({
                          ...form,
                          closingTime: newClose,
                          operatingHours: form.is24Hours ? '24 Hours Open (Full Day)' : `${form.openingTime} - ${newClose}`,
                        });
                      }}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, borderRadius: 7, border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{ padding: '9px 16px', background: '#f1f5f9', color: '#475569', fontWeight: 600, fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{ padding: '9px 20px', background: '#0d9488', color: '#fff', fontWeight: 800, fontSize: 13, border: 'none', borderRadius: 8, cursor: isSaving ? 'not-allowed' : 'pointer' }}
                >
                  {isSaving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </ConsoleLayout>
  );
};
