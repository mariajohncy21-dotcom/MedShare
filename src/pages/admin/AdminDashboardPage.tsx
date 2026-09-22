import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import { api } from '../../services/api';
import { MedicalSource } from '../../types';
import {
  Building2, Hospital, ShieldCheck, Activity, AlertOctagon, Users,
  CheckCircle2, XCircle, Clock, Search, Eye, ThumbsUp, ThumbsDown,
  Pause, Play, Trash2, BarChart2, FileText, Package, TrendingDown,
  ArrowRight, Filter,
} from 'lucide-react';

const StatCard: React.FC<{ label:string; value:string|number; icon:React.ElementType; color:string; bg:string; border:string }> =
  ({ label, value, icon:Icon, color, bg, border }) => (
  <div style={{ background:'#fff', borderRadius:14, padding:'18px 20px', border:`1px solid ${border}`, boxShadow:'0 1px 6px rgba(0,0,0,0.04)', display:'flex', alignItems:'center', gap:14 }}>
    <div style={{ width:42, height:42, borderRadius:11, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <Icon style={{ width:19, height:19, color }} />
    </div>
    <div>
      <p style={{ fontSize:22, fontWeight:800, color:'#0f172a', margin:0, lineHeight:1 }}>{value}</p>
      <p style={{ fontSize:12, color:'#64748b', margin:'3px 0 0', fontWeight:500 }}>{label}</p>
    </div>
  </div>
);

const VERIFICATION_STATUS_STYLE: Record<string, { bg:string; color:string; border:string }> = {
  PENDING: { bg:'#fffbeb', color:'#d97706', border:'#fde68a' },
  APPROVED: { bg:'#f0fdf4', color:'#166534', border:'#bbf7d0' },
  REJECTED: { bg:'#fef2f2', color:'#dc2626', border:'#fecaca' },
  SUSPENDED: { bg:'#f5f3ff', color:'#6d28d9', border:'#ddd6fe' },
};

export const AdminDashboardPage: React.FC = () => {
  const {
    sources, inventory, auditLogs, reservations, emergencyRequests,
    approveSource, rejectSource, suspendSource, reactivateSource, softDeleteSource,
  } = useApp();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<'OVERVIEW'|'VERIFICATION'|'ORGANIZATIONS'|'INVENTORY'|'DAILY_REPORTS'|'AUDIT'>('OVERVIEW');
  const [sourceFilter, setSourceFilter] = useState<'ALL'|'PHARMACY'|'HOSPITAL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQ, setSearchQ] = useState('');
  const [rejectId, setRejectId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [suspendId, setSuspendId] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<MedicalSource|null>(null);

  const pharmacies = sources.filter(s => s.type === 'PHARMACY');
  const hospitals = sources.filter(s => s.type === 'HOSPITAL');
  const pending = sources.filter(s => s.verificationStatus === 'PENDING');
  const approved = sources.filter(s => s.verificationStatus === 'APPROVED');
  const suspended = sources.filter(s => s.accountStatus === 'SUSPENDED');
  const criticalStock = inventory.filter(i => i.stockStatus === 'CRITICAL' || i.stockStatus === 'OUT_OF_STOCK');

  const filteredSources = useMemo(() => {
    let s = sources;
    if (sourceFilter !== 'ALL') s = s.filter(x => x.type === sourceFilter);
    if (statusFilter !== 'ALL') s = s.filter(x => x.verificationStatus === statusFilter || x.accountStatus === statusFilter);
    if (searchQ) s = s.filter(x => x.name.toLowerCase().includes(searchQ.toLowerCase()) || x.city?.toLowerCase().includes(searchQ.toLowerCase()));
    return s;
  }, [sources, sourceFilter, statusFilter, searchQ]);

  const [adminReportsSummary, setAdminReportsSummary] = useState<any>(null);
  const [adminDrLoading, setAdminDrLoading] = useState(false);
  const [adminDrSubTab, setAdminDrSubTab] = useState<'HOSPITALS'|'PHARMACIES'>('HOSPITALS');

  const fetchAdminReportsSummary = async () => {
    setAdminDrLoading(true);
    try {
      const data = await api.dailyReports.getAdminSummary();
      setAdminReportsSummary(data);
    } catch { setAdminReportsSummary(null); }
    finally { setAdminDrLoading(false); }
  };

  useEffect(() => { fetchAdminReportsSummary(); }, []);

  const TABS = [
    { id: 'OVERVIEW', label: t('console.dashboard') },
    { id: 'VERIFICATION', label: t('navigation.verification') },
    { id: 'ORGANIZATIONS', label: t('console.organizations') },
    { id: 'INVENTORY', label: t('console.inventory') },
    { id: 'DAILY_REPORTS', label: t('console.reports') },
    { id: 'AUDIT', label: t('console.auditLogs') },
  ];

  return (
    <ConsoleLayout>
      <div style={{ padding:'24px 28px', maxWidth:1300, margin:'0 auto', fontFamily:'Inter, system-ui, sans-serif' }}>

        {/* Header */}
        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontSize:24, fontWeight:800, color:'#0f172a', margin:'0 0 4px' }}>{t('admin.dashboardTitle')}</h1>
          <p style={{ fontSize:13, color:'#64748b', margin:0 }}>
            MedShare Network Administration · Tisaiyanvilai, Tamil Nadu
          </p>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(185px,1fr))', gap:12, marginBottom:24 }}>
          <StatCard label={t('admin.totalPharmacies')} value={pharmacies.length} icon={Building2} color="#1d4ed8" bg="#eff6ff" border="#bfdbfe" />
          <StatCard label={t('admin.totalHospitals')} value={hospitals.length} icon={Hospital} color="#6d28d9" bg="#f5f3ff" border="#ddd6fe" />
          <StatCard label={t('admin.pendingVerifications')} value={pending.length} icon={Clock} color="#d97706" bg="#fffbeb" border="#fde68a" />
          <StatCard label={t('status.APPROVED')} value={approved.length} icon={CheckCircle2} color="#059669" bg="#f0fdf4" border="#bbf7d0" />
          <StatCard label={t('status.SUSPENDED')} value={suspended.length} icon={Pause} color="#dc2626" bg="#fef2f2" border="#fecaca" />
          <StatCard label={t('admin.systemAlerts')} value={criticalStock.length} icon={AlertOctagon} color="#9d174d" bg="#fdf2f8" border="#fbcfe8" />
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:4, borderBottom:'2px solid #f1f5f9', marginBottom:20, overflowX:'auto' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} style={{
              padding:'9px 18px', borderRadius:'8px 8px 0 0', border:'none', cursor:'pointer', whiteSpace:'nowrap',
              background: activeTab===tab.id ? '#fff' : 'transparent',
              color: activeTab===tab.id ? '#9d174d' : '#64748b',
              fontWeight: activeTab===tab.id ? 700 : 500, fontSize:13,
              borderBottom: activeTab===tab.id ? '2px solid #9d174d' : '2px solid transparent',
            }}>
              {tab.label}
              {tab.id === 'VERIFICATION' && pending.length > 0 && (
                <span style={{ marginLeft:6, background:'#dc2626', color:'#fff', fontSize:10, fontWeight:800, padding:'1px 6px', borderRadius:99 }}>{pending.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeTab === 'OVERVIEW' && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
            {/* Pending Verifications */}
            <div style={{ background:'#fff', borderRadius:14, padding:'20px 22px', border:`1px solid ${pending.length>0?'#fde68a':'#e2e8f0'}` }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <h3 style={{ fontSize:14, fontWeight:700, color:'#0f172a', margin:0, display:'flex', alignItems:'center', gap:6 }}>
                  <Clock style={{ width:15, height:15, color:'#d97706' }} /> Pending Verification
                </h3>
                {pending.length > 0 && <span style={{ fontSize:11, fontWeight:800, padding:'2px 8px', borderRadius:99, background:'#fffbeb', color:'#d97706', border:'1px solid #fde68a' }}>{pending.length}</span>}
              </div>
              {pending.length === 0 ? (
                <p style={{ color:'#94a3b8', fontSize:13 }}>✅ All registrations reviewed.</p>
              ) : pending.slice(0,4).map(s => (
                <div key={s.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #f8fafc' }}>
                  <div>
                    <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', margin:0 }}>{s.name}</p>
                    <p style={{ fontSize:11, color:'#64748b', margin:'2px 0 0' }}>{s.type} · {s.area}</p>
                  </div>
                  <div style={{ display:'flex', gap:5 }}>
                    <button onClick={() => approveSource(s.id)} style={{ padding:'5px 9px', background:'#f0fdf4', color:'#059669', border:'1px solid #bbf7d0', borderRadius:7, cursor:'pointer', fontSize:11, fontWeight:700 }}>✓</button>
                    <button onClick={() => { setRejectId(s.id); setRejectReason(''); }} style={{ padding:'5px 9px', background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', borderRadius:7, cursor:'pointer', fontSize:11, fontWeight:700 }}>✗</button>
                  </div>
                </div>
              ))}
              {pending.length > 0 && (
                <button onClick={() => setActiveTab('VERIFICATION')} style={{ marginTop:10, fontSize:12, color:'#d97706', fontWeight:700, background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', alignItems:'center', gap:4 }}>
                  Review all <ArrowRight style={{ width:12, height:12 }} />
                </button>
              )}
            </div>

            {/* System Stats */}
            <div style={{ background:'#fff', borderRadius:14, padding:'20px 22px', border:'1px solid #e2e8f0' }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:'#0f172a', margin:'0 0 14px', display:'flex', alignItems:'center', gap:6 }}>
                <BarChart2 style={{ width:15, height:15, color:'#9d174d' }} /> Network Activity
              </h3>
              {[
                { label:'Total Reservations', value:reservations.length, color:'#1d4ed8' },
                { label:'Emergency Requests', value:emergencyRequests.length, color:'#dc2626' },
                { label:'Total Inventory Items', value:inventory.length, color:'#059669' },
                { label:'Audit Log Entries', value:auditLogs.length, color:'#6d28d9' },
              ].map(item => (
                <div key={item.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #f8fafc' }}>
                  <span style={{ fontSize:13, color:'#374151' }}>{item.label}</span>
                  <span style={{ fontSize:14, fontWeight:800, color:item.color }}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* Critical Stock */}
            <div style={{ background:'#fff', borderRadius:14, padding:'20px 22px', border:`1px solid ${criticalStock.length>0?'#fecaca':'#e2e8f0'}` }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:'#0f172a', margin:'0 0 14px', display:'flex', alignItems:'center', gap:6 }}>
                <AlertOctagon style={{ width:15, height:15, color:'#dc2626' }} /> Critical Stock
              </h3>
              {criticalStock.length === 0 ? (
                <p style={{ color:'#94a3b8', fontSize:13 }}>✅ No critical stock alerts.</p>
              ) : criticalStock.slice(0,5).map(i => (
                <div key={i.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid #f8fafc' }}>
                  <div>
                    <p style={{ fontSize:13, fontWeight:600, color:'#0f172a', margin:0 }}>{i.medicineName}</p>
                    <p style={{ fontSize:11, color:'#64748b', margin:'1px 0 0' }}>{i.sourceId}</p>
                  </div>
                  <span style={{ fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:99, background:'#fef2f2', color:'#dc2626' }}>{i.quantity} left</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VERIFICATION */}
        {activeTab === 'VERIFICATION' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {pending.length === 0 ? (
              <div style={{ textAlign:'center', padding:'48px 24px', background:'#fff', borderRadius:14, border:'1px solid #e2e8f0' }}>
                <CheckCircle2 style={{ width:40, height:40, color:'#10b981', margin:'0 auto 12px' }} />
                <p style={{ fontSize:15, fontWeight:700, color:'#0f172a', margin:'0 0 4px' }}>All caught up!</p>
                <p style={{ fontSize:13, color:'#64748b', margin:0 }}>No pending verification requests at this time.</p>
              </div>
            ) : sources.filter(s=>s.verificationStatus==='PENDING').map(s => (
              <div key={s.id} style={{ background:'#fff', borderRadius:14, padding:'18px 22px', border:'1px solid #fde68a', display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <p style={{ fontSize:15, fontWeight:800, color:'#0f172a', margin:0 }}>{s.name}</p>
                    <span style={{ fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:99, background:s.type==='PHARMACY'?'#eff6ff':'#f5f3ff', color:s.type==='PHARMACY'?'#1d4ed8':'#6d28d9', border:`1px solid ${s.type==='PHARMACY'?'#bfdbfe':'#ddd6fe'}` }}>{s.type}</span>
                  </div>
                  <p style={{ fontSize:12.5, color:'#64748b', margin:'0 0 4px' }}>
                    {s.address} · {s.area}, {s.city}
                  </p>
                  <p style={{ fontSize:12, color:'#94a3b8', margin:0 }}>
                    License: <strong>{s.licenseNumber||'Not provided'}</strong> · Email: {s.email||'—'}
                  </p>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => approveSource(s.id)} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', background:'linear-gradient(135deg,#059669,#10b981)', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:700 }}>
                    <ThumbsUp style={{ width:13, height:13 }} /> Approve
                  </button>
                  <button onClick={() => { setRejectId(s.id); setRejectReason(''); }} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:700 }}>
                    <ThumbsDown style={{ width:13, height:13 }} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ORGANIZATIONS */}
        {activeTab === 'ORGANIZATIONS' && (
          <div>
            <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
              <div style={{ position:'relative', flex:1, minWidth:200 }}>
                <Search style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', width:14, height:14, color:'#94a3b8' }} />
                <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search organizations…" style={{ width:'100%', padding:'9px 12px 9px 34px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:13, outline:'none', boxSizing:'border-box' as const }} />
              </div>
              {[{v:'ALL',l:'All'},{v:'PHARMACY',l:'Pharmacies'},{v:'HOSPITAL',l:'Hospitals'}].map(f=>(
                <button key={f.v} onClick={()=>setSourceFilter(f.v as any)} style={{ padding:'9px 14px', borderRadius:10, border:'1px solid #e2e8f0', background:sourceFilter===f.v?'#9d174d':'#fff', color:sourceFilter===f.v?'#fff':'#64748b', fontWeight:sourceFilter===f.v?700:500, fontSize:13, cursor:'pointer' }}>{f.l}</button>
              ))}
              {['ALL','PENDING','APPROVED','REJECTED','SUSPENDED'].map(f=>(
                <button key={f} onClick={()=>setStatusFilter(f)} style={{ padding:'9px 14px', borderRadius:10, border:'1px solid #e2e8f0', background:statusFilter===f?'#1d4ed8':'#fff', color:statusFilter===f?'#fff':'#64748b', fontWeight:statusFilter===f?700:500, fontSize:12, cursor:'pointer' }}>{f}</button>
              ))}
            </div>

            <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e2e8f0', overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' as const, fontSize:13 }}>
                <thead>
                  <tr style={{ background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
                    {['Organization','Type','Location','Status','Verification','Actions'].map(h=>(
                      <th key={h} style={{ padding:'11px 14px', textAlign:'left' as const, fontWeight:700, color:'#475569', fontSize:11, textTransform:'uppercase' as const, letterSpacing:'0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSources.map((s, idx) => {
                    const vs = VERIFICATION_STATUS_STYLE[s.verificationStatus || 'PENDING'] || VERIFICATION_STATUS_STYLE.PENDING;
                    const isSuspended = s.accountStatus === 'SUSPENDED';
                    return (
                      <tr key={s.id} style={{ borderBottom:'1px solid #f1f5f9', background:idx%2===0?'#fff':'#fafbfc' }}>
                        <td style={{ padding:'11px 14px', fontWeight:700, color:'#0f172a' }}>{s.name}</td>
                        <td style={{ padding:'11px 14px' }}>
                          <span style={{ fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:99, background:s.type==='PHARMACY'?'#eff6ff':'#f5f3ff', color:s.type==='PHARMACY'?'#1d4ed8':'#6d28d9' }}>{s.type}</span>
                        </td>
                        <td style={{ padding:'11px 14px', color:'#64748b', fontSize:12 }}>{s.area}, {s.city}</td>
                        <td style={{ padding:'11px 14px' }}>
                          <span style={{ fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:99, background:isSuspended?'#fef2f2':'#f0fdf4', color:isSuspended?'#dc2626':'#059669' }}>
                            {isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                          </span>
                        </td>
                        <td style={{ padding:'11px 14px' }}>
                          <span style={{ fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:99, background:vs.bg, color:vs.color, border:`1px solid ${vs.border}` }}>
                            {s.verificationStatus}
                          </span>
                        </td>
                        <td style={{ padding:'11px 14px' }}>
                          <div style={{ display:'flex', gap:4 }}>
                            {s.verificationStatus === 'PENDING' && (
                              <>
                                <button onClick={() => approveSource(s.id)} title="Approve" style={{ padding:'5px 8px', background:'#f0fdf4', color:'#059669', border:'1px solid #bbf7d0', borderRadius:7, cursor:'pointer', fontSize:11 }}>✓</button>
                                <button onClick={() => { setRejectId(s.id); setRejectReason(''); }} title="Reject" style={{ padding:'5px 8px', background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', borderRadius:7, cursor:'pointer', fontSize:11 }}>✗</button>
                              </>
                            )}
                            {s.accountStatus === 'ACTIVE' && s.verificationStatus === 'APPROVED' && (
                              <button onClick={() => { setSuspendId(s.id); setSuspendReason(''); }} title="Suspend" style={{ padding:'5px 8px', background:'#fffbeb', color:'#d97706', border:'1px solid #fde68a', borderRadius:7, cursor:'pointer', fontSize:11 }}>
                                <Pause style={{ width:11, height:11 }} />
                              </button>
                            )}
                            {s.accountStatus === 'SUSPENDED' && (
                              <button onClick={() => reactivateSource(s.id)} title="Reactivate" style={{ padding:'5px 8px', background:'#f0fdf4', color:'#059669', border:'1px solid #bbf7d0', borderRadius:7, cursor:'pointer', fontSize:11 }}>
                                <Play style={{ width:11, height:11 }} />
                              </button>
                            )}
                            <button onClick={() => { if (confirm(`Delete ${s.name}?`)) softDeleteSource(s.id, 'Admin removed'); }} title="Delete" style={{ padding:'5px 8px', background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', borderRadius:7, cursor:'pointer', fontSize:11 }}>
                              <Trash2 style={{ width:11, height:11 }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredSources.length === 0 && (
                <div style={{ textAlign:'center', padding:32, color:'#94a3b8', fontSize:13 }}>No organizations match your filter.</div>
              )}
            </div>
          </div>
        )}

        {/* DAILY REPORTS MONITOR */}
        {activeTab === 'DAILY_REPORTS' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Sub-tab selection */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
              <div style={{ display:'flex', gap:6, background:'#f1f5f9', padding:4, borderRadius:10 }}>
                <button
                  onClick={() => setAdminDrSubTab('HOSPITALS')}
                  style={{
                    padding:'7px 16px', borderRadius:8, border:'none', cursor:'pointer', fontSize:12.5, fontWeight:700,
                    background: adminDrSubTab === 'HOSPITALS' ? '#fff' : 'transparent',
                    color: adminDrSubTab === 'HOSPITALS' ? '#6d28d9' : '#64748b',
                    boxShadow: adminDrSubTab === 'HOSPITALS' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  Hospitals Daily Operational Reports
                </button>
                <button
                  onClick={() => setAdminDrSubTab('PHARMACIES')}
                  style={{
                    padding:'7px 16px', borderRadius:8, border:'none', cursor:'pointer', fontSize:12.5, fontWeight:700,
                    background: adminDrSubTab === 'PHARMACIES' ? '#fff' : 'transparent',
                    color: adminDrSubTab === 'PHARMACIES' ? '#1d4ed8' : '#64748b',
                    boxShadow: adminDrSubTab === 'PHARMACIES' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  Pharmacies Daily Stock Audits
                </button>
              </div>

              <span style={{ fontSize:12, fontWeight:700, color:'#64748b' }}>
                11:00 AM Deadline Monitoring System
              </span>
            </div>

            {/* Metrics cards */}
            {adminReportsSummary && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12 }}>
                {adminDrSubTab === 'HOSPITALS' ? [
                  { label: 'Total Hospitals', val: adminReportsSummary.hospitals.total, color: '#6d28d9', bg: '#f5f3ff' },
                  { label: 'Submitted ✓', val: adminReportsSummary.hospitals.submitted, color: '#059669', bg: '#f0fdf4' },
                  { label: 'Pending Due', val: adminReportsSummary.hospitals.pending, color: '#d97706', bg: '#fffbeb' },
                  { label: 'Overdue', val: adminReportsSummary.hospitals.overdue, color: '#dc2626', bg: '#fef2f2' },
                ].map(m => (
                  <div key={m.label} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color: m.color, margin: 0 }}>{m.val}</p>
                    <p style={{ fontSize: 11.5, color: '#64748b', margin: '2px 0 0', fontWeight: 600 }}>{m.label}</p>
                  </div>
                )) : [
                  { label: 'Total Pharmacies', val: adminReportsSummary.pharmacies.total, color: '#1d4ed8', bg: '#eff6ff' },
                  { label: 'Submitted ✓', val: adminReportsSummary.pharmacies.submitted, color: '#059669', bg: '#f0fdf4' },
                  { label: 'Pending Due', val: adminReportsSummary.pharmacies.pending, color: '#d97706', bg: '#fffbeb' },
                  { label: 'Overdue', val: adminReportsSummary.pharmacies.overdue, color: '#dc2626', bg: '#fef2f2' },
                ].map(m => (
                  <div key={m.label} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color: m.color, margin: 0 }}>{m.val}</p>
                    <p style={{ fontSize: 11.5, color: '#64748b', margin: '2px 0 0', fontWeight: 600 }}>{m.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Table */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              {adminDrLoading ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading daily report monitoring state…</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      {['Organization', 'Reporting Date', 'Submitted At', 'Submission Status'].map(h => (
                        <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {((adminDrSubTab === 'HOSPITALS' ? adminReportsSummary?.hospitals?.reports : adminReportsSummary?.pharmacies?.reports) || []).map((r: any, idx: number) => (
                      <tr key={r.organizationId} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}>
                        <td style={{ padding: '11px 14px', fontWeight: 700, color: '#0f172a' }}>{r.organizationName}</td>
                        <td style={{ padding: '11px 14px', color: '#64748b', fontSize: 12 }}>{r.reportDate}</td>
                        <td style={{ padding: '11px 14px', color: '#64748b', fontSize: 12 }}>{r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '—'}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{
                            fontSize: 10, fontWeight: 800, padding: '2px 9px', borderRadius: 99,
                            background: r.status === 'SUBMITTED' ? '#f0fdf4' : r.status === 'OVERDUE' ? '#fef2f2' : '#fffbeb',
                            color: r.status === 'SUBMITTED' ? '#166534' : r.status === 'OVERDUE' ? '#dc2626' : '#d97706',
                            border: `1px solid ${r.status === 'SUBMITTED' ? '#bbf7d0' : r.status === 'OVERDUE' ? '#fecaca' : '#fde68a'}`,
                          }}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* AUDIT Logs */}
        {activeTab === 'AUDIT' && (
          <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e2e8f0', overflow:'hidden' }}>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid #f1f5f9', fontWeight:700, fontSize:14 }}>
              Audit Trail ({auditLogs.length} entries)
            </div>
            <div style={{ maxHeight:600, overflowY:'auto' }}>
              {auditLogs.map((log, idx) => (
                <div key={log.id} style={{ padding:'12px 18px', borderBottom:'1px solid #f8fafc', display:'flex', alignItems:'flex-start', gap:12, background:idx%2===0?'#fff':'#fafbfc' }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:'#9d174d', marginTop:5, flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:4 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{log.action.replace(/_/g,' ')}</span>
                      <span style={{ fontSize:11, color:'#94a3b8' }}>{log.date} {log.time}</span>
                    </div>
                    <p style={{ fontSize:12, color:'#64748b', margin:'3px 0 0' }}>
                      <strong>{log.organizationName}</strong> · By: {log.performedBy} · {log.reason}
                    </p>
                  </div>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <div style={{ textAlign:'center', padding:32, color:'#94a3b8', fontSize:13 }}>No audit log entries yet.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectId && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:20, padding:28, width:'100%', maxWidth:400 }}>
            <h3 style={{ fontSize:17, fontWeight:800, color:'#dc2626', margin:'0 0 12px' }}>Reject Organization</h3>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:6 }}>Reason for Rejection *</label>
              <textarea value={rejectReason} onChange={e=>setRejectReason(e.target.value)} rows={3} placeholder="Explain why this registration is being rejected…" style={{ width:'100%', padding:'10px 13px', border:'1.5px solid #fecaca', borderRadius:9, fontSize:13, outline:'none', resize:'none', boxSizing:'border-box' as const }} />
            </div>
            <div style={{ display:'flex', gap:10, marginTop:18 }}>
              <button onClick={() => setRejectId('')} style={{ flex:1, padding:'10px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:600, color:'#64748b' }}>Cancel</button>
              <button onClick={() => { rejectSource(rejectId, rejectReason||'Rejected by admin'); setRejectId(''); }} disabled={!rejectReason.trim()} style={{ flex:2, padding:'10px', background:rejectReason.trim()?'#dc2626':'#e2e8f0', color:rejectReason.trim()?'#fff':'#94a3b8', border:'none', borderRadius:10, cursor:rejectReason.trim()?'pointer':'not-allowed', fontSize:13, fontWeight:700 }}>Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {suspendId && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:20, padding:28, width:'100%', maxWidth:400 }}>
            <h3 style={{ fontSize:17, fontWeight:800, color:'#d97706', margin:'0 0 12px' }}>Suspend Organization</h3>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:6 }}>Reason for Suspension *</label>
              <textarea value={suspendReason} onChange={e=>setSuspendReason(e.target.value)} rows={3} placeholder="Explain why this account is being suspended…" style={{ width:'100%', padding:'10px 13px', border:'1.5px solid #fde68a', borderRadius:9, fontSize:13, outline:'none', resize:'none', boxSizing:'border-box' as const }} />
            </div>
            <div style={{ display:'flex', gap:10, marginTop:18 }}>
              <button onClick={() => setSuspendId('')} style={{ flex:1, padding:'10px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:600, color:'#64748b' }}>Cancel</button>
              <button onClick={() => { suspendSource(suspendId, suspendReason||'Suspended by admin'); setSuspendId(''); }} disabled={!suspendReason.trim()} style={{ flex:2, padding:'10px', background:suspendReason.trim()?'#d97706':'#e2e8f0', color:suspendReason.trim()?'#fff':'#94a3b8', border:'none', borderRadius:10, cursor:suspendReason.trim()?'pointer':'not-allowed', fontSize:13, fontWeight:700 }}>Confirm Suspension</button>
            </div>
          </div>
        </div>
      )}
    </ConsoleLayout>
  );
};
