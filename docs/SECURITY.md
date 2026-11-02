# Arcade Fx Security Model & Threat Assessment

This document specifies the security architecture, cryptographic safeguards, and threat mitigation models governing the **Arcade Fx MT5 Bot Management Platform**.

---

## 1. Core Security Tenets

1. **Zero-Password Isolation:** The cloud platform NEVER requests, transmits, handles, or stores broker login passwords or MT5 investor/master credentials.
2. **Local Machine Hard Ceiling Supremacy:** The cloud can never override local limits set in `local_limits.json`. Local limits always take precedence.
3. **Outbound-Only Communication:** Agents never listen on public network ports. All interactions are client-initiated over TLS.
4. **Physical Local Confirmation for Live Trading:** The cloud can NEVER toggle live trading without local machine configuration (`allow_live_trading: true`).
5. **Fail-Safe Position Protection:** In the event of subscription lapse, network loss, or cloud outage, existing open trades are never abandoned; they remain actively managed by their stop-loss and take-profit orders on the broker's servers.

---

## 2. Threat Model & Mitigation Matrix

| Threat Scenario | Vector | Mitigation Implemented |
|---|---|---|
| **Cloud Server Compromise** | Malicious actor gains administrative access to cloud API | Even with full DB access, the attacker CANNOT open trades exceeding the local risk cap or lot ceiling, CANNOT enable live trading on demo instances, and CANNOT access broker accounts because **no broker passwords exist on the server**. Local limits win. |
| **Command Tampering / Man-in-the-Middle** | Network interceptor modifies command parameters in transit | All cloud commands are signed using HMAC-SHA256 with the unique per-device token. Tampered parameters produce invalid signatures and are discarded by the agent. |
| **Replay Attacks** | Adversary re-broadcasts intercepted commands (e.g. repeated `start` or `close_all`) | Commands carry cryptographic UUID nonces and strict 60-second timestamps (`expiresAt`). The agent caches seen nonces and rejects any command past its expiry. |
| **Rogue Token Theft from Server DB** | Attacker dumps the server's `device_tokens` table | Device tokens are hashed using SHA-256 before storage on the server (`token_hash`). The plain device token resides only in the subscriber's local OS credential store (Windows Credential Manager / DPAPI). |
| **Brute-Force Pairing Code Attack** | Attacker attempts to guess 6-character pairing codes | Codes expire in 10 minutes, are invalidated after a single use, and pairing routes are protected by aggressive per-IP and per-account rate limits (5 attempts/15 min). |
| **Cross-User Data Leaks** | Authenticated user queries another subscriber's instances or trades | Enforced via PostgreSQL Row-Level Security (RLS) in Supabase and parameterized queries in SQLite. Users can only select and mutate rows matching `auth.uid() = user_id`. |
| **Accidental Secret Leaks in Git** | Developer commits API keys or tokens into repository | Automated pre-commit scanner (`npm run scan:secrets`) runs before every commit. Blocks staging of keys, tokens, or private credentials. |

---

## 3. Cryptographic Command Signing Specification

Cloud-to-agent commands are signed using HMAC-SHA256:

$$\text{Signature} = \text{HMAC-SHA256}\Big(K_{\text{device}}, \quad \text{commandId} \mathbin{\Vert} \text{action} \mathbin{\Vert} \text{sortedJSON}(\text{params}) \mathbin{\Vert} \text{nonce} \mathbin{\Vert} \text{expiresAt}\Big)$$

Where:
- $K_{\text{device}}$ is the 64-character rotating device token shared exclusively during initial pairing.
- $\text{nonce}$ is a cryptographically unique random UUID v4 string.
- $\text{expiresAt}$ is an ISO 8601 UTC timestamp set to $T_{\text{dispatch}} + 60\text{ seconds}$.

```python
# Agent verification logic in mt5_bot_agent.py
def verify_command(cmd, device_token):
    # 1. Check expiration
    if datetime.fromisoformat(cmd['expiresAt']) < datetime.now(timezone.utc):
        return False, "Command has expired"

    # 2. Check nonce replay
    if is_nonce_seen(cmd['nonce']):
        return False, "Duplicate command nonce detected"

    # 3. Verify HMAC signature
    expected_sig = hmac.new(
        device_token.encode('utf-8'),
        payload_bytes,
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(cmd['signature'], expected_sig):
        return False, "Invalid cryptographic HMAC signature"

    return True, "Valid"
```

---

## 4. Local Hard Limits Engine (`local_limits.json`)

The subscriber's local agent reads `local_limits.json` on startup:

```json
{
  "allow_live_trading": false,
  "max_risk_pct_ceiling": 1.0,
  "max_lots_ceiling": 1.5,
  "max_drawdown_pct_ceiling": 5.0,
  "max_trades_per_day_ceiling": 5,
  "allowed_symbols": ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD"]
}
```

### The Inviolable Ceiling Rule:
When the cloud sends `update_config`:
```python
# In mt5_bot_agent.py
requested_risk = float(cmd['params'].get('riskPercent', local_limits['max_risk_pct_ceiling']))
if requested_risk > local_limits['max_risk_pct_ceiling']:
    agent_logger.warning(
        f"CLOUD REJECTED: Cloud requested risk={requested_risk}%, "
        f"but local ceiling is {local_limits['max_risk_pct_ceiling']}%. "
        f"Local ceiling enforced."
    )
    # Clamp to local ceiling
    effective_risk = local_limits['max_risk_pct_ceiling']
```

---

## 5. Row-Level Security (RLS) Policies

All database tables enforce strict tenant isolation in production Supabase PostgreSQL:

```sql
-- Example from migrations: bot_instances RLS
ALTER TABLE bot_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only read own instances"
  ON bot_instances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only update own instances"
  ON bot_instances FOR UPDATE
  USING (auth.uid() = user_id);
```

Admin actions bypass RLS only through secure service-role keys restricted to serverless API routes with mandatory immutable audit logging (`logAuditEvent`).
