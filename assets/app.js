const App = (() => {
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const isAbs = p => /^([a-z]+:)?\/\//i.test(p) || p.startsWith('/') || p.startsWith('data:');
  const resolve = (base, p) => (!p ? '' : isAbs(p) ? p : base + p);
  const safeUrl = u => (/^(https?:|mailto:|#|\/)/i.test(u) || !/:/.test(u) ? u : '#');

  const inline = s => {
    let t = esc(s);
    t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, a, b) => {
      const url = safeUrl(b);
      const ext = /^https?:/i.test(url) ? ' target="_blank" rel="noopener"' : '';
      return `<a href="${url}"${ext}>${a}</a>`;
    });
    t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/\*(?!\s)(.+?)\*/g, '<em>$1</em>');
    t = t.replace(/~~(.+?)~~/g, '<s>$1</s>');
    return t;
  };

  const blocks = (lines, ctx) => {
    let html = '';
    let para = [];
    let list = null;
    let quote = [];
    const flush = () => {
      if (para.length) html += `<p>${inline(para.join('\n')).replace(/\n/g, '<br>')}</p>`;
      if (list) html += `<${list.tag}>${list.items.map(i => `<li>${inline(i)}</li>`).join('')}</${list.tag}>`;
      if (quote.length) html += `<blockquote>${inline(quote.join('\n')).replace(/\n/g, '<br>')}</blockquote>`;
      para = [];
      list = null;
      quote = [];
    };
    lines.forEach(raw => {
      const line = raw.trimEnd();
      let m;
      if (!line.trim()) {
        flush();
        return;
      }
      if (/^#\s/.test(line)) return;
      if ((m = line.match(/^(#{3,4})\s+(.*)$/))) {
        flush();
        html += `<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`;
        return;
      }
      if ((m = line.match(/^\{\{(\w+)\}\}$/))) {
        flush();
        html += ctx.slot(m[1]);
        return;
      }
      if ((m = line.match(/^!\[(.*?)\]\((\S+?)\)$/))) {
        flush();
        const cap = m[1] ? `<figcaption>${inline(m[1])}</figcaption>` : '';
        html += `<figure class="inline-fig"><img src="${esc(resolve(ctx.base, m[2]))}" alt="${esc(m[1])}" loading="lazy">${cap}</figure>`;
        return;
      }
      if ((m = line.match(/^>\s?(.*)$/))) {
        if (!quote.length) flush();
        quote.push(m[1]);
        return;
      }
      if ((m = line.match(/^[-*]\s+(.*)$/))) {
        if (!list || list.tag !== 'ul') {
          flush();
          list = { tag: 'ul', items: [] };
        }
        list.items.push(m[1]);
        return;
      }
      if ((m = line.match(/^\d+\.\s+(.*)$/))) {
        if (!list || list.tag !== 'ol') {
          flush();
          list = { tag: 'ol', items: [] };
        }
        list.items.push(m[1]);
        return;
      }
      if (list || quote.length) flush();
      para.push(line);
    });
    flush();
    return html;
  };

  const parse = (src, base, slot) => {
    const groups = [{ title: null, lines: [] }];
    src.replace(/\r/g, '').split('\n').forEach(l => {
      const m = l.match(/^##\s+(.*)$/);
      if (m) groups.push({ title: m[1].trim(), lines: [] });
      else groups[groups.length - 1].lines.push(l);
    });
    const ctx = { base, slot };
    return {
      lead: blocks(groups[0].lines, ctx),
      sections: groups.slice(1).map((g, i) => ({ title: g.title, id: 'section-' + (i + 1), html: blocks(g.lines, ctx) })).filter(s => s.html.trim())
    };
  };

  const json = async p => {
    const r = await fetch(p, { cache: 'no-cache' });
    if (!r.ok) throw new Error(p + ' ' + r.status);
    return r.json();
  };

  const text = async p => {
    const r = await fetch(p, { cache: 'no-cache' });
    if (!r.ok) throw new Error(p + ' ' + r.status);
    return r.text();
  };

  const applyTheme = (el, theme) => {
    Object.entries(theme || {}).forEach(([k, v]) => el.style.setProperty('--' + k, v));
  };

  const chain = arr => arr.map((x, i) => `<span class="chain-item${i === arr.length - 1 ? ' last' : ''}">${esc(x)}</span>`).join('<span class="arr" aria-hidden="true">→</span>');

  return { esc, inline, parse, json, text, resolve, applyTheme, chain };
})();
