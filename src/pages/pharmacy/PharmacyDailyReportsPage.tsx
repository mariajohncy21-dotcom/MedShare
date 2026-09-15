import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import { api } from '../../services/api';
import {
  ClipboardList, ArrowLeft, Clock, CheckCircle2, AlertTriangle, Upload, FileText, Plus, Check, X, ShieldAlert,
} from 'lucide-react';

export const PharmacyDailyReportsPage: React.FC = () => {
  const { currentUser, sources } = useApp();

  const pharmId = currentUser.sourceId || 'SRC-PHARM-001';
  const pharmSource = sources.find((s) => s.id === pharmId);

  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Select file/data, 2: Preview & Validate, 3: Success

  // Report Form state
  const [reportForm, setReportForm] = useState({
    openingStockCount: 450,
    addedStockCount: 60,
    dispensedCount: 95,
    closingStockCount: 415,
    expiryItemsCount: 2,
    lowStockItemsCount: 4,
    fileName: 'Daily_Pharmacy_Stock_Report.csv',
  });

  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const yesterdayStr = getYesterdayStr();

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await api.dailyReports.getPharmacyReports(pharmId);
      setReports(data || []);
    } catch (err) {
      console.warn('Failed to load pharmacy reports:', err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [pharmId]);

  const yesterdayReport = reports.find((r) => r.reportDate === yesterdayStr);
  const nowHour = new Date().getHours();
  const currentStatus = yesterdayReport
    ? 'SUBMITTED'
    : nowHour >= 11
    ? 'OVERDUE'
    : 'DUE_SOON';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReportForm((prev) => ({ ...prev, fileName: file.name }));
      setStep(2); // Move to Preview & Validate
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.dailyReports.submitPharmacyReport({
        ...reportForm,
        reportDate: yesterdayStr,
      });
      fetchReports();
      setStep(3); // Success
    } catch (err: any) {
      alert(err.message || 'Failed to submit daily report.');
    }
  };

  return (
    <ConsoleLayout>
      <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
        
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
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
              Daily Operational Stock Reporting
            </h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              {pharmSource?.name || currentUser.name} · Mandatory 11:00 AM daily stock audit submission for drug control authority
            </p>
          </div>

          <button
            onClick={() => { setShowModal(true); setStep(1); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', background: '#0d9488', color: '#fff',
              fontWeight: 800, fontSize: 13, border: 'none', borderRadius: 10,
              cursor: 'pointer', boxShadow: '0 2px 10px rgba(13,148,136,0.3)',
            }}
          >
            <Upload style={{ width: 16, height: 16 }} />
            Upload Stock Report
          </button>
        </div>

        {/* Daily Operational Status Banner */}
        <div style={{
          background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
          padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Reporting Requirement for Yesterday ({yesterdayStr})
            </span>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '4px 0 2px' }}>
              Daily Deadline: Today at 11:00 AM
            </h2>
            <p style={{ fontSize: 12.5, color: '#64748b', margin: 0 }}>
              Submitting opening stock, daily dispensings, additions, and low stock counts keeps the central drug supply network synchronized.
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            {currentStatus === 'SUBMITTED' && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 13, fontWeight: 800, padding: '8px 16px', borderRadius: 99,
                background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0',
              }}>
                <CheckCircle2 style={{ width: 16, height: 16 }} />
                SUBMITTED ON TIME
              </span>
            )}

            {currentStatus === 'DUE_SOON' && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 13, fontWeight: 800, padding: '8px 16px', borderRadius: 99,
                background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a',
              }}>
                <Clock style={{ width: 16, height: 16 }} />
                DUE SOON (Before 11:00 AM)
              </span>
            )}

            {currentStatus === 'OVERDUE' && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 13, fontWeight: 800, padding: '8px 16px', borderRadius: 99,
                background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
              }}>
                <AlertTriangle style={{ width: 16, height: 16 }} />
                OVERDUE - Submit Immediately
              </span>
            )}
          </div>
        </div>

        {/* History Table */}
        <div style={{
          background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
          boxShadow: '0 1px 6px rgba(0,0,0,0.04)', overflow: 'hidden',
        }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', background: '#fafbfc' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Submitted Stock Report Archive
            </h3>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              Loading report history...
            </div>
          ) : reports.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <ClipboardList style={{ width: 44, height: 44, color: '#cbd5e1', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
                No daily reports submitted yet
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>
                Click "Upload Stock Report" above to submit yesterday's daily stock report before 11:00 AM.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>Report Date</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>Submitted At</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>Opening Stock</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>Added</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>Dispensed</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>Closing Stock</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((rep) => (
                    <tr key={rep.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0f172a' }}>{rep.reportDate}</td>
                      <td style={{ padding: '14px 18px', color: '#64748b', fontSize: 12 }}>{new Date(rep.submittedAt).toLocaleString()}</td>
                      <td style={{ padding: '14px 18px', fontWeight: 600 }}>{rep.openingStockCount}</td>
                      <td style={{ padding: '14px 18px', color: '#059669', fontWeight: 700 }}>+{rep.addedStockCount}</td>
                      <td style={{ padding: '14px 18px', color: '#dc2626', fontWeight: 700 }}>-{rep.dispensedCount}</td>
                      <td style={{ padding: '14px 18px', fontWeight: 800, color: '#0f172a' }}>{rep.closingStockCount}</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 99, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                          SUBMITTED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Upload & Submission Workflow Modal */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: '#fff', borderRadius: 16, maxWidth: 540, width: '100%', padding: 28, border: '1px solid #e2e8f0', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Upload Yesterday's Stock Report ({yesterdayStr})
                </h3>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#64748b' }}>
                  <X style={{ width: 18, height: 18 }} />
                </button>
              </div>

              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{
                    border: '2px dashed #cbd5e1', borderRadius: 12, padding: '32px 20px',
                    textAlign: 'center', background: '#fafbfc', cursor: 'pointer',
                  }}>
                    <Upload style={{ width: 36, height: 36, color: '#0d9488', margin: '0 auto 10px' }} />
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
                      Click to upload CSV or XLSX file
                    </p>
                    <p style={{ fontSize: 11.5, color: '#64748b', margin: '0 0 14px' }}>
                      Supports standard pharmacy POS / ERP export files
                    </p>
                    <input
                      type="file"
                      accept=".csv, .xlsx"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                      id="dailyReportFileInput"
                    />
                    <label
                      htmlFor="dailyReportFileInput"
                      style={{
                        padding: '8px 16px', background: '#0d9488', color: '#fff',
                        fontWeight: 700, fontSize: 12.5, borderRadius: 8, cursor: 'pointer',
                      }}
                    >
                      Browse File
                    </label>
                  </div>

                  <div style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>OR MANUAL DATA ENTRY</div>

                  <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155' }}>Opening Stock Count</label>
                      <input
                        type="number"
                        value={reportForm.openingStockCount}
                        onChange={(e) => setReportForm({ ...reportForm, openingStockCount: parseInt(e.target.value, 10) || 0 })}
                        style={{ width: '100%', padding: '8px', fontSize: 13, borderRadius: 7, border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155' }}>Stock Added</label>
                      <input
                        type="number"
                        value={reportForm.addedStockCount}
                        onChange={(e) => setReportForm({ ...reportForm, addedStockCount: parseInt(e.target.value, 10) || 0 })}
                        style={{ width: '100%', padding: '8px', fontSize: 13, borderRadius: 7, border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155' }}>Stock Dispensed</label>
                      <input
                        type="number"
                        value={reportForm.dispensedCount}
                        onChange={(e) => setReportForm({ ...reportForm, dispensedCount: parseInt(e.target.value, 10) || 0 })}
                        style={{ width: '100%', padding: '8px', fontSize: 13, borderRadius: 7, border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155' }}>Closing Stock Count</label>
                      <input
                        type="number"
                        value={reportForm.closingStockCount}
                        onChange={(e) => setReportForm({ ...reportForm, closingStockCount: parseInt(e.target.value, 10) || 0 })}
                        style={{ width: '100%', padding: '8px', fontSize: 13, borderRadius: 7, border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                      <button
                        type="submit"
                        style={{ padding: '9px 18px', background: '#0d9488', color: '#fff', fontWeight: 800, fontSize: 13, border: 'none', borderRadius: 8, cursor: 'pointer' }}
                      >
                        Preview &amp; Validate Data
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {step === 2 && (
                <div>
                  <div style={{ background: '#ecfdf5', borderRadius: 10, padding: 14, border: '1px solid #a7f3d0', fontSize: 12.5, color: '#047857', marginBottom: 16 }}>
                    <CheckCircle2 style={{ width: 16, height: 16, display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                    File validated: <strong>{reportForm.fileName}</strong> — 0 validation errors detected.
                  </div>

                  <div style={{ background: '#fafbfc', borderRadius: 10, padding: 14, border: '1px solid #e2e8f0', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Report Date:</span>
                      <span style={{ fontWeight: 800, color: '#0f172a' }}>{yesterdayStr}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Opening Stock:</span>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{reportForm.openingStockCount} units</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Additions (+) / Dispensings (-):</span>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>+{reportForm.addedStockCount} / -{reportForm.dispensedCount}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Closing Stock Count:</span>
                      <span style={{ fontWeight: 800, color: '#059669' }}>{reportForm.closingStockCount} units</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button onClick={() => setStep(1)} style={{ padding: '9px 16px', background: '#f1f5f9', color: '#475569', fontWeight: 600, fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer' }}>
                      Back
                    </button>
                    <button onClick={handleSubmit} style={{ padding: '9px 20px', background: '#0d9488', color: '#fff', fontWeight: 800, fontSize: 13, border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                      Confirm &amp; Save Daily Report
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <CheckCircle2 style={{ width: 54, height: 54, color: '#059669', margin: '0 auto 14px' }} />
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                    Daily Report Submitted Successfully!
                  </h3>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 20px' }}>
                    Your pharmacy daily stock report for {yesterdayStr} has been saved to PostgreSQL and verified by the system.
                  </p>
                  <button onClick={() => setShowModal(false)} style={{ padding: '9px 24px', background: '#0d9488', color: '#fff', fontWeight: 800, fontSize: 13, border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                    Done
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </ConsoleLayout>
  );
};
