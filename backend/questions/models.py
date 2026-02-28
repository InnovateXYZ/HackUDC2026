from typing import List, Optional

from sqlalchemy import Column, JSON
from sqlmodel import Field, SQLModel


class Question(SQLModel, table=True):
    """Model that represents a user's question in the application.

    Fields:
    - id: primary key
    - title: question title
    - answers: list of answer strings (stored as JSON)
    - dataset: dataset identifier or name
    - columns: list of column names (stored as JSON)
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    answers: List[str] = Field(sa_column=Column(JSON), default_factory=list)
    dataset: str
    columns: List[str] = Field(sa_column=Column(JSON), default_factory=list)
    # Link this question to a user (optional). Use the users table's id as FK.
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
