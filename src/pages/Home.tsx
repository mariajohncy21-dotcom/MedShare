import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  HeartPulse,
  Search,
  AlertOctagon,
  ShieldCheck,
  Building2,
  Hospital,
  Activity,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  Users,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { DEFAULT_CITY, DEFAULT_PINCODE } from '../data/mockData';

export const Home: React.FC = () => {
  const { medicines, sources, inventory, reservations } = useApp();
  const navigate = useNavigate();

  const activeSources = sources.filter((s) => !s.isDeleted && s.isVerified);
  const activePharmacies = activeSources.filter((s) => s.type === 'PHARMACY');
  const activeHospitals = activeSources.filter((s) => s.type === 'HOSPITAL');
  const activeReservations = reservations.filter((r) => r.status === 'ACTIVE' || r.status === 'PENDING');

  const stats = [
    { label: 'Verified Facilities', value: activeSources.length, color: '#1d4ed8', icon: Building2 },
    { label: 'Medicine Types', value: medicines.length, color: '#0d9488', icon: Sparkles },
    { label: 'Live Inventory Lines', value: inventory.length, color: '#7c3aed', icon: Activity },
    { label: 'Active Holds', value: activeReservations.length, color: '#d97706', icon: Clock },
  ];

  const capabilities = [
    {
      icon: MapPin,
      color: '#1d4ed8',
      bg: '#eff6ff',
      title: 'Location-Based Stock Radius',
      desc: 'Find medicines across verified pharmacies within 2, 5, 10, or 25 km — with navigation directions.',
    },
    {
      icon: Sparkles,
      color: '#0d9488',
      bg: '#f0fdfa',
      title: 'Multi-Source Smart Allocation',
      desc: 'When one pharmacy can\'t fill a bulk order, our greedy solver pools stock across adjacent facilities.',
    },
    {
      icon: ShieldCheck,
      color: '#7c3aed',
      bg: '#f5f3ff',
      title: 'Drug Authority Oversight',
      desc: 'State drug controllers approve licenses, monitor critical shortages, and review tamper-proof audit trails.',
    },
  ];

  return (
    <div>
      {/* ─────────────────────────────────────────────────────────
          HERO SECTION
      ───────────────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(145deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)',
        color: '#fff',
        padding: '64px 24px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Ambient blobs */}
        <div style={{
          position: 'absolute', top: -80, left: -80,
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, right: -60,
          width: 350, height: 350,
          background: 'radial-gradient(circle, rgba(13,148,136,0.14) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1 }}>

          {/* Hero Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 48, alignItems: 'center' }}
            className="lg:grid-cols-[1fr_420px]"
          >
            {/* Left Content */}
            <div>
              <div style={{ marginBottom: 16 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 12, fontWeight: 800, color: '#f87171',
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }} />
                  Every Minute Matters
                </span>
              </div>

              <h1 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(36px, 5vw, 60px)',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                lineHeight: 1.08,
                color: '#fff',
                marginBottom: 20,
              }}>
                Emergency Medicine.{' '}
                <span style={{
                  background: 'linear-gradient(90deg, #60a5fa, #34d399)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  Faster Access.
                </span>{' '}
                Smarter Distribution.
              </h1>

              <p style={{
                fontSize: 15, color: '#94a3b8', lineHeight: 1.7,
                maxWidth: 520, marginBottom: 28,
                fontWeight: 400,
              }}>
                MedShare eliminates emergency medicine shortages by coordinating real-time stock across verified pharmacies and trauma centers in{' '}
                <strong style={{ color: '#e2e8f0', fontWeight: 700 }}>{DEFAULT_CITY} ({DEFAULT_PINCODE})</strong>{' '}
                with multi-source smart allocation.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, fontWeight: 800, color: '#2dd4bf', marginBottom: 32, letterSpacing: '0.06em' }}>
                {['FIND', 'MATCH', 'RESERVE', 'SHARE'].map((label, i) => (
                  <React.Fragment key={label}>
                    <span>{label}</span>
                    {i < 3 && <span style={{ color: '#334155' }}>·</span>}
                  </React.Fragment>
                ))}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <Link
                  to="/search"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '13px 26px',
                    borderRadius: 10,
                    background: '#1d4ed8',
                    color: '#fff',
                    fontSize: 14, fontWeight: 800,
                    textDecoration: 'none',
                    boxShadow: '0 4px 16px rgba(29,78,216,0.4)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Search style={{ width: 16, height: 16 }} />
                  Find Available Medicine
                  <ArrowRight style={{ width: 14, height: 14 }} />
                </Link>
                <Link
                  to="/emergency"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '13px 26px',
                    borderRadius: 10,
                    background: 'rgba(220,38,38,0.15)',
                    border: '1.5px solid rgba(248,113,113,0.4)',
                    color: '#fca5a5',
                    fontSize: 14, fontWeight: 800,
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <AlertOctagon style={{ width: 16, height: 16 }} />
                  Broadcast Emergency
                </Link>
              </div>
            </div>

            {/* Right: Network Visualization Card */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20,
              padding: 28,
              backdropFilter: 'blur(16px)',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 20, paddingBottom: 16,
                borderBottom: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Activity style={{ width: 15, height: 15, color: '#34d399' }} />
                  <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#cbd5e1' }}>
                    Live Healthcare Network
                  </span>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
                  color: '#34d399', background: 'rgba(52,211,153,0.12)',
                  padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(52,211,153,0.3)',
                }}>
                  ● ACTIVE
                </span>
              </div>

              {/* Node diagram */}
              <div style={{ position: 'relative', height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                {/* Central node */}
                <div style={{
                  width: 80, height: 80, borderRadius: 20,
                  background: 'linear-gradient(135deg, #1d4ed8, #0d9488)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', boxShadow: '0 8px 24px rgba(29,78,216,0.45)',
                  border: '2px solid rgba(255,255,255,0.25)',
                  zIndex: 2, position: 'relative',
                }}>
                  <HeartPulse style={{ width: 26, height: 26 }} />
                  <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 3 }}>MedShare</span>
                </div>

                {/* Satellite nodes */}
                {[
                  { label: 'User', color: '#3b82f6', bg: 'rgba(29,78,216,0.2)', border: 'rgba(59,130,246,0.4)', icon: Users, pos: { top: 8, left: 8 } },
                  { label: 'Pharmacy', color: '#14b8a6', bg: 'rgba(13,148,136,0.2)', border: 'rgba(20,184,166,0.4)', icon: Building2, pos: { top: 8, right: 8 } },
                  { label: 'Hospital', color: '#818cf8', bg: 'rgba(124,58,237,0.2)', border: 'rgba(129,140,248,0.4)', icon: Hospital, pos: { bottom: 8, left: 8 } },
                  { label: 'GPS Grid', color: '#f472b6', bg: 'rgba(168,85,247,0.15)', border: 'rgba(244,114,182,0.35)', icon: MapPin, pos: { bottom: 8, right: 8 } },
                ].map(({ label, color, bg, border, icon: Icon, pos }) => (
                  <div
                    key={label}
                    style={{
                      position: 'absolute', ...pos,
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 12px', borderRadius: 12,
                      background: bg, border: `1px solid ${border}`,
                    }}
                  >
                    <div style={{ width: 26, height: 26, borderRadius: 8, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon style={{ width: 13, height: 13, color: '#fff' }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#e2e8f0' }}>{label}</span>
                  </div>
                ))}

                {/* SVG lines */}
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.35 }}>
                  <line x1="20%" y1="20%" x2="50%" y2="50%" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="4 3" />
                  <line x1="80%" y1="20%" x2="50%" y2="50%" stroke="#2dd4bf" strokeWidth="1.5" strokeDasharray="4 3" />
                  <line x1="20%" y1="80%" x2="50%" y2="50%" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="4 3" />
                  <line x1="80%" y1="80%" x2="50%" y2="50%" stroke="#f9a8d4" strokeWidth="1.5" strokeDasharray="4 3" />
                </svg>
              </div>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Verified Nodes', value: `${activeSources.length} Active`, color: '#34d399' },
                  { label: 'Stock In-Sync', value: `${inventory.length} Batches`, color: '#60a5fa' },
                  { label: 'Pharmacies', value: `${activePharmacies.length} Online`, color: '#a78bfa' },
                  { label: 'Hospitals', value: `${activeHospitals.length} Live`, color: '#f9a8d4' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{
                    padding: '10px 12px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}>
                    <p style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 3px' }}>{label}</p>
                    <p style={{ fontSize: 14, fontWeight: 900, color, margin: 0 }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          LIVE STATS STRIP
      ───────────────────────────────────────────────────────── */}
      <section style={{ background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0 }} className="sm:grid-cols-4">
            {stats.map(({ label, value, color, icon: Icon }, i) => (
              <div
                key={label}
                style={{
                  padding: '20px 24px',
                  borderRight: i < stats.length - 1 ? '1px solid #f1f5f9' : 'none',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}
              >
                <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon style={{ width: 20, height: 20, color }} />
                </div>
                <div>
                  <p style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: 0, fontFamily: 'var(--font-heading)' }}>{value}</p>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          QUICK MEDICINE SEARCH
      ───────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 0' }}>
        <div style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 18,
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Search style={{ width: 15, height: 15, color: '#1d4ed8' }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', margin: 0 }}>Quick Medicine Catalog</p>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Live stock in {DEFAULT_CITY}</p>
              </div>
            </div>
            <Link
              to="/search"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 12, fontWeight: 700, color: '#1d4ed8',
                textDecoration: 'none',
              }}
            >
              Full Search & Image Scanner
              <ChevronRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }} className="sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
            {medicines.map((med) => (
              <Link
                key={med.id}
                to="/search"
                style={{
                  padding: '10px',
                  borderRadius: 12,
                  border: '1.5px solid #e2e8f0',
                  background: '#fafbfc',
                  textDecoration: 'none',
                  display: 'block',
                  transition: 'all 0.12s ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#93c5fd';
                  (e.currentTarget as HTMLElement).style.background = '#eff6ff';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0';
                  (e.currentTarget as HTMLElement).style.background = '#fafbfc';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                <div style={{ width: '100%', height: 52, borderRadius: 8, overflow: 'hidden', background: '#e2e8f0', marginBottom: 8 }}>
                  <img src={med.sampleImageUrl} alt={med.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <p style={{ fontSize: 11.5, fontWeight: 800, color: '#0f172a', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {med.name}
                </p>
                <p style={{ fontSize: 10, color: '#94a3b8', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {med.dosage}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          CAPABILITIES
      ───────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
            Engineered for Smart India Hackathon
          </p>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 900, color: '#0f172a', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
            How MedShare Solves Drug Logistics
          </h2>
          <p style={{ fontSize: 14, color: '#64748b', maxWidth: 520, margin: '0 auto' }}>
            A unified state healthcare network connecting patient reservations, pharmacy inventories, and hospital trauma centers.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 16 }} className="md:grid-cols-3">
          {capabilities.map(({ icon: Icon, color, bg, title, desc }) => (
            <div
              key={title}
              style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 18,
                padding: '28px 24px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Icon style={{ width: 22, height: 22, color }} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          CTA STRIP
      ───────────────────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 64px' }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)',
          borderRadius: 20,
          padding: '40px 32px',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
          gap: 24,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Zap style={{ width: 18, height: 18, color: '#fbbf24' }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Real-time Response</span>
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              Ready to coordinate emergency medicine?
            </h3>
            <p style={{ fontSize: 13, color: '#93c5fd', margin: 0 }}>
              Get instant access to live inventory across {activeSources.length} verified healthcare facilities.
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Link
              to="/search"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '11px 22px', borderRadius: 9,
                background: '#fff', color: '#1d4ed8',
                fontSize: 13, fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              <Search style={{ width: 15, height: 15 }} />
              Search Medicine
            </Link>
            <Link
              to="/map"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '11px 22px', borderRadius: 9,
                background: 'rgba(255,255,255,0.12)',
                border: '1.5px solid rgba(255,255,255,0.25)',
                color: '#e2e8f0',
                fontSize: 13, fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              <MapPin style={{ width: 15, height: 15 }} />
              View Live Map
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
