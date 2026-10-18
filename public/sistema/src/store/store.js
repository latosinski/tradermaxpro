/* ═══════════════════════════════════════════════════════════════
   Planix TraderMax · src/store/store.js
   ───────────────────────────────────────────────────────────────
   Modelo de dados da aplicação. Fonte única de verdade.

   Estrutura em memória:
     allData[ano].months[mes] = { ops: [], aportes: [], saques: [] }

   Cada operação:
     { id, data, resultado,
       lucroBrutoCents, taxaRegistroCents, taxasBmfCents,
       irrfCents, lucroLiquidoCents }

   Cada aporte/saque:
     { id, data, amountCents }

   Regras:
   - Toda mutação salva automaticamente em localStorage.
   - Toda mutação emite o evento "store:changed" via core/state.
   - Ordenação por data é mantida após cada inserção/edição.
   - Nenhuma lógica fiscal vive aqui.
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
    'use strict';

    const storage   = () => global.Planis.storage;
    const constants = () => global.Planis.constants;
    const state     = () => global.Planis.state;
    const ids       = () => global.Planis.ids;

    /* ─── Estado interno ─────────────────────────────────────── */
    let allData = {};

    const SCHEMA_VERSION = 1;

    /* ─── Estrutura ──────────────────────────────────────────── */
    function blankMonth() {
        return { ops: [], aportes: [], saques: [] };
    }

    function blankYear() {
        const months = {};
        for (let m = 0; m < 12; m++) months[m] = blankMonth();
        return { months };
    }

    /* ─── Persistência ───────────────────────────────────────── */
    function save() {
        const payload = {
            version: SCHEMA_VERSION,
            data: allData
        };
        storage().write(constants().STORAGE_KEYS.DATA, payload);
    }

    function load() {
        const raw = storage().read(constants().STORAGE_KEYS.DATA, null);

        if (!raw || typeof raw !== 'object' || !raw.data) {
            allData = {};
            return;
        }

        if (raw.version !== SCHEMA_VERSION) {
            console.warn(
                '[store] schema salvo v' + raw.version +
                ' incompatível com v' + SCHEMA_VERSION +
                ' — dados ignorados.'
            );
            allData = {};
            return;
        }

        allData = {};
        const src = raw.data;

        Object.keys(src).forEach(function (yearKey) {
            const year = parseInt(yearKey, 10);
            if (!Number.isFinite(year)) return;

            const source = src[yearKey];
            if (!source || typeof source !== 'object' || !source.months) return;

            const entry = blankYear();
            for (let m = 0; m < 12; m++) {
                const srcMonth = source.months[m] || source.months[String(m)];
                if (!srcMonth) continue;
                entry.months[m] = {
                    ops:     Array.isArray(srcMonth.ops)     ? srcMonth.ops.slice()     : [],
                    aportes: Array.isArray(srcMonth.aportes) ? srcMonth.aportes.slice() : [],
                    saques:  Array.isArray(srcMonth.saques)  ? srcMonth.saques.slice()  : []
                };
            }
            allData[year] = entry;
        });
    }

    /* ─── Notificação ────────────────────────────────────────── */
    function commit() {
        save();
        state().emit('store:changed', {});
    }

    /* ─── Utilitários ────────────────────────────────────────── */
    function sortByDate(arr) {
        arr.sort(function (a, b) { return a.data.localeCompare(b.data); });
    }

    function ensureYear(year) {
        if (!allData[year]) allData[year] = blankYear();
        return allData[year];
    }

    function parseMonthFromISO(iso) {
        const parts = String(iso).split('-');
        return parseInt(parts[1], 10) - 1;
    }

    function parseYearFromISO(iso) {
        const parts = String(iso).split('-');
        return parseInt(parts[0], 10);
    }

    /* ─── Ciclo de vida ──────────────────────────────────────── */
    function init() {
        load();
        const prefs = state().get('yearPrefs');
        for (let y = prefs.start; y <= prefs.end; y++) ensureYear(y);
        state().emit('store:changed', {});
    }

    function reset() {
        allData = {};
        const prefs = state().get('yearPrefs');
        for (let y = prefs.start; y <= prefs.end; y++) ensureYear(y);
        commit();
    }

    /* ─── Acesso ─────────────────────────────────────────────── */
    function getYear(year) {
        return allData[year] || blankYear();
    }

    function hasYear(year) {
        return !!allData[year];
    }

    function listYears() {
        return Object.keys(allData).map(Number).sort(function (a, b) { return a - b; });
    }

    function getOps(year, month) {
        const y = getYear(year);
        const m = y.months[month];
        return m ? m.ops.slice() : [];
    }

    function getAportes(year, month) {
        const y = getYear(year);
        const m = y.months[month];
        return m ? m.aportes.slice() : [];
    }

    function getSaques(year, month) {
        const y = getYear(year);
        const m = y.months[month];
        return m ? m.saques.slice() : [];
    }

    function getAllOps(year) {
        const y = getYear(year);
        const out = [];
        for (let m = 0; m < 12; m++) {
            if (y.months[m]) out.push.apply(out, y.months[m].ops);
        }
        return out;
    }

    function getAllAportes(year) {
        const y = getYear(year);
        const out = [];
        for (let m = 0; m < 12; m++) {
            if (y.months[m]) out.push.apply(out, y.months[m].aportes);
        }
        return out;
    }

    function getAllSaques(year) {
        const y = getYear(year);
        const out = [];
        for (let m = 0; m < 12; m++) {
            if (y.months[m]) out.push.apply(out, y.months[m].saques);
        }
        return out;
    }

    /* Snapshot bruto — leitura apenas. Uso: domain/tax.calcularCadeiaImpostos.
       Não mutar externamente. */
    function getRawSnapshot() {
        return allData;
    }

    /* ─── Localização por ID ─────────────────────────────────── */
    function findOperation(id) {
        const years = Object.keys(allData);
        for (let yi = 0; yi < years.length; yi++) {
            const year = years[yi];
            const y = allData[year];
            for (let m = 0; m < 12; m++) {
                const arr = y.months[m].ops;
                for (let i = 0; i < arr.length; i++) {
                    if (arr[i].id === id) {
                        return { op: arr[i], year: parseInt(year, 10), month: m, index: i };
                    }
                }
            }
        }
        return null;
    }

    function findAporte(id) {
        const years = Object.keys(allData);
        for (let yi = 0; yi < years.length; yi++) {
            const year = years[yi];
            const y = allData[year];
            for (let m = 0; m < 12; m++) {
                const arr = y.months[m].aportes;
                for (let i = 0; i < arr.length; i++) {
                    if (arr[i].id === id) {
                        return { item: arr[i], year: parseInt(year, 10), month: m, index: i };
                    }
                }
            }
        }
        return null;
    }

    function findSaque(id) {
        const years = Object.keys(allData);
        for (let yi = 0; yi < years.length; yi++) {
            const year = years[yi];
            const y = allData[year];
            for (let m = 0; m < 12; m++) {
                const arr = y.months[m].saques;
                for (let i = 0; i < arr.length; i++) {
                    if (arr[i].id === id) {
                        return { item: arr[i], year: parseInt(year, 10), month: m, index: i };
                    }
                }
            }
        }
        return null;
    }

    /* ─── Operações — CRUD ───────────────────────────────────── */
    function addOperation(opData) {
        const year  = parseYearFromISO(opData.data);
        const month = parseMonthFromISO(opData.data);

        ensureYear(year);

        const op = {
            id: ids().next('op'),
            data: opData.data,
            resultado: opData.resultado,
            lucroBrutoCents:    opData.lucroBrutoCents,
            taxaRegistroCents:  opData.taxaRegistroCents,
            taxasBmfCents:      opData.taxasBmfCents,
            irrfCents:          opData.irrfCents,
            lucroLiquidoCents:  opData.lucroLiquidoCents
        };

        allData[year].months[month].ops.push(op);
        sortByDate(allData[year].months[month].ops);
        commit();
        return op;
    }

    function updateOperation(id, changes) {
        const found = findOperation(id);
        if (!found) return null;

        const currentYear  = found.year;
        const currentMonth = found.month;

        allData[currentYear].months[currentMonth].ops.splice(found.index, 1);

        const op = found.op;
        if (changes.data !== undefined)       op.data = changes.data;
        if (changes.resultado !== undefined)  op.resultado = changes.resultado;
        if (changes.lucroBrutoCents !== undefined)   op.lucroBrutoCents = changes.lucroBrutoCents;
        if (changes.taxaRegistroCents !== undefined) op.taxaRegistroCents = changes.taxaRegistroCents;
        if (changes.taxasBmfCents !== undefined)     op.taxasBmfCents = changes.taxasBmfCents;
        if (changes.irrfCents !== undefined)         op.irrfCents = changes.irrfCents;
        if (changes.lucroLiquidoCents !== undefined) op.lucroLiquidoCents = changes.lucroLiquidoCents;

        const newYear  = parseYearFromISO(op.data);
        const newMonth = parseMonthFromISO(op.data);

        ensureYear(newYear);
        allData[newYear].months[newMonth].ops.push(op);
        sortByDate(allData[newYear].months[newMonth].ops);

        commit();
        return op;
    }

    function removeOperation(id) {
        const found = findOperation(id);
        if (!found) return false;
        allData[found.year].months[found.month].ops.splice(found.index, 1);
        commit();
        return true;
    }

    /* ─── Aportes — CRUD ─────────────────────────────────────── */
    function addAporte(aporteData) {
        const year  = parseYearFromISO(aporteData.data);
        const month = parseMonthFromISO(aporteData.data);

        ensureYear(year);

        const aporte = {
            id: ids().next('ap'),
            data: aporteData.data,
            amountCents: aporteData.amountCents
        };

        allData[year].months[month].aportes.push(aporte);
        sortByDate(allData[year].months[month].aportes);
        commit();
        return aporte;
    }

    function updateAporte(id, changes) {
        const found = findAporte(id);
        if (!found) return null;

        const currentYear  = found.year;
        const currentMonth = found.month;

        allData[currentYear].months[currentMonth].aportes.splice(found.index, 1);

        const aporte = found.item;
        if (changes.data !== undefined)        aporte.data = changes.data;
        if (changes.amountCents !== undefined) aporte.amountCents = changes.amountCents;

        const newYear  = parseYearFromISO(aporte.data);
        const newMonth = parseMonthFromISO(aporte.data);

        ensureYear(newYear);
        allData[newYear].months[newMonth].aportes.push(aporte);
        sortByDate(allData[newYear].months[newMonth].aportes);

        commit();
        return aporte;
    }

    function removeAporte(id) {
        const found = findAporte(id);
        if (!found) return false;
        allData[found.year].months[found.month].aportes.splice(found.index, 1);
        commit();
        return true;
    }

    /* ─── Saques — CRUD ──────────────────────────────────────── */
    function addSaque(saqueData) {
        const year  = parseYearFromISO(saqueData.data);
        const month = parseMonthFromISO(saqueData.data);

        ensureYear(year);

        const saque = {
            id: ids().next('sq'),
            data: saqueData.data,
            amountCents: saqueData.amountCents
        };

        allData[year].months[month].saques.push(saque);
        sortByDate(allData[year].months[month].saques);
        commit();
        return saque;
    }

    function updateSaque(id, changes) {
        const found = findSaque(id);
        if (!found) return null;

        const currentYear  = found.year;
        const currentMonth = found.month;

        allData[currentYear].months[currentMonth].saques.splice(found.index, 1);

        const saque = found.item;
        if (changes.data !== undefined)        saque.data = changes.data;
        if (changes.amountCents !== undefined) saque.amountCents = changes.amountCents;

        const newYear  = parseYearFromISO(saque.data);
        const newMonth = parseMonthFromISO(saque.data);

        ensureYear(newYear);
        allData[newYear].months[newMonth].saques.push(saque);
        sortByDate(allData[newYear].months[newMonth].saques);

        commit();
        return saque;
    }

    function removeSaque(id) {
        const found = findSaque(id);
        if (!found) return false;
        allData[found.year].months[found.month].saques.splice(found.index, 1);
        commit();
        return true;
    }

    /* ─── Estatísticas rápidas ───────────────────────────────── */
    function getStats(year) {
        const y = getYear(year);
        let ops = 0, aportes = 0, saques = 0;
        for (let m = 0; m < 12; m++) {
            if (!y.months[m]) continue;
            ops     += y.months[m].ops.length;
            aportes += y.months[m].aportes.length;
            saques  += y.months[m].saques.length;
        }
        return { ops: ops, aportes: aportes, saques: saques };
    }

    /* ─── Exporta ────────────────────────────────────────────── */
    global.Planis = global.Planis || {};
    global.Planis.store = {
        init,
        reset,

        getYear,
        hasYear,
        listYears,
        getOps,
        getAportes,
        getSaques,
        getAllOps,
        getAllAportes,
        getAllSaques,
        getRawSnapshot,

        findOperation,
        findAporte,
        findSaque,

        addOperation,
        updateOperation,
        removeOperation,

        addAporte,
        updateAporte,
        removeAporte,

        addSaque,
        updateSaque,
        removeSaque,

        getStats
    };
})(window);