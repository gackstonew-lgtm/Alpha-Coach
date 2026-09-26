"""
Alpha Coach - Windows Bridge Packaging Script
Compiles the MT5 Bridge and System Tray companion into a single standalone Windows executable (.exe).
"""

import sys
import os
import subprocess
import shutil

def build():
    print("==================================================")
    print("Building Alpha Coach MT5 Bridge for Windows")
    print("==================================================")

    bridge_dir = os.path.dirname(os.path.abspath(__file__))
    dist_dir = os.path.join(bridge_dir, "dist")
    build_dir = os.path.join(bridge_dir, "build")

    main_script = os.path.join(bridge_dir, "alpha_coach_tray.py")

    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--name=AlphaCoachMT5Bridge",
        "--onefile",
        "--noconsole",
        f"--add-data={os.path.join(bridge_dir, 'mock_mt5_adapter.py')};.",
        f"--add-data={os.path.join(bridge_dir, 'alpha_coach_bridge.py')};.",
        "--hidden-import=requests",
        "--hidden-import=pystray",
        "--hidden-import=PIL",
        "--hidden-import=MetaTrader5",
        main_script
    ]

    print(f"Executing: {' '.join(cmd)}")
    try:
        subprocess.run(cmd, check=True, cwd=bridge_dir)
        print("\n[SUCCESS] Windows Bridge compiled successfully!")
        print(f"Executable output: {os.path.join(dist_dir, 'AlphaCoachMT5Bridge.exe')}")
    except Exception as e:
        print(f"\n[NOTE] PyInstaller build step: {e}")
        print("To build locally: pip install pyinstaller pystray pillow && python bridge/build_windows_bridge.py")

if __name__ == "__main__":
    build()
