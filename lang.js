// lang.js — shared FR/EN utility for Exam Builder teacher pages
(function () {
  'use strict';
  var KEY = 'examBuilderLang';
  var _l  = localStorage.getItem(KEY) || 'fr';
  var _s  = {};

  function _apply() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = (_s[_l] && _s[_l][el.dataset.i18n]) || (_s.en && _s.en[el.dataset.i18n]);
      if (v !== undefined) el.textContent = v;
    });
    var m = document.getElementById('langToggleMount');
    if (!m) return;
    m.innerHTML =
      '<div class="lang-pill"><button class="' + (_l === 'fr' ? 'active' : '') +
      '" onclick="Lang.set(\'fr\')">FR</button><button class="' + (_l === 'en' ? 'active' : '') +
      '" onclick="Lang.set(\'en\')">EN</button></div>';
  }

  window.Lang = {
    init: function (s) { _s = s; _apply(); },
    t:    function (k) { return (_s[_l] && _s[_l][k]) || (_s.en && _s.en[k]) || k; },
    get:  function ()  { return _l; },
    set:  function (nl) {
      _l = nl;
      localStorage.setItem(KEY, nl);
      _apply();
      document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: nl } }));
    }
  };
}());
