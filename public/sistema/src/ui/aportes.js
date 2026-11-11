/* ═══════════════════════════════════════════════════════════════
   Planix TraderMax · src/ui/aportes.js
   ───────────────────────────────────────────────────────────────
   View "Aportes": formulário inline + tabela do ano.
   Campo de valor usa type="text" (aceita "5.000,00") com
   formatação visual ao sair (blur).
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
    'use strict';

    const state  = () => global.Planis.state;
    const store  = () => global.Planis.store;
    const format = () => global.Planis.format;

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

    function render(container) {
        const year = state().get('viewingYear');
        const aportes = store().getAllAportes(year);
        const info = buildSummary(aportes);

        container.innerHTML = [
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
            '        <input type="text" inputmode="decimal" id="aporteNewValor" required placeholder="0,00" autocomplete="off">',
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
            '      <tbody>' + buildTable(aportes) + '</tbody>',
            '    </table>',
            '  </div>',
            '</div>'
        ].join('');
    }

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
    }

    /* Formata visualmente o valor monetário ao sair do campo,
       mostrando exatamente o que o sistema vai gravar. */
    function handleBlur(e) {
        const el = e.target;
        if (!el || el.id !== 'aporteNewValor') return;
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
    global.Planis.aportes = {
        init,
        render
    };
})(window);