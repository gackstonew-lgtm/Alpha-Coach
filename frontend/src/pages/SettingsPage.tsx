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
        <div className="flex items-center space-x-2">
          <span className="p-2 rounded-xl bg-surface-secondary text-content-primary border border-border-subtle">
            <SettingsIcon className="w-5 h-5" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-content-primary">
            Platform Settings & Privacy
          </h1>
        </div>
        <p className="text-xs text-content-secondary mt-1">
          Configure timezones, currency display, active themes, and account privacy boundaries
        </p>
      </div>

      {/* General Settings Card */}
      <form onSubmit={handleSave} className="framer-card p-6 space-y-6">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-brand-primary">
          <UserIcon className="w-4 h-4" />
          <span>Trader Profile & Regional Preferences</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-content-secondary mb-1 font-medium">First Name</label>
            <input
              type="text"
              disabled
              value={user?.first_name || ''}
              className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-3 py-2 text-content-muted cursor-not-allowed opacity-80"
            />
          </div>

          <div>
            <label className="block text-content-secondary mb-1 font-medium">Email Address</label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-3 py-2 text-content-muted cursor-not-allowed opacity-80"
            />
          </div>

          <div>
            <label className="block text-content-secondary mb-1 font-medium">Display Timezone</label>
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            >
              <option value="UTC">UTC (Universal Coordinated Time)</option>
              <option value="America/New_York">America/New York (EST/EDT)</option>
              <option value="Europe/London">Europe/London (GMT/BST)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              <option value="Asia/Dubai">Asia/Dubai (GST)</option>
            </select>
          </div>

          <div>
            <label className="block text-content-secondary mb-1 font-medium">Base Currency</label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="JPY">JPY (¥)</option>
            </select>
          </div>
        </div>

        {/* Appearance & Theme Selector */}
        <div className="pt-4 border-t border-border-subtle space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-content-primary font-semibold text-xs">Appearance & Theme</label>
              <p className="text-[11px] text-content-muted">Choose your preferred visual theme for the trading terminal</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-sm">
            <button
              type="button"
              onClick={() => { if (theme !== 'dark') toggleTheme(); }}
              className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                theme === 'dark'
                  ? 'border-brand-500 bg-brand-500/10 text-content-primary ring-1 ring-brand-500'
                  : 'border-border-subtle bg-surface-secondary hover:bg-surface-elevated text-content-secondary'
              }`}
            >
              <div className="p-2 rounded-xl bg-slate-900 text-amber-400 border border-slate-800">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs">Dark Mode</div>
                <div className="text-[10px] text-content-muted">Financial OLED</div>
              </div>
              {theme === 'dark' && <Check className="w-4 h-4 text-brand-500 ml-auto" />}
            </button>

            <button
              type="button"
              onClick={() => { if (theme !== 'light') toggleTheme(); }}
              className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                theme === 'light'
                  ? 'border-brand-500 bg-brand-500/10 text-content-primary ring-1 ring-brand-500'
                  : 'border-border-subtle bg-surface-secondary hover:bg-surface-elevated text-content-secondary'
              }`}
            >
              <div className="p-2 rounded-xl bg-slate-100 text-brand-600 border border-slate-200">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs">Light Mode</div>
                <div className="text-[10px] text-content-muted">Clean Day</div>
              </div>
              {theme === 'light' && <Check className="w-4 h-4 text-brand-500 ml-auto" />}
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-border-subtle flex justify-end items-center">
          <button
            type="submit"
            className="framer-btn-primary px-6 py-2.5 flex items-center space-x-1.5"
          >
            {saved ? <Check className="w-4 h-4 text-white" /> : null}
            <span>{saved ? 'Preferences Saved' : 'Save Preferences'}</span>
          </button>
        </div>
      </form>

      {/* Privacy & GDPR Data Export/Deletion */}
      <div className="framer-card p-6 space-y-4">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-trade-loss">
          <Shield className="w-4 h-4" />
          <span>Privacy & Data Management</span>
        </div>
        <p className="text-xs text-content-secondary">
          You have full sovereignty over your trading journal. All trading records, notes, voice transcripts and screenshots are strictly private to your account.
        </p>

        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={() => alert('Data export archive generated and scheduled.')}
            className="framer-btn-secondary"
          >
            Download Full Data Archive (JSON/CSV)
          </button>
        </div>
      </div>
    </div>
  );
};
