/**
 * Forex News, Economic Calendar & Macro Intelligence Type Contracts
 */

export interface ForexCalendarEvent {
  id: string;
  title: string;
  country: string;
  currency: string;
  category: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  eventTime: string; // ISO 8601 UTC
  status: 'SCHEDULED' | 'PUBLISHED' | 'REVISED' | 'CANCELLED';
  actual?: string | null;
  forecast?: string | null;
  previous?: string | null;
  revisedPrevious?: string | null;
  unit?: string | null;
  sourceProvider: string;
  sourceUrl?: string | null;
  surpriseDirection?: 'POSITIVE_SURPRISE' | 'NEGATIVE_SURPRISE' | 'IN_LINE' | 'UNAVAILABLE' | 'BULLISH' | 'BEARISH' | 'NEUTRAL' | string | null;
}

export interface ForexNewsItem {
  id: string;
  headline: string;
  source: string;
  url: string;
  summary: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  publishedAt: string; // ISO 8601 UTC
  currencies: string[];
  category: 'CENTRAL_BANK' | 'INFLATION' | 'EMPLOYMENT' | 'GEOPOLITICAL' | 'YIELDS' | 'GENERAL';
  sentiment?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  relatedSymbols?: string[];
}

export interface MacroIntelligenceSummary {
  overview: string;
  majorCurrencies: Array<{
    currency: string;
    centralBank: string;
    policyRatePct: number | null;
    cpiYoYPct: number | null;
    coreCpiYoYPct?: number | null;
    gdpGrowthPct?: number | null;
    unemploymentRatePct?: number | null;
    bondYield10YPct?: number | null;
    policyStance: string;
    inflationTrend: string;
    growthMomentum: string;
    fundamentalScore: number;
    supportingFactors: string[];
    opposingFactors: string[];
  }>;
  topPairs: Array<{
    pair: string;
    bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    rateDifferentialBps: number | null;
    yieldDifferential10YBps: number | null;
    divergenceSummary: string;
    nextHighImpactEvent?: {
      title: string;
      currency: string;
      eventTime: string;
      hoursUntil: number;
    } | null;
  }>;
  upcomingHighImpactCount: number;
  nextHighImpactEvent?: {
    id: string;
    title: string;
    currency: string;
    eventTime: string;
    hoursUntil: number;
    impact: 'HIGH';
  } | null;
  lastUpdated: string;
}
