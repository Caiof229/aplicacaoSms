"""Junta as duas camadas de proteção e decide a nota final.

Camada 1: modelo de machine learning (ml/models/model.joblib), a análise principal.
Camada 2: regras de segurança (rules.py), rede de proteção para o que o modelo deixar passar.

Regra de decisão:
  - sem modelo treinado: vale só a regra (decided_by = "rules")
  - com modelo: vale a probabilidade dele (decided_by = "ml")
  - se as regras estiverem muito seguras de que é golpe (nota >= safety_net),
    a nota final é a maior das duas: as regras só aumentam a nota, nunca diminuem
      - modelo abaixo de 50% e regras mais altas: decided_by = "rules"
      - as duas camadas concordam que é golpe:    decided_by = "both"
"""
import os
from pathlib import Path

from . import rules

ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = Path(os.getenv("TORPEDO_MODEL", ROOT / "ml" / "models" / "model.joblib"))

_model = None


def load_model() -> bool:
    """Carrega o modelo treinado, se existir. Devolve True se carregou."""
    global _model
    if MODEL_PATH.exists():
        import joblib

        _model = joblib.load(MODEL_PATH)
    else:
        _model = None
    return _model is not None


def model_loaded() -> bool:
    return _model is not None


def predict_ml(texto: str) -> tuple[float, list[str]]:
    """Probabilidade de spam (0 a 1) e as palavras que mais pesaram na decisão."""
    classes = list(_model.classes_)
    spam_idx = classes.index("spam")
    prob = float(_model.predict_proba([texto])[0][spam_idx])

    motivos: list[str] = []
    try:  # só funciona com TF-IDF + regressão logística, o pipeline do train.py
        tfidf, clf = _model.named_steps["tfidf"], _model.named_steps["clf"]
        vec = tfidf.transform([texto])
        nomes = tfidf.get_feature_names_out()
        sinal = 1 if spam_idx == 1 else -1
        pesos = [(vec[0, i] * clf.coef_[0][i] * sinal, nomes[i]) for i in vec.nonzero()[1]]
        top = [palavra for peso, palavra in sorted(pesos, reverse=True)[:3] if peso > 0]
        motivos = [f"Contém “{p}”, termo comum em spam" for p in top]
    except Exception:
        pass
    return prob, motivos


def classify(texto: str, is_contact: bool = False) -> dict:
    rules_score, rules_reasons = rules.analyze(texto, is_contact)
    rules_prob = rules_score / 100
    safety_net = rules.SETTINGS["safety_net"] / 100

    if _model is None:
        return {
            "spam_probability": rules_prob,
            "ml_probability": None,
            "rules_score": rules_prob,
            "decided_by": "rules",
            "reasons": rules_reasons,
        }

    ml_prob, ml_reasons = predict_ml(texto)
    final, decided_by = ml_prob, "ml"
    if rules_prob >= safety_net:  # as regras só podem aumentar a nota, nunca diminuir
        final = max(ml_prob, rules_prob)
        if ml_prob >= 0.5:
            decided_by = "both"
        elif rules_prob > ml_prob:
            decided_by = "rules"

    # Motivos: primeiro os da camada que decidiu, depois os da outra, sem repetir.
    ordem = (rules_reasons, ml_reasons) if decided_by == "rules" else (ml_reasons, rules_reasons)
    motivos: list[str] = []
    for lista in ordem:
        for m in lista:
            if m not in motivos:
                motivos.append(m)

    return {
        "spam_probability": round(final, 4),
        "ml_probability": round(ml_prob, 4),
        "rules_score": round(rules_prob, 4),
        "decided_by": decided_by,
        "reasons": motivos[:4],
    }
