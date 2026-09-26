"""
Alpha Coach - Windows Bridge Packaging Script
Compiles the MT5 Bridge and System Tray companion into a single standalone Windows executable (.exe).
"""

import sys
import os
import subprocess
import shutil

import hashlib

def build():
    print("==================================================")
    print("Building Alpha Coach MT5 Companion for Windows")
    print("==================================================")

    bridge_dir = os.path.dirname(os.path.abspath(__file__))
    dist_dir = os.path.join(bridge_dir, "dist")
    build_dir = os.path.join(bridge_dir, "build")

    main_script = os.path.join(bridge_dir, "alpha_coach_tray.py")

    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--name=AlphaCoach-MT5-Companion",
        "--onefile",
        "--noconsole",
        f"--add-data={os.path.join(bridge_dir, 'mock_mt5_adapter.py')};.",
        f"--add-data={os.path.join(bridge_dir, 'alpha_coach_bridge.py')};.",
        f"--add-data={os.path.join(bridge_dir, 'companion_controller.py')};.",
        f"--add-data={os.path.join(bridge_dir, 'companion_logger.py')};.",
        "--hidden-import=requests",
        "--hidden-import=pystray",
        "--hidden-import=PIL",
        "--hidden-import=MetaTrader5",
        "--hidden-import=colorama",
        "--hidden-import=tkinter",
        "--hidden-import=tkinter.ttk",
        "--hidden-import=tkinter.messagebox",
        main_script
    ]

    print(f"Executing: {' '.join(cmd)}")
    try:
        subprocess.run(cmd, check=True, cwd=bridge_dir)
        exe_path = os.path.join(dist_dir, "AlphaCoach-MT5-Companion.exe")
        setup_path = os.path.join(dist_dir, "AlphaCoach-MT5-Companion-Setup.exe")
        
        # Copy to Setup name for standard installer delivery
        shutil.copyfile(exe_path, setup_path)
        
        # Calculate SHA256
        hasher = hashlib.sha256()
        with open(setup_path, "rb") as f:
            while chunk := f.read(8192):
                hasher.update(chunk)
        sha256_hash = hasher.hexdigest()
        
        checksum_path = os.path.join(dist_dir, "checksums.txt")
        sha256_single_path = os.path.join(dist_dir, "AlphaCoach-MT5-Companion-Setup.exe.sha256")
        with open(checksum_path, "w") as f:
            f.write(f"{sha256_hash}  AlphaCoach-MT5-Companion-Setup.exe\n")
            f.write(f"{sha256_hash}  AlphaCoach-MT5-Companion.exe\n")
            
        with open(sha256_single_path, "w") as f:
            f.write(f"{sha256_hash}  AlphaCoach-MT5-Companion-Setup.exe\n")
            
        print("\n[SUCCESS] Windows Companion compiled successfully!")
        print(f"Executable output: {exe_path}")
        print(f"Setup output:      {setup_path}")
        print(f"SHA-256 Checksum:  {sha256_hash}")
    except Exception as e:
        print(f"\n[NOTE] PyInstaller build step: {e}")
        print("To build locally: pip install pyinstaller pystray pillow requests colorama && python bridge/build_windows_bridge.py")

if __name__ == "__main__":
    build()
