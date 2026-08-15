/**
 * Dashboard Component (Summary Cards, Quick Actions & Recent Transactions)
 */
import { stateStore } from '../state.js';
import { formatCurrency, formatRelativeDate, getMonthYear } from '../utils/formatters.js';
import { escapeHtml } from '../utils/helpers.js';

export class Dashboard {
  constructor(containerId = 'view-dashboard') {
    this.container = document.getElementById(containerId);
    this.init();
  }

  init() {
    this.render();
    stateStore.subscribe(() => this.render());
  }

  render() {
    const state = stateStore.getState();
    const currentMonth = getMonthYear();

    // Calculate Balances & Monthly Totals (Exclude credit cards from actual asset total)
    const assetWallets = state.wallets.filter(w => w.type !== 'credit');
    const totalBalance = assetWallets.reduce((acc, w) => acc + (Number(w.currentBalance) || 0), 0);

    let monthIncome = 0;
    let monthExpense = 0;
    const expenseByCategory = {};

    state.transactions.forEach(t => {
      if (t.date && t.date.startsWith(currentMonth)) {
        const amt = Number(t.amount) || 0;
        if (t.type === 'income') monthIncome += amt;
        if (t.type === 'expense') {
          monthExpense += amt;
          expenseByCategory[t.categoryId] = (expenseByCategory[t.categoryId] || 0) + amt;
        }
      }
    });

    const netSavings = monthIncome - monthExpense;
    const recentTx = state.transactions.slice(0, 5);

    // Debt receivables & payables
    const totalLend = (state.debts || []).filter(d => d.type === 'lend' && d.status !== 'paid')
      .reduce((acc, d) => acc + (Number(d.remainingAmount) || 0), 0);
    const totalBorrow = (state.debts || []).filter(d => d.type === 'borrow' && d.status !== 'paid')
      .reduce((acc, d) => acc + (Number(d.remainingAmount) || 0), 0);

    this.container.innerHTML = `
      <div class="flex flex-col gap-6">
        <!-- Stat Cards Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--space-4);">
          <!-- Total Balance -->
          <div class="card" style="border-left: 4px solid var(--primary-500);">
            <div class="flex items-center justify-between" style="margin-bottom: var(--space-2);">
              <span class="text-secondary font-medium" style="font-size: var(--font-size-sm);">Tổng Tài Sản Thực Có</span>
              <div class="badge badge-subtle"><i data-lucide="wallet" style="width: 14px; height: 14px;"></i></div>
            </div>
            <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary);">${formatCurrency(totalBalance)}</h2>
            <small class="text-muted">Từ ${assetWallets.length} ví tài sản (không tính thẻ TD)</small>
          </div>

          <!-- Total Income -->
          <div class="card" style="border-left: 4px solid var(--income-primary);">
            <div class="flex items-center justify-between" style="margin-bottom: var(--space-2);">
              <span class="text-secondary font-medium" style="font-size: var(--font-size-sm);">Thu Nhập Tháng Này</span>
              <div class="badge badge-income"><i data-lucide="trending-up" style="width: 14px; height: 14px;"></i></div>
            </div>
            <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--income-primary);">+${formatCurrency(monthIncome)}</h2>
            <small class="text-muted">Dòng tiền thu về</small>
          </div>

          <!-- Total Expense -->
          <div class="card" style="border-left: 4px solid var(--expense-primary);">
            <div class="flex items-center justify-between" style="margin-bottom: var(--space-2);">
              <span class="text-secondary font-medium" style="font-size: var(--font-size-sm);">Chi Tiêu Tháng Này</span>
              <div class="badge badge-expense"><i data-lucide="trending-down" style="width: 14px; height: 14px;"></i></div>
            </div>
            <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--expense-primary);">${formatCurrency(monthExpense)}</h2>
            <small class="text-muted">Các khoản đã chi</small>
          </div>

          <!-- Net Savings -->
          <div class="card" style="border-left: 4px solid ${netSavings >= 0 ? 'var(--primary-500)' : 'var(--expense-primary)'};">
            <div class="flex items-center justify-between" style="margin-bottom: var(--space-2);">
              <span class="text-secondary font-medium" style="font-size: var(--font-size-sm);">Tiết Kiệm Ròng</span>
              <div class="badge ${netSavings >= 0 ? 'badge-subtle' : 'badge-expense'}">
                <i data-lucide="piggy-bank" style="width: 14px; height: 14px;"></i>
              </div>
            </div>
            <h2 style="font-size: 1.5rem; font-weight: 700; color: ${netSavings >= 0 ? 'var(--text-primary)' : 'var(--expense-primary)'};">
              ${formatCurrency(netSavings)}
            </h2>
            <small class="text-muted">${netSavings >= 0 ? 'Dòng tiền dương' : 'Chi vượt thu'}</small>
          </div>
        </div>

        ${totalLend > 0 || totalBorrow > 0 ? `
          <!-- Debts Summary Notice Banner -->
          <div class="card flex items-center justify-between" style="background: var(--bg-subtle); border-left: 4px solid var(--primary-500); padding: var(--space-3) var(--space-4); flex-wrap: wrap; gap: var(--space-3);">
            <div class="flex items-center gap-3">
              <div class="badge badge-subtle"><i data-lucide="hand-coins" style="width: 16px; height: 16px;"></i></div>
              <div>
                <span class="font-semibold" style="font-size: var(--font-size-sm);">Sổ Vay & Nợ:</span>
                <span class="text-muted" style="font-size: var(--font-size-sm); margin-left: 4px;">
                  ${totalLend > 0 ? `Họ đang nợ bạn <strong class="text-income">${formatCurrency(totalLend)}</strong>` : ''}
                  ${totalLend > 0 && totalBorrow > 0 ? ' • ' : ''}
                  ${totalBorrow > 0 ? `Bạn đang nợ <strong class="text-expense">${formatCurrency(totalBorrow)}</strong>` : ''}
                </span>
              </div>
            </div>
            <button type="button" class="btn btn-secondary" id="btn-goto-debts" style="padding: 4px 10px; font-size: var(--font-size-xs);">
              Xem Sổ Nợ →
            </button>
          </div>
        ` : ''}

        <!-- 2 Column Section: Recent Transactions & Top Spending -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--space-6);">
          <!-- Recent Transactions Card -->
          <div class="card">
            <div class="flex items-center justify-between" style="margin-bottom: var(--space-4); border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--space-3);">
              <h3 style="font-size: var(--font-size-base); font-weight: 600;">Giao Dịch Gần Đây</h3>
              <button type="button" class="btn btn-secondary" id="btn-view-all-tx" style="padding: 4px 10px; font-size: var(--font-size-xs);">
                Xem tất cả
              </button>
            </div>

            <div class="recent-tx-list">
              ${recentTx.length === 0 ? '<p class="text-muted" style="text-align: center; padding: 20px 0;">Chưa có giao dịch</p>' : ''}
              ${recentTx.map(tx => this.renderRecentItem(tx, state)).join('')}
            </div>
          </div>

          <!-- Top Spending Breakdown Card -->
          <div class="card">
            <div class="flex items-center justify-between" style="margin-bottom: var(--space-4); border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--space-3);">
              <h3 style="font-size: var(--font-size-base); font-weight: 600;">Cơ Cấu Chi Tiêu Tháng</h3>
              <button type="button" class="btn btn-secondary" id="btn-goto-analytics" style="padding: 4px 10px; font-size: var(--font-size-xs);">
                Xem biểu đồ →
              </button>
            </div>

            <div class="flex flex-col gap-3">
              ${this.renderTopCategories(expenseByCategory, monthExpense, state)}
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    if (window.lucide) window.lucide.createIcons();
  }

  renderRecentItem(tx, state) {
    const cat = state.categories.find(c => c.id === tx.categoryId);
    const isIncome = tx.type === 'income';
    const isTransfer = tx.type === 'transfer';
    const colorClass = isIncome ? 'text-income' : (isTransfer ? 'text-transfer' : 'text-expense');
    const prefix = isIncome ? '+' : (isTransfer ? '' : '-');

    return `
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="icon-avatar" style="width: 34px; height: 34px;">
            <i data-lucide="${cat?.icon || (isTransfer ? 'arrow-right-left' : 'shopping-bag')}" style="width: 16px; height: 16px; color: ${cat?.color || 'inherit'};"></i>
          </div>
          <div>
            <div class="font-medium" style="font-size: var(--font-size-sm);">${escapeHtml(cat?.name || (isTransfer ? 'Chuyển tiền' : 'Chi tiêu'))}</div>
            <small class="text-muted">${formatRelativeDate(tx.date)}</small>
          </div>
        </div>
        <span class="font-bold ${colorClass}" style="font-size: var(--font-size-sm);">${prefix}${formatCurrency(tx.amount)}</span>
      </div>
    `;
  }

  renderTopCategories(expenseMap, totalExpense, state) {
    const entries = Object.entries(expenseMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (entries.length === 0) {
      return '<p class="text-muted" style="text-align: center; padding: 20px 0;">Chưa phát sinh chi tiêu trong tháng</p>';
    }

    return entries.map(([catId, amount]) => {
      const cat = state.categories.find(c => c.id === catId);
      const percent = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;

      return `
        <div class="flex flex-col gap-1">
          <div class="flex items-center justify-between" style="font-size: var(--font-size-xs);">
            <span class="font-medium">${escapeHtml(cat?.name || 'Khác')}</span>
            <span class="text-muted font-bold">${formatCurrency(amount)} (${percent}%)</span>
          </div>
          <div style="height: 6px; background: var(--bg-subtle); border-radius: var(--radius-full); overflow: hidden;">
            <div style="width: ${percent}%; height: 100%; background: ${cat?.color || 'var(--primary-500)'}; border-radius: var(--radius-full);"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  bindEvents() {
    const viewAllBtn = this.container.querySelector('#btn-view-all-tx');
    if (viewAllBtn && window.appInstance) {
      viewAllBtn.addEventListener('click', () => {
        window.appInstance.switchView('transactions');
      });
    }

    const gotoDebtsBtn = this.container.querySelector('#btn-goto-debts');
    if (gotoDebtsBtn && window.appInstance) {
      gotoDebtsBtn.addEventListener('click', () => {
        window.appInstance.switchView('debts');
      });
    }

    const gotoAnalyticsBtn = this.container.querySelector('#btn-goto-analytics');
    if (gotoAnalyticsBtn && window.appInstance) {
      gotoAnalyticsBtn.addEventListener('click', () => {
        window.appInstance.switchView('analytics');
      });
    }
  }
}
