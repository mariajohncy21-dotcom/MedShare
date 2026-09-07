import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Home } from './pages/Home';
import { FindMedicine } from './pages/FindMedicine';
import { EmergencyRequestPage } from './pages/EmergencyRequest';
import { Reservations } from './pages/Reservations';
import { PharmacyDashboard } from './pages/PharmacyDashboard';
import { HospitalDashboard } from './pages/HospitalDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { RedistributionHub } from './pages/RedistributionHub';
import { MapViewPage } from './pages/MapViewPage';
import { HowItWorks } from './pages/HowItWorks';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage, RegisterPage, ForgotPasswordPage } from './pages/AuthPages';

// Scroll to top component on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <AppProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col bg-[#f1f5f9] text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
          {/* Main Global Navigation */}
          <Navbar />

          {/* Dynamic Page Routing with Strict RBAC Protections */}
          <main className="flex-1">
            <Routes>
              {/* Public / Citizen Accessible Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<FindMedicine />} />
              <Route path="/emergency" element={<EmergencyRequestPage />} />
              <Route path="/reservations" element={<Reservations />} />
              <Route path="/map" element={<MapViewPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/how-it-works" element={<HowItWorks />} />

              {/* Authentication Routes */}
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/auth/register" element={<RegisterPage />} />
              <Route path="/auth/forgot" element={<ForgotPasswordPage />} />

              {/* Pharmacy Protected Console (Strict RBAC: Role = PHARMACY & Approved) */}
              <Route
                path="/pharmacy"
                element={
                  <ProtectedRoute allowedRoles={['PHARMACY']} requireApproval={true}>
                    <PharmacyDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Hospital Protected Console (Strict RBAC: Role = HOSPITAL & Approved) */}
              <Route
                path="/hospital"
                element={
                  <ProtectedRoute allowedRoles={['HOSPITAL']} requireApproval={true}>
                    <HospitalDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Admin Protected Console (Strict RBAC: Role = ADMIN) */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Redistribution Protected Console (Pharmacies, Hospitals, and Admins) */}
              <Route
                path="/redistribution"
                element={
                  <ProtectedRoute allowedRoles={['PHARMACY', 'HOSPITAL', 'ADMIN']}>
                    <RedistributionHub />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>

          {/* Global Healthcare Network Footer */}
          <Footer />
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
