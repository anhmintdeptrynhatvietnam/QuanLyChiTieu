/**
 * Main Application Bootstrap & Orchestrator
 */
import { registerServiceWorker } from './ui/sw-update.js';
import { stateStore } from './state.js';
import { DashboardView } from './views/dashboard/dashboard-view.js';
import { TransactionsView } from './views/transactions/transactions-view.js';
import { WalletsView } from './views/wallets/wallets-view.js';
import { DebtsView } from './views/debts/debts-view.js';
import { BudgetsView } from './views/budgets/budgets-view.js';
import { AnalyticsView } from './views/analytics/analytics-view.js';
import { SettingsView } from './views/settings/settings-view.js';
import { ExportImportService } from './services/export-import.js';
import { confirmDialog } from './components/confirm-dialog.js';
import { showToast } from './components/toast.js';
import { initTheme, getThemePreference, setThemePreference } from './ui/theme.js';
import { initRouter, navigate, currentView } from './ui/router.js';
import { setupSyncStatusSubscriber } from './ui/sync-badge.js';
import { MoreView } from './views/more/more-view.js';
import { openTransactionSheet } from './views/transaction-sheet/transaction-sheet.js';

class App {
  get theme() {
    return document.documentElement?.dataset?.theme || 'light';
  }

  get currentView() {
    return currentView();
  }

  init() {
    initTheme();
    this.initComponents();
    this.setupThemeToggle();
    this.setupThemeListener();
    this.setupActionButtons();
    setupSyncStatusSubscriber();
    this.setupRouter();
    this.registerServiceWorker();
    this.renderIcons();
  }

  registerServiceWorker() {
    registerServiceWorker('./sw.js');
  }

  initComponents() {
    this.dashboard = new DashboardView('view-dashboard');
    this.txList = new TransactionsView('view-transactions');
    this.wallets = new WalletsView('view-wallets');
    this.debts = new DebtsView('view-debts');
    this.budgets = new BudgetsView('view-budgets');
    this.analytics = new AnalyticsView('view-analytics');
    this.settings = new SettingsView('view-settings');
    this.more = new MoreView('view-more');

    // Cloud sign-in preparation (legacy migration, first sign-in choice) needs these UI hooks.
    stateStore.setCloudSessionUi({
      confirm: confirmDialog,
      backupLocal: () => ExportImportService.exportJSON(),
      notify: showToast
    });
  }

  setupThemeListener() {
    window.addEventListener('themechange', () => {
      this.updateSidebarThemeButton();
      // Charts read CSS variables at creation time, so they go stale on toggle
      if (currentView() === 'analytics' && this.analytics) {
        this.analytics.render();
      }
      if (currentView() === 'settings' && this.settings) {
        this.settings.render();
      }
    });
  }

  setupThemeToggle() {
    const toggleBtn = document.getElementById('btn-theme-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const pref = getThemePreference();
        const nextPref = pref === 'light' ? 'dark' : pref === 'dark' ? 'system' : 'light';
        setThemePreference(nextPref);
      });
    }
    this.updateSidebarThemeButton();
  }

  updateSidebarThemeButton() {
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');
    if (!themeIcon || !themeText) return;

    const pref = getThemePreference();
    if (pref === 'dark') {
      themeIcon.setAttribute('data-lucide', 'moon');
      themeText.textContent = 'Chế độ tối';
    } else if (pref === 'light') {
      themeIcon.setAttribute('data-lucide', 'sun');
      themeText.textContent = 'Chế độ sáng';
    } else {
      themeIcon.setAttribute('data-lucide', 'monitor');
      themeText.textContent = 'Theo hệ thống';
    }
    this.renderIcons();
  }

  setupRouter() {
    initRouter({
      onChange: (viewId) => {
        // Views may skip re-rendering while hidden, so always refresh the one being shown.
        const views = {
          dashboard: this.dashboard, transactions: this.txList, wallets: this.wallets, debts: this.debts,
          budgets: this.budgets, analytics: this.analytics, settings: this.settings, more: this.more
        };
        views[viewId]?.render?.();
        this.renderIcons();
      }
    });
  }

  switchView(viewId) {
    navigate(viewId);
  }

  setupActionButtons() {
    const handleAdd = () => openTransactionSheet();
    const addBtnHeader = document.getElementById('btn-add-transaction-header');
    const fabBtn = document.getElementById('btn-fab-add');

    if (addBtnHeader) addBtnHeader.addEventListener('click', handleAdd);
    if (fabBtn) fabBtn.addEventListener('click', handleAdd);
  }

  renderIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
