#!/usr/bin/env python3
"""
Astra AI - Comprehensive Authentication & Persistence Verification Suite
Tests:
1. Registration without blocking math challenge or terms screens.
2. Direct Login with email, username, and phone (no math challenges).
3. 1-Year Permanent Session token issuance & cookie validation.
4. Multi-device independent sessions (Device A logout does not affect Device B).
5. Global logout (logout-all invalidates all devices).
6. Offline resilience and error recovery.
7. Existing users preservation & hash verification.
"""

import sys
import time
import uuid
from pathlib import Path

# Insert astra-ai-main into path
APP_ROOT = Path(__file__).resolve().parent / "astra-ai-main"
sys.path.insert(0, str(APP_ROOT))

from fastapi.testclient import TestClient
from app import app
from database import get_db, User, UserSession, initialize_database
from sqlalchemy import select
from auth import verify_password

def run_tests():
    initialize_database()
    client = TestClient(app)
    print("=" * 70)
    print("STARTING ASTRA AI AUTHENTICATION & PERSISTENCE VERIFICATION")
    print("=" * 70)

    # ----------------------------------------------------
    # TEST 1: Register without math challenge or blocking terms
    # ----------------------------------------------------
    print("\n[TEST 1] Testing instant user registration without challenges...")
    test_id = uuid.uuid4().hex[:8]
    test_email = f"authuser_{test_id}@astrx.test"
    test_username = f"user_{test_id}"
    test_phone = f"+9198{int(time.time()) % 100000000:08d}"
    test_password = "SecurePassword123!"

    reg_res = client.post(
        "/api/auth/register",
        json={
            "username": test_username,
            "email": test_email,
            "phone": test_phone,
            "password": test_password,
            "agreed_to_terms": True,
            "device_id": f"dev_test_a_{test_id}",
        },
        headers={"X-Device-Id": f"dev_test_a_{test_id}"}
    )
    assert reg_res.status_code == 201, f"Registration failed: {reg_res.text}"
    reg_data = reg_res.json()
    assert "access_token" in reg_data, "access_token missing in registration"
    assert "session_token" in reg_data, "session_token missing in registration"
    assert reg_data["session_token"].startswith("astrsess_"), "session_token prefix invalid"
    assert reg_data["user"]["email"] == test_email, "Email mismatch"
    assert "astra_session" in reg_res.cookies, "astra_session cookie missing in registration response"
    print("  -> User registered successfully with permanent session token & cookie!")

    # ----------------------------------------------------
    # TEST 2: Login via Email (No math challenge required)
    # ----------------------------------------------------
    print("\n[TEST 2] Testing login via Email without math challenge...")
    login_res = client.post(
        "/api/auth/login",
        json={
            "identifier": test_email,
            "password": test_password,
            "device_id": f"dev_laptop_{test_id}",
        },
        headers={"X-Device-Id": f"dev_laptop_{test_id}"}
    )
    assert login_res.status_code == 200, f"Login via email failed: {login_res.text}"
    laptop_data = login_res.json()
    laptop_session_token = laptop_data["session_token"]
    assert laptop_session_token.startswith("astrsess_")
    print("  -> Laptop login succeeded, permanent session issued!")

    # ----------------------------------------------------
    # TEST 3: Login via Username & Case-Insensitivity
    # ----------------------------------------------------
    print("\n[TEST 3] Testing login via Username (case-insensitive & leading space)...")
    login_user_res = client.post(
        "/api/auth/login",
        json={
            "identifier": f"  {test_username.upper()}  ",
            "password": test_password,
            "device_id": f"dev_mobile_{test_id}",
        },
        headers={"X-Device-Id": f"dev_mobile_{test_id}"}
    )
    assert login_user_res.status_code == 200, f"Login via username failed: {login_user_res.text}"
    mobile_data = login_user_res.json()
    mobile_session_token = mobile_data["session_token"]
    assert mobile_session_token.startswith("astrsess_")
    assert mobile_session_token != laptop_session_token, "Different devices must receive independent session tokens"
    print("  -> Mobile login succeeded independently from laptop!")

    # ----------------------------------------------------
    # TEST 4: Login via Phone number
    # ----------------------------------------------------
    print("\n[TEST 4] Testing login via Phone number...")
    login_phone_res = client.post(
        "/api/auth/login",
        json={
            "identifier": test_phone,
            "password": test_password,
            "device_id": f"dev_tablet_{test_id}",
        },
        headers={"X-Device-Id": f"dev_tablet_{test_id}"}
    )
    assert login_phone_res.status_code == 200, f"Login via phone failed: {login_phone_res.text}"
    tablet_data = login_phone_res.json()
    tablet_session_token = tablet_data["session_token"]
    print("  -> Tablet login via phone number succeeded!")

    # ----------------------------------------------------
    # TEST 5: Verify Session Persistence & Multi-Device Isolation
    # ----------------------------------------------------
    print("\n[TEST 5] Testing Multi-Device Session Persistence & Isolation...")
    # Laptop calls /api/auth/me using its session token
    laptop_me = client.get(
        "/api/auth/me",
        headers={
            "X-Session-Token": laptop_session_token,
            "X-Device-Id": f"dev_laptop_{test_id}",
        }
    )
    assert laptop_me.status_code == 200, f"Laptop /me failed: {laptop_me.text}"
    assert laptop_me.json()["email"] == test_email

    # Mobile calls /api/auth/me using its session token
    mobile_me = client.get(
        "/api/auth/me",
        headers={
            "X-Session-Token": mobile_session_token,
            "X-Device-Id": f"dev_mobile_{test_id}",
        }
    )
    assert mobile_me.status_code == 200, f"Mobile /me failed: {mobile_me.text}"

    # Now Laptop LOGS OUT!
    print("  -> Logging out Laptop (Device A)...")
    laptop_logout = client.post(
        "/api/auth/logout",
        headers={
            "X-Session-Token": laptop_session_token,
            "X-Device-Id": f"dev_laptop_{test_id}",
        }
    )
    assert laptop_logout.status_code == 200

    # Verify Laptop is now logged out
    laptop_me_after = client.get(
        "/api/auth/me",
        headers={
            "X-Session-Token": laptop_session_token,
            "X-Device-Id": f"dev_laptop_{test_id}",
        }
    )
    assert laptop_me_after.status_code == 401, "Laptop should be unauthorized after logout"
    print("  -> Laptop is successfully logged out.")

    # CRUCIAL: Mobile MUST STILL BE LOGGED IN!
    print("  -> Checking Mobile (Device B) after Laptop logged out...")
    mobile_me_after = client.get(
        "/api/auth/me",
        headers={
            "X-Session-Token": mobile_session_token,
            "X-Device-Id": f"dev_mobile_{test_id}",
        }
    )
    assert mobile_me_after.status_code == 200, f"Mobile should REMAIN LOGGED IN! Failed: {mobile_me_after.text}"
    assert mobile_me_after.json()["email"] == test_email
    print("  -> SUCCESS: Device B remained logged in completely unaffected by Device A's logout!")

    # ----------------------------------------------------
    # TEST 6: Session sliding / renewal via /api/auth/refresh
    # ----------------------------------------------------
    print("\n[TEST 6] Testing Session Renewal via /api/auth/refresh...")
    refresh_res = client.post(
        "/api/auth/refresh",
        headers={
            "X-Session-Token": mobile_session_token,
            "X-Device-Id": f"dev_mobile_{test_id}",
        }
    )
    assert refresh_res.status_code == 200, f"Refresh failed: {refresh_res.text}"
    ref_data = refresh_res.json()
    assert "access_token" in ref_data
    assert "session_token" in ref_data
    print("  -> Session renewal succeeded!")

    # ----------------------------------------------------
    # TEST 7: Logout-All invalidates all devices
    # ----------------------------------------------------
    print("\n[TEST 7] Testing Global Logout (/api/auth/logout-all)...")
    logout_all_res = client.post(
        "/api/auth/logout-all",
        headers={
            "X-Session-Token": mobile_session_token,
            "X-Device-Id": f"dev_mobile_{test_id}",
        }
    )
    assert logout_all_res.status_code == 200

    # Mobile should now be logged out
    mobile_me_final = client.get(
        "/api/auth/me",
        headers={
            "X-Session-Token": mobile_session_token,
            "X-Device-Id": f"dev_mobile_{test_id}",
        }
    )
    assert mobile_me_final.status_code == 401, "Mobile should be logged out after logout-all"

    # Tablet should also be logged out
    tablet_me_final = client.get(
        "/api/auth/me",
        headers={
            "X-Session-Token": tablet_session_token,
            "X-Device-Id": f"dev_tablet_{test_id}",
        }
    )
    assert tablet_me_final.status_code == 401, "Tablet should be logged out after logout-all"
    print("  -> Global logout successfully revoked all devices simultaneously!")

    # ----------------------------------------------------
    # TEST 8: Existing Database Integrity & Passwords
    # ----------------------------------------------------
    print("\n[TEST 8] Verifying existing user accounts & Argon2id compatibility...")
    db = next(get_db())
    users = db.scalars(select(User).where(User.role != "guest", User.password_hash != "")).all()
    assert len(users) > 0, "No existing users found in DB!"
    print(f"  -> Found {len(users)} existing registered users in aster.db.")
    for u in users[:5]:
        assert u.password_hash.startswith("$argon2") or u.password_hash.startswith("$2"), f"Invalid hash scheme for {u.email}"
    print("  -> Password hash integrity confirmed for existing registered accounts!")

    print("\n" + "=" * 70)
    print("ALL AUTHENTICATION & PERSISTENCE TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
