/* detector.js  (ponte entre o app e a análise de spam)
 * É o único arquivo do front-end que fala com a API do modelo de ML.
 * O resto do app só chama Detector.classify(texto, contexto) e recebe uma nota.
 *
 * Duas formas de funcionar:
 *  1) API ligada: o servidor roda o modelo de ML (camada 1) e as regras (camada 2)
 *     e devolve a nota final.
 *  2) API desligada ou fora do ar: usa só as regras locais, assim o app nunca trava. */

const Detector = {
  apiUrl: '',
  apiOk: false,

  _url(caminho) { return this.apiUrl.replace(/\/$/, '') + caminho; },

  /** fetch com limite de tempo, para o app não ficar esperando uma API parada. */
  async _fetch(caminho, opcoes) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), CONFIG.apiTimeoutMs);
    try { return await fetch(this._url(caminho), { ...opcoes, signal: ac.signal }); }
    finally { clearTimeout(timer); }
  },

  /**
   * @param {string} texto
   * @param {{number:string, contact:boolean, blocked:boolean}} ctx
   * @returns {Promise<{score:number, reasons:string[], source:string, ml:number|null, rules:number|null}>}
   *   score, ml e rules em porcentagem (0 a 99). ml/rules são null quando a camada não rodou.
   */
  async classify(texto, ctx) {
    if (ctx.blocked) {
      return { score: 99, reasons: ['Você já bloqueou este número'], source: 'sua lista de bloqueio', ml: null, rules: null };
    }

    if (this.apiUrl) {
      try {
        const r = await this._fetch('/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: texto, sender: ctx.number, is_contact: ctx.contact }),
        });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const j = await r.json();
        this.apiOk = true;
        const pct = (x) => (x == null ? null : Math.round(x * 100));
        return {
          score: pct(j.spam_probability),
          reasons: j.reasons && j.reasons.length ? j.reasons : ['Classificado pelo modelo'],
          source: CONFIG.sourceLabels[j.decided_by] || CONFIG.sourceLabels.ml,
          ml: pct(j.ml_probability),
          rules: pct(j.rules_score),
        };
      } catch (e) {
        this.apiOk = false; // cai para as regras locais abaixo
      }
    }

    const r = Rules.analyze(texto, ctx);
    return { score: r.score, reasons: r.reasons, source: 'regras locais (sem API)', ml: null, rules: r.score };
  },

  /** Testa se a API responde. Devolve true/false. */
  async testConnection(url) {
    const antes = this.apiUrl;
    this.apiUrl = url;
    try {
      const r = await this._fetch('/health');
      this.apiOk = r.ok;
    } catch (e) {
      this.apiOk = false;
    }
    if (!this.apiOk) this.apiUrl = antes;
    return this.apiOk;
  },

  /** Envia a correção do usuário ("spam" ou "ham") para o servidor guardar. */
  sendFeedback(item) {
    if (!this.apiUrl || !this.apiOk) return;
    this._fetch('/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: item.text, sender: item.sender, label: item.label }),
    }).catch(() => {});
  },
};
