/* store.js  (dados e regras do app)
 * Guarda as conversas e decide o que acontece com elas: receber SMS, mandar para
 * Suspeitas, bloquear número, registrar correção do usuário.
 * Não mexe na tela. Quando algo muda, chama Store.onChange() e a tela se redesenha. */

const Store = {
  threads: [],
  filter: 'all',          // all | people | services | junk
  q: '',                  // texto da busca
  active: null,           // id da conversa aberta
  view: 'list',           // list | chat (só importa no celular)
  easy: false,            // modo fácil
  sens: CONFIG.defaultSensitivity,
  feedback: [],           // correções do usuário
  blocked: new Set(),     // números bloqueados
  allowed: new Set(),     // números liberados com "Não é spam"
  scanned: 0,             // quantas mensagens já passaram pelo detector
  lastLink: '',
  onChange() {},          // a tela define isto no main.js

  _n: 0,
  uid() { return 'i' + (++this._n); },
  notify() { this.onChange(); },

  /* ---------- ajustes guardados no navegador ---------- */
  load() {
    try {
      const s = JSON.parse(localStorage.getItem(CONFIG.storageKey) || '{}');
      this.easy = !!s.easy;
      if (CONFIG.sensitivityLevels.includes(s.sens)) this.sens = s.sens;
      Detector.apiUrl = s.apiUrl || '';
    } catch (e) { /* sem armazenamento: segue com o padrão */ }
  },
  save() {
    try {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify({ easy: this.easy, sens: this.sens, apiUrl: Detector.apiUrl }));
    } catch (e) { /* ignora */ }
  },

  /* ---------- consultas ---------- */
  last(t) { return t.messages[t.messages.length - 1]; },
  thread(id) { return this.threads.find((t) => t.id === id); },
  junkCount() { return this.threads.filter((t) => t.junk).length; },

  findMsg(id) {
    for (const t of this.threads) {
      const m = t.messages.find((x) => x.id === id);
      if (m) return { t, m };
    }
    return null;
  },

  /** Conversas que aparecem na lista, conforme aba e busca. */
  visible() {
    const q = this.q.trim().toLowerCase();
    let lista = this.threads.filter((t) => {
      if (this.filter === 'junk') return t.junk;
      if (t.junk) return false;
      if (this.filter === 'people') return t.kind === 'person';
      if (this.filter === 'services') return t.kind === 'service';
      return true;
    });
    if (q) {
      lista = lista.filter((t) => t.name.toLowerCase().includes(q) || t.number.toLowerCase().includes(q)
        || t.messages.some((m) => m.text.toLowerCase().includes(q)));
    }
    return lista.sort((a, b) => this.last(b).t - this.last(a).t);
  },

  /* ---------- criação ---------- */
  _newThread(name, number, kind) {
    const t = { id: this.uid(), name, number, kind, junk: false, unread: 0, messages: [] };
    this.threads.push(t);
    return t;
  },
  _msg(from, text, quando, extra) {
    return { id: this.uid(), from, text, t: quando, score: 0, reasons: [], feedback: null, ...extra };
  },

  /** Carrega as conversas de exemplo (seed.js) e analisa cada mensagem recebida. */
  seed() {
    for (const s of SEED) {
      const t = this._newThread(s.name, s.number, s.kind);
      const ctx = { contact: s.kind !== 'unknown' };
      for (const [from, text, ago, unread] of s.msgs) {
        const m = this._msg(from, text, Date.now() - ago);
        if (from === 'them') {
          const r = Rules.analyze(text, ctx);
          m.score = r.score; m.reasons = r.reasons; this.scanned++;
        }
        t.messages.push(m);
        if (unread) t.unread++;
      }
      if (s.kind === 'unknown' && t.messages.some((m) => m.from === 'them' && m.score >= this.sens)) t.junk = true;
    }
  },

  /* ---------- receber e enviar ---------- */

  /** Chegou um SMS: passa pelo detector e, se for golpe de número desconhecido, vai para Suspeitas. */
  async receive(number, text) {
    let t = this.threads.find((x) => x.number === number || x.name === number);
    if (!t) t = this._newThread(number, number, 'unknown');

    const r = await Detector.classify(text, {
      number: t.number, contact: t.kind !== 'unknown', blocked: this.blocked.has(t.number),
    });
    this.scanned++;

    const m = this._msg('them', text, Date.now(), { score: r.score, reasons: r.reasons, source: r.source });
    t.messages.push(m);

    const flagged = r.score >= this.sens;
    const junked = flagged && t.kind === 'unknown' && !this.allowed.has(t.number);
    if (junked) t.junk = true;
    if (!(this.active === t.id && this.view === 'chat') && !t.junk) t.unread++;

    this.notify();
    return { t, m, r, flagged, junked };
  },

  send(t, text) {
    t.messages.push(this._msg('me', text, Date.now()));
    this.notify();
    if (t.kind === 'person') { // resposta de mentira, só para a demonstração
      setTimeout(() => {
        const rs = CONFIG.autoReplies;
        t.messages.push(this._msg('them', rs[Math.floor(Math.random() * rs.length)], Date.now()));
        if (!(this.active === t.id && this.view === 'chat')) t.unread++;
        this.notify();
      }, 1800);
    }
  },

  /** Começa uma conversa nova (ou reabre a existente) e envia. */
  sendNew(para, text) {
    let t = this.threads.find((x) => x.name.toLowerCase() === para.toLowerCase() || x.number === para);
    if (!t) t = this._newThread(para, para, 'person');
    this.active = t.id; this.view = 'chat'; t.unread = 0;
    this.send(t, text);
  },

  /* ---------- correções do usuário (alimentam o aprendizado) ---------- */
  _log(t, m, label) {
    const item = { text: m.text, sender: t.number, label, score: m.score, ts: new Date().toISOString() };
    this.feedback.push(item);
    Detector.sendFeedback(item);
  },

  /** O usuário marcou uma mensagem como 'spam' ou 'ham' (não é spam). */
  mark(msgId, label) {
    const f = this.findMsg(msgId);
    if (!f) return;
    f.m.feedback = label;
    this._log(f.t, f.m, label);
    if (label === 'spam') {
      this.blocked.add(f.t.number); this.allowed.delete(f.t.number);
      if (f.t.kind === 'unknown') f.t.junk = true;
    } else {
      this.allowed.add(f.t.number); this.blocked.delete(f.t.number); f.t.junk = false;
    }
    this.notify();
  },

  /** "Não é spam" na conversa inteira. */
  releaseThread(t) {
    t.messages.filter((m) => m.from === 'them' && !m.feedback).forEach((m) => { m.feedback = 'ham'; this._log(t, m, 'ham'); });
    this.allowed.add(t.number); this.blocked.delete(t.number); t.junk = false;
    this.notify();
  },

  /** "Bloquear número": tudo que ele mandar vai direto para Suspeitas. */
  blockThread(t) {
    t.messages.filter((m) => m.from === 'them' && !m.feedback).forEach((m) => { m.feedback = 'spam'; this._log(t, m, 'spam'); });
    this.blocked.add(t.number);
    this.notify();
  },
};
