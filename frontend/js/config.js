/* config.js
 * Números e textos que você pode querer mudar sem mexer na lógica. */

const CONFIG = {
  storageKey: 'torpedo',        // nome usado para guardar ajustes no navegador
  apiTimeoutMs: 2500,           // quanto esperar pela API antes de desistir
  warnFrom: 35,                 // a partir de quantos % mostra "Atenção"
  defaultSensitivity: 60,       // a partir de quantos % vira "Provável golpe"
  sensitivityLevels: [40, 60, 80], // rigoroso, equilibrado, leve

  time: { MIN: 6e4, HR: 36e5, DAY: 864e5 },

  /** Links que merecem aviso mais forte ao tocar. */
  badLink: /(bit\.ly|tinyurl|cutt\.ly|rb\.gy|is\.gd|\.xyz|\.top|\.click|\.site|\.link)/i,

  /** Exemplos do "Testar o detector". */
  presets: [
    { name: 'Golpe de Pix', from: '+55 11 94400-7788', text: 'Banco Horizonte: detectamos um erro no seu Pix e sua chave será BLOQUEADA hoje. Confirme seus dados e senha: rb.gy/pix-seguro' },
    { name: 'Prêmio falso', from: '4020', text: 'PARABÉNS! Você ganhou R$ 10.000 no sorteio. Clique agora: ganhe-hoje.top/resgatar' },
    { name: 'Propaganda de loja', from: '+55 81 3322-1100', text: 'Mercado Bom: ofertas da semana em hortifruti até domingo. Veja o encarte na loja.' },
    { name: 'Código do banco', from: '28000', text: 'Seu código de acesso é 719304. Não compartilhe com ninguém.' },
  ],

  /** Respostas automáticas dos contatos nas conversas de exemplo. */
  autoReplies: ['Combinado! 👍', 'Beleza, já vi aqui.', 'Perfeito, obrigado!', 'Ok, falo com você mais tarde.'],

  /** Como cada camada aparece para o usuário. */
  sourceLabels: {
    ml: 'modelo de ML',
    rules: 'regras de segurança (rede de proteção)',
    both: 'modelo de ML + regras de segurança',
  },
};
