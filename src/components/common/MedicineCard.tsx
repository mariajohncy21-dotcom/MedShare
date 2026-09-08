import React, { useState } from 'react';
import { Medicine, MedicalSource, InventoryItem } from '../../types';
import { calculateDistanceKm } from '../../services/smartAllocation';
import { DEFAULT_LAT, DEFAULT_LON } from '../../data/mockData';
import {
  Building2,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Pill,
  Sparkles,
  Phone,
  Navigation,
} from 'lucide-react';

interface MedicineCardProps {
  medicine: Medicine;
  inventory: InventoryItem[];
  sources: MedicalSource[];
  userLat?: number;
  userLon?: number;
  onSelectMedicine?: (med: Medicine) => void;
  onOpenReserve?: (med: Medicine, source: MedicalSource) => void;
  onOpenDirections?: (source: MedicalSource, med: Medicine, availableQty: number) => void;
}

export const MedicineCard: React.FC<MedicineCardProps> = ({
  medicine,
  inventory,
  sources,
  userLat = DEFAULT_LAT,
  userLon = DEFAULT_LON,
  onSelectMedicine,
  onOpenReserve,
  onOpenDirections,
}) => {
  const [showStockModal, setShowStockModal] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Compute live stock across active verified pharmacies
  const activeSources = sources.filter(
    (s) => !s.isDeleted && s.accountStatus === 'ACTIVE' && s.verificationStatus === 'APPROVED'
  );

  const activeSourceMap = new Map<string, MedicalSource>();
  activeSources.forEach((s) => activeSourceMap.set(s.id, s));

  // Find inventory lines for this medicine
  const medInventory = inventory.filter((inv) => inv.medicineId === medicine.id && inv.quantity > 0);
  const totalStock = medInventory.reduce((sum, item) => sum + item.quantity, 0);

  // Pharmacies that carry this medicine
  const stockingPharmacies = medInventory
    .map((inv) => {
      const source = activeSourceMap.get(inv.sourceId);
      if (!source) return null;
      const distanceKm = calculateDistanceKm(userLat, userLon, source.latitude, source.longitude);
      return {
        source,
        inventoryItem: inv,
        distanceKm,
      };
    })
    .filter((item): item is { source: MedicalSource; inventoryItem: InventoryItem; distanceKm: number } => item !== null)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'ANTIVIRAL':
        return { bg: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' };
      case 'EMERGENCY_CARDIAC':
        return { bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' };
      case 'ANTIBIOTIC':
        return { bg: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' };
      case 'ANTICOAGULANT':
        return { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' };
      case 'DIABETIC_CRITICAL':
        return { bg: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500' };
      case 'RESPIRATORY_EMERGENCY':
        return { bg: 'bg-cyan-50 text-cyan-700 border-cyan-200', dot: 'bg-cyan-500' };
      default:
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
    }
  };

  const categoryStyle = getCategoryColor(medicine.category);

  return (
    <>
      <div className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all duration-200 flex flex-col overflow-hidden h-full">
        {/* RECTANGULAR HIGH-RES IMAGE CONTAINER */}
        <div className="relative w-full h-48 sm:h-52 bg-gradient-to-tr from-slate-100 to-slate-200 overflow-hidden flex-shrink-0">
          {!imgError && medicine.sampleImageUrl ? (
            <img
              src={medicine.sampleImageUrl}
              alt={medicine.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-600 p-4">
              <Pill className="w-12 h-12 stroke-[1.5] mb-2 text-blue-500 opacity-80" />
              <span className="text-xs font-bold text-slate-700 text-center">{medicine.name}</span>
              <span className="text-[10px] text-slate-500">{medicine.dosage}</span>
            </div>
          )}

          {/* Gradient protection overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-black/20 pointer-events-none" />

          {/* Top category & dosage tags */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border backdrop-blur-md shadow-xs flex items-center gap-1.5 ${categoryStyle.bg}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${categoryStyle.dot}`} />
              {medicine.category.replace('_', ' ')}
            </span>

            <span className="px-2 py-0.5 rounded-md bg-slate-900/80 text-white text-[10px] font-bold backdrop-blur-md border border-white/20">
              {medicine.dosage}
            </span>
          </div>

          {/* Bottom stock pill on image */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold shadow-sm backdrop-blur-md flex items-center gap-1.5 ${
                totalStock > 0
                  ? 'bg-emerald-600/90 text-white border border-emerald-400/40'
                  : 'bg-rose-600/90 text-white border border-rose-400/40'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${totalStock > 0 ? 'bg-emerald-300 animate-pulse' : 'bg-rose-200'}`}
              />
              {totalStock > 0 ? `${totalStock} ${medicine.unit} Live` : 'Out of Stock'}
            </span>

            <span className="text-[10px] font-semibold text-slate-200 bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-sm">
              {stockingPharmacies.length} Facilities
            </span>
          </div>
        </div>

        {/* CARD CONTENT BODY */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h3
              className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug line-clamp-1 group-hover:text-blue-600 transition-colors"
              title={medicine.name}
            >
              {medicine.name}
            </h3>

            <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-0.5" title={medicine.genericName}>
              {medicine.genericName}
            </p>

            <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
              {medicine.description}
            </p>

            {/* PHARMACIES PREVIEW CHIPS */}
            <div className="mt-3 pt-2.5 border-t border-slate-100">
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 mb-1.5 uppercase">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Available At:</span>
              </div>

              {stockingPharmacies.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {stockingPharmacies.slice(0, 2).map((item) => (
                    <span
                      key={item.source.id}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md border border-blue-100"
                    >
                      <MapPin className="w-2.5 h-2.5 text-blue-500" />
                      <span className="truncate max-w-[120px]">{item.source.name.split('–')[0].trim()}</span>
                      <span className="text-slate-400">({item.distanceKm}km)</span>
                    </span>
                  ))}
                  {stockingPharmacies.length > 2 && (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                      +{stockingPharmacies.length - 2} more
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> No pharmacy currently has stock
                </p>
              )}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (onSelectMedicine) {
                  onSelectMedicine(medicine);
                } else {
                  setShowStockModal(true);
                }
              }}
              className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Find Pharmacies</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {stockingPharmacies.length > 0 && (
              <button
                type="button"
                onClick={() => setShowStockModal(true)}
                title="View full pharmacy stock list"
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* QUICK PHARMACY AVAILABILITY POPUP MODAL */}
      {showStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/80">
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 flex-shrink-0 shadow-xs">
                  {medicine.sampleImageUrl && !imgError ? (
                    <img src={medicine.sampleImageUrl} alt={medicine.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-blue-600">
                      <Pill className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900">{medicine.name}</h2>
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-extrabold">
                      {medicine.dosage}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{medicine.genericName}</p>
                  <p className="text-xs font-bold text-emerald-700 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {totalStock} {medicine.unit} available across {stockingPharmacies.length} verified facilities in Tisaiyanvilai
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowStockModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Pharmacies List */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1 divide-y divide-slate-100">
              {stockingPharmacies.length === 0 ? (
                <div className="py-10 text-center text-slate-500">
                  <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
                  <p className="font-bold text-sm text-slate-800">No pharmacy currently has stock</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Please use the Emergency Request feature to broadcast urgent requirement to regional trauma centers.
                  </p>
                </div>
              ) : (
                stockingPharmacies.map(({ source, inventoryItem, distanceKm }) => (
                  <div
                    key={source.id}
                    className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 p-2.5 rounded-2xl transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">{source.name}</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Verified
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{source.address}</span>
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-600 pt-0.5">
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                          📍 {distanceKm} km away
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {source.operatingHours}
                        </span>
                        <span className="text-slate-500">
                          Batch: <strong className="text-slate-700">{inventoryItem.batchNumber}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 inline-block">
                          {inventoryItem.quantity} {medicine.unit} In Stock
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {onOpenDirections && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowStockModal(false);
                              onOpenDirections(source, medicine, inventoryItem.quantity);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Get route directions on map"
                          >
                            <Navigation className="w-3 h-3 text-blue-600" />
                            <span>Route</span>
                          </button>
                        )}

                        <a
                          href={`tel:${source.phone}`}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Call pharmacy"
                        >
                          <Phone className="w-3 h-3 text-teal-600" />
                          <span>Call</span>
                        </a>

                        {onOpenReserve && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowStockModal(false);
                              onOpenReserve(medicine, source);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-1 cursor-pointer shadow-xs transition-colors"
                          >
                            <span>Reserve</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>Verified under State Drug Controller Network • Tisaiyanvilai (627657)</span>
              <button
                type="button"
                onClick={() => setShowStockModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
