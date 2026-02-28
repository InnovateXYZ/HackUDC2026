from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from ..db import get_session
from ..users.auth import get_current_user
from ..users.models import User
from .schemas import (
    QuestionCreate,
    QuestionRead,
    DecisionRequest,
    DecisionResponse,
    MetadataRequest,
    MetadataResponse,
)
from .crud import create_question, get_questions_by_user
from denodo.backend.decision_engine import GenericDecisionEngine

router = APIRouter(prefix="/questions")


@router.post("/", response_model=QuestionRead)
def create(
    question_in: QuestionCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Create a new Question in the database. Owner is taken from the authenticated user."""
    question = create_question(session, question_in, owner_id=current_user.id)
    return question


@router.get("/user/{user_id}", response_model=List[QuestionRead])
def list_by_user(
    user_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Return all questions that belong to the given user id. Only the owner may view their questions."""
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view these questions",
        )
    questions = get_questions_by_user(session, user_id)
    return questions


engine = GenericDecisionEngine()


@router.post("/get_metadata", response_model=MetadataResponse)
def get_metadata(
    request: MetadataRequest,
    current_user: User = Depends(get_current_user),
):
    """Discover relevant tables and columns for the given question (Phase 1).
    Returns the schema metadata so the frontend can display it before executing."""
    try:
        result = engine.get_metadata(request.question)

        if result.get("status") == "error":
            return MetadataResponse(
                status="error",
                error=result.get("message", "Unknown error from decision engine"),
            )

        raw = result.get("raw_metadata", {})
        return MetadataResponse(
            status="success",
            metadata=result.get("metadata", ""),
            execution_result=raw.get("execution_result") or raw,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error discovering metadata: {str(e)}",
        )


@router.post("/decide", response_model=DecisionResponse)
def decide(
    request: DecisionRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Process a user question through the decision engine, persist it in the
    database with the answer, and return the result. If metadata is provided
    (from a prior /get_metadata call), skips the metadata discovery phase."""
    try:
        result = engine.answer(
            request.question,
            discovered_schema=request.metadata,
            llm_model=request.llm_model,
        )

        if result.get("status") == "error":
            return DecisionResponse(
                status="error",
                error=result.get("message", "Unknown error from decision engine"),
            )

        answer_text = result.get("execution_phase", {}).get("answer", "")

        # Persist the question + answer so it appears in the user's history
        question_in = QuestionCreate(title=request.question, answer=answer_text)
        saved = create_question(session, question_in, owner_id=current_user.id)

        return DecisionResponse(
            status="success",
            answer=answer_text,
            question_id=saved.id,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing decision: {str(e)}",
        )
