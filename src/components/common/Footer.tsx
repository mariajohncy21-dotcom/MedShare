import React from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, ShieldAlert, PhoneCall, Mail, MapPin, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer style={{
      background: '#0f172a',
      color: '#94a3b8',
      borderTop: '1px solid #1e293b',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px 20px' }}>

        {/* ── Main horizontal row ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '220px 1fr 1fr 1fr 180px',
          gap: 32,
          alignItems: 'flex-start',
        }}>

          {/* Brand */}
          <div>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 8 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                background: 'linear-gradient(135deg, #1d4ed8, #0d9488)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
              }}>
                <HeartPulse style={{ width: 15, height: 15 }} />
              </div>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 16, letterSpacing: '-0.03em', color: '#f1f5f9' }}>
                Med<span style={{ color: '#60a5fa' }}>Share</span>
              </span>
            </Link>
            <p style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.6, margin: '0 0 10px' }}>
              Emergency medicine availability &amp; smart allocation network.
            </p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 99,
              background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.2)',
              fontSize: 10, fontWeight: 700, color: '#2dd4bf',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#2dd4bf', boxShadow: '0 0 5px #2dd4bf' }} />
              Find · Match · Reserve
            </div>
          </div>

          {/* Emergency Core */}
          <div>
            <h5 style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              Emergency Core
            </h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Find Medicine', href: '/search' },
                { label: '🚨 Emergency Broadcast', href: '/emergency', accent: true },
                { label: 'Stock Redistribution', href: '/redistribution' },
                { label: 'Live Availability Map', href: '/map' },
                { label: 'Reservation Tracker', href: '/reservations' },
              ].map(({ label, href, accent }) => (
                <li key={href}>
                  <Link
                    to={href}
                    style={{ fontSize: 12, fontWeight: 500, textDecoration: 'none', color: accent ? '#f87171' : '#64748b' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = accent ? '#fca5a5' : '#cbd5e1'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = accent ? '#f87171' : '#64748b'}
                  >{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Role Portals */}
          <div>
            <h5 style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              Role Portals
            </h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'User Dashboard', href: '/reservations' },
                { label: 'Pharmacy Console', href: '/pharmacy' },
                { label: 'Hospital Emergency Hub', href: '/hospital' },
                { label: 'Admin & Drug Control', href: '/admin' },
                { label: 'Smart Allocation Engine', href: '/how-it-works' },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link
                    to={href}
                    style={{ fontSize: 12, fontWeight: 500, textDecoration: 'none', color: '#64748b' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#cbd5e1'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#64748b'}
                  >{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Disclaimer */}
          <div>
            <h5 style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              Medical Notice
            </h5>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <ShieldAlert style={{ width: 13, height: 13, color: '#fbbf24', flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 11, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                MedShare is a logistics coordination network only. It does not provide medical diagnosis or write prescriptions. A valid prescription is required for all pickups.
              </p>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h5 style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              Contact
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {[
                { icon: PhoneCall, text: '1800-MED-SHARE', color: '#60a5fa' },
                { icon: Mail, text: 'dispatch@medshare.org', color: '#2dd4bf' },
                { icon: MapPin, text: 'Smart India Hackathon', color: '#a78bfa' },
                { icon: CheckCircle2, text: '320+ Verified Hubs', color: '#34d399' },
              ].map(({ icon: Icon, text, color }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Icon style={{ width: 12, height: 12, color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: '#64748b' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div style={{
          marginTop: 20, paddingTop: 16, borderTop: '1px solid #1e293b',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
          gap: 8,
        }}>
          <p style={{ fontSize: 11.5, color: '#334155', margin: 0 }}>
            © {year} MedShare Network · <em>"Every Minute Matters."</em>
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11.5, color: '#334155' }}>
            <span>Built for Smart India Hackathon</span>
            <span style={{ color: '#1e293b' }}>·</span>
            <span>Smart Allocation v2.4</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
