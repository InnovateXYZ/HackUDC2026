from datetime import datetime

from typing import Any, List, Optional

from pydantic import BaseModel


# ── Folder schemas ──────────────────────────────────────────────────────────


class FolderCreate(BaseModel):
    name: str


class FolderUpdate(BaseModel):
    name: Optional[str] = None


class FolderRead(BaseModel):
    id: int
    name: str
    user_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Question schemas ────────────────────────────────────────────────────────


class QuestionCreate(BaseModel):
    title: str
    answer: str
    restrictions: Optional[str] = None
    time_out: Optional[float] = None
    used_tokens: Optional[int] = None
    date_time: Optional[datetime] = None
    model_llm: Optional[str] = None
    folder_id: Optional[int] = None


class QuestionRead(BaseModel):
    id: int
    title: str
    answer: str
    user_id: int
    folder_id: Optional[int] = None
    restrictions: Optional[str] = None
    like: bool

    # metrics
    time_out: Optional[float] = None
    used_tokens: Optional[int] = None
    date_time: datetime
    model_llm: Optional[str] = None

    model_config = {"from_attributes": True}


class QuestionMoveToFolder(BaseModel):
    folder_id: Optional[int] = None  # None = remove from folder


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
    restrictions: Optional[str] = None
    metadata: str | None = None
    llm_model: str = "gemma-3-27b-it"  # Default LLM model
    exclude_user_info: bool = (
        False  # If True, personal info is excluded from the report
    )
    save_to_history: bool = True  # If False, the question won't be persisted
    deepthink: bool = False  # If True, an extra refinement iteration is applied


class DecisionResponse(BaseModel):
    status: str
    answer: str | None = None
    error: str | None = None
    question_id: int | None = None
