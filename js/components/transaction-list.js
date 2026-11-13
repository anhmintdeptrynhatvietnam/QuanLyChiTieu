/**
 * Transaction List Component (Smart Search, Quick Filter Chips, Dynamic Summary & Grouped by Date)
 */
import { stateStore } from '../state.js';
import { formatCurrency, formatRelativeDate } from '../utils/formatters.js';
import { escapeHtml, getDateRange, safeColor, safeIconName } from '../utils/helpers.js';
import { confirmDialog } from './confirm-dialog.js';

const dateFilters = [
  { id: 'this-month', label: 'Tháng này' },
  { id: 'today', label: 'Hôm nay' },
  { id: 'this-week', label: 'Tuần này' },
  { id: 'last-month', label: 'Tháng trước' },
  { id: 'this-year', label: 'Năm nay' },
  { id: 'all', label: 'Tất cả' }
];

export class TransactionList {
  constructor(containerId = 'view-transactions') {
    this.container = document.getElementById(containerId);
    this.filterDate = 'this-month';
    this.filterType = 'all';
    this.filterCategory = 'all';
    this.filterWallet = 'all';
    this.searchQuery = '';
    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
    stateStore.subscribe((event) => {
      if (event.startsWith('transaction:') || event.startsWith('wallet:') || event === 'data:imported') {
        this.render();
      }
    });
  }

  resetFilters() {
    this.filterDate = 'this-month';
    this.filterType = 'all';
    this.filterCategory = 'all';
    this.filterWallet = 'all';
    this.searchQuery = '';
    this.render();
  }

  render() {
    const state = stateStore.getState();
    const filteredTx = this.getFilteredTransactions(state.transactions);

    // Calculate totals for filtered list
    let filteredIncome = 0;
    let filteredExpense = 0;
    filteredTx.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') filteredIncome += amt;
      if (t.type === 'expense') filteredExpense += amt;
    });

    const isFiltered = this.filterDate !== 'this-month' || this.filterType !== 'all' || this.filterCategory !== 'all' || this.filterWallet !== 'all' || this.searchQuery !== '';

    this.container.innerHTML = `
      <div class="flex flex-col gap-4">
        <!-- Smart Filter Controls Card -->
        <div class="card" style="padding: var(--space-4);">
          <div class="flex flex-col gap-3">
            <!-- Row 1: Search Bar with Icon & Clear button -->
            <div class="search-input-wrapper">
              <span class="search-icon">
                <i data-lucide="search" style="width: 16px; height: 16px;"></i>
              </span>
              <input type="text" id="tx-search" class="form-input" placeholder="Tìm theo ghi chú hoặc số tiền..." value="${escapeHtml(this.searchQuery)}">
              ${this.searchQuery ? `
                <button type="button" id="btn-clear-search" class="search-clear-btn" title="Xóa tìm kiếm">
                  <i data-lucide="x" style="width: 16px; height: 16px;"></i>
                </button>
              ` : ''}
            </div>

            <!-- Row 2: Quick Date Chips (Horizontal Scrollable) -->
            <div class="chip-group">
              ${dateFilters.map(df => `
                <button type="button" class="chip-sm ${this.filterDate === df.id ? 'active' : ''}" data-date-filter="${escapeHtml(df.id)}">
                  ${df.label}
                </button>
              `).join('')}
            </div>

            <!-- Row 3: Dropdown Filters for Type, Wallet, Category -->
            <div class="flex items-center gap-2" style="flex-wrap: wrap;">
              <!-- Type Filter -->
              <select id="tx-filter-type" class="form-select" style="flex: 1; min-width: 105px; padding: 6px 10px; font-size: var(--font-size-xs); height: 34px;">
                <option value="all" ${this.filterType === 'all' ? 'selected' : ''}>Tất cả loại</option>
                <option value="expense" ${this.filterType === 'expense' ? 'selected' : ''}>💸 Chi tiêu</option>
                <option value="income" ${this.filterType === 'income' ? 'selected' : ''}>💰 Thu nhập</option>
                <option value="transfer" ${this.filterType === 'transfer' ? 'selected' : ''}>🔄 Chuyển khoản</option>
              </select>

              <!-- Wallet Filter -->
              <select id="tx-filter-wallet" class="form-select" style="flex: 1; min-width: 105px; padding: 6px 10px; font-size: var(--font-size-xs); height: 34px;">
                <option value="all">Tất cả ví</option>
                ${state.wallets.map(w => `<option value="${escapeHtml(w.id)}" ${this.filterWallet === w.id ? 'selected' : ''}>${escapeHtml(w.name)}</option>`).join('')}
              </select>

              <!-- Category Filter -->
              <select id="tx-filter-category" class="form-select" style="flex: 1; min-width: 105px; padding: 6px 10px; font-size: var(--font-size-xs); height: 34px;">
                <option value="all">Tất cả mục</option>
                ${state.categories.map(c => `<option value="${escapeHtml(c.id)}" ${this.filterCategory === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
              </select>

              ${isFiltered ? `
                <button type="button" id="btn-reset-filters" class="btn btn-secondary" style="height: 34px; padding: 0 10px; font-size: var(--font-size-xs); color: var(--expense-primary); white-space: nowrap;" title="Đặt lại bộ lọc">
                  <i data-lucide="rotate-ccw" style="width: 13px; height: 13px;"></i>
                  <span>Xóa lọc</span>
                </button>
              ` : ''}
            </div>

            <!-- Row 4: Dynamic Filter Summary Strip -->
            <div class="flex items-center justify-between text-muted" style="font-size: var(--font-size-xs); padding-top: var(--space-2); border-top: 1px dashed var(--border-subtle); flex-wrap: wrap; gap: var(--space-2);">
              <span>Tìm thấy <strong>${filteredTx.length}</strong> giao dịch</span>
              <div class="flex items-center gap-3">
                ${filteredIncome > 0 ? `<span>Thu: <strong class="text-income">+${formatCurrency(filteredIncome)}</strong></span>` : ''}
                ${filteredExpense > 0 ? `<span>Chi: <strong class="text-expense">-${formatCurrency(filteredExpense)}</strong></span>` : ''}
              </div>
            </div>
          </div>
        </div>

        <!-- Transactions Container -->
        <div id="tx-grouped-container" class="flex flex-col gap-3">
          ${this.renderGroupedTransactions(filteredTx, state)}
        </div>
      </div>
    `;

    this.bindDynamicEvents();
    if (window.lucide) window.lucide.createIcons();
  }

  getFilteredTransactions(transactions) {
    const dateRange = getDateRange(this.filterDate);

    return transactions.filter(t => {
      if (dateRange && (t.date < dateRange.start || t.date > dateRange.end)) return false;
      if (this.filterType !== 'all' && t.type !== this.filterType) return false;
      if (this.filterCategory !== 'all' && t.categoryId !== this.filterCategory) return false;
      if (this.filterWallet !== 'all' && t.walletId !== this.filterWallet && t.toWalletId !== this.filterWallet) return false;
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase().trim();
        const noteMatch = (t.note || '').toLowerCase().includes(query);
        const amountMatch = String(t.amount).includes(query);
        if (!noteMatch && !amountMatch) return false;
      }
      return true;
    });
  }

  renderGroupedTransactions(transactions, state) {
    if (transactions.length === 0) {
      return `
        <div class="card" style="text-align: center; padding: 48px var(--space-4);">
          <i data-lucide="receipt" style="width: 48px; height: 48px; color: var(--text-muted); margin: 0 auto 12px;"></i>
          <h3 style="color: var(--text-secondary); margin-bottom: 4px;">Không tìm thấy giao dịch</h3>
          <p style="font-size: var(--font-size-sm); color: var(--text-muted);">Không có giao dịch nào khớp với bộ lọc hiện tại.</p>
        </div>
      `;
    }

    // Group transactions by date
    const groups = {};
    transactions.forEach(tx => {
      if (!groups[tx.date]) groups[tx.date] = [];
      groups[tx.date].push(tx);
    });

    return Object.keys(groups).map(date => {
      const dayTx = groups[date];
      return `
        <div class="card" style="padding: var(--space-4);">
          <div class="flex items-center justify-between" style="padding-bottom: var(--space-2); margin-bottom: var(--space-2); border-bottom: 1px dashed var(--border-subtle);">
            <span class="font-semibold text-secondary" style="font-size: var(--font-size-sm);">${formatRelativeDate(date)}</span>
            <span class="text-muted" style="font-size: var(--font-size-xs);">${dayTx.length} giao dịch</span>
          </div>
          <div class="flex flex-col gap-1">
            ${dayTx.map(tx => this.renderTxItem(tx, state)).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  renderTxItem(tx, state) {
    const cat = state.categories.find(c => c.id === tx.categoryId);
    const wallet = state.wallets.find(w => w.id === tx.walletId);
    const toWallet = tx.toWalletId ? state.wallets.find(w => w.id === tx.toWalletId) : null;

    let iconName = 'tag';
    let typeClass = 'text-expense';
    let prefix = '-';
    let title = cat?.name || 'Chi tiêu';

    if (tx.type === 'income') {
      typeClass = 'text-income';
      prefix = '+';
      title = cat?.name || 'Thu nhập';
      iconName = cat?.icon || 'banknote';
    } else if (tx.type === 'transfer') {
      typeClass = 'text-transfer';
      prefix = '';
      title = `Chuyển sang ${toWallet?.name || 'Ví'}`;
      iconName = 'arrow-right-left';
    } else {
      iconName = cat?.icon || 'shopping-bag';
    }

    return `
      <div class="tx-item" data-id="${escapeHtml(tx.id)}">
        <div class="tx-item-left btn-row-click" data-id="${escapeHtml(tx.id)}" style="cursor: pointer;">
          <div class="icon-avatar" style="flex-shrink: 0; width: 36px; height: 36px;">
            <i data-lucide="${safeIconName(iconName)}" style="width: 16px; height: 16px; color: ${safeColor(cat?.color)};"></i>
          </div>
          <div class="tx-item-content">
            <div class="tx-item-title">${escapeHtml(title)}</div>
            <div class="tx-item-subtitle">
              <span>${escapeHtml(wallet?.name || 'Ví')}</span>
              ${tx.note ? `<span>•</span><span>${escapeHtml(tx.note)}</span>` : ''}
            </div>
          </div>
        </div>

        <div class="tx-item-right">
          <span class="font-bold ${typeClass}" style="font-size: var(--font-size-sm);">${prefix}${formatCurrency(tx.amount)}</span>
          <div class="flex items-center gap-1" style="margin-top: 2px;">
            <button type="button" class="btn-icon-sm btn-edit-tx" data-id="${escapeHtml(tx.id)}" title="Sửa">
              <i data-lucide="edit-3" style="width: 13px; height: 13px;"></i>
            </button>
            <button type="button" class="btn-icon-sm btn-delete-tx" data-id="${escapeHtml(tx.id)}" title="Xóa" style="color: var(--expense-primary);">
              <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    this.container.addEventListener('change', (e) => {
      if (e.target.id === 'tx-filter-type') { this.filterType = e.target.value; this.render(); }
      if (e.target.id === 'tx-filter-wallet') { this.filterWallet = e.target.value; this.render(); }
      if (e.target.id === 'tx-filter-category') { this.filterCategory = e.target.value; this.render(); }
    });

    this.container.addEventListener('input', (e) => {
      if (e.target.id === 'tx-search') {
        this.searchQuery = e.target.value;
        this.render();
      }
    });

    this.container.addEventListener('click', (e) => {
      // Date filter chip click
      const chip = e.target.closest('[data-date-filter]');
      if (chip) {
        this.filterDate = chip.getAttribute('data-date-filter');
        this.render();
        return;
      }

      // Clear search button
      if (e.target.closest('#btn-clear-search')) {
        this.searchQuery = '';
        this.render();
        return;
      }

      // Reset filters button
      if (e.target.closest('#btn-reset-filters')) {
        this.resetFilters();
        return;
      }

      // Row click to edit
      const rowClick = e.target.closest('.btn-row-click');
      if (rowClick) {
        const id = rowClick.getAttribute('data-id');
        if (window.transactionModal) window.transactionModal.open(id);
      }
    });
  }

  bindDynamicEvents() {
    this.container.querySelectorAll('.btn-edit-tx').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (window.transactionModal) window.transactionModal.open(id);
      });
    });

    this.container.querySelectorAll('.btn-delete-tx').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const confirmed = await confirmDialog('Bạn có chắc chắn muốn xóa giao dịch này?', { danger: true });
        if (confirmed) {
          stateStore.deleteTransaction(id);
        }
      });
    });
  }
}
