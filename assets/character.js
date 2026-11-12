(async () => {
  const $ = id => document.getElementById(id);
  const list = a => (a || []).filter(Boolean);
  const fail = msg => {
    $('hero').innerHTML = `<div class="hero-inner"><h1>${App.esc(msg)}</h1></div>`;
    $('tabs').hidden = true;
    $('view-article').hidden = true;
  };

  const id = new URLSearchParams(location.search).get('id');
  if (!id) return fail('Персонаж не выбран');
  const base = `characters/${encodeURIComponent(id)}/`;

  let data;
  let lore;
  try {
    [data, lore] = await Promise.all([App.json(base + 'data.json'), App.text(base + 'lore.md').catch(() => '')]);
  } catch (e) {
    return fail('Персонаж не найден');
  }
  const site = await App.json('data/site.json').catch(() => ({}));

  App.applyTheme(document.documentElement, data.theme);
  document.title = `${data.name || id} — ${site.title || 'Лорсайт'}`;

  const hero = $('hero');
  const q = typeof data.quote === 'string' ? { text: data.quote } : data.quote;
  hero.innerHTML = `<div class="hero-inner"><h1>${App.esc(data.name || id)}</h1>${q && q.text ? `<blockquote class="hero-quote"><p>${App.inline(q.text)}</p>${q.by ? `<footer>${App.esc(q.by)}</footer>` : ''}</blockquote>` : ''}</div>`;
  if (data.header) hero.style.backgroundImage = `url("${App.resolve(base, data.header)}")`;

  const link = n => {
    const o = typeof n === 'string' ? { name: n } : n;
    return o.id ? `<a href="character.html?id=${encodeURIComponent(o.id)}">${App.esc(o.name)}</a>` : App.esc(o.name);
  };

  const rows = [];
  const row = (label, html, stack) => {
    if (html) rows.push(`<div class="row${stack ? ' stack' : ''}"><dt>${label}</dt><dd>${html}</dd></div>`);
  };
  const names = list(data.nameChain);
  const ranks = list(data.rankChain);
  row('Клановое имя', App.esc(data.clanName || ''), true);
  row('Цепь имён', names.length ? App.chain(names) : '', true);
  row('Цепь должностей', ranks.length ? App.chain(ranks) : '', true);
  row('Пол', App.esc(data.gender || ''));
  row('Фракция', App.esc(data.faction || ''));
  row('Причина смерти', App.esc(data.deathCause || ''));

  const fam = (data.family || []).map(f => ({ label: f.label, names: list(f.names) })).filter(f => f.label && f.names.length);
  $('side').innerHTML =
    `<section class="box"><h2 class="box-title">${App.esc(data.name || id)}</h2>${rows.length ? `<dl class="box-body">${rows.join('')}</dl>` : ''}</section>` +
    (fam.length ? `<section class="box"><h2 class="box-title">Семья</h2><dl class="box-body">${fam.map(f => `<div class="row"><dt>${App.esc(f.label)}</dt><dd>${f.names.map(link).join('<br>')}</dd></div>`).join('')}</dl></section>` : '');

  const relations = () => {
    const groups = (data.relations || []).map(g => ({ title: g.title, items: list(g.items).filter(i => i.name) })).filter(g => g.items.length);
    return groups.map(g => `<h3>${App.esc(g.title || '')}</h3><div class="rel-grid">${g.items.map(i => `<div class="rel"><div class="rel-head"><span class="rel-name">${link(i)}</span>${i.role ? `<span class="tag">${App.esc(i.role)}</span>` : ''}</div>${i.text ? `<p>${App.inline(i.text)}</p>` : ''}</div>`).join('')}</div>`).join('');
  };

  const parsed = App.parse(lore, base, name => (name === 'relations' ? relations() : ''));
  const toc = parsed.sections.length >= 3 ? `<nav class="toc"><strong>Содержание</strong><ol>${parsed.sections.map(s => `<li><a href="#${s.id}">${App.esc(s.title)}</a></li>`).join('')}</ol></nav>` : '';
  const articleHtml = (parsed.lead ? `<div class="lead">${parsed.lead}</div>` : '') + toc + parsed.sections.map(s => `<section id="${s.id}"><h2>${App.esc(s.title)}</h2>${s.html}</section>`).join('');
  $('article').innerHTML = articleHtml || '<p>Здесь пока пусто. Заполни файл lore.md.</p>';

  const cats = [['reference', 'Референс'], ['model', 'Модель'], ['arts', 'Арты']];
  const items = [];
  const groups = cats.map(([key, title]) => {
    const g = list(data.gallery && data.gallery[key]).filter(i => i.src).map(i => ({ src: App.resolve(base, i.src), caption: i.caption || '', by: i.by || '', ratio: 1 }));
    g.forEach(i => items.push(i));
    return { title, items: g };
  }).filter(g => g.items.length);

  const galleryBox = $('gallery');
  groups.forEach(g => {
    const s = document.createElement('section');
    s.className = 'panel gal-section';
    s.innerHTML = `<h2>${App.esc(g.title)}</h2><div class="jgal"></div>`;
    g.el = s.querySelector('.jgal');
    galleryBox.appendChild(s);
  });

  const lb = $('lb');
  const lbImg = $('lb-img');
  const lbCap = $('lb-cap');
  const lbStatus = $('lb-status');
  let cur = 0;
  let prevFocus = null;

  const openLb = i => {
    if (lb.hidden) prevFocus = document.activeElement;
    cur = (i + items.length) % items.length;
    const it = items[cur];
    lbImg.src = it.src;
    lbImg.alt = it.caption;
    lbCap.textContent = [it.caption, it.by ? `Автор: ${it.by}` : ''].filter(Boolean).join(' — ');
    $('lb-open').href = it.src;
    lbStatus.textContent = '';
    lb.hidden = false;
    document.body.classList.add('noscroll');
    $('lb-close').focus();
  };

  const closeLb = () => {
    lb.hidden = true;
    document.body.classList.remove('noscroll');
    if (prevFocus && prevFocus.focus) prevFocus.focus();
  };

  const toPng = src => new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => {
      const c = document.createElement('canvas');
      c.width = im.naturalWidth;
      c.height = im.naturalHeight;
      c.getContext('2d').drawImage(im, 0, 0);
      c.toBlob(b => (b ? res(b) : rej(new Error('blob'))), 'image/png');
    };
    im.onerror = rej;
    im.src = src;
  });

  $('lb-copy').addEventListener('click', async () => {
    try {
      const blob = await toPng(items[cur].src);
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      lbStatus.textContent = 'Картинка скопирована';
    } catch (e) {
      lbStatus.textContent = 'Не получилось скопировать. Нажми на картинку правой кнопкой и выбери «Копировать изображение».';
    }
  });
  $('lb-close').addEventListener('click', closeLb);
  $('lb-prev').addEventListener('click', () => openLb(cur - 1));
  $('lb-next').addEventListener('click', () => openLb(cur + 1));
  lb.addEventListener('click', e => {
    if (e.target === lb) closeLb();
  });
  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') openLb(cur - 1);
    if (e.key === 'ArrowRight') openLb(cur + 1);
  });

  const gap = 10;
  const tile = (it, h) => {
    const f = document.createElement('figure');
    f.className = 'tile';
    f.style.width = Math.floor(it.ratio * h) + 'px';
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tile-btn';
    b.setAttribute('aria-label', it.caption || 'Открыть изображение');
    const im = document.createElement('img');
    im.src = it.src;
    im.alt = it.caption;
    im.loading = 'lazy';
    im.style.height = Math.round(h) + 'px';
    b.appendChild(im);
    b.addEventListener('click', () => openLb(items.indexOf(it)));
    f.appendChild(b);
    if (it.caption) {
      const c = document.createElement('figcaption');
      c.textContent = it.caption;
      f.appendChild(c);
    }
    return f;
  };

  const layoutGroup = g => {
    const W = g.el.clientWidth;
    if (!W) return;
    const target = W < 560 ? 150 : W < 900 ? 200 : 240;
    g.el.innerHTML = '';
    let row = [];
    let sum = 0;
    const flush = h => {
      const r = document.createElement('div');
      r.className = 'jrow';
      row.forEach(it => r.appendChild(tile(it, h)));
      g.el.appendChild(r);
      row = [];
      sum = 0;
    };
    g.items.forEach(it => {
      row.push(it);
      sum += it.ratio;
      const h = (W - gap * (row.length - 1)) / sum;
      if (h <= target) flush(h);
    });
    if (row.length) flush(Math.min(target, (W - gap * (row.length - 1)) / sum));
  };

  let ready = false;
  const layoutAll = () => {
    if (ready) groups.forEach(layoutGroup);
  };

  Promise.all(items.map(it => new Promise(res => {
    const im = new Image();
    im.onload = () => {
      it.ratio = im.naturalWidth / im.naturalHeight || 1;
      res();
    };
    im.onerror = res;
    im.src = it.src;
  }))).then(() => {
    ready = true;
    layoutAll();
  });

  let timer;
  window.addEventListener('resize', () => {
    clearTimeout(timer);
    timer = setTimeout(layoutAll, 120);
  });

  const hasGallery = items.length > 0;
  $('tabs').hidden = !hasGallery;
  const route = () => {
    const g = hasGallery && location.hash === '#gallery';
    $('view-article').hidden = g;
    $('view-gallery').hidden = !g;
    document.querySelectorAll('[data-tab]').forEach(t => {
      if ((t.dataset.tab === 'gallery') === g) t.setAttribute('aria-current', 'page');
      else t.removeAttribute('aria-current');
    });
    if (g) layoutAll();
  };
  window.addEventListener('hashchange', route);
  route();
})();
