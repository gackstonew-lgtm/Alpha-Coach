"""
ArcadeFX MT5 Bridge - Interactive Terminal CLI Bridge
Allows traders to test connectivity, view detected MT5 accounts, trigger instant 3-month sync,
run 1-click browser pairing, or run background live synchronization.
"""

import sys
import os
import json
import time
from alpha_coach_bridge import AlphaCoachBridge, MT5_PACKAGE_AVAILABLE, MT5_AVAILABLE, APP_NAME, __version__
from mock_mt5_adapter import generate_mock_3month_data

try:
    from colorama import init, Fore, Style
    init(autoreset=True)
except ImportError:
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

def print_banner():
    print(Fore.CYAN + Style.BRIGHT + r"""
   _____                      .___       ___________      
  /  _  \_______ ____ _____  __| _/____  \_   _____/__  ___
 /  /_\  \_  __ \__  \\__  \ / __ |/ __ \  |    __) \  \/  /
/    |    \  | \// __ \_/ __ \ /_/ \  ___/  |     \   >    < 
\____|__  /__|  (____  (____  \____ |\___  > \___  /  /__/\_ \
        \/           \/     \/     \/    \/      \/         \/
       =========================================================
       ARCADEFX MT5 BRIDGE — AUTOMATED TRADING JOURNAL OS
       =========================================================
    """ + Style.RESET_ALL)

def main_menu():
    bridge = AlphaCoachBridge()

    while True:
        os.system('cls' if os.name == 'nt' else 'clear')
        print_banner()

        ready, msg = bridge.check_mt5_readiness()
        print(f"\n{Style.BRIGHT}System Status:{Style.RESET_ALL}")
        print(f"  Application:    {Fore.CYAN}{APP_NAME} (v{__version__}){Style.RESET_ALL}")
        print(f"  Backend API:    {Fore.CYAN}{bridge.api_url}{Style.RESET_ALL}")
        print(f"  Device Token:   {Fore.GREEN + (bridge.device_token[:12] + '••••') if bridge.device_token else Fore.YELLOW + 'NOT CONFIGURED (Pairing Required) ⚠️'}{Style.RESET_ALL}")
        print(f"  MT5 Readiness:  {Fore.GREEN + msg if ready else Fore.YELLOW + msg}{Style.RESET_ALL}")

        print(f"\n{Style.BRIGHT}Available Actions:{Style.RESET_ALL}")
        print(f"  [1] 🚀 {Fore.GREEN}1-Click Browser Authorization (Connect to ArcadeFX Account){Style.RESET_ALL}")
        print(f"  [2] ⚡ {Fore.CYAN}Sync Real MT5 Terminal (Previous 3 Months + Open Positions){Style.RESET_ALL}")
        print(f"  [3] 🔄 {Fore.MAGENTA}Start Background Auto-Sync Daemon (30s interval){Style.RESET_ALL}")
        print(f"  [4] 🧪 {Fore.YELLOW}Seed Authentic 3-Month Multi-Asset Dataset (Verification Mode){Style.RESET_ALL}")
        print(f"  [5] 🔍 {Fore.BLUE}Run Diagnostic Health Checks{Style.RESET_ALL}")
        print(f"  [6] ⚙️  Manual Configuration (Token / API URL){Style.RESET_ALL}")
        print(f"  [0] ❌ Exit")

        choice = input(f"\n{Fore.CYAN}Select an option [0-6]: {Style.RESET_ALL}").strip()

        if choice == '1':
            print(f"\n{Fore.CYAN}[Action] Initiating 1-Click Browser Pairing...{Style.RESET_ALL}")
            bridge.start_browser_pairing()
            input(f"\n{Fore.BLUE}Press Enter to return to menu...{Style.RESET_ALL}")

        elif choice == '2':
            print(f"\n{Fore.CYAN}[Action] Initiating MT5 Terminal Sync...{Style.RESET_ALL}")
            success = bridge.run_sync_cycle(days_back=90)
            if not success:
                print(f"{Fore.YELLOW}Note: If MT5 Desktop is not open or logged in, you can test using Option 4 for full 3-month verification.{Style.RESET_ALL}")
            input(f"\n{Fore.BLUE}Press Enter to return to menu...{Style.RESET_ALL}")

        elif choice == '3':
            bridge.run_daemon(interval_seconds=30)
            input(f"\n{Fore.BLUE}Press Enter to return to menu...{Style.RESET_ALL}")

        elif choice == '4':
            print(f"\n{Fore.YELLOW}[Action] Generating 3-Month Realistic MT5 Data (184 positions, scale-ins, partials, commissions)...{Style.RESET_ALL}")
            mock_data = generate_mock_3month_data()
            print(f"{Fore.CYAN}Connecting and synchronizing payload to ArcadeFX...{Style.RESET_ALL}")
            payload = {
                "accountInfo": mock_data["accountInfo"],
                "deals": mock_data["deals"],
                "orders": mock_data["orders"]
            }
            bridge.sync_payload_to_server(payload)
            input(f"\n{Fore.BLUE}Press Enter to return to menu...{Style.RESET_ALL}")

        elif choice == '5':
            print(f"\n{Style.BRIGHT}=== Diagnostics ==={Style.RESET_ALL}")
            print(f"Platform: {sys.platform}")
            print(f"Device Name: {bridge.device_name}")
            print(f"API URL: {bridge.api_url}")
            print(f"Web URL: {bridge.web_url}")
            print(f"Token: {'Configured' if bridge.device_token else 'Not configured'}")
            print(f"Config File: {bridge.config_file}")
            print(f"MT5 Adapter Available: {MT5_PACKAGE_AVAILABLE}")
            installs = bridge.detect_mt5_installations()
            print(f"Detected MT5 Terminals: {len(installs)}")
            for p in installs:
                print(f"  - {p}")
            input(f"\n{Fore.BLUE}Press Enter to return to menu...{Style.RESET_ALL}")

        elif choice == '6':
            print(f"\n{Style.BRIGHT}=== Manual Configuration ==={Style.RESET_ALL}")
            new_api = input(f"Enter API URL [current: {bridge.api_url}]: ").strip()
            if new_api:
                bridge.api_url = new_api
            new_token = input(f"Enter Device Token [current: {bridge.get_masked_token()}]: ").strip()
            if new_token:
                bridge.device_token = new_token
            bridge.save_config()
            print(f"{Fore.GREEN}Configuration saved.{Style.RESET_ALL}")
            input(f"\n{Fore.BLUE}Press Enter to return to menu...{Style.RESET_ALL}")

        elif choice == '0':
            print(f"\n{Fore.GREEN}Exiting {APP_NAME}. Good trading!{Style.RESET_ALL}")
            break

if __name__ == '__main__':
    main_menu()
