/* ═══════════════════════════════════════════════════════════════
   Planix TraderMax · src/ui/theme.js
   ───────────────────────────────────────────────────────────────
   Gerencia o tema claro/escuro.

   Contrato visual (definido pelo CSS):
   - Atributo `data-theme="light" | "dark"` no elemento <html>.
   - Botão de toggle: id="themeToggle", contendo um <i>.

   Fonte de verdade: localStorage (chave planix.tradermax.theme).
   Se ausente na primeira visita, usa 'light'.
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
    'use strict';

    const storage   = () => global.Planis.storage;
    const constants = () => global.Planis.constants;

    const VALID = ['light', 'dark'];
    const DEFAULT_THEME = 'light';

    function themeKey() {
        return constants().STORAGE_KEYS.THEME;
    }

    /* Tema atual (lido do storage, com fallback). */
    function current() {
        const saved = storage().read(themeKey(), null);
        return VALID.indexOf(saved) !== -1 ? saved : DEFAULT_THEME;
    }

    /* Aplica o atributo no <html>. */
    function apply(theme) {
        if (VALID.indexOf(theme) === -1) return;
        document.documentElement.setAttribute('data-theme', theme);
    }

    /* Atualiza ícone e título do botão de toggle. */
    function updateToggleVisual(theme) {
        const btn = document.getElementById('themeToggle');
        if (!btn) return;
        const icon = btn.querySelector('i');
        if (icon) {
            icon.className = (theme === 'dark') ? 'fas fa-sun' : 'fas fa-moon';
        }
        btn.setAttribute('title', theme === 'dark' ? 'Modo claro' : 'Modo escuro');
        btn.setAttribute('aria-label', theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro');
    }

    /* Define um tema explícito. Persiste. */
    function set(theme) {
        if (VALID.indexOf(theme) === -1) return;
        storage().write(themeKey(), theme);
        apply(theme);
        updateToggleVisual(theme);
    }

    /* Alterna. */
    function toggle() {
        set(current() === 'dark' ? 'light' : 'dark');
    }

    /* Inicialização — chamada uma vez no boot. */
    function init() {
        const t = current();
        apply(t);
        updateToggleVisual(t);
    }

    global.Planis = global.Planis || {};
    global.Planis.theme = {
        init,
        set,
        toggle,
        current
    };
})(window);