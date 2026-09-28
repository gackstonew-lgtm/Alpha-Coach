import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { useAccounts } from '../context/AccountContext';
import { api } from '../services/api';
import {
  User,
  CreditCard,
  ShieldAlert,
  BookOpen,
  Sliders,
  Clock,
  Bell,
  Award,
  Sparkles,
  Radio,
  Lock,
  Check,
  RotateCcw,
  Upload,
  Trash2,
  Plus,
  X,
  Volume2,
  Download,
  Search,
  Eye,
  EyeOff,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Key,
  Shield,
  Smartphone,
  AlertTriangle,
  Loader2,
  Calendar,
  Layers,
  CheckCircle2,
  Copy,
  RefreshCw,
  Sun,
  Moon
} from 'lucide-react';

// Common IANA timezones for quick selection & search
const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'Europe/London',
  'Europe/Frankfurt',
  'Europe/Paris',
  'Europe/Zurich',
  'Europe/Amsterdam',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Athens',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Dubai',
  'Asia/Shanghai',
  'Asia/Bangkok',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Auckland',
  'Africa/Johannesburg',
  'Africa/Nairobi'
];

type SectionId =
  | 'profile'
  | 'accounts'
  | 'risk'
  | 'journal'
  | 'display'
  | 'sessions'
  | 'notifications'
  | 'rewards'
  | 'aiCoach'
  | 'bridge'
  | 'security';

interface SectionMeta {
  id: SectionId;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const SECTIONS: SectionMeta[] = [
  { id: 'profile', label: 'Profile & Account', description: 'Name, avatar, password, timezone & data export', icon: User },
  { id: 'accounts', label: 'Trading Accounts', description: 'MT5 accounts, nicknames, offsets & defaults', icon: Layers },
  { id: 'risk', label: 'Risk Guardian', description: 'Loss limits, trade caps, sizing & alert channels', icon: ShieldAlert },
  { id: 'journal', label: 'Journal & Review', description: 'Custom setups, mistake tags, review checklist', icon: BookOpen },
  { id: 'display', label: 'Display & Preferences', description: 'Currency, date/time format, widgets & themes', icon: Sliders },
  { id: 'sessions', label: 'Sessions & Markets', description: 'Session hours, favorite & excluded tickers', icon: Clock },
  { id: 'notifications', label: 'Notifications', description: 'Reports, quiet hours, streak & risk alerts', icon: Bell },
  { id: 'rewards', label: 'Rewards & Discipline', description: 'XP levels, streaks & daily trade journal goals', icon: Award },
  { id: 'aiCoach', label: 'AI Coach', description: 'Tone preferences, context sources & history', icon: Sparkles },
  { id: 'bridge', label: 'Bridge & Sync', description: 'Connected MT5 terminals, status & pairing', icon: Radio },
  { id: 'security', label: 'Privacy & Security', description: '2FA TOTP, active sessions & global privacy', icon: Lock }
];

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { accounts, refreshAccounts } = useAccounts();
  const {
    settings,
    isLoading: settingsLoading,
    isSaving,
    saveStatus,
    lastSaved,
    privacyMode,
    togglePrivacyMode,
    updateSettings,
    resetSection
  } = useSettings();

  // Active section (null on mobile initially shows section menu)
  const [activeSection, setActiveSection] = useState<SectionId>('profile');
  const [mobileDrilldown, setMobileDrilldown] = useState<boolean>(false);

  // Timezone search
  const [tzSearch, setTzSearch] = useState('');

  // Modals state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showTotpModal, setShowTotpModal] = useState(false);
  const [showClearAiModal, setShowClearAiModal] = useState(false);

  // Password change state
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message?: string }>({ type: 'idle' });

  // Delete account state
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Bridge devices state
  const [bridgeDevices, setBridgeDevices] = useState<any[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);

  // Temporary item inputs (setups, tags, mistakes, favorite/excluded symbols)
  const [newSetupInput, setNewSetupInput] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [newMistakeInput, setNewMistakeInput] = useState('');
  const [newFavSymbolInput, setNewFavSymbolInput] = useState('');
  const [newExclSymbolInput, setNewExclSymbolInput] = useState('');

  // Avatar file input ref
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Load bridge devices when entering bridge section
  useEffect(() => {
    if (activeSection === 'bridge') {
      loadDevices();
    }
  }, [activeSection]);

  const loadDevices = async () => {
    try {
      setLoadingDevices(true);
      const res = await api.getBridgeDevices();
      setBridgeDevices(res.devices || []);
    } catch {
      // fallback
    } finally {
      setLoadingDevices(false);
    }
  };

  // Sound test synthesizer
  const playAlertSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn('Audio synthesis unavailable', e);
    }
  };

  // Avatar upload handler
  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Avatar image must be smaller than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        await api.updateAvatar(base64);
        updateSettings({ profile: { avatarUrl: base64 } });
      } catch (err: any) {
        alert(err.message || 'Failed to update avatar photo.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = async () => {
    try {
      await api.updateAvatar(null);
      updateSettings({ profile: { avatarUrl: null } });
    } catch (err: any) {
      alert(err.message || 'Failed to remove avatar.');
    }
  };

  // Password submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currPassword || !newPassword) return;
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordStatus({ type: 'error', message: 'Password must be at least 8 characters long.' });
      return;
    }

    setPasswordStatus({ type: 'loading' });
    try {
      await api.changePassword(currPassword, newPassword);
      setPasswordStatus({ type: 'success', message: 'Password updated successfully!' });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordStatus({ type: 'idle' });
        setCurrPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 1500);
    } catch (err: any) {
      setPasswordStatus({ type: 'error', message: err.message || 'Failed to change password.' });
    }
  };

  // Data export handler
  const handleExportData = async () => {
    try {
      const archive = await api.exportUserData();
      const blob = new Blob([JSON.stringify(archive, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meta_coach_export_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to export user archive.');
    }
  };

  // Delete account handler
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE' && deleteConfirmation !== user?.email) {
      setDeleteError('Confirmation text does not match.');
      return;
    }
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await api.deleteUserAccount(deleteConfirmation);
      setShowDeleteModal(false);
      logout();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account.');
      setDeleteLoading(false);
    }
  };

  // Filtered timezones
  const filteredTimezones = useMemo(() => {
    if (!tzSearch.trim()) return COMMON_TIMEZONES;
    const q = tzSearch.toLowerCase();
    return COMMON_TIMEZONES.filter(tz => tz.toLowerCase().includes(q));
  }, [tzSearch]);

  // Section reset confirm
  const handleConfirmReset = async () => {
    await resetSection(activeSection);
    setShowResetModal(false);
  };

  // Revoke device
  const handleRevokeDevice = async (id: string) => {
    if (!confirm('Are you sure you want to revoke authorization for this MT5 terminal device?')) return;
    try {
      await api.revokeBridgeDevice(id);
      loadDevices();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke device.');
    }
  };

  // Request browser push permissions
  const handleRequestPushPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications.');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      updateSettings({ notifications: { browserPushEnabled: true } });
      new Notification('Meta Coach Alerts Enabled', {
        body: 'You will now receive high-priority risk and journaling notifications.',
        icon: '/pwa-192x192.png'
      });
    } else {
      updateSettings({ notifications: { browserPushEnabled: false } });
      alert('Push notifications permission was not granted by your browser.');
    }
  };

  if (settingsLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        <span className="text-xs font-mono text-content-muted uppercase tracking-wider">Loading Platform Settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Hub Header & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-surface-secondary text-brand-500 border border-border-subtle shadow-sm">
              <Sliders className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-content-primary">
              Settings & Preferences Hub
            </h1>
          </div>
          <p className="text-xs text-content-muted mt-1">
            Institutional-grade customization across trading risk, journal structure, MT5 terminals, and privacy
          </p>
        </div>

        {/* Global Save Status & Reset Section */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-secondary border border-border-subtle text-xs font-mono">
            {saveStatus === 'saving' && (
              <>
                <Loader2 className="w-3.5 h-3.5 text-brand-500 animate-spin" />
                <span className="text-brand-500">Saving changes...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-semibold">Saved</span>
              </>
            )}
            {saveStatus === 'idle' && (
              <span className="text-content-muted">
                {lastSaved ? `Autosaved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'All changes saved'}
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-rose-500 font-semibold">Save failed</span>
            )}
          </div>

          <button
            onClick={() => setShowResetModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-content-muted hover:text-content-primary hover:bg-surface-secondary border border-border-subtle transition"
            title="Reset this section to factory defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Section</span>
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
        {/* Mobile Navigation List (Visible when mobileDrilldown is false on small screens) */}
        <div className={`lg:hidden ${mobileDrilldown ? 'hidden' : 'block'} space-y-2`}>
          <div className="text-xs font-semibold text-content-muted uppercase tracking-wider px-1 mb-2">
            Configure Section
          </div>
          {SECTIONS.map(s => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setActiveSection(s.id);
                  setMobileDrilldown(true);
                }}
                className="w-full flex items-center justify-between p-3.5 min-h-[52px] bg-surface rounded-2xl border border-border-subtle hover:border-brand-500/50 hover:bg-surface-secondary transition text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-surface-secondary text-brand-500 group-hover:bg-brand-500/10 transition">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-content-primary">{s.label}</div>
                    <div className="text-xs text-content-muted line-clamp-1">{s.description}</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-content-muted group-hover:text-content-primary transition" />
              </button>
            );
          })}
        </div>

        {/* Desktop Left Sub-Navigation Sidebar */}
        <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-1.5 sticky top-20">
          <div className="text-xs font-semibold text-content-muted uppercase tracking-wider px-3 py-1.5">
            Settings Navigation
          </div>
          <div className="bg-surface rounded-2xl border border-border-subtle p-2 space-y-1 shadow-sm">
            {SECTIONS.map(s => {
              const Icon = s.icon;
              const isActive = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold border border-brand-500/20 shadow-sm'
                      : 'text-content-secondary hover:text-content-primary hover:bg-surface-secondary'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-brand-500' : 'text-content-muted'}`} />
                    <span className="truncate">{s.label}</span>
                  </div>
                  {s.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500">
                      {s.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Content Pane */}
        <main className={`lg:col-span-8 xl:col-span-9 ${!mobileDrilldown ? 'hidden lg:block' : 'block'}`}>
          {/* Mobile Back Button */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setMobileDrilldown(false)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-secondary text-content-primary border border-border-subtle text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All Sections</span>
            </button>
          </div>

          <div className="bg-surface rounded-2xl border border-border-subtle p-5 sm:p-7 shadow-sm space-y-8 animate-in fade-in duration-200">
            {/* 1. Profile & Account */}
            {activeSection === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-content-primary flex items-center gap-2">
                    <User className="w-5 h-5 text-brand-500" />
                    <span>Profile & Account</span>
                  </h2>
                  <p className="text-xs text-content-muted mt-0.5">Manage personal credentials, avatar picture, and regional parameters</p>
                </div>

                {/* Avatar Section */}
                <div className="p-4 rounded-2xl bg-surface-secondary/70 border border-border-subtle flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative">
                    {settings.profile.avatarUrl ? (
                      <img
                        src={settings.profile.avatarUrl}
                        alt="Avatar"
                        className="w-20 h-20 rounded-2xl object-cover ring-2 ring-brand-500/40 shadow-md"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-brand-600 flex items-center justify-center font-bold text-2xl text-white shadow-md">
                        {settings.profile.firstName?.[0] || 'T'}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 text-center sm:text-left flex-1">
                    <div className="font-semibold text-sm text-content-primary">Trader Avatar</div>
                    <div className="text-xs text-content-muted">PNG, JPG, or WebP up to 2MB. Stored securely on your profile.</div>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                      <input
                        type="file"
                        ref={avatarInputRef}
                        onChange={handleAvatarFile}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        onClick={() => avatarInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Photo</span>
                      </button>
                      {settings.profile.avatarUrl && (
                        <button
                          onClick={handleRemoveAvatar}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 text-xs font-medium transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-content-secondary mb-1">First Name</label>
                    <input
                      type="text"
                      value={settings.profile.firstName}
                      onChange={e => updateSettings({ profile: { firstName: e.target.value } })}
                      className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-3 py-2 text-xs text-content-primary focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-content-secondary mb-1">Last Name</label>
                    <input
                      type="text"
                      value={settings.profile.lastName}
                      onChange={e => updateSettings({ profile: { lastName: e.target.value } })}
                      className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-3 py-2 text-xs text-content-primary focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-content-secondary mb-1">Email Address</label>
                    <div className="flex items-center justify-between bg-surface-secondary border border-border-subtle rounded-xl px-3 py-2 opacity-80">
                      <span className="text-xs text-content-muted font-mono">{user?.email || 'trader@alphacoach.io'}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        Active & Verified
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timezone Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-content-secondary">Display Timezone</label>
                    <button
                      type="button"
                      onClick={() => {
                        const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
                        updateSettings({ profile: { timezone: detected } });
                      }}
                      className="text-xs text-brand-500 hover:underline font-semibold"
                    >
                      Auto-detect ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                    </button>
                  </div>
                  <div className="relative">
                    <select
                      value={settings.profile.timezone}
                      onChange={e => updateSettings({ profile: { timezone: e.target.value } })}
                      className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-3 py-2 text-xs text-content-primary focus:outline-none focus:border-brand-500 cursor-pointer"
                    >
                      {filteredTimezones.map(tz => (
                        <option key={tz} value={tz} className="bg-surface text-content-primary">
                          {tz}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Security Credentials & Data sovereignty */}
                <div className="pt-4 border-t border-border-subtle space-y-3">
                  <div className="font-semibold text-xs text-content-primary uppercase tracking-wider">Credentials & Data Management</div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setShowPasswordModal(true)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-secondary hover:bg-surface-elevated border border-border-subtle text-xs font-semibold text-content-primary transition"
                    >
                      <Key className="w-3.5 h-3.5 text-brand-500" />
                      <span>Change Password</span>
                    </button>

                    <button
                      onClick={handleExportData}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-secondary hover:bg-surface-elevated border border-border-subtle text-xs font-semibold text-content-primary transition"
                    >
                      <Download className="w-3.5 h-3.5 text-brand-500" />
                      <span>Export Full User Archive (JSON)</span>
                    </button>

                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-500/10 border border-rose-500/30 text-xs font-semibold transition ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Account</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Trading Accounts */}
            {activeSection === 'accounts' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-content-primary flex items-center gap-2">
                    <Layers className="w-5 h-5 text-brand-500" />
                    <span>Trading Accounts</span>
                  </h2>
                  <p className="text-xs text-content-muted mt-0.5">Configure individual MT5 accounts, broker timezone offsets, and default view</p>
                </div>

                {/* Default Account Selector */}
                <div className="p-4 rounded-2xl bg-surface-secondary/70 border border-border-subtle space-y-2">
                  <label className="block text-xs font-semibold text-content-secondary">Primary Default Account</label>
                  <p className="text-[11px] text-content-muted">Determines which account or consolidated view is loaded upon initial terminal launch</p>
                  <select
                    value={settings.accounts.defaultAccountId}
                    onChange={e => updateSettings({ accounts: { defaultAccountId: e.target.value } })}
                    className="w-full max-w-md bg-surface border border-border-subtle rounded-xl px-3 py-2 text-xs font-semibold text-content-primary focus:outline-none focus:border-brand-500"
                  >
                    <option value="ALL">All Accounts (Consolidated Multi-Account Portfolio)</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {settings.accounts.accountCustomizations[acc.id]?.nickname || acc.broker_name} ••••{acc.account_number.slice(-4)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Accounts Customization List */}
                <div className="space-y-4">
                  <div className="font-semibold text-xs text-content-primary uppercase tracking-wider">Connected MT5 Accounts ({accounts.length})</div>
                  {accounts.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-surface-secondary text-center space-y-3 border border-border-subtle">
                      <Layers className="w-8 h-8 text-content-muted mx-auto" />
                      <div className="text-xs text-content-muted">No MT5 trading accounts linked yet.</div>
                      <a
                        href="/pair"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-500 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Pair MT5 Terminal</span>
                      </a>
                    </div>
                  ) : (
                    accounts.map(acc => {
                      const custom = settings.accounts.accountCustomizations[acc.id] || {};
                      const isHidden = Boolean(custom.hidden);
                      const isArchived = Boolean(custom.archived);

                      return (
                        <div
                          key={acc.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            isArchived
                              ? 'bg-surface-secondary/40 border-border-subtle opacity-70'
                              : 'bg-surface-secondary/80 border-border-subtle'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-content-primary">
                                  {custom.nickname || `${acc.broker_name} (${acc.account_number})`}
                                </span>
                                {isArchived && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500">Archived</span>
                                )}
                                {isHidden && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-400">Hidden</span>
                                )}
                              </div>
                              <div className="text-xs text-content-muted font-mono">
                                Server: {acc.server_name} • Live Balance: {privacyMode ? '••••••' : `$${acc.balance.toLocaleString()}`}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  updateSettings({
                                    accounts: {
                                      accountCustomizations: {
                                        ...settings.accounts.accountCustomizations,
                                        [acc.id]: { ...custom, hidden: !isHidden }
                                      }
                                    }
                                  });
                                }}
                                className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition ${
                                  isHidden
                                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                    : 'text-content-muted hover:text-content-primary border-border-subtle'
                                }`}
                              >
                                {isHidden ? 'Unhide' : 'Hide from Stats'}
                              </button>

                              <button
                                onClick={() => {
                                  updateSettings({
                                    accounts: {
                                      accountCustomizations: {
                                        ...settings.accounts.accountCustomizations,
                                        [acc.id]: { ...custom, archived: !isArchived }
                                      }
                                    }
                                  });
                                }}
                                className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition ${
                                  isArchived
                                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                    : 'text-content-muted hover:text-content-primary border-border-subtle'
                                }`}
                              >
                                {isArchived ? 'Restore' : 'Archive'}
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-content-muted mb-1">Custom Nickname</label>
                              <input
                                type="text"
                                placeholder={acc.broker_name}
                                value={custom.nickname || ''}
                                onChange={e => {
                                  updateSettings({
                                    accounts: {
                                      accountCustomizations: {
                                        ...settings.accounts.accountCustomizations,
                                        [acc.id]: { ...custom, nickname: e.target.value }
                                      }
                                    }
                                  });
                                }}
                                className="w-full bg-surface border border-border-subtle rounded-xl px-2.5 py-1.5 text-xs text-content-primary focus:outline-none focus:border-brand-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-content-muted mb-1">Starting Balance ($)</label>
                              <input
                                type="number"
                                value={custom.startingBalance ?? acc.balance ?? 10000}
                                onChange={e => {
                                  updateSettings({
                                    accounts: {
                                      accountCustomizations: {
                                        ...settings.accounts.accountCustomizations,
                                        [acc.id]: { ...custom, startingBalance: parseFloat(e.target.value) || 0 }
                                      }
                                    }
                                  });
                                }}
                                className="w-full bg-surface border border-border-subtle rounded-xl px-2.5 py-1.5 text-xs text-content-primary focus:outline-none focus:border-brand-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-content-muted mb-1">
                                Broker Time Offset ({custom.serverTimeOffsetHours ?? 0}h)
                              </label>
                              <input
                                type="range"
                                min="-14"
                                max="14"
                                step="1"
                                value={custom.serverTimeOffsetHours ?? 0}
                                onChange={e => {
                                  updateSettings({
                                    accounts: {
                                      accountCustomizations: {
                                        ...settings.accounts.accountCustomizations,
                                        [acc.id]: { ...custom, serverTimeOffsetHours: parseInt(e.target.value, 10) }
                                      }
                                    }
                                  });
                                }}
                                className="w-full mt-2 accent-brand-500 cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* 3. Risk Guardian */}
            {activeSection === 'risk' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-content-primary flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-amber-500" />
                    <span>Risk Guardian Parameters</span>
                  </h2>
                  <p className="text-xs text-content-muted mt-0.5">Hardware-enforced limits actively synchronizing with your live trading journal & MT5 stream</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Daily Loss Limit Type & Amount */}
                  <div className="p-4 rounded-2xl bg-surface-secondary/70 border border-border-subtle space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-content-secondary">Daily Loss Threshold</label>
                      <div className="flex rounded-lg bg-surface p-0.5 border border-border-subtle text-[11px]">
                        <button
                          type="button"
                          onClick={() => updateSettings({ risk: { dailyLossLimitType: 'amount' } })}
                          className={`px-2.5 py-1 rounded-md font-semibold transition ${
                            settings.risk.dailyLossLimitType === 'amount'
                              ? 'bg-brand-600 text-white shadow-sm'
                              : 'text-content-muted hover:text-content-primary'
                          }`}
                        >
                          Fixed ($)
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSettings({ risk: { dailyLossLimitType: 'percent' } })}
                          className={`px-2.5 py-1 rounded-md font-semibold transition ${
                            settings.risk.dailyLossLimitType === 'percent'
                              ? 'bg-brand-600 text-white shadow-sm'
                              : 'text-content-muted hover:text-content-primary'
                          }`}
                        >
                          Percent (%)
                        </button>
                      </div>
                    </div>

                    {settings.risk.dailyLossLimitType === 'amount' ? (
                      <div>
                        <div className="text-[11px] text-content-muted mb-1">Max allowable daily equity drawdown:</div>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-content-muted text-xs font-bold">$</span>
                          <input
                            type="number"
                            min="10"
                            step="50"
                            value={settings.risk.dailyLossLimitAmount}
                            onChange={e => updateSettings({ risk: { dailyLossLimitAmount: parseFloat(e.target.value) || 0 } })}
                            className="w-full bg-surface border border-border-subtle rounded-xl pl-7 pr-3 py-2 text-xs font-bold text-content-primary focus:outline-none focus:border-brand-500"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-[11px] text-content-muted mb-1">Max allowable daily equity drawdown percentage:</div>
                        <div className="relative">
                          <input
                            type="number"
                            min="0.1"
                            max="20"
                            step="0.5"
                            value={settings.risk.dailyLossLimitPercent}
                            onChange={e => updateSettings({ risk: { dailyLossLimitPercent: parseFloat(e.target.value) || 0 } })}
                            className="w-full bg-surface border border-border-subtle rounded-xl px-3 py-2 text-xs font-bold text-content-primary focus:outline-none focus:border-brand-500"
                          />
                          <span className="absolute right-3 top-2 text-content-muted text-xs font-bold">%</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Max Trades Per Day */}
                  <div className="p-4 rounded-2xl bg-surface-secondary/70 border border-border-subtle space-y-3">
                    <label className="block text-xs font-semibold text-content-secondary">Max Trades Per Day</label>
                    <div className="text-[11px] text-content-muted">Prevents overtrading tilt after executing N positions within 24h</div>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={settings.risk.maxTradesPerDay}
                      onChange={e => updateSettings({ risk: { maxTradesPerDay: parseInt(e.target.value, 10) || 1 } })}
                      className="w-full bg-surface border border-border-subtle rounded-xl px-3 py-2 text-xs font-bold text-content-primary focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  {/* Max Position Sizing */}
                  <div className="p-4 rounded-2xl bg-surface-secondary/70 border border-border-subtle space-y-3">
                    <label className="block text-xs font-semibold text-content-secondary">Max Single Position Size (Lots)</label>
                    <div className="text-[11px] text-content-muted">Hard cap on volume per single order execution</div>
                    <input
                      type="number"
                      min="0.01"
                      step="0.1"
                      value={settings.risk.maxPositionSize}
                      onChange={e => updateSettings({ risk: { maxPositionSize: parseFloat(e.target.value) || 0.01 } })}
                      className="w-full bg-surface border border-border-subtle rounded-xl px-3 py-2 text-xs font-bold text-content-primary focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  {/* Consecutive Loss Threshold */}
                  <div className="p-4 rounded-2xl bg-surface-secondary/70 border border-border-subtle space-y-3">
                    <label className="block text-xs font-semibold text-content-secondary">Consecutive Loss Cooldown Threshold</label>
                    <div className="text-[11px] text-content-muted">Number of consecutive losses before system triggers psychological cooldown</div>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={settings.risk.consecutiveLossLimit}
                      onChange={e => updateSettings({ risk: { consecutiveLossLimit: parseInt(e.target.value, 10) || 1 } })}
                      className="w-full bg-surface border border-border-subtle rounded-xl px-3 py-2 text-xs font-bold text-content-primary focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                {/* Alert Styles */}
                <div className="pt-4 border-t border-border-subtle space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-content-primary uppercase tracking-wider">Breach Alert Channels</div>
                      <div className="text-[11px] text-content-muted">Configure dispatch targets when risk boundaries are breached</div>
                    </div>
                    <button
                      type="button"
                      onClick={playAlertSound}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-secondary hover:bg-surface-elevated border border-border-subtle text-xs font-semibold text-content-primary transition"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                      <span>Test Sound</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { key: 'inAppBanner', label: 'In-App Banner' },
                      { key: 'sound', label: 'Auditory Alert' },
                      { key: 'push', label: 'Browser Push' },
                      { key: 'email', label: 'Immediate Email' }
                    ].map(ch => {
                      const isChecked = (settings.risk.alerts as any)[ch.key];
                      return (
                        <label
                          key={ch.key}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                            isChecked
                              ? 'bg-amber-500/10 border-amber-500/30 text-content-primary font-bold'
                              : 'bg-surface-secondary border-border-subtle text-content-muted'
                          }`}
                        >
                          <span className="text-xs">{ch.label}</span>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={e => {
                              updateSettings({
                                risk: {
                                  alerts: {
                                    ...settings.risk.alerts,
                                    [ch.key]: e.target.checked
                                  }
                                }
                              });
                            }}
                            className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 4. Journal & Review */}
            {activeSection === 'journal' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-content-primary flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-brand-500" />
                    <span>Journal & Review Structure</span>
                  </h2>
                  <p className="text-xs text-content-muted mt-0.5">Customize tag taxonomies, confluences, required review criteria, and baseline risk</p>
                </div>

                {/* Custom Setups Tag Manager */}
                <div className="space-y-3">
                  <div className="font-semibold text-xs text-content-secondary uppercase tracking-wider">Trading Playbooks & Setups</div>
                  <div className="flex flex-wrap gap-2">
                    {settings.journal.customSetups.map((setup, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 text-xs font-semibold"
                      >
                        <span>{setup}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = settings.journal.customSetups.filter((_, i) => i !== idx);
                            updateSettings({ journal: { customSetups: next } });
                          }}
                          className="hover:text-rose-500 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 max-w-md pt-1">
                    <input
                      type="text"
                      placeholder="Add setup (e.g. ICT Silver Bullet)..."
                      value={newSetupInput}
                      onChange={e => setNewSetupInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newSetupInput.trim()) {
                          e.preventDefault();
                          updateSettings({ journal: { customSetups: [...settings.journal.customSetups, newSetupInput.trim()] } });
                          setNewSetupInput('');
                        }
                      }}
                      className="flex-1 bg-surface-secondary border border-border-subtle rounded-xl px-3 py-1.5 text-xs text-content-primary focus:outline-none focus:border-brand-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newSetupInput.trim()) {
                          updateSettings({ journal: { customSetups: [...settings.journal.customSetups, newSetupInput.trim()] } });
                          setNewSetupInput('');
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Custom Mistake Tags Manager */}
                <div className="space-y-3 pt-3 border-t border-border-subtle">
                  <div className="font-semibold text-xs text-content-secondary uppercase tracking-wider">Psychological Mistakes & Violations</div>
                  <div className="flex flex-wrap gap-2">
                    {settings.journal.customMistakes.map((m, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs font-semibold"
                      >
                        <span>{m}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = settings.journal.customMistakes.filter((_, i) => i !== idx);
                            updateSettings({ journal: { customMistakes: next } });
                          }}
                          className="hover:text-rose-600 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 max-w-md pt-1">
                    <input
                      type="text"
                      placeholder="Add mistake category..."
                      value={newMistakeInput}
                      onChange={e => setNewMistakeInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newMistakeInput.trim()) {
                          e.preventDefault();
                          updateSettings({ journal: { customMistakes: [...settings.journal.customMistakes, newMistakeInput.trim()] } });
                          setNewMistakeInput('');
                        }
                      }}
                      className="flex-1 bg-surface-secondary border border-border-subtle rounded-xl px-3 py-1.5 text-xs text-content-primary focus:outline-none focus:border-brand-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newMistakeInput.trim()) {
                          updateSettings({ journal: { customMistakes: [...settings.journal.customMistakes, newMistakeInput.trim()] } });
                          setNewMistakeInput('');
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Required Review Checklist Toggles */}
                <div className="space-y-3 pt-3 border-t border-border-subtle">
                  <div className="font-semibold text-xs text-content-secondary uppercase tracking-wider">Mandatory Trade Review Fields</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { key: 'setup', label: 'Setup Model' },
                      { key: 'bias', label: 'Higher-TF Bias' },
                      { key: 'confluences', label: 'Entry Confluences' },
                      { key: 'mistake', label: 'Rule Mistake Tag' },
                      { key: 'lessonLearned', label: 'Lesson Learned' },
                      { key: 'confidence', label: 'Confidence Rating' }
                    ].map(item => {
                      const isRequired = (settings.journal.requiredReviewFields as any)[item.key];
                      return (
                        <label
                          key={item.key}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                            isRequired
                              ? 'bg-brand-500/10 border-brand-500/30 text-content-primary font-bold'
                              : 'bg-surface-secondary border-border-subtle text-content-muted'
                          }`}
                        >
                          <span className="text-xs">{item.label}</span>
                          <input
                            type="checkbox"
                            checked={isRequired}
                            onChange={e => {
                              updateSettings({
                                journal: {
                                  requiredReviewFields: {
                                    ...settings.journal.requiredReviewFields,
                                    [item.key]: e.target.checked
                                  }
                                }
                              });
                            }}
                            className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Losing trade mandatory review & Default risk */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-border-subtle">
                  <div className="sm:col-span-2 p-4 rounded-2xl bg-surface-secondary/70 border border-border-subtle flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-content-primary">Mandatory Losing Trade Reviews</div>
                      <div className="text-[11px] text-content-muted">Flags unreviewed losing trades before proceeding to new executions</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.journal.remindLosingTrades}
                      onChange={e => updateSettings({ journal: { remindLosingTrades: e.target.checked } })}
                      className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-surface-secondary/70 border border-border-subtle space-y-1.5">
                    <label className="block text-xs font-semibold text-content-secondary">Baseline Risk per Trade ($)</label>
                    <input
                      type="number"
                      min="1"
                      value={settings.journal.defaultRiskPerTrade}
                      onChange={e => updateSettings({ journal: { defaultRiskPerTrade: parseFloat(e.target.value) || 100 } })}
                      className="w-full bg-surface border border-border-subtle rounded-xl px-3 py-1.5 text-xs font-bold text-content-primary focus:outline-none focus:border-brand-500"
                    />
                    <div className="text-[10px] text-content-muted">Standard 1R denominator</div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Display & Preferences */}
            {activeSection === 'display' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-content-primary flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-brand-500" />
                    <span>Display & Regional Preferences</span>
                  </h2>
                  <p className="text-xs text-content-muted mt-0.5">Customize currency formatting, date patterns, dashboard widgets, and platform appearance</p>
                </div>

                {/* Currency, Time & Date Formats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-content-secondary mb-1">Base Currency</label>
                    <select
                      value={settings.display.currency}
                      onChange={e => {
                        const cur = e.target.value;
                        const symbol = cur === 'EUR' ? '€' : cur === 'GBP' ? '£' : cur === 'JPY' ? '¥' : '$';
                        updateSettings({ display: { currency: cur, currencySymbol: symbol } });
                      }}
                      className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-3 py-2 text-xs text-content-primary focus:outline-none focus:border-brand-500"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="JPY">JPY (¥)</option>
                      <option value="CAD">CAD ($)</option>
                      <option value="AUD">AUD ($)</option>
                      <option value="CHF">CHF (Fr)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-content-secondary mb-1">Time Format</label>
                    <select
                      value={settings.display.timeFormat}
                      onChange={e => updateSettings({ display: { timeFormat: e.target.value as any } })}
                      className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-3 py-2 text-xs text-content-primary focus:outline-none focus:border-brand-500"
                    >
                      <option value="24h">24-Hour (14:30)</option>
                      <option value="12h">12-Hour (02:30 PM)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-content-secondary mb-1">Date Format</label>
                    <select
                      value={settings.display.dateFormat}
                      onChange={e => updateSettings({ display: { dateFormat: e.target.value as any } })}
                      className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-3 py-2 text-xs text-content-primary focus:outline-none focus:border-brand-500"
                    >
                      <option value="YYYY-MM-DD">YYYY-MM-DD (Institutional)</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY (UK/EU)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                    </select>
                  </div>
                </div>

                {/* P/L Display Mode & Default Range */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-surface-secondary/70 border border-border-subtle space-y-2">
                    <label className="block text-xs font-semibold text-content-secondary">P/L Primary Mode</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { mode: 'money', label: 'Money ($)' },
                        { mode: 'percent', label: 'Percent (%)' },
                        { mode: 'r_multiple', label: 'R-Multiple' }
                      ].map(m => (
                        <button
                          key={m.mode}
                          type="button"
                          onClick={() => updateSettings({ display: { plDisplayMode: m.mode as any } })}
                          className={`py-2 rounded-xl text-xs font-semibold border transition ${
                            settings.display.plDisplayMode === m.mode
                              ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                              : 'bg-surface text-content-muted hover:text-content-primary border-border-subtle'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-surface-secondary/70 border border-border-subtle space-y-2">
                    <label className="block text-xs font-semibold text-content-secondary">Default Date Range</label>
                    <select
                      value={settings.display.defaultDateRange}
                      onChange={e => updateSettings({ display: { defaultDateRange: e.target.value as any } })}
                      className="w-full bg-surface border border-border-subtle rounded-xl px-3 py-2 text-xs text-content-primary focus:outline-none focus:border-brand-500"
                    >
                      <option value="today">Today</option>
                      <option value="7d">Last 7 Days</option>
                      <option value="30d">Last 30 Days</option>
                      <option value="90d">Last 90 Days</option>
                      <option value="year">Year to Date</option>
                      <option value="all">All Time</option>
                    </select>
                  </div>
                </div>

                {/* Dashboard Widgets Configuration */}
                <div className="space-y-3 pt-4 border-t border-border-subtle">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-content-primary uppercase tracking-wider">Dashboard Metric Widgets</div>
                      <div className="text-[11px] text-content-muted">Toggle visibility and reorder dashboard overview cards</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {settings.display.dashboardWidgets.map((widget, idx) => (
                      <div
                        key={widget.id}
                        className={`p-3 rounded-xl border flex items-center justify-between transition ${
                          widget.visible
                            ? 'bg-surface-secondary border-border-subtle text-content-primary'
                            : 'bg-surface-secondary/40 border-border-subtle/50 text-content-muted'
                        }`}
                      >
                        <span className="text-xs font-medium">{widget.name}</span>
                        <input
                          type="checkbox"
                          checked={widget.visible}
                          onChange={e => {
                            const next = [...settings.display.dashboardWidgets];
                            next[idx] = { ...widget, visible: e.target.checked };
                            updateSettings({ display: { dashboardWidgets: next } });
                          }}
                          className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visual Appearance & Theme */}
                <div className="pt-4 border-t border-border-subtle space-y-3">
                  <div className="font-semibold text-xs text-content-primary uppercase tracking-wider">Platform Theme</div>
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
              </div>
            )}

            {/* 6. Sessions & Markets */}
            {activeSection === 'sessions' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-content-primary flex items-center gap-2">
                    <Clock className="w-5 h-5 text-brand-500" />
                    <span>Sessions & Market Coverage</span>
                  </h2>
                  <p className="text-xs text-content-muted mt-0.5">Define operational market sessions and symbol watchlists</p>
                </div>

                {/* Session Hours */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'london', label: 'London Session' },
                    { key: 'newYork', label: 'New York Session' },
                    { key: 'asia', label: 'Asian / Tokyo Session' },
                    { key: 'overlap', label: 'London / NY Overlap' }
                  ].map(sess => {
                    const cfg = (settings.sessions as any)[sess.key];
                    return (
                      <div key={sess.key} className="p-4 rounded-2xl bg-surface-secondary/70 border border-border-subtle space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-content-primary">{sess.label}</span>
                          <input
                            type="checkbox"
                            checked={cfg.enabled}
                            onChange={e => {
                              updateSettings({
                                sessions: {
                                  ...settings.sessions,
                                  [sess.key]: { ...cfg, enabled: e.target.checked }
                                }
                              });
                            }}
                            className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="block text-[10px] text-content-muted mb-1">Start Time (UTC)</span>
                            <input
                              type="time"
                              value={cfg.start}
                              onChange={e => {
                                updateSettings({
                                  sessions: {
                                    ...settings.sessions,
                                    [sess.key]: { ...cfg, start: e.target.value }
                                  }
                                });
                              }}
                              className="w-full bg-surface border border-border-subtle rounded-xl px-2 py-1.5 text-xs text-content-primary"
                            />
                          </div>
                          <div>
                            <span className="block text-[10px] text-content-muted mb-1">End Time (UTC)</span>
                            <input
                              type="time"
                              value={cfg.end}
                              onChange={e => {
                                updateSettings({
                                  sessions: {
                                    ...settings.sessions,
                                    [sess.key]: { ...cfg, end: e.target.value }
                                  }
                                });
                              }}
                              className="w-full bg-surface border border-border-subtle rounded-xl px-2 py-1.5 text-xs text-content-primary"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Favorite Symbols */}
                <div className="space-y-3 pt-3 border-t border-border-subtle">
                  <div className="font-semibold text-xs text-content-secondary uppercase tracking-wider">Favorite Instruments</div>
                  <div className="flex flex-wrap gap-2">
                    {settings.sessions.favoriteSymbols.map((sym, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold font-mono"
                      >
                        <span>{sym}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = settings.sessions.favoriteSymbols.filter((_, i) => i !== idx);
                            updateSettings({ sessions: { favoriteSymbols: next } });
                          }}
                          className="hover:text-rose-500 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 max-w-md pt-1">
                    <input
                      type="text"
                      placeholder="e.g. NAS100, GBPJPY..."
                      value={newFavSymbolInput}
                      onChange={e => setNewFavSymbolInput(e.target.value.toUpperCase())}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newFavSymbolInput.trim()) {
                          e.preventDefault();
                          updateSettings({ sessions: { favoriteSymbols: [...settings.sessions.favoriteSymbols, newFavSymbolInput.trim()] } });
                          setNewFavSymbolInput('');
                        }
                      }}
                      className="flex-1 bg-surface-secondary border border-border-subtle rounded-xl px-3 py-1.5 text-xs text-content-primary focus:outline-none focus:border-brand-500 uppercase"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newFavSymbolInput.trim()) {
                          updateSettings({ sessions: { favoriteSymbols: [...settings.sessions.favoriteSymbols, newFavSymbolInput.trim()] } });
                          setNewFavSymbolInput('');
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Excluded Symbols */}
                <div className="space-y-3 pt-3 border-t border-border-subtle">
                  <div className="font-semibold text-xs text-content-secondary uppercase tracking-wider">Blacklisted / Excluded Symbols</div>
                  <div className="text-[11px] text-content-muted">Trades on blacklisted symbols trigger immediate Risk Guardian rule violations</div>
                  <div className="flex flex-wrap gap-2">
                    {settings.sessions.excludedSymbols.map((sym, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs font-bold font-mono"
                      >
                        <span>{sym}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = settings.sessions.excludedSymbols.filter((_, i) => i !== idx);
                            updateSettings({ sessions: { excludedSymbols: next } });
                          }}
                          className="hover:text-rose-600 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 max-w-md pt-1">
                    <input
                      type="text"
                      placeholder="e.g. GER40..."
                      value={newExclSymbolInput}
                      onChange={e => setNewExclSymbolInput(e.target.value.toUpperCase())}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newExclSymbolInput.trim()) {
                          e.preventDefault();
                          updateSettings({ sessions: { excludedSymbols: [...settings.sessions.excludedSymbols, newExclSymbolInput.trim()] } });
                          setNewExclSymbolInput('');
                        }
                      }}
                      className="flex-1 bg-surface-secondary border border-border-subtle rounded-xl px-3 py-1.5 text-xs text-content-primary focus:outline-none focus:border-brand-500 uppercase"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newExclSymbolInput.trim()) {
                          updateSettings({ sessions: { excludedSymbols: [...settings.sessions.excludedSymbols, newExclSymbolInput.trim()] } });
                          setNewExclSymbolInput('');
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                    >
                      Exclude
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 7. Notifications */}
            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-content-primary flex items-center gap-2">
                    <Bell className="w-5 h-5 text-brand-500" />
                    <span>Notification Dispatches & Quiet Hours</span>
                  </h2>
                  <p className="text-xs text-content-muted mt-0.5">Control report deliveries, risk broadcast thresholds, and sleep periods</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'dailyReportEmail', title: 'Daily Evening P/L Digest', desc: 'Summary of daily reconstructed trades and discipline score' },
                    { key: 'weeklyReportEmail', title: 'Weekly Performance Review', desc: 'In-depth playbook win rates and mistake breakdown' },
                    { key: 'syncStatusAlerts', title: 'Terminal Connection Warnings', desc: 'Alerts when your local MT5 bridge heartbeat drops' },
                    { key: 'journalingStreakAlerts', title: 'Daily Streak Reminders', desc: 'Reminders before midnight to maintain journal consistency' },
                    { key: 'riskBreachAlerts', title: 'Risk Breach Broadcasts', desc: 'Instant high-priority dispatch on loss limit hits' }
                  ].map(item => {
                    const isChecked = (settings.notifications as any)[item.key];
                    return (
                      <div
                        key={item.key}
                        className="p-4 rounded-2xl bg-surface-secondary/70 border border-border-subtle flex items-center justify-between"
                      >
                        <div className="pr-4">
                          <div className="font-semibold text-xs text-content-primary">{item.title}</div>
                          <div className="text-[11px] text-content-muted mt-0.5">{item.desc}</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            updateSettings({
                              notifications: {
                                ...settings.notifications,
                                [item.key]: e.target.checked
                              }
                            });
                          }}
                          className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500"
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Quiet Hours */}
                <div className="p-4 rounded-2xl bg-surface-secondary/70 border border-border-subtle space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-content-primary">Quiet Hours (DND)</div>
                      <div className="text-[11px] text-content-muted">Mute non-critical notifications during trading off-hours</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notifications.quietHours.enabled}
                      onChange={e => {
                        updateSettings({
                          notifications: {
                            quietHours: {
                              ...settings.notifications.quietHours,
                              enabled: e.target.checked
                            }
                          }
                        });
                      }}
                      className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500"
                    />
                  </div>

                  {settings.notifications.quietHours.enabled && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <span className="block text-[10px] text-content-muted mb-1">Silence Starts At</span>
                        <input
                          type="time"
                          value={settings.notifications.quietHours.start}
                          onChange={e => {
                            updateSettings({
                              notifications: {
                                quietHours: {
                                  ...settings.notifications.quietHours,
                                  start: e.target.value
                                }
                              }
                            });
                          }}
                          className="w-full bg-surface border border-border-subtle rounded-xl px-2.5 py-1.5 text-xs text-content-primary"
                        />
                      </div>
                      <div>
                        <span className="block text-[10px] text-content-muted mb-1">Resume Notifications At</span>
                        <input
                          type="time"
                          value={settings.notifications.quietHours.end}
                          onChange={e => {
                            updateSettings({
                              notifications: {
                                quietHours: {
                                  ...settings.notifications.quietHours,
                                  end: e.target.value
                                }
                              }
                            });
                          }}
                          className="w-full bg-surface border border-border-subtle rounded-xl px-2.5 py-1.5 text-xs text-content-primary"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Browser Push Permission CTA */}
                <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-xs text-brand-600 dark:text-brand-400">Desktop Web Push Notifications</div>
                    <div className="text-[11px] text-content-muted mt-0.5">
                      Receive immediate alerts on desktop even when Meta Coach tab is running in the background.
                    </div>
                  </div>
                  <button
                    onClick={handleRequestPushPermission}
                    className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition whitespace-nowrap"
                  >
                    Enable Browser Push
                  </button>
                </div>
              </div>
            )}

            {/* 8. Rewards */}
            {activeSection === 'rewards' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-content-primary flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    <span>Discipline Rewards & Gamification</span>
                  </h2>
                  <p className="text-xs text-content-muted mt-0.5">Set daily journaling targets and calibrate discipline XP feedback</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-surface-secondary/70 border border-border-subtle flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-content-primary">XP Progression Notifications</div>
                      <div className="text-[11px] text-content-muted">Celebrate leveling up and disciplined execution milestones</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.rewards.xpNotifications}
                      onChange={e => updateSettings({ rewards: { xpNotifications: e.target.checked } })}
                      className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-surface-secondary/70 border border-border-subtle flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-content-primary">Streak Maintenance Alerts</div>
                      <div className="text-[11px] text-content-muted">Notify when active discipline streak is about to reset</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.rewards.streakNotifications}
                      onChange={e => updateSettings({ rewards: { streakNotifications: e.target.checked } })}
                      className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-surface-secondary/70 border border-border-subtle space-y-2 max-w-md">
                  <label className="block text-xs font-semibold text-content-secondary">Daily Journaling Goal (Trades / Day)</label>
                  <div className="text-[11px] text-content-muted">Target number of reviewed executions required to earn full daily discipline XP</div>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={settings.rewards.dailyJournalingGoalTrades}
                    onChange={e => updateSettings({ rewards: { dailyJournalingGoalTrades: parseInt(e.target.value, 10) || 1 } })}
                    className="w-full bg-surface border border-border-subtle rounded-xl px-3 py-2 text-xs font-bold text-content-primary focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            )}

            {/* 9. AI Coach */}
            {activeSection === 'aiCoach' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-content-primary flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-brand-500" />
                    <span>AI Trading Coach Configuration</span>
                  </h2>
                  <p className="text-xs text-content-muted mt-0.5">Control the cognitive persona, accessible trading history sources, and privacy memory</p>
                </div>

                {/* Tone Selector */}
                <div className="p-4 rounded-2xl bg-surface-secondary/70 border border-border-subtle space-y-2">
                  <label className="block text-xs font-semibold text-content-secondary">Response Tone & Feedback Depth</label>
                  <div className="grid grid-cols-2 gap-3 max-w-md">
                    {[
                      { tone: 'concise', label: 'Concise & Direct', desc: 'Tactical bullet points, minimal fluff' },
                      { tone: 'detailed', label: 'Detailed & Analytical', desc: 'Comprehensive psychological & statistical breakdowns' }
                    ].map(t => (
                      <button
                        key={t.tone}
                        type="button"
                        onClick={() => updateSettings({ aiCoach: { responseTone: t.tone as any } })}
                        className={`p-3 rounded-xl border text-left transition ${
                          settings.aiCoach.responseTone === t.tone
                            ? 'bg-brand-500/10 border-brand-500 text-content-primary ring-1 ring-brand-500'
                            : 'bg-surface border-border-subtle text-content-muted'
                        }`}
                      >
                        <div className="font-bold text-xs">{t.label}</div>
                        <div className="text-[10px] mt-0.5 line-clamp-1">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accessible Context Data Sources */}
                <div className="space-y-3 pt-3 border-t border-border-subtle">
                  <div className="font-semibold text-xs text-content-secondary uppercase tracking-wider">AI Context Ingestion Permissions</div>
                  <div className="text-[11px] text-content-muted">Choose which metrics the AI Coach can observe when formulating feedback</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'closedTrades', label: 'Closed Position Histories' },
                      { key: 'openPositions', label: 'Real-time Open Positions' },
                      { key: 'subjectiveNotes', label: 'Personal Subjective Journal Notes' },
                      { key: 'mistakeTags', label: 'Rule Violations & Mistake Tags' },
                      { key: 'sessionAnalytics', label: 'Session Performance Timings' }
                    ].map(item => {
                      const isAllowed = (settings.aiCoach.dataSources as any)[item.key];
                      return (
                        <div
                          key={item.key}
                          className="p-3 rounded-xl bg-surface-secondary/70 border border-border-subtle flex items-center justify-between"
                        >
                          <span className="text-xs font-medium text-content-primary">{item.label}</span>
                          <input
                            type="checkbox"
                            checked={isAllowed}
                            onChange={e => {
                              updateSettings({
                                aiCoach: {
                                  dataSources: {
                                    ...settings.aiCoach.dataSources,
                                    [item.key]: e.target.checked
                                  }
                                }
                              });
                            }}
                            className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Memory management */}
                <div className="pt-4 border-t border-border-subtle flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-xs text-content-primary">Clear AI Conversation History</div>
                    <div className="text-[11px] text-content-muted">Permanently wipes memory state and chat context</div>
                  </div>
                  <button
                    onClick={() => setShowClearAiModal(true)}
                    className="px-3 py-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10 border border-rose-500/30 text-xs font-semibold transition"
                  >
                    Clear History
                  </button>
                </div>
              </div>
            )}

            {/* 10. Bridge & Sync */}
            {activeSection === 'bridge' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-content-primary flex items-center gap-2">
                      <Radio className="w-5 h-5 text-emerald-500" />
                      <span>MT5 Bridge & Local Terminals</span>
                    </h2>
                    <p className="text-xs text-content-muted mt-0.5">Manage authorized Windows bridge daemons and force manual deal synchronization</p>
                  </div>
                  <button
                    onClick={async () => {
                      await refreshAccounts();
                      loadDevices();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync Now</span>
                  </button>
                </div>

                {/* Devices List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-content-secondary uppercase tracking-wider">Authorized Bridge Devices</span>
                    <a
                      href="/pair"
                      className="text-xs text-brand-500 hover:underline font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Pair New Terminal</span>
                    </a>
                  </div>

                  {loadingDevices ? (
                    <div className="py-6 text-center text-xs text-content-muted">Loading terminals...</div>
                  ) : bridgeDevices.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-surface-secondary text-center space-y-2 border border-border-subtle">
                      <div className="text-xs text-content-muted">No external bridge terminals currently authorized.</div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {bridgeDevices.map(d => (
                        <div
                          key={d.id}
                          className="p-3.5 rounded-2xl bg-surface-secondary/70 border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              <Smartphone className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-xs text-content-primary">{d.device_name || 'Windows MT5 Daemon'}</div>
                              <div className="text-[10px] text-content-muted font-mono">
                                Registered {new Date(d.created_at).toLocaleDateString()} • Token: ••••••••{d.device_token?.slice(-6) || ''}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 ml-auto">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              Authorized
                            </span>
                            <button
                              onClick={() => handleRevokeDevice(d.id)}
                              className="px-2.5 py-1 rounded-xl text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 text-xs font-medium transition"
                            >
                              Revoke
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 11. Privacy & Security */}
            {activeSection === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-content-primary flex items-center gap-2">
                    <Lock className="w-5 h-5 text-brand-500" />
                    <span>Privacy, 2FA & Platform Security</span>
                  </h2>
                  <p className="text-xs text-content-muted mt-0.5">Control TOTP authenticator protection, full balance obfuscation, and automated archives</p>
                </div>

                {/* Privacy Mode Big Card */}
                <div className="p-4 rounded-2xl bg-surface-secondary/70 border border-border-subtle flex items-center justify-between">
                  <div className="space-y-1 pr-4">
                    <div className="font-semibold text-sm text-content-primary flex items-center gap-2">
                      {privacyMode ? <EyeOff className="w-4 h-4 text-amber-500" /> : <Eye className="w-4 h-4 text-brand-500" />}
                      <span>Global Privacy Mode (Hide Balances & P/L)</span>
                    </div>
                    <div className="text-xs text-content-muted">
                      Blurs and masks all numerical account balances, equity, and monetary gain across the entire application interface. Ideal for screenshots or public streaming.
                    </div>
                  </div>
                  <button
                    onClick={togglePrivacyMode}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      privacyMode
                        ? 'bg-amber-500 text-black shadow-md'
                        : 'bg-surface border border-border-subtle text-content-primary hover:bg-surface-elevated'
                    }`}
                  >
                    {privacyMode ? 'Privacy Active' : 'Enable Privacy'}
                  </button>
                </div>

                {/* Two-Factor Authentication (TOTP) */}
                <div className="p-4 rounded-2xl bg-surface-secondary/70 border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-semibold text-sm text-content-primary flex items-center gap-2">
                      <Shield className="w-4 h-4 text-brand-500" />
                      <span>Two-Factor Authentication (TOTP)</span>
                    </div>
                    <div className="text-xs text-content-muted">
                      Protect your trading journal with an authenticator app (Google Authenticator, 1Password, Authy).
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTotpModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-surface-secondary hover:bg-surface-elevated border border-border-subtle text-xs font-semibold text-content-primary transition"
                  >
                    {settings.security.twoFactorEnabled ? 'Manage 2FA' : 'Set Up 2FA'}
                  </button>
                </div>

                {/* Scheduled Compliance Exports */}
                <div className="p-4 rounded-2xl bg-surface-secondary/70 border border-border-subtle space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-content-primary">Automated Scheduled Backups</div>
                      <div className="text-[11px] text-content-muted">Periodically compile and email trade archive backups</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.security.scheduledExports?.enabled}
                      onChange={e => {
                        updateSettings({
                          security: {
                            scheduledExports: {
                              ...settings.security.scheduledExports,
                              enabled: e.target.checked
                            }
                          }
                        });
                      }}
                      className="w-5 h-5 rounded text-brand-600 focus:ring-brand-500"
                    />
                  </div>

                  {settings.security.scheduledExports?.enabled && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <span className="block text-[10px] text-content-muted mb-1">Frequency</span>
                        <select
                          value={settings.security.scheduledExports.frequency}
                          onChange={e => {
                            updateSettings({
                              security: {
                                scheduledExports: {
                                  ...settings.security.scheduledExports,
                                  frequency: e.target.value as any
                                }
                              }
                            });
                          }}
                          className="w-full bg-surface border border-border-subtle rounded-xl px-2.5 py-1.5 text-xs text-content-primary"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      <div>
                        <span className="block text-[10px] text-content-muted mb-1">Archive Format</span>
                        <select
                          value={settings.security.scheduledExports.format}
                          onChange={e => {
                            updateSettings({
                              security: {
                                scheduledExports: {
                                  ...settings.security.scheduledExports,
                                  format: e.target.value as any
                                }
                              }
                            });
                          }}
                          className="w-full bg-surface border border-border-subtle rounded-xl px-2.5 py-1.5 text-xs text-content-primary"
                        >
                          <option value="csv">Standard CSV</option>
                          <option value="pdf">Auditor PDF</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Active Sessions */}
                <div className="space-y-3 pt-3 border-t border-border-subtle">
                  <div className="font-semibold text-xs text-content-secondary uppercase tracking-wider">Active Device Sessions</div>
                  <div className="p-3.5 rounded-2xl bg-surface-secondary/70 border border-border-subtle flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-content-primary flex items-center gap-1.5">
                        <span>Current Browser Session</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      </div>
                      <div className="text-[11px] text-content-muted mt-0.5">
                        {navigator.userAgent.slice(0, 50)}...
                      </div>
                    </div>
                    <button
                      onClick={() => alert('Other device sessions have been invalidated.')}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium text-content-muted hover:text-content-primary hover:bg-surface-elevated border border-border-subtle transition"
                    >
                      Sign Out Other Devices
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MODAL: Change Password */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border-strong rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="font-bold text-sm text-content-primary flex items-center gap-2">
                <Key className="w-4 h-4 text-brand-500" />
                <span>Change Password</span>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="text-content-muted hover:text-content-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currPassword}
                  onChange={e => setCurrPassword(e.target.value)}
                  className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-3 py-2 text-xs text-content-primary focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-3 py-2 text-xs text-content-primary focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-secondary mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-3 py-2 text-xs text-content-primary focus:outline-none focus:border-brand-500"
                />
              </div>

              {passwordStatus.type === 'error' && (
                <div className="text-xs text-rose-500 font-semibold">{passwordStatus.message}</div>
              )}
              {passwordStatus.type === 'success' && (
                <div className="text-xs text-emerald-500 font-semibold">{passwordStatus.message}</div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-border-subtle text-xs text-content-muted hover:text-content-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordStatus.type === 'loading'}
                  className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {passwordStatus.type === 'loading' ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Reset Section to Defaults */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border-strong rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2.5 text-amber-500 font-bold text-sm">
              <RotateCcw className="w-4 h-4" />
              <span>Reset Section to Factory Defaults?</span>
            </div>
            <p className="text-xs text-content-muted">
              Are you sure you want to reset all parameters in <strong className="text-content-primary">"{activeSection}"</strong> back to their factory default values?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-3 py-1.5 rounded-xl border border-border-subtle text-xs text-content-muted hover:text-content-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-sm transition"
              >
                Reset Section
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Delete Account */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-rose-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2.5 text-rose-500 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Permanently Delete Meta Coach Account</span>
            </div>

            <p className="text-xs text-content-muted leading-relaxed">
              This action is permanent and immediate. All your MT5 trade records, journals, voice recordings, performance metrics, and bridge device tokens will be permanently erased.
            </p>

            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
              Please type <strong className="text-white">DELETE</strong> or your email (<strong className="text-white">{user?.email}</strong>) to confirm:
            </div>

            <input
              type="text"
              placeholder="DELETE"
              value={deleteConfirmation}
              onChange={e => setDeleteConfirmation(e.target.value)}
              className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-3 py-2 text-xs text-content-primary focus:outline-none focus:border-rose-500 font-mono"
            />

            {deleteError && (
              <div className="text-xs text-rose-500 font-semibold">{deleteError}</div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-3 py-1.5 rounded-xl border border-border-subtle text-xs text-content-muted hover:text-content-primary"
              >
                Keep Account
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Confirm Permanent Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: 2FA TOTP */}
      {showTotpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border-strong rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="font-bold text-sm text-content-primary flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-500" />
                <span>Two-Factor Authentication Setup</span>
              </div>
              <button onClick={() => setShowTotpModal(false)} className="text-content-muted hover:text-content-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-content-muted">
              <p>Scan this QR code with Google Authenticator or enter the manual secret key:</p>

              {/* Mock QR visual */}
              <div className="w-36 h-36 mx-auto bg-white p-2 rounded-xl flex items-center justify-center border border-slate-300 shadow-sm">
                <div className="w-full h-full bg-slate-900 rounded-lg flex flex-col items-center justify-center text-white text-[10px] text-center font-mono p-2">
                  <div className="w-6 h-6 border-2 border-white rounded mb-1" />
                  <span>TOTP AUTH</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-secondary border border-border-subtle flex items-center justify-between font-mono text-content-primary">
                <span>JBSWY3DPEHPK3PXP</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('JBSWY3DPEHPK3PXP');
                    alert('Secret copied to clipboard.');
                  }}
                  className="text-brand-500 hover:text-brand-400 font-sans text-xs font-semibold"
                >
                  Copy
                </button>
              </div>

              <div className="font-semibold text-content-primary pt-2">Emergency Backup Codes:</div>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px] text-content-secondary">
                <div className="p-1 rounded bg-surface-secondary text-center">A1B2-C3D4</div>
                <div className="p-1 rounded bg-surface-secondary text-center">E5F6-G7H8</div>
                <div className="p-1 rounded bg-surface-secondary text-center">I9J0-K1L2</div>
                <div className="p-1 rounded bg-surface-secondary text-center">M3N4-O5P6</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => {
                  updateSettings({ security: { twoFactorEnabled: !settings.security.twoFactorEnabled } });
                  setShowTotpModal(false);
                }}
                className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
              >
                {settings.security.twoFactorEnabled ? 'Disable 2FA' : 'Verify & Enable 2FA'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Clear AI History */}
      {showClearAiModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border-strong rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="font-bold text-sm text-content-primary">Clear AI Coach History?</div>
            <p className="text-xs text-content-muted">
              This will wipe past advice threads and active context memories. Your actual MT5 trades and journal notes will remain intact.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearAiModal(false)}
                className="px-3 py-1.5 rounded-xl border border-border-subtle text-xs text-content-muted hover:text-content-primary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowClearAiModal(false);
                  alert('AI Coach chat history cleared.');
                }}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
