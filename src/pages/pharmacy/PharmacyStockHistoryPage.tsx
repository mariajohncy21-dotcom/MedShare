import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import {
  FileText, ArrowLeft, Search, Filter, Calendar, TrendingUp, TrendingDown, Clock, Package,
} from 'lucide-react';

export const PharmacyStockHistoryPage: React.FC = () => {
  const { currentUser, stockChangeLogs, sources } = useApp();

  const pharmId = currentUser.sourceId || 'SRC-PHARM-001';
  const pharmSource = sources.find((s) => s.id === pharmId);

  const [searchQuery, setSearchQuery] = useState('');
  const [reasonFilter, setReasonFilter] = useState<string>('ALL');

  // Filter logs belonging to this pharmacy only
  const myLogs = useMemo(() => {
    return stockChangeLogs.filter((log) => log.sourceId === pharmId);
  }, [stockChangeLogs, pharmId]);

  const filteredLogs = useMemo(() => {
    return myLogs.filter((log) => {
      const matchesSearch =
        !searchQuery ||
        log.medicineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.updatedBy && log.updatedBy.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesReason =
        reasonFilter === 'ALL' ||
        (reasonFilter === 'ADD' && log.difference > 0) ||
        (reasonFilter === 'REDUCE' && log.difference < 0);

      return matchesSearch && matchesReason;
    });
  }, [myLogs, searchQuery, reasonFilter]);

  return (
    <ConsoleLayout>
      <div style={{ padding: '24px 28px', maxWidth: 1280, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
        
        {/* Back Link */}
        <div style={{ marginBottom: 16 }}>
          <Link
            to="/pharmacy/inventory"
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
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16, marginBottom: 24,
        }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
              Stock Adjustment Audit History
            </h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              {pharmSource?.name || currentUser.name} · Complete audit log of all manual and automated stock changes
            </p>
          </div>

          <Link
            to="/pharmacy/inventory/update"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '9px 16px', background: '#1d4ed8', color: '#fff',
              fontWeight: 700, fontSize: 13, borderRadius: 10,
              textDecoration: 'none', boxShadow: '0 2px 8px rgba(29,78,216,0.25)',
            }}
          >
            Adjust Stock Quantity
          </Link>
        </div>

        {/* Filter Bar */}
        <div style={{
          background: '#fff', borderRadius: 14, padding: 18,
          border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search medicine, reason, or staff member..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px 9px 36px', fontSize: 13,
                borderRadius: 9, border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ minWidth: 180 }}>
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px', fontSize: 13, fontWeight: 600,
                borderRadius: 9, border: '1px solid #cbd5e1', outline: 'none', background: '#fafbfc',
              }}
            >
              <option value="ALL">All Adjustment Types</option>
              <option value="ADD">Stock Additions (+)</option>
              <option value="REDUCE">Stock Dispensings (-)</option>
            </select>
          </div>
        </div>

        {/* Log Table */}
        <div style={{
          background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0',
          boxShadow: '0 1px 6px rgba(0,0,0,0.04)', overflow: 'hidden',
        }}>
          {filteredLogs.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <FileText style={{ width: 48, height: 48, color: '#cbd5e1', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
                No stock history logs found
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                Stock adjustment logs will automatically appear here whenever stock quantities are updated or emergency requests are fulfilled.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Date &amp; Time</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Medicine Name</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Previous Qty</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Adjustment</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>New Qty</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Reason</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Updated By</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s ease' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#fafbfc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '14px 16px', color: '#64748b', whiteSpace: 'nowrap', fontSize: 12 }}>
                        {log.timestamp || log.date || 'Recently'}
                      </td>

                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>
                        {log.medicineName}
                      </td>

                      <td style={{ padding: '14px 16px', color: '#475569', fontWeight: 600 }}>
                        {log.previousQuantity}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        {log.difference > 0 ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 3,
                            fontSize: 12, fontWeight: 800, padding: '2px 8px', borderRadius: 99,
                            background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0',
                          }}>
                            <TrendingUp style={{ width: 12, height: 12 }} />
                            +{log.difference}
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 3,
                            fontSize: 12, fontWeight: 800, padding: '2px 8px', borderRadius: 99,
                            background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                          }}>
                            <TrendingDown style={{ width: 12, height: 12 }} />
                            {log.difference}
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0f172a' }}>
                        {log.newQuantity}
                      </td>

                      <td style={{ padding: '14px 16px', color: '#334155', maxWidth: 280 }}>
                        {log.reason}
                      </td>

                      <td style={{ padding: '14px 16px', color: '#64748b', fontSize: 12, fontWeight: 500 }}>
                        {log.updatedBy || currentUser.name}
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
