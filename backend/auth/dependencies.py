"""
FastAPI dependency for validating Supabase JWT tokens.
Usage:  current_user: Annotated[dict, Depends(get_current_user)]
"""

from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

_bearer = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
) -> dict:
    """
    Validate the Bearer JWT issued by Supabase and return the user dict.
    Raises 401 if the token is missing, expired, or invalid.
    """
    token = credentials.credentials
    try:
        from core.supabase_client import get_supabase_client
        sb = get_supabase_client()
        res = sb.auth.get_user(token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate token: {str(exc)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if res is None or res.user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = res.user
    return {
        "id": str(user.id),
        "email": user.email,
        "metadata": user.user_metadata or {},
    }
