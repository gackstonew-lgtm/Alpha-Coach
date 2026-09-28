import { z } from 'zod';

export interface UserSettings {
  profile: {
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    timezone: string;
  };
  accounts: {
    defaultAccountId: string;
    accountCustomizations: Record<string, {
      nickname?: string;
      hidden?: boolean;
      archived?: boolean;
      currency?: string;
      startingBalance?: number;
      serverTimeOffsetHours?: number;
    }>;
  };
  risk: {
    dailyLossLimitType: 'amount' | 'percent';
    dailyLossLimitAmount: number;
    dailyLossLimitPercent: number;
    maxTradesPerDay: number;
    maxPositionSize: number;
    consecutiveLossLimit: number;
    alerts: {
      inAppBanner: boolean;
      sound: boolean;
      push: boolean;
      email: boolean;
    };
  };
  journal: {
    customSetups: string[];
    customTags: string[];
    customMistakes: string[];
    requiredReviewFields: {
      setup: boolean;
      bias: boolean;
      confluences: boolean;
      mistake: boolean;
      lessonLearned: boolean;
      confidence: boolean;
    };
    remindLosingTrades: boolean;
    defaultRiskPerTrade: number;
    voiceJournalLanguage: string;
  };
  display: {
    currency: string;
    currencySymbol: string;
    timeFormat: '12h' | '24h';
    dateFormat: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
    weekStartDay: 'sunday' | 'monday';
    defaultDateRange: 'today' | '7d' | '30d' | '90d' | 'year' | 'all';
    plDisplayMode: 'money' | 'percent' | 'r_multiple';
    dashboardWidgets: Array<{ id: string; name: string; visible: boolean; order: number }>;
    layoutDensity: 'comfortable' | 'compact';
  };
  sessions: {
    london: { start: string; end: string; enabled: boolean };
    newYork: { start: string; end: string; enabled: boolean };
    asia: { start: string; end: string; enabled: boolean };
    overlap: { start: string; end: string; enabled: boolean };
    favoriteSymbols: string[];
    excludedSymbols: string[];
  };
  notifications: {
    dailyReportEmail: boolean;
    weeklyReportEmail: boolean;
    syncStatusAlerts: boolean;
    journalingStreakAlerts: boolean;
    riskBreachAlerts: boolean;
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
    browserPushEnabled: boolean;
  };
  rewards: {
    xpNotifications: boolean;
    streakNotifications: boolean;
    dailyJournalingGoalTrades: number;
  };
  aiCoach: {
    responseTone: 'concise' | 'detailed';
    dataSources: {
      closedTrades: boolean;
      openPositions: boolean;
      subjectiveNotes: boolean;
      mistakeTags: boolean;
      sessionAnalytics: boolean;
    };
  };
  security: {
    twoFactorEnabled: boolean;
    twoFactorSecret?: string;
    twoFactorBackupCodes?: string[];
    privacyMode: boolean;
    scheduledExports: {
      enabled: boolean;
      frequency: 'daily' | 'weekly' | 'monthly' | 'disabled';
      format: 'csv' | 'pdf';
    };
  };
}

export const DEFAULT_DASHBOARD_WIDGETS = [
  { id: 'balanceCard', name: 'Account Balance & Equity', visible: true, order: 0 },
  { id: 'netProfitCard', name: 'Net P/L & Win Rate', visible: true, order: 1 },
  { id: 'profitFactorCard', name: 'Profit Factor & Expectancy', visible: true, order: 2 },
  { id: 'streakCard', name: 'Win/Loss Discipline Streaks', visible: true, order: 3 },
  { id: 'equityCurve', name: 'Equity High-Watermark Curve', visible: true, order: 4 },
  { id: 'dailyPnl', name: 'Daily P/L Bar Distribution', visible: true, order: 5 },
  { id: 'recentTrades', name: 'Recent Position Reconstructions', visible: true, order: 6 },
  { id: 'calendarPreview', name: 'Monthly Calendar Preview', visible: true, order: 7 }
];

export function getDefaultSettings(user?: { firstName?: string; lastName?: string; timezone?: string; currency?: string }): UserSettings {
  const currency = user?.currency || 'USD';
  const currencySymbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'JPY' ? '¥' : '$';

  return {
    profile: {
      firstName: user?.firstName || 'Trader',
      lastName: user?.lastName || '',
      avatarUrl: null,
      timezone: user?.timezone || 'UTC'
    },
    accounts: {
      defaultAccountId: 'ALL',
      accountCustomizations: {}
    },
    risk: {
      dailyLossLimitType: 'amount',
      dailyLossLimitAmount: 500,
      dailyLossLimitPercent: 2.0,
      maxTradesPerDay: 5,
      maxPositionSize: 5.0,
      consecutiveLossLimit: 3,
      alerts: {
        inAppBanner: true,
        sound: true,
        push: false,
        email: true
      }
    },
    journal: {
      customSetups: [
        'Liquidity Sweep & MSS',
        'Fair Value Gap (FVG)',
        'Order Block Retest',
        'Break & Retest',
        'London Open Breakout',
        'NY Session Reversal'
      ],
      customTags: ['High Confluence', 'A+ Setup', 'Trend Following', 'News Driver', 'Session Open'],
      customMistakes: [
        'FOMO Entry',
        'Revenge Trading',
        'Premature Exit',
        'Widened Stop Loss',
        'Oversized Position',
        'Ignored Economic Red Flag'
      ],
      requiredReviewFields: {
        setup: true,
        bias: false,
        confluences: false,
        mistake: true,
        lessonLearned: true,
        confidence: false
      },
      remindLosingTrades: true,
      defaultRiskPerTrade: 100,
      voiceJournalLanguage: 'en-US'
    },
    display: {
      currency,
      currencySymbol,
      timeFormat: '24h',
      dateFormat: 'YYYY-MM-DD',
      weekStartDay: 'monday',
      defaultDateRange: '30d',
      plDisplayMode: 'money',
      dashboardWidgets: DEFAULT_DASHBOARD_WIDGETS,
      layoutDensity: 'comfortable'
    },
    sessions: {
      london: { start: '08:00', end: '16:00', enabled: true },
      newYork: { start: '13:00', end: '21:00', enabled: true },
      asia: { start: '00:00', end: '08:00', enabled: true },
      overlap: { start: '13:00', end: '16:00', enabled: true },
      favoriteSymbols: ['XAUUSD', 'EURUSD', 'BTCUSD', 'US30'],
      excludedSymbols: []
    },
    notifications: {
      dailyReportEmail: true,
      weeklyReportEmail: true,
      syncStatusAlerts: true,
      journalingStreakAlerts: true,
      riskBreachAlerts: true,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '07:00'
      },
      browserPushEnabled: false
    },
    rewards: {
      xpNotifications: true,
      streakNotifications: true,
      dailyJournalingGoalTrades: 3
    },
    aiCoach: {
      responseTone: 'concise',
      dataSources: {
        closedTrades: true,
        openPositions: true,
        subjectiveNotes: true,
        mistakeTags: true,
        sessionAnalytics: true
      }
    },
    security: {
      twoFactorEnabled: false,
      privacyMode: false,
      scheduledExports: {
        enabled: false,
        frequency: 'weekly',
        format: 'csv'
      }
    }
  };
}

// Zod Validation Schemas
export const UserSettingsUpdateSchema = z.object({
  profile: z.object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().max(100).optional(),
    avatarUrl: z.string().nullable().optional(),
    timezone: z.string().min(1).max(100).optional()
  }).optional(),
  accounts: z.object({
    defaultAccountId: z.string().optional(),
    accountCustomizations: z.record(z.object({
      nickname: z.string().max(100).optional(),
      hidden: z.boolean().optional(),
      archived: z.boolean().optional(),
      currency: z.string().max(10).optional(),
      startingBalance: z.number().nonnegative().optional(),
      serverTimeOffsetHours: z.number().min(-14).max(14).optional()
    })).optional()
  }).optional(),
  risk: z.object({
    dailyLossLimitType: z.enum(['amount', 'percent']).optional(),
    dailyLossLimitAmount: z.number().nonnegative().optional(),
    dailyLossLimitPercent: z.number().min(0).max(100).optional(),
    maxTradesPerDay: z.number().int().nonnegative().optional(),
    maxPositionSize: z.number().nonnegative().optional(),
    consecutiveLossLimit: z.number().int().nonnegative().optional(),
    alerts: z.object({
      inAppBanner: z.boolean().optional(),
      sound: z.boolean().optional(),
      push: z.boolean().optional(),
      email: z.boolean().optional()
    }).optional()
  }).optional(),
  journal: z.object({
    customSetups: z.array(z.string().min(1).max(100)).optional(),
    customTags: z.array(z.string().min(1).max(100)).optional(),
    customMistakes: z.array(z.string().min(1).max(100)).optional(),
    requiredReviewFields: z.object({
      setup: z.boolean().optional(),
      bias: z.boolean().optional(),
      confluences: z.boolean().optional(),
      mistake: z.boolean().optional(),
      lessonLearned: z.boolean().optional(),
      confidence: z.boolean().optional()
    }).optional(),
    remindLosingTrades: z.boolean().optional(),
    defaultRiskPerTrade: z.number().nonnegative().optional(),
    voiceJournalLanguage: z.string().min(2).max(10).optional()
  }).optional(),
  display: z.object({
    currency: z.string().min(1).max(10).optional(),
    currencySymbol: z.string().max(5).optional(),
    timeFormat: z.enum(['12h', '24h']).optional(),
    dateFormat: z.enum(['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY']).optional(),
    weekStartDay: z.enum(['sunday', 'monday']).optional(),
    defaultDateRange: z.enum(['today', '7d', '30d', '90d', 'year', 'all']).optional(),
    plDisplayMode: z.enum(['money', 'percent', 'r_multiple']).optional(),
    dashboardWidgets: z.array(z.object({
      id: z.string(),
      name: z.string(),
      visible: z.boolean(),
      order: z.number()
    })).optional(),
    layoutDensity: z.enum(['comfortable', 'compact']).optional()
  }).optional(),
  sessions: z.object({
    london: z.object({ start: z.string(), end: z.string(), enabled: z.boolean() }).optional(),
    newYork: z.object({ start: z.string(), end: z.string(), enabled: z.boolean() }).optional(),
    asia: z.object({ start: z.string(), end: z.string(), enabled: z.boolean() }).optional(),
    overlap: z.object({ start: z.string(), end: z.string(), enabled: z.boolean() }).optional(),
    favoriteSymbols: z.array(z.string()).optional(),
    excludedSymbols: z.array(z.string()).optional()
  }).optional(),
  notifications: z.object({
    dailyReportEmail: z.boolean().optional(),
    weeklyReportEmail: z.boolean().optional(),
    syncStatusAlerts: z.boolean().optional(),
    journalingStreakAlerts: z.boolean().optional(),
    riskBreachAlerts: z.boolean().optional(),
    quietHours: z.object({
      enabled: z.boolean().optional(),
      start: z.string().optional(),
      end: z.string().optional()
    }).optional(),
    browserPushEnabled: z.boolean().optional()
  }).optional(),
  rewards: z.object({
    xpNotifications: z.boolean().optional(),
    streakNotifications: z.boolean().optional(),
    dailyJournalingGoalTrades: z.number().int().nonnegative().optional()
  }).optional(),
  aiCoach: z.object({
    responseTone: z.enum(['concise', 'detailed']).optional(),
    dataSources: z.object({
      closedTrades: z.boolean().optional(),
      openPositions: z.boolean().optional(),
      subjectiveNotes: z.boolean().optional(),
      mistakeTags: z.boolean().optional(),
      sessionAnalytics: z.boolean().optional()
    }).optional()
  }).optional(),
  security: z.object({
    twoFactorEnabled: z.boolean().optional(),
    twoFactorSecret: z.string().optional(),
    twoFactorBackupCodes: z.array(z.string()).optional(),
    privacyMode: z.boolean().optional(),
    scheduledExports: z.object({
      enabled: z.boolean().optional(),
      frequency: z.enum(['daily', 'weekly', 'monthly', 'disabled']).optional(),
      format: z.enum(['csv', 'pdf']).optional()
    }).optional()
  }).optional()
});
