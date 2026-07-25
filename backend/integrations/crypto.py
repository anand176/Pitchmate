"""
Symmetric encryption for OAuth tokens at rest, keyed off JWT_SECRET_KEY so no
extra secret needs to be provisioned. Uses Fernet (AES-128-CBC + HMAC).
"""

import base64
import hashlib
import os

from cryptography.fernet import Fernet, InvalidToken


def _fernet() -> Fernet:
    secret = os.environ.get("JWT_SECRET_KEY", "")
    if not secret:
        raise RuntimeError(
            "JWT_SECRET_KEY must be set to encrypt/decrypt stored integration tokens."
        )
    key = base64.urlsafe_b64encode(hashlib.sha256(secret.encode("utf-8")).digest())
    return Fernet(key)


def encrypt(value: str) -> str:
    """Encrypt a plaintext string for storage."""
    return _fernet().encrypt(value.encode("utf-8")).decode("utf-8")


def decrypt(value: str) -> str:
    """Decrypt a previously encrypted string. Raises ValueError if the token is invalid."""
    try:
        return _fernet().decrypt(value.encode("utf-8")).decode("utf-8")
    except InvalidToken as exc:
        raise ValueError("Stored integration token could not be decrypted.") from exc
