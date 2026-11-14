#!/usr/bin/env python3
"""
Astra AI - Official Android Application Build Script
Builds Debug APK, Release APK, and Release AAB with Capacitor.
"""

import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
STATIC_SRC = ROOT_DIR / "astra-ai-main" / "static"
WWW_DIR = ROOT_DIR / "www"
ANDROID_DIR = ROOT_DIR / "android"
DIST_DIR = ROOT_DIR / "dist-android"

JAVA_HOME = "/opt/homebrew/opt/openjdk@21"
ANDROID_HOME = "/opt/homebrew/share/android-commandlinetools"

def setup_environment():
    env = os.environ.copy()
    env["JAVA_HOME"] = JAVA_HOME
    env["ANDROID_HOME"] = ANDROID_HOME
    env["ANDROID_SDK_ROOT"] = ANDROID_HOME
    env["PATH"] = f"{JAVA_HOME}/bin:{ANDROID_HOME}/cmdline-tools/latest/bin:{ANDROID_HOME}/platform-tools:{env.get('PATH', '')}"
    return env

def bundle_web_assets(api_base_url="https://astrxai.com"):
    print("[1/5] Bundling production web assets into www/...")
    if WWW_DIR.exists():
        shutil.rmtree(WWW_DIR)
    WWW_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Copy static folder
    shutil.copytree(STATIC_SRC, WWW_DIR / "static", dirs_exist_ok=True)

    # 2. Generate config.js
    config_js = f"""// Astra Official Android Application - Backend Configuration
window.ASTRA_API_BASE_URL = localStorage.getItem('astra_api_base_url') || '{api_base_url.rstrip("/")}';
window.IS_ASTRA_ANDROID_APP = true;
"""
    (WWW_DIR / "config.js").write_text(config_js, encoding="utf-8")

    # 3. Transform index.html (Workspace)
    index_content = (STATIC_SRC / "index.html").read_text(encoding="utf-8")
    index_relative = (
        index_content
        .replace('href="/static/', 'href="static/')
        .replace('src="/static/', 'src="static/')
    )
    script_injection = '<script src="config.js"></script>\n    <script src="static/app.js'
    index_relative = index_relative.replace('<script src="static/app.js', script_injection)
    (WWW_DIR / "index.html").write_text(index_relative, encoding="utf-8")

    # 4. Transform landing.html (Homepage)
    if (STATIC_SRC / "landing.html").exists():
        landing_content = (STATIC_SRC / "landing.html").read_text(encoding="utf-8")
        landing_relative = (
            landing_content
            .replace('href="/static/', 'href="static/')
            .replace('src="/static/', 'src="static/')
        )
        (WWW_DIR / "landing.html").write_text(landing_relative, encoding="utf-8")

    print(f"      Bundled {len(list(WWW_DIR.rglob('*')))} files into {WWW_DIR}")

def sync_capacitor(env):
    print("[2/5] Running Capacitor Sync...")
    subprocess.run(["npx", "cap", "sync", "android"], cwd=str(ROOT_DIR), env=env, check=True)

def build_gradle(env):
    print("[3/5] Compiling Android Gradle Build (Debug + Release APK + Release AAB)...")
    gradlew = ANDROID_DIR / "gradlew"
    cmd = [
        str(gradlew),
        "assembleDebug",
        "assembleRelease",
        "bundleRelease",
        "--stacktrace"
    ]
    subprocess.run(cmd, cwd=str(ANDROID_DIR), env=env, check=True)

def collect_outputs():
    print("[4/5] Collecting build deliverables into dist-android/...")
    DIST_DIR.mkdir(parents=True, exist_ok=True)

    debug_apk = ANDROID_DIR / "app" / "build" / "outputs" / "apk" / "debug" / "app-debug.apk"
    release_apk = ANDROID_DIR / "app" / "build" / "outputs" / "apk" / "release" / "app-release.apk"
    release_aab = ANDROID_DIR / "app" / "build" / "outputs" / "bundle" / "release" / "app-release.aab"

    deliverables = {}
    if debug_apk.exists():
        target = DIST_DIR / "Astra-AI-Debug.apk"
        shutil.copy2(debug_apk, target)
        shutil.copy2(debug_apk, ROOT_DIR / "Astra-AI-Debug.apk")
        deliverables["Debug APK"] = target
    if release_apk.exists():
        target = DIST_DIR / "Astra-AI-Release.apk"
        shutil.copy2(release_apk, target)
        shutil.copy2(release_apk, ROOT_DIR / "Astra-AI-Release.apk")
        deliverables["Release APK"] = target
    if release_aab.exists():
        target = DIST_DIR / "Astra-AI-Release.aab"
        shutil.copy2(release_aab, target)
        deliverables["Release AAB (Google Play)"] = target

    return deliverables

def print_summary(deliverables):
    print("\n" + "=" * 65)
    print("ASTRA AI OFFICIAL ANDROID APPLICATION BUILD SUCCESSFUL")
    print("=" * 65)
    for name, path in deliverables.items():
        size_mb = path.stat().st_size / (1024 * 1024)
        print(f"  • {name:25}: {path.name} ({size_mb:.2f} MB)")
        print(f"    Path: {path}")
    print("=" * 65 + "\n")

if __name__ == "__main__":
    env = setup_environment()
    target_api = sys.argv[1] if len(sys.argv) > 1 else "https://astrxai.com"
    bundle_web_assets(target_api)
    sync_capacitor(env)
    build_gradle(env)
    deliverables = collect_outputs()
    print_summary(deliverables)
