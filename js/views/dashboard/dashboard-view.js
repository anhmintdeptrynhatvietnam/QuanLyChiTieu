/**
 * Dashboard View (Tổng quan)
 * Redesigned primary overview view with hero asset balance card, monthly totals,
 * one-line debt summary, budget alerts, and recent transactions.
 */
import { stateStore } from '../../state.js';
import { getMonthYear } from '../../utils/formatters.js';
import { attachPrivacyListeners } from '../../utils/privacy.js';
import { refreshIcons } from '../../ui/icons.js';
import { navigate } from '../../ui/router.js';
import { bindTransactionRows } from '../../ui/transaction-row.js';
import { openTransactionSheet } from '../transaction-sheet/transaction-sheet.js';
import { monthSummary, budgetAlerts } from '../../domain/period-summary.js';
import {
  renderHeroCard,
  renderDebtBanner,
  renderBudgetCard,
  renderRecentSection
} from './dashboard-cards.js';

export class DashboardView {
  constructor(containerId = 'view-dashboard') {
    this.container = document.getElementById(containerId);
    this.init();
  }

  init() {
    this.render();
    this.unsubscribe = stateStore.subscribe(() => this.render());
  }

  destroy() {
    if (typeof this.unsubscribe === 'function') {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  render() {
    if (!this.container) return;

    const state = stateStore.getState();
    const currentMonth = getMonthYear();

    const monthSum = monthSummary(state.transactions || [], currentMonth);
    const alerts = budgetAlerts(
      state.budgets || [],
      state.transactions || [],
      state.categories || [],
      currentMonth,
      0.8
    );

    this.container.innerHTML = `
      <div class="dashboard-container">
        <div class="dashboard-columns">
          <div class="dashboard-col-left flex flex-col gap-4">
            ${renderHeroCard(state.wallets, monthSum)}
            ${renderDebtBanner(state.debts)}
            ${renderBudgetCard(alerts)}
          </div>
          <div class="dashboard-col-right flex flex-col gap-4">
            ${renderRecentSection(state.transactions, state.wallets, state.categories)}
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    refreshIcons(this.container);
  }

  bindEvents() {
    if (!this.container) return;

    // Attach row click listeners (opens edit sheet)
    bindTransactionRows(this.container);

    // Attach privacy eye button toggle listeners
    attachPrivacyListeners(this.container, () => this.render());

    // View All transactions button
    const viewAllBtn = this.container.querySelector('#btn-view-all-tx');
    if (viewAllBtn) {
      viewAllBtn.addEventListener('click', () => {
        navigate('transactions');
      });
    }

    // Go to Debts button
    const gotoDebtsBtn = this.container.querySelector('#btn-goto-debts');
    if (gotoDebtsBtn) {
      gotoDebtsBtn.addEventListener('click', () => {
        navigate('debts');
      });
    }

    // Go to Budgets button
    const gotoBudgetsBtn = this.container.querySelector('#btn-goto-budgets');
    if (gotoBudgetsBtn) {
      gotoBudgetsBtn.addEventListener('click', () => {
        navigate('budgets');
      });
    }

    // Empty state Add Transaction button
    const emptyAddBtn = this.container.querySelector('#btn-dashboard-empty-add');
    if (emptyAddBtn) {
      emptyAddBtn.addEventListener('click', () => {
        openTransactionSheet();
      });
    }
  }
}
