"""Rotas da API. Rodar (dentro da pasta backend/):

    uvicorn app.main:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import classifier, feedback
from .schemas import FeedbackIn, PredictIn, PredictOut

app = FastAPI(title="Torpedo - API de spam")

# O front-end abre direto do disco ou de outro endereço, então liberamos o CORS.
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

classifier.load_model()


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": classifier.model_loaded()}


@app.post("/predict", response_model=PredictOut)
def predict(msg: PredictIn):
    result = classifier.classify(msg.text, msg.is_contact)
    result["label"] = "spam" if result["spam_probability"] >= 0.5 else "ham"
    return result


@app.post("/feedback")
def save_feedback(fb: FeedbackIn):
    feedback.save(fb.label, fb.text, fb.sender)
    return {"saved": True}


@app.post("/reload-model")
def reload_model():
    """Recarrega o model.joblib sem reiniciar a API (útil depois de retreinar)."""
    return {"model_loaded": classifier.load_model()}
