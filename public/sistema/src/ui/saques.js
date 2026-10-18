/* ═══════════════════════════════════════════════════════════════
   Planix TraderMax · src/ui/saques.js
   ───────────────────────────────────────────────────────────────
   Renderiza a view "Saques":

     - Formulário inline: Data + Valor + botão Adicionar.
     - Tabela com todos os saques do ano corrente.
     - Ações de linha (editar / excluir) delegadas ao ui/modals.js.

   Fluxo:
     state + store  →  HTML  →  container.innerHTML
     submit do form →  store.addSaque  →  store:changed  →  re-render

   Depende de: state, store, format.
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
    'use strict';

    const state  = () => global.Planis.state;
    const store  = () => global.Planis.store;
    const format = () => global.Planis.format;

    /* ─── Tabela ─────────────────────────────────────────────── */
    function buildTable(saques) {
        if (!saques.length) {
            return [
                '<tr><td colspan="3" class="table-empty">',
                '  <i class="fas fa-inbox"></i>',
                '  Nenhum saque cadastrado em ' + state().get('viewingYear'),
                '</td></tr>'
            ].join('');
        }

        return saques.map(function (s) {
            return [
                '<tr>',
                '  <td>' + format().formatISODate(s.data) + '</td>',
                '  <td>' + format().fmt(s.amountCents) + '</td>',
                '  <td class="cell-actions">',
                '    <button class="btn-ghost edit" type="button" title="Editar"',
                '            data-action="saque-edit" data-id="' + s.id + '">',
                '      <i class="fas fa-edit"></i>',
                '    </button>',
                '    <button class="btn-ghost delete" type="button" title="Excluir"',
                '            data-action="saque-delete" data-id="' + s.id + '">',
                '      <i class="fas fa-trash-alt"></i>',
                '    </button>',
                '  </td>',
                '</tr>'
            ].join('');
        }).join('');
    }

    /* ─── Cabeçalho do painel de listagem ───────────────────── */
    function buildSummary(saques) {
        const year = state().get('viewingYear');
        const n = saques.length;
        const totalCents = saques.reduce(function (s, sq) { return s + sq.amountCents; }, 0);
        const nLabel = n + ' saque' + (n === 1 ? '' : 's');
        return {
            title: 'Saques de ' + year,
            summary: nLabel + ' · Total: ' + format().fmt(totalCents)
        };
    }

    /* ─── Render ─────────────────────────────────────────────── */
    function render(container) {
        const year = state().get('viewingYear');
        const saques = store().getAllSaques(year);
        const info = buildSummary(saques);

        container.innerHTML = [
            /* Painel: formulário inline de adição */
            '<div class="panel" style="margin-bottom:1.5rem;">',
            '  <div class="panel-header">',
            '    <div class="panel-title">Adicionar Saque</div>',
            '  </div>',
            '  <div class="panel-body">',
            '    <form data-form="saque-new" class="form-row-3">',
            '      <div class="form-group">',
            '        <label for="saqueNewData">Data *</label>',
            '        <input type="date" id="saqueNewData" required value="' + format().todayISO() + '">',
            '      </div>',
            '      <div class="form-group">',
            '        <label for="saqueNewValor">Valor (R$) *</label>',
            '        <input type="number" id="saqueNewValor" step="0.01" min="0.01" required placeholder="0,00">',
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
            '      <tbody>' + buildTable(saques) + '</tbody>',
            '    </table>',
            '  </div>',
            '</div>'
        ].join('');
    }

    /* ─── Submit do formulário inline ────────────────────────── */
    function handleSubmit(e) {
        const form = e.target.closest('[data-form="saque-new"]');
        if (!form) return;
        e.preventDefault();

        const data = (document.getElementById('saqueNewData') || {}).value;
        const valorRaw = (document.getElementById('saqueNewValor') || {}).value;

        if (!data) {
            alert('Informe a data do saque.');
            return;
        }
        const cents = format().toCents(valorRaw);
        if (cents <= 0) {
            alert('O valor do saque deve ser maior que zero.');
            return;
        }

        store().addSaque({ data: data, amountCents: cents });
    }

    /* ─── Inicialização ─────────────────────────────────────── */
    function init() {
        document.addEventListener('submit', handleSubmit);
    }

    global.Planis = global.Planis || {};
    global.Planis.saques = {
        init,
        render
    };
})(window);