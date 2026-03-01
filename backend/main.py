import logging
import os
from pathlib import Path

# Load .env from project root before any other imports read env vars
_env_file = Path(__file__).resolve().parent.parent / ".env"
if _env_file.exists():
    for line in _env_file.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.db import init_db
from backend.decision_engine import GenericDecisionEngine

from .users.routes import router as users_router
from .questions.routes import router as questions_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="HackUDC2026")

# Allow frontend to access the API (configurable via FRONTEND_URL env var)
_frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:5173")
origins = [
    _frontend_url,
    _frontend_url.replace("localhost", "127.0.0.1"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    # initialize DB and create tables if not present (idempotent)
    init_db()

    # Load AI SDK metadata in background (retries every 5 s on failure)
    engine = GenericDecisionEngine()
    engine.load_metadata_background()


# register users router (endpoints moved to backend/users/routes.py)
app.include_router(users_router)
# register questions router
app.include_router(questions_router)

# Serve uploaded files (profile images, etc.) as static assets
_uploads_dir = Path(__file__).resolve().parent / "uploads"
_uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(_uploads_dir)), name="uploads")
