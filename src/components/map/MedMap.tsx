import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { MedicalSource, InventoryItem } from '../../types';
import {
  ShieldCheck,
  Phone,
  MapPin,
  Clock,
  Hospital,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  LocateFixed,
  SlidersHorizontal,
  Compass,
} from 'lucide-react';
import { RouteModal } from './RouteModal';
import { calculateDistanceKm } from '../../services/smartAllocation';

// Fix Leaflet marker icons in React Vite
const createCustomIcon = (color: 'green' | 'amber' | 'red' | 'gray', type: 'PHARMACY' | 'HOSPITAL') => {
  const bgHex =
    color === 'green'
      ? '#10B981'
      : color === 'amber'
      ? '#F59E0B'
      : color === 'red'
      ? '#EF4444'
      : '#64748B';
  const iconLetter = type === 'HOSPITAL' ? 'H' : '℞';

  const html = `
    <div style="
      background-color: ${bgHex};
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
      border: 2px solid white;
    ">
      <span style="
        transform: rotate(45deg);
        color: white;
        font-weight: 800;
        font-size: 13px;
        font-family: sans-serif;
      ">${iconLetter}</span>
    </div>
  `;

  return L.divIcon({
    className: 'custom-leaflet-pin',
    html,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const createUserLocationIcon = () => {
  const html = `
    <div style="
      background-color: #2563EB;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 10px rgba(37, 99, 235, 0.9);
      position: relative;
    ">
      <div style="
        position: absolute;
        top: -6px;
        left: -6px;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background-color: rgba(37, 99, 235, 0.35);
        animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></div>
    </div>
  `;
  return L.divIcon({
    className: 'user-pulse-marker',
    html,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  });
};

interface MedMapProps {
  sources: MedicalSource[];
  inventories?: InventoryItem[];
  centerLat?: number;
  centerLon?: number;
  zoom?: number;
  highlightSourceIds?: string[];
  selectedMedicineName?: string;
  height?: string;
  showFilters?: boolean;
  filterType?: 'ALL' | 'PHARMACY' | 'HOSPITAL';
  onFilterTypeChange?: (type: 'ALL' | 'PHARMACY' | 'HOSPITAL') => void;
  radiusKm?: number;
  onRadiusKmChange?: (radius: number) => void;
  userCoords?: { lat: number; lon: number };
  onUserCoordsChange?: (coords: { lat: number; lon: number }) => void;
  verifiedOnly?: boolean;
  onVerifiedOnlyChange?: (verified: boolean) => void;
  onFilteredSourcesChange?: (sources: MedicalSource[]) => void;
  onSelectSource?: (source: MedicalSource) => void;
}

export const MedMap: React.FC<MedMapProps> = ({
  sources,
  inventories = [],
  centerLat = 8.4184, // Tisaiyanvilai 627657
  centerLon = 77.8732,
  zoom = 13,
  highlightSourceIds = [],
  selectedMedicineName,
  height = '500px',
  showFilters = true,
  filterType: controlledFilterType,
  onFilterTypeChange,
  radiusKm: controlledRadiusKm,
  onRadiusKmChange,
  userCoords: controlledUserCoords,
  onUserCoordsChange,
  verifiedOnly: controlledVerifiedOnly,
  onVerifiedOnlyChange,
  onFilteredSourcesChange,
  onSelectSource,
}) => {
  const [internalFilterType, setInternalFilterType] = useState<'ALL' | 'PHARMACY' | 'HOSPITAL'>('ALL');
  const [internalVerifiedOnly, setInternalVerifiedOnly] = useState(true);
  const [internalRadiusKm, setInternalRadiusKm] = useState<number>(5);
  const [availabilityFilter, setAvailabilityFilter] = useState<'ALL' | 'AVAILABLE' | 'LOW' | 'CRITICAL'>('ALL');
  
  // Effective active states
  const filterType = controlledFilterType !== undefined ? controlledFilterType : internalFilterType;
  const verifiedOnly = controlledVerifiedOnly !== undefined ? controlledVerifiedOnly : internalVerifiedOnly;
  const radiusKm = controlledRadiusKm !== undefined ? controlledRadiusKm : internalRadiusKm;

  const setFilterType = (type: 'ALL' | 'PHARMACY' | 'HOSPITAL') => {
    setInternalFilterType(type);
    onFilterTypeChange?.(type);
  };

  const setVerifiedOnly = (v: boolean) => {
    setInternalVerifiedOnly(v);
    onVerifiedOnlyChange?.(v);
  };

  const setRadiusKm = (r: number) => {
    setInternalRadiusKm(r);
    onRadiusKmChange?.(r);
  };

  // Geolocation state
  const [internalUserCoords, setInternalUserCoords] = useState<{ lat: number; lon: number }>({
    lat: centerLat,
    lon: centerLon,
  });
  const userCoords = controlledUserCoords || internalUserCoords;
  const setUserCoords = (coords: { lat: number; lon: number }) => {
    setInternalUserCoords(coords);
    onUserCoordsChange?.(coords);
  };

  const [isLocating, setIsLocating] = useState(false);
  const [gpsActive, setGpsActive] = useState(false);
  const [locationStatusMsg, setLocationStatusMsg] = useState<string | null>(null);

  // Route Navigation Modal
  const [activeRouteSource, setActiveRouteSource] = useState<MedicalSource | null>(null);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Location permission is not supported by your browser. Defaulting to Tisaiyanvilai 627657.');
      return;
    }

    setIsLocating(true);
    setLocationStatusMsg(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setUserCoords(coords);
        setIsLocating(false);
        setGpsActive(true);
        setLocationStatusMsg('GPS Coordinates Detected!');
        setTimeout(() => setLocationStatusMsg(null), 3000);
      },
      (err) => {
        console.warn('GPS location access denied or timed out:', err);
        setIsLocating(false);
        const fallback = { lat: 8.4184, lon: 77.8732 };
        setUserCoords(fallback);
        setGpsActive(false);
        setLocationStatusMsg('Location permission was not granted. Using Tisaiyanvilai center.');
        setTimeout(() => setLocationStatusMsg(null), 3500);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const getSourceStockStatus = (sourceId: string): 'green' | 'amber' | 'red' | 'gray' => {
    const relevant = inventories.filter((i) => i.sourceId === sourceId);
    if (relevant.length === 0) return 'green';
    const hasCritical = relevant.some((i) => i.stockStatus === 'CRITICAL');
    if (hasCritical) return 'red';
    const hasLow = relevant.some((i) => i.stockStatus === 'LOW');
    if (hasLow) return 'amber';
    return 'green';
  };

  const filteredSources = sources
    .filter((s) => !s.isDeleted && s.accountStatus !== 'DELETED')
    .filter((s) => {
      if (filterType !== 'ALL' && s.type !== filterType) return false;
      if (verifiedOnly && !s.isVerified) return false;

      // Distance filter based on userCoords
      const dist = calculateDistanceKm(userCoords.lat, userCoords.lon, s.latitude, s.longitude);
      if (dist > radiusKm) return false;

      // Availability filter
      if (availabilityFilter !== 'ALL') {
        const status = getSourceStockStatus(s.id);
        if (availabilityFilter === 'AVAILABLE' && status !== 'green') return false;
        if (availabilityFilter === 'LOW' && status !== 'amber') return false;
        if (availabilityFilter === 'CRITICAL' && status !== 'red') return false;
      }

      return true;
    });

  return (
    <div className="w-full rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm bg-white">
      {showFilters && (
        <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex flex-col space-y-3 text-xs">
          {/* Top Row: Type & GPS Button */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-300 uppercase tracking-wide">Facility:</span>
              <div className="flex rounded-xl bg-slate-800 p-1 border border-slate-700">
                <button
                  onClick={() => setFilterType('ALL')}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    filterType === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Nodes
                </button>
                <button
                  onClick={() => setFilterType('PHARMACY')}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    filterType === 'PHARMACY' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pharmacies
                </button>
                <button
                  onClick={() => setFilterType('HOSPITAL')}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    filterType === 'HOSPITAL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Hospitals
                </button>
              </div>
            </div>

            {/* GPS Location Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-blue-500/20"
              >
                <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Detecting GPS...' : '📍 Use Current Location'}</span>
              </button>
            </div>
          </div>

          {/* Bottom Filter Controls: Radius, Verified Only, Availability */}
          <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px]">
            {/* Radius Selector */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-400">Search Radius:</span>
              <div className="flex gap-1">
                {[2, 5, 10, 25].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRadiusKm(r)}
                    className={`px-2.5 py-0.5 rounded-md font-bold transition-colors cursor-pointer ${
                      radiusKm === r ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            </div>

            {/* Verified Only Checkbox */}
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 select-none">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="rounded text-blue-600 focus:ring-0 bg-slate-800 border-slate-700 cursor-pointer"
              />
              <span className="font-bold">✓ Verified Facilities Only</span>
            </label>

            {/* Stock Legend */}
            <div className="hidden md:flex items-center gap-3 border-l border-slate-800 pl-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Available
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Low Stock
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Shortage Alert
              </span>
            </div>
          </div>

          {locationStatusMsg && (
            <div className="px-3 py-1 bg-blue-900/60 rounded-lg text-blue-200 text-[11px] font-medium animate-fade-in">
              {locationStatusMsg}
            </div>
          )}
        </div>
      )}

      {/* Main Map Container */}
      <div style={{ height }} className="relative">
        <MapContainer
          center={[userCoords.lat, userCoords.lon]}
          zoom={zoom}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Search Radius Circle Overlay */}
          <Circle
            center={[userCoords.lat, userCoords.lon]}
            radius={radiusKm * 1000}
            pathOptions={{
              color: '#2563EB',
              fillColor: '#3B82F6',
              fillOpacity: 0.08,
              weight: 1.5,
              dashArray: '4, 4',
            }}
          />

          {/* User Location Pulse Pin */}
          <Marker position={[userCoords.lat, userCoords.lon]} icon={createUserLocationIcon()}>
            <Popup>
              <div className="p-1 text-xs">
                <strong className="text-blue-700">📍 You Are Here</strong>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  Tisaiyanvilai Center • {userCoords.lat.toFixed(4)}, {userCoords.lon.toFixed(4)}
                </p>
                <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
                  Radius search active: {radiusKm} km
                </span>
              </div>
            </Popup>
          </Marker>

          {/* Filtered Facility Markers */}
          {filteredSources.map((source) => {
            const stockColor = getSourceStockStatus(source.id);
            const isHighlighted = highlightSourceIds.includes(source.id);
            const dist = calculateDistanceKm(userCoords.lat, userCoords.lon, source.latitude, source.longitude);

            return (
              <Marker
                key={source.id}
                position={[source.latitude, source.longitude]}
                icon={createCustomIcon(stockColor, source.type)}
                eventHandlers={{
                  click: () => onSelectSource?.(source),
                }}
              >
                <Popup className="custom-med-popup">
                  <div className="p-1 space-y-2 min-w-[220px] text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1">
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              source.type === 'HOSPITAL' ? 'bg-indigo-100 text-indigo-800' : 'bg-teal-100 text-teal-800'
                            }`}
                          >
                            {source.type}
                          </span>
                          {source.isVerified && (
                            <span className="inline-flex items-center text-blue-600 text-[10px] font-bold">
                              <ShieldCheck className="w-3 h-3 inline mr-0.5" /> Verified
                            </span>
                          )}
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm mt-0.5 leading-tight">{source.name}</h4>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{source.address}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{source.operatingHours}</span>
                      </p>
                      <p className="flex items-center justify-between font-bold text-slate-800 pt-1 border-t border-slate-200">
                        <span>Distance: {dist} km</span>
                        <span className="text-teal-700">⭐ {source.rating}</span>
                      </p>
                    </div>

                    {/* Stock Status Badge */}
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="font-semibold text-slate-500">Stock Status:</span>
                      <span
                        className={`font-black px-2 py-0.5 rounded-md ${
                          stockColor === 'green'
                            ? 'bg-emerald-100 text-emerald-800'
                            : stockColor === 'amber'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {stockColor === 'green' ? '✓ Available' : stockColor === 'amber' ? '⚠ Low Stock' : '🚨 Shortage'}
                      </span>
                    </div>

                    {/* Directions / Start Navigation Button */}
                    <button
                      type="button"
                      onClick={() => setActiveRouteSource(source)}
                      className="w-full py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Start Route Navigation</span>
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Float Map Location Badge */}
        <div className="absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-200 shadow-md text-xs font-bold text-slate-800 flex items-center gap-1.5 pointer-events-none">
          <Compass className="w-4 h-4 text-blue-600" />
          <span>Tisaiyanvilai Grid (627657) • {filteredSources.length} facilities active</span>
        </div>
      </div>

      {/* Navigation Modal */}
      {activeRouteSource && (
        <RouteModal
          isOpen={true}
          onClose={() => setActiveRouteSource(null)}
          source={activeRouteSource}
          userLat={userCoords.lat}
          userLon={userCoords.lon}
          userLocationName="Current User Location (Tisaiyanvilai)"
          distanceKm={calculateDistanceKm(userCoords.lat, userCoords.lon, activeRouteSource.latitude, activeRouteSource.longitude)}
          estimatedMinutes={Math.max(
            5,
            Math.round(calculateDistanceKm(userCoords.lat, userCoords.lon, activeRouteSource.latitude, activeRouteSource.longitude) * 3.2)
          )}
          medicineName={selectedMedicineName}
        />
      )}
    </div>
  );
};
