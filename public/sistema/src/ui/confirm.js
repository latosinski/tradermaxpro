/* ═══════════════════════════════════════════════════════════════
   Planix TraderMax · src/ui/confirm.js
   ───────────────────────────────────────────────────────────────
   Diálogo de confirmação reutilizável.

   Correção aplicada: foco no botão de confirmação é SÍNCRONO
   (sem rAF) e o handler de Enter tem fallback caso o foco não
   tenha migrado para um botão do modal (Enter duplo).
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
    'use strict';

    let overlayEl = null;
    let resolveFn = null;
    let keydownHandler = null;

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

    function getButtons() {
        return Array.prototype.slice.call(
            overlayEl.querySelectorAll('.confirm-actions button')
        );
    }

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

    function ask(options) {
        const opts = options || {};

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

            void overlayEl.offsetWidth;
            overlayEl.classList.add('active');

            /* Foco SÍNCRONO no botão de confirmação.
               Antes era via duplo rAF (~32ms), o que fazia o
               primeiro Enter cair enquanto o foco ainda estava
               no botão de origem (fora do overlay). */
            const confirmBtn = overlayEl.querySelector('[data-role="confirm"]');
            try { confirmBtn.focus(); } catch (e) { /* ignora */ }

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

                if (e.key === 'Enter' || e.key === ' ') {
                    const active = document.activeElement;
                    if (overlayEl.contains(active) && active.tagName === 'BUTTON') {
                        /* Foco em um botão do modal: aciona ele. */
                        e.preventDefault();
                        e.stopPropagation();
                        active.click();
                    } else {
                        /* Fallback: nenhum botão do modal está com foco
                           (ex.: foco ainda no botão de origem, ou perda
                           de foco por algum motivo). Aciona o botão de
                           confirmação padrão diretamente. */
                        e.preventDefault();
                        e.stopPropagation();
                        try { confirmBtn.click(); } catch (err) { /* ignora */ }
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