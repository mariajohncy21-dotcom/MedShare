import React, { useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { ShieldAlert, Lock, LogIn, AlertTriangle, ArrowRight } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  requireApproval?: boolean;
  children: React.ReactNode;
}

function getRoleDashboard(role: UserRole): string {
  switch (role) {
    case 'PATIENT': return '/patient/dashboard';
    case 'PHARMACY': return '/pharmacy/dashboard';
    case 'HOSPITAL': return '/hospital/dashboard';
    case 'ADMIN': return '/admin/dashboard';
    default: return '/login';
  }
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  requireApproval = false,
  children,
}) => {
  const { currentUser, isAuthenticated, sources } = useApp();

  // 1. Not authenticated at all — redirect to login
  if (!isAuthenticated || !currentUser || currentUser.id === 'guest') {
    return <Navigate to="/login" replace />;
  }

  // 2. Role check — user is logged in but wrong role for this route: redirect to role dashboard directly
  if (!allowedRoles.includes(currentUser.role)) {
    const userDashboard = getRoleDashboard(currentUser.role);
    return <Navigate to={userDashboard} replace />;
  }

  // 3. Approval check for Pharmacy / Hospital
  if (requireApproval && (currentUser.role === 'PHARMACY' || currentUser.role === 'HOSPITAL')) {
    const orgSource = sources.find((s) => s.id === currentUser.sourceId);
    const isApproved =
      orgSource?.verificationStatus === 'APPROVED' && orgSource?.accountStatus === 'ACTIVE';

    if (!isApproved) {
      const status = orgSource?.verificationStatus || 'PENDING';
      const isSuspended = orgSource?.accountStatus === 'SUSPENDED';
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #f8fafc 0%, #fffbeb 100%)',
          padding: '24px 16px',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}>
          <div style={{
            maxWidth: 440, width: '100%', background: '#fff',
            borderRadius: 20, padding: 40,
            border: '1px solid #fde68a',
            boxShadow: '0 20px 60px rgba(217,119,6,0.10)',
            textAlign: 'center',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px', border: '1px solid #fde68a',
            }}>
              <AlertTriangle style={{ width: 28, height: 28, color: '#d97706' }} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
              {isSuspended ? 'Account Suspended' : 'Verification Pending'}
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 24px', lineHeight: 1.6 }}>
              {isSuspended
                ? 'Your account has been suspended by the administrator.'
                : 'Your organization is awaiting admin approval before you can access this portal.'}
            </p>
            <div style={{
              background: '#fffbeb', borderRadius: 12, padding: '14px 16px',
              border: '1px solid #fde68a', marginBottom: 24, textAlign: 'left',
            }}>
              <p style={{ fontSize: 12, color: '#92400e', margin: 0, lineHeight: 1.6 }}>
                <strong>{currentUser.name}</strong> — Status:{' '}
                <span style={{
                  background: '#fde68a', color: '#78350f',
                  padding: '2px 8px', borderRadius: 99, fontWeight: 700, fontSize: 11,
                }}>{status}</span>
                <br /><br />
                {isSuspended
                  ? 'Contact the MedShare administrator to resolve this issue.'
                  : 'The MedShare Drug Control Authority will review your registration documents and approve or reject your account shortly.'}
              </p>
            </div>
            <a href="/auth/login" style={{
              display: 'block', padding: '12px 24px',
              background: '#1d4ed8', color: '#fff',
              fontWeight: 700, fontSize: 13, borderRadius: 10,
              textDecoration: 'none',
            }}>
              Sign in with a different account
            </a>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
