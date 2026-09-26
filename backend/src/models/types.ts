export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: 'trader' | 'admin';
  timezone: string;
  currency: string;
  subscription_tier: 'FREE' | 'PRO' | 'PREMIUM';
  is_active: number;
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
}

export interface RawDeal {
  id: string;
  account_id: string;
  deal_id: string;
  order_id: string;
  position_id: string;
  symbol: string;
  type: number; // 0: BUY, 1: SELL
  entry: number; // 0: IN, 1: OUT, 2: INOUT, 3: OUT_BY
  volume: number;
  price: number;
  commission: number;
  swap: number;
  profit: number;
  fee: number;
  price_sl: number;
  price_tp: number;
  time: string;
  time_msc?: number;
  magic: number;
  comment?: string;
  external_id?: string;
  reason?: number;
  created_at: string;
}

export interface RawOrder {
  id: string;
  account_id: string;
  order_id: string;
  symbol: string;
  type: number;
  state: number;
  volume_initial: number;
  volume_current: number;
  price_open: number;
  price_sl: number;
  price_tp: number;
  time_setup: string;
  time_done?: string;
  time_expiration?: string;
  magic: number;
  comment?: string;
  external_id?: string;
  created_at: string;
}

export interface RawOpenPosition {
  id: string;
  account_id: string;
  position_id: string;
  ticket: string;
  symbol: string;
  type: number; // 0: BUY, 1: SELL
  magic: number;
  identifier?: string;
  reason?: number;
  volume: number;
  price_open: number;
  price_sl: number;
  price_tp: number;
  price_current: number;
  swap: number;
  profit: number; // Live floating profit
  comment?: string;
  external_id?: string;
  time: string;
  time_msc?: number;
  time_update?: string;
  time_update_msc?: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface ReconstructedPosition {
  id: string;
  account_id: string;
  position_id: string;
  symbol: string;
  position_type: 'BUY' | 'SELL';
  total_volume: number;
  entry_price_avg: number;
  exit_price_avg?: number;
  current_price?: number;
  floating_profit?: number;
  magic?: number;
  comment?: string;
  external_id?: string;
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
  is_hedged: number;
  created_at: string;
  updated_at: string;
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

export interface TradeJournal {
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
  emotion_state?: 'DISCIPLINED' | 'FOMO' | 'FEARFUL' | 'GREEDY' | 'ANXIOUS' | 'CONFIDENT';
  mistake_id?: string;
  lesson_learned?: string;
  voice_transcript?: string;
  trader_notes?: string;
  ai_feedback?: string;
  is_reviewed: number;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RiskRule {
  id: string;
  user_id: string;
  account_id?: string;
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
  created_at: string;
  updated_at: string;
}

export interface TraderProgression {
  id: string;
  user_id: string;
  current_xp: number;
  current_level: number;
  current_streak_days: number;
  longest_streak_days: number;
  total_trades_reviewed: number;
  rule_compliance_rate: number;
  last_activity_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  category: 'DISCIPLINE' | 'ANALYSIS' | 'CONSISTENCY' | 'RISK_MANAGEMENT';
  xp_reward: number;
  icon: string;
  unlocked?: boolean;
  unlocked_at?: string;
}

export interface SyncCheckpoint {
  id: string;
  account_id: string;
  last_deal_id?: string;
  last_deal_time?: string;
  last_order_id?: string;
  last_order_time?: string;
  sync_status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  deals_count: number;
  positions_count: number;
  trades_count: number;
  started_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'SYNC' | 'RISK' | 'REVIEW' | 'REPORT' | 'SYSTEM';
  is_read: number;
  link?: string;
  created_at: string;
}

export interface SyncReconciliation {
  accountId: string;
  ordersProcessed: number;
  dealsProcessed: number;
  openPositionsProcessed: number;
  positionsReconstructed: number;
  closedTradesCount: number;
  openTradesCount: number;
  skippedDuplicates: number;
  reconciliation: {
    mt5DealsCount: number;
    dbDealsCount: number;
    mt5OrdersCount: number;
    dbOrdersCount: number;
    mt5OpenPositionsCount: number;
    dbOpenPositionsCount: number;
    status: 'SYNCHRONIZED' | 'SYNC ATTENTION REQUIRED';
  };
  lastSyncTime: string;
}
