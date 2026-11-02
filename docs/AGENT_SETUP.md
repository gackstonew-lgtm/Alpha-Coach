# MT5 Bot Agent: Subscriber Setup & Installation Guide

This guide walks subscribers through installing and pairing the **Arcade Fx MT5 Bot Agent** on your Windows PC or Windows VPS running MetaTrader 5.

---

## 1. Prerequisites

Before installing the agent, ensure your machine satisfies:

- **Operating System:** Windows 10, Windows 11, or Windows Server 2019 / 2022 (64-bit).
- **Python:** Python 3.10, 3.11, or 3.12 (64-bit). Ensure **"Add Python to PATH"** was checked during installation.
- **MetaTrader 5:** Official 64-bit MetaTrader 5 terminal installed and already logged into your broker account (Demo, Live, or Prop Firm).
- **MT5 Algo Settings:** Open MetaTrader 5 $\rightarrow$ **Tools** $\rightarrow$ **Options** $\rightarrow$ **Expert Advisors**:
  - Check **"Allow algorithmic trading"**.
  - Check **"Allow WebRequest for listed URL"** (if using webhook alerts).

> [!NOTE]
> **No Open Inbound Ports Required**: The agent connects outward to `arcadefx.live` over standard HTTPS (port 443). You do not need to configure router port forwarding or inbound firewall exceptions.

---

## 2. Quick Installation (3 Steps)

### Step 1: Download or Clone the Agent Directory
Place the `agent/` folder on your machine (e.g. `C:\TradingBot\agent`):

```powershell
mkdir C:\TradingBot
cd C:\TradingBot
# Copy the agent files from your Arcade Fx repository into C:\TradingBot\agent
```

### Step 2: Install Python Dependencies
Open PowerShell or Command Prompt as Administrator and install the requirements:

```powershell
cd C:\TradingBot\agent
python -m pip install --upgrade pip
pip install -r requirements.txt
```

*(Includes `MetaTrader5`, `requests`, `cryptography`, `colorama`, and `keyring`)*

### Step 3: Run First-Time Secure Pairing
1. Log in to your Arcade Fx dashboard at [arcadefx.live](https://www.arcadefx.live) on your phone or PC.
2. Navigate to the **MT5 Bot** tab $\rightarrow$ click **"Pair New MT5 Bot"**.
3. Note your **6-character One-Time Pairing Code** (e.g. `ABC123`, valid for 10 minutes).
4. In your terminal, run the agent:

```powershell
python mt5_bot_agent.py --pair ABC123
```

The agent will:
- Contact the Arcade Fx cloud API.
- Claim the pairing session.
- Securely save your rotating 64-character device token into the **Windows Credential Manager** (`Windows Vault / DPAPI`).
- Create `local_limits.json` template with safe defaults.
- Begin sending 15–30 second heartbeats to your dashboard.

---

## 3. Configuring Local Hard Ceilings (`local_limits.json`)

Open `C:\TradingBot\agent\local_limits.json` in Notepad:

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

> [!IMPORTANT]
> **The Hard Ceiling Rule**:
> - If `allow_live_trading` is `false`, the cloud console CANNOT switch the bot to live trading under any circumstances.
> - If `max_risk_pct_ceiling` is `1.0`, any cloud configuration trying to set risk to 2.0% will be rejected by both the server and your local agent.
> - Local limits always win over cloud settings.

---

## 4. Running as a 24/7 Windows Service

To keep the bot running even when you log off your VPS:

### Option A: Windows Scheduled Task (Recommended for VPS)
Run the provided installer script in Administrator PowerShell:

```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
.\install_windows_service.ps1
```

This creates a scheduled task named **"ArcadeFx_MT5_Bot_Agent"** that starts automatically on system boot with highest privileges.

### Option B: Interactive Batch Launcher
Double-click `run_agent.bat` to run the agent in an interactive console window with colorized live logging.

---

## 5. Verifying Connection in the Web Console

1. Return to the **MT5 Bot** page on [arcadefx.live](https://www.arcadefx.live).
2. Your bot instance should show status **ONLINE** with a green pulse dot.
3. Check telemetry details:
   - Account number (masked: `****1234`).
   - Balance and equity matching your MT5 terminal.
   - Mode badge (**DEMO** or **LIVE**).
   - Local risk ceiling badge (`Cap: 1.0%`).
4. Test a safe command by clicking **"Pause"** or **"Resume"**. Observe the command state transition: `QUEUED` $\rightarrow$ `DELIVERED` $\rightarrow$ `EXECUTED`.

---

## 6. Updating the Agent

When a new bot version is released:
- The dashboard will display an update notification badge.
- Updates to trading logic are **never auto-applied mid-session**.
- Run the update script when all open trades are closed:
  ```powershell
  python mt5_bot_agent.py --check-update
  ```
