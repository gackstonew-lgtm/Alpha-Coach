import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Settings as SettingsIcon,
  Globe,
  Sun,
  Moon,
  Shield,
  Trash2,
  Lock,
  Check,
  User as UserIcon
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [timezone, setTimezone] = useState<string>(user?.timezone || 'UTC');
  const [currency, setCurrency] = useState<string>(user?.currency || 'USD');
  const [saved, setSaved] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
          <SettingsIcon className="w-6 h-6 text-slate-400" />
          <span>Platform Settings & Privacy</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure timezones, currency display, active themes, and account privacy boundaries
        </p>
      </div>

      {/* General Settings Card */}
      <form onSubmit={handleSave} className="glass-panel p-6 rounded-3xl border border-slate-800/80 space-y-6">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-blue-400">
          <UserIcon className="w-4 h-4" />
          <span>Trader Profile & Regional Preferences</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">First Name</label>
            <input
              type="text"
              disabled
              value={user?.first_name || ''}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 opacity-80"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Email Address</label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 opacity-80"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Display Timezone</label>
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
            >
              <option value="UTC">UTC (Universal Coordinated Time)</option>
              <option value="America/New_York">America/New York (EST/EDT)</option>
              <option value="Europe/London">Europe/London (GMT/BST)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              <option value="Asia/Dubai">Asia/Dubai (GST)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Base Currency</label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="JPY">JPY (¥)</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-xs text-white font-medium flex items-center space-x-2 transition"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
              <span>Theme: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            </button>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-blue-500/25 flex items-center space-x-1"
          >
            {saved ? <Check className="w-4 h-4 text-emerald-400" /> : null}
            <span>{saved ? 'Preferences Saved' : 'Save Preferences'}</span>
          </button>
        </div>
      </form>

      {/* Privacy & GDPR Data Export/Deletion */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 space-y-4">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-red-400">
          <Shield className="w-4 h-4" />
          <span>Privacy & Data Management</span>
        </div>
        <p className="text-xs text-slate-400">
          You have full sovereignty over your trading journal. All trading records, notes, voice transcripts and screenshots are strictly private to your account.
        </p>

        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={() => alert('Data export archive generated and scheduled.')}
            className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs transition"
          >
            Download Full Data Archive (JSON/CSV)
          </button>
        </div>
      </div>
    </div>
  );
};
