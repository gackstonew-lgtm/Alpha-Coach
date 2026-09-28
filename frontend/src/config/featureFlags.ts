/**
 * Meta Coach Production Feature Flags Configuration
 * Provides type-safe toggles with optional VITE_FF_* environment variable overrides.
 */

export interface FeatureFlags {
  enableAiCoach: boolean;
  enableVoiceJournal: boolean;
  enableStrategyLab: boolean;
  enableGamification: boolean;
  enableEconomicCalendar: boolean;
  enableRiskGuardian: boolean;
  enablePwaInstall: boolean;
  enableAnalytics: boolean;
  enableDataIntegrityPanel: boolean;
}

const getEnvFlag = (envKey: string, defaultValue: boolean): boolean => {
  const envVal = import.meta.env[envKey];
  if (envVal === 'true' || envVal === '1') return true;
  if (envVal === 'false' || envVal === '0') return false;
  return defaultValue;
};

export const FEATURE_FLAGS: FeatureFlags = {
  enableAiCoach: getEnvFlag('VITE_FF_AI_COACH', true),
  enableVoiceJournal: getEnvFlag('VITE_FF_VOICE_JOURNAL', true),
  enableStrategyLab: getEnvFlag('VITE_FF_STRATEGY_LAB', true),
  enableGamification: getEnvFlag('VITE_FF_GAMIFICATION', true),
  enableEconomicCalendar: getEnvFlag('VITE_FF_ECONOMIC_CALENDAR', true),
  enableRiskGuardian: getEnvFlag('VITE_FF_RISK_GUARDIAN', true),
  enablePwaInstall: getEnvFlag('VITE_FF_PWA_INSTALL', true),
  enableAnalytics: getEnvFlag('VITE_FF_ANALYTICS', true),
  enableDataIntegrityPanel: getEnvFlag('VITE_FF_DATA_INTEGRITY', true)
};

export const isFeatureEnabled = (flag: keyof FeatureFlags): boolean => {
  return FEATURE_FLAGS[flag] ?? false;
};
