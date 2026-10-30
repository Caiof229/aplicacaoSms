/* rules.js  (camada de regras)
 * Lê o texto e procura sinais clássicos de golpe: pressa, prêmio, link encurtado,
 * pedido de senha. Devolve uma nota e os motivos em português.
 *
 * Papel no projeto: segunda camada de proteção e também o detector de reserva
 * quando a API do modelo de ML não está ligada. As regras vêm de
 * rules.data.js, gerado de shared/rules.json (a mesma lista que o Python usa). */

const Rules = (() => {
  const cfg = RULES_DATA.settings;
  const regras = RULES_DATA.rules.map((r) => ({ ...r, re: new RegExp(r.pattern, 'i') }));

  /** Tira acentos para "prêmio" e "premio" valerem igual. */
  const semAcento = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '');

  /**
   * @param {string} texto
   * @param {{contact:boolean}} ctx  contact = número está nos contatos
   * @returns {{score:number, reasons:string[]}}  score de 0 a 99
   */
  function analyze(texto, ctx) {
    const limpo = semAcento(texto);
    let score = 0;
    const achados = [];

    for (const r of regras) {
      if (r.re.test(limpo)) {
        score += r.weight;
        if (r.weight > 0) achados.push(r);
      }
    }

    // Mensagem GRITANDO em maiúsculas
    const letras = texto.replace(/[^A-Za-zÀ-ú]/g, '');
    const maiusculas = letras.replace(/[^A-ZÀ-Þ]/g, '').length;
    if (letras.length > cfg.caps.min_letters && maiusculas / letras.length > cfg.caps.ratio) {
      score += cfg.caps.weight;
      achados.push({ weight: cfg.caps.weight, why: cfg.caps.why });
    }

    if (!ctx.contact) score += cfg.unknown_sender_weight; // número desconhecido pesa um pouco

    score = Math.max(0, Math.min(cfg.max_score, score));
    achados.sort((a, b) => b.weight - a.weight);
    return { score, reasons: achados.slice(0, cfg.top_reasons).map((a) => a.why) };
  }

  return { analyze };
})();
