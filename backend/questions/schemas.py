from pydantic import BaseModel


class QuestionCreate(BaseModel):
    title: str
    answer: str


class QuestionRead(BaseModel):
    id: int
    title: str
    answer: str
    user_id: int

    model_config = {"from_attributes": True}


class DecisionRequest(BaseModel):
    question: str
    llm_model: str = "gemma-3-27b-it"  # Default LLM model


class DecisionResponse(BaseModel):
    status: str
    answer: str | None = None
    error: str | None = None
    question_id: int | None = None
