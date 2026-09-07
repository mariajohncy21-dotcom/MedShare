import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { MedicalSource } from '../../types';
import {
  Navigation,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  CheckCircle2,
  X,
  Compass,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface RouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: MedicalSource;
  userLat: number;
  userLon: number;
  userLocationName?: string;
  distanceKm: number;
  estimatedMinutes: number;
  medicineName?: string;
  availableQuantity?: number;
  onReserveClick?: () => void;
}

// User location pulsating pin icon
const createUserIcon = () => {
  const html = `
    <div style="
      background-color: #2563EB;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 12px rgba(37, 99, 235, 0.8);
      position: relative;
    ">
      <div style="
        position: absolute;
        top: -6px;
        left: -6px;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background-color: rgba(37, 99, 235, 0.3);
        animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></div>
    </div>
  `;
  return L.divIcon({
    className: 'user-pin-pulse',
    html,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

// Destination destination pin icon
const createDestinationIcon = (type: 'PHARMACY' | 'HOSPITAL') => {
  const bgHex = type === 'HOSPITAL' ? '#4F46E5' : '#0D9488';
  const iconLetter = type === 'HOSPITAL' ? '🏥' : '💊';
  const html = `
    <div style="
      background-color: ${bgHex};
      width: 34px;
      height: 34px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6px 12px -2px rgba(0,0,0,0.4);
      border: 2px solid white;
    ">
      <span style="
        transform: rotate(45deg);
        font-size: 16px;
      ">${iconLetter}</span>
    </div>
  `;
  return L.divIcon({
    className: 'dest-pin',
    html,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
  });
};

export const RouteModal: React.FC<RouteModalProps> = ({
  isOpen,
  onClose,
  source,
  userLat,
  userLon,
  userLocationName = 'Your Location (Tisaiyanvilai)',
  distanceKm,
  estimatedMinutes,
  medicineName,
  availableQuantity,
  onReserveClick,
}) => {
  if (!isOpen) return null;

  // Generate intermediate route path for real-world route aesthetic
  const midLat = (userLat + source.latitude) / 2 + (userLat > source.latitude ? 0.001 : -0.001);
  const midLon = (userLon + source.longitude) / 2 + (userLon > source.longitude ? 0.001 : -0.001);

  const routePolyline: [number, number][] = [
    [userLat, userLon],
    [midLat, midLon],
    [source.latitude, source.longitude],
  ];

  const centerLat = (userLat + source.latitude) / 2;
  const centerLon = (userLon + source.longitude) / 2;

  // Simulated Turn-by-Turn Directions
  const steps = [
    {
      title: 'Depart from Starting Node',
      desc: `Head towards main road from ${userLocationName}`,
      distance: '0.2 km',
      icon: '📍',
    },
    {
      title: `Proceed along ${source.area || 'Tisaiyanvilai Sector Road'}`,
      desc: 'Follow the main municipal corridor toward target facility',
      distance: `${(distanceKm * 0.6).toFixed(1)} km`,
      icon: '🚗',
    },
    {
      title: `Arrive at ${source.name}`,
      desc: `${source.address}. Emergency medicine pickup counter on ground floor.`,
      distance: `${(distanceKm * 0.2).toFixed(1)} km`,
      icon: '🏁',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600/30 border border-blue-400/40 text-blue-300">
              <Navigation className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">Live Route & Emergency Navigation</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase">
                  Active GPS
                </span>
              </div>
              <p className="text-xs text-slate-300">
                To: <span className="font-semibold text-white">{source.name}</span> • Tisaiyanvilai - 627657
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Interactive Map Preview */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            {/* Map Container */}
            <div className="h-[280px] sm:h-[340px] rounded-2xl overflow-hidden border border-slate-300 relative shadow-inner">
              <MapContainer
                center={[centerLat, centerLon]}
                zoom={14}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* User Location Marker */}
                <Marker position={[userLat, userLon]} icon={createUserIcon()}>
                  <Popup>
                    <div className="p-1 text-xs">
                      <strong className="text-blue-700">📍 You Are Here</strong>
                      <p className="text-slate-600 text-[11px] mt-0.5">{userLocationName}</p>
                    </div>
                  </Popup>
                </Marker>

                {/* Destination Marker */}
                <Marker position={[source.latitude, source.longitude]} icon={createDestinationIcon(source.type)}>
                  <Popup>
                    <div className="p-1 text-xs">
                      <strong className="text-slate-900">{source.name}</strong>
                      <p className="text-slate-500 text-[10px]">{source.address}</p>
                      {medicineName && availableQuantity !== undefined && (
                        <p className="mt-1 text-emerald-700 font-bold">
                          ✓ {availableQuantity} units of {medicineName} available
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>

                {/* Simulated Route Polyline */}
                <Polyline
                  positions={routePolyline}
                  pathOptions={{
                    color: '#2563EB',
                    weight: 5,
                    opacity: 0.85,
                    dashArray: '8, 8',
                  }}
                />
              </MapContainer>

              {/* Float Map Overlay */}
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-md text-xs font-bold text-slate-800 flex items-center gap-1.5 pointer-events-none">
                <Compass className="w-3.5 h-3.5 text-blue-600" />
                <span>Tisaiyanvilai Route Grid</span>
              </div>
            </div>

            {/* Travel Metrics Bar */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-blue-50 border border-blue-200/80 rounded-2xl text-center">
                <span className="text-[10px] font-bold text-blue-600 uppercase">Driving Distance</span>
                <p className="text-xl font-black text-blue-900">{distanceKm} km</p>
              </div>

              <div className="p-3 bg-teal-50 border border-teal-200/80 rounded-2xl text-center">
                <span className="text-[10px] font-bold text-teal-600 uppercase">Est. Travel Time</span>
                <p className="text-xl font-black text-teal-900">~{estimatedMinutes} mins</p>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-200/80 rounded-2xl text-center">
                <span className="text-[10px] font-bold text-indigo-600 uppercase">Facility Status</span>
                <p className="text-xs sm:text-sm font-extrabold text-indigo-900 mt-1">
                  {source.operatingHours.includes('24') ? '🟢 24/7 Open' : '🟢 Open Now'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Facility Details & Turn-by-Turn Guide */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {/* Facility Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{source.name}</h4>
                    <p className="text-xs text-slate-500">{source.address}</p>
                  </div>
                  {source.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                      <ShieldCheck className="w-3 h-3 text-blue-600" />
                      Verified
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-bold text-slate-800">{source.phone}</span>
                  </div>
                  <a
                    href={`tel:${source.phone}`}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition-colors"
                  >
                    Call Facility
                  </a>
                </div>
              </div>

              {/* Turn-by-Turn Route Steps */}
              <div>
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-blue-600" />
                  Route Navigation Steps:
                </h5>
                <div className="space-y-2">
                  {steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-start gap-2.5 text-xs hover:border-blue-300 transition-colors"
                    >
                      <span className="text-base">{step.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-800">{step.title}</p>
                          <span className="text-[10px] font-mono text-slate-400 font-semibold">{step.distance}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-3">
              {onReserveClick && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onReserveClick();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Reserve Medicine at this Facility</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Close Navigation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
