const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('alpha_coach_token');
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // If unauthorized on protected route, redirect or clear token
      // localStorage.removeItem('alpha_coach_token');
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'An unexpected error occurred.');
    }

    return data;
  }

  // Auth
  async register(body: any) {
    return this.request('/auth/register', { method: 'POST', body: JSON.stringify(body) });
  }

  async login(body: any) {
    return this.request('/auth/login', { method: 'POST', body: JSON.stringify(body) });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // Accounts
  async getAccounts() {
    return this.request<{ accounts: any[] }>('/accounts');
  }

  async updateAccount(id: string, body: any) {
    return this.request(`/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
  }

  async deleteAccount(id: string) {
    return this.request(`/accounts/${id}`, { method: 'DELETE' });
  }

  // Trades & Journal
  async getTrades(params: Record<string, any> = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        searchParams.append(k, String(v));
      }
    });
    return this.request<{ trades: any[]; pagination: any }>(`/trades?${searchParams.toString()}`);
  }

  async getTradeDetails(positionId: string) {
    return this.request(`/trades/${positionId}`);
  }

  async updateTradeReview(positionId: string, body: any) {
    return this.request(`/reviews/trade/${positionId}`, { method: 'PUT', body: JSON.stringify(body) });
  }

  async addTradeScreenshot(body: any) {
    return this.request('/reviews/screenshots', { method: 'POST', body: JSON.stringify(body) });
  }

  async getMistakeTags() {
    return this.request<{ mistakeTags: any[] }>('/reviews/mistake-tags');
  }

  // Analytics
  async getAnalytics(params: Record<string, any> = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        searchParams.append(k, String(v));
      }
    });
    return this.request<{ overview: any }>(`/analytics/overview?${searchParams.toString()}`);
  }

  // Strategy Lab
  async getStrategies() {
    return this.request<{ strategies: any[] }>('/strategies');
  }

  async getStrategyAnalytics(accountId?: string) {
    const query = accountId ? `?accountId=${accountId}` : '';
    return this.request<any>(`/strategies/analytics${query}`);
  }

  async createStrategy(body: any) {
    return this.request('/strategies', { method: 'POST', body: JSON.stringify(body) });
  }

  async deleteStrategy(id: string) {
    return this.request(`/strategies/${id}`, { method: 'DELETE' });
  }

  // Session & Symbol Intelligence
  async getSessionAnalytics(accountId?: string) {
    const query = accountId ? `?accountId=${accountId}` : '';
    return this.request<any>(`/sessions/analytics${query}`);
  }

  async getSymbolAnalytics(accountId?: string) {
    const query = accountId ? `?accountId=${accountId}` : '';
    return this.request<{ symbols: any[] }>(`/symbols/analytics${query}`);
  }

  // Risk Guardian
  async getRiskRules(accountId?: string) {
    const query = accountId ? `?accountId=${accountId}` : '';
    return this.request<{ rules: any }>(`/risk/rules${query}`);
  }

  async updateRiskRules(body: any, accountId?: string) {
    const query = accountId ? `?accountId=${accountId}` : '';
    return this.request<{ rules: any }>(`/risk/rules${query}`, { method: 'PUT', body: JSON.stringify(body) });
  }

  async getRiskAlerts(accountId?: string) {
    const query = accountId ? `?accountId=${accountId}` : '';
    return this.request<{ alerts: any[] }>(`/risk/alerts${query}`);
  }

  async acknowledgeAlert(alertId: string) {
    return this.request(`/risk/alerts/${alertId}/acknowledge`, { method: 'POST' });
  }

  async getRiskMonitor(accountId: string) {
    return this.request<{ monitor: any }>(`/risk/monitor?accountId=${accountId}`);
  }

  // Voice Journaling
  async parseVoice(transcript: string) {
    return this.request('/voice/parse', { method: 'POST', body: JSON.stringify({ transcript }) });
  }

  // Gamification
  async getGamificationProfile() {
    return this.request<any>('/gamification/profile');
  }

  // AI Trading Coach & DNA
  async getTraderDNA(accountId?: string) {
    const query = accountId ? `?accountId=${accountId}` : '';
    return this.request<{ dna: any }>(`/ai/trader-dna${query}`);
  }

  async askAICoach(question: string, accountId?: string) {
    return this.request('/ai/chat', { method: 'POST', body: JSON.stringify({ question, accountId }) });
  }

  // Reports & Export
  async getReport(type: 'WEEKLY' | 'MONTHLY', accountId?: string, startDate?: string, endDate?: string) {
    const query = new URLSearchParams({ type, ...(accountId && { accountId }), ...(startDate && { startDate }), ...(endDate && { endDate }) }).toString();
    return this.request<{ report: any }>(`/reports/generate?${query}`);
  }

  getExportCSVUrl(accountId?: string) {
    const query = accountId ? `?accountId=${accountId}` : '';
    return `${API_BASE_URL}/reports/export/csv${query}`;
  }

  // MT5 Bridge
  async pairBridgeDevice(deviceName: string) {
    return this.request<{ deviceId: string; deviceToken: string }>('/mt5/bridge/pair', { method: 'POST', body: JSON.stringify({ deviceName }) });
  }

  async getBridgeDevices() {
    return this.request<{ devices: any[] }>('/mt5/bridge/devices');
  }

  async revokeBridgeDevice(id: string) {
    return this.request(`/mt5/bridge/devices/${id}`, { method: 'DELETE' });
  }

  async getBridgeStatus() {
    return this.request('/mt5/status');
  }

  async triggerDirectSync(payload: any) {
    return this.request('/mt5/sync', { method: 'POST', body: JSON.stringify(payload) });
  }

  // Notifications
  async getNotifications() {
    return this.request<{ notifications: any[]; unreadCount: number }>('/notifications');
  }

  async markAllNotificationsRead() {
    return this.request('/notifications/mark-all-read', { method: 'POST' });
  }

  async markNotificationRead(id: string) {
    return this.request(`/notifications/${id}/read`, { method: 'PATCH' });
  }

  // Admin
  async getAdminOverview() {
    return this.request('/admin/overview');
  }
}

export const api = new ApiClient();
