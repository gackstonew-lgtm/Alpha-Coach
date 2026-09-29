/**
 * Meta Coach - General Forex Knowledge Engine
 * Pure TypeScript, zero dependencies. Shared verbatim by the frontend
 * (Supabase mode) and the backend (custom backend mode).
 */

export interface ForexAnswer {
  topic: string;
  answer: string;
  followUps: string[];
}

interface Topic {
  id: string;
  title: string;
  keywords: string[]; // phrases weigh more than single words
  answer: string;
  followUps: string[];
}

const FOOTER = '\n\n*Educational content, not financial advice.*';

const TOPICS: Topic[] = [
  {
    id: 'pips-lots',
    title: 'Pips, Lots & Pip Value',
    keywords: ['pip', 'pips', 'pipette', 'lot size', 'lots', 'micro lot', 'mini lot', 'standard lot', 'pip value'],
    answer: `### Pips, Lots & Pip Value
- **Pip:** the standard price increment. 0.0001 on most pairs (EUR/USD 1.1000 → 1.1001 is 1 pip) and 0.01 on JPY pairs. A **pipette** is 1/10 of a pip.
- **Lot sizes:** Standard = 100,000 units, Mini = 10,000, Micro = 1,000.
- **Pip value:** on USD-quoted pairs (EUR/USD, GBP/USD) a pip is about **$10 per standard lot, $1 per mini, $0.10 per micro**. On other pairs it varies with the exchange rate.
- **Why it matters:** your P/L is *pips moved × pip value × lots*, so position size decides how much each pip costs you.`,
    followUps: ['How do I calculate position size?', 'What is leverage and margin?']
  },
  {
    id: 'position-size',
    title: 'Position Sizing',
    keywords: ['position size', 'position sizing', 'how many lots', 'lot calculation', 'calculate lot', 'size my trade', 'risk per trade', 'how much to risk'],
    answer: `### Position Sizing
**Formula:** Lots = (Account balance × Risk %) ÷ (Stop-loss in pips × Pip value per lot)

**Example:** $10,000 account, 1% risk ($100), 25-pip stop on EUR/USD (~$10/pip per lot):
100 ÷ (25 × 10) = **0.40 lots**.

- Most professionals risk **0.5%–1%** per trade; above 2% makes losing streaks dangerous.
- Size is set by the **stop distance**, not by conviction. Wider stop = smaller size.
- Recalculate on every trade; never use a fixed lot size with a variable stop.`,
    followUps: ['What is a good risk-to-reward ratio?', 'How does drawdown affect recovery?']
  },
  {
    id: 'risk-management',
    title: 'Risk Management',
    keywords: ['risk management', 'manage risk', 'stop loss', 'stop-loss', 'protect capital', 'daily loss', 'max loss', '1% rule', 'risk rule', 'capital preservation', 'blow account', 'blown account'],
    answer: `### Risk Management Essentials
1. **Risk a fixed small % per trade** (0.5%–1%).
2. **Always define the stop before entry**, based on market structure or ATR, not on how much you can "afford".
3. **Set a daily loss limit** (e.g. 2–3%) and stop trading when hit.
4. **Cap total open risk** (e.g. 3–5%) and watch correlated pairs (EUR/USD + GBP/USD is close to one bet).
5. **Never widen a stop** to avoid a loss. Move it only to reduce risk.
6. **Review weekly:** losses inside your rules are the cost of business; losses outside them are the real problem.

Survival comes first: a 50% loss needs a 100% gain to recover.`,
    followUps: ['How do I calculate position size?', 'How do I stop revenge trading?']
  },
  {
    id: 'risk-reward',
    title: 'Risk-to-Reward & Win Rate',
    keywords: ['risk reward', 'risk-reward', 'risk to reward', 'risk-to-reward', 'reward to risk', 'rr', 'r:r', 'r multiple', 'r-multiple', 'win rate', 'breakeven win rate', 'expectancy', 'profit factor'],
    answer: `### Risk-Reward, Win Rate & Expectancy
**Expectancy = (Win rate × Avg win) − (Loss rate × Avg loss)**. A positive number means the system has an edge.

Breakeven win rate for a given R:R:
- 1:1 → **50%**
- 1:2 → **33%**
- 1:3 → **25%**

- A high win rate with tiny winners and large losers can still lose money.
- **Profit factor** = gross profit ÷ gross loss. Above **1.5** is decent; below 1.0 is a losing system.
- Judge a strategy over **100+ trades**, not 10.`,
    followUps: ['How did I perform overall across my trading history?', 'What is drawdown?']
  },
  {
    id: 'leverage-margin',
    title: 'Leverage & Margin',
    keywords: ['leverage', 'margin', 'margin call', 'stop out', 'free margin', 'margin level', 'used margin', 'equity'],
    answer: `### Leverage & Margin
- **Leverage** lets you control a large position with a small deposit (1:100 means $1 controls $100).
- **Margin** is the collateral your broker locks to hold open trades. **Free margin** = equity − used margin.
- **Margin level** = equity ÷ used margin × 100. Brokers issue a **margin call** at a set level (often 100%) and **stop out** positions at a lower one (often 20–50%).

Leverage doesn't change your risk. **Position size vs stop distance does.** High leverage just makes it easy to over-size. Keep effective leverage low and risk a fixed % per trade.`,
    followUps: ['How do I calculate position size?', 'What is a good risk-to-reward ratio?']
  },
  {
    id: 'sessions',
    title: 'Trading Sessions',
    keywords: ['session', 'sessions', 'london session', 'new york session', 'tokyo session', 'asian session', 'sydney session', 'overlap', 'best time to trade', 'best time', 'trading hours', 'killzone', 'kill zone'],
    answer: `### Forex Trading Sessions (approx. GMT, shifts with daylight saving)
- **Sydney:** 22:00–07:00. Quiet, thin liquidity.
- **Tokyo/Asia:** 00:00–09:00. Ranges are common; JPY, AUD, NZD pairs are most active.
- **London:** 08:00–17:00. The largest volume; sharp moves, trend starts, and the daily high/low often form here.
- **New York:** 13:00–22:00. USD news drives volatility.
- **London–New York overlap (13:00–17:00):** peak liquidity and tightest spreads.

**Tips:** trade pairs when their home currencies are awake (EUR/GBP in London, USD pairs in NY, JPY/AUD in Asia). Avoid the late-NY rollover when spreads widen. Your journal can show which session is actually best for *you*.`,
    followUps: ['Show me my performance during London vs New York session.', 'What are the major currency pairs?']
  },
  {
    id: 'order-types',
    title: 'Order Types',
    keywords: ['order type', 'order types', 'market order', 'limit order', 'stop order', 'buy limit', 'sell limit', 'buy stop', 'sell stop', 'pending order', 'stop limit', 'trailing stop', 'take profit', 'oco'],
    answer: `### Order Types
- **Market order:** execute now at the current price (risk of slippage).
- **Buy Limit / Sell Limit:** enter at a *better* price (buy below / sell above the market). Used for pullbacks and support/resistance entries.
- **Buy Stop / Sell Stop:** enter at a *worse* price once momentum confirms (buy above / sell below). Used for breakouts.
- **Stop Loss (SL):** closes a losing trade at a set price.
- **Take Profit (TP):** closes a winning trade at a set price.
- **Trailing stop:** the SL follows price by a fixed distance to lock in profit.`,
    followUps: ['What is slippage and spread?', 'What is a breakout strategy?']
  },
  {
    id: 'spread-slippage',
    title: 'Spread, Slippage, Swap & Commission',
    keywords: ['spread', 'slippage', 'swap', 'rollover', 'commission', 'trading cost', 'trading costs', 'requote', 'bid ask', 'bid/ask', 'overnight fee', 'swap fee'],
    answer: `### Trading Costs
- **Spread:** the gap between bid and ask, your entry cost. It widens around news, rollover, and thin sessions.
- **Commission:** a fixed fee per lot on ECN/raw-spread accounts.
- **Slippage:** the difference between the requested and filled price, common in fast markets and on stop orders.
- **Swap (rollover):** interest paid or earned for holding a position past the daily cut-off (~5pm New York). It's positive when you hold the higher-yielding currency. **Wednesday** usually carries a triple swap.

For scalpers, costs can consume a large share of each trade's R. Always compare stop size to spread.`,
    followUps: ['What is a carry trade?', 'Which session has the tightest spreads?']
  },
  {
    id: 'support-resistance',
    title: 'Support & Resistance',
    keywords: ['support', 'resistance', 'support and resistance', 'supply and demand', 'supply demand', 'key level', 'key levels', 'round number', 'flip', 'role reversal'],
    answer: `### Support & Resistance
- **Support:** a price area where buying has repeatedly stopped declines. **Resistance:** where selling has stopped advances.
- Treat them as **zones**, not exact lines.
- The more touches and the higher the timeframe (daily/weekly), the more significant the level.
- **Role reversal:** broken resistance often becomes support (and vice versa), which is a classic retest entry.
- Round numbers (1.1000, 150.00), prior day/week highs and lows, and swing points are watched by many participants.

**Practical use:** mark levels on the higher timeframe, then look for confirmation (rejection wick, engulfing candle) on a lower timeframe before entering.`,
    followUps: ['What is market structure?', 'What are the best candlestick patterns?']
  },
  {
    id: 'trend',
    title: 'Trend Analysis & Market Structure',
    keywords: ['trend', 'trending', 'uptrend', 'downtrend', 'market structure', 'higher high', 'higher low', 'lower high', 'lower low', 'break of structure', 'bos', 'choch', 'change of character', 'ranging', 'sideways', 'trend line', 'trendline'],
    answer: `### Trend & Market Structure
- **Uptrend:** a sequence of higher highs (HH) and higher lows (HL). **Downtrend:** lower highs and lower lows.
- **Range:** price oscillating between support and resistance without directional progress.
- **Break of structure (BOS):** price takes out the last swing in the trend's direction (continuation). **Change of character (CHoCH):** price breaks the opposite swing first, an early sign of a possible reversal.
- **Multi-timeframe approach:** identify bias on H4/Daily, refine entries on M15/H1.

"The trend is your friend" works until structure breaks. Define your invalidation level before you enter.`,
    followUps: ['What is support and resistance?', 'How do moving averages work?']
  },
  {
    id: 'candlesticks',
    title: 'Candlestick Patterns',
    keywords: ['candlestick', 'candlesticks', 'candle', 'candles', 'pin bar', 'hammer', 'shooting star', 'engulfing', 'doji', 'morning star', 'evening star', 'inside bar', 'price action', 'rejection'],
    answer: `### Key Candlestick Patterns
- **Pin bar / Hammer / Shooting star:** a long wick showing price rejection. Strongest at key levels.
- **Engulfing:** a candle whose body fully covers the previous one, signalling a momentum shift.
- **Doji:** open ≈ close, showing indecision. It matters after a strong move.
- **Morning / Evening star:** three-candle reversal patterns.
- **Inside bar:** consolidation within the prior candle's range, often preceding a breakout.

**Rule:** a pattern is only meaningful in *context*: at support/resistance, with the higher-timeframe trend, and after a clear move. In the middle of nowhere it's noise.`,
    followUps: ['What is support and resistance?', 'What is a breakout strategy?']
  },
  {
    id: 'moving-averages',
    title: 'Moving Averages',
    keywords: ['moving average', 'moving averages', 'ema', 'sma', '50 ema', '200 ema', '200 sma', 'golden cross', 'death cross', 'ma crossover'],
    answer: `### Moving Averages
- **SMA:** simple average of closes. **EMA:** weights recent prices more, so it reacts faster.
- **Common settings:** 20/50 EMA (short-medium trend), **200 EMA/SMA** (long-term bias).
- **Uses:** trend direction (price above 200 = bullish bias), dynamic support/resistance in pullbacks, and crossovers (50 over 200 = *golden cross*, the reverse = *death cross*).
- **Weakness:** they lag, and crossovers whipsaw in ranges. Use them to define bias, not as a standalone trigger.`,
    followUps: ['How does RSI work?', 'What is trend analysis?']
  },
  {
    id: 'rsi-macd',
    title: 'Indicators: RSI, MACD, Stochastic, Bollinger, ATR',
    keywords: ['rsi', 'macd', 'stochastic', 'bollinger', 'bollinger bands', 'atr', 'indicator', 'indicators', 'overbought', 'oversold', 'divergence', 'momentum', 'average true range', 'adx'],
    answer: `### Popular Indicators
- **RSI (14):** momentum oscillator 0–100. Above 70 = overbought, below 30 = oversold. In strong trends it can stay extreme, so **divergence** (price makes a new high but RSI doesn't) is often more useful.
- **MACD:** difference of two EMAs plus a signal line. Crossovers and histogram shifts show momentum changes.
- **Stochastic:** compares the close to the recent range. Best in ranging markets.
- **Bollinger Bands:** 20-period mean ± 2 standard deviations. Squeezes precede volatility expansion.
- **ATR (14):** average candle range, ideal for **stop sizing** (e.g. 1.5 × ATR) and volatility-adjusted position size.
- **ADX:** trend strength (above 25 = trending), not direction.

Indicators derive from price, so they confirm rather than predict. Avoid stacking many similar ones.`,
    followUps: ['How do moving averages work?', 'How do I set a stop loss using ATR?']
  },
  {
    id: 'fibonacci',
    title: 'Fibonacci Retracement',
    keywords: ['fibonacci', 'fib', 'fibs', 'retracement', '61.8', '38.2', 'golden ratio', 'extension', 'fib extension', 'ote', 'optimal trade entry'],
    answer: `### Fibonacci Retracement
Draw from swing low to swing high (uptrend) or high to low (downtrend). Key retracement levels: **38.2%, 50%, 61.8%**, with **78.6%** as a deeper one. The **61.8–78.6% zone** is often called the "optimal trade entry".

**Extensions** (127.2%, 161.8%) project profit targets beyond the previous swing.

Fibs work best when they **confluence** with something else: a support/resistance level, a moving average, or a prior structure. On their own they're subjective, so anchor them to obvious swings.`,
    followUps: ['What is support and resistance?', 'What is market structure?']
  },
  {
    id: 'breakout-pullback',
    title: 'Strategies: Breakout, Pullback, Reversal, Scalping, Swing',
    keywords: ['breakout', 'false breakout', 'fakeout', 'pullback', 'retest', 'reversal', 'scalping', 'scalp', 'day trading', 'swing trading', 'position trading', 'trading style', 'strategy', 'strategies', 'trading strategy', 'best strategy', 'trend following', 'mean reversion'],
    answer: `### Common Strategy Styles
- **Trend-following pullback:** trade with the higher-timeframe trend, enter on a retracement to support/EMA/Fib with a confirmation candle. High probability, moderate R:R.
- **Breakout:** enter when price closes beyond a range/level with volume-like momentum. Beware **false breakouts**, so wait for a candle close or a retest.
- **Reversal / mean reversion:** fade extremes at major levels. Lower win rate, strict stops.
- **Scalping (M1–M5):** many small trades. Spread and execution dominate results.
- **Day trading (M15–H1):** one to a few trades per session, closed before rollover.
- **Swing (H4–D1):** hold days to weeks. Fewer trades, bigger stops, swap costs.

There is **no best strategy**, only the one whose expectancy is positive *and* fits your schedule and psychology. Backtest, forward-test on demo, then journal live results.`,
    followUps: ['How do I backtest a strategy?', 'What is a good risk-to-reward ratio?']
  },
  {
    id: 'backtesting',
    title: 'Backtesting & Forward Testing',
    keywords: ['backtest', 'backtesting', 'forward test', 'forward testing', 'demo account', 'demo trade', 'sample size', 'validate strategy', 'test my strategy', 'optimization', 'overfitting', 'curve fitting'],
    answer: `### Backtesting & Validation
1. **Write exact rules** (entry, stop, target, filters) so no discretion is left.
2. **Test 100+ trades** across different market conditions (trend, range, high/low volatility).
3. **Record R-multiples**, not just wins and losses, and include spread/commission.
4. **Avoid overfitting:** a strategy tuned to perfection on past data often fails live. Keep rules simple and test on out-of-sample data.
5. **Forward-test on demo or micro size** for 1–3 months.
6. **Compare live to backtest** in your journal. A big gap points to execution or psychology issues.`,
    followUps: ['What is expectancy?', 'How should I journal my trades?']
  },
  {
    id: 'central-banks',
    title: 'Central Banks & Interest Rates',
    keywords: ['central bank', 'central banks', 'interest rate', 'interest rates', 'fed', 'fomc', 'ecb', 'boe', 'boj', 'rba', 'snb', 'rate hike', 'rate cut', 'hawkish', 'dovish', 'monetary policy', 'quantitative easing', 'qe', 'qt', 'dot plot', 'rate decision', 'powell'],
    answer: `### Central Banks & Interest Rates
Currencies move largely on **interest-rate expectations**.
- **Hawkish** = leaning toward higher rates/tighter policy → usually **supports** the currency.
- **Dovish** = leaning toward cuts/easing → usually **weakens** it.
- Markets trade **expectations**, so a rate hike that's fully priced in can cause little move, or even a "sell the fact" drop.
- **Rate differentials** between two countries drive pairs such as USD/JPY.
- **Key banks:** Fed (USD), ECB (EUR), BoE (GBP), BoJ (JPY), SNB (CHF), RBA (AUD), RBNZ (NZD), BoC (CAD).
- **Watch:** rate decisions, the statement wording, press conferences, meeting minutes, and speeches.

QE/QT: quantitative easing adds liquidity (bearish for the currency); tightening drains it (bullish).`,
    followUps: ['How do NFP and CPI move the market?', 'What is a carry trade?']
  },
  {
    id: 'news-events',
    title: 'Economic News: NFP, CPI, GDP',
    keywords: ['nfp', 'non farm', 'nonfarm', 'non-farm payroll', 'cpi', 'inflation', 'gdp', 'pmi', 'unemployment', 'jobs report', 'economic calendar', 'news trading', 'high impact', 'red folder', 'retail sales', 'economic data', 'news event', 'news events', 'trade the news'],
    answer: `### Economic Data & News Trading
- **NFP (Non-Farm Payrolls):** first Friday of the month, US jobs data. A big move in USD pairs, gold, and indices.
- **CPI / Inflation:** drives central bank rate expectations. Hotter than forecast → currency usually strengthens on rate-hike bets.
- **GDP, PMI, Retail Sales, Unemployment:** measure growth and demand.
- **Rate decisions** are usually the highest-impact events.

**Reaction = actual vs forecast (consensus)**, not the absolute number.

**Trading tips:** expect wide spreads, slippage, and whipsaw spikes. Many traders stay flat for 15–30 minutes before and after, or wait for the first retracement. Always check an economic calendar and reduce size around red-folder events.`,
    followUps: ['How do central banks affect currencies?', 'How do I manage risk during news?']
  },
  {
    id: 'pairs',
    title: 'Currency Pairs & Correlations',
    keywords: ['currency pair', 'currency pairs', 'major pairs', 'majors', 'minor pairs', 'exotic', 'exotics', 'cross pair', 'crosses', 'correlation', 'correlated', 'eurusd', 'eur/usd', 'gbpusd', 'gbp/usd', 'usdjpy', 'usd/jpy', 'best pair', 'which pair', 'base currency', 'quote currency', 'cable', 'fiber'],
    answer: `### Currency Pairs & Correlation
- **Quote:** EUR/USD = 1.1000 means 1 EUR costs 1.10 USD. First is the **base**, second the **quote**.
- **Majors** (all include USD): EUR/USD, GBP/USD, USD/JPY, USD/CHF, USD/CAD, AUD/USD, NZD/USD. They have the tightest spreads.
- **Crosses/minors:** no USD (EUR/GBP, EUR/JPY, GBP/JPY). **Exotics:** a major vs an emerging currency (USD/TRY, USD/ZAR). Wide spreads, big swings.
- **Correlation:** EUR/USD and GBP/USD usually move together (positive), EUR/USD and USD/CHF move opposite (negative). Trading correlated pairs in the same direction **doubles** your USD exposure.
- **Nicknames:** EUR/USD "Fiber", GBP/USD "Cable", USD/JPY "Gopher".

**Beginner tip:** master one or two majors before broadening.`,
    followUps: ['What is DXY?', 'How do I manage correlated trades?']
  },
  {
    id: 'dxy-usd',
    title: 'US Dollar Index (DXY)',
    keywords: ['dxy', 'dollar index', 'us dollar index', 'usd strength', 'dollar strength', 'strong dollar', 'weak dollar', 'usd index'],
    answer: `### US Dollar Index (DXY)
DXY measures the dollar against a basket: **EUR (~57%), JPY, GBP, CAD, SEK, CHF**. It's dominated by EUR/USD, so it typically moves inversely to it.

- **DXY rising:** USD strength → EUR/USD, GBP/USD, AUD/USD, and gold often fall.
- **DXY falling:** the opposite.
- **Drivers:** Fed policy, US yields, risk sentiment (USD is a safe haven).

Use it as a **confirmation tool** for USD-pair bias. If DXY breaks a key level, USD pairs often follow.`,
    followUps: ['How do central banks affect currencies?', 'What moves gold?']
  },
  {
    id: 'gold',
    title: 'Gold (XAU/USD) Trading',
    keywords: ['gold', 'xauusd', 'xau/usd', 'xau', 'silver', 'xagusd', 'commodity', 'commodities', 'oil', 'wti', 'safe haven'],
    answer: `### Trading Gold (XAU/USD)
- **Drivers:** US dollar strength (inverse), real yields (inverse), inflation fears, geopolitical risk (safe-haven demand), and central bank buying.
- **Behaviour:** very volatile, with large intraday ranges and sharp news reactions (NFP, CPI, Fed).
- **Best sessions:** London and New York, especially the overlap.
- **Risk:** because a "pip" is bigger in dollar terms, use **smaller lot sizes** than on FX pairs and size from stop distance in dollars.
- **Contract:** typically 1 lot = 100 oz. Verify your broker's specs.`,
    followUps: ['How do I calculate position size?', 'What is DXY?']
  },
  {
    id: 'carry-trade',
    title: 'Carry Trade',
    keywords: ['carry trade', 'carry', 'interest differential', 'yield differential', 'positive swap'],
    answer: `### Carry Trade
Buy a **high-yielding** currency funded by a **low-yielding** one (e.g. AUD/JPY or NZD/JPY), earning the interest differential via positive swap while price hopefully holds or drifts up.

- Works best in **calm, risk-on** markets.
- **Risk:** sudden risk-off events trigger sharp unwinds (the 2024 yen carry unwind is a well-known example).
- Never rely on swap alone. A 1% price move can erase months of carry.`,
    followUps: ['How do central banks affect currencies?', 'What is leverage and margin?']
  },
  {
    id: 'psychology',
    title: 'Trading Psychology',
    keywords: ['psychology', 'emotion', 'emotions', 'emotional', 'fomo', 'revenge trading', 'revenge trade', 'overtrading', 'over trading', 'discipline', 'fear', 'greed', 'tilt', 'patience', 'confidence', 'mindset', 'stress', 'consistency', 'consistent', 'impulsive', 'hesitate', 'cut winners'],
    answer: `### Trading Psychology
**Common traps**
- **Revenge trading:** trying to win back a loss immediately, usually oversized and unplanned.
- **FOMO:** chasing a move that already happened.
- **Overtrading:** taking low-quality setups out of boredom.
- **Cutting winners early / letting losers run:** fear of giving back profit, hope on losers.

**What helps**
1. A **written trading plan** with exact entries, stops, and risk.
2. **Loss limits:** stop after 2 consecutive losses or a daily max.
3. A **pre-trade checklist** so every entry is deliberate.
4. **Journal your emotions** alongside the trade. Patterns appear fast.
5. Focus on **process (rule adherence)** rather than single-trade outcomes.

Consistency comes from a repeatable process and small risk, since large risk creates emotional decisions.`,
    followUps: ['How do I stop revenge trading?', 'What were my most common losing-trade characteristics?']
  },
  {
    id: 'revenge-trading',
    title: 'Stopping Revenge Trading',
    keywords: ['stop revenge', 'stop revenge trading', 'after a loss', 'losing streak', 'consecutive losses', 'cooling off', 'cool down', 'stop overtrading', 'break after loss'],
    answer: `### How to Stop Revenge Trading
1. **Two-loss rule:** after 2 consecutive losses, step away for at least 30 minutes.
2. **Hard daily loss cap** (e.g. 2%). Once hit, close the platform.
3. **Fixed risk per trade**: never increase size after a loss.
4. **Pre-trade checklist:** if you can't tick every box, no trade.
5. **Physical reset:** walk, water, breathe, then review the loss objectively.
6. **Tag it in your journal** ("Revenge") so you can measure how often it costs you.

Losses within your plan are normal; the damage comes from the *next* impulsive trade.`,
    followUps: ['What were my most common losing-trade characteristics?', 'Tell me about trading psychology']
  },
  {
    id: 'drawdown',
    title: 'Drawdown & Recovery',
    keywords: ['drawdown', 'max drawdown', 'recovery', 'losing months', 'equity curve', 'underwater', 'peak to trough', 'recover from loss'],
    answer: `### Drawdown & Recovery
**Drawdown** is the peak-to-trough decline in account equity.

| Loss | Gain needed to recover |
|---|---|
| 10% | 11.1% |
| 20% | 25% |
| 30% | 42.9% |
| 50% | 100% |

Losses are **asymmetric**, so protect the downside first. Expect drawdowns: at a 40% win rate you can regularly hit 8–10 losses in a row over a long sample. Size positions so that streak is survivable (1% risk → ~10% drawdown).

If your drawdown exceeds your plan's limit, **reduce size** and review rather than pushing harder.`,
    followUps: ['How do I calculate position size?', 'What is my max drawdown?']
  },
  {
    id: 'journaling',
    title: 'Trade Journaling',
    keywords: ['journal', 'journaling', 'trade journal', 'trading journal', 'track trades', 'log trades', 'review trades', 'trade review', 'weekly review', 'screenshot', 'trading plan', 'checklist'],
    answer: `### Journaling That Actually Improves Results
**Record for every trade:** pair, direction, setup name, entry/stop/target, R-multiple, session, screenshot, and your **emotional state** and any rule breaks.

**Weekly review routine**
1. Sort by setup: which has the best expectancy?
2. Sort by session/pair: where do you make or lose money?
3. Tag mistakes and count them: fix the most frequent first.
4. Review your **best and worst trades** for process, not just outcome.
5. Set **one** improvement goal for next week.

Your synchronized MT5 trades in Meta Coach already give the data; tagging setups and mistakes turns it into insight.`,
    followUps: ['Which trades should I manually review to improve discipline?', 'How did I perform overall across my trading history?']
  },
  {
    id: 'liquidity-smc',
    title: 'Liquidity, Order Blocks & Smart Money Concepts',
    keywords: ['liquidity', 'liquidity sweep', 'stop hunt', 'stop hunting', 'order block', 'fair value gap', 'fvg', 'imbalance', 'smart money', 'smc', 'ict', 'inducement', 'premium', 'discount', 'equal highs', 'equal lows'],
    answer: `### Liquidity & Smart Money Concepts (SMC/ICT)
- **Liquidity:** clusters of resting orders, typically stop losses above equal highs / below equal lows and near obvious levels.
- **Liquidity sweep ("stop hunt"):** price briefly spikes through such a level, triggers stops, then reverses.
- **Order block:** the last opposite candle before a strong displacement move, treated as a potential re-entry zone.
- **Fair value gap (FVG):** a three-candle imbalance where price moved so fast a gap remained. Price often revisits it.
- **Premium/discount:** buy in the discount half of a range, sell in the premium half.

These are frameworks for reading price behaviour, not guarantees. Like any method, **test it and journal the results** before committing real risk.`,
    followUps: ['What is market structure?', 'How do I backtest a strategy?']
  },
  {
    id: 'prop-firms',
    title: 'Prop Firm Challenges',
    keywords: ['prop firm', 'prop firms', 'funded account', 'funded trader', 'ftmo', 'prop challenge', 'evaluation', 'profit target', 'daily drawdown', 'trailing drawdown', 'funded', 'the5ers', 'myforexfunds'],
    answer: `### Prop Firm Challenges
Prop firms fund traders who pass an evaluation: hit a **profit target** (e.g. 8–10%) without breaking **drawdown rules** (commonly ~5% daily and ~10% max).

**How to approach it**
- Risk **0.25%–0.5%** per trade, since the drawdown rules are the real challenge.
- Don't rush the target: consistency beats one big win.
- Check rules on news trading, weekend holding, and consistency requirements.
- Track your **daily drawdown live**; most breaches come from one bad day.

Read the firm's terms carefully and verify its reputation before paying for a challenge.`,
    followUps: ['How do I calculate position size?', 'What is drawdown?']
  },
  {
    id: 'brokers',
    title: 'Choosing a Broker',
    keywords: ['broker', 'brokers', 'regulated', 'regulation', 'ecn', 'stp', 'market maker', 'dealing desk', 'raw spread', 'best broker', 'choose a broker', 'scam', 'mt4', 'mt5', 'metatrader', 'cfd'],
    answer: `### Choosing a Broker
- **Regulation first:** look for top-tier regulators (FCA, ASIC, CySEC, NFA/CFTC, etc.) and segregated client funds.
- **Execution model:** ECN/STP (routes orders to liquidity providers) vs market maker (takes the other side). Neither is inherently bad. Look at real fills.
- **Costs:** spread + commission, swap, and withdrawal/deposit fees.
- **Platform:** MT4/MT5 are standard (MT5 offers more timeframes, order types, and a depth of market).
- **Red flags:** guaranteed returns, unregulated entities, pressure to deposit, poor withdrawal reviews.

Test with a demo, then a small live deposit and a test withdrawal.`,
    followUps: ['What is slippage and spread?', 'What is leverage and margin?']
  },
  {
    id: 'volatility',
    title: 'Volatility & Stop Placement',
    keywords: ['volatility', 'volatile', 'atr stop', 'stop placement', 'where to place stop', 'where to put stop', 'stop distance', 'stop too tight', 'stopped out', 'get stopped out', 'wide stop', 'tight stop', 'take profit placement', 'where to take profit'],
    answer: `### Stop & Target Placement
- Place stops **beyond structure** (past the swing low/high or level that invalidates your idea), not at a random pip count.
- **ATR method:** stop = 1.5–2 × ATR(14) from entry adapts to current volatility.
- Add a small **buffer for spread** (and news wicks).
- **Stopped out often?** Your stops may sit at obvious levels or be too tight for the pair's volatility. Reduce size and widen, don't keep tight stops with big size.
- **Targets:** next structure level, a fixed R multiple (1.5R–3R), or partial profits at 1R with the rest trailed.

A good stop is where your trade idea is *wrong*, and size follows from that distance.`,
    followUps: ['How do I calculate position size?', 'How does RSI work?']
  },
  {
    id: 'beginners',
    title: 'Getting Started with Forex',
    keywords: ['beginner', 'beginners', 'start trading', 'getting started', 'new to forex', 'learn forex', 'how does forex work', 'what is forex', 'forex basics', 'how to start', 'roadmap', 'learn to trade', 'explain forex', 'foreign exchange', 'fx market'],
    answer: `### Forex Basics & Roadmap
**What it is:** the global market for exchanging currencies (~$7+ trillion daily), open 24 hours, 5 days a week. You trade in pairs, buying one currency against another.

**A sensible roadmap**
1. Learn the basics: pairs, pips, lots, leverage, order types.
2. Learn **risk management** before strategy (risk 1% or less per trade).
3. Pick **one or two pairs** and one simple strategy.
4. **Backtest**, then demo trade for 1–3 months.
5. Go live with small size and **journal every trade**.
6. Review weekly; improve one thing at a time.

Most beginners lose by risking too much, overtrading, and skipping a plan, not from lack of indicators.`,
    followUps: ['What is risk management?', 'What are pips and lots?']
  }
];

const GREETINGS = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'yo', 'sup'];
const THANKS = ['thanks', 'thank you', 'thx', 'cheers', 'appreciate'];

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasKeyword(q: string, kw: string): boolean {
  const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(kw)}(s|es)?([^a-z0-9]|$)`, 'i');
  return pattern.test(q);
}

/** Words/phrases that show the user is asking about THEIR OWN trades. */
const JOURNAL_MARKERS = [
  'my trades', 'my performance', 'my trading', 'my journal', 'my win rate', 'my losses', 'my results',
  'my account', 'my sessions', 'my best', 'my worst', 'my drawdown', 'my max', 'my most', 'my common', 'my p/l', 'my pnl', 'my profit',
  'how did i', 'how am i doing', 'did i', 'am i', 'i traded', 'i lost', 'i made', 'my mistakes',
  'my strategy', 'my expectancy', 'my risk', 'trading history', 'my history', 'overall performance',
  'review my', 'analyze my', 'analyse my', 'show me my', 'which trades', 'my discipline', 'my dna'
];

export type JournalIntent = 'performance' | 'losing' | 'session' | 'review' | 'general';

/** Returns a journal intent when the question is about the user's own data, else null. */
export function detectJournalIntent(question: string): JournalIntent | null {
  const q = question.toLowerCase().trim();
  const personal = JOURNAL_MARKERS.some(m => q.includes(m));
  if (!personal) return null;
  if (/(session|london|new york|asia|tokyo|overlap)/.test(q)) return 'session';
  if (/(review|which trade|discipline)/.test(q)) return 'review';
  if (/(losing|loss|mistake|worst)/.test(q)) return 'losing';
  if (/(perform|summary|overall|win rate|profit|drawdown|expectancy|history|doing)/.test(q)) return 'performance';
  return 'general';
}

/** Small-talk handler so greetings never fall through to the analytics dump. */
export function smallTalk(question: string, firstName?: string): ForexAnswer | null {
  const q = question.toLowerCase().trim().replace(/[!.?]+$/g, '');
  const name = firstName ? ` ${firstName}` : '';
  if (GREETINGS.includes(q)) {
    return {
      topic: 'Greeting',
      answer: `Hi${name}! I can analyze your own trading journal or explain anything in forex: risk, sessions, strategy, news, psychology. What would you like to dig into?`,
      followUps: ['How did I perform overall across my trading history?', 'How do I calculate position size?']
    };
  }
  if (THANKS.some(t => q.startsWith(t))) {
    return {
      topic: 'Thanks',
      answer: `Anytime${name}! Ask me anything else about your trades or the forex market.`,
      followUps: ['What were my most common losing-trade characteristics?', 'What is a good risk-to-reward ratio?']
    };
  }
  return null;
}

/** Best-matching forex knowledge topic for a question, or null. */
export function answerForexQuestion(question: string): ForexAnswer | null {
  const q = question.toLowerCase().trim();
  if (!q) return null;

  let best: { topic: Topic; score: number } | null = null;
  for (const topic of TOPICS) {
    let score = 0;
    for (const kw of topic.keywords) {
      if (hasKeyword(q, kw)) {
        // Multi-word phrases are stronger evidence than single words
        score += kw.includes(' ') ? 3 : 1;
      }
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { topic, score };
    }
  }

  if (!best) return null;
  return {
    topic: best.topic.title,
    answer: best.topic.answer + FOOTER,
    followUps: best.topic.followUps
  };
}

export const FOREX_TOPIC_TITLES: string[] = TOPICS.map(t => t.title);
