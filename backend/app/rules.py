"""Camada de regras: procura sinais clássicos de golpe no texto.

Usa a mesma lista do app (shared/rules.json), então a nota daqui é igual à do
front-end. Serve de segunda camada junto com o modelo de ML e também de
detector de reserva quando ainda não existe modelo treinado.
"""
import json
import re
import unicodedata
from pathlib import Path

RULES_FILE = Path(__file__).resolve().parents[2] / "shared" / "rules.json"

_data = json.loads(RULES_FILE.read_text(encoding="utf-8"))
SETTINGS = _data["settings"]
_RULES = [{**r, "re": re.compile(r["pattern"], re.IGNORECASE)} for r in _data["rules"]]


def _sem_acento(texto: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", texto) if unicodedata.category(c) != "Mn")


def analyze(texto: str, is_contact: bool = False) -> tuple[int, list[str]]:
    """Devolve (nota de 0 a 99, até 3 motivos em português)."""
    limpo = _sem_acento(texto)
    score = 0
    achados = []

    for r in _RULES:
        if r["re"].search(limpo):
            score += r["weight"]
            if r["weight"] > 0:
                achados.append((r["weight"], r["why"]))

    caps = SETTINGS["caps"]
    letras = re.sub(r"[^A-Za-zÀ-ú]", "", texto)
    maiusculas = re.sub(r"[^A-ZÀ-Þ]", "", letras)
    if len(letras) > caps["min_letters"] and len(maiusculas) / len(letras) > caps["ratio"]:
        score += caps["weight"]
        achados.append((caps["weight"], caps["why"]))

    if not is_contact:
        score += SETTINGS["unknown_sender_weight"]

    score = max(0, min(SETTINGS["max_score"], score))
    achados.sort(key=lambda a: -a[0])
    return score, [why for _, why in achados[: SETTINGS["top_reasons"]]]
