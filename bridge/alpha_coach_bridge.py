"""
Alpha Coach - Local MT5 Journal Bridge
Securely connects to MetaTrader 5 desktop terminal, extracts trading history up to 3 months,
and incrementally synchronizes with Alpha Coach Trading Performance OS.
"""

import sys
import os
import json
import time
import argparse
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
import requests

try:
    import MetaTrader5 as mt5
    MT5_AVAILABLE = True
except ImportError:
    MT5_AVAILABLE = False

try:
    from colorama import init, Fore, Style
    init(autoreset=True)
    HAS_COLORAMA = True
except ImportError:
    HAS_COLORAMA = False
    class Fore:
        GREEN = ''
        RED = ''
        YELLOW = ''
        CYAN = ''
        BLUE = ''
        MAGENTA = ''
        RESET = ''
    class Style:
        BRIGHT = ''
        RESET_ALL = ''

class AlphaCoachBridge:
    def __init__(self, api_url: Optional[str] = None, device_token: Optional[str] = None):
        env_api = os.environ.get("ALPHA_COACH_API_URL") or os.environ.get("MT5_BRIDGE_API_URL")
        env_token = os.environ.get("ALPHA_COACH_BRIDGE_TOKEN") or os.environ.get("BRIDGE_TOKEN") or os.environ.get("MT5_BRIDGE_DEVICE_TOKEN")
        
        self.api_url = (api_url or env_api or "http://localhost:4000/api/v1").rstrip('/')
        self.device_token = device_token or env_token or ""
        self.config_file = os.path.join(os.path.dirname(__file__), "bridge_config.json")
        self.load_config()

    def load_config(self):
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, 'r') as f:
                    cfg = json.load(f)
                    if not self.device_token and 'device_token' in cfg:
                        self.device_token = cfg['device_token']
                    if 'api_url' in cfg and cfg['api_url']:
                        self.api_url = cfg['api_url'].rstrip('/')
            except Exception as e:
                print(f"[Warning] Failed to load config: {e}")

    def save_config(self):
        try:
            with open(self.config_file, 'w') as f:
                json.dump({"api_url": self.api_url, "device_token": self.device_token}, f, indent=2)
        except Exception as e:
            print(f"[Warning] Failed to save config: {e}")

    def log(self, tag: str, msg: str, color=Fore.CYAN):
        timestamp = datetime.now().strftime('%H:%M:%S')
        print(f"{Fore.BLUE}[{timestamp}]{Style.RESET_ALL} {color}[{tag}]{Style.RESET_ALL} {msg}")

    def check_api_connection(self) -> bool:
        try:
            headers = {"x-bridge-token": self.device_token} if self.device_token else {}
            resp = requests.get(f"{self.api_url}/mt5/status", headers=headers, timeout=5)
            if resp.status_code == 200:
                self.log("API", f"Connected to Alpha Coach Backend ({self.api_url})", Fore.GREEN)
                return True
            else:
                self.log("API", f"API responded with code {resp.status_code}: {resp.text}", Fore.YELLOW)
                return False
        except Exception as e:
            self.log("API_ERROR", f"Cannot connect to Alpha Coach API at {self.api_url}: {e}", Fore.RED)
            return False

    def connect_mt5(self) -> bool:
        if not MT5_AVAILABLE:
            self.log("MT5", "MetaTrader5 Python module is not installed or platform is not Windows.", Fore.YELLOW)
            return False

        self.log("MT5", "Connecting to MetaTrader 5 desktop terminal...", Fore.CYAN)
        if not mt5.initialize():
            err = mt5.last_error()
            self.log("MT5_ERROR", f"MT5 initialize() failed, error code: {err}", Fore.RED)
            return False

        account_info = mt5.account_info()
        if account_info is None:
            self.log("MT5_ERROR", "MT5 terminal is running but no account is logged in.", Fore.RED)
            return False

        self.log("MT5", f"Connected successfully to MT5 Account: {account_info.login} ({account_info.company})", Fore.GREEN)
        return True

    def get_account_data(self) -> Optional[Dict[str, Any]]:
        if not MT5_AVAILABLE:
            return None
        acc = mt5.account_info()
        if not acc:
            return None

        return {
            "accountNumber": str(acc.login),
            "brokerName": acc.company or "MetaQuotes",
            "serverName": acc.server or "DefaultServer",
            "currency": acc.currency or "USD",
            "leverage": acc.leverage or 100,
            "balance": float(acc.balance),
            "equity": float(acc.equity),
            "margin": float(acc.margin),
            "freeMargin": float(acc.margin_free),
            "marginLevel": float(acc.margin_level) if hasattr(acc, 'margin_level') else 0.0,
            "accountType": "hedging" if acc.margin_mode == mt5.ACCOUNT_MARGIN_MODE_RETAIL_HEDGING else "netting"
        }

    def fetch_history(self, days_back: int = 90) -> Dict[str, Any]:
        """
        Retrieves trading history for the past 90 days (3 months)
        """
        now = datetime.now(timezone.utc)
        from_date = now - timedelta(days=days_back)

        self.log("SYNC", f"Retrieving MT5 history from {from_date.strftime('%Y-%m-%d')} to {now.strftime('%Y-%m-%d')} (UTC)...", Fore.CYAN)

        raw_deals = mt5.history_deals_get(from_date, now)
        raw_orders = mt5.history_orders_get(from_date, now)

        deals_list = []
        if raw_deals:
            for d in raw_deals:
                deal_time = datetime.fromtimestamp(d.time, tz=timezone.utc).isoformat()
                deals_list.append({
                    "ticket": d.ticket,
                    "order": d.order,
                    "position_id": d.position_id if hasattr(d, 'position_id') and d.position_id else d.order,
                    "symbol": d.symbol,
                    "type": d.type,
                    "entry": d.entry,
                    "volume": float(d.volume),
                    "price": float(d.price),
                    "commission": float(d.commission) if hasattr(d, 'commission') else 0.0,
                    "swap": float(d.swap) if hasattr(d, 'swap') else 0.0,
                    "profit": float(d.profit) if hasattr(d, 'profit') else 0.0,
                    "fee": float(d.fee) if hasattr(d, 'fee') else 0.0,
                    "sl": float(d.sl) if hasattr(d, 'sl') else 0.0,
                    "tp": float(d.tp) if hasattr(d, 'tp') else 0.0,
                    "time": deal_time,
                    "magic": d.magic if hasattr(d, 'magic') else 0,
                    "comment": d.comment if hasattr(d, 'comment') else ""
                })

        orders_list = []
        if raw_orders:
            for o in raw_orders:
                time_setup = datetime.fromtimestamp(o.time_setup, tz=timezone.utc).isoformat()
                time_done = datetime.fromtimestamp(o.time_done, tz=timezone.utc).isoformat() if o.time_done else None
                orders_list.append({
                    "ticket": o.ticket,
                    "symbol": o.symbol,
                    "type": o.type,
                    "state": o.state,
                    "volume_initial": float(o.volume_initial),
                    "volume_current": float(o.volume_current),
                    "price_open": float(o.price_open),
                    "sl": float(o.sl) if hasattr(o, 'sl') else 0.0,
                    "tp": float(o.tp) if hasattr(o, 'tp') else 0.0,
                    "time_setup": time_setup,
                    "time_done": time_done,
                    "magic": o.magic if hasattr(o, 'magic') else 0,
                    "comment": o.comment if hasattr(o, 'comment') else ""
                })

        return {
            "deals": deals_list,
            "orders": orders_list
        }

    def sync_to_backend(self, payload: Dict[str, Any]) -> bool:
        url = f"{self.api_url}/mt5/sync"
        headers = {
            "Content-Type": "application/json",
            "x-bridge-token": self.device_token
        }
        try:
            self.log("SYNC", f"Transmitting payload ({len(payload.get('deals', []))} deals, {len(payload.get('orders', []))} orders) to Alpha Coach...", Fore.CYAN)
            resp = requests.post(url, json=payload, headers=headers, timeout=30)
            if resp.status_code == 200:
                data = resp.json()
                self.log("SYNC_SUCCESS", f"Synchronized successfully! {data.get('positionsReconstructed', 0)} positions ({data.get('closedTradesCount', 0)} closed trades) updated.", Fore.GREEN)
                return True
            else:
                self.log("SYNC_ERROR", f"Server error ({resp.status_code}): {resp.text}", Fore.RED)
                return False
        except Exception as e:
            self.log("SYNC_ERROR", f"Network request failed: {e}", Fore.RED)
            return False

    def run_sync_cycle(self, days_back: int = 90) -> bool:
        if not self.connect_mt5():
            return False

        account_info = self.get_account_data()
        if not account_info:
            self.log("MT5_ERROR", "Could not fetch account information.", Fore.RED)
            return False

        history = self.fetch_history(days_back=days_back)
        payload = {
            "accountInfo": account_info,
            "deals": history["deals"],
            "orders": history["orders"]
        }

        return self.sync_to_backend(payload)

    def run_daemon(self, interval_seconds: int = 30):
        self.log("DAEMON", f"Alpha Coach MT5 Bridge running in background mode (Sync interval: {interval_seconds}s). Press Ctrl+C to stop.", Fore.MAGENTA)
        # First sync 90-day history
        self.run_sync_cycle(days_back=90)

        while True:
            try:
                time.sleep(interval_seconds)
                self.run_sync_cycle(days_back=7) # Incremental refresh
            except KeyboardInterrupt:
                self.log("DAEMON", "Bridge stopped by user.", Fore.YELLOW)
                break
            except Exception as e:
                self.log("DAEMON_ERROR", f"Error in background sync: {e}", Fore.RED)
                time.sleep(10)

def main():
    default_api = os.environ.get("ALPHA_COACH_API_URL") or os.environ.get("MT5_BRIDGE_API_URL") or "http://localhost:4000/api/v1"
    default_token = os.environ.get("ALPHA_COACH_BRIDGE_TOKEN") or os.environ.get("BRIDGE_TOKEN") or os.environ.get("MT5_BRIDGE_DEVICE_TOKEN") or ""

    parser = argparse.ArgumentParser(description="Alpha Coach MT5 Local Bridge")
    parser.add_argument("--api", default=default_api, help="Alpha Coach Backend API URL")
    parser.add_argument("--token", default=default_token, help="Bridge Device Token (generate from Alpha Coach Dashboard)")
    parser.add_argument("--daemon", action="store_true", help="Run continuously in background daemon mode")
    parser.add_argument("--interval", type=int, default=30, help="Sync interval in seconds for daemon mode")
    parser.add_argument("--days", type=int, default=90, help="Days of history to sync (default: 90 for 3 months)")
    args = parser.parse_args()

    bridge = AlphaCoachBridge(api_url=args.api, device_token=args.token)

    if not bridge.device_token:
        print(f"{Fore.YELLOW}[Setup Required] No device token configured.{Style.RESET_ALL}")
        print(f"Please copy your Bridge Pairing Token from Alpha Coach (Settings -> MT5 Bridge) and paste it below:")
        try:
            token_input = input("Device Token: ").strip()
            if token_input:
                bridge.device_token = token_input
                bridge.save_config()
        except EOFError:
            pass

    if args.daemon:
        bridge.run_daemon(interval_seconds=args.interval)
    else:
        bridge.log("BRIDGE", "Running single 3-month synchronization cycle...", Fore.CYAN)
        bridge.run_sync_cycle(days_back=args.days)

if __name__ == "__main__":
    main()
