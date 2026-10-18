/* ═══════════════════════════════════════════════════════════════
   Planix TraderMax · src/core/ids.js
   ───────────────────────────────────────────────────────────────
   Gerador de IDs únicos e persistentes.
   Formato: <tipo>_<n> — ex.: op_1, ap_3, sq_12.
   Os contadores ficam em localStorage para não colidirem após reload.

   Tipos convencionais usados no app:
     op  → operação
     ap  → aporte
     sq  → saque
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
    'use strict';

    const storage    = () => global.Planis.storage;
    const constants  = () => global.Planis.constants;

    const DEFAULT_COUNTERS = { op: 1, ap: 1, sq: 1 };
    let counters = null;

    function key() {
        return constants().STORAGE_KEYS.IDS;
    }

    function load() {
        if (counters) return counters;
        const saved = storage().read(key(), null);
        if (saved && typeof saved === 'object') {
            counters = Object.assign({}, DEFAULT_COUNTERS, saved);
        } else {
            counters = Object.assign({}, DEFAULT_COUNTERS);
        }
        return counters;
    }

    function persist() {
        storage().write(key(), counters);
    }

    /* Consome o próximo contador do tipo e devolve o ID. Ex.: next('op') → 'op_1'. */
    function next(type) {
        const c = load();
        if (!c[type] || !Number.isFinite(c[type])) c[type] = 1;
        const id = type + '_' + c[type];
        c[type] += 1;
        persist();
        return id;
    }

    /* Espia o próximo número sem consumir. Útil para debug. */
    function peek(type) {
        const c = load();
        return c[type] || 1;
    }

    /* Reinicia todos os contadores. Usado em testes e "apagar tudo". */
    function reset() {
        counters = Object.assign({}, DEFAULT_COUNTERS);
        persist();
    }

    global.Planis = global.Planis || {};
    global.Planis.ids = {
        next,
        peek,
        reset
    };
})(window);