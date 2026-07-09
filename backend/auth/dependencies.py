"""
FastAPI dependency for validating Pitchmate's self-issued JWT tokens.
Usage:  current_user: Annotated[dict, Depends(get_current_user)]
"""

from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import decode_access_token
from db.base import get_db_session
from db.models import User

_bearer = HTTPBearer()

_credentials_error = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Invalid or expired token.",
    headers={"WWW-Authenticate": "Bearer"},
)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict:
    """
    Validate the Bearer JWT issued by /auth/login or /auth/signup and return
    the user dict. Raises 401 if the token is missing, expired, invalid, or
    the user no longer exists.
    """
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        raise _credentials_error

    user_id = payload.get("sub")
    if not user_id:
        raise _credentials_error

    user = await db.scalar(select(User).where(User.id == user_id))
    if user is None:
        raise _credentials_error

    return {
        "id": user.id,
        "email": user.email,
        "metadata": {"full_name": user.full_name} if user.full_name else {},
    }
