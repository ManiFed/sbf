from fastapi import FastAPI
from pydantic import BaseModel
from scripts.ask import ask

app = FastAPI()

class AskRequest(BaseModel):
    question: str

@app.get("/")
def root():
    return {"status": "ok", "message": "SBF data assistant API running"}

@app.post("/ask")
def ask_endpoint(request: AskRequest):
    answer = ask(request.question)
    return {"answer": answer}
