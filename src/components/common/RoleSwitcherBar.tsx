import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { User, Building2, Hospital, ShieldCheck, RotateCcw, Activity } from 'lucide-react';

export const RoleSwitcherBar: React.FC = () => {
  const { currentUser, switchRole, resetToDemoData } = useApp();

  const roles: { role: UserRole; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      role: 'PATIENT',
      label: 'Patient View',
      icon: <User className="w-4 h-4" />,
      desc: 'Find & Reserve',
    },
    {
      role: 'PHARMACY',
      label: 'Pharmacy Portal',
      icon: <Building2 className="w-4 h-4" />,
      desc: 'CarePoint 24/7',
    },
    {
      role: 'HOSPITAL',
      label: 'Hospital Hub',
      icon: <Hospital className="w-4 h-4" />,
      desc: 'Tisaiyanvilai Govt Hosp',
    },
    {
      role: 'ADMIN',
      label: 'Admin / Drug Control',
      icon: <ShieldCheck className="w-4 h-4" />,
      desc: 'Operations Grid',
    },
  ];

  return (
    <aside aria-label="Demo role selector" className="bg-slate-900 border-b border-slate-800 text-white text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50 shadow-md">
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-semibold tracking-wide text-slate-300 uppercase text-[11px] flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-blue-400" />
          SIH Live Evaluator:
        </span>
        <span className="hidden sm:inline text-slate-400">Switch persona to test real-time synchronization:</span>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
        {roles.map((r) => {
          const isActive = currentUser.role === r.role;
          return (
            <button
              key={r.role}
              onClick={() => switchRole(r.role)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/40'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {r.icon}
              <span>{r.label}</span>
              <span className={`text-[10px] hidden md:inline px-1.5 py-0.2 rounded ${isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-900 text-slate-400'}`}>
                {r.desc}
              </span>
            </button>
          );
        })}

        <button
          onClick={() => {
            if (confirm('Reset application state and restore clean demo dataset?')) {
              resetToDemoData();
            }
          }}
          title="Reset back to initial scenario state"
          className="flex items-center gap-1 ml-2 px-2.5 py-1 rounded-full bg-slate-800 hover:bg-red-950/60 hover:text-red-300 text-slate-400 transition-colors border border-slate-700"
        >
          <RotateCcw className="w-3 h-3" />
          <span className="hidden lg:inline">Reset Demo</span>
        </button>
      </div>
    </aside>
  );
};
