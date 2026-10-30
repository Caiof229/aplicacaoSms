"""Treina o detector de spam e salva em ml/models/model.joblib.

Rodar a partir da pasta ml/:
    python train.py data/dataset.csv                      # CSV com colunas label,text
    python train.py data/sms.tsv --tsv                    # formato "SMS Spam Collection" (label<TAB>texto)
    python train.py data/dataset.csv data/feedback.csv    # junta as correções feitas no app

Os rótulos devem ser "spam" e "ham" (mensagem normal).
O pipeline tem dois passos com estes nomes: "tfidf" e "clf". A API usa esses
nomes para explicar quais palavras pesaram na decisão, então mantenha-os se trocar o modelo.
"""
import sys
from pathlib import Path

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

SAIDA = Path(__file__).resolve().parent / "models" / "model.joblib"


def carregar(caminho: str, tsv: bool) -> pd.DataFrame:
    if tsv:
        df = pd.read_csv(caminho, sep="\t", header=None, names=["label", "text"])
    else:
        df = pd.read_csv(caminho)
    return df[["label", "text"]].dropna()


def montar_pipeline() -> Pipeline:
    return Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), strip_accents="unicode", lowercase=True)),
        ("clf", LogisticRegression(class_weight="balanced", max_iter=1000)),
    ])


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        sys.exit(__doc__)
    tsv = "--tsv" in sys.argv

    df = pd.concat([carregar(args[0], tsv)] + [carregar(p, False) for p in args[1:]], ignore_index=True)
    df["label"] = df["label"].str.strip().str.lower()
    print(df["label"].value_counts().to_string(), "\n")

    x_treino, x_teste, y_treino, y_teste = train_test_split(
        df["text"], df["label"], test_size=0.2, random_state=42, stratify=df["label"]
    )
    pipe = montar_pipeline()
    pipe.fit(x_treino, y_treino)
    print(classification_report(y_teste, pipe.predict(x_teste)))

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipe, SAIDA)
    print("Modelo salvo em", SAIDA)


if __name__ == "__main__":
    main()
