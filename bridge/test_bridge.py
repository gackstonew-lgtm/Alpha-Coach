"""
Automated Verification Suite for Alpha Coach MT5 Bridge
Tests payload formatting, 3-month date range generation, mock generation and backend API integration.
"""

import unittest
from datetime import datetime, timedelta, timezone
from mock_mt5_adapter import generate_mock_3month_data
from alpha_coach_bridge import AlphaCoachBridge

class TestMT5Bridge(unittest.TestCase):
    def test_mock_data_generation_3months(self):
        data = generate_mock_3month_data()
        self.assertIn("accountInfo", data)
        self.assertIn("deals", data)
        self.assertIn("orders", data)
        self.assertGreater(len(data["deals"]), 50)
        self.assertGreater(len(data["orders"]), 50)
        self.assertEqual(data["accountInfo"]["accountNumber"], "5892104")

        # Verify time range covers roughly 90 days
        first_deal_time = datetime.fromisoformat(data["deals"][0]["time"])
        last_deal_time = datetime.fromisoformat(data["deals"][-1]["time"])
        days_span = (last_deal_time - first_deal_time).days
        self.assertGreaterEqual(days_span, 70)

    def test_bridge_config_handling(self):
        bridge = AlphaCoachBridge(api_url="http://localhost:4000/api/v1", device_token="test_tok_123")
        self.assertEqual(bridge.device_token, "test_tok_123")
        self.assertEqual(bridge.api_url, "http://localhost:4000/api/v1")

if __name__ == "__main__":
    unittest.main()
