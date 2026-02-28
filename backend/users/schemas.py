from pydantic import BaseModel, EmailStr
from typing import Optional
import datetime


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    # Allow setting these optional profile fields at registration
    gender_identity: Optional[str] = None
    name: Optional[str] = None
    date_of_birth: Optional[datetime.date] = None
    user_preferences: Optional[str] = None


class UserRead(BaseModel):
    id: int
    username: str
    email: EmailStr
    # Include new profile fields in read responses
    gender_identity: Optional[str] = None
    name: Optional[str] = None
    date_of_birth: Optional[datetime.date] = None
    user_preferences: Optional[str] = None
    created_at: datetime.datetime

    # Pydantic v2: replace Config.orm_mode with model_config.from_attributes
    # This enables model population from ORM objects (like SQLAlchemy instances).
    model_config = {"from_attributes": True}


class LoginData(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenWithUser(Token):
    # Include basic user info alongside token when logging in
    user: UserRead
