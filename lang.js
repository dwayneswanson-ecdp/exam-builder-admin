// lang.js — shared globe+dropdown language selector for Exam Builder
(function () {
  'use strict';
  var KEY  = 'examBuilderLang';
  var _l   = localStorage.getItem(KEY) || 'fr';
  var _s   = {};
  var _open = false;

  // Inject styles once
  var css = document.createElement('style');
  css.textContent =
    '.lang-globe{position:relative;display:inline-flex;align-items:center;}' +
    '.lang-globe-btn{display:flex;align-items:center;gap:5px;background:transparent;border:none;' +
      'cursor:pointer;color:rgba(255,255,255,0.5);font-size:0.72rem;font-weight:700;' +
      'font-family:inherit;padding:5px 8px;border-radius:6px;transition:color 0.15s;line-height:1;}' +
    '.lang-globe-btn:hover{color:rgba(255,255,255,0.9);}' +
    '.lang-globe-btn .lang-caret{transition:transform 0.15s;}' +
    '.lang-globe-btn.open .lang-caret{transform:rotate(180deg);}' +
    '.lang-dropdown{position:absolute;right:0;top:calc(100% + 6px);' +
      'background:#1e293b;border:1px solid rgba(255,255,255,0.08);' +
      'border-radius:9px;overflow:hidden;min-width:136px;' +
      'box-shadow:0 8px 28px rgba(0,0,0,0.35);z-index:500;}' +
    '.lang-dropdown button{display:flex;align-items:center;justify-content:space-between;' +
      'width:100%;padding:10px 14px;background:transparent;border:none;' +
      'color:rgba(255,255,255,0.55);font-size:0.82rem;font-weight:500;' +
      'font-family:inherit;cursor:pointer;text-align:left;transition:all 0.12s;}' +
    '.lang-dropdown button:hover{background:rgba(255,255,255,0.06);color:#fff;}' +
    '.lang-dropdown button.lang-active{color:#fff;font-weight:700;}' +
    '.lang-check{font-size:0.7rem;opacity:0;}' +
    '.lang-dropdown button.lang-active .lang-check{opacity:1;}';
  document.head.appendChild(css);

  var GLOBE_SVG =
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
      '<circle cx="12" cy="12" r="10"/>' +
      '<line x1="2" y1="12" x2="22" y2="12"/>' +
      '<path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>' +
    '</svg>';

  var CARET_SVG =
    '<svg class="lang-caret" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">' +
      '<polyline points="6 9 12 15 18 9"/>' +
    '</svg>';

  function _render() {
    var m = document.getElementById('langToggleMount');
    if (!m) return;
    var drop = _open
      ? '<div class="lang-dropdown" id="langDrop">' +
          '<button class="' + (_l === 'fr' ? 'lang-active' : '') + '" onclick="Lang.set(\'fr\')">' +
            'Français <span class="lang-check">✓</span>' +
          '</button>' +
          '<button class="' + (_l === 'en' ? 'lang-active' : '') + '" onclick="Lang.set(\'en\')">' +
            'English <span class="lang-check">✓</span>' +
          '</button>' +
        '</div>'
      : '';
    m.innerHTML =
      '<div class="lang-globe" id="langGlobe">' +
        '<button class="lang-globe-btn' + (_open ? ' open' : '') + '" onclick="Lang._toggle()" aria-label="Language">' +
          GLOBE_SVG + '<span>' + _l.toUpperCase() + '</span>' + CARET_SVG +
        '</button>' +
        drop +
      '</div>';
  }

  function _apply() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = (_s[_l] && _s[_l][el.dataset.i18n]) || (_s.en && _s.en[el.dataset.i18n]);
      if (v !== undefined) el.textContent = v;
    });
    _render();
  }

  // Close on outside click
  document.addEventListener('click', function (e) {
    if (_open && !e.target.closest('#langGlobe')) {
      _open = false;
      _render();
    }
  });

  window.Lang = {
    init:    function (s)  { _s = s; _apply(); },
    t:       function (k)  { return (_s[_l] && _s[_l][k]) || (_s.en && _s.en[k]) || k; },
    get:     function ()   { return _l; },
    set:     function (nl) {
      _l = nl; _open = false;
      localStorage.setItem(KEY, nl);
      _apply();
      document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: nl } }));
    },
    _toggle: function ()   { _open = !_open; _render(); }
  };
}());
