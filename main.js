
document.documentElement.classList.add('js');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

(function asciiBottle() {
  const pre = document.getElementById('ascii');
  const btn = document.getElementById('sip');
  const status = document.getElementById('sip-status');
  if (!pre || !btn) return;

  const T = [
    "       .-----.",
    "       |=====|",
    "       '-----'",
    "        |###|",
    "        |###|",
    "        |###|",
    "       /#####\\",
    "      /#######\\",
    "     /#########\\",
    "    |###########|",
    "    |###########|",
    "    |===========|",
    "    |   C H I   |",
    "    | --------- |",
    "    |  4 VODKA  |",
    "    |  40% VOL  |",
    "    |===========|",
    "    |###########|",
    "    |###########|",
    "    |###########|",
    "    |###########|",
    "    |###########|",
    "    '-----------'",
  ];
  const LABEL_ROWS = new Set([12, 13, 14, 15]);
  const fillRows = T.map((l, i) => (l.includes('#') ? i : -1)).filter(i => i >= 0).reverse();
  const FULL = 10;
  const WAVE = ['~', '^', '~', '-'];

  let level = FULL;
  let tick = 0;
  let sips = 0;
  let refilling = false;
  let bubbles = [];

  const interior = r => {
    const a = T[r].indexOf('#');
    return [a, T[r].lastIndexOf('#')];
  };

  function render() {
    const surfaceRow = level > 0 ? fillRows[level - 1] : -1;
    const filled = new Set(fillRows.slice(0, level));
    const bubbleAt = new Map(bubbles.map(b => [fillRows[b.k] + ':' + b.x, b]));
    let html = '';
    T.forEach((line, r) => {
      for (let x = 0; x < line.length; x++) {
        const ch = line[x];
        if (ch === '#') {
          if (!filled.has(r)) html += ' ';
          else if (r === surfaceRow) html += '<span class="s">' + WAVE[(x + tick) % WAVE.length] + '</span>';
          else if (bubbleAt.has(r + ':' + x)) html += '<span class="b">' + (bubbleAt.get(r + ':' + x).k > 3 ? '°' : 'o') + '</span>';
          else html += '<span class="l">:</span>';
        } else if (LABEL_ROWS.has(r) && /[A-Z0-9%]/.test(ch)) {
          html += '<span class="t">' + ch + '</span>';
        } else {
          html += ch;
        }
      }
      html += '\n';
    });
    pre.innerHTML = html.replace(/\n$/, '');
  }

  function step() {
    tick++;
    if (tick % 2 === 0) {
      bubbles.forEach(b => {
        b.k++;
        const [a, z] = interior(fillRows[b.k] ?? fillRows[0]);
        b.x = Math.min(z, Math.max(a, b.x + (Math.random() < .3 ? (Math.random() < .5 ? -1 : 1) : 0)));
      });
      bubbles = bubbles.filter(b => b.k < level - 1);
      if (level > 2 && Math.random() < .45) {
        const [a, z] = interior(fillRows[0]);
        bubbles.push({ x: a + Math.floor(Math.random() * (z - a + 1)), k: 0 });
      }
    }
    render();
  }

  const lines = [
    '*sip* smooth.',
    'another? bold.',
    'okay, easy now.',
    'the room is spinning (in ASCII).',
    'maybe go play Dead Ringer instead.',
  ];

  function popText(text) {
    const r = btn.getBoundingClientRect();
    const el = document.createElement('span');
    el.className = 'sip-pop';
    el.textContent = text;
    el.style.left = (r.left + r.width * .3) + 'px';
    el.style.top = (r.top + r.height * .1) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1100);
  }

  btn.addEventListener('click', () => {
    if (refilling) return;
    level = Math.max(0, level - 1);
    sips++;
    popText('*sip*');
    if (level === 0) {
      refilling = true;
      status.textContent = 'empty. refilling…';
      const fill = setInterval(() => {
        level++;
        if (reduceMotion) render();
        if (level >= FULL) {
          clearInterval(fill);
          refilling = false;
          status.textContent = 'freshly refilled. pace yourself.';
        }
      }, 220);
    } else {
      status.textContent = lines[Math.min(sips, lines.length) - 1];
    }
    render();
  });

  render();
  if (reduceMotion) return;

  let timer = null;
  const start = () => { if (!timer) timer = setInterval(step, 170); };
  const stop = () => { clearInterval(timer); timer = null; };
  new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(pre);
})();

(function meter() {
  const liquid = document.getElementById('meter-liquid');
  const pct = document.getElementById('meter-pct');
  if (!liquid) return;
  const TOP = 92, BOTTOM = 254;
  let queued = false;
  function update() {
    queued = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    liquid.setAttribute('y', (TOP + p * (BOTTOM - TOP)).toFixed(1));
    pct.textContent = Math.round((1 - p) * 100);
  }
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
})();

(function clock() {
  const t = document.getElementById('clock');
  const icon = document.getElementById('clock-icon');
  const quip = document.getElementById('clock-quip');
  if (!t) return;
  function update() {
    const d = new Date();
    const h = d.getHours();
    t.textContent = String(h).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    icon.textContent = h >= 6 && h < 18 ? '☀' : '☾';
    quip.textContent = h < 6 ? 'still up?' : h < 12 ? 'morning, detective' : h < 18 ? 'afternoon shift' : 'evening pour';
  }
  update();
  setInterval(update, 30000);
})();

(function activeNav() {
  const links = [...document.querySelectorAll('.nav a')];
  const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => a.classList.remove('is-active'));
      map.get(e.target.id)?.classList.add('is-active');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main section[id]').forEach(s => io.observe(s));
})();

(function reveal() {
  const items = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  items.forEach(el => io.observe(el));
})();

(function lightbox() {
  const dlg = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  const cap = document.getElementById('lightbox-cap');
  if (!dlg || typeof dlg.showModal !== 'function') return;
  document.querySelectorAll('.shot-open').forEach(b => {
    b.addEventListener('click', () => {
      img.src = b.dataset.full;
      img.alt = b.querySelector('img')?.alt || '';
      cap.textContent = b.dataset.caption || '';
      dlg.showModal();
    });
  });
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
})();
