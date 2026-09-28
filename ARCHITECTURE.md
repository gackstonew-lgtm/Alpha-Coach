# Meta Coach System Architecture

## 1. System Overview & Topology

Meta Coach is an institutional-grade, zero-password automated trading journal and quantitative performance platform designed for MetaTrader 5 (MT5) traders.

```mermaid
flowchart TD
    subgraph Client Environments
        MT5[MetaTrader 5 Terminal]
        Bridge[Python MT5 Bridge Daemon]
        Browser[React 18 PWA Web / Desktop App]
    end

    subgraph Edge & API Layer
        VercelEdge[Vercel Serverless / Edge Gateway]
        ExpressAPI[Meta Coach Express Engine (Node.js)]
        HealthMonitor[/health Health Contract]
    end

    subgraph Data & Storage Plane
        Supabase[(Supabase PostgreSQL 15)]
        RLS[Row Level Security Policies]
        FallbackDB[(In-Memory SQLite Fallback)]
    end

    MT5 -->|Local IPC API| Bridge
    Bridge -->|HTTPS sync / device token| VercelEdge
    Browser -->|PWA / HTTPS| VercelEdge
    VercelEdge --> ExpressAPI
    ExpressAPI --> HealthMonitor
    ExpressAPI --> RLS
    RLS --> Supabase
    ExpressAPI -.->|Database Outage Fallback| FallbackDB
```

---

## 2. Zero-Password Device Pairing Protocol

Meta Coach eliminates credential theft risks by enforcing a zero-password pairing architecture for MT5 terminals:

1. **Pairing Handshake**: The desktop bridge requests a 6-digit numeric pairing session code from `/api/v1/mt5/bridge/session`.
2. **User Authorization**: The trader opens `metacoach.io/pair` on their authenticated mobile or desktop browser and enters or approves the pairing token.
3. **Token Issuance**: The server generates a unique, cryptographically random permanent device token (`ac_bridge_...`) tied to the user ID and device fingerprint.
4. **Immediate Revocation**: The trader can instantly revoke any paired device from the Settings Hub or Bridge Accounts page, immediately terminating terminal access.

---

## 3. MT5 Deal Reconstruction Engine

MT5 emits non-atomic execution deals rather than aggregated trades. Meta Coach's deterministic reconstruction pipeline processes these deals with strict idempotency:

1. **Deal Ingestion**: Raw deal tickets (`ticket`, `order`, `position_id`, `volume`, `price`, `type`, `entry`) are recorded with a unique constraint on `(account_id, ticket)`. Duplicate sync payloads are automatically skipped.
2. **Position Aggregation**: Deals sharing the same `position_id` are grouped.
3. **Average Entry / Exit**: Multi-lot scale-ins and scale-outs calculate volume-weighted average prices (VWAP).
4. **Attribution**: Broker commissions and overnight swaps are aggregated into `net_profit = gross_profit + commission_total + swap_total`.
5. **Reconciliation**: If position status is ambiguous or partially closed, in-flight deals are tracked without mutating finalized trades.

---

## 4. Quantitative Analytics & Calculation Provenance

All metrics in Meta Coach adhere to mathematical standards:

| Metric | Formula | Provenance Classification |
|---|---|---|
| **Net Profit** | \(\sum(\text{Gross Profit} + \text{Commissions} + \text{Swaps})\) | **MT5 Execution Fact** |
| **Win Rate** | \(\frac{\text{Winning Trades}}{\text{Total Closed Trades}} \times 100\) | **MT5 Execution Fact** |
| **Profit Factor** | \(\frac{\sum \text{Gross Wins}}{\sum \vert \text{Gross Losses} \vert}\) | **MT5 Execution Fact** |
| **R-Multiple** | \(\frac{\text{Exit Price} - \text{Entry Price}}{\vert \text{Entry Price} - \text{Initial Stop Loss} \vert}\) | **MT5 Fact + Trader Input** |
| **Expectancy** | \((W \times \text{Avg Win}) - (L \times \text{Avg Loss})\) | **MT5 Execution Fact** |
| **Peak-to-Trough Drawdown** | \(\max_{t} (\text{Peak Equity}_t - \text{Current Equity}_t)\) | **MT5 Execution Fact** |
| **Behavioral Edge Score** | Bayesian clustering of setup discipline vs tilt risk | **AI Inference** |

---

## 5. Security Posture & Compliance

- **Strict Row Level Security (RLS)**: Every Supabase table enforces `user_id = auth.uid()` for all CRUD operations.
- **Content Security Policy (CSP)**: Strict headers configured via `vercel.json` preventing script injection, framing (`DENY`), and MIME sniffing.
- **Service Worker Isolation**: Service Worker caches only static application assets and offline fallback (`/offline.html`). All `/api/`, `supabase`, and auth endpoints are strictly bypassed.
- **Continuous Monitoring**: Health contract (`/health`, `/api/v1/health`) probes live database latency, Supabase credentials, and version provenance.
