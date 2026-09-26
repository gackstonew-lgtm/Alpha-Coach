"""
Alpha Coach - Windows System Tray Companion Application
Authoritative Version: 1.0.4
Runs quietly in the Windows notification area, monitors MetaTrader 5,
and keeps your Alpha Coach trade journal synchronized in the background.
"""

import sys
import os
import time
import threading
from datetime import datetime
from alpha_coach_bridge import AlphaCoachBridge, BridgeState, __version__, APP_NAME
from companion_controller import CompanionController
from companion_logger import companion_logger

# Try importing pystray and Pillow for tray support
try:
    import pystray
    from PIL import Image, ImageDraw
    HAS_TRAY_DEPS = True
except ImportError:
    HAS_TRAY_DEPS = False

class AlphaCoachTrayApp:
    def __init__(self, bridge: AlphaCoachBridge):
        self.bridge = bridge
        self.icon = None
        self.is_running = True
        self.worker_thread = None
        self.controller = CompanionController(self.bridge, notify_fn=self.send_system_notification)

    def send_system_notification(self, title: str, message: str):
        """Displays native Windows tray toast notification."""
        if self.icon:
            try:
                self.icon.notify(message, title)
            except Exception as e:
                companion_logger.warning(f"pystray notify failed: {e}")

    def create_tray_image(self, color="green"):
        """Generates dynamic tray badge icon."""
        width = 64
        height = 64
        img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

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
        elif self.bridge.state in (BridgeState.SYNCED, BridgeState.MT5_READY, BridgeState.READY):
            last = self.bridge.last_sync_time.strftime('%H:%M:%S') if self.bridge.last_sync_time else "Ready"
            return f"Status: Synced ({last})"
        elif self.bridge.state == BridgeState.BRIDGE_TOKEN_INVALID:
            return "Status: Auth Expired (Re-pair required)"
        elif self.bridge.state == BridgeState.BRIDGE_DEVICE_REVOKED:
            return "Status: Device Revoked (Re-pair required)"
        elif self.bridge.state == BridgeState.BRIDGE_DEVICE_EXPIRED:
            return "Status: Auth Expired"
        elif self.bridge.state == BridgeState.AUTH_CHECK_FAILED:
            return "Status: Auth Check Failed"
        elif self.bridge.state == BridgeState.API_ROUTE_MISCONFIGURED:
            return "Status: API Route Misconfigured (Waiting)"
        elif self.bridge.state == BridgeState.API_ROUTE_NOT_FOUND:
            return "Status: API Route Not Found (404)"
        elif self.bridge.state == BridgeState.API_SERVER_ERROR:
            return "Status: API Server Error (500)"
        elif self.bridge.state == BridgeState.API_TIMEOUT:
            return "Status: API Timeout (Retrying...)"
        elif self.bridge.state == BridgeState.MT5_ADAPTER_MISSING:
            return "Status: MT5 Adapter Missing"
        elif self.bridge.state == BridgeState.MT5_TERMINAL_NOT_FOUND:
            return "Status: MT5 Terminal Not Found"
        elif self.bridge.state == BridgeState.MT5_TERMINAL_CLOSED:
            return "Status: MT5 Closed (Waiting)"
        elif self.bridge.state == BridgeState.MT5_INITIALIZATION_FAILED:
            return "Status: MT5 Init Failed"
        elif self.bridge.state == BridgeState.MT5_NOT_LOGGED_IN:
            return "Status: MT5 Not Logged In"
        elif self.bridge.state == BridgeState.UNPAIRED:
            return "Status: Pairing Required"
        elif self.bridge.state == BridgeState.SYNC_FAILED:
            return "Status: Sync Failed"
        elif self.bridge.state == BridgeState.API_UNAVAILABLE:
            return "Status: Reconnecting..."
        else:
            return f"Status: {self.bridge.state}"

    def background_sync_worker(self):
        """Background thread running periodic synchronization with bounded exponential backoff on errors."""
        companion_logger.info(f"Starting {APP_NAME} background synchronization worker...")
        
        # Initial 90-day sync attempt if paired
        try:
            if self.bridge.device_token:
                self.bridge.run_sync_cycle(days_back=90)
        except Exception as e:
            companion_logger.warning(f"Initial sync warning: {e}")

        backoff_intervals = [30, 60, 120, 300, 600]
        while self.is_running:
            failures = min(self.bridge.consecutive_failures, len(backoff_intervals) - 1)
            interval = backoff_intervals[failures] if failures > 0 else 30

            for _ in range(interval):
                if not self.is_running:
                    break
                time.sleep(1)

            if not self.is_running:
                break
            try:
                if self.bridge.device_token and not self.bridge.is_sync_paused:
                    self.bridge.run_sync_cycle(days_back=7)
            except Exception as e:
                companion_logger.warning(f"Background sync cycle warning: {e}")

    def on_quit(self, *args):
        companion_logger.info("Exiting tray application...")
        self.is_running = False
        if self.icon:
            self.icon.stop()
        self.controller.quit()

    def run(self):
        if not HAS_TRAY_DEPS:
            companion_logger.warning("Pystray/Pillow not available. Falling back to background daemon.")
            self.bridge.run_daemon(interval_seconds=30)
            return

        # Start background worker thread
        self.worker_thread = threading.Thread(target=self.background_sync_worker, daemon=True, name="TraySyncWorker")
        self.worker_thread.start()

        # Build context menu with safe signature handling
        menu = pystray.Menu(
            pystray.MenuItem(
                f"{APP_NAME} v{__version__}",
                lambda *args: self.controller.open_dashboard(),
                default=True
            ),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem(lambda text: self.get_status_text(), None, enabled=False),
            pystray.MenuItem(
                "Sync Now (90-Day History)",
                lambda *args: self.controller.sync_now()
            ),
            pystray.MenuItem(
                "Sync Full MT5 History",
                lambda *args: self.controller.sync_full_history()
            ),
            pystray.MenuItem(
                "Open Account Hub",
                lambda *args: self.controller.open_account_hub()
            ),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem(
                lambda text: "Resume Synchronization" if self.bridge.is_sync_paused else "Pause Synchronization",
                lambda *args: self.controller.toggle_pause()
            ),
            pystray.MenuItem(
                "Re-pair with Alpha Coach...",
                lambda *args: self.controller.repair_pairing()
            ),
            pystray.MenuItem(
                "Check for Updates",
                lambda *args: self.controller.check_for_updates()
            ),
            pystray.MenuItem(
                "Diagnostics",
                lambda *args: self.controller.run_diagnostics()
            ),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem(
                f"Quit {APP_NAME}",
                lambda *args: self.on_quit()
            )
        )

        image = self.create_tray_image("green")
        self.icon = pystray.Icon("AlphaCoachMT5Companion", image, f"{APP_NAME} v{__version__}", menu)
        companion_logger.info(f"{APP_NAME} v{__version__} running in Windows System Tray.")
        self.icon.run()

def main():
    bridge = AlphaCoachBridge()
    app = AlphaCoachTrayApp(bridge)
    app.run()

if __name__ == "__main__":
    main()
