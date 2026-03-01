from sqlmodel import Session
from sqlmodel import select

from .models import Folder, Question
from .schemas import FolderCreate, FolderUpdate, QuestionCreate


# ── Folder CRUD ─────────────────────────────────────────────────────────────


def create_folder(session: Session, folder_in: FolderCreate, owner_id: int) -> Folder:
    folder = Folder(name=folder_in.name, user_id=owner_id)
    session.add(folder)
    session.commit()
    session.refresh(folder)
    return folder


def get_folders_by_user(session: Session, user_id: int) -> list[Folder]:
    statement = select(Folder).where(Folder.user_id == user_id)
    return list(session.exec(statement).all())


def update_folder(
    session: Session, folder_id: int, folder_in: FolderUpdate
) -> Folder | None:
    folder = session.get(Folder, folder_id)
    if folder is None:
        return None
    if folder_in.name is not None:
        folder.name = folder_in.name
    session.add(folder)
    session.commit()
    session.refresh(folder)
    return folder


def delete_folder(session: Session, folder_id: int) -> bool:
    """Delete a folder and un-assign its questions (set folder_id = None)."""
    folder = session.get(Folder, folder_id)
    if folder is None:
        return False
    # un-assign questions that belong to this folder
    questions = session.exec(
        select(Question).where(Question.folder_id == folder_id)
    ).all()
    for q in questions:
        q.folder_id = None
        session.add(q)
    session.delete(folder)
    session.commit()
    return True


# ── Question CRUD ───────────────────────────────────────────────────────────


def create_question(
    session: Session, question_in: QuestionCreate, owner_id: int
) -> Question:
    # build the ORM object, carrying over any provided metric fields
    question = Question(
        title=question_in.title,
        answer=question_in.answer,
        user_id=owner_id,
        folder_id=question_in.folder_id,
        restrictions=question_in.restrictions,
        time_out=question_in.time_out,
        used_tokens=question_in.used_tokens,
        date_time=question_in.date_time,
        model_llm=question_in.model_llm,
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


def update_question_like(
    session: Session, question_id: int, like: bool
) -> Question | None:
    """Update the like field of a question."""
    question = session.get(Question, question_id)
    if question is None:
        return None
    question.like = like
    session.add(question)
    session.commit()
    session.refresh(question)
    return question


def move_question_to_folder(
    session: Session, question_id: int, folder_id: int | None
) -> Question | None:
    """Move a question into a folder, or remove it from any folder (folder_id=None)."""
    question = session.get(Question, question_id)
    if question is None:
        return None
    question.folder_id = folder_id
    session.add(question)
    session.commit()
    session.refresh(question)
    return question
