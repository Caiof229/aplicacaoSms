/* main.js  (liga tudo)
 * Escuta cliques e teclado, chama o Store e manda a UI redesenhar.
 * É o último script carregado. */

/** Cada botão da tela tem data-act="nome". Aqui fica o que cada nome faz. */
const ACTIONS = {
  tab: (el) => { Store.filter = el.dataset.tab; UI.render(); },
  open: (el) => { Store.active = el.dataset.id; Store.view = 'chat'; Store.thread(Store.active).unread = 0; UI.render(); },
  back: () => { Store.view = 'list'; UI.render(); },

  settings: () => UI.openSheet('sheet-settings'),
  lab: () => { UI.openSheet('sheet-lab'); if (!$('#labText').value) UI.pickPreset(0); },
  newmsg: () => {
    $('#contacts').innerHTML = Store.threads.filter((t) => t.kind === 'person').map((t) => `<option value="${Utils.esc(t.name)}">`).join('');
    UI.openSheet('sheet-new');
  },
  close: () => UI.closeSheets(),

  easy: () => { Store.easy = !Store.easy; Store.save(); UI.refreshSettings(); UI.render(); },
  sens: (el) => { Store.sens = +el.dataset.v; Store.save(); UI.refreshSettings(); UI.toast('Rigor do filtro atualizado'); },

  testapi: async () => {
    const url = $('#apiUrl').value.trim().replace(/\/$/, '');
    const aviso = $('#apiMsg');
    if (!url) { aviso.textContent = 'Digite o endereço da API, por exemplo http://localhost:8000.'; return; }
    aviso.textContent = 'Conectando...';
    const ok = await Detector.testConnection(url);
    if (ok) { Store.save(); aviso.textContent = 'Conectado. Os próximos SMS serão analisados pelo seu modelo.'; }
    else aviso.textContent = 'Não consegui conectar. Confirme que a API está rodando. A versão publicada na internet não alcança servidores do seu computador: abra o frontend/index.html localmente para usar a API.';
    UI.refreshSettings();
  },
  clearapi: () => { Detector.apiUrl = ''; Detector.apiOk = false; Store.save(); $('#apiMsg').textContent = 'Voltou para as regras locais.'; UI.refreshSettings(); },
  copyfb: () => UI.copy(JSON.stringify(Store.feedback, null, 2), 'Correções copiadas'),

  preset: (el) => UI.pickPreset(+el.dataset.i),
  analyze: async () => {
    const from = $('#labFrom').value.trim();
    const contato = Store.threads.some((t) => t.number === from && t.kind !== 'unknown');
    const r = await Detector.classify($('#labText').value, { number: from, contact: contato, blocked: Store.blocked.has(from) });
    $('#labResult').innerHTML = UI.resultHTML(r);
  },
  deliver: async () => {
    const text = $('#labText').value.trim(), num = $('#labFrom').value.trim();
    if (!text || !num) { UI.toast('Preencha o número e a mensagem'); return; }
    const { r, junked, flagged } = await Store.receive(num, text);
    $('#labResult').innerHTML = UI.resultHTML(r);
    if (junked) UI.toast('Mensagem suspeita enviada para a aba Suspeitas');
    else if (flagged) UI.toast('Atenção: esta mensagem parece golpe');
  },

  sendnew: () => {
    const para = $('#newTo').value.trim(), text = $('#newText').value.trim();
    if (!para || !text) { UI.toast('Preencha para quem e a mensagem'); return; }
    UI.closeSheets();
    Store.sendNew(para, text);
    $('#newTo').value = ''; $('#newText').value = '';
  },

  link: (el) => {
    const url = el.dataset.url;
    Store.lastLink = url;
    $('#linkUrl').textContent = url;
    $('#linkWhy').textContent = CONFIG.badLink.test(url)
      ? 'Este endereço é encurtado ou incomum. É um sinal clássico de golpe, porque esconde para onde você vai.'
      : 'Confira se o endereço é mesmo da empresa que enviou a mensagem antes de abrir.';
    UI.openSheet('sheet-link');
  },
  copylink: () => UI.copy(Store.lastLink, 'Endereço copiado'),
  copycode: (el) => UI.copy(el.dataset.code, 'Código copiado'),

  spam: (el) => { Store.mark(el.dataset.m, 'spam'); UI.toast('Marcado como spam e número bloqueado'); },
  ham: (el) => { Store.mark(el.dataset.m, 'ham'); UI.toast('Ok, vamos confiar neste número'); },
  hamthread: () => { Store.releaseThread(Store.thread(Store.active)); UI.toast('Conversa devolvida para suas mensagens'); },
  blocknum: () => { Store.blockThread(Store.thread(Store.active)); UI.toast('Número bloqueado. Novas mensagens dele vão direto para Suspeitas'); },
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) { if (e.target.id === 'scrim') UI.closeSheets(); return; }
  const acao = ACTIONS[el.dataset.act];
  if (acao) acao(el);
});

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') UI.closeSheets(); });

$('#q').addEventListener('input', (e) => { Store.q = e.target.value; UI.renderList(); });

$('#composer').addEventListener('submit', (e) => {
  e.preventDefault();
  const t = Store.thread(Store.active), caixa = $('#msg'), texto = caixa.value.trim();
  if (!t || !texto) return;
  caixa.value = ''; caixa.style.height = 'auto';
  Store.send(t, texto);
});
$('#msg').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('#composer').requestSubmit(); }
});
$('#msg').addEventListener('input', (e) => {
  e.target.style.height = 'auto';
  e.target.style.height = Math.min(e.target.scrollHeight, 130) + 'px';
});

/* ---------- partida ---------- */
Store.onChange = () => UI.render();
Store.load();
Store.seed();
UI.initLab();
UI.render();
