from pydantic import BaseModel, EmailStr
from typing import Optional
import datetime


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserRead(BaseModel):
    id: int
    username: str
    email: EmailStr
    created_at: datetime.datetime

    # Pydantic v2: replace Config.orm_mode with model_config.from_attributes
    # This enables model population from ORM objects (like SQLAlchemy instances).
    model_config = {"from_attributes": True}


class LoginData(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: str
