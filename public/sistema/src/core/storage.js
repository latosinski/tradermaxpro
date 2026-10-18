/* ═══════════════════════════════════════════════════════════════
   Planix TraderMax · src/core/storage.js
   ───────────────────────────────────────────────────────────────
   Wrapper de persistência key-value.

   Backends:
   - SQLite via IPC (window.planix.db) — quando rodando no Electron.
   - localStorage                     — fallback para navegador/dev.

   Estratégia:
   - Cache em memória no renderer é a fonte de verdade síncrona.
   - init() carrega o cache a partir do backend (uma vez, no boot).
   - read()  lê direto do cache (síncrono).
   - write() atualiza o cache e propaga ao backend (fire-and-forget).
   - remove() remove do cache e do backend.
   - clearAll() limpa apenas as chaves do namespace.

   Chaves no backend incluem o prefixo (ex.: "planix.tradermax.data").
   Chaves no cache são curtas (ex.: "data").

   Não conhece nenhum dado específico do domínio.
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
    'use strict';

    const constants = () => global.Planis.constants;

    /* Cache em memória (chave curta → valor serializado). */
    const cache = {};

    /* ─── Detecção de backend ────────────────────────────────── */
    function hasSqliteBridge() {
        return !!(global.planix &&
                  global.planix.db &&
                  typeof global.planix.db.get === 'function');
    }

    let _lsAvailable = null;
    function lsAvailable() {
        if (_lsAvailable !== null) return _lsAvailable;
        try {
            const k = '__planix_probe__';
            localStorage.setItem(k, '1');
            localStorage.removeItem(k);
            _lsAvailable = true;
        } catch (e) {
            _lsAvailable = false;
        }
        return _lsAvailable;
    }

    /* ─── Chave completa no backend ──────────────────────────── */
    function buildKey(name) {
        return constants().STORAGE_PREFIX + name;
    }

    /* ─── Serialização ───────────────────────────────────────── */
    function serialize(value) {
        return JSON.stringify(value);
    }

    function deserialize(raw, fallback) {
        if (raw === null || raw === undefined) return fallback;
        try {
            return JSON.parse(raw);
        } catch (e) {
            console.warn('[storage] valor corrompido em cache:', e);
            return fallback;
        }
    }

    /* ─── Inicialização ──────────────────────────────────────── */
    /* Carrega todas as chaves do backend para o cache.
       DEVE ser chamado uma vez no boot, antes de qualquer read.
       Retorna Promise (o boot é async). */
    async function init() {
        if (hasSqliteBridge()) {
            try {
                const prefix = constants().STORAGE_PREFIX;
                const fullKeys = await global.planix.db.getAllKeys();

                for (let i = 0; i < fullKeys.length; i++) {
                    const fullKey = fullKeys[i];
                    if (fullKey.indexOf(prefix) !== 0) continue;

                    const shortKey = fullKey.substring(prefix.length);
                    const raw = await global.planix.db.get(fullKey);
                    if (raw !== null && raw !== undefined) {
                        cache[shortKey] = raw;
                    }
                }
            } catch (err) {
                console.error('[storage] falha ao carregar cache do SQLite:', err);
            }
            return;
        }

        /* Fallback localStorage */
        if (!lsAvailable()) return;

        const prefix = constants().STORAGE_PREFIX;
        for (let i = 0; i < localStorage.length; i++) {
            const fullKey = localStorage.key(i);
            if (!fullKey || fullKey.indexOf(prefix) !== 0) continue;

            const shortKey = fullKey.substring(prefix.length);
            cache[shortKey] = localStorage.getItem(fullKey);
        }
    }

    /* ─── Disponibilidade ────────────────────────────────────── */
    function available() {
        return hasSqliteBridge() || lsAvailable();
    }

    /* ─── Leitura (síncrona, do cache) ───────────────────────── */
    function read(name, fallback) {
        if (Object.prototype.hasOwnProperty.call(cache, name)) {
            return deserialize(cache[name], fallback);
        }
        return fallback;
    }

    /* ─── Escrita (cache + backend async) ────────────────────── */
    function write(name, value) {
        const raw = serialize(value);
        cache[name] = raw;

        if (hasSqliteBridge()) {
            global.planix.db.set(buildKey(name), raw).catch(function (err) {
                console.error('[storage] falha ao persistir "' + name + '":', err);
            });
            return true;
        }

        if (!lsAvailable()) return false;
        try {
            localStorage.setItem(buildKey(name), raw);
            return true;
        } catch (e) {
            console.warn('[storage] falha ao gravar "' + name + '":', e);
            return false;
        }
    }

    /* ─── Remoção ────────────────────────────────────────────── */
    function remove(name) {
        delete cache[name];

        if (hasSqliteBridge()) {
            global.planix.db.delete(buildKey(name)).catch(function (err) {
                console.error('[storage] falha ao remover "' + name + '":', err);
            });
            return true;
        }

        if (!lsAvailable()) return false;
        try {
            localStorage.removeItem(buildKey(name));
            return true;
        } catch (e) {
            return false;
        }
    }

    /* ─── Limpar tudo do namespace ───────────────────────────── */
    function clearAll() {
        /* Cache */
        Object.keys(cache).forEach(function (k) { delete cache[k]; });

        if (hasSqliteBridge()) {
            const prefix = constants().STORAGE_PREFIX;
            global.planix.db.getAllKeys().then(function (allKeys) {
                allKeys.forEach(function (fullKey) {
                    if (fullKey.indexOf(prefix) === 0) {
                        global.planix.db.delete(fullKey).catch(function () { /* ignora */ });
                    }
                });
            }).catch(function (err) {
                console.error('[storage] falha ao limpar backend:', err);
            });
            return;
        }

        if (!lsAvailable()) return;
        const prefix = constants().STORAGE_PREFIX;
        const toRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.indexOf(prefix) === 0) toRemove.push(k);
        }
        toRemove.forEach(function (k) {
            try { localStorage.removeItem(k); } catch (e) { /* ignora */ }
        });
    }

    /* ─── Exporta ────────────────────────────────────────────── */
    global.Planis = global.Planis || {};
    global.Planis.storage = {
        init,
        available,
        read,
        write,
        remove,
        clearAll
    };
})(window);