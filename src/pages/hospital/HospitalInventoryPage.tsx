import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import { InventoryItem } from '../../types';
import {
  Package, Plus, Upload, FileText, Search, Filter, ArrowLeft,
  RefreshCw, CheckCircle2, AlertTriangle, AlertOctagon, Trash2,
  Edit2, Eye, ShieldCheck, X,
} from 'lucide-react';

export const HospitalInventoryPage: React.FC = () => {
  const { currentUser, inventory, sources, updateInventoryQuantity, deleteInventoryItem } = useApp();
  const hospId = currentUser.sourceId || 'SRC-HOSP-001';
  const hospSource = sources.find((s) => s.id === hospId);

  // Filter ONLY inventory belonging to this hospital
  const hospitalInventory = useMemo(() => {
    return inventory.filter((item) => item.sourceId === hospId);
  }, [inventory, hospId]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Update Stock Modal
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [updateQty, setUpdateQty] = useState<number>(0);
  const [updateReason, setUpdateReason] = useState<string>('Routine Ward Restock');
  const [isUpdating, setIsUpdating] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    hospitalInventory.forEach((i) => {
      if (i.medicineType) set.add(i.medicineType);
    });
    return ['ALL', ...Array.from(set)];
  }, [hospitalInventory]);

  const filteredItems = useMemo(() => {
    return hospitalInventory.filter((item) => {
      const matchesSearch =
        item.medicineName.toLowerCase().includes(search.toLowerCase()) ||
        item.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
        (item.dosage || '').toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'OUT_OF_STOCK' && item.quantity === 0) ||
        (statusFilter === 'CRITICAL' && item.quantity > 0 && item.quantity <= 15) ||
        (statusFilter === 'LOW' && item.quantity > 15 && item.quantity <= 35) ||
        (statusFilter === 'GOOD' && item.quantity > 35);

      const matchesCategory = categoryFilter === 'ALL' || item.medicineType === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [hospitalInventory, search, statusFilter, categoryFilter]);

  const handleOpenUpdate = (item: InventoryItem) => {
    setEditingItem(item);
    setUpdateQty(item.quantity);
    setUpdateReason('Routine Ward Restock');
  };

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (updateQty < 0) {
      alert('Available quantity cannot be negative.');
      return;
    }
    setIsUpdating(true);
    try {
      updateInventoryQuantity(editingItem.id, updateQty, updateReason);
      setNotificationMsg(`Stock for ${editingItem.medicineName} updated to ${updateQty}.`);
      setEditingItem(null);
      setTimeout(() => setNotificationMsg(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to update stock quantity.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from hospital inventory?`)) return;
    try {
      deleteInventoryItem(id);
      setNotificationMsg(`${name} removed from inventory.`);
      setTimeout(() => setNotificationMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete medicine item.');
    }
  };

  return (
    <ConsoleLayout>
      <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
        
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
                Hospital Pharmacy &amp; Ward Inventory
              </h1>
              <span style={{
                fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe',
              }}>
                {hospitalInventory.length} Stock Lines
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
              {hospSource?.name || currentUser.name} · Verified institutional stock reserves, critical thresholds, and batch tracking
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Link
              to="/hospital/inventory/history"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 14px', background: '#fff', color: '#475569',
                fontSize: 13, fontWeight: 600, borderRadius: 10, border: '1.5px solid #e2e8f0',
                textDecoration: 'none',
              }}
            >
              <FileText style={{ width: 15, height: 15, color: '#64748b' }} />
              Stock History
            </Link>

            <Link
              to="/hospital/inventory/bulk-upload"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 14px', background: '#fff', color: '#475569',
                fontSize: 13, fontWeight: 600, borderRadius: 10, border: '1.5px solid #e2e8f0',
                textDecoration: 'none',
              }}
            >
              <Upload style={{ width: 15, height: 15, color: '#64748b' }} />
              Bulk Upload
            </Link>

            <Link
              to="/hospital/inventory/add"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 18px', background: '#6d28d9', color: '#fff',
                fontSize: 13, fontWeight: 700, borderRadius: 10, textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(109,40,217,0.3)',
              }}
            >
              <Plus style={{ width: 16, height: 16 }} />
              Add Medicine
            </Link>
          </div>
        </div>

        {notificationMsg && (
          <div style={{
            padding: '12px 16px', background: '#ecfdf5', border: '1px solid #a7f3d0',
            borderRadius: 10, color: '#065f46', fontSize: 13, fontWeight: 600,
            marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <CheckCircle2 style={{ width: 16, height: 16, color: '#059669' }} />
            {notificationMsg}
          </div>
        )}

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
              placeholder="Search by medicine name, dosage, or batch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px 9px 36px', fontSize: 13,
                border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none',
                background: '#f8fafc',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter style={{ width: 14, height: 14, color: '#64748b' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '7px 10px', fontSize: 12.5, borderRadius: 8,
                  border: '1.5px solid #e2e8f0', background: '#fff', outline: 'none',
                }}
              >
                <option value="ALL">All Stock Levels</option>
                <option value="GOOD">Good Availability (&gt;35)</option>
                <option value="LOW">Low Stock (16-35)</option>
                <option value="CRITICAL">Critical Stock (1-15)</option>
                <option value="OUT_OF_STOCK">Out of Stock (0)</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  padding: '7px 10px', fontSize: 12.5, borderRadius: 8,
                  border: '1.5px solid #e2e8f0', background: '#fff', outline: 'none',
                }}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
          {filteredItems.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <Package style={{ width: 36, height: 36, color: '#cbd5e1', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>No Medicines Found</p>
              <p style={{ fontSize: 13, color: '#64748b', margin: '6px 0 16px' }}>
                {search ? 'No inventory item matches your search.' : 'Your hospital inventory has no items registered yet.'}
              </p>
              <Link
                to="/hospital/inventory/add"
                style={{
                  padding: '8px 16px', background: '#6d28d9', color: '#fff',
                  fontSize: 12.5, fontWeight: 700, borderRadius: 8, textDecoration: 'none', display: 'inline-block',
                }}
              >
                Add First Medicine
              </Link>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#fafbfc', borderBottom: '1.5px solid #f1f5f9', textAlign: 'left' }}>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Medicine Name</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Batch &amp; Expiry</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Available Stock</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Category / Type</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Prescription</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569' }}>Status</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const isOut = item.quantity === 0;
                    const isCrit = item.quantity > 0 && item.quantity <= 15;
                    const isLow = item.quantity > 15 && item.quantity <= 35;

                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: 9,
                              background: '#f5f3ff', color: '#6d28d9',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              <Package style={{ width: 17, height: 17 }} />
                            </div>
                            <div>
                              <p style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>{item.medicineName}</p>
                              <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>{item.dosage || 'Standard Dosage'}</p>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: 11.5, color: '#334155', fontWeight: 600 }}>
                            {item.batchNumber}
                          </span>
                          <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>
                            Exp: {item.expiryDate}
                          </p>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                            <span style={{
                              fontSize: 16, fontWeight: 800,
                              color: isOut ? '#dc2626' : isCrit ? '#d97706' : '#0f172a',
                            }}>
                              {item.quantity}
                            </span>
                            <span style={{ fontSize: 11.5, color: '#64748b' }}>units</span>
                          </div>
                          {item.reservedQuantity && item.reservedQuantity > 0 ? (
                            <p style={{ fontSize: 10.5, color: '#2563eb', fontWeight: 700, margin: '2px 0 0' }}>
                              ({item.reservedQuantity} reserved)
                            </p>
                          ) : null}
                        </td>

                        <td style={{ padding: '14px 18px', color: '#475569', fontWeight: 500 }}>
                          {item.medicineType || 'General'}
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          {item.prescriptionRequired ? (
                            <span style={{
                              fontSize: 10.5, fontWeight: 800, padding: '2px 7px', borderRadius: 99,
                              background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe',
                            }}>
                              Rx Required
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>OTC</span>
                          )}
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          {isOut ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 99,
                              background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                            }}>
                              <AlertOctagon style={{ width: 12, height: 12 }} /> Out of Stock
                            </span>
                          ) : isCrit ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 99,
                              background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca',
                            }}>
                              <AlertTriangle style={{ width: 12, height: 12 }} /> Critical Low
                            </span>
                          ) : isLow ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 99,
                              background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a',
                            }}>
                              Low Stock
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 99,
                              background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0',
                            }}>
                              <CheckCircle2 style={{ width: 12, height: 12 }} /> In Stock
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                            <button
                              onClick={() => handleOpenUpdate(item)}
                              title="Update stock count"
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '6px 10px', background: '#f5f3ff', color: '#6d28d9',
                                border: '1px solid #ddd6fe', borderRadius: 7, fontSize: 12, fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              <RefreshCw style={{ width: 12, height: 12 }} />
                              Adjust Stock
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.medicineName)}
                              title="Delete stock line"
                              style={{
                                padding: '6px 8px', background: '#fef2f2', border: '1px solid #fecaca',
                                borderRadius: 7, cursor: 'pointer', color: '#dc2626',
                              }}
                            >
                              <Trash2 style={{ width: 13, height: 13 }} />
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

        {/* Adjust Stock Modal */}
        {editingItem && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
            backdropFilter: 'blur(3px)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}>
            <div style={{
              background: '#fff', borderRadius: 16, maxWidth: 440, width: '100%',
              border: '1px solid #e2e8f0', boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <RefreshCw style={{ width: 16, height: 16, color: '#6d28d9' }} />
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Adjust Stock: {editingItem.medicineName}
                  </h3>
                </div>
                <button
                  onClick={() => setEditingItem(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X style={{ width: 18, height: 18 }} />
                </button>
              </div>

              <form onSubmit={handleSaveStock} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Batch Number: <strong>{editingItem.batchNumber}</strong></p>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '3px 0 0' }}>Current Quantity: <strong>{editingItem.quantity} units</strong></p>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>
                    New Available Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={updateQty}
                    onChange={(e) => setUpdateQty(parseInt(e.target.value, 10) || 0)}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 14, fontWeight: 700, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 }}>
                    Reason for Adjustment *
                  </label>
                  <select
                    value={updateReason}
                    onChange={(e) => setUpdateReason(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none', background: '#fff' }}
                  >
                    <option value="Routine Ward Restock">Routine Ward Restock</option>
                    <option value="Emergency Consumption">Emergency Consumption</option>
                    <option value="Supplier Delivery Receipt">Supplier Delivery Receipt</option>
                    <option value="Internal Ward Transfer">Internal Ward Transfer</option>
                    <option value="Audit Physical Reconciliation">Audit Physical Reconciliation</option>
                    <option value="Damaged / Expired Disposal">Damaged / Expired Disposal</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    style={{ padding: '8px 14px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12.5, fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    style={{ padding: '8px 18px', background: '#6d28d9', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: isUpdating ? 'not-allowed' : 'pointer' }}
                  >
                    {isUpdating ? 'Saving...' : 'Update Stock'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ConsoleLayout>
  );
};
