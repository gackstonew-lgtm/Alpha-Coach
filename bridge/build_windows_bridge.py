#!/usr/bin/env python3
"""
Alpha Coach - Windows Bridge Packaging Script
Authoritative Version: 1.0.5
Compiles the MT5 Companion system tray application into a standalone Windows executable (.exe),
signs binaries (when configured), and builds a standard Inno Setup Windows installer (.exe).
"""

import sys
import os
import shutil
import hashlib
import subprocess
import argparse
from typing import Optional

from sign_binaries import sign_file, verify_signature

def find_iscc(custom_path: Optional[str] = None) -> Optional[str]:
    """Finds Inno Setup Compiler (ISCC.exe)."""
    if custom_path and os.path.isfile(custom_path):
        return custom_path

    env_iscc = os.environ.get("ISCC_PATH")
    if env_iscc and os.path.isfile(env_iscc):
        return env_iscc

    which_iscc = shutil.which("iscc.exe") or shutil.which("iscc")
    if which_iscc:
        return which_iscc

    local_app_data = os.environ.get("LOCALAPPDATA", "")
    program_files_x86 = os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)")
    program_files = os.environ.get("ProgramFiles", r"C:\Program Files")

    candidate_paths = [
        os.path.join(local_app_data, "Programs", "Inno Setup 6", "ISCC.exe"),
        os.path.join(program_files_x86, "Inno Setup 6", "ISCC.exe"),
        os.path.join(program_files, "Inno Setup 6", "ISCC.exe"),
        os.path.join(local_app_data, "Programs", "Inno Setup 5", "ISCC.exe"),
        os.path.join(program_files_x86, "Inno Setup 5", "ISCC.exe"),
    ]

    for path in candidate_paths:
        if os.path.isfile(path):
            return path

    return None

def calculate_sha256(file_path: str) -> str:
    """Calculates SHA-256 digest of a file."""
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()

def build():
    parser = argparse.ArgumentParser(description="Build and package Alpha Coach MT5 Companion for Windows")
    parser.add_argument("--clean", action="store_true", help="Clean build and dist directories before packaging")
    parser.add_argument("--skip-pyinstaller", action="store_true", help="Skip PyInstaller compilation step")
    parser.add_argument("--skip-installer", action="store_true", help="Skip Inno Setup compilation step")
    parser.add_argument("--require-signing", action="store_true", help="Fail build if Authenticode signature is missing or invalid")
    parser.add_argument("--cert-file", help="Path to PFX certificate file")
    parser.add_argument("--cert-pass", help="Password for PFX certificate file")
    parser.add_argument("--iscc-path", help="Custom path to Inno Setup ISCC.exe")
    args = parser.parse_args()

    # Also check environment variable for strict signing requirement
    require_signing = args.require_signing or (os.environ.get("REQUIRE_CODE_SIGNING", "").lower() in ("true", "1", "yes"))

    bridge_dir = os.path.dirname(os.path.abspath(__file__))
    dist_dir = os.path.join(bridge_dir, "dist")
    build_dir = os.path.join(bridge_dir, "build")
    spec_file = os.path.join(bridge_dir, "AlphaCoach-MT5-Companion.spec")
    iss_file = os.path.join(bridge_dir, "installer", "alpha_coach_installer.iss")

    exe_path = os.path.join(dist_dir, "AlphaCoach-MT5-Companion.exe")
    setup_path = os.path.join(dist_dir, "AlphaCoach-MT5-Companion-Setup.exe")

    print("==================================================")
    print("Building Alpha Coach MT5 Companion for Windows (v1.0.5)")
    print("==================================================")
    print(f"Working Directory: {bridge_dir}")
    print(f"Require Signing:   {require_signing}")

    if args.clean:
        print("[CLEAN] Cleaning previous build artifacts...")
        if os.path.exists(build_dir):
            shutil.rmtree(build_dir, ignore_errors=True)
        if os.path.exists(dist_dir):
            shutil.rmtree(dist_dir, ignore_errors=True)

    os.makedirs(dist_dir, exist_ok=True)

    # ---------------------------------------------------------
    # Step 1: Compile Application Executable with PyInstaller
    # ---------------------------------------------------------
    if not args.skip_pyinstaller:
        print("\n--- [Step 1/5] Compiling PyInstaller Standalone Executable ---")
        pyinstaller_cmd = [
            sys.executable, "-m", "PyInstaller",
            "--clean",
            spec_file
        ]
        print(f"Executing: {' '.join(pyinstaller_cmd)}")
        res = subprocess.run(pyinstaller_cmd, cwd=bridge_dir)
        if res.returncode != 0:
            print("[ERROR] PyInstaller compilation failed!")
            sys.exit(res.returncode)

    if not os.path.isfile(exe_path) or os.path.getsize(exe_path) == 0:
        print(f"[ERROR] Expected executable was not produced or is empty: {exe_path}")
        sys.exit(1)

    print(f"[OK] Application executable created: {exe_path} ({os.path.getsize(exe_path):,} bytes)")

    # ---------------------------------------------------------
    # Step 2: Authenticode Sign Application Executable
    # ---------------------------------------------------------
    print("\n--- [Step 2/5] Signing Application Executable ---")
    ok, ver_exe = sign_file(exe_path, args.cert_file, args.cert_pass, require_signing=require_signing)
    if not ok:
        print("[ERROR] Application executable signing or signature verification failed!")
        sys.exit(1)

    # ---------------------------------------------------------
    # Step 3: Build Windows Installer with Inno Setup
    # ---------------------------------------------------------
    if not args.skip_installer:
        print("\n--- [Step 3/5] Compiling Windows Installer (Inno Setup) ---")
        iscc_exe = find_iscc(args.iscc_path)
        if not iscc_exe:
            print("[ERROR] Inno Setup compiler (ISCC.exe) not found!")
            print("Please install Inno Setup 6 (winget install JRSoftware.InnoSetup) or specify --iscc-path.")
            sys.exit(1)

        print(f"Using Inno Setup Compiler: {iscc_exe}")
        inno_cmd = [iscc_exe, iss_file]
        print(f"Executing: {' '.join(inno_cmd)}")
        res_inno = subprocess.run(inno_cmd, cwd=bridge_dir)
        if res_inno.returncode != 0:
            print("[ERROR] Inno Setup compilation failed!")
            sys.exit(res_inno.returncode)

    if not os.path.isfile(setup_path) or os.path.getsize(setup_path) == 0:
        print(f"[ERROR] Expected installer was not produced or is empty: {setup_path}")
        sys.exit(1)

    print(f"[OK] Windows installer created: {setup_path} ({os.path.getsize(setup_path):,} bytes)")

    # ---------------------------------------------------------
    # Step 4: Authenticode Sign Windows Installer
    # ---------------------------------------------------------
    print("\n--- [Step 4/5] Signing Windows Installer ---")
    ok, ver_setup = sign_file(setup_path, args.cert_file, args.cert_pass, require_signing=require_signing)
    if not ok:
        print("[ERROR] Windows installer signing or signature verification failed!")
        sys.exit(1)

    # ---------------------------------------------------------
    # Step 5: Compute Integrity Checksums & Checksum Files
    # ---------------------------------------------------------
    print("\n--- [Step 5/5] Computing SHA-256 Checksums ---")
    hash_setup = calculate_sha256(setup_path)
    hash_exe = calculate_sha256(exe_path)

    checksum_file = os.path.join(dist_dir, "checksums.txt")
    sha256_single_file = os.path.join(dist_dir, "AlphaCoach-MT5-Companion-Setup.exe.sha256")

    with open(checksum_file, "w", encoding="utf-8") as f:
        f.write(f"{hash_setup}  AlphaCoach-MT5-Companion-Setup.exe\n")
        f.write(f"{hash_exe}  AlphaCoach-MT5-Companion.exe\n")

    with open(sha256_single_file, "w", encoding="utf-8") as f:
        f.write(f"{hash_setup}  AlphaCoach-MT5-Companion-Setup.exe\n")

    print("\n==================================================")
    print("             PACKAGING SUCCESSFUL                 ")
    print("==================================================")
    print(f"Installer Path:   {setup_path}")
    print(f"Installer Size:   {os.path.getsize(setup_path):,} bytes")
    print(f"Installer SHA256: {hash_setup}")
    print(f"Installer Sign:   Status={ver_setup.get('status')} Valid={ver_setup.get('is_valid')}")
    print("--------------------------------------------------")
    print(f"Executable Path:  {exe_path}")
    print(f"Executable Size:  {os.path.getsize(exe_path):,} bytes")
    print(f"Executable SHA256:{hash_exe}")
    print(f"Executable Sign:  Status={ver_exe.get('status')} Valid={ver_exe.get('is_valid')}")
    print("--------------------------------------------------")
    print(f"Checksums File:   {checksum_file}")
    print(f"Single SHA256:    {sha256_single_file}")
    print("==================================================")

if __name__ == "__main__":
    build()
