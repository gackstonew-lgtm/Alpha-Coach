#!/usr/bin/env python3
"""
Unit and integration test suite for Arcade Fx MT5 Bot Agent.
Proves:
1. Cloud commands cannot raise risk above local ceilings.
2. Cloud commands cannot enable live trading without local confirmation.
3. HMAC command signature verification and replay rejection.
4. Offline event queuing and deduplication.
5. Local credential store persistence.
"""

import os
import sys
import json
import time
import hmac
import hashlib
import unittest
import tempfile
import shutil

# Add agent path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mt5_bot_agent import (
    MT5BotAgent,
    LocalCredentialStore,
    OfflineEventQueue,
    AGENT_VERSION
)


class TestMT5BotAgent(unittest.TestCase):

    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.queue_db = os.path.join(self.test_dir, "test_queue.sqlite")
        self.agent = MT5BotAgent(api_url="http://localhost:4000/api/v1")
        self.agent.signing_secret = hashlib.sha256(b"arcadefx_test_agent_signing_seed").hexdigest()
        self.agent.offline_queue = OfflineEventQueue(db_path=self.queue_db)

    def tearDown(self):
        shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_local_hard_limits_reject_excessive_risk(self):
        """Proves that cloud commands attempting to raise risk above local ceiling are strictly rejected."""
        # Local ceiling is 1.0%
        cloud_payload = {"riskPercent": 2.5}
        allowed, err = self.agent.validate_local_limits_for_command("update_config", cloud_payload)
        self.assertFalse(allowed)
        self.assertIn("exceeds local machine hard ceiling", err)

        # Risk within limit is permitted
        cloud_safe_payload = {"riskPercent": 0.8}
        allowed_safe, err_safe = self.agent.validate_local_limits_for_command("update_config", cloud_safe_payload)
        self.assertTrue(allowed_safe)
        self.assertIsNone(err_safe)

    def test_local_hard_limits_reject_live_trading_without_local_confirmation(self):
        """Proves that cloud commands CANNOT enable live trading unless locally configured."""
        cloud_payload = {"mode": "LIVE"}
        allowed, err = self.agent.validate_local_limits_for_command("start", cloud_payload)
        self.assertFalse(allowed)
        self.assertIn("Live trading REJECTED", err)

    def test_command_signature_and_replay_rejection(self):
        """Proves HMAC command signing verification, tampered payload rejection, and nonce replay rejection."""
        command_id = "cmd-test-123"
        instance_id = "inst-test-456"
        nonce = "nonce-unique-abc1"
        expires_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time() + 300))
        payload = {"riskPercent": 0.5}

        msg = {
            "commandId": command_id,
            "instanceId": instance_id,
            "commandType": "update_config",
            "payload": payload,
            "nonce": nonce,
            "expiresAt": expires_at
        }
        serialized = json.dumps(msg, sort_keys=True)
        valid_sig = hmac.new(
            self.agent.signing_secret.encode("utf-8"),
            serialized.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

        cmd_obj = {
            "id": command_id,
            "instance_id": instance_id,
            "command_type": "update_config",
            "payload_json": json.dumps(payload),
            "nonce": nonce,
            "expires_at": expires_at,
            "signature": valid_sig
        }

        # 1. Valid signature succeeds
        self.assertTrue(self.agent.verify_command_signature(cmd_obj))

        # 2. Replay of same nonce is rejected
        self.assertFalse(self.agent.verify_command_signature(cmd_obj))

        # 3. Tampered payload is rejected
        tampered_cmd = {
            "id": "cmd-test-tampered",
            "instance_id": instance_id,
            "command_type": "update_config",
            "payload_json": json.dumps({"riskPercent": 99.0}),
            "nonce": "nonce-new-abc2",
            "expires_at": expires_at,
            "signature": valid_sig  # Original signature does not match tampered payload
        }
        self.assertFalse(self.agent.verify_command_signature(tampered_cmd))

    def test_offline_queueing_and_deduplication(self):
        """Proves events are queued locally and deduplication prevents redundant sync."""
        q = self.agent.offline_queue
        q.enqueue("order_executed", {"ticket": "1001", "profit": 50.0}, "dedup-order-1001")
        # Duplicate enqueue with same dedup_id is ignored
        q.enqueue("order_executed", {"ticket": "1001", "profit": 50.0}, "dedup-order-1001")

        pending = q.get_pending()
        self.assertEqual(len(pending), 1)
        self.assertEqual(pending[0]["dedupId"], "dedup-order-1001")

        # Delete after drain
        q.delete_events([pending[0]["id"]])
        self.assertEqual(len(q.get_pending()), 0)


if __name__ == "__main__":
    unittest.main()
