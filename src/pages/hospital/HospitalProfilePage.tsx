import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import {
  Hospital, ArrowLeft, ShieldCheck, Clock, MapPin, Phone, Mail, FileText,
  Edit2, CheckCircle2, AlertTriangle, ShieldAlert,
} from 'lucide-react';

export const HospitalProfilePage: React.FC = () => {
  const { currentUser, sources, updateSource } = useApp();

  const hospId = currentUser.sourceId || 'SRC-HOSP-001';
  const hospSource = sources.find((s) => s.id === hospId);

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: hospSource?.name || currentUser.name,
    ownerName: hospSource?.ownerName || currentUser.name,
    email: hospSource?.email || currentUser.email,
    phone: hospSource?.phone || currentUser.phone || '',
    address: hospSource?.address || 'Kamarajar Salai',
    city: hospSource?.city || 'Tisaiyanvilai',
    district: hospSource?.district || 'Tirunelveli',
    state: hospSource?.state || 'Tamil Nadu',
    pincode: hospSource?.pincode || '627657',
    registrationNumber: hospSource?.registrationNumber || 'TN-HOS-2026-4412',
    hospitalType: (hospSource as any)?.hospitalType || 'Multi-Specialty Emergency Hospital',
    operatingHours: hospSource?.operatingHours || '24x7 Emergency Trauma Care',
    latitude: hospSource?.latitude || 8.4184,
    longitude: hospSource?.longitude || 77.8732,
    emergencySupport24x7: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isApproved =
    hospSource?.verificationStatus === 'APPROVED' || currentUser.verificationStatus === 'APPROVED';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);

    // If license number or address changed, set verification to PENDING for admin review
    const licenseChanged = form.registrationNumber !== (hospSource?.registrationNumber || 'TN-HOS-2026-4412');
    const newStatus = licenseChanged ? 'PENDING' : (hospSource?.verificationStatus || 'APPROVED');

    try {
      if (hospSource) {
        updateSource(hospSource.id, {
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
          : 'Hospital profile updated successfully!'
      );
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setIsSaving(false);
      alert(err.message || 'Failed to update hospital profile.');
    }
  };

  return (
    <ConsoleLayout>
      <div className="console-page-container" style={{ maxWidth: 960, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
        
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
                Hospital Official Facility Profile
              </h1>
              {isApproved ? (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 99,
                  background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0',
                }}>
                  <ShieldCheck style={{ width: 13, height: 13 }} />
                  Verified Hospital ✓
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
              Official clinical emergency node registration details and public coordinates
            </p>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '9px 16px', background: isEditing ? '#f1f5f9' : '#6d28d9',
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

        <div style={{
          background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden',
        }}>
          {/* Header Strip */}
          <div style={{
            padding: 'clamp(16px, 4vw, 24px) clamp(16px, 4vw, 28px)', background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
            borderBottom: '1px solid #ddd6fe', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: 14,
              background: '#6d28d9', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 16px rgba(109,40,217,0.3)', flexShrink: 0,
            }}>
              <Hospital style={{ width: 30, height: 30 }} />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                {hospSource?.name || currentUser.name}
              </h2>
              <p style={{ fontSize: 13, color: '#6d28d9', fontWeight: 600, margin: '3px 0 0' }}>
                ID: {hospId} · Registration: {form.registrationNumber}
              </p>
            </div>
          </div>

          {/* Form or View */}
          <form onSubmit={handleSave} style={{ padding: 'clamp(16px, 4vw, 28px)' }}>
            <div className="responsive-form-grid" style={{ gap: 20 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>
                  Hospital Official Name
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{
                    width: '100%', padding: '9px 12px', fontSize: 13,
                    border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none',
                    background: isEditing ? '#fff' : '#f8fafc',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>
                  Authorized Medical Superintendent / In-Charge
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                  style={{
                    width: '100%', padding: '9px 12px', fontSize: 13,
                    border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none',
                    background: isEditing ? '#fff' : '#f8fafc',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>
                  Official Email Address
                </label>
                <input
                  type="email"
                  disabled={!isEditing}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={{
                    width: '100%', padding: '9px 12px', fontSize: 13,
                    border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none',
                    background: isEditing ? '#fff' : '#f8fafc',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>
                  Emergency Trauma Hotline / Contact
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  style={{
                    width: '100%', padding: '9px 12px', fontSize: 13,
                    border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none',
                    background: isEditing ? '#fff' : '#f8fafc',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>
                  State Drug Authority License Number
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={form.registrationNumber}
                  onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
                  style={{
                    width: '100%', padding: '9px 12px', fontSize: 13, fontFamily: 'monospace',
                    border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none',
                    background: isEditing ? '#fff' : '#f8fafc',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>
                  Hospital Classification
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={form.hospitalType}
                  onChange={(e) => setForm({ ...form, hospitalType: e.target.value })}
                  style={{
                    width: '100%', padding: '9px 12px', fontSize: 13,
                    border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none',
                    background: isEditing ? '#fff' : '#f8fafc',
                  }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>
                  Address &amp; Landmark
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  style={{
                    width: '100%', padding: '9px 12px', fontSize: 13,
                    border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none',
                    background: isEditing ? '#fff' : '#f8fafc',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>City / Town</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none', background: isEditing ? '#fff' : '#f8fafc' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Pincode</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none', background: isEditing ? '#fff' : '#f8fafc' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>GPS Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  disabled={!isEditing}
                  value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none', background: isEditing ? '#fff' : '#f8fafc' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>GPS Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  disabled={!isEditing}
                  value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none', background: isEditing ? '#fff' : '#f8fafc' }}
                />
              </div>
            </div>

            {isEditing && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 24, paddingTop: 18, borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{ padding: '9px 16px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{ padding: '9px 22px', background: '#6d28d9', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: isSaving ? 'not-allowed' : 'pointer' }}
                >
                  {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </ConsoleLayout>
  );
};
