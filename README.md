# Alpha Coach - Automated MT5 Trading Journal & Trading Performance OS

**Alpha Coach** is a professional, secure, automated trading journaling and quantitative performance operating system designed for modern discretionary and systematic MetaTrader 5 (MT5) traders.

Alpha Coach connects securely to your local MT5 desktop terminal, imports up to **3 months of historical data**, incrementally tracks new trades without duplicate ingestion, reconstructs complex position lifecycles (scale-ins, partial closes, stop loss hits, take profits, commissions, and swaps), and powers an advanced performance dashboard, Strategy Lab, Session & Symbol Intelligence, Risk Guardian, Trader DNA, Gamification Discipline Engine, and grounded AI Trading Coach.

---

## 🏗️ Architecture & Security Principles

```
MT5 Desktop Terminal
       ↓ (Official MetaTrader5 Python API)
Local MT5 Journal Bridge (`bridge/alpha_coach_bridge.py`)
       ↓ (Encrypted TLS HTTPS with Device Authentication Tokens)
Alpha Coach Backend API (`backend/src/server.ts`)
       ↓
Relational Database (`data/alphacoach.sqlite` / PostgreSQL DDL)
       ↓
Position Reconstruction & Analytics Math Engine
       ↓
Alpha Coach React PWA Dashboard (`http://localhost:5173`)
       ↓
AI Performance Coach, Trader DNA & Risk Guardian
```

### 🔒 Zero-Password Security Model
- **Alpha Coach NEVER asks for, receives, or stores your MT5/broker password.**
- The Local MT5 Bridge runs locally on your machine, communicates with the locally running MT5 terminal via official MT5 API calls (`mt5.initialize()`, `mt5.history_deals_get()`, `mt5.history_orders_get()`), and transmits only read-only trading orders and deal histories.
- All bridge synchronization is authorized via rotating Device Pairing Tokens (`x-bridge-token`).

---

## ⚡ Key Features

1. **Automatic Trade Reconstruction & Lifecycle Engine**:
   - Reconstructs position lifecycles from raw MT5 deals & orders (Entry Deal → Scale-In → Partial Exit → Final Exit).
   - Accurately computes weighted average entry/exit prices, gross P/L, commissions, swaps, fees, net P/L, holding durations, and initial R-Multiples.
   - Categorizes sessions: **London**, **New York**, **London/NY Overlap**, **Asia**, and **Off-Hours**.
   - Determines exit reasons (**SL_HIT**, **TP_HIT**, **MANUAL**, **SO_HIT**).

2. **Executive Performance Dashboard**:
   - Live account balance, equity, win rate, profit factor, max drawdown, and expectancy.
   - Interactive high-water mark Equity Curve and Daily P/L distribution.

3. **Automatic Trading Journal & Subjective Review**:
   - Every completed trade instantly becomes a structured journal entry.
   - Clear distinction between **Objective MT5 Facts**, **Trader-Entered Subjective Data**, and **AI Inferences**.
   - Review wizard: Setup categorization, market bias, psychological tags (FOMO, Revenge, Impatience, Disciplined), mistake taxonomy, and lessons learned.
   - **Voice Journal**: Speak or type trade narratives with AI-suggested field extractions requiring trader confirmation before saving.

4. **Interactive Trading Calendar**:
   - Monthly grid with color-coded daily net P/L badges and trade counts.
   - Click-to-view drawer displaying all trades for any chosen day.

5. **Advanced Analytics Engine**:
   - Win rate, loss rate, profit factor, mathematical expectancy, Sharpe/recovery factors.
   - Peak-to-trough equity drawdown tracking, consecutive win/loss streaks, and holding time distributions.
   - Long vs Short performance asymmetry analysis.

6. **Strategy Lab & Confluence Matrix**:
   - Tag custom setups (e.g. *Liquidity Sweep*, *MSS*, *FVG*, *Order Block*, *Breaker Block*).
   - Track win rate, net P/L, and profit factor per strategy and confluence combination.

7. **Session & Symbol Intelligence**:
   - Session performance breakdown and 24x7 hourly trading density heatmap.
   - Symbol rankings across XAUUSD, EURUSD, BTCUSD, NAS100, etc.

8. **Trader DNA Profile**:
   - Strictly descriptive profile of your historical trading tendencies (Primary Market, Active Session Focus, Average Duration, Long/Short ratio, Friction Points).

9. **Risk Guardian**:
   - Real-time decision-support monitor for daily loss limits, maximum trades per day, consecutive loss warnings, and max position size.

10. **Gamification & Discipline Master**:
    - Rewards journaling streaks, reviewing losing trades (+50 XP bonus), and adhering to risk limits.
    - Does **NOT** reward overtrading or excessive risk.

11. **AI Trading Coach**:
    - Ask questions about your journal records. Grounded strictly in your empirical data.

12. **Weekly & Monthly Performance Reports**:
    - Automated executive digests and one-click structured CSV export.

13. **Multi-Account MT5 Hub**:
    - Manage multiple accounts (HFM Live, HFM Demo, IC Markets, etc.) with consolidated or account-specific views.

---

## 🚀 Getting Started

### Quick Start (Windows)

1. Double-click `start_alpha_coach.bat` to launch the Backend API (`http://localhost:4000`) and React Frontend (`http://localhost:5173`).
2. Open your browser to `http://localhost:5173`.
3. Click **"Instant Demo Access"** to immediately explore with pre-loaded authentic 3-month MT5 multi-asset datasets, or register your user account.
4. Double-click `start_mt5_bridge.bat` to launch the interactive MT5 Bridge CLI tool.

---

## 🔧 Running Tests

Run the full automated test suites across backend and bridge:

```bash
# Run backend Jest tests (Trade reconstruction, Analytics math, Sync idempotency)
cd backend
npm test

# Run Python MT5 Bridge test suite
cd ..
python bridge/test_bridge.py
```
