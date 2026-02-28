from typing import List

from pydantic import BaseModel


class QuestionCreate(BaseModel):
    title: str
    answers: List[str]
    dataset: str
    columns: List[str]
    # note: user_id is not accepted from client; server sets the owner from the auth token


class QuestionRead(QuestionCreate):
    id: int
    user_id: int

    model_config = {"from_attributes": True}


class DecisionRequest(BaseModel):
    question: str


class DecisionResponse(BaseModel):
    status: str
    answer: str | None = None
    error: str | None = None
