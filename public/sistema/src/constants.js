/* ═══════════════════════════════════════════════════════════════
   Planix TraderMax · src/constants.js
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
    'use strict';

    const APP = {
        name:      'Planix TraderMax',
        shortName: 'Planix',
        version:   '0.1.0'
    };

    const MONTHS_LONG = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const MONTHS_SHORT = [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];

    const STORAGE_PREFIX = 'planix.tradermax.';

    const STORAGE_KEYS = {
        DATA:    'data',
        PREFS:   'prefs',
        THEME:   'theme',
        IDS:     'ids',
        VERSION: 'version'
    };

    const ITEMS_PER_PAGE = 10;

    const RESULT = {
        POSITIVE: 'Positivo',
        NEGATIVE: 'Negativo'
    };

    const VIEWS = {
        DASHBOARD:   'dashboard',
        APORTES:     'aportes',
        SAQUES:      'saques',
        PERFORMANCE: 'performance',
        BACKUP:      'backup'
    };

    const EVENTS = {
        STATE_CHANGED: 'state:changed'
    };

    global.Planis = global.Planis || {};
    global.Planis.constants = {
        APP,
        MONTHS_LONG,
        MONTHS_SHORT,
        STORAGE_PREFIX,
        STORAGE_KEYS,
        ITEMS_PER_PAGE,
        RESULT,
        VIEWS,
        EVENTS
    };
})(window);