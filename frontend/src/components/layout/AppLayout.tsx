import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { InstallPrompt } from './InstallPrompt';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-page text-content-primary antialiased selection:bg-brand-500 selection:text-white transition-colors duration-200">
      {/* Reference B: Outer frame container with large rounded 24px app canvas on desktop */}
      <div className="app-frame-container lg:py-6 lg:px-8">
        <div className="app-frame border border-[#EBECEF] dark:border-[#2C2C32] min-h-[calc(100vh-3rem)]">
          {/* Static White Sidebar (Reference B) */}
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          {/* Main Workspace Canvas (#F5F6F8) */}
          <div className="flex-1 min-w-0 flex flex-col bg-[#F5F6F8] dark:bg-[#121214]">
            <Navbar onToggleSidebar={() => setSidebarOpen(true)} />
            <main className="flex-1 p-4 sm:p-6 lg:p-7 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8 w-full max-w-[1400px] mx-auto animate-in fade-in duration-200">
              <Outlet />
            </main>
          </div>
        </div>
      </div>

      {/* Phones & Tablets (below lg): Mobile bottom nav */}
      <MobileBottomNav onMore={() => setSidebarOpen(true)} />

      {/* PWA Install prompt */}
      <InstallPrompt />
    </div>
  );
};

export default AppLayout;
