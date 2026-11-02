/**
 * Arcade Fx Regulatory & Compliance Configuration
 * Manages blocked jurisdictions, minimum age constraints, and policy versioning.
 *
 * NOTE: These settings represent operational compliance scaffolding and draft policies
 * intended for review by qualified legal counsel prior to activating public subscriptions.
 */

export interface ComplianceConfig {
  minUserAge: number;
  blockedCountries: string[];
  currentVersions: {
    tos: string;
    privacy: string;
    riskDisclosure: string;
    cookiePolicy: string;
  };
  disclaimerStatements: {
    highRisk: string;
    noAdvice: string;
    propFirmResponsibility: string;
    localCeilingSupremacy: string;
  };
}

const parseBlockedCountries = (): string[] => {
  const envBlocked = process.env.BLOCKED_COUNTRIES;
  if (envBlocked) {
    return envBlocked.split(',').map((c) => c.trim().toUpperCase()).filter(Boolean);
  }
  // Default restricted/sanctioned jurisdictions (ISO 3166-1 alpha-2)
  return ['KP', 'IR', 'CU', 'SY', 'RU', 'BY', 'MM', 'VE'];
};

export const COMPLIANCE_CONFIG: ComplianceConfig = {
  minUserAge: 18,
  blockedCountries: parseBlockedCountries(),
  currentVersions: {
    tos: '2026.1-draft',
    privacy: '2026.1-draft',
    riskDisclosure: '2026.1-draft',
    cookiePolicy: '2026.1-draft'
  },
  disclaimerStatements: {
    highRisk:
      'Trading foreign exchange and contracts for difference (CFDs) carries a high level of risk to your capital and may not be suitable for all investors. Leveraged products can result in losses exceeding your initial deposit.',
    noAdvice:
      'Arcade Fx is a technology software platform providing analytical tools, journaling, and local MT5 bot management. Arcade Fx does not provide investment advice, trading recommendations, managed accounts, or brokerage services.',
    propFirmResponsibility:
      'Subscribers are solely responsible for ensuring that automated bot execution conforms with the terms of use, drawdown rules, and copy-trading policies of their respective brokers or proprietary trading firms.',
    localCeilingSupremacy:
      'The cloud management console only issues safe operational requests. Local hard limits configured directly on the user machine always override cloud requests. Enabling live execution requires explicit local confirmation on the machine running MetaTrader 5.'
  }
};

export function isCountryBlocked(countryCode?: string): boolean {
  if (!countryCode) return false;
  return COMPLIANCE_CONFIG.blockedCountries.includes(countryCode.trim().toUpperCase());
}
