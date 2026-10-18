/* ═══════════════════════════════════════════════════════════════
   Planix TraderMax · src/ui/modals.js
   ───────────────────────────────────────────────────────────────
   Wiring dos 4 modais de formulário:

     - #modalOperation     → Nova Operação
     - #modalOperationEdit → Editar Operação
     - #modalAporteEdit    → Editar Aporte
     - #modalSaqueEdit     → Editar Saque

   Ações atendidas via [data-action]:
     operation-new         → abre modal em branco (data = hoje)
     operation-edit + id   → abre modal preenchido a partir do store
     operation-delete + id → confirma e remove
     aporte-edit + id      → abre modal preenchido
     aporte-delete + id    → confirma e remove
     saque-edit + id       → abre modal preenchido
     saque-delete + id     → confirma e remove
     modal-close + data-modal → fecha o modal indicado

   Comportamentos:
   - Valor Líquido recalculado a cada digitação em Bruto/Taxas/IRRF.
   - IRRF bloqueado (readonly + zerado) quando resultado = Negativo.
   - Ao abrir qualquer modal, sidebar mobile é fechada automaticamente.
   - Exclusões usam Planis.confirm.ask() (diálogo estilizado com
     suporte a teclado — Enter confirma, Escape cancela).
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
    'use strict';

    const store      = () => global.Planis.store;
    const format     = () => global.Planis.format;
    const navigation = () => global.Planis.navigation;
    const confirmDlg = () => global.Planis.confirm;

    /* ─── Helpers de DOM ─────────────────────────────────────── */
    function $(id) { return document.getElementById(id); }

    function openModal(id) {
        const m = $(id);
        if (m) m.classList.add('active');
    }

    function closeModal(id) {
        const m = $(id);
        if (m) m.classList.remove('active');
    }

    function openModalAndCloseSidebar(id) {
        const s = document.getElementById('sidebar');
        if (s && s.classList.contains('open') && navigation()) {
            navigation().closeSidebar();
        }
        openModal(id);
    }

    /* ─── Cálculo do valor líquido ───────────────────────────── */
    function computeLiquido(prefix) {
        const elResultado = $(prefix + 'Resultado');
        const elBruto     = $(prefix + 'ValorBruto');
        const elTaxaReg   = $(prefix + 'TaxaRegistro');
        const elTaxasBmf  = $(prefix + 'TaxasBmf');
        const elIrrf      = $(prefix + 'Irrf');

        const resultado = elResultado ? elResultado.value : '';

        let bruto = format().toCents(elBruto ? elBruto.value : '0');
        const taxaRegistro = format().toCents(elTaxaReg ? elTaxaReg.value : '0');
        const taxasBmf     = format().toCents(elTaxasBmf ? elTaxasBmf.value : '0');
        let irrf           = format().toCents(elIrrf ? elIrrf.value : '0');

        if (resultado === 'Negativo') {
            bruto = -Math.abs(bruto);
            irrf = 0;
        }

        const liquido = bruto - taxaRegistro - taxasBmf - irrf;

        return { bruto, taxaRegistro, taxasBmf, irrf, liquido, resultado };
    }

    function refreshLiquido(prefix) {
        const r = computeLiquido(prefix);
        const el = $(prefix + 'ValorLiquido');
        if (el) el.value = format().fromCents(r.liquido).toFixed(2);
    }

    function updateIrrfState(prefix) {
        const elResultado = $(prefix + 'Resultado');
        const elIrrf      = $(prefix + 'Irrf');
        if (!elResultado || !elIrrf) return;

        if (elResultado.value === 'Negativo') {
            elIrrf.value = '0.00';
            elIrrf.readOnly = true;
            elIrrf.style.opacity = '0.55';
            elIrrf.style.cursor = 'not-allowed';
        } else {
            elIrrf.readOnly = false;
            elIrrf.style.opacity = '1';
            elIrrf.style.cursor = '';
        }
    }

    /* ─── Modal: Nova Operação ───────────────────────────────── */
    function openNewOperation() {
        const elData = $('opData');
        if (elData) elData.value = format().todayISO();

        const elResultado = $('opResultado');
        if (elResultado) elResultado.value = '';

        ['opValorBruto', 'opValorLiquido'].forEach(function (id) {
            const el = $(id); if (el) el.value = '';
        });
        ['opTaxaRegistro', 'opTaxasBmf', 'opIrrf'].forEach(function (id) {
            const el = $(id); if (el) el.value = '0.00';
        });

        updateIrrfState('op');
        openModalAndCloseSidebar('modalOperation');

        const first = $('opData');
        if (first) first.focus();
    }

    function submitNewOperation(e) {
        e.preventDefault();

        const data = ($('opData') || {}).value;
        if (!data) return;

        const r = computeLiquido('op');

        if (!r.resultado) {
            alert('Selecione o resultado do dia.');
            return;
        }

        store().addOperation({
            data: data,
            resultado: r.resultado,
            lucroBrutoCents:    r.bruto,
            taxaRegistroCents:  r.taxaRegistro,
            taxasBmfCents:      r.taxasBmf,
            irrfCents:          r.irrf,
            lucroLiquidoCents:  r.liquido
        });

        closeModal('modalOperation');
    }

    /* ─── Modal: Editar Operação ─────────────────────────────── */
    function openEditOperation(id) {
        const found = store().findOperation(id);
        if (!found) return;
        const op = found.op;

        setValue('editOpId', op.id);
        setValue('editOpData', op.data);
        setValue('editOpResultado', op.resultado);
        setValue('editOpValorBruto', Math.abs(format().fromCents(op.lucroBrutoCents)).toFixed(2));
        setValue('editOpTaxaRegistro', format().fromCents(op.taxaRegistroCents || 0).toFixed(2));
        setValue('editOpTaxasBmf',     format().fromCents(op.taxasBmfCents || 0).toFixed(2));
        setValue('editOpIrrf',         format().fromCents(op.irrfCents || 0).toFixed(2));

        updateIrrfState('editOp');
        refreshLiquido('editOp');

        openModalAndCloseSidebar('modalOperationEdit');
    }

    function submitEditOperation(e) {
        e.preventDefault();

        const id = ($('editOpId') || {}).value;
        if (!id) return;

        const r = computeLiquido('editOp');

        if (!r.resultado) {
            alert('Selecione o resultado do dia.');
            return;
        }

        store().updateOperation(id, {
            data: ($('editOpData') || {}).value,
            resultado: r.resultado,
            lucroBrutoCents:    r.bruto,
            taxaRegistroCents:  r.taxaRegistro,
            taxasBmfCents:      r.taxasBmf,
            irrfCents:          r.irrf,
            lucroLiquidoCents:  r.liquido
        });

        closeModal('modalOperationEdit');
    }

    function deleteOperation(id) {
        confirmDlg().ask({
            title: 'Excluir operação?',
            message: 'Esta ação não pode ser desfeita.',
            confirmText: 'Excluir',
            cancelText: 'Cancelar',
            variant: 'danger'
        }).then(function (confirmed) {
            if (confirmed) store().removeOperation(id);
        });
    }

    /* ─── Modal: Editar Aporte ───────────────────────────────── */
    function openEditAporte(id) {
        const found = store().findAporte(id);
        if (!found) return;

        setValue('editAporteId', found.item.id);
        setValue('editAporteData', found.item.data);
        setValue('editAporteValor', format().fromCents(found.item.amountCents).toFixed(2));

        openModalAndCloseSidebar('modalAporteEdit');
    }

    function submitEditAporte(e) {
        e.preventDefault();

        const id = ($('editAporteId') || {}).value;
        if (!id) return;

        store().updateAporte(id, {
            data: ($('editAporteData') || {}).value,
            amountCents: format().toCents(($('editAporteValor') || {}).value)
        });

        closeModal('modalAporteEdit');
    }

    function deleteAporte(id) {
        confirmDlg().ask({
            title: 'Excluir aporte?',
            message: 'Esta ação não pode ser desfeita.',
            confirmText: 'Excluir',
            cancelText: 'Cancelar',
            variant: 'danger'
        }).then(function (confirmed) {
            if (confirmed) store().removeAporte(id);
        });
    }

    /* ─── Modal: Editar Saque ────────────────────────────────── */
    function openEditSaque(id) {
        const found = store().findSaque(id);
        if (!found) return;

        setValue('editSaqueId', found.item.id);
        setValue('editSaqueData', found.item.data);
        setValue('editSaqueValor', format().fromCents(found.item.amountCents).toFixed(2));

        openModalAndCloseSidebar('modalSaqueEdit');
    }

    function submitEditSaque(e) {
        e.preventDefault();

        const id = ($('editSaqueId') || {}).value;
        if (!id) return;

        store().updateSaque(id, {
            data: ($('editSaqueData') || {}).value,
            amountCents: format().toCents(($('editSaqueValor') || {}).value)
        });

        closeModal('modalSaqueEdit');
    }

    function deleteSaque(id) {
        confirmDlg().ask({
            title: 'Excluir saque?',
            message: 'Esta ação não pode ser desfeita.',
            confirmText: 'Excluir',
            cancelText: 'Cancelar',
            variant: 'danger'
        }).then(function (confirmed) {
            if (confirmed) store().removeSaque(id);
        });
    }

    /* ─── Utilitário ─────────────────────────────────────────── */
    function setValue(id, value) {
        const el = $(id);
        if (el) el.value = value;
    }

    /* ─── Delegação de eventos ───────────────────────────────── */
    function handleClick(e) {
        const el = e.target.closest('[data-action]');
        if (!el) return;

        const action = el.dataset.action;
        const id = el.dataset.id;

        switch (action) {
            case 'operation-new':    openNewOperation(); return;
            case 'operation-edit':   if (id) openEditOperation(id); return;
            case 'operation-delete': if (id) deleteOperation(id); return;
            case 'aporte-edit':      if (id) openEditAporte(id); return;
            case 'aporte-delete':    if (id) deleteAporte(id); return;
            case 'saque-edit':       if (id) openEditSaque(id); return;
            case 'saque-delete':     if (id) deleteSaque(id); return;

            case 'modal-close': {
                const modalId = el.dataset.modal;
                if (modalId) closeModal(modalId);
                return;
            }
        }
    }

    function handleFieldChange(e) {
        const el = e.target;
        if (!el || !el.id) return;

        const id = el.id;

        if (id === 'opValorBruto' || id === 'opTaxaRegistro' ||
            id === 'opTaxasBmf'   || id === 'opIrrf') {
            refreshLiquido('op');
            return;
        }

        if (id === 'editOpValorBruto' || id === 'editOpTaxaRegistro' ||
            id === 'editOpTaxasBmf'   || id === 'editOpIrrf') {
            refreshLiquido('editOp');
            return;
        }

        if (id === 'opResultado') {
            updateIrrfState('op');
            refreshLiquido('op');
            return;
        }
        if (id === 'editOpResultado') {
            updateIrrfState('editOp');
            refreshLiquido('editOp');
            return;
        }
    }

    /* ─── Bind dos overlays e submits ────────────────────────── */
    function bindOverlayClose() {
        ['modalOperation', 'modalOperationEdit',
         'modalAporteEdit', 'modalSaqueEdit'].forEach(function (id) {
            const m = $(id);
            if (!m) return;
            m.addEventListener('click', function (e) {
                if (e.target === m) closeModal(id);
            });
        });
    }

    function bindForms() {
        const fNewOp = document.querySelector('[data-form="operation-new"]');
        if (fNewOp) fNewOp.addEventListener('submit', submitNewOperation);

        const fEditOp = document.querySelector('[data-form="operation-edit"]');
        if (fEditOp) fEditOp.addEventListener('submit', submitEditOperation);

        const fAporte = document.querySelector('[data-form="aporte-edit"]');
        if (fAporte) fAporte.addEventListener('submit', submitEditAporte);

        const fSaque = document.querySelector('[data-form="saque-edit"]');
        if (fSaque) fSaque.addEventListener('submit', submitEditSaque);
    }

    /* ─── Inicialização ─────────────────────────────────────── */
    function init() {
        document.addEventListener('click', handleClick);
        document.addEventListener('input', handleFieldChange);
        document.addEventListener('change', handleFieldChange);

        bindOverlayClose();
        bindForms();
    }

    global.Planis = global.Planis || {};
    global.Planis.modals = {
        init,
        openNewOperation,
        openEditOperation,
        openEditAporte,
        openEditSaque,
        closeModal
    };
})(window);