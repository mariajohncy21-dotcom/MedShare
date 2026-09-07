import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import {
  HeartPulse,
  User,
  Building2,
  Hospital,
  Lock,
  Mail,
  Phone,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  FileText,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
  Clock,
} from 'lucide-react';
import { DEFAULT_CITY, DEFAULT_DISTRICT, DEFAULT_STATE, DEFAULT_PINCODE, DEFAULT_LAT, DEFAULT_LON } from '../data/mockData';

// ─── Shared layout for all auth pages ────────────────────────────────────────
const AuthLayout: React.FC<{ children: React.ReactNode; maxWidth?: number }> = ({ children, maxWidth = 480 }) => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    background: '#f1f5f9',
    padding: '48px 16px 64px',
  }}>
    <div style={{
      width: '100%',
      maxWidth,
      background: '#fff',
      borderRadius: 20,
      border: '1px solid #e2e8f0',
      boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
      overflow: 'hidden',
    }}>
      {children}
    </div>
  </div>
);

// ─── Brand Mark ──────────────────────────────────────────────────────────────
const BrandMark: React.FC = () => (
  <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
    <div style={{
      width: 40, height: 40, borderRadius: 11,
      background: 'linear-gradient(135deg, #1d4ed8, #0d9488)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', boxShadow: '0 4px 12px rgba(29,78,216,0.3)',
    }}>
      <HeartPulse style={{ width: 20, height: 20 }} />
    </div>
    <div>
      <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 20, letterSpacing: '-0.03em', color: '#0f172a', margin: 0 }}>
        Med<span style={{ color: '#1d4ed8' }}>Share</span>
        <span style={{
          marginLeft: 6, fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 99,
          background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe',
          textTransform: 'uppercase' as const, letterSpacing: '0.08em', verticalAlign: 'middle',
        }}>Grid</span>
      </p>
      <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, margin: 0 }}>Emergency Medicine Network</p>
    </div>
  </Link>
);

// ─── Form field component ─────────────────────────────────────────────────────
const FieldWrapper: React.FC<{
  label: string;
  hint?: string;
  badge?: string;
  colSpan?: boolean;
  children: React.ReactNode;
}> = ({ label, hint, badge, colSpan, children }) => (
  <div style={colSpan ? { gridColumn: '1 / -1' } : {}}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{label}</label>
      {badge && (
        <span style={{
          fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99,
          background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a',
          textTransform: 'uppercase' as const, letterSpacing: '0.06em',
        }}>{badge}</span>
      )}
    </div>
    {children}
    {hint && <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{hint}</p>}
  </div>
);

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 13px',
  fontSize: 13,
  fontWeight: 500,
  color: '#0f172a',
  background: '#fafbfc',
  border: '1.5px solid #e2e8f0',
  borderRadius: 9,
  outline: 'none',
  fontFamily: 'var(--font-body)',
  transition: 'border-color 0.12s ease, box-shadow 0.12s ease',
  boxSizing: 'border-box' as const,
};

const inputFocusStyle: React.CSSProperties = {
  borderColor: '#3b82f6',
  boxShadow: '0 0 0 3px rgba(59,130,246,0.1)',
};

// ─── Controlled Input ─────────────────────────────────────────────────────────
const StyledInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { monospace?: boolean }> = ({ monospace, style, ...props }) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{
        ...inputStyle,
        ...(monospace ? { fontFamily: 'monospace', fontWeight: 700, color: '#1d4ed8' } : {}),
        ...(focused ? inputFocusStyle : {}),
        ...style,
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
};

// ─── Error Banner ─────────────────────────────────────────────────────────────
const ErrorBanner: React.FC<{ message: string }> = ({ message }) => (
  <div style={{
    display: 'flex', alignItems: 'flex-start', gap: 10,
    padding: '12px 14px',
    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
    fontSize: 12.5, fontWeight: 600, color: '#dc2626',
  }}>
    <AlertCircle style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }} />
    <span>{message}</span>
  </div>
);

// ─── Submit Button ────────────────────────────────────────────────────────────
const SubmitBtn: React.FC<{ disabled?: boolean; loading?: boolean; label: string; loadingLabel?: string; fullWidth?: boolean }> = ({
  disabled, loading, label, loadingLabel, fullWidth = true,
}) => (
  <button
    type="submit"
    disabled={disabled || loading}
    style={{
      ...(fullWidth ? { width: '100%' } : {}),
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      padding: '12px 24px',
      background: (disabled || loading) ? '#93c5fd' : '#1d4ed8',
      color: '#fff',
      fontSize: 14, fontWeight: 800,
      border: 'none', borderRadius: 10,
      cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
      boxShadow: '0 2px 8px rgba(29,78,216,0.28)',
      transition: 'all 0.12s ease',
      fontFamily: 'var(--font-body)',
    }}
  >
    {loading ? (loadingLabel || 'Processing...') : (
      <>
        {label}
        <ArrowRight style={{ width: 15, height: 15 }} />
      </>
    )}
  </button>
);

// =============================================================================
// 1. LOGIN PAGE
// =============================================================================
export const LoginPage: React.FC = () => {
  const { login } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await login(email.trim(), password);
      setIsLoading(false);
      if (res.success && res.user) {
        switch (res.user.role) {
          case 'PATIENT': navigate('/search'); break;
          case 'PHARMACY': navigate('/pharmacy'); break;
          case 'HOSPITAL': navigate('/hospital'); break;
          case 'ADMIN': navigate('/admin'); break;
          default: navigate('/');
        }
      } else {
        setErrorMessage(res.error || 'Invalid credentials. Please verify your email and password.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Login failed. Please check your network connection.');
    }
  };

  return (
    <AuthLayout>
      {/* Top brand bar */}
      <div style={{
        padding: '28px 32px 24px',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', gap: 12,
      }}>
        <BrandMark />
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 900, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            Sign in to MedShare
          </h2>
          <p style={{ fontSize: 12.5, color: '#64748b', margin: 0, fontWeight: 400 }}>
            Secure access for citizens, pharmacies, hospitals &amp; admins.
          </p>
        </div>
      </div>

      {/* Form body */}
      <div style={{ padding: '28px 32px' }}>
        {errorMessage && <div style={{ marginBottom: 18 }}><ErrorBanner message={errorMessage} /></div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FieldWrapper label="Email Address">
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#94a3b8' }} />
              <StyledInput
                type="email" required autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: 38 }}
              />
            </div>
          </FieldWrapper>

          <FieldWrapper label="Password">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Password</label>
              <Link to="/auth/forgot" style={{ fontSize: 11.5, fontWeight: 700, color: '#1d4ed8', textDecoration: 'none' }}>
                Forgot Password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#94a3b8' }} />
              <StyledInput
                type={showPassword ? 'text' : 'password'} required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: 38, paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8',
                  display: 'flex', padding: 0,
                }}
              >
                {showPassword ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
              </button>
            </div>
          </FieldWrapper>

          <div style={{ marginTop: 4 }}>
            <SubmitBtn label="Sign In" loadingLabel="Signing in…" loading={isLoading} />
          </div>
        </form>

        <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid #f1f5f9', textAlign: 'center', fontSize: 12.5, color: '#64748b' }}>
          Don't have an account?{' '}
          <Link to="/auth/register" style={{ color: '#1d4ed8', fontWeight: 800, textDecoration: 'none' }}>
            Register for MedShare
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

// =============================================================================
// 2. REGISTRATION WIZARD
// =============================================================================
export const RegisterPage: React.FC = () => {
  const { register } = useApp();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccessSubmitted, setIsSuccessSubmitted] = useState(false);
  const [submittedFacilityName, setSubmittedFacilityName] = useState('');

  const [patientData, setPatientData] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    address: '', city: DEFAULT_CITY, district: DEFAULT_DISTRICT,
    state: DEFAULT_STATE, pincode: DEFAULT_PINCODE,
    latitude: DEFAULT_LAT, longitude: DEFAULT_LON,
  });

  const [facilityData, setFacilityData] = useState({
    organizationName: '', authorizedPerson: '', email: '', contactNumber: '',
    password: '', confirmPassword: '',
    registrationNumber: '', hospitalType: 'Multi-Speciality Hospital',
    doorNumber: '', street: '', area: 'Main Bazaar',
    city: DEFAULT_CITY, district: DEFAULT_DISTRICT, state: DEFAULT_STATE,
    pincode: DEFAULT_PINCODE, latitude: DEFAULT_LAT, longitude: DEFAULT_LON,
    emergencySupport24x7: true,
    documentUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600',
    logoUrl: 'https://images.unsplash.com/photo-1586015555751-63c237841c7b?w=150',
  });

  // ─── Patient submit ────────────────────────────────────────────────────────
  const handlePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (patientData.password !== patientData.confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your password.');
      return;
    }
    if (patientData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await register({
        role: 'PATIENT', name: patientData.name, email: patientData.email,
        phone: patientData.phone, password: patientData.password,
        address: patientData.address, city: patientData.city,
        district: patientData.district, state: patientData.state,
        pincode: patientData.pincode, latitude: patientData.latitude, longitude: patientData.longitude,
      });
      setIsLoading(false);
      if (res.success) navigate('/search');
      else setErrorMessage(res.error || 'Registration failed.');
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Registration failed.');
    }
  };

  // ─── Facility step 1 ─────────────────────────────────────────────────────
  const handleFacilityStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const emailTrimmed = facilityData.email.trim().toLowerCase();
    if (selectedRole === 'PHARMACY' && !emailTrimmed.endsWith('@pharm.com')) {
      setErrorMessage('Pharmacy accounts must use an official email ending with @pharm.com (e.g. yourpharmacy@pharm.com). Other email domains are not accepted.');
      return;
    }
    if (selectedRole === 'HOSPITAL' && !emailTrimmed.endsWith('@hos.com')) {
      setErrorMessage('Hospital accounts must use an official email ending with @hos.com (e.g. yourhospital@hos.com). Other email domains are not accepted.');
      return;
    }
    if (facilityData.password !== facilityData.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (facilityData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    setCurrentStep(2);
  };

  // ─── Facility final submit ────────────────────────────────────────────────
  const handleFacilityFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const emailTrimmed = facilityData.email.trim().toLowerCase();
    if (selectedRole === 'PHARMACY' && !emailTrimmed.endsWith('@pharm.com')) {
      setErrorMessage('Pharmacy accounts must use an official email ending with @pharm.com.');
      return;
    }
    if (selectedRole === 'HOSPITAL' && !emailTrimmed.endsWith('@hos.com')) {
      setErrorMessage('Hospital accounts must use an official email ending with @hos.com.');
      return;
    }
    if (!facilityData.registrationNumber.trim()) {
      setErrorMessage('Registration / Drug License number is mandatory for healthcare facilities.');
      return;
    }
    setIsLoading(true);
    try {
      const fullAddress = `${facilityData.doorNumber} ${facilityData.street}, ${facilityData.area}, ${facilityData.city} - ${facilityData.pincode}`.trim();
      const res = await register({
        role: selectedRole!, name: facilityData.organizationName,
        organizationName: facilityData.organizationName, authorizedPerson: facilityData.authorizedPerson,
        email: facilityData.email, phone: facilityData.contactNumber, password: facilityData.password,
        registrationNumber: facilityData.registrationNumber,
        hospitalType: selectedRole === 'HOSPITAL' ? facilityData.hospitalType : undefined,
        address: fullAddress, doorNumber: facilityData.doorNumber, street: facilityData.street,
        area: facilityData.area, city: facilityData.city, district: facilityData.district,
        state: facilityData.state, pincode: facilityData.pincode,
        latitude: facilityData.latitude, longitude: facilityData.longitude,
        emergencySupport24x7: facilityData.emergencySupport24x7,
        documentUrl: facilityData.documentUrl, logoUrl: facilityData.logoUrl,
      });
      setIsLoading(false);
      if (res.success) {
        setSubmittedFacilityName(facilityData.organizationName);
        setIsSuccessSubmitted(true);
      } else {
        setErrorMessage(res.error || 'Registration failed.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Registration failed.');
    }
  };

  // ─── Success screen ────────────────────────────────────────────────────────
  if (isSuccessSubmitted) {
    return (
      <AuthLayout>
        <div style={{ padding: '40px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Clock style={{ width: 30, height: 30, color: '#d97706' }} />
          </div>
          <div>
            <span style={{
              display: 'inline-block', fontSize: 10, fontWeight: 800,
              padding: '3px 10px', borderRadius: 99,
              background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a',
              textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 10,
            }}>
              Pending Administrator Verification
            </span>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 900, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              Registration Submitted
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
              Your <strong style={{ color: '#374151' }}>{selectedRole?.toLowerCase()}</strong> account for{' '}
              <strong style={{ color: '#374151' }}>{submittedFacilityName}</strong> is waiting for license verification.
            </p>
          </div>
          <div style={{
            width: '100%', padding: '16px', background: '#f8fafc',
            border: '1px solid #e2e8f0', borderRadius: 12, textAlign: 'left',
          }}>
            {[
              'Your regulatory documents have been logged in the audit queue.',
              'The State Drug Controller will authenticate your drug license.',
              "Once approved, you'll receive access to manage inventory and receive requests.",
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: i < 2 ? 8 : 0 }}>
                <CheckCircle2 style={{ width: 13, height: 13, color: '#059669', flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.5 }}>{item}</p>
              </div>
            ))}
          </div>
          <Link to="/auth/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '11px 22px', borderRadius: 10,
            background: '#1d4ed8', color: '#fff',
            fontSize: 13, fontWeight: 800, textDecoration: 'none',
          }}>
            Back to Login
            <ArrowRight style={{ width: 14, height: 14 }} />
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // ─── SCREEN 0: Role selection ──────────────────────────────────────────────
  if (!selectedRole) {
    const roles = [
      {
        role: 'PATIENT' as UserRole,
        icon: User, label: 'User',
        badge: 'Public',
        desc: 'Search medicines, check local availability, and create 15-min QR holds (for residents & visitors).',
        color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe',
        cta: 'Register as User',
      },
      {
        role: 'PHARMACY' as UserRole,
        icon: Building2, label: 'Pharmacy',
        badge: 'Requires @pharm.com',
        desc: 'Manage inventory, batches, and fulfill hospital emergency medicine requests.',
        color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4',
        cta: 'Register Pharmacy',
      },
      {
        role: 'HOSPITAL' as UserRole,
        icon: Hospital, label: 'Hospital',
        badge: 'Requires @hos.com',
        desc: 'Multi-speciality trauma hub — submit ICU emergency requisitions and smart allocation requests.',
        color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe',
        cta: 'Register Hospital',
      },
    ];

    return (
      <AuthLayout maxWidth={560}>
        {/* Header */}
        <div style={{ padding: '28px 32px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
          <BrandMark />
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 900, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
              Create your MedShare Account
            </h2>
            <p style={{ fontSize: 12.5, color: '#64748b', margin: 0 }}>Choose your account type to begin.</p>
          </div>
        </div>

        <div style={{ padding: '24px 32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {roles.map(({ role, icon: Icon, label, badge, desc, color, bg, border, cta }) => (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  padding: '16px',
                  borderRadius: 12,
                  border: `1.5px solid ${border}`,
                  background: bg,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.12s ease',
                  width: '100%',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${color}20`; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 11, flexShrink: 0,
                  background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon style={{ width: 20, height: 20, color: '#fff' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-heading)' }}>{label}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99,
                      background: '#fff', color: color, border: `1px solid ${border}`,
                      textTransform: 'uppercase' as const, letterSpacing: '0.06em',
                    }}>{badge}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 8px', lineHeight: 1.55 }}>{desc}</p>
                  <span style={{ fontSize: 12, fontWeight: 700, color, display: 'flex', alignItems: 'center', gap: 5 }}>
                    {cta} <ArrowRight style={{ width: 13, height: 13 }} />
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid #f1f5f9', textAlign: 'center', fontSize: 12.5, color: '#64748b' }}>
            Already registered?{' '}
            <Link to="/auth/login" style={{ color: '#1d4ed8', fontWeight: 800, textDecoration: 'none' }}>Sign In</Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // ─── SCREEN 1: User (Patient) Registration ────────────────────────────────
  if (selectedRole === 'PATIENT') {
    return (
      <AuthLayout maxWidth={560}>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>General Public Account</span>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 900, color: '#0f172a', margin: '2px 0 0', letterSpacing: '-0.02em' }}>
              Register as User
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setSelectedRole(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 12, fontWeight: 700, color: '#64748b',
              background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8,
              padding: '6px 11px', cursor: 'pointer',
            }}
          >
            <ArrowLeft style={{ width: 13, height: 13 }} />
            Change Role
          </button>
        </div>

        <div style={{ padding: '24px 32px' }}>
          {errorMessage && <div style={{ marginBottom: 16 }}><ErrorBanner message={errorMessage} /></div>}

          <form onSubmit={handlePatientSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FieldWrapper label="Full Name">
              <StyledInput type="text" required placeholder="e.g. Rahul Sharma" value={patientData.name}
                onChange={e => setPatientData({ ...patientData, name: e.target.value })} />
            </FieldWrapper>

            <FieldWrapper label="Mobile Number">
              <StyledInput type="tel" required placeholder="+91 98401 23456" value={patientData.phone}
                onChange={e => setPatientData({ ...patientData, phone: e.target.value })} />
            </FieldWrapper>

            <FieldWrapper label="Email Address" colSpan>
              <StyledInput type="email" required placeholder="name@example.com" value={patientData.email}
                onChange={e => setPatientData({ ...patientData, email: e.target.value })} />
            </FieldWrapper>

            <FieldWrapper label="Password">
              <StyledInput type="password" required placeholder="Min. 6 characters" value={patientData.password}
                onChange={e => setPatientData({ ...patientData, password: e.target.value })} />
            </FieldWrapper>

            <FieldWrapper label="Confirm Password">
              <StyledInput type="password" required placeholder="Re-enter password" value={patientData.confirmPassword}
                onChange={e => setPatientData({ ...patientData, confirmPassword: e.target.value })} />
            </FieldWrapper>

            <FieldWrapper label="Street Address" colSpan>
              <StyledInput type="text" required placeholder="House / Street / Locality" value={patientData.address}
                onChange={e => setPatientData({ ...patientData, address: e.target.value })} />
            </FieldWrapper>

            <FieldWrapper label="City">
              <StyledInput type="text" required value={patientData.city}
                onChange={e => setPatientData({ ...patientData, city: e.target.value })} />
            </FieldWrapper>

            <FieldWrapper label="Pincode">
              <StyledInput type="text" required value={patientData.pincode}
                onChange={e => setPatientData({ ...patientData, pincode: e.target.value })} />
            </FieldWrapper>

            <div style={{ gridColumn: '1 / -1', marginTop: 4 }}>
              <SubmitBtn label="Create User Account" loadingLabel="Creating Account…" loading={isLoading} />
            </div>
          </form>

          <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid #f1f5f9', textAlign: 'center', fontSize: 12.5, color: '#64748b' }}>
            Already have an account?{' '}
            <Link to="/auth/login" style={{ color: '#1d4ed8', fontWeight: 800, textDecoration: 'none' }}>Sign In</Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // ─── SCREEN 2: Pharmacy / Hospital 2-Step Wizard ──────────────────────────
  const isHospital = selectedRole === 'HOSPITAL';
  const roleTitle = isHospital ? 'Hospital' : 'Pharmacy';
  const accentColor = isHospital ? '#7c3aed' : '#0d9488';

  return (
    <AuthLayout maxWidth={640}>
      {/* Header */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 800, color: accentColor, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
              Healthcare Organization Onboarding
            </span>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 900, color: '#0f172a', margin: '2px 0 0', letterSpacing: '-0.02em' }}>
              Register {roleTitle} Account
            </h2>
          </div>
          <button
            type="button"
            onClick={() => { setSelectedRole(null); setCurrentStep(1); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 12, fontWeight: 700, color: '#64748b',
              background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8,
              padding: '6px 11px', cursor: 'pointer',
            }}
          >
            <ArrowLeft style={{ width: 13, height: 13 }} />
            Change Role
          </button>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {[1, 2].map((step) => {
            const done = step < currentStep;
            const active = step === currentStep;
            return (
              <React.Fragment key={step}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800,
                    ...(done
                      ? { background: '#ecfdf5', color: '#059669' }
                      : active
                      ? { background: '#1d4ed8', color: '#fff' }
                      : { background: '#f1f5f9', color: '#94a3b8' }),
                  }}>
                    {done ? <Check style={{ width: 12, height: 12 }} /> : step}
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 700,
                    color: active ? '#0f172a' : done ? '#059669' : '#94a3b8',
                  }}>
                    {step === 1 ? 'Account Details' : `${roleTitle} Details`}
                  </span>
                </div>
                {step < 2 && (
                  <div style={{ flex: 1, height: 2, background: currentStep > 1 ? '#a7f3d0' : '#e2e8f0', borderRadius: 99, maxWidth: 60 }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {errorMessage && <div style={{ marginBottom: 16 }}><ErrorBanner message={errorMessage} /></div>}

        {/* STEP 1 */}
        {currentStep === 1 && (
          <form onSubmit={handleFacilityStep1Next} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FieldWrapper label={`${roleTitle} Name`} colSpan>
              <StyledInput type="text" required
                placeholder={isHospital ? 'e.g. Grace Multi-Speciality Hospital & Trauma Care' : 'e.g. Apollo Pharmacy – Tisaiyanvilai'}
                value={facilityData.organizationName}
                onChange={e => setFacilityData({ ...facilityData, organizationName: e.target.value })} />
            </FieldWrapper>

            <FieldWrapper label={isHospital ? 'Authorized Administrator / Medical Director' : 'Authorized Pharmacist In-Charge'}>
              <StyledInput type="text" required placeholder="Full Legal Name" value={facilityData.authorizedPerson}
                onChange={e => setFacilityData({ ...facilityData, authorizedPerson: e.target.value })} />
            </FieldWrapper>

            <FieldWrapper label="Contact Phone Number">
              <StyledInput type="tel" required placeholder="+91 94431 88201" value={facilityData.contactNumber}
                onChange={e => setFacilityData({ ...facilityData, contactNumber: e.target.value })} />
            </FieldWrapper>

            <FieldWrapper
              label={`Official ${roleTitle} Email`}
              badge={`Required: @${isHospital ? 'hos.com' : 'pharm.com'}`}
              hint={`Email must end with @${isHospital ? 'hos.com' : 'pharm.com'} — other domains not accepted.`}
              colSpan
            >
              <StyledInput type="email" required
                placeholder={isHospital ? 'e.g. apolloclinic@hos.com' : 'e.g. apollo@pharm.com'}
                value={facilityData.email}
                onChange={e => setFacilityData({ ...facilityData, email: e.target.value })} />
            </FieldWrapper>

            <FieldWrapper label="Password">
              <StyledInput type="password" required placeholder="Min. 6 characters" value={facilityData.password}
                onChange={e => setFacilityData({ ...facilityData, password: e.target.value })} />
            </FieldWrapper>

            <FieldWrapper label="Confirm Password">
              <StyledInput type="password" required placeholder="Re-enter password" value={facilityData.confirmPassword}
                onChange={e => setFacilityData({ ...facilityData, confirmPassword: e.target.value })} />
            </FieldWrapper>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <SubmitBtn label="Continue to Step 2" fullWidth={false} />
            </div>
          </form>
        )}

        {/* STEP 2 */}
        {currentStep === 2 && (
          <form onSubmit={handleFacilityFinalSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FieldWrapper label={isHospital ? 'Hospital Accreditation Number' : 'Pharmacy Drug License Number'}>
              <StyledInput type="text" required monospace
                placeholder={isHospital ? 'TN-HOSP-2024-XXXX' : 'TN-PHARM-2024-XXXX'}
                value={facilityData.registrationNumber}
                onChange={e => setFacilityData({ ...facilityData, registrationNumber: e.target.value })} />
            </FieldWrapper>

            {isHospital && (
              <FieldWrapper label="Hospital Type">
                <select
                  value={facilityData.hospitalType}
                  onChange={e => setFacilityData({ ...facilityData, hospitalType: e.target.value })}
                  style={{ ...inputStyle }}
                >
                  <option>Multi-Speciality Hospital</option>
                  <option>Trauma & Emergency Care Centre</option>
                  <option>Taluk Government Hospital</option>
                  <option>Community Healthcare Centre</option>
                </select>
              </FieldWrapper>
            )}

            <FieldWrapper label="Door / Building Number">
              <StyledInput type="text" required placeholder="e.g. Shop 14-16" value={facilityData.doorNumber}
                onChange={e => setFacilityData({ ...facilityData, doorNumber: e.target.value })} />
            </FieldWrapper>

            <FieldWrapper label="Street / Road">
              <StyledInput type="text" required placeholder="e.g. Radhapuram Road" value={facilityData.street}
                onChange={e => setFacilityData({ ...facilityData, street: e.target.value })} />
            </FieldWrapper>

            <FieldWrapper label="Area / Locality">
              <StyledInput type="text" required placeholder="e.g. Bus Stand Junction" value={facilityData.area}
                onChange={e => setFacilityData({ ...facilityData, area: e.target.value })} />
            </FieldWrapper>

            <FieldWrapper label="City">
              <StyledInput type="text" required value={facilityData.city}
                onChange={e => setFacilityData({ ...facilityData, city: e.target.value })} />
            </FieldWrapper>

            <FieldWrapper label="Pincode">
              <StyledInput type="text" required value={facilityData.pincode}
                onChange={e => setFacilityData({ ...facilityData, pincode: e.target.value })} />
            </FieldWrapper>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 10,
                cursor: 'pointer', fontSize: 12.5, fontWeight: 700, color: '#374151',
                padding: '12px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 9,
              }}>
                <input
                  type="checkbox"
                  checked={facilityData.emergencySupport24x7}
                  onChange={e => setFacilityData({ ...facilityData, emergencySupport24x7: e.target.checked })}
                  style={{ width: 15, height: 15, accentColor: '#1d4ed8' }}
                />
                24×7 Emergency Services / Night Dispenser Enabled
              </label>
            </div>

            <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #f1f5f9', paddingTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 16px', borderRadius: 9,
                  background: '#f1f5f9', border: '1.5px solid #e2e8f0',
                  fontSize: 12.5, fontWeight: 700, color: '#374151',
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft style={{ width: 13, height: 13 }} />
                Back to Step 1
              </button>
              <SubmitBtn label="Submit Registration" loadingLabel="Submitting…" loading={isLoading} fullWidth={false} />
            </div>
          </form>
        )}

        <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid #f1f5f9', textAlign: 'center', fontSize: 12.5, color: '#64748b' }}>
          Already registered?{' '}
          <Link to="/auth/login" style={{ color: '#1d4ed8', fontWeight: 800, textDecoration: 'none' }}>Sign In</Link>
        </div>
      </div>
    </AuthLayout>
  );
};

// =============================================================================
// 3. FORGOT PASSWORD PAGE
// =============================================================================
export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setIsSubmitted(true);
  };

  return (
    <AuthLayout>
      <div style={{ padding: '28px 32px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
        <BrandMark />
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 900, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            Reset Password
          </h2>
          <p style={{ fontSize: 12.5, color: '#64748b', margin: 0 }}>
            Enter your registered email and we'll send a reset link.
          </p>
        </div>
      </div>

      <div style={{ padding: '28px 32px' }}>
        {isSubmitted ? (
          <div style={{
            padding: '24px', background: '#ecfdf5', border: '1px solid #a7f3d0',
            borderRadius: 14, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          }}>
            <CheckCircle2 style={{ width: 36, height: 36, color: '#059669' }} />
            <p style={{ fontSize: 13, fontWeight: 700, color: '#065f46', margin: 0 }}>
              Reset instructions dispatched to <strong>{email}</strong>.
            </p>
            <Link to="/auth/login" style={{ fontSize: 12.5, fontWeight: 800, color: '#1d4ed8', textDecoration: 'none' }}>
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FieldWrapper label="Registered Email Address">
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#94a3b8' }} />
                <StyledInput type="email" required placeholder="name@example.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  style={{ paddingLeft: 38 }} />
              </div>
            </FieldWrapper>
            <SubmitBtn label="Send Reset Link" />
          </form>
        )}

        {!isSubmitted && (
          <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid #f1f5f9', textAlign: 'center', fontSize: 12.5, color: '#64748b' }}>
            Remember your password?{' '}
            <Link to="/auth/login" style={{ color: '#1d4ed8', fontWeight: 800, textDecoration: 'none' }}>Sign In</Link>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};
