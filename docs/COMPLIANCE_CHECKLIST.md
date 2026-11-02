# Arcade Fx Compliance & Legal Due Diligence Checklist

> [!WARNING]
> **REGULATORY DISCLAIMER**: This software makes NO CLAIM of being compliant, licensed, or authorized by any financial regulatory authority. This checklist serves as an internal engineering and legal readiness audit of questions that must be formally reviewed and signed off by qualified legal counsel in each relevant jurisdiction before enabling public subscriptions (`public_subscriptions = true`) or charging fees for MT5 Bot management.

---

## 1. Regulatory Status & Licensing Thresholds

Before enabling public billing or charging retail or prop traders, legal counsel must review:

- [ ] **Investment Advice vs Software Utility:**
  - Does providing an algorithmic execution manager (even one running locally on the user's machine) constitute an *investment advice* service, a *commodity trading advisor (CTA)* activity, or a *managed account* service under:
    - **United States:** CFTC (Commodity Futures Trading Commission) / NFA (National Futures Association) Rule 4.14(a)(9) for non-personalized automated trading software publishers.
    - **United Kingdom:** FCA (Financial Conduct Authority) Regulated Activities Order (RAO) Article 53 (advising on investments) and Article 37 (managing investments).
    - **European Union:** MiFID II (Markets in Financial Instruments Directive) Article 4(1)(4) on investment advice and algorithmic trading governance.
    - **Kenya / East Africa:** Capital Markets Authority (CMA) online forex trading regulations (2017) regarding non-dealing online forex brokers vs software/technical solution vendors.
    - **Australia / Singapore:** ASIC / MAS financial advisory licensing exemptions for generic algorithmic software tools.
- [ ] **Discretionary vs Non-Discretionary Classification:**
  - Verify that because parameters (risk cap, stop loss, symbol filters) are selected by the user, and hard limits run locally on the user's hardware, the software is legally recognized as a *non-discretionary execution tool* rather than a discretionary asset manager.
- [ ] **Prop Firm Third-Party Software Rules:**
  - Ensure marketing materials do not promise compliance with specific prop firm terms (FTMO, FundedNext, The Funded Trader, MFF, etc.) and that the user's sole responsibility is clearly acknowledged.

---

## 2. Terms of Service & Consumer Protection

- [ ] **Mandatory Acceptance & Version Tracking:**
  - `tos_acceptances` table stores cryptographic record of user acceptance (`tos_version`, `privacy_version`, `risk_disclosure_version`, IP address, timestamp, user agent).
  - Version bumps must trigger re-acceptance modal prior to dashboard access.
- [ ] **18+ Age Gate & Verification:**
  - Ensure user explicit confirmation of 18+ legal majority during registration and TOS acceptance.
  - Verification that services are not targeted at minors under COPPA and equivalent international regulations.
- [ ] **Restricted Jurisdictions / Sanctions Screening:**
  - Configurable blocked countries (`COMPLIANCE_CONFIG.blockedCountries`) preventing registration or token issuance to users in sanctioned regimes (OFAC, UN, EU sanctions lists).
- [ ] **Clear Refund, Cancellation & Grace Period Policy:**
  - Disclose 3-day grace period for subscription renewals.
  - Explicitly document that subscription expiration halts opening of new trades while existing open positions are safely monitored until natural stop-loss / take-profit closure.
  - Zero-cancellation fee and immediate self-serve downgrade in Stripe Customer Portal.

---

## 3. Marketing Claims, Track Records & Anti-Fraud Compliance

- [ ] **Strict Prohibition of Hypothetical/Cherry-Picked Claims:**
  - Zero unverified track records on public landing pages or marketing materials.
  - FTC (Federal Trade Commission) and ASA (Advertising Standards Authority) guidelines on trading software advertising: no claims of "guaranteed profit", "financial freedom", or unrealistic win rates.
- [ ] **Sample Size & Variance Disclaimers:**
  - All performance dashboards must warn users when sample size $N < 30$ trades.
  - Win rate must display statistical confidence intervals (Wilson 95% CI) rather than point estimates.
- [ ] **Permanent High-Risk Warnings:**
  - Prominent risk disclosure on all pages displaying trading performance or equity curves.

---

## 4. Data Protection & Cybersecurity Sovereignty

- [ ] **Zero-Password Architecture:**
  - Under no circumstances does the server receive, store, or transmit broker login credentials or MT5 master/investor passwords.
- [ ] **Outbound-Only Connection Model:**
  - Agent makes outbound HTTPS/REST and WebSocket calls only; no inbound ports opened on user's machine.
- [ ] **Cryptographic Command Authentication:**
  - All cloud-to-agent commands signed with HMAC-SHA256, carrying nonce and 60-second expiry timestamp to prevent replay attacks.
- [ ] **Local Ceiling Supremacy:**
  - Client machine local hard limits (`local_limits.json`) strictly override cloud settings.
  - Live trading switch locked behind physical local confirmation.
- [ ] **GDPR / CCPA Sovereignty Rights:**
  - Full automated machine-readable JSON data export (`GET /api/v1/compliance/export-data`).
  - Full permanent account deletion flow (`POST /api/v1/compliance/delete-account`).

---

## 5. Tax, Invoicing & Payment Provider Due Diligence

- [ ] **Merchant of Record & Tax Compliance:**
  - Stripe Tax or merchant-of-record integration to collect and remit digital services VAT / GST across jurisdictions.
  - Mobile money compliance (M-Pesa Daraja, Paystack, Flutterwave) for East Africa / West Africa operations.
- [ ] **Feature Flag Guardrail:**
  - Ensure `public_subscriptions` feature flag remains strictly `false` by default until all above checklist items are signed off in writing by legal counsel.
