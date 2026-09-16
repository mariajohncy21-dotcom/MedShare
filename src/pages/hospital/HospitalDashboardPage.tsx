import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import { api } from '../../services/api';
import { HospitalPatient } from '../../types';
import {
  Users, Package, AlertTriangle, AlertOctagon, Clock,
  ArrowRight, ShieldCheck, CheckCircle2,
  PlusCircle, Search, Activity, FileSpreadsheet,
  Building2, Sparkles
} from 'lucide-react';

export const HospitalDashboardPage: React.FC = () => {
  const { currentUser, inventory, sources, reservations, emergencyRequests, transfers } = useApp();
  const navigate = useNavigate();

  const [patients, setPatients] = useState<HospitalPatient[]>([]);
  const [loading, setLoading] = useState(true);

  const hospId = currentUser.sourceId || 'SRC-HOSP-001';
  const hospSource = sources.find(s => s.id === hospId);

  // Scoped metrics
  const myInventory = inventory.filter(i => i.sourceId === hospId);
  const totalUnits = myInventory.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockItems = myInventory.filter(i => i.quantity > 0 && i.quantity <= 15);
  const criticalStockItems = myInventory.filter(i => i.quantity === 0 || i.stockStatus === 'CRITICAL' || i.stockStatus === 'OUT_OF_STOCK');

  const myEmergencyRequests = emergencyRequests.filter(e => e.hospitalId === hospId || (e as any).hospitalName?.toLowerCase().includes(currentUser.name.toLowerCase()));
  const pendingRequests = myEmergencyRequests.filter(e => e.status === 'PENDING' || e.status === 'BROADCASTING' || (e.status as string) === 'MATCHING');

  const myReservations = reservations.filter(r => r.userId === currentUser.id || r.id.startsWith('RES-HOSP'));
  const activeReservations = myReservations.filter(r => r.status === 'PENDING' || r.status === 'CONFIRMED');

  const myTransfers = transfers.filter(t => t.fromSourceId === hospId || t.toSourceId === hospId);
  const pendingTransfers = myTransfers.filter(t => t.status === 'PENDING' || t.status === 'IN_TRANSIT');

  useEffect(() => {
    let isMounted = true;
    api.hospitalPatients.getAll()
      .then(data => {
        if (isMounted) {
          setPatients(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPatients([]);
          setLoading(false);
        }
      });
    return () => { isMounted = false; };
  }, []);

  const activeAdmissions = patients.filter(p => p.status === 'ADMITTED' || p.status === 'ICU');
  const emergencyCases = patients.filter(p => p.emergencyStatus === 'CRITICAL' || p.emergencyStatus === 'URGENT');

  const statCards = [
    {
      label: 'Total Patients',
      value: patients.length,
      icon: Users,
      color: '#2563eb',
      bg: '#eff6ff',
      border: '#bfdbfe',
      link: '/hospital/patients',
      sub: 'Enrolled in facility',
    },
    {
      label: 'Active Admissions',
      value: activeAdmissions.length,
      icon: Activity,
      color: '#7c3aed',
      bg: '#f5f3ff',
      border: '#ddd6fe',
      link: '/hospital/patients',
      sub: 'Wards & ICU occupancy',
    },
    {
      label: 'Emergency Cases',
      value: emergencyCases.length + myEmergencyRequests.length,
      icon: AlertOctagon,
      color: '#dc2626',
      bg: '#fef2f2',
      border: '#fecaca',
      link: '/hospital/emergency-requests',
      sub: 'Critical inpatient & broadcast',
    },
    {
      label: 'Total Medicines',
      value: myInventory.length,
      icon: Package,
      color: '#0284c7',
      bg: '#f0f9ff',
      border: '#bae6fd',
      link: '/hospital/inventory',
      sub: 'Formulary catalog lines',
    },
    {
      label: 'Available Stock Units',
      value: totalUnits.toLocaleString(),
      icon: CheckCircle2,
      color: '#16a34a',
      bg: '#f0fdf4',
      border: '#bbf7d0',
      link: '/hospital/inventory',
      sub: 'In pharmacy dispensary',
    },
    {
      label: 'Low Stock Items',
      value: lowStockItems.length,
      icon: AlertTriangle,
      color: '#d97706',
      bg: '#fffbeb',
      border: '#fde68a',
      link: '/hospital/inventory?status=low',
      sub: 'Near minimum threshold',
    },
    {
      label: 'Critical / Out of Stock',
      value: criticalStockItems.length,
      icon: AlertOctagon,
      color: '#b91c1c',
      bg: '#fef2f2',
      border: '#fecaca',
      link: '/hospital/inventory?status=critical',
      sub: 'Immediate reorder required',
    },
    {
      label: 'Pending Requests',
      value: pendingRequests.length,
      icon: Clock,
      color: '#0f766e',
      bg: '#f0fdfa',
      border: '#99f6e4',
      link: '/hospital/requests?status=pending',
      sub: 'Pharmacy requisitions',
    },
    {
      label: 'Active Reservations',
      value: activeReservations.length,
      icon: ShieldCheck,
      color: '#6366f1',
      bg: '#eef2ff',
      border: '#c7d2fe',
      link: '/hospital/reservations',
      sub: 'Held by partner suppliers',
    },
    {
      label: 'Pending Transfers',
      value: pendingTransfers.length,
      icon: ArrowRight,
      color: '#9333ea',
      bg: '#faf5ff',
      border: '#e9d5ff',
      link: '/hospital/transfers',
      sub: 'Inter-facility logistics',
    },
  ];

  return (
    <ConsoleLayout>
      <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* Top Hospital Identity Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 60%, #7c3aed 100%)',
          borderRadius: 16,
          padding: '28px 32px',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 20,
          boxShadow: '0 4px 20px rgba(109, 40, 217, 0.2)',
          marginBottom: 28,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '3px 10px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}>
                Hospital Command Center
              </span>
              <span style={{
                background: '#22c55e',
                color: '#fff',
                padding: '3px 8px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}>
                <ShieldCheck style={{ width: 12, height: 12 }} /> Verified Facility
              </span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: '#fff' }}>
              {currentUser.name || hospSource?.name || 'Hospital Administration'}
            </h1>
            <p style={{ fontSize: 13, color: '#e9d5ff', margin: 0 }}>
              Reg: {(currentUser as any).registrationNumber || hospSource?.registrationNumber || 'HOSP-TN-2024-9912'} &bull; District: {(currentUser as any).district || hospSource?.district || 'Tirunelveli'} &bull; Source ID: <code style={{ color: '#fff', background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: 4 }}>{hospId}</code>
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link
              to="/hospital/inventory/add"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: '#fff', color: '#6d28d9', padding: '10px 18px',
                borderRadius: 10, textDecoration: 'none', fontWeight: 700,
                fontSize: 13, boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <PlusCircle style={{ width: 16, height: 16 }} /> Add Medicine
            </Link>
            <Link
              to="/hospital/inventory/bulk-upload"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '10px 16px',
                borderRadius: 10, textDecoration: 'none', fontWeight: 600,
                fontSize: 13, border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              <FileSpreadsheet style={{ width: 16, height: 16 }} /> Bulk Upload
            </Link>
            <Link
              to="/hospital/pharmacy-search"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '10px 16px',
                borderRadius: 10, textDecoration: 'none', fontWeight: 600,
                fontSize: 13, border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              <Search style={{ width: 16, height: 16 }} /> Pharmacy Search
            </Link>
            <Link
              to="/hospital/emergency-requests"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: '#ef4444', color: '#fff', padding: '10px 16px',
                borderRadius: 10, textDecoration: 'none', fontWeight: 700,
                fontSize: 13,
              }}
            >
              <AlertOctagon style={{ width: 16, height: 16 }} /> Emergency Request
            </Link>
          </div>
        </div>

        {/* 10 Clickable Stat Cards */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Live Operational Key Indicators
            </h2>
            <span style={{ fontSize: 12, color: '#64748b' }}>Click any metric card to open its dedicated workflow</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 16,
          }}>
            {statCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  onClick={() => navigate(card.link)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && navigate(card.link)}
                  style={{
                    background: '#fff',
                    borderRadius: 14,
                    padding: '18px 20px',
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: card.border,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease-in-out',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
                    e.currentTarget.style.borderColor = card.color;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.03)';
                    e.currentTarget.style.borderColor = card.border;
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: card.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Icon style={{ width: 20, height: 20, color: card.color }} />
                    </div>
                    <ArrowRight style={{ width: 16, height: 16, color: '#94a3b8' }} />
                  </div>

                  <div style={{ marginTop: 14 }}>
                    <p style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '0 0 2px', lineHeight: 1.1 }}>
                      {card.value}
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#334155', margin: '0 0 4px' }}>
                      {card.label}
                    </p>
                    <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
                      {card.sub}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Two-Column Working Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 24, marginBottom: 32 }}>

          {/* Left: Inpatients & Emergency Ward Status */}
          <div style={{
            background: '#fff',
            borderRadius: 14,
            padding: 24,
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Current Inpatient Census
                </h3>
                <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
                  {patients.length} active registered patients in this hospital
                </p>
              </div>
              <Link
                to="/hospital/patients"
                style={{
                  fontSize: 12, fontWeight: 600, color: '#6d28d9',
                  textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                View All Patients <ArrowRight style={{ width: 14, height: 14 }} />
              </Link>
            </div>

            {loading ? (
              <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center', padding: 20 }}>Loading inpatient records...</p>
            ) : patients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 20px', background: '#f8fafc', borderRadius: 10, border: '1px dashed #cbd5e1' }}>
                <Users style={{ width: 32, height: 32, color: '#94a3b8', margin: '0 auto 8px' }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: '#334155', margin: 0 }}>No Patients Registered Yet</p>
                <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 12px' }}>Start managing ward admissions and bed distribution</p>
                <Link
                  to="/hospital/patients"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: '#6d28d9', color: '#fff', padding: '6px 14px',
                    borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none',
                  }}
                >
                  + Add First Patient
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {patients.slice(0, 4).map(p => (
                  <div
                    key={p.id}
                    onClick={() => navigate('/hospital/patients')}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', borderRadius: 10, background: '#f8fafc',
                      border: '1px solid #f1f5f9', cursor: 'pointer',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                        {p.name} <span style={{ fontSize: 11, fontWeight: 500, color: '#64748b' }}>({p.age ? `${p.age}y` : ''} {p.gender})</span>
                      </p>
                      <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>
                        Ward: <strong>{p.ward}</strong> &bull; Bed: <strong>{p.bed || 'Unassigned'}</strong> &bull; Dept: {p.department}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                        background: p.emergencyStatus === 'CRITICAL' ? '#fef2f2' : p.emergencyStatus === 'URGENT' ? '#fffbeb' : '#f0fdf4',
                        color: p.emergencyStatus === 'CRITICAL' ? '#dc2626' : p.emergencyStatus === 'URGENT' ? '#d97706' : '#166534',
                        border: `1px solid ${p.emergencyStatus === 'CRITICAL' ? '#fecaca' : p.emergencyStatus === 'URGENT' ? '#fde68a' : '#bbf7d0'}`,
                      }}>
                        {p.emergencyStatus}
                      </span>
                      <p style={{ fontSize: 10, color: '#94a3b8', margin: '3px 0 0' }}>{p.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Critical Inventory & Restock Monitor */}
          <div style={{
            background: '#fff',
            borderRadius: 14,
            padding: 24,
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Formulary Stock Alerts
                </h3>
                <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
                  {criticalStockItems.length} critical &bull; {lowStockItems.length} low stock medicines
                </p>
              </div>
              <Link
                to="/hospital/inventory"
                style={{
                  fontSize: 12, fontWeight: 600, color: '#6d28d9',
                  textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                Full Inventory <ArrowRight style={{ width: 14, height: 14 }} />
              </Link>
            </div>

            {criticalStockItems.length === 0 && lowStockItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 20px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
                <CheckCircle2 style={{ width: 32, height: 32, color: '#16a34a', margin: '0 auto 8px' }} />
                <p style={{ fontSize: 13, fontWeight: 700, color: '#166534', margin: 0 }}>Stock Levels Optimal</p>
                <p style={{ fontSize: 12, color: '#15803d', margin: '4px 0 0' }}>All registered formulary lines are above safety thresholds</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[...criticalStockItems, ...lowStockItems].slice(0, 4).map(item => (
                  <div
                    key={item.id}
                    onClick={() => navigate('/hospital/inventory')}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', borderRadius: 10, background: '#fef2f2',
                      border: '1px solid #fee2e2', cursor: 'pointer',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                        {item.medicineName}
                      </p>
                      <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>
                        Type: {item.medicineType} &bull; Batch: {item.batchNumber || 'N/A'} &bull; Status: {item.stockStatus}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800,
                        background: item.quantity === 0 ? '#b91c1c' : '#d97706',
                        color: '#fff',
                      }}>
                        {item.quantity} {item.unit}
                      </span>
                      <p style={{ fontSize: 10, color: '#b91c1c', margin: '3px 0 0', fontWeight: 600 }}>
                        {item.quantity === 0 ? 'Out of Stock' : 'Low Level'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Hub Navigation Cards */}
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 14px' }}>
            Hospital Workflows & Integrations
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <Link
              to="/hospital/allocation"
              style={{
                background: '#fff', borderRadius: 14, padding: '18px 20px',
                border: '1px solid #e2e8f0', textDecoration: 'none',
                display: 'flex', gap: 14, alignItems: 'center',
                boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Sparkles style={{ width: 22, height: 22, color: '#7c3aed' }} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>Smart Multi-Source Allocation</p>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Auto-split medicine deficits across verified local pharmacies</p>
              </div>
            </Link>

            <Link
              to="/hospital/pharmacy-search"
              style={{
                background: '#fff', borderRadius: 14, padding: '18px 20px',
                border: '1px solid #e2e8f0', textDecoration: 'none',
                display: 'flex', gap: 14, alignItems: 'center',
                boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Search style={{ width: 22, height: 22, color: '#0284c7' }} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>Pharmacy Search & Geo Map</p>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Search within 2-25km with real-time stock and routing</p>
              </div>
            </Link>

            <Link
              to="/hospital/daily-reports"
              style={{
                background: '#fff', borderRadius: 14, padding: '18px 20px',
                border: '1px solid #e2e8f0', textDecoration: 'none',
                display: 'flex', gap: 14, alignItems: 'center',
                boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Clock style={{ width: 22, height: 22, color: '#b45309' }} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>Operational Daily Reports</p>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>File previous-day census, admissions, and drug consumption</p>
              </div>
            </Link>

            <Link
              to="/hospital/transfers"
              style={{
                background: '#fff', borderRadius: 14, padding: '18px 20px',
                border: '1px solid #e2e8f0', textDecoration: 'none',
                display: 'flex', gap: 14, alignItems: 'center',
                boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Building2 style={{ width: 22, height: 22, color: '#9333ea' }} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>Inter-Hospital Transfers</p>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Manage mutual-aid emergency medicine transfers</p>
              </div>
            </Link>
          </div>
        </div>

      </div>
    </ConsoleLayout>
  );
};
