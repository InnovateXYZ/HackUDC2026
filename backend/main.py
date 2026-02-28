from fastapi import FastAPI

from backend.db import init_db

from .users.routes import router as users_router

app = FastAPI(title="HackUDC2026")


@app.on_event("startup")
def on_startup():
    # initialize DB and create tables if not present (idempotent)
    init_db()


# register users router (endpoints moved to backend/users/routes.py)
app.include_router(users_router)
