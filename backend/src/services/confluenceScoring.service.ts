/**
 * Module H — Transparent Multi-Factor Confluence & Setup Scoring Engine
 * Evaluates 9 orthogonal technical, structural, CRT, SMC/ICT, session, macro, and risk factors.
 *
 * Key properties:
 *  - Component-level score breakdown, customizable weights, and explicit evidence attribution
 *  - Applies deduplication & contradiction penalties when signals conflict or data is missing
 *  - Explicitly labeled as a heuristic confluence score (0-100), never a calibrated win probability
 */

import {
  ConfluenceWeights,
  ConfluenceComponentScore,
  ConfluenceEvaluationResult,
  TechnicalAnalysisSummary,
  SMCAnalysisResult,
  CRTDetectionResult,
  PairFundamentalAssessment
} from '../models/intelligence.types';

export const DEFAULT_CONFLUENCE_WEIGHTS: ConfluenceWeights = {
  htfStructureAlignment: 20,
  ltfStructureShift: 15,
  liquiditySweepConfirmed: 15,
  fvgOrOrderBlockZone: 12,
  crtSetupConfirmed: 10,
  sessionKillzoneTiming: 8,
  fundamentalAlignment: 10,
  eventRiskClearance: 5,
  rewardToRiskFeasibility: 5
};

export interface ConfluenceInputBundle {
  symbol: string;
  evaluatedDirection: 'BULLISH' | 'BEARISH';
  htfTechnical: TechnicalAnalysisSummary;
  htfSmc: SMCAnalysisResult;
  ltfSmc: SMCAnalysisResult;
  crtResult: CRTDetectionResult;
  fundamentals: PairFundamentalAssessment;
  proposedRewardToRiskRatio?: number | null;
  customWeights?: Partial<ConfluenceWeights>;
}

export class ConfluenceScoringService {
  /**
   * Evaluates transparent multi-factor confluence for a proposed directional setup ('BULLISH' or 'BEARISH').
   */
  public static evaluateConfluence(input: ConfluenceInputBundle): ConfluenceEvaluationResult {
    const weights: ConfluenceWeights = {
      ...DEFAULT_CONFLUENCE_WEIGHTS,
      ...input.customWeights
    };

    const dir = input.evaluatedDirection;
    const isBull = dir === 'BULLISH';

    const components: ConfluenceComponentScore[] = [];
    const penaltiesApplied: Array<{ reason: string; pointsDeducted: number }> = [];
    const missingEvidenceWarnings: string[] = [];
    const contradictorySignals: string[] = [];

    // Helper to push a component
    const addComponent = (
      componentId: keyof ConfluenceWeights,
      label: string,
      rawScore: number, // -1 to +1
      evidence: string,
      provenanceCategory: ConfluenceComponentScore['provenanceCategory']
    ) => {
      const w = weights[componentId];
      // Normalize rawScore (-1..+1) into weighted points: +1 gives full weight, 0 gives 0, -1 subtracts 0.5*weight
      const contribution =
        rawScore >= 0 ? Number((rawScore * w).toFixed(2)) : Number((rawScore * w * 0.5).toFixed(2));
      const status: ConfluenceComponentScore['status'] =
        rawScore > 0.15
          ? 'SUPPORTING'
          : rawScore < -0.15
          ? 'CONTRADICTING'
          : 'NEUTRAL_OR_MISSING';

      if (status === 'CONTRADICTING') {
        contradictorySignals.push(`${label}: ${evidence}`);
      }

      components.push({
        componentId,
        label,
        weight: w,
        rawScore,
        weightedContribution: contribution,
        status,
        evidence,
        provenanceCategory
      });
    };

    // 1. HTF Structure Alignment
    if (input.htfTechnical.candleCount < 10) {
      missingEvidenceWarnings.push('Higher-timeframe candle history is insufficient (< 10 bars).');
      addComponent(
        'htfStructureAlignment',
        'HTF Market Structure & MA Alignment',
        0,
        'HTF history unavailable.',
        'UNAVAILABLE_DATA'
      );
    } else {
      const htfTrendMatch =
        (isBull && input.htfSmc.trendStructure === 'BULLISH') ||
        (!isBull && input.htfSmc.trendStructure === 'BEARISH');
      const htfTrendOppose =
        (isBull && input.htfSmc.trendStructure === 'BEARISH') ||
        (!isBull && input.htfSmc.trendStructure === 'BULLISH');
      const maStackMatch =
        (isBull && input.htfTechnical.movingAverages.maAlignment === 'BULLISH_STACK') ||
        (!isBull && input.htfTechnical.movingAverages.maAlignment === 'BEARISH_STACK');

      let raw = 0;
      if (htfTrendMatch && maStackMatch) raw = 1.0;
      else if (htfTrendMatch || maStackMatch) raw = 0.65;
      else if (htfTrendOppose) raw = -0.8;

      addComponent(
        'htfStructureAlignment',
        'HTF Market Structure & MA Alignment',
        raw,
        `HTF SMC Structure=${input.htfSmc.trendStructure}, MA Stack=${input.htfTechnical.movingAverages.maAlignment}, Regime=${input.htfTechnical.marketRegime.classification}.`,
        'STRATEGY_INTERPRETATION'
      );
    }

    // 2. LTF Structure Shift / Confirmation (BOS / CHoCH / MSS)
    const latestLtfBreak =
      input.ltfSmc.structureBreaks.length > 0
        ? input.ltfSmc.structureBreaks[input.ltfSmc.structureBreaks.length - 1]
        : null;

    if (!latestLtfBreak) {
      missingEvidenceWarnings.push('No confirmed LTF structure break (BOS/CHoCH/MSS) detected.');
      addComponent(
        'ltfStructureShift',
        'LTF Structure Shift (BOS / CHoCH / MSS)',
        0,
        'No confirmed LTF structure break in lookback window.',
        'STRATEGY_INTERPRETATION'
      );
    } else if (latestLtfBreak.direction === dir) {
      const raw = latestLtfBreak.hasDisplacement ? 1.0 : 0.7;
      addComponent(
        'ltfStructureShift',
        'LTF Structure Shift (BOS / CHoCH / MSS)',
        raw,
        `Confirmed ${latestLtfBreak.type} (${latestLtfBreak.direction}) at ${latestLtfBreak.brokenSwingPrice} (Displacement=${latestLtfBreak.hasDisplacement}).`,
        'STRATEGY_INTERPRETATION'
      );
    } else {
      addComponent(
        'ltfStructureShift',
        'LTF Structure Shift (BOS / CHoCH / MSS)',
        -0.75,
        `Most recent LTF structure break is opposing (${latestLtfBreak.type} ${latestLtfBreak.direction} at ${latestLtfBreak.brokenSwingPrice}).`,
        'STRATEGY_INTERPRETATION'
      );
    }

    // 3. Liquidity Sweep & Reaction
    const sweptPools = input.ltfSmc.liquidityPools.filter((p) => p.swept);
    const matchingSweep = sweptPools.find(
      (p) =>
        (isBull && p.type === 'SELL_SIDE_LIQUIDITY' && p.subsequentReaction === 'REJECTION_REVERSAL') ||
        (!isBull && p.type === 'BUY_SIDE_LIQUIDITY' && p.subsequentReaction === 'REJECTION_REVERSAL')
    );

    if (matchingSweep) {
      addComponent(
        'liquiditySweepConfirmed',
        'Liquidity Pool Sweep & Rejection',
        1.0,
        `${matchingSweep.type} (${matchingSweep.sourceType} at ${matchingSweep.priceLevel}) swept with rejection reversal.`,
        'STRATEGY_INTERPRETATION'
      );
    } else if (
      (isBull && input.ltfSmc.ictContext.asianSessionRange?.sweptLow) ||
      (!isBull && input.ltfSmc.ictContext.asianSessionRange?.sweptHigh)
    ) {
      addComponent(
        'liquiditySweepConfirmed',
        'Liquidity Pool Sweep & Rejection',
        0.75,
        `Asian Session ${isBull ? 'Low' : 'High'} liquidity swept prior to current structure.`,
        'STRATEGY_INTERPRETATION'
      );
    } else {
      addComponent(
        'liquiditySweepConfirmed',
        'Liquidity Pool Sweep & Rejection',
        0,
        'No confirmed opposing liquidity pool sweep detected immediately preceding current price.',
        'STRATEGY_INTERPRETATION'
      );
    }

    // 4. FVG / Order Block / Dealing Range PD Array Interaction
    const activeFvg = input.ltfSmc.fairValueGaps.find(
      (g) =>
        (isBull && (g.type === 'BULLISH_FVG' || g.type === 'BULLISH_IFVG')) ||
        (!isBull && (g.type === 'BEARISH_FVG' || g.type === 'BEARISH_IFVG'))
    );
    const activeOb = input.ltfSmc.orderBlocks.find(
      (ob) =>
        ob.status !== 'INVALIDATED' &&
        ((isBull && (ob.type === 'BULLISH_OB' || ob.type === 'BULLISH_BREAKER')) ||
          (!isBull && (ob.type === 'BEARISH_OB' || ob.type === 'BEARISH_BREAKER')))
    );
    const dealingPos = input.ltfSmc.dealingRange?.currentPricePosition;
    const inFavorableDealingZone =
      (isBull && dealingPos === 'DISCOUNT') || (!isBull && dealingPos === 'PREMIUM');

    let pdRaw = 0;
    const pdNotes: string[] = [];
    if (activeFvg) {
      pdRaw += 0.45;
      pdNotes.push(`${activeFvg.type} [${activeFvg.lowerPrice}-${activeFvg.upperPrice}]`);
    }
    if (activeOb) {
      pdRaw += 0.45;
      pdNotes.push(`${activeOb.type} [${activeOb.lowerPrice}-${activeOb.upperPrice}]`);
    }
    if (inFavorableDealingZone) {
      pdRaw = Math.min(1.0, pdRaw + 0.3);
      pdNotes.push(`Price in ${dealingPos} (${input.ltfSmc.dealingRange?.currentRangePercent}%)`);
    } else if ((isBull && dealingPos === 'PREMIUM') || (!isBull && dealingPos === 'DISCOUNT')) {
      pdRaw -= 0.4;
      pdNotes.push(`Unfavorable dealing range: buying in PREMIUM or selling in DISCOUNT`);
    }

    addComponent(
      'fvgOrOrderBlockZone',
      'FVG / Order Block / Dealing Range Zone',
      Math.max(-1, Math.min(1, pdRaw)),
      pdNotes.length > 0 ? pdNotes.join('; ') : 'No aligned FVG or Order Block zone active.',
      'STRATEGY_INTERPRETATION'
    );

    // 5. CRT Setup Confirmation
    if (input.crtResult.status === 'CONFIRMED_CRT' && input.crtResult.directionalBias === dir) {
      addComponent(
        'crtSetupConfirmed',
        'Candle Range Theory (CRT) Alignment',
        1.0,
        `Confirmed ${dir} CRT (${input.crtResult.setupClassification}): sweep of ${input.crtResult.sweepExtremePrice} + re-entry confirmed.`,
        'STRATEGY_INTERPRETATION'
      );
    } else if (
      input.crtResult.status === 'PROVISIONAL_SWEEP_INCOMPLETE' &&
      ((isBull && input.crtResult.sweepType === 'LOW_SWEEP_BULLISH_CRT') ||
        (!isBull && input.crtResult.sweepType === 'HIGH_SWEEP_BEARISH_CRT'))
    ) {
      addComponent(
        'crtSetupConfirmed',
        'Candle Range Theory (CRT) Alignment',
        0.4,
        `Provisional CRT sweep detected (${input.crtResult.setupClassification}), awaiting full confirmation.`,
        'STRATEGY_INTERPRETATION'
      );
    } else if (
      input.crtResult.status === 'CONFIRMED_CRT' &&
      input.crtResult.directionalBias !== 'NEUTRAL' &&
      input.crtResult.directionalBias !== dir
    ) {
      addComponent(
        'crtSetupConfirmed',
        'Candle Range Theory (CRT) Alignment',
        -0.8,
        `Opposing CRT setup confirmed (${input.crtResult.directionalBias} ${input.crtResult.setupClassification}).`,
        'STRATEGY_INTERPRETATION'
      );
    } else {
      addComponent(
        'crtSetupConfirmed',
        'Candle Range Theory (CRT) Alignment',
        0,
        `CRT Status: ${input.crtResult.status} (${input.crtResult.setupClassification}).`,
        'STRATEGY_INTERPRETATION'
      );
    }

    // 6. Session & Killzone Timing
    const kz = input.ltfSmc.ictContext.activeKillzone;
    const sess = input.ltfSmc.ictContext.activeSession;
    if (kz === 'LONDON_OPEN_KILLZONE' || kz === 'NEW_YORK_OPEN_KILLZONE') {
      addComponent(
        'sessionKillzoneTiming',
        'Session & Killzone Timing',
        1.0,
        `High-liquidity execution window active: ${kz} (${sess}).`,
        'DETERMINISTIC_METRIC'
      );
    } else if (sess === 'London' || sess === 'New York' || sess === 'London/NY Overlap') {
      addComponent(
        'sessionKillzoneTiming',
        'Session & Killzone Timing',
        0.7,
        `Active institutional session: ${sess} (Killzone: ${kz}).`,
        'DETERMINISTIC_METRIC'
      );
    } else if (sess === 'Asia') {
      addComponent(
        'sessionKillzoneTiming',
        'Session & Killzone Timing',
        0.35,
        `Asian Session active (${kz}). Best suited for JPY/AUD/NZD or range accumulation.`,
        'DETERMINISTIC_METRIC'
      );
    } else {
      addComponent(
        'sessionKillzoneTiming',
        'Session & Killzone Timing',
        -0.3,
        'Off-Hours session: lower liquidity and wider spreads.',
        'DETERMINISTIC_METRIC'
      );
    }

    // 7. Fundamental & Macroeconomic Alignment
    const macroBias = input.fundamentals.directionalBias;
    if (macroBias === dir) {
      addComponent(
        'fundamentalAlignment',
        'Fundamental & Central Bank Differential',
        1.0,
        `Macro bias (${macroBias}, Score=${input.fundamentals.relativeStrengthScore}) aligns with ${dir}. ${input.fundamentals.policyDivergenceSummary}`,
        'DETERMINISTIC_METRIC'
      );
    } else if (macroBias === 'NEUTRAL') {
      addComponent(
        'fundamentalAlignment',
        'Fundamental & Central Bank Differential',
        0.2,
        `Neutral macro differential (Score=${input.fundamentals.relativeStrengthScore}). ${input.fundamentals.policyDivergenceSummary}`,
        'DETERMINISTIC_METRIC'
      );
    } else {
      addComponent(
        'fundamentalAlignment',
        'Fundamental & Central Bank Differential',
        -0.7,
        `Macro differential (${macroBias}, Score=${input.fundamentals.relativeStrengthScore}) opposes ${dir} setup.`,
        'DETERMINISTIC_METRIC'
      );
    }

    // 8. Upcoming High-Impact Event Risk Clearance
    if (input.fundamentals.upcomingEventRisk.hasHighImpactWithin24h) {
      const hrs = input.fundamentals.upcomingEventRisk.hoursUntilNextHighImpact ?? 0;
      const raw = hrs <= 4 ? -1.0 : -0.5;
      addComponent(
        'eventRiskClearance',
        'High-Impact Economic Event Clearance',
        raw,
        input.fundamentals.upcomingEventRisk.eventRiskWarning,
        'OBSERVED_MARKET_DATA'
      );
    } else {
      addComponent(
        'eventRiskClearance',
        'High-Impact Economic Event Clearance',
        1.0,
        input.fundamentals.upcomingEventRisk.eventRiskWarning,
        'OBSERVED_MARKET_DATA'
      );
    }

    // 9. Reward-to-Risk & Invalidation Feasibility
    const rr = input.proposedRewardToRiskRatio ?? 2.0;
    if (rr >= 2.0) {
      addComponent(
        'rewardToRiskFeasibility',
        'Reward-to-Risk & Structural Invalidation',
        1.0,
        `Favorable R:R ratio (${rr.toFixed(2)}R >= 2.0R) with structural invalidation level.`,
        'DETERMINISTIC_METRIC'
      );
    } else if (rr >= 1.5) {
      addComponent(
        'rewardToRiskFeasibility',
        'Reward-to-Risk & Structural Invalidation',
        0.5,
        `Acceptable R:R ratio (${rr.toFixed(2)}R).`,
        'DETERMINISTIC_METRIC'
      );
    } else {
      addComponent(
        'rewardToRiskFeasibility',
        'Reward-to-Risk & Structural Invalidation',
        -0.6,
        `Sub-optimal R:R ratio (${rr.toFixed(2)}R < 1.5R).`,
        'DETERMINISTIC_METRIC'
      );
    }

    // Compute total possible weight and sum of positive/negative contributions
    const totalWeightPossible = Object.values(weights).reduce((a, b) => a + b, 0) || 100;
    const rawWeightedSum = components.reduce((sum, c) => sum + c.weightedContribution, 0);

    let normalizedScore = (rawWeightedSum / totalWeightPossible) * 100;

    // Apply explicit penalties for missing data, overlapping sweep double-counting, or severe contradictions
    if (
      matchingSweep &&
      input.crtResult.status === 'CONFIRMED_CRT' &&
      input.crtResult.directionalBias === dir
    ) {
      // Prevent double-counting identical wick sweep across both Liquidity Sweep and CRT Sweep
      penaltiesApplied.push({
        reason: 'Overlap deduplication: Liquidity Pool Sweep and CRT Sweep share the same reference excursion.',
        pointsDeducted: 4
      });
      normalizedScore -= 4;
    }

    if (contradictorySignals.length >= 2) {
      const penalty = contradictorySignals.length * 5;
      penaltiesApplied.push({
        reason: `${contradictorySignals.length} contradictory factors oppose the proposed ${dir} direction.`,
        pointsDeducted: penalty
      });
      normalizedScore -= penalty;
    }

    if (missingEvidenceWarnings.length > 0) {
      const penalty = missingEvidenceWarnings.length * 4;
      penaltiesApplied.push({
        reason: `${missingEvidenceWarnings.length} missing data or unconfirmed structural requirement(s).`,
        pointsDeducted: penalty
      });
      normalizedScore -= penalty;
    }

    const totalHeuristicScore = Math.max(0, Math.min(100, Math.round(normalizedScore)));

    let grade: ConfluenceEvaluationResult['grade'] = 'NO_SETUP_CONTRADICTORY';
    if (totalHeuristicScore >= 75 && contradictorySignals.length <= 1) {
      grade = 'A_PLUS_HIGH_CONFLUENCE';
    } else if (totalHeuristicScore >= 55) {
      grade = 'B_MODERATE_CONFLUENCE';
    } else if (totalHeuristicScore >= 35) {
      grade = 'C_LOW_CONFLUENCE';
    }

    return {
      symbol: input.symbol,
      evaluatedDirection: dir,
      totalHeuristicScore,
      grade,
      components,
      penaltiesApplied,
      missingEvidenceWarnings,
      contradictorySignals,
      calibrationDisclaimer:
        'HEURISTIC CONFLUENCE SCORE DISCLAIMER: This 0–100 score measures multi-factor rule alignment across technical, structural, and macroeconomic inputs. It is NOT a statistically calibrated probability of profit.',
      ruleVersion: 'CONFLUENCE-v1.0.0'
    };
  }
}
