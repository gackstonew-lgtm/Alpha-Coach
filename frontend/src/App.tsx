import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { SecurityPage } from './pages/SecurityPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { CookiePolicyPage } from './pages/CookiePolicyPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PairDevicePage } from './pages/PairDevicePage';

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

// PWA Components
import { PwaInstallPrompt } from './components/pwa/PwaInstallPrompt';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center text-content-muted text-xs font-mono">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>INITIALIZING ALPHA COACH OS...</span>
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
  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/pair" element={<PairDevicePage />} />
        <Route path="/methodology" element={<MethodologyPage />} />
        <Route path="/security" element={<SecurityPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/terms-of-service" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/cookies" element={<CookiePolicyPage />} />

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
          <Route path="/gamification" element={<GamificationPage />} />
          <Route path="/bridge" element={<BridgeAccountsPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Legacy Clean Redirects (Prevent Broken Bookmarks & 404s) */}
          <Route path="/analytics" element={<Navigate to="/performance" replace />} />
          <Route path="/calendar" element={<Navigate to="/journal" replace />} />
          <Route path="/sessions" element={<Navigate to="/performance" replace />} />
          <Route path="/symbols" element={<Navigate to="/performance" replace />} />
          <Route path="/trader-dna" element={<Navigate to="/performance" replace />} />
          <Route path="/reports" element={<Navigate to="/performance" replace />} />
          <Route path="/replay" element={<Navigate to="/strategy-lab" replace />} />
        </Route>

        {/* Global Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Cross-Platform PWA Installation Experience */}
      <PwaInstallPrompt />
    </>
  );
};
