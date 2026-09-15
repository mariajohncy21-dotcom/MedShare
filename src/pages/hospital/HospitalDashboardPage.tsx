import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import { api } from '../../services/api';
import { HospitalPatient } from '../../types';
import {
  Package, Users, AlertOctagon, ArrowLeftRight, Bell, Send, TrendingUp,
  Plus, Edit2, Trash2, Search, X, CheckCircle2, Activity, Upload,
  ChevronDown, RefreshCw, ArrowRight, Stethoscope,
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

const STATUS_COLORS: Record<string, { bg:string; color:string; border:string }> = {
  ADMITTED: { bg:'#eff6ff', color:'#1d4ed8', border:'#bfdbfe' },
  DISCHARGED: { bg:'#f0fdf4', color:'#166534', border:'#bbf7d0' },
  ICU: { bg:'#fef2f2', color:'#dc2626', border:'#fecaca' },
  TRANSFERRED: { bg:'#f5f3ff', color:'#6d28d9', border:'#ddd6fe' },
  STABLE: { bg:'#f0fdf4', color:'#166534', border:'#bbf7d0' },
  CRITICAL: { bg:'#fef2f2', color:'#dc2626', border:'#fecaca' },
  URGENT: { bg:'#fffbeb', color:'#d97706', border:'#fde68a' },
  DISCHARGED_ES: { bg:'#f8fafc', color:'#475569', border:'#e2e8f0' },
};

const EMPTY_PATIENT: Omit<HospitalPatient, 'id'|'hospitalId'|'createdAt'> = {
  name:'', age:undefined, gender:'Unknown', contact:'',
  admissionDate: new Date().toISOString().split('T')[0],
  ward:'General', bed:'', emergencyStatus:'STABLE',
  department:'General Medicine', status:'ADMITTED', notes:'',
};

export const HospitalDashboardPage: React.FC = () => {
  const { currentUser, inventory, sources, reservations, emergencyRequests, transfers, addInventoryItem, deleteInventoryItem } = useApp();

  const [activeTab, setActiveTab] = useState<'OVERVIEW'|'PATIENTS'|'INVENTORY'|'REQUESTS'|'TRANSFERS'>('OVERVIEW');
  const [patients, setPatients] = useState<HospitalPatient[]>([]);
  const [pLoading, setPLoading] = useState(false);
  const [pSearch, setPSearch] = useState('');
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<HospitalPatient|null>(null);
  const [patientForm, setPatientForm] = useState<Omit<HospitalPatient,'id'|'hospitalId'|'createdAt'>>(EMPTY_PATIENT);
  const [invSearch, setInvSearch] = useState('');

  const hospId = currentUser.sourceId || 'SRC-HOSP-001';
  const hospSource = sources.find(s => s.id === hospId);
  const myInventory = inventory.filter(i => i.sourceId === hospId);
  const myTransfers = transfers.filter(t => t.fromSourceId === hospId || t.toSourceId === hospId);
  const myReservations = reservations.filter(r => r.userId === currentUser.id);
  const criticalStock = myInventory.filter(i => i.stockStatus === 'CRITICAL' || i.stockStatus === 'OUT_OF_STOCK');

  const fetchPatients = async () => {
    setPLoading(true);
    try {
      const data = await api.hospitalPatients.getAll();
      setPatients(data);
    } catch { setPatients([]); }
    finally { setPLoading(false); }
  };

  useEffect(() => { fetchPatients(); }, []);

  const filteredPatients = useMemo(() =>
    patients.filter(p =>
      p.name.toLowerCase().includes(pSearch.toLowerCase()) ||
      p.ward.toLowerCase().includes(pSearch.toLowerCase()) ||
      p.department.toLowerCase().includes(pSearch.toLowerCase())
    ), [patients, pSearch]
  );

  const filteredInventory = useMemo(() =>
    myInventory.filter(i => i.medicineName.toLowerCase().includes(invSearch.toLowerCase())),
    [myInventory, invSearch]
  );

  const openNewPatient = () => {
    setEditingPatient(null);
    setPatientForm({ ...EMPTY_PATIENT, admissionDate: new Date().toISOString().split('T')[0] });
    setShowPatientModal(true);
  };

  const openEditPatient = (p: HospitalPatient) => {
    setEditingPatient(p);
    setPatientForm({ name:p.name, age:p.age, gender:p.gender, contact:p.contact||'', admissionDate:p.admissionDate, ward:p.ward, bed:p.bed||'', emergencyStatus:p.emergencyStatus, department:p.department, status:p.status, notes:p.notes||'' });
    setShowPatientModal(true);
  };

  const savePatient = async () => {
    try {
      if (editingPatient) {
        await api.hospitalPatients.update(editingPatient.id, patientForm);
      } else {
        await api.hospitalPatients.create(patientForm);
      }
      setShowPatientModal(false);
      fetchPatients();
    } catch (e) { console.error(e); }
  };

  const deletePatient = async (id: string) => {
    if (!confirm('Remove this patient record?')) return;
    try { await api.hospitalPatients.delete(id); fetchPatients(); }
    catch (e) { console.error(e); }
  };

  const TABS = ['OVERVIEW','PATIENTS','INVENTORY','REQUESTS','TRANSFERS'];
  const admitted = patients.filter(p => p.status === 'ADMITTED').length;
  const critical = patients.filter(p => p.emergencyStatus === 'CRITICAL').length;

  return (
    <ConsoleLayout>
      <div style={{ padding:'24px 28px', maxWidth:1200, margin:'0 auto', fontFamily:'Inter, system-ui, sans-serif' }}>

        {/* Header */}
        <div style={{ marginBottom:24, display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ fontSize:24, fontWeight:800, color:'#0f172a', margin:'0 0 4px' }}>Hospital Console</h1>
            <p style={{ fontSize:13, color:'#64748b', margin:0 }}>
              {hospSource?.name || currentUser.name} · {hospSource?.area}, {hospSource?.city}
            </p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <Link to="/hospital/bulk-upload" style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', background:'#f5f3ff', color:'#6d28d9', borderRadius:10, textDecoration:'none', fontSize:13, fontWeight:600, border:'1px solid #ddd6fe' }}>
              <Upload style={{ width:14, height:14 }} /> Bulk Upload
            </Link>
            <Link to="/hospital/request-medicine" style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', background:'linear-gradient(135deg,#6d28d9,#8b5cf6)', color:'#fff', borderRadius:10, textDecoration:'none', fontSize:13, fontWeight:700, boxShadow:'0 4px 12px rgba(109,40,217,0.25)' }}>
              <Send style={{ width:14, height:14 }} /> Request Medicine
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12, marginBottom:24 }}>
          <StatCard label="Admitted Patients" value={admitted} icon={Users} color="#6d28d9" bg="#f5f3ff" border="#ddd6fe" />
          <StatCard label="Critical Cases" value={critical} icon={AlertOctagon} color="#dc2626" bg="#fef2f2" border="#fecaca" />
          <StatCard label="Medicine Types" value={myInventory.length} icon={Package} color="#1d4ed8" bg="#eff6ff" border="#bfdbfe" />
          <StatCard label="Critical Stock" value={criticalStock.length} icon={Activity} color="#d97706" bg="#fffbeb" border="#fde68a" />
          <StatCard label="Active Transfers" value={myTransfers.filter(t=>t.status==='IN_TRANSIT').length} icon={ArrowLeftRight} color="#0f766e" bg="#f0fdfa" border="#99f6e4" />
          <StatCard label="My Reservations" value={myReservations.length} icon={CheckCircle2} color="#059669" bg="#f0fdf4" border="#bbf7d0" />
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:4, borderBottom:'2px solid #f1f5f9', marginBottom:20, overflowX:'auto' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t as any)} style={{
              padding:'9px 18px', borderRadius:'8px 8px 0 0', border:'none', cursor:'pointer', whiteSpace:'nowrap',
              background: activeTab===t ? '#fff' : 'transparent',
              color: activeTab===t ? '#6d28d9' : '#64748b',
              fontWeight: activeTab===t ? 700 : 500, fontSize:13,
              borderBottom: activeTab===t ? '2px solid #6d28d9' : '2px solid transparent',
            }}>{t.charAt(0)+t.slice(1).toLowerCase()}</button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeTab === 'OVERVIEW' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={{ background:'#fff', borderRadius:14, padding:'20px', border:'1px solid #ddd6fe' }}>
              <h3 style={{ fontSize:14, fontWeight:700, margin:'0 0 14px', display:'flex', alignItems:'center', gap:6 }}>
                <Users style={{ width:15, height:15, color:'#6d28d9' }} /> Patient Summary
              </h3>
              {patients.length === 0 ? <p style={{ color:'#94a3b8', fontSize:13 }}>No patients recorded yet.</p> : (
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {['ADMITTED','ICU','DISCHARGED','TRANSFERRED'].map(s => {
                    const count = patients.filter(p=>p.status===s).length;
                    const sc = STATUS_COLORS[s] || STATUS_COLORS.ADMITTED;
                    return count > 0 ? (
                      <div key={s} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid #f8fafc' }}>
                        <span style={{ fontSize:13, color:'#374151', fontWeight:500 }}>{s}</span>
                        <span style={{ fontSize:11, fontWeight:800, padding:'2px 10px', borderRadius:99, background:sc.bg, color:sc.color, border:`1px solid ${sc.border}` }}>{count}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </div>
            <div style={{ background:'#fff', borderRadius:14, padding:'20px', border:'1px solid #fde68a' }}>
              <h3 style={{ fontSize:14, fontWeight:700, margin:'0 0 14px', display:'flex', alignItems:'center', gap:6 }}>
                <Activity style={{ width:15, height:15, color:'#d97706' }} /> Critical Stock Alerts
              </h3>
              {criticalStock.length === 0 ? <p style={{ color:'#94a3b8', fontSize:13 }}>All stock levels healthy.</p> : (
                criticalStock.slice(0, 5).map(i => (
                  <div key={i.id} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #f8fafc' }}>
                    <span style={{ fontSize:13, fontWeight:600 }}>{i.medicineName}</span>
                    <span style={{ fontSize:11, fontWeight:800, padding:'2px 8px', borderRadius:99, background:'#fef2f2', color:'#dc2626' }}>{i.quantity} left</span>
                  </div>
                ))
              )}
              <Link to="/hospital/request-medicine" style={{ display:'inline-flex', alignItems:'center', gap:5, marginTop:12, fontSize:12, color:'#6d28d9', fontWeight:700, textDecoration:'none' }}>
                Request from pharmacies <ArrowRight style={{ width:12, height:12 }} />
              </Link>
            </div>
          </div>
        )}

        {/* PATIENTS */}
        {activeTab === 'PATIENTS' && (
          <div>
            <div style={{ display:'flex', gap:10, marginBottom:14, alignItems:'center', flexWrap:'wrap' }}>
              <div style={{ position:'relative', flex:1, minWidth:200 }}>
                <Search style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', width:14, height:14, color:'#94a3b8' }} />
                <input value={pSearch} onChange={e=>setPSearch(e.target.value)} placeholder="Search patients by name, ward, department…" style={{ width:'100%', padding:'9px 12px 9px 34px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:13, outline:'none', boxSizing:'border-box' as const }} />
              </div>
              <button onClick={openNewPatient} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', background:'linear-gradient(135deg,#6d28d9,#8b5cf6)', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 12px rgba(109,40,217,0.25)' }}>
                <Plus style={{ width:14, height:14 }} /> Add Patient
              </button>
              <button onClick={fetchPatients} style={{ padding:'9px 12px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, cursor:'pointer', color:'#64748b' }}>
                <RefreshCw style={{ width:14, height:14 }} />
              </button>
            </div>

            {pLoading ? (
              <div style={{ textAlign:'center', padding:40, color:'#64748b' }}>Loading patients…</div>
            ) : filteredPatients.length === 0 ? (
              <div style={{ textAlign:'center', padding:'48px 24px', background:'#fff', borderRadius:14, border:'1px solid #e2e8f0' }}>
                <Stethoscope style={{ width:40, height:40, color:'#cbd5e1', margin:'0 auto 10px' }} />
                <p style={{ fontSize:14, fontWeight:700, color:'#64748b', margin:'0 0 4px' }}>{pSearch ? 'No patients found' : 'No patient records yet'}</p>
                <p style={{ fontSize:12.5, color:'#94a3b8', margin:'0 0 14px' }}>Add a patient to get started.</p>
                <button onClick={openNewPatient} style={{ padding:'9px 18px', background:'#6d28d9', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer' }}>Add First Patient</button>
              </div>
            ) : (
              <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e2e8f0', overflow:'hidden' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' as const, fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
                      {['Name','Age/Gender','Ward/Bed','Department','Status','Emergency','Actions'].map(h=>(
                        <th key={h} style={{ padding:'11px 13px', textAlign:'left' as const, fontWeight:700, color:'#475569', fontSize:11, textTransform:'uppercase' as const, letterSpacing:'0.04em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map((p, idx) => {
                      const sc = STATUS_COLORS[p.status] || STATUS_COLORS.ADMITTED;
                      const esc = STATUS_COLORS[p.emergencyStatus] || STATUS_COLORS.STABLE;
                      return (
                        <tr key={p.id} style={{ borderBottom:'1px solid #f1f5f9', background:idx%2===0?'#fff':'#fafbfc' }}>
                          <td style={{ padding:'11px 13px', fontWeight:700, color:'#0f172a' }}>{p.name}</td>
                          <td style={{ padding:'11px 13px', color:'#64748b' }}>{p.age ? `${p.age}y` : '—'} / {p.gender}</td>
                          <td style={{ padding:'11px 13px', color:'#374151', fontWeight:500 }}>{p.ward}{p.bed ? ` · Bed ${p.bed}` : ''}</td>
                          <td style={{ padding:'11px 13px', color:'#64748b' }}>{p.department}</td>
                          <td style={{ padding:'11px 13px' }}><span style={{ fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:99, background:sc.bg, color:sc.color, border:`1px solid ${sc.border}` }}>{p.status}</span></td>
                          <td style={{ padding:'11px 13px' }}><span style={{ fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:99, background:esc.bg, color:esc.color, border:`1px solid ${esc.border}` }}>{p.emergencyStatus}</span></td>
                          <td style={{ padding:'11px 13px' }}>
                            <div style={{ display:'flex', gap:5 }}>
                              <button onClick={() => openEditPatient(p)} style={{ padding:'5px 10px', background:'#f5f3ff', color:'#6d28d9', border:'1px solid #ddd6fe', borderRadius:7, cursor:'pointer' }}>
                                <Edit2 style={{ width:12, height:12 }} />
                              </button>
                              <button onClick={() => deletePatient(p.id)} style={{ padding:'5px 10px', background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', borderRadius:7, cursor:'pointer' }}>
                                <Trash2 style={{ width:12, height:12 }} />
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
        )}

        {/* INVENTORY */}
        {activeTab === 'INVENTORY' && (
          <div>
            <div style={{ position:'relative', marginBottom:14 }}>
              <Search style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', width:14, height:14, color:'#94a3b8' }} />
              <input value={invSearch} onChange={e=>setInvSearch(e.target.value)} placeholder="Search inventory…" style={{ width:'100%', padding:'9px 12px 9px 34px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:13, outline:'none', boxSizing:'border-box' as const }} />
            </div>
            <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e2e8f0', overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' as const, fontSize:13 }}>
                <thead>
                  <tr style={{ background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
                    {['Medicine','Batch','Qty','Expiry','Status'].map(h=>(
                      <th key={h} style={{ padding:'11px 14px', textAlign:'left' as const, fontWeight:700, color:'#475569', fontSize:11, textTransform:'uppercase' as const, letterSpacing:'0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((i, idx) => (
                    <tr key={i.id} style={{ borderBottom:'1px solid #f1f5f9', background:idx%2===0?'#fff':'#fafbfc' }}>
                      <td style={{ padding:'11px 14px', fontWeight:600, color:'#0f172a' }}>{i.medicineName}</td>
                      <td style={{ padding:'11px 14px', color:'#64748b', fontFamily:'monospace', fontSize:12 }}>{i.batchNumber}</td>
                      <td style={{ padding:'11px 14px', fontWeight:700, color:i.quantity===0?'#dc2626':i.quantity<=15?'#d97706':'#059669' }}>{i.quantity}</td>
                      <td style={{ padding:'11px 14px', color:'#64748b', fontSize:12 }}>{i.expiryDate}</td>
                      <td style={{ padding:'11px 14px' }}>
                        <span style={{ fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:99, background:i.stockStatus==='GOOD'?'#f0fdf4':i.stockStatus==='LOW'?'#fffbeb':'#fef2f2', color:i.stockStatus==='GOOD'?'#166534':i.stockStatus==='LOW'?'#92400e':'#dc2626' }}>{i.stockStatus}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredInventory.length === 0 && (
                <div style={{ textAlign:'center', padding:32, color:'#94a3b8', fontSize:13 }}>No inventory items found.</div>
              )}
            </div>
          </div>
        )}

        {/* REQUESTS */}
        {activeTab === 'REQUESTS' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <Link to="/hospital/request-medicine" style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', background:'linear-gradient(135deg,#6d28d9,#8b5cf6)', color:'#fff', borderRadius:10, textDecoration:'none', fontSize:13, fontWeight:700 }}>
                <Plus style={{ width:14, height:14 }} /> New Request
              </Link>
            </div>
            {emergencyRequests.filter(r=>r.hospitalId===hospId||r.requesterId===currentUser.id).length===0 ? (
              <div style={{ textAlign:'center', padding:'48px 24px', background:'#fff', borderRadius:14, border:'1px solid #e2e8f0' }}>
                <Send style={{ width:40, height:40, color:'#cbd5e1', margin:'0 auto 10px' }} />
                <p style={{ fontSize:14, fontWeight:700, color:'#64748b', margin:0 }}>No medicine requests yet</p>
              </div>
            ) : emergencyRequests.filter(r=>r.hospitalId===hospId||r.requesterId===currentUser.id).map(r=>(
              <div key={r.id} style={{ background:'#fff', borderRadius:12, padding:'16px 20px', border:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <p style={{ fontSize:14, fontWeight:700, color:'#0f172a', margin:'0 0 4px' }}>{r.medicineName}</p>
                  <p style={{ fontSize:12, color:'#64748b', margin:0 }}>{r.id} · {r.requestedQuantity || r.quantity} units · {r.urgency}</p>
                </div>
                <span style={{ fontSize:10, fontWeight:800, padding:'3px 10px', borderRadius:99, background:r.status==='FULFILLED'?'#f0fdf4':r.status==='PENDING'?'#fffbeb':'#f5f3ff', color:r.status==='FULFILLED'?'#166534':r.status==='PENDING'?'#d97706':'#6d28d9', border:'1px solid #e2e8f0' }}>{r.status}</span>
              </div>
            ))}
          </div>
        )}

        {/* TRANSFERS */}
        {activeTab === 'TRANSFERS' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {myTransfers.length===0 ? (
              <div style={{ textAlign:'center', padding:'48px 24px', background:'#fff', borderRadius:14, border:'1px solid #e2e8f0' }}>
                <ArrowLeftRight style={{ width:40, height:40, color:'#cbd5e1', margin:'0 auto 10px' }} />
                <p style={{ fontSize:14, fontWeight:700, color:'#64748b', margin:0 }}>No stock transfers yet</p>
              </div>
            ) : myTransfers.map(t=>(
              <div key={t.id} style={{ background:'#fff', borderRadius:12, padding:'14px 18px', border:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <p style={{ fontSize:13.5, fontWeight:700, color:'#0f172a', margin:'0 0 4px' }}>{t.medicineName}</p>
                  <p style={{ fontSize:12, color:'#64748b', margin:0 }}>
                    {t.fromSourceName} → {t.toSourceName} · {t.quantity} units
                  </p>
                </div>
                <span style={{ fontSize:10, fontWeight:800, padding:'3px 10px', borderRadius:99, background:'#f0fdfa', color:'#0f766e', border:'1px solid #99f6e4' }}>{t.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Patient Add/Edit Modal */}
      {showPatientModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:20, padding:28, width:'100%', maxWidth:560, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 80px rgba(0,0,0,0.2)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ fontSize:18, fontWeight:800, color:'#0f172a', margin:0 }}>{editingPatient ? 'Edit Patient Record' : 'Add New Patient'}</h3>
              <button onClick={() => setShowPatientModal(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#64748b' }}><X style={{ width:20, height:20 }} /></button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:13 }}>
              {[
                { label:'Full Name *', el: <input value={patientForm.name} onChange={e=>setPatientForm(p=>({...p,name:e.target.value}))} placeholder="Patient full name" style={inputStyle} /> },
                { label:'Age', el: <input type="number" min={0} max={130} value={patientForm.age||''} onChange={e=>setPatientForm(p=>({...p,age:Number(e.target.value)||undefined}))} placeholder="Age in years" style={inputStyle} /> },
                { label:'Gender', el: <select value={patientForm.gender} onChange={e=>setPatientForm(p=>({...p,gender:e.target.value as any}))} style={inputStyle}>{['Male','Female','Other','Unknown'].map(g=><option key={g}>{g}</option>)}</select> },
                { label:'Contact', el: <input value={patientForm.contact} onChange={e=>setPatientForm(p=>({...p,contact:e.target.value}))} placeholder="+91 …" style={inputStyle} /> },
                { label:'Admission Date', el: <input type="date" value={patientForm.admissionDate} onChange={e=>setPatientForm(p=>({...p,admissionDate:e.target.value}))} style={inputStyle} /> },
                { label:'Ward', el: <input value={patientForm.ward} onChange={e=>setPatientForm(p=>({...p,ward:e.target.value}))} placeholder="e.g. General, ICU, Pediatrics" style={inputStyle} /> },
                { label:'Bed Number', el: <input value={patientForm.bed} onChange={e=>setPatientForm(p=>({...p,bed:e.target.value}))} placeholder="Bed / Room number" style={inputStyle} /> },
                { label:'Department', el: <input value={patientForm.department} onChange={e=>setPatientForm(p=>({...p,department:e.target.value}))} placeholder="e.g. General Medicine" style={inputStyle} /> },
                { label:'Admission Status', el: <select value={patientForm.status} onChange={e=>setPatientForm(p=>({...p,status:e.target.value as any}))} style={inputStyle}>{['ADMITTED','DISCHARGED','TRANSFERRED','ICU'].map(s=><option key={s}>{s}</option>)}</select> },
                { label:'Emergency Status', el: <select value={patientForm.emergencyStatus} onChange={e=>setPatientForm(p=>({...p,emergencyStatus:e.target.value as any}))} style={inputStyle}>{['STABLE','URGENT','CRITICAL','DISCHARGED'].map(s=><option key={s}>{s}</option>)}</select> },
              ].map(({ label, el }) => (
                <div key={label}>
                  <label style={{ fontSize:11.5, fontWeight:700, color:'#374151', display:'block', marginBottom:5 }}>{label}</label>
                  {el}
                </div>
              ))}
              <div style={{ gridColumn:'1 / -1' }}>
                <label style={{ fontSize:11.5, fontWeight:700, color:'#374151', display:'block', marginBottom:5 }}>Notes</label>
                <textarea value={patientForm.notes} onChange={e=>setPatientForm(p=>({...p,notes:e.target.value}))} rows={3} placeholder="Additional notes, allergies, treatment notes…" style={{ ...inputStyle, resize:'none' as const }} />
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button onClick={() => setShowPatientModal(false)} style={{ flex:1, padding:'11px', background:'#f1f5f9', color:'#64748b', border:'1px solid #e2e8f0', borderRadius:10, fontWeight:600, cursor:'pointer', fontSize:13 }}>Cancel</button>
              <button onClick={savePatient} disabled={!patientForm.name.trim()} style={{ flex:2, padding:'11px', background:patientForm.name.trim()?'linear-gradient(135deg,#6d28d9,#8b5cf6)':'#e2e8f0', color:patientForm.name.trim()?'#fff':'#94a3b8', border:'none', borderRadius:10, fontWeight:700, cursor:patientForm.name.trim()?'pointer':'not-allowed', fontSize:13, boxShadow:patientForm.name.trim()?'0 4px 12px rgba(109,40,217,0.25)':'none' }}>
                {editingPatient ? 'Save Changes' : 'Add Patient'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConsoleLayout>
  );
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0',
  borderRadius: 9, fontSize: 13, outline: 'none',
  background: '#fafbfc', fontFamily: 'Inter, system-ui, sans-serif',
  boxSizing: 'border-box',
};
