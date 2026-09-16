import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import { Medicine } from '../../types';
import {
  BookOpen, Search, Plus, Filter, AlertTriangle, ShieldCheck,
  Package, Tag, Activity, X, ChevronRight
} from 'lucide-react';

export const AdminMedicinesPage: React.FC = () => {
  const { medicines, inventory } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [inspectMed, setInspectMed] = useState<Medicine | null>(null);

  // Add Medicine Form state
  const [newName, setNewName] = useState('');
  const [newGeneric, setNewGeneric] = useState('');
  const [newCategory, setNewCategory] = useState('ANALGESIC_ANTIPYRETIC');
  const [newDosage, setNewDosage] = useState('500mg');
  const [newUnit, setNewUnit] = useState('Tablets');
  const [newCritical, setNewCritical] = useState('10');
  const [newLow, setNewLow] = useState('30');
  const [newDemand, setNewDemand] = useState('25');
  const [newPrescription, setNewPrescription] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [customMedicines, setCustomMedicines] = useState<Medicine[]>([]);

  const allMedicines = useMemo(() => {
    return [...medicines, ...customMedicines];
  }, [medicines, customMedicines]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(allMedicines.map(m => m.category)));
    return ['ALL', ...cats];
  }, [allMedicines]);

  const filteredMedicines = useMemo(() => {
    return allMedicines.filter(m => {
      const matchCat = selectedCategory === 'ALL' || m.category === selectedCategory;
      const matchSearch = !searchQuery ||
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.dosage.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [allMedicines, selectedCategory, searchQuery]);

  const getAvailableStockTotal = (medicineId: string) => {
    return inventory
      .filter(i => i.medicineId === medicineId)
      .reduce((sum, i) => sum + i.quantity, 0);
  };

  const handleAddMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newGeneric.trim()) return;

    const med: Medicine = {
      id: `MED-ADM-${Date.now().toString().slice(-5)}`,
      name: newName.trim(),
      genericName: newGeneric.trim(),
      category: newCategory,
      dosage: newDosage.trim(),
      unit: newUnit.trim(),
      description: newDesc.trim() || `${newName} (${newGeneric}) emergency formulation.`,
      criticalThreshold: parseInt(newCritical) || 10,
      lowThreshold: parseInt(newLow) || 30,
      averageDailyDemand: parseInt(newDemand) || 20,
      prescriptionRequired: newPrescription,
    };

    setCustomMedicines(prev => [med, ...prev]);
    setIsAddModalOpen(false);
    setNewName('');
    setNewGeneric('');
    setNewDesc('');
  };

  return (
    <ConsoleLayout>
      <div style={{ padding: '24px 28px', maxWidth: 1300, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <BookOpen style={{ width: 26, height: 26, color: '#2563eb' }} />
              Master Emergency Medicine Catalog
            </h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              Standardized drug formulary, dosage units, safety thresholds, and daily demand baselines.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', borderRadius: 10,
              background: '#2563eb', color: '#fff', border: 'none',
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
            }}
          >
            <Plus style={{ width: 16, height: 16 }} />
            Add to Master Catalog
          </button>
        </div>

        {/* Catalog Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0, fontWeight: 600 }}>Total Formulations</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '4px 0 0' }}>{allMedicines.length}</p>
          </div>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #bfdbfe', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#1d4ed8', margin: 0, fontWeight: 600 }}>Categories Covered</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#1d4ed8', margin: '4px 0 0' }}>{categories.length - 1}</p>
          </div>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #fecaca', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#dc2626', margin: 0, fontWeight: 600 }}>Prescription Restricted</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#dc2626', margin: '4px 0 0' }}>
              {allMedicines.filter(m => m.prescriptionRequired).length}
            </p>
          </div>
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 12, border: '1px solid #fed7aa', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 12, color: '#c2410c', margin: 0, fontWeight: 600 }}>Cardiac & Emergency</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: '#c2410c', margin: '4px 0 0' }}>
              {allMedicines.filter(m => m.category === 'EMERGENCY_CARDIAC' || m.category === 'RESPIRATORY_EMERGENCY').length}
            </p>
          </div>
        </div>

        {/* Filters and Search */}
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
              placeholder="Search by brand name, generic chemical name, or dosage..."
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
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={{
                padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
                background: '#f8fafc', fontSize: 13, fontWeight: 600, color: '#334155',
                outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="ALL">All Categories</option>
              {categories.filter(c => c !== 'ALL').map(c => (
                <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Medicines Table */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Medicine Name</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Category</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Dosage & Packaging</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Safety Thresholds</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>Cluster Units</th>
                  <th style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#64748b', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMedicines.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                      No medicines match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredMedicines.map(med => {
                    const totalStock = getAvailableStockTotal(med.id);
                    return (
                      <tr key={med.id} style={{ borderBottom: '1px solid #f1f5f9' }} onMouseEnter={e => e.currentTarget.style.background = '#fafafa'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                        <td style={{ padding: '14px 18px' }}>
                          <div>
                            <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: '#0f172a' }}>
                              {med.name}
                            </p>
                            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                              {med.genericName}
                            </p>
                            {med.prescriptionRequired && (
                              <span style={{ fontSize: 9.5, fontWeight: 800, color: '#dc2626', background: '#fef2f2', padding: '1px 5px', borderRadius: 4, marginTop: 4, display: 'inline-block' }}>
                                Prescription (Rx)
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            padding: '3px 8px', borderRadius: 6,
                            background: '#f1f5f9', color: '#334155',
                            fontSize: 11, fontWeight: 700,
                          }}>
                            {med.category.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontSize: 12.5, color: '#334155' }}>
                            <strong>{med.dosage}</strong> · {med.unit}
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontSize: 12, color: '#475569' }}>
                            <div>Critical: <strong style={{ color: '#dc2626' }}>&lt; {med.criticalThreshold}</strong></div>
                            <div>Low: <strong style={{ color: '#d97706' }}>&lt; {med.lowThreshold}</strong></div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            fontSize: 13, fontWeight: 800,
                            color: totalStock <= med.criticalThreshold ? '#dc2626' : totalStock <= med.lowThreshold ? '#d97706' : '#059669',
                          }}>
                            {totalStock} units
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <button
                            onClick={() => setInspectMed(med)}
                            style={{
                              padding: '6px 12px', borderRadius: 7,
                              background: '#f8fafc', border: '1px solid #e2e8f0',
                              color: '#334155', fontSize: 12, fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Details
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

        {/* Medicine Details Modal */}
        {inspectMed && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
          }}>
            <div style={{
              background: '#fff', borderRadius: 16, maxWidth: 520, width: '100%',
              padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', position: 'relative',
            }}>
              <button
                onClick={() => setInspectMed(null)}
                style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X style={{ width: 20, height: 20 }} />
              </button>
              <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                Formulation: {inspectMed.name}
              </h3>
              <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
                <div><strong>Generic Composition:</strong> {inspectMed.genericName}</div>
                <div><strong>Category:</strong> {inspectMed.category.replace(/_/g, ' ')}</div>
                <div><strong>Standard Dosage:</strong> {inspectMed.dosage}</div>
                <div><strong>Unit Packaging:</strong> {inspectMed.unit}</div>
                <div><strong>Critical Emergency Threshold:</strong> {inspectMed.criticalThreshold} units</div>
                <div><strong>Low Stock Warning Threshold:</strong> {inspectMed.lowThreshold} units</div>
                <div><strong>Average Daily Demand (Tisaiyanvilai):</strong> {inspectMed.averageDailyDemand} units/day</div>
                <div><strong>Prescription Required (Rx):</strong> {inspectMed.prescriptionRequired ? 'YES' : 'NO'}</div>
                <div><strong>Description:</strong> {inspectMed.description}</div>
              </div>
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  onClick={() => setInspectMed(null)}
                  style={{ padding: '8px 16px', borderRadius: 8, background: '#f1f5f9', color: '#334155', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Medicine Modal */}
        {isAddModalOpen && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
          }}>
            <form onSubmit={handleAddMedicine} style={{
              background: '#fff', borderRadius: 16, maxWidth: 520, width: '100%',
              padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', position: 'relative',
            }}>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X style={{ width: 20, height: 20 }} />
              </button>
              <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                Add Medicine to Master Formulary
              </h3>
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Brand / Commercial Name</label>
                  <input
                    type="text" required
                    value={newName} onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. Paracetamol 500 or Augmentin 625"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Generic Chemical Name</label>
                  <input
                    type="text" required
                    value={newGeneric} onChange={e => setNewGeneric(e.target.value)}
                    placeholder="e.g. Acetaminophen or Amoxicillin + Clavulanate"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Category</label>
                    <select
                      value={newCategory} onChange={e => setNewCategory(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box', background: '#fff' }}
                    >
                      <option value="ANALGESIC_ANTIPYRETIC">Pain & Fever</option>
                      <option value="ANTIBIOTIC">Antibiotics</option>
                      <option value="EMERGENCY_CARDIAC">Cardiac Care</option>
                      <option value="DIABETIC_CRITICAL">Diabetic Care</option>
                      <option value="RESPIRATORY_EMERGENCY">Respiratory</option>
                      <option value="ANTIVIRAL">Antiviral</option>
                      <option value="ANTICOAGULANT">Anticoagulant</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Dosage</label>
                    <input
                      type="text" required
                      value={newDosage} onChange={e => setNewDosage(e.target.value)}
                      placeholder="e.g. 500mg, 10ml, 5mg/ml"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Critical Threshold</label>
                    <input
                      type="number" required
                      value={newCritical} onChange={e => setNewCritical(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Low Threshold</label>
                    <input
                      type="number" required
                      value={newLow} onChange={e => setNewLow(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={newPrescription} onChange={e => setNewPrescription(e.target.checked)}
                      style={{ width: 16, height: 16 }}
                    />
                    Requires Doctor Prescription (Schedule H/H1 Drug)
                  </label>
                </div>
              </div>
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: 8, background: '#f1f5f9', color: '#334155', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: 8, background: '#2563eb', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  Save Formulation
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </ConsoleLayout>
  );
};
