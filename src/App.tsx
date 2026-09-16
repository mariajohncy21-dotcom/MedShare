import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
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
import { PharmacyInventoryPage } from './pages/pharmacy/PharmacyInventoryPage';
import { PharmacyAddMedicinePage } from './pages/pharmacy/PharmacyAddMedicinePage';
import { PharmacyUpdateStockPage } from './pages/pharmacy/PharmacyUpdateStockPage';
import { PharmacyStockHistoryPage } from './pages/pharmacy/PharmacyStockHistoryPage';
import { PharmacyEmergencyRequestsPage } from './pages/pharmacy/PharmacyEmergencyRequestsPage';
import { PharmacyReservationsPage } from './pages/pharmacy/PharmacyReservationsPage';
import { PharmacyDailyReportsPage } from './pages/pharmacy/PharmacyDailyReportsPage';
import { PharmacyNotificationsPage } from './pages/pharmacy/PharmacyNotificationsPage';
import { PharmacyProfilePage } from './pages/pharmacy/PharmacyProfilePage';
import { PharmacySettingsPage } from './pages/pharmacy/PharmacySettingsPage';

// Hospital Console
import { HospitalDashboardPage } from './pages/hospital/HospitalDashboardPage';
import { HospitalPatientsPage } from './pages/hospital/HospitalPatientsPage';
import { HospitalInventoryPage } from './pages/hospital/HospitalInventoryPage';
import { HospitalAddMedicinePage } from './pages/hospital/HospitalAddMedicinePage';
import { HospitalStockHistoryPage } from './pages/hospital/HospitalStockHistoryPage';
import { HospitalRequestsPage } from './pages/hospital/HospitalRequestsPage';
import { HospitalPharmacySearchPage } from './pages/hospital/HospitalPharmacySearchPage';
import { HospitalMapPage } from './pages/hospital/HospitalMapPage';
import { HospitalEmergencyRequestsPage } from './pages/hospital/HospitalEmergencyRequestsPage';
import { HospitalAllocationPage } from './pages/hospital/HospitalAllocationPage';
import { HospitalReservationsPage } from './pages/hospital/HospitalReservationsPage';
import { HospitalTransfersPage } from './pages/hospital/HospitalTransfersPage';
import { HospitalDailyReportsPage } from './pages/hospital/HospitalDailyReportsPage';
import { HospitalNotificationsPage } from './pages/hospital/HospitalNotificationsPage';
import { HospitalProfilePage } from './pages/hospital/HospitalProfilePage';
import { HospitalSettingsPage } from './pages/hospital/HospitalSettingsPage';
import { RedistributionHub } from './pages/RedistributionHub';
import { SettingsPage } from './pages/SettingsPage';

// Admin Console
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminPharmaciesPage } from './pages/admin/AdminPharmaciesPage';
import { AdminHospitalsPage } from './pages/admin/AdminHospitalsPage';
import { AdminVerificationPage } from './pages/admin/AdminVerificationPage';
import { AdminMedicinesPage } from './pages/admin/AdminMedicinesPage';
import { AdminInventoryPage } from './pages/admin/AdminInventoryPage';
import { AdminShortagesPage } from './pages/admin/AdminShortagesPage';
import { AdminRequestsPage } from './pages/admin/AdminRequestsPage';
import { AdminReservationsPage } from './pages/admin/AdminReservationsPage';
import { AdminTransfersPage } from './pages/admin/AdminTransfersPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

// Shared pages
import { BulkUploadPage } from './pages/shared/BulkUploadPage';

// ─── Scroll-to-top on route change ───────────────────────────────────────────
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// ─── Route Guards for Public & Auth Pages ───────────────────────────────────
// Requires user to be logged in as a citizen/patient to view the website.
// Unauthenticated visitors are redirected to /login.
// PHARMACY, HOSPITAL, and ADMIN are strictly redirected to their respective console dashboards.
function PublicRouteGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, isAuthenticated } = useApp();

  // If not logged in or guest, force redirect to /login
  if (!isAuthenticated || !currentUser || currentUser.id === 'guest') {
    return <Navigate to="/login" replace />;
  }

  // If facility or admin, strictly redirect to their console
  if (currentUser.role === 'PHARMACY') {
    return <Navigate to="/pharmacy/dashboard" replace />;
  }
  if (currentUser.role === 'HOSPITAL') {
    return <Navigate to="/hospital/dashboard" replace />;
  }
  if (currentUser.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
}

// Route guard for auth pages - redirects logged-in users away from /login & /register
function AuthRouteGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, isAuthenticated } = useApp();

  if (isAuthenticated && currentUser && currentUser.id !== 'guest') {
    if (currentUser.role === 'PHARMACY') {
      return <Navigate to="/pharmacy/dashboard" replace />;
    }
    if (currentUser.role === 'HOSPITAL') {
      return <Navigate to="/hospital/dashboard" replace />;
    }
    if (currentUser.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (currentUser.role === 'PATIENT') {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}

// ─── Navbar visibility ────────────────────────────────────────────────────────
// Strictly show public Navbar ONLY when user is logged in as PATIENT
function NavbarContainer() {
  const { pathname } = useLocation();
  const { currentUser, isAuthenticated } = useApp();

  // If not logged in or is guest, NEVER show navbar
  if (!isAuthenticated || !currentUser || currentUser.id === 'guest') {
    return null;
  }

  // If facility or admin, strictly NEVER show public navbar
  if (currentUser.role !== 'PATIENT') {
    return null;
  }

  // Hide on auth routes (/login, /register, etc.)
  const isAuth =
    pathname.startsWith('/auth') ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot';
  if (isAuth) return null;

  // Hide on console routes
  const isConsole =
    pathname.startsWith('/pharmacy') ||
    pathname.startsWith('/hospital') ||
    pathname.startsWith('/admin');
  if (isConsole) return null;

  return <Navbar />;
}

// Strictly show public Footer ONLY when user is logged in as PATIENT
function FooterContainer() {
  const { pathname } = useLocation();
  const { currentUser, isAuthenticated } = useApp();

  // If not logged in or is guest, NEVER show footer
  if (!isAuthenticated || !currentUser || currentUser.id === 'guest') {
    return null;
  }

  // If facility or admin, strictly hide public footer
  if (currentUser.role !== 'PATIENT') {
    return null;
  }

  const isAuth =
    pathname.startsWith('/auth') ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot';
  if (isAuth) return null;

  const isConsole =
    pathname.startsWith('/pharmacy') ||
    pathname.startsWith('/hospital') ||
    pathname.startsWith('/admin');
  if (isConsole) return null;

  return <Footer />;
}

function ChatbotContainer() {
  const { pathname } = useLocation();
  const { currentUser, isAuthenticated } = useApp();

  // Only show chatbot for logged in users
  if (!isAuthenticated || !currentUser || currentUser.id === 'guest') return null;

  const isAuth =
    pathname.startsWith('/auth') ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot';
  if (isAuth) return null;

  return <MedShareAIChatbot />;
}

export function App() {
  return (
    <AppProvider>
      <Router>
        <ScrollToTop />

        <NavbarContainer />

        <Routes>
          {/* ─── Public/Citizen Routes (Protected: Requires Login) ──────── */}
          <Route path="/" element={<PublicRouteGuard><Home /></PublicRouteGuard>} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/search" element={<PublicRouteGuard><FindMedicine /></PublicRouteGuard>} />
          <Route path="/find-medicine" element={<Navigate to="/search" replace />} />
          <Route path="/search-medicine" element={<Navigate to="/search" replace />} />
          <Route path="/search-image" element={<Navigate to="/search" replace />} />
          <Route path="/emergency" element={<PublicRouteGuard><EmergencyRequestPage /></PublicRouteGuard>} />
          <Route path="/map" element={<PublicRouteGuard><MapViewPage /></PublicRouteGuard>} />
          <Route path="/reservations" element={<PublicRouteGuard><Reservations /></PublicRouteGuard>} />
          <Route path="/how-it-works" element={<PublicRouteGuard><HowItWorks /></PublicRouteGuard>} />
          <Route path="/settings" element={<PublicRouteGuard><SettingsPage /></PublicRouteGuard>} />

          {/* ─── Auth Routes ───────────────────────────────────────────── */}
          <Route path="/login" element={<AuthRouteGuard><LoginPage /></AuthRouteGuard>} />
          <Route path="/register" element={<AuthRouteGuard><RegisterPage /></AuthRouteGuard>} />
          <Route path="/auth/login" element={<AuthRouteGuard><LoginPage /></AuthRouteGuard>} />
          <Route path="/auth/register" element={<AuthRouteGuard><RegisterPage /></AuthRouteGuard>} />
          <Route path="/auth/forgot" element={<AuthRouteGuard><ForgotPasswordPage /></AuthRouteGuard>} />

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
          <Route path="/patient/image-search" element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <FindMedicine />
            </ProtectedRoute>
          } />
          <Route path="/patient/nearby" element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <MapViewPage />
            </ProtectedRoute>
          } />
          <Route path="/patient/profile" element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <PatientDashboard />
            </ProtectedRoute>
          } />
          <Route path="/patient/settings" element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <SettingsPage />
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
              <PharmacyInventoryPage />
            </ProtectedRoute>
          } />
          <Route path="/pharmacy/inventory/add" element={
            <ProtectedRoute allowedRoles={['PHARMACY']} requireApproval={true}>
              <PharmacyAddMedicinePage />
            </ProtectedRoute>
          } />
          <Route path="/pharmacy/inventory/update" element={
            <ProtectedRoute allowedRoles={['PHARMACY']} requireApproval={true}>
              <PharmacyUpdateStockPage />
            </ProtectedRoute>
          } />
          <Route path="/pharmacy/inventory/bulk-upload" element={
            <ProtectedRoute allowedRoles={['PHARMACY']} requireApproval={true}>
              <BulkUploadPage />
            </ProtectedRoute>
          } />
          <Route path="/pharmacy/inventory/history" element={
            <ProtectedRoute allowedRoles={['PHARMACY']} requireApproval={true}>
              <PharmacyStockHistoryPage />
            </ProtectedRoute>
          } />
          <Route path="/pharmacy/emergency-requests" element={
            <ProtectedRoute allowedRoles={['PHARMACY']} requireApproval={true}>
              <PharmacyEmergencyRequestsPage />
            </ProtectedRoute>
          } />
          <Route path="/pharmacy/hospital-requests" element={
            <ProtectedRoute allowedRoles={['PHARMACY']} requireApproval={true}>
              <PharmacyEmergencyRequestsPage />
            </ProtectedRoute>
          } />
          <Route path="/pharmacy/emergency" element={
            <ProtectedRoute allowedRoles={['PHARMACY']} requireApproval={true}>
              <PharmacyEmergencyRequestsPage />
            </ProtectedRoute>
          } />
          <Route path="/pharmacy/reservations" element={
            <ProtectedRoute allowedRoles={['PHARMACY']} requireApproval={true}>
              <PharmacyReservationsPage />
            </ProtectedRoute>
          } />
          <Route path="/pharmacy/daily-reports" element={
            <ProtectedRoute allowedRoles={['PHARMACY']} requireApproval={true}>
              <PharmacyDailyReportsPage />
            </ProtectedRoute>
          } />
          <Route path="/pharmacy/notifications" element={
            <ProtectedRoute allowedRoles={['PHARMACY']} requireApproval={true}>
              <PharmacyNotificationsPage />
            </ProtectedRoute>
          } />
          <Route path="/pharmacy/profile" element={
            <ProtectedRoute allowedRoles={['PHARMACY']} requireApproval={true}>
              <PharmacyProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/pharmacy/settings" element={
            <ProtectedRoute allowedRoles={['PHARMACY']} requireApproval={true}>
              <PharmacySettingsPage />
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
              <HospitalPatientsPage />
            </ProtectedRoute>
          } />
          <Route path="/hospital/inventory" element={
            <ProtectedRoute allowedRoles={['HOSPITAL']} requireApproval={true}>
              <HospitalInventoryPage />
            </ProtectedRoute>
          } />
          <Route path="/hospital/inventory/add" element={
            <ProtectedRoute allowedRoles={['HOSPITAL']} requireApproval={true}>
              <HospitalAddMedicinePage />
            </ProtectedRoute>
          } />
          <Route path="/hospital/add-medicine" element={
            <ProtectedRoute allowedRoles={['HOSPITAL']} requireApproval={true}>
              <HospitalAddMedicinePage />
            </ProtectedRoute>
          } />
          <Route path="/hospital/inventory/bulk-upload" element={
            <ProtectedRoute allowedRoles={['HOSPITAL']} requireApproval={true}>
              <BulkUploadPage />
            </ProtectedRoute>
          } />
          <Route path="/hospital/bulk-upload" element={
            <ProtectedRoute allowedRoles={['HOSPITAL']} requireApproval={true}>
              <BulkUploadPage />
            </ProtectedRoute>
          } />
          <Route path="/hospital/inventory/history" element={
            <ProtectedRoute allowedRoles={['HOSPITAL']} requireApproval={true}>
              <HospitalStockHistoryPage />
            </ProtectedRoute>
          } />
          <Route path="/hospital/stock-history" element={
            <ProtectedRoute allowedRoles={['HOSPITAL']} requireApproval={true}>
              <HospitalStockHistoryPage />
            </ProtectedRoute>
          } />
          <Route path="/hospital/requests" element={
            <ProtectedRoute allowedRoles={['HOSPITAL']} requireApproval={true}>
              <HospitalRequestsPage />
            </ProtectedRoute>
          } />
          <Route path="/hospital/request-medicine" element={
            <ProtectedRoute allowedRoles={['HOSPITAL']} requireApproval={true}>
              <HospitalRequestsPage />
            </ProtectedRoute>
          } />
          <Route path="/hospital/pharmacy-search" element={
            <ProtectedRoute allowedRoles={['HOSPITAL']} requireApproval={true}>
              <HospitalPharmacySearchPage />
            </ProtectedRoute>
          } />
          <Route path="/hospital/nearby-pharmacies" element={
            <ProtectedRoute allowedRoles={['HOSPITAL']} requireApproval={true}>
              <HospitalPharmacySearchPage />
            </ProtectedRoute>
          } />
          <Route path="/hospital/pharmacy-search/map" element={
            <ProtectedRoute allowedRoles={['HOSPITAL']} requireApproval={true}>
              <HospitalMapPage />
            </ProtectedRoute>
          } />
          <Route path="/hospital/map" element={
            <ProtectedRoute allowedRoles={['HOSPITAL']} requireApproval={true}>
              <HospitalMapPage />
            </ProtectedRoute>
          } />
          <Route path="/hospital/emergency-requests" element={
            <ProtectedRoute allowedRoles={['HOSPITAL']} requireApproval={true}>
              <HospitalEmergencyRequestsPage />
            </ProtectedRoute>
          } />
          <Route path="/hospital/emergency" element={
            <ProtectedRoute allowedRoles={['HOSPITAL']} requireApproval={true}>
              <HospitalEmergencyRequestsPage />
            </ProtectedRoute>
          } />
          <Route path="/hospital/allocation" element={
            <ProtectedRoute allowedRoles={['HOSPITAL']} requireApproval={true}>
              <HospitalAllocationPage />
            </ProtectedRoute>
          } />
          <Route path="/hospital/smart-allocation" element={
            <ProtectedRoute allowedRoles={['HOSPITAL']} requireApproval={true}>
              <HospitalAllocationPage />
            </ProtectedRoute>
          } />
          <Route path="/hospital/reservations" element={
            <ProtectedRoute allowedRoles={['HOSPITAL']} requireApproval={true}>
              <HospitalReservationsPage />
            </ProtectedRoute>
          } />
          <Route path="/hospital/transfers" element={
            <ProtectedRoute allowedRoles={['HOSPITAL']} requireApproval={true}>
              <HospitalTransfersPage />
            </ProtectedRoute>
          } />
          <Route path="/hospital/daily-reports" element={
            <ProtectedRoute allowedRoles={['HOSPITAL']} requireApproval={true}>
              <HospitalDailyReportsPage />
            </ProtectedRoute>
          } />
          <Route path="/hospital/notifications" element={
            <ProtectedRoute allowedRoles={['HOSPITAL']} requireApproval={true}>
              <HospitalNotificationsPage />
            </ProtectedRoute>
          } />
          <Route path="/hospital/profile" element={
            <ProtectedRoute allowedRoles={['HOSPITAL']} requireApproval={true}>
              <HospitalProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/hospital/settings" element={
            <ProtectedRoute allowedRoles={['HOSPITAL']} requireApproval={true}>
              <HospitalSettingsPage />
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
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminUsersPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/pharmacies" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminPharmaciesPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/hospitals" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminHospitalsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/verification" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminVerificationPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/medicines" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminMedicinesPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/inventory" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminInventoryPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/shortages" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminShortagesPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/requests" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminRequestsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/reservations" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminReservationsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/transfers" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminTransfersPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/analytics" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminAnalyticsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/audit-logs" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminAuditLogsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminSettingsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/profile" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminSettingsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/*" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          } />

          {/* ─── Legacy redirects ───────────────────────────────────────── */}
          <Route path="/reservations" element={<PublicRouteGuard><Reservations /></PublicRouteGuard>} />
          <Route path="/redistribution" element={
            <ProtectedRoute allowedRoles={['PHARMACY', 'HOSPITAL', 'ADMIN']}>
              <RedistributionHub />
            </ProtectedRoute>
          } />

          {/* ─── 404 catch-all ──────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <FooterContainer />

        {/* Global floating AI Chatbot (available on non-auth pages) */}
        <ChatbotContainer />
      </Router>
    </AppProvider>
  );
}

export default App;
