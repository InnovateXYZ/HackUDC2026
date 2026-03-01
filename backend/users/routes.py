from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from ..db import get_session
from .schemas import UserCreate, UserRead, LoginData, GoogleAuthRequest
from .crud import (
    create_user,
    get_user_by_username,
    get_user_by_email,
    authenticate_user,
)
from .auth import create_access_token, get_current_user
from .schemas import TokenWithUser

import os
import requests as http_requests
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GITHUB_CLIENT_ID = os.environ.get("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.environ.get("GITHUB_CLIENT_SECRET", "")

router = APIRouter()


@router.post("/register", response_model=UserRead)
def register(user_in: UserCreate, session: Session = Depends(get_session)):
    # simple uniqueness checks
    if get_user_by_username(session, user_in.username):
        raise HTTPException(status_code=400, detail="Username already registered")
    if get_user_by_email(session, user_in.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = create_user(session, user_in)
    return user


@router.post("/login", response_model=TokenWithUser)
def login(data: LoginData, session: Session = Depends(get_session)):
    identifier = data.username or data.email
    if not identifier:
        raise HTTPException(status_code=400, detail="Provide username or email")
    user = authenticate_user(session, identifier, data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    # create JWT access token
    access_token = create_access_token({"sub": str(user.id)})

    return {"access_token": access_token, "token_type": "bearer", "user": user}


@router.post("/logout")
def logout(current_user = Depends(get_current_user)):
    """Logout endpoint - token is invalidated on frontend"""
    return {"message": "Successfully logged out"}


@router.post("/auth/google")
def google_auth(data: GoogleAuthRequest, session: Session = Depends(get_session)):
    """Verify Google ID token. If user exists, log them in.
    If not, return needs_registration with the email/name so the frontend
    can redirect to the register page with pre-filled data."""
    try:
        idinfo = google_id_token.verify_oauth2_token(
            data.credential, google_requests.Request(), GOOGLE_CLIENT_ID
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    email = idinfo.get("email")
    name = idinfo.get("name", "")
    if not email:
        raise HTTPException(status_code=400, detail="Google token missing email")

    user = get_user_by_email(session, email)
    if user:
        # Existing user — log them in
        access_token = create_access_token({"sub": str(user.id)})
        return {
            "status": "login",
            "access_token": access_token,
            "token_type": "bearer",
            "user": UserRead.model_validate(user).model_dump(),
        }
    else:
        # New user — tell frontend to complete registration
        return {
            "status": "needs_registration",
            "email": email,
            "name": name,
        }


@router.post("/auth/github")
def github_auth(code: str, session: Session = Depends(get_session)):
    """Exchange GitHub OAuth code for access token, fetch user info.
    If user exists, log them in. Otherwise return needs_registration."""
    # Exchange code for access token
    token_res = http_requests.post(
        "https://github.com/login/oauth/access_token",
        json={
            "client_id": GITHUB_CLIENT_ID,
            "client_secret": GITHUB_CLIENT_SECRET,
            "code": code,
        },
        headers={"Accept": "application/json"},
        timeout=10,
    )
    token_data = token_res.json()
    gh_access_token = token_data.get("access_token")
    if not gh_access_token:
        raise HTTPException(status_code=401, detail="GitHub authentication failed")

    # Fetch GitHub user profile
    user_res = http_requests.get(
        "https://api.github.com/user",
        headers={"Authorization": f"Bearer {gh_access_token}", "Accept": "application/json"},
        timeout=10,
    )
    gh_user = user_res.json()

    # Fetch emails (in case email is private)
    emails_res = http_requests.get(
        "https://api.github.com/user/emails",
        headers={"Authorization": f"Bearer {gh_access_token}", "Accept": "application/json"},
        timeout=10,
    )
    emails = emails_res.json()
    primary_email = None
    if isinstance(emails, list):
        for em in emails:
            if em.get("primary") and em.get("verified"):
                primary_email = em["email"]
                break
        if not primary_email and emails:
            primary_email = emails[0].get("email")

    email = primary_email or gh_user.get("email")
    name = gh_user.get("name") or gh_user.get("login", "")

    if not email:
        raise HTTPException(status_code=400, detail="Could not retrieve email from GitHub")

    user = get_user_by_email(session, email)
    if user:
        access_token = create_access_token({"sub": str(user.id)})
        return {
            "status": "login",
            "access_token": access_token,
            "token_type": "bearer",
            "user": UserRead.model_validate(user).model_dump(),
        }
    else:
        return {
            "status": "needs_registration",
            "email": email,
            "name": name,
        }
