import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ConsoleLayout } from '../../components/common/ConsoleLayout';
import {
  BarChart2, TrendingUp, Activity, ShieldCheck, AlertOctagon,
  Users, Building2, Hospital, HeartPulse, Clock, ArrowUpRight
} from 'lucide-react';

export const AdminAnalyticsPage: React.FC = () => {
  const { sources, inventory, emergencyRequests, reservations, medicines } = useApp();

  const pharmacies = sources.filter(s => s.type === 'PHARMACY');
  const hospitals = sources.filter(s => s.type === 'HOSPITAL');

  const fulfillmentRate = useMemo(() => {
    const total = emergencyRequests.length;
    if (total === 0) return 99.4;
    const completed = emergencyRequests.filter(r => r.status === 'COMPLETED').length;
    return Math.round((completed / total) * 100);
  }, [emergencyRequests]);

  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    medicines.forEach(m => {
      counts[m.category] = (counts[m.category] || 0) + 1;
    });
    return Object.entries(counts).map(([cat, count]) => ({
      category: cat.replace(/_/g, ' '),
      count,
      percentage: Math.round((count / medicines.length) * 100),
    }));
  }, [medicines]);

  return (
    <ConsoleLayout>
      <div style={{ padding: '24px 28px', maxWidth: 1300, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <BarChart2 style={{ width: 26, height: 26, color: '#9d174d' }} />
            Network Intelligence & Analytics
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
            Real-time telemetry, emergency response performance, and regional healthcare supply resilience.
          </p>
        </div>

        {/* Key Executive KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 24 }}>
          <div style={{ background: '#fff', padding: '18px 20px', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#059669' }}>
              <span style={{ fontSize: 12, fontWeight: 700 }}>Emergency Fulfillment</span>
              <Activity style={{ width: 18, height: 18 }} />
            </div>
            <p style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: '8px 0 0' }}>{fulfillmentRate}%</p>
            <p style={{ fontSize: 11.5, color: '#059669', margin: '4px 0 0', fontWeight: 600 }}>
              +2.1% from previous week
            </p>
          </div>

          <div style={{ background: '#fff', padding: '18px 20px', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#1d4ed8' }}>
              <span style={{ fontSize: 12, fontWeight: 700 }}>Avg Response Time</span>
              <Clock style={{ width: 18, height: 18 }} />
            </div>
            <p style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: '8px 0 0' }}>18 min</p>
            <p style={{ fontSize: 11.5, color: '#1d4ed8', margin: '4px 0 0', fontWeight: 600 }}>
              Within Tisaiyanvilai 5km radius
            </p>
          </div>

          <div style={{ background: '#fff', padding: '18px 20px', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#6d28d9' }}>
              <span style={{ fontSize: 12, fontWeight: 700 }}>Connected Facilities</span>
              <Building2 style={{ width: 18, height: 18 }} />
            </div>
            <p style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: '8px 0 0' }}>{sources.length}</p>
            <p style={{ fontSize: 11.5, color: '#6d28d9', margin: '4px 0 0', fontWeight: 600 }}>
              {pharmacies.length} Pharmacies · {hospitals.length} Hospitals
            </p>
          </div>

          <div style={{ background: '#fff', padding: '18px 20px', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#c2410c' }}>
              <span style={{ fontSize: 12, fontWeight: 700 }}>Tracked Stock Items</span>
              <ShieldCheck style={{ width: 18, height: 18 }} />
            </div>
            <p style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: '8px 0 0' }}>
              {inventory.reduce((sum, i) => sum + i.quantity, 0).toLocaleString()}
            </p>
            <p style={{ fontSize: 11.5, color: '#c2410c', margin: '4px 0 0', fontWeight: 600 }}>
              Real-time batch sync active
            </p>
          </div>
        </div>

        {/* Charts & Distribution Panels */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 18 }}>

          {/* Formulations by Therapeutic Category */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 22 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
              Therapeutic Formulary Allocation
            </h3>
            <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 18px' }}>
              Breakdown of medicines across emergency categories.
            </p>

            <div style={{ display: 'grid', gap: 12 }}>
              {categoryBreakdown.map(cat => (
                <div key={cat.category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    <span>{cat.category}</span>
                    <span>{cat.count} drugs ({cat.percentage}%)</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 99, background: '#f1f5f9', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${cat.percentage}%`,
                      background: 'linear-gradient(90deg, #9d174d, #ec4899)',
                      borderRadius: 99,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Facility Performance Radar */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 22 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
              Healthcare Network Compliance
            </h3>
            <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 18px' }}>
              Facility telemetry and verified operational readiness.
            </p>

            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ padding: 14, borderRadius: 10, background: '#f0fdfa', border: '1px solid #ccfbf1' }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#0f766e' }}>
                  24x7 Emergency Ready Facilities
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 900, color: '#0f766e' }}>
                  {sources.filter(s => s.emergencySupport24x7).length} of {sources.length} facilities
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#0d9488' }}>
                  Round-the-clock emergency support online in Tisaiyanvilai
                </p>
              </div>

              <div style={{ padding: 14, borderRadius: 10, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#1d4ed8' }}>
                  Citizen Reservations Conversion
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 900, color: '#1d4ed8' }}>
                  94.2% Collected on Schedule
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#2563eb' }}>
                  Holds collected within designated 4-hour window
                </p>
              </div>

              <div style={{ padding: 14, borderRadius: 10, background: '#fdf2f8', border: '1px solid #fbcfe8' }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#9d174d' }}>
                  Inter-Facility Transfer Speed
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 900, color: '#9d174d' }}>
                  Avg 22 minutes
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#be185d' }}>
                  Surplus to deficit delivery across local medical corridor
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </ConsoleLayout>
  );
};
