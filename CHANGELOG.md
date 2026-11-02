# Changelog

All notable changes to Trader's Edge are documented in this file.

## [1.1.0] - 2026-11-02
### Added
- **MT5 Bot Management Platform (Stages 0–8)**:
  - MT5 Bot agent (`agent/mt5_bot_agent.py`) with local risk ceilings, HMAC command verification, replay protection, and offline queueing.
  - Bot Management UI (`frontend/src/pages/MT5BotPage.tsx`) with fleet monitoring, real-time telemetry, configuration editor, and Telegram notifications.
  - Admin Command Console (`frontend/src/pages/AdminPage.tsx`) with emergency global kill switch, user suspensions, and fleet diagnostics.
  - Empirical Performance Transparency with Wilson score confidence intervals, sample size guardrails, and risk disclosures.
  - Legal & Compliance Scaffolding with 18+ age gate, blocked jurisdictions, and draft Terms of Service / Disclaimers.
  - Multi-tier billing and subscriptions scaffolding with Stripe and Mobile Money adapters (strictly gated behind `public_subscriptions` flag).
  - Security architecture documentation, setup guides, and comprehensive test suites (120 backend tests, 20 bridge tests, 4 bot agent tests).
  - Synchronized production serverless API bundles and Vercel production deployment.

## [1.0.6] - 2026-09-28
### Added
- **Production Hardening & Verification**:
  - Full audit of frontend, backend, serverless bundle, and bridge.
  - Root and frontend `vercel.json` production security headers (`CSP`, `HSTS`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`).
  - `/health` and `/api/v1/health` status endpoints reporting live database latency and provenance.
  - CI pipeline `.github/workflows/ci.yml` (backend test, bridge test, frontend build, serverless bundling).
  - Dependabot automated updates `.github/dependabot.yml`.
  - Global Error Boundary (`ErrorBoundary.tsx`) with user-friendly recovery UI and telemetry hooks.
  - Sentry integration wrappers (`frontend/src/services/sentry.ts` and `backend/src/services/logger.service.ts`).
  - Data Integrity verification panel (`DataIntegrityPanel.tsx`) showing live sync, deal count, and 0 reconciliation errors.
  - Calculation Provenance Badges (`MT5 Execution Fact`, `Trader Input`, `AI Inference`).
  - PWA auto-update prompt banner (`PwaUpdateBanner.tsx`) with instant service worker reload.
  - Seeded mathematical analytics benchmark test suite (`backend/tests/analytics.test.ts`) covering R-multiple, win rate, profit factor, drawdown, and expectancy.
  - System architecture documentation (`ARCHITECTURE.md`) and API reference (`API.md`).

## [1.0.5] - 2026-09-28
### Added
- **Public Site, SEO & Trust**:
  - Helmet-async dynamic metadata (`MetaHead.tsx`) across all marketing, auth, and legal pages.
  - Canonical URLs, Open Graph, and Twitter summary cards.
  - 1200x630 branded social share asset (`public/meta-coach-og.png`).
  - `robots.txt` and `sitemap.xml` strictly indexing public marketing routes.
  - Interactive Demo Insights terminal on landing page labelled "Demo Data".
  - 5-question FAQ with `FAQPage` JSON-LD structured data and `/faq` page.
  - Dedicated `/disclaimer` risk disclaimer page flagged for formal legal review.
  - Post-registration onboarding thank-you page (`/welcome`).
  - Support contact promise (`support@tradersedge.io` with guaranteed 24h response time).
  - Privacy-preserving Google Analytics 4 integration with cookie consent banner (`CookieConsentBanner.tsx`).
  - Custom on-brand 404 page (`NotFoundPage.tsx`).
  - Offline fallback page (`/offline.html`) and production service worker (`sw.js`).

## [1.0.4] - 2026-09-28
### Added
- **Comprehensive Settings Hub**:
  - 11 dedicated configuration sections: Profile, Security, MT5 Accounts, Trade Management, Risk Guardian, Journal Preferences, Notifications, Appearance, Billing, API & Webhooks, and Legal / About.
  - Responsive sub-navigation with mobile collapse and 44px touch targets.
  - Real-time debounced autosave via `SettingsContext` backed by PostgreSQL / SQLite.
  - Zero-Password 1-click terminal pairing and device revocation.
