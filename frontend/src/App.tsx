import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { trackPageView } from './services/analytics';

// Public Marketing & Legal Pages
import { LandingPage } from './pages/LandingPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { SecurityPage } from './pages/SecurityPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { CookiePolicyPage } from './pages/CookiePolicyPage';
import { DisclaimerPage } from './pages/DisclaimerPage';
import { FAQPage } from './pages/FAQPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PairDevicePage } from './pages/PairDevicePage';
import { ThankYouPage } from './pages/ThankYouPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Protected Application Pages
import { DashboardPage } from './pages/DashboardPage';
import { JournalPage } from './pages/JournalPage';
import { PerformancePage } from './pages/PerformancePage';
import { StrategyLabPage } from './pages/StrategyLabPage';
import { RiskGuardianPage } from './pages/RiskGuardianPage';
import { AICoachPage } from './pages/AICoachPage';
import { GamificationPage } from './pages/GamificationPage';
import { BridgeAccountsPage } from './pages/BridgeAccountsPage';
import { AdminPage } from './pages/AdminPage';
import { SettingsPage } from './pages/SettingsPage';

// PWA & Consent Components
import { PwaInstallPrompt } from './components/pwa/PwaInstallPrompt';
import { PwaUpdateBanner } from './components/pwa/PwaUpdateBanner';
import { CookieConsentBanner } from './components/common/CookieConsentBanner';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center text-content-muted text-xs font-mono">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span>INITIALIZING META COACH OS...</span>
        </div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  const location = useLocation();

  // Track page views on route change (only fires if user has accepted cookies)
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/welcome" element={<ThankYouPage />} />
        <Route path="/thank-you" element={<ThankYouPage />} />
        <Route path="/pair" element={<PairDevicePage />} />
        <Route path="/methodology" element={<MethodologyPage />} />
        <Route path="/security" element={<SecurityPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/terms-of-service" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/cookies" element={<CookiePolicyPage />} />
        <Route path="/disclaimer" element={<DisclaimerPage />} />
        <Route path="/faq" element={<FAQPage />} />

        {/* Protected Dashboard Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Core Product Pillars */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/performance" element={<PerformancePage />} />
          <Route path="/strategy-lab" element={<StrategyLabPage />} />
          <Route path="/risk-guardian" element={<RiskGuardianPage />} />
          <Route path="/ai-coach" element={<AICoachPage />} />
          <Route path="/rewards" element={<GamificationPage />} />
          <Route path="/gamification" element={<Navigate to="/rewards" replace />} />
          <Route path="/bridge" element={<BridgeAccountsPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Legacy Clean Redirects (Prevent Broken Bookmarks) */}
          <Route path="/analytics" element={<Navigate to="/performance" replace />} />
          <Route path="/calendar" element={<Navigate to="/journal" replace />} />
          <Route path="/sessions" element={<Navigate to="/performance" replace />} />
          <Route path="/symbols" element={<Navigate to="/performance" replace />} />
          <Route path="/trader-dna" element={<Navigate to="/performance" replace />} />
          <Route path="/reports" element={<Navigate to="/performance" replace />} />
          <Route path="/replay" element={<Navigate to="/strategy-lab" replace />} />
        </Route>

        {/* Custom On-Brand 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {/* Cross-Platform PWA Installation & Update Experience */}
      <PwaInstallPrompt />
      <PwaUpdateBanner />

      {/* Compact Cookie Consent Banner (GA4 Opt-In) */}
      <CookieConsentBanner />
    </>
  );
};
