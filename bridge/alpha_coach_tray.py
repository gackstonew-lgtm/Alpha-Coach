"""
Alpha Coach - Windows System Tray Application
Runs quietly in the Windows notification area, monitors MetaTrader 5,
and keeps your Alpha Coach trade journal synchronized in the background.
"""

import sys
import os
import time
import threading
import webbrowser
from datetime import datetime
from alpha_coach_bridge import AlphaCoachBridge, BridgeState

# Try importing pystray and Pillow for tray support
try:
    import pystray
    from PIL import Image, ImageDraw, ImageFont
    HAS_TRAY_DEPS = True
except ImportError:
    HAS_TRAY_DEPS = False

class AlphaCoachTrayApp:
    def __init__(self, bridge: AlphaCoachBridge):
        self.bridge = bridge
        self.icon = None
        self.is_running = True
        self.worker_thread = None

    def create_tray_image(self, color="green"):
        """Generates dynamic tray badge icon."""
        width = 64
        height = 64
        img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        # Draw outer circle / badge
        bg_colors = {
            "green": (16, 185, 129, 255),   # emerald-500
            "yellow": (245, 158, 11, 255),  # amber-500
            "blue": (59, 130, 246, 255),    # blue-500
            "red": (239, 68, 68, 255)       # rose-500
        }
        fill_color = bg_colors.get(color, (16, 185, 129, 255))

        draw.rounded_rectangle([4, 4, 60, 60], radius=16, fill=fill_color)
        draw.polygon([(32, 12), (16, 48), (48, 48)], fill=(255, 255, 255, 255))
        draw.polygon([(32, 28), (24, 48), (40, 48)], fill=fill_color)

        return img

    def get_status_text(self) -> str:
        if self.bridge.state == BridgeState.SYNCING:
            return "Status: Synchronizing trades..."
        elif self.bridge.state == BridgeState.SYNCED or self.bridge.state == BridgeState.READY:
            last = self.bridge.last_sync_time.strftime('%H:%M:%S') if self.bridge.last_sync_time else "Just now"
            return f"Status: Synced ({last})"
        elif self.bridge.state == BridgeState.MT5_CLOSED:
            return "Status: MT5 is closed (Waiting)"
        elif self.bridge.state == BridgeState.MT5_NOT_LOGGED_IN:
            return "Status: MT5 not logged in"
        elif self.bridge.state == BridgeState.UNPAIRED:
            return "Status: Pairing required"
        elif self.bridge.state == BridgeState.API_UNAVAILABLE:
            return "Status: Reconnecting to Alpha Coach..."
        else:
            return f"Status: {self.bridge.state}"

    def trigger_sync_now(self):
        threading.Thread(target=lambda: self.bridge.run_sync_cycle(days_back=90), daemon=True).start()

    def toggle_pause(self):
        self.bridge.is_sync_paused = not self.bridge.is_sync_paused

    def open_dashboard(self):
        webbrowser.open(f"{self.bridge.web_url}/dashboard")

    def open_bridge_hub(self):
        webbrowser.open(f"{self.bridge.web_url}/bridge")

    def trigger_repair(self):
        self.bridge.device_token = ""
        self.bridge.save_config()
        threading.Thread(target=self.bridge.start_browser_pairing, daemon=True).start()

    def show_diagnostics(self):
        ready, msg = self.bridge.check_mt5_readiness()
        acc = self.bridge.get_account_data()
        lines = [
            "Alpha Coach MT5 Bridge Diagnostics",
            "==================================",
            f"API Endpoint: {self.bridge.api_url}",
            f"Web URL: {self.bridge.web_url}",
            f"Device Name: {self.bridge.device_name}",
            f"Paired: {'YES' if self.bridge.device_token else 'NO'}",
            f"Bridge State: {self.bridge.state}",
            f"MT5 Readiness: {msg}",
            f"Account: #{acc.get('accountNumber', 'N/A') if acc else 'None'} ({acc.get('brokerName', '') if acc else ''})",
            f"Last Sync: {self.bridge.last_sync_time or 'Never'}"
        ]
        print("\n".join(lines))

    def on_quit(self):
        self.is_running = False
        if self.icon:
            self.icon.stop()
        sys.exit(0)

    def background_sync_worker(self):
        # Initial 90-day sync
        try:
            self.bridge.run_sync_cycle(days_back=90)
        except Exception as e:
            self.bridge.log("SYNC_ERR", f"Initial sync issue: {e}")

        while self.is_running:
            time.sleep(30)
            if not self.is_running:
                break
            try:
                self.bridge.run_sync_cycle(days_back=7)
            except Exception as e:
                self.bridge.log("WORKER_WARN", f"Sync attempt interrupted: {e}")

    def run(self):
        if not HAS_TRAY_DEPS:
            print("[Info] pystray/Pillow not detected. Running Alpha Coach Bridge in background CLI mode.")
            self.bridge.run_daemon(interval_seconds=30)
            return

        # Start background worker thread
        self.worker_thread = threading.Thread(target=self.background_sync_worker, daemon=True)
        self.worker_thread.start()

        # Build menu
        menu = pystray.Menu(
            pystray.MenuItem("Alpha Coach MT5 Bridge", self.open_dashboard, default=True),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem(lambda text: self.get_status_text(), None, enabled=False),
            pystray.MenuItem("Sync Now (90-Day History)", lambda icon, item: self.trigger_sync_now()),
            pystray.MenuItem("Open Account Hub", lambda icon, item: self.open_bridge_hub()),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem(
                lambda text: "Resume Synchronization" if self.bridge.is_sync_paused else "Pause Synchronization",
                lambda icon, item: self.toggle_pause()
            ),
            pystray.MenuItem("Re-pair with Alpha Coach...", lambda icon, item: self.trigger_repair()),
            pystray.MenuItem("Diagnostics", lambda icon, item: self.show_diagnostics()),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("Quit Alpha Coach Bridge", lambda icon, item: self.on_quit())
        )

        image = self.create_tray_image("green")
        self.icon = pystray.Icon("AlphaCoachMT5Bridge", image, "Alpha Coach MT5 Bridge", menu)
        print("Alpha Coach MT5 Bridge running in Windows System Tray.")
        self.icon.run()

def main():
    bridge = AlphaCoachBridge()
    app = AlphaCoachTrayApp(bridge)
    app.run()

if __name__ == "__main__":
    main()
