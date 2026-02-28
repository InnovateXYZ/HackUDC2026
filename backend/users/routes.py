from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from ..db import get_session
from .schemas import UserCreate, UserRead, LoginData
from .crud import (
    create_user,
    get_user_by_username,
    get_user_by_email,
    authenticate_user,
)

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


@router.post("/login")
def login(data: LoginData, session: Session = Depends(get_session)):
    identifier = data.username or data.email
    if not identifier:
        raise HTTPException(status_code=400, detail="Provide username or email")
    user = authenticate_user(session, identifier, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    # For now: return a simple success object (no JWT implemented)
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "message": "login successful",
    }
