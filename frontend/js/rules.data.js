// GERADO por tools/sync_rules.py a partir de shared/rules.json. Não edite à mão.
const RULES_DATA = {
  "settings": {
    "max_score": 99,
    "top_reasons": 3,
    "unknown_sender_weight": 5,
    "safety_net": 60,
    "caps": {
      "min_letters": 20,
      "ratio": 0.5,
      "weight": 8,
      "why": "Muitas letras maiúsculas"
    }
  },
  "rules": [
    {
      "weight": 30,
      "why": "Promete prêmio ou sorteio",
      "pattern": "\\b(ganhou|ganhador|premio|sorteio|sorteado|brinde)\\b"
    },
    {
      "weight": 12,
      "why": "Cria pressa para você agir",
      "pattern": "\\b(urgente|imediat\\w*|ultimas? horas|hoje|expira\\w*|prazo)\\b"
    },
    {
      "weight": 20,
      "why": "Diz que há problema na sua conta",
      "pattern": "(bloquead[oa]|suspens[oa]|cancelad[oa]|irregular|pendente|regulariz)"
    },
    {
      "weight": 20,
      "why": "Pede dados pessoais ou senha",
      "pattern": "\\b(cpf|senha|cartao|cvv|confirme seus dados|dados bancarios)\\b"
    },
    {
      "weight": 15,
      "why": "Fala de Pix de um jeito suspeito",
      "pattern": "\\bpix\\b.*\\b(chave|devolu\\w*|estorno|erro)\\b"
    },
    {
      "weight": 15,
      "why": "Oferece dinheiro ou crédito fácil",
      "pattern": "\\b(emprestimo|credito aprovado|limpa nome|negativado)\\b"
    },
    {
      "weight": 8,
      "why": "Pede para você clicar em um link",
      "pattern": "\\b(clique|acesse|toque)\\b"
    },
    {
      "weight": 10,
      "why": "Fala de dinheiro",
      "pattern": "R\\$\\s?\\d"
    },
    {
      "weight": 25,
      "why": "Link encurtado, que esconde o destino",
      "pattern": "\\b(bit\\.ly|tinyurl\\.com|cutt\\.ly|rb\\.gy|is\\.gd|t\\.co)\\b"
    },
    {
      "weight": 15,
      "why": "Endereço de site incomum",
      "pattern": "\\b[a-z0-9-]+\\.(xyz|top|click|site|link|online|info)\\b"
    },
    {
      "weight": -30,
      "why": "Código de verificação",
      "pattern": "(codigo)[^.]*(nao compartilhe)"
    }
  ]
};
