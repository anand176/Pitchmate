"""
Auth router — signup, login, logout against Pitchmate's self-hosted Postgres
user table (SQLAlchemy ORM), issuing our own signed JWTs.
All endpoints return FastAPI-native JSON responses.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import create_access_token, hash_password, verify_password
from db.base import get_db_session
from db.models import User

router = APIRouter(prefix="/auth", tags=["Auth"])


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(req: SignupRequest, db: Annotated[AsyncSession, Depends(get_db_session)]):
    """
    Register a new user. Accounts are activated immediately (no email
    verification step). Returns an access token so the client can
    immediately make authenticated requests.
    """
    email = req.email.lower().strip()

    existing = await db.scalar(select(User).where(User.email == email))
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    user = User(
        email=email,
        hashed_password=hash_password(req.password),
        full_name=req.full_name,
    )
    db.add(user)
    try:
        await db.commit()
    except Exception as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Signup failed: {str(exc)}",
        )
    await db.refresh(user)

    return AuthResponse(
        access_token=create_access_token(user.id, user.email),
        user_id=user.id,
        email=user.email,
    )


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest, db: Annotated[AsyncSession, Depends(get_db_session)]):
    """Sign in an existing user and return a Pitchmate JWT access token."""
    email = req.email.lower().strip()
    user = await db.scalar(select(User).where(User.email == email))

    if user is None or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials.",
        )

    return AuthResponse(
        access_token=create_access_token(user.id, user.email),
        user_id=user.id,
        email=user.email,
    )


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout():
    """
    Sign out the currently authenticated user.
    Tokens are stateless, so this is a no-op server-side — the client is
    responsible for discarding the token.
    """
    return {"message": "Logged out successfully."}
