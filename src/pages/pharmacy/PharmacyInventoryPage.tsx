import React, { useState, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import {
  Package, Plus, RefreshCw, Upload, Search, Filter, ArrowLeft,
  Edit2, Trash2, ShieldAlert, CheckCircle2, Clock, AlertTriangle, FileText, Eye, X, Check,
} from 'lucide-react';
import { InventoryItem } from '../../types';

export const PharmacyInventoryPage: React.FC = () => {
  const { currentUser, inventory, sources, deleteInventoryItem } = useApp();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const pharmId = currentUser.sourceId || 'SRC-PHARM-001';
  const pharmSource = sources.find((s) => s.id === pharmId);

  // Filters state
  const initialStatus = searchParams.get('status') || 'ALL';
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [expiryFilter, setExpiryFilter] = useState<string>('ALL');
  const [rxFilter, setRxFilter] = useState<string>('ALL');

  // Detail Modal state
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Only display logged-in pharmacy's inventory
  const myInventory = useMemo(() => {
    return inventory.filter((i) => i.sourceId === pharmId);
  }, [inventory, pharmId]);

  // Filtered inventory list
  const filteredInventory = useMemo(() => {
    return myInventory.filter((item) => {
      // 1. Search Query
      const matchesSearch =
        !searchQuery ||
        item.medicineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.medicineType && item.medicineType.toLowerCase().includes(searchQuery.toLowerCase()));

      // 2. Stock Status Filter
      const matchesStatus =
        statusFilter === 'ALL' ||
        item.stockStatus === statusFilter ||
        (statusFilter === 'LOW' && (item.stockStatus === 'LOW' || item.stockStatus === 'CRITICAL'));

      // 3. Expiry Filter
      let matchesExpiry = true;
      if (expiryFilter === 'EXPIRED') {
        matchesExpiry = item.expiryStatus === 'EXPIRED' || (new Date(item.expiryDate) < new Date());
      } else if (expiryFilter === 'EXPIRING_SOON') {
        const d = new Date(item.expiryDate);
        const daysLeft = Math.ceil((d.getTime() - Date.now()) / (1000 * 3600 * 24));
        matchesExpiry = daysLeft > 0 && daysLeft <= 90;
      }

      // 4. Prescription Filter
      let matchesRx = true;
      if (rxFilter === 'YES') matchesRx = Boolean(item.prescriptionRequired);
      else if (rxFilter === 'NO') matchesRx = !item.prescriptionRequired;

      return matchesSearch && matchesStatus && matchesExpiry && matchesRx;
    });
  }, [myInventory, searchQuery, statusFilter, expiryFilter, rxFilter]);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from your active inventory?`)) {
      deleteInventoryItem(id);
    }
  };

  const getStatusBadge = (status?: string, qty?: number) => {
    if (status === 'OUT_OF_STOCK' || qty === 0) {
      return (
        <span style={{
          fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 99,
          background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
        }}>
          Out of Stock
        </span>
      );
    }
    if (status === 'CRITICAL') {
      return (
        <span style={{
          fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 99,
          background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3',
        }}>
          Critical Stock
        </span>
      );
    }
    if (status === 'LOW') {
      return (
        <span style={{
          fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 99,
          background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a',
        }}>
          Low Stock
        </span>
      );
    }
    return (
      <span style={{
        fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 99,
        background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0',
      }}>
        In Stock
      </span>
    );
  };

  return (
    <ConsoleLayout>
      <div style={{ padding: '24px 28px', maxWidth: 1280, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
        
        {/* Back Button */}
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

        {/* Page Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16, marginBottom: 24,
        }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
              Pharmacy Inventory Management
            </h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              {pharmSource?.name || currentUser.name} · {myInventory.length} total medicine batches in database
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Link
              to="/pharmacy/inventory/add"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', background: '#0d9488', color: '#fff',
                fontWeight: 700, fontSize: 13, borderRadius: 10,
                textDecoration: 'none', boxShadow: '0 2px 8px rgba(13,148,136,0.25)',
              }}
            >
              <Plus style={{ width: 16, height: 16 }} />
              Add Medicine
            </Link>

            <Link
              to="/pharmacy/inventory/update"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', background: '#3b82f6', color: '#fff',
                fontWeight: 700, fontSize: 13, borderRadius: 10,
                textDecoration: 'none', boxShadow: '0 2px 8px rgba(59,130,246,0.25)',
              }}
            >
              <RefreshCw style={{ width: 15, height: 15 }} />
              Update Stock
            </Link>

            <Link
              to="/pharmacy/inventory/bulk-upload"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', background: '#fff', color: '#0f172a',
                fontWeight: 700, fontSize: 13, borderRadius: 10,
                textDecoration: 'none', border: '1px solid #cbd5e1',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <Upload style={{ width: 15, height: 15, color: '#64748b' }} />
              Bulk Upload
            </Link>

            <Link
              to="/pharmacy/inventory/history"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', background: '#f8fafc', color: '#475569',
                fontWeight: 600, fontSize: 13, borderRadius: 10,
                textDecoration: 'none', border: '1px solid #e2e8f0',
              }}
            >
              <FileText style={{ width: 15, height: 15, color: '#64748b' }} />
              Stock History
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={{
          background: '#fff', borderRadius: 14, padding: 18,
          border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search medicine name, batch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '9px 12px 9px 36px', fontSize: 13,
                  borderRadius: 9, border: '1px solid #cbd5e1', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Stock Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: '100%', padding: '9px 12px', fontSize: 13, fontWeight: 600,
                  borderRadius: 9, border: '1px solid #cbd5e1', outline: 'none',
                  background: '#fafbfc', color: '#334155',
                }}
              >
                <option value="ALL">All Stock Statuses</option>
                <option value="GOOD">In Stock Only</option>
                <option value="LOW">Low &amp; Critical Stock</option>
                <option value="CRITICAL">Critical Stock Only</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>
            </div>

            {/* Expiry Filter */}
            <div>
              <select
                value={expiryFilter}
                onChange={(e) => setExpiryFilter(e.target.value)}
                style={{
                  width: '100%', padding: '9px 12px', fontSize: 13, fontWeight: 600,
                  borderRadius: 9, border: '1px solid #cbd5e1', outline: 'none',
                  background: '#fafbfc', color: '#334155',
                }}
              >
                <option value="ALL">All Expiry States</option>
                <option value="EXPIRING_SOON">Expiring in 90 Days</option>
                <option value="EXPIRED">Expired Stock</option>
              </select>
            </div>

            {/* Prescription Filter */}
            <div>
              <select
                value={rxFilter}
                onChange={(e) => setRxFilter(e.target.value)}
                style={{
                  width: '100%', padding: '9px 12px', fontSize: 13, fontWeight: 600,
                  borderRadius: 9, border: '1px solid #cbd5e1', outline: 'none',
                  background: '#fafbfc', color: '#334155',
                }}
              >
                <option value="ALL">All Prescription Types</option>
                <option value="YES">Prescription Required (Rx)</option>
                <option value="NO">Over The Counter (OTC)</option>
              </select>
            </div>

          </div>

          {(searchQuery || statusFilter !== 'ALL' || expiryFilter !== 'ALL' || rxFilter !== 'ALL') && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px dashed #e2e8f0' }}>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                Showing <strong>{filteredInventory.length}</strong> of <strong>{myInventory.length}</strong> inventory records
              </span>
              <button
                onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); setExpiryFilter('ALL'); setRxFilter('ALL'); }}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* Inventory Data Table */}
        <div style={{
          background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0',
          boxShadow: '0 1px 6px rgba(0,0,0,0.04)', overflow: 'hidden',
        }}>
          {filteredInventory.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <Package style={{ width: 48, height: 48, color: '#cbd5e1', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
                {myInventory.length === 0 ? 'No medicines added yet' : 'No inventory records match your filters'}
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 18px', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
                {myInventory.length === 0
                  ? 'Start populating your pharmacy inventory to enable live emergency matching and reservation allocations.'
                  : 'Try adjusting your search keywords, stock status filters, or expiry selection.'}
              </p>
              {myInventory.length === 0 && (
                <Link
                  to="/pharmacy/inventory/add"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '10px 20px', background: '#0d9488', color: '#fff',
                    fontWeight: 700, fontSize: 13, borderRadius: 10, textDecoration: 'none',
                  }}
                >
                  <Plus style={{ width: 16, height: 16 }} />
                  Add First Medicine
                </Link>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Medicine &amp; Type</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Strength</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Batch No.</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Quantity</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Expiry Date</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Prescription</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Stock Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((item) => (
                    <tr
                      key={item.id}
                      style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s ease' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#fafbfc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Medicine Name */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.medicineName}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{item.medicineType || 'General'}</div>
                      </td>

                      {/* Dosage / Strength */}
                      <td style={{ padding: '14px 16px', color: '#334155', fontWeight: 500 }}>
                        {item.dosage || 'Standard'}
                      </td>

                      {/* Batch Number */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e40af', fontSize: 12 }}>
                          {item.batchNumber}
                        </span>
                      </td>

                      {/* Available Quantity */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          fontWeight: 800, fontSize: 14,
                          color: item.quantity === 0 ? '#dc2626' : item.quantity <= 15 ? '#d97706' : '#0f172a',
                        }}>
                          {item.quantity}
                        </span>{' '}
                        <span style={{ fontSize: 11, color: '#64748b' }}>{item.unit || 'units'}</span>
                      </td>

                      {/* Expiry Date */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          fontSize: 12, fontWeight: 600,
                          color: new Date(item.expiryDate) < new Date() ? '#dc2626' : '#334155',
                        }}>
                          {item.expiryDate}
                        </span>
                      </td>

                      {/* Prescription Required Badge */}
                      <td style={{ padding: '14px 16px' }}>
                        {item.prescriptionRequired ? (
                          <span style={{
                            fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 99,
                            background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                            textTransform: 'uppercase', letterSpacing: '0.04em',
                          }}>
                            Rx Required
                          </span>
                        ) : (
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                            background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0',
                          }}>
                            OTC
                          </span>
                        )}
                      </td>

                      {/* Stock Status Badge */}
                      <td style={{ padding: '14px 16px' }}>
                        {getStatusBadge(item.stockStatus, item.quantity)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <button
                            onClick={() => setSelectedItem(item)}
                            title="View Details"
                            style={{
                              background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '6px 10px',
                              borderRadius: 7, color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center',
                            }}
                          >
                            <Eye style={{ width: 14, height: 14 }} />
                          </button>

                          <Link
                            to={`/pharmacy/inventory/update?id=${item.id}`}
                            title="Update Stock Quantity"
                            style={{
                              background: '#eff6ff', border: '1px solid #bfdbfe', padding: '6px 10px',
                              borderRadius: 7, color: '#1d4ed8', cursor: 'pointer', display: 'flex', alignItems: 'center', textDecoration: 'none',
                            }}
                          >
                            <RefreshCw style={{ width: 14, height: 14 }} />
                          </Link>

                          <button
                            onClick={() => handleDelete(item.id, item.medicineName)}
                            title="Archive / Remove"
                            style={{
                              background: '#fef2f2', border: '1px solid #fecaca', padding: '6px 10px',
                              borderRadius: 7, color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center',
                            }}
                          >
                            <Trash2 style={{ width: 14, height: 14 }} />
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

        {/* Item Detail Modal */}
        {selectedItem && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}>
            <div style={{
              background: '#fff', borderRadius: 16, maxWidth: 500, width: '100%',
              padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', border: '1px solid #e2e8f0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Medicine Batch Details
                </h3>
                <button
                  onClick={() => setSelectedItem(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#64748b' }}
                >
                  <X style={{ width: 18, height: 18 }} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Medicine Name:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{selectedItem.medicineName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Category / Type:</span>
                  <span style={{ fontWeight: 600, color: '#334155' }}>{selectedItem.medicineType || 'General'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Strength / Dosage:</span>
                  <span style={{ fontWeight: 600, color: '#334155' }}>{selectedItem.dosage || 'Standard'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Batch Number:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e40af' }}>{selectedItem.batchNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Available Stock:</span>
                  <span style={{ fontWeight: 800, color: '#0f172a' }}>{selectedItem.quantity} {selectedItem.unit || 'units'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Expiry Date:</span>
                  <span style={{ fontWeight: 700, color: '#334155' }}>{selectedItem.expiryDate}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Price per Unit:</span>
                  <span style={{ fontWeight: 700, color: '#059669' }}>₹{selectedItem.pricePerUnit || selectedItem.unitPrice || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Prescription Required:</span>
                  <span style={{ fontWeight: 700, color: selectedItem.prescriptionRequired ? '#dc2626' : '#059669' }}>
                    {selectedItem.prescriptionRequired ? 'Yes (Rx Required)' : 'No (OTC)'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Last Updated:</span>
                  <span style={{ color: '#64748b' }}>{selectedItem.updatedAt || 'Recently'}</span>
                </div>
              </div>

              {selectedItem.prescriptionRequired && (
                <div style={{
                  marginTop: 16, padding: '10px 14px', background: '#fffbeb',
                  borderRadius: 10, border: '1px solid #fde68a', fontSize: 12, color: '#92400e',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <AlertTriangle style={{ width: 16, height: 16, color: '#d97706', flexShrink: 0 }} />
                  <span><strong>Collection Rule:</strong> Customers must present a valid registered medical prescription when collecting this item.</span>
                </div>
              )}

              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <Link
                  to={`/pharmacy/inventory/update?id=${selectedItem.id}`}
                  style={{
                    padding: '9px 16px', background: '#3b82f6', color: '#fff',
                    fontWeight: 700, fontSize: 13, borderRadius: 8, textDecoration: 'none',
                  }}
                >
                  Update Stock
                </Link>
                <button
                  onClick={() => setSelectedItem(null)}
                  style={{
                    padding: '9px 16px', background: '#f1f5f9', color: '#475569',
                    fontWeight: 600, fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </ConsoleLayout>
  );
};
