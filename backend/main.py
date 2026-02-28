import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.db import init_db
from backend.decision_engine import GenericDecisionEngine

from .users.routes import router as users_router
from .questions.routes import router as questions_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="HackUDC2026")

# Allow local frontend dev server (Vite) to access the API during development
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
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
