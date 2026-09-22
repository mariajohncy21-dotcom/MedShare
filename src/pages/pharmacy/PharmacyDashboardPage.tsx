import React, { useMemo, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import { api } from '../../services/api';
import {
  Package, Plus, TrendingUp, AlertTriangle, Clock, CheckCircle2,
  ArrowRight, RefreshCw, Send, Activity, Upload, FileText, CalendarCheck,
  AlertOctagon, Boxes, ShieldCheck, ClipboardList,
} from 'lucide-react';

const ClickableStatCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  to: string;
}> = ({ label, value, icon: Icon, color, bg, border, to }) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(to)}
      style={{
        background: '#fff', borderRadius: 14, padding: '18px 20px',
        border: `1px solid ${border}`, boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
        display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
        transition: 'transform 0.12s ease, box-shadow 0.12s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.04)';
      }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 11, background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon style={{ width: 20, height: 20, color }} />
      </div>
      <div>
        <p style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: 0, lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0', fontWeight: 600 }}>{label}</p>
      </div>
    </div>
  );
};

export const PharmacyDashboardPage: React.FC = () => {
  const {
    currentUser, inventory, sources, reservations,
    pharmacyRequests, stockChangeLogs,
  } = useApp();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const pharmId = currentUser.sourceId || 'SRC-PHARM-001';
  const pharmSource = sources.find((s) => s.id === pharmId);

  // Compute metrics for logged-in pharmacy
  const myInventory = useMemo(() => inventory.filter((i) => i.sourceId === pharmId), [inventory, pharmId]);
  const myReservations = useMemo(
    () => reservations.filter((r) => r.allocationBreakdown?.some((a) => a.sourceId === pharmId) || (r as any).sourceId === pharmId),
    [reservations, pharmId]
  );
  const myRequests = useMemo(() => pharmacyRequests.filter((r) => r.pharmacyId === pharmId), [pharmacyRequests, pharmId]);
  const myLogs = useMemo(() => stockChangeLogs.filter((l) => l.sourceId === pharmId), [stockChangeLogs, pharmId]);

  const totalMedicinesCount = myInventory.length;
  const totalAvailableStockSum = myInventory.reduce((acc, i) => acc + (i.quantity || 0), 0);
  const lowStockCount = myInventory.filter((i) => i.stockStatus === 'LOW').length;
  const criticalStockCount = myInventory.filter((i) => i.stockStatus === 'CRITICAL').length;
  const outOfStockCount = myInventory.filter((i) => i.stockStatus === 'OUT_OF_STOCK' || i.quantity === 0).length;
  const pendingRequestsCount = myRequests.filter((r) => r.status === 'PENDING').length;
  const activeReservationsCount = myReservations.filter((r) => r.status === 'CONFIRMED' || r.status === 'PENDING').length;

  // Daily Stock Report status state
  const [dailyReports, setDailyReports] = useState<any[]>([]);

  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const yesterdayStr = getYesterdayStr();

  useEffect(() => {
    api.dailyReports.getPharmacyReports(pharmId)
      .then((data) => setDailyReports(data || []))
      .catch(() => setDailyReports([]));
  }, [pharmId]);

  const yesterdayReport = dailyReports.find((r) => r.reportDate === yesterdayStr);
  const nowHour = new Date().getHours();
  const dailyReportStatus = yesterdayReport
    ? 'SUBMITTED'
    : nowHour >= 11
    ? 'OVERDUE'
    : 'DUE_SOON';

  return (
    <ConsoleLayout>
      <div style={{ padding: '24px 28px', maxWidth: 1280, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
        
        {/* Header Bar */}
        <div style={{
          marginBottom: 24, display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                {t('pharmacy.dashboardTitle')}
              </h1>
              {pharmSource?.verificationStatus === 'APPROVED' && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 99,
                  background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0',
                }}>
                  <ShieldCheck style={{ width: 13, height: 13 }} />
                  {t('common.verified')} ✓
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
              {pharmSource?.name || currentUser.name} · {pharmSource?.area || 'Tisaiyanvilai Main Road'}, {pharmSource?.city || 'Tisaiyanvilai'}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Link
              to="/pharmacy/inventory/add"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', background: '#0d9488', color: '#fff',
                fontWeight: 700, fontSize: 13, borderRadius: 10,
                textDecoration: 'none', boxShadow: '0 2px 8px rgba(13,148,136,0.25)',
              }}
            >
              <Plus style={{ width: 16, height: 16 }} />
              {t('pharmacy.addMedicineBtn')}
            </Link>

            <Link
              to="/pharmacy/inventory/update"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', background: '#1d4ed8', color: '#fff',
                fontWeight: 700, fontSize: 13, borderRadius: 10,
                textDecoration: 'none', boxShadow: '0 2px 8px rgba(29,78,216,0.25)',
              }}
            >
              <RefreshCw style={{ width: 15, height: 15 }} />
              {t('pharmacy.updateStockBtn')}
            </Link>

            <Link
              to="/pharmacy/inventory/bulk-upload"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', background: '#fff', color: '#0f172a',
                fontWeight: 700, fontSize: 13, borderRadius: 10,
                textDecoration: 'none', border: '1px solid #cbd5e1',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <Upload style={{ width: 15, height: 15, color: '#64748b' }} />
              {t('pharmacy.bulkUploadBtn')}
            </Link>
          </div>
        </div>

        {/* 11 AM Daily Stock Report Notification Card */}
        <div style={{
          background: dailyReportStatus === 'SUBMITTED' ? '#ecfdf5' : dailyReportStatus === 'OVERDUE' ? '#fef2f2' : '#fffbeb',
          border: `1px solid ${dailyReportStatus === 'SUBMITTED' ? '#a7f3d0' : dailyReportStatus === 'OVERDUE' ? '#fecaca' : '#fde68a'}`,
          borderRadius: 14, padding: '16px 20px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ClipboardList style={{
              width: 24, height: 24,
              color: dailyReportStatus === 'SUBMITTED' ? '#059669' : dailyReportStatus === 'OVERDUE' ? '#dc2626' : '#d97706',
            }} />
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Daily Operational Stock Report ({yesterdayStr})
              </h3>
              <p style={{ fontSize: 12, color: '#475569', margin: '2px 0 0' }}>
                Deadline: Every day before 11:00 AM · Status:{' '}
                <strong style={{
                  color: dailyReportStatus === 'SUBMITTED' ? '#059669' : dailyReportStatus === 'OVERDUE' ? '#dc2626' : '#d97706',
                }}>
                  {dailyReportStatus}
                </strong>
              </p>
            </div>
          </div>

          <Link
            to="/pharmacy/daily-reports"
            style={{
              padding: '8px 14px', background: '#fff', color: '#0f172a',
              fontSize: 12.5, fontWeight: 700, borderRadius: 8,
              border: '1px solid #cbd5e1', textDecoration: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            {dailyReportStatus === 'SUBMITTED' ? 'View Report History' : 'Upload Report Now'} →
          </Link>
        </div>

        {/* CLICKABLE METRIC CARDS GRID */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: 16, marginBottom: 28,
        }}>
          
          <ClickableStatCard
            label={t('pharmacy.totalMedicines')}
            value={totalMedicinesCount}
            icon={Package}
            color="#0d9488"
            bg="#f0fdfa"
            border="#ccfbf1"
            to="/pharmacy/inventory"
          />

          <ClickableStatCard
            label={t('pharmacy.totalAvailableStock')}
            value={totalAvailableStockSum}
            icon={Boxes}
            color="#1d4ed8"
            bg="#eff6ff"
            border="#bfdbfe"
            to="/pharmacy/inventory"
          />

          <ClickableStatCard
            label={t('pharmacy.lowStockItems')}
            value={lowStockCount}
            icon={TrendingUp}
            color="#d97706"
            bg="#fffbeb"
            border="#fde68a"
            to="/pharmacy/inventory?status=LOW"
          />

          <ClickableStatCard
            label={t('pharmacy.criticalStockItems')}
            value={criticalStockCount}
            icon={AlertTriangle}
            color="#e11d48"
            bg="#fff1f2"
            border="#fecdd3"
            to="/pharmacy/inventory?status=CRITICAL"
          />

          <ClickableStatCard
            label={t('pharmacy.outOfStockItems')}
            value={outOfStockCount}
            icon={AlertOctagon}
            color="#dc2626"
            bg="#fef2f2"
            border="#fecaca"
            to="/pharmacy/inventory?status=OUT_OF_STOCK"
          />

          <ClickableStatCard
            label={t('pharmacy.pendingHospitalRequests')}
            value={pendingRequestsCount}
            icon={Send}
            color="#7c3aed"
            bg="#f5f3ff"
            border="#ddd6fe"
            to="/pharmacy/emergency-requests"
          />

          <ClickableStatCard
            label={t('pharmacy.activePatientReservations')}
            value={activeReservationsCount}
            icon={CalendarCheck}
            color="#0284c7"
            bg="#f0f9ff"
            border="#bae6fd"
            to="/pharmacy/reservations"
          />

          <ClickableStatCard
            label={t('pharmacy.stockHistoryBtn')}
            value={myLogs.length}
            icon={FileText}
            color="#475569"
            bg="#f8fafc"
            border="#e2e8f0"
            to="/pharmacy/inventory/history"
          />

        </div>

        {/* 2 Column Layout for Tables */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 20 }}>
          
          {/* Section 1: Pending Emergency Hospital Requests */}
          <div style={{
            background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
            boxShadow: '0 1px 6px rgba(0,0,0,0.04)', overflow: 'hidden',
          }}>
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#fafbfc',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Send style={{ width: 17, height: 17, color: '#7c3aed' }} />
                Pending Hospital Requests ({pendingRequestsCount})
              </h2>
              <Link to="/pharmacy/emergency-requests" style={{ fontSize: 12.5, fontWeight: 700, color: '#1d4ed8', textDecoration: 'none' }}>
                View All →
              </Link>
            </div>

            <div style={{ padding: 0 }}>
              {myRequests.filter((r) => r.status === 'PENDING').length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                  No pending hospital requests requiring action.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>
                        <th style={{ padding: '10px 14px', fontWeight: 700 }}>Hospital</th>
                        <th style={{ padding: '10px 14px', fontWeight: 700 }}>Medicine</th>
                        <th style={{ padding: '10px 14px', fontWeight: 700 }}>Requested Qty</th>
                        <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myRequests.filter((r) => r.status === 'PENDING').slice(0, 5).map((req) => (
                        <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{req.hospitalName}</td>
                          <td style={{ padding: '12px 14px', color: '#334155' }}>{req.medicineName}</td>
                          <td style={{ padding: '12px 14px', fontWeight: 800, color: '#1d4ed8' }}>{req.requestedQuantity} units</td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <Link
                              to="/pharmacy/emergency-requests"
                              style={{
                                padding: '4px 10px', background: '#059669', color: '#fff',
                                fontSize: 11, fontWeight: 700, borderRadius: 6, textDecoration: 'none',
                              }}
                            >
                              Respond
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Recent Stock Changes */}
          <div style={{
            background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
            boxShadow: '0 1px 6px rgba(0,0,0,0.04)', overflow: 'hidden',
          }}>
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#fafbfc',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity style={{ width: 17, height: 17, color: '#0d9488' }} />
                Recent Stock Movement Log
              </h2>
              <Link to="/pharmacy/inventory/history" style={{ fontSize: 12.5, fontWeight: 700, color: '#1d4ed8', textDecoration: 'none' }}>
                Full Audit Trail →
              </Link>
            </div>

            <div>
              {myLogs.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                  No recent stock movement logs recorded.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>
                        <th style={{ padding: '10px 14px', fontWeight: 700 }}>Medicine</th>
                        <th style={{ padding: '10px 14px', fontWeight: 700 }}>Adjustment</th>
                        <th style={{ padding: '10px 14px', fontWeight: 700 }}>New Stock</th>
                        <th style={{ padding: '10px 14px', fontWeight: 700 }}>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myLogs.slice(0, 5).map((log) => (
                        <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{log.medicineName}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{
                              fontWeight: 800, fontSize: 11.5, padding: '2px 7px', borderRadius: 99,
                              background: log.difference > 0 ? '#ecfdf5' : '#fef2f2',
                              color: log.difference > 0 ? '#059669' : '#dc2626',
                            }}>
                              {log.difference > 0 ? `+${log.difference}` : log.difference}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0f172a' }}>{log.newQuantity}</td>
                          <td style={{ padding: '12px 14px', color: '#475569', fontSize: 11.5 }}>{log.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </ConsoleLayout>
  );
};
