import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import {
  FileText, ArrowLeft, Search, Filter, Calendar, TrendingUp, TrendingDown, Clock, Package,
} from 'lucide-react';

export const HospitalStockHistoryPage: React.FC = () => {
  const { currentUser, stockChangeLogs, sources } = useApp();
  const hospId = currentUser.sourceId || 'SRC-HOSP-001';
  const hospSource = sources.find((s) => s.id === hospId);

  // Filter ONLY logs for this hospital
  const hospitalLogs = useMemo(() => {
    return stockChangeLogs.filter((log) => log.sourceId === hospId);
  }, [stockChangeLogs, hospId]);

  const [search, setSearch] = useState('');
  const [filterReason, setFilterReason] = useState('ALL');

  const filteredLogs = useMemo(() => {
    return hospitalLogs.filter((log) => {
      const matchesSearch =
        log.medicineName.toLowerCase().includes(search.toLowerCase()) ||
        log.updatedBy.toLowerCase().includes(search.toLowerCase());
      const matchesReason = filterReason === 'ALL' || log.reason === filterReason;
      return matchesSearch && matchesReason;
    });
  }, [hospitalLogs, search, filterReason]);

  const reasons = useMemo(() => {
    const set = new Set<string>();
    hospitalLogs.forEach((l) => set.add(l.reason));
    return ['ALL', ...Array.from(set)];
  }, [hospitalLogs]);

  return (
    <ConsoleLayout>
      <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
        
        {/* Back Link */}
        <div style={{ marginBottom: 16 }}>
          <Link
            to="/hospital/inventory"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 600, color: '#475569',
              textDecoration: 'none', background: '#fff', padding: '6px 12px',
              borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <ArrowLeft style={{ width: 14, height: 14 }} />
            Back to Inventory
          </Link>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Hospital Stock Audit &amp; Movement History
              </h1>
              <span style={{
                fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe',
              }}>
                {hospitalLogs.length} Logged Adjustments
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
              {hospSource?.name || currentUser.name} · Complete tamper-evident audit trail of inventory adjustments, ward restocks, and consumption
            </p>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          background: '#fff', borderRadius: 14, padding: '16px 20px',
          border: '1px solid #e2e8f0', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 14,
        }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260, maxWidth: 380 }}>
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by medicine name or operator..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px 9px 36px', fontSize: 13,
                border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none',
                background: '#f8fafc',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter style={{ width: 14, height: 14, color: '#64748b' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Reason:</span>
            <select
              value={filterReason}
              onChange={(e) => setFilterReason(e.target.value)}
              style={{
                padding: '7px 10px', fontSize: 12.5, borderRadius: 8,
                border: '1.5px solid #e2e8f0', background: '#fff', outline: 'none',
              }}
            >
              {reasons.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
          {filteredLogs.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <FileText style={{ width: 36, height: 36, color: '#cbd5e1', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>No Stock Adjustments Recorded</p>
              <p style={{ fontSize: 13, color: '#64748b', margin: '6px 0 0' }}>
                Stock adjustments will automatically appear here whenever quantities are updated or received.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#fafbfc', borderBottom: '1.5px solid #f1f5f9', textAlign: 'left' }}>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Date &amp; Time</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Medicine Name</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Previous Qty</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>New Qty</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Variance</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Reason</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Updated By</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => {
                    const isIncrease = log.difference > 0;
                    const isNeutral = log.difference === 0;

                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '14px 18px', color: '#64748b' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Clock style={{ width: 13, height: 13, color: '#94a3b8' }} />
                            <span>{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Package style={{ width: 15, height: 15, color: '#6d28d9' }} />
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>{log.medicineName}</span>
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px', color: '#64748b', fontWeight: 600 }}>
                          {log.previousQuantity}
                        </td>

                        <td style={{ padding: '14px 18px', fontWeight: 800, color: '#0f172a' }}>
                          {log.newQuantity}
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            fontSize: 12, fontWeight: 800, padding: '2px 8px', borderRadius: 99,
                            background: isNeutral ? '#f1f5f9' : isIncrease ? '#ecfdf5' : '#fef2f2',
                            color: isNeutral ? '#64748b' : isIncrease ? '#059669' : '#dc2626',
                          }}>
                            {isIncrease ? <TrendingUp style={{ width: 12, height: 12 }} /> : !isNeutral ? <TrendingDown style={{ width: 12, height: 12 }} /> : null}
                            {isIncrease ? `+${log.difference}` : log.difference}
                          </span>
                        </td>

                        <td style={{ padding: '14px 18px', color: '#334155', fontWeight: 500 }}>
                          {log.reason}
                        </td>

                        <td style={{ padding: '14px 18px', color: '#475569', fontSize: 12.5 }}>
                          {log.updatedBy}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ConsoleLayout>
  );
};
