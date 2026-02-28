from sqlmodel import Session
from sqlmodel import select

from .models import Question
from .schemas import QuestionCreate


def create_question(
    session: Session, question_in: QuestionCreate, owner_id: int
) -> Question:
    question = Question(
        title=question_in.title,
        answer=question_in.answer,
        user_id=owner_id,
    )
    session.add(question)
    session.commit()
    session.refresh(question)
    return question


def get_questions_by_user(session: Session, user_id: int) -> list[Question]:
    """Return all questions for a given user id."""
    statement = select(Question).where(Question.user_id == user_id)
    results = session.exec(statement).all()
    return results
