import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { UserSettings, getDefaultSettings } from '../types/settings';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

interface SettingsContextType {
  settings: UserSettings;
  isLoading: boolean;
  isSaving: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  errorMessage: string | null;
  lastSaved: Date | null;
  privacyMode: boolean;
  togglePrivacyMode: () => void;
  updateSettings: (updates: DeepPartial<UserSettings> | ((prev: UserSettings) => UserSettings)) => void;
  saveImmediately: (updates?: DeepPartial<UserSettings>) => Promise<void>;
  resetSection: (section: string) => Promise<void>;
  formatCurrency: (val: number | undefined | null) => string;
  formatDate: (dateStr: string | Date | undefined | null, includeTime?: boolean) => string;
  formatPnL: (val: number | undefined | null, startingBalance?: number) => { text: string; raw: number; isMasked: boolean; isPositive: boolean };
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Deep merge helper
function deepMerge<T extends Record<string, any>>(target: T, source: Record<string, any>): T {
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      key in target &&
      typeof (target as any)[key] === 'object' &&
      !Array.isArray((target as any)[key])
    ) {
      (output as any)[key] = deepMerge((target as any)[key], source[key]);
    } else {
      (output as any)[key] = source[key];
    }
  }
  return output;
}

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(() => getDefaultSettings());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Queue of pending updates for debounce autosave
  const pendingUpdatesRef = useRef<DeepPartial<UserSettings>>({});
  const debounceTimerRef = useRef<any>(null);
  const savedStatusTimerRef = useRef<any>(null);

  // Load settings on auth or user change
  useEffect(() => {
    let isMounted = true;
    if (!isAuthenticated || !user) {
      setSettings(getDefaultSettings());
      setIsLoading(false);
      return;
    }

    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const res = await api.getSettings();
        if (res && res.settings && isMounted) {
          const merged = deepMerge(getDefaultSettings(user), res.settings);
          setSettings(merged);
        }
      } catch (err: any) {
        console.warn('[SettingsContext] Failed to fetch settings, using local defaults:', err);
        if (isMounted) {
          setSettings(getDefaultSettings(user));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchSettings();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.id]);

  // Execute the save to backend
  const executeSave = useCallback(async (payloadToSave: DeepPartial<UserSettings>) => {
    setIsSaving(true);
    setSaveStatus('saving');
    setErrorMessage(null);

    try {
      const res = await api.updateSettings(payloadToSave as any);
      if (res && res.settings) {
        setSettings(prev => deepMerge(prev, res.settings));
      }
      setLastSaved(new Date());
      setSaveStatus('saved');

      if (savedStatusTimerRef.current) clearTimeout(savedStatusTimerRef.current);
      savedStatusTimerRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 2500);
    } catch (err: any) {
      console.error('[SettingsContext] Error updating settings:', err);
      setSaveStatus('error');
      setErrorMessage(err.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Debounced update handler
  const updateSettings = useCallback((updates: DeepPartial<UserSettings> | ((prev: UserSettings) => UserSettings)) => {
    setSettings(prev => {
      let resolvedUpdates: DeepPartial<UserSettings>;
      let nextState: UserSettings;

      if (typeof updates === 'function') {
        nextState = updates(prev);
        resolvedUpdates = nextState;
      } else {
        nextState = deepMerge(prev, updates as Record<string, any>);
        resolvedUpdates = updates;
      }

      // Merge into pending updates
      pendingUpdatesRef.current = deepMerge(pendingUpdatesRef.current, resolvedUpdates as Record<string, any>);

      // Reset debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        const payload = { ...pendingUpdatesRef.current };
        pendingUpdatesRef.current = {};
        executeSave(payload);
      }, 600);

      return nextState;
    });
  }, [executeSave]);

  // Immediate save
  const saveImmediately = useCallback(async (updates?: DeepPartial<UserSettings>) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    const combined = deepMerge(pendingUpdatesRef.current, updates || {});
    pendingUpdatesRef.current = {};
    if (Object.keys(combined).length > 0) {
      await executeSave(combined);
    }
  }, [executeSave]);

  // Reset section
  const resetSection = useCallback(async (section: string) => {
    setIsSaving(true);
    setSaveStatus('saving');
    try {
      const res = await api.resetSettingsSection(section);
      if (res && res.settings) {
        setSettings(prev => deepMerge(prev, res.settings));
      }
      setLastSaved(new Date());
      setSaveStatus('saved');
      if (savedStatusTimerRef.current) clearTimeout(savedStatusTimerRef.current);
      savedStatusTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err: any) {
      setSaveStatus('error');
      setErrorMessage(err.message || `Failed to reset section ${section}.`);
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Privacy mode toggle
  const privacyMode = Boolean(settings.security?.privacyMode);
  const togglePrivacyMode = useCallback(() => {
    const nextVal = !privacyMode;
    updateSettings({
      security: {
        privacyMode: nextVal
      }
    });
  }, [privacyMode, updateSettings]);

  // Formatting helpers
  const formatCurrency = useCallback((val: number | undefined | null): string => {
    if (val === undefined || val === null || isNaN(val)) return '$0.00';
    if (privacyMode) return '••••••';

    const symbol = settings.display.currencySymbol || '$';
    const absVal = Math.abs(val);
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(absVal);

    if (val < 0) {
      return `-${symbol}${formatted}`;
    }
    return `${symbol}${formatted}`;
  }, [settings.display.currencySymbol, privacyMode]);

  const formatDate = useCallback((dateStr: string | Date | undefined | null, includeTime = false): string => {
    if (!dateStr) return 'N/A';
    try {
      const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
      if (isNaN(d.getTime())) return 'Invalid Date';

      const tz = settings.profile.timezone || 'UTC';
      const is24h = settings.display.timeFormat === '24h';
      const fmt = settings.display.dateFormat || 'YYYY-MM-DD';

      // Basic date formatting
      const year = d.toLocaleDateString('en-US', { timeZone: tz, year: 'numeric' });
      const month = d.toLocaleDateString('en-US', { timeZone: tz, month: '2-digit' });
      const day = d.toLocaleDateString('en-US', { timeZone: tz, day: '2-digit' });

      let datePart = `${year}-${month}-${day}`;
      if (fmt === 'DD/MM/YYYY') {
        datePart = `${day}/${month}/${year}`;
      } else if (fmt === 'MM/DD/YYYY') {
        datePart = `${month}/${day}/${year}`;
      }

      if (!includeTime) return datePart;

      const timePart = d.toLocaleTimeString('en-US', {
        timeZone: tz,
        hour12: !is24h,
        hour: '2-digit',
        minute: '2-digit'
      });

      return `${datePart} ${timePart}`;
    } catch {
      return String(dateStr);
    }
  }, [settings.profile.timezone, settings.display.timeFormat, settings.display.dateFormat]);

  const formatPnL = useCallback((val: number | undefined | null, startingBalance?: number) => {
    const raw = typeof val === 'number' && !isNaN(val) ? val : 0;
    const isPositive = raw >= 0;

    if (privacyMode) {
      return { text: '••••••', raw, isMasked: true, isPositive };
    }

    const mode = settings.display.plDisplayMode;
    const symbol = settings.display.currencySymbol || '$';

    if (mode === 'percent' && startingBalance && startingBalance > 0) {
      const pct = (raw / startingBalance) * 100;
      return {
        text: `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`,
        raw,
        isMasked: false,
        isPositive
      };
    }

    if (mode === 'r_multiple') {
      const risk = settings.journal.defaultRiskPerTrade || 100;
      const r = raw / (risk > 0 ? risk : 100);
      return {
        text: `${r >= 0 ? '+' : ''}${r.toFixed(2)}R`,
        raw,
        isMasked: false,
        isPositive
      };
    }

    // Default money
    const absVal = Math.abs(raw);
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(absVal);
    const text = raw < 0 ? `-${symbol}${formatted}` : `+${symbol}${formatted}`;
    return { text, raw, isMasked: false, isPositive };
  }, [privacyMode, settings.display.plDisplayMode, settings.display.currencySymbol, settings.journal.defaultRiskPerTrade]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        isSaving,
        saveStatus,
        errorMessage,
        lastSaved,
        privacyMode,
        togglePrivacyMode,
        updateSettings,
        saveImmediately,
        resetSection,
        formatCurrency,
        formatDate,
        formatPnL
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
