/**
 * Module C — Smart Money Concepts (SMC) & ICT Analysis Engine
 * Extensible, deterministic rules-based detectors for:
 *  - Non-repainting Swing Highs/Lows (HH, HL, LH, LL, EH, EL)
 *  - Break of Structure (BOS), Change of Character (CHoCH), Market Structure Shift (MSS)
 *  - Buy-Side & Sell-Side Liquidity Pools (Equal Highs/Lows, PDH/PDL, PWH/PWL, Session Highs/Lows) & Sweeps
 *  - Fair Value Gaps (FVG), Consequent Encroachment (50%), and Inverse FVG (IFVG)
 *  - Order Blocks (OB), Mean Threshold (50%), Breaker Blocks, and Mitigation Blocks
 *  - Dealing Ranges (Premium, Equilibrium, Discount) & Optimal Trade Entry (OTE 61.8% - 78.6%, 70.5%)
 *  - ICT Session Ranges, Killzones, Midnight Open, and Judas Swing Candidates
 *
 * Strictly avoids look-ahead bias: a swing point at index `i` is only confirmed at `i + swingRightBars`.
 */

import {
  OHLCVCandle,
  SupportedTimeframe,
  SMCRuleConfiguration,
  SwingPoint,
  StructureBreakEvent,
  LiquidityPool,
  FairValueGap,
  OrderBlockZone,
  DealingRangeZone,
  ICTSessionContext,
  SMCAnalysisResult
} from '../models/intelligence.types';
import { getInstrumentSpec, roundPrice, priceDiffInPips } from './marketData.service';
import { TechnicalAnalysisService } from './technicalAnalysis.service';

export const DEFAULT_SMC_RULE_CONFIG: SMCRuleConfiguration = {
  ruleVersion: 'SMC-ICT-ENGINE-v1.0.0',
  swingLeftBars: 2,
  swingRightBars: 2,
  bosRequiresBodyClose: true,
  equalHighLowTolerancePips: 3.0,
  equalHighLowMinTouches: 2,
  fvgMinSizePips: 1.5,
  displacementMinAtrMultiplier: 1.1,
  displacementMinBodyToRangeRatio: 0.6,
  oteFibLower: 0.618,
  oteFibUpper: 0.786,
  oteFibSweetSpot: 0.705,
  killzones: {
    asianRange: { startUtc: '00:00', endUtc: '05:00' },
    londonOpen: { startUtc: '07:00', endUtc: '10:00' },
    newYorkOpen: { startUtc: '12:00', endUtc: '15:00' },
    londonClose: { startUtc: '15:00', endUtc: '17:00' }
  }
};

export class SMCEngineService {
  /**
   * 1. Detects non-repainting Swing Highs and Swing Lows.
   * A Swing High at index `i` is confirmed only when `i + swingRightBars < candles.length`
   * and all `swingLeftBars` to the left have strictly lower or equal highs and all `swingRightBars`
   * to the right have strictly lower highs.
   */
  public static detectSwingPoints(
    candles: OHLCVCandle[],
    symbol: string,
    config: SMCRuleConfiguration = DEFAULT_SMC_RULE_CONFIG
  ): SwingPoint[] {
    const left = Math.max(1, config.swingLeftBars);
    const right = Math.max(1, config.swingRightBars);
    if (candles.length < left + right + 1) {
      return [];
    }

    const spec = getInstrumentSpec(symbol);
    const eqTol = config.equalHighLowTolerancePips * spec.pipSize;
    const swings: SwingPoint[] = [];

    let lastSwingHigh: number | null = null;
    let lastSwingLow: number | null = null;

    for (let i = left; i < candles.length - right; i++) {
      const candidate = candles[i];
      let isSwingHigh = true;
      let isSwingLow = true;

      for (let l = 1; l <= left; l++) {
        if (candles[i - l].high > candidate.high) {
          isSwingHigh = false;
        }
        if (candles[i - l].low < candidate.low) {
          isSwingLow = false;
        }
      }

      for (let r = 1; r <= right; r++) {
        if (candles[i + r].high >= candidate.high) {
          isSwingHigh = false;
        }
        if (candles[i + r].low <= candidate.low) {
          isSwingLow = false;
        }
      }

      const confirmedAtTimestamp = candles[i + right].timestamp;

      if (isSwingHigh) {
        let structureLabel: SwingPoint['structureLabel'] = 'INITIAL';
        if (lastSwingHigh !== null) {
          if (Math.abs(candidate.high - lastSwingHigh) <= eqTol) {
            structureLabel = 'EH';
          } else if (candidate.high > lastSwingHigh) {
            structureLabel = 'HH';
          } else {
            structureLabel = 'LH';
          }
        }
        lastSwingHigh = candidate.high;
        swings.push({
          index: i,
          timestamp: candidate.timestamp,
          price: roundPrice(symbol, candidate.high),
          type: 'SWING_HIGH',
          structureLabel,
          isConfirmed: true,
          confirmedAtTimestamp
        });
      }

      if (isSwingLow) {
        let structureLabel: SwingPoint['structureLabel'] = 'INITIAL';
        if (lastSwingLow !== null) {
          if (Math.abs(candidate.low - lastSwingLow) <= eqTol) {
            structureLabel = 'EL';
          } else if (candidate.low > lastSwingLow) {
            structureLabel = 'HL';
          } else {
            structureLabel = 'LL';
          }
        }
        lastSwingLow = candidate.low;
        swings.push({
          index: i,
          timestamp: candidate.timestamp,
          price: roundPrice(symbol, candidate.low),
          type: 'SWING_LOW',
          structureLabel,
          isConfirmed: true,
          confirmedAtTimestamp
        });
      }
    }

    return swings;
  }

  /**
   * Checks whether a candle qualifies as a Displacement Candle.
   */
  public static isDisplacementCandle(
    candle: OHLCVCandle,
    atrValue: number,
    config: SMCRuleConfiguration = DEFAULT_SMC_RULE_CONFIG
  ): boolean {
    const range = candle.high - candle.low;
    if (range <= 0) return false;
    const body = Math.abs(candle.close - candle.open);
    const bodyRatio = body / range;
    return (
      body >= atrValue * config.displacementMinAtrMultiplier &&
      bodyRatio >= config.displacementMinBodyToRangeRatio
    );
  }

  /**
   * 2. Detects Break of Structure (BOS), Change of Character (CHoCH), and Market Structure Shift (MSS).
   * Only evaluates breaks against swings that were ALREADY confirmed prior to the breaking candle!
   */
  public static detectStructureBreaks(
    candles: OHLCVCandle[],
    swings: SwingPoint[],
    symbol: string,
    atrValue: number,
    config: SMCRuleConfiguration = DEFAULT_SMC_RULE_CONFIG
  ): { breaks: StructureBreakEvent[]; currentTrend: 'BULLISH' | 'BEARISH' | 'RANGING' } {
    if (candles.length < 5 || swings.length < 2) {
      return { breaks: [], currentTrend: 'RANGING' };
    }

    const breaks: StructureBreakEvent[] = [];
    let currentTrend: 'BULLISH' | 'BEARISH' | 'RANGING' = 'RANGING';

    let activeSwingHigh: SwingPoint | null = null;
    let activeSwingLow: SwingPoint | null = null;
    const brokenSwingIndices = new Set<number>();

    for (let i = 0; i < candles.length; i++) {
      const candle = candles[i];

      // Activate swings whose confirmation bar (`index + swingRightBars`) has been reached at or before `i - 1`
      for (const s of swings) {
        if (s.index + config.swingRightBars === i - 1) {
          if (s.type === 'SWING_HIGH') {
            activeSwingHigh = s;
          } else {
            activeSwingLow = s;
          }
        }
      }

      const hasDisp = this.isDisplacementCandle(candle, atrValue, config);

      // Evaluate upside break of activeSwingHigh
      if (activeSwingHigh && !brokenSwingIndices.has(activeSwingHigh.index)) {
        const testPrice = config.bosRequiresBodyClose ? candle.close : candle.high;
        if (testPrice > activeSwingHigh.price) {
          brokenSwingIndices.add(activeSwingHigh.index);
          let breakType: StructureBreakEvent['type'] = 'BOS';
          if (currentTrend === 'BEARISH') {
            breakType = hasDisp ? 'MSS' : 'CHOCH';
          }
          currentTrend = 'BULLISH';

          breaks.push({
            id: `struct-${breakType}-BULL-${candle.timestamp}`,
            type: breakType,
            direction: 'BULLISH',
            brokenSwingPrice: activeSwingHigh.price,
            brokenSwingTimestamp: activeSwingHigh.timestamp,
            breakCandleTimestamp: candle.timestamp,
            breakClosePrice: roundPrice(symbol, candle.close),
            hasDisplacement: hasDisp,
            isConfirmedClose: candle.close > activeSwingHigh.price,
            ruleDefinition: `${breakType} (BULLISH): Candle ${
              config.bosRequiresBodyClose ? 'body close' : 'high'
            } (${roundPrice(symbol, testPrice)}) broke confirmed Swing High (${activeSwingHigh.price} from ${
              activeSwingHigh.timestamp
            }). Displacement=${hasDisp}.`,
            invalidationLevel: activeSwingLow ? activeSwingLow.price : roundPrice(symbol, candle.low)
          });
        }
      }

      // Evaluate downside break of activeSwingLow
      if (activeSwingLow && !brokenSwingIndices.has(activeSwingLow.index)) {
        const testPrice = config.bosRequiresBodyClose ? candle.close : candle.low;
        if (testPrice < activeSwingLow.price) {
          brokenSwingIndices.add(activeSwingLow.index);
          let breakType: StructureBreakEvent['type'] = 'BOS';
          if (currentTrend === 'BULLISH') {
            breakType = hasDisp ? 'MSS' : 'CHOCH';
          }
          currentTrend = 'BEARISH';

          breaks.push({
            id: `struct-${breakType}-BEAR-${candle.timestamp}`,
            type: breakType,
            direction: 'BEARISH',
            brokenSwingPrice: activeSwingLow.price,
            brokenSwingTimestamp: activeSwingLow.timestamp,
            breakCandleTimestamp: candle.timestamp,
            breakClosePrice: roundPrice(symbol, candle.close),
            hasDisplacement: hasDisp,
            isConfirmedClose: candle.close < activeSwingLow.price,
            ruleDefinition: `${breakType} (BEARISH): Candle ${
              config.bosRequiresBodyClose ? 'body close' : 'low'
            } (${roundPrice(symbol, testPrice)}) broke confirmed Swing Low (${activeSwingLow.price} from ${
              activeSwingLow.timestamp
            }). Displacement=${hasDisp}.`,
            invalidationLevel: activeSwingHigh ? activeSwingHigh.price : roundPrice(symbol, candle.high)
          });
        }
      }
    }

    return { breaks, currentTrend };
  }

  /**
   * 3. Detects Fair Value Gaps (FVG), Consequent Encroachment (50% midpoint), and Inverse FVGs (IFVG).
   */
  public static detectFairValueGaps(
    candles: OHLCVCandle[],
    symbol: string,
    config: SMCRuleConfiguration = DEFAULT_SMC_RULE_CONFIG
  ): FairValueGap[] {
    if (candles.length < 3) {
      return [];
    }

    const spec = getInstrumentSpec(symbol);
    const fvgs: FairValueGap[] = [];
    const startIdx = Math.max(2, candles.length - 120);

    for (let i = startIdx; i < candles.length; i++) {
      const c1 = candles[i - 2];
      const c2 = candles[i - 1];
      const c3 = candles[i];

      // Bullish FVG: c1.high < c3.low
      if (c3.low > c1.high) {
        const gapSize = c3.low - c1.high;
        const sizePips = priceDiffInPips(symbol, gapSize);
        if (sizePips >= config.fvgMinSizePips) {
          const upperPrice = roundPrice(symbol, c3.low);
          const lowerPrice = roundPrice(symbol, c1.high);
          const ce = roundPrice(symbol, lowerPrice + gapSize * 0.5);

          let mitigationStatus: FairValueGap['mitigationStatus'] = 'UNMITIGATED';
          let mitigatedAtTimestamp: string | undefined;
          let type: FairValueGap['type'] = 'BULLISH_FVG';

          for (let j = i + 1; j < candles.length; j++) {
            const sub = candles[j];
            if (sub.close < lowerPrice) {
              mitigationStatus = 'INVERTED';
              type = 'BEARISH_IFVG';
              mitigatedAtTimestamp = sub.timestamp;
              break;
            } else if (sub.low <= lowerPrice) {
              mitigationStatus = 'FULLY_MITIGATED';
              mitigatedAtTimestamp = sub.timestamp;
              break;
            } else if (sub.low <= ce) {
              mitigationStatus = 'CONSEQUENT_ENCROACHMENT_TESTED';
              if (!mitigatedAtTimestamp) mitigatedAtTimestamp = sub.timestamp;
            } else if (sub.low < upperPrice && mitigationStatus === 'UNMITIGATED') {
              mitigationStatus = 'PARTIALLY_MITIGATED';
              mitigatedAtTimestamp = sub.timestamp;
            }
          }

          fvgs.push({
            id: `fvg-bull-${c2.timestamp}`,
            type,
            candle1Timestamp: c1.timestamp,
            candle2Timestamp: c2.timestamp,
            candle3Timestamp: c3.timestamp,
            upperPrice,
            lowerPrice,
            consequentEncroachment: ce,
            sizePips,
            mitigationStatus,
            mitigatedAtTimestamp,
            invalidationPrice: type === 'BEARISH_IFVG' ? upperPrice : lowerPrice
          });
        }
      }

      // Bearish FVG: c1.low > c3.high
      if (c1.low > c3.high) {
        const gapSize = c1.low - c3.high;
        const sizePips = priceDiffInPips(symbol, gapSize);
        if (sizePips >= config.fvgMinSizePips) {
          const upperPrice = roundPrice(symbol, c1.low);
          const lowerPrice = roundPrice(symbol, c3.high);
          const ce = roundPrice(symbol, lowerPrice + gapSize * 0.5);

          let mitigationStatus: FairValueGap['mitigationStatus'] = 'UNMITIGATED';
          let mitigatedAtTimestamp: string | undefined;
          let type: FairValueGap['type'] = 'BEARISH_FVG';

          for (let j = i + 1; j < candles.length; j++) {
            const sub = candles[j];
            if (sub.close > upperPrice) {
              mitigationStatus = 'INVERTED';
              type = 'BULLISH_IFVG';
              mitigatedAtTimestamp = sub.timestamp;
              break;
            } else if (sub.high >= upperPrice) {
              mitigationStatus = 'FULLY_MITIGATED';
              mitigatedAtTimestamp = sub.timestamp;
              break;
            } else if (sub.high >= ce) {
              mitigationStatus = 'CONSEQUENT_ENCROACHMENT_TESTED';
              if (!mitigatedAtTimestamp) mitigatedAtTimestamp = sub.timestamp;
            } else if (sub.high > lowerPrice && mitigationStatus === 'UNMITIGATED') {
              mitigationStatus = 'PARTIALLY_MITIGATED';
              mitigatedAtTimestamp = sub.timestamp;
            }
          }

          fvgs.push({
            id: `fvg-bear-${c2.timestamp}`,
            type,
            candle1Timestamp: c1.timestamp,
            candle2Timestamp: c2.timestamp,
            candle3Timestamp: c3.timestamp,
            upperPrice,
            lowerPrice,
            consequentEncroachment: ce,
            sizePips,
            mitigationStatus,
            mitigatedAtTimestamp,
            invalidationPrice: type === 'BULLISH_IFVG' ? lowerPrice : upperPrice
          });
        }
      }
    }

    return fvgs.slice(-15);
  }

  /**
   * 4. Detects Order Blocks (Bullish/Bearish OB) and Breaker Blocks.
   * An Order Block requires an opposing candle followed by a displacement impulse or structure break.
   */
  public static detectOrderBlocks(
    candles: OHLCVCandle[],
    structureBreaks: StructureBreakEvent[],
    symbol: string,
    atrValue: number,
    config: SMCRuleConfiguration = DEFAULT_SMC_RULE_CONFIG
  ): OrderBlockZone[] {
    if (candles.length < 5) {
      return [];
    }

    const orderBlocks: OrderBlockZone[] = [];
    const startIdx = Math.max(1, candles.length - 100);

    for (let i = startIdx; i < candles.length - 1; i++) {
      const dispCandle = candles[i];
      const isDisp = this.isDisplacementCandle(dispCandle, atrValue, config);
      if (!isDisp) continue;

      const isBullishImpulse = dispCandle.close > dispCandle.open;

      // Find the last opposing candle within 3 bars prior to the displacement candle
      let obIdx = -1;
      for (let k = i - 1; k >= Math.max(0, i - 3); k--) {
        if (isBullishImpulse && candles[k].close < candles[k].open) {
          obIdx = k;
          break;
        }
        if (!isBullishImpulse && candles[k].close > candles[k].open) {
          obIdx = k;
          break;
        }
      }

      if (obIdx === -1) continue;

      const obCandle = candles[obIdx];
      const upperPrice = roundPrice(symbol, obCandle.high);
      const lowerPrice = roundPrice(symbol, obCandle.low);
      const meanThreshold = roundPrice(symbol, (upperPrice + lowerPrice) / 2);

      // Associate with nearby structure break if any
      const associatedBreak = structureBreaks.find(
        (b) =>
          b.direction === (isBullishImpulse ? 'BULLISH' : 'BEARISH') &&
          Math.abs(
            new Date(b.breakCandleTimestamp).getTime() - new Date(dispCandle.timestamp).getTime()
          ) <= 4 * 3600 * 1000
      );

      let type: OrderBlockZone['type'] = isBullishImpulse ? 'BULLISH_OB' : 'BEARISH_OB';
      let status: OrderBlockZone['status'] = 'ACTIVE_UNMITIGATED';
      let testedAtTimestamp: string | undefined;

      // Track subsequent mitigation or conversion to Breaker Block
      for (let j = i + 1; j < candles.length; j++) {
        const sub = candles[j];
        if (isBullishImpulse) {
          if (sub.close < lowerPrice) {
            type = 'BEARISH_BREAKER';
            status = 'CONVERTED_TO_BREAKER';
            testedAtTimestamp = sub.timestamp;
            break;
          } else if (sub.low <= upperPrice && status === 'ACTIVE_UNMITIGATED') {
            status = 'MITIGATED_RESPECTED';
            testedAtTimestamp = sub.timestamp;
          }
        } else {
          if (sub.close > upperPrice) {
            type = 'BULLISH_BREAKER';
            status = 'CONVERTED_TO_BREAKER';
            testedAtTimestamp = sub.timestamp;
            break;
          } else if (sub.high >= lowerPrice && status === 'ACTIVE_UNMITIGATED') {
            status = 'MITIGATED_RESPECTED';
            testedAtTimestamp = sub.timestamp;
          }
        }
      }

      orderBlocks.push({
        id: `ob-${type}-${obCandle.timestamp}`,
        type,
        candleTimestamp: obCandle.timestamp,
        upperPrice,
        lowerPrice,
        meanThreshold,
        displacementConfirmed: true,
        associatedStructureBreakId: associatedBreak?.id,
        status,
        testedAtTimestamp,
        invalidationPrice:
          type === 'BULLISH_OB' || type === 'BULLISH_BREAKER' ? lowerPrice : upperPrice,
        ruleDefinition: `${type}: Last opposing candle (${obCandle.timestamp}) preceding displacement impulse (${dispCandle.timestamp}, body >= ${config.displacementMinAtrMultiplier}x ATR). Mean Threshold=50% (${meanThreshold}).`
      });
    }

    return orderBlocks.slice(-12);
  }

  /**
   * 5. Detects Liquidity Pools (Equal Highs, Equal Lows, Previous Day/Week Highs/Lows) and Sweep Reactions.
   */
  public static detectLiquidityPools(
    candles: OHLCVCandle[],
    swings: SwingPoint[],
    symbol: string,
    dealingRange: DealingRangeZone | null,
    config: SMCRuleConfiguration = DEFAULT_SMC_RULE_CONFIG
  ): LiquidityPool[] {
    const spec = getInstrumentSpec(symbol);
    const tol = config.equalHighLowTolerancePips * spec.pipSize;
    const pools: LiquidityPool[] = [];

    const classifyLiquidityRange = (price: number): LiquidityPool['classification'] => {
      if (!dealingRange) return 'EXTERNAL_RANGE_LIQUIDITY';
      if (price > dealingRange.swingLowPrice && price < dealingRange.swingHighPrice) {
        return 'INTERNAL_RANGE_LIQUIDITY';
      }
      return 'EXTERNAL_RANGE_LIQUIDITY';
    };

    // Group Swing Highs into Equal Highs (BSL)
    const swingHighs = swings.filter((s) => s.type === 'SWING_HIGH');
    const usedHighIndices = new Set<number>();

    for (let i = 0; i < swingHighs.length; i++) {
      if (usedHighIndices.has(i)) continue;
      const base = swingHighs[i];
      const group: SwingPoint[] = [base];

      for (let j = i + 1; j < swingHighs.length; j++) {
        if (usedHighIndices.has(j)) continue;
        if (Math.abs(swingHighs[j].price - base.price) <= tol) {
          group.push(swingHighs[j]);
          usedHighIndices.add(j);
        }
      }

      if (group.length >= config.equalHighLowMinTouches) {
        const avgPrice = group.reduce((a, b) => a + b.price, 0) / group.length;
        const lastTouchIdx = group[group.length - 1].index;

        let swept = false;
        let sweptAtTimestamp: string | undefined;
        let sweptExtremePrice: number | undefined;
        let subsequentReaction: LiquidityPool['subsequentReaction'] = 'PENDING';

        for (let k = lastTouchIdx + 1; k < candles.length; k++) {
          if (candles[k].high > avgPrice + spec.pipSize * 0.5) {
            swept = true;
            sweptAtTimestamp = candles[k].timestamp;
            sweptExtremePrice = roundPrice(symbol, candles[k].high);
            subsequentReaction =
              candles[k].close < avgPrice ? 'REJECTION_REVERSAL' : 'CONTINUATION_ACCEPTANCE';
            break;
          }
        }

        pools.push({
          id: `liq-eqh-${base.timestamp}`,
          type: 'BUY_SIDE_LIQUIDITY',
          sourceType: 'EQUAL_HIGHS',
          priceLevel: roundPrice(symbol, avgPrice),
          zoneMin: roundPrice(symbol, avgPrice - tol * 0.5),
          zoneMax: roundPrice(symbol, avgPrice + tol * 0.5),
          touchesCount: group.length,
          touchTimestamps: group.map((g) => g.timestamp),
          swept,
          sweptAtTimestamp,
          sweptExtremePrice,
          subsequentReaction,
          classification: classifyLiquidityRange(avgPrice)
        });
      }
    }

    // Group Swing Lows into Equal Lows (SSL)
    const swingLows = swings.filter((s) => s.type === 'SWING_LOW');
    const usedLowIndices = new Set<number>();

    for (let i = 0; i < swingLows.length; i++) {
      if (usedLowIndices.has(i)) continue;
      const base = swingLows[i];
      const group: SwingPoint[] = [base];

      for (let j = i + 1; j < swingLows.length; j++) {
        if (usedLowIndices.has(j)) continue;
        if (Math.abs(swingLows[j].price - base.price) <= tol) {
          group.push(swingLows[j]);
          usedLowIndices.add(j);
        }
      }

      if (group.length >= config.equalHighLowMinTouches) {
        const avgPrice = group.reduce((a, b) => a + b.price, 0) / group.length;
        const lastTouchIdx = group[group.length - 1].index;

        let swept = false;
        let sweptAtTimestamp: string | undefined;
        let sweptExtremePrice: number | undefined;
        let subsequentReaction: LiquidityPool['subsequentReaction'] = 'PENDING';

        for (let k = lastTouchIdx + 1; k < candles.length; k++) {
          if (candles[k].low < avgPrice - spec.pipSize * 0.5) {
            swept = true;
            sweptAtTimestamp = candles[k].timestamp;
            sweptExtremePrice = roundPrice(symbol, candles[k].low);
            subsequentReaction =
              candles[k].close > avgPrice ? 'REJECTION_REVERSAL' : 'CONTINUATION_ACCEPTANCE';
            break;
          }
        }

        pools.push({
          id: `liq-eql-${base.timestamp}`,
          type: 'SELL_SIDE_LIQUIDITY',
          sourceType: 'EQUAL_LOWS',
          priceLevel: roundPrice(symbol, avgPrice),
          zoneMin: roundPrice(symbol, avgPrice - tol * 0.5),
          zoneMax: roundPrice(symbol, avgPrice + tol * 0.5),
          touchesCount: group.length,
          touchTimestamps: group.map((g) => g.timestamp),
          swept,
          sweptAtTimestamp,
          sweptExtremePrice,
          subsequentReaction,
          classification: classifyLiquidityRange(avgPrice)
        });
      }
    }

    // Add recent unmitigated Swing High/Low external pools if not already in Equal Highs/Lows
    const recentHighSwing = swingHighs[swingHighs.length - 1];
    if (recentHighSwing) {
      pools.push({
        id: `liq-bsl-swing-${recentHighSwing.timestamp}`,
        type: 'BUY_SIDE_LIQUIDITY',
        sourceType: 'SWING_POOL',
        priceLevel: recentHighSwing.price,
        zoneMin: roundPrice(symbol, recentHighSwing.price - spec.pipSize),
        zoneMax: roundPrice(symbol, recentHighSwing.price + spec.pipSize),
        touchesCount: 1,
        touchTimestamps: [recentHighSwing.timestamp],
        swept: candles
          .slice(recentHighSwing.index + 1)
          .some((c) => c.high > recentHighSwing.price),
        classification: 'EXTERNAL_RANGE_LIQUIDITY'
      });
    }

    const recentLowSwing = swingLows[swingLows.length - 1];
    if (recentLowSwing) {
      pools.push({
        id: `liq-ssl-swing-${recentLowSwing.timestamp}`,
        type: 'SELL_SIDE_LIQUIDITY',
        sourceType: 'SWING_POOL',
        priceLevel: recentLowSwing.price,
        zoneMin: roundPrice(symbol, recentLowSwing.price - spec.pipSize),
        zoneMax: roundPrice(symbol, recentLowSwing.price + spec.pipSize),
        touchesCount: 1,
        touchTimestamps: [recentLowSwing.timestamp],
        swept: candles
          .slice(recentLowSwing.index + 1)
          .some((c) => c.low < recentLowSwing.price),
        classification: 'EXTERNAL_RANGE_LIQUIDITY'
      });
    }

    return pools.slice(-12);
  }

  /**
   * 6. Computes Dealing Range (Premium, Equilibrium, Discount) and Optimal Trade Entry (OTE) Fibonacci Zone.
   */
  public static computeDealingRange(
    candles: OHLCVCandle[],
    swings: SwingPoint[],
    symbol: string,
    trendDirection: 'BULLISH' | 'BEARISH' | 'RANGING',
    config: SMCRuleConfiguration = DEFAULT_SMC_RULE_CONFIG
  ): DealingRangeZone | null {
    if (candles.length < 5) {
      return null;
    }

    const currentPrice = candles[candles.length - 1].close;
    const recentSwings = swings.slice(-10);
    const swingHighs = recentSwings.filter((s) => s.type === 'SWING_HIGH');
    const swingLows = recentSwings.filter((s) => s.type === 'SWING_LOW');

    let highPrice: number;
    let highTime: string;
    let lowPrice: number;
    let lowTime: string;

    if (swingHighs.length > 0 && swingLows.length > 0) {
      const topSwing = swingHighs.reduce((prev, curr) => (curr.price > prev.price ? curr : prev));
      const botSwing = swingLows.reduce((prev, curr) => (curr.price < prev.price ? curr : prev));
      highPrice = topSwing.price;
      highTime = topSwing.timestamp;
      lowPrice = botSwing.price;
      lowTime = botSwing.timestamp;
    } else {
      const lookback = candles.slice(-Math.min(candles.length, 50));
      let maxC = lookback[0];
      let minC = lookback[0];
      for (const c of lookback) {
        if (c.high > maxC.high) maxC = c;
        if (c.low < minC.low) minC = c;
      }
      highPrice = roundPrice(symbol, maxC.high);
      highTime = maxC.timestamp;
      lowPrice = roundPrice(symbol, minC.low);
      lowTime = minC.timestamp;
    }

    const range = highPrice - lowPrice;
    if (range <= 0) {
      return null;
    }

    const equilibriumPrice = roundPrice(symbol, lowPrice + range * 0.5);
    const rawPct = ((currentPrice - lowPrice) / range) * 100;
    const currentRangePercent = Number(Math.max(0, Math.min(100, rawPct)).toFixed(1));

    let currentPricePosition: DealingRangeZone['currentPricePosition'] = 'EQUILIBRIUM';
    if (rawPct > 53) {
      currentPricePosition = 'PREMIUM';
    } else if (rawPct < 47) {
      currentPricePosition = 'DISCOUNT';
    }

    const isBullishRange =
      trendDirection === 'BULLISH' ||
      (trendDirection === 'RANGING' && new Date(lowTime).getTime() <= new Date(highTime).getTime());

    // In a bullish dealing range, OTE retracement is measured downward from Swing High into Discount (61.8% - 78.6% retracement)
    // In a bearish dealing range, OTE retracement is measured upward from Swing Low into Premium (61.8% - 78.6% retracement)
    const fib618 = roundPrice(
      symbol,
      isBullishRange
        ? highPrice - range * config.oteFibLower
        : lowPrice + range * config.oteFibLower
    );
    const fib705 = roundPrice(
      symbol,
      isBullishRange
        ? highPrice - range * config.oteFibSweetSpot
        : lowPrice + range * config.oteFibSweetSpot
    );
    const fib786 = roundPrice(
      symbol,
      isBullishRange
        ? highPrice - range * config.oteFibUpper
        : lowPrice + range * config.oteFibUpper
    );

    const zoneMin = Math.min(fib618, fib786);
    const zoneMax = Math.max(fib618, fib786);
    const isPriceInOte = currentPrice >= zoneMin && currentPrice <= zoneMax;

    return {
      swingLowPrice: lowPrice,
      swingLowTimestamp: lowTime,
      swingHighPrice: highPrice,
      swingHighTimestamp: highTime,
      direction: isBullishRange ? 'BULLISH_DEALING_RANGE' : 'BEARISH_DEALING_RANGE',
      equilibriumPrice,
      currentPricePosition,
      currentRangePercent,
      oteZone: {
        fib618,
        fib705,
        fib786,
        zoneMin,
        zoneMax,
        isPriceInOte
      }
    };
  }

  /**
   * 7. Computes ICT Execution Context: Killzones, Asian/London/NY Session Ranges, Midnight Open, PDH/PDL, and Judas Swing Candidate.
   */
  public static computeICTSessionContext(
    candles: OHLCVCandle[],
    symbol: string
  ): ICTSessionContext {
    if (candles.length === 0) {
      return {
        currentTimestamp: new Date().toISOString(),
        activeSession: 'Off-Hours',
        activeKillzone: 'NONE',
        asianSessionRange: null,
        londonSessionRange: null,
        newYorkSessionRange: null,
        previousDay: null,
        previousWeek: null,
        midnightOpenUtc: null,
        judasSwingCandidate: {
          detected: false,
          interpretationNote: 'No candle data available for ICT session context.'
        }
      };
    }

    const latest = candles[candles.length - 1];
    const latestDt = new Date(latest.timestamp);
    const hour = latestDt.getUTCHours();

    let activeSession: ICTSessionContext['activeSession'] = 'Off-Hours';
    if (hour >= 13 && hour < 17) activeSession = 'London/NY Overlap';
    else if (hour >= 7 && hour < 16) activeSession = 'London';
    else if (hour >= 13 && hour < 22) activeSession = 'New York';
    else if (hour >= 0 && hour < 9) activeSession = 'Asia';

    let activeKillzone: ICTSessionContext['activeKillzone'] = 'NONE';
    if (hour >= 0 && hour < 5) activeKillzone = 'ASIAN_RANGE_KILLZONE';
    else if (hour >= 7 && hour < 10) activeKillzone = 'LONDON_OPEN_KILLZONE';
    else if (hour >= 12 && hour < 15) activeKillzone = 'NEW_YORK_OPEN_KILLZONE';
    else if (hour >= 15 && hour < 17) activeKillzone = 'LONDON_CLOSE_KILLZONE';

    // Partition candles by UTC date
    const currentDayKey = latest.timestamp.slice(0, 10);
    const todayCandles = candles.filter((c) => c.timestamp.slice(0, 10) === currentDayKey);

    // Group previous days
    const dayMap = new Map<string, OHLCVCandle[]>();
    for (const c of candles) {
      const dayKey = c.timestamp.slice(0, 10);
      if (!dayMap.has(dayKey)) dayMap.set(dayKey, []);
      dayMap.get(dayKey)!.push(c);
    }
    const sortedDays = Array.from(dayMap.keys()).sort();
    const prevDayKey =
      sortedDays.length >= 2 ? sortedDays[sortedDays.length - 2] : null;

    let previousDay: ICTSessionContext['previousDay'] = null;
    if (prevDayKey && dayMap.get(prevDayKey)!.length > 0) {
      const pdCandles = dayMap.get(prevDayKey)!;
      const pdHigh = Math.max(...pdCandles.map((c) => c.high));
      const pdLow = Math.min(...pdCandles.map((c) => c.low));
      previousDay = {
        high: roundPrice(symbol, pdHigh),
        low: roundPrice(symbol, pdLow),
        open: roundPrice(symbol, pdCandles[0].open),
        close: roundPrice(symbol, pdCandles[pdCandles.length - 1].close)
      };
    }

    // Previous Week High/Low from candles older than current day
    const olderCandles = candles.filter((c) => c.timestamp.slice(0, 10) < currentDayKey);
    const previousWeek =
      olderCandles.length > 0
        ? {
            high: roundPrice(symbol, Math.max(...olderCandles.map((c) => c.high))),
            low: roundPrice(symbol, Math.min(...olderCandles.map((c) => c.low)))
          }
        : null;

    // Today's session ranges
    const asiaCandles = todayCandles.filter((c) => {
      const h = new Date(c.timestamp).getUTCHours();
      return h >= 0 && h < 6;
    });
    const londonCandles = todayCandles.filter((c) => {
      const h = new Date(c.timestamp).getUTCHours();
      return h >= 7 && h < 13;
    });
    const nyCandles = todayCandles.filter((c) => {
      const h = new Date(c.timestamp).getUTCHours();
      return h >= 13 && h < 21;
    });

    const postAsiaCandles = todayCandles.filter((c) => new Date(c.timestamp).getUTCHours() >= 6);

    let asianSessionRange: ICTSessionContext['asianSessionRange'] = null;
    if (asiaCandles.length > 0) {
      const aHigh = Math.max(...asiaCandles.map((c) => c.high));
      const aLow = Math.min(...asiaCandles.map((c) => c.low));
      const sweptHigh = postAsiaCandles.some((c) => c.high > aHigh);
      const sweptLow = postAsiaCandles.some((c) => c.low < aLow);
      asianSessionRange = {
        high: roundPrice(symbol, aHigh),
        low: roundPrice(symbol, aLow),
        rangePips: priceDiffInPips(symbol, aHigh - aLow),
        sweptHigh,
        sweptLow
      };
    }

    const londonSessionRange =
      londonCandles.length > 0
        ? {
            high: roundPrice(symbol, Math.max(...londonCandles.map((c) => c.high))),
            low: roundPrice(symbol, Math.min(...londonCandles.map((c) => c.low))),
            rangePips: priceDiffInPips(
              symbol,
              Math.max(...londonCandles.map((c) => c.high)) -
                Math.min(...londonCandles.map((c) => c.low))
            )
          }
        : null;

    const newYorkSessionRange =
      nyCandles.length > 0
        ? {
            high: roundPrice(symbol, Math.max(...nyCandles.map((c) => c.high))),
            low: roundPrice(symbol, Math.min(...nyCandles.map((c) => c.low))),
            rangePips: priceDiffInPips(
              symbol,
              Math.max(...nyCandles.map((c) => c.high)) -
                Math.min(...nyCandles.map((c) => c.low))
            )
          }
        : null;

    const midnightOpenUtc =
      todayCandles.length > 0 ? roundPrice(symbol, todayCandles[0].open) : null;

    // Judas Swing Candidate (Strategy Interpretation: false excursion beyond Asian range during London/NY open followed by reversal back across Midnight Open)
    let judasSwingCandidate: ICTSessionContext['judasSwingCandidate'] = {
      detected: false,
      interpretationNote:
        'No Judas Swing candidate detected in current session. (Note: Judas Swing is an ICT strategy interpretation of an opening session liquidity sweep, not an objective fact.)'
    };

    if (asianSessionRange && midnightOpenUtc !== null) {
      if (asianSessionRange.sweptHigh && latest.close < asianSessionRange.high && latest.close < midnightOpenUtc) {
        judasSwingCandidate = {
          detected: true,
          direction: 'BULLISH_TRAP_ABOVE_OPEN',
          sweptReference: `Asian High (${asianSessionRange.high})`,
          interpretationNote:
            'Strategy Interpretation: Price swept Asian Session High and subsequently rejected below the 00:00 UTC opening price (Bearish Judas Swing candidate).'
        };
      } else if (asianSessionRange.sweptLow && latest.close > asianSessionRange.low && latest.close > midnightOpenUtc) {
        judasSwingCandidate = {
          detected: true,
          direction: 'BEARISH_TRAP_BELOW_OPEN',
          sweptReference: `Asian Low (${asianSessionRange.low})`,
          interpretationNote:
            'Strategy Interpretation: Price swept Asian Session Low and subsequently reclaimed the 00:00 UTC opening price (Bullish Judas Swing candidate).'
        };
      }
    }

    return {
      currentTimestamp: latest.timestamp,
      activeSession,
      activeKillzone,
      asianSessionRange,
      londonSessionRange,
      newYorkSessionRange,
      previousDay,
      previousWeek,
      midnightOpenUtc,
      judasSwingCandidate
    };
  }

  /**
   * Runs the complete SMC & ICT Analysis Engine on an OHLCV candle series.
   */
  public static analyzeSMC(
    symbol: string,
    timeframe: SupportedTimeframe,
    candles: OHLCVCandle[],
    customConfig?: Partial<SMCRuleConfiguration>
  ): SMCAnalysisResult {
    const config: SMCRuleConfiguration = {
      ...DEFAULT_SMC_RULE_CONFIG,
      ...customConfig
    };

    const spec = getInstrumentSpec(symbol);
    const atrVal =
      TechnicalAnalysisService.calculateATR(candles, 14) || spec.pipSize * 15;

    const swingPoints = this.detectSwingPoints(candles, symbol, config);
    const { breaks: structureBreaks, currentTrend: trendStructure } =
      this.detectStructureBreaks(candles, swingPoints, symbol, atrVal, config);

    const dealingRange = this.computeDealingRange(
      candles,
      swingPoints,
      symbol,
      trendStructure,
      config
    );

    const liquidityPools = this.detectLiquidityPools(
      candles,
      swingPoints,
      symbol,
      dealingRange,
      config
    );

    const fairValueGaps = this.detectFairValueGaps(candles, symbol, config);
    const orderBlocks = this.detectOrderBlocks(
      candles,
      structureBreaks,
      symbol,
      atrVal,
      config
    );
    const ictContext = this.computeICTSessionContext(candles, symbol);

    const latestBreak =
      structureBreaks.length > 0 ? structureBreaks[structureBreaks.length - 1] : null;
    const structureStateNote = latestBreak
      ? `Trend is ${trendStructure} following ${latestBreak.type} (${latestBreak.direction}) at ${latestBreak.brokenSwingPrice} on ${latestBreak.breakCandleTimestamp}.`
      : `Structure is ${trendStructure} (${swingPoints.length} confirmed swings analyzed).`;

    return {
      symbol,
      timeframe,
      ruleVersion: config.ruleVersion,
      trendStructure,
      structureStateNote,
      swingPoints: swingPoints.slice(-24),
      structureBreaks: structureBreaks.slice(-12),
      liquidityPools,
      fairValueGaps,
      orderBlocks,
      dealingRange,
      ictContext,
      provenance: {
        category: candles.length > 0 ? 'STRATEGY_INTERPRETATION' : 'UNAVAILABLE_DATA',
        sourceProvider:
          candles.length > 0
            ? candles[candles.length - 1].sourceProvider
            : 'UNAVAILABLE',
        retrievedAt: new Date().toISOString(),
        eventTime:
          candles.length > 0 ? candles[candles.length - 1].timestamp : undefined,
        timezone: 'UTC',
        freshnessStatus: candles.length > 0 ? 'FRESH' : 'UNAVAILABLE',
        ruleVersion: config.ruleVersion,
        notes: `Non-repainting SMC/ICT rules engine (${config.swingLeftBars}L/${config.swingRightBars}R swing confirmation).`
      }
    };
  }
}
