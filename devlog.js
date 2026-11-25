(function tagFilter() {
  var tag = new URLSearchParams(location.search).get('tag');
  var rows = document.querySelectorAll('.entries li[data-tags]');
  if (!tag || !rows.length) return;
  var shown = 0;
  rows.forEach(function (li) {
    var match = li.dataset.tags.split(' ').indexOf(tag) > -1;
    li.hidden = !match;
    if (match) shown++;
  });
  document.querySelectorAll('.tagbar a').forEach(function (a) {
    a.setAttribute('aria-current', a.getAttribute('href').indexOf('tag=' + tag) > -1 ? 'true' : 'false');
  });
  var empty = document.querySelector('.empty');
  if (empty && !shown) empty.hidden = false;
})();
