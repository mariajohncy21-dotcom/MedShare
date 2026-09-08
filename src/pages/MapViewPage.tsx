import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MedMap } from '../components/map/MedMap';
import { RouteModal } from '../components/map/RouteModal';
import { calculateDistanceKm } from '../services/smartAllocation';
import { MedicalSource } from '../types';
import {
  MapPin,
  Search,
  ShieldCheck,
  Building2,
  Hospital,
  Filter,
  Navigation,
  LocateFixed,
  Phone,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Compass,
  ArrowRight,
  SlidersHorizontal,
  PackageCheck,
  RefreshCw,
} from 'lucide-react';

export const MapViewPage: React.FC = () => {
  const { sources, inventory, medicines } = useApp();

  // Filter States
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'PHARMACY' | 'HOSPITAL'>('ALL');
  const [radiusKm, setRadiusKm] = useState<number>(2); // Default to 2 km as requested
  const [selectedMedId, setSelectedMedId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(true);

  // User Coordinates (Default to Tisaiyanvilai center 627657)
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number }>({
    lat: 8.4184,
    lon: 77.8732,
  });
  const [isLocating, setIsLocating] = useState(false);
  const [gpsStatusMsg, setGpsStatusMsg] = useState<string | null>(null);

  // Route Navigation Modal State
  const [activeRouteSource, setActiveRouteSource] = useState<MedicalSource | null>(null);

  const selectedMed = medicines.find((m) => m.id === selectedMedId);

  // Non-deleted sources
  const activeSources = useMemo(() => {
    return sources.filter((s) => !s.isDeleted && s.accountStatus !== 'DELETED');
  }, [sources]);

  // Handle GPS detection
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser. Defaulting to Tisaiyanvilai center.');
      return;
    }
    setIsLocating(true);
    setGpsStatusMsg(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const distFromCenter = calculateDistanceKm(pos.coords.latitude, pos.coords.longitude, 8.4184, 77.8732);
        if (distFromCenter > 35) {
          // Remote GPS detected (>35 km away). Auto-center at Tisaiyanvilai demo region so 2km / 5km surrounding nodes are visible!
          setUserCoords({ lat: 8.4184, lon: 77.8732 });
          setIsLocating(false);
          setGpsStatusMsg(`📍 Live GPS detected (${Math.round(distFromCenter)} km away). Centered at Tisaiyanvilai so 2km/5km facilities show!`);
          setTimeout(() => setGpsStatusMsg(null), 4500);
        } else {
          setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          setIsLocating(false);
          setGpsStatusMsg('📍 Live GPS Coordinates Applied!');
          setTimeout(() => setGpsStatusMsg(null), 3000);
        }
      },
      (err) => {
        console.warn('GPS access error:', err);
        setIsLocating(false);
        setUserCoords({ lat: 8.4184, lon: 77.8732 });
        setGpsStatusMsg('Location permission unavailable. Centered at Tisaiyanvilai (627657).');
        setTimeout(() => setGpsStatusMsg(null), 3500);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Filtered facilities strictly based on Category & Radius & Medicine
  const filteredFacilities = useMemo(() => {
    return activeSources
      .map((s) => {
        const dist = calculateDistanceKm(userCoords.lat, userCoords.lon, s.latitude, s.longitude);
        const estMinutes = Math.max(2, Math.round(dist * 3.5));
        const facilityInventories = inventory.filter((i) => i.sourceId === s.id && i.quantity > 0);
        return {
          ...s,
          distanceKm: dist,
          estMinutes,
          availableStockCount: facilityInventories.reduce((acc, i) => acc + i.quantity, 0),
          batchCount: facilityInventories.length,
        };
      })
      .filter((s) => {
        // 1. Category Filter (ALL / PHARMACY / HOSPITAL)
        if (categoryFilter !== 'ALL' && s.type !== categoryFilter) return false;

        // 2. Verified Only Filter
        if (verifiedOnly && !s.isVerified) return false;

        // 3. Distance / Radius Filter (STRICT: only within radiusKm)
        if (radiusKm < 999 && s.distanceKm > radiusKm) return false;

        // 4. Medicine Filter
        if (selectedMedId !== 'ALL') {
          const hasMed = inventory.some(
            (inv) => inv.sourceId === s.id && inv.medicineId === selectedMedId && inv.quantity > 0
          );
          if (!hasMed) return false;
        }

        // 5. Search Text Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = s.name.toLowerCase().includes(q);
          const matchAddress = s.address.toLowerCase().includes(q);
          const matchPhone = s.phone.includes(q);
          const matchArea = s.area.toLowerCase().includes(q);
          if (!matchName && !matchAddress && !matchPhone && !matchArea) return false;
        }

        return true;
      })
      .sort((a, b) => a.distanceKm - b.distanceKm); // Closest first
  }, [activeSources, categoryFilter, verifiedOnly, radiusKm, selectedMedId, searchQuery, userCoords, inventory]);

  // Statistics for Category counters
  const totalCountAll = activeSources.filter((s) => (radiusKm < 999 ? calculateDistanceKm(userCoords.lat, userCoords.lon, s.latitude, s.longitude) <= radiusKm : true)).length;
  const totalPharmacies = activeSources.filter((s) => s.type === 'PHARMACY' && (radiusKm < 999 ? calculateDistanceKm(userCoords.lat, userCoords.lon, s.latitude, s.longitude) <= radiusKm : true)).length;
  const totalHospitals = activeSources.filter((s) => s.type === 'HOSPITAL' && (radiusKm < 999 ? calculateDistanceKm(userCoords.lat, userCoords.lon, s.latitude, s.longitude) <= radiusKm : true)).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Route Navigation Modal */}
      {activeRouteSource && (
        <RouteModal
          isOpen={Boolean(activeRouteSource)}
          onClose={() => setActiveRouteSource(null)}
          source={activeRouteSource}
          userLat={userCoords.lat}
          userLon={userCoords.lon}
          userLocationName="Tisaiyanvilai Center (627657)"
          distanceKm={calculateDistanceKm(userCoords.lat, userCoords.lon, activeRouteSource.latitude, activeRouteSource.longitude)}
          estimatedMinutes={Math.max(2, Math.round(calculateDistanceKm(userCoords.lat, userCoords.lon, activeRouteSource.latitude, activeRouteSource.longitude) * 3.5))}
          medicineName={selectedMed?.name}
        />
      )}

      {/* HEADER & CONTROLS */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Live Medical Facility & Medicine Map
            </h1>
            <p className="text-xs sm:text-sm text-blue-200/80 mt-1 max-w-2xl">
              Filter by facility category (Pharmacies or Hospitals) and distance radius (e.g. 2 km) to view available stock and navigate.
            </p>
          </div>

          {/* GPS Location Buttons */}
          <div className="flex flex-col items-start md:items-end gap-1.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={isLocating}
                className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all cursor-pointer"
              >
                <LocateFixed className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Detecting Location...' : '📍 Use Current GPS'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUserCoords({ lat: 8.4184, lon: 77.8732 });
                  setGpsStatusMsg('📍 Centered at Tisaiyanvilai Center (627657)');
                  setTimeout(() => setGpsStatusMsg(null), 2500);
                }}
                className="px-3 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-blue-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-white/10"
                title="Reset map center to Tisaiyanvilai 627657"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Center</span>
              </button>
            </div>
            <span className="text-[11px] text-blue-300/80">
              Center: {userCoords.lat.toFixed(4)}, {userCoords.lon.toFixed(4)} (Tisaiyanvilai 627657)
            </span>
            {gpsStatusMsg && (
              <span className="text-[11px] text-emerald-300 font-bold animate-pulse">{gpsStatusMsg}</span>
            )}
          </div>
        </div>

        {/* PRIMARY FILTER CONTROLS BAR */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 text-xs">
          {/* 1. Category Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="font-extrabold text-blue-200 uppercase tracking-wider text-[11px]">Category:</span>
            <div className="flex rounded-xl bg-slate-900/60 p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setCategoryFilter('ALL')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  categoryFilter === 'ALL'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-blue-200/80 hover:text-white'
                }`}
              >
                All Facilities ({totalCountAll})
              </button>

              <button
                type="button"
                onClick={() => setCategoryFilter('PHARMACY')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  categoryFilter === 'PHARMACY'
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'text-blue-200/80 hover:text-white'
                }`}
              >
                Pharmacies Only ({totalPharmacies})
              </button>

              <button
                type="button"
                onClick={() => setCategoryFilter('HOSPITAL')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  categoryFilter === 'HOSPITAL'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-blue-200/80 hover:text-white'
                }`}
              >
                Hospitals Only ({totalHospitals})
              </button>
            </div>
          </div>

          {/* 2. Radius Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="font-extrabold text-blue-200 uppercase tracking-wider text-[11px]">Radius:</span>
            <div className="flex rounded-xl bg-slate-900/60 p-1 border border-white/10">
              {[
                { r: 2, label: '≤ 2 km' },
                { r: 5, label: '≤ 5 km' },
                { r: 10, label: '≤ 10 km' },
                { r: 25, label: '≤ 25 km' },
                { r: 999, label: 'All Distances' },
              ].map(({ r, label }) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRadiusKm(r)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    radiusKm === r
                      ? 'bg-blue-500 text-white shadow-md font-extrabold'
                      : 'text-blue-200/80 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Medicine Filter */}
          <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-white/10">
            <Filter className="w-3.5 h-3.5 text-blue-300 shrink-0" />
            <span className="font-bold text-blue-200">Medicine:</span>
            <select
              value={selectedMedId}
              onChange={(e) => setSelectedMedId(e.target.value)}
              className="bg-transparent border-none text-white font-bold focus:ring-0 cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Medicines</option>
              {medicines.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                  {m.name} ({m.dosage})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* INTERACTIVE LEAFLET MAP */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-md border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Live Map View:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-extrabold">
              {filteredFacilities.length} {categoryFilter === 'ALL' ? 'Facilities' : categoryFilter === 'PHARMACY' ? 'Pharmacies' : 'Hospitals'} within {radiusKm === 999 ? 'all distances' : `${radiusKm} km`}
            </span>
          </div>

          {/* Search bar within Map View */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search facility name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
        </div>

        <MedMap
          sources={filteredFacilities}
          inventories={inventory}
          height="clamp(340px, 48vh, 500px)"
          showFilters={false}
          filterType={categoryFilter}
          onFilterTypeChange={setCategoryFilter}
          radiusKm={radiusKm}
          onRadiusKmChange={setRadiusKm}
          userCoords={userCoords}
          onUserCoordsChange={setUserCoords}
          verifiedOnly={verifiedOnly}
          onVerifiedOnlyChange={setVerifiedOnly}
          selectedMedicineName={selectedMed?.name}
          onSelectSource={(s) => setActiveRouteSource(s)}
        />
      </div>

      {/* FACILITIES DIRECTORY DOWN BELOW THE MAP (FILTERED EXACTLY BY CATEGORY & RADIUS, 4 CARDS PER ROW) */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              {categoryFilter === 'ALL'
                ? 'All Healthcare Facilities & Hospitals'
                : categoryFilter === 'PHARMACY'
                ? 'Pharmacies & Drug Stores'
                : 'Multi-Speciality Hospitals & Emergency Centers'}{' '}
              in Tisaiyanvilai (627657)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing strictly facilities within <strong className="text-blue-700 font-bold">{radiusKm === 999 ? 'all distances' : `${radiusKm} km radius`}</strong> ({filteredFacilities.length} matching nodes).
            </p>
          </div>

          {/* Active Filter Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
              Category: <strong className="text-slate-900">{categoryFilter}</strong>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
              Radius: <strong>{radiusKm === 999 ? 'Unlimited' : `≤ ${radiusKm} km`}</strong>
            </span>
            {selectedMedId !== 'ALL' && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                Med: <strong>{selectedMed?.name}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Directory Grid - 4 CARDS PER ROW WITH RECTANGULAR IMAGES */}
        {filteredFacilities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredFacilities.map((s) => (
              <div
                key={s.id}
                className="rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:border-blue-400 hover:shadow-xl transition-all duration-300 text-xs flex flex-col justify-between overflow-hidden group hover:-translate-y-1"
              >
                {/* Facility Image Cover - RECTANGULAR PROPORTIONS (16:10) */}
                <div className="w-full aspect-[16/10] relative bg-slate-100 overflow-hidden flex-shrink-0">
                  <img
                    src={s.imageUrl || s.logoUrl || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80'}
                    alt={s.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                  
                  {/* Top-Left Facility Type Badge */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[9.5px] font-black uppercase px-2.5 py-1 rounded-lg backdrop-blur-md shadow-xs flex items-center gap-1 text-white ${
                        s.type === 'HOSPITAL' ? 'bg-indigo-600/90' : 'bg-teal-600/90'
                      }`}
                    >
                      {s.type === 'HOSPITAL' ? <Hospital className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                      <span>{s.type}</span>
                    </span>
                    {s.isVerified && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-lg bg-blue-600/90 text-white backdrop-blur-md flex items-center gap-0.5 shadow-xs">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        <span>Verified</span>
                      </span>
                    )}
                  </div>

                  {/* Top-Right Distance Pill */}
                  <span className="absolute top-2.5 right-2.5 text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-600 text-white flex items-center gap-1 shadow-md">
                    <MapPin className="w-3 h-3" />
                    <span>{s.distanceKm.toFixed(1)} km</span>
                  </span>

                  {/* Bottom Image Overlay Title */}
                  <div className="absolute bottom-2.5 left-3 right-3">
                    <h4 className="font-black text-white text-[13px] leading-tight drop-shadow-md line-clamp-1 group-hover:text-blue-200 transition-colors">
                      {s.name}
                    </h4>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <p className="text-slate-500 leading-relaxed text-[11px] line-clamp-2 flex items-start gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                      <span>{s.address}</span>
                    </p>
                  </div>

                  {/* Travel Estimate & 24x7 Tag */}
                  <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="font-semibold text-blue-700 text-[10.5px]">
                      🚗 ~{s.estMinutes}m • 🚶 ~{Math.round(s.distanceKm * 12)}m
                    </span>
                    {s.emergencySupport24x7 ? (
                      <span className="font-black text-red-600 text-[9.5px] uppercase bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                        24x7 Emergency
                      </span>
                    ) : (
                      <span className="text-[9.5px] font-bold text-slate-500">
                        Day Hours
                      </span>
                    )}
                  </div>

                  {/* Stock Availability Info */}
                  <div className="flex items-center justify-between text-[11px] text-slate-600 pt-0.5">
                    <span className="text-slate-500">
                      <strong className="text-slate-800">{s.batchCount}</strong> batches in stock
                    </span>
                    <span className="font-bold text-emerald-700 truncate max-w-[110px] text-[10.5px]">{s.operatingHours}</span>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveRouteSource(s)}
                      className="flex-1 py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Get Route</span>
                    </button>

                    <a
                      href={`tel:${s.phone}`}
                      className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                      title="Call Facility"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Call</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm">
              No {categoryFilter === 'ALL' ? 'facilities' : categoryFilter.toLowerCase() + 's'} found within {radiusKm} km radius
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              There are no {categoryFilter.toLowerCase()} nodes located strictly within {radiusKm} km of your current coordinates in Tisaiyanvilai.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRadiusKm(5)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-sm"
              >
                Expand Radius to 5 km
              </button>
              <button
                type="button"
                onClick={() => setRadiusKm(999)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-sm"
              >
                Show All Distances (15 Facilities)
              </button>
              <button
                type="button"
                onClick={() => {
                  setUserCoords({ lat: 8.4184, lon: 77.8732 });
                  setRadiusKm(2);
                  setCategoryFilter('ALL');
                  setSelectedMedId('ALL');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Reset to Tisaiyanvilai Center
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
