/* ═══════════════════════════════════════════════════════════════
   Planix TraderMax · src/main.js (renderer)
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
    'use strict';

    function renderCurrentView() {
        const P = global.Planis;
        const container = document.getElementById('viewContainer');
        if (!container) return;

        const view = P.state.get('currentView');

        try {
            switch (view) {
                case P.constants.VIEWS.DASHBOARD:   P.dashboard.render(container);   break;
                case P.constants.VIEWS.PERFORMANCE: P.performance.render(container); break;
                case P.constants.VIEWS.APORTES:     P.aportes.render(container);     break;
                case P.constants.VIEWS.SAQUES:      P.saques.render(container);      break;
                case P.constants.VIEWS.BACKUP:      P.backupView.render(container);  break;
                default:
                    container.innerHTML =
                        '<div class="panel"><div class="panel-body">' +
                        '<p class="table-empty">View desconhecida: ' + view + '</p>' +
                        '</div></div>';
            }
        } catch (e) {
            console.error('[main] erro ao renderizar view "' + view + '":', e);
        }
    }

    async function boot() {
        const P = global.Planis;
        if (!P) {
            console.error('[main] namespace Planis não carregado.');
            return;
        }

        try {
            await P.storage.init();

            P.state.init();
            P.theme.init();
            P.store.init();
            P.navigation.init();
            P.filter.init();
            P.pagination.init();
            P.modals.init();
            P.session.init();
            P.refresh.init();
            P.aportes.init();
            P.saques.init();
            P.exporter.csv.init();
            P.exporter.pdf.init();
            P.exporter.backup.init();

            P.state.on(P.constants.EVENTS.STATE_CHANGED, renderCurrentView);
            P.state.on('store:changed', renderCurrentView);

            renderCurrentView();

            console.log(
                '[' + P.constants.APP.name + '] boot OK · v' + P.constants.APP.version
            );
        } catch (e) {
            console.error('[main] falha no boot:', e);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    global.Planis = global.Planis || {};
    global.Planis.router = { renderCurrentView };
})(window);