from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from ..db import get_session
from ..users.auth import get_current_user
from ..users.models import User
from .schemas import QuestionCreate, QuestionRead, DecisionRequest, DecisionResponse
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


@router.post("/decide", response_model=DecisionResponse)
def decide(
    request: DecisionRequest,
    current_user: User = Depends(get_current_user),
):
    """Process a user question through the decision engine and return the answer. This endpoint is protected and requires authentication."""
    try:
        result = engine.answer(request.question)

        if result.get("status") == "error":
            return DecisionResponse(
                status="error",
                error=result.get("message", "Unknown error from decision engine"),
            )

        answer_text = result.get("execution_phase", {}).get("answer", "")
        return DecisionResponse(status="success", answer=answer_text)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing decision: {str(e)}",
        )
