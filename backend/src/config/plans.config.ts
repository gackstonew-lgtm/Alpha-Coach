/**
 * Subscription Plans Catalog Configuration
 * Hard Rule 4: Do not hardcode prices in business logic code.
 * Configure plan tiers, prices, instance limits, and features here.
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
    priceMonthlyCents: 4900, // $49.00 / month
    priceAnnualCents: 47000, // $470.00 / year ($39.16/mo)
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
    priceMonthlyCents: 9900, // $99.00 / month
    priceAnnualCents: 95000, // $950.00 / year ($79.16/mo)
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
    priceMonthlyCents: 24900, // $249.00 / month
    priceAnnualCents: 239000, // $2,390.00 / year ($199.16/mo)
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

export const getPlanByCode = (code: string): PlanConfig | undefined => {
  return SUBSCRIPTION_PLANS.find(p => p.code.toLowerCase() === code.toLowerCase());
};

export default SUBSCRIPTION_PLANS;
