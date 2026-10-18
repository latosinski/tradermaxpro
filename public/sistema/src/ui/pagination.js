/* ═══════════════════════════════════════════════════════════════
   Planix TraderMax · src/ui/pagination.js
   ───────────────────────────────────────────────────────────────
   Paginação genérica para tabelas.

   - Calcula total de páginas a partir de ITEMS_PER_PAGE.
   - Fatiar arrays para a página corrente.
   - Produz HTML dos controles (com data-action="page-change").
   - Escuta cliques globais e chama state.setCurrentPage.

   Modo de impressão (printMode):
   - Quando ativo, `slice()` devolve TODAS as linhas e
     `buildHTML()` devolve string vazia.
   - Usado por export/pdf.js antes de window.print().
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
    'use strict';

    const constants = () => global.Planis.constants;
    const state     = () => global.Planis.state;

    let printMode = false;

    function setPrintMode(on) {
        printMode = !!on;
    }

    function isPrintMode() {
        return printMode;
    }

    function totalPages(totalItems) {
        const perPage = constants().ITEMS_PER_PAGE;
        if (!Number.isFinite(totalItems) || totalItems <= 0) return 1;
        return Math.max(1, Math.ceil(totalItems / perPage));
    }

    function slice(items, page) {
        if (printMode) return items.slice();
        const perPage = constants().ITEMS_PER_PAGE;
        const start = (Math.max(1, page) - 1) * perPage;
        return items.slice(start, start + perPage);
    }

    function buildHTML(totalItems, currentPage) {
        if (printMode) return '';

        const total = totalPages(totalItems);
        if (total <= 1) return '';

        const p = Math.min(Math.max(1, currentPage), total);
        const prevDisabled = p <= 1 ? ' disabled' : '';
        const nextDisabled = p >= total ? ' disabled' : '';

        return [
            '<div class="pagination">',
            '  <button class="page-btn" type="button" title="Primeira"' + prevDisabled,
            '          data-action="page-change" data-page="1">',
            '    <i class="fas fa-angle-double-left"></i>',
            '  </button>',
            '  <button class="page-btn" type="button" title="Anterior"' + prevDisabled,
            '          data-action="page-change" data-page="' + (p - 1) + '">',
            '    <i class="fas fa-angle-left"></i>',
            '  </button>',
            '  <span class="page-btn" style="cursor:default; min-width:auto; padding:0 0.75rem;">',
            '    Página ' + p + ' de ' + total,
            '  </span>',
            '  <button class="page-btn" type="button" title="Próxima"' + nextDisabled,
            '          data-action="page-change" data-page="' + (p + 1) + '">',
            '    <i class="fas fa-angle-right"></i>',
            '  </button>',
            '  <button class="page-btn" type="button" title="Última"' + nextDisabled,
            '          data-action="page-change" data-page="' + total + '">',
            '    <i class="fas fa-angle-double-right"></i>',
            '  </button>',
            '</div>'
        ].join('');
    }

    function init() {
        document.addEventListener('click', function (e) {
            const el = e.target.closest('[data-action="page-change"]');
            if (!el) return;
            if (el.disabled) return;
            const page = parseInt(el.dataset.page, 10);
            if (!Number.isFinite(page) || page < 1) return;
            state().setCurrentPage(page);
        });
    }

    global.Planis = global.Planis || {};
    global.Planis.pagination = {
        init,
        totalPages,
        slice,
        buildHTML,
        setPrintMode,
        isPrintMode
    };
})(window);