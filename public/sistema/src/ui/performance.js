/* ═══════════════════════════════════════════════════════════════
   Planix TraderMax · src/ui/performance.js
   ───────────────────────────────────────────────────────────────
   Renderiza a view "Performance":

     - Grid de 10 KPIs (taxa de acerto, payoff, expectativa,
       drawdown máximo, sequências, melhor/pior dia, melhor/pior mês).
     - Dois gráficos (equity + resultado mensal).
     - 4 cartões explicativos dos conceitos.

   Fluxo:
     state + store  →  filtro  →  metrics.calcular
                    →  HTML  →  container.innerHTML
                    →  charts.renderPerformanceCharts

   Depende de: state, store, format, metrics, charts.
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
    'use strict';

    const state    = () => global.Planis.state;
    const store    = () => global.Planis.store;
    const format   = () => global.Planis.format;
    const metrics  = () => global.Planis.metrics;
    const charts   = () => global.Planis.charts;

    /* ─── Filtro de operações ────────────────────────────────── */
    /* Mesma regra do dashboard: respeita mês ativo e filtros de
       data. Não reaproveita o módulo dashboard para evitar
       acoplamento entre views. */
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

        return ops;
    }

    /* ─── Formatadores específicos ───────────────────────────── */
    function fmtPayoff(v) {
        if (v === Infinity) return '∞';
        if (!Number.isFinite(v)) return '—';
        return v.toFixed(2);
    }

    function fmtPct(v) {
        if (!Number.isFinite(v)) return '—';
        return v.toFixed(2) + '%';
    }

    function fmtSeq(v) {
        return String(v);
    }

    /* ─── Cartões KPI ────────────────────────────────────────── */
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

    function buildKpiCards(m) {
        const f    = format().fmt;
        const expColor = m.expectativa >= 0 ? 'green' : 'red';

        /* Melhor/pior mês: converte 'YYYY-MM' → 'MM/YYYY' para exibir */
        const melhorMes = m.melhorMes.mes
            ? format().formatMonthYear(m.melhorMes.mes)
            : '—';
        const piorMes = m.piorMes.mes
            ? format().formatMonthYear(m.piorMes.mes)
            : '—';

        const melhorDiaData = m.melhorDia.data ? format().formatISODate(m.melhorDia.data) : '—';
        const piorDiaData   = m.piorDia.data   ? format().formatISODate(m.piorDia.data)   : '—';

        return [
            kpiCard('blue',   'fa-bullseye',       'Taxa de Acerto',            fmtPct(m.taxaAcerto),
                    m.totalPos + ' de ' + m.totalOps),
            kpiCard('mint',   'fa-balance-scale',  'Payoff',                    fmtPayoff(m.payoff),
                    'Ganho médio ÷ perda média'),
            kpiCard(expColor, 'fa-chart-line',     'Expectativa Matemática',    f(Math.round(m.expectativa)),
                    'Por operação'),
            kpiCard('red',    'fa-arrow-down',     'Drawdown Máximo',           f(m.maxDrawdown)),
            kpiCard('orange', 'fa-skull',          'Máx. Seq. de Perdas',       fmtSeq(m.maxSeqPerda)),
            kpiCard('yellow', 'fa-trophy',         'Máx. Seq. de Ganhos',       fmtSeq(m.maxSeqGanho)),
            kpiCard('green',  'fa-calendar-check', 'Melhor Dia',                melhorDiaData,
                    f(m.melhorDia.lucroLiquidoCents)),
            kpiCard('red',    'fa-calendar-times', 'Pior Dia',                  piorDiaData,
                    f(m.piorDia.lucroLiquidoCents)),
            kpiCard('green',  'fa-calendar-alt',   'Melhor Mês',                melhorMes,
                    f(m.melhorMes.valorCents)),
            kpiCard('red',    'fa-calendar-alt',   'Pior Mês',                  piorMes,
                    f(m.piorMes.valorCents))
        ].join('');
    }

    /* ─── Cartões explicativos ───────────────────────────────── */
    function buildExplanations() {
        return [
            '<div class="performance-explanations">',
            '  <div class="explanation-card">',
            '    <h4>Taxa de Acerto</h4>',
            '    <p>Percentual de operações que terminaram com lucro. Uma taxa acima de 50% não garante rentabilidade se as perdas forem muito maiores que os ganhos.</p>',
            '  </div>',
            '  <div class="explanation-card">',
            '    <h4>Payoff</h4>',
            '    <p>Relação entre o ganho médio e a perda média. Um payoff maior que 1 indica que, em média, você ganha mais do que perde por operação. Ideal acima de 1,5.</p>',
            '  </div>',
            '  <div class="explanation-card">',
            '    <h4>Expectativa Matemática</h4>',
            '    <p>Lucro médio esperado por operação. Se positivo, sua estratégia tende a ser lucrativa no longo prazo; se negativo, as perdas superam os ganhos.</p>',
            '  </div>',
            '  <div class="explanation-card">',
            '    <h4>Drawdown Máximo</h4>',
            '    <p>Maior queda absoluta a partir de um pico anterior. Revela o risco de uma sequência de perdas e ajuda a dimensionar o capital necessário para suportar períodos ruins.</p>',
            '  </div>',
            '</div>'
        ].join('');
    }

    /* ─── Estado vazio ───────────────────────────────────────── */
    function renderEmpty(container) {
        container.innerHTML = [
            '<div class="panel">',
            '  <div class="panel-body">',
            '    <p class="table-empty">',
            '      <i class="fas fa-chart-area"></i>',
            '      Nenhuma operação no período para calcular métricas de performance.',
            '    </p>',
            '  </div>',
            '</div>'
        ].join('');
    }

    /* ─── Render principal ───────────────────────────────────── */
    function render(container) {
        const ops = getFilteredOps();
        const m = metrics().calcular(ops);

        if (m.empty) {
            renderEmpty(container);
            return;
        }

        container.innerHTML = [
            '<div class="cards-grid tight">',
            buildKpiCards(m),
            '</div>',

            '<div class="charts-row">',
            '  <div class="panel">',
            '    <div class="panel-header">',
            '      <div class="panel-title">Curva de Capital (Equity)</div>',
            '    </div>',
            '    <div class="panel-body"><canvas id="chartEquity"></canvas></div>',
            '  </div>',
            '  <div class="panel">',
            '    <div class="panel-header">',
            '      <div class="panel-title">Resultado Mensal</div>',
            '    </div>',
            '    <div class="panel-body"><canvas id="chartMensal"></canvas></div>',
            '  </div>',
            '</div>',

            buildExplanations()
        ].join('');

        charts().renderPerformanceCharts(ops);
    }

    global.Planis = global.Planis || {};
    global.Planis.performance = {
        render
    };
})(window);