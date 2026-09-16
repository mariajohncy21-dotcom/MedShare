import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import { InventoryItem, StockStatus, ExpiryStatus } from '../../types';
import {
  Boxes, Search, Filter, AlertOctagon, AlertTriangle, CheckCircle2,
  Building2, Hospital, Calendar, Tag, RefreshCw, Eye, X
} from 'lucide-react';

export const AdminInventoryPage: React.FC = () => {
  const { inventory, sources, medicines, updateInventoryQuantity } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [sourceTypeFilter, setSourceTypeFilter] = useState<'ALL' | 'PHARMACY' | 'HOSPITAL'>('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('ALL');
  const [expiryFilter, setExpiryFilter] = useState<string>('ALL');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [quickEditQty, setQuickEditQty] = useState<string>('');

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchType = sourceTypeFilter === 'ALL' || item.sourceType === sourceTypeFilter;
      const matchStock = stockStatusFilter === 'ALL' || item.stockStatus === stockStatusFilter;
      const matchExpiry = expiryFilter === 'ALL' || item.expiryStatus === expiryFilter;
      const matchSearch = !searchQuery ||
        item.medicineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.batchNumber.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchStock && matchExpiry && matchSearch;
    });
  }, [inventory, sourceTypeFilter, stockStatusFilter, expiryFilter, searchQuery]);

  const stats = useMemo(() => {
    const totalUnits = inventory.reduce((sum, i) => sum + i.quantity, 0);
    const totalSKUs = inventory.length;
    const criticalCount = inventory.filter(i => i.stockStatus === 'CRITICAL' || i.stockStatus === 'OUT_OF_STOCK').length;
    const lowCount = inventory.filter(i => i.stockStatus === 'LOW').length;
    const expiringCount = inventory.filter(i => i.expiryStatus === 'EXPIRING_SOON' || i.expiryStatus === 'EXPIRED').length;
    return { totalUnits, totalSKUs, criticalCount, lowCount, expiringCount };
  }, [inventory]);

  const handleUpdateQuantity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    const qty = parseInt(quickEditQty);
    if (!isNaN(qty) && qty >= 0) {
      updateInventoryQuantity(selectedItem.id, qty, 'Administrative stock calibration');
      setSelectedItem(null);
    }
  };

  const getStockBadge = (status: StockStatus) => {
    switch (status) {
      case 'GOOD': return { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0', label: 'Optimal' };
      case 'LOW': return { bg: '#fffbeb', text: '#d97706', border: '#fde68a', label: 'Low Stock' };
      case 'CRITICAL': return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', label: 'Critical Alert' };
      case 'OUT_OF_STOCK': return { bg: '#f8fafc', text: '#64748b', border: '#cbd5e1', label: 'Out of Stock' };
    }
  };

  return (
    <ConsoleLayout>
      <div style={{ padding: '24px 28px', maxWidth: 1300, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Boxes style={{ width: 26, height: 26, color: '#0284c7' }} />
              Centralized Inventory Monitor
            </h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              Live real-time visibility into medicine stock levels across all Tisaiyanvilai healthcare providers.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 24 }}>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0, fontWeight: 600 }}>Total Units Tracked</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '4px 0 0' }}>{stats.totalUnits.toLocaleString()}</p>
          </div>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #bfdbfe', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#1d4ed8', margin: 0, fontWeight: 600 }}>Active Batches (SKUs)</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#1d4ed8', margin: '4px 0 0' }}>{stats.totalSKUs}</p>
          </div>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #fecaca', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#dc2626', margin: 0, fontWeight: 600 }}>Critical / Depleted</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#dc2626', margin: '4px 0 0' }}>{stats.criticalCount}</p>
          </div>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #fde68a', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#d97706', margin: 0, fontWeight: 600 }}>Low Stock Warnings</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#d97706', margin: '4px 0 0' }}>{stats.lowCount}</p>
          </div>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #fed7aa', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#c2410c', margin: 0, fontWeight: 600 }}>Expiring &lt; 90 Days</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#c2410c', margin: '4px 0 0' }}>{stats.expiringCount}</p>
          </div>
        </div>

        {/* Filter Controls */}
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
              placeholder="Search by medicine, facility name, or batch number..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                border: 'none', background: 'transparent', outline: 'none',
                fontSize: 13, width: '100%', color: '#0f172a',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <select
              value={sourceTypeFilter}
              onChange={e => setSourceTypeFilter(e.target.value as any)}
              style={{
                padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
                background: '#f8fafc', fontSize: 13, fontWeight: 600, color: '#334155',
                outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="ALL">All Facilities</option>
              <option value="PHARMACY">Pharmacies Only</option>
              <option value="HOSPITAL">Hospitals Only</option>
            </select>

            <select
              value={stockStatusFilter}
              onChange={e => setStockStatusFilter(e.target.value)}
              style={{
                padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
                background: '#f8fafc', fontSize: 13, fontWeight: 600, color: '#334155',
                outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="ALL">All Stock Statuses</option>
              <option value="GOOD">Optimal Stock</option>
              <option value="LOW">Low Stock</option>
              <option value="CRITICAL">Critical Shortage</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>

            <select
              value={expiryFilter}
              onChange={e => setExpiryFilter(e.target.value)}
              style={{
                padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
                background: '#f8fafc', fontSize: 13, fontWeight: 600, color: '#334155',
                outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="ALL">All Expiry States</option>
              <option value="SAFE">Safe Expiry</option>
              <option value="EXPIRING_SOON">Expiring Soon</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        </div>

        {/* Live Inventory Table */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Medicine</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Stocking Facility</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Batch & Expiry</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Unit Price</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Available Stock</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Status</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                      No inventory records match the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map(item => {
                    const sBadge = getStockBadge(item.stockStatus);
                    const isExpiring = item.expiryStatus === 'EXPIRING_SOON';
                    const isExpired = item.expiryStatus === 'EXPIRED';

                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }} onMouseEnter={e => e.currentTarget.style.background = '#fafafa'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                        <td style={{ padding: '14px 18px' }}>
                          <p style={{ margin: 0, fontWeight: 800, fontSize: 13.5, color: '#0f172a' }}>
                            {item.medicineName}
                          </p>
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8' }}>
                            SKU ID: {item.id}
                          </p>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {item.sourceType === 'PHARMACY' ? (
                              <Building2 style={{ width: 14, height: 14, color: '#0f766e' }} />
                            ) : (
                              <Hospital style={{ width: 14, height: 14, color: '#6d28d9' }} />
                            )}
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                              {item.sourceName}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontSize: 12.5 }}>
                            <span style={{ fontFamily: 'monospace', color: '#64748b' }}>{item.batchNumber}</span>
                            <div style={{
                              fontSize: 11.5, marginTop: 2,
                              color: isExpired ? '#dc2626' : isExpiring ? '#d97706' : '#64748b',
                              fontWeight: (isExpiring || isExpired) ? 700 : 400,
                            }}>
                              Exp: {item.expiryDate}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                            ₹{item.unitPrice || 0}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            fontSize: 14, fontWeight: 800,
                            color: item.stockStatus === 'CRITICAL' ? '#dc2626' : item.stockStatus === 'LOW' ? '#d97706' : '#059669',
                          }}>
                            {item.quantity} units
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            padding: '3px 8px', borderRadius: 99,
                            background: sBadge.bg, color: sBadge.text,
                            border: `1px solid ${sBadge.border}`,
                            fontSize: 11, fontWeight: 700,
                          }}>
                            {sBadge.label}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setQuickEditQty(item.quantity.toString());
                            }}
                            style={{
                              padding: '6px 12px', borderRadius: 7,
                              background: '#f8fafc', border: '1px solid #e2e8f0',
                              color: '#334155', fontSize: 12, fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Adjust
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Edit Stock Quantity Modal */}
        {selectedItem && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
          }}>
            <form onSubmit={handleUpdateQuantity} style={{
              background: '#fff', borderRadius: 16, maxWidth: 440, width: '100%',
              padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', position: 'relative',
            }}>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X style={{ width: 20, height: 20 }} />
              </button>
              <h3 style={{ margin: '0 0 12px', fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
                Stock Level Adjustment
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>
                Admin calibration for <strong>{selectedItem.medicineName}</strong> at {selectedItem.sourceName}.
              </p>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Confirmed Physical Count (Units)
                </label>
                <input
                  type="number" min={0} required
                  value={quickEditQty}
                  onChange={e => setQuickEditQty(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8,
                    border: '1px solid #cbd5e1', fontSize: 14, fontWeight: 700, boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  style={{ padding: '8px 16px', borderRadius: 8, background: '#f1f5f9', color: '#334155', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: 8, background: '#0284c7', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  Update Inventory
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </ConsoleLayout>
  );
};
