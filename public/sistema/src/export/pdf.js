/* ═══════════════════════════════════════════════════════════════
   Planix TraderMax · src/export/pdf.js
   ───────────────────────────────────────────────────────────────
   Exportação para PDF via window.print() + folha de impressão
   dedicada (styles/print.css).

   Como funciona:
   1. O usuário clica em "Exportar PDF".
   2. O evento `beforeprint` é capturado. Nele:
      - Ativa o printMode na paginação (mostra TODAS as linhas
        da tabela, esconde os controles de paginação).
      - Re-renderiza a view corrente para refletir o estado.
   3. window.print() abre o diálogo. O usuário escolhe
      "Salvar como PDF".
   4. Ao fechar o diálogo, `afterprint` é disparado. Nele:
      - Desativa o printMode.
      - Re-renderiza a view para restaurar a paginação normal.

   Esse padrão funciona tanto no navegador quanto no Electron
   (que usará webContents.printToPDF() na Etapa 13 e reutilizará
   este mesmo CSS de impressão).
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
    'use strict';

    const pagination = () => global.Planis.pagination;
    const router     = () => global.Planis.router;

    function beforePrint() {
        if (pagination()) pagination().setPrintMode(true);
        if (router())     router().renderCurrentView();
    }

    function afterPrint() {
        if (pagination()) pagination().setPrintMode(false);
        if (router())     router().renderCurrentView();
    }

    function exportPDF() {
        /* window.print() dispara beforeprint antes de abrir o
           diálogo e afterprint ao fechar. Não precisamos fazer
           mais nada aqui. */
        window.print();
    }

    function handleClick(e) {
        const el = e.target.closest('[data-action="export-pdf"]');
        if (!el) return;
        e.preventDefault();
        exportPDF();
    }

    function init() {
        document.addEventListener('click', handleClick);
        window.addEventListener('beforeprint', beforePrint);
        window.addEventListener('afterprint', afterPrint);
    }

    global.Planis = global.Planis || {};
    global.Planis.exporter = global.Planis.exporter || {};
    global.Planis.exporter.pdf = {
        init,
        exportPDF
    };
})(window);