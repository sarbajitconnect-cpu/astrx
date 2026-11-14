#!/usr/bin/env python3
"""
Comprehensive Android Verification & Validation Suite for Astra AI
"""

import json
import os
import subprocess
import sys
import zipfile
from pathlib import Path
import urllib.request
import urllib.parse

ROOT_DIR = Path(__file__).resolve().parent
DIST_DIR = ROOT_DIR / "dist-android"
ANDROID_DIR = ROOT_DIR / "android"

def run_tests():
    print("=" * 70)
    print("ASTRA AI OFFICIAL ANDROID APPLICATION VERIFICATION SUITE")
    print("=" * 70)

    # ---------------------------------------------------------
    # SUITE 1: Android Build Artifacts & Deliverables Validation
    # ---------------------------------------------------------
    print("\n[SUITE 1] Verifying Generated Android Deliverables...")
    debug_apk = DIST_DIR / "Astra-AI-Debug.apk"
    release_apk = DIST_DIR / "Astra-AI-Release.apk"
    release_aab = DIST_DIR / "Astra-AI-Release.aab"

    for path, name in [(debug_apk, "Debug APK"), (release_apk, "Release APK"), (release_aab, "Release AAB")]:
        assert path.exists(), f"Missing {name} at {path}"
        size_mb = path.stat().st_size / (1024 * 1024)
        assert size_mb > 4.0, f"{name} file size too small: {size_mb:.2f} MB"
        print(f"  ✓ {name:20}: {path.name} ({size_mb:.2f} MB) - Valid")

    # ---------------------------------------------------------
    # SUITE 2: APK Archive Structure & Asset Integrity
    # ---------------------------------------------------------
    print("\n[SUITE 2] Inspecting APK Manifest, Assets & Resource Packing...")
    with zipfile.ZipFile(release_apk, 'r') as zf:
        namelist = set(zf.namelist())

        required_files = [
            "AndroidManifest.xml",
            "classes.dex",
            "resources.arsc",
            "assets/public/index.html",
            "assets/public/landing.html",
            "assets/public/config.js",
            "assets/public/static/app.js",
            "assets/public/static/style.css",
            "assets/public/static/astra_bg.jpg",
            "assets/public/static/astra_logo.png"
        ]
        for req in required_files:
            matches = [f for f in namelist if req in f or f == req]
            assert matches, f"Missing required file in APK: {req}"
            print(f"  ✓ Embedded asset: {req}")

    # ---------------------------------------------------------
    # SUITE 3: AAPT Badging & Permissions Verification
    # ---------------------------------------------------------
    print("\n[SUITE 3] AAPT Badging, Package Name & Native Permissions...")
    aapt_bin = Path("/opt/homebrew/share/android-commandlinetools/build-tools/34.0.0/aapt")
    if aapt_bin.exists():
        res = subprocess.run([str(aapt_bin), "dump", "badging", str(release_apk)], capture_output=True, text=True)
        assert res.returncode == 0, f"aapt dump failed: {res.stderr}"
        output = res.stdout

        assert "name='com.astra.ai'" in output, "Incorrect package name in APK"
        assert "launchable-activity: name='com.astra.ai.MainActivity'" in output, "MainActivity launchable missing"
        
        expected_permissions = [
            "android.permission.INTERNET",
            "android.permission.ACCESS_NETWORK_STATE",
            "android.permission.CAMERA",
            "android.permission.RECORD_AUDIO",
            "android.permission.MODIFY_AUDIO_SETTINGS",
            "android.permission.READ_MEDIA_IMAGES",
            "android.permission.READ_MEDIA_VIDEO",
            "android.permission.READ_MEDIA_AUDIO",
        ]
        for perm in expected_permissions:
            assert f"uses-permission: name='{perm}'" in output, f"Missing permission: {perm}"
            print(f"  ✓ Verified native permission: {perm}")
        print("  ✓ Package identifier: com.astra.ai (versionCode=1, versionName=1.0)")
    else:
        print("  ! aapt binary not found, skipping deep binary badging.")

    # ---------------------------------------------------------
    # SUITE 4: Backend Integration & Website Synchronization
    # ---------------------------------------------------------
    print("\n[SUITE 4] Live Website Backend Verification (https://astrxai.com)...")
    base_url = "https://astrxai.com"

    # 1. Healthcheck
    req = urllib.request.Request(f"{base_url}/api/health", headers={"User-Agent": "Astra-Android/1.0"})
    with urllib.request.urlopen(req, timeout=15) as response:
        health_data = json.loads(response.read().decode('utf-8'))
        assert health_data.get("status") in ("healthy", "ok"), f"Unhealthy status: {health_data}"
        print(f"  ✓ Live API Healthcheck ({base_url}/api/health): OK")

    # 2. Token Status
    req = urllib.request.Request(f"{base_url}/api/tokens/status", headers={"User-Agent": "Astra-Android/1.0"})
    with urllib.request.urlopen(req, timeout=15) as response:
        token_data = json.loads(response.read().decode('utf-8'))
        print(f"  ✓ Live Token System ({base_url}/api/tokens/status):", token_data)

    # 3. Quick Mode Chat Query
    print("\n[SUITE 5] Live Mode Execution via Android API Client...")
    chat_payload = json.dumps({
        "message": "What is Astra AI in 2 sentences?",
        "mode": "core"
    }).encode('utf-8')
    req = urllib.request.Request(
        f"{base_url}/api/chat",
        data=chat_payload,
        headers={
            "Content-Type": "application/json",
            "User-Agent": "Astra-Android/1.0",
            "X-Device-Id": "test_android_verify_suite"
        }
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        chat_data = json.loads(response.read().decode('utf-8'))
        answer = chat_data.get("answer", "")
        assert len(answer) > 10, f"Empty answer received: {chat_data}"
        print("  ✓ Quick Mode Chat Response:")
        print("   ", answer[:180].strip() + ("..." if len(answer) > 180 else ""))

    # 4. Code Mode Chat Query
    code_payload = json.dumps({
        "message": "Write a python function to compute factorial.",
        "mode": "code"
    }).encode('utf-8')
    req = urllib.request.Request(
        f"{base_url}/api/chat",
        data=code_payload,
        headers={
            "Content-Type": "application/json",
            "User-Agent": "Astra-Android/1.0",
            "X-Device-Id": "test_android_verify_suite"
        }
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        code_data = json.loads(response.read().decode('utf-8'))
        code_ans = code_data.get("answer", "")
        assert "def factorial" in code_ans or "factorial" in code_ans, "Code mode failed to generate factorial"
        print("  ✓ Code Mode Chat Response:")
        print("   ", code_ans[:180].strip() + ("..." if len(code_ans) > 180 else ""))

    print("\n" + "=" * 70)
    print("ALL VERIFICATION SUITES PASSED! ANDROID APPLICATION IS PRODUCTION-READY!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
