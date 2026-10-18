/* ═══════════════════════════════════════════════════════════════
   Planix TraderMax · src/ui/navigation.js
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
    'use strict';

    const state     = () => global.Planis.state;
    const constants = () => global.Planis.constants;

    const $sidebar    = () => document.getElementById('sidebar');
    const $overlay    = () => document.getElementById('sidebarOverlay');
    const $pageTitle  = () => document.getElementById('pageTitle');
    const $breadcrumb = () => document.getElementById('pageBreadcrumb');

    function openSidebar() {
        const s = $sidebar(); const o = $overlay();
        if (s) s.classList.add('open');
        if (o) o.classList.add('active');
    }

    function closeSidebar() {
        const s = $sidebar(); const o = $overlay();
        if (s) s.classList.remove('open');
        if (o) o.classList.remove('active');
    }

    function isSidebarOpen() {
        const s = $sidebar();
        return !!(s && s.classList.contains('open'));
    }

    function updatePageTitle() {
        const s = state().getAll();
        const title = $pageTitle();
        const crumb = $breadcrumb();

        let main = 'Dashboard';
        const year  = s.viewingYear;
        const view  = s.currentView;
        const month = s.currentMonth;

        if (view === constants().VIEWS.DASHBOARD) {
            if (month === 'all') main = 'Dashboard ' + year;
            else                 main = constants().MONTHS_LONG[month] + ' ' + year;
        } else if (view === constants().VIEWS.APORTES) {
            main = 'Aportes ' + year;
        } else if (view === constants().VIEWS.SAQUES) {
            main = 'Saques ' + year;
        } else if (view === constants().VIEWS.PERFORMANCE) {
            main = 'Performance ' + year;
        } else if (view === constants().VIEWS.BACKUP) {
            main = 'Backup';
        }

        if (title) title.textContent = main;
        if (crumb) crumb.textContent = constants().APP.name;
    }

    function updateActiveNav() {
        const s = state().getAll();

        document.querySelectorAll('.nav-item[data-action="view"]').forEach(function (el) {
            const isDashboard = el.dataset.view === constants().VIEWS.DASHBOARD;
            if (isDashboard) {
                const active = (s.currentView === 'dashboard' && s.currentMonth === 'all');
                el.classList.toggle('active', active);
            } else {
                el.classList.toggle('active', el.dataset.view === s.currentView);
            }
        });

        document.querySelectorAll('.nav-item[data-action="month"]').forEach(function (el) {
            const m = parseInt(el.dataset.month, 10);
            const active = (s.currentView === 'dashboard' && s.currentMonth === m);
            el.classList.toggle('active', active);
        });
    }

    function handleClick(e) {
        const el = e.target.closest('[data-action]');
        if (!el) return;

        if (el.classList.contains('nav-item') && isSidebarOpen()) closeSidebar();

        const action = el.dataset.action;

        if (action === 'view') {
            const view = el.dataset.view;
            if (view) state().setCurrentView(view);
            return;
        }

        if (action === 'month') {
            const m = parseInt(el.dataset.month, 10);
            if (!Number.isFinite(m)) return;
            state().setCurrentMonth(m);
            return;
        }

        if (action === 'theme-toggle') {
            if (global.Planis.theme) global.Planis.theme.toggle();
            return;
        }
    }

    function handleKeyDown(e) {
        if (e.key === 'Escape' && isSidebarOpen()) closeSidebar();
    }

    function bindMobileControls() {
        const btn = document.getElementById('menuToggle');
        if (btn) btn.addEventListener('click', openSidebar);

        const closeBtn = document.getElementById('sidebarCloseBtn');
        if (closeBtn) closeBtn.addEventListener('click', closeSidebar);

        const o = $overlay();
        if (o) o.addEventListener('click', closeSidebar);
    }

    function onStateChanged() {
        updatePageTitle();
        updateActiveNav();
    }

    function init() {
        document.addEventListener('click', handleClick);
        document.addEventListener('keydown', handleKeyDown);
        bindMobileControls();

        state().on(constants().EVENTS.STATE_CHANGED, onStateChanged);

        updatePageTitle();
        updateActiveNav();
    }

    global.Planis = global.Planis || {};
    global.Planis.navigation = {
        init,
        openSidebar,
        closeSidebar,
        updatePageTitle,
        updateActiveNav
    };
})(window);