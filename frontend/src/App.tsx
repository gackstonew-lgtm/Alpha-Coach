import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { JournalPage } from './pages/JournalPage';
import { CalendarPage } from './pages/CalendarPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { StrategyLabPage } from './pages/StrategyLabPage';
import { SessionIntelligencePage } from './pages/SessionIntelligencePage';
import { SymbolIntelligencePage } from './pages/SymbolIntelligencePage';
import { TraderDNAPage } from './pages/TraderDNAPage';
import { RiskGuardianPage } from './pages/RiskGuardianPage';
import { ReplayStudioPage } from './pages/ReplayStudioPage';
import { GamificationPage } from './pages/GamificationPage';
import { AICoachPage } from './pages/AICoachPage';
import { ReportsPage } from './pages/ReportsPage';
import { BridgeAccountsPage } from './pages/BridgeAccountsPage';
import { AdminPage } from './pages/AdminPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

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
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="journal" element={<JournalPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="strategy-lab" element={<StrategyLabPage />} />
        <Route path="sessions" element={<SessionIntelligencePage />} />
        <Route path="symbols" element={<SymbolIntelligencePage />} />
        <Route path="trader-dna" element={<TraderDNAPage />} />
        <Route path="risk-guardian" element={<RiskGuardianPage />} />
        <Route path="replay" element={<ReplayStudioPage />} />
        <Route path="gamification" element={<GamificationPage />} />
        <Route path="ai-coach" element={<AICoachPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="bridge" element={<BridgeAccountsPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
