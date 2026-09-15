import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import {
  Package, Plus, TrendingUp, AlertTriangle, Clock, CheckCircle2,
  ArrowRight, Edit2, Search, X, Check, XCircle, RefreshCw,
  Send, Activity, ChevronDown, Trash2, Upload, FileText,
} from 'lucide-react';
import { InventoryItem, PharmacyEmergencyRequest } from '../../types';

const StatCard: React.FC<{ label: string; value: string|number; icon: React.ElementType; color: string; bg: string; border: string }> =
  ({ label, value, icon: Icon, color, bg, border }) => (
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

export const PharmacyDashboardPage: React.FC = () => {
  const {
    currentUser, inventory, medicines, sources, reservations,
    pharmacyRequests, stockChangeLogs,
    addInventoryItem, updateInventoryQuantity, deleteInventoryItem,
    acceptPharmacyEmergencyRequest, declinePharmacyEmergencyRequest,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'OVERVIEW'|'INVENTORY'|'REQUESTS'|'RESERVATIONS'>('OVERVIEW');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem|null>(null);
  const [editQty, setEditQty] = useState(0);
  const [editReason, setEditReason] = useState('Stock received');
  const [contributeReq, setContributeReq] = useState<PharmacyEmergencyRequest|null>(null);
  const [contributeQty, setContributeQty] = useState(1);
  const [declineReq, setDeclineReq] = useState<PharmacyEmergencyRequest|null>(null);
  const [declineReason, setDeclineReason] = useState('Insufficient stock');
  const [newMedId, setNewMedId] = useState(medicines[0]?.id || '');
  const [newBatch, setNewBatch] = useState('BT-NEW-001');
  const [newQty, setNewQty] = useState(50);
  const [newExpiry, setNewExpiry] = useState('2027-12-31');
  const [newPrice, setNewPrice] = useState(25);

  const pharmId = currentUser.sourceId || 'SRC-PHARM-001';
  const pharmSource = sources.find(s => s.id === pharmId);
  const myInventory = inventory.filter(i => i.sourceId === pharmId);
  const myReservations = reservations.filter(r =>
    r.allocationBreakdown?.some(a => a.sourceId === pharmId)
  );
  const pendingRequests = pharmacyRequests.filter(r => r.pharmacyId === pharmId && r.status === 'PENDING');
  const lowStock = myInventory.filter(i => i.stockStatus === 'LOW' || i.stockStatus === 'CRITICAL');
  const outOfStock = myInventory.filter(i => i.stockStatus === 'OUT_OF_STOCK');
  const activeReservations = myReservations.filter(r => r.status === 'CONFIRMED' || r.status === 'PENDING');

  const filteredInventory = useMemo(() =>
    myInventory.filter(i => i.medicineName.toLowerCase().includes(searchQuery.toLowerCase())),
    [myInventory, searchQuery]
  );

  const handleAddStock = () => {
    const med = medicines.find(m => m.id === newMedId);
    if (!med) return;
    addInventoryItem({
      medicineId: newMedId, medicineName: med.name, sourceId: pharmId,
      sourceName: pharmSource?.name || 'Pharmacy', sourceType: 'PHARMACY',
      quantity: newQty, batchNumber: newBatch, expiryDate: newExpiry, unitPrice: newPrice,
    });
    setIsAddOpen(false);
  };

  const TABS = [
    { id: 'OVERVIEW', label: 'Overview' },
    { id: 'INVENTORY', label: 'Inventory' },
    { id: 'REQUESTS', label: `Requests ${pendingRequests.length > 0 ? `(${pendingRequests.length})` : ''}` },
    { id: 'RESERVATIONS', label: 'Reservations' },
  ];

  return (
    <ConsoleLayout>
      <div style={{ padding:'24px 28px', maxWidth:1200, margin:'0 auto', fontFamily:'Inter, system-ui, sans-serif' }}>

        {/* Header */}
        <div style={{ marginBottom:24, display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ fontSize:24, fontWeight:800, color:'#0f172a', margin:'0 0 4px' }}>Pharmacy Console</h1>
            <p style={{ fontSize:13, color:'#64748b', margin:0 }}>
              {pharmSource?.name || currentUser.name} · {pharmSource?.area}, {pharmSource?.city}
            </p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <Link to="/pharmacy/bulk-upload" style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', background:'#f1f5f9', color:'#475569', borderRadius:10, textDecoration:'none', fontSize:13, fontWeight:600, border:'1px solid #e2e8f0' }}>
              <Upload style={{ width:14, height:14 }} /> Bulk Upload
            </Link>
            <button onClick={() => setIsAddOpen(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', background:'linear-gradient(135deg,#1d4ed8,#0d9488)', color:'#fff', borderRadius:10, border:'none', fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 12px rgba(29,78,216,0.25)' }}>
              <Plus style={{ width:14, height:14 }} /> Add Medicine
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))', gap:12, marginBottom:24 }}>
          <StatCard label="Total Medicines" value={myInventory.length} icon={Package} color="#1d4ed8" bg="#eff6ff" border="#bfdbfe" />
          <StatCard label="Total Stock" value={myInventory.reduce((a,i)=>a+i.quantity,0)} icon={TrendingUp} color="#059669" bg="#f0fdf4" border="#bbf7d0" />
          <StatCard label="Low Stock Items" value={lowStock.length} icon={AlertTriangle} color="#d97706" bg="#fffbeb" border="#fde68a" />
          <StatCard label="Out of Stock" value={outOfStock.length} icon={XCircle} color="#dc2626" bg="#fef2f2" border="#fecaca" />
          <StatCard label="Pending Requests" value={pendingRequests.length} icon={Send} color="#7c3aed" bg="#f5f3ff" border="#ddd6fe" />
          <StatCard label="Active Reservations" value={activeReservations.length} icon={CheckCircle2} color="#0f766e" bg="#f0fdfa" border="#99f6e4" />
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:4, borderBottom:'2px solid #f1f5f9', marginBottom:20 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)} style={{
              padding:'9px 18px', borderRadius:'8px 8px 0 0', border:'none', cursor:'pointer',
              background: activeTab === t.id ? '#fff' : 'transparent',
              color: activeTab === t.id ? '#1d4ed8' : '#64748b',
              fontWeight: activeTab === t.id ? 700 : 500, fontSize:13,
              borderBottom: activeTab === t.id ? '2px solid #1d4ed8' : '2px solid transparent',
              transition:'all 0.15s',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'OVERVIEW' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {/* Alerts */}
            <div style={{ background:'#fff', borderRadius:14, padding:'20px 22px', border:'1px solid #fde68a' }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:'#0f172a', margin:'0 0 14px', display:'flex', alignItems:'center', gap:6 }}>
                <AlertTriangle style={{ width:15, height:15, color:'#d97706' }} /> Stock Alerts
              </h3>
              {lowStock.length === 0 && outOfStock.length === 0 ? (
                <p style={{ fontSize:13, color:'#64748b' }}>✅ All stock levels are healthy.</p>
              ) : (
                [...outOfStock, ...lowStock].slice(0, 5).map(i => (
                  <div key={i.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #f8fafc' }}>
                    <p style={{ fontSize:13, fontWeight:600, color:'#0f172a', margin:0 }}>{i.medicineName}</p>
                    <span style={{
                      fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:99,
                      background: i.stockStatus==='OUT_OF_STOCK' ? '#fef2f2' : '#fffbeb',
                      color: i.stockStatus==='OUT_OF_STOCK' ? '#dc2626' : '#d97706',
                      border: `1px solid ${i.stockStatus==='OUT_OF_STOCK' ? '#fecaca' : '#fde68a'}`,
                    }}>{i.quantity} units</span>
                  </div>
                ))
              )}
            </div>

            {/* Pending Requests */}
            <div style={{ background:'#fff', borderRadius:14, padding:'20px 22px', border:'1px solid #ddd6fe' }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:'#0f172a', margin:'0 0 14px', display:'flex', alignItems:'center', gap:6 }}>
                <Send style={{ width:15, height:15, color:'#7c3aed' }} /> Pending Hospital Requests
              </h3>
              {pendingRequests.length === 0 ? (
                <p style={{ fontSize:13, color:'#64748b' }}>No pending requests from hospitals.</p>
              ) : (
                pendingRequests.slice(0, 4).map(r => (
                  <div key={r.id} style={{ padding:'10px 0', borderBottom:'1px solid #f8fafc' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div>
                        <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', margin:0 }}>{r.medicineName}</p>
                        <p style={{ fontSize:11.5, color:'#64748b', margin:'2px 0 0' }}>
                          {r.requesterName} · {r.requiredQuantity} units · {r.urgency}
                        </p>
                      </div>
                      <div style={{ display:'flex', gap:5 }}>
                        <button onClick={() => { setContributeReq(r); setContributeQty(Math.min(r.requiredQuantity, r.pharmacyAvailableStock)); }} style={{ padding:'5px 10px', background:'#1d4ed8', color:'#fff', border:'none', borderRadius:7, fontSize:11, fontWeight:700, cursor:'pointer' }}>Accept</button>
                        <button onClick={() => setDeclineReq(r)} style={{ padding:'5px 10px', background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', borderRadius:7, fontSize:11, fontWeight:700, cursor:'pointer' }}>Decline</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {pendingRequests.length > 0 && (
                <button onClick={() => setActiveTab('REQUESTS')} style={{ marginTop:10, fontSize:12, color:'#7c3aed', fontWeight:700, background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', alignItems:'center', gap:4 }}>
                  View all requests <ArrowRight style={{ width:12, height:12 }} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'INVENTORY' && (
          <div>
            <div style={{ display:'flex', gap:10, marginBottom:14, alignItems:'center' }}>
              <div style={{ position:'relative', flex:1 }}>
                <Search style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', width:14, height:14, color:'#94a3b8' }} />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search medicines…"
                  style={{ width:'100%', padding:'9px 12px 9px 34px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:13, outline:'none', boxSizing:'border-box' as const }}
                />
              </div>
            </div>
            {filteredInventory.length === 0 ? (
              <div style={{ textAlign:'center', padding:'48px 24px', background:'#fff', borderRadius:14, border:'1px solid #e2e8f0' }}>
                <Package style={{ width:40, height:40, color:'#cbd5e1', margin:'0 auto 10px' }} />
                <p style={{ fontSize:14, fontWeight:700, color:'#64748b', margin:'0 0 4px' }}>No inventory items found</p>
                <p style={{ fontSize:12.5, color:'#94a3b8', margin:0 }}>Add medicines using the button above or bulk upload.</p>
              </div>
            ) : (
              <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e2e8f0', overflow:'hidden' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' as const, fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
                      {['Medicine','Batch','Qty','Expiry','Status','Actions'].map(h => (
                        <th key={h} style={{ padding:'11px 14px', textAlign:'left' as const, fontWeight:700, color:'#475569', fontSize:11.5, textTransform:'uppercase' as const, letterSpacing:'0.04em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map((item, idx) => (
                      <tr key={item.id} style={{ borderBottom:'1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}>
                        <td style={{ padding:'11px 14px', fontWeight:600, color:'#0f172a' }}>{item.medicineName}</td>
                        <td style={{ padding:'11px 14px', color:'#64748b', fontFamily:'monospace', fontSize:12 }}>{item.batchNumber}</td>
                        <td style={{ padding:'11px 14px', fontWeight:700, color: item.quantity === 0 ? '#dc2626' : item.quantity <= 15 ? '#d97706' : '#059669' }}>{item.quantity}</td>
                        <td style={{ padding:'11px 14px', color:'#64748b', fontSize:12 }}>{item.expiryDate}</td>
                        <td style={{ padding:'11px 14px' }}>
                          <span style={{
                            fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:99,
                            background: item.stockStatus==='GOOD'?'#f0fdf4':item.stockStatus==='LOW'?'#fffbeb':item.stockStatus==='CRITICAL'?'#fef2f2':'#f1f5f9',
                            color: item.stockStatus==='GOOD'?'#166534':item.stockStatus==='LOW'?'#92400e':item.stockStatus==='CRITICAL'?'#dc2626':'#64748b',
                          }}>{item.stockStatus}</span>
                        </td>
                        <td style={{ padding:'11px 14px' }}>
                          <div style={{ display:'flex', gap:5 }}>
                            <button onClick={() => { setEditingItem(item); setEditQty(item.quantity); setEditReason('Stock update'); }} style={{ padding:'5px 10px', background:'#eff6ff', color:'#1d4ed8', border:'1px solid #bfdbfe', borderRadius:7, fontSize:11, fontWeight:700, cursor:'pointer' }}>
                              <Edit2 style={{ width:12, height:12 }} />
                            </button>
                            <button onClick={() => deleteInventoryItem(item.id, 'Removed by pharmacy')} style={{ padding:'5px 10px', background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', borderRadius:7, fontSize:11, cursor:'pointer' }}>
                              <Trash2 style={{ width:12, height:12 }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'REQUESTS' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {pharmacyRequests.filter(r => r.pharmacyId === pharmId).length === 0 ? (
              <div style={{ textAlign:'center', padding:'48px 24px', background:'#fff', borderRadius:14, border:'1px solid #e2e8f0' }}>
                <Send style={{ width:40, height:40, color:'#cbd5e1', margin:'0 auto 10px' }} />
                <p style={{ fontSize:14, fontWeight:700, color:'#64748b', margin:0 }}>No hospital requests yet</p>
              </div>
            ) : pharmacyRequests.filter(r => r.pharmacyId === pharmId).map(r => (
              <div key={r.id} style={{ background:'#fff', borderRadius:14, padding:'18px 20px', border:`1px solid ${r.status==='PENDING'?'#ddd6fe':'#e2e8f0'}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <p style={{ fontSize:14, fontWeight:800, color:'#0f172a', margin:0 }}>{r.medicineName}</p>
                    <span style={{ fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:99, background:r.urgency==='CRITICAL'?'#fef2f2':'#fffbeb', color:r.urgency==='CRITICAL'?'#dc2626':'#d97706' }}>{r.urgency}</span>
                  </div>
                  <p style={{ fontSize:12.5, color:'#64748b', margin:0 }}>
                    From: <strong>{r.requesterName}</strong> · Need: <strong>{r.requiredQuantity}</strong> · You have: <strong>{r.pharmacyAvailableStock}</strong>
                  </p>
                </div>
                {r.status === 'PENDING' ? (
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => { setContributeReq(r); setContributeQty(Math.min(r.requiredQuantity, r.pharmacyAvailableStock)); }} style={{ padding:'8px 16px', background:'linear-gradient(135deg,#1d4ed8,#0d9488)', color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer' }}>Accept</button>
                    <button onClick={() => { setContributeReq(r); setContributeQty(Math.min(r.pharmacyAvailableStock, r.requiredQuantity - 1)); }} style={{ padding:'8px 16px', background:'#f0fdf4', color:'#059669', border:'1px solid #bbf7d0', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer' }}>Partial</button>
                    <button onClick={() => setDeclineReq(r)} style={{ padding:'8px 16px', background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer' }}>Decline</button>
                  </div>
                ) : (
                  <span style={{ fontSize:11, fontWeight:800, padding:'4px 12px', borderRadius:99, background:r.status==='ACCEPTED'?'#f0fdf4':'#f1f5f9', color:r.status==='ACCEPTED'?'#166534':'#64748b' }}>{r.status}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Reservations Tab */}
        {activeTab === 'RESERVATIONS' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {myReservations.length === 0 ? (
              <div style={{ textAlign:'center', padding:'48px 24px', background:'#fff', borderRadius:14, border:'1px solid #e2e8f0' }}>
                <p style={{ fontSize:14, fontWeight:700, color:'#64748b', margin:0 }}>No reservations assigned to this pharmacy.</p>
              </div>
            ) : myReservations.map(res => (
              <div key={res.id} style={{ background:'#fff', borderRadius:12, padding:'14px 18px', border:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <p style={{ fontSize:14, fontWeight:700, color:'#0f172a', margin:0 }}>{res.medicineName}</p>
                  <p style={{ fontSize:12, color:'#64748b', margin:'3px 0 0' }}>{res.id} · {res.userName} · {res.totalQuantity} units</p>
                </div>
                <span style={{ fontSize:10, fontWeight:800, padding:'3px 10px', borderRadius:99, background:res.status==='CONFIRMED'?'#f0fdf4':'#f1f5f9', color:res.status==='CONFIRMED'?'#166534':'#64748b', border:`1px solid ${res.status==='CONFIRMED'?'#bbf7d0':'#e2e8f0'}` }}>{res.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Stock Modal */}
      {isAddOpen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:20, padding:28, width:'100%', maxWidth:480, boxShadow:'0 24px 80px rgba(0,0,0,0.2)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ fontSize:18, fontWeight:800, color:'#0f172a', margin:0 }}>Add Medicine to Inventory</h3>
              <button onClick={() => setIsAddOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#64748b' }}><X style={{ width:20, height:20 }} /></button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              {[
                { label:'Medicine', field: <select value={newMedId} onChange={e=>setNewMedId(e.target.value)} style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:9, fontSize:13, outline:'none', background:'#fafbfc' }}>{medicines.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select> },
                { label:'Batch Number', field: <input value={newBatch} onChange={e=>setNewBatch(e.target.value)} style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:9, fontSize:13, outline:'none', boxSizing:'border-box' as const }} /> },
                { label:'Quantity', field: <input type="number" min={0} value={newQty} onChange={e=>setNewQty(Number(e.target.value))} style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:9, fontSize:13, outline:'none', boxSizing:'border-box' as const }} /> },
                { label:'Expiry Date', field: <input type="date" value={newExpiry} onChange={e=>setNewExpiry(e.target.value)} style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:9, fontSize:13, outline:'none', boxSizing:'border-box' as const }} /> },
                { label:'Unit Price (₹)', field: <input type="number" min={0} value={newPrice} onChange={e=>setNewPrice(Number(e.target.value))} style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:9, fontSize:13, outline:'none', boxSizing:'border-box' as const }} /> },
              ].map(({ label, field }) => (
                <div key={label}>
                  <label style={{ fontSize:11.5, fontWeight:700, color:'#374151', display:'block', marginBottom:5 }}>{label}</label>
                  {field}
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button onClick={() => setIsAddOpen(false)} style={{ flex:1, padding:'11px', background:'#f1f5f9', color:'#64748b', border:'1px solid #e2e8f0', borderRadius:10, fontWeight:600, cursor:'pointer', fontSize:13 }}>Cancel</button>
              <button onClick={handleAddStock} style={{ flex:2, padding:'11px', background:'linear-gradient(135deg,#1d4ed8,#0d9488)', color:'#fff', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:13, boxShadow:'0 4px 12px rgba(29,78,216,0.25)' }}>Add to Inventory</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Qty Modal */}
      {editingItem && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:20, padding:28, width:'100%', maxWidth:400 }}>
            <h3 style={{ fontSize:17, fontWeight:800, margin:'0 0 16px' }}>Update Stock — {editingItem.medicineName}</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:5 }}>New Quantity</label>
                <input type="number" min={0} value={editQty} onChange={e=>setEditQty(Number(e.target.value))} style={{ width:'100%', padding:'10px 13px', border:'1.5px solid #e2e8f0', borderRadius:9, fontSize:14, outline:'none', boxSizing:'border-box' as const }} />
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:5 }}>Reason</label>
                <input value={editReason} onChange={e=>setEditReason(e.target.value)} style={{ width:'100%', padding:'10px 13px', border:'1.5px solid #e2e8f0', borderRadius:9, fontSize:13, outline:'none', boxSizing:'border-box' as const }} />
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button onClick={() => setEditingItem(null)} style={{ flex:1, padding:'10px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:600, color:'#64748b' }}>Cancel</button>
              <button onClick={() => { updateInventoryQuantity(editingItem.id, editQty, editReason); setEditingItem(null); }} style={{ flex:2, padding:'10px', background:'#1d4ed8', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:700 }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Contribute Modal */}
      {contributeReq && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:20, padding:28, width:'100%', maxWidth:400 }}>
            <h3 style={{ fontSize:17, fontWeight:800, margin:'0 0 8px' }}>Accept Request</h3>
            <p style={{ fontSize:13, color:'#64748b', margin:'0 0 16px' }}>
              Hospital needs <strong>{contributeReq.requiredQuantity}</strong> of <strong>{contributeReq.medicineName}</strong>. You have <strong>{contributeReq.pharmacyAvailableStock}</strong>.
            </p>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:5 }}>Quantity to Provide</label>
              <input type="number" min={1} max={contributeReq.pharmacyAvailableStock} value={contributeQty} onChange={e=>setContributeQty(Number(e.target.value))} style={{ width:'100%', padding:'10px 13px', border:'1.5px solid #e2e8f0', borderRadius:9, fontSize:14, outline:'none', boxSizing:'border-box' as const }} />
              <p style={{ fontSize:11.5, color:'#64748b', marginTop:5 }}>
                {contributeQty < contributeReq.requiredQuantity ? `Partial acceptance: ${contributeReq.requiredQuantity - contributeQty} units will be sourced from other pharmacies.` : 'Full acceptance.'}
              </p>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button onClick={() => setContributeReq(null)} style={{ flex:1, padding:'10px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:600, color:'#64748b' }}>Cancel</button>
              <button onClick={() => { acceptPharmacyEmergencyRequest(contributeReq.id, pharmId, contributeQty); setContributeReq(null); }} style={{ flex:2, padding:'10px', background:'linear-gradient(135deg,#1d4ed8,#0d9488)', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:700 }}>Confirm Accept</button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {declineReq && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:20, padding:28, width:'100%', maxWidth:400 }}>
            <h3 style={{ fontSize:17, fontWeight:800, margin:'0 0 8px', color:'#dc2626' }}>Decline Request</h3>
            <p style={{ fontSize:13, color:'#64748b', margin:'0 0 16px' }}>Declining request for <strong>{declineReq.medicineName}</strong> from <strong>{declineReq.requesterName}</strong>.</p>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:5 }}>Reason for Declining</label>
              <textarea value={declineReason} onChange={e=>setDeclineReason(e.target.value)} rows={3} style={{ width:'100%', padding:'10px 13px', border:'1.5px solid #e2e8f0', borderRadius:9, fontSize:13, outline:'none', resize:'none', boxSizing:'border-box' as const }} />
            </div>
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button onClick={() => setDeclineReq(null)} style={{ flex:1, padding:'10px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:600, color:'#64748b' }}>Cancel</button>
              <button onClick={() => { declinePharmacyEmergencyRequest(declineReq.id, pharmId, declineReason); setDeclineReq(null); }} style={{ flex:2, padding:'10px', background:'#dc2626', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:700 }}>Confirm Decline</button>
            </div>
          </div>
        </div>
      )}
    </ConsoleLayout>
  );
};
