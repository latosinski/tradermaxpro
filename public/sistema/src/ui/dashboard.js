/* ═══════════════════════════════════════════════════════════════
   Planix TraderMax · src/ui/dashboard.js
   ───────────────────────────────────────────────────────────────
   Renderiza a view "Dashboard":
     - Grid de KPIs (11 cartões).
     - Dois gráficos (linha de valor líquido + pizza positivo/negativo).
     - Tabela paginada de operações (10 por página).

   Semântica mês vs ano:

   KPIs de PERÍODO — refletem apenas as operações do mês (ou ano):
     Valor Total de Negócios, Valor Bruto, Valor Líquido,
     DARF do mês, IRRF do mês, Custos Operacionais.

   KPIs de ESTADO ACUMULADO — refletem o acumulado de Jan até o
   mês selecionado:
     Capital Estimado, Total Aportado, Saque Realizado,
     Prejuízo a Compensar, Ganho de Capital.

   Em modo 'all', os dois coincidem com o total do ano.

   Paginação:
     ITEMS_PER_PAGE = 10 (definido em constants.js).
     Os controles são renderizados por pagination.buildHTML().
     Em modo de impressão (export/pdf.js), a paginação é
     desativada via setPrintMode(true) — todas as linhas saem
     no PDF.
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
    'use strict';

    const state      = () => global.Planis.state;
    const store      = () => global.Planis.store;
    const format     = () => global.Planis.format;
    const tax        = () => global.Planis.tax;
    const charts     = () => global.Planis.charts;
    const pagination = () => global.Planis.pagination;
    const constants  = () => global.Planis.constants;

    /* ─── Filtro de operações (respeita mês + filtros de data) ─ */
    function getFilteredOps() {
        const s = state().getAll();
        const year = s.viewingYear;

        let ops;
        if (s.currentMonth === 'all') {
            ops = store().getAllOps(year);
        } else {
            ops = store().getOps(year, s.currentMonth);
        }

        if (s.filterStart || s.filterEnd) {
            const startTs = s.filterStart ? new Date(s.filterStart + 'T00:00:00').getTime() : null;
            const endTs   = s.filterEnd   ? new Date(s.filterEnd   + 'T23:59:59').getTime() : null;

            ops = ops.filter(function (o) {
                const d = new Date(o.data + 'T00:00:00').getTime();
                if (startTs !== null && d < startTs) return false;
                if (endTs   !== null && d > endTs)   return false;
                return true;
            });
        }

        return ops.slice().sort(function (a, b) { return a.data.localeCompare(b.data); });
    }

    /* ─── Acumulados até o mês corrente (inclusive) ──────────── */
    function getAccumulated(untilMonth) {
        const s = state().getAll();
        const year = s.viewingYear;

        let aportes = 0;
        let liq = 0;
        let saques = 0;

        for (let m = 0; m <= untilMonth; m++) {
            store().getAportes(year, m).forEach(function (a) { aportes += a.amountCents; });
            store().getOps(year, m).forEach(function (o)     { liq     += o.lucroLiquidoCents; });
            store().getSaques(year, m).forEach(function (sq) { saques  += sq.amountCents; });
        }
        return { aportes: aportes, liq: liq, saques: saques };
    }

    /* Soma do DARF mensal de 0 até `until` (inclusive). */
    function darfAcumuladoAte(result, until) {
        if (!result || !Array.isArray(result.darfMensalCents)) return 0;
        let soma = 0;
        for (let m = 0; m <= until && m < result.darfMensalCents.length; m++) {
            soma += result.darfMensalCents[m] || 0;
        }
        return soma;
    }

    /* ─── Cartão KPI ─────────────────────────────────────────── */
    function kpiCard(color, icon, label, value, sub) {
        const subHTML = sub ? '<div class="stat-sub">' + sub + '</div>' : '';
        return [
            '<div class="stat-card ' + color + '">',
            '  <div class="stat-icon"><i class="fas ' + icon + '"></i></div>',
            '  <div class="stat-info">',
            '    <div class="stat-label">' + label + '</div>',
            '    <div class="stat-value">' + value + '</div>',
            subHTML,
            '  </div>',
            '</div>'
        ].join('');
    }

    function buildKpiCards(c) {
        const f = format().fmt;
        const liqColor = c.liqFinal >= 0 ? 'green' : 'red';
        const pctColor = c.ganhoPct >= 0 ? 'green' : 'red';

        return [
            kpiCard('blue',   'fa-chart-bar',        'Valor Total de Negócios', f(c.totalBruto)),
            kpiCard('mint',   'fa-dollar-sign',      'Valor Bruto',             f(c.liqPeriodo)),
            kpiCard(liqColor, 'fa-wallet',           'Valor Líquido',           f(c.liqFinal), c.liqSub),
            kpiCard(pctColor, 'fa-percent',          'Ganho de Capital (%)',    c.ganhoPct.toFixed(2) + '%'),
            kpiCard('purple', 'fa-file-invoice',     c.darfLabel,               f(c.darf), 'Com compensação legal'),
            kpiCard('orange', 'fa-shield-alt',       'Prejuízo a Compensar',    f(c.prejuizoCompensar), c.prejuizoSub),
            kpiCard('blue',   'fa-hand-holding-usd', 'IRRF Day Trade Retido',   f(c.irrf)),
            kpiCard('orange', 'fa-calculator',       'Custos Operacionais',     f(c.custos)),
            kpiCard('mint',   'fa-coins',            'Capital Estimado',        f(c.capitalEstimado), c.capitalSub),
            kpiCard('yellow', 'fa-donate',           'Total Aportado',          f(c.totalAportado),   c.aporteSub),
            kpiCard('red',    'fa-hand-holding-usd', 'Saque Realizado',         f(c.totalSaques),     c.saqueSub)
        ].join('');
    }

    /* ─── Tabela de operações (paginada) ─────────────────────── */
    function buildOpsTable(ops) {
        if (!ops.length) {
            return [
                '<tr><td colspan="5" class="table-empty">',
                '  <i class="fas fa-inbox"></i>',
                '  Nenhuma operação no período',
                '</td></tr>'
            ].join('');
        }

        return ops.map(function (o) {
            const badgeClass = o.resultado === 'Positivo' ? 'badge-profit' : 'badge-loss';
            return [
                '<tr>',
                '  <td>' + format().formatISODate(o.data) + '</td>',
                '  <td><span class="badge ' + badgeClass + '">' + o.resultado + '</span></td>',
                '  <td>' + format().fmt(o.lucroBrutoCents)   + '</td>',
                '  <td>' + format().fmt(o.lucroLiquidoCents) + '</td>',
                '  <td class="cell-actions">',
                '    <button class="btn-ghost edit" type="button" title="Editar"',
                '            data-action="operation-edit" data-id="' + o.id + '">',
                '      <i class="fas fa-edit"></i>',
                '    </button>',
                '    <button class="btn-ghost delete" type="button" title="Excluir"',
                '            data-action="operation-delete" data-id="' + o.id + '">',
                '      <i class="fas fa-trash-alt"></i>',
                '    </button>',
                '  </td>',
                '</tr>'
            ].join('');
        }).join('');
    }

    /* ─── Rótulo de escopo (mês vs ano) ──────────────────────── */
    function scopeLabel(month, year) {
        if (month === 'all') return 'Total do ano';
        const m = constants().MONTHS_SHORT[month];
        return 'Acumulado até ' + m + '/' + year;
    }

    /* ─── Render principal ───────────────────────────────────── */
    function render(container) {
        const s = state().getAll();
        const ops = getFilteredOps();

        const isAll = (s.currentMonth === 'all');
        const until = isAll ? 11 : s.currentMonth;
        const acc = getAccumulated(until);

        /* Cadeia fiscal completa do ano */
        const prefs = s.yearPrefs;
        const chain = tax().calcularCadeiaImpostos(
            store().getRawSnapshot(),
            prefs.start,
            prefs.end,
            0
        );
        const result = chain[s.viewingYear] || {
            darfTotalCents: 0,
            darfMensalCents: [0,0,0,0,0,0,0,0,0,0,0,0],
            prejuizoFinalCents: 0,
            prejuizoAcumuladoMensalCents: [0,0,0,0,0,0,0,0,0,0,0,0]
        };

        const darf = tax().extrairDarf(result, s.currentMonth);
        const darfAcum = isAll ? (result.darfTotalCents || 0) : darfAcumuladoAte(result, until);
        const prejuizoCompensar = tax().extrairPrejuizoAcumuladoAte(result, s.currentMonth);

        /* Totais do PERÍODO */
        const totalBruto = ops.reduce(function (sum, o) { return sum + o.lucroBrutoCents; }, 0);
        const liqPeriodo = ops.reduce(function (sum, o) { return sum + o.lucroLiquidoCents; }, 0);
        const liqFinal   = liqPeriodo - darf;

        const irrf   = tax().somarIrrf(ops);
        const custos = tax().somarCustosOperacionais(ops).total;

        /* ESTADO ACUMULADO */
        const totalAportado   = acc.aportes;
        const totalSaques     = acc.saques;
        const capitalEstimado = totalAportado + acc.liq - totalSaques - darfAcum;
        const ganhoPct        = totalAportado > 0 ? (liqFinal / totalAportado) * 100 : 0;

        /* Subtítulos */
        const subLiq     = isAll ? 'Após DARF do ano' : 'Após DARF do mês';
        const subCapital = isAll ? 'Total do ano'     : scopeLabel(s.currentMonth, s.viewingYear);
        const subAporte  = isAll ? 'Total do ano'     : scopeLabel(s.currentMonth, s.viewingYear);
        const subSaque   = isAll ? 'Total do ano'     : scopeLabel(s.currentMonth, s.viewingYear);
        const subPreju   = prejuizoCompensar > 0
            ? 'Abate os próximos lucros'
            : 'Sem prejuízo pendente';

        const darfLabel = isAll
            ? 'DARF Total do Ano (19% comp.)'
            : 'DARF do Mês (19% comp.)';

        /* Paginação */
        const totalP = pagination().totalPages(ops.length);
        let page = s.currentPage;
        if (page > totalP) page = totalP;
        const pagedOps = pagination().slice(ops, page);

        const nOps = ops.length;
        const opsLabel = nOps + ' operaç' + (nOps === 1 ? 'ão' : 'ões');

        container.innerHTML = [
            '<div class="cards-grid">',
            buildKpiCards({
                totalBruto: totalBruto,
                liqPeriodo: liqPeriodo,
                liqFinal: liqFinal,
                liqSub: subLiq,
                ganhoPct: ganhoPct,
                darf: darf,
                darfLabel: darfLabel,
                prejuizoCompensar: prejuizoCompensar,
                prejuizoSub: subPreju,
                irrf: irrf,
                custos: custos,
                capitalEstimado: capitalEstimado,
                capitalSub: subCapital,
                totalAportado: totalAportado,
                aporteSub: subAporte,
                totalSaques: totalSaques,
                saqueSub: subSaque
            }),
            '</div>',

            '<div class="charts-row">',
            '  <div class="panel">',
            '    <div class="panel-header">',
            '      <div class="panel-title">Valor Líquido por Operação</div>',
            '    </div>',
            '    <div class="panel-body"><canvas id="chartLucroLiquido"></canvas></div>',
            '  </div>',
            '  <div class="panel">',
            '    <div class="panel-header">',
            '      <div class="panel-title">Operações Positivas vs Negativas</div>',
            '    </div>',
            '    <div class="panel-body"><canvas id="chartPizzaOperacoes"></canvas></div>',
            '  </div>',
            '</div>',

            '<div class="panel">',
            '  <div class="panel-header">',
            '    <div class="panel-title">Operações do Período</div>',
            '  </div>',
            '  <div class="table-responsive">',
            '    <table class="data-table">',
            '      <thead><tr>',
            '        <th>Data</th>',
            '        <th>Resultado</th>',
            '        <th>Valor Bruto</th>',
            '        <th>Valor Líquido</th>',
            '        <th class="cell-actions">Ações</th>',
            '      </tr></thead>',
            '      <tbody>' + buildOpsTable(pagedOps) + '</tbody>',
            '    </table>',
            '  </div>',
            '  <div class="table-footer">',
            '    <span style="font-size:0.8rem; color:var(--text-muted);">' + opsLabel + '</span>',
            pagination().buildHTML(ops.length, page),
            '  </div>',
            '</div>'
        ].join('');

        charts().renderDashboardCharts(ops);
    }

    global.Planis = global.Planis || {};
    global.Planis.dashboard = {
        render
    };
})(window);