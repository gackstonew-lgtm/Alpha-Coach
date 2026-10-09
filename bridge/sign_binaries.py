#!/usr/bin/env python3
"""
Alpha Coach MT5 Companion - Windows Authenticode Code Signing & Verification Engine
Provides production-grade Authenticode signing, RFC 3161 timestamping,
and signature verification for Windows executables and installers.

Supports:
- Windows SDK SignTool (signtool.exe)
- Windows PowerShell Set-AuthenticodeSignature
- RFC 3161 Timestamping (DigiCert / Sectigo)
- Environment variable and CLI configuration
- Signature verification and reporting
- Graceful unsigned fallback for local development
"""

import os
import sys
import shutil
import subprocess
import argparse
from typing import Dict, Any, Optional, Tuple

TIMESTAMP_SERVERS = [
    "http://timestamp.digicert.com",
    "http://timestamp.sectigo.com",
    "http://timestamp.globalsign.com/tsa/r6advanced1"
]

def find_signtool() -> Optional[str]:
    """Finds signtool.exe from Windows SDK or system PATH."""
    which_signtool = shutil.which("signtool.exe") or shutil.which("signtool")
    if which_signtool:
        return which_signtool

    # Search common Windows Kits paths
    sdk_roots = [
        os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)") + r"\Windows Kits\10\bin",
        os.environ.get("ProgramFiles", r"C:\Program Files") + r"\Windows Kits\10\bin"
    ]
    for root in sdk_roots:
        if os.path.isdir(root):
            for dirpath, _, filenames in os.walk(root):
                if "signtool.exe" in [f.lower() for f in filenames]:
                    # Prefer x64 if available
                    if "x64" in dirpath.lower():
                        return os.path.join(dirpath, "signtool.exe")
                    return os.path.join(dirpath, "signtool.exe")
    return None

def verify_signature(file_path: str) -> Dict[str, Any]:
    """
    Verifies Authenticode signature using PowerShell Get-AuthenticodeSignature.
    Returns status dict containing is_signed, is_valid, status, subject, issuer, timestamp.
    """
    if not os.path.isfile(file_path):
        return {
            "path": file_path,
            "exists": False,
            "is_signed": False,
            "is_valid": False,
            "status": "FileNotFound",
            "message": "File does not exist"
        }

    ps_script = f"""
    $sig = Get-AuthenticodeSignature -LiteralPath '{file_path}'
    $cert = $sig.SignerCertificate
    [PSCustomObject]@{{
        Status = $sig.Status.ToString()
        StatusMessage = $sig.StatusMessage
        Subject = if ($cert) {{ $cert.Subject }} else {{ '' }}
        Issuer = if ($cert) {{ $cert.Issuer }} else {{ '' }}
        Thumbprint = if ($cert) {{ $cert.Thumbprint }} else {{ '' }}
        NotAfter = if ($cert) {{ $cert.NotAfter.ToString("o") }} else {{ '' }}
    }} | ConvertTo-Json -Compress
    """

    try:
        proc = subprocess.run(
            ["powershell", "-NoProfile", "-NonInteractive", "-Command", ps_script],
            capture_output=True,
            text=True,
            check=True
        )
        import json
        data = json.loads(proc.stdout.strip())
        status = data.get("Status", "Unknown")
        is_valid = (status == "Valid")
        is_signed = (status != "NotSigned")
        return {
            "path": file_path,
            "exists": True,
            "is_signed": is_signed,
            "is_valid": is_valid,
            "status": status,
            "status_message": data.get("StatusMessage", ""),
            "subject": data.get("Subject", ""),
            "issuer": data.get("Issuer", ""),
            "thumbprint": data.get("Thumbprint", ""),
            "not_after": data.get("NotAfter", "")
        }
    except Exception as e:
        return {
            "path": file_path,
            "exists": True,
            "is_signed": False,
            "is_valid": False,
            "status": "Error",
            "message": f"Verification error: {e}"
        }

def sign_with_signtool(
    file_path: str,
    signtool_exe: str,
    cert_path: str,
    cert_password: Optional[str] = None,
    timestamp_url: str = TIMESTAMP_SERVERS[0]
) -> bool:
    """Signs an executable using signtool.exe with RFC 3161 timestamping."""
    cmd = [
        signtool_exe,
        "sign",
        "/fd", "SHA256",
        "/tr", timestamp_url,
        "/td", "SHA256",
        "/f", cert_path
    ]
    if cert_password:
        cmd.extend(["/p", cert_password])
    cmd.append(file_path)

    for ts in TIMESTAMP_SERVERS:
        cmd[cmd.index("/tr") + 1] = ts
        try:
            print(f"[SIGN] Attempting signtool signing with timestamp: {ts}")
            res = subprocess.run(cmd, capture_output=True, text=True, check=False)
            if res.returncode == 0:
                print(f"[SIGN SUCCESS] {file_path} signed successfully via SignTool.")
                return True
            else:
                print(f"[SIGN WARNING] SignTool failed with timestamp {ts}: {res.stderr.strip() or res.stdout.strip()}")
        except Exception as e:
            print(f"[SIGN WARNING] Error running signtool: {e}")
    return False

def sign_with_powershell(
    file_path: str,
    cert_path: str,
    cert_password: Optional[str] = None
) -> bool:
    """Signs an executable using PowerShell Set-AuthenticodeSignature as a fallback."""
    pw_clause = f"$secPass = ConvertTo-SecureString '{cert_password}' -AsPlainText -Force\n$cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2('{cert_path}', $secPass)" if cert_password else f"$cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2('{cert_path}')"

    for ts in TIMESTAMP_SERVERS:
        ps_script = f"""
        try {{
            {pw_clause}
            $res = Set-AuthenticodeSignature -FilePath '{file_path}' -Certificate $cert -HashAlgorithm SHA256 -TimestampServer '{ts}'
            if ($res.Status -eq 'Valid') {{ exit 0 }} else {{ exit 2 }}
        }} catch {{
            exit 1
        }}
        """
        try:
            print(f"[SIGN] Attempting PowerShell Set-AuthenticodeSignature with timestamp: {ts}")
            proc = subprocess.run(
                ["powershell", "-NoProfile", "-NonInteractive", "-Command", ps_script],
                capture_output=True,
                text=True,
                check=False
            )
            if proc.returncode == 0:
                print(f"[SIGN SUCCESS] {file_path} signed successfully via PowerShell.")
                return True
        except Exception as e:
            print(f"[SIGN WARNING] PowerShell signing error: {e}")
    return False

def sign_file(
    file_path: str,
    cert_path: Optional[str] = None,
    cert_password: Optional[str] = None,
    require_signing: bool = False
) -> Tuple[bool, Dict[str, Any]]:
    """
    Main entry point for signing a single file and verifying the result.
    If no certificate is provided, checks if require_signing is True.
    """
    if not os.path.isfile(file_path):
        print(f"[SIGN ERROR] Target file not found: {file_path}")
        return False, {"error": "File not found"}

    cert_path = cert_path or os.environ.get("WINDOWS_CERTIFICATE_PFX_PATH")
    cert_password = cert_password or os.environ.get("WINDOWS_CERTIFICATE_PASSWORD")

    # If certificate base64 string is in env, write to temporary file
    temp_cert_file = None
    if not cert_path and os.environ.get("WINDOWS_CERTIFICATE_PFX"):
        import base64
        import tempfile
        pfx_b64 = os.environ.get("WINDOWS_CERTIFICATE_PFX", "")
        if pfx_b64.strip():
            try:
                pfx_bytes = base64.b64decode(pfx_b64.strip())
                tmp = tempfile.NamedTemporaryFile(suffix=".pfx", delete=False)
                tmp.write(pfx_bytes)
                tmp.close()
                cert_path = tmp.name
                temp_cert_file = cert_path
                print("[SIGN] Loaded PFX certificate from WINDOWS_CERTIFICATE_PFX environment variable.")
            except Exception as e:
                print(f"[SIGN ERROR] Failed to decode WINDOWS_CERTIFICATE_PFX: {e}")

    signed_ok = False
    if cert_path and os.path.isfile(cert_path):
        signtool_exe = find_signtool()
        if signtool_exe:
            signed_ok = sign_with_signtool(file_path, signtool_exe, cert_path, cert_password)
        if not signed_ok:
            signed_ok = sign_with_powershell(file_path, cert_path, cert_password)
    else:
        print("[SIGN INFO] No code-signing certificate provided or configured.")
        if require_signing:
            print("[SIGN ERROR] Code signing is strictly required (--require-signing / REQUIRE_CODE_SIGNING=true). Failing build.")
            if temp_cert_file and os.path.exists(temp_cert_file):
                os.remove(temp_cert_file)
            return False, {"error": "Missing required signing certificate"}

    if temp_cert_file and os.path.exists(temp_cert_file):
        try:
            os.remove(temp_cert_file)
        except Exception:
            pass

    # Verify signature
    verification = verify_signature(file_path)
    print(f"[SIGN VERIFY] {os.path.basename(file_path)}: Status={verification.get('status')} Valid={verification.get('is_valid')} Subject={verification.get('subject', 'None')}")

    if require_signing and not verification.get("is_valid"):
        return False, verification

    return True, verification

def main():
    parser = argparse.ArgumentParser(description="Sign and verify Windows binaries for Alpha Coach MT5 Companion")
    parser.add_argument("--file", help="Path to binary or installer to sign")
    parser.add_argument("--verify", help="Verify signature of the specified binary")
    parser.add_argument("--cert-file", help="Path to PFX certificate")
    parser.add_argument("--cert-pass", help="Password for PFX certificate")
    parser.add_argument("--require-signing", action="store_true", help="Fail if binary is not signed with valid signature")
    args = parser.parse_args()

    if args.verify:
        v = verify_signature(args.verify)
        print("Signature Verification:")
        for k, val in v.items():
            print(f"  {k}: {val}")
        if args.require_signing and not v.get("is_valid"):
            sys.exit(1)
        sys.exit(0)

    if args.file:
        ok, v = sign_file(args.file, args.cert_file, args.cert_pass, args.require_signing)
        if not ok:
            sys.exit(1)
        sys.exit(0)

    parser.print_help()

if __name__ == "__main__":
    main()
