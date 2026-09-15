import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import { api } from '../../services/api';
import { BulkUploadPreviewResult } from '../../types';
import {
  Upload, FileText, CheckCircle2, XCircle, AlertTriangle, Download,
  RefreshCw, ChevronDown, Package, Loader2, ArrowRight,
} from 'lucide-react';

const CSV_TEMPLATE = `medicineName,medicineType,strength,batchNumber,quantity,unit,expiryDate,unitPrice
Paracetamol 500mg,Tablet,500mg,BT-2026-001,200,Strips,2027-12-31,8.50
Amoxicillin 250mg,Capsule,250mg,BT-2026-002,100,Strips,2027-06-30,45.00
Ibuprofen 400mg,Tablet,400mg,BT-2026-003,150,Strips,2026-10-31,12.00`;

export const BulkUploadPage: React.FC = () => {
  const { currentUser } = useApp();
  const [step, setStep] = useState<'UPLOAD'|'PREVIEW'|'COMMIT'|'SUCCESS'>('UPLOAD');
  const [csvText, setCsvText] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [previewResult, setPreviewResult] = useState<BulkUploadPreviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [committedCount, setCommittedCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const parseCsv = (text: string) => {
    const lines = text.trim().split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g,''));
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
      return obj;
    });
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      setCsvText(text);
      setRows(parseCsv(text));
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) handleFileUpload(file);
    else setError('Please upload a .csv file');
  };

  const handlePreview = async () => {
    const parsedRows = csvText ? parseCsv(csvText) : rows;
    if (!parsedRows.length) { setError('No data to preview. Paste CSV or upload a file.'); return; }
    setLoading(true); setError('');
    try {
      const result = await api.inventory.bulkPreview(parsedRows);
      setPreviewResult(result);
      setRows(parsedRows);
      setStep('PREVIEW');
    } catch (e: any) {
      setError(e.message || 'Preview failed. Please check your data format.');
    } finally { setLoading(false); }
  };

  const handleCommit = async () => {
    if (!previewResult || !previewResult.valid.length) return;
    setLoading(true); setError('');
    try {
      const validRows = previewResult.valid.map(r => r.data);
      const result = await api.inventory.bulkCommit(validRows);
      setCommittedCount(result.committed);
      setStep('SUCCESS');
    } catch (e: any) {
      setError(e.message || 'Commit failed. Please try again.');
    } finally { setLoading(false); }
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'medshare_bulk_upload_template.csv';
    a.click(); URL.revokeObjectURL(url);
  };

  const role = currentUser.role;
  const roleColor = role === 'PHARMACY' ? '#0f766e' : '#6d28d9';
  const roleLight = role === 'PHARMACY' ? '#f0fdfa' : '#f5f3ff';
  const roleBorder = role === 'PHARMACY' ? '#99f6e4' : '#ddd6fe';

  const backRoute = `/${role.toLowerCase()}/inventory`;

  return (
    <ConsoleLayout>
      <div style={{ padding:'28px 32px', maxWidth:900, margin:'0 auto', fontFamily:'Inter, system-ui, sans-serif' }}>

        {/* Back Link */}
        <div style={{ marginBottom: 16 }}>
          <a
            href={backRoute}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 600, color: '#475569',
              textDecoration: 'none', background: '#fff', padding: '6px 12px',
              borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            ← Back to Inventory
          </a>
        </div>

        {/* Header */}
        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontSize:24, fontWeight:800, color:'#0f172a', margin:'0 0 6px' }}>
            Bulk Inventory Upload
          </h1>
          <p style={{ fontSize:13, color:'#64748b', margin:0 }}>
            Upload a CSV file to import multiple medicines at once. All rows are validated before committing to your inventory.
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:28 }}>
          {[
            { id:'UPLOAD', label:'Upload CSV' },
            { id:'PREVIEW', label:'Validate' },
            { id:'COMMIT', label:'Commit' },
            { id:'SUCCESS', label:'Done' },
          ].map((s, idx, arr) => {
            const steps = ['UPLOAD','PREVIEW','COMMIT','SUCCESS'];
            const stepIdx = steps.indexOf(step);
            const thisIdx = steps.indexOf(s.id);
            const done = stepIdx > thisIdx;
            const active = stepIdx === thisIdx;
            return (
              <React.Fragment key={s.id}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, background:done?roleColor:active?roleColor:'#e2e8f0', color:done||active?'#fff':'#94a3b8', border:`2px solid ${done||active?roleColor:'#e2e8f0'}` }}>
                    {done ? <CheckCircle2 style={{ width:13, height:13 }} /> : thisIdx+1}
                  </div>
                  <span style={{ fontSize:12, fontWeight:active?700:500, color:active?'#0f172a':'#94a3b8' }}>{s.label}</span>
                </div>
                {idx < arr.length - 1 && <div style={{ flex:1, height:2, background:done?roleColor:'#e2e8f0', borderRadius:2 }} />}
              </React.Fragment>
            );
          })}
        </div>

        {/* STEP: UPLOAD */}
        {step === 'UPLOAD' && (
          <div>
            <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
              <button onClick={downloadTemplate} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:600, color:'#475569' }}>
                <Download style={{ width:14, height:14 }} /> Download Template
              </button>
            </div>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              style={{
                border:`2px dashed ${error?'#fecaca':'#e2e8f0'}`, borderRadius:16, padding:'40px 24px',
                textAlign:'center', cursor:'pointer', background:error?'#fef2f2':'#f8fafc',
                marginBottom:20, transition:'all 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = roleColor}
              onMouseLeave={e => e.currentTarget.style.borderColor = error?'#fecaca':'#e2e8f0'}
            >
              <Upload style={{ width:40, height:40, color:roleColor, margin:'0 auto 12px' }} />
              <p style={{ fontSize:15, fontWeight:700, color:'#0f172a', margin:'0 0 4px' }}>
                Drop your CSV file here or click to browse
              </p>
              <p style={{ fontSize:12.5, color:'#64748b', margin:0 }}>Accepts .csv files only</p>
              <input ref={fileRef} type="file" accept=".csv" style={{ display:'none' }} onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
            </div>

            {/* Or paste CSV */}
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:12.5, fontWeight:700, color:'#374151', display:'block', marginBottom:8 }}>
                Or paste CSV content directly:
              </label>
              <textarea
                value={csvText}
                onChange={e => { setCsvText(e.target.value); setRows(parseCsv(e.target.value)); }}
                rows={8}
                placeholder={`Paste your CSV here:\n${CSV_TEMPLATE}`}
                style={{ width:'100%', padding:'12px 14px', border:'1.5px solid #e2e8f0', borderRadius:12, fontSize:12, fontFamily:'monospace', outline:'none', resize:'vertical', background:'#fafbfc', boxSizing:'border-box' as const }}
              />
              {rows.length > 0 && (
                <p style={{ fontSize:12, color:'#059669', fontWeight:600, margin:'6px 0 0' }}>
                  ✓ {rows.length} row{rows.length>1?'s':''} detected
                </p>
              )}
            </div>

            {error && <p style={{ color:'#dc2626', fontSize:13, margin:'0 0 14px', fontWeight:600 }}>{error}</p>}

            <button
              onClick={handlePreview}
              disabled={!csvText.trim() || loading}
              style={{
                display:'flex', alignItems:'center', gap:8, padding:'12px 24px',
                background:csvText.trim()?`linear-gradient(135deg,${roleColor},#1d4ed8)`:'#e2e8f0',
                color:csvText.trim()?'#fff':'#94a3b8',
                border:'none', borderRadius:12, fontSize:14, fontWeight:700,
                cursor:csvText.trim()?'pointer':'not-allowed',
                boxShadow:csvText.trim()?`0 4px 14px ${roleColor}40`:'none',
              }}
            >
              {loading ? <Loader2 style={{ width:16, height:16, animation:'spin 1s linear infinite' }} /> : <ArrowRight style={{ width:16, height:16 }} />}
              {loading ? 'Validating…' : 'Validate & Preview'}
            </button>
          </div>
        )}

        {/* STEP: PREVIEW */}
        {step === 'PREVIEW' && previewResult && (
          <div>
            {/* Summary */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
              {[
                { label:'Total Rows', value:previewResult.totalRows, color:'#1d4ed8', bg:'#eff6ff', border:'#bfdbfe' },
                { label:'Valid', value:previewResult.validRows, color:'#059669', bg:'#f0fdf4', border:'#bbf7d0' },
                { label:'Invalid', value:previewResult.invalidRows, color:previewResult.invalidRows>0?'#dc2626':'#059669', bg:previewResult.invalidRows>0?'#fef2f2':'#f0fdf4', border:previewResult.invalidRows>0?'#fecaca':'#bbf7d0' },
              ].map(s => (
                <div key={s.label} style={{ background:s.bg, borderRadius:12, padding:'16px 18px', border:`1px solid ${s.border}`, textAlign:'center' }}>
                  <p style={{ fontSize:28, fontWeight:900, color:s.color, margin:'0 0 4px' }}>{s.value}</p>
                  <p style={{ fontSize:12, color:'#64748b', margin:0 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Invalid rows */}
            {previewResult.invalid.length > 0 && (
              <div style={{ background:'#fef2f2', borderRadius:12, padding:'16px 18px', border:'1px solid #fecaca', marginBottom:16 }}>
                <h4 style={{ fontSize:13, fontWeight:700, color:'#dc2626', margin:'0 0 10px', display:'flex', alignItems:'center', gap:6 }}>
                  <XCircle style={{ width:14, height:14 }} /> {previewResult.invalid.length} Invalid Row{previewResult.invalid.length>1?'s':''}
                </h4>
                {previewResult.invalid.map(r => (
                  <div key={r.row} style={{ marginBottom:8, padding:'8px 10px', background:'#fff', borderRadius:8, border:'1px solid #fecaca' }}>
                    <span style={{ fontWeight:700, fontSize:12, color:'#dc2626' }}>Row {r.row}: {r.data.medicineName||'(no name)'}</span>
                    <ul style={{ margin:'4px 0 0 16px', padding:0, fontSize:11.5, color:'#991b1b' }}>
                      {r.errors.map(e => <li key={e}>{e}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Valid rows preview */}
            {previewResult.valid.length > 0 && (
              <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e2e8f0', overflow:'hidden', marginBottom:20 }}>
                <div style={{ padding:'12px 16px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', gap:6 }}>
                  <CheckCircle2 style={{ width:14, height:14, color:'#059669' }} />
                  <span style={{ fontSize:13, fontWeight:700, color:'#059669' }}>{previewResult.valid.length} rows ready to import</span>
                </div>
                <div style={{ maxHeight:300, overflowY:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' as const, fontSize:12 }}>
                    <thead>
                      <tr style={{ background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
                        {['#','Medicine','Batch','Qty','Expiry','Price'].map(h=>(
                          <th key={h} style={{ padding:'9px 12px', textAlign:'left' as const, fontWeight:700, color:'#64748b', fontSize:11 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewResult.valid.map(r => (
                        <tr key={r.row} style={{ borderBottom:'1px solid #f8fafc' }}>
                          <td style={{ padding:'8px 12px', color:'#94a3b8' }}>{r.row}</td>
                          <td style={{ padding:'8px 12px', fontWeight:600, color:'#0f172a' }}>{r.data.medicineName}</td>
                          <td style={{ padding:'8px 12px', color:'#64748b', fontFamily:'monospace' }}>{r.data.batchNumber}</td>
                          <td style={{ padding:'8px 12px', fontWeight:700, color:'#059669' }}>{r.data.quantity}</td>
                          <td style={{ padding:'8px 12px', color:'#64748b' }}>{r.data.expiryDate}</td>
                          <td style={{ padding:'8px 12px', color:'#475569' }}>₹{r.data.unitPrice||'—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => { setStep('UPLOAD'); setPreviewResult(null); setError(''); }} style={{ padding:'11px 20px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:600, color:'#64748b' }}>
                ← Back
              </button>
              <button
                onClick={handleCommit}
                disabled={!previewResult.valid.length || loading}
                style={{ flex:1, padding:'11px 24px', background:previewResult.valid.length?`linear-gradient(135deg,${roleColor},#1d4ed8)`:'#e2e8f0', color:previewResult.valid.length?'#fff':'#94a3b8', border:'none', borderRadius:10, cursor:previewResult.valid.length?'pointer':'not-allowed', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {loading ? <Loader2 style={{ width:15, height:15, animation:'spin 1s linear infinite' }} /> : <CheckCircle2 style={{ width:15, height:15 }} />}
                {loading ? 'Importing…' : `Import ${previewResult.valid.length} Valid Rows`}
              </button>
            </div>
          </div>
        )}

        {/* STEP: SUCCESS */}
        {step === 'SUCCESS' && (
          <div style={{ textAlign:'center', padding:'60px 24px', background:'#fff', borderRadius:20, border:'1px solid #bbf7d0' }}>
            <div style={{ width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg,#f0fdf4,#dcfce7)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', border:'2px solid #bbf7d0' }}>
              <CheckCircle2 style={{ width:40, height:40, color:'#059669' }} />
            </div>
            <h2 style={{ fontSize:24, fontWeight:800, color:'#0f172a', margin:'0 0 8px' }}>Import Successful!</h2>
            <p style={{ fontSize:15, color:'#059669', fontWeight:700, margin:'0 0 4px' }}>
              {committedCount} medicine{committedCount>1?'s':''} added to your inventory.
            </p>
            <p style={{ fontSize:13, color:'#64748b', margin:'0 0 28px' }}>All valid rows have been committed to your inventory database.</p>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button onClick={() => { setStep('UPLOAD'); setCsvText(''); setRows([]); setPreviewResult(null); }} style={{ padding:'11px 20px', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:600, color:'#475569' }}>
                Upload Another File
              </button>
              <a href={`/${currentUser.role.toLowerCase()}/inventory`} style={{ padding:'11px 24px', background:`linear-gradient(135deg,${roleColor},#1d4ed8)`, color:'#fff', borderRadius:10, textDecoration:'none', fontSize:13, fontWeight:700 }}>
                View Inventory
              </a>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </ConsoleLayout>
  );
};
