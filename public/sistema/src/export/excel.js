/* ═══════════════════════════════════════════════════════════════
   Planix TraderMax · src/export/excel.js
   Segue o padrão de export.js do projeto Fluxo de Caixa.
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
    'use strict';

    function toExcel(linhas, filename, nomeAba) {
        if (typeof XLSX === 'undefined') {
            console.error('XLSX não carregado');
            return;
        }
        const ws = XLSX.utils.aoa_to_sheet(linhas);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, nomeAba || 'Sheet1');
        XLSX.writeFile(wb, filename || 'export.xlsx');
    }

    function toExcelComAbas(abas, filename) {
        if (typeof XLSX === 'undefined') {
            console.error('XLSX não carregado');
            return;
        }

        const wb = XLSX.utils.book_new();

        abas.forEach(function (aba) {
            const ws = XLSX.utils.aoa_to_sheet(aba.linhas);

            if (aba.colWidths && aba.colWidths.length > 0) {
                ws['!cols'] = aba.colWidths.map(function (w) { return { wch: w }; });
            }

            XLSX.utils.book_append_sheet(wb, ws, aba.nome);
        });

        XLSX.writeFile(wb, filename || 'export.xlsx');
    }

    global.Planis = global.Planis || {};
    global.Planis.exportExcel = {
        toExcel: toExcel,
        toExcelComAbas: toExcelComAbas
    };
})(window);