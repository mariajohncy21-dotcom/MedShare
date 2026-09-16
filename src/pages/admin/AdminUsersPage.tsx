import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import { User, UserRole } from '../../types';
import { MOCK_USERS } from '../../data/mockData';
import {
  Users, Search, Filter, ShieldCheck, ShieldAlert, UserCheck, UserX,
  Plus, Mail, Phone, MapPin, Building2, Hospital, CheckCircle2,
  AlertCircle, X
} from 'lucide-react';

const INITIAL_EXTRA_USERS: User[] = [
  {
    id: 'USR-PAT-002',
    name: 'Priya Sundaram',
    email: 'priya.sundaram@gmail.com',
    role: 'PATIENT',
    phone: '+91 94421 55670',
    city: 'Tisaiyanvilai',
    address: '45 Radhapuram Road, Tisaiyanvilai',
    accountStatus: 'ACTIVE',
    verificationStatus: 'APPROVED',
  },
  {
    id: 'USR-PAT-003',
    name: 'Karthik Raja',
    email: 'karthik.raja92@gmail.com',
    role: 'PATIENT',
    phone: '+91 98940 12345',
    city: 'Tisaiyanvilai',
    address: '12 Udangudi High Road, Tisaiyanvilai',
    accountStatus: 'ACTIVE',
    verificationStatus: 'APPROVED',
  },
  {
    id: 'USR-PHARM-02',
    name: 'MedPlus Pharmacy Tisaiyanvilai',
    email: 'medplus.tisai@medshare.org',
    role: 'PHARMACY',
    sourceId: 'SRC-PHARM-002',
    phone: '+91 94433 11223',
    city: 'Tisaiyanvilai',
    address: 'Bus Stand Complex, Tisaiyanvilai',
    accountStatus: 'ACTIVE',
    verificationStatus: 'APPROVED',
  },
  {
    id: 'USR-HOSP-02',
    name: 'Tisai Community Trauma Center',
    email: 'trauma.tisai@medshare.org',
    role: 'HOSPITAL',
    sourceId: 'SRC-HOSP-002',
    phone: '+91 4637 272300',
    city: 'Tisaiyanvilai',
    address: 'Sathankulam Road, Tisaiyanvilai',
    accountStatus: 'ACTIVE',
    verificationStatus: 'APPROVED',
  },
  {
    id: 'USR-PAT-004',
    name: 'Murugan Ganesan',
    email: 'murugan.g@outlook.com',
    role: 'PATIENT',
    phone: '+91 97890 65432',
    city: 'Tisaiyanvilai',
    address: '7 East Health Corridor, Tisaiyanvilai',
    accountStatus: 'SUSPENDED',
    verificationStatus: 'SUSPENDED',
  },
];

export const AdminUsersPage: React.FC = () => {
  const { currentUser, sources } = useApp();

  const [usersList, setUsersList] = useState<User[]>(() => {
    const base = Object.values(MOCK_USERS);
    return [...base, ...INITIAL_EXTRA_USERS];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'ALL' | UserRole>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  const [inspectUser, setInspectUser] = useState<User | null>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  // New User Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('PATIENT');
  const [newUserAddress, setNewUserAddress] = useState('');
  const [formMsg, setFormMsg] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      const matchRole = selectedRole === 'ALL' || u.role === selectedRole;
      const matchStatus = selectedStatus === 'ALL' || (u.accountStatus || 'ACTIVE') === selectedStatus;
      const matchSearch = !searchQuery ||
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.phone && u.phone.includes(searchQuery));
      return matchRole && matchStatus && matchSearch;
    });
  }, [usersList, selectedRole, selectedStatus, searchQuery]);

  const stats = useMemo(() => {
    const total = usersList.length;
    const patients = usersList.filter(u => u.role === 'PATIENT').length;
    const pharmacies = usersList.filter(u => u.role === 'PHARMACY').length;
    const hospitals = usersList.filter(u => u.role === 'HOSPITAL').length;
    const suspended = usersList.filter(u => u.accountStatus === 'SUSPENDED').length;
    return { total, patients, pharmacies, hospitals, suspended };
  }, [usersList]);

  const handleToggleStatus = (userId: string) => {
    setUsersList(prev => prev.map(u => {
      if (u.id === userId) {
        const nextStatus = u.accountStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
        return { ...u, accountStatus: nextStatus, verificationStatus: nextStatus === 'ACTIVE' ? 'APPROVED' : 'SUSPENDED' };
      }
      return u;
    }));
    if (inspectUser && inspectUser.id === userId) {
      setInspectUser(prev => prev ? { ...prev, accountStatus: prev.accountStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED' } : null);
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      setFormMsg('Please enter both name and email.');
      return;
    }
    const newUser: User = {
      id: `USR-${newUserRole.slice(0, 4)}-${Date.now().toString().slice(-4)}`,
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      phone: newUserPhone.trim() || '+91 94400 00000',
      role: newUserRole,
      city: 'Tisaiyanvilai',
      address: newUserAddress.trim() || 'Tisaiyanvilai, Tamil Nadu',
      accountStatus: 'ACTIVE',
      verificationStatus: 'APPROVED',
    };
    setUsersList(prev => [newUser, ...prev]);
    setIsAddUserOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPhone('');
    setNewUserAddress('');
    setFormMsg(null);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'PATIENT': return { bg: '#eff6ff', text: '#1d4ed8', label: 'Patient / Citizen' };
      case 'PHARMACY': return { bg: '#f0fdfa', text: '#0f766e', label: 'Pharmacy' };
      case 'HOSPITAL': return { bg: '#f5f3ff', text: '#6d28d9', label: 'Hospital' };
      case 'ADMIN': return { bg: '#fdf2f8', text: '#9d174d', label: 'System Admin' };
    }
  };

  return (
    <ConsoleLayout>
      <div style={{ padding: '24px 28px', maxWidth: 1300, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Users style={{ width: 26, height: 26, color: '#9d174d' }} />
              User Accounts Directory
            </h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              Manage registered citizens, facility personnel, and administrative accounts in Tisaiyanvilai sector.
            </p>
          </div>
          <button
            onClick={() => setIsAddUserOpen(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', borderRadius: 10,
              background: '#9d174d', color: '#fff', border: 'none',
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(157,23,77,0.3)',
            }}
          >
            <Plus style={{ width: 16, height: 16 }} />
            Add New User
          </button>
        </div>

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 24 }}>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0, fontWeight: 600 }}>Total Accounts</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '4px 0 0' }}>{stats.total}</p>
          </div>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #bfdbfe', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#1d4ed8', margin: 0, fontWeight: 600 }}>Citizens / Patients</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#1d4ed8', margin: '4px 0 0' }}>{stats.patients}</p>
          </div>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #99f6e4', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#0f766e', margin: 0, fontWeight: 600 }}>Pharmacy Accounts</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#0f766e', margin: '4px 0 0' }}>{stats.pharmacies}</p>
          </div>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #ddd6fe', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#6d28d9', margin: 0, fontWeight: 600 }}>Hospital Staff</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#6d28d9', margin: '4px 0 0' }}>{stats.hospitals}</p>
          </div>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #fecaca', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#dc2626', margin: 0, fontWeight: 600 }}>Suspended Accounts</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#dc2626', margin: '4px 0 0' }}>{stats.suspended}</p>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div style={{
          background: '#fff', borderRadius: 14, padding: '14px 18px',
          border: '1px solid #e2e8f0', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: 8, padding: '8px 12px', flex: 1,
            }}>
              <Search style={{ width: 16, height: 16, color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search user by name, email, or phone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  border: 'none', background: 'transparent', outline: 'none',
                  fontSize: 13, width: '100%', color: '#0f172a',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value as any)}
              style={{
                padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
                background: '#f8fafc', fontSize: 13, fontWeight: 600, color: '#334155',
                outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="ALL">All Roles</option>
              <option value="PATIENT">Citizens / Patients</option>
              <option value="PHARMACY">Pharmacies</option>
              <option value="HOSPITAL">Hospitals</option>
              <option value="ADMIN">Admins</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value as any)}
              style={{
                padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
                background: '#f8fafc', fontSize: 13, fontWeight: 600, color: '#334155',
                outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>User</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Role</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Contact Details</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Location / Facility</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Status</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                      No users match the search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => {
                    const rBadge = getRoleBadge(user.role);
                    const isSuspended = user.accountStatus === 'SUSPENDED';
                    return (
                      <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s ease' }} onMouseEnter={e => e.currentTarget.style.background = '#fafafa'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 38, height: 38, borderRadius: 10,
                              background: rBadge.bg, color: rBadge.text,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 800, fontSize: 14, border: `1px solid ${rBadge.text}30`,
                            }}>
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p style={{ margin: 0, fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>
                                {user.name}
                              </p>
                              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8' }}>
                                ID: {user.id}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            padding: '4px 9px', borderRadius: 99,
                            background: rBadge.bg, color: rBadge.text,
                            fontSize: 11, fontWeight: 700, border: `1px solid ${rBadge.text}30`,
                          }}>
                            {rBadge.label}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontSize: 12.5, color: '#334155' }}>
                            <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Mail style={{ width: 13, height: 13, color: '#94a3b8' }} /> {user.email}
                            </p>
                            {user.phone && (
                              <p style={{ margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 6, color: '#64748b' }}>
                                <Phone style={{ width: 13, height: 13, color: '#94a3b8' }} /> {user.phone}
                              </p>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontSize: 12.5, color: '#475569' }}>
                            <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <MapPin style={{ width: 13, height: 13, color: '#94a3b8' }} /> {user.city || 'Tisaiyanvilai'}
                            </p>
                            {user.sourceId && (
                              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#2563eb', fontWeight: 600 }}>
                                Facility ID: {user.sourceId}
                              </p>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            padding: '4px 9px', borderRadius: 99,
                            background: isSuspended ? '#fef2f2' : '#f0fdf4',
                            color: isSuspended ? '#dc2626' : '#166534',
                            border: `1px solid ${isSuspended ? '#fecaca' : '#bbf7d0'}`,
                            fontSize: 11, fontWeight: 700,
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                          }}>
                            {isSuspended ? <ShieldAlert style={{ width: 12, height: 12 }} /> : <ShieldCheck style={{ width: 12, height: 12 }} />}
                            {isSuspended ? 'Suspended' : 'Active'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <button
                              onClick={() => setInspectUser(user)}
                              style={{
                                padding: '6px 11px', borderRadius: 7,
                                background: '#f8fafc', border: '1px solid #e2e8f0',
                                color: '#334155', fontSize: 12, fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              View
                            </button>
                            {user.id !== currentUser.id && (
                              <button
                                onClick={() => handleToggleStatus(user.id)}
                                style={{
                                  padding: '6px 11px', borderRadius: 7,
                                  background: isSuspended ? '#ecfdf5' : '#fff1f2',
                                  border: `1px solid ${isSuspended ? '#a7f3d0' : '#fecdd3'}`,
                                  color: isSuspended ? '#059669' : '#e11d48',
                                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                }}
                              >
                                {isSuspended ? 'Activate' : 'Suspend'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Details Modal */}
        {inspectUser && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
          }}>
            <div style={{
              background: '#fff', borderRadius: 16, maxWidth: 500, width: '100%',
              padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', position: 'relative',
            }}>
              <button
                onClick={() => setInspectUser(null)}
                style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X style={{ width: 20, height: 20 }} />
              </button>
              <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                Account Dossier: {inspectUser.name}
              </h3>
              <div style={{ display: 'grid', gap: 12, fontSize: 13 }}>
                <div><strong>System ID:</strong> <span style={{ fontFamily: 'monospace', color: '#64748b' }}>{inspectUser.id}</span></div>
                <div><strong>Email:</strong> {inspectUser.email}</div>
                <div><strong>Phone:</strong> {inspectUser.phone || 'N/A'}</div>
                <div><strong>Assigned Role:</strong> {inspectUser.role}</div>
                <div><strong>Current Status:</strong> {inspectUser.accountStatus || 'ACTIVE'}</div>
                <div><strong>Sector / Address:</strong> {inspectUser.address || 'Tisaiyanvilai'}</div>
                {inspectUser.sourceId && <div><strong>Linked Facility:</strong> {inspectUser.sourceId}</div>}
              </div>
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                {inspectUser.id !== currentUser.id && (
                  <button
                    onClick={() => handleToggleStatus(inspectUser.id)}
                    style={{
                      padding: '8px 16px', borderRadius: 8,
                      background: inspectUser.accountStatus === 'SUSPENDED' ? '#059669' : '#dc2626',
                      color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    }}
                  >
                    {inspectUser.accountStatus === 'SUSPENDED' ? 'Activate Account' : 'Suspend Account'}
                  </button>
                )}
                <button
                  onClick={() => setInspectUser(null)}
                  style={{
                    padding: '8px 16px', borderRadius: 8,
                    background: '#f1f5f9', color: '#334155', border: 'none',
                    fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add User Modal */}
        {isAddUserOpen && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
          }}>
            <form onSubmit={handleCreateUser} style={{
              background: '#fff', borderRadius: 16, maxWidth: 480, width: '100%',
              padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', position: 'relative',
            }}>
              <button
                type="button"
                onClick={() => setIsAddUserOpen(false)}
                style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X style={{ width: 20, height: 20 }} />
              </button>
              <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                Register New User Account
              </h3>
              {formMsg && <p style={{ color: '#dc2626', fontSize: 12, fontWeight: 600 }}>{formMsg}</p>}
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Full Name / Facility Title</label>
                  <input
                    type="text" required
                    value={newUserName} onChange={e => setNewUserName(e.target.value)}
                    placeholder="e.g. Anand Kumar or City Medicals"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Email Address</label>
                  <input
                    type="email" required
                    value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)}
                    placeholder="user@example.com"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Phone Number</label>
                  <input
                    type="text"
                    value={newUserPhone} onChange={e => setNewUserPhone(e.target.value)}
                    placeholder="+91 94431 XXXXX"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Role</label>
                  <select
                    value={newUserRole} onChange={e => setNewUserRole(e.target.value as any)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box', background: '#fff' }}
                  >
                    <option value="PATIENT">Citizen / Patient</option>
                    <option value="PHARMACY">Pharmacy Operator</option>
                    <option value="HOSPITAL">Hospital Representative</option>
                    <option value="ADMIN">System Administrator</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Address / Sector</label>
                  <input
                    type="text"
                    value={newUserAddress} onChange={e => setNewUserAddress(e.target.value)}
                    placeholder="Main Bazaar Road, Tisaiyanvilai"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: 8, background: '#f1f5f9', color: '#334155', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: 8, background: '#9d174d', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </ConsoleLayout>
  );
};
