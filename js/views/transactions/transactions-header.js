/**
 * Transactions Header Component
 * Sticky search input, quick date range chips, advanced filter trigger, and summary bar.
 */
import { formatCurrency } from '../../utils/formatters.js';
import { escapeHtml } from '../../utils/helpers.js';
import { renderEyeButton, isAmountVisible } from '../../utils/privacy.js';

export const DATE_FILTER_OPTIONS = [
  { id: 'this-month', label: 'Tháng này' },
  { id: 'today', label: 'Hôm nay' },
  { id: 'this-week', label: 'Tuần này' },
  { id: 'last-month', label: 'Tháng trước' },
  { id: 'all', label: 'Tất cả' }
];

export function hasActiveAdvancedFilter({ type, categoryId, walletId }) {
  return (type && type !== 'all') || (categoryId && categoryId !== 'all') || (walletId && walletId !== 'all');
}

export function renderTransactionsHeader({
  search = '',
  range = 'this-month',
  type = 'all',
  categoryId = 'all',
  walletId = 'all',
  totals = { income: 0, expense: 0, count: 0 }
} = {}) {
  const isAdvActive = hasActiveAdvancedFilter({ type, categoryId, walletId });
  const amountsVisible = isAmountVisible('tx_summary', true);

  const incomeText = amountsVisible ? `+${formatCurrency(totals.income)}` : '••••••';
  const expenseText = amountsVisible ? `-${formatCurrency(totals.expense)}` : '••••••';

  return `
    <div class="transactions-sticky-header">
      <!-- Search Input Bar -->
      <div class="tx-search-bar">
        <span class="tx-search-icon" aria-hidden="true">
          <i data-lucide="search" style="width: 18px; height: 18px;"></i>
        </span>
        <input
          type="text"
          id="tx-search-input"
          class="tx-search-input"
          placeholder="Tìm theo ghi chú, hạng mục, ví..."
          value="${escapeHtml(search)}"
          autocomplete="off"
        />
        ${
          search
            ? `
          <button type="button" id="btn-tx-clear-search" class="tx-search-clear" aria-label="Xóa tìm kiếm">
            <i data-lucide="x" style="width: 16px; height: 16px;"></i>
          </button>
        `
            : ''
        }
      </div>

      <!-- Quick Date Chips & Filter Button -->
      <div class="tx-chips-scroll">
        <button
          type="button"
          id="btn-open-filter-sheet"
          class="tx-chip-btn tx-chip-filter${isAdvActive ? ' active' : ''}"
          aria-label="Mở bộ lọc nâng cao"
        >
          <i data-lucide="sliders-horizontal" style="width: 14px; height: 14px;"></i>
          <span>Bộ lọc</span>
          ${isAdvActive ? '<span class="tx-filter-badge" aria-label="Đang lọc"></span>' : ''}
        </button>

        <div class="tx-chips-divider" aria-hidden="true"></div>

        ${DATE_FILTER_OPTIONS.map(
          (opt) => `
          <button
            type="button"
            class="tx-chip-btn${range === opt.id ? ' active' : ''}"
            data-range="${escapeHtml(opt.id)}"
          >
            ${escapeHtml(opt.label)}
          </button>
        `
        ).join('')}
      </div>

      <!-- Summary Line -->
      <div class="tx-summary-bar">
        <div class="tx-summary-left">
          <span class="tx-summary-count">
            <strong>${totals.count}</strong> giao dịch
          </span>
          ${renderEyeButton('tx_summary', true)}
        </div>
        <div class="tx-summary-right num">
          ${
            totals.income > 0
              ? `<span class="tx-summary-income" title="Tổng thu">${incomeText}</span>`
              : ''
          }
          ${
            totals.expense > 0
              ? `<span class="tx-summary-expense" title="Tổng chi">${expenseText}</span>`
              : ''
          }
        </div>
      </div>
    </div>
  `;
}
