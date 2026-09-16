import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import { AuditLogItem } from '../../types';
import {
  FileText, Search, Filter, ShieldCheck, Clock, User, Building2,
  CheckCircle2, AlertOctagon, Download, Calendar
} from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const { auditLogs } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchAction = actionFilter === 'ALL' || log.action === actionFilter;
      const matchSearch = !searchQuery ||
        log.performedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase());
      return matchAction && matchSearch;
    });
  }, [auditLogs, actionFilter, searchQuery]);

  const actionTypes = useMemo(() => {
    const types = Array.from(new Set(auditLogs.map(l => l.action)));
    return ['ALL', ...types];
  }, [auditLogs]);

  const handleExportCSV = () => {
    const headers = ['Log ID', 'Action', 'Organization', 'Performed By', 'Date', 'Time', 'Reason', 'Details'];
    const rows = filteredLogs.map(l => [
      l.id, l.action, l.organizationName, l.performedBy, l.date, l.time, `"${l.reason}"`, `"${l.details || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `medshare_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadge = (action: string) => {
    if (action.includes('APPROVE') || action.includes('CONFIRM')) {
      return { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' };
    }
    if (action.includes('REJECT') || action.includes('SUSPEND') || action.includes('DELETE')) {
      return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
    }
    if (action.includes('DISPATCH') || action.includes('TRANSFER')) {
      return { bg: '#faf5ff', text: '#7c3aed', border: '#ddd6fe' };
    }
    return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
  };

  return (
    <ConsoleLayout>
      <div style={{ padding: '24px 28px', maxWidth: 1300, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileText style={{ width: 26, height: 26, color: '#475569' }} />
              Regulatory Compliance & Audit Trail
            </h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              Immutable ledger of administrative actions, drug regulatory verifications, and operational overrides.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', borderRadius: 10,
              background: '#0f172a', color: '#fff', border: 'none',
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(15,23,42,0.2)',
            }}
          >
            <Download style={{ width: 16, height: 16 }} />
            Export Compliance CSV
          </button>
        </div>

        {/* Filters */}
        <div style={{
          background: '#fff', borderRadius: 14, padding: '14px 18px',
          border: '1px solid #e2e8f0', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: 8, padding: '8px 12px', flex: 1, minWidth: 260,
          }}>
            <Search style={{ width: 16, height: 16, color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search audit trail by operator, organization, action, or reason..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                border: 'none', background: 'transparent', outline: 'none',
                fontSize: 13, width: '100%', color: '#0f172a',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              style={{
                padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
                background: '#f8fafc', fontSize: 13, fontWeight: 600, color: '#334155',
                outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="ALL">All Action Types</option>
              {actionTypes.filter(a => a !== 'ALL').map(a => (
                <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Audit Table */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Log ID / Timestamp</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Action Performed</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Target Organization</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Authorized Operator</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Audit Justification / Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                      No audit entries found matching the query.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => {
                    const aBadge = getActionBadge(log.action);
                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }} onMouseEnter={e => e.currentTarget.style.background = '#fafafa'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ fontWeight: 800, fontSize: 12.5, fontFamily: 'monospace', color: '#475569' }}>
                            {log.id}
                          </span>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                            {log.date} at {log.time}
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            padding: '3px 8px', borderRadius: 99,
                            background: aBadge.bg, color: aBadge.text,
                            border: `1px solid ${aBadge.border}`,
                            fontSize: 11, fontWeight: 700,
                          }}>
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                            {log.organizationName}
                          </span>
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            {log.organizationType || 'SYSTEM'}
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontSize: 12.5, color: '#334155', fontWeight: 600 }}>
                            {log.performedBy}
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <p style={{ margin: 0, fontSize: 12.5, color: '#475569' }}>
                            {log.reason}
                          </p>
                          {log.details && (
                            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8' }}>
                              {log.details}
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </ConsoleLayout>
  );
};
