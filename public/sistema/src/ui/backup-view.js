/* ═══════════════════════════════════════════════════════════════
   Planix TraderMax · src/ui/backup-view.js
   ───────────────────────────────────────────────────────────────
   Renderiza a view "Backup": página com botões Exportar/Importar.

   Ações disparadas:
     backup-export  → handler em src/export/backup.js
     backup-import  → handler em src/export/backup.js

   Depende de: constants.
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
    'use strict';

    function render(container) {
        container.innerHTML = [
            '<div class="panel" style="max-width:760px; margin:0 auto;">',
            '  <div class="panel-header">',
            '    <div class="panel-title">Backup do Banco de Dados</div>',
            '  </div>',
            '  <div class="panel-body">',
            '    <p style="margin-bottom:1.5rem; color:var(--text-light); line-height:1.6; font-size:0.9rem;">',
            '      Exporte o banco de dados completo para um arquivo <strong>.db</strong> e guarde em local seguro. ',
            '      Para restaurar, selecione um arquivo previamente exportado.',
            '    </p>',
            '    <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">',
            '      <button type="button" class="btn btn-primary" data-action="backup-export"',
            '              style="padding:1.75rem 1rem; flex-direction:column; gap:0.75rem; height:auto;">',
            '        <i class="fas fa-download" style="font-size:2rem;"></i>',
            '        <span style="font-size:0.95rem;">Exportar Banco</span>',
            '        <span style="font-size:0.72rem; font-weight:400; opacity:0.85;">Salvar cópia em .db</span>',
            '      </button>',
            '      <button type="button" class="btn btn-outline" data-action="backup-import"',
            '              style="padding:1.75rem 1rem; flex-direction:column; gap:0.75rem; height:auto;">',
            '        <i class="fas fa-upload" style="font-size:2rem;"></i>',
            '        <span style="font-size:0.95rem;">Importar Banco</span>',
            '        <span style="font-size:0.72rem; font-weight:400; opacity:0.85;">Restaurar de um .db</span>',
            '      </button>',
            '    </div>',
            '  </div>',
            '</div>'
        ].join('');
    }

    global.Planis = global.Planis || {};
    global.Planis.backupView = { render };
})(window);