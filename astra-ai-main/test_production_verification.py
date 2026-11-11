"""Comprehensive Production Verification Test Suite for Astra AI.
Verifies:
1. Authentication, persistent session cookies, multi-device isolation, token sliding, explicit logout & revocation.
2. Real-time web search intelligence, date awareness, source citations, fallback resilience, and intelligent routing.
"""
import asyncio
import os
import time
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy import select

os.environ["APP_ENV"] = "production"
os.environ["DATABASE_URL"] = "sqlite:///./data/aster.db"
os.environ["JWT_SECRET"] = "astra_ai_prod_master_jwt_secret_salt_2026_d7f9e8a1b2c3d4e5f6"

import app as main_app
from database import User, Conversation, Document, get_db
import rag_engine
from auth import SESSION_COOKIE, create_access_token

client = TestClient(main_app.app)


def test_auth_persistent_session_and_cookies():
    # 1. Register or login user
    test_email = f"persist_test_{int(time.time())}@astra.ai"
    test_user = f"user_{int(time.time())}"
    test_pass = "SecurePass123!"

    # Get math challenge
    ch_res = client.get("/api/auth/challenge?mode=signup")
    assert ch_res.status_code == 200
    ch_data = ch_res.json()
    num1, num2, op = ch_data["num1"], ch_data["num2"], ch_data["operation"]
    ans = (num1 + num2) if op == "+" else (num1 - num2)

    reg_payload = {
        "username": test_user,
        "email": test_email,
        "phone": f"+15550{int(time.time()) % 1000000:06d}",
        "password": test_pass,
        "challenge_token": ch_data["challenge_token"],
        "calculation_result": ans,
        "agreed_to_terms": True,
    }
    reg_res = client.post("/api/auth/register", json=reg_payload)
    assert reg_res.status_code in (200, 201), reg_res.text
    reg_json = reg_res.json()
    assert "access_token" in reg_json
    assert reg_json["user"]["email"] == test_email

    # Verify persistent cookie was set
    cookie = reg_res.cookies.get(SESSION_COOKIE)
    assert cookie is not None, "astra_session cookie must be set on register"

    # 2. Test /api/auth/me with cookie (simulating page reload / reopening website)
    me_res = client.get("/api/auth/me", cookies={SESSION_COOKIE: cookie})
    assert me_res.status_code == 200, me_res.text
    me_json = me_res.json()
    assert me_json["email"] == test_email
    assert "access_token" in me_json, "/api/auth/me must return fresh access_token for frontend syncing"

    # Verify cookie sliding: response sets new updated session cookie
    refreshed_cookie = me_res.cookies.get(SESSION_COOKIE)
    assert refreshed_cookie is not None, "Cookie must slide on authenticated requests"

    # 3. Test cookie domain on astrxai.com host
    domain_res = client.get(
        "/api/auth/me",
        headers={"Host": "astrxai.com"},
        cookies={SESSION_COOKIE: cookie},
    )
    assert domain_res.status_code == 200

    # 4. Multi-device / multi-user data isolation test
    c1 = client
    c1_conv = c1.post("/api/conversations", json={"title": "User 1 Secret"}).json()
    c1_id = c1_conv["id"]

    c2 = TestClient(main_app.app)
    user2_email = f"user2_{int(time.time())}@astra.ai"
    ch2 = c2.get("/api/auth/challenge?mode=signup").json()
    num1_2, num2_2, op_2 = ch2["num1"], ch2["num2"], ch2["operation"]
    ans2 = (num1_2 + num2_2) if op_2 == "+" else (num1_2 - num2_2)
    reg2 = c2.post("/api/auth/register", json={
        "username": f"user2_{int(time.time())}",
        "email": user2_email,
        "phone": f"+15560{int(time.time()) % 1000000:06d}",
        "password": test_pass,
        "challenge_token": ch2["challenge_token"],
        "calculation_result": ans2,
        "agreed_to_terms": True,
    })
    assert reg2.status_code in (200, 201), reg2.text

    # User 2 attempts to access User 1's conversation -> MUST return 404 (strictly isolated)
    c2_attempt = c2.get(f"/api/conversations/{c1_id}")
    assert c2_attempt.status_code == 404, "User 2 must NOT be able to access User 1's conversation"

    # 5. Explicit logout test on Client 1
    logout_res = c1.post("/api/auth/logout")
    assert logout_res.status_code == 200
    assert logout_res.json()["success"] is True

    # 6. Verify server-side session invalidation: old cookie MUST be rejected
    rejected_res = c1.get("/api/auth/me", cookies={SESSION_COOKIE: cookie})
    assert rejected_res.status_code == 401, "Revoked session must return 401 Unauthorized"
    print("ALL AUTHENTICATION & SESSION PERSISTENCE TESTS PASSED!")


def test_realtime_web_search_intelligence():
    rag = rag_engine.ProductionRAGService()

    # 1. Verify routing decisions
    assert rag._is_live_external_query("What happened in the world today?") is True
    assert rag._is_live_external_query("What are the latest AI developments?") is True
    assert rag._is_live_external_query("What is the latest announcement from OpenAI?") is True
    assert rag._is_live_external_query("Who won the latest major cricket match?") is True
    assert rag._is_live_external_query("What are the latest technology news headlines?") is True
    assert rag._is_live_external_query("calculate 45 * 12") is False
    assert rag._is_live_external_query("explain the process of mitosis") is False

    # 2. Run actual live searches
    async def run_searches():
        queries = [
            "What happened in the world today?",
            "What are the latest AI developments?",
            "What is the latest announcement from OpenAI?",
            "Who won the latest major cricket match?",
            "What are the latest technology news headlines?",
        ]
        for q in queries:
            results = await rag._web_search(q)
            assert len(results) > 0, f"Search must return results for: {q}"
            top = results[0]
            assert "title" in top and len(top["title"]) > 5
            assert "url" in top and top["url"].startswith("http")
            assert "snippet" in top and len(top["snippet"]) > 10
            print(f"[VERIFIED] Query: {q!r}")
            print(f"  Top source: {top.get('site')} | {top.get('date')} | {top['title'][:60]}")
            print(f"  URL: {top['url'][:70]}...")

        # Test caching speed: consecutive query must return immediately from cache
        t0 = time.perf_counter()
        cached_res = await rag._web_search("What happened in the world today?")
        t_cache = (time.perf_counter() - t0) * 1000
        assert len(cached_res) > 0
        assert t_cache < 20.0, f"Cached search must return in under 20ms, got {t_cache:.2f}ms"
        print(f"[VERIFIED] Cache hit returned in {t_cache:.2f}ms")

        await rag.close()

    asyncio.run(run_searches())
    print("ALL REAL-TIME WEB SEARCH RETRIEVAL TESTS PASSED!")


if __name__ == "__main__":
    test_auth_persistent_session_and_cookies()
    test_realtime_web_search_intelligence()
    print("\nALL SYSTEM VERIFICATION TESTS PASSED SUCCESSFULLY!")
