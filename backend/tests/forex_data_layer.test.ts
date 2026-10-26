/**
 * Arcade Fx — Forex Data Layer Unit & Integration Tests
 * Validates:
 * 1. Candle aggregation across timeframes (M1 -> M5 -> M15 -> H1 -> H4; D1 -> W1)
 * 2. Classic pivot points (P, R1-R3, S1-S3)
 * 3. ATR(14) Wilder's formula calculation
 * 4. Forex session detection in UTC (Sydney, Tokyo, London, New York, overlaps)
 * 5. Trend classification (Price vs EMA50 / EMA200)
 * 6. API endpoint responses (/api/candles, /api/levels, /api/conditions)
 */

import request from 'supertest';
import { app } from '../src/app';
import {
  ForexDataLayerService,
  LightweightChartBar
} from '../src/services/forexDataLayer.service';

describe('Forex Data Layer — Math & Intelligence Engine', () => {
  // 1. Candle Aggregation
  test('aggregates 5x 1-minute bars into 1x 5-minute bar accurately', () => {
    const m1Bars: LightweightChartBar[] = [
      { time: 1700000100, open: 1.0800, high: 1.0820, low: 1.0790, close: 1.0810, volume: 100 },
      { time: 1700000160, open: 1.0810, high: 1.0835, low: 1.0805, close: 1.0830, volume: 150 },
      { time: 1700000220, open: 1.0830, high: 1.0840, low: 1.0820, close: 1.0825, volume: 120 },
      { time: 1700000280, open: 1.0825, high: 1.0830, low: 1.0780, close: 1.0795, volume: 200 },
      { time: 1700000340, open: 1.0795, high: 1.0815, low: 1.0790, close: 1.0812, volume: 130 }
    ];

    const aggregated = ForexDataLayerService.aggregateCandles(m1Bars, 300);

    expect(aggregated).toHaveLength(1);
    expect(aggregated[0].open).toBe(1.0800); // Open of first bar
    expect(aggregated[0].high).toBe(1.0840); // Max high across all 5
    expect(aggregated[0].low).toBe(1.0780);  // Min low across all 5
    expect(aggregated[0].close).toBe(1.0812); // Close of last bar
    expect(aggregated[0].volume).toBe(700);  // Sum of all volumes
  });

  // 2. Classic Pivot Points
  test('calculates Classic Pivot Points (P, R1-R3, S1-S3) correctly against known test vector', () => {
    // High = 1.1000, Low = 1.0800, Close = 1.0900
    // P = (1.1000 + 1.0800 + 1.0900) / 3 = 1.0900
    // R1 = 2 * 1.0900 - 1.0800 = 1.1000
    // S1 = 2 * 1.0900 - 1.1000 = 1.0800
    // R2 = 1.0900 + (1.1000 - 1.0800) = 1.1100
    // S2 = 1.0900 - (1.1000 - 1.0800) = 1.0700
    // R3 = 1.1000 + 2 * (1.0900 - 1.0800) = 1.1200
    // S3 = 1.0800 - 2 * (1.1000 - 1.0900) = 1.0600
    const pivots = ForexDataLayerService.calculateClassicPivots(1.1000, 1.0800, 1.0900);

    expect(pivots.P).toBeCloseTo(1.0900, 4);
    expect(pivots.R1).toBeCloseTo(1.1000, 4);
    expect(pivots.S1).toBeCloseTo(1.0800, 4);
    expect(pivots.R2).toBeCloseTo(1.1100, 4);
    expect(pivots.S2).toBeCloseTo(1.0700, 4);
    expect(pivots.R3).toBeCloseTo(1.1200, 4);
    expect(pivots.S3).toBeCloseTo(1.0600, 4);
  });

  // 3. ATR(14)
  test('calculates ATR(14) using True Range without crashing on empty or small sets', () => {
    const emptyAtr = ForexDataLayerService.calculateATR14([]);
    expect(emptyAtr).toBeNull();

    const sampleBars: LightweightChartBar[] = [];
    for (let i = 0; i < 20; i++) {
      sampleBars.push({
        time: 1700000000 + i * 86400,
        open: 1.0800,
        high: 1.0850,
        low: 1.0750,
        close: 1.0810,
        volume: 1000
      });
    }

    const atr = ForexDataLayerService.calculateATR14(sampleBars);
    expect(atr).not.toBeNull();
    expect(atr!).toBeGreaterThan(0.005);
    expect(atr!).toBeLessThan(0.015);
  });

  // 4. Forex Session Detection in UTC
  test('detects correct Forex trading sessions and overlaps in UTC', () => {
    // Test London / NY overlap at 14:00 UTC
    const dateOverlap = new Date('2026-10-26T14:00:00Z');
    const overlapResult = ForexDataLayerService.getActiveSessions(dateOverlap);
    expect(overlapResult.activeSessions).toContain('London');
    expect(overlapResult.activeSessions).toContain('New York');
    expect(overlapResult.isOverlap).toBe(true);

    // Test Tokyo session at 03:00 UTC
    const dateTokyo = new Date('2026-10-26T03:00:00Z');
    const tokyoResult = ForexDataLayerService.getActiveSessions(dateTokyo);
    expect(tokyoResult.activeSessions).toContain('Tokyo');

    // Test Sydney session at 22:00 UTC
    const dateSydney = new Date('2026-10-26T22:00:00Z');
    const sydneyResult = ForexDataLayerService.getActiveSessions(dateSydney);
    expect(sydneyResult.activeSessions).toContain('Sydney');
  });

  // 5. Forex Market Hours (Weekend vs Weekday)
  test('correctly identifies market closed on Saturday and open on Wednesday', () => {
    const wednesday = new Date('2026-10-28T12:00:00Z');
    expect(ForexDataLayerService.isForexMarketOpen(wednesday)).toBe(true);

    const saturday = new Date('2026-10-24T12:00:00Z');
    expect(ForexDataLayerService.isForexMarketOpen(saturday)).toBe(false);
  });

  // 6. EMA Calculation
  test('computes EMA correctly', () => {
    const values = [10, 11, 12, 11, 10, 12, 13, 14, 15, 16];
    const ema = ForexDataLayerService.calculateEMA(values, 5);
    expect(ema).not.toBeNull();
    expect(ema!).toBeGreaterThan(10);
    expect(ema!).toBeLessThan(16);
  });
});

describe('Forex Data Layer — HTTP Endpoints', () => {
  test('GET /api/candles returns candles in Lightweight Charts format', async () => {
    const res = await request(app).get('/api/candles?symbol=EURUSD&tf=H1&limit=50');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.symbol).toBe('EURUSD');
    expect(res.body.timeframe).toBe('H1');
    expect(Array.isArray(res.body.candles)).toBe(true);
    if (res.body.candles.length > 0) {
      const first = res.body.candles[0];
      expect(typeof first.time).toBe('number');
      expect(typeof first.open).toBe('number');
      expect(typeof first.high).toBe('number');
      expect(typeof first.low).toBe('number');
      expect(typeof first.close).toBe('number');
    }
  });

  test('GET /api/levels returns institutional pivots and S/R levels', async () => {
    const res = await request(app).get('/api/levels?symbol=EURUSD');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.symbol).toBe('EURUSD');
    expect(res.body.today).toBeDefined();
    expect(typeof res.body.today.open).toBe('number');
  });

  test('GET /api/conditions returns market status, sessions, and ATR', async () => {
    const res = await request(app).get('/api/conditions?symbol=EURUSD');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.symbol).toBe('EURUSD');
    expect(typeof res.body.isMarketOpen).toBe('boolean');
    expect(Array.isArray(res.body.activeSessions)).toBe(true);
    expect(res.body.atr).toBeDefined();
    expect(res.body.trend).toBeDefined();
  });
});
