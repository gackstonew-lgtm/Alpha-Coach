import React, { useState, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { InstallPrompt } from './InstallPrompt';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const location = useLocation();
  const isChartsRoute = location.pathname.startsWith('/charts');

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground transition-colors duration-200 flex flex-row overflow-x-hidden relative">
      {/* Navigation Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
      />

      {/* Main Workspace Canvas (Full-Bleed Edge-to-Edge) */}
      <div className="flex-1 min-w-0 flex flex-col bg-background min-h-[100dvh]">
        <Navbar
          isSidebarOpen={sidebarOpen}
          onToggleSidebar={handleToggleSidebar}
        />
        <main
          className={
            isChartsRoute
              ? 'flex-1 flex flex-col min-w-0 min-h-0 p-2 sm:p-3 lg:p-4 pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-4 w-full max-w-none animate-in fade-in duration-200'
              : 'flex-1 p-4 sm:p-6 lg:p-8 pb-[calc(5.25rem+env(safe-area-inset-bottom))] lg:pb-8 w-full max-w-[1600px] mx-auto animate-in fade-in duration-200'
          }
        >
          <Outlet />
        </main>
      </div>

      {/* Phones & Tablets (below lg): Opaque 5-item bottom navigation */}
      <MobileBottomNav onMore={handleToggleSidebar} />

      {/* PWA Install prompt */}
      <InstallPrompt />
    </div>
  );
};

export default AppLayout;
