import { initDatabase } from '../src/db/db';
import { ForexNewsCalendarService } from '../src/services/providers/forexNewsCalendar.service';
import { FundamentalAnalysisService } from '../src/services/fundamentalAnalysis.service';

describe('Live Forex News & Economic Calendar System', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await initDatabase();
    await FundamentalAnalysisService.ensureBaselineCalendarSeeded();
  });

  describe('Forex News Normalization & Enrichment', () => {
    it('correctly extracts major currencies from headlines and text', () => {
      const text1 = 'Federal Reserve Chair Jerome Powell signals cautious path on US Interest Rates';
      const currencies1 = ForexNewsCalendarService.extractCurrencies(text1);
      expect(currencies1).toContain('USD');

      const text2 = 'ECB Lagarde warns Eurozone private sector momentum slowing as German Bund yields dip';
      const currencies2 = ForexNewsCalendarService.extractCurrencies(text2);
      expect(currencies2).toContain('EUR');

      const text3 = 'Bank of Japan Ueda speaks on Yen intervention and Spring Wage Negotiations';
      const currencies3 = ForexNewsCalendarService.extractCurrencies(text3);
      expect(currencies3).toContain('JPY');

      const text4 = 'Sterling rallies as Bank of England Bailey notes persistent UK wage growth';
      const currencies4 = ForexNewsCalendarService.extractCurrencies(text4);
      expect(currencies4).toContain('GBP');
    });

    it('correctly grades event and headline impact levels', () => {
      const highImpactHeadline = 'FOMC Rate Decision: Fed cuts target rate by 25 bps';
      expect(ForexNewsCalendarService.determineImpact(highImpactHeadline, '')).toBe('HIGH');

      const nfpHeadline = 'US Non-Farm Payrolls surge above consensus at 220K';
      expect(ForexNewsCalendarService.determineImpact(nfpHeadline, '')).toBe('HIGH');

      const mediumImpactHeadline = 'Eurozone Manufacturing PMI contracts to 45.8';
      expect(ForexNewsCalendarService.determineImpact(mediumImpactHeadline, '')).toBe('MEDIUM');

      const lowImpactHeadline = 'Weekly crude oil inventory numbers released';
      expect(ForexNewsCalendarService.determineImpact(lowImpactHeadline, '')).toBe('LOW');
    });

    it('categorizes news into structured thematic verticals', () => {
      expect(ForexNewsCalendarService.categorizeNews('Fed announces rate decision', '')).toBe('CENTRAL_BANK');
      expect(ForexNewsCalendarService.categorizeNews('US CPI inflation rises 0.3% MoM', '')).toBe('INFLATION');
      expect(ForexNewsCalendarService.categorizeNews('Unemployment rate ticks lower following NFP', '')).toBe('EMPLOYMENT');
      expect(ForexNewsCalendarService.categorizeNews('10-Year Treasury yield curve inversion widens', '')).toBe('YIELDS');
      expect(ForexNewsCalendarService.categorizeNews('New trade tariffs announced', '')).toBe('GEOPOLITICAL');
    });

    it('evaluates sentiment direction accurately', () => {
      expect(ForexNewsCalendarService.determineSentiment('Dollar surges as economic growth beats forecast')).toBe('BULLISH');
      expect(ForexNewsCalendarService.determineSentiment('Pound sinks as GDP misses estimates and recession fears mount')).toBe('BEARISH');
      expect(ForexNewsCalendarService.determineSentiment('Treasuries trade in tight sideways range ahead of data')).toBe('NEUTRAL');
    });

    it('retrieves live news items and allows currency filtering', async () => {
      const result = await ForexNewsCalendarService.getLiveForexNews({ limit: 15 });
      expect(result.news.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThanOrEqual(result.news.length);
      expect(result.lastUpdated).toBeDefined();

      const usdOnly = await ForexNewsCalendarService.getLiveForexNews({ currency: 'USD' });
      expect(usdOnly.news.every(n => n.currencies.includes('USD'))).toBe(true);
    });
  });

  describe('Live Economic Calendar & Countdown Logic', () => {
    it('retrieves calendar events with countdowns and status indicators', async () => {
      const calendar = await ForexNewsCalendarService.getLiveEconomicCalendar({});
      expect(calendar.events.length).toBeGreaterThan(0);
      expect(calendar.total).toBe(calendar.events.length);

      const firstEvent = calendar.events[0];
      expect(firstEvent.id).toBeDefined();
      expect(firstEvent.title).toBeDefined();
      expect(firstEvent.currency).toBeDefined();
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(firstEvent.impact);
      expect(firstEvent.countdownText).toBeDefined();
    });

    it('filters calendar by currency and impact level', async () => {
      const highImpactUsd = await ForexNewsCalendarService.getLiveEconomicCalendar({
        currency: 'USD',
        impact: 'HIGH'
      });

      expect(highImpactUsd.events.every(e => e.currency === 'USD' && e.impact === 'HIGH')).toBe(true);
    });

    it('determines next upcoming high-impact event when present', async () => {
      const calendar = await ForexNewsCalendarService.getLiveEconomicCalendar({});
      if (calendar.nextHighImpactEvent) {
        expect(calendar.nextHighImpactEvent.impact).toBe('HIGH');
        expect(calendar.nextHighImpactEvent.countdownText).toBeDefined();
      }
    });
  });

  describe('Macro Intelligence Summary', () => {
    it('compiles G8 central bank profiles and top currency pair differentials', async () => {
      const summary = await ForexNewsCalendarService.getMacroSummary();
      expect(summary.overview).toBeDefined();
      expect(summary.majorCurrencies.length).toBe(8);

      const usd = summary.majorCurrencies.find(c => c.currency === 'USD');
      expect(usd).toBeDefined();
      expect(usd?.centralBank).toContain('Federal Reserve');
      expect(usd?.policyRatePct).toBeGreaterThan(0);

      expect(summary.topPairs.length).toBeGreaterThan(0);
      const eurusd = summary.topPairs.find(p => p.pair === 'EURUSD');
      expect(eurusd).toBeDefined();
      expect(eurusd?.divergenceSummary).toBeDefined();
    });
  });
});
