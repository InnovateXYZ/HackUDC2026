from typing import Optional
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, String
import datetime


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(
        sa_column=Column(String, unique=True, index=True, nullable=False)
    )
    email: str = Field(
        sa_column=Column(String, unique=True, index=True, nullable=False)
    )
    hashed_password: str = Field(nullable=False)
    # New fields added: gender identity, name, date_of_birth, and user_preferences.
    # These are Optional to avoid breaking existing records; adjust as needed.
    gender_identity: Optional[str] = Field(default=None)
    name: Optional[str] = Field(default=None)
    date_of_birth: Optional[datetime.date] = Field(default=None)
    user_preferences: Optional[str] = Field(default=None)

    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
