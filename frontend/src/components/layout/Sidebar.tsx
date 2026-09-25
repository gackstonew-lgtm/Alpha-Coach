import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  LineChart,
  FlaskConical,
  Clock,
  Coins,
  Dna,
  ShieldAlert,
  PlayCircle,
  Trophy,
  Bot,
  FileSpreadsheet,
  Cpu,
  Settings,
  ShieldCheck,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Trading Journal', to: '/journal', icon: BookOpen },
    { name: 'Trading Calendar', to: '/calendar', icon: Calendar },
    { name: 'Analytics Engine', to: '/analytics', icon: LineChart },
    { name: 'Strategy Lab', to: '/strategy-lab', icon: FlaskConical },
    { name: 'Session Intelligence', to: '/sessions', icon: Clock },
    { name: 'Symbol Intelligence', to: '/symbols', icon: Coins },
    { name: 'Trader DNA', to: '/trader-dna', icon: Dna },
    { name: 'Risk Guardian', to: '/risk-guardian', icon: ShieldAlert },
    { name: 'Replay Studio', to: '/replay', icon: PlayCircle },
    { name: 'Gamification & XP', to: '/gamification', icon: Trophy },
    { name: 'AI Trading Coach', to: '/ai-coach', icon: Bot },
    { name: 'Weekly & Monthly Reports', to: '/reports', icon: FileSpreadsheet },
    { name: 'MT5 Bridge & Accounts', to: '/bridge', icon: Cpu },
  ];

  if (user?.role === 'admin') {
    navigation.push({ name: 'Admin Operations', to: '/admin', icon: ShieldCheck });
  }

  navigation.push({ name: 'Settings & Privacy', to: '/settings', icon: Settings });

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0a0d14] border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-400 p-0.5 shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 text-lg">α</span>
              </div>
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight text-white flex items-center space-x-1.5">
                <span>Alpha Coach</span>
              </div>
              <div className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
                Performance OS
              </div>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navigation.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 transition ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`} />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Alpha Coach v1.0</span>
          <span className="font-mono text-emerald-400 font-semibold">MT5 Ready</span>
        </div>
      </aside>
    </>
  );
};
