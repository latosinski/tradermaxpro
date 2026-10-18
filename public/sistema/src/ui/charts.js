/* ═══════════════════════════════════════════════════════════════
   Planix TraderMax · src/ui/charts.js
   ───────────────────────────────────────────────────────────────
   Wrapper fino sobre Chart.js.

   Responsabilidades:
   - Destruir instâncias anteriores antes de recriar (evita leaks).
   - Renderizar os 2 gráficos do Dashboard.
   - Renderizar os 2 gráficos da Performance.

   Depende de: Planis.format, Planis.metrics, Chart (global).
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
    'use strict';

    const format  = () => global.Planis.format;
    const metrics = () => global.Planis.metrics;

    /* Registro das instâncias ativas por ID de canvas. */
    const registry = {};

    function destroy(canvasId) {
        const instance = registry[canvasId];
        if (!instance) return;
        try { instance.destroy(); } catch (e) { /* ignora */ }
        delete registry[canvasId];
    }

    function destroyAll() {
        Object.keys(registry).forEach(destroy);
    }

    /* ─── Dashboard: linha do valor líquido por operação ─────── */
    function renderLineLiquido(canvasId, ops) {
        destroy(canvasId);
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const labels = ops.map(function (o) { return format().formatISODate(o.data); });
        const data   = ops.map(function (o) { return format().fromCents(o.lucroLiquidoCents); });

        registry[canvasId] = new global.Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Valor Líquido (R$)',
                    data: data,
                    borderColor: '#7FB3D5',
                    backgroundColor: 'rgba(127,179,213,0.15)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    borderWidth: 2.5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: 'rgba(127,179,213,0.12)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    /* ─── Dashboard: pizza positivo/negativo ─────────────────── */
    function renderPieOperacoes(canvasId, ops) {
        destroy(canvasId);
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const positivas = ops.filter(function (o) { return o.resultado === 'Positivo'; }).length;
        const negativas = ops.length - positivas;
        const total     = ops.length;

        registry[canvasId] = new global.Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Positivas', 'Negativas'],
                datasets: [{
                    data: [positivas, negativas],
                    backgroundColor: ['#81C784', '#EF9A9A'],
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '60%',
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const value = context.raw || 0;
                                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                                return ' ' + context.label + ': ' + value + ' (' + pct + '%)';
                            }
                        }
                    }
                }
            }
        });
    }

    function renderDashboardCharts(ops) {
        renderLineLiquido('chartLucroLiquido', ops);
        renderPieOperacoes('chartPizzaOperacoes', ops);
    }

    /* ─── Performance: curva de equity ───────────────────────── */
    function renderEquity(canvasId, ops) {
        destroy(canvasId);
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const serie  = metrics().serieEquity(ops);
        const labels = serie.map(function (p) { return format().formatISODate(p.data); });
        const data   = serie.map(function (p) { return format().fromCents(p.acumuladoCents); });

        registry[canvasId] = new global.Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Lucro Acumulado (R$)',
                    data: data,
                    borderColor: '#7FB3D5',
                    backgroundColor: 'rgba(127,179,213,0.15)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 0,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: 'rgba(127,179,213,0.12)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    /* ─── Performance: barras por mês ────────────────────────── */
    function renderMensal(canvasId, ops) {
        destroy(canvasId);
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const resumo = metrics().resumoMensal(ops);
        const labels = resumo.map(function (r) { return format().formatMonthYear(r.mes); });
        const data   = resumo.map(function (r) { return format().fromCents(r.valorCents); });
        const colors = data.map(function (v) { return v >= 0 ? '#81C784' : '#EF9A9A'; });

        registry[canvasId] = new global.Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Resultado Mensal (R$)',
                    data: data,
                    backgroundColor: colors,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: 'rgba(127,179,213,0.12)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    function renderPerformanceCharts(ops) {
        renderEquity('chartEquity', ops);
        renderMensal('chartMensal', ops);
    }

    global.Planis = global.Planis || {};
    global.Planis.charts = {
        renderDashboardCharts,
        renderPerformanceCharts,
        destroy,
        destroyAll
    };
})(window);