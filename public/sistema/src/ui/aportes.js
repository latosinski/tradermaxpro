/* ═══════════════════════════════════════════════════════════════
   Planix TraderMax · src/ui/aportes.js
   ───────────────────────────────────────────────────────────────
   Renderiza a view "Aportes":

     - Formulário inline: Data + Valor + botão Adicionar.
     - Tabela com todos os aportes do ano corrente.
     - Ações de linha (editar / excluir) delegadas ao ui/modals.js.

   Fluxo:
     state + store  →  HTML  →  container.innerHTML
     submit do form →  store.addAporte  →  store:changed  →  re-render

   Depende de: state, store, format.
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
    'use strict';

    const state  = () => global.Planis.state;
    const store  = () => global.Planis.store;
    const format = () => global.Planis.format;

    /* ─── Tabela ─────────────────────────────────────────────── */
    function buildTable(aportes) {
        if (!aportes.length) {
            return [
                '<tr><td colspan="3" class="table-empty">',
                '  <i class="fas fa-inbox"></i>',
                '  Nenhum aporte cadastrado em ' + state().get('viewingYear'),
                '</td></tr>'
            ].join('');
        }

        return aportes.map(function (a) {
            return [
                '<tr>',
                '  <td>' + format().formatISODate(a.data) + '</td>',
                '  <td>' + format().fmt(a.amountCents) + '</td>',
                '  <td class="cell-actions">',
                '    <button class="btn-ghost edit" type="button" title="Editar"',
                '            data-action="aporte-edit" data-id="' + a.id + '">',
                '      <i class="fas fa-edit"></i>',
                '    </button>',
                '    <button class="btn-ghost delete" type="button" title="Excluir"',
                '            data-action="aporte-delete" data-id="' + a.id + '">',
                '      <i class="fas fa-trash-alt"></i>',
                '    </button>',
                '  </td>',
                '</tr>'
            ].join('');
        }).join('');
    }

    /* ─── Cabeçalho do painel de listagem ───────────────────── */
    function buildSummary(aportes) {
        const year = state().get('viewingYear');
        const n = aportes.length;
        const totalCents = aportes.reduce(function (s, a) { return s + a.amountCents; }, 0);
        const nLabel = n + ' aporte' + (n === 1 ? '' : 's');
        return {
            title: 'Aportes de ' + year,
            summary: nLabel + ' · Total: ' + format().fmt(totalCents)
        };
    }

    /* ─── Render ─────────────────────────────────────────────── */
    function render(container) {
        const year = state().get('viewingYear');
        const aportes = store().getAllAportes(year);
        const info = buildSummary(aportes);

        container.innerHTML = [
            /* Painel: formulário inline de adição */
            '<div class="panel" style="margin-bottom:1.5rem;">',
            '  <div class="panel-header">',
            '    <div class="panel-title">Adicionar Aporte</div>',
            '  </div>',
            '  <div class="panel-body">',
            '    <form data-form="aporte-new" class="form-row-3">',
            '      <div class="form-group">',
            '        <label for="aporteNewData">Data *</label>',
            '        <input type="date" id="aporteNewData" required value="' + format().todayISO() + '">',
            '      </div>',
            '      <div class="form-group">',
            '        <label for="aporteNewValor">Valor (R$) *</label>',
            '        <input type="number" id="aporteNewValor" step="0.01" min="0.01" required placeholder="0,00">',
            '      </div>',
            '      <div class="form-group">',
            '        <label aria-hidden="true">&nbsp;</label>',
            '        <button type="submit" class="btn btn-primary" style="width:100%;">',
            '          <i class="fas fa-plus"></i> Adicionar',
            '        </button>',
            '      </div>',
            '    </form>',
            '  </div>',
            '</div>',

            /* Painel: listagem do ano */
            '<div class="panel">',
            '  <div class="panel-header">',
            '    <div class="panel-title">' + info.title + '</div>',
            '    <div style="font-size:0.8rem; color:var(--text-muted);">' + info.summary + '</div>',
            '  </div>',
            '  <div class="table-responsive">',
            '    <table class="data-table">',
            '      <thead><tr>',
            '        <th>Data</th>',
            '        <th>Valor</th>',
            '        <th class="cell-actions">Ações</th>',
            '      </tr></thead>',
            '      <tbody>' + buildTable(aportes) + '</tbody>',
            '    </table>',
            '  </div>',
            '</div>'
        ].join('');
    }

    /* ─── Submit do formulário inline ────────────────────────── */
    function handleSubmit(e) {
        const form = e.target.closest('[data-form="aporte-new"]');
        if (!form) return;
        e.preventDefault();

        const data = (document.getElementById('aporteNewData') || {}).value;
        const valorRaw = (document.getElementById('aporteNewValor') || {}).value;

        if (!data) {
            alert('Informe a data do aporte.');
            return;
        }
        const cents = format().toCents(valorRaw);
        if (cents <= 0) {
            alert('O valor do aporte deve ser maior que zero.');
            return;
        }

        store().addAporte({ data: data, amountCents: cents });
        /* O store dispara store:changed → main.js re-renderiza a view */
    }

    /* ─── Inicialização ─────────────────────────────────────── */
    function init() {
        document.addEventListener('submit', handleSubmit);
    }

    global.Planis = global.Planis || {};
    global.Planis.aportes = {
        init,
        render
    };
})(window);