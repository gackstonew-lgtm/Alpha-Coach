"""
Alpha Coach - Companion Controller Layer
Authoritative Version: 1.0.2
Orchestrates Tray Actions, Real GUI Diagnostics Dialog, MT5 Terminal File Browser,
Desktop Toast Notifications, Background Sync, and End-to-End Pairing Lifecycles.
"""

import os
import sys
import time
import threading
import webbrowser
from datetime import datetime, timezone
from typing import Optional, Callable

from alpha_coach_bridge import (
    AlphaCoachBridge,
    BridgeState,
    __version__,
    APP_NAME,
    MT5_PACKAGE_AVAILABLE,
    MT5_PACKAGE_VERSION,
    MT5_IMPORT_ERROR
)
from companion_logger import companion_logger, get_log_dir

try:
    import MetaTrader5 as mt5
except Exception:
    mt5 = None

class CompanionController:
    def __init__(self, bridge: AlphaCoachBridge, notify_fn: Optional[Callable[[str, str], None]] = None):
        self.bridge = bridge
        self.notify_fn = notify_fn
        self.is_syncing = False
        self.is_pairing = False
        self.diagnostics_window_open = False
        companion_logger.info(f"Initialized {APP_NAME} Controller (v{__version__})")

    def notify(self, title: str, message: str):
        companion_logger.info(f"Notification: [{title}] {message}")
        if self.notify_fn:
            try:
                self.notify_fn(title, message)
            except Exception as e:
                companion_logger.warning(f"Failed to display system notification: {e}")

    # =========================================================================
    # Action Handlers
    # =========================================================================

    def open_dashboard(self, *args):
        """Opens the Alpha Coach web dashboard."""
        try:
            url = f"{self.bridge.web_url}/dashboard"
            companion_logger.info(f"Opening dashboard: {url}")
            webbrowser.open(url)
        except Exception as e:
            companion_logger.error(f"Error opening dashboard: {e}")
            self.notify("Error", f"Failed to open browser: {e}")

    def open_account_hub(self, *args):
        """Opens the MT5 Bridge & Account Hub in the browser."""
        try:
            url = f"{self.bridge.web_url}/bridge"
            companion_logger.info(f"Opening Account Hub: {url}")
            webbrowser.open(url)
        except Exception as e:
            companion_logger.error(f"Error opening Account Hub: {e}")
            self.notify("Error", f"Failed to open Account Hub: {e}")

    def sync_now(self, *args):
        """Triggers an immediate 90-day history synchronization cycle."""
        if self.is_syncing:
            self.notify("Sync In Progress", "A synchronization cycle is already running.")
            return

        def _do_sync():
            self.is_syncing = True
            try:
                companion_logger.info("Manual sync initiated (90-day window)...")
                self.notify("Sync Started", "Retrieving 90-day MT5 trade history & open positions...")
                success = self.bridge.run_sync_cycle(days_back=90)
                if success:
                    last_time = self.bridge.last_sync_time.strftime('%H:%M:%S') if self.bridge.last_sync_time else 'Just now'
                    self.notify("Sync Complete", f"Successfully synchronized with Alpha Coach at {last_time}.")
                else:
                    err = self.bridge.last_error_message or "Unknown error"
                    self.notify("Sync Failed", f"Synchronization could not complete: {err}")
            except Exception as e:
                companion_logger.exception(f"Unhandled error in sync_now: {e}")
                self.notify("Sync Error", f"An error occurred: {str(e)[:80]}")
            finally:
                self.is_syncing = False

        threading.Thread(target=_do_sync, daemon=True, name="ManualSyncWorker").start()

    def toggle_pause(self, *args):
        """Toggles background synchronization pause state."""
        try:
            self.bridge.is_sync_paused = not self.bridge.is_sync_paused
            state = "Paused" if self.bridge.is_sync_paused else "Resumed"
            companion_logger.info(f"Background synchronization {state.lower()}")
            self.notify(f"Sync {state}", f"MT5 trade synchronization is now {state.lower()}.")
        except Exception as e:
            companion_logger.error(f"Error toggling pause state: {e}")

    def repair_pairing(self, *args):
        """Clears local device token and launches 1-click browser pairing."""
        if self.is_pairing:
            self.notify("Pairing In Progress", "A pairing session is already awaiting authorization in your browser.")
            return

        def _do_pairing():
            self.is_pairing = True
            try:
                companion_logger.info("Re-pairing initiated by user...")
                self.notify("Pairing Initiated", "Opening browser for 1-click Alpha Coach authorization...")
                self.bridge.device_token = ""
                self.bridge.save_config()
                self.bridge.state = BridgeState.UNPAIRED
                
                success = self.bridge.start_browser_pairing()
                if success:
                    self.notify("Pairing Successful", "Device paired! Running initial 90-day sync...")
                    self.sync_now()
                else:
                    err = self.bridge.last_error_message or "Authorization timed out or declined."
                    self.notify("Pairing Incomplete", f"Pairing was not completed: {err}")
            except Exception as e:
                companion_logger.exception(f"Unhandled error in repair_pairing: {e}")
                self.notify("Pairing Error", f"Pairing failed: {str(e)[:80]}")
            finally:
                self.is_pairing = False

        threading.Thread(target=_do_pairing, daemon=True, name="PairingWorker").start()

    def check_for_updates(self, *args):
        """Queries GitHub releases for newer version."""
        def _do_check():
            try:
                companion_logger.info("Checking for application updates...")
                has_update, msg, download_url = self.bridge.check_for_updates()
                if has_update and download_url:
                    self.notify("Update Available", msg)
                    webbrowser.open(download_url)
                else:
                    self.notify("Alpha Coach Companion", msg)
            except Exception as e:
                companion_logger.error(f"Update check failed: {e}")
                self.notify("Update Check", f"Could not verify updates: {e}")

        threading.Thread(target=_do_check, daemon=True, name="UpdateCheckWorker").start()

    def select_mt5_terminal_path(self, parent_window=None) -> Optional[str]:
        """Allows user to select custom terminal64.exe path and saves configuration."""
        try:
            import tkinter.filedialog as fd
            file_path = fd.askopenfilename(
                parent=parent_window,
                title="Select MetaTrader 5 Terminal Executable",
                filetypes=[("MetaTrader Terminal", "terminal64.exe;terminal.exe"), ("All Executables", "*.exe")]
            )
            if file_path and os.path.exists(file_path):
                self.bridge.selected_mt5_path = file_path
                self.bridge.save_config()
                self.notify("MT5 Terminal Selected", f"Configured: {os.path.basename(file_path)}")
                companion_logger.info(f"User manually selected MT5 terminal path: {file_path}")
                return file_path
        except Exception as e:
            companion_logger.error(f"Failed to select MT5 terminal path: {e}")
        return None

    def run_diagnostics(self, *args):
        """Displays a dedicated GUI Diagnostics Window with live telemetry and terminal selector."""
        def _show_gui():
            try:
                import tkinter as tk
                from tkinter import ttk, messagebox
                
                # Check MT5 and bridge state
                ready, msg = self.bridge.check_mt5_readiness()
                acc = self.bridge.get_account_data()
                
                term_name = "N/A"
                term_build = "N/A"
                term_path = self.bridge.selected_mt5_path or "Auto-detected"
                
                if MT5_PACKAGE_AVAILABLE and mt5 is not None:
                    try:
                        t_info = mt5.terminal_info()
                        v_info = mt5.version()
                        if t_info:
                            term_name = t_info.name or "MetaTrader 5"
                            term_path = t_info.path or term_path
                        if v_info:
                            term_build = f"Build {v_info[1]} ({v_info[2]})"
                    except Exception:
                        pass
                
                root = tk.Tk()
                root.title(f"{APP_NAME} — Diagnostics & Health")
                root.geometry("680x560")
                root.minsize(620, 500)
                root.configure(bg="#0f172a")  # Slate 900
                
                # Header
                header_frame = tk.Frame(root, bg="#1e293b", padx=16, pady=12)
                header_frame.pack(fill=tk.X)
                
                title_lbl = tk.Label(
                    header_frame,
                    text=f"⚡ {APP_NAME} v{__version__}",
                    font=("Segoe UI", 13, "bold"),
                    fg="#38bdf8",
                    bg="#1e293b"
                )
                title_lbl.pack(anchor="w")
                
                sub_lbl = tk.Label(
                    header_frame,
                    text="Live Diagnostic Telemetry, Adapter Verification & Connection Inspector",
                    font=("Segoe UI", 9),
                    fg="#94a3b8",
                    bg="#1e293b"
                )
                sub_lbl.pack(anchor="w")

                # Content area
                content_frame = tk.Frame(root, bg="#0f172a", padx=16, pady=12)
                content_frame.pack(fill=tk.BOTH, expand=True)

                # Diagnostic details text
                diag_text = tk.Text(
                    content_frame,
                    bg="#090d16",
                    fg="#f8fafc",
                    insertbackground="#38bdf8",
                    font=("Consolas", 9),
                    wrap=tk.WORD,
                    padx=12,
                    pady=12,
                    relief=tk.FLAT,
                    highlightthickness=1,
                    highlightbackground="#334155"
                )
                diag_text.pack(fill=tk.BOTH, expand=True)

                auth_ok, auth_msg = self.bridge.check_device_authorization()
                token_fingerprint = self.bridge.get_masked_token()
                acc_num = acc.get("accountNumber", "N/A") if acc else "N/A"
                broker = acc.get("brokerName", "N/A") if acc else "N/A"
                server = acc.get("serverName", "N/A") if acc else "N/A"
                balance = f"${acc.get('balance', 0):.2f}" if acc else "N/A"
                equity = f"${acc.get('equity', 0):.2f}" if acc else "N/A"
                
                adapter_status = f"Available (MetaTrader5 v{MT5_PACKAGE_VERSION})" if MT5_PACKAGE_AVAILABLE else f"MISSING / ERROR ({MT5_IMPORT_ERROR or 'ModuleNotFoundError'})"
                
                log_file_path = os.path.join(get_log_dir(), "companion.log")
                
                diag_lines = [
                    f"==================================================",
                    f"  ALPHA COACH MT5 COMPANION — DIAGNOSTICS REPORT",
                    f"  Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}",
                    f"==================================================",
                    f"",
                    f"--- [ APPLICATION & ENVIRONMENT ] ---",
                    f"  App Name:          {APP_NAME}",
                    f"  App Version:       v{__version__}",
                    f"  Python Runtime:    {platform.python_version()} ({platform.architecture()[0]})",
                    f"  Web Platform URL:  {self.bridge.web_url}",
                    f"  Backend API URL:   {self.bridge.api_url}",
                    f"  Log File Location: {log_file_path}",
                    f"",
                    f"--- [ METATRADER 5 PYTHON ADAPTER ] ---",
                    f"  Adapter Status:    {adapter_status}",
                    f"  Import Integrity:  {'PASS (Native C-Extension Loaded)' if MT5_PACKAGE_AVAILABLE else 'FAIL'}",
                    f"",
                    f"--- [ METATRADER 5 DESKTOP TERMINAL ] ---",
                    f"  MT5 Readiness:     {msg}",
                    f"  Terminal Name:     {term_name}",
                    f"  Terminal Build:    {term_build}",
                    f"  Terminal Path:     {term_path}",
                    f"  Account Number:    #{acc_num}",
                    f"  Broker Company:    {broker}",
                    f"  Server Name:       {server}",
                    f"  Current Balance:   {balance}",
                    f"  Current Equity:    {equity}",
                    f"",
                    f"--- [ AUTHORIZATION & CLOUD PAIRING ] ---",
                    f"  Device Name:       {self.bridge.device_name}",
                    f"  Device ID:         {self.bridge.active_device_id or 'None'}",
                    f"  Bridge State:      {self.bridge.state}",
                    f"  Token Configured:  {'YES' if self.bridge.device_token else 'NO'}",
                    f"  Token Fingerprint: {token_fingerprint}",
                    f"  Auth Status:       {'ACTIVE' if auth_ok else 'UNAUTHORIZED'} ({auth_msg})",
                    f"",
                    f"--- [ SYNCHRONIZATION ENGINE ] ---",
                    f"  Background Sync:   {'PAUSED' if self.bridge.is_sync_paused else 'ACTIVE (30s Interval)'}",
                    f"  Last Sync Time:    {self.bridge.last_sync_time or 'Never'}",
                    f"  Last Error:        {self.bridge.last_error_message or 'None (Healthy)'}",
                    f"  Failures Count:    {self.bridge.consecutive_failures}",
                    f"=================================================="
                ]
                
                raw_text = "\n".join(diag_lines)
                diag_text.insert(tk.END, raw_text)
                diag_text.config(state=tk.DISABLED)

                # Buttons Toolbar
                btn_frame = tk.Frame(root, bg="#1e293b", padx=16, pady=10)
                btn_frame.pack(fill=tk.X)

                def copy_to_clipboard():
                    root.clipboard_clear()
                    root.clipboard_append(raw_text)
                    self.notify("Copied", "Diagnostics report copied to clipboard.")

                def trigger_sync_from_dialog():
                    root.destroy()
                    self.sync_now()

                def trigger_pair_from_dialog():
                    root.destroy()
                    self.repair_pairing()

                def trigger_browse_terminal():
                    chosen = self.select_mt5_terminal_path(root)
                    if chosen:
                        root.destroy()
                        self.run_diagnostics()

                copy_btn = tk.Button(
                    btn_frame,
                    text="📋 Copy Report",
                    bg="#0284c7",
                    fg="#ffffff",
                    activebackground="#0369a1",
                    activeforeground="#ffffff",
                    font=("Segoe UI", 9, "bold"),
                    relief=tk.FLAT,
                    padx=10,
                    pady=5,
                    cursor="hand2",
                    command=copy_to_clipboard
                )
                copy_btn.pack(side=tk.LEFT, padx=(0, 6))

                browse_btn = tk.Button(
                    btn_frame,
                    text="📁 Browse MT5",
                    bg="#6366f1",
                    fg="#ffffff",
                    activebackground="#4f46e5",
                    activeforeground="#ffffff",
                    font=("Segoe UI", 9, "bold"),
                    relief=tk.FLAT,
                    padx=10,
                    pady=5,
                    cursor="hand2",
                    command=trigger_browse_terminal
                )
                browse_btn.pack(side=tk.LEFT, padx=(0, 6))

                sync_btn = tk.Button(
                    btn_frame,
                    text="⚡ Sync Now",
                    bg="#059669",
                    fg="#ffffff",
                    activebackground="#047857",
                    activeforeground="#ffffff",
                    font=("Segoe UI", 9, "bold"),
                    relief=tk.FLAT,
                    padx=10,
                    pady=5,
                    cursor="hand2",
                    command=trigger_sync_from_dialog
                )
                sync_btn.pack(side=tk.LEFT, padx=(0, 6))

                pair_btn = tk.Button(
                    btn_frame,
                    text="🔗 Re-pair",
                    bg="#8b5cf6",
                    fg="#ffffff",
                    activebackground="#7c3aed",
                    activeforeground="#ffffff",
                    font=("Segoe UI", 9, "bold"),
                    relief=tk.FLAT,
                    padx=10,
                    pady=5,
                    cursor="hand2",
                    command=trigger_pair_from_dialog
                )
                pair_btn.pack(side=tk.LEFT, padx=(0, 6))

                close_btn = tk.Button(
                    btn_frame,
                    text="Close",
                    bg="#334155",
                    fg="#ffffff",
                    activebackground="#475569",
                    activeforeground="#ffffff",
                    font=("Segoe UI", 9),
                    relief=tk.FLAT,
                    padx=10,
                    pady=5,
                    cursor="hand2",
                    command=root.destroy
                )
                close_btn.pack(side=tk.RIGHT)

                # Focus and run mainloop
                root.attributes("-topmost", True)
                root.mainloop()

            except Exception as e:
                companion_logger.exception(f"Failed to render diagnostics GUI: {e}")
                self.notify("Diagnostics Error", f"Unable to display diagnostics window: {e}")

        threading.Thread(target=_show_gui, daemon=True, name="DiagnosticsGUIWorker").start()

    def quit(self, *args):
        """Performs graceful shutdown."""
        try:
            companion_logger.info("Companion application shutdown requested.")
            self.bridge.state = BridgeState.UNPAIRED
            if MT5_PACKAGE_AVAILABLE and mt5 is not None:
                try:
                    mt5.shutdown()
                except Exception:
                    pass
        except Exception:
            pass
        sys.exit(0)
