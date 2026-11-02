# Arcade Fx Architecture: MT5 Bot Management System

This document outlines the distributed architecture, security model, and communication protocols connecting the **Arcade Fx Cloud Management Console** (`arcadefx.live`) with subscriber **MT5 Bot Agents** running on client Windows PCs or VPS instances.

---

## 1. High-Level System Topology

```mermaid
flowchart TD
    subgraph Cloud["Arcade Fx Cloud (Vercel / Supabase)"]
        UI["Web & Mobile PWA (React)"]
        API["Node / Express API Gateway"]
        DB[("PostgreSQL / Supabase RLS")]
        Billing["Billing Engine (Stripe / M-Pesa)"]
    end

    subgraph UserMachine["Subscriber Machine (Windows PC / VPS)"]
        subgraph AgentService["MT5 Bot Agent (Windows Service / Task)"]
            Agent["Agent Runtime (Python)"]
            LocalLimits[("Local Hard Limits (local_limits.json)")]
            EventQueue[("SQLite Offline Event Queue")]
            CredStore["Windows Credential Store"]
        end
        subgraph MT5Terminal["MetaTrader 5"]
            Terminal["MT5 Client Terminal (64-bit)"]
            Engine["MT5-OO1 Bot Engine / PythonBridgeEA"]
            Broker["Broker Server (IC Markets, etc.)"]
        end
    end

    UI -->|HTTPS / REST / WebSocket| API
    API <--> DB
    API <--> Billing

    Agent -->|Outbound HTTPS Poll / Heartbeat 15-30s| API
    Agent -.->|Read Only| LocalLimits
    Agent <-->|Local Outbox/Inbox| EventQueue
    Agent <-->|Win32 IPC / MetaTrader5 API| Terminal
    Terminal <-->|Encrypted FIX/Binary Protocol| Broker
```

> [!IMPORTANT]
> **Outbound-Only Connectivity**: The agent initiates all communication. No inbound ports (TCP/UDP) are ever opened on the subscriber's machine or VPS. The cloud cannot initiate raw socket connections into the user's network.

---

## 2. Secure Pairing Protocol

```mermaid
sequenceDiagram
    autonumber
    actor User as Trader (Browser/Phone)
    participant Cloud as Arcade Fx Cloud API
    participant Agent as MT5 Bot Agent (VPS/PC)
    participant CredStore as Windows Credential Store

    User->>Cloud: Request Pairing Code (POST /api/v1/bot/pairing-code)
    Cloud-->>User: Display 6-character Code (e.g. ABC123, 10 min expiry)
    User->>Agent: Enter pairing code via CLI or run_agent.bat
    Agent->>Cloud: POST /api/v1/bot/pair (pairingCode, instanceName, engineVersion)
    Cloud->>Cloud: Validate code, mark claimed, generate 64-char Device Token
    Cloud->>Cloud: Store SHA-256 hash in device_tokens table
    Cloud-->>Agent: Return instanceId, plain Device Token, signingSecret
    Agent->>CredStore: Securely store Device Token & signingSecret in OS store
    Agent->>Cloud: First Heartbeat (POST /api/v1/bot/heartbeat)
    Cloud-->>User: Console displays instance ONLINE
```

---

## 3. Cloud Command Verification & Local Risk Ceiling Supremacy

Every cloud command undergoes dual-layer validation:

1. **Cloud Server Validation:** Ensures user has an active entitlement, checks reported local risk ceiling snapshot, and signs the command.
2. **Local Agent Validation:** The agent verifies the HMAC signature, checks nonce replay protection and expiration, and compares requested values against `local_limits.json`.

```mermaid
sequenceDiagram
    autonumber
    actor User as Trader (Phone/PWA)
    participant Cloud as Arcade Fx Cloud
    participant Agent as MT5 Bot Agent
    participant LocalFile as local_limits.json
    participant Engine as MT5 Engine

    User->>Cloud: Dispatch Command (e.g. update_config riskPercent=2.0)
    Cloud->>Cloud: Check risk_limits_local_snapshot (ceiling=1.0%)
    alt Requested risk > Local Ceiling
        Cloud-->>User: REJECT 400: Exceeds local machine hard ceiling (1.0%). Local limits win.
    else Within Limits
        Cloud->>Cloud: Sign with HMAC-SHA256, attach nonce, set 60s expiresAt
        Cloud->>Cloud: Queue in bot_commands (status: QUEUED)
        Agent->>Cloud: Poll Pending Commands (POST /api/v1/bot/commands/poll)
        Cloud-->>Agent: Return signed command payload
        Agent->>Agent: Verify HMAC signature using local Device Token
        Agent->>Agent: Verify timestamp (!expired) & nonce (!replayed)
        Agent->>LocalFile: Compare parameters against local_limits.json
        alt Local Hard Limit Exceeded
            Agent->>Cloud: POST /api/v1/bot/commands/ack (status: FAILED, error: Blocked by local limits)
        else Approved
            Agent->>Engine: Execute safe action (start/stop/pause/close_all)
            Agent->>Cloud: POST /api/v1/bot/commands/ack (status: EXECUTED, result: OK)
        end
        Cloud-->>User: UI updates state to EXECUTED
    end
```

---

## 4. Offline Resilience & Queueing

If internet connectivity to the Arcade Fx cloud drops:
- **Autonomous Local Protection:** The bot continues running strictly within `local_limits.json` rules. The broker continues enforcing hard stop-losses and take-profits on the broker's servers.
- **SQLite Outbox:** Telemetry events and deal records are stored in a local SQLite file (`agent_events.db`).
- **Idempotent Sync:** When internet connectivity resumes, queued events are flushed in chronological order with unique event IDs, preventing duplicate telemetry on the server.

---

## 5. Entitlement & Subscription Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Trial: Signup
    Trial --> Active: Paid Subscription (Stripe / M-Pesa)
    Active --> PastDue: Payment Failed
    PastDue --> GracePeriod: 3-Day Grace Period
    GracePeriod --> Active: Payment Recovered
    GracePeriod --> Canceled: Grace Period Expired
    Canceled --> [*]

    state Active {
        [*] --> FullExecution
        FullExecution: Can start bot and open new trades
    }

    state Canceled {
        [*] --> PositionSafeguard
        PositionSafeguard: Block new trade entries
        PositionSafeguard: Actively manage and close existing open positions per SL/TP
    }
```
