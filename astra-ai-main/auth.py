from __future__ import annotations

import re
import uuid
import hashlib
import secrets
import time
from datetime import datetime, timedelta, timezone
from typing import Annotated

import bcrypt
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import Cookie, Depends, HTTPException, Request, Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from config import settings
from database import User, UserSession, get_db

bearer = HTTPBearer(auto_error=False)

SESSION_COOKIE = "astra_session"
GUEST_SESSION_COOKIE = "astra_guest_session"
TOKEN_TTL = timedelta(seconds=settings.jwt_access_token_ttl_seconds)
BCRYPT_ROUNDS = 12
ph = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=4)

# Login Rate Limiting & Lockout Tracker (Configured for resilience)
LOGIN_ATTEMPTS: dict[str, dict] = {}
MAX_LOGIN_ATTEMPTS = 10
LOCKOUT_DURATION_SECONDS = 60  # 1 minute temporary cooldown for resilience

def record_failed_attempt(key: str) -> tuple[int, int]:
    """Records a failed login attempt for key (IP or identifier). Returns (remaining_attempts, lockout_seconds)."""
    now = time.time()
    entry = LOGIN_ATTEMPTS.get(key, {"attempts": 0, "locked_until": 0, "last_failed": 0})
    if entry.get("locked_until", 0) > now:
        return 0, int(entry["locked_until"] - now)

    if now - entry.get("last_failed", 0) > LOCKOUT_DURATION_SECONDS:
        entry["attempts"] = 0

    entry["attempts"] += 1
    entry["last_failed"] = now

    if entry["attempts"] >= MAX_LOGIN_ATTEMPTS:
        entry["locked_until"] = now + LOCKOUT_DURATION_SECONDS
        LOGIN_ATTEMPTS[key] = entry
        return 0, LOCKOUT_DURATION_SECONDS

    LOGIN_ATTEMPTS[key] = entry
    return max(0, MAX_LOGIN_ATTEMPTS - entry["attempts"]), 0


def check_is_locked(key: str) -> int:
    """Returns remaining lockout seconds if locked, or 0 if free to attempt."""
    now = time.time()
    entry = LOGIN_ATTEMPTS.get(key)
    if not entry:
        return 0
    locked_until = entry.get("locked_until", 0)
    if locked_until > now:
        return int(locked_until - now)
    return 0


def clear_failed_attempts(key: str) -> None:
    LOGIN_ATTEMPTS.pop(key, None)


WEAK_PASSWORDS = frozenset({
    "password", "password1", "password123", "12345678", "123456789", "qwerty",
    "qwerty123", "letmein", "welcome", "admin123", "iloveyou", "abc12345",
    "passw0rd", "11111111", "00000000", "astra123", "changeme",
})
PASSWORD_HINT = "Use at least 8 characters with a letter and a number."


def hash_password(password: str) -> str:
    """Hashes password using secure Argon2id algorithm."""
    return ph.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Verifies password using Argon2id with automatic fallback for legacy bcrypt hashes."""
    if not password_hash or password_hash in ("", "none"):
        return False
    if password_hash.startswith("$argon2"):
        try:
            return ph.verify(password_hash, password)
        except (VerifyMismatchError, Exception):
            return False
    # Fallback for legacy bcrypt hashes
    try:
        raw = password.encode("utf-8")[:72]
        return bcrypt.checkpw(raw, password_hash.encode())
    except (ValueError, TypeError):
        return False


def needs_rehash(password_hash: str) -> bool:
    """Returns True if hash should be upgraded to modern Argon2id settings."""
    if not password_hash or not password_hash.startswith("$argon2"):
        return True
    try:
        return ph.check_needs_rehash(password_hash)
    except Exception:
        return True


def validate_password_strength(password: str) -> str | None:
    if not password:
        return "Password cannot be blank."
    if len(password) < 8:
        return "Password must be at least 8 characters long."
    if len(password) > 128:
        return "Password must be 128 characters or fewer."
    if password.lower() in WEAK_PASSWORDS or password.lower().strip() in WEAK_PASSWORDS:
        return "This password is too common and weak. Please choose a stronger password."
    if password.isdigit():
        return "Password must include at least one letter."
    if password.isalpha():
        return "Password must include at least one number."
    if not re.search(r"[A-Za-z]", password) or not re.search(r"\d", password):
        return PASSWORD_HINT
    return None


def create_access_token(user_id: str, role: str, token_version: int = 1) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "role": role,
        "tv": token_version,
        "exp": now + TOKEN_TTL,
        "iat": now,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def revoke_user_sessions(user: User, db: Session) -> None:
    """Invalidates all currently active JWTs for user by advancing token_version."""
    user.token_version = (user.token_version or 1) + 1
    db.commit()


def hash_session_token(token: str) -> str:
    """Computes SHA-256 hash of a session token for secure database storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_user_session(
    user: User,
    db: Session,
    device_id: str | None = None,
    device_name: str | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> tuple[str, UserSession]:
    """
    Creates or slides a permanent device-bound session for the user (valid for 365 days).
    Returns (raw_session_token, UserSession instance).
    """
    raw_token = f"astrsess_{secrets.token_urlsafe(48)}"
    token_hash = hash_session_token(raw_token)
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=365)
    dev_id = (device_id or "").strip() or f"dev_{uuid.uuid4().hex[:16]}"

    # Search for an existing session for this specific device
    existing = db.scalar(
        select(UserSession).where(
            UserSession.user_id == user.id,
            UserSession.device_id == dev_id,
        )
    )
    if existing:
        existing.session_token_hash = token_hash
        if device_name:
            existing.device_name = device_name
        if ip_address:
            existing.ip_address = ip_address
        if user_agent:
            existing.user_agent = user_agent
        existing.is_active = 1
        existing.last_active_at = now
        existing.expires_at = expires_at
        db.commit()
        db.refresh(existing)
        return raw_token, existing

    session_rec = UserSession(
        user_id=user.id,
        device_id=dev_id,
        session_token_hash=token_hash,
        device_name=device_name or "Device Session",
        ip_address=ip_address,
        user_agent=user_agent,
        is_active=1,
        created_at=now,
        last_active_at=now,
        expires_at=expires_at,
    )
    db.add(session_rec)
    db.commit()
    db.refresh(session_rec)
    return raw_token, session_rec


def revoke_device_session(
    user: User,
    db: Session,
    session_token: str | None = None,
    device_id: str | None = None,
) -> bool:
    """
    Revokes ONLY the session for the specified device/token.
    Other devices and sessions for this user remain active and unaffected.
    """
    revoked = False
    now = datetime.now(timezone.utc)
    if session_token:
        token_hash = hash_session_token(session_token)
        sess = db.scalar(
            select(UserSession).where(
                UserSession.session_token_hash == token_hash,
                UserSession.user_id == user.id,
            )
        )
        if sess:
            sess.is_active = 0
            sess.last_active_at = now
            revoked = True

    if not revoked and device_id:
        active_sessions = db.scalars(
            select(UserSession).where(
                UserSession.user_id == user.id,
                UserSession.device_id == device_id,
                UserSession.is_active == 1,
            )
        ).all()
        for s in active_sessions:
            s.is_active = 0
            s.last_active_at = now
            revoked = True

    db.commit()
    return revoked


def revoke_all_user_sessions(user: User, db: Session) -> None:
    """Invalidates all sessions across all devices for this user."""
    now = datetime.now(timezone.utc)
    sessions = db.scalars(select(UserSession).where(UserSession.user_id == user.id)).all()
    for s in sessions:
        s.is_active = 0
        s.last_active_at = now
    user.token_version = (user.token_version or 1) + 1
    db.commit()


def _resolve_session_token_user(token: str, db: Session) -> tuple[User | None, UserSession | None]:
    """Validates a raw session token against the user_sessions table."""
    if not token or len(token) < 20:
        return None, None
    token_hash = hash_session_token(token)
    now = datetime.now(timezone.utc)
    sess = db.scalar(
        select(UserSession).where(
            UserSession.session_token_hash == token_hash,
            UserSession.is_active == 1,
        )
    )
    if not sess:
        return None, None

    # Safely compare expiration with timezone-awareness
    exp = sess.expires_at
    if exp is not None:
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < now:
            return None, None

    user = db.get(User, sess.user_id)
    if not user or user.role == "guest":
        return None, None

    sess.last_active_at = now
    # Slide session if within 60 days of expiry
    if exp is not None and (exp - now).total_seconds() < 60 * 86400:
        sess.expires_at = now + timedelta(days=365)
    db.commit()
    return user, sess


def _is_secure_request(request: Request | None = None) -> bool:
    if request is not None:
        scheme = (request.url.scheme or "").lower()
        forwarded_proto = (request.headers.get("x-forwarded-proto") or "").lower()
        return scheme == "https" or "https" in forwarded_proto
    return False


def _cookie_domain_for_request(request: Request | None = None) -> str | None:
    if request is None:
        return None
    try:
        host = (request.headers.get("host") or request.url.netloc or "").split(":")[0].lower()
        if host == "astrxai.com" or host.endswith(".astrxai.com"):
            return ".astrxai.com"
    except Exception:
        pass
    return None


def set_session_cookie(
    response: Response,
    token: str,
    request: Request | None = None,
    cookie_name: str = SESSION_COOKIE,
) -> None:
    secure = _is_secure_request(request)
    max_age_sec = int(TOKEN_TTL.total_seconds())
    expires_dt = datetime.now(timezone.utc) + TOKEN_TTL
    domain = _cookie_domain_for_request(request)
    kwargs = {
        "key": cookie_name,
        "value": token,
        "httponly": True,
        "secure": secure,
        "samesite": "lax",
        "max_age": max_age_sec,
        "expires": expires_dt,
        "path": "/",
    }
    if domain:
        kwargs["domain"] = domain
    response.set_cookie(**kwargs)


def clear_session_cookie(response: Response, request: Request | None = None) -> None:
    domain = _cookie_domain_for_request(request)
    # Clear host-level cookies
    for c_name in (SESSION_COOKIE, GUEST_SESSION_COOKIE):
        response.delete_cookie(key=c_name, path="/", httponly=True, samesite="lax")
        response.set_cookie(
            key=c_name,
            value="",
            max_age=0,
            expires=datetime.fromtimestamp(0, timezone.utc),
            path="/",
            httponly=True,
            samesite="lax",
        )
        if domain:
            response.delete_cookie(key=c_name, path="/", domain=domain, httponly=True, samesite="lax")
            response.set_cookie(
                key=c_name,
                value="",
                max_age=0,
                expires=datetime.fromtimestamp(0, timezone.utc),
                path="/",
                domain=domain,
                httponly=True,
                samesite="lax",
            )


def _decode_user(token: str | None, db: Session) -> User | None:
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            return None
        user = db.get(User, user_id)
        if not user:
            return None
        # Verify token version to enforce server-side session revocation / logout invalidation
        token_tv = payload.get("tv")
        if token_tv is not None and getattr(user, "token_version", 1) != token_tv:
            return None
        return user
    except (jwt.PyJWTError, KeyError):
        return None


def _extract_token(
    credentials: HTTPAuthorizationCredentials | None,
    cookie_token: str | None,
    guest_header_token: str | None = None,
) -> str | None:
    if credentials and credentials.credentials:
        return credentials.credentials
    if cookie_token:
        return cookie_token
    if guest_header_token:
        return guest_header_token
    return None


def _resolve_authenticated_user(
    credentials: HTTPAuthorizationCredentials | None,
    cookie_token: str | None,
    db: Session,
    request: Request | None = None,
) -> User | None:
    """Checks Bearer token, X-Session-Token header, and persistent cookies for a valid non-guest user."""
    candidates: list[str] = []
    if credentials and credentials.credentials:
        candidates.append(credentials.credentials)
    if cookie_token and cookie_token not in candidates:
        candidates.append(cookie_token)
    if request is not None:
        raw_cookie = request.cookies.get(SESSION_COOKIE)
        if raw_cookie and raw_cookie not in candidates:
            candidates.append(raw_cookie)
        sess_hdr = request.headers.get("x-session-token") or request.headers.get("X-Session-Token")
        if sess_hdr and sess_hdr not in candidates:
            candidates.append(sess_hdr)
        auth_hdr = request.headers.get("authorization") or request.headers.get("Authorization")
        if auth_hdr and auth_hdr.lower().startswith("bearer "):
            hdr_tok = auth_hdr.split(" ", 1)[1].strip()
            if hdr_tok and hdr_tok not in candidates:
                candidates.append(hdr_tok)

    for tok in candidates:
        if not tok:
            continue
        tok = tok.strip()
        # 1. Check persistent device session token first
        if tok.startswith("astrsess_") or len(tok) >= 40:
            user, _ = _resolve_session_token_user(tok, db)
            if user and user.role != "guest":
                return user
        # 2. Check signed JWT
        user = _decode_user(tok, db)
        if user and user.role != "guest":
            return user
        # 3. Fallback: check session token without prefix
        user, _ = _resolve_session_token_user(tok, db)
        if user and user.role != "guest":
            return user
    return None


def get_current_user(
    request: Request,
    response: Response,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
    astra_session: str | None = Cookie(default=None, alias=SESSION_COOKIE),
) -> User:
    user = _resolve_authenticated_user(credentials, astra_session, db, request=request)
    if not user:
        raise HTTPException(401, "Sign in is required")
    return user


def get_optional_user(
    request: Request,
    response: Response,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
    astra_session: str | None = Cookie(default=None, alias=SESSION_COOKIE),
    astra_guest_session: str | None = Cookie(default=None, alias=GUEST_SESSION_COOKIE),
) -> User:
    """Return the signed-in user or create an isolated per-device local guest session.

    Authenticated user sessions (astra_session) are strictly isolated from guest
    sessions (astra_guest_session) so guest activity can never overwrite or
    invalidate a signed-in user's persistent cookie.
    """
    auth_user = _resolve_authenticated_user(credentials, astra_session, db, request=request)
    if auth_user:
        return auth_user

    guest_header = request.headers.get("X-Guest-Token")
    device_header = request.headers.get("X-Device-Id")

    for guest_tok in (
        credentials.credentials if credentials and credentials.credentials else None,
        guest_header,
        astra_guest_session,
        astra_session,
    ):
        if guest_tok:
            guest_user = _decode_user(guest_tok, db)
            if guest_user and guest_user.role == "guest":
                user_token = create_access_token(guest_user.id, guest_user.role, getattr(guest_user, "token_version", 1))
                response.headers["X-Guest-Token"] = user_token
                response.headers["Access-Control-Expose-Headers"] = "X-Guest-Token"
                set_session_cookie(response, user_token, request=request, cookie_name=GUEST_SESSION_COOKIE)
                return guest_user

    if device_header:
        dev_email = f"guest-{device_header}@device.local"
        existing = db.scalar(select(User).where(User.email == dev_email))
        if existing:
            user_token = create_access_token(existing.id, existing.role, getattr(existing, "token_version", 1))
            response.headers["X-Guest-Token"] = user_token
            response.headers["Access-Control-Expose-Headers"] = "X-Guest-Token"
            set_session_cookie(response, user_token, request=request, cookie_name=GUEST_SESSION_COOKIE)
            return existing

    guest_id = device_header if device_header else uuid.uuid4().hex
    user = User(
        email=f"guest-{guest_id}@device.local",
        username="Guest",
        role="guest",
        token_version=1,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    guest_token = create_access_token(user.id, user.role, user.token_version)
    response.headers["X-Guest-Token"] = guest_token
    response.headers["Access-Control-Expose-Headers"] = "X-Guest-Token"
    set_session_cookie(response, guest_token, request=request, cookie_name=GUEST_SESSION_COOKIE)
    return user
