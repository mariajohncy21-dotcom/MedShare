import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import {
  Plus, ArrowLeft, CheckCircle2, AlertCircle, Package, Calendar,
  Hash, DollarSign, FileText, Check, AlertTriangle, ShieldCheck,
} from 'lucide-react';

export const PharmacyAddMedicinePage: React.FC = () => {
  const { currentUser, medicines, sources, inventory, addInventoryItem } = useApp();
  const navigate = useNavigate();

  const pharmId = currentUser.sourceId || 'SRC-PHARM-001';
  const pharmSource = sources.find((s) => s.id === pharmId);

  // Form Fields
  const [selectedMedId, setSelectedMedId] = useState<string>(medicines[0]?.id || '');
  const [customName, setCustomName] = useState('');
  const [medicineType, setMedicineType] = useState('Analgesic');
  const [strength, setStrength] = useState('500mg');
  const [batchNumber, setBatchNumber] = useState(`BT-${Date.now().toString().slice(-5)}`);
  const [quantity, setQuantity] = useState<number>(50);
  const [unit, setUnit] = useState('Tablets');
  const [expiryDate, setExpiryDate] = useState('2027-12-31');
  const [prescriptionRequired, setPrescriptionRequired] = useState(false);
  const [unitPrice, setUnitPrice] = useState<number>(45);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If central med is selected, update default attributes
  const handleMedSelect = (medId: string) => {
    setSelectedMedId(medId);
    if (medId !== 'CUSTOM') {
      const found = medicines.find((m) => m.id === medId);
      if (found) {
        setMedicineType(found.category || 'General');
        setStrength(found.dosage || 'Standard');
        setPrescriptionRequired(Boolean(found.prescriptionRequired));
        setUnitPrice((found as any).pricePerUnit || 50);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    let medName = customName.trim();
    let medId = selectedMedId;

    if (selectedMedId !== 'CUSTOM') {
      const found = medicines.find((m) => m.id === selectedMedId);
      if (found) medName = found.name;
    }

    // Validation
    if (!medName) {
      setErrorMessage('Medicine name is required. Please select a medicine or enter a custom name.');
      return;
    }

    if (!batchNumber.trim()) {
      setErrorMessage('Batch number is required for tracking and quality verification.');
      return;
    }

    if (isNaN(quantity) || quantity < 0) {
      setErrorMessage('Available quantity must be 0 or a positive number.');
      return;
    }

    if (!expiryDate) {
      setErrorMessage('Expiry date is required.');
      return;
    }

    const expTime = new Date(expiryDate).getTime();
    if (isNaN(expTime)) {
      setErrorMessage('Please enter a valid expiry date (YYYY-MM-DD).');
      return;
    }

    // Check duplicate active inventory record for same pharmacy + medicine + batch
    const duplicate = inventory.find(
      (i) =>
        i.sourceId === pharmId &&
        i.batchNumber.toLowerCase() === batchNumber.trim().toLowerCase() &&
        i.medicineName.toLowerCase() === medName.toLowerCase()
    );

    if (duplicate) {
      setErrorMessage(
        `An inventory record already exists for batch "${batchNumber}" of "${medName}". Please use "Update Stock" to adjust quantity.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      addInventoryItem({
        medicineId: medId === 'CUSTOM' ? `MED-${Date.now()}` : medId,
        medicineName: medName,
        sourceId: pharmId,
        sourceName: pharmSource?.name || currentUser.name,
        sourceType: 'PHARMACY',
        quantity,
        batchNumber: batchNumber.trim(),
        expiryDate,
        unitPrice,
        pricePerUnit: unitPrice,
        unit,
        dosage: strength,
        medicineType,
        prescriptionRequired,
      });

      setIsSubmitting(false);
      navigate('/pharmacy/inventory');
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Failed to add medicine to inventory.');
    }
  };

  return (
    <ConsoleLayout>
      <div style={{ padding: '24px 28px', maxWidth: 800, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
        
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
          {/* Form Header */}
          <div style={{
            padding: '24px 32px', background: 'linear-gradient(135deg, #0d9488, #0f766e)',
            color: '#fff', display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Plus style={{ width: 22, height: 22, color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 2px', letterSpacing: '-0.02em' }}>
                Add New Medicine to Stock
              </h1>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', margin: 0 }}>
                {pharmSource?.name || currentUser.name} · Live Database Entry
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

            {/* Medicine Selection */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Select Medicine from Central Catalog <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                value={selectedMedId}
                onChange={(e) => handleMedSelect(e.target.value)}
                style={{
                  width: '100%', padding: '11px 14px', fontSize: 13.5, fontWeight: 600,
                  borderRadius: 9, border: '1.5px solid #cbd5e1', outline: 'none', background: '#fafbfc',
                  color: '#0f172a',
                }}
              >
                {medicines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.genericName || m.category})
                  </option>
                ))}
                <option value="CUSTOM">+ Enter Custom Medicine Name</option>
              </select>
            </div>

            {selectedMedId === 'CUSTOM' && (
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Custom Medicine Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paracetamol 650mg, Amoxicillin 500mg..."
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', fontSize: 13, borderRadius: 9,
                    border: '1.5px solid #cbd5e1', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            {/* Grid 2 Columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Medicine Type / Category
                </label>
                <select
                  value={medicineType}
                  onChange={(e) => setMedicineType(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', fontSize: 13, borderRadius: 9,
                    border: '1.5px solid #cbd5e1', outline: 'none', background: '#fafbfc',
                  }}
                >
                  <option value="Analgesic">Analgesic &amp; Antipyretic</option>
                  <option value="Antibiotic">Antibiotic</option>
                  <option value="Cardiac">Emergency Cardiac</option>
                  <option value="Antiviral">Antiviral</option>
                  <option value="Diabetic">Diabetic Care</option>
                  <option value="Respiratory">Respiratory Care</option>
                  <option value="Anticoagulant">Anticoagulant</option>
                  <option value="General">General Supply</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Strength / Dosage
                </label>
                <input
                  type="text"
                  placeholder="e.g. 500mg, 10mg/ml"
                  value={strength}
                  onChange={(e) => setStrength(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', fontSize: 13, borderRadius: 9,
                    border: '1.5px solid #cbd5e1', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Grid 2 Columns: Batch & Unit */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Batch Number <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. BATCH-2026-001"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', fontSize: 13, fontFamily: 'monospace',
                    fontWeight: 700, borderRadius: 9, border: '1.5px solid #cbd5e1', outline: 'none',
                    boxSizing: 'border-box', color: '#1e40af',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Unit Form
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', fontSize: 13, borderRadius: 9,
                    border: '1.5px solid #cbd5e1', outline: 'none', background: '#fafbfc',
                  }}
                >
                  <option value="Tablets">Tablets</option>
                  <option value="Strips">Strips</option>
                  <option value="Vials">Vials</option>
                  <option value="Bottles">Bottles</option>
                  <option value="Injections">Injections</option>
                  <option value="Boxes">Boxes</option>
                </select>
              </div>
            </div>

            {/* Grid 3 Columns: Quantity, Expiry, Price */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Quantity <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
                  style={{
                    width: '100%', padding: '10px 14px', fontSize: 14, fontWeight: 700,
                    borderRadius: 9, border: '1.5px solid #cbd5e1', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Expiry Date <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  style={{
                    width: '100%', padding: '9.5px 14px', fontSize: 13, borderRadius: 9,
                    border: '1.5px solid #cbd5e1', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Unit Price (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                  style={{
                    width: '100%', padding: '10px 14px', fontSize: 14, fontWeight: 700,
                    borderRadius: 9, border: '1.5px solid #cbd5e1', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Prescription Checkbox */}
            <div style={{
              background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0',
              display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                id="rxToggle"
                checked={prescriptionRequired}
                onChange={(e) => setPrescriptionRequired(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: '#0d9488', cursor: 'pointer' }}
              />
              <label htmlFor="rxToggle" style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}>
                Prescription Required for Collection (Rx)
                <span style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#64748b', marginTop: 2 }}>
                  Check this box if customers must present a valid medical prescription when picking up this medicine.
                </span>
              </label>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: 12, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
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
                disabled={isSubmitting}
                style={{
                  padding: '11px 24px', background: '#0d9488', color: '#fff',
                  fontWeight: 800, fontSize: 13.5, border: 'none', borderRadius: 10,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 10px rgba(13,148,136,0.3)',
                }}
              >
                {isSubmitting ? 'Saving to Database...' : 'Save Medicine to Stock'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </ConsoleLayout>
  );
};
