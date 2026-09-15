import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { MedShareAIChatbot } from './components/common/MedShareAIChatbot';

// Public pages
import { Home } from './pages/Home';
import { FindMedicine } from './pages/FindMedicine';
import { EmergencyRequestPage } from './pages/EmergencyRequest';
import { MapViewPage } from './pages/MapViewPage';
import { HowItWorks } from './pages/HowItWorks';
import { LoginPage, RegisterPage, ForgotPasswordPage } from './pages/AuthPages';

// Patient Console
import { PatientDashboard } from './pages/patient/PatientDashboard';
import { Reservations } from './pages/Reservations';

// Pharmacy Console
import { PharmacyDashboardPage } from './pages/pharmacy/PharmacyDashboardPage';

// Hospital Console
import { HospitalDashboardPage } from './pages/hospital/HospitalDashboardPage';
import { RedistributionHub } from './pages/RedistributionHub';
import { SettingsPage } from './pages/SettingsPage';

// Admin Console
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';

// Shared pages
import { BulkUploadPage } from './pages/shared/BulkUploadPage';

// ─── Scroll-to-top on route change ───────────────────────────────────────────
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// ─── Navbar visibility ────────────────────────────────────────────────────────
// Hide the public Navbar on console routes — ConsoleLayout has its own topbar
function NavbarContainer() {
  const { pathname } = useLocation();
  const isConsole =
    pathname.startsWith('/patient/') ||
    pathname.startsWith('/pharmacy/') ||
    pathname.startsWith('/hospital/') ||
    pathname.startsWith('/admin/');
  if (isConsole) return null;
  return <Navbar />;
}

function FooterContainer() {
  const { pathname } = useLocation();
  const isConsole =
    pathname.startsWith('/patient/') ||
    pathname.startsWith('/pharmacy/') ||
    pathname.startsWith('/hospital/') ||
    pathname.startsWith('/admin/');
  if (isConsole) return null;
  return <Footer />;
}

export function App() {
  return (
    <AppProvider>
      <Router>
        <ScrollToTop />

        <NavbarContainer />

        <Routes>
          {/* ─── Public Routes ─────────────────────────────────────────── */}
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<FindMedicine />} />
          <Route path="/emergency" element={<EmergencyRequestPage />} />
          <Route path="/map" element={<MapViewPage />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* ─── Auth Routes ───────────────────────────────────────────── */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/forgot" element={<ForgotPasswordPage />} />

          {/* ─── Patient Console (/patient/*) ──────────────────────────── */}
          <Route path="/patient" element={<Navigate to="/patient/dashboard" replace />} />
          <Route path="/patient/dashboard" element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <PatientDashboard />
            </ProtectedRoute>
          } />
          <Route path="/patient/search" element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <FindMedicine />
            </ProtectedRoute>
          } />
          <Route path="/patient/map" element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <MapViewPage />
            </ProtectedRoute>
          } />
          <Route path="/patient/reservations" element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <Reservations />
            </ProtectedRoute>
          } />
          <Route path="/patient/requests" element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <EmergencyRequestPage />
            </ProtectedRoute>
          } />
          <Route path="/patient/notifications" element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <PatientDashboard />
            </ProtectedRoute>
          } />
          <Route path="/patient/*" element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <PatientDashboard />
            </ProtectedRoute>
          } />

          {/* ─── Pharmacy Console (/pharmacy/*) ────────────────────────── */}
          <Route path="/pharmacy" element={<Navigate to="/pharmacy/dashboard" replace />} />
          <Route path="/pharmacy/dashboard" element={
            <ProtectedRoute allowedRoles={['PHARMACY']} requireApproval={true}>
              <PharmacyDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/pharmacy/inventory" element={
            <ProtectedRoute allowedRoles={['PHARMACY']} requireApproval={true}>
              <PharmacyDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/pharmacy/hospital-requests" element={
            <ProtectedRoute allowedRoles={['PHARMACY']} requireApproval={true}>
              <PharmacyDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/pharmacy/emergency" element={
            <ProtectedRoute allowedRoles={['PHARMACY']} requireApproval={true}>
              <PharmacyDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/pharmacy/reservations" element={
            <ProtectedRoute allowedRoles={['PHARMACY']} requireApproval={true}>
              <PharmacyDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/pharmacy/bulk-upload" element={
            <ProtectedRoute allowedRoles={['PHARMACY']} requireApproval={true}>
              <BulkUploadPage />
            </ProtectedRoute>
          } />
          <Route path="/pharmacy/transfers" element={
            <ProtectedRoute allowedRoles={['PHARMACY']} requireApproval={true}>
              <RedistributionHub />
            </ProtectedRoute>
          } />
          <Route path="/pharmacy/*" element={
            <ProtectedRoute allowedRoles={['PHARMACY']} requireApproval={true}>
              <PharmacyDashboardPage />
            </ProtectedRoute>
          } />

          {/* ─── Hospital Console (/hospital/*) ────────────────────────── */}
          <Route path="/hospital" element={<Navigate to="/hospital/dashboard" replace />} />
          <Route path="/hospital/dashboard" element={
            <ProtectedRoute allowedRoles={['HOSPITAL']} requireApproval={true}>
              <HospitalDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/hospital/patients" element={
            <ProtectedRoute allowedRoles={['HOSPITAL']} requireApproval={true}>
              <HospitalDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/hospital/inventory" element={
            <ProtectedRoute allowedRoles={['HOSPITAL']} requireApproval={true}>
              <HospitalDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/hospital/request-medicine" element={
            <ProtectedRoute allowedRoles={['HOSPITAL']} requireApproval={true}>
              <HospitalDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/hospital/emergency" element={
            <ProtectedRoute allowedRoles={['HOSPITAL']} requireApproval={true}>
              <EmergencyRequestPage />
            </ProtectedRoute>
          } />
          <Route path="/hospital/bulk-upload" element={
            <ProtectedRoute allowedRoles={['HOSPITAL']} requireApproval={true}>
              <BulkUploadPage />
            </ProtectedRoute>
          } />
          <Route path="/hospital/transfers" element={
            <ProtectedRoute allowedRoles={['HOSPITAL']} requireApproval={true}>
              <RedistributionHub />
            </ProtectedRoute>
          } />
          <Route path="/hospital/nearby-pharmacies" element={
            <ProtectedRoute allowedRoles={['HOSPITAL']} requireApproval={true}>
              <MapViewPage />
            </ProtectedRoute>
          } />
          <Route path="/hospital/*" element={
            <ProtectedRoute allowedRoles={['HOSPITAL']} requireApproval={true}>
              <HospitalDashboardPage />
            </ProtectedRoute>
          } />

          {/* ─── Admin Console (/admin/*) ───────────────────────────────── */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/verification" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/pharmacies" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/hospitals" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/inventory" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/audit-logs" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/*" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          } />

          {/* ─── Legacy redirects ───────────────────────────────────────── */}
          <Route path="/reservations" element={<Reservations />} />
          <Route path="/redistribution" element={
            <ProtectedRoute allowedRoles={['PHARMACY', 'HOSPITAL', 'ADMIN']}>
              <RedistributionHub />
            </ProtectedRoute>
          } />

          {/* ─── 404 catch-all ──────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <FooterContainer />

        {/* Global floating AI Chatbot (available on all pages) */}
        <MedShareAIChatbot />
      </Router>
    </AppProvider>
  );
}

export default App;
