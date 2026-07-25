"""
Short-lived signed `state` tokens for OAuth authorize→callback round trips.

The `/connect` endpoint is called by the frontend with a normal Bearer JWT,
but the provider's redirect back to `/callback` is a plain browser navigation
with no Authorization header — so we thread the user id through the OAuth
`state` parameter instead, signed so it can't be forged or reused past its
short TTL.
"""

import os
from datetime import datetime, timedelta, timezone

import jwt

STATE_ALGORITHM = "HS256"
STATE_EXPIRE_MINUTES = 10


def _secret() -> str:
    secret = os.environ.get("JWT_SECRET_KEY", "")
    if not secret:
        raise RuntimeError("JWT_SECRET_KEY must be set to build OAuth state tokens.")
    return secret


def create_oauth_state(user_id: str, provider: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "provider": provider,
        "typ": "oauth_state",
        "iat": now,
        "exp": now + timedelta(minutes=STATE_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, _secret(), algorithm=STATE_ALGORITHM)


def verify_oauth_state(state: str, provider: str) -> str:
    """Return the user_id encoded in `state`, or raise jwt.PyJWTError / ValueError."""
    payload = jwt.decode(state, _secret(), algorithms=[STATE_ALGORITHM])
    if payload.get("typ") != "oauth_state" or payload.get("provider") != provider:
        raise ValueError("OAuth state token does not match the expected provider.")
    return payload["sub"]
