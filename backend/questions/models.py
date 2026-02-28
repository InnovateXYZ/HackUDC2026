from typing import Optional
from datetime import datetime

from sqlmodel import Field, SQLModel


class Question(SQLModel, table=True):
    """Model that represents a user's question in the application.

    Fields:
    - id: primary key
    - title: the question text asked by the user
    - answer: the answer returned by the decision engine
    - user_id: foreign key linking the question to its owner
    - time_out: total latency of the AI SDK request (seconds)
    - used_tokens: tokens consumed by the LLM
    - date_time: UTC timestamp when the record was created
    - model_llm: name of the LLM model used for the request
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    answer: str
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")

    # --- additional context --------------------------------------------------
    restrictions: Optional[str] = Field(
        default=None, description="User-supplied constraints / restrictions"
    )

    # --- new metrics fields ------------------------------------------------
    time_out: Optional[float] = Field(
        default=None, description="Request latency in seconds"
    )
    used_tokens: Optional[int] = Field(
        default=None, description="Number of tokens consumed"
    )
    date_time: datetime = Field(
        default_factory=datetime.utcnow, description="Timestamp of creation"
    )
    model_llm: Optional[str] = Field(default=None, description="LLM model used")
    like: bool = Field(default=True, description="User feedback: True=like, False=dislike")
