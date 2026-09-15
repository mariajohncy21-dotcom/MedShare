import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import { api } from '../../services/api';
import { HospitalPatient } from '../../types';
import {
  Users, Stethoscope, Search, Plus, Edit2, Trash2, ArrowLeft,
  CheckCircle2, AlertTriangle, Activity, X, User, HeartPulse,
  Filter, Phone, Calendar, Bed,
} from 'lucide-react';

const EMPTY_PATIENT: Omit<HospitalPatient, 'id' | 'hospitalId' | 'createdAt'> = {
  name: '',
  age: undefined,
  gender: 'Male',
  contact: '',
  admissionDate: new Date().toISOString().split('T')[0],
  ward: 'General Medicine Ward',
  bed: '',
  emergencyStatus: 'STABLE',
  department: 'General Medicine',
  status: 'ADMITTED',
  notes: '',
};

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  ADMITTED: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  DISCHARGED: { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
  ICU: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  TRANSFERRED: { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' },
  STABLE: { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
  CRITICAL: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  URGENT: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
};

export const HospitalPatientsPage: React.FC = () => {
  const { currentUser, sources } = useApp();
  const hospId = currentUser.sourceId || 'SRC-HOSP-001';
  const hospSource = sources.find((s) => s.id === hospId);

  const [patients, setPatients] = useState<HospitalPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [wardFilter, setWardFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<HospitalPatient | null>(null);
  const [form, setForm] = useState<Omit<HospitalPatient, 'id' | 'hospitalId' | 'createdAt'>>(EMPTY_PATIENT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const data = await api.hospitalPatients.getAll();
      setPatients(data);
    } catch (err: any) {
      console.warn('Failed to load hospital patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [hospId]);

  const wards = useMemo(() => {
    const list = Array.from(new Set(patients.map((p) => p.ward).filter(Boolean)));
    return ['ALL', ...list];
  }, [patients]);

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase()) ||
        (p.contact || '').includes(search) ||
        (p.bed || '').toLowerCase().includes(search.toLowerCase());
      const matchesWard = wardFilter === 'ALL' || p.ward === wardFilter;
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchesSearch && matchesWard && matchesStatus;
    });
  }, [patients, search, wardFilter, statusFilter]);

  const openNewPatient = () => {
    setEditingPatient(null);
    setForm({ ...EMPTY_PATIENT, admissionDate: new Date().toISOString().split('T')[0] });
    setError(null);
    setShowModal(true);
  };

  const openEditPatient = (p: HospitalPatient) => {
    setEditingPatient(p);
    setForm({
      name: p.name,
      age: p.age,
      gender: p.gender,
      contact: p.contact || '',
      admissionDate: p.admissionDate,
      ward: p.ward,
      bed: p.bed || '',
      emergencyStatus: p.emergencyStatus,
      department: p.department,
      status: p.status,
      notes: p.notes || '',
    });
    setError(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.ward.trim()) {
      setError('Patient Name and Ward are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editingPatient) {
        const updated = await api.hospitalPatients.update(editingPatient.id, form);
        setPatients((prev) => prev.map((p) => (p.id === editingPatient.id ? updated : p)));
        setSuccessMsg(`Patient record ${editingPatient.id} updated successfully.`);
      } else {
        const created = await api.hospitalPatients.create(form);
        setPatients((prev) => [created, ...prev]);
        setSuccessMsg(`New patient ${created.name} registered with ID ${created.id}.`);
      }
      setShowModal(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to save patient record.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove patient record for ${name}?`)) return;
    try {
      await api.hospitalPatients.delete(id);
      setPatients((prev) => prev.filter((p) => p.id !== id));
      setSuccessMsg(`Patient ${name} removed from registry.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete patient record.');
    }
  };

  return (
    <ConsoleLayout>
      <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
        
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
                Hospital Inpatient &amp; Admission Registry
              </h1>
              <span style={{
                fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe',
              }}>
                {patients.length} Active Records
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
              {hospSource?.name || currentUser.name} · Real-time bed assignments, ward monitoring, and medicine needs
            </p>
          </div>

          <button
            onClick={openNewPatient}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', background: '#6d28d9', color: '#fff',
              fontSize: 13, fontWeight: 700, borderRadius: 10, border: 'none',
              cursor: 'pointer', boxShadow: '0 4px 14px rgba(109,40,217,0.3)',
            }}
          >
            <Plus style={{ width: 16, height: 16 }} />
            Register Inpatient
          </button>
        </div>

        {successMsg && (
          <div style={{
            padding: '12px 16px', background: '#ecfdf5', border: '1px solid #a7f3d0',
            borderRadius: 10, color: '#065f46', fontSize: 13, fontWeight: 600,
            marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <CheckCircle2 style={{ width: 16, height: 16, color: '#059669' }} />
            {successMsg}
          </div>
        )}

        {/* Filters */}
        <div style={{
          background: '#fff', borderRadius: 14, padding: '16px 20px',
          border: '1px solid #e2e8f0', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
              <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search patient name, ID, ward, or bed..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '9px 12px 9px 36px', fontSize: 13,
                  border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none',
                  background: '#f8fafc',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter style={{ width: 14, height: 14, color: '#64748b' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Ward:</span>
              <select
                value={wardFilter}
                onChange={(e) => setWardFilter(e.target.value)}
                style={{
                  padding: '7px 10px', fontSize: 12.5, borderRadius: 8,
                  border: '1.5px solid #e2e8f0', background: '#fff', outline: 'none',
                }}
              >
                {wards.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '7px 10px', fontSize: 12.5, borderRadius: 8,
                  border: '1.5px solid #e2e8f0', background: '#fff', outline: 'none',
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="ADMITTED">Admitted</option>
                <option value="ICU">ICU Critical</option>
                <option value="TRANSFERRED">Transferred</option>
                <option value="DISCHARGED">Discharged</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
              Loading hospital inpatient directory...
            </div>
          ) : filteredPatients.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <Users style={{ width: 36, height: 36, color: '#cbd5e1', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>No Patient Records Found</p>
              <p style={{ fontSize: 13, color: '#64748b', margin: '6px 0 16px' }}>
                {search ? 'No patient matched your search criteria.' : 'Register patients to manage bed allocations and medication requirements.'}
              </p>
              <button
                onClick={openNewPatient}
                style={{
                  padding: '8px 16px', background: '#6d28d9', color: '#fff',
                  fontSize: 12.5, fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer',
                }}
              >
                Register Inpatient
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#fafbfc', borderBottom: '1.5px solid #f1f5f9', textAlign: 'left' }}>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Patient ID &amp; Name</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Demographics</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Ward &amp; Bed</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Department</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Acuity Status</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Admitted Date</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((p) => {
                    const statusConf = STATUS_COLORS[p.status] || STATUS_COLORS.ADMITTED;
                    const acuityConf = STATUS_COLORS[p.emergencyStatus] || STATUS_COLORS.STABLE;

                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: 9,
                              background: '#f5f3ff', color: '#6d28d9',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 800, fontSize: 13, flexShrink: 0,
                            }}>
                              {p.name.charAt(0)}
                            </div>
                            <div>
                              <p style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>{p.name}</p>
                              <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0', fontFamily: 'monospace' }}>{p.id}</p>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px', color: '#475569' }}>
                          <div>
                            <span style={{ fontWeight: 600 }}>{p.age ? `${p.age} yrs` : 'Age N/A'}</span> · {p.gender}
                            {p.contact && (
                              <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>{p.contact}</p>
                            )}
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Bed style={{ width: 14, height: 14, color: '#6d28d9' }} />
                            <div>
                              <p style={{ fontWeight: 600, color: '#1e293b', margin: 0 }}>{p.ward}</p>
                              <p style={{ fontSize: 11, color: '#64748b', margin: '1px 0 0' }}>{p.bed ? `Bed: ${p.bed}` : 'Bed Unassigned'}</p>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px', color: '#334155', fontWeight: 500 }}>
                          {p.department}
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{
                              display: 'inline-block', fontSize: 10.5, fontWeight: 800,
                              padding: '2px 8px', borderRadius: 99,
                              background: statusConf.bg, color: statusConf.color, border: `1px solid ${statusConf.border}`,
                              width: 'fit-content',
                            }}>
                              {p.status}
                            </span>
                            <span style={{
                              display: 'inline-block', fontSize: 10, fontWeight: 700,
                              padding: '2px 7px', borderRadius: 99,
                              background: acuityConf.bg, color: acuityConf.color, border: `1px solid ${acuityConf.border}`,
                              width: 'fit-content',
                            }}>
                              Acuity: {p.emergencyStatus}
                            </span>
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px', color: '#64748b', fontSize: 12 }}>
                          {p.admissionDate}
                        </td>

                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                            <button
                              onClick={() => openEditPatient(p)}
                              title="Edit patient"
                              style={{
                                padding: '6px 9px', background: '#f8fafc', border: '1px solid #e2e8f0',
                                borderRadius: 7, cursor: 'pointer', color: '#475569',
                              }}
                            >
                              <Edit2 style={{ width: 13, height: 13 }} />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id, p.name)}
                              title="Remove record"
                              style={{
                                padding: '6px 9px', background: '#fef2f2', border: '1px solid #fecaca',
                                borderRadius: 7, cursor: 'pointer', color: '#dc2626',
                              }}
                            >
                              <Trash2 style={{ width: 13, height: 13 }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
            backdropFilter: 'blur(3px)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}>
            <div style={{
              background: '#fff', borderRadius: 18, maxWidth: 540, width: '100%',
              border: '1px solid #e2e8f0', boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
              overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
            }}>
              <div style={{
                padding: '18px 24px', borderBottom: '1px solid #f1f5f9',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#fafbfc',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: '#f5f3ff', color: '#6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Stethoscope style={{ width: 18, height: 18 }} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    {editingPatient ? `Edit Patient: ${editingPatient.name}` : 'Register New Inpatient'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X style={{ width: 18, height: 18 }} />
                </button>
              </div>

              <form onSubmit={handleSave} style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {error && (
                  <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 12.5 }}>
                    {error}
                  </div>
                )}

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>
                    Patient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Age</label>
                    <input
                      type="number"
                      placeholder="e.g. 45"
                      value={form.age || ''}
                      onChange={(e) => setForm({ ...form, age: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                      style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Gender</label>
                    <select
                      value={form.gender}
                      onChange={(e: any) => setForm({ ...form, gender: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none', background: '#fff' }}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Contact Number</label>
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={form.contact || ''}
                      onChange={(e) => setForm({ ...form, contact: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Admission Date</label>
                    <input
                      type="date"
                      value={form.admissionDate}
                      onChange={(e) => setForm({ ...form, admissionDate: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Ward *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ICU Ward 2, General Ward"
                      value={form.ward}
                      onChange={(e) => setForm({ ...form, ward: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Bed Number</label>
                    <input
                      type="text"
                      placeholder="e.g. Bed B-04"
                      value={form.bed || ''}
                      onChange={(e) => setForm({ ...form, bed: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Department</label>
                    <input
                      type="text"
                      placeholder="e.g. Cardiology, Surgery"
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Acuity Status</label>
                    <select
                      value={form.emergencyStatus}
                      onChange={(e: any) => setForm({ ...form, emergencyStatus: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none', background: '#fff' }}
                    >
                      <option value="STABLE">Stable</option>
                      <option value="URGENT">Urgent</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Admission Status</label>
                  <select
                    value={form.status}
                    onChange={(e: any) => setForm({ ...form, status: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none', background: '#fff' }}
                  >
                    <option value="ADMITTED">Admitted</option>
                    <option value="ICU">ICU Critical</option>
                    <option value="TRANSFERRED">Transferred</option>
                    <option value="DISCHARGED">Discharged</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>Clinical Notes / Prescribed Meds</label>
                  <textarea
                    rows={3}
                    placeholder="Diagnosis details, medication requirements, special instructions..."
                    value={form.notes || ''}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{ padding: '9px 16px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{ padding: '9px 20px', background: '#6d28d9', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}
                  >
                    {saving ? 'Saving...' : editingPatient ? 'Save Changes' : 'Register Patient'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ConsoleLayout>
  );
};
