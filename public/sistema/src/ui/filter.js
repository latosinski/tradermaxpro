/* ═══════════════════════════════════════════════════════════════
   Planix TraderMax · src/ui/filter.js
   ───────────────────────────────────────────────────────────────
   Barra de filtros do header:
   - Seletor de exercício (ano).
   - Campos de data (início/fim) + botões Aplicar / Limpar.
   - Modal de preferências de anos (intervalo configurável).

   Tudo sincronizado com core/state. Nunca escreve em outro lugar.

   Ações atendidas (via [data-action]):
     filter-apply       → state.setFilter
     filter-clear       → state.clearFilter
     year-preferences   → abre modal
     modal-close (modal=modalYearPrefs) → fecha modal
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
    'use strict';

    const state     = () => global.Planis.state;
    const constants = () => global.Planis.constants;

    /* ─── Elementos ─────────────────────────────────────────── */
    const $yearSelect  = () => document.getElementById('yearSelect');
    const $filterStart = () => document.getElementById('filterStart');
    const $filterEnd   = () => document.getElementById('filterEnd');

    const $prefsModal  = () => document.getElementById('modalYearPrefs');
    const $prefStart   = () => document.getElementById('prefAnoInicio');
    const $prefEnd     = () => document.getElementById('prefAnoFim');

    /* ─── Seletor de exercício ──────────────────────────────── */
    function populateYears() {
        const sel = $yearSelect();
        if (!sel) return;

        const prefs   = state().get('yearPrefs');
        const viewing = state().get('viewingYear');
        const start   = prefs.start;
        const end     = prefs.end;
        const count   = end - start + 1;

        /* Só reconstrói o DOM se a quantidade mudou. */
        if (sel.options.length !== count) {
            sel.innerHTML = '';
            for (let y = start; y <= end; y++) {
                const opt = document.createElement('option');
                opt.value = String(y);
                opt.textContent = String(y);
                sel.appendChild(opt);
            }
        }

        sel.value = String(viewing);
    }

    function onYearChange(e) {
        const y = parseInt(e.target.value, 10);
        if (Number.isFinite(y)) state().setViewingYear(y);
    }

    /* ─── Filtros de data ───────────────────────────────────── */
    function applyDateFilter() {
        const s = $filterStart() ? $filterStart().value : '';
        const e = $filterEnd()   ? $filterEnd().value   : '';
        state().setFilter(s || null, e || null);
    }

    function clearDateFilter() {
        if ($filterStart()) $filterStart().value = '';
        if ($filterEnd())   $filterEnd().value   = '';
        state().clearFilter();
    }

    /* ─── Modal de preferências de anos ─────────────────────── */
    function openPrefsModal() {
        const m = $prefsModal();
        if (!m) return;

        const prefs = state().get('yearPrefs');
        if ($prefStart()) $prefStart().value = prefs.start;
        if ($prefEnd())   $prefEnd().value   = prefs.end;

        m.classList.add('active');
    }

    function closePrefsModal() {
        const m = $prefsModal();
        if (m) m.classList.remove('active');
    }

    function submitPrefs(e) {
        e.preventDefault();

        const start = parseInt($prefStart() ? $prefStart().value : '', 10);
        const end   = parseInt($prefEnd()   ? $prefEnd().value   : '', 10);

        if (!Number.isFinite(start) || !Number.isFinite(end)) {
            alert('Preencha ambos os anos.');
            return;
        }
        if (start < 2000 || end > 2100) {
            alert('Os anos devem estar entre 2000 e 2100.');
            return;
        }
        if (start > end) {
            alert('O ano inicial não pode ser maior que o final.');
            return;
        }

        state().setYearPrefs(start, end);
        closePrefsModal();
    }

    /* ─── Reação a mudanças de state ────────────────────────── */
    function onStateChanged() {
        populateYears();
    }

    /* ─── Inicialização ─────────────────────────────────────── */
    function init() {
        /* Change no <select> de ano */
        const ys = $yearSelect();
        if (ys) ys.addEventListener('change', onYearChange);

        /* Delegação de cliques para botões da barra de filtro e modal */
        document.addEventListener('click', function (e) {
            const el = e.target.closest('[data-action]');
            if (!el) return;
            const action = el.dataset.action;

            if (action === 'filter-apply') {
                applyDateFilter();
                return;
            }
            if (action === 'filter-clear') {
                clearDateFilter();
                return;
            }
            if (action === 'year-preferences') {
                openPrefsModal();
                return;
            }
            if (action === 'modal-close' && el.dataset.modal === 'modalYearPrefs') {
                closePrefsModal();
                return;
            }
        });

        /* Submit do form de preferências */
        const form = document.querySelector('[data-form="year-prefs"]');
        if (form) form.addEventListener('submit', submitPrefs);

        /* Click no overlay fecha o modal */
        const m = $prefsModal();
        if (m) {
            m.addEventListener('click', function (e) {
                if (e.target === m) closePrefsModal();
            });
        }

        /* Estado → repopula select quando yearPrefs/viewingYear mudam */
        state().on(constants().EVENTS.STATE_CHANGED, onStateChanged);

        /* Primeira pintura */
        populateYears();
    }

    global.Planis = global.Planis || {};
    global.Planis.filter = {
        init,
        populateYears
    };
})(window);