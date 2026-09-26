"""
Alpha Coach MT5 Companion - Secure Rotating Logger
Provides persistent rotating disk logs at %LOCALAPPDATA%/AlphaCoach/logs/companion.log
with strict credential redaction and severity levels.
"""

import os
import sys
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime

def get_log_dir() -> str:
    local_app_data = os.environ.get("LOCALAPPDATA") or os.environ.get("APPDATA")
    if local_app_data:
        log_dir = os.path.join(local_app_data, "AlphaCoach", "logs")
    else:
        log_dir = os.path.join(os.path.dirname(__file__), "logs")
    os.makedirs(log_dir, exist_ok=True)
    return log_dir

def mask_sensitive(text: str) -> str:
    """Masks authorization tokens, keys, and credentials."""
    import re
    # Mask ac_bridge_ tokens
    text = re.sub(r'ac_bridge_[a-zA-Z0-9]{8,}', lambda m: f"{m.group(0)[:12]}••••", text)
    # Mask JWTs
    text = re.sub(r'eyJ[a-zA-Z0-9_\-]{20,}\.[a-zA-Z0-9_\-]{20,}\.[a-zA-Z0-9_\-]{10,}', 'eyJ••••••••', text)
    # Mask passwords if any pattern matches
    text = re.sub(r'(?i)(password|secret|key)["\s:=]+["\']?([^"\'\s]+)', r'\1: ••••••••', text)
    return text

class MaskingFormatter(logging.Formatter):
    def format(self, record):
        orig_msg = super().format(record)
        return mask_sensitive(orig_msg)

def setup_companion_logger() -> logging.Logger:
    logger = logging.getLogger("AlphaCoachCompanion")
    logger.setLevel(logging.INFO)
    
    if not logger.handlers:
        log_dir = get_log_dir()
        log_file = os.path.join(log_dir, "companion.log")
        
        # 5 MB max size, 3 backup files
        file_handler = RotatingFileHandler(log_file, maxBytes=5 * 1024 * 1024, backupCount=3, encoding="utf-8")
        file_formatter = MaskingFormatter('[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
        file_handler.setFormatter(file_formatter)
        file_handler.setLevel(logging.INFO)
        logger.addHandler(file_handler)
        
        # Also console if available
        if sys.stdout is not None:
            console_handler = logging.StreamHandler(sys.stdout)
            console_formatter = MaskingFormatter('[%(asctime)s] [%(levelname)s] %(message)s', datefmt='%H:%M:%S')
            console_handler.setFormatter(console_formatter)
            console_handler.setLevel(logging.INFO)
            logger.addHandler(console_handler)
            
    return logger

companion_logger = setup_companion_logger()
