"""
Auth router — signup, login, logout via Supabase Auth.
All endpoints return FastAPI-native JSON responses.
"""

import os
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr

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
# Helpers
# ---------------------------------------------------------------------------

def _supabase():
    from core.supabase_client import get_supabase_client
    return get_supabase_client()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(req: SignupRequest):
    """
    Register a new user with Supabase Auth.
    Returns the access token so the client can immediately make authenticated requests.
    """
    try:
        sb = _supabase()
        options_data = {}
        if req.full_name:
            options_data["data"] = {"full_name": req.full_name}

        res = sb.auth.sign_up(
            {
                "email": req.email,
                "password": req.password,
                **({"options": options_data} if options_data else {}),
            }
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Signup failed: {str(exc)}",
        )

    if res.user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Signup failed: no user returned. Check if email confirmation is required.",
        )

    session = res.session
    access_token = session.access_token if session else ""

    return AuthResponse(
        access_token=access_token,
        user_id=str(res.user.id),
        email=res.user.email or req.email,
    )


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    """
    Sign in an existing user and return a Supabase JWT access token.
    """
    try:
        sb = _supabase()
        res = sb.auth.sign_in_with_password(
            {"email": req.email, "password": req.password}
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Login failed: {str(exc)}",
        )

    if res.user is None or res.session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials.",
        )

    return AuthResponse(
        access_token=res.session.access_token,
        user_id=str(res.user.id),
        email=res.user.email or req.email,
    )


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout():
    """
    Sign out the currently authenticated user.
    Client is responsible for discarding the token.
    """
    try:
        _supabase().auth.sign_out()
    except Exception:
        pass  # best-effort
    return {"message": "Logged out successfully."}
