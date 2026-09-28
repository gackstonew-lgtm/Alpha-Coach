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
      timezone: user?.timezone || (Intl?.DateTimeFormat?.()?.resolvedOptions()?.timeZone || 'UTC')
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
