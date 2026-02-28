from fastapi import FastAPI
from decision_engine import GenericDecisionEngine

app = FastAPI()
engine = GenericDecisionEngine()


@app.post("/decision")
def decision(question: str):
    return engine.answer(question)