/* ═══════════════════════════════════════════════════════════════
   Planix TraderMax · src/ui/refresh.js
   ───────────────────────────────────────────────────────────────
   Ação do botão "Atualizar" (data-action="refresh") do header.

   Comportamento:
     1. Anima o ícone (rotação por ~800ms).
     2. Chama store.init(), que relê o localStorage do zero.
     3. store.init() emite "store:changed", que o roteador
        (main.js) escuta e re-renderiza a view corrente.
     4. Debounce: cliques durante a animação são ignorados.

   Caso de uso real: sincronizar uma aba com outra, ou recarregar
   dados caso algo tenha sido alterado fora do fluxo normal.

   Depende de: store (via Planis.store).
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
    'use strict';

    const store = () => global.Planis.store;

    const ANIMATION_MS = 800;

    let busy = false;

    /* ─── Animação do ícone ──────────────────────────────────── */
    function animateIcon(btn) {
        if (!btn) return;
        btn.classList.add('refreshing');
        setTimeout(function () {
            btn.classList.remove('refreshing');
        }, ANIMATION_MS);
    }

    /* ─── Ação principal ─────────────────────────────────────── */
    function refresh(btn) {
        if (busy) return;
        busy = true;

        animateIcon(btn);

        try {
            /* Relê os dados do localStorage. Emite "store:changed",
               que dispara o re-render da view corrente. */
            store().init();
        } catch (err) {
            console.error('[refresh] falha ao recarregar dados:', err);
        }

        setTimeout(function () {
            busy = false;
        }, ANIMATION_MS);
    }

    /* ─── Delegação ──────────────────────────────────────────── */
    function handleClick(e) {
        const el = e.target.closest('[data-action="refresh"]');
        if (!el) return;
        e.preventDefault();
        refresh(el);
    }

    function init() {
        document.addEventListener('click', handleClick);
    }

    global.Planis = global.Planis || {};
    global.Planis.refresh = {
        init: init,
        refresh: refresh
    };
})(window);