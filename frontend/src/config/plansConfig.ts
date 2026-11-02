/**
 * Frontend Subscription Plans Catalog Configuration
 * Read dynamically from config; never hardcoded in UI components.
 */

export interface PlanConfig {
  code: string;
  name: string;
  description: string;
  priceMonthlyCents: number;
  priceAnnualCents: number;
  currency: string;
  maxInstances: number;
  maxAccounts: number;
  features: {
    paperTrading: boolean;
    liveExecution: boolean;
    telegramAlerts: boolean;
    emailAlerts: boolean;
    botAssistant: boolean;
    customRiskCeilings: boolean;
    multiVpsSupport: boolean;
    prioritySupport: boolean;
    fullAuditLogs: boolean;
  };
}

export const SUBSCRIPTION_PLANS: PlanConfig[] = [
  {
    code: 'starter',
    name: 'Starter',
    description: 'Essential automated execution & monitoring for single-account traders.',
    priceMonthlyCents: 4900,
    priceAnnualCents: 47000,
    currency: 'USD',
    maxInstances: 1,
    maxAccounts: 1,
    features: {
      paperTrading: true,
      liveExecution: true,
      telegramAlerts: false,
      emailAlerts: true,
      botAssistant: true,
      customRiskCeilings: true,
      multiVpsSupport: false,
      prioritySupport: false,
      fullAuditLogs: false
    }
  },
  {
    code: 'pro',
    name: 'Pro',
    description: 'Advanced multi-account trading with Telegram notifications and deep telemetry.',
    priceMonthlyCents: 9900,
    priceAnnualCents: 95000,
    currency: 'USD',
    maxInstances: 3,
    maxAccounts: 3,
    features: {
      paperTrading: true,
      liveExecution: true,
      telegramAlerts: true,
      emailAlerts: true,
      botAssistant: true,
      customRiskCeilings: true,
      multiVpsSupport: true,
      prioritySupport: true,
      fullAuditLogs: true
    }
  },
  {
    code: 'institutional',
    name: 'Elite / Institutional',
    description: 'High-capacity bot orchestration across proprietary desks and multi-VPS fleets.',
    priceMonthlyCents: 24900,
    priceAnnualCents: 239000,
    currency: 'USD',
    maxInstances: 10,
    maxAccounts: 10,
    features: {
      paperTrading: true,
      liveExecution: true,
      telegramAlerts: true,
      emailAlerts: true,
      botAssistant: true,
      customRiskCeilings: true,
      multiVpsSupport: true,
      prioritySupport: true,
      fullAuditLogs: true
    }
  }
];

export const formatPrice = (cents: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0
  }).format(cents / 100);
};

export default SUBSCRIPTION_PLANS;
