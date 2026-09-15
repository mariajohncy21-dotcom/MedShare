import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import { MedMap } from '../../components/map/MedMap';
import { RouteModal } from '../../components/map/RouteModal';
import { MedicalSource } from '../../types';
import {
  ArrowLeft, MapPin, Building2, ShieldCheck, Search, Filter,
  Navigation, CheckCircle2, AlertTriangle, Compass,
} from 'lucide-react';

export const HospitalMapPage: React.FC = () => {
  const { currentUser, sources, inventory, medicines } = useApp();
  const location = useLocation();

  const hospId = currentUser.sourceId || 'SRC-HOSP-001';
  const hospSource = sources.find((s) => s.id === hospId);

  // Hospital coordinates (center map on this hospital)
  const hospCoords = useMemo(() => ({
    lat: hospSource?.latitude || 8.4184,
    lon: hospSource?.longitude || 77.8732,
  }), [hospSource]);

  // Query params
  const searchParams = new URLSearchParams(location.search);
  const targetId = searchParams.get('target');

  const [selectedMedId, setSelectedMedId] = useState<string>('ALL');
  const [activeRouteSource, setActiveRouteSource] = useState<MedicalSource | null>(null);

  // Filter sources: active pharmacies + this hospital
  const mapSources = useMemo(() => {
    return sources.filter((s) => {
      if (s.isDeleted || s.accountStatus === 'DELETED') return false;
      if (s.id === hospId) return true;
      return s.type === 'PHARMACY' && s.verificationStatus === 'APPROVED';
    });
  }, [sources, hospId]);

  return (
    <ConsoleLayout>
      <div style={{ padding: '24px 28px', maxWidth: 1300, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
        
        {/* Prominent in-page Back button */}
        <div style={{ marginBottom: 16 }}>
          <Link
            to="/hospital/pharmacy-search"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontSize: 13, fontWeight: 700, color: '#1e293b',
              textDecoration: 'none', background: '#fff', padding: '8px 16px',
              borderRadius: 10, border: '1.5px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              transition: 'all 0.12s ease',
            }}
          >
            <ArrowLeft style={{ width: 16, height: 16, color: '#6d28d9' }} />
            <span>← Back to Pharmacy Search</span>
          </Link>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Pharmacy Geospatial Network &amp; Emergency Routes
              </h1>
              <span style={{
                fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe',
              }}>
                Institutional Dispatch Mode
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
              Base Location: <strong>{hospSource?.name || 'Hospital'}</strong> ({hospCoords.lat.toFixed(4)}, {hospCoords.lon.toFixed(4)}) · Real-time medicine stock visualization
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Filter Stock for Medicine:</span>
            <select
              value={selectedMedId}
              onChange={(e) => setSelectedMedId(e.target.value)}
              style={{
                padding: '8px 12px', fontSize: 13, borderRadius: 8,
                border: '1.5px solid #e2e8f0', background: '#fff', outline: 'none',
              }}
            >
              <option value="ALL">All Medicines (General Stock Status)</option>
              {medicines.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.dosage || m.category})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Legend */}
        <div style={{
          background: '#fff', borderRadius: 12, padding: '12px 20px',
          border: '1px solid #e2e8f0', marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12, fontSize: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} />
              <span style={{ color: '#334155', fontWeight: 600 }}>Adequate Stock (&gt;35 units)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
              <span style={{ color: '#334155', fontWeight: 600 }}>Low Stock (16-35 units)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ color: '#334155', fontWeight: 600 }}>Critical / Out of Stock</span>
            </div>
          </div>
          <span style={{ color: '#64748b' }}>
            Click any pharmacy pin to view verified credentials, medicine quantity, and calculate direct emergency dispatch route.
          </span>
        </div>

        {/* Leaflet Map */}
        <div style={{
          height: 600, borderRadius: 16, overflow: 'hidden',
          border: '1px solid #cbd5e1', boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          position: 'relative',
        }}>
          <MedMap
            sources={mapSources}
            inventories={inventory}
            centerLat={hospCoords.lat}
            centerLon={hospCoords.lon}
            userCoords={hospCoords}
            height="600px"
            onSelectSource={(source) => setActiveRouteSource(source)}
          />
        </div>

        {/* Route Modal */}
        {activeRouteSource && (
          <RouteModal
            isOpen={Boolean(activeRouteSource)}
            onClose={() => setActiveRouteSource(null)}
            source={activeRouteSource}
            userLat={hospCoords.lat}
            userLon={hospCoords.lon}
            distanceKm={2.5}
            estimatedMinutes={8}
          />
        )}
      </div>
    </ConsoleLayout>
  );
};
