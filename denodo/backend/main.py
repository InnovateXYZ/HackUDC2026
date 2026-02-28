from fastapi import FastAPI
from decision_engine import GenericDecisionEngine

app = FastAPI()
engine = GenericDecisionEngine()


@app.post("/get_metadata")
def get_metadata(question: str):
    return engine.get_metadata(question)


@app.post("/decision")
def decision(question: str, metadata: str | None = None):
    return engine.answer(question, discovered_schema=metadata)
