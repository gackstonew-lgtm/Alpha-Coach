# Meta Coach REST API Reference

The Meta Coach REST API serves both the web PWA frontend and local MT5 Python bridge clients.
All endpoints are mounted under `/api/v1` and `/v1`.

## Base URLs
- Production: `https://alpha-coach-pi.vercel.app/api/v1`
- Local Development: `http://localhost:3000/api/v1`

---

## 1. System Health & Diagnostics
### `GET /health` / `GET /api/v1/health`
Returns system health, database latency, and build provenance.

**Response `200 OK`**:
```json
{
  "success": true,
  "status": "ONLINE",
  "service": "Meta Coach Performance API",
  "version": "1.0.6",
  "databaseProvider": "supabase",
  "databaseConnection": "healthy",
  "databaseLatencyMs": 14,
  "realQueryVerified": true,
  "environment": "production",
  "timestamp": "2026-09-28T21:00:00.000Z"
}
```

---

## 2. Authentication & Device Pairing
### `POST /api/v1/auth/register`
Creates a new trader account.
- **Body**: `{ "email": "trader@example.com", "password": "...", "firstName": "Alex" }`

### `POST /api/v1/auth/login`
Authenticates trader and returns session JWT.
- **Body**: `{ "email": "trader@example.com", "password": "..." }`

### `POST /api/v1/mt5/bridge/session`
Initiates a new pairing session from the MT5 desktop bridge.
- **Body**: `{ "deviceName": "Workstation Terminal", "localIp": "192.168.1.100" }`
- **Response**: `{ "sessionCode": "492014", "expiresAt": "2026-09-28T21:10:00.000Z" }`

### `POST /api/v1/mt5/bridge/session/:sessionCode/authorize`
Authorizes terminal using browser session.
- **Headers**: `Authorization: Bearer <supabase_jwt>`
- **Response**: `{ "success": true, "deviceId": "dev_..." }`

### `GET /api/v1/mt5/bridge/session/:sessionCode/poll`
Bridge polls until user approves; returns single-use device token.
- **Response**: `{ "status": "AUTHORIZED", "deviceToken": "ac_bridge_..." }`

---

## 3. MT5 Synchronization (Bridge Only)
### `POST /api/v1/mt5/sync`
Transmits MT5 account snapshot, open orders, and historical execution deals.
- **Headers**: `x-bridge-token: ac_bridge_...`
- **Body**:
```json
{
  "accountInfo": {
    "accountNumber": "1002345",
    "brokerName": "IC Markets",
    "serverName": "ICMarkets-Live01",
    "currency": "USD",
    "balance": 25400.50,
    "equity": 25400.50
  },
  "deals": [ ... ],
  "orders": [ ... ]
}
```
- **Response**: `{ "success": true, "dealsProcessed": 42, "positionsReconstructed": 21 }`

---

## 4. Trading Analytics & Performance
### `GET /api/v1/analytics`
Fetches comprehensive statistical performance overview.
- **Headers**: `Authorization: Bearer <jwt>`
- **Query Parameters**:
  - `accountId` *(optional)*: Filter by specific trading account or `ALL`
  - `symbol` *(optional)*: Filter by ticker (e.g. `XAUUSD`)
  - `session` *(optional)*: Filter by market session (`LONDON`, `NEW_YORK`, `ASIA`)
- **Response**: Returns `PerformanceOverview` object (win rate, profit factor, expectancy, equity curve).

### `GET /api/v1/trades`
Retrieves reconstructed trading positions with filters and pagination.
- **Query Parameters**: `accountId`, `status` (`OPEN` | `CLOSED`), `page`, `limit`
