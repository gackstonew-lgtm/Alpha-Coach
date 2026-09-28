import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { InstallPrompt } from './InstallPrompt';

const COLLAPSE_KEY = 'alpha-coach-sidebar-collapsed';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false); // mobile/tablet drawer
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1'; // desktop icon-rail, remembered
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch {
      /* storage unavailable */
    }
  }, [collapsed]);

  return (
    <div className="min-h-screen bg-canvas text-content-primary flex flex-col antialiased ambient-glow-bg selection:bg-brand-500 selection:text-white transition-colors duration-200">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
      />
      <div
        className={`${
          collapsed ? 'lg:pl-[72px]' : 'lg:pl-64'
        } flex flex-col flex-1 min-w-0 transition-[padding] duration-300 ease-out`}
      >
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
          <Outlet />
        </main>
      </div>

      {/* Phones & tablets (below lg): bottom tab bar. "More" opens the Sidebar drawer. */}
      <MobileBottomNav onMore={() => setSidebarOpen(true)} />

      {/* Install card: native prompt on Android/Chrome, Add to Home Screen steps on iOS */}
      <InstallPrompt />
    </div>
  );
};
