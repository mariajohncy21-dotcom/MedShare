import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import { api } from '../../services/api';
import { DailyHospitalReport } from '../../types';
import {
  ClipboardList, ArrowLeft, Clock, CheckCircle2, AlertTriangle, Upload,
  FileText, Plus, Check, X, ShieldAlert,
} from 'lucide-react';

export const HospitalDailyReportsPage: React.FC = () => {
  const { currentUser, sources } = useApp();
  const hospId = currentUser.sourceId || 'SRC-HOSP-001';
  const hospSource = sources.find((s) => s.id === hospId);

  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const [reports, setReports] = useState<DailyHospitalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [reportDate, setReportDate] = useState(yesterdayStr);
  const [patientCount, setPatientCount] = useState(48);
  const [admissions, setAdmissions] = useState(12);
  const [discharges, setDischarges] = useState(8);
  const [emergencyCases, setEmergencyCases] = useState(5);
  const [medicineConsumption, setMedicineConsumption] = useState('Paracetamol 500mg (80u), Cefotaxime 1g (25u), Tramadol 50mg (15u), IV Normal Saline (60u)');
  const [criticalRequirements, setCriticalRequirements] = useState('Glyceryl Trinitrate IV Infusion (10 ampoules), Adrenaline 1:1000 (15 vials)');
  const [bedCapacitySummary, setBedCapacitySummary] = useState('ICU Beds: 8/10 occupied. General Ward: 32/40 occupied.');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await api.dailyReports.getHospitalReports(hospId);
      if (Array.isArray(data)) {
        setReports(data);
      }
    } catch (err: any) {
      console.warn('Failed to load hospital daily reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [hospId]);

  // Determine current day's submission status
  const todaySubmission = reports.find((r) => r.reportDate === yesterdayStr);
  const isPastElevenAm = new Date().getHours() >= 11;
  const currentStatus = todaySubmission
    ? 'SUBMITTED'
    : isPastElevenAm
    ? 'OVERDUE'
    : 'DUE_SOON';

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const payload = {
        hospitalId: hospId,
        hospitalName: hospSource?.name || currentUser.name,
        reportDate,
        previousDayPatientCount: Number(patientCount),
        admissions: Number(admissions),
        discharges: Number(discharges),
        emergencyCases: Number(emergencyCases),
        medicineConsumptionSummary: medicineConsumption,
        criticalMedicineRequirements: criticalRequirements,
        bedCapacitySummary,
        status: 'SUBMITTED',
        submittedAt: new Date().toISOString(),
        submittedBy: currentUser.name || 'Hospital Operations Admin',
      };

      const result = await api.dailyReports.submitHospitalReport(payload);
      setReports((prev) => [result, ...prev.filter((r) => r.id !== result.id && r.reportDate !== result.reportDate)]);
      setSuccessMsg(`Daily operational report for ${reportDate} submitted successfully to Drug Authority.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit daily operational report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ConsoleLayout>
      <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
        
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
                Hospital Daily Operational Reporting (11:00 AM Regulatory Filing)
              </h1>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
              {hospSource?.name || currentUser.name} · Mandatory state health audit: previous-day patient census, bed loads &amp; critical drug shortages
            </p>
          </div>

          <div>
            {currentStatus === 'SUBMITTED' ? (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 99, background: '#ecfdf5',
                color: '#059669', border: '1px solid #a7f3d0', fontSize: 12.5, fontWeight: 800,
              }}>
                <CheckCircle2 style={{ width: 15, height: 15 }} /> Yesterday's Report Submitted ✓
              </span>
            ) : currentStatus === 'OVERDUE' ? (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 99, background: '#fef2f2',
                color: '#dc2626', border: '1px solid #fecaca', fontSize: 12.5, fontWeight: 800,
              }}>
                <ShieldAlert style={{ width: 15, height: 15 }} /> Filing Overdue (Past 11:00 AM)
              </span>
            ) : (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 99, background: '#fffbeb',
                color: '#d97706', border: '1px solid #fde68a', fontSize: 12.5, fontWeight: 800,
              }}>
                <Clock style={{ width: 15, height: 15 }} /> Due by 11:00 AM Today
              </span>
            )}
          </div>
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

        {errorMsg && (
          <div style={{
            padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 10, color: '#dc2626', fontSize: 13, fontWeight: 600,
            marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <AlertTriangle style={{ width: 16, height: 16 }} />
            {errorMsg}
          </div>
        )}

        {/* Submission Form Card */}
        <div style={{
          background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden', marginBottom: 28,
        }}>
          <div style={{
            padding: '18px 24px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText style={{ width: 16, height: 16, color: '#6d28d9' }} />
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                File Previous-Day Hospital Log for {reportDate}
              </h3>
            </div>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Submission Source: <strong>{hospSource?.name || 'Hospital Node'}</strong>
            </span>
          </div>

          <form onSubmit={handleSubmitReport} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>
                  Report Date *
                </label>
                <input
                  type="date"
                  required
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>
                  Total Inpatients (Midnight Census)
                </label>
                <input
                  type="number"
                  min="0"
                  value={patientCount}
                  onChange={(e) => setPatientCount(parseInt(e.target.value, 10) || 0)}
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>
                  24h Admissions
                </label>
                <input
                  type="number"
                  min="0"
                  value={admissions}
                  onChange={(e) => setAdmissions(parseInt(e.target.value, 10) || 0)}
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>
                  24h Discharges
                </label>
                <input
                  type="number"
                  min="0"
                  value={discharges}
                  onChange={(e) => setDischarges(parseInt(e.target.value, 10) || 0)}
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>
                Bed &amp; ICU Capacity Utilization Summary
              </label>
              <input
                type="text"
                placeholder="e.g. ICU: 8/10 occupied (2 ventilator beds open); General Ward: 32/40 occupied."
                value={bedCapacitySummary}
                onChange={(e) => setBedCapacitySummary(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>
                Previous-Day Critical Medicine Consumption Summary
              </label>
              <textarea
                rows={2}
                placeholder="List top medicines consumed (e.g. Paracetamol, Salbutamol nebulizer, IV fluids)..."
                value={medicineConsumption}
                onChange={(e) => setMedicineConsumption(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>
                Urgent Shortage Alerts / Critical Requisitions for Next 24 Hours
              </label>
              <textarea
                rows={2}
                placeholder="Specify drugs approaching exhaustion or critical shortages required from the state grid..."
                value={criticalRequirements}
                onChange={(e) => setCriticalRequirements(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 22px', background: '#6d28d9', color: '#fff',
                  border: 'none', borderRadius: 9, fontSize: 13.5, fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(109,40,217,0.3)',
                }}
              >
                {isSubmitting ? 'Submitting to Drug Authority...' : 'File Official Daily Report'}
              </button>
            </div>
          </form>
        </div>

        {/* Previous Filings History */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Audit Filing History
            </h3>
          </div>

          {loading ? (
            <div style={{ padding: 36, textAlign: 'center', color: '#64748b' }}>Loading report history...</div>
          ) : reports.length === 0 ? (
            <div style={{ padding: 36, textAlign: 'center', color: '#64748b' }}>
              No historical daily reports on file. Submit the form above to record your first filing.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#fafbfc', borderBottom: '1px solid #f1f5f9', textAlign: 'left' }}>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Filing Date</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Inpatients / Adm</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Critical Shortages Declared</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Submitted At</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((rep) => (
                    <tr key={rep.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0f172a' }}>
                        {rep.reportDate}
                      </td>
                      <td style={{ padding: '14px 18px', color: '#334155' }}>
                        <strong>{rep.previousDayPatientCount}</strong> inpatients ({rep.admissions} adm / {rep.discharges} dis)
                      </td>
                      <td style={{ padding: '14px 18px', color: '#475569', maxWidth: 320 }}>
                        <p style={{ margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {rep.criticalMedicineRequirements || 'None declared'}
                        </p>
                      </td>
                      <td style={{ padding: '14px 18px', color: '#64748b', fontSize: 12 }}>
                        {rep.submittedAt ? new Date(rep.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : 'N/A'}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 99,
                          background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0',
                        }}>
                          <CheckCircle2 style={{ width: 12, height: 12 }} /> Submitted
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ConsoleLayout>
  );
};
