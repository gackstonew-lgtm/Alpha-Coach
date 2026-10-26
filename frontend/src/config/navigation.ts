import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  LineChart,
  Bot,
  ShieldAlert,
  TrendingUp,
  Scan,
  Calendar,
  Scale,
  FileText,
  Trophy,
  Cpu,
  Settings,
  ShieldCheck
} from 'lucide-react';

export interface NavItemConfig {
  id: string;
  name: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  adminOnly?: boolean;
}

export interface NavGroupConfig {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItemConfig[];
  basePaths: string[];
}

export const PRIMARY_NAV_ITEMS: NavItemConfig[] = [
  { id: 'dashboard', name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { id: 'journal', name: 'Trading Journal', to: '/journal', icon: BookOpen },
  { id: 'charts', name: 'Interactive Charts', to: '/charts', icon: TrendingUp },
  { id: 'scanner', name: 'Market Scanner', to: '/scanner', icon: Scan },
  { id: 'macro-calendar', name: 'Economic Calendar', to: '/macro-calendar', icon: Calendar },
  { id: 'currency-strength', name: 'Currency Strength', to: '/currency-strength', icon: Scale },
  { id: 'sec-tracker', name: 'SEC & Politician Tracker', to: '/sec-tracker', icon: FileText },
  { id: 'performance', name: 'Performance', to: '/performance', icon: LineChart },
  { id: 'ai-coach', name: 'AI Coach', to: '/ai-coach', icon: Bot },
  { id: 'risk-guardian', name: 'Risk Guardian', to: '/risk-guardian', icon: ShieldAlert }
];

export const MARKET_INTEL_GROUP: NavGroupConfig = {
  id: 'market-intel',
  name: 'Market Intelligence',
  icon: TrendingUp,
  basePaths: ['/charts', '/scanner', '/macro-calendar', '/currency-strength', '/sec-tracker'],
  items: [
    { id: 'charts', name: 'Interactive Charts', to: '/charts', icon: TrendingUp },
    { id: 'scanner', name: 'Market Scanner', to: '/scanner', icon: Scan },
    { id: 'macro-calendar', name: 'Economic Calendar', to: '/macro-calendar', icon: Calendar },
    { id: 'currency-strength', name: 'Currency Strength', to: '/currency-strength', icon: Scale },
    { id: 'sec-tracker', name: 'SEC & Politician Tracker', to: '/sec-tracker', icon: FileText }
  ]
};

export const BOTTOM_NAV_ITEMS: NavItemConfig[] = [
  { id: 'rewards', name: 'Our Community', to: '/rewards', icon: Trophy },
  { id: 'bridge', name: 'MT5 Bridge', to: '/bridge', icon: Cpu },
  { id: 'settings', name: 'Settings', to: '/settings', icon: Settings, badge: '!' },
  { id: 'admin', name: 'Admin Terminal', to: '/admin', icon: ShieldCheck, adminOnly: true }
];
