/* ═══════════════════════════════════════════════════════════════
   Planix TraderMax · src/ui/saques.js
   ───────────────────────────────────────────────────────────────
   View "Saques": formulário inline + tabela do ano.
   Campo de valor usa type="text" (aceita "5.000,00") com
   formatação visual ao sair (blur).
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
    'use strict';

    const state  = () => global.Planis.state;
    const store  = () => global.Planis.store;
    const format = () => global.Planis.format;

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

    function render(container) {
        const year = state().get('viewingYear');
        const saques = store().getAllSaques(year);
        const info = buildSummary(saques);

        container.innerHTML = [
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
            '        <input type="text" inputmode="decimal" id="saqueNewValor" required placeholder="0,00" autocomplete="off">',
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

    /* Formata visualmente o valor monetário ao sair do campo,
       mostrando exatamente o que o sistema vai gravar. */
    function handleBlur(e) {
        const el = e.target;
        if (!el || el.id !== 'saqueNewValor') return;
        const raw = (el.value || '').trim();
        if (raw === '') return;
        const cents = format().toCents(raw);
        if (cents > 0) {
            const reais = (cents / 100).toFixed(2).replace('.', ',');
            const partes = reais.split(',');
            partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            el.value = partes.join(',');
        }
    }

    function init() {
        document.addEventListener('submit', handleSubmit);
        document.addEventListener('blur', handleBlur, true);
    }

    global.Planis = global.Planis || {};
    global.Planis.saques = {
        init,
        render
    };
})(window);