/**
 * Dashboard View Cards & Template Renderers
 * Pure HTML builders for hero balance, monthly totals, debt banner,
 * budget alerts, and recent transactions.
 */
import { formatCurrency } from '../../utils/formatters.js';
import { escapeHtml } from '../../utils/helpers.js';
import { isAmountVisible, renderEyeButton } from '../../utils/privacy.js';
import { renderDayGroupHeader, renderTransactionRow } from '../../ui/transaction-row.js';
import { groupByDay } from '../../domain/period-summary.js';

export function renderHeroCard(wallets = [], monthSum = { income: 0, expense: 0, net: 0 }) {
  const assetWallets = (wallets || []).filter((w) => w.type !== 'credit');
  const totalBalance = assetWallets.reduce((acc, w) => acc + (Number(w.currentBalance) || 0), 0);

  const isBalanceShown = isAmountVisible('dashboard_balance');
  const isIncomeShown = isAmountVisible('dashboard_income');
  const isExpenseShown = isAmountVisible('dashboard_expense');
  const isSavingsShown = isAmountVisible('dashboard_savings');
  const netColorClass = monthSum.net >= 0 ? 'text-income' : 'text-expense';
  const netPrefix = monthSum.net > 0 ? '+' : '';

  return `
    <div class="dashboard-hero-card">
      <div class="hero-balance-section">
        <div class="hero-balance-label">
          <span>Tổng Tài Sản Thực Có</span>
          <div class="hero-balance-icon"><i data-lucide="wallet" style="width: 16px; height: 16px;"></i></div>
        </div>
        <div class="hero-balance-amount-row">
          <h2 class="hero-balance-value num">
            ${isBalanceShown ? formatCurrency(totalBalance) : '<span class="masked-amount">••••••••</span>'}
          </h2>
          ${renderEyeButton('dashboard_balance')}
        </div>
        <span class="hero-balance-subtitle">Từ ${assetWallets.length} ví tài sản (không tính thẻ TD)</span>
      </div>

      <div class="hero-month-grid">
        <div class="hero-month-item">
          <div class="hero-month-label">
            <span>Thu nhập</span>
            ${renderEyeButton('dashboard_income')}
          </div>
          <div class="hero-month-value-row">
            <span class="hero-month-value num text-income">
              ${isIncomeShown ? `+${formatCurrency(monthSum.income)}` : '<span class="masked-amount">••••••</span>'}
            </span>
          </div>
        </div>

        <div class="hero-month-item">
          <div class="hero-month-label">
            <span>Chi tiêu</span>
            ${renderEyeButton('dashboard_expense')}
          </div>
          <div class="hero-month-value-row">
            <span class="hero-month-value num text-expense">
              ${isExpenseShown ? `-${formatCurrency(monthSum.expense)}` : '<span class="masked-amount">••••••</span>'}
            </span>
          </div>
        </div>

        <div class="hero-month-item">
          <div class="hero-month-label">
            <span>Chênh lệch</span>
            ${renderEyeButton('dashboard_savings')}
          </div>
          <div class="hero-month-value-row">
            <span class="hero-month-value num ${netColorClass}">
              ${isSavingsShown ? `${netPrefix}${formatCurrency(monthSum.net)}` : '<span class="masked-amount">••••••</span>'}
            </span>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderDebtBanner(debts = []) {
  const totalLend = (debts || []).filter((d) => d.type === 'lend' && d.status !== 'paid')
    .reduce((acc, d) => acc + (Number(d.remainingAmount) || 0), 0);
  const totalBorrow = (debts || []).filter((d) => d.type === 'borrow' && d.status !== 'paid')
    .reduce((acc, d) => acc + (Number(d.remainingAmount) || 0), 0);

  if (totalLend <= 0 && totalBorrow <= 0) return '';
  const isDebtsShown = isAmountVisible('dashboard_debts');

  return `
    <div class="dashboard-debt-banner">
      <div class="debt-banner-left">
        <div class="debt-banner-icon"><i data-lucide="hand-coins" style="width: 18px; height: 18px;"></i></div>
        <div class="debt-banner-content">
          <span class="debt-banner-title">Sổ Vay & Nợ:</span>
          <span class="debt-banner-details">
            ${totalLend > 0 ? `Họ đang nợ <strong class="text-income num">${isDebtsShown ? formatCurrency(totalLend) : '••••••'}</strong>` : ''}
            ${totalLend > 0 && totalBorrow > 0 ? ' • ' : ''}
            ${totalBorrow > 0 ? `Bạn đang nợ <strong class="text-expense num">${isDebtsShown ? formatCurrency(totalBorrow) : '••••••'}</strong>` : ''}
          </span>
          ${renderEyeButton('dashboard_debts')}
        </div>
      </div>
      <button type="button" class="btn-v2 btn-v2-secondary" id="btn-goto-debts" style="padding: 6px 12px; font-size: var(--font-size-xs);">
        Xem sổ nợ →
      </button>
    </div>
  `;
}

export function renderBudgetCard(alerts = []) {
  if (!alerts || alerts.length === 0) return '';

  const itemsHtml = alerts.map((a) => {
    const percent = Math.round(a.ratio * 100);
    const barClass = percent > 100 ? 'budget-alert-bar-danger' : 'budget-alert-bar-warning';
    return `
      <div class="budget-alert-item">
        <div class="budget-alert-info">
          <span class="budget-alert-cat-name">${escapeHtml(a.name)}</span>
          <span class="budget-alert-numbers num">${formatCurrency(a.spent)} / ${formatCurrency(a.limit)} (${percent}%)</span>
        </div>
        <div class="budget-alert-bar-track">
          <div class="budget-alert-bar-fill ${barClass}" style="width: ${Math.min(percent, 100)}%;"></div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="card-v2 dashboard-budget-card">
      <div class="budget-card-header">
        <div class="budget-card-title-group">
          <span class="font-bold" style="font-size: var(--font-size-sm);">Cảnh báo ngân sách</span>
          <span class="budget-alert-badge"><i data-lucide="alert-triangle" style="width: 12px; height: 12px;"></i>${alerts.length} mục</span>
        </div>
        <button type="button" class="btn-v2 btn-v2-secondary" id="btn-goto-budgets" style="padding: 4px 10px; font-size: var(--font-size-xs);">
          Chi tiết →
        </button>
      </div>
      <div class="budget-alert-list">${itemsHtml}</div>
    </div>
  `;
}

export function renderRecentSection(transactions = [], wallets = [], categories = []) {
  const recentTx = (transactions || []).slice(0, 8);

  if (recentTx.length === 0) {
    return `
      <div class="card-v2 dashboard-recent-card">
        <div class="recent-card-header">
          <span class="font-bold" style="font-size: var(--font-size-sm);">Giao dịch gần đây</span>
        </div>
        <div class="dashboard-empty-state">
          <div class="empty-state-icon-circle"><i data-lucide="receipt" style="width: 24px; height: 24px;"></i></div>
          <p class="empty-state-title">Chưa có giao dịch nào — bấm + để ghi khoản đầu tiên</p>
          <button type="button" class="btn-v2 btn-v2-primary" id="btn-dashboard-empty-add" style="margin-top: var(--space-2); padding: 8px 16px;">
            <i data-lucide="plus" style="width: 16px; height: 16px;"></i>Ghi giao dịch
          </button>
        </div>
      </div>
    `;
  }

  const groups = groupByDay(recentTx);
  const groupsHtml = groups.map((g) => {
    const rowsHtml = g.items.map((tx) => renderTransactionRow(tx, { wallets, categories })).join('');
    return `${renderDayGroupHeader(g)}<div class="tx-group-rows">${rowsHtml}</div>`;
  }).join('');

  return `
    <div class="card-v2 dashboard-recent-card">
      <div class="recent-card-header">
        <span class="font-bold" style="font-size: var(--font-size-sm);">Giao dịch gần đây</span>
        <button type="button" class="btn-v2 btn-v2-secondary" id="btn-view-all-tx" style="padding: 4px 10px; font-size: var(--font-size-xs);">
          Xem tất cả
        </button>
      </div>
      <div class="dashboard-recent-list">${groupsHtml}</div>
    </div>
  `;
}
