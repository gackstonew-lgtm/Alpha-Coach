export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'trader' | 'admin';
  timezone: string;
  currency: string;
  subscription_tier: 'FREE' | 'PRO' | 'PREMIUM';
  is_active: number;
}

export interface TradingAccount {
  id: string;
  user_id: string;
  account_number: string;
  broker_name: string;
  server_name: string;
  currency: string;
  leverage: number;
  balance: number;
  equity: number;
  margin: number;
  free_margin: number;
  margin_level: number;
  account_type: 'hedging' | 'netting';
  is_active: number;
  last_synced_at?: string;
  total_positions?: number;
  total_closed_trades?: number;
  total_net_profit?: number;
}

export interface ReconstructedTrade {
  id: string;
  account_id: string;
  account_number?: string;
  broker_name?: string;
  position_id: string;
  symbol: string;
  position_type: 'BUY' | 'SELL';
  total_volume: number;
  entry_price_avg: number;
  exit_price_avg?: number;
  open_time: string;
  close_time?: string;
  status: 'OPEN' | 'CLOSED';
  gross_profit: number;
  commission_total: number;
  swap_total: number;
  fee_total: number;
  net_profit: number;
  initial_sl?: number;
  initial_tp?: number;
  risk_amount?: number;
  r_multiple?: number;
  holding_seconds: number;
  session_name?: string;
  exit_reason: 'SL_HIT' | 'TP_HIT' | 'MANUAL' | 'SO_HIT' | 'PARTIAL' | 'UNKNOWN';
  journal_id?: string;
  setup_name?: string;
  strategy_id?: string;
  strategy_name?: string;
  strategy_color?: string;
  bias?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  is_reviewed?: number;
  emotion_state?: string;
  confidence_score?: number;
  mistake_id?: string;
  mistake_name?: string;
  confluences?: string;
}

export interface PositionExecution {
  id: string;
  position_id: string;
  deal_id: string;
  order_id: string;
  execution_type: 'ENTRY' | 'SCALE_IN' | 'PARTIAL_EXIT' | 'FINAL_EXIT';
  volume: number;
  price: number;
  profit: number;
  commission: number;
  swap: number;
  execution_time: string;
}

export interface TradeJournalDetails {
  id: string;
  position_id: string;
  user_id: string;
  setup_name?: string;
  strategy_id?: string;
  confluences?: string;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  entry_trigger?: string;
  exit_trigger?: string;
  confidence_score: number;
  emotion_state?: string;
  mistake_id?: string;
  lesson_learned?: string;
  voice_transcript?: string;
  trader_notes?: string;
  ai_feedback?: string;
  is_reviewed: number;
  reviewed_at?: string;
}

export interface PerformanceOverview {
  totalTrades: number;
  openTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRate: number;
  lossRate: number;
  grossProfit: number;
  grossLoss: number;
  netProfit: number;
  totalCommissions: number;
  totalSwaps: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  riskRewardRatio: number;
  expectancy: number;
  averageR: number;
  maxDrawdownAmount: number;
  maxDrawdownPct: number;
  recoveryFactor: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  largestWin: number;
  largestLoss: number;
  avgHoldingSeconds: number;
  medianHoldingSeconds: number;
  longTrades: {
    count: number;
    winRate: number;
    netProfit: number;
    profitFactor: number;
  };
  shortTrades: {
    count: number;
    winRate: number;
    netProfit: number;
    profitFactor: number;
  };
  equityCurve: Array<{
    date: string;
    tradeIndex: number;
    symbol: string;
    netProfit: number;
    cumulativeProfit: number;
    equity: number;
    drawdown: number;
    drawdownPct: number;
  }>;
  dailyPerformance: Array<{
    date: string;
    netProfit: number;
    tradesCount: number;
    winCount: number;
    lossCount: number;
  }>;
}

export interface TraderProgression {
  current_xp: number;
  current_level: number;
  current_streak_days: number;
  longest_streak_days: number;
  total_trades_reviewed: number;
  rule_compliance_rate: number;
}

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  xp_reward: number;
  icon: string;
  unlocked?: boolean;
  unlocked_at?: string;
}

export interface TraderDNAProfile {
  mostTradedSymbol: { symbol: string; count: number; winRate: number; netProfit: number } | null;
  mostActiveSession: { session: string; count: number; winRate: number; netProfit: number } | null;
  avgRiskPerTrade: number | null;
  avgDurationMinutes: number;
  longShortRatio: { longPct: number; shortPct: number };
  topStrategy: { name: string; count: number; winRate: number; netProfit: number } | null;
  mostCommonMistake: { name: string; count: number; category: string } | null;
  bestSession: { session: string; netProfit: number; winRate: number } | null;
  worstSession: { session: string; netProfit: number; winRate: number } | null;
  typicalPositionSizeLots: number;
  riskDisciplineScore: number;
  behavioralSummary: string;
}

export interface RiskRule {
  id: string;
  max_daily_loss_amount: number;
  max_daily_loss_pct: number;
  max_weekly_loss_amount: number;
  max_trades_per_day: number;
  max_risk_per_trade_pct: number;
  max_consecutive_losses: number;
  max_drawdown_pct: number;
  max_position_size: number;
  allowed_start_time: string;
  allowed_end_time: string;
  is_active: number;
}
