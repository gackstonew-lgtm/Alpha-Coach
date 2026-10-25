import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { InstallPrompt } from './InstallPrompt';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false); // mobile/tablet drawer

  return (
    <div className="min-h-screen bg-canvas text-content-primary flex flex-col antialiased selection:bg-brand-500 selection:text-white transition-colors duration-200">
      {/* Supabase-style Hover-Expand Sidebar (Desktop: 68px rail that overlays on hover; Mobile: touch drawer) */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Layout Area: fixed 68px left padding on desktop so overlay expansion never reflows content */}
      <div className="lg:pl-[68px] flex flex-col flex-1 min-w-0">
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
          <Outlet />
        </main>
      </div>

      {/* Phones & tablets (below lg): bottom tab bar. "More" opens the Hostinger-style Sidebar drawer. */}
      <MobileBottomNav onMore={() => setSidebarOpen(true)} />

      {/* Install card: native prompt on Android/Chrome, Add to Home Screen steps on iOS */}
      <InstallPrompt />
    </div>
  );
};

export default AppLayout;
