/* utils.js
 * Funções pequenas, sem estado, usadas pelo app inteiro.
 * Nada aqui conhece spam, conversas ou a tela. */

const $ = (seletor) => document.querySelector(seletor);

const Utils = {
  /** Troca < > & " ' por texto seguro antes de pôr qualquer mensagem no HTML. */
  esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },

  /** Monta um ícone SVG a partir do desenho (path). */
  icon(path, largura) {
    return `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${largura || 2}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
  },

  ICON: {
    shield: '<path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6z"/>',
    alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/>',
    back: '<path d="M15 18l-6-6 6-6"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 012-2h9"/>',
  },

  /** Hora de hoje, "Ontem" ou dia/mês. */
  fmt(ts) {
    const d = new Date(ts), agora = new Date();
    if (d.toDateString() === agora.toDateString()) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (d.toDateString() === new Date(agora - CONFIG.time.DAY).toDateString()) return 'Ontem';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  },

  initials(nome) {
    const p = nome.replace(/[^A-Za-zÀ-ú0-9 ]/g, '').trim().split(/\s+/);
    return ((p[0] || '?')[0] + (p[1] ? p[1][0] : '')).toUpperCase();
  },

  /** Cor do avatar, sempre a mesma para o mesmo nome. */
  hue(nome) {
    let h = 0;
    for (const c of nome) h = (h * 31 + c.charCodeAt(0)) % 360;
    return h;
  },

  URL_RE: /(https?:\/\/[^\s<]+|\b(?:bit\.ly|tinyurl\.com|cutt\.ly|rb\.gy|is\.gd)\/[^\s<]+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com\.br|com|net|xyz|top|click|info|site|link|online|br)(?:\/[^\s<]*)?)/gi,

  /** Escapa o texto e transforma links em botões. O app nunca abre o link sozinho. */
  linkify(texto) {
    return Utils.esc(texto).replace(Utils.URL_RE, (u) => {
      const resto = u.match(/[.,;)]+$/);
      const fim = resto ? resto[0] : '';
      const url = fim ? u.slice(0, -fim.length) : u;
      return `<button type="button" class="lnk" data-act="link" data-url="${url}">${url}</button>${fim}`;
    });
  },

  /** Copia para a área de transferência. Devolve true se deu certo. */
  async copy(texto) {
    try { await navigator.clipboard.writeText(texto); return true; }
    catch (e) { return false; }
  },
};
