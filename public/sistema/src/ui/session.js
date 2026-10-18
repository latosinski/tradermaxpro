/* ═══════════════════════════════════════════════════════════════
   Planix TraderMax · src/ui/session.js
   ───────────────────────────────────────────────────────────────
   Ciclo de vida da sessão — atualmente, apenas o "Sair".

   Comportamento:
     1. Usuário clica em "Sair" (sidebar).
     2. Confirmação é exibida.
     3. Se confirmado:
        a) Tenta `window.close()` — funciona no Electron e em
           janelas abertas por script (window.open).
        b) Se a janela não fechou (caso típico em navegador),
           faz um reload da página. O app volta ao estado inicial
           e todos os dados e preferências são preservados.

   Importante: "Sair" NÃO apaga dados. É apenas uma saída
   controlada da sessão atual.
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
    'use strict';

    const confirmDialog = () => global.Planis.confirm;

    /* ─── Fluxo de logout ────────────────────────────────────── */
    function handleLogout() {
        confirmDialog().ask({
            title: 'Sair do Planix TraderMax?',
            message: 'Seus dados permanecerão salvos no navegador e estarão disponíveis ao retornar.',
            confirmText: 'Sair',
            cancelText: 'Cancelar',
            variant: 'warning'
        }).then(function (confirmed) {
            if (confirmed) performLogout();
        });
    }

    function performLogout() {
        /* 1) Tenta fechar a janela. Funciona no Electron e em
              janelas abertas via window.open(). Silencioso em
              caso de bloqueio pelo navegador.                     */
        try { window.close(); } catch (e) { /* ignora */ }

        /* 2) Se a janela não fechou, faz reload. Em navegador
              comum isso é o comportamento previsível — o usuário
              volta para a tela inicial, com os dados intactos.   */
        setTimeout(function () {
            window.location.reload();
        }, 150);
    }

    /* ─── Delegação do clique ────────────────────────────────── */
    function handleClick(e) {
        const el = e.target.closest('[data-action="logout"]');
        if (!el) return;
        e.preventDefault();
        handleLogout();
    }

    function init() {
        document.addEventListener('click', handleClick);
    }

    global.Planis = global.Planis || {};
    global.Planis.session = {
        init: init,
        logout: handleLogout
    };
})(window);