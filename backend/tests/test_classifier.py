"""Testes das duas camadas. Rodar a partir da pasta backend/:  python -m pytest tests -q
(ou sem pytest:  python tests/test_classifier.py)"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import classifier, rules  # noqa: E402

GOLPE_PIX = "Banco Horizonte: detectamos um erro no seu Pix e sua chave será BLOQUEADA hoje. Confirme seus dados e senha: rb.gy/pix-seguro"
PREMIO = "PARABÉNS! Você ganhou R$ 10.000 no sorteio. Clique agora: ganhe-hoje.top/resgatar"
CONSULTORIO = "Oi, aqui é do consultório da Dra. Paula. Sua consulta está confirmada para amanhã às 14h."
CODIGO = "Seu código de acesso é 719304. Não compartilhe com ninguém."


def test_regras_pegam_golpes():
    assert rules.analyze(GOLPE_PIX)[0] >= 60
    assert rules.analyze(PREMIO)[0] >= 60


def test_regras_nao_assustam_com_mensagem_normal():
    assert rules.analyze(CONSULTORIO)[0] < 35
    assert rules.analyze(CODIGO, is_contact=True)[0] < 35


def test_motivos_em_portugues():
    _, motivos = rules.analyze(GOLPE_PIX)
    assert 1 <= len(motivos) <= 3


def test_sem_modelo_decide_so_pelas_regras():
    classifier._model = None
    r = classifier.classify(PREMIO)
    assert r["decided_by"] == "rules" and r["ml_probability"] is None


class _ModeloFalso:
    """Finge ser um modelo que sempre acha que é mensagem normal."""
    classes_ = ["ham", "spam"]

    def predict_proba(self, textos):
        return [[0.9, 0.1] for _ in textos]


def test_regras_seguram_golpe_que_o_modelo_deixou_passar():
    classifier._model = _ModeloFalso()
    try:
        r = classifier.classify(GOLPE_PIX)
        assert r["ml_probability"] == 0.1
        assert r["decided_by"] == "rules" and r["spam_probability"] >= 0.6
    finally:
        classifier._model = None


def test_modelo_manda_quando_regras_nao_veem_problema():
    classifier._model = _ModeloFalso()
    try:
        r = classifier.classify(CONSULTORIO)
        assert r["decided_by"] == "ml" and r["spam_probability"] == 0.1
    finally:
        classifier._model = None


if __name__ == "__main__":
    for nome, fn in list(globals().items()):
        if nome.startswith("test_"):
            fn()
            print("ok", nome)
