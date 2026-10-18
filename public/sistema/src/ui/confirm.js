/* ═══════════════════════════════════════════════════════════════
   Planix TraderMax · src/ui/confirm.js
   ───────────────────────────────────────────────────────────────
   Diálogo de confirmação reutilizável.

   Substitui o nativo `window.confirm()` por um modal estilizado,
   com suporte a teclado e Promise.

   Uso:
     Planis.confirm.ask({
       title: 'Excluir operação?',
       message: 'Esta ação não pode ser desfeita.',
       confirmText: 'Excluir',
       cancelText: 'Cancelar',
       variant: 'danger'   // 'danger' | 'warning' | 'info' (default)
     }).then(function (confirmed) {
       if (confirmed) { ... }
     });

   Teclado:
     - Enter/Space → aciona o botão com foco.
     - Escape      → cancela.
     - Tab         → alterna entre os botões (focus trap).
     - Shift+Tab   → alterna em sentido inverso.
     - Setas ← ↑   → botão anterior.
     - Setas → ↓   → botão seguinte.
     - Navegação por setas é circular (o foco "dá a volta").

   Foco inicial:
     - Sempre no botão de CONFIRMAR (em todas as variantes).
     - Isso faz o Enter executar a ação diretamente, que é o
       comportamento esperado pela maioria dos usuários.
     - Escape cancela em qualquer estado — saída rápida garantida.

   Comportamento:
     - Clique no overlay (fora do diálogo) → cancela.
     - O elemento é criado sob demanda e reaproveitado entre chamadas.
     - Se já houver um diálogo aberto e outro `ask()` for chamado,
       o primeiro é resolvido como cancelado antes do segundo abrir.
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
    'use strict';

    let overlayEl = null;
    let resolveFn = null;
    let keydownHandler = null;

    /* ─── Construção sob demanda ─────────────────────────────── */
    function ensureElements() {
        if (overlayEl) return overlayEl;

        overlayEl = document.createElement('div');
        overlayEl.className = 'confirm-overlay';
        overlayEl.setAttribute('role', 'dialog');
        overlayEl.setAttribute('aria-modal', 'true');
        overlayEl.innerHTML = [
            '<div class="confirm-dialog">',
            '  <div class="confirm-icon" data-role="icon"><i></i></div>',
            '  <h3 class="confirm-title" data-role="title"></h3>',
            '  <p class="confirm-message" data-role="message"></p>',
            '  <div class="confirm-actions">',
            '    <button type="button" class="btn btn-outline" data-role="cancel"></button>',
            '    <button type="button" class="btn btn-primary" data-role="confirm"></button>',
            '  </div>',
            '</div>'
        ].join('');

        document.body.appendChild(overlayEl);

        /* Clique no overlay (fora do diálogo) = cancelar.
           Usa mousedown para evitar o caso "start no overlay,
           release no dialog" disparar cancelamento acidental. */
        overlayEl.addEventListener('mousedown', function (e) {
            if (e.target === overlayEl) close(false);
        });

        overlayEl.querySelector('[data-role="cancel"]').addEventListener('click', function () {
            close(false);
        });
        overlayEl.querySelector('[data-role="confirm"]').addEventListener('click', function () {
            close(true);
        });

        return overlayEl;
    }

    /* ─── Aplicação de variante visual ──────────────────────── */
    function applyVariant(variant) {
        const icon       = overlayEl.querySelector('[data-role="icon"]');
        const iconI      = icon.querySelector('i');
        const confirmBtn = overlayEl.querySelector('[data-role="confirm"]');

        icon.className = 'confirm-icon';
        confirmBtn.className = 'btn';

        if (variant === 'danger') {
            icon.classList.add('danger');
            iconI.className = 'fas fa-exclamation-triangle';
            confirmBtn.classList.add('btn-confirm-danger');
        } else if (variant === 'warning') {
            icon.classList.add('warning');
            iconI.className = 'fas fa-exclamation-circle';
            confirmBtn.classList.add('btn-primary');
        } else {
            icon.classList.add('info');
            iconI.className = 'fas fa-question-circle';
            confirmBtn.classList.add('btn-primary');
        }
    }

    /* ─── Lista de botões do diálogo (ordem do DOM) ─────────── */
    function getButtons() {
        return Array.prototype.slice.call(
            overlayEl.querySelectorAll('.confirm-actions button')
        );
    }

    /* ─── Fechar e resolver ──────────────────────────────────── */
    function close(result) {
        if (!overlayEl || !overlayEl.classList.contains('active')) return;

        overlayEl.classList.remove('active');

        if (keydownHandler) {
            document.removeEventListener('keydown', keydownHandler, true);
            keydownHandler = null;
        }

        const resolve = resolveFn;
        resolveFn = null;
        if (resolve) resolve(result);
    }

    /* ─── Navegação por setas (circular) ────────────────────── */
    function moveFocus(direction) {
        const buttons = getButtons();
        if (buttons.length === 0) return;

        const active = document.activeElement;
        let idx = buttons.indexOf(active);

        if (idx === -1) {
            buttons[0].focus();
            return;
        }

        idx = (idx + direction + buttons.length) % buttons.length;
        buttons[idx].focus();
    }

    /* ─── Focus trap para Tab ────────────────────────────────── */
    function trapTab(e) {
        const buttons = getButtons();
        if (buttons.length === 0) return;

        const first  = buttons[0];
        const last   = buttons[buttons.length - 1];
        const active = document.activeElement;
        const inside = overlayEl.contains(active);

        if (e.shiftKey) {
            if (active === first || !inside) {
                e.preventDefault();
                last.focus();
            }
        } else {
            if (active === last || !inside) {
                e.preventDefault();
                first.focus();
            }
        }
    }

    /* ─── Agendador de foco robusto ─────────────────────────── */
    /* Duplo rAF garante que o layout esteja pintado antes do
       focus(). Fallback para setTimeout em ambientes sem rAF. */
    function scheduleFocus(cb) {
        if (typeof global.requestAnimationFrame === 'function') {
            global.requestAnimationFrame(function () {
                global.requestAnimationFrame(cb);
            });
        } else {
            setTimeout(cb, 50);
        }
    }

    /* ─── API pública ────────────────────────────────────────── */
    function ask(options) {
        const opts = options || {};

        /* Fecha diálogo anterior, se houver */
        if (overlayEl && overlayEl.classList.contains('active')) {
            close(false);
        }

        ensureElements();

        const variant = opts.variant || 'info';

        overlayEl.querySelector('[data-role="title"]').textContent   = opts.title       || 'Confirmar ação';
        overlayEl.querySelector('[data-role="message"]').textContent = opts.message     || '';
        overlayEl.querySelector('[data-role="confirm"]').textContent = opts.confirmText || 'Confirmar';
        overlayEl.querySelector('[data-role="cancel"]').textContent  = opts.cancelText  || 'Cancelar';

        applyVariant(variant);

        return new Promise(function (resolve) {
            resolveFn = resolve;

            /* Força reflow para garantir transição de entrada */
            void overlayEl.offsetWidth;
            overlayEl.classList.add('active');

            /* Foco inicial: SEMPRE no botão de confirmar.
               Isso faz o Enter executar a ação diretamente —
               comportamento esperado pela maioria dos usuários.
               Escape cancela em qualquer estado, servindo como
               saída rápida. */
            const focusTarget = overlayEl.querySelector('[data-role="confirm"]');

            scheduleFocus(function () {
                try { focusTarget.focus(); } catch (e) { /* ignora */ }
            });

            /* ─── Handler de teclado ────────────────────────── */
            keydownHandler = function (e) {

                if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    close(false);
                    return;
                }

                if (e.key === 'Tab') {
                    trapTab(e);
                    return;
                }

                /* Setas direcionais — navegação circular. */
                if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    e.stopPropagation();
                    moveFocus(-1);
                    return;
                }
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    e.stopPropagation();
                    moveFocus(1);
                    return;
                }

                /* Enter/Space — aciona o botão com foco. */
                if (e.key === 'Enter' || e.key === ' ') {
                    const active = document.activeElement;
                    if (overlayEl.contains(active) && active.tagName === 'BUTTON') {
                        e.preventDefault();
                        e.stopPropagation();
                        active.click();
                    }
                }
            };
            document.addEventListener('keydown', keydownHandler, true);
        });
    }

    global.Planis = global.Planis || {};
    global.Planis.confirm = {
        ask: ask
    };
})(window);