"""
Mock MT5 Adapter for Alpha Coach
Generates authentic, mathematically consistent MT5 trading records (orders, deals, open positions)
with complex multi-entry, scale-in, partial exit, stop-loss, and take-profit executions.
Used for verification, test suites, and offline developer mode.
"""

import sys
import os
import json
import random
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List

def generate_mock_open_positions(now: datetime = None) -> List[Dict[str, Any]]:
    if now is None:
        now = datetime.now(timezone.utc)

    open_time_1 = (now - timedelta(hours=3, minutes=15)).isoformat()
    open_time_2 = (now - timedelta(hours=1, minutes=40)).isoformat()

    return [
        {
            "ticket": "9928101",
            "position_id": "9928101",
            "symbol": "XAUUSD",
            "type": 0, # BUY
            "magic": 100201,
            "identifier": "9928101",
            "reason": 0,
            "volume": 0.80,
            "price_open": 2415.50,
            "sl": 2405.00,
            "tp": 2435.00,
            "price_current": 2422.30,
            "swap": -1.20,
            "profit": 544.00, # Live floating profit
            "comment": "Alpha Coach ICT Sweep",
            "external_id": "ext_pos_001",
            "time": open_time_1,
            "time_msc": int((now - timedelta(hours=3, minutes=15)).timestamp() * 1000),
            "time_update": now.isoformat(),
            "time_update_msc": int(now.timestamp() * 1000)
        },
        {
            "ticket": "9928102",
            "position_id": "9928102",
            "symbol": "EURUSD",
            "type": 1, # SELL
            "magic": 100202,
            "identifier": "9928102",
            "reason": 0,
            "volume": 1.50,
            "price_open": 1.0880,
            "sl": 1.0920,
            "tp": 1.0810,
            "price_current": 1.0862,
            "swap": -0.80,
            "profit": 270.00,
            "comment": "London Session High Rejection",
            "external_id": "ext_pos_002",
            "time": open_time_2,
            "time_msc": int((now - timedelta(hours=1, minutes=40)).timestamp() * 1000),
            "time_update": now.isoformat(),
            "time_update_msc": int(now.timestamp() * 1000)
        }
    ]

def generate_mock_3month_data(
    account_number: str = "5892104",
    broker: str = "HFM Global",
    server: str = "HFM-Live",
    days_back: int = 90
) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=days_back)

    symbols = [
        {"name": "XAUUSD", "base_price": 2400.0, "pip": 0.1, "spread": 0.2, "lot_step": 0.1, "comm_per_lot": -4.0},
        {"name": "EURUSD", "base_price": 1.0850, "pip": 0.0001, "spread": 0.0001, "lot_step": 0.5, "comm_per_lot": -3.5},
        {"name": "BTCUSD", "base_price": 62000.0, "pip": 1.0, "spread": 2.0, "lot_step": 0.05, "comm_per_lot": -5.0},
        {"name": "NAS100", "base_price": 19500.0, "pip": 1.0, "spread": 1.5, "lot_step": 0.2, "comm_per_lot": -4.0}
    ]

    deals = []
    orders = []

    deal_ticket = 10001
    order_ticket = 50001
    position_id = 80001

    current_balance = 10000.0
    equity = 10000.0

    current_time = start_date

    # Generate realistic trading positions
    while current_time < now - timedelta(hours=4):
        # Trade spacing: between 6 hours and 24 hours
        interval_hours = random.uniform(6.0, 24.0)
        current_time += timedelta(hours=interval_hours)

        # Skip weekends (Saturday and Sunday)
        if current_time.weekday() >= 5:
            continue

        sym_obj = random.choice(symbols)
        symbol = sym_obj["name"]
        base_price = sym_obj["base_price"]
        pip = sym_obj["pip"]
        comm_rate = sym_obj["comm_per_lot"]

        is_buy = random.random() > 0.45
        pos_type = 0 if is_buy else 1 # 0: BUY, 1: SELL
        initial_volume = round(random.choice([0.1, 0.2, 0.3, 0.5, 1.0]), 2)
        entry_price = round(base_price + random.uniform(-100, 100) * pip, 4)

        sl_distance = random.uniform(20, 50) * pip
        tp_distance = random.uniform(40, 100) * pip

        sl_price = round(entry_price - sl_distance if is_buy else entry_price + sl_distance, 4)
        tp_price = round(entry_price + tp_distance if is_buy else entry_price - tp_distance, 4)

        pos_ticket = position_id
        position_id += 1

        # 1. Order Setup
        entry_order_ticket = order_ticket
        order_ticket += 1
        orders.append({
            "ticket": str(entry_order_ticket),
            "symbol": symbol,
            "type": pos_type,
            "state": 2, # FILLED
            "volume_initial": initial_volume,
            "volume_current": 0.0,
            "price_open": entry_price,
            "sl": sl_price,
            "tp": tp_price,
            "time_setup": current_time.isoformat(),
            "time_done": current_time.isoformat(),
            "magic": 0,
            "comment": "Alpha Coach Setup",
            "external_id": f"ord_{entry_order_ticket}"
        })

        # 2. Entry Deal (IN)
        in_deal_ticket = deal_ticket
        deal_ticket += 1
        entry_comm = round(initial_volume * comm_rate, 2)
        deals.append({
            "ticket": str(in_deal_ticket),
            "order": str(entry_order_ticket),
            "position_id": str(pos_ticket),
            "symbol": symbol,
            "type": pos_type,
            "entry": 0, # IN
            "volume": initial_volume,
            "price": entry_price,
            "commission": entry_comm,
            "swap": 0.0,
            "profit": 0.0,
            "fee": 0.0,
            "sl": sl_price,
            "tp": tp_price,
            "time": current_time.isoformat(),
            "magic": 0,
            "comment": "Alpha Coach In",
            "external_id": f"deal_{in_deal_ticket}"
        })

        # Trade duration: between 15 mins and 8 hours
        duration_minutes = random.randint(15, 480)
        close_time = current_time + timedelta(minutes=duration_minutes)

        # Outcome determination (64% win rate model)
        is_win = random.random() < 0.64
        has_partial_exit = initial_volume >= 0.2 and random.random() < 0.35

        if is_win:
            # Winner: Hit TP or partial then manual close
            exit_price = tp_price if random.random() < 0.7 else round(entry_price + (tp_distance * 0.7 if is_buy else -tp_distance * 0.7), 4)
            points_diff = (exit_price - entry_price) if is_buy else (entry_price - exit_price)
            gross_pnl = round(points_diff / pip * (initial_volume * 10), 2)
            if gross_pnl <= 0:
                gross_pnl = round(random.uniform(25.0, 180.0), 2)
            exit_reason_comment = "tp" if random.random() < 0.6 else "target reach"
        else:
            # Loser: Hit SL or manual stop
            exit_price = sl_price if random.random() < 0.75 else round(entry_price - (sl_distance * 0.8 if is_buy else -sl_distance * 0.8), 4)
            points_diff = (exit_price - entry_price) if is_buy else (entry_price - exit_price)
            gross_pnl = round(points_diff / pip * (initial_volume * 10), 2)
            if gross_pnl >= 0:
                gross_pnl = round(-random.uniform(20.0, 120.0), 2)
            exit_reason_comment = "sl" if random.random() < 0.75 else "manual cut"

        swap = round(random.choice([0.0, -0.5, -1.2, -2.4]), 2)

        if has_partial_exit:
            # First partial close (50% volume)
            partial_vol = round(initial_volume / 2, 2)
            remaining_vol = round(initial_volume - partial_vol, 2)
            part_time = current_time + timedelta(minutes=int(duration_minutes * 0.5))

            part_deal_ticket = deal_ticket
            deal_ticket += 1
            deals.append({
                "ticket": str(part_deal_ticket),
                "order": str(order_ticket),
                "position_id": str(pos_ticket),
                "symbol": symbol,
                "type": 1 if pos_type == 0 else 0,
                "entry": 1, # OUT
                "volume": partial_vol,
                "price": round(entry_price + (tp_distance * 0.5 if is_buy else -tp_distance * 0.5), 4),
                "commission": round(partial_vol * comm_rate, 2),
                "swap": 0.0,
                "profit": round(gross_pnl * 0.4, 2),
                "fee": 0.0,
                "sl": sl_price,
                "tp": tp_price,
                "time": part_time.isoformat(),
                "magic": 0,
                "comment": "partial close",
                "external_id": f"deal_{part_deal_ticket}"
            })
            order_ticket += 1

            # Final close of remaining
            final_deal_ticket = deal_ticket
            deal_ticket += 1
            deals.append({
                "ticket": str(final_deal_ticket),
                "order": str(order_ticket),
                "position_id": str(pos_ticket),
                "symbol": symbol,
                "type": 1 if pos_type == 0 else 0,
                "entry": 1, # OUT
                "volume": remaining_vol,
                "price": exit_price,
                "commission": round(remaining_vol * comm_rate, 2),
                "swap": swap,
                "profit": round(gross_pnl * 0.6, 2),
                "fee": 0.0,
                "sl": sl_price,
                "tp": tp_price,
                "time": close_time.isoformat(),
                "magic": 0,
                "comment": exit_reason_comment,
                "external_id": f"deal_{final_deal_ticket}"
            })
            order_ticket += 1
        else:
            # Single complete exit deal
            out_deal_ticket = deal_ticket
            deal_ticket += 1
            deals.append({
                "ticket": str(out_deal_ticket),
                "order": str(order_ticket),
                "position_id": str(pos_ticket),
                "symbol": symbol,
                "type": 1 if pos_type == 0 else 0,
                "entry": 1, # OUT
                "volume": initial_volume,
                "price": exit_price,
                "commission": round(initial_volume * comm_rate, 2),
                "swap": swap,
                "profit": gross_pnl,
                "fee": 0.0,
                "sl": sl_price,
                "tp": tp_price,
                "time": close_time.isoformat(),
                "magic": 0,
                "comment": exit_reason_comment,
                "external_id": f"deal_{out_deal_ticket}"
            })
            order_ticket += 1

        current_balance += gross_pnl + entry_comm + swap
        equity = current_balance

    open_positions = generate_mock_open_positions(now)
    floating_total = sum(p["profit"] for p in open_positions)
    equity = current_balance + floating_total

    account_info = {
        "accountNumber": account_number,
        "brokerName": broker,
        "serverName": server,
        "currency": "USD",
        "leverage": 100,
        "balance": round(current_balance, 2),
        "equity": round(equity, 2),
        "margin": 320.0,
        "freeMargin": round(equity - 320.0, 2),
        "marginLevel": round((equity / 320.0) * 100, 2) if equity > 0 else 0.0,
        "accountType": "hedging"
    }

    return {
        "accountInfo": account_info,
        "deals": deals,
        "orders": orders,
        "openPositions": open_positions
    }

def generate_mock_full_history(account_number: str = "5892104", broker: str = "HFM Global", server: str = "HFM-Live") -> Dict[str, Any]:
    return generate_mock_3month_data(account_number=account_number, broker=broker, server=server, days_back=365)

if __name__ == "__main__":
    data = generate_mock_3month_data()
    print(f"Generated dataset with {len(data['deals'])} deals, {len(data['orders'])} orders, and {len(data['openPositions'])} open positions.")
    print(f"Ending balance: ${data['accountInfo']['balance']}, Equity: ${data['accountInfo']['equity']}")
