"""Guarda as correções do usuário em ml/data/feedback.csv.

Esse arquivo tem o mesmo formato do dataset (label,text) mais duas colunas
extras, então o ml/train.py consegue usá-lo para treinar de novo.
"""
import csv
import os
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FEEDBACK_PATH = Path(os.getenv("TORPEDO_FEEDBACK", ROOT / "ml" / "data" / "feedback.csv"))


def save(label: str, text: str, sender: str | None) -> None:
    FEEDBACK_PATH.parent.mkdir(parents=True, exist_ok=True)
    novo = not FEEDBACK_PATH.exists()
    with FEEDBACK_PATH.open("a", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        if novo:
            w.writerow(["label", "text", "sender", "timestamp"])
        w.writerow([label, text, sender or "", datetime.now(timezone.utc).isoformat()])
