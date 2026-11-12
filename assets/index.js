(async () => {
  const site = await App.json('data/site.json').catch(() => ({ title: 'Лорсайт', subtitle: '', characters: [] }));
  App.applyTheme(document.documentElement, site.theme);
  document.title = site.title || 'Лорсайт';
  document.getElementById('site-title').textContent = site.title || 'Лорсайт';
  document.getElementById('site-sub').textContent = site.subtitle || '';
  const box = document.getElementById('cards');
  const loaded = await Promise.all((site.characters || []).map(async id => {
    try {
      return { id, d: await App.json(`characters/${id}/data.json`) };
    } catch (e) {
      return null;
    }
  }));
  const items = loaded.filter(Boolean);
  if (!items.length) {
    box.innerHTML = '<p class="panel empty">Персонажей пока нет. Добавь id в data/site.json.</p>';
    return;
  }
  items.forEach(({ id, d }) => {
    const a = document.createElement('a');
    a.className = 'card themed';
    a.href = `character.html?id=${encodeURIComponent(id)}`;
    App.applyTheme(a, d.theme);
    const base = `characters/${encodeURIComponent(id)}/`;
    const sub = [d.clanName, d.faction].filter(Boolean).map(App.esc).join('<br>');
    a.innerHTML = `<div class="card-img"></div><div class="card-body"><h2>${App.esc(d.name || id)}</h2>${sub ? `<p>${sub}</p>` : ''}</div>`;
    if (d.header) a.firstElementChild.style.backgroundImage = `url("${App.resolve(base, d.header)}")`;
    box.appendChild(a);
  });
})();
