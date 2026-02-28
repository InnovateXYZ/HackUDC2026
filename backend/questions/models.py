from typing import Optional

from sqlmodel import Field, SQLModel


class Question(SQLModel, table=True):
    """Model that represents a user's question in the application.

    Fields:
    - id: primary key
    - title: the question text asked by the user
    - answer: the answer returned by the decision engine
    - user_id: foreign key linking the question to its owner
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    answer: str
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
