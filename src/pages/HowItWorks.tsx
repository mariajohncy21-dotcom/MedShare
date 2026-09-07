import React from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Search,
  Clock,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const HowItWorks: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          How Partial Inventory Matching Works
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Traditional healthcare search is binary: if a pharmacy doesn't have your exact quantity, it returns zero results. MedShare solves this with real-time multi-source graph partitioning.
        </p>
      </div>

      {/* Deep-Dive Algorithm Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-2xl space-y-8">
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div>
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">
              Algorithm Blueprint
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              Multi-Objective Weighted Knapsack & Greedy Allocation
            </h2>
          </div>
          <span className="px-3 py-1 bg-blue-600/30 border border-blue-400 text-blue-300 text-xs font-mono font-bold rounded-xl">
            SmartAllocationService.java
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <p>
              When a user queries <strong className="text-white">20 units of Emergency Insulin</strong>, the engine performs:
            </p>
            <ol className="list-decimal pl-4 space-y-2 text-slate-400">
              <li>
                <strong className="text-white">Geofence Filtering:</strong> Discards unverified sources and facilities outside permissible travel radii.
              </li>
              <li>
                <strong className="text-white">Batch & Expiry Validation:</strong> Verifies remaining shelf-life exceeds minimum threshold.
              </li>
              <li>
                <strong className="text-white">Greedy Multi-Source Partitioning:</strong> Computes the minimal travel path combination:
                <br />
                <span className="text-teal-300 font-mono text-xs block mt-1">
                  CarePoint (5u @ 1.2km) + Apex (8u @ 2.1km) + City Central (7u @ 2.8km) = 20 / 20 Units
                </span>
              </li>
              <li>
                <strong className="text-white">Hold Lock & QR Token:</strong> Initiates simultaneous 15-minute locks on all three dispensaries.
              </li>
            </ol>
          </div>

          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 font-mono text-xs text-blue-300 space-y-2 overflow-x-auto">
            <p className="text-slate-500">// Smart Allocation Scoring Function</p>
            <p className="text-amber-400">double calculateScore(Candidate c) &#123;</p>
            <p className="pl-4 text-slate-300">
              double distScore = 100.0 / (1.0 + c.getDistanceKm() * 0.2);
            </p>
            <p className="pl-4 text-slate-300">
              double verifBonus = c.isVerified() ? 20.0 : -50.0;
            </p>
            <p className="pl-4 text-slate-300">
              double urgencyMult = urgency == CRITICAL ? 1.4 : 1.0;
            </p>
            <p className="pl-4 text-emerald-400">
              return (distScore + verifBonus) * urgencyMult;
            </p>
            <p className="text-amber-400">&#125;</p>
          </div>
        </div>

        <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800">
          <span className="text-xs text-slate-400">
            Engine executes in &lt; 15 milliseconds across 50,000 inventory records.
          </span>
          <Link
            to="/search"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <span>Try Interactive Test</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
