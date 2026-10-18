/* ═══════════════════════════════════════════════════════════════
   Planix TraderMax · src/core/format.js
   ───────────────────────────────────────────────────────────────
   Funções puras de formatação/parsing.
   Valores monetários circulam SEMPRE como inteiros em centavos.
   Não conhece DOM. Não conhece storage. Não conhece negócio.
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
    'use strict';

    /* Converte qualquer entrada (number, "12.34", "12,34", "R$ 1.234,56")
       para inteiro em centavos. Retorna 0 em entrada inválida. */
    function toCents(value) {
        if (value === null || value === undefined || value === '') return 0;

        if (typeof value === 'number') {
            return Number.isFinite(value) ? Math.round(value * 100) : 0;
        }

        let s = String(value).trim();
        s = s.replace(/[R$\s]/g, ''); /* remove símbolo de moeda e espaços */

        /* Se tem "." E "," → formato BR: 1.234,56 */
        if (s.indexOf('.') !== -1 && s.indexOf(',') !== -1) {
            s = s.replace(/\./g, '').replace(',', '.');
        } else if (s.indexOf(',') !== -1) {
            /* Só vírgula: 12,34 */
            s = s.replace(',', '.');
        }

        const n = parseFloat(s);
        return Number.isFinite(n) ? Math.round(n * 100) : 0;
    }

    /* Centavos → número decimal (para usar em Chart.js, cálculos flutuantes). */
    function fromCents(cents) {
        if (!Number.isFinite(cents)) return 0;
        return cents / 100;
    }

    /* Centavos → string formatada em BRL: "R$ 1.234,56" / "R$ -1.234,56". */
    function fmt(cents) {
        const n = fromCents(cents);
        const fixed = n.toFixed(2).replace('.', ',');
        const withThousands = fixed.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return 'R$ ' + withThousands;
    }

    /* ISO 'YYYY-MM-DD' → 'DD/MM/YYYY'. Tolerante a entradas curtas. */
    function formatISODate(iso) {
        if (!iso) return '';
        const parts = String(iso).split('-');
        if (parts.length !== 3) return String(iso);
        return parts[2] + '/' + parts[1] + '/' + parts[0];
    }

    /* Data de hoje no formato ISO (fuso local, sem UTC shift). */
    function todayISO() {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + day;
    }

    /* 'YYYY-MM' → 'MM/YYYY'. */
    function formatMonthYear(yyyymm) {
        if (!yyyymm || typeof yyyymm !== 'string') return '';
        const parts = yyyymm.split('-');
        if (parts.length !== 2) return yyyymm;
        return parts[1] + '/' + parts[0];
    }

    global.Planis = global.Planis || {};
    global.Planis.format = {
        toCents,
        fromCents,
        fmt,
        formatISODate,
        todayISO,
        formatMonthYear
    };
})(window);