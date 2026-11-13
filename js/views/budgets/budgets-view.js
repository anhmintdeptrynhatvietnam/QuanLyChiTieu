/**
 * Budgets View Component (Hạn mức ngân sách)
 */
import { stateStore } from '../../state.js';
import { formatCurrency, getMonthYear, formatMonthYearDisplay } from '../../utils/formatters.js';
import { escapeHtml } from '../../utils/helpers.js';
import { refreshIcons } from '../../ui/icons.js';
import { computeMonthBudgetSummary } from '../../domain/budget-progress.js';
import { openBudgetSheet } from './budget-sheet.js';
import { renderBudgetItem } from './budget-item.js';

export class BudgetsView {
  constructor(containerId = 'view-budgets') {
    this.container = document.getElementById(containerId);
    this.selectedMonth = getMonthYear();
    this.init();
  }

  init() {
    this.render();
    stateStore.subscribe((event) => {
      if (event.startsWith('budget:') || event.startsWith('transaction:') ||
          event.startsWith('category:') || event === 'data:imported' ||
          event === 'data:replaced' || event === 'remote:synced') {
        this.render();
      }
    });
  }

  renderBudgetItem(category, transactions, budgets) {
    return renderBudgetItem(category, transactions, budgets, this.selectedMonth);
  }

  render() {
    if (!this.container) return;
    const state = stateStore.getState();
    const categories = state.categories || [];
    const expenseCategories = categories.filter(c => c.type === 'expense');
    const budgets = state.budgets || [];
    const transactions = state.transactions || [];

    const summary = computeMonthBudgetSummary(categories, budgets, transactions, this.selectedMonth);

    this.container.innerHTML = `
      <div class="budgets-view">
        <div class="card-v2 budget-overview-card">
          <div class="budget-overview-header">
            <div>
              <span class="text-secondary" style="font-size: var(--font-size-xs);">Ngân sách tháng</span>
              <h2 style="font-size: var(--font-size-lg); font-weight: 800; margin: 2px 0 0;">
                ${formatMonthYearDisplay(this.selectedMonth)}
              </h2>
            </div>
            <div class="budget-month-nav">
              <button type="button" class="btn-v2 btn-v2-secondary" id="btn-budget-prev-month" title="Tháng trước" style="padding: 6px 10px; min-height: 38px;">
                <i data-lucide="chevron-left" style="width: 16px; height: 16px;"></i>
              </button>
              <input type="month" id="budget-view-month" class="budget-month-input" value="${escapeHtml(this.selectedMonth)}" aria-label="Chọn tháng" />
              <button type="button" class="btn-v2 btn-v2-secondary" id="btn-budget-next-month" title="Tháng sau" style="padding: 6px 10px; min-height: 38px;">
                <i data-lucide="chevron-right" style="width: 16px; height: 16px;"></i>
              </button>
            </div>
          </div>

          <div class="budget-overview-stats">
            <div class="budget-stat-item">
              <span class="budget-stat-label">Tổng thực chi</span>
              <span class="budget-stat-value text-expense">${formatCurrency(summary.totalSpent)}</span>
            </div>
            <div class="budget-stat-item">
              <span class="budget-stat-label">Tổng hạn mức</span>
              <span class="budget-stat-value text-primary">${formatCurrency(summary.totalBudget)}</span>
            </div>
            <div class="budget-stat-item">
              <span class="budget-stat-label">Tỷ lệ sử dụng</span>
              <span class="budget-stat-value" style="color: ${summary.statusColor};">
                ${summary.hasBudget ? `${summary.percent}%` : 'Chưa đặt'}
              </span>
            </div>
          </div>

          ${summary.hasBudget ? `
            <div class="budget-overview-bar-bg">
              <div class="budget-overview-bar-fill" style="width: ${summary.barPercent}%; background: ${summary.statusColor};"></div>
            </div>
          ` : ''}
        </div>

        <div class="budgets-list">
          ${expenseCategories.map(cat => this.renderBudgetItem(cat, transactions, budgets)).join('')}
        </div>
      </div>
    `;

    this.bindEvents();
    refreshIcons(this.container);
  }

  shiftMonth(delta) {
    const [yStr, mStr] = this.selectedMonth.split('-');
    let year = parseInt(yStr, 10);
    let month = parseInt(mStr, 10) + delta;
    if (month > 12) {
      month = 1;
      year += 1;
    } else if (month < 1) {
      month = 12;
      year -= 1;
    }
    const padMonth = String(month).padStart(2, '0');
    this.selectedMonth = `${year}-${padMonth}`;
    this.render();
  }

  bindEvents() {
    const monthPicker = this.container.querySelector('#budget-view-month');
    if (monthPicker) {
      monthPicker.addEventListener('change', (e) => {
        if (e.target.value) {
          this.selectedMonth = e.target.value;
          this.render();
        }
      });
    }

    const prevBtn = this.container.querySelector('#btn-budget-prev-month');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.shiftMonth(-1));
    }

    const nextBtn = this.container.querySelector('#btn-budget-next-month');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.shiftMonth(1));
    }

    this.container.querySelectorAll('.budget-cat-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const catId = card.getAttribute('data-cat-id');
        if (catId) {
          openBudgetSheet({
            categoryId: catId,
            month: this.selectedMonth,
            onDone: () => this.render()
          });
        }
      });
    });
  }
}
