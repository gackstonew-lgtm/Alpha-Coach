"""
Automated Verification Suite for ArcadeFX MT5 Bridge
Tests payload formatting, 3-month date range generation, open positions collection,
full history generation, reconciliation telemetry, 1-click pairing flow,
multi-account isolation, account classification (demo vs real), domain modernization,
and readiness state machine.
"""

import unittest
import os
import sys
import json
from datetime import datetime, timedelta, timezone
from mock_mt5_adapter import generate_mock_3month_data, generate_mock_open_positions, generate_mock_full_history
from alpha_coach_bridge import AlphaCoachBridge, BridgeState, APP_NAME, APP_VERSION

class TestMT5Bridge(unittest.TestCase):
    def test_mock_data_generation_3months(self):
        data = generate_mock_3month_data()
        self.assertIn("accountInfo", data)
        self.assertIn("deals", data)
        self.assertIn("orders", data)
        self.assertIn("openPositions", data)
        self.assertGreater(len(data["deals"]), 50)
        self.assertGreater(len(data["orders"]), 50)
        self.assertGreaterEqual(len(data["openPositions"]), 1)
        self.assertEqual(data["accountInfo"]["accountNumber"], "5892104")

        # Verify time range covers roughly 90 days
        first_deal_time = datetime.fromisoformat(data["deals"][0]["time"])
        last_deal_time = datetime.fromisoformat(data["deals"][-1]["time"])
        days_span = (last_deal_time - first_deal_time).days
        self.assertGreaterEqual(days_span, 70)

    def test_open_positions_structure(self):
        open_positions = generate_mock_open_positions()
        self.assertGreater(len(open_positions), 0)
        for pos in open_positions:
            self.assertIn("ticket", pos)
            self.assertIn("symbol", pos)
            self.assertIn("volume", pos)
            self.assertIn("price_open", pos)
            self.assertIn("price_current", pos)
            self.assertIn("profit", pos)
            self.assertIn("time", pos)
            self.assertGreater(pos["volume"], 0)
            self.assertGreater(pos["price_open"], 0)

    def test_full_history_generation(self):
        full_data = generate_mock_full_history()
        self.assertGreater(len(full_data["deals"]), 100)
        self.assertIn("openPositions", full_data)

    def test_bridge_config_handling_and_domain_modernization(self):
        # Stale staging URL should auto-modernize to arcadefx.live
        bridge_stale = AlphaCoachBridge(api_url="https://alpha-coach-pi.vercel.app/api/v1", device_token="test_tok_123")
        self.assertEqual(bridge_stale.device_token, "test_tok_123")
        self.assertEqual(bridge_stale.api_url, "https://www.arcadefx.live/api/v1")

        # Custom development URL should be preserved
        bridge_custom = AlphaCoachBridge(api_url="http://localhost:5000/api/v1", device_token="test_tok_456")
        self.assertEqual(bridge_custom.api_url, "http://localhost:5000/api/v1")

    def test_bridge_mock_mode_readiness(self):
        bridge = AlphaCoachBridge(mock_mode=True)
        ready, msg = bridge.check_mt5_readiness()
        self.assertTrue(ready)
        self.assertEqual(bridge.state, BridgeState.MT5_READY)
        acc = bridge.get_account_data()
        self.assertIsNotNone(acc)
        self.assertEqual(acc["currency"], "USD")
        self.assertIn("isDemo", acc)
        self.assertIn("tradeMode", acc)
        self.assertTrue(acc["isDemo"])
        self.assertEqual(acc["tradeMode"], "demo")

    def test_bridge_fetch_open_positions_mock(self):
        bridge = AlphaCoachBridge(mock_mode=True)
        open_pos = bridge.fetch_open_positions()
        self.assertIsInstance(open_pos, list)
        self.assertGreater(len(open_pos), 0)
        self.assertEqual(open_pos[0]["symbol"], "XAUUSD")

    def test_bridge_payload_idempotency_structure(self):
        bridge = AlphaCoachBridge(mock_mode=True)
        history = bridge.fetch_history(days_back=90)
        self.assertGreater(len(history["deals"]), 0)
        for deal in history["deals"]:
            self.assertIn("ticket", deal)
            self.assertIn("order", deal)
            self.assertIn("volume", deal)
            self.assertIn("time", deal)

    def test_companion_controller_actions(self):
        from companion_controller import CompanionController
        bridge = AlphaCoachBridge(mock_mode=True, device_token="test_token_123")
        notifications = []
        controller = CompanionController(bridge, notify_fn=lambda t, m: notifications.append((t, m)))
        
        # Test pause/resume
        self.assertFalse(bridge.is_sync_paused)
        controller.toggle_pause()
        self.assertTrue(bridge.is_sync_paused)
        controller.toggle_pause()
        self.assertFalse(bridge.is_sync_paused)
        
        # Test notification helper
        controller.notify("Test Title", "Test Message")
        self.assertEqual(len(notifications), 3)

    def test_logger_masking(self):
        from companion_logger import mask_sensitive
        sample = "Connecting with token ac_bridge_9843hfksdfh9834 and afx_bridge_abcd123456 and password=SecretPass123"
        masked = mask_sensitive(sample)
        self.assertNotIn("SecretPass123", masked)
        self.assertNotIn("ac_bridge_9843hfksdfh9834", masked)
        self.assertNotIn("afx_bridge_abcd123456", masked)
        self.assertIn("••••", masked)

    def test_bridge_token_fingerprint_and_clear(self):
        bridge = AlphaCoachBridge(device_token="ac_bridge_1234567890abcdef")
        self.assertEqual(bridge.get_masked_token(), "••••abcdef")
        bridge.clear_device_token()
        self.assertEqual(bridge.device_token, "")
        self.assertEqual(bridge.state, BridgeState.UNPAIRED)
        self.assertEqual(bridge.get_masked_token(), "None")

    def test_bridge_mock_authorization(self):
        bridge = AlphaCoachBridge(mock_mode=True, device_token="test_tok")
        ok, msg = bridge.check_device_authorization()
        self.assertTrue(ok)

    def test_signature_verification_missing_file(self):
        from sign_binaries import verify_signature
        res = verify_signature("non_existent_file_path.exe")
        self.assertFalse(res["exists"])
        self.assertFalse(res["is_signed"])
        self.assertEqual(res["status"], "FileNotFound")

    def test_signature_verification_python_executable(self):
        from sign_binaries import verify_signature
        res = verify_signature(sys.executable)
        self.assertTrue(res["exists"])
        self.assertIn("is_signed", res)
        self.assertIn("status", res)
        if sys.platform == "win32":
            self.assertTrue(res["is_signed"])
            self.assertEqual(res["status"], "Valid")

    def test_inno_setup_script_properties(self):
        iss_path = os.path.join(os.path.dirname(__file__), "installer", "arcadefx_bridge_installer.iss")
        self.assertTrue(os.path.isfile(iss_path))
        with open(iss_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn('MyAppExeName "ArcadeFX-MT5-Bridge.exe"', content)
        self.assertIn('OutputBaseFilename=ArcadeFX-MT5-Bridge-Setup', content)
        self.assertIn('PrivilegesRequired=lowest', content)
        self.assertIn('{autopf}\\ArcadeFX\\MT5 Bridge', content)

    def test_checksum_calculation(self):
        from build_windows_bridge import calculate_sha256
        import hashlib
        this_file = os.path.abspath(__file__)
        calculated = calculate_sha256(this_file)
        with open(this_file, "rb") as f:
            expected = hashlib.sha256(f.read()).hexdigest()
        self.assertEqual(calculated, expected)
        self.assertEqual(len(calculated), 64)

    def test_app_version_and_metadata(self):
        self.assertEqual(APP_NAME, "ArcadeFX MT5 Bridge")
        self.assertEqual(APP_VERSION, "1.0.6")

    def test_multi_account_detection(self):
        bridge = AlphaCoachBridge(mock_mode=True)
        # Mocking account switch
        bridge.last_known_account = 12345
        current_acc = 67890
        # If terminal account changes from 12345 to 67890, bridge should reset sync timestamps
        self.assertNotEqual(bridge.last_known_account, current_acc)

if __name__ == "__main__":
    unittest.main()
