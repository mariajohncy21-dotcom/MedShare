import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { EmergencyRequest } from '../types';
import {
  AlertOctagon,
  Radio,
  Clock,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Phone,
  Hospital,
  Building2,
  Send,
  Zap,
  Activity,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const EmergencyRequestPage: React.FC = () => {
  const { medicines, sources, emergencyRequests, createEmergencyRequest } = useApp();
  const navigate = useNavigate();

  const [patientName, setPatientName] = useState('Karthik N. (ICU Ward 4)');
  const [patientPhone, setPatientPhone] = useState('+91 94431 88990');
  const [selectedMedicineId, setSelectedMedicineId] = useState('MED-04'); // Anti-Snake Venom
  const [quantity, setQuantity] = useState(5);
  const [locationName, setLocationName] = useState('Udangudi Road, Tisaiyanvilai (627657)');
  const [urgency, setUrgency] = useState<'URGENT' | 'CRITICAL'>('CRITICAL');
  const [additionalNotes, setAdditionalNotes] = useState('Severe Russell Viper envenomation. Immediate antivenom perfusion required.');

  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [activeCreatedRequest, setActiveCreatedRequest] = useState<EmergencyRequest | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBroadcasting(true);

    const selectedMed = medicines.find((m) => m.id === selectedMedicineId);

    setTimeout(() => {
      const created = createEmergencyRequest({
        patientName,
        patientPhone,
        medicineId: selectedMedicineId,
        medicineName: selectedMed?.name || 'Anti-Snake Venom (Polyvalent ASV)',
        quantity,
        urgency,
        location: locationName,
        additionalNotes,
      });

      setActiveCreatedRequest(created);
      setIsBroadcasting(false);

      try {
        confetti({
          particleCount: 80,
          spread: 60,
          colors: ['#DC2626', '#EF4444', '#F87171'],
        });
      } catch (_) {}
    }, 900);
  };

  const selectedMed = medicines.find((m) => m.id === selectedMedicineId);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Red Emergency Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-red-700 via-red-600 to-rose-700 text-white shadow-xl shadow-red-600/20 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              🚨 Emergency Medicine Request Portal
            </h1>
            <p className="text-xs sm:text-sm text-red-100 max-w-2xl leading-relaxed">
              Instantly broadcast life-critical medicine shortages directly to on-duty hospital dispensaries, ICU supply officers, and 24/7 emergency pharmacies across your regional network.
            </p>
          </div>
          <div className="flex-shrink-0">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-black/30 border border-white/20 text-xs font-mono font-bold text-white">
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Response SLA: &lt; 3 mins</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Request Form */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-md border border-slate-200 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                <h3 className="font-black text-slate-900 text-base">Broadcast Parameters</h3>
              </div>
              <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                Direct Telemetry
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Patient or Case Identifier</label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Target Critical Medicine</label>
                  <select
                    value={selectedMedicineId}
                    onChange={(e) => setSelectedMedicineId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-red-500"
                  >
                    {medicines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.dosage})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Required Quantity ({selectedMed?.unit})</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-black text-slate-900 focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Urgency Level</label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-red-300 bg-red-50 text-red-800 font-black"
                  >
                    <option value="CRITICAL">🔴 Critical (ICU / Code Red)</option>
                    <option value="URGENT">🟡 Urgent (within 2 Hours)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Contact Number (Physician / ICU)</label>
                  <input
                    type="text"
                    required
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Facility / Patient Pickup Location</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Clinical Brief / Emergency Reason</label>
                <textarea
                  rows={3}
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-medium text-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={isBroadcasting}
                className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm shadow-xl shadow-red-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Radio className={`w-4 h-4 ${isBroadcasting ? 'animate-spin' : ''}`} />
                <span>{isBroadcasting ? 'Broadcasting to Tisaiyanvilai Grid...' : 'Broadcast Emergency Need Now'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right: Broadcast Feed */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-200 space-y-4">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-600" />
              <span>Active District Emergency Stream ({emergencyRequests.length})</span>
            </h3>

            <div className="space-y-3">
              {emergencyRequests.map((req) => (
                <div key={req.id} className="p-4 rounded-2xl bg-red-50/70 border border-red-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-red-700">{req.id}</span>
                    <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black">
                      {req.urgency}
                    </span>
                  </div>
                  <h4 className="font-black text-slate-900">{req.medicineName} ({req.quantity} units)</h4>
                  <p className="text-slate-600 font-semibold">{req.patientName}</p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" /> {req.location}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
