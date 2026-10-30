/* seed.js
 * Conversas de exemplo para a demonstração.
 * Cada mensagem é [quem, texto, "há quanto tempo", não lida?].
 * Quando o app for ligado a SMS reais, este arquivo deixa de ser usado. */

const { MIN, HR, DAY } = CONFIG.time;

const SEED = [
  { name: 'Mãe', number: '+55 81 9 9120-3345', kind: 'person', msgs: [
    ['me', 'Cheguei na faculdade, mãe', 3 * HR],
    ['them', 'Filho, não esquece de levar o guarda-chuva hoje', 25 * MIN, 1],
  ] },
  { name: 'Lucas (ADS)', number: '+55 81 9 8877-2210', kind: 'person', msgs: [
    ['them', 'Bora fechar o slide do projeto de ML hoje à noite? Já rodei o modelo, deu 96% de acurácia', 2 * HR],
    ['me', 'Fechou! Eu levo a parte do app de SMS', 100 * MIN],
  ] },
  { name: 'Banco Horizonte', number: '28000', kind: 'service', msgs: [
    ['them', 'Compra aprovada: R$ 42,90 em Padaria Central.', DAY + 2 * HR],
    ['them', 'Seu código de verificação é 482913. Não compartilhe com ninguém.', 8 * MIN, 1],
  ] },
  { name: 'Entrega Express', number: '26006', kind: 'service', msgs: [
    ['them', 'Seu pedido saiu para entrega. Acompanhe em entregaexpress.com.br/rastreio/8841', 5 * HR, 1],
  ] },
  { name: '+55 81 9 8842-1190', number: '+55 81 9 8842-1190', kind: 'unknown', msgs: [
    ['them', 'URGENTE: sua conta foi BLOQUEADA. Regularize seu CPF agora e evite multa: bit.ly/regulariza-ja', 40 * MIN],
  ] },
  { name: '4020', number: '4020', kind: 'unknown', msgs: [
    ['them', 'PARABÉNS! Você ganhou R$ 5.000 no sorteio. Clique para resgatar: premio-hoje.xyz/ganhei', DAY + 5 * HR],
  ] },
  { name: '+55 81 3441-0092', number: '+55 81 3441-0092', kind: 'unknown', msgs: [
    ['them', 'Oi, aqui é do consultório da Dra. Paula. Sua consulta está confirmada para amanhã às 14h.', 3 * HR, 1],
  ] },
];
