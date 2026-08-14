/**
 * Main Application Bootstrap & Orchestrator
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
import { googleAuthService } from './services/google-auth.js';

const viewTitles = {
  dashboard: 'Tổng quan',
  transactions: 'Giao dịch',
  wallets: 'Sổ ví & Tài khoản',
  debts: 'Sổ Vay & Nợ',
  budgets: 'Hạn mức ngân sách',
  analytics: 'Báo cáo & Phân tích',
  settings: 'Cài đặt & Đồng bộ'
};

class App {
  constructor() {
    this.currentView = 'dashboard';
    this.theme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    this.modal = null;
  }

  init() {
    this.applyTheme(this.theme);
    this.initComponents();
    this.setupNavigation();
    this.setupThemeToggle();
    this.setupActionButtons();
    this.setupSyncStatusSubscriber();
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

    // Init Google Auth if Client ID exists
    const clientId = stateStore.getState().settings.googleClientId;
    if (clientId) googleAuthService.init(clientId);
  }

  applyTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');

    if (themeIcon && themeText) {
      if (theme === 'dark') {
        themeIcon.setAttribute('data-lucide', 'sun');
        themeText.textContent = 'Chế độ sáng';
      } else {
        themeIcon.setAttribute('data-lucide', 'moon');
        themeText.textContent = 'Chế độ tối';
      }
      this.renderIcons();
    }
  }

  setupThemeToggle() {
    const toggleBtn = document.getElementById('btn-theme-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.applyTheme(this.theme === 'dark' ? 'light' : 'dark');
      });
    }
  }

  setupNavigation() {
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const viewId = e.currentTarget.getAttribute('data-view');
        this.switchView(viewId);
      });
    });
  }

  switchView(viewId) {
    if (!viewTitles[viewId]) return;
    this.currentView = viewId;

    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-view') === viewId);
    });

    document.querySelectorAll('.view-section').forEach(section => {
      section.classList.toggle('active', section.id === `view-${viewId}`);
    });

    const pageTitle = document.getElementById('page-title');
    if (pageTitle) pageTitle.textContent = viewTitles[viewId];

    if (viewId === 'analytics') this.analytics.render();
    if (viewId === 'dashboard') this.dashboard.render();
    if (viewId === 'debts') this.debts.render();

    this.renderIcons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  setupActionButtons() {
    const addBtnHeader = document.getElementById('btn-add-transaction-header');
    const fabBtn = document.getElementById('btn-fab-add');

    const handleAdd = () => this.modal.open();
    if (addBtnHeader) addBtnHeader.addEventListener('click', handleAdd);
    if (fabBtn) fabBtn.addEventListener('click', handleAdd);
  }

  setupSyncStatusSubscriber() {
    stateStore.subscribe((event, data, state) => {
      const badge = document.getElementById('sync-status-badge');
      const textEl = document.getElementById('sync-status-text');
      if (!badge || !textEl) return;

      const isConnected = googleAuthService.getValidToken() !== null;
      badge.className = `badge ${isConnected ? 'badge-income' : 'badge-subtle'}`;
      textEl.textContent = state.syncStatus.message || (isConnected ? 'Đã kết nối' : 'Chưa kết nối Google');

      const icon = badge.querySelector('i');
      if (icon) {
        icon.setAttribute('data-lucide', isConnected ? 'cloud' : 'cloud-off');
        this.renderIcons();
      }
    });
  }

  renderIcons() {
    if (window.lucide) window.lucide.createIcons();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
  window.appInstance = app;
});
