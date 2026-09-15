import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import {
  RefreshCw, ArrowLeft, CheckCircle2, AlertCircle, Package, TrendingUp, TrendingDown,
} from 'lucide-react';

export const PharmacyUpdateStockPage: React.FC = () => {
  const { currentUser, inventory, updateInventoryQuantity } = useApp();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const pharmId = currentUser.sourceId || 'SRC-PHARM-001';
  const myInventory = inventory.filter((i) => i.sourceId === pharmId);

  const urlId = searchParams.get('id');
  const initialItem = myInventory.find((i) => i.id === urlId) || myInventory[0] || null;

  const [selectedId, setSelectedId] = useState<string>(initialItem?.id || '');
  const [mode, setMode] = useState<'ADD' | 'DISPENSE'>('ADD');
  const [adjustmentQty, setAdjustmentQty] = useState<number>(10);
  const [reason, setReason] = useState<string>('Received stock shipment from distributor');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (urlId && myInventory.some((i) => i.id === urlId)) {
      setSelectedId(urlId);
    }
  }, [urlId, myInventory]);

  const currentItem = myInventory.find((i) => i.id === selectedId) || null;
  const currentQuantity = currentItem ? currentItem.quantity : 0;

  // Calculate new quantity
  const diff = mode === 'ADD' ? Math.abs(adjustmentQty) : -Math.abs(adjustmentQty);
  const newQuantity = currentQuantity + diff;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentItem) {
      setErrorMessage('Please select a valid medicine batch from your inventory.');
      return;
    }

    if (isNaN(adjustmentQty) || adjustmentQty <= 0) {
      setErrorMessage('Adjustment quantity must be greater than 0.');
      return;
    }

    if (newQuantity < 0) {
      setErrorMessage(`Cannot dispense ${adjustmentQty} units. Current stock is only ${currentQuantity}. Stock quantity cannot be negative.`);
      return;
    }

    if (!reason.trim()) {
      setErrorMessage('Please provide a reason for this stock adjustment.');
      return;
    }

    setIsSubmitting(true);
    try {
      updateInventoryQuantity(currentItem.id, newQuantity, reason.trim());
      setIsSubmitting(false);
      navigate('/pharmacy/inventory');
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Failed to update stock quantity.');
    }
  };

  return (
    <ConsoleLayout>
      <div style={{ padding: '24px 28px', maxWidth: 720, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
        
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

        {/* Form Container */}
        <div style={{
          background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '24px 32px', background: 'linear-gradient(135deg, #1d4ed8, #1e40af)',
            color: '#fff', display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <RefreshCw style={{ width: 22, height: 22, color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 2px', letterSpacing: '-0.02em' }}>
                Update Stock Quantity &amp; Log History
              </h1>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', margin: 0 }}>
                Adjust live available inventory counts with verifiable reason trail
              </p>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {errorMessage && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: 10, fontSize: 12.5, color: '#dc2626', fontWeight: 600,
              }}>
                <AlertCircle style={{ width: 16, height: 16, flexShrink: 0, marginTop: 1 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Select Medicine */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Select Medicine Batch from Inventory <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                style={{
                  width: '100%', padding: '11px 14px', fontSize: 13.5, fontWeight: 700,
                  borderRadius: 9, border: '1.5px solid #cbd5e1', outline: 'none', background: '#fafbfc',
                  color: '#0f172a',
                }}
              >
                {myInventory.length === 0 ? (
                  <option value="">No inventory items available</option>
                ) : (
                  myInventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.medicineName} — Batch: {item.batchNumber} (Current Stock: {item.quantity} {item.unit || 'units'})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Current Stock Display */}
            {currentItem && (
              <div style={{
                background: '#f8fafc', padding: 18, borderRadius: 12, border: '1px solid #e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Current Available Stock
                  </span>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginTop: 2 }}>
                    {currentQuantity} <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>{currentItem.unit || 'units'}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 12, color: '#64748b' }}>
                  <div><strong>Strength:</strong> {currentItem.dosage || 'Standard'}</div>
                  <div><strong>Batch:</strong> <span style={{ fontFamily: 'monospace' }}>{currentItem.batchNumber}</span></div>
                  <div><strong>Expiry:</strong> {currentItem.expiryDate}</div>
                </div>
              </div>
            )}

            {/* Adjustment Mode (Add vs Dispense) */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                Adjustment Action <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setMode('ADD')}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '12px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13.5,
                    border: mode === 'ADD' ? '2px solid #059669' : '1px solid #cbd5e1',
                    background: mode === 'ADD' ? '#ecfdf5' : '#fafbfc',
                    color: mode === 'ADD' ? '#047857' : '#64748b',
                    transition: 'all 0.12s ease',
                  }}
                >
                  <TrendingUp style={{ width: 16, height: 16 }} />
                  Add Stock (+)
                </button>

                <button
                  type="button"
                  onClick={() => setMode('DISPENSE')}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '12px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13.5,
                    border: mode === 'DISPENSE' ? '2px solid #dc2626' : '1px solid #cbd5e1',
                    background: mode === 'DISPENSE' ? '#fef2f2' : '#fafbfc',
                    color: mode === 'DISPENSE' ? '#b91c1c' : '#64748b',
                    transition: 'all 0.12s ease',
                  }}
                >
                  <TrendingDown style={{ width: 16, height: 16 }} />
                  Dispense / Reduce (-)
                </button>
              </div>
            </div>

            {/* Adjustment Quantity Input */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Adjustment Quantity <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="number"
                min="1"
                value={adjustmentQty}
                onChange={(e) => setAdjustmentQty(parseInt(e.target.value, 10) || 0)}
                style={{
                  width: '100%', padding: '11px 14px', fontSize: 16, fontWeight: 800,
                  borderRadius: 9, border: '1.5px solid #cbd5e1', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Preview Calculation Card */}
            <div style={{
              padding: '14px 18px', borderRadius: 12,
              background: newQuantity < 0 ? '#fef2f2' : '#eff6ff',
              border: `1px solid ${newQuantity < 0 ? '#fecaca' : '#bfdbfe'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Calculated New Stock Quantity:</span>
                <div style={{ fontSize: 20, fontWeight: 900, color: newQuantity < 0 ? '#dc2626' : '#1e40af', marginTop: 2 }}>
                  {currentQuantity} {mode === 'ADD' ? '+' : '-'} {adjustmentQty} = <strong>{newQuantity}</strong> {currentItem?.unit || 'units'}
                </div>
              </div>
              {newQuantity < 0 && (
                <span style={{ fontSize: 12, fontWeight: 800, color: '#dc2626' }}>
                  ⚠️ Invalid: Stock cannot be negative
                </span>
              )}
            </div>

            {/* Reason Selection / Input */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Reason for Stock Update <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', fontSize: 13, fontWeight: 600,
                  borderRadius: 9, border: '1.5px solid #cbd5e1', outline: 'none', background: '#fafbfc',
                  marginBottom: 8,
                }}
              >
                <option value="Received stock shipment from distributor">Received stock shipment from distributor</option>
                <option value="Dispensed to walk-in customer / patient">Dispensed to walk-in customer / patient</option>
                <option value="Fulfilled hospital emergency medicine request">Fulfilled hospital emergency medicine request</option>
                <option value="Expired stock removed for disposal">Expired stock removed for disposal</option>
                <option value="Damaged / broken vials removed">Damaged / broken vials removed</option>
                <option value="Regular inventory audit adjustment">Regular inventory audit adjustment</option>
                <option value="Other">Other (Custom reason)</option>
              </select>
            </div>

            {/* Submit & Cancel Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: 8, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={() => navigate('/pharmacy/inventory')}
                style={{
                  padding: '11px 20px', background: '#f1f5f9', color: '#475569',
                  fontWeight: 600, fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 10, cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || newQuantity < 0}
                style={{
                  padding: '11px 24px', background: (isSubmitting || newQuantity < 0) ? '#93c5fd' : '#1d4ed8',
                  color: '#fff', fontWeight: 800, fontSize: 13.5, border: 'none', borderRadius: 10,
                  cursor: (isSubmitting || newQuantity < 0) ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 10px rgba(29,78,216,0.3)',
                }}
              >
                {isSubmitting ? 'Updating Stock...' : 'Confirm Stock Adjustment'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </ConsoleLayout>
  );
};
