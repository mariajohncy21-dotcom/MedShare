import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import { Plus, ArrowLeft, CheckCircle2, AlertCircle, Package, Calendar } from 'lucide-react';

export const HospitalAddMedicinePage: React.FC = () => {
  const { currentUser, medicines, addInventoryItem } = useApp();
  const navigate = useNavigate();

  const hospId = currentUser.sourceId || 'SRC-HOSP-001';

  const [formData, setFormData] = useState({
    medicineName: '',
    medicineId: '',
    dosage: '',
    category: 'Cardiology',
    batchNumber: `HOSP-B${Date.now().toString().slice(-4)}`,
    quantity: 100,
    unit: 'Units',
    expiryDate: '2027-12-31',
    prescriptionRequired: true,
    unitPrice: 25.0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When medicine is chosen from catalog, auto-fill details
  const handleMedicineSelect = (name: string) => {
    const med = medicines.find((m) => m.name.toLowerCase() === name.toLowerCase());
    if (med) {
      setFormData((prev) => ({
        ...prev,
        medicineName: med.name,
        medicineId: med.id,
        dosage: med.dosage || prev.dosage,
        category: med.category || prev.category,
        prescriptionRequired: Boolean(med.prescriptionRequired),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        medicineName: name,
        medicineId: `MED-${Date.now().toString().slice(-5)}`,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.medicineName.trim()) {
      setError('Please select or specify a medicine name.');
      return;
    }
    if (formData.quantity <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }
    if (!formData.batchNumber.trim()) {
      setError('Batch Number is required for drug traceability.');
      return;
    }
    if (!formData.expiryDate) {
      setError('Expiry date is mandatory.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      addInventoryItem({
        sourceId: hospId,
        sourceName: currentUser.name || 'Hospital Facility',
        sourceType: 'HOSPITAL',
        medicineId: formData.medicineId || `MED-${Date.now().toString().slice(-5)}`,
        medicineName: formData.medicineName.trim(),
        dosage: formData.dosage || 'Standard Dosage',
        medicineType: formData.category || 'Tablet',
        unit: formData.unit || 'Units',
        quantity: Number(formData.quantity),
        batchNumber: formData.batchNumber.trim(),
        expiryDate: formData.expiryDate,
        prescriptionRequired: formData.prescriptionRequired,
        unitPrice: Number(formData.unitPrice) || 0,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/hospital/inventory');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to add medicine item to inventory.');
      setIsSubmitting(false);
    }
  };

  return (
    <ConsoleLayout>
      <div style={{ padding: '24px 28px', maxWidth: 840, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
        
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
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f5f3ff', color: '#6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Add Medicine to Hospital Inventory
              </h1>
              <p style={{ fontSize: 13, color: '#64748b', margin: '3px 0 0' }}>
                Register new pharmaceutical batches for emergency care and ward distribution
              </p>
            </div>
          </div>
        </div>

        {success && (
          <div style={{
            padding: '16px 20px', background: '#ecfdf5', border: '1px solid #a7f3d0',
            borderRadius: 12, color: '#065f46', fontSize: 14, fontWeight: 700,
            marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <CheckCircle2 style={{ width: 20, height: 20, color: '#059669' }} />
            Medicine registered successfully! Returning to inventory...
          </div>
        )}

        {error && (
          <div style={{
            padding: '14px 18px', background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 12, color: '#dc2626', fontSize: 13, fontWeight: 600,
            marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <AlertCircle style={{ width: 18, height: 18 }} />
            {error}
          </div>
        )}

        {/* Form Card */}
        <div style={{
          background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden',
        }}>
          <form onSubmit={handleSubmit} style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Catalog Helper / Name */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
                Medicine Name *
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paracetamol, Glyceryl Trinitrate, Atorvastatin..."
                  value={formData.medicineName}
                  onChange={(e) => handleMedicineSelect(e.target.value)}
                  style={{
                    flex: 1, padding: '10px 14px', fontSize: 13.5,
                    border: '1.5px solid #e2e8f0', borderRadius: 9, outline: 'none',
                  }}
                />
                <select
                  onChange={(e) => handleMedicineSelect(e.target.value)}
                  style={{
                    padding: '10px 14px', fontSize: 13, border: '1.5px solid #e2e8f0',
                    borderRadius: 9, background: '#fafbfc', outline: 'none', color: '#475569',
                  }}
                >
                  <option value="">Choose Catalog...</option>
                  {medicines.map((m) => (
                    <option key={m.id} value={m.name}>{m.name} ({m.dosage || m.category})</option>
                  ))}
                </select>
              </div>
              <p style={{ fontSize: 11.5, color: '#94a3b8', margin: '4px 0 0' }}>
                Select an established catalog medicine or enter a specific institutional formulation.
              </p>
            </div>

            {/* Dosage & Category */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Strength &amp; Dosage (e.g. 500mg, 5ml Ampoule, 10% IV)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 500mg Tablet / 100ml Infusion"
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 9, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Therapeutic Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 9, background: '#fff', outline: 'none' }}
                >
                  <option value="Cardiology">Cardiology</option>
                  <option value="Emergency & ICU">Emergency &amp; ICU</option>
                  <option value="Antibiotics">Antibiotics &amp; Antimicrobial</option>
                  <option value="Respiratory">Respiratory</option>
                  <option value="Analgesics">Analgesics &amp; Pain Management</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Endocrinology">Endocrinology (Insulin / Diabetic)</option>
                  <option value="Trauma & Surgery">Trauma &amp; Surgery</option>
                </select>
              </div>
            </div>

            {/* Batch, Quantity, Unit */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 18 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Batch Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.batchNumber}
                  onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', fontSize: 13, fontFamily: 'monospace', border: '1.5px solid #e2e8f0', borderRadius: 9, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Initial Stock Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 0 })}
                  style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 9, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Unit of Measure
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 9, background: '#fff', outline: 'none' }}
                >
                  <option value="Units">Units / Pieces</option>
                  <option value="Strips">Strips (10 tabs)</option>
                  <option value="Bottles">Bottles</option>
                  <option value="Ampoules">Ampoules</option>
                  <option value="Vials">Vials</option>
                  <option value="Boxes">Boxes</option>
                </select>
              </div>
            </div>

            {/* Expiry Date & Price */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Batch Expiry Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 9, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Institutional Unit Cost (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 9, outline: 'none' }}
                />
              </div>
            </div>

            {/* Prescription Checkbox */}
            <div style={{
              background: '#f8fafc', padding: '14px 18px', borderRadius: 10,
              border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <input
                type="checkbox"
                id="prescriptionRequired"
                checked={formData.prescriptionRequired}
                onChange={(e) => setFormData({ ...formData, prescriptionRequired: e.target.checked })}
                style={{ width: 17, height: 17, accentColor: '#6d28d9', cursor: 'pointer' }}
              />
              <label htmlFor="prescriptionRequired" style={{ fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                Schedule H / H1 Prescription Required (Requires Physician Order for Dispensation)
              </label>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
              <Link
                to="/hospital/inventory"
                style={{
                  padding: '11px 20px', background: '#f1f5f9', border: '1px solid #e2e8f0',
                  borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#475569', textDecoration: 'none',
                }}
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '11px 24px', background: '#6d28d9', color: '#fff',
                  border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(109,40,217,0.3)',
                }}
              >
                {isSubmitting ? 'Saving to Inventory...' : 'Add Medicine to Stock'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ConsoleLayout>
  );
};
