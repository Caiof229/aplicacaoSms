/* ui.js  (tudo que desenha na tela)
 * Lê o Store e escreve HTML. Não decide nada sobre spam nem sobre conversas. */

const { esc, icon: I, ICON, fmt, initials, hue, linkify } = Utils;

const UI = {
  /* ---------- peças pequenas ---------- */
  avatar(t) {
    if (t.junk) return `<div class="av junk">${I(ICON.shield)}</div>`;
    return `<div class="av" style="background:hsl(${hue(t.name)} 42% 40%)">${esc(initials(t.name))}</div>`;
  },

  /** Traduz a nota em rótulo e cor: seguro, atenção ou golpe. */
  verdict(score) {
    if (score >= Store.sens) return { cls: 'bad', label: 'Provável golpe' };
    if (score >= CONFIG.warnFrom) return { cls: 'warn', label: 'Atenção' };
    return { cls: 'ok', label: 'Parece seguro' };
  },

  toast(msg) {
    const el = $('#toast');
    el.textContent = msg; el.hidden = false;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => { el.hidden = true; }, 3200);
  },

  async copy(texto, aviso) {
    this.toast((await Utils.copy(texto)) ? aviso : 'Não consegui copiar. Selecione o texto e copie manualmente.');
  },

  /* ---------- lista de conversas ---------- */
  renderTabs() {
    const junk = Store.junkCount();
    const abas = Store.easy
      ? [['all', 'Mensagens'], ['junk', 'Suspeitas']]
      : [['all', 'Todas'], ['people', 'Pessoas'], ['services', 'Serviços'], ['junk', 'Suspeitas']];
    if (!abas.some((a) => a[0] === Store.filter)) Store.filter = 'all';
    $('#tabs').innerHTML = abas.map(([k, rotulo]) =>
      `<button class="tab" role="tab" aria-selected="${Store.filter === k}" data-act="tab" data-tab="${k}">${rotulo}${k === 'junk' && junk ? `<span class="n">${junk}</span>` : ''}</button>`).join('');
  },

  renderList() {
    const lista = Store.visible();
    if (!lista.length) {
      const msg = Store.q ? 'Nada encontrado para essa busca.'
        : Store.filter === 'junk' ? 'Nenhuma mensagem suspeita por enquanto. Quando o detector barrar algo, aparece aqui.'
        : 'Nenhuma conversa aqui ainda.';
      $('#threads').innerHTML = `<div class="empty">${msg}</div>`;
      return;
    }
    $('#threads').innerHTML = lista.map((t) => {
      const m = Store.last(t);
      return `<button class="row ${t.unread ? 'unread' : ''}" data-act="open" data-id="${t.id}" aria-current="${Store.active === t.id}">
        ${this.avatar(t)}
        <div style="min-width:0"><div class="rname">${esc(t.name)}</div><div class="rprev">${m.from === 'me' ? 'Você: ' : ''}${esc(m.text)}</div></div>
        <div class="rmeta"><span>${fmt(m.t)}</span>${t.junk ? '<span class="tag">Suspeita</span>' : t.unread ? `<span class="badge">${t.unread}</span>` : ''}</div>
      </button>`;
    }).join('');
  },

  /* ---------- conversa aberta ---------- */

  /** Caixa de aviso embaixo da mensagem suspeita: motivos + botões de correção. */
  alertFor(m) {
    if (m.from !== 'them' || m.score < CONFIG.warnFrom) return '';
    const v = this.verdict(m.score);
    const motivos = m.reasons.slice(0, Store.easy ? 1 : 3).map((r) => `<li>${esc(r)}</li>`).join('');
    const acao = m.feedback
      ? `<p class="done">${m.feedback === 'spam' ? 'Você marcou como spam. O número foi bloqueado.' : 'Você marcou como seguro. Obrigado, o detector aprende com isso.'}</p>`
      : `<div class="btns"><button class="btn small danger" data-act="spam" data-m="${m.id}">É spam</button><button class="btn small" data-act="ham" data-m="${m.id}">Não é spam</button></div>`;
    const fonte = m.source && !Store.easy ? `<p class="src">Analisado por: ${esc(m.source)}</p>` : '';
    return `<div class="alert ${v.cls}"><b>${I(ICON.alert)}${v.label} · ${m.score}%</b><ul>${motivos}</ul>${acao}${fonte}</div>`;
  },

  /** Botão "Copiar código" para SMS de verificação de bancos e serviços. */
  otpButton(t, m) {
    if (m.from !== 'them' || t.kind !== 'service' || !/(c[oó]digo|token)/i.test(m.text)) return '';
    const c = m.text.match(/\b\d{4,8}\b/);
    return c ? `<button class="btn small otp" data-act="copycode" data-code="${c[0]}">${I(ICON.copy)} Copiar código ${c[0]}</button>` : '';
  },

  renderConv() {
    const t = Store.thread(Store.active);
    $('#welcome').hidden = !!t;
    $('#conv').hidden = !t;
    if (!t) {
      $('#stats').innerHTML =
        `<div class="stat"><b>${Store.scanned}</b><span>mensagens analisadas</span></div>` +
        `<div class="stat"><b>${Store.junkCount()}</b><span>conversas suspeitas separadas</span></div>` +
        `<div class="stat"><b>${Store.feedback.length}</b><span>correções suas guardadas</span></div>`;
      return;
    }
    $('#chead').innerHTML = `<button class="icon-btn back" data-act="back" aria-label="Voltar">${I(ICON.back, 2.4)}</button>${this.avatar(t)}
      <div class="who"><b>${esc(t.name)}</b><span>${esc(t.number)}</span></div>
      <span class="status ${t.junk ? 'bad' : ''}">${I(ICON.shield)}${t.junk ? 'Suspeita' : 'Protegida'}</span>`;

    $('#banner').innerHTML = t.junk
      ? `<div class="banner">${I(ICON.alert)}<div class="txt"><b>Conversa suspeita</b><p>Não clique em links nem envie dados. Se você conhece esta pessoa, devolva a conversa.</p></div>
         <div class="btns"><button class="btn small" data-act="hamthread">Não é spam</button>${Store.blocked.has(t.number) ? '' : '<button class="btn small danger" data-act="blocknum">Bloquear número</button>'}</div></div>`
      : '';

    $('#msgs').innerHTML = t.messages.map((m) =>
      `<div class="mwrap ${m.from}"><div class="b">${linkify(m.text)}</div>${this.alertFor(m)}${this.otpButton(t, m)}<span class="time">${fmt(m.t)}</span></div>`).join('');
    $('#composer').hidden = t.junk;
    $('#locked').hidden = !t.junk;
    const caixa = $('#msgs');
    caixa.scrollTop = caixa.scrollHeight;
  },

  render() {
    $('#app').className = 'app' + (Store.easy ? ' easy' : '');
    $('#app').dataset.view = Store.view;
    $('#labBtn').hidden = Store.easy;
    this.renderTabs();
    this.renderList();
    this.renderConv();
  },

  /* ---------- janelas (sheets) ---------- */
  openSheet(id) {
    $('#scrim').hidden = false;
    document.querySelectorAll('.sheet').forEach((s) => { s.hidden = s.id !== id; });
    if (id === 'sheet-settings') this.refreshSettings();
    const foco = document.querySelector(`#${id} input, #${id} textarea, #${id} button`);
    if (foco) foco.focus();
  },
  closeSheets() {
    $('#scrim').hidden = true;
    document.querySelectorAll('.sheet').forEach((s) => { s.hidden = true; });
  },

  refreshSettings() {
    $('#easySw').setAttribute('aria-checked', Store.easy);
    document.querySelectorAll('#sens button').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.v === Store.sens)));
    $('#apiUrl').value = Detector.apiUrl;
    $('#detStatus').textContent = Detector.apiUrl && Detector.apiOk
      ? 'Conectado. O modelo de ML analisa cada SMS e as regras de segurança funcionam como segunda camada.'
      : 'Usando só as regras locais (demonstração). Conecte a API para usar o seu modelo de ML.';
    $('#fbInfo').textContent = Store.feedback.length
      ? `${Store.feedback.length} correção(ões) guardada(s). Elas servem de dados novos para treinar o modelo de novo.`
      : 'Quando você marca “É spam” ou “Não é spam”, a correção fica guardada aqui para treinar o modelo de novo.';
  },

  /* ---------- laboratório de teste ---------- */
  initLab() {
    $('#presets').innerHTML = CONFIG.presets.map((p, i) => `<button type="button" data-act="preset" data-i="${i}">${esc(p.name)}</button>`).join('');
  },
  pickPreset(i) {
    const p = CONFIG.presets[i];
    $('#labFrom').value = p.from; $('#labText').value = p.text; $('#labResult').innerHTML = '';
  },
  resultHTML(r) {
    const v = this.verdict(r.score);
    const camadas = r.ml != null
      ? `<div class="layers"><span>Modelo de ML <b>${r.ml}%</b></span><span>Regras de segurança <b>${r.rules}%</b></span></div>` : '';
    const motivos = r.reasons.length
      ? `<ul>${r.reasons.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`
      : '<span class="note">Nenhum sinal de golpe encontrado.</span>';
    return `<div class="result"><b>${v.label} · ${r.score}%</b>
      <div class="meter ${v.cls}"><i style="width:${Math.max(r.score, 3)}%"></i></div>${camadas}${motivos}
      <p class="note">Decidido por: ${esc(r.source)}</p></div>`;
  },
};
