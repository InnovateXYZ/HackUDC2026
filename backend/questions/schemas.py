from datetime import datetime

from typing import Any, List, Optional

from pydantic import BaseModel


class QuestionCreate(BaseModel):
    title: str
    answer: str
    time_out: Optional[float] = None
    used_tokens: Optional[int] = None
    date_time: Optional[datetime] = None
    model_llm: Optional[str] = None


class QuestionRead(BaseModel):
    id: int
    title: str
    answer: str
    user_id: int

    # metrics
    time_out: Optional[float] = None
    used_tokens: Optional[int] = None
    date_time: datetime
    model_llm: Optional[str] = None

    model_config = {"from_attributes": True}


class MetadataRequest(BaseModel):
    question: str
    datasets: List[str] = []


class MetadataResponse(BaseModel):
    status: str
    metadata: str | None = None
    execution_result: Any | None = None
    error: str | None = None


class DecisionRequest(BaseModel):
    question: str
    metadata: str | None = None
    llm_model: str = "gemma-3-27b-it"  # Default LLM model


class DecisionResponse(BaseModel):
    status: str
    answer: str | None = None
    error: str | None = None
    question_id: int | None = None
