/* ===== SETTINGS: edit these ===== */
var OutlastSettings = {
  /* index category panel colour, keyed on category id (the number in ?c=N) */
  categoryColours: { 1: '#7d8088', 2: '#c8372d', 3: '#c9a227', 4: '#3f7c9a' },
  /* post page colour, keyed on forum id (the number in ?showforum=N) */
  forumColours: { 1: '#7d8088', 2: '#7d8088', 3: '#c8372d', 4: '#c9a227', 5: '#3f7c9a' },
  defaultColour: '#7d8088',
  /* optional art for each category card on the index, keyed on category id: { 1: 'https://...jpg' } */
  categoryArt: {},
  /* first row of the title menu; it scrolls down to the forum list */
  enterLabel: 'Enter the facility'
};
/* ===== END SETTINGS ===== */

(function () {
  var L = window.OutlastLogic, S = OutlastSettings;
  var doc = document, root = doc.documentElement;

  function el(tag, cls, html) {
    var e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (html) e.innerHTML = html;
    return e;
  }
  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return [].slice.call((ctx || doc).querySelectorAll(sel)); }

  var plain = !window.OutlastForceMotion && window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
  if (plain) root.className += ' plain';

  /* ---------- index: three numbered sections with image wipes ---------- */
  function colourCategories() {
    $$('.category').forEach(function (c) {
      var m = /cat-(\d+)/.exec(c.id || '');
      var col = m ? L.forumColour(m[1], S.categoryColours, S.defaultColour) : S.defaultColour;
      c.style.setProperty('--c', col);
      c.style.setProperty('--ct', L.tabText(col));
      var art = m && S.categoryArt[m[1]];
      if (art && /^https?:\/\//i.test(art)) c.style.setProperty('--art', 'url("' + art.replace(/"/g, '%22') + '")');
    });
  }

  /* the title-menu first screen, built from Jcink's own links so guests and members both work */
  function buildHero() {
    var links = $$('#submenu a, #userlinks a').map(function (a) { return { text: a.textContent, href: a.getAttribute('href') || '' }; });
    var items = L.menuItems(links);
    var name = L.memberName(links);
    var hero = el('section', 'hero');
    hero.id = 's1';
    var logo = $('#logo');
    if (logo) hero.appendChild(logo);
    var chip = el('div', 'hero-user', '<span>' + esc(name || 'Guest') + '</span><i></i>');
    /* a roleplay board's sub-account switcher lives in the user links as a form: keep it usable */
    var switcher = $('#userlinks select');
    if (switcher) chip.insertBefore(switcher.closest('form') || switcher, chip.firstChild);
    hero.appendChild(chip);
    var menu = el('nav', 'hero-menu', '<a class="on" href="#s2" data-enter>' + esc(S.enterLabel) + '</a>' + items.map(function (i) {
      return '<a href="' + esc(i.href) + '">' + esc(i.text) + '</a>';
    }).join(''));
    var bottom = el('div', 'hero-bottom');
    bottom.appendChild(menu);
    $$('a', menu).forEach(function (a) {
      function mark() {
        $$('a', menu).forEach(function (b) { b.className = ''; });
        a.className = 'on';
      }
      a.addEventListener('mouseover', mark);
      a.addEventListener('focus', mark);
    });
    var news = $('.newstext a');
    if (news) {
      bottom.appendChild(el('div', 'hero-feat', '<span class="hf-tab">Latest news</span><a class="hf-title" href="' + esc(news.getAttribute('href') || '#') + '">' + esc(news.textContent) + '</a>'));
    }
    hero.appendChild(bottom);
    return hero;
  }

  function initIndex() {
    var wrapper = $('#wrapper'), inner = $('#innerwrapper');
    if (!wrapper || !inner) return;
    root.className += ' is-index';

    var s1 = buildHero(), s2 = el('section'), s3 = el('section');
    s2.id = 's2'; s3.id = 's3';

    $$('.category').forEach(function (c) { s2.appendChild(c); });
    ['#boardstats', '#delcookiesrow'].forEach(function (sel) {
      var n = $(sel); if (n) s3.appendChild(n);
    });
    var aff = $('.aff', s3);
    if (aff && !aff.textContent.trim() && !aff.querySelector('a,img')) { var ap = aff.closest('.tp'); if (ap) ap.remove(); }

    var secs = [s1, s2, s3].filter(function (s) { return s.children.length > 0; });
    $('[data-enter]', s1).setAttribute('href', secs.length > 1 ? '#' + secs[1].id : '#s1');
    $('[data-enter]', s1).addEventListener('click', function (e) {
      var t = secs[1]; if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: plain ? 'auto' : 'smooth' });
    });
    function heroState() {
      var r = s1.getBoundingClientRect();
      if (r.bottom < window.innerHeight * 0.5) root.className = root.className.replace(/ ?past-hero/g, '') + ' past-hero';
      else root.className = root.className.replace(/ ?past-hero/g, '');
    }
    window.addEventListener('scroll', heroState, { passive: true });
    window.addEventListener('resize', heroState);
    setTimeout(heroState, 0); /* after the sections are in the page */
    secs.forEach(function (s) { wrapper.insertBefore(s, inner); });

    var bgs = secs.map(function (s, i) {
      var b = el('div', 'bg bg-' + (i + 1), '<i></i>');
      if (plain) s.insertBefore(b, s.firstChild); else doc.body.appendChild(b);
      return b;
    });
    var edge = el('div', ''); edge.id = 'edge';
    doc.body.appendChild(edge);
    if (plain) return;

    function place() {
      var vh = window.innerHeight, edgeY = null;
      for (var i = 1; i < secs.length; i++) {
        var p = L.wipeProgress(secs[i].getBoundingClientRect().top, vh);
        bgs[i].style.clipPath = 'inset(' + ((1 - p) * 100) + '% 0 0 0)';
        if (p > 0 && p < 1) edgeY = (1 - p) * vh;
      }
      if (edgeY === null) edge.style.display = 'none';
      else { edge.style.display = 'block'; edge.style.top = (edgeY - 2) + 'px'; }
    }
    window.addEventListener('scroll', place, { passive: true });
    window.addEventListener('resize', place);
    place();
  }

  /* ---------- author panel: badges, links, forum colour ---------- */
  var FIELDS = ['age', 'pronouns', 'faction', 'badges', 'profile', 'tracker',
    'link1Label', 'link1Url', 'link2Label', 'link2Url', 'link3Label', 'link3Url', 'link4Label', 'link4Url'];
  var esc = L.escapeHtml;

  /* the post template already shows the member's name; show it once, on the torn tab */
  function moveName(sub) {
    var tab = $('.s-name', sub), node = sub.parentNode, orig = null;
    for (var i = 0; node && i < 5 && !orig; i++, node = node.parentNode) {
      orig = $$('.normalname,.unreg', node).filter(function (n) { return !sub.contains(n); })[0] || null;
    }
    if (!tab) return;
    if (!orig) { tab.remove(); return; }
    tab.innerHTML = orig.innerHTML;
    orig.className += ' normalname-moved';
  }

  /* shared by the author panel and the profile page: read the hidden field spans, fill the blanks */
  function readFields(ctx) {
    var raw = {};
    FIELDS.forEach(function (f) { var n = $('.f-' + f, ctx); raw[f] = n ? n.textContent : ''; });
    return raw;
  }
  function fillIn(ctx, sel, html) {
    var n = $(sel, ctx);
    if (!n) return;
    if (html) n.innerHTML = html; else n.remove();
  }
  function ageOf(raw) {
    var a = L.subjectModel({ pronouns: raw.age }).pronouns;
    return a && a !== '0' ? a : '';
  }
  function badgeImgs(badges) {
    return badges.map(function (b) {
      return '<img src="' + esc(b.img) + '" alt="' + esc(b.name) + '" title="' + esc(b.tip || b.name) + '" data-tip="' + esc((b.tip || b.name).toUpperCase()) + '">';
    }).join('');
  }
  function linkItems(links) {
    return links.map(function (l) {
      return '<li><a href="' + esc(l.url) + '" rel="nofollow noopener" target="_blank">' + esc(l.label) + '</a></li>';
    }).join('');
  }

  function renderSubject(sub) {
    var raw = readFields(sub), m = L.subjectModel(raw), age = ageOf(raw);
    moveName(sub);
    fillIn(sub, '.s-age', age ? '<span>Age</span>' + esc(age) : '');
    fillIn(sub, '.s-pron', m.pronouns ? '<span>Pronouns</span>' + esc(m.pronouns) : '');
    fillIn(sub, '.s-faction', m.faction ? esc(m.faction) : '');
    fillIn(sub, '.s-badges', badgeImgs(m.badges));
    var warn = $('.s-warn', sub);
    if (warn && !warn.textContent.trim() && !warn.querySelector('img')) warn.remove();
    fillIn(sub, '.s-links', linkItems(m.links));
  }

  function renderProfile(p) {
    var raw = readFields(p), m = L.subjectModel(raw), age = ageOf(raw);
    fillIn(p, '.pf-age', age ? '<span>Age</span>' + esc(age) : '');
    fillIn(p, '.pf-pron', m.pronouns ? '<span>Pronouns</span>' + esc(m.pronouns) : '');
    fillIn(p, '.pf-faction', m.faction ? esc(m.faction) : '');
    fillIn(p, '.pf-badges', badgeImgs(m.badges));
    fillIn(p, '.pf-links', linkItems(m.links));
  }

  function initSubjects() {
    $$('.subject').forEach(renderSubject);
    $$('.profile').forEach(renderProfile);
  }

  function applyForumColour() {
    var a = $$('#navstrip a[href*="showforum="]').pop();
    var m = /[?&]showforum=(\d+)/.exec(location.search) || (a && /showforum=(\d+)/.exec(a.getAttribute('href')));
    if (!m) return;
    var col = L.forumColour(m[1], S.forumColours, S.defaultColour);
    $$('.borderwrap,.tableborder,.folder-page').forEach(function (b) {
      b.style.setProperty('--c', col);
      b.style.setProperty('--ct', L.tabText(col));
    });
  }

  /* ---------- circle cursor with tooltip label ---------- */
  function initCursor() {
    if (plain || (!window.OutlastForceMotion && window.matchMedia && matchMedia('(hover:none)').matches)) return;
    root.className += ' has-cursor';
    $$('.s-badges img,.pf-badges img').forEach(function (i) { i.removeAttribute('title'); });
    var cur = el('div', 'cur', '<span></span>'), label = cur.firstChild;
    doc.body.appendChild(cur);
    var x = window.innerWidth / 2, y = window.innerHeight / 2, cx = x, cy = y;
    doc.addEventListener('mousemove', function (e) { x = e.clientX; y = e.clientY; });
    (function loop() {
      cx += (x - cx) * 0.22; cy += (y - cy) * 0.22;
      cur.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
      requestAnimationFrame(loop);
    })();
    doc.addEventListener('mouseover', function (e) {
      var t = e.target.closest ? e.target.closest('input,textarea,select,[data-tip],a,.button-large,.button-small') : null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) {
        root.className = root.className.replace(/ ?cur-native/g, '') + ' cur-native';
        cur.className = 'cur';
        return;
      }
      root.className = root.className.replace(/ ?cur-native/g, '');
      var tip = null;
      if (t) {
        tip = t.getAttribute('data-tip') || L.tipFor({
          tag: t.tagName, text: t.textContent, className: t.className || '',
          inForumRow: !!t.closest('.forum-row')
        });
      }
      if (tip) { label.textContent = tip; cur.className = 'cur on ' + L.tipClass(tip); }
      else cur.className = 'cur';
    });
  }

  function ready(fn) {
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', fn); else fn();
  }

  /* forums with no posts yet print "by ·" around empty tags: hide that line */
  function tidyForumRows() {
    $$('.fr-last').forEach(function (f) {
      if (!f.querySelector('a')) f.className += ' fr-empty';
    });
  }

  ready(function () {
    tidyForumRows();
    colourCategories();
    if (L.isIndex(location.search)) initIndex();
    initSubjects();
    applyForumColour();
    initCursor();
  });
})();
