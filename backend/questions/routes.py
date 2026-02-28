from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from ..db import get_session
from ..users.auth import get_current_user
from ..users.models import User
from .schemas import QuestionCreate, QuestionRead
from .crud import create_question, get_questions_by_user

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
