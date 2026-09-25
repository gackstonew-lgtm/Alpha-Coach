"""
Alpha Coach - Interactive Terminal CLI Bridge
Allows traders to test connectivity, view detected MT5 accounts, trigger instant 3-month sync,
or run background live synchronization.
"""

import sys
import os
import json
import time
from alpha_coach_bridge import AlphaCoachBridge, MT5_AVAILABLE
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
   _____  .__          .__               _________                     .__     
  /  _  \ |  | ______ |  |__ _____      \_   ___ \  _________    ____ |  |__  
 /  /_\  \|  | \____ \|  |  \\__  \     /    \  \/ /  _ \__  \ _/ ___\|  |  \ 
/    |    \  |_|  |_> >   Y  \/ __ \_   \     \___(  <_> ) __ \\  \___|   Y  \
\____|__  /____/   __/|___|  (____  /    \______  /\____(____  /\___  >___|  /
        \/     |__|        \/     \/            \/           \/     \/     \/ 
    """ + Style.RESET_ALL)
    print(Fore.GREEN + "       AUTOMATED MT5 TRADING JOURNAL & PERFORMANCE OS BRIDGE" + Style.RESET_ALL)
    print(Fore.BLUE + "=================================================================" + Style.RESET_ALL)

def main_menu():
    bridge = AlphaCoachBridge()

    while True:
        os.system('cls' if os.name == 'nt' else 'clear')
        print_banner()

        # Check API status
        api_ok = bridge.check_api_connection()
        print(f"\n{Style.BRIGHT}System Status:{Style.RESET_ALL}")
        print(f"  Backend API:    {Fore.GREEN + 'CONNECTED 🟢' if api_ok else Fore.RED + 'OFFLINE / UNREACHABLE 🔴'}{Style.RESET_ALL} ({bridge.api_url})")
        print(f"  Device Token:   {Fore.GREEN + (bridge.device_token[:12] + '••••') if bridge.device_token else Fore.YELLOW + 'NOT CONFIGURED ⚠️'}{Style.RESET_ALL}")
        print(f"  MT5 Terminal:   {Fore.GREEN + 'AVAILABLE 🟢' if MT5_AVAILABLE else Fore.YELLOW + 'SIMULATION/ADAPTER MODE 🟡'}{Style.RESET_ALL}")

        print(f"\n{Style.BRIGHT}Available Actions:{Style.RESET_ALL}")
        print(f"  [1] ⚡ {Fore.CYAN}Sync Real MT5 Terminal (Previous 3 Months + Open Positions){Style.RESET_ALL}")
        print(f"  [2] 🔄 {Fore.GREEN}Start Background Auto-Sync Daemon (30s interval){Style.RESET_ALL}")
        print(f"  [3] 🧪 {Fore.YELLOW}Seed Authentic 3-Month Multi-Asset Dataset (Verification Mode){Style.RESET_ALL}")
        print(f"  [4] 🔑 {Fore.MAGENTA}Set / Update Bridge Pairing Token{Style.RESET_ALL}")
        print(f"  [5] 🌐 {Fore.BLUE}Change Backend API URL{Style.RESET_ALL}")
        print(f"  [0] ❌ Exit")

        choice = input(f"\n{Fore.CYAN}Select an option [0-5]: {Style.RESET_ALL}").strip()

        if choice == '1':
            print(f"\n{Fore.CYAN}[Action] Initiating MT5 Terminal Sync...{Style.RESET_ALL}")
            success = bridge.run_sync_cycle(days_back=90)
            if not success:
                print(f"{Fore.YELLOW}Note: If MT5 Desktop is not open or logged in, you can test using Option 3 for full 3-month verification.{Style.RESET_ALL}")
            input(f"\n{Fore.BLUE}Press Enter to return to menu...{Style.RESET_ALL}")

        elif choice == '2':
            bridge.run_daemon(interval_seconds=30)
            input(f"\n{Fore.BLUE}Press Enter to return to menu...{Style.RESET_ALL}")

        elif choice == '3':
            print(f"\n{Fore.YELLOW}[Action] Generating 3-Month Realistic MT5 Data (184 positions, scale-ins, partials, commissions)...{Style.RESET_ALL}")
            mock_data = generate_mock_3month_data()
            print(f"{Fore.CYAN}Connecting and synchronizing payload to Alpha Coach...{Style.RESET_ALL}")
            bridge.sync_to_backend(mock_data)
            input(f"\n{Fore.BLUE}Press Enter to return to menu...{Style.RESET_ALL}")

        elif choice == '4':
            token = input(f"\nEnter your Bridge Pairing Token: ").strip()
            if token:
                bridge.device_token = token
                bridge.save_config()
                print(f"{Fore.GREEN}Pairing token saved successfully!{Style.RESET_ALL}")
            time.sleep(1.5)

        elif choice == '5':
            url = input(f"\nEnter Backend API URL (current: {bridge.api_url}): ").strip()
            if url:
                bridge.api_url = url.rstrip('/')
                bridge.save_config()
                print(f"{Fore.GREEN}API URL updated successfully!{Style.RESET_ALL}")
            time.sleep(1.5)

        elif choice == '0':
            print(f"\n{Fore.GREEN}Thank you for using Alpha Coach! Exiting...{Style.RESET_ALL}\n")
            sys.exit(0)

if __name__ == "__main__":
    main_menu()
