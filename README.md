# Arcade Fx - MT5 Bot Management & Forex Intelligence OS

**Arcade Fx** is a professional, secure MT5 bot management platform, automated trade journaling, and quantitative performance operating system designed for modern discretionary and systematic MetaTrader 5 (MT5) traders.

Arcade Fx provides cloud-to-local orchestration for the **MT5-OO1** trading bot (Python engine + PythonBridgeEA), enabling traders to monitor, configure, and safely command their local bot instances from web and mobile PWA, while maintaining rigorous zero-knowledge security and local hard risk limits.

---

## 🏗️ Architecture & Security Principles

```
Local MT5 Terminal + MT5-OO1 Bot (User's Windows PC / VPS)
       ↓ (Local execution next to terminal; Outbound HTTPS/WebSocket ONLY)
MT5 Bot Agent (`agent/` service / NSSM)
       ↓ (TLS 1.3, Signed Commands, Rotating Device Tokens)
Arcade Fx Cloud Backend (`arcadefx.live` / Vercel Serverless API)
       ↓
Relational Database (Supabase PostgreSQL / Persistent SQLite)
       ↓
Arcade Fx Web & Mobile PWA (`/bot`, `/journal`, `/performance`, `/charts`)
       ↓
Bot Assistant (Grounded In Real MT5 Data Only)
```

### 🔒 Zero-Password Security Model & Local Hard Limits
1. **Zero Credential Transmission**: Arcade Fx NEVER asks for, stores, or transmits MT5 or broker passwords. The bot engine executes locally on the user's machine next to the MT5 terminal.
2. **Safe Cloud Commands Only**: Cloud commands are strictly restricted to safe operations (`start`, `stop`, `pause`, `resume`, `close_all`, `kill_switch`). The cloud can NEVER enable live trading or raise risk limits above local machine ceilings.
3. **Local Hard Ceilings Always Win**: Local risk settings on the user's machine act as an unbreachable ceiling. Live trading requires explicit local physical confirmation.
4. **Subscription Entitlements**: Subscription status is verified on both cloud and local agent. When expired or cancelled, new trade openings are blocked while the local bot continues managing open positions with stops and take profits until closed.
5. **Feature Flag `public_subscriptions`**: Defaults to `OFF` until regulatory and legal checks are complete.

---

## ⚡ Key Features

1. **MT5 Bot Management (`/bot`)**:
   - Multi-instance fleet monitoring: Status (`ONLINE`, `OFFLINE`, `STALE`), mode (`DEMO`, `LIVE`, `PROP`), uptime, version, and heartbeat telemetry.
   - Cloud Safe Controls: Start, Stop, Pause, Resume, Close All Positions (type-to-confirm), and Emergency Kill Switch.
   - Safe Configuration Editor: Symbol toggles, session filters, risk percent bounded by local ceilings, max trades per day.
   - Real-Time Decision Telemetry: Active positions, daily P/L, daily loss & drawdown remaining, market regime, and "why no trade" log.
   - Balance tier & sizing matrix from MT5-OO1.

2. **Bot Assistant (Formerly AI Coach)**:
   - Inquiries answered strictly grounded in your empirical MT5 database.
   - No hallucinated trades or predictive financial claims.

3. **Automatic Trade Reconstruction & Lifecycle Engine**:
   - Reconstructs position lifecycles from raw MT5 deals & orders (Entry Deal → Scale-In → Partial Exit → Final Exit).
   - Computes weighted average entry/exit prices, gross P/L, commissions, swaps, fees, net P/L, holding durations, and initial R-Multiples.
   - Categorizes sessions: London, New York, London/NY Overlap, Asia, and Off-Hours.

4. **Executive Performance Dashboard & True Track Record**:
   - Live account balance, equity, win rate, profit factor, max drawdown, and expectancy.
   - Strict separation of real execution records vs sample/demo data (sample data visibly labeled "SAMPLE DATA" and isolated).

5. **Multi-Account MT5 Hub & Journaling**:
   - Full support for multi-account portfolios with consolidated or isolated account views.
   - Automated journal generation for every MT5 deal.

---

## 🚀 Getting Started

### Local Development
```bash
# Install dependencies
npm install

# Run secret leak preflight scan
npm run scan:secrets

# Run backend test suite
npm run test:backend

# Run MT5 Bridge test suite
npm run test:bridge

# Build frontend and API production bundle
npm run build:frontend
npm run build:api
```

---

## 📚 Technical Documentation
- **[System Architecture](file:///docs/ARCHITECTURE.md)**: Cloud-to-agent protocol, signed commands, and safety boundaries.
- **[Security Threat Model](file:///docs/SECURITY.md)**: Threat vector analysis, RLS policies, credential isolation.
- **[Compliance Checklist](file:///docs/COMPLIANCE_CHECKLIST.md)**: Jurisdictional and regulatory readiness requirements.
- **[Agent Setup Guide](file:///docs/AGENT_SETUP.md)**: Step-by-step setup for running MT5 Bot Agent on Windows VPS.
