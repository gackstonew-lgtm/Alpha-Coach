import React, { useState, useEffect, useRef } from 'react';
import { AnimatedNumber } from '../common/AnimatedNumber';
import { Bot, Sparkles, TrendingUp, Flame } from 'lucide-react';

/* ========================================================================= */
/* 1. EXECUTIVE OVERVIEW DEMO WITH PROGRESSIVE CHART & COUNT-UP             */
/* ========================================================================= */
export const DemoExecutiveOverview: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
  const chartData = [
    { trade: 1, val: 20, equity: '$102,400' },
    { trade: 6, val: 24, equity: '$103,150' },
    { trade: 12, val: 22, equity: '$102,890' },
    { trade: 18, val: 28, equity: '$104,200' },
    { trade: 24, val: 35, equity: '$105,680' },
    { trade: 30, val: 30, equity: '$104,900' },
    { trade: 36, val: 42, equity: '$106,750' },
    { trade: 42, val: 48, equity: '$107,820' },
    { trade: 48, val: 45, equity: '$107,310' },
    { trade: 54, val: 52, equity: '$108,450' },
    { trade: 60, val: 60, equity: '$109,700' },
    { trade: 66, val: 58, equity: '$109,240' },
    { trade: 72, val: 64, equity: '$110,400' },
    { trade: 78, val: 72, equity: '$111,680' },
    { trade: 84, val: 70, equity: '$111,310' },
    { trade: 90, val: 78, equity: '$112,450' },
    { trade: 96, val: 85, equity: '$113,200' },
    { trade: 102, val: 82, equity: '$112,850' },
    { trade: 108, val: 90, equity: '$113,920' },
    { trade: 114, val: 96, equity: '$114,500' },
    { trade: 118, val: 94, equity: '$114,210' },
    { trade: 120, val: 100, equity: '$114,820' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Metric Ribbon with Count-Up Animations */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Net P/L Card */}
        <div className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle space-y-1 hover:border-border-strong transition">
          <div className="text-xs text-content-muted">Net Realized P/L</div>
          <div className="text-xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
            <AnimatedNumber
              value={14820.5}
              decimals={2}
              prefix="+$"
              duration={1600}
              isVisible={isVisible}
            />
          </div>
          <div className="text-[10px] text-content-subtle font-mono flex items-center gap-1">
            <AnimatedNumber
              value={18.4}
              decimals={1}
              prefix="+"
              suffix="% Return"
              duration={1400}
              isVisible={isVisible}
            />
          </div>
        </div>

        {/* Profit Factor Card */}
        <div className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle space-y-1 hover:border-border-strong transition">
          <div className="text-xs text-content-muted">Profit Factor</div>
          <div className="text-xl font-mono font-extrabold text-brand-600 dark:text-brand-400">
            <AnimatedNumber
              value={2.18}
              decimals={2}
              duration={1400}
              isVisible={isVisible}
            />
          </div>
          <div className="text-[10px] text-content-subtle font-mono">Gross W/L Ratio</div>
        </div>

        {/* Win Rate Card */}
        <div className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle space-y-1 hover:border-border-strong transition">
          <div className="text-xs text-content-muted">Win Rate</div>
          <div className="text-xl font-mono font-extrabold text-content-primary">
            <AnimatedNumber
              value={64.2}
              decimals={1}
              suffix="%"
              duration={1500}
              isVisible={isVisible}
            />
          </div>
          <div className="text-[10px] text-content-subtle font-mono">
            <AnimatedNumber
              value={77}
              decimals={0}
              suffix=" of 120 Trades"
              duration={1400}
              isVisible={isVisible}
            />
          </div>
        </div>

        {/* Expectancy Card */}
        <div className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle space-y-1 hover:border-border-strong transition">
          <div className="text-xs text-content-muted">Expectancy / Trade</div>
          <div className="text-xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
            <AnimatedNumber
              value={184.5}
              decimals={2}
              prefix="+$"
              duration={1600}
              isVisible={isVisible}
            />
          </div>
          <div className="text-[10px] text-content-subtle font-mono">
            <AnimatedNumber
              value={0.82}
              decimals={2}
              prefix="+"
              suffix=" R-Multiple"
              duration={1400}
              isVisible={isVisible}
            />
          </div>
        </div>
      </div>

      {/* Progressive High-Water Mark Equity Curve */}
      <div className="p-6 rounded-2xl bg-surface-secondary border border-border-subtle space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-500" />
            <span className="text-xs font-bold text-content-primary uppercase tracking-wider">
              High-Water Mark Equity Curve (90 Days)
            </span>
          </div>
          <span className="text-xs font-mono text-emerald-500 font-bold">
            Peak: <AnimatedNumber value={114820} prefix="$" duration={1800} isVisible={isVisible} />
          </span>
        </div>

        {/* Dynamic Growth Bars */}
        <div className="h-28 w-full flex items-end gap-1.5 pt-4">
          {chartData.map((item, idx) => {
            const delayMs = idx * 45;
            return (
              <div
                key={idx}
                className="flex-1 flex flex-col justify-end h-full group relative cursor-pointer"
              >
                {/* Micro Tooltip */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface border border-border-strong px-2 py-1 rounded-md text-[10px] font-mono text-content-primary opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-20 shadow-lg">
                  Trade #{item.trade}: {item.equity}
                </div>

                {/* Animated Growing Bar */}
                <div
                  style={{
                    height: isVisible ? `${item.val}%` : '0%',
                    transitionDelay: `${delayMs}ms`
                  }}
                  className="w-full bg-brand-500 rounded-t transition-all duration-700 ease-out hover:bg-brand-400"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* 2. STRATEGY LAB DEMO WITH LIVE BOUNDED DATA FLUCTUATION                  */
/* ========================================================================= */
export const DemoStrategyLab: React.FC<{ isActive: boolean; isVisible: boolean }> = ({
  isActive,
  isVisible
}) => {
  const [strategies, setStrategies] = useState([
    {
      name: 'Liquidity Sweep + MSS + FVG',
      baseWr: 72.4,
      basePnl: 8420.0,
      baseFactor: 2.84,
      wr: 72.4,
      pnl: 8420.0,
      factor: 2.84,
      trades: 38
    },
    {
      name: 'Order Block Mitigation',
      baseWr: 61.1,
      basePnl: 4210.5,
      baseFactor: 1.92,
      wr: 61.1,
      pnl: 4210.5,
      factor: 1.92,
      trades: 42
    },
    {
      name: 'Breaker Block Retest',
      baseWr: 58.3,
      basePnl: 2190.0,
      baseFactor: 1.65,
      wr: 58.3,
      pnl: 2190.0,
      factor: 1.65,
      trades: 24
    }
  ]);

  useEffect(() => {
    if (!isActive || !isVisible) return;

    // Check for prefers-reduced-motion
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const interval = setInterval(() => {
      setStrategies((prev) =>
        prev.map((strat) => {
          // Bounded subtle fluctuations around base values
          const wrDelta = (Math.sin(Date.now() / 2000 + strat.trades) * 0.7);
          const pnlDelta = (Math.cos(Date.now() / 2500 + strat.trades) * 45.0);
          const factorDelta = (Math.sin(Date.now() / 3000 + strat.trades) * 0.04);

          return {
            ...strat,
            wr: Number((strat.baseWr + wrDelta).toFixed(1)),
            pnl: Number((strat.basePnl + pnlDelta).toFixed(2)),
            factor: Number((strat.baseFactor + factorDelta).toFixed(2))
          };
        })
      );
    }, 2400);

    return () => clearInterval(interval);
  }, [isActive, isVisible]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between text-xs text-content-muted">
        <span>Strategy Edge Breakdown per Confluence Setup:</span>
        <span className="flex items-center gap-1.5 text-[11px] text-brand-500 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping" />
          <span>Live Demonstration Stream</span>
        </span>
      </div>

      <div className="space-y-2">
        {strategies.map((strat, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-border-strong transition duration-200"
          >
            <div className="space-y-0.5">
              <div className="font-bold text-xs text-content-primary">{strat.name}</div>
              <div className="text-[11px] text-content-muted">{strat.trades} Reconstructed Trades</div>
            </div>
            <div className="flex items-center gap-6 font-mono text-xs">
              <div>
                <span className="text-content-subtle">WR:</span>{' '}
                <span className="font-bold text-content-primary transition-all duration-500">
                  {strat.wr}%
                </span>
              </div>
              <div>
                <span className="text-content-subtle">PF:</span>{' '}
                <span className="font-bold text-content-primary transition-all duration-500">
                  {strat.factor}
                </span>
              </div>
              <div className="font-extrabold text-emerald-600 dark:text-emerald-400 transition-all duration-500">
                +${strat.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ========================================================================= */
/* 3. RISK GUARDIAN DEMO WITH LIVE METRIC SHUFFLE                           */
/* ========================================================================= */
export const DemoRiskGuardian: React.FC<{ isActive: boolean; isVisible: boolean }> = ({
  isActive,
  isVisible
}) => {
  const [lossAmount, setLossAmount] = useState(0);
  const [tradesCount, setTradesCount] = useState(2);

  useEffect(() => {
    if (!isActive || !isVisible) return;

    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const interval = setInterval(() => {
      setLossAmount((prev) => (prev === 0 ? 45.0 : prev === 45.0 ? 82.5 : 0));
      setTradesCount((prev) => (prev === 2 ? 3 : prev === 3 ? 2 : 2));
    }, 3200);

    return () => clearInterval(interval);
  }, [isActive, isVisible]);

  const lossPct = Math.round((lossAmount / 500) * 100);
  const tradesPct = Math.round((tradesCount / 5) * 100);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Daily Loss Limit */}
        <div className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle space-y-2">
          <div className="text-xs text-content-muted">Daily Loss Limit</div>
          <div className="text-lg font-mono font-bold text-content-primary transition-all duration-500">
            ${lossAmount.toFixed(2)} / $500.00
          </div>
          <div className="w-full bg-surface h-2 rounded-full overflow-hidden">
            <div
              style={{ width: `${lossPct}%` }}
              className={`h-full transition-all duration-700 ${
                lossPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
          </div>
          <div className="text-[10px] text-emerald-500 font-bold transition-all duration-500">
            {100 - lossPct}% Risk Capacity Available
          </div>
        </div>

        {/* Daily Trade Limit */}
        <div className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle space-y-2">
          <div className="text-xs text-content-muted">Daily Trade Limit</div>
          <div className="text-lg font-mono font-bold text-content-primary transition-all duration-500">
            {tradesCount} / 5 Trades
          </div>
          <div className="w-full bg-surface h-2 rounded-full overflow-hidden">
            <div
              style={{ width: `${tradesPct}%` }}
              className="bg-brand-500 h-full transition-all duration-700"
            />
          </div>
          <div className="text-[10px] text-content-muted transition-all duration-500">
            {5 - tradesCount} Trades Remaining Today
          </div>
        </div>

        {/* Consecutive Losses */}
        <div className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle space-y-2">
          <div className="text-xs text-content-muted">Consecutive Losses</div>
          <div className="text-lg font-mono font-bold text-emerald-500">0 / 3 Max</div>
          <div className="w-full bg-surface h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-[0%]" />
          </div>
          <div className="text-[10px] text-emerald-500 font-bold">Healthy Mindset Status</div>
        </div>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* 4. AI COACH DEMO WITH CHARACTER-BY-CHARACTER TYPING ANIMATION           */
/* ========================================================================= */
export const DemoAICoach: React.FC<{ isActive: boolean; isVisible: boolean }> = ({
  isActive,
  isVisible
}) => {
  const reflections = [
    {
      query: 'Review my EURUSD losses during New York session and analyze why my win rate drops after 14:00 UTC.',
      response:
        'Between 14:00 and 16:00 UTC, your average holding time drops by 65% (from 42 mins to 14 mins) and 80% of losing trades carry the subjective tag FOMO or CHASED. When you trade only your core London Liquidity Sweep setup, your win rate is 72.4%.'
    },
    {
      query: 'What is the primary technical leak in my losing trades over the last 30 days?',
      response:
        'Reviewing your last 30 losing trades shows that 73% occurred when moving initial Stop Loss beyond structure. Strict initial SL adherence would have preserved +$3,210.00 in account capital.'
    },
    {
      query: 'Compare my Friday execution performance against the rest of the trading week.',
      response:
        'Your Friday New York session expectancy is negative (-$42.10/trade) vs Tuesday-Thursday London overlap (+$310.80/trade). Establishing a Friday risk-off rule will protect your weekly gains.'
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (!isActive || !isVisible) return;

    // Check for prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setDisplayedText(reflections[currentIndex].response);
      setIsTyping(false);
      return;
    }

    const fullText = reflections[currentIndex].response;
    let charIndex = 0;
    setDisplayedText('');
    setIsTyping(true);

    const typingInterval = setInterval(() => {
      charIndex++;
      setDisplayedText(fullText.slice(0, charIndex));

      if (charIndex >= fullText.length) {
        clearInterval(typingInterval);
        setIsTyping(false);

        // Hold for 4.5 seconds then cycle to next reflection
        const cycleTimer = setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % reflections.length);
        }, 4500);

        return () => clearTimeout(cycleTimer);
      }
    }, 20);

    return () => clearInterval(typingInterval);
  }, [currentIndex, isActive, isVisible]);

  const currentReflection = reflections[currentIndex];

  return (
    <div className="p-5 rounded-2xl bg-surface-secondary border border-border-subtle space-y-3 animate-in fade-in duration-300">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 font-bold text-brand-600 dark:text-brand-400">
          <Bot className="w-4 h-4" />
          <span>Grounded AI Trading Coach Query</span>
        </div>
        <span className="text-[10px] font-mono text-content-muted">
          Reflection #{currentIndex + 1} of {reflections.length}
        </span>
      </div>

      {/* Query Bubble */}
      <div className="p-3 rounded-xl bg-surface border border-border-subtle text-xs text-content-primary font-mono transition-all duration-300">
        &quot;{currentReflection.query}&quot;
      </div>

      {/* Grounded Response Bubble with Typewriter */}
      <div className="p-4 rounded-xl bg-surface border border-border-subtle text-xs text-content-secondary space-y-2 leading-relaxed min-h-[90px]">
        <div className="flex items-center gap-1.5 font-bold text-content-primary">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Empirical Finding from your 120 Journal Records:</span>
        </div>
        <p className="text-content-secondary">
          {displayedText}
          {isTyping && <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-brand-500 animate-pulse" />}
        </p>
      </div>
    </div>
  );
};
