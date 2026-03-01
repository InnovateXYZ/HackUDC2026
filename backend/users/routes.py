from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlmodel import Session

from ..db import get_session
from .schemas import UserCreate, UserRead, UserUpdate, LoginData, GoogleAuthRequest
from .crud import (
    create_user,
    get_user_by_username,
    get_user_by_email,
    authenticate_user,
    update_user,
    update_user_profile_image,
)
from .auth import create_access_token, get_current_user
from .schemas import TokenWithUser

import os
import uuid
from pathlib import Path
import requests as http_requests
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GITHUB_CLIENT_ID = os.environ.get("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.environ.get("GITHUB_CLIENT_SECRET", "")

# Directory for uploaded profile images
UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads" / "profile_images"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

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
def logout(current_user=Depends(get_current_user)):
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


@router.get("/me", response_model=UserRead)
def get_me(current_user=Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return current_user


@router.put("/me", response_model=UserRead)
def update_me(
    updates: UserUpdate,
    current_user=Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Update the currently authenticated user's profile fields."""
    updated = update_user(session, current_user, updates)
    return updated


@router.post("/me/profile-image", response_model=UserRead)
async def upload_profile_image(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Upload or replace the current user's profile image."""
    # Validate extension
    ext = Path(file.filename).suffix.lower() if file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext}' not allowed. Use: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Read and validate size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)} MB",
        )

    # Delete old image if it exists
    if current_user.profile_image:
        old_path = Path(__file__).resolve().parent.parent / current_user.profile_image
        if old_path.exists():
            old_path.unlink()

    # Save with unique filename
    unique_name = f"{current_user.id}_{uuid.uuid4().hex}{ext}"
    file_path = UPLOAD_DIR / unique_name
    file_path.write_bytes(contents)

    # Store relative path in DB
    relative_path = f"uploads/profile_images/{unique_name}"
    updated_user = update_user_profile_image(session, current_user, relative_path)
    return updated_user


@router.delete("/me/profile-image", response_model=UserRead)
def delete_profile_image(
    current_user=Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Remove the current user's profile image."""
    if current_user.profile_image:
        old_path = Path(__file__).resolve().parent.parent / current_user.profile_image
        if old_path.exists():
            old_path.unlink()
    updated_user = update_user_profile_image(session, current_user, None)
    return updated_user
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
