(function (root) {
  var L = {};
  var HTTP = /^https?:\/\//i;

  L.escapeHtml = function (s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  L.parseBadges = function (raw) {
    var out = [];
    String(raw || '').split(';').forEach(function (entry) {
      var p = entry.split('|');
      if (p.length < 2) return;
      var name = p[0].trim(), img = p[1].trim(), tip = p.slice(2).join('|').trim();
      if (!name || !HTTP.test(img)) return;
      out.push({ name: name, img: img, tip: tip });
    });
    return out;
  };

  L.buildLinks = function (f) {
    var out = [];
    function add(label, url) {
      url = String(url || '').trim();
      if (!HTTP.test(url)) return;
      out.push({ label: label, url: url });
    }
    add('Character profile', f.profile);
    add('Plot tracker', f.tracker);
    (f.custom || []).slice(0, 4).forEach(function (c) {
      var url = String(c.url || '').trim();
      if (!HTTP.test(url)) return;
      var label = String(c.label || '').trim();
      if (!label) { try { label = new URL(url).hostname; } catch (e) { label = url; } }
      add(label, url);
    });
    return out.slice(0, 6);
  };

  L.forumColour = function (id, table, fallback) {
    var k = String(id);
    return Object.prototype.hasOwnProperty.call(table || {}, k) ? table[k] : fallback;
  };

  L.wipeProgress = function (top, vh) {
    var p = (vh - top) / vh;
    return p < 0 ? 0 : p > 1 ? 1 : p;
  };

  var IGNORED = { s: 1, uts: 1, auth_key: 1, setskin: 1 };
  L.isIndex = function (search) {
    var q = String(search || '').replace(/^\?/, '');
    if (!q) return true;
    var keys = {};
    q.split('&').forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf('='), k = i < 0 ? kv : kv.slice(0, i), v = i < 0 ? '' : kv.slice(i + 1);
      if (!IGNORED[k]) keys[k] = v;
    });
    var names = Object.keys(keys);
    if (!names.length) return true;
    return names.length === 1 && names[0] === 'act' && keys.act === 'idx';
  };

  function lum(hex) {
    var c = [1, 3, 5].map(function (i) { return parseInt(hex.substr(i, 2), 16) / 255; })
      .map(function (v) { return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  L.tabText = function (bg) {
    var l = lum(bg);
    var dark = (l + 0.05) / (lum('#111111') + 0.05), light = (1.05) / (l + 0.05);
    return dark >= light ? '#111111' : '#ffffff';
  };

  L.tipFor = function (e) {
    if (/^(input|textarea|select)$/i.test(e.tag)) return null;
    var text = String(e.text || '').trim();
    if (/^a$/i.test(e.tag) && e.inForumRow) return 'OPEN FILE';
    if (/button-(large|small)/.test(e.className || '')) return text ? text.toUpperCase() : null;
    if (/^a$/i.test(e.tag)) return text && text.length <= 16 ? text.toUpperCase() : 'OPEN';
    return null;
  };

  function clean(v) {
    v = String(v == null ? '' : v).trim();
    return !v || /^no information$/i.test(v) ? '' : v;
  }
  L.subjectModel = function (raw) {
    var r = {};
    Object.keys(raw || {}).forEach(function (k) { r[k] = clean(raw[k]); });
    var custom = [1, 2, 3, 4].map(function (i) { return { label: r['link' + i + 'Label'], url: r['link' + i + 'Url'] }; });
    return {
      pronouns: r.pronouns || null,
      faction: r.faction || null,
      badges: L.parseBadges(r.badges),
      links: L.buildLinks({ profile: r.profile, tracker: r.tracker, custom: custom })
    };
  };

  /* title-menu entries built from Jcink's own links: cleaned, real, once each, in order */
  L.menuItems = function (links) {
    var seen = {}, out = [];
    (links || []).forEach(function (l) {
      var text = String(l.text || '').replace(/\s+/g, ' ').trim(), href = String(l.href || '').trim();
      if (!text || !href || href === '#' || /^javascript:/i.test(href) || seen[href]) return;
      if (/showuser=\d+/.test(href)) return;
      if (/^(https?:\/\/[^\/]+\/)?(index\.(php|html))?\??(&?(act=idx|s=[0-9a-f]+|uts=\d+))*&?$/.test(href)) return;
      seen[href] = 1;
      out.push({ text: text, href: href });
    });
    return out;
  };
  L.memberName = function (links) {
    for (var i = 0; i < (links || []).length; i++) {
      if (/showuser=\d+/.test(links[i].href || '') && String(links[i].text || '').trim()) return String(links[i].text).trim();
    }
    return null;
  };

  L.tipClass =function (tip) { return String(tip || '').length > 9 ? 'long' : ''; };

  root.OutlastLogic = L;
  if (typeof module !== 'undefined') module.exports = L;
})(typeof window !== 'undefined' ? window : globalThis);
