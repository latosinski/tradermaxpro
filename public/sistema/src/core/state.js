/* ═══════════════════════════════════════════════════════════════
   Planix TraderMax · src/core/state.js
   ───────────────────────────────────────────────────────────────
   Estado global de UI (não confundir com store de dados).

   Guarda "onde estamos olhando": ano visível, mês, view atual,
   filtros de data, página corrente, preferências de intervalo de anos.

   Regras:
   - Nunca é mutado por fora. Toda alteração passa por um setter.
   - Todo setter emite 'state:changed' com a lista de chaves alteradas.
   - Qualquer módulo pode se inscrever com `on(event, handler)`.
   - Setters idempotentes: não notificam se nada mudou.

   Semântica de navegação:
   - setCurrentView(view)  → muda view. Mês sempre volta para 'all'.
   - setCurrentMonth(m)    → muda mês. Se view ≠ dashboard, muda
                             para dashboard automaticamente.
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
    'use strict';

    const constants = () => global.Planis.constants;
    const storage   = () => global.Planis.storage;

    /* ─── Estado ─────────────────────────────────────────────── */
    const NOW = new Date();
    const state = {
        viewingYear:  NOW.getFullYear(),
        currentMonth: 'all',              /* 'all' ou 0..11               */
        currentView:  'dashboard',        /* VIEWS.*                       */
        filterStart:  null,               /* ISO 'YYYY-MM-DD' ou null     */
        filterEnd:    null,               /* ISO 'YYYY-MM-DD' ou null     */
        currentPage:  1,
        yearPrefs: {
            start: NOW.getFullYear(),
            end:   NOW.getFullYear() + 5
        }
    };

    /* ─── Pub/sub ────────────────────────────────────────────── */
    const listeners = {};

    function on(event, handler) {
        if (typeof handler !== 'function') return () => {};
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(handler);
        return () => off(event, handler);
    }

    function off(event, handler) {
        if (!listeners[event]) return;
        listeners[event] = listeners[event].filter(h => h !== handler);
    }

    function emit(event, payload) {
        const subs = listeners[event];
        if (!subs || subs.length === 0) return;
        subs.slice().forEach(h => {
            try {
                h(payload);
            } catch (e) {
                console.error('[state] erro em listener de "' + event + '":', e);
            }
        });
    }

    function notify(changes) {
        emit(constants().EVENTS.STATE_CHANGED, { changes });
    }

    /* ─── Preferências de anos (persistidas) ─────────────────── */
    function loadYearPrefs() {
        const saved = storage().read(constants().STORAGE_KEYS.PREFS, null);
        if (
            saved &&
            typeof saved === 'object' &&
            Number.isFinite(saved.start) &&
            Number.isFinite(saved.end) &&
            saved.end >= saved.start
        ) {
            state.yearPrefs = { start: saved.start, end: saved.end };
        }
    }

    function saveYearPrefs() {
        storage().write(constants().STORAGE_KEYS.PREFS, state.yearPrefs);
    }

    /* ─── Inicialização ──────────────────────────────────────── */
    function init() {
        loadYearPrefs();
        if (state.viewingYear < state.yearPrefs.start) state.viewingYear = state.yearPrefs.start;
        if (state.viewingYear > state.yearPrefs.end)   state.viewingYear = state.yearPrefs.end;
    }

    /* ─── Leitura ────────────────────────────────────────────── */
    function get(key) {
        return state[key];
    }

    function getAll() {
        return Object.assign({}, state, {
            yearPrefs: Object.assign({}, state.yearPrefs)
        });
    }

    /* ─── Setters ────────────────────────────────────────────── */

    function setViewingYear(year) {
        if (!Number.isFinite(year)) return;
        if (state.viewingYear === year) return;
        state.viewingYear = year;
        state.currentPage = 1;
        notify(['viewingYear', 'currentPage']);
    }

    /**
     * Muda o mês ativo. Sempre implica view = dashboard.
     * Se a view atual não for dashboard, muda junto.
     * Só notifica o que de fato mudou.
     */
    function setCurrentMonth(month) {
        const normalized = month === 'all' ? 'all' : parseInt(month, 10);
        if (normalized !== 'all' && (isNaN(normalized) || normalized < 0 || normalized > 11)) return;

        const changes = [];

        if (state.currentView !== constants().VIEWS.DASHBOARD) {
            state.currentView = constants().VIEWS.DASHBOARD;
            changes.push('currentView');
        }

        if (state.currentMonth !== normalized) {
            state.currentMonth = normalized;
            changes.push('currentMonth');
        }

        if (state.currentPage !== 1) {
            state.currentPage = 1;
            changes.push('currentPage');
        }

        if (changes.length) notify(changes);
    }

    /**
     * Muda a view. Sempre reseta mês para 'all' e página para 1 —
     * trocar de view significa "entrar no estado inicial dela".
     * Só notifica o que de fato mudou, então clicar duas vezes no
     * mesmo item não gera re-render.
     */
    function setCurrentView(view) {
        const changes = [];

        if (state.currentView !== view) {
            state.currentView = view;
            changes.push('currentView');
        }

        if (state.currentMonth !== 'all') {
            state.currentMonth = 'all';
            changes.push('currentMonth');
        }

        if (state.currentPage !== 1) {
            state.currentPage = 1;
            changes.push('currentPage');
        }

        if (changes.length) notify(changes);
    }

    function setFilter(start, end) {
        state.filterStart = start || null;
        state.filterEnd   = end   || null;
        state.currentPage = 1;
        notify(['filterStart', 'filterEnd', 'currentPage']);
    }

    function clearFilter() {
        if (!state.filterStart && !state.filterEnd && state.currentPage === 1) return;
        state.filterStart = null;
        state.filterEnd   = null;
        state.currentPage = 1;
        notify(['filterStart', 'filterEnd', 'currentPage']);
    }

    function setCurrentPage(page) {
        if (!Number.isFinite(page) || page < 1) return;
        if (state.currentPage === page) return;
        state.currentPage = page;
        notify(['currentPage']);
    }

    function setYearPrefs(start, end) {
        if (!Number.isFinite(start) || !Number.isFinite(end)) return;
        if (start > end) return;
        state.yearPrefs = { start, end };
        if (state.viewingYear < start) state.viewingYear = start;
        if (state.viewingYear > end)   state.viewingYear = end;
        saveYearPrefs();
        notify(['yearPrefs', 'viewingYear']);
    }

    /* ─── Reset (testes / "apagar tudo") ─────────────────────── */
    function reset() {
        const y = NOW.getFullYear();
        state.viewingYear  = y;
        state.currentMonth = 'all';
        state.currentView  = 'dashboard';
        state.filterStart  = null;
        state.filterEnd    = null;
        state.currentPage  = 1;
        state.yearPrefs    = { start: y, end: y + 5 };
        saveYearPrefs();
        notify(['reset']);
    }

    /* ─── Exporta ────────────────────────────────────────────── */
    global.Planis = global.Planis || {};
    global.Planis.state = {
        init,
        get,
        getAll,
        setViewingYear,
        setCurrentMonth,
        setCurrentView,
        setFilter,
        clearFilter,
        setCurrentPage,
        setYearPrefs,
        reset,
        on,
        off,
        emit
    };
})(window);