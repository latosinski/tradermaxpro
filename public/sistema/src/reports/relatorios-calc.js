/* ═══════════════════════════════════════════════════════════════
   Planix TraderMax · src/reports/relatorios-calc.js
   Camada de cálculo centralizada do módulo de relatórios.

   Responsabilidades:
   - Receber (ano, mes) e devolver um objeto completo de relatório.
   - NÃO acessar DOM, NÃO conhecer Chart.js, NÃO gerar HTML.
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
    'use strict';

    const store     = () => global.Planis.store;
    const state     = () => global.Planis.state;
    const tax       = () => global.Planis.tax;
    const metrics   = () => global.Planis.metrics;
    const format    = () => global.Planis.format;
    const constants = () => global.Planis.constants;

    function aplicarFiltroData(items, s) {
        if (!s.filterStart && !s.filterEnd) return items;
        const startTs = s.filterStart ? new Date(s.filterStart + 'T00:00:00').getTime() : null;
        const endTs   = s.filterEnd   ? new Date(s.filterEnd   + 'T23:59:59').getTime() : null;
        return items.filter(function (o) {
            const d = new Date(o.data + 'T00:00:00').getTime();
            if (startTs !== null && d < startTs) return false;
            if (endTs   !== null && d > endTs)   return false;
            return true;
        });
    }

    function acumuladosAte(ano, untilMonth) {
        let aportes = 0, liq = 0, saques = 0;
        for (let m = 0; m <= untilMonth; m++) {
            store().getAportes(ano, m).forEach(function (a) { aportes += a.amountCents; });
            store().getOps(ano, m).forEach(function (o)     { liq     += o.lucroLiquidoCents; });
            store().getSaques(ano, m).forEach(function (sq) { saques  += sq.amountCents; });
        }
        return { aportes, liq, saques };
    }

    function darfAcumuladoAte(result, until) {
        if (!result || !Array.isArray(result.darfMensalCents)) return 0;
        let soma = 0;
        for (let m = 0; m <= until && m < result.darfMensalCents.length; m++) {
            soma += result.darfMensalCents[m] || 0;
        }
        return soma;
    }

    function gerarAnalise(kpis, perf) {
        const f = format().fmt;
        const partes = [];

        if (kpis.liqFinal >= 0) {
            partes.push('O período fechou com resultado líquido positivo de ' + f(kpis.liqFinal));
        } else {
            partes.push('O período fechou com resultado líquido negativo de ' + f(kpis.liqFinal));
        }

        if (kpis.totalAportado > 0) {
            partes.push('representando ' + kpis.ganhoPct.toFixed(2).replace('.', ',') + '% sobre o capital aportado');
        }

        if (!perf.empty) {
            partes.push('Foram realizadas ' + perf.totalOps + ' operaç' + (perf.totalOps === 1 ? 'ão' : 'ões') +
                        ', com taxa de acerto de ' + perf.taxaAcerto.toFixed(1).replace('.', ',') + '%');
            if (perf.payoff !== Infinity && perf.payoff > 0) {
                partes.push('e payoff de ' + perf.payoff.toFixed(2).replace('.', ','));
            }
            partes.push('O drawdown máximo foi de ' + f(perf.maxDrawdown) +
                        ' e a maior sequência de perdas foi de ' + perf.maxSeqPerda +
                        ' operaç' + (perf.maxSeqPerda === 1 ? 'ão' : 'ões') + ' consecutiva' +
                        (perf.maxSeqPerda === 1 ? '' : 's'));
        }

        if (kpis.darf > 0) {
            partes.push('O DARF apurado para o período foi de ' + f(kpis.darf));
        } else {
            partes.push('Não houve DARF a pagar no período');
        }

        if (kpis.prejuizoCompensar > 0) {
            partes.push('Restou saldo de prejuízo a compensar de ' + f(kpis.prejuizoCompensar));
        }

        return partes.join('. ') + '.';
    }

    function gerar(ano, mes) {
        const s = state().getAll();
        const isAll = (mes === 'all');
        const until = isAll ? 11 : parseInt(mes, 10);

        let ops = isAll ? store().getAllOps(ano) : store().getOps(ano, until);
        ops = aplicarFiltroData(ops, s);
        ops = ops.slice().sort(function (a, b) { return a.data.localeCompare(b.data); });

        let aportes = isAll ? store().getAllAportes(ano) : store().getAportes(ano, until);
        let saques  = isAll ? store().getAllSaques(ano)  : store().getSaques(ano, until);
        aportes = aplicarFiltroData(aportes, s);
        saques  = aplicarFiltroData(saques,  s);

        const acc = acumuladosAte(ano, until);

        const prefs = s.yearPrefs;
        const chain = tax().calcularCadeiaImpostos(
            store().getRawSnapshot(), prefs.start, prefs.end, 0
        );
        const result = chain[ano] || {
            darfTotalCents: 0,
            darfMensalCents: [0,0,0,0,0,0,0,0,0,0,0,0],
            prejuizoFinalCents: 0,
            prejuizoAcumuladoMensalCents: [0,0,0,0,0,0,0,0,0,0,0,0],
            lucroMensalCents: [0,0,0,0,0,0,0,0,0,0,0,0],
            lucroTributavelCents: [0,0,0,0,0,0,0,0,0,0,0,0],
            prejuizoInicialCents: 0
        };

        const darf = tax().extrairDarf(result, mes);
        const darfAcum = isAll ? (result.darfTotalCents || 0) : darfAcumuladoAte(result, until);
        const prejuizoCompensar = tax().extrairPrejuizoAcumuladoAte(result, mes);

        const totalBruto = ops.reduce(function (sum, o) { return sum + o.lucroBrutoCents; }, 0);
        const liqPeriodo = ops.reduce(function (sum, o) { return sum + o.lucroLiquidoCents; }, 0);
        const liqFinal   = liqPeriodo - darf;
        const irrf       = tax().somarIrrf(ops);
        const custos     = tax().somarCustosOperacionais(ops).total;

        const totalAportado   = acc.aportes;
        const totalSaques     = acc.saques;
        const capitalEstimado = totalAportado + acc.liq - totalSaques - darfAcum;
        const ganhoPct        = totalAportado > 0 ? (liqFinal / totalAportado) * 100 : 0;

        const kpis = {
            totalBruto, liqPeriodo, liqFinal, ganhoPct,
            darf, prejuizoCompensar, irrf, custos,
            capitalEstimado, totalAportado, totalSaques
        };

        const perf = metrics().calcular(ops);
        const analise = gerarAnalise(kpis, perf);

        const darfMensal = [];
        for (let m = 0; m < 12; m++) {
            darfMensal.push({
                mes: m,
                mesLabel: constants().MONTHS_LONG[m],
                lucroMensal: (result.lucroMensalCents && result.lucroMensalCents[m]) || 0,
                lucroTributavel: (result.lucroTributavelCents && result.lucroTributavelCents[m]) || 0,
                prejuizoAcumulado: (result.prejuizoAcumuladoMensalCents && result.prejuizoAcumuladoMensalCents[m]) || 0,
                darf: (result.darfMensalCents && result.darfMensalCents[m]) || 0
            });
        }

        const label = isAll
            ? 'Anual ' + ano
            : constants().MONTHS_LONG[until] + ' ' + ano;

        return {
            periodo: { ano, mes: isAll ? 'all' : until, tipo: isAll ? 'anual' : 'mensal', label },
            kpis,
            operacoes: ops.map(function (o) {
                return {
                    data: o.data,
                    resultado: o.resultado,
                    bruto: o.lucroBrutoCents,
                    taxaRegistro: o.taxaRegistroCents || 0,
                    taxasBmf: o.taxasBmfCents || 0,
                    irrf: o.irrfCents || 0,
                    liquido: o.lucroLiquidoCents
                };
            }),
            aportes: aportes.map(function (a) { return { data: a.data, valor: a.amountCents }; }),
            saques:  saques.map(function (sq) { return { data: sq.data, valor: sq.amountCents }; }),
            performance: perf,
            darf: {
                mensal: darfMensal,
                total: result.darfTotalCents || 0,
                prejuizoInicial: result.prejuizoInicialCents || 0,
                prejuizoFinal: result.prejuizoFinalCents || 0
            },
            analise
        };
    }

    global.Planis = global.Planis || {};
    global.Planis.relatoriosCalc = { gerar };
})(window);