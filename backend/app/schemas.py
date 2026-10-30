"""Formato dos dados que entram e saem da API."""
from typing import Literal, Optional

from pydantic import BaseModel


class PredictIn(BaseModel):
    text: str
    sender: Optional[str] = None
    is_contact: bool = False


class PredictOut(BaseModel):
    spam_probability: float           # nota final, de 0 a 1
    ml_probability: Optional[float]   # o que o modelo de ML achou (None se não há modelo)
    rules_score: float                # o que as regras de segurança acharam
    decided_by: Literal["ml", "rules", "both"]
    reasons: list[str]                # motivos em português para mostrar ao usuário
    label: Literal["spam", "ham"]


class FeedbackIn(BaseModel):
    text: str
    label: Literal["spam", "ham"]
    sender: Optional[str] = None
