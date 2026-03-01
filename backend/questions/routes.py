from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from ..db import get_session
from ..users.auth import get_current_user
from ..users.models import User
from .schemas import (
    FolderCreate,
    FolderRead,
    FolderUpdate,
    QuestionCreate,
    QuestionMoveToFolder,
    QuestionRead,
    DecisionRequest,
    DecisionResponse,
    MetadataRequest,
    MetadataResponse,
)
from .crud import (
    create_folder,
    create_question,
    delete_folder,
    delete_question,
    get_folders_by_user,
    get_questions_by_user,
    move_question_to_folder,
    update_folder,
    update_question_like,
)
from ..decision_engine import GenericDecisionEngine

router = APIRouter(prefix="/questions")


# ── Folder endpoints ────────────────────────────────────────────────────────


@router.post("/folders", response_model=FolderRead)
def create_folder_route(
    folder_in: FolderCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Create a new folder for the authenticated user."""
    return create_folder(session, folder_in, owner_id=current_user.id)


@router.get("/folders", response_model=List[FolderRead])
def list_folders(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Return all folders belonging to the authenticated user."""
    return get_folders_by_user(session, current_user.id)


@router.patch("/folders/{folder_id}", response_model=FolderRead)
def rename_folder(
    folder_id: int,
    folder_in: FolderUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Rename a folder. Only the owner may rename."""
    folder = update_folder(session, folder_id, folder_in)
    if folder is None or folder.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Folder not found")
    return folder


@router.delete("/folders/{folder_id}")
def remove_folder(
    folder_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Delete a folder. Questions inside are un-assigned, not deleted."""
    folders = get_folders_by_user(session, current_user.id)
    if not any(f.id == folder_id for f in folders):
        raise HTTPException(status_code=404, detail="Folder not found")
    delete_folder(session, folder_id)
    return {"status": "ok"}


@router.patch("/{question_id}/folder", response_model=QuestionRead)
def move_to_folder(
    question_id: int,
    body: QuestionMoveToFolder,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Move a question into a folder (or remove from folder if folder_id is null)."""
    question = move_question_to_folder(session, question_id, body.folder_id)
    if question is None or question.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Question not found")
    return question


# ── Question endpoints ──────────────────────────────────────────────────────


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
    Returns the schema metadata so the frontend can display it before executing.
    """
    try:
        result = engine.get_metadata(request.question, datasets=request.datasets)

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
        # Build user profile dict from the authenticated user,
        # unless the user opted out of personal info.
        if request.exclude_user_info:
            user_profile = None
        else:
            user_profile = {
                "name": current_user.name,
                "date_of_birth": (
                    str(current_user.date_of_birth)
                    if current_user.date_of_birth
                    else None
                ),
                "gender_identity": current_user.gender_identity,
                "user_preferences": current_user.user_preferences,
            }

        result = engine.answer(
            request.question,
            discovered_schema=request.metadata,
            llm_model=request.llm_model,
            user_profile=user_profile,
        )

        if result.get("status") == "error":
            return DecisionResponse(
                status="error",
                error=result.get("message", "Unknown error from decision engine"),
            )

        # Use the formatted analytical report (Phase 3).
        # Fall back to raw execution answer if report is empty for any reason.
        answer_text = result.get("report", "") or result.get("execution_phase", {}).get(
            "answer", ""
        )

        # extract metrics if available
        metrics = result.get("metrics", {}) or {}
        time_out = metrics.get("time_out")
        used_tokens = metrics.get("used_tokens")
        model_llm = metrics.get("model_llm")

        # Persist the question + answer + metrics so it appears in the user's history
        saved_id = None
        if request.save_to_history:
            question_in = QuestionCreate(
                title=request.question,
                answer=answer_text,
                restrictions=request.restrictions,
                time_out=time_out,
                used_tokens=used_tokens,
                model_llm=model_llm,
            )
            saved = create_question(session, question_in, owner_id=current_user.id)
            saved_id = saved.id

        return DecisionResponse(
            status="success",
            answer=answer_text,
            question_id=saved_id,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing decision: {str(e)}",
        )


@router.patch("/{question_id}/like")
def set_like(
    question_id: int,
    like: bool,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Set the like/dislike value for a question."""
    question = update_question_like(session, question_id, like)
    if question is None or question.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Question not found")
    return {"status": "ok", "like": question.like}


@router.delete("/{question_id}")
def remove_question(
    question_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Delete a question. Only the owner may delete."""
    from .models import Question

    question = session.get(Question, question_id)
    if question is None or question.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Question not found")
    delete_question(session, question_id)
    return {"status": "ok"}
