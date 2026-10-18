/* ═══════════════════════════════════════════════════════════════
   Planix TraderMax · src/export/backup.js
   ───────────────────────────────────────────────────────────────
   Handlers dos botões da página de Backup.

     data-action="backup-export"  → window.planix.db.backup()
     data-action="backup-import"  → window.planix.db.restore()

   Fora do Electron (navegador), avisa e não faz nada.
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
    'use strict';

    const confirmDialog = () => global.Planis.confirm;

    function hasBridge() {
        return !!(global.planix && global.planix.db);
    }

    /* ─── Exportar ───────────────────────────────────────────── */
    async function exportBackup() {
        if (!hasBridge() || typeof global.planix.db.backup !== 'function') {
            alert('O backup do banco de dados está disponível apenas na versão desktop.');
            return;
        }

        try {
            const result = await global.planix.db.backup();
            if (result && result.ok) {
                console.log('[backup] salvo em ' + result.path);
            } else if (result && result.reason === 'canceled') {
                /* usuário cancelou */
            } else {
                console.error('[backup] falha:', result && result.message);
                alert('Não foi possível salvar o backup.');
            }
        } catch (err) {
            console.error('[backup] erro:', err);
            alert('Erro inesperado ao gerar backup.');
        }
    }

    /* ─── Importar ───────────────────────────────────────────── */
    async function importBackup() {
        if (!hasBridge() || typeof global.planix.db.restore !== 'function') {
            alert('A restauração de backup está disponível apenas na versão desktop.');
            return;
        }

        const confirmed = await confirmDialog().ask({
            title: 'Restaurar backup?',
            message: 'Todos os dados atuais serão substituídos pelos dados do arquivo escolhido. ' +
                     'Uma cópia de segurança do estado atual será criada automaticamente.',
            confirmText: 'Escolher arquivo',
            cancelText: 'Cancelar',
            variant: 'warning'
        });
        if (!confirmed) return;

        try {
            const result = await global.planix.db.restore();

            if (result && result.ok) {
                alert('Backup restaurado com sucesso. O aplicativo será recarregado.');
                window.location.reload();
                return;
            }
            if (result && result.reason === 'canceled') return;
            if (result && result.reason === 'invalid') {
                alert('O arquivo selecionado não é um banco de dados válido do Planix TraderMax.');
                return;
            }
            alert('Não foi possível restaurar o backup. ' + (result && result.message ? result.message : ''));
        } catch (err) {
            console.error('[backup] erro no restore:', err);
            alert('Erro inesperado ao restaurar backup.');
        }
    }

    /* ─── Delegação ──────────────────────────────────────────── */
    function handleClick(e) {
        const el = e.target.closest('[data-action]');
        if (!el) return;
        const action = el.dataset.action;

        if (action === 'backup-export') {
            e.preventDefault();
            exportBackup();
            return;
        }
        if (action === 'backup-import') {
            e.preventDefault();
            importBackup();
            return;
        }
    }

    function init() {
        document.addEventListener('click', handleClick);
    }

    global.Planis = global.Planis || {};
    global.Planis.exporter = global.Planis.exporter || {};
    global.Planis.exporter.backup = {
        init,
        exportBackup,
        importBackup
    };
})(window);