/**
 * MT5 Bot Cloud Management API Service
 */

import { api } from './api';

export interface BotInstance {
  id: string;
  user_id: string;
  account_id?: string;
  instance_name: string;
  mode: 'DEMO' | 'LIVE' | 'PROP';
  status: 'ONLINE' | 'OFFLINE' | 'STALE';
  engine_version: string;
  symbol_set: string | string[];
  last_heartbeat_at?: string;
  last_error?: string;
  uptime_seconds: number;
  max_risk_pct_ceiling?: number;
  max_lots_ceiling?: number;
  max_drawdown_pct_ceiling?: number;
  live_trading_allowed_locally?: number;
  queued_commands_count?: number;
  created_at: string;
  updated_at: string;
}

export interface BotCommand {
  id: string;
  command_type: string;
  payload_json: string;
  status: 'QUEUED' | 'DELIVERED' | 'EXECUTED' | 'FAILED';
  executed_at?: string;
  result_json?: string;
  error_message?: string;
  created_at: string;
  expires_at: string;
}

export interface BotConfig {
  version: number;
  symbols_enabled: string[];
  session_filters: Record<string, boolean>;
  risk_percent: number;
  max_trades_per_day: number;
  notifications: Record<string, boolean>;
}

const req = (path: string, options: RequestInit = {}): Promise<any> => {
  return (api as any).request(path, options);
};

export const botApi = {
  async getInstances(): Promise<BotInstance[]> {
    const res = await req('/bot/instances');
    return res.instances || [];
  },

  async getInstanceDetail(id: string): Promise<{ instance: BotInstance; recentEvents: any[] }> {
    return await req(`/bot/instances/${id}`);
  },

  async generatePairingCode(): Promise<{ pairingCode: string; expiresAt: string }> {
    return await req('/bot/pairing/generate-code', { method: 'POST', body: JSON.stringify({}) });
  },

  async dispatchCommand(
    instanceId: string,
    commandType: 'start' | 'stop' | 'pause' | 'resume' | 'close_all' | 'kill_switch' | 'update_config',
    payload: Record<string, any> = {}
  ): Promise<{ success: boolean; commandId?: string; error?: string }> {
    return await req(`/bot/instances/${instanceId}/command`, {
      method: 'POST',
      body: JSON.stringify({ commandType, payload })
    });
  },

  async getCommands(instanceId: string): Promise<BotCommand[]> {
    const res = await req(`/bot/instances/${instanceId}/commands`);
    return res.commands || [];
  },

  async updateConfig(
    instanceId: string,
    config: {
      symbolsEnabled: string[];
      sessionFilters: Record<string, boolean>;
      riskPercent: number;
      maxTradesPerDay: number;
      notifications: Record<string, boolean>;
    }
  ): Promise<{ success: boolean; version?: number; error?: string }> {
    return await req(`/bot/instances/${instanceId}/config`, {
      method: 'POST',
      body: JSON.stringify(config)
    });
  },

  async revokeToken(instanceId: string): Promise<{ success: boolean; message: string }> {
    return await req(`/bot/instances/${instanceId}/tokens/revoke`, {
      method: 'POST',
      body: JSON.stringify({})
    });
  },

  async generateTelegramLinkCode(): Promise<{ linkCode: string; botUsername: string }> {
    return await req('/bot/telegram/link-code', {
      method: 'POST',
      body: JSON.stringify({})
    });
  }
};

export default botApi;
