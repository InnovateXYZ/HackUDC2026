from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from ..db import get_session
from .schemas import UserCreate, UserRead, LoginData
from .crud import (
    create_user,
    get_user_by_username,
    get_user_by_email,
    authenticate_user,
)
from .auth import create_access_token, get_current_user
from .schemas import TokenWithUser

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
