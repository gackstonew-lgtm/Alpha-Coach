"""
Alpha Coach - Production MT5 Journal Bridge
Authoritative Version: 1.0.4
Seamlessly connects local MetaTrader 5 desktop terminal to Alpha Coach Performance OS.
Features distinct MT5 state management, exhaustive terminal scanning, 1-click browser pairing,
and resilient cloud synchronization to Production HTTPS API.
"""

import sys
import os
import json
import time
import secrets
import argparse
import webbrowser
import platform
import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional, Tuple
import requests

try:
    import MetaTrader5 as mt5
    MT5_PACKAGE_AVAILABLE = True
    MT5_PACKAGE_VERSION = getattr(mt5, '__version__', '5.0.x')
    MT5_IMPORT_ERROR = None
except Exception as e:
    mt5 = None
    MT5_PACKAGE_AVAILABLE = False
    MT5_PACKAGE_VERSION = "Unavailable"
    MT5_IMPORT_ERROR = str(e)

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

from companion_logger import companion_logger

__version__ = "1.0.4"
APP_NAME = "Alpha Coach MT5 Companion"
GITHUB_REPO = "gackstonew-lgtm/Alpha-Coach"

# Production Endpoints
DEFAULT_PROD_WEB = "https://alpha-coach-pi.vercel.app"
DEFAULT_PROD_API = "https://alpha-coach-pi.vercel.app/api/v1"
DEFAULT_LOCAL_API = "http://localhost:4000/api/v1"

# Production Supabase Credentials (Public / Anon Client)
SUPABASE_URL = "https://rmnudqejyrrklltodiaf.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtbnVkcWVqeXJya2xsdG9kaWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNTQyOTYsImV4cCI6MjEwNTkzMDI5Nn0.2Tg6KzAFA7gnQ09tQPhz_lES4X5by09-n3G1PePXId8"

class BridgeState:
    UNPAIRED = "UNPAIRED"
    PAIRING = "PAIRING"
    AUTHORIZING = "AUTHORIZING"
    AUTHORIZED = "AUTHORIZED"
    AUTH_CHECK_FAILED = "AUTH_CHECK_FAILED"
    BRIDGE_TOKEN_INVALID = "BRIDGE_TOKEN_INVALID"
    BRIDGE_DEVICE_REVOKED = "BRIDGE_DEVICE_REVOKED"
    BRIDGE_DEVICE_EXPIRED = "BRIDGE_DEVICE_EXPIRED"
    API_UNAVAILABLE = "API_UNAVAILABLE"
    API_ROUTE_MISCONFIGURED = "API_ROUTE_MISCONFIGURED"
    API_ROUTE_NOT_FOUND = "API_ROUTE_NOT_FOUND"
    API_SERVER_ERROR = "API_SERVER_ERROR"
    API_TIMEOUT = "API_TIMEOUT"
    MT5_ADAPTER_MISSING = "MT5_ADAPTER_MISSING"
    MT5_TERMINAL_NOT_FOUND = "MT5_TERMINAL_NOT_FOUND"
    MT5_TERMINAL_CLOSED = "MT5_TERMINAL_CLOSED"
    MT5_INITIALIZATION_FAILED = "MT5_INITIALIZATION_FAILED"
    MT5_NOT_LOGGED_IN = "MT5_NOT_LOGGED_IN"
    MT5_CONNECTED = "MT5_CONNECTED"
    MT5_READY = "MT5_READY"
    READY = "READY"
    SYNCING = "SYNCING"
    SYNCED = "SYNCED"
    SYNC_FAILED = "SYNC_FAILED"
    REVOKED = "REVOKED"
    ERROR = "ERROR"

class AlphaCoachBridge:
    VERSION = __version__

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
        self.last_auth_check_time: Optional[datetime] = None
        self.consecutive_failures = 0
        self.is_sync_paused = False
        self.active_device_id: Optional[str] = None
        self.active_user_id: Optional[str] = None

        # Config directory (%APPDATA%/AlphaCoach on Windows)
        self.config_dir = self._get_config_dir()
        self.config_file = os.path.join(self.config_dir, "bridge_config.json")

        # Environment variable overrides
        env_api = os.environ.get("ALPHA_COACH_API_URL") or os.environ.get("MT5_BRIDGE_API_URL")
        env_web = os.environ.get("ALPHA_COACH_WEB_URL")
        env_token = os.environ.get("ALPHA_COACH_BRIDGE_TOKEN") or os.environ.get("BRIDGE_TOKEN") or os.environ.get("MT5_BRIDGE_DEVICE_TOKEN")

        self.api_url = (api_url or env_api or DEFAULT_PROD_API).rstrip('/')
        self.web_url = (web_url or env_web or DEFAULT_PROD_WEB).rstrip('/')
        self.device_token = device_token or env_token or ""
        self.device_name = f"Windows PC ({platform.node() or 'Desktop'})"
        self.selected_mt5_path: Optional[str] = None

        self.load_config()
        companion_logger.info(f"Initialized AlphaCoachBridge v{__version__}: API={self.api_url}, MT5 Adapter={'Available (v' + str(MT5_PACKAGE_VERSION) + ')' if MT5_PACKAGE_AVAILABLE else 'MISSING: ' + str(MT5_IMPORT_ERROR)}")

    def _get_config_dir(self) -> str:
        if platform.system() == "Windows":
            appdata = os.environ.get("APPDATA")
            if appdata:
                path = os.path.join(appdata, "AlphaCoach")
                os.makedirs(path, exist_ok=True)
                return path
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
                    if cfg.get('active_device_id'):
                        self.active_device_id = cfg['active_device_id']
                    if cfg.get('active_user_id'):
                        self.active_user_id = cfg['active_user_id']
                    if self.device_token:
                        self.state = BridgeState.MT5_CONNECTED
            except Exception as e:
                companion_logger.warning(f"Error loading config file: {e}")

    def save_config(self):
        try:
            payload = {
                "api_url": self.api_url,
                "web_url": self.web_url,
                "device_token": self.device_token,
                "device_name": self.device_name,
                "selected_mt5_path": self.selected_mt5_path,
                "active_device_id": self.active_device_id,
                "active_user_id": self.active_user_id,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(payload, f, indent=2)
            companion_logger.info("Configuration saved successfully.")
        except Exception as e:
            companion_logger.error(f"Failed to save configuration: {e}")

    def get_masked_token(self) -> str:
        if not self.device_token:
            return "None"
        if len(self.device_token) > 8:
            return f"••••{self.device_token[-6:]}"
        return "••••"

    def clear_device_token(self):
        self.device_token = ""
        self.active_device_id = None
        self.active_user_id = None
        self.state = BridgeState.UNPAIRED
        self.save_config()
        self.log("AUTH", "Device authorization cleared from local storage.", Fore.YELLOW)

    def check_for_updates(self) -> Tuple[bool, str, Optional[str]]:
        """Checks GitHub Releases for a newer version of the companion."""
        try:
            url = f"https://api.github.com/repos/{GITHUB_REPO}/releases/latest"
            resp = requests.get(url, headers={"User-Agent": f"AlphaCoachCompanion/{__version__}"}, timeout=5)
            if resp.status_code == 200:
                rel = resp.json()
                latest_tag = rel.get("tag_name", "").lstrip("v")
                if latest_tag and latest_tag > __version__:
                    download_url = f"https://github.com/{GITHUB_REPO}/releases/latest/download/AlphaCoach-MT5-Companion-Setup.exe"
                    return True, f"New version {latest_tag} available!", download_url
                return False, f"You are running the latest version (v{__version__})", None
            return False, "No update information available.", None
        except Exception as e:
            return False, f"Unable to check for updates: {e}", None

    def log(self, tag: str, msg: str, color=Fore.CYAN):
        timestamp = datetime.now().strftime('%H:%M:%S')
        if HAS_COLORAMA and sys.stdout is not None:
            print(f"{Fore.BLUE}[{timestamp}]{Style.RESET_ALL} {color}[{tag:<12}]{Style.RESET_ALL} {msg}")
        companion_logger.info(f"[{tag}] {msg}")

    # =========================================================================
    # Comprehensive MT5 Terminal Detection & Readiness Health Check
    # =========================================================================

    def detect_mt5_installations(self) -> List[str]:
        """Exhaustively discovers MT5 terminal64.exe and terminal.exe across Windows."""
        if platform.system() != "Windows":
            return []

        search_roots = [
            os.environ.get("ProgramFiles", r"C:\Program Files"),
            os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)"),
            os.environ.get("LOCALAPPDATA", ""),
            os.environ.get("APPDATA", ""),
            os.path.expanduser(r"~\Desktop")
        ]

        found_paths = []
        for base in search_roots:
            if not base or not os.path.exists(base):
                continue
            try:
                for root, dirs, files in os.walk(base):
                    # Limit scan depth to 3 levels to maintain rapid responsiveness
                    depth = root[len(base):].count(os.sep)
                    if depth > 3:
                        dirs[:] = []
                        continue
                    for f in files:
                        if f.lower() in ("terminal64.exe", "terminal.exe"):
                            full_path = os.path.join(root, f)
                            if os.path.exists(full_path):
                                found_paths.append(full_path)
            except Exception:
                continue

        # De-duplicate while preserving order
        unique = []
        for p in found_paths:
            if p not in unique:
                unique.append(p)
        return unique

    def check_mt5_readiness(self) -> Tuple[bool, str]:
        """
        Distinct Multi-Stage MT5 Health Check:
        1. MT5_ADAPTER_MISSING (Python package import failure)
        2. MT5_TERMINAL_NOT_FOUND (No terminal executable on system)
        3. MT5_TERMINAL_CLOSED (Terminal installed but process not running)
        4. MT5_INITIALIZATION_FAILED (IPC initialization failed)
        5. MT5_NOT_LOGGED_IN (Terminal running without active account)
        6. MT5_READY (Terminal active, connected, account detected)
        """
        if self.mock_mode:
            self.state = BridgeState.MT5_READY
            return True, "Mock MT5 environment active"

        # Stage 1: Check Python Package
        if not MT5_PACKAGE_AVAILABLE or mt5 is None:
            self.state = BridgeState.MT5_ADAPTER_MISSING
            msg = f"MetaTrader 5 Python adapter is missing in this companion package ({MT5_IMPORT_ERROR or 'ModuleNotFoundError'})."
            self.last_error_message = msg
            return False, msg

        # Stage 2: Discover Terminals
        installations = self.detect_mt5_installations()
        effective_path = self.selected_mt5_path if (self.selected_mt5_path and os.path.exists(self.selected_mt5_path)) else (installations[0] if installations else None)

        # Stage 3: Attempt Initialize
        init_kwargs = {}
        if effective_path:
            init_kwargs["path"] = effective_path

        initialized = False
        try:
            initialized = mt5.initialize(**init_kwargs)
        except Exception as e:
            companion_logger.warning(f"mt5.initialize exception: {e}")

        if not initialized:
            last_err = mt5.last_error() if hasattr(mt5, 'last_error') else "Unknown"
            if not installations and not effective_path:
                self.state = BridgeState.MT5_TERMINAL_NOT_FOUND
                msg = "No MetaTrader 5 terminal found on this computer. Please install MT5 or select terminal64.exe."
                self.last_error_message = msg
                return False, msg
            else:
                self.state = BridgeState.MT5_TERMINAL_CLOSED
                msg = f"MetaTrader 5 terminal is not running. Please open MT5 ({os.path.basename(effective_path or 'terminal64.exe')})."
                self.last_error_message = msg
                return False, msg

        # Stage 4: Check Active Account
        try:
            acc = mt5.account_info()
            if acc is None:
                self.state = BridgeState.MT5_NOT_LOGGED_IN
                msg = "MetaTrader 5 is running, but no trading account is logged in."
                self.last_error_message = msg
                return False, msg

            self.state = BridgeState.MT5_READY
            msg = f"Connected to Account #{acc.login} ({acc.company or acc.server})"
            self.last_error_message = None
            return True, msg
        except Exception as e:
            self.state = BridgeState.MT5_INITIALIZATION_FAILED
            msg = f"Failed to retrieve account from MT5: {e}"
            self.last_error_message = msg
            return False, msg

    def get_account_data(self) -> Optional[Dict[str, Any]]:
        if self.mock_mode:
            from mock_mt5_adapter import generate_mock_3month_data
            return generate_mock_3month_data()["accountInfo"]

        if not MT5_PACKAGE_AVAILABLE or mt5 is None:
            return None

        try:
            acc = mt5.account_info()
            if not acc:
                return None

            return {
                "accountNumber": str(acc.login),
                "brokerName": acc.company or "Exness (KE) Limited",
                "serverName": acc.server or "ExnessKE-MT5Real21",
                "currency": acc.currency or "USD",
                "leverage": acc.leverage or 100,
                "balance": float(acc.balance),
                "equity": float(acc.equity),
                "margin": float(acc.margin),
                "freeMargin": float(acc.margin_free),
                "marginLevel": float(acc.margin_level) if hasattr(acc, 'margin_level') else 0.0,
                "accountType": "hedging" if getattr(acc, 'margin_mode', 0) == getattr(mt5, 'ACCOUNT_MARGIN_MODE_RETAIL_HEDGING', 0) else "netting"
            }
        except Exception as e:
            companion_logger.error(f"Error in get_account_data: {e}")
            return None

    # =========================================================================
    # 1-Click Secure Browser-to-Bridge Pairing (Hybrid Mode)
    # =========================================================================

    def _get_supabase_headers(self) -> Dict[str, str]:
        return {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    def start_browser_pairing(self, timeout_seconds: int = 600) -> bool:
        """
        Creates a temporary pairing session and opens user's browser for 1-click authorization.
        Supports both custom HTTPS API and direct Supabase database operations.
        """
        self.log("PAIRING", "Initiating 1-Click Browser Pairing...", Fore.CYAN)
        session_code = f"pair_{secrets.token_hex(8)}{int(time.time())}"
        session_created = False

        # Attempt 1: Via Backend API Endpoint
        create_url = f"{self.api_url}/mt5/bridge/session/create"
        try:
            resp = requests.post(create_url, json={"deviceName": self.device_name}, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("sessionCode"):
                    session_code = data.get("sessionCode")
                    session_created = True
                    self.log("PAIRING", f"Created session via API: {session_code}")
        except Exception as e:
            companion_logger.info(f"Direct API session create skipped: {e}")

        # Attempt 2: Via Direct Supabase REST
        if not session_created:
            try:
                expires_at = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
                supa_url = f"{SUPABASE_URL}/rest/v1/bridge_pairing_sessions"
                resp = requests.post(
                    supa_url,
                    json={
                        "session_code": session_code,
                        "device_name": self.device_name,
                        "status": "PENDING",
                        "expires_at": expires_at
                    },
                    headers=self._get_supabase_headers(),
                    timeout=10
                )
                if resp.status_code in [200, 201]:
                    session_created = True
                    self.log("PAIRING", f"Created session via Supabase Cloud: {session_code}")
                else:
                    self.log("PAIR_ERROR", f"Supabase session creation failed ({resp.status_code}): {resp.text}", Fore.RED)
            except Exception as e:
                self.log("PAIR_ERROR", f"Could not reach Supabase pairing table: {e}", Fore.RED)

        if not session_created:
            self.last_error_message = "Unable to create pairing session. Please check your internet connection."
            return False

        # Open Browser to Authorization URL
        auth_url = f"{self.web_url}/pair?session={session_code}"
        self.log("PAIRING", f"Opening browser for authorization: {auth_url}", Fore.GREEN)
        try:
            webbrowser.open(auth_url)
        except Exception as e:
            self.log("PAIR_WARN", f"Could not launch browser automatically: {e}", Fore.YELLOW)

        # Poll for Authorization
        start_time = time.time()
        api_status_url = f"{self.api_url}/mt5/bridge/session/{session_code}/status"
        supa_status_url = f"{SUPABASE_URL}/rest/v1/bridge_pairing_sessions?session_code=eq.{session_code}&select=*"

        while time.time() - start_time < timeout_seconds:
            time.sleep(2)
            # Try API status endpoint
            try:
                api_resp = requests.get(api_status_url, timeout=3)
                if api_resp.status_code == 200:
                    data = api_resp.json()
                    status = data.get("status")
                    if status == "AUTHORIZED" and data.get("deviceToken"):
                        self.device_token = data.get("deviceToken")
                        self.save_config()
                        self.state = BridgeState.MT5_CONNECTED
                        self.log("PAIR_SUCCESS", "Device authorized via API! Companion is paired.", Fore.GREEN)
                        return True
                    elif status == "REJECTED":
                        self.last_error_message = "Pairing request was declined by user."
                        return False
            except Exception:
                pass

            # Try Supabase Direct status
            try:
                supa_resp = requests.get(supa_status_url, headers=self._get_supabase_headers(), timeout=4)
                if supa_resp.status_code == 200:
                    rows = supa_resp.json()
                    if rows and len(rows) > 0:
                        sess = rows[0]
                        status = sess.get("status")
                        if status == "AUTHORIZED" and sess.get("device_token"):
                            self.device_token = sess.get("device_token")
                            self.save_config()
                            self.state = BridgeState.MT5_CONNECTED
                            self.log("PAIR_SUCCESS", "Device authorized via Supabase! Companion is paired.", Fore.GREEN)
                            return True
                        elif status == "REJECTED":
                            self.last_error_message = "Pairing request was declined by user."
                            return False
                        elif status == "EXPIRED":
                            self.last_error_message = "Pairing session expired. Please retry."
                            return False
            except Exception:
                pass

        self.last_error_message = "Pairing request timed out awaiting user confirmation."
        return False

    # =========================================================================
    # Synchronization Engine (90-Day & Incremental)
    # =========================================================================

    def fetch_history(self, days_back: int = 90) -> Dict[str, Any]:
        """Retrieves deals and orders using standard Python datetime objects."""
        if self.mock_mode:
            from mock_mt5_adapter import generate_mock_3month_data
            data = generate_mock_3month_data()
            return {"deals": data["deals"], "orders": data["orders"]}

        if not MT5_PACKAGE_AVAILABLE or mt5 is None:
            return {"deals": [], "orders": []}

        now = datetime.now()
        from_date = now - timedelta(days=days_back)

        raw_deals = mt5.history_deals_get(from_date, now)
        raw_orders = mt5.history_orders_get(from_date, now)

        deals_list = []
        if raw_deals:
            for d in raw_deals:
                deal_time = datetime.fromtimestamp(d.time, tz=timezone.utc).isoformat()
                deals_list.append({
                    "ticket": str(d.ticket),
                    "order": str(d.order),
                    "position_id": str(d.position_id) if hasattr(d, 'position_id') and d.position_id else str(d.order),
                    "symbol": str(d.symbol or ""),
                    "type": int(d.type),
                    "entry": int(d.entry),
                    "volume": float(d.volume),
                    "price": float(d.price),
                    "commission": float(d.commission) if hasattr(d, 'commission') else 0.0,
                    "swap": float(d.swap) if hasattr(d, 'swap') else 0.0,
                    "profit": float(d.profit) if hasattr(d, 'profit') else 0.0,
                    "fee": float(d.fee) if hasattr(d, 'fee') else 0.0,
                    "sl": float(d.sl) if hasattr(d, 'sl') else 0.0,
                    "tp": float(d.tp) if hasattr(d, 'tp') else 0.0,
                    "time": deal_time,
                    "magic": int(d.magic) if hasattr(d, 'magic') else 0,
                    "comment": str(d.comment or "")
                })

        orders_list = []
        if raw_orders:
            for o in raw_orders:
                time_setup = datetime.fromtimestamp(o.time_setup, tz=timezone.utc).isoformat()
                time_done = datetime.fromtimestamp(o.time_done, tz=timezone.utc).isoformat() if o.time_done else None
                orders_list.append({
                    "ticket": str(o.ticket),
                    "symbol": str(o.symbol or ""),
                    "type": int(o.type),
                    "state": int(o.state),
                    "volume_initial": float(o.volume_initial),
                    "volume_current": float(o.volume_current),
                    "price_open": float(o.price_open),
                    "sl": float(o.sl) if hasattr(o, 'sl') else 0.0,
                    "tp": float(o.tp) if hasattr(o, 'tp') else 0.0,
                    "time_setup": time_setup,
                    "time_done": time_done,
                    "magic": int(o.magic) if hasattr(o, 'magic') else 0,
                    "comment": str(o.comment or "")
                })

        return {"deals": deals_list, "orders": orders_list}

    def check_device_authorization(self) -> Tuple[bool, str]:
        """
        Phase 7 & 10: Dedicated device authentication verification check.
        Validates the configured device token with the Alpha Coach backend.
        Returns (is_valid, message).
        """
        if self.mock_mode:
            return True, "Mock authorization active"

        if not self.device_token:
            self.state = BridgeState.UNPAIRED
            return False, "Device is not paired with Alpha Coach."

        url = f"{self.api_url}/mt5/bridge/device/status"
        headers = {
            "Content-Type": "application/json",
            "x-bridge-token": self.device_token
        }
        try:
            resp = requests.get(url, headers=headers, timeout=10)
            self.last_auth_check_time = datetime.now()

            # Handle HTML response gracefully if routing is returning SPA index.html
            content_type = resp.headers.get("Content-Type", "")
            if "text/html" in content_type:
                self.state = BridgeState.API_ROUTE_MISCONFIGURED
                self.last_error_message = f"API endpoint returned HTML instead of JSON (Status {resp.status_code}). Production API routing required."
                return False, self.last_error_message

            try:
                data = resp.json()
            except Exception as e:
                self.state = BridgeState.API_ROUTE_MISCONFIGURED
                self.last_error_message = f"Failed to parse auth response: {e} (Status {resp.status_code})"
                return False, self.last_error_message

            if resp.status_code == 200:
                if data.get("authorized") and data.get("status") == "ACTIVE":
                    self.active_device_id = data.get("deviceId")
                    self.active_user_id = data.get("userId")
                    self.state = BridgeState.MT5_CONNECTED
                    return True, "Device authorization is ACTIVE"

            err_code = data.get("error", {}).get("code", "")
            err_msg = data.get("error", {}).get("message", f"Authorization failed ({resp.status_code})")

            if resp.status_code == 401:
                if err_code == "BRIDGE_DEVICE_REVOKED":
                    self.state = BridgeState.BRIDGE_DEVICE_REVOKED
                    self.last_error_message = "This companion device was revoked from the Alpha Coach Account Hub."
                elif err_code == "BRIDGE_DEVICE_EXPIRED":
                    self.state = BridgeState.BRIDGE_DEVICE_EXPIRED
                    self.last_error_message = "This companion device authorization has expired."
                else:
                    self.state = BridgeState.BRIDGE_TOKEN_INVALID
                    self.last_error_message = err_msg or "Alpha Coach authorization needs to be renewed. Device token is invalid."
                return False, self.last_error_message
            elif resp.status_code == 404:
                self.state = BridgeState.API_ROUTE_NOT_FOUND
                self.last_error_message = f"Device status endpoint not found (HTTP 404): {url}"
                return False, self.last_error_message
            elif resp.status_code >= 500:
                self.state = BridgeState.API_SERVER_ERROR
                self.last_error_message = f"API server error ({resp.status_code}): {err_msg}"
                return False, self.last_error_message

            self.state = BridgeState.AUTH_CHECK_FAILED
            self.last_error_message = f"Authorization check failed ({resp.status_code}): {err_msg}"
            return False, self.last_error_message

        except requests.exceptions.Timeout as e:
            self.state = BridgeState.API_TIMEOUT
            self.last_error_message = f"Authorization check timed out: {e}"
            return False, self.last_error_message
        except requests.exceptions.RequestException as e:
            companion_logger.warning(f"Could not reach API authorization endpoint: {e}")
            self.state = BridgeState.API_UNAVAILABLE
            self.last_error_message = f"Alpha Coach API is temporarily unreachable ({e})"
            return False, self.last_error_message

    def sync_payload_to_server(self, payload: Dict[str, Any]) -> bool:
        """Sends payload to Alpha Coach via authenticated backend HTTPS API."""
        self.state = BridgeState.SYNCING
        deals_cnt = len(payload.get('deals', []))
        orders_cnt = len(payload.get('orders', []))
        self.log("SYNC", f"Transmitting {deals_cnt} deals, {orders_cnt} orders to Alpha Coach OS...", Fore.CYAN)

        api_url = f"{self.api_url}/mt5/sync"
        headers = {
            "Content-Type": "application/json",
            "x-bridge-token": self.device_token
        }
        try:
            resp = requests.post(api_url, json=payload, headers=headers, timeout=35)
            
            # Detect HTML response from static SPA routing vs API JSON
            content_type = resp.headers.get("Content-Type", "")
            if "text/html" in content_type:
                self.state = BridgeState.API_ROUTE_MISCONFIGURED
                self.last_error_message = f"API endpoint returned HTML instead of JSON (Status {resp.status_code}). Production API routing required."
                self.consecutive_failures += 1
                self.log("SYNC_ERROR", self.last_error_message, Fore.RED)
                return False

            try:
                data = resp.json()
            except Exception as e:
                self.state = BridgeState.API_ROUTE_MISCONFIGURED
                self.last_error_message = f"Failed to parse API response: {e} (Status {resp.status_code})"
                self.consecutive_failures += 1
                self.log("SYNC_ERROR", self.last_error_message, Fore.RED)
                return False

            if resp.status_code == 200 and data.get("success") is not False:
                self.state = BridgeState.SYNCED
                self.last_sync_time = datetime.now()
                self.consecutive_failures = 0
                self.last_error_message = None
                reconstructed = data.get('positionsReconstructed', deals_cnt)
                self.log("SYNC_SUCCESS", f"Synchronized via API: {reconstructed} positions updated.", Fore.GREEN)
                return True
            elif resp.status_code == 401:
                err_code = data.get("error", {}).get("code", "")
                err_msg = data.get("error", {}).get("message", "Device authorization failed.")

                if err_code == "BRIDGE_DEVICE_REVOKED":
                    self.state = BridgeState.BRIDGE_DEVICE_REVOKED
                elif err_code == "BRIDGE_DEVICE_EXPIRED":
                    self.state = BridgeState.BRIDGE_DEVICE_EXPIRED
                else:
                    self.state = BridgeState.BRIDGE_TOKEN_INVALID

                self.last_error_message = err_msg
                self.consecutive_failures += 1
                self.log("SYNC_AUTH_FAIL", f"Authorization rejected: {err_msg}", Fore.RED)
                return False
            elif resp.status_code == 404:
                self.state = BridgeState.API_ROUTE_NOT_FOUND
                self.last_error_message = f"Sync endpoint not found (HTTP 404): {api_url}"
                self.consecutive_failures += 1
                self.log("SYNC_FAIL", self.last_error_message, Fore.RED)
                return False
            elif resp.status_code >= 500:
                err_msg = data.get("error", {}).get("message", f"Sync API returned HTTP {resp.status_code}")
                self.state = BridgeState.API_SERVER_ERROR
                self.last_error_message = err_msg
                self.consecutive_failures += 1
                self.log("SYNC_FAIL", f"Server error: {err_msg}", Fore.RED)
                return False
            else:
                err_msg = data.get("error", {}).get("message", f"Sync API returned HTTP {resp.status_code}")
                self.state = BridgeState.SYNC_FAILED
                self.last_error_message = err_msg
                self.consecutive_failures += 1
                self.log("SYNC_FAIL", f"Sync failed: {err_msg}", Fore.RED)
                return False
        except requests.exceptions.Timeout as e:
            self.state = BridgeState.API_TIMEOUT
            self.last_error_message = f"Sync request timed out: {e}"
            self.consecutive_failures += 1
            self.log("SYNC_TIMEOUT", self.last_error_message, Fore.YELLOW)
            return False
        except requests.exceptions.RequestException as e:
            self.state = BridgeState.API_UNAVAILABLE
            self.last_error_message = f"Alpha Coach API unreachable: {e}"
            self.consecutive_failures += 1
            companion_logger.warning(f"Sync API network exception: {e}")
            self.log("SYNC_NETWORK_FAIL", self.last_error_message, Fore.YELLOW)
            return False

    def run_sync_cycle(self, days_back: int = 90) -> bool:
        if self.is_sync_paused:
            self.log("SYNC", "Synchronization is currently paused.", Fore.YELLOW)
            return True

        if not self.device_token:
            self.state = BridgeState.UNPAIRED
            paired = self.start_browser_pairing()
            if not paired:
                return False

        # Phase 7: Pre-flight check device authorization
        auth_ok, auth_msg = self.check_device_authorization()
        if not auth_ok:
            self.log("AUTH_CHECK", auth_msg, Fore.RED)
            if self.state in (BridgeState.BRIDGE_TOKEN_INVALID, BridgeState.BRIDGE_DEVICE_REVOKED, BridgeState.BRIDGE_DEVICE_EXPIRED):
                self.log("RECOVERY", "Clearing invalid token to allow re-pairing...", Fore.YELLOW)
                self.clear_device_token()
                paired = self.start_browser_pairing()
                if not paired:
                    return False
            else:
                return False

        ready, msg = self.check_mt5_readiness()
        if not ready:
            self.log("MT5_STATUS", msg, Fore.YELLOW)
            self.last_error_message = msg
            return False

        account_info = self.get_account_data()
        if not account_info:
            self.log("MT5_ERROR", "Unable to read MT5 account details.", Fore.RED)
            self.last_error_message = "Unable to read MT5 account details."
            return False

        history = self.fetch_history(days_back=days_back)
        payload = {
            "accountInfo": account_info,
            "deals": history["deals"],
            "orders": history["orders"]
        }

        return self.sync_payload_to_server(payload)

    def run_daemon(self, interval_seconds: int = 30):
        self.log("DAEMON", f"Alpha Coach MT5 Companion daemon active ({interval_seconds}s interval).", Fore.MAGENTA)
        self.run_sync_cycle(days_back=90)

        while True:
            try:
                time.sleep(interval_seconds)
                self.run_sync_cycle(days_back=7)
            except KeyboardInterrupt:
                self.log("DAEMON", "Companion daemon stopped.", Fore.YELLOW)
                break
            except Exception as e:
                companion_logger.exception(f"Daemon cycle exception: {e}")
                time.sleep(10)

def main():
    parser = argparse.ArgumentParser(description="Alpha Coach MT5 Companion CLI")
    parser.add_argument("--api", default=None, help="Alpha Coach API URL")
    parser.add_argument("--web", default=None, help="Alpha Coach Web URL")
    parser.add_argument("--token", default=None, help="Device Token")
    parser.add_argument("--daemon", action="store_true", help="Daemon mode")
    parser.add_argument("--days", type=int, default=90, help="Days back to sync")
    parser.add_argument("--mock", action="store_true", help="Mock mode")
    parser.add_argument("--diagnostics", action="store_true", help="Print diagnostics")
    args = parser.parse_args()

    bridge = AlphaCoachBridge(api_url=args.api, web_url=args.web, device_token=args.token, mock_mode=args.mock)

    if args.diagnostics:
        ready, msg = bridge.check_mt5_readiness()
        acc = bridge.get_account_data()
        auth_ok, auth_msg = bridge.check_device_authorization()
        print(f"=== {APP_NAME} Diagnostics ===")
        print(f"Version: v{__version__}")
        print(f"API URL: {bridge.api_url}")
        print(f"Web URL: {bridge.web_url}")
        print(f"Device ID: {bridge.active_device_id or 'None'}")
        print(f"Device Name: {bridge.device_name}")
        print(f"Authorization Status: {'ACTIVE' if auth_ok else bridge.state} ({auth_msg})")
        print(f"Token Configured: {'YES' if bridge.device_token else 'NO'}")
        print(f"Token Fingerprint: {bridge.get_masked_token()}")
        print(f"MT5 Adapter: {'Available (v' + str(MT5_PACKAGE_VERSION) + ')' if MT5_PACKAGE_AVAILABLE else 'MISSING'}")
        print(f"MT5 Terminal Path: {bridge.selected_mt5_path or 'Auto-Detected'}")
        print(f"MT5 Readiness: {msg}")
        print(f"MT5 Account: #{acc.get('accountNumber', 'None') if acc else 'None'}")
        print(f"MT5 Broker: {acc.get('brokerName', 'None') if acc else 'None'}")
        print(f"MT5 Server: {acc.get('serverName', 'None') if acc else 'None'}")
        print(f"MT5 Balance: ${acc.get('balance', 0.0):.2f} {acc.get('currency', 'USD') if acc else ''}")
        print(f"Last Error: {bridge.last_error_message or 'None'}")
        return

    if args.daemon:
        bridge.run_daemon()
    else:
        bridge.run_sync_cycle(days_back=args.days)

if __name__ == "__main__":
    main()

