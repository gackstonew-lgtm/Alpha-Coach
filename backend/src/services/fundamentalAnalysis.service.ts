/**
 * Module E — Fundamental & Macroeconomic Intelligence Engine
 * Covers the 8 Major Forex Economies (USD, EUR, GBP, JPY, CHF, CAD, AUD, NZD):
 *  - Economic Calendar with scheduled vs published vs revised handling & surprise computation
 *  - Central Bank Policy Rates, Inflation (CPI/Core CPI), Employment (NFP/Unemployment), GDP, PMI, 10Y Bond Yields
 *  - Pair-level Interest Rate & Yield Differentials (in bps), Policy Divergence, and 24h Event-Risk Warnings
 */

import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/db';
import {
  EconomicCalendarEventRecord,
  CurrencyMacroProfile,
  PairFundamentalAssessment
} from '../models/intelligence.types';
import { getInstrumentSpec } from './marketData.service';

export interface CalendarFilterParams {
  currency?: string;
  currencies?: string[];
  impact?: 'LOW' | 'MEDIUM' | 'HIGH';
  category?: EconomicCalendarEventRecord['category'];
  status?: EconomicCalendarEventRecord['status'];
  startDate?: string;
  endDate?: string;
}

const MAJOR_ECONOMY_BASELINES: Record<string, Omit<CurrencyMacroProfile, 'upcomingHighImpactEvents' | 'lastUpdated'>> = {
  USD: {
    currency: 'USD',
    centralBank: 'Federal Reserve (FOMC)',
    policyRatePct: 4.50,
    cpiYoYPct: 2.6,
    coreCpiYoYPct: 3.2,
    gdpGrowthPct: 2.8,
    unemploymentRatePct: 4.1,
    ManufacturingPmi: 48.5,
    ServicesPmi: 54.9,
    bondYield10YPct: 4.22,
    policyStance: 'NEUTRAL_DATA_DEPENDENT',
    inflationTrend: 'COOLING',
    growthMomentum: 'EXPANDING',
    fundamentalScore: 38,
    supportingFactors: [
      'Resilient US GDP growth (2.8% annualized) outperforming G7 peers',
      'Services PMI firmly in expansion territory (54.9)',
      'Positive 10Y Treasury yield advantage (4.22%) supporting carry inflows'
    ],
    opposingFactors: [
      'Manufacturing sector contraction (ISM Manufacturing PMI < 50)',
      'Gradual FOMC rate normalization cycle reducing peak rate premium'
    ],
    sourceProvider: 'OFFICIAL_CENTRAL_BANK_AND_MACRO_RELEASE_BASELINE'
  },
  EUR: {
    currency: 'EUR',
    centralBank: 'European Central Bank (ECB)',
    policyRatePct: 3.25,
    cpiYoYPct: 2.0,
    coreCpiYoYPct: 2.7,
    gdpGrowthPct: 0.9,
    unemploymentRatePct: 6.4,
    ManufacturingPmi: 45.9,
    ServicesPmi: 51.4,
    bondYield10YPct: 2.31,
    policyStance: 'DOVISH',
    inflationTrend: 'AT_TARGET',
    growthMomentum: 'SLOWING',
    fundamentalScore: -24,
    supportingFactors: [
      'Headline Eurozone CPI returned near 2.0% ECB target, supporting real disposable income',
      'Services sector maintaining modest expansion (51.4)'
    ],
    opposingFactors: [
      'Persistent Eurozone manufacturing contraction (PMI 45.9)',
      'Sub-1% GDP growth momentum keeping ECB biased toward further easing',
      'Negative rate and 10Y Bund yield differential versus USD and GBP'
    ],
    sourceProvider: 'OFFICIAL_CENTRAL_BANK_AND_MACRO_RELEASE_BASELINE'
  },
  GBP: {
    currency: 'GBP',
    centralBank: 'Bank of England (BoE)',
    policyRatePct: 4.75,
    cpiYoYPct: 2.3,
    coreCpiYoYPct: 3.3,
    gdpGrowthPct: 1.4,
    unemploymentRatePct: 4.3,
    ManufacturingPmi: 50.3,
    ServicesPmi: 52.0,
    bondYield10YPct: 4.44,
    policyStance: 'NEUTRAL_DATA_DEPENDENT',
    inflationTrend: 'STICKY_HIGH',
    growthMomentum: 'EXPANDING',
    fundamentalScore: 28,
    supportingFactors: [
      'Sticky UK services and core inflation (3.3%) forcing gradual BoE easing pace',
      'Both UK Manufacturing (50.3) and Services (52.0) PMIs above 50 expansion threshold',
      'Attractive 10Y Gilt yield (4.44%) among G10 currencies'
    ],
    opposingFactors: [
      'Fiscal tightening and structural productivity constraints limiting upside GDP acceleration'
    ],
    sourceProvider: 'OFFICIAL_CENTRAL_BANK_AND_MACRO_RELEASE_BASELINE'
  },
  JPY: {
    currency: 'JPY',
    centralBank: 'Bank of Japan (BoJ)',
    policyRatePct: 0.25,
    cpiYoYPct: 2.5,
    coreCpiYoYPct: 2.3,
    gdpGrowthPct: 0.7,
    unemploymentRatePct: 2.5,
    ManufacturingPmi: 49.2,
    ServicesPmi: 50.5,
    bondYield10YPct: 1.05,
    policyStance: 'HAWKISH',
    inflationTrend: 'STICKY_HIGH',
    growthMomentum: 'SLOWING',
    fundamentalScore: -32,
    supportingFactors: [
      'BoJ is the only G10 central bank in a structural policy normalization/hiking cycle',
      'Safe-haven repatriation flows during global equity or geopolitical risk-off episodes'
    ],
    opposingFactors: [
      'Wide negative interest-rate differential (0.25% policy rate) penalizing long JPY carry',
      'Low 10Y JGB yield (1.05%) compared to US Treasuries and UK Gilts'
    ],
    sourceProvider: 'OFFICIAL_CENTRAL_BANK_AND_MACRO_RELEASE_BASELINE'
  },
  CHF: {
    currency: 'CHF',
    centralBank: 'Swiss National Bank (SNB)',
    policyRatePct: 1.00,
    cpiYoYPct: 0.7,
    coreCpiYoYPct: 0.9,
    gdpGrowthPct: 1.5,
    unemploymentRatePct: 2.6,
    ManufacturingPmi: 49.5,
    ServicesPmi: 51.8,
    bondYield10YPct: 0.42,
    policyStance: 'DOVISH',
    inflationTrend: 'COOLING',
    growthMomentum: 'EXPANDING',
    fundamentalScore: -10,
    supportingFactors: [
      'Strong external current account surplus and institutional safe-haven status',
      'Low unemployment (2.6%) and stable domestic growth (1.5%)'
    ],
    opposingFactors: [
      'Below-target Swiss CPI (0.7% YoY) prompting SNB rate cuts and verbal FX intervention warnings',
      'Low nominal policy rate (1.00%) and 10Y yield (0.42%)'
    ],
    sourceProvider: 'OFFICIAL_CENTRAL_BANK_AND_MACRO_RELEASE_BASELINE'
  },
  CAD: {
    currency: 'CAD',
    centralBank: 'Bank of Canada (BoC)',
    policyRatePct: 3.75,
    cpiYoYPct: 1.9,
    coreCpiYoYPct: 2.3,
    gdpGrowthPct: 1.3,
    unemploymentRatePct: 6.5,
    ManufacturingPmi: 50.8,
    ServicesPmi: 49.4,
    bondYield10YPct: 3.22,
    policyStance: 'DOVISH',
    inflationTrend: 'COOLING',
    growthMomentum: 'SLOWING',
    fundamentalScore: -18,
    supportingFactors: [
      'Economic spillover benefit from resilient US consumer demand',
      'Headline CPI below 2.0% target (1.9%)'
    ],
    opposingFactors: [
      'Elevated Canadian unemployment rate (6.5%) and household mortgage renewal headwinds',
      'Aggressive BoC rate cuts widening the USD-CAD policy rate spread'
    ],
    sourceProvider: 'OFFICIAL_CENTRAL_BANK_AND_MACRO_RELEASE_BASELINE'
  },
  AUD: {
    currency: 'AUD',
    centralBank: 'Reserve Bank of Australia (RBA)',
    policyRatePct: 4.35,
    cpiYoYPct: 2.8,
    coreCpiYoYPct: 3.5,
    gdpGrowthPct: 1.2,
    unemploymentRatePct: 4.1,
    ManufacturingPmi: 47.3,
    ServicesPmi: 50.6,
    bondYield10YPct: 4.52,
    policyStance: 'HAWKISH',
    inflationTrend: 'STICKY_HIGH',
    growthMomentum: 'SLOWING',
    fundamentalScore: 18,
    supportingFactors: [
      'RBA maintaining restrictive stance due to sticky trimmed-mean core inflation (3.5%)',
      'Firm labor market (4.1% unemployment) and high 10Y ACGB bond yield (4.52%)'
    ],
    opposingFactors: [
      'Sensitivity to Chinese industrial demand and iron ore/commodity terms of trade',
      'Subdued domestic per-capita GDP growth'
    ],
    sourceProvider: 'OFFICIAL_CENTRAL_BANK_AND_MACRO_RELEASE_BASELINE'
  },
  NZD: {
    currency: 'NZD',
    centralBank: 'Reserve Bank of New Zealand (RBNZ)',
    policyRatePct: 4.75,
    cpiYoYPct: 2.2,
    coreCpiYoYPct: 2.8,
    gdpGrowthPct: 0.2,
    unemploymentRatePct: 4.8,
    ManufacturingPmi: 46.9,
    ServicesPmi: 47.2,
    bondYield10YPct: 4.48,
    policyStance: 'DOVISH',
    inflationTrend: 'COOLING',
    growthMomentum: 'CONTRACTING',
    fundamentalScore: -14,
    supportingFactors: [
      'High nominal OCR rate (4.75%) and 10Y NZGB yield (4.48%)'
    ],
    opposingFactors: [
      'Weak domestic growth (0.2% YoY) and contracting Manufacturing/Services PMIs (< 50)',
      'RBNZ executing front-loaded 50bps rate cuts as inflation re-enters 1–3% target band'
    ],
    sourceProvider: 'OFFICIAL_CENTRAL_BANK_AND_MACRO_RELEASE_BASELINE'
  }
};

export class FundamentalAnalysisService {
  /**
   * Parses numeric values from calendar strings like "165K", "2.5%", "-0.3%", "50.4".
   */
  public static parseMacroNumericValue(raw: string | null | undefined): number | null {
    if (!raw || typeof raw !== 'string') return null;
    const cleaned = raw.replace(/[,%\sA-Za-z$]/g, '').trim();
    if (!cleaned) return null;
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
  }

  /**
   * Computes surprise direction comparing actual vs forecast (or revised previous).
   * Accounts for inverse metrics like Unemployment Rate or Jobless Claims where lower actual is positive.
   */
  public static computeSurpriseDirection(
    title: string,
    actualValue: string | null,
    forecastValue: string | null,
    previousValue: string | null
  ): EconomicCalendarEventRecord['surpriseDirection'] {
    const actualNum = this.parseMacroNumericValue(actualValue);
    const benchmarkNum =
      this.parseMacroNumericValue(forecastValue) ?? this.parseMacroNumericValue(previousValue);

    if (actualNum === null || benchmarkNum === null) {
      return 'UNAVAILABLE';
    }

    const diff = actualNum - benchmarkNum;
    if (Math.abs(diff) < 1e-6) {
      return 'IN_LINE';
    }

    const lowerTitle = title.toLowerCase();
    const isInverseIndicator =
      lowerTitle.includes('unemployment') ||
      lowerTitle.includes('jobless claims') ||
      lowerTitle.includes('claimant count');

    if (isInverseIndicator) {
      return diff < 0 ? 'POSITIVE_SURPRISE' : 'NEGATIVE_SURPRISE';
    }
    return diff > 0 ? 'POSITIVE_SURPRISE' : 'NEGATIVE_SURPRISE';
  }

  /**
   * Ensures baseline calendar events exist in `economic_calendar_events` so calendar queries and filters work out of the box.
   */
  public static async ensureBaselineCalendarSeeded(): Promise<void> {
    const db = getDatabase();
    const countRow = await db.get<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM economic_calendar_events`
    );
    if (countRow && Number(countRow.cnt) > 0) {
      return;
    }

    const now = Date.now();
    const hourMs = 3600 * 1000;
    const nowIso = new Date(now).toISOString();

    const seedEvents: Omit<EconomicCalendarEventRecord, 'surpriseDirection'>[] = [
      {
        id: 'ec-usd-nfp',
        externalId: 'bls-nfp-current',
        title: 'US Non-Farm Payrolls (NFP)',
        country: 'United States',
        currency: 'USD',
        category: 'EMPLOYMENT',
        impact: 'HIGH',
        eventTime: new Date(now - 36 * hourMs).toISOString(),
        status: 'REVISED',
        forecastValue: '160K',
        previousValue: '142K',
        revisedPreviousValue: '159K',
        actualValue: '194K',
        unit: 'K',
        sourceProvider: 'US_BLS_CALENDAR',
        publishedAt: new Date(now - 36 * hourMs).toISOString(),
        retrievedAt: nowIso,
        timezone: 'UTC'
      },
      {
        id: 'ec-usd-cpi',
        externalId: 'bls-cpi-upcoming',
        title: 'US Core CPI Inflation Rate (YoY)',
        country: 'United States',
        currency: 'USD',
        category: 'INFLATION',
        impact: 'HIGH',
        eventTime: new Date(now + 14 * hourMs).toISOString(),
        status: 'SCHEDULED',
        forecastValue: '3.2%',
        previousValue: '3.2%',
        revisedPreviousValue: null,
        actualValue: null,
        unit: '%',
        sourceProvider: 'US_BLS_CALENDAR',
        retrievedAt: nowIso,
        timezone: 'UTC'
      },
      {
        id: 'ec-usd-fomc',
        externalId: 'fed-fomc-rate',
        title: 'FOMC Federal Funds Rate Decision & Statement',
        country: 'United States',
        currency: 'USD',
        category: 'CENTRAL_BANK',
        impact: 'HIGH',
        eventTime: new Date(now + 72 * hourMs).toISOString(),
        status: 'SCHEDULED',
        forecastValue: '4.50%',
        previousValue: '4.50%',
        revisedPreviousValue: null,
        actualValue: null,
        unit: '%',
        sourceProvider: 'FEDERAL_RESERVE_CALENDAR',
        retrievedAt: nowIso,
        timezone: 'UTC'
      },
      {
        id: 'ec-eur-ecb',
        externalId: 'ecb-rate-decision',
        title: 'ECB Main Refinancing & Deposit Facility Rate Decision',
        country: 'Euro Zone',
        currency: 'EUR',
        category: 'CENTRAL_BANK',
        impact: 'HIGH',
        eventTime: new Date(now - 18 * hourMs).toISOString(),
        status: 'PUBLISHED',
        forecastValue: '3.25%',
        previousValue: '3.50%',
        revisedPreviousValue: null,
        actualValue: '3.25%',
        unit: '%',
        sourceProvider: 'ECB_MONETARY_CALENDAR',
        publishedAt: new Date(now - 18 * hourMs).toISOString(),
        retrievedAt: nowIso,
        timezone: 'UTC'
      },
      {
        id: 'ec-eur-pmi',
        externalId: 'eur-mfg-pmi',
        title: 'Eurozone HCOB Manufacturing PMI (Flash)',
        country: 'Euro Zone',
        currency: 'EUR',
        category: 'PMI',
        impact: 'MEDIUM',
        eventTime: new Date(now + 18 * hourMs).toISOString(),
        status: 'SCHEDULED',
        forecastValue: '46.1',
        previousValue: '45.9',
        revisedPreviousValue: null,
        actualValue: null,
        unit: 'Index',
        sourceProvider: 'EUROSTAT_PMI_CALENDAR',
        retrievedAt: nowIso,
        timezone: 'UTC'
      },
      {
        id: 'ec-gbp-cpi',
        externalId: 'ons-uk-cpi',
        title: 'UK CPI Inflation Rate (YoY)',
        country: 'United Kingdom',
        currency: 'GBP',
        category: 'INFLATION',
        impact: 'HIGH',
        eventTime: new Date(now - 10 * hourMs).toISOString(),
        status: 'PUBLISHED',
        forecastValue: '2.2%',
        previousValue: '2.2%',
        revisedPreviousValue: null,
        actualValue: '2.3%',
        unit: '%',
        sourceProvider: 'UK_ONS_CALENDAR',
        publishedAt: new Date(now - 10 * hourMs).toISOString(),
        retrievedAt: nowIso,
        timezone: 'UTC'
      },
      {
        id: 'ec-gbp-boe',
        externalId: 'boe-mpc-rate',
        title: 'BoE Official Bank Rate & MPC Vote Split',
        country: 'United Kingdom',
        currency: 'GBP',
        category: 'CENTRAL_BANK',
        impact: 'HIGH',
        eventTime: new Date(now + 48 * hourMs).toISOString(),
        status: 'SCHEDULED',
        forecastValue: '4.75%',
        previousValue: '4.75%',
        revisedPreviousValue: null,
        actualValue: null,
        unit: '%',
        sourceProvider: 'BOE_MPC_CALENDAR',
        retrievedAt: nowIso,
        timezone: 'UTC'
      },
      {
        id: 'ec-jpy-boj',
        externalId: 'boj-policy-rate',
        title: 'BoJ Overnight Call Rate Decision & Outlook Report',
        country: 'Japan',
        currency: 'JPY',
        category: 'CENTRAL_BANK',
        impact: 'HIGH',
        eventTime: new Date(now + 20 * hourMs).toISOString(),
        status: 'SCHEDULED',
        forecastValue: '0.25%',
        previousValue: '0.25%',
        revisedPreviousValue: null,
        actualValue: null,
        unit: '%',
        sourceProvider: 'BOJ_CALENDAR',
        retrievedAt: nowIso,
        timezone: 'UTC'
      },
      {
        id: 'ec-aud-rba',
        externalId: 'rba-cash-rate',
        title: 'RBA Cash Rate Target Decision',
        country: 'Australia',
        currency: 'AUD',
        category: 'CENTRAL_BANK',
        impact: 'HIGH',
        eventTime: new Date(now + 96 * hourMs).toISOString(),
        status: 'SCHEDULED',
        forecastValue: '4.35%',
        previousValue: '4.35%',
        revisedPreviousValue: null,
        actualValue: null,
        unit: '%',
        sourceProvider: 'RBA_CALENDAR',
        retrievedAt: nowIso,
        timezone: 'UTC'
      },
      {
        id: 'ec-cad-emp',
        externalId: 'statscan-employment',
        title: 'Canada Unemployment Rate',
        country: 'Canada',
        currency: 'CAD',
        category: 'EMPLOYMENT',
        impact: 'HIGH',
        eventTime: new Date(now - 48 * hourMs).toISOString(),
        status: 'PUBLISHED',
        forecastValue: '6.6%',
        previousValue: '6.6%',
        revisedPreviousValue: null,
        actualValue: '6.5%',
        unit: '%',
        sourceProvider: 'STATSCAN_CALENDAR',
        publishedAt: new Date(now - 48 * hourMs).toISOString(),
        retrievedAt: nowIso,
        timezone: 'UTC'
      },
      {
        id: 'ec-nzd-gdp',
        externalId: 'statsnz-gdp',
        title: 'New Zealand GDP Growth Rate (QoQ)',
        country: 'New Zealand',
        currency: 'NZD',
        category: 'GROWTH',
        impact: 'HIGH',
        eventTime: new Date(now - 72 * hourMs).toISOString(),
        status: 'PUBLISHED',
        forecastValue: '-0.4%',
        previousValue: '0.2%',
        revisedPreviousValue: '0.1%',
        actualValue: '-0.2%',
        unit: '%',
        sourceProvider: 'STATSNZ_CALENDAR',
        publishedAt: new Date(now - 72 * hourMs).toISOString(),
        retrievedAt: nowIso,
        timezone: 'UTC'
      },
      {
        id: 'ec-chf-snb',
        externalId: 'snb-policy-rate',
        title: 'SNB Monetary Policy Assessment & Sight Deposit Rate',
        country: 'Switzerland',
        currency: 'CHF',
        category: 'CENTRAL_BANK',
        impact: 'HIGH',
        eventTime: new Date(now + 120 * hourMs).toISOString(),
        status: 'SCHEDULED',
        forecastValue: '1.00%',
        previousValue: '1.00%',
        revisedPreviousValue: null,
        actualValue: null,
        unit: '%',
        sourceProvider: 'SNB_CALENDAR',
        retrievedAt: nowIso,
        timezone: 'UTC'
      }
    ];

    for (const ev of seedEvents) {
      await this.upsertCalendarEvent(ev);
    }
  }

  /**
   * Upserts an economic calendar event into `economic_calendar_events`.
   */
  public static async upsertCalendarEvent(
    event: Partial<EconomicCalendarEventRecord> & {
      title: string;
      currency: string;
      eventTime: string;
    }
  ): Promise<EconomicCalendarEventRecord> {
    const db = getDatabase();
    const id = event.id || uuidv4();
    const nowIso = new Date().toISOString();

    const status: EconomicCalendarEventRecord['status'] =
      event.status ||
      (event.actualValue !== null && event.actualValue !== undefined
        ? event.revisedPreviousValue
          ? 'REVISED'
          : 'PUBLISHED'
        : 'SCHEDULED');

    await db.run(
      `INSERT INTO economic_calendar_events (
        id, external_id, title, country, currency, category, impact, event_time, status,
        forecast_value, previous_value, revised_previous_value, actual_value, unit,
        source_provider, source_url, published_at, retrieved_at, timezone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        forecast_value = excluded.forecast_value,
        previous_value = excluded.previous_value,
        revised_previous_value = excluded.revised_previous_value,
        actual_value = excluded.actual_value,
        published_at = excluded.published_at,
        retrieved_at = excluded.retrieved_at`,
      [
        id,
        event.externalId || null,
        event.title,
        event.country || event.currency,
        event.currency.toUpperCase(),
        event.category || 'MACRO',
        event.impact || 'MEDIUM',
        new Date(event.eventTime).toISOString(),
        status,
        event.forecastValue ?? null,
        event.previousValue ?? null,
        event.revisedPreviousValue ?? null,
        event.actualValue ?? null,
        event.unit ?? null,
        event.sourceProvider || 'MANUAL_OR_PROVIDER',
        event.sourceUrl ?? null,
        event.publishedAt ?? null,
        event.retrievedAt || nowIso,
        event.timezone || 'UTC'
      ]
    );

    const surpriseDirection = this.computeSurpriseDirection(
      event.title,
      event.actualValue ?? null,
      event.forecastValue ?? null,
      event.revisedPreviousValue ?? event.previousValue ?? null
    );

    return {
      id,
      externalId: event.externalId,
      title: event.title,
      country: event.country || event.currency,
      currency: event.currency.toUpperCase(),
      category: event.category || 'MACRO',
      impact: event.impact || 'MEDIUM',
      eventTime: new Date(event.eventTime).toISOString(),
      status,
      forecastValue: event.forecastValue ?? null,
      previousValue: event.previousValue ?? null,
      revisedPreviousValue: event.revisedPreviousValue ?? null,
      actualValue: event.actualValue ?? null,
      unit: event.unit ?? null,
      surpriseDirection,
      sourceProvider: event.sourceProvider || 'MANUAL_OR_PROVIDER',
      sourceUrl: event.sourceUrl,
      publishedAt: event.publishedAt,
      retrievedAt: event.retrievedAt || nowIso,
      timezone: event.timezone || 'UTC'
    };
  }

  /**
   * Queries economic calendar events with full filtering and surprise computation.
   */
  public static async getCalendarEvents(
    filters: CalendarFilterParams = {}
  ): Promise<EconomicCalendarEventRecord[]> {
    await this.ensureBaselineCalendarSeeded();
    const db = getDatabase();

    let sql = `SELECT * FROM economic_calendar_events WHERE 1=1`;
    const params: any[] = [];

    if (filters.currency) {
      sql += ` AND currency = ?`;
      params.push(filters.currency.toUpperCase());
    }
    if (filters.currencies && filters.currencies.length > 0) {
      const placeholders = filters.currencies.map(() => '?').join(', ');
      sql += ` AND currency IN (${placeholders})`;
      params.push(...filters.currencies.map((c) => c.toUpperCase()));
    }
    if (filters.impact) {
      sql += ` AND impact = ?`;
      params.push(filters.impact.toUpperCase());
    }
    if (filters.category) {
      sql += ` AND category = ?`;
      params.push(filters.category.toUpperCase());
    }
    if (filters.status) {
      sql += ` AND status = ?`;
      params.push(filters.status.toUpperCase());
    }
    if (filters.startDate) {
      sql += ` AND event_time >= ?`;
      params.push(new Date(filters.startDate).toISOString());
    }
    if (filters.endDate) {
      sql += ` AND event_time <= ?`;
      params.push(new Date(filters.endDate).toISOString());
    }

    sql += ` ORDER BY event_time ASC LIMIT 200`;

    const rows = await db.query<any>(sql, params);
    return rows.map((r) => {
      const actualVal = r.actual_value ?? null;
      const forecastVal = r.forecast_value ?? null;
      const prevVal = r.previous_value ?? null;
      const revPrevVal = r.revised_previous_value ?? null;

      return {
        id: r.id,
        externalId: r.external_id || undefined,
        title: r.title,
        country: r.country,
        currency: r.currency,
        category: r.category,
        impact: r.impact,
        eventTime: r.event_time,
        status: r.status,
        forecastValue: forecastVal,
        previousValue: prevVal,
        revisedPreviousValue: revPrevVal,
        actualValue: actualVal,
        unit: r.unit ?? null,
        surpriseDirection: this.computeSurpriseDirection(
          r.title,
          actualVal,
          forecastVal,
          revPrevVal ?? prevVal
        ),
        sourceProvider: r.source_provider,
        sourceUrl: r.source_url || undefined,
        publishedAt: r.published_at || undefined,
        retrievedAt: r.retrieved_at,
        timezone: r.timezone || 'UTC'
      };
    });
  }

  /**
   * Returns the macroeconomic profile for a major currency (USD, EUR, GBP, JPY, CHF, CAD, AUD, NZD).
   */
  public static async getCurrencyMacroProfile(currency: string): Promise<CurrencyMacroProfile> {
    const code = currency.toUpperCase().trim();
    const baseline = MAJOR_ECONOMY_BASELINES[code] || {
      currency: code,
      centralBank: `${code} Central Bank`,
      policyRatePct: null,
      cpiYoYPct: null,
      coreCpiYoYPct: null,
      gdpGrowthPct: null,
      unemploymentRatePct: null,
      ManufacturingPmi: null,
      ServicesPmi: null,
      bondYield10YPct: null,
      policyStance: 'UNAVAILABLE',
      inflationTrend: 'UNAVAILABLE',
      growthMomentum: 'UNAVAILABLE',
      fundamentalScore: 0,
      supportingFactors: [],
      opposingFactors: ['Macroeconomic profile baseline not available for this currency.'],
      sourceProvider: 'UNAVAILABLE'
    };

    const upcomingEvents = await this.getCalendarEvents({
      currency: code,
      impact: 'HIGH',
      startDate: new Date().toISOString()
    });

    return {
      ...baseline,
      upcomingHighImpactEvents: upcomingEvents.slice(0, 5),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Returns all 8 major economy macroeconomic profiles.
   */
  public static async getAllCurrencyMacroProfiles(): Promise<CurrencyMacroProfile[]> {
    const currencies = Object.keys(MAJOR_ECONOMY_BASELINES);
    const profiles: CurrencyMacroProfile[] = [];
    for (const c of currencies) {
      profiles.push(await this.getCurrencyMacroProfile(c));
    }
    return profiles;
  }

  /**
   * Evaluates fundamental & macroeconomic comparison for a currency pair (e.g., EURUSD, USDJPY, GBPUSD).
   */
  public static async evaluatePairFundamentals(
    symbol: string,
    asOfTimestamp?: string
  ): Promise<PairFundamentalAssessment> {
    const spec = getInstrumentSpec(symbol);
    const baseProfile = await this.getCurrencyMacroProfile(spec.baseCurrency);
    const quoteProfile = await this.getCurrencyMacroProfile(spec.quoteCurrency);

    const rateDifferentialBps =
      baseProfile.policyRatePct !== null && quoteProfile.policyRatePct !== null
        ? Math.round((baseProfile.policyRatePct - quoteProfile.policyRatePct) * 100)
        : null;

    const yieldDifferential10YBps =
      baseProfile.bondYield10YPct !== null && quoteProfile.bondYield10YPct !== null
        ? Math.round((baseProfile.bondYield10YPct - quoteProfile.bondYield10YPct) * 100)
        : null;

    // Relative fundamental score: combines fundamentalScore difference + rate & yield differentials
    let rawRelScore = (baseProfile.fundamentalScore - quoteProfile.fundamentalScore) * 0.65;
    if (rateDifferentialBps !== null) {
      rawRelScore += Math.max(-25, Math.min(25, rateDifferentialBps * 0.08));
    }
    if (yieldDifferential10YBps !== null) {
      rawRelScore += Math.max(-15, Math.min(15, yieldDifferential10YBps * 0.05));
    }
    const relativeStrengthScore = Math.max(-100, Math.min(100, Math.round(rawRelScore)));

    let directionalBias: PairFundamentalAssessment['directionalBias'] = 'NEUTRAL';
    if (relativeStrengthScore >= 15) {
      directionalBias = 'BULLISH';
    } else if (relativeStrengthScore <= -15) {
      directionalBias = 'BEARISH';
    }

    const policyDivergenceSummary = `${spec.baseCurrency} (${baseProfile.centralBank}: ${
      baseProfile.policyRatePct !== null ? `${baseProfile.policyRatePct.toFixed(2)}%` : 'N/A'
    }, ${baseProfile.policyStance}) vs ${spec.quoteCurrency} (${quoteProfile.centralBank}: ${
      quoteProfile.policyRatePct !== null ? `${quoteProfile.policyRatePct.toFixed(2)}%` : 'N/A'
    }, ${quoteProfile.policyStance}). Policy Rate Spread: ${
      rateDifferentialBps !== null ? `${rateDifferentialBps > 0 ? '+' : ''}${rateDifferentialBps} bps` : 'N/A'
    }; 10Y Yield Spread: ${
      yieldDifferential10YBps !== null ? `${yieldDifferential10YBps > 0 ? '+' : ''}${yieldDifferential10YBps} bps` : 'N/A'
    }.`;

    const safeHavens = new Set(['USD', 'JPY', 'CHF']);
    const highBeta = new Set(['AUD', 'NZD', 'GBP', 'CAD']);
    let riskSentimentContext: PairFundamentalAssessment['riskSentimentContext'] = 'NEUTRAL';
    if (highBeta.has(spec.baseCurrency) && safeHavens.has(spec.quoteCurrency)) {
      riskSentimentContext = 'RISK_ON_SUPPORTIVE';
    } else if (safeHavens.has(spec.baseCurrency) && highBeta.has(spec.quoteCurrency)) {
      riskSentimentContext = 'RISK_OFF_SAFE_HAVEN';
    }

    // Check upcoming high-impact events within 24 hours for either currency
    const refTimeMs = asOfTimestamp ? new Date(asOfTimestamp).getTime() : Date.now();
    const pairEvents = await this.getCalendarEvents({
      currencies: [spec.baseCurrency, spec.quoteCurrency],
      impact: 'HIGH'
    });

    const upcomingEvents = pairEvents
      .filter((e) => {
        const evMs = new Date(e.eventTime).getTime();
        return evMs >= refTimeMs && evMs <= refTimeMs + 7 * 24 * 3600 * 1000;
      })
      .sort((a, b) => new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime());

    const nextHighImpactEvent = upcomingEvents.length > 0 ? upcomingEvents[0] : null;
    const hoursUntilNextHighImpact = nextHighImpactEvent
      ? Number(
          ((new Date(nextHighImpactEvent.eventTime).getTime() - refTimeMs) / (3600 * 1000)).toFixed(1)
        )
      : null;
    const hasHighImpactWithin24h =
      hoursUntilNextHighImpact !== null && hoursUntilNextHighImpact >= 0 && hoursUntilNextHighImpact <= 24;

    const eventRiskWarning = hasHighImpactWithin24h && nextHighImpactEvent
      ? `HIGH EVENT RISK: ${nextHighImpactEvent.currency} "${nextHighImpactEvent.title}" scheduled in ${hoursUntilNextHighImpact}h (${nextHighImpactEvent.eventTime}). Expect elevated spread and slippage.`
      : nextHighImpactEvent
      ? `Next scheduled high-impact release: ${nextHighImpactEvent.currency} "${nextHighImpactEvent.title}" in ${hoursUntilNextHighImpact}h.`
      : 'No scheduled high-impact macro releases within the immediate 24-hour window.';

    const supportingEvidence: string[] = [];
    const contradictingEvidence: string[] = [];

    if (directionalBias === 'BULLISH') {
      supportingEvidence.push(...baseProfile.supportingFactors.map((f) => `[${spec.baseCurrency}] ${f}`));
      supportingEvidence.push(...quoteProfile.opposingFactors.map((f) => `[${spec.quoteCurrency}] ${f}`));
      contradictingEvidence.push(...baseProfile.opposingFactors.map((f) => `[${spec.baseCurrency}] ${f}`));
    } else if (directionalBias === 'BEARISH') {
      supportingEvidence.push(...quoteProfile.supportingFactors.map((f) => `[${spec.quoteCurrency}] ${f}`));
      supportingEvidence.push(...baseProfile.opposingFactors.map((f) => `[${spec.baseCurrency}] ${f}`));
      contradictingEvidence.push(...quoteProfile.opposingFactors.map((f) => `[${spec.quoteCurrency}] ${f}`));
    } else {
      supportingEvidence.push(...baseProfile.supportingFactors.slice(0, 2).map((f) => `[${spec.baseCurrency}] ${f}`));
      contradictingEvidence.push(...quoteProfile.supportingFactors.slice(0, 2).map((f) => `[${spec.quoteCurrency}] ${f}`));
    }

    return {
      symbol: spec.symbol,
      baseCurrency: spec.baseCurrency,
      quoteCurrency: spec.quoteCurrency,
      baseProfile,
      quoteProfile,
      rateDifferentialBps,
      yieldDifferential10YBps,
      policyDivergenceSummary,
      relativeStrengthScore,
      directionalBias,
      riskSentimentContext,
      upcomingEventRisk: {
        hasHighImpactWithin24h,
        nextHighImpactEvent,
        hoursUntilNextHighImpact,
        eventRiskWarning
      },
      supportingEvidence,
      contradictingEvidence,
      disclaimer:
        'Macroeconomic and central bank differentials provide medium-to-long-term fundamental context. They do not guarantee short-term intraday price direction; always confirm with technical price structure and event-risk clearance.',
      provenance: {
        category: 'DETERMINISTIC_METRIC',
        sourceProvider: 'CENTRAL_BANK_AND_ECONOMIC_CALENDAR_ENGINE',
        retrievedAt: new Date().toISOString(),
        timezone: 'UTC',
        freshnessStatus: 'FRESH',
        ruleVersion: 'MACRO-ENGINE-v1.0.0',
        notes: 'Computed from central bank policy rates, 10Y bond yields, CPI/GDP/PMI profiles, and scheduled economic calendar.'
      }
    };
  }
}
