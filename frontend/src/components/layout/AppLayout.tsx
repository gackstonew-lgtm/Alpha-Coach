import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { InstallPrompt } from './InstallPrompt';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const location = useLocation();
  const isChartsRoute = location.pathname.startsWith('/charts');

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground transition-colors duration-200 flex flex-row overflow-x-hidden relative">
      {/* Floating Glass Capsule Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Workspace Canvas (Full-Bleed Edge-to-Edge) */}
      <div className="flex-1 min-w-0 flex flex-col bg-background min-h-[100dvh]">
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} />
        <main
          className={
            isChartsRoute
              ? 'flex-1 flex flex-col min-w-0 min-h-0 p-2 sm:p-3 lg:p-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-4 w-full max-w-none animate-in fade-in duration-200'
              : 'flex-1 p-4 sm:p-6 lg:p-8 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8 w-full max-w-[1600px] mx-auto animate-in fade-in duration-200'
          }
        >
          <Outlet />
        </main>
      </div>

      {/* Phones & Tablets (below lg): Mobile bottom nav */}
      <MobileBottomNav onMore={() => setSidebarOpen(true)} />

      {/* PWA Install prompt */}
      <InstallPrompt />
    </div>
  );
};

export default AppLayout;
