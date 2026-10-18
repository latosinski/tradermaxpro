/* ═══════════════════════════════════════════════════════════════
   Planix TraderMax · src/domain/tax.js
   ───────────────────────────────────────────────────────────────
   Cálculo fiscal de operações Day Trade.

   Regras implementadas:
   - Alíquota de 19% sobre o lucro líquido mensal (Day Trade).
   - Prejuízo mensal acumula e é compensado em meses futuros,
     dentro do mesmo ano, e transborda para anos seguintes
     (o saldo remanescente vira prejuízo inicial do próximo ano).
   - IRRF (retido na fonte) NÃO abate o DARF aqui — é devolvido
     como informação separada para o KPI da UI.

   Todas as funções são PURAS:
   - Recebem dados.
   - Devolvem resultados.
   - Não mutam entrada. Não acessam store. Não tocam DOM.
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
    'use strict';

    const ALIQUOTA_DAY_TRADE = 0.19;

    /**
     * Calcula o imposto de um único ano.
     *
     * @param {Object} monthsData  - Objeto `{ 0..11: { ops: [...] } }`
     * @param {number} prejuizoInicialCents - Saldo de prejuízo vindo do ano anterior (centavos)
     * @returns {{
     *   darfTotalCents:  number,
     *   darfMensalCents: number[12],
     *   prejuizoFinalCents: number,
     *   prejuizoAcumuladoMensalCents: number[12],
     *   lucroMensalCents:  number[12],
     *   lucroTributavelCents: number[12]
     * }}
     */
    function calcularImpostoAnual(monthsData, prejuizoInicialCents) {
        const darfMensalCents              = new Array(12).fill(0);
        const lucroMensalCents             = new Array(12).fill(0);
        const lucroTributavelCents         = new Array(12).fill(0);
        const prejuizoAcumuladoMensalCents = new Array(12).fill(0);

        let saldoPrejuizo  = Math.max(0, Math.round(prejuizoInicialCents || 0));
        let darfTotalCents = 0;

        for (let m = 0; m < 12; m++) {
            const month = monthsData && monthsData[m];
            const ops = (month && Array.isArray(month.ops)) ? month.ops : [];

            /* Lucro líquido do mês (soma de todas as operações) */
            let liqMes = 0;
            for (let i = 0; i < ops.length; i++) {
                liqMes += ops[i].lucroLiquidoCents || 0;
            }
            lucroMensalCents[m] = liqMes;

            if (liqMes < 0) {
                /* Mês no prejuízo → acumula saldo para compensação futura */
                saldoPrejuizo += Math.abs(liqMes);
            } else if (liqMes > 0) {
                /* Mês lucrativo → abate prejuízo acumulado */
                const abater = Math.min(liqMes, saldoPrejuizo);
                const lucroTributavel = liqMes - abater;
                saldoPrejuizo -= abater;
                lucroTributavelCents[m] = lucroTributavel;

                if (lucroTributavel > 0) {
                    const darfMes = Math.round(lucroTributavel * ALIQUOTA_DAY_TRADE);
                    darfMensalCents[m] = darfMes;
                    darfTotalCents += darfMes;
                }
            }

            /* Saldo de prejuízo ao final do mês m (após processá-lo) */
            prejuizoAcumuladoMensalCents[m] = saldoPrejuizo;
        }

        return {
            darfTotalCents,
            darfMensalCents,
            prejuizoFinalCents: saldoPrejuizo,
            prejuizoAcumuladoMensalCents,
            lucroMensalCents,
            lucroTributavelCents
        };
    }

    /**
     * Percorre uma sequência de anos encadeando o prejuízo acumulado.
     */
    function calcularCadeiaImpostos(allData, startYear, endYear, prejuizoInicialCents) {
        const out = {};
        let carregado = Math.max(0, Math.round(prejuizoInicialCents || 0));

        for (let y = startYear; y <= endYear; y++) {
            const yd = allData && allData[y];
            const months = (yd && yd.months) ? yd.months : {};
            const result = calcularImpostoAnual(months, carregado);
            result.prejuizoInicialCents = carregado;
            out[y] = result;
            carregado = result.prejuizoFinalCents;
        }

        return out;
    }

    /**
     * DARF relevante para o KPI da dashboard.
     * - `month === 'all'` → DARF total do ano.
     * - `month` 0..11     → DARF do mês.
     */
    function extrairDarf(resultadoAno, month) {
        if (!resultadoAno) return 0;
        if (month === 'all' || month === null || month === undefined) {
            return resultadoAno.darfTotalCents || 0;
        }
        const m = parseInt(month, 10);
        if (!Number.isFinite(m) || m < 0 || m > 11) return 0;
        return (resultadoAno.darfMensalCents && resultadoAno.darfMensalCents[m]) || 0;
    }

    /**
     * Saldo de prejuízo acumulado a compensar até um mês específico.
     * - `month === 'all'` → saldo ao final do ano.
     * - `month` 0..11     → saldo ao final do mês.
     */
    function extrairPrejuizoAcumuladoAte(resultadoAno, month) {
        if (!resultadoAno) return 0;
        if (month === 'all' || month === null || month === undefined) {
            return resultadoAno.prejuizoFinalCents || 0;
        }
        const m = parseInt(month, 10);
        if (!Number.isFinite(m) || m < 0 || m > 11) return 0;
        if (!Array.isArray(resultadoAno.prejuizoAcumuladoMensalCents)) return 0;
        return resultadoAno.prejuizoAcumuladoMensalCents[m] || 0;
    }

    /**
     * Soma de IRRF retido na fonte em um conjunto de operações.
     */
    function somarIrrf(ops) {
        if (!Array.isArray(ops)) return 0;
        let total = 0;
        for (let i = 0; i < ops.length; i++) {
            if (ops[i].resultado === 'Positivo') {
                total += ops[i].irrfCents || 0;
            }
        }
        return total;
    }

    /**
     * Soma de custos operacionais (taxa de registro + taxas BMF).
     */
    function somarCustosOperacionais(ops) {
        if (!Array.isArray(ops)) return 0;
        let taxaRegistro = 0;
        let taxasBmf     = 0;
        for (let i = 0; i < ops.length; i++) {
            taxaRegistro += ops[i].taxaRegistroCents || 0;
            taxasBmf     += ops[i].taxasBmfCents     || 0;
        }
        return { taxaRegistroCents: taxaRegistro, taxasBmfCents: taxasBmf, total: taxaRegistro + taxasBmf };
    }

    global.Planis = global.Planis || {};
    global.Planis.tax = {
        ALIQUOTA_DAY_TRADE,
        calcularImpostoAnual,
        calcularCadeiaImpostos,
        extrairDarf,
        extrairPrejuizoAcumuladoAte,
        somarIrrf,
        somarCustosOperacionais
    };
})(window);