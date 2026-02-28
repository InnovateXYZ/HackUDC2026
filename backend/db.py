from typing import Generator
import os

from sqlmodel import SQLModel, create_engine, Session

BASE_DIR = os.path.dirname(__file__)
DB_FILE = os.path.join(BASE_DIR, "project.db")
DATABASE_URL = f"sqlite:///{DB_FILE}"

# Use check_same_thread=False for SQLite + ASGI concurrency
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


def init_db() -> None:
    """Initialize the database file and create tables if they don't exist.

    SQLModel.metadata.create_all is idempotent and will not overwrite existing data.
    """
    # Ensure directory exists
    os.makedirs(BASE_DIR, exist_ok=True)
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
