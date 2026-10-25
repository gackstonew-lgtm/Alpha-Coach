import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { InstallPrompt } from './InstallPrompt';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-canvas text-content-primary antialiased selection:bg-brand-500 selection:text-white transition-colors duration-200 flex flex-row overflow-x-hidden relative">
      {/* Floating Glass Capsule Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Workspace Canvas (Full-Bleed Edge-to-Edge) */}
      <div className="flex-1 min-w-0 flex flex-col bg-canvas dark:bg-[#121214] min-h-[100dvh]">
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8 w-full max-w-[1600px] mx-auto animate-in fade-in duration-200">
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
