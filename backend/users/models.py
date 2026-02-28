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
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
