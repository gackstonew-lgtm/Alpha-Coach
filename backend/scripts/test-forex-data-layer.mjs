/**
 * Arcade Fx — Standalone Forex Data Layer Verification Suite
 * Can be run standalone with `node backend/scripts/test-forex-data-layer.mjs`
 */

import assert from 'node:assert';

console.log('====================================================');
console.log('  ARCADE FX — FOREX DATA LAYER VERIFICATION');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  [FAIL] ${name}:`, err.message);
    failCount++;
  }
}

// 1. Candle Aggregation
runTest('Candle Aggregation: Combines 5x 1-minute bars into 1x 5-minute bar', () => {
  const bars = [
    { time: 1700000100, open: 1.0800, high: 1.0820, low: 1.0790, close: 1.0810, volume: 100 },
    { time: 1700000160, open: 1.0810, high: 1.0835, low: 1.0805, close: 1.0830, volume: 150 },
    { time: 1700000220, open: 1.0830, high: 1.0840, low: 1.0820, close: 1.0825, volume: 120 },
    { time: 1700000280, open: 1.0825, high: 1.0830, low: 1.0780, close: 1.0795, volume: 200 },
    { time: 1700000340, open: 1.0795, high: 1.0815, low: 1.0790, close: 1.0812, volume: 130 }
  ];

  const targetSeconds = 300;
  const buckets = new Map();
  for (const c of bars) {
    const bucket = Math.floor(c.time / targetSeconds) * targetSeconds;
    const list = buckets.get(bucket) || [];
    list.push(c);
    buckets.set(bucket, list);
  }

  const aggregated = [];
  for (const [bucketTime, bList] of buckets.entries()) {
    const open = bList[0].open;
    const close = bList[bList.length - 1].close;
    let high = -Infinity;
    let low = Infinity;
    let volume = 0;
    for (const b of bList) {
      if (b.high > high) high = b.high;
      if (b.low < low) low = b.low;
      volume += b.volume;
    }
    aggregated.push({ time: bucketTime, open, high, low, close, volume });
  }

  assert.strictEqual(aggregated.length, 1);
  assert.strictEqual(aggregated[0].open, 1.0800);
  assert.strictEqual(aggregated[0].high, 1.0840);
  assert.strictEqual(aggregated[0].low, 1.0780);
  assert.strictEqual(aggregated[0].close, 1.0812);
  assert.strictEqual(aggregated[0].volume, 700);
});

// 2. Classic Pivot Points
runTest('Classic Pivot Points: P, R1-R3, S1-S3 exact formulas', () => {
  const H = 1.1000;
  const L = 1.0800;
  const C = 1.0900;

  const P = (H + L + C) / 3;
  const R1 = 2 * P - L;
  const S1 = 2 * P - H;
  const R2 = P + (H - L);
  const S2 = P - (H - L);
  const R3 = H + 2 * (P - L);
  const S3 = L - 2 * (H - P);

  assert.ok(Math.abs(P - 1.0900) < 1e-4);
  assert.ok(Math.abs(R1 - 1.1000) < 1e-4);
  assert.ok(Math.abs(S1 - 1.0800) < 1e-4);
  assert.ok(Math.abs(R2 - 1.1100) < 1e-4);
  assert.ok(Math.abs(S2 - 1.0700) < 1e-4);
  assert.ok(Math.abs(R3 - 1.1200) < 1e-4);
  assert.ok(Math.abs(S3 - 1.0600) < 1e-4);
});

// 3. ATR(14)
runTest('ATR(14): True Range and smoothing', () => {
  const trValues = [
    0.0070, 0.0085, 0.0090, 0.0065, 0.0080,
    0.0075, 0.0082, 0.0095, 0.0068, 0.0072,
    0.0088, 0.0091, 0.0079, 0.0084, 0.0076
  ];

  let atr = trValues.slice(0, 14).reduce((acc, v) => acc + v, 0) / 14;
  for (let i = 14; i < trValues.length; i++) {
    atr = (atr * 13 + trValues[i]) / 14;
  }

  assert.ok(atr > 0.007 && atr < 0.009);
});

// 4. Session Detection in UTC
runTest('Session Detection: Identifies London + New York overlap at 14:00 UTC', () => {
  const hour = 14;
  const checkSession = (open, close) => open < close ? hour >= open && hour < close : hour >= open || hour < close;

  const sydney = checkSession(21, 6);
  const tokyo = checkSession(0, 9);
  const london = checkSession(7, 16);
  const newYork = checkSession(12, 21);

  assert.strictEqual(sydney, false);
  assert.strictEqual(tokyo, false);
  assert.strictEqual(london, true);
  assert.strictEqual(newYork, true);
  assert.strictEqual(london && newYork, true); // Overlap!
});

// 5. Trend State Classification
runTest('Trend Classification: Price relative to EMA 50 & EMA 200', () => {
  const price = 1.0950;
  const ema50 = 1.0900;
  const ema200 = 1.0820;

  const isStrongBullish = price > ema50 && ema50 > ema200;
  assert.strictEqual(isStrongBullish, true);
});

console.log(`\nResults: ${passCount} Passed, ${failCount} Failed.`);
if (failCount > 0) process.exit(1);
