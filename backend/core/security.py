"""
Password hashing and JWT helpers for Pitchmate's self-hosted auth.

Replaces Supabase Auth: passwords are hashed with pwdlib (argon2), and access
tokens are stateless signed JWTs (no server-side session table — logout is a
client-side token discard, matching the previous best-effort behavior).
"""

import os
from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash

_password_hash = PasswordHash.recommended()

JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.environ.get("JWT_EXPIRE_MINUTES", str(60 * 24 * 7)))  # 7 days


def _jwt_secret() -> str:
    secret = os.environ.get("JWT_SECRET_KEY", "")
    if not secret:
        raise RuntimeError(
            "JWT_SECRET_KEY environment variable must be set to issue/verify auth tokens. "
            'Generate one with: python -c "import secrets; print(secrets.token_urlsafe(32))"'
        )
    return secret


# ─── Passwords ────────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    """Hash a plaintext password for storage."""
    return _password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    """Check a plaintext password against a stored hash."""
    return _password_hash.verify(password, hashed_password)


# ─── JWTs ───────────────────────────────────────────────────────────────────

def create_access_token(user_id: str, email: str) -> str:
    """Issue a signed, stateless access token for the given user."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "email": email,
        "iat": now,
        "exp": now + timedelta(minutes=JWT_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, _jwt_secret(), algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """
    Decode and verify an access token.
    Raises jwt.ExpiredSignatureError / jwt.InvalidTokenError on failure.
    """
    return jwt.decode(token, _jwt_secret(), algorithms=[JWT_ALGORITHM])
