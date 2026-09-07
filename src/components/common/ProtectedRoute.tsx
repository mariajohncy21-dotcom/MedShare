import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { ShieldAlert, Lock, ArrowLeft, LogIn, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  requireApproval?: boolean;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  requireApproval = false,
  children,
}) => {
  const { currentUser, sources } = useApp();

  // 1. Role Authorization Check
  if (!allowedRoles.includes(currentUser.role)) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-red-200 shadow-xl text-center space-y-5 animate-scale-up">
          <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900">Access Restricted</h2>
            <p className="text-xs text-slate-500">
              Role-Based Access Control (RBAC) Enforcement
            </p>
          </div>

          <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-xs text-slate-700 space-y-2 text-left">
            <p>
              Your current active account (<strong>{currentUser.name}</strong>) is logged in as{' '}
              <span className="font-extrabold text-red-700 bg-red-100 px-2 py-0.5 rounded">{currentUser.role}</span>.
            </p>
            <p>
              This portal requires one of the following authorized roles:{' '}
              <strong className="text-slate-900">{allowedRoles.join(', ')}</strong>.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Link
              to="/auth/login"
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Switch Account / Sign In with Required Role</span>
            </Link>

            <Link
              to="/"
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Organization Verification Check (for Pharmacy & Hospital)
  if (requireApproval && (currentUser.role === 'PHARMACY' || currentUser.role === 'HOSPITAL')) {
    const orgSource = sources.find((s) => s.id === currentUser.sourceId);
    const isApproved = orgSource?.verificationStatus === 'APPROVED' && orgSource?.accountStatus === 'ACTIVE';

    if (!isApproved) {
      return (
        <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-amber-200 shadow-xl text-center space-y-5 animate-scale-up">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900">Verification Pending</h2>
              <p className="text-xs text-slate-500">
                Organization Awaiting Drug Authority Approval
              </p>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-slate-700 space-y-2 text-left">
              <p>
                <strong>{currentUser.name}</strong> is currently in{' '}
                <span className="font-extrabold text-amber-800 bg-amber-200 px-2 py-0.5 rounded">
                  {orgSource?.verificationStatus || 'PENDING'}
                </span>{' '}
                status.
              </p>
              <p className="text-[11px] text-amber-800">
                In compliance with MedShare regulations, full inventory broadcasting and hospital dispatch access is restricted until an Admin reviews and approves your drug license documentation.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Link
                to="/auth/login"
                className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition-colors"
              >
                Switch Account
              </Link>
              <Link
                to="/"
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
