/* ═══════════════════════════════════════════════════════════════
   Planix TraderMax · src/domain/metrics.js
   ───────────────────────────────────────────────────────────────
   Métricas de performance de um conjunto de operações.

   Todas as funções são PURAS:
   - Recebem array de operações.
   - Devolvem um objeto com as métricas.
   - Não mutam a entrada. Não acessam store. Não tocam DOM.

   Formato esperado de cada operação:
     { id, data: 'YYYY-MM-DD', resultado: 'Positivo'|'Negativo',
       lucroLiquidoCents: number, ... }
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
    'use strict';

    /* Ordena por data crescente sem mutar a entrada. */
    function sortByDate(ops) {
        return ops.slice().sort(function (a, b) {
            return String(a.data).localeCompare(String(b.data));
        });
    }

    /* ─── Métricas agregadas ─────────────────────────────────── */

    /**
     * Calcula o pacote completo de métricas de performance.
     * Devolve um objeto com todos os campos que a tela usa.
     *
     * @param {Array} ops - Array de operações (qualquer ordem).
     * @returns {Object} - Métricas calculadas. `empty=true` se não houver operações.
     */
    function calcular(ops) {
        if (!Array.isArray(ops) || ops.length === 0) {
            return emptyMetrics();
        }

        const sorted = sortByDate(ops);

        /* ─── Separação positivo/negativo ─────────────────── */
        const positivas = [];
        const negativas = [];
        for (let i = 0; i < sorted.length; i++) {
            if (sorted[i].resultado === 'Positivo') positivas.push(sorted[i]);
            else                                    negativas.push(sorted[i]);
        }

        const totalOps = sorted.length;
        const totalPos = positivas.length;
        const totalNeg = negativas.length;

        const taxaAcerto = totalOps > 0 ? (totalPos / totalOps) * 100 : 0;

        /* ─── Ganho médio e perda média (valores absolutos) ── */
        let somaGanhos = 0;
        for (let i = 0; i < positivas.length; i++) {
            somaGanhos += positivas[i].lucroLiquidoCents;
        }
        let somaPerdas = 0;
        for (let i = 0; i < negativas.length; i++) {
            somaPerdas += Math.abs(negativas[i].lucroLiquidoCents);
        }

        const ganhoMedio = totalPos > 0 ? somaGanhos / totalPos : 0;
        const perdaMedia = totalNeg > 0 ? somaPerdas / totalNeg : 0;

        /* ─── Payoff ───────────────────────────────────────── */
        let payoff;
        if (perdaMedia > 0) {
            payoff = ganhoMedio / perdaMedia;
        } else if (ganhoMedio > 0) {
            payoff = Infinity;
        } else {
            payoff = 1;
        }

        /* ─── Expectativa matemática por operação ─────────── */
        const pWin  = taxaAcerto / 100;
        const pLoss = 1 - pWin;
        const expectativa = pWin * ganhoMedio - pLoss * perdaMedia;

        /* ─── Drawdown máximo (em centavos) ───────────────── */
        let capital = 0;
        let pico    = 0;
        let maxDD   = 0;
        for (let i = 0; i < sorted.length; i++) {
            capital += sorted[i].lucroLiquidoCents || 0;
            if (capital > pico) pico = capital;
            const dd = pico - capital;
            if (dd > maxDD) maxDD = dd;
        }

        /* ─── Sequências de ganho/perda ────────────────────── */
        let seqPerda = 0, maxSeqPerda = 0;
        let seqGanho = 0, maxSeqGanho = 0;
        for (let i = 0; i < sorted.length; i++) {
            if (sorted[i].resultado === 'Negativo') {
                seqPerda++;
                seqGanho = 0;
                if (seqPerda > maxSeqPerda) maxSeqPerda = seqPerda;
            } else {
                seqGanho++;
                seqPerda = 0;
                if (seqGanho > maxSeqGanho) maxSeqGanho = seqGanho;
            }
        }

        /* ─── Melhor / pior dia ───────────────────────────── */
        let melhorDia = sorted[0];
        let piorDia   = sorted[0];
        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i].lucroLiquidoCents > melhorDia.lucroLiquidoCents) melhorDia = sorted[i];
            if (sorted[i].lucroLiquidoCents < piorDia.lucroLiquidoCents)   piorDia   = sorted[i];
        }

        /* ─── Agregação mensal ────────────────────────────── */
        const porMes = {};
        for (let i = 0; i < sorted.length; i++) {
            const mesKey = String(sorted[i].data).substring(0, 7); /* 'YYYY-MM' */
            porMes[mesKey] = (porMes[mesKey] || 0) + (sorted[i].lucroLiquidoCents || 0);
        }

        let melhorMesKey = null, piorMesKey = null;
        let melhorMesVal = -Infinity, piorMesVal = Infinity;

        Object.keys(porMes).forEach(function (k) {
            const v = porMes[k];
            if (v > melhorMesVal) { melhorMesVal = v; melhorMesKey = k; }
            if (v < piorMesVal)   { piorMesVal   = v; piorMesKey   = k; }
        });

        /* ─── Totais ──────────────────────────────────────── */
        let lucroTotal = 0;
        for (let i = 0; i < sorted.length; i++) {
            lucroTotal += sorted[i].lucroLiquidoCents || 0;
        }

        return {
            empty: false,
            totalOps,
            totalPos,
            totalNeg,
            taxaAcerto,
            ganhoMedio,
            perdaMedia,
            payoff,
            expectativa,
            maxDrawdown: maxDD,
            maxSeqPerda,
            maxSeqGanho,
            lucroTotal,
            melhorDia: {
                data: melhorDia.data,
                lucroLiquidoCents: melhorDia.lucroLiquidoCents || 0
            },
            piorDia: {
                data: piorDia.data,
                lucroLiquidoCents: piorDia.lucroLiquidoCents || 0
            },
            melhorMes: {
                mes: melhorMesKey,
                valorCents: Number.isFinite(melhorMesVal) ? melhorMesVal : 0
            },
            piorMes: {
                mes: piorMesKey,
                valorCents: Number.isFinite(piorMesVal) ? piorMesVal : 0
            }
        };
    }

    /* Estado "sem dados" — mesma forma do objeto normal. */
    function emptyMetrics() {
        return {
            empty: true,
            totalOps: 0,
            totalPos: 0,
            totalNeg: 0,
            taxaAcerto: 0,
            ganhoMedio: 0,
            perdaMedia: 0,
            payoff: 1,
            expectativa: 0,
            maxDrawdown: 0,
            maxSeqPerda: 0,
            maxSeqGanho: 0,
            lucroTotal: 0,
            melhorDia: { data: '', lucroLiquidoCents: 0 },
            piorDia:   { data: '', lucroLiquidoCents: 0 },
            melhorMes: { mes: null, valorCents: 0 },
            piorMes:   { mes: null, valorCents: 0 }
        };
    }

    /* ─── Série de equity (para gráfico) ─────────────────────── */

    /**
     * Devolve a série acumulada de lucro líquido, ordenada por data.
     * Cada item: { data, acumuladoCents }.
     * Não inclui ponto inicial zero — a UI pode decidir como renderizar.
     */
    function serieEquity(ops) {
        if (!Array.isArray(ops) || ops.length === 0) return [];
        const sorted = sortByDate(ops);
        const out = [];
        let acum = 0;
        for (let i = 0; i < sorted.length; i++) {
            acum += sorted[i].lucroLiquidoCents || 0;
            out.push({
                data: sorted[i].data,
                acumuladoCents: acum,
                resultado: sorted[i].resultado
            });
        }
        return out;
    }

    /* ─── Resumo mensal (para gráfico de barras) ─────────────── */

    /**
     * Devolve um array ordenado por mês: [{ mes: 'YYYY-MM', valorCents }]
     * Ordenado cronologicamente.
     */
    function resumoMensal(ops) {
        if (!Array.isArray(ops) || ops.length === 0) return [];
        const mapa = {};
        for (let i = 0; i < ops.length; i++) {
            const key = String(ops[i].data).substring(0, 7);
            mapa[key] = (mapa[key] || 0) + (ops[i].lucroLiquidoCents || 0);
        }
        return Object.keys(mapa)
            .sort()
            .map(function (k) { return { mes: k, valorCents: mapa[k] }; });
    }

    /* ─── Exporta ────────────────────────────────────────────── */
    global.Planis = global.Planis || {};
    global.Planis.metrics = {
        calcular,
        serieEquity,
        resumoMensal,
        emptyMetrics
    };
})(window);