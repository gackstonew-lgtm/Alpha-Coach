"""
Alpha Coach - Production MT5 Journal Bridge
Seamlessly connects local MetaTrader 5 desktop terminal to Alpha Coach Performance OS.
Features 1-click browser authorization, automatic MT5 detection, and zero broker password exposure.
"""

import sys
import os
import json
import time
import argparse
import webbrowser
import platform
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional, Tuple
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
        WHITE = ''
        RESET = ''
    class Style:
        BRIGHT = ''
        RESET_ALL = ''

# Default Configuration Constants
DEFAULT_PROD_WEB = "https://alpha-coach-pi.vercel.app"
DEFAULT_PROD_API = "https://alpha-coach-pi.vercel.app/api/v1"
DEFAULT_LOCAL_API = "http://localhost:4000/api/v1"

class BridgeState:
    UNPAIRED = "UNPAIRED"
    API_UNAVAILABLE = "API_UNAVAILABLE"
    MT5_NOT_INSTALLED = "MT5_NOT_INSTALLED"
    MT5_CLOSED = "MT5_CLOSED"
    MT5_NOT_LOGGED_IN = "MT5_NOT_LOGGED_IN"
    READY = "READY"
    SYNCING = "SYNCING"
    SYNCED = "SYNCED"
    REVOKED = "REVOKED"
    ERROR = "ERROR"

class AlphaCoachBridge:
    def __init__(
        self,
        api_url: Optional[str] = None,
        web_url: Optional[str] = None,
        device_token: Optional[str] = None,
        mock_mode: bool = False
    ):
        self.mock_mode = mock_mode
        self.state = BridgeState.UNPAIRED
        self.last_sync_time: Optional[datetime] = None
        self.last_error_message: Optional[str] = None
        self.consecutive_failures = 0
        self.is_sync_paused = False

        # Determine config storage path (Windows AppData preferred)
        self.config_dir = self._get_config_dir()
        self.config_file = os.path.join(self.config_dir, "bridge_config.json")

        # Load existing config or environment variables
        env_api = os.environ.get("ALPHA_COACH_API_URL") or os.environ.get("MT5_BRIDGE_API_URL")
        env_web = os.environ.get("ALPHA_COACH_WEB_URL")
        env_token = os.environ.get("ALPHA_COACH_BRIDGE_TOKEN") or os.environ.get("BRIDGE_TOKEN") or os.environ.get("MT5_BRIDGE_DEVICE_TOKEN")

        # By default, use production unless localhost/custom is passed or detected
        self.api_url = (api_url or env_api or DEFAULT_PROD_API).rstrip('/')
        self.web_url = (web_url or env_web or DEFAULT_PROD_WEB).rstrip('/')
        self.device_token = device_token or env_token or ""
        self.device_name = f"Windows PC ({platform.node() or 'Desktop'})"
        self.selected_mt5_path: Optional[str] = None

        self.load_config()

    def _get_config_dir(self) -> str:
        if platform.system() == "Windows":
            appdata = os.environ.get("APPDATA")
            if appdata:
                path = os.path.join(appdata, "AlphaCoach")
                os.makedirs(path, exist_ok=True)
                return path
        # Fallback to bridge folder
        path = os.path.join(os.path.dirname(__file__), "data")
        os.makedirs(path, exist_ok=True)
        return path

    def load_config(self):
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    cfg = json.load(f)
                    if not self.device_token and cfg.get('device_token'):
                        self.device_token = cfg['device_token']
                    if cfg.get('api_url'):
                        self.api_url = cfg['api_url'].rstrip('/')
                    if cfg.get('web_url'):
                        self.web_url = cfg['web_url'].rstrip('/')
                    if cfg.get('selected_mt5_path'):
                        self.selected_mt5_path = cfg['selected_mt5_path']
            except Exception as e:
                self.log("CONFIG", f"Note: Starting fresh bridge configuration ({e})", Fore.YELLOW)

    def save_config(self):
        try:
            payload = {
                "api_url": self.api_url,
                "web_url": self.web_url,
                "device_token": self.device_token,
                "device_name": self.device_name,
                "selected_mt5_path": self.selected_mt5_path,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(payload, f, indent=2)
        except Exception as e:
            self.log("CONFIG_WARN", f"Failed to save configuration: {e}", Fore.YELLOW)

    def log(self, tag: str, msg: str, color=Fore.CYAN):
        timestamp = datetime.now().strftime('%H:%M:%S')
        print(f"{Fore.BLUE}[{timestamp}]{Style.RESET_ALL} {color}[{tag:<12}]{Style.RESET_ALL} {msg}")

    # =========================================================================
    # Automatic MT5 Terminal Detection & Readiness
    # =========================================================================

    def detect_mt5_installations(self) -> List[str]:
        """Finds common MetaTrader 5 terminal executable paths on Windows."""
        if platform.system() != "Windows":
            return []

        search_dirs = [
            os.environ.get("ProgramFiles", "C:\\Program Files"),
            os.environ.get("ProgramFiles(x86)", "C:\\Program Files (x86)"),
            os.path.expanduser("~\\AppData\\Local\\Programs")
        ]

        found_paths = []
        for base in search_dirs:
            if not os.path.exists(base):
                continue
            try:
                for entry in os.listdir(base):
                    full = os.path.join(base, entry)
                    if os.path.isdir(full) and ("metatrader" in entry.lower() or "mt5" in entry.lower() or "broker" in entry.lower() or "terminal" in entry.lower()):
                        t64 = os.path.join(full, "terminal64.exe")
                        t32 = os.path.join(full, "terminal.exe")
                        if os.path.exists(t64):
                            found_paths.append(t64)
                        elif os.path.exists(t32):
                            found_paths.append(t32)
            except Exception:
                continue

        return list(set(found_paths))

    def check_mt5_readiness(self) -> Tuple[bool, str]:
        """
        Comprehensive readiness check:
        Distinguishes MT5 not installed vs MT5 closed vs MT5 unauthenticated vs MT5 ready.
        """
        if self.mock_mode:
            self.state = BridgeState.READY
            return True, "Mock MT5 environment active"

        if not MT5_AVAILABLE:
            self.state = BridgeState.MT5_NOT_INSTALLED
            return False, "MetaTrader 5 Python adapter is not available on this platform"

        # Attempt initialize
        init_kwargs = {}
        if self.selected_mt5_path and os.path.exists(self.selected_mt5_path):
            init_kwargs["path"] = self.selected_mt5_path

        initialized = mt5.initialize(**init_kwargs)
        if not initialized:
            err = mt5.last_error()
            # If MT5 is not running
            installations = self.detect_mt5_installations()
            if not installations:
                self.state = BridgeState.MT5_NOT_INSTALLED
                return False, "MetaTrader 5 is not installed on this computer."
            else:
                self.state = BridgeState.MT5_CLOSED
                return False, "MetaTrader 5 desktop terminal is not running. Please open MT5."

        acc = mt5.account_info()
        if acc is None:
            self.state = BridgeState.MT5_NOT_LOGGED_IN
            return False, "MetaTrader 5 is running, but no trading account is logged in."

        self.state = BridgeState.READY
        return True, f"Connected to Account #{acc.login} ({acc.company or acc.server})"

    def get_account_data(self) -> Optional[Dict[str, Any]]:
        if self.mock_mode:
            from mock_mt5_adapter import generate_mock_3month_data
            return generate_mock_3month_data()["accountInfo"]

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
            "accountType": "hedging" if getattr(acc, 'margin_mode', 0) == getattr(mt5, 'ACCOUNT_MARGIN_MODE_RETAIL_HEDGING', 0) else "netting"
        }

    # =========================================================================
    # 1-Click Secure Browser-to-Bridge Pairing
    # =========================================================================

    def start_browser_pairing(self, timeout_seconds: int = 600) -> bool:
        """
        Creates a temporary pairing session and opens user's browser for 1-click authorization.
        Polls until the user authorizes the device or timeout occurs.
        """
        self.log("PAIRING", "Initiating 1-Click Browser Pairing...", Fore.CYAN)
        create_url = f"{self.api_url}/mt5/bridge/session/create"

        try:
            resp = requests.post(create_url, json={"deviceName": self.device_name}, timeout=10)
            if resp.status_code != 200:
                self.log("PAIR_ERROR", f"Failed to initialize pairing session ({resp.status_code}): {resp.text}", Fore.RED)
                return False

            data = resp.json()
            session_code = data.get("sessionCode")
            if not session_code:
                self.log("PAIR_ERROR", "Invalid response from pairing service.", Fore.RED)
                return False

            auth_url = f"{self.web_url}/pair?session={session_code}"
            self.log("PAIRING", f"Opening browser for authorization...", Fore.GREEN)
            self.log("PAIRING", f"Authorization Link: {auth_url}", Fore.CYAN)

            # Open default browser
            webbrowser.open(auth_url)

            # Poll for authorization
            start_time = time.time()
            status_url = f"{self.api_url}/mt5/bridge/session/{session_code}/status"

            while time.time() - start_time < timeout_seconds:
                time.sleep(2)
                try:
                    poll_resp = requests.get(status_url, timeout=5)
                    if poll_resp.status_code == 200:
                        poll_data = poll_resp.json()
                        status = poll_data.get("status")
                        if status == "AUTHORIZED":
                            token = poll_data.get("deviceToken")
                            if token:
                                self.device_token = token
                                self.save_config()
                                self.state = BridgeState.READY
                                self.log("PAIR_SUCCESS", "Device authorized successfully! Alpha Coach MT5 Bridge is connected.", Fore.GREEN)
                                return True
                        elif status == "REJECTED":
                            self.log("PAIR_DENIED", "Device pairing request was denied by user.", Fore.YELLOW)
                            return False
                        elif status == "EXPIRED":
                            self.log("PAIR_EXPIRED", "Pairing session expired. Please retry.", Fore.YELLOW)
                            return False
                except Exception:
                    pass

            self.log("PAIR_TIMEOUT", "Pairing request timed out.", Fore.YELLOW)
            return False

        except Exception as e:
            self.log("PAIR_ERROR", f"Could not reach Alpha Coach pairing server: {e}", Fore.RED)
            return False

    # =========================================================================
    # Synchronization Engine (Idempotent 90-Day & Incremental)
    # =========================================================================

    def fetch_history(self, days_back: int = 90) -> Dict[str, Any]:
        if self.mock_mode:
            from mock_mt5_adapter import generate_mock_3month_data
            data = generate_mock_3month_data()
            return {"deals": data["deals"], "orders": data["orders"]}

        if not MT5_AVAILABLE:
            return {"deals": [], "orders": []}

        now = datetime.now(timezone.utc)
        from_date = now - timedelta(days=days_back)

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

        return {"deals": deals_list, "orders": orders_list}

    def sync_payload_to_server(self, payload: Dict[str, Any]) -> bool:
        url = f"{self.api_url}/mt5/sync"
        headers = {
            "Content-Type": "application/json",
            "x-bridge-token": self.device_token
        }

        try:
            self.state = BridgeState.SYNCING
            deals_cnt = len(payload.get('deals', []))
            orders_cnt = len(payload.get('orders', []))
            self.log("SYNC", f"Transmitting {deals_cnt} deals, {orders_cnt} orders to Alpha Coach OS...", Fore.CYAN)

            resp = requests.post(url, json=payload, headers=headers, timeout=30)
            if resp.status_code == 200:
                data = resp.json()
                self.state = BridgeState.SYNCED
                self.last_sync_time = datetime.now()
                self.consecutive_failures = 0
                self.last_error_message = None
                self.log("SYNC_SUCCESS", f"Synchronized successfully! {data.get('positionsReconstructed', 0)} positions updated.", Fore.GREEN)
                return True
            elif resp.status_code == 401:
                self.state = BridgeState.REVOKED
                self.last_error_message = "Device authorization was revoked or expired."
                self.log("AUTH_ERROR", "Bridge device authorization revoked. Re-pairing required.", Fore.RED)
                return False
            else:
                self.state = BridgeState.ERROR
                self.last_error_message = f"Server returned error ({resp.status_code})"
                self.log("SYNC_ERROR", f"Sync error ({resp.status_code}): {resp.text}", Fore.RED)
                return False
        except Exception as e:
            self.state = BridgeState.API_UNAVAILABLE
            self.last_error_message = str(e)
            self.consecutive_failures += 1
            self.log("NET_ERROR", f"Cannot connect to Alpha Coach API: {e}", Fore.RED)
            return False

    def run_sync_cycle(self, days_back: int = 90) -> bool:
        if self.is_sync_paused:
            self.log("SYNC", "Synchronization is currently paused.", Fore.YELLOW)
            return True

        # Check pairing
        if not self.device_token:
            self.state = BridgeState.UNPAIRED
            paired = self.start_browser_pairing()
            if not paired:
                return False

        # Check MT5 readiness
        ready, msg = self.check_mt5_readiness()
        if not ready:
            self.log("MT5_STATUS", msg, Fore.YELLOW)
            return False

        account_info = self.get_account_data()
        if not account_info:
            self.log("MT5_ERROR", "Unable to read MT5 account details.", Fore.RED)
            return False

        history = self.fetch_history(days_back=days_back)
        payload = {
            "accountInfo": account_info,
            "deals": history["deals"],
            "orders": history["orders"]
        }

        return self.sync_payload_to_server(payload)

    def run_daemon(self, interval_seconds: int = 30):
        self.log("DAEMON", f"Alpha Coach MT5 Bridge active (Sync interval: {interval_seconds}s). Press Ctrl+C to stop.", Fore.MAGENTA)

        # Initial 90-day sync
        self.run_sync_cycle(days_back=90)

        while True:
            try:
                time.sleep(interval_seconds)
                # Incremental sync (7 days)
                self.run_sync_cycle(days_back=7)
            except KeyboardInterrupt:
                self.log("DAEMON", "Alpha Coach MT5 Bridge stopped gracefully.", Fore.YELLOW)
                break
            except Exception as e:
                self.log("DAEMON_WARN", f"Interruption in sync loop: {e}", Fore.RED)
                time.sleep(10)

def main():
    parser = argparse.ArgumentParser(description="Alpha Coach MT5 Local Bridge")
    parser.add_argument("--api", default=None, help="Alpha Coach Backend API URL")
    parser.add_argument("--web", default=None, help="Alpha Coach Web URL")
    parser.add_argument("--token", default=None, help="Manual Bridge Device Token")
    parser.add_argument("--daemon", action="store_true", help="Run in continuous background daemon mode")
    parser.add_argument("--interval", type=int, default=30, help="Sync interval in seconds for daemon mode")
    parser.add_argument("--days", type=int, default=90, help="Days of history to sync (default: 90)")
    parser.add_argument("--mock", action="store_true", help="Use mock MT5 trading records for testing")
    parser.add_argument("--diagnostics", action="store_true", help="Run diagnostic health checks")
    args = parser.parse_args()

    bridge = AlphaCoachBridge(
        api_url=args.api,
        web_url=args.web,
        device_token=args.token,
        mock_mode=args.mock
    )

    if args.diagnostics:
        print("=== Alpha Coach MT5 Bridge Diagnostics ===")
        print(f"Platform: {platform.platform()}")
        print(f"API URL: {bridge.api_url}")
        print(f"Web URL: {bridge.web_url}")
        print(f"Device Name: {bridge.device_name}")
        print(f"Token Configured: {'YES' if bridge.device_token else 'NO (Requires Pairing)'}")
        ready, msg = bridge.check_mt5_readiness()
        print(f"MT5 Status: {msg}")
        installations = bridge.detect_mt5_installations()
        print(f"Detected MT5 Terminals: {installations if installations else 'None found'}")
        return

    if args.daemon:
        bridge.run_daemon(interval_seconds=args.interval)
    else:
        bridge.log("BRIDGE", "Executing 90-day MT5 synchronization cycle...", Fore.CYAN)
        bridge.run_sync_cycle(days_back=args.days)

if __name__ == "__main__":
    main()
