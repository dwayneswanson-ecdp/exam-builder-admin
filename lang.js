/**
 * lang.js — Shared language management for Exam Builder
 *
 * Usage on any page:
 *   1. <script src="lang.js"></script>  (before closing </body>)
 *   2. Add id="langToggleMount" where you want the globe button in the header
 *   3. Add data-i18n="key" on any element whose textContent should translate
 *   4. Add data-i18n-placeholder="key" on inputs whose placeholder should translate
 *   5. Call Lang.init(strings) with the page's i18n string object
 *   6. Listen for 'langchange' on document to re-render dynamic content:
 *        document.addEventListener('langchange', () => myRenderFn())
 *
 * The selected language persists in localStorage under 'examBuilderLang'.
 * Defaults to 'fr'.
 */

(function () {
  const STORAGE_KEY = 'examBuilderLang';

  const Lang = {
    _lang: localStorage.getItem(STORAGE_KEY) || 'fr',
    _strings: {},

    /** Current language code */
    get() { return this._lang; },

    /** Translate a key using the loaded strings */
    t(key) { return (this._strings[this._lang] || {})[key] || key; },

    /**
     * Initialise with page strings and render the toggle.
     * @param {Object} strings  — { fr: { key: value }, en: { key: value } }
     */
    init(strings) {
      this._strings = strings;
      this._injectStyles();
      this._renderToggle();
      this._applyToDOM();
      document.addEventListener('click', (e) => {
        if (!e.target.closest('#langToggleMount')) this._closeMenu();
      });
    },

    /** Set language, persist, update DOM, fire event */
    set(l) {
      this._lang = l;
      localStorage.setItem(STORAGE_KEY, l);
      this._updateToggleState();
      this._applyToDOM();
      document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: l } }));
    },

    // ── Private ──────────────────────────────────────────────────

    _injectStyles() {
      if (document.getElementById('langjs-styles')) return;
      const style = document.createElement('style');
      style.id = 'langjs-styles';
      style.textContent = `
        #langToggleMount { position: relative; }

        .lang-globe-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.75);
          padding: 6px 12px;
          border-radius: 7px;
          font-size: 0.78rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .lang-globe-btn:hover {
          background: rgba(255,255,255,0.1);
          color: #fff;
          border-color: rgba(255,255,255,0.25);
        }
        .lang-globe-btn svg { flex-shrink: 0; opacity: 0.7; }
        .lang-globe-btn .lang-chevron { transition: transform 0.15s; }
        .lang-globe-btn.open .lang-chevron { transform: rotate(180deg); }

        .lang-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          box-shadow: 0 8px 24px rgba(15,23,42,0.14);
          min-width: 160px;
          overflow: hidden;
          z-index: 999;
          display: none;
        }
        .lang-dropdown.open { display: block; }

        .lang-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          width: 100%;
          padding: 11px 16px;
          background: none;
          border: none;
          font-size: 0.85rem;
          font-weight: 600;
          color: #0f172a;
          font-family: inherit;
          cursor: pointer;
          text-align: left;
          transition: background 0.1s;
        }
        .lang-option:hover { background: #f1f5f9; }
        .lang-option .lang-option-left { display: flex; align-items: center; gap: 10px; }
        .lang-option .lang-flag { font-size: 1rem; }
        .lang-option .lang-check { color: #2563eb; font-size: 0.9rem; opacity: 0; }
        .lang-option.selected .lang-check { opacity: 1; }
        .lang-option:first-child { border-bottom: 1px solid #f1f5f9; }
      `;
      document.head.appendChild(style);
    },

    _renderToggle() {
      const mount = document.getElementById('langToggleMount');
      if (!mount) return;

      const labels = { fr: 'Français', en: 'English' };
      const flags  = { fr: '🇫🇷', en: '🇬🇧' };

      mount.innerHTML = `
        <button class="lang-globe-btn" id="langGlobeBtn" onclick="Lang._toggleMenu()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          <span id="langCurrentLabel">${labels[this._lang]}</span>
          <svg class="lang-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        <div class="lang-dropdown" id="langDropdown">
          <button class="lang-option ${this._lang === 'fr' ? 'selected' : ''}" onclick="Lang.set('fr')">
            <span class="lang-option-left"><span class="lang-flag">🇫🇷</span> Français</span>
            <span class="lang-check">✓</span>
          </button>
          <button class="lang-option ${this._lang === 'en' ? 'selected' : ''}" onclick="Lang.set('en')">
            <span class="lang-option-left"><span class="lang-flag">🇬🇧</span> English</span>
            <span class="lang-check">✓</span>
          </button>
        </div>
      `;
    },

    _toggleMenu() {
      const btn      = document.getElementById('langGlobeBtn');
      const dropdown = document.getElementById('langDropdown');
      if (!btn || !dropdown) return;
      const isOpen = dropdown.classList.contains('open');
      if (isOpen) {
        dropdown.classList.remove('open');
        btn.classList.remove('open');
      } else {
        dropdown.classList.add('open');
        btn.classList.add('open');
      }
    },

    _closeMenu() {
      const btn      = document.getElementById('langGlobeBtn');
      const dropdown = document.getElementById('langDropdown');
      if (btn)      btn.classList.remove('open');
      if (dropdown) dropdown.classList.remove('open');
    },

    _updateToggleState() {
      const labels = { fr: 'Français', en: 'English' };
      const label  = document.getElementById('langCurrentLabel');
      const opts   = document.querySelectorAll('.lang-option');
      if (label) label.textContent = labels[this._lang];
      opts.forEach(opt => {
        const isSelected = (this._lang === 'fr' && opt.textContent.includes('Français'))
                        || (this._lang === 'en' && opt.textContent.includes('English'));
        opt.classList.toggle('selected', isSelected);
      });
      this._closeMenu();
    },

    /** Apply data-i18n and data-i18n-placeholder attributes to the DOM */
    _applyToDOM() {
      const strings = this._strings[this._lang] || {};
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (strings[key] !== undefined) el.textContent = strings[key];
      });
      document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (strings[key] !== undefined) el.placeholder = strings[key];
      });
      document.querySelectorAll('[data-i18n-html]').forEach(el => {
        const key = el.getAttribute('data-i18n-html');
        if (strings[key] !== undefined) el.innerHTML = strings[key];
      });
    }
  };

  window.Lang = Lang;
})();
