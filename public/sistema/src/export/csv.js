/* ═══════════════════════════════════════════════════════════════
   Planix TraderMax · src/export/csv.js
   ───────────────────────────────────────────────────────────────
   Exportação de operações para CSV.

   Escopo: apenas as operações visíveis no recorte atual
   (ano + mês + filtro de data), ordenadas por data crescente.

   Formato:
   - Separador: ponto-e-vírgula (padrão do Excel brasileiro).
   - Valores com vírgula como separador decimal (padrão pt-BR).
   - BOM UTF-8 no início, para o Excel detectar o encoding.
   - Aspas duplas de escape quando o campo contém ; , ou ".

   Filename:
     planix-tradermax-operacoes-<ano>-<periodo>.csv
     onde <periodo> = 'anual' ou o nome curto do mês em minúsculas.
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
    'use strict';

    const state     = () => global.Planis.state;
    const store     = () => global.Planis.store;
    const format    = () => global.Planis.format;
    const constants = () => global.Planis.constants;

    /* ─── Coleta de operações do recorte atual ───────────────── */
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

    /* ─── Escapa um campo para CSV ───────────────────────────── */
    function escapeField(value) {
        const s = value === null || value === undefined ? '' : String(value);
        if (s.indexOf('"') !== -1) {
            return '"' + s.replace(/"/g, '""') + '"';
        }
        if (s.indexOf(';') !== -1 || s.indexOf('\n') !== -1 || s.indexOf('\r') !== -1) {
            return '"' + s + '"';
        }
        return s;
    }

    /* Converte centavos para string BR: '1234' → '12,34'. */
    function centsToBR(cents) {
        return format().fromCents(cents || 0).toFixed(2).replace('.', ',');
    }

    /* ─── Construção do CSV ──────────────────────────────────── */
    function buildCSV(ops) {
        const SEP = ';';
        const lines = [];

        /* Cabeçalho */
        lines.push([
            'Data',
            'Resultado',
            'Valor Bruto',
            'Taxa Registro BM&F',
            'Taxas BM&F (emol+f.gar)',
            'IRRF Day Trade',
            'Valor Líquido'
        ].map(escapeField).join(SEP));

        /* Linhas */
        ops.forEach(function (o) {
            lines.push([
                format().formatISODate(o.data),
                o.resultado,
                centsToBR(o.lucroBrutoCents),
                centsToBR(o.taxaRegistroCents),
                centsToBR(o.taxasBmfCents),
                centsToBR(o.irrfCents),
                centsToBR(o.lucroLiquidoCents)
            ].map(escapeField).join(SEP));
        });

        return lines.join('\r\n');
    }

    /* ─── Download ───────────────────────────────────────────── */
    function buildFilename() {
        const s = state().getAll();
        const year = s.viewingYear;
        const period = s.currentMonth === 'all'
            ? 'anual'
            : constants().MONTHS_SHORT[s.currentMonth].toLowerCase();
        return 'planix-tradermax-operacoes-' + year + '-' + period + '.csv';
    }

    function download(filename, content) {
        const BOM = '\ufeff';
        const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }

    /* ─── Ação pública ───────────────────────────────────────── */
    function exportCSV() {
        const ops = getFilteredOps();

        if (!ops.length) {
            alert('Nenhuma operação para exportar no período selecionado.');
            return;
        }

        const csv = buildCSV(ops);
        download(buildFilename(), csv);
    }

    /* ─── Delegação ──────────────────────────────────────────── */
    function handleClick(e) {
        const el = e.target.closest('[data-action="export-csv"]');
        if (!el) return;
        e.preventDefault();
        exportCSV();
    }

    function init() {
        document.addEventListener('click', handleClick);
    }

    global.Planis = global.Planis || {};
    global.Planis.exporter = global.Planis.exporter || {};
    global.Planis.exporter.csv = {
        init,
        exportCSV
    };
})(window);