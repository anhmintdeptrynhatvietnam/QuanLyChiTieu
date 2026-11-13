/**
 * Main Application Bootstrap & Orchestrator (Phase 02)
 */
import { stateStore } from './state.js';
import { Dashboard } from './components/dashboard.js';
import { TransactionList } from './components/transaction-list.js';
import { Wallets } from './components/wallets.js';
import { Debts } from './components/debts.js';
import { Budgets } from './components/budgets.js';
import { Analytics } from './components/analytics.js';
import { Settings } from './components/settings.js';
import { TransactionModal } from './components/transaction-modal.js';
import { ExportImportService } from './services/export-import.js';
import { confirmDialog } from './components/confirm-dialog.js';
import { showToast } from './components/toast.js';
import { initTheme, getThemePreference, setThemePreference } from './ui/theme.js';
import { initRouter, navigate, currentView } from './ui/router.js';
import { setupSyncStatusSubscriber } from './ui/sync-badge.js';
import { MoreView } from './views/more/more-view.js';

class App {
  constructor() {
    this.modal = null;
  }

  get theme() {
    return document.documentElement?.dataset?.theme || 'light';
  }

  get currentView() {
    return currentView();
  }

  init() {
    initTheme();
    window.setAppTheme = (theme) => setThemePreference(theme);
    window.getAppTheme = () => this.theme;

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
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then((reg) => console.log('PWA Service Worker registered successfully:', reg.scope))
          .catch((err) => console.warn('PWA Service Worker registration failed:', err));
      });
    }
  }

  initComponents() {
    window.transactionModal = new TransactionModal();
    this.modal = window.transactionModal;

    this.dashboard = new Dashboard('view-dashboard');
    this.txList = new TransactionList('view-transactions');
    this.wallets = new Wallets('view-wallets');
    this.debts = new Debts('view-debts');
    this.budgets = new Budgets('view-budgets');
    this.analytics = new Analytics('view-analytics');
    this.settings = new Settings('view-settings');
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
        if (viewId === 'analytics' && this.analytics) this.analytics.render();
        if (viewId === 'dashboard' && this.dashboard) this.dashboard.render();
        if (viewId === 'debts' && this.debts) this.debts.render();
        if (viewId === 'more' && this.more) this.more.render();
        this.renderIcons();
      }
    });
  }

  switchView(viewId) {
    navigate(viewId);
  }

  setupActionButtons() {
    const handleAdd = () => {
      if (this.modal && typeof this.modal.open === 'function') {
        this.modal.open();
      }
    };
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
  window.appInstance = app;
});
