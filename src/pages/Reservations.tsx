import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ReservationStatus } from '../types';
import { CountdownTimer } from '../components/common/CountdownTimer';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  XCircle,
  QrCode,
  MapPin,
  Phone,
  ShieldCheck,
  AlertTriangle,
  Building2,
  Hospital,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const Reservations: React.FC = () => {
  const { reservations, updateReservationStatus, cancelReservation } = useApp();
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'COLLECTED' | 'EXPIRED'>('ALL');
  const [expandedResId, setExpandedResId] = useState<string | null>(null);
  const [selectedQRReservation, setSelectedQRReservation] = useState<string | null>(null);

  const filteredReservations = reservations.filter((res) => {
    if (filterStatus === 'ACTIVE') return res.status === 'CONFIRMED' || res.status === 'PENDING';
    if (filterStatus === 'COLLECTED') return res.status === 'COLLECTED';
    if (filterStatus === 'EXPIRED') return res.status === 'EXPIRED' || res.status === 'CANCELLED';
    return true;
  });

  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Confirmed Hold
          </span>
        );
      case 'COLLECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <CheckCircle2 className="w-3 h-3" /> Collected ✓
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <Clock className="w-3 h-3" /> Expired
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
    }
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            My Medicine Reservations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time tracking of active 15-minute emergency stock guarantees and pickup codes.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200 self-start sm:self-auto text-xs">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filterStatus === 'ALL' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({reservations.length})
          </button>
          <button
            onClick={() => setFilterStatus('ACTIVE')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filterStatus === 'ACTIVE' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilterStatus('COLLECTED')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filterStatus === 'COLLECTED' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Collected
          </button>
          <button
            onClick={() => setFilterStatus('EXPIRED')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filterStatus === 'EXPIRED' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* RESERVATIONS LIST */}
      {filteredReservations.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No reservations found in this view</h3>
          <p className="text-xs text-slate-400">Search for medicine to create a 15-minute emergency hold.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReservations.map((res) => {
            const isExpanded = expandedResId === res.id;
            const isActive = res.status === 'CONFIRMED' || res.status === 'PENDING';

            return (
              <div
                key={res.id}
                className={`bg-white rounded-3xl p-6 shadow-sm border transition-all ${
                  isActive ? 'border-blue-300 shadow-md ring-1 ring-blue-100' : 'border-slate-200'
                }`}
              >
                {/* Main Card Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                        {res.id}
                      </span>
                      {getStatusBadge(res.status)}
                      <span className="text-[10px] text-slate-400 font-medium">
                        Reserved {new Date(res.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h3 className="text-lg font-extrabold text-slate-900 pt-1">
                      {res.medicineName}
                    </h3>
                    <p className="text-xs text-slate-600">
                      Total Reserved: <strong className="text-blue-700 font-extrabold">{res.totalQuantity} units</strong> across{' '}
                      <strong>{res.allocationBreakdown.length} verified location(s)</strong>.
                    </p>
                  </div>

                  {/* Countdown Timer or Completed Badge */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    {isActive && (
                      <CountdownTimer
                        expiresAt={res.expiresAt}
                        onExpire={() => updateReservationStatus(res.id, 'EXPIRED')}
                      />
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedQRReservation(res.qrToken)}
                        className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Pickup Pass</span>
                      </button>

                      {isActive && (
                        <button
                          onClick={() => {
                            if (confirm(`Confirm physical collection of reservation ${res.id}?`)) {
                              updateReservationStatus(res.id, 'COLLECTED');
                            }
                          }}
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                        >
                          Mark Collected
                        </button>
                      )}

                      <button
                        onClick={() => setExpandedResId(isExpanded ? null : res.id)}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Multi-Location Pickup Details */}
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                    <span>Pickup Dispensaries & Quantities</span>
                    <span>Patient: {res.userName} ({res.userPhone})</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {res.allocationBreakdown.map((loc, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 truncate pr-2">{loc.sourceName}</span>
                          <span className="font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded flex-shrink-0">
                            {loc.quantity} units
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 flex items-start gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{loc.address}</span>
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                          <span className="text-slate-600 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {loc.phone}
                          </span>
                          <span className="font-bold text-emerald-700">
                            {loc.sourceStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {isActive && (
                    <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
                      <span>Show this reservation ID at the counter along with your original prescription.</span>
                      <button
                        onClick={() => {
                          if (confirm(`Cancel active reservation ${res.id}? Reserved units will be released back.`)) {
                            cancelReservation(res.id);
                          }
                        }}
                        className="text-red-600 hover:underline font-semibold cursor-pointer"
                      >
                        Cancel Reservation
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code / Digital Verification Modal */}
      {selectedQRReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-1">MedShare Digital Pickup Pass</h3>
            <p className="text-xs text-slate-500 mb-4">Present to pharmacy or hospital counter</p>

            {/* QR Visual */}
            <div className="w-48 h-48 mx-auto bg-slate-900 rounded-2xl p-4 flex flex-col items-center justify-center text-white shadow-inner mb-4">
              <QrCode className="w-32 h-32 text-blue-400" />
              <span className="font-mono text-[10px] text-slate-300 mt-2 tracking-widest truncate max-w-full px-2">
                {selectedQRReservation}
              </span>
            </div>

            <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-800 font-semibold mb-4 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Cryptographically Verified Hold</span>
            </div>

            <button
              onClick={() => setSelectedQRReservation(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
            >
              Close Pass
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
