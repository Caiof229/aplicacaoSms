# Torpedo: app de SMS com detector de spam

App de SMS simples para qualquer pessoa usar, ligado a um modelo de machine learning que separa golpes das mensagens normais.

## Estrutura

```
torpedo/
├── frontend/            o app (abre no navegador e no celular)
│   ├── index.html       só a estrutura da tela
│   ├── css/styles.css   visual, temas claro e escuro
│   └── js/
│       ├── utils.js       funções pequenas (escapar texto, formatar hora, links)
│       ├── config.js      números e textos ajustáveis
│       ├── rules.data.js  regras (gerado de shared/rules.json)
│       ├── rules.js       camada de regras no navegador
│       ├── detector.js    ponte com a API do modelo de ML
│       ├── seed.js        conversas de exemplo
│       ├── store.js       dados e regras de negócio
│       ├── ui.js          tudo que desenha na tela
│       └── main.js        cliques e teclado; liga tudo
├── backend/             API em Python (FastAPI)
│   ├── app/
│   │   ├── main.py        rotas: /health /predict /feedback /reload-model
│   │   ├── classifier.py  junta modelo de ML e regras
│   │   ├── rules.py       camada de regras
│   │   ├── feedback.py    guarda correções dos usuários
│   │   └── schemas.py     formato dos dados da API
│   └── tests/
├── ml/                  o projeto de aprendizado de máquina
│   ├── train.py         treina e salva ml/models/model.joblib
│   ├── data/            dataset e feedback.csv
│   └── models/          modelo treinado
├── shared/rules.json    lista única de regras, usada pelo app e pela API
└── tools/               sync_rules.py, build_demo.py
```

## Como as peças se falam

```
SMS chega -> detector.js -> POST /predict -> classifier.py
                                              ├─ camada 1: modelo de ML (ml/models/model.joblib)
                                              └─ camada 2: regras (shared/rules.json)
          <- nota + motivos + quem decidiu <-
usuário toca "É spam" / "Não é spam" -> POST /feedback -> ml/data/feedback.csv -> train.py
```

## Rodando

**Só o app (demonstração, usa as regras locais):** abra `frontend/index.html`.

**Com o seu modelo:**

```bash
# 1. treinar
cd ml
pip install -r ../backend/requirements.txt pandas
python train.py data/dataset.csv

# 2. subir a API
cd ../backend
uvicorn app.main:app --reload --port 8000
```

No app, toque no ícone de ajustes, informe `http://localhost:8000` e toque em **Conectar e testar**.

## Mexendo nas regras

Edite `shared/rules.json` e rode `python tools/sync_rules.py`. O app e a API passam a usar a lista nova.

## Testes

```bash
cd backend
python -m pytest tests -q
```
