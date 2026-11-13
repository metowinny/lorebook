const Sparkles = (() => {
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const tones = ['sp1', 'sp2', 'sp3'];

  const fly = front => {
    const e = document.createElement('i');
    e.className = 'fly ' + pick(tones);
    e.style.cssText = `left:${rnd(0, 100)}%;top:${rnd(0, 100)}%;--s:${rnd(2, front ? 3 : 4.5)}px;--dx:${rnd(-60, 60)}px;--dy:${rnd(-90, 90)}px;--t:${rnd(9, 20)}s;--g:${rnd(2.5, 6)}s;animation-delay:${-rnd(0, 20)}s,${-rnd(0, 6)}s`;
    return e;
  };

  const star = () => {
    const e = document.createElement('i');
    e.className = 'star ' + pick(tones);
    e.style.cssText = `left:${rnd(2, 98)}%;top:${rnd(4, 96)}%;--s:${rnd(9, 20)}px;--g:${rnd(2.2, 5)}s;animation-delay:${-rnd(0, 5)}s`;
    return e;
  };

  const flies = (el, n, front) => {
    for (let i = 0; i < n; i++) el.appendChild(fly(front));
  };

  const stars = (el, n) => {
    for (let i = 0; i < n; i++) el.appendChild(star());
  };

  const layer = (name, n, front) => {
    const d = document.createElement('div');
    d.className = 'sparkles ' + name;
    d.setAttribute('aria-hidden', 'true');
    flies(d, n, front);
    stars(d, Math.round(n / 5));
    document.body.appendChild(d);
  };

  const init = () => {
    const n = Math.max(8, Math.min(18, Math.round((innerWidth * innerHeight) / 90000)));
    layer('back', n, false);
    layer('front', Math.round(n / 5), true);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { flies, stars };
})();
