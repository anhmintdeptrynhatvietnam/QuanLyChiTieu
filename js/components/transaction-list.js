/**
 * Transaction List Component (Search, Filter, Grouped by Date)
 */
import { stateStore } from '../state.js';
import { formatCurrency, formatRelativeDate } from '../utils/formatters.js';
import { escapeHtml, getDateRange } from '../utils/helpers.js';

export class TransactionList {
  constructor(containerId = 'view-transactions') {
    this.container = document.getElementById(containerId);
    this.filterDate = 'this-month';
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

  render() {
    const state = stateStore.getState();
    const filteredTx = this.getFilteredTransactions(state.transactions);

    this.container.innerHTML = `
      <div class="flex flex-col gap-4">
        <!-- Filter Controls Card -->
        <div class="card">
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between gap-3" style="flex-wrap: wrap;">
              <input type="text" id="tx-search" class="form-input" placeholder="🔍 Tìm kiếm theo ghi chú..." value="${escapeHtml(this.searchQuery)}" style="flex: 1; min-width: 200px;">
              <select id="tx-filter-date" class="form-select" style="width: auto; min-width: 140px;">
                <option value="this-month" ${this.filterDate === 'this-month' ? 'selected' : ''}>Tháng này</option>
                <option value="today" ${this.filterDate === 'today' ? 'selected' : ''}>Hôm nay</option>
                <option value="this-week" ${this.filterDate === 'this-week' ? 'selected' : ''}>Tuần này</option>
                <option value="last-month" ${this.filterDate === 'last-month' ? 'selected' : ''}>Tháng trước</option>
                <option value="this-year" ${this.filterDate === 'this-year' ? 'selected' : ''}>Năm nay</option>
                <option value="all" ${this.filterDate === 'all' ? 'selected' : ''}>Tất cả thời gian</option>
              </select>
            </div>

            <div class="flex gap-2" style="flex-wrap: wrap;">
              <select id="tx-filter-wallet" class="form-select" style="flex: 1; min-width: 130px;">
                <option value="all">Tất cả Ví</option>
                ${state.wallets.map(w => `<option value="${w.id}" ${this.filterWallet === w.id ? 'selected' : ''}>${escapeHtml(w.name)}</option>`).join('')}
              </select>
              <select id="tx-filter-category" class="form-select" style="flex: 1; min-width: 130px;">
                <option value="all">Tất cả Hạng mục</option>
                ${state.categories.map(c => `<option value="${c.id}" ${this.filterCategory === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
              </select>
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
      if (this.filterCategory !== 'all' && t.categoryId !== this.filterCategory) return false;
      if (this.filterWallet !== 'all' && t.walletId !== this.filterWallet && t.toWalletId !== this.filterWallet) return false;
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
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
          <h3 style="color: var(--text-secondary); margin-bottom: 4px;">Chưa có giao dịch nào</h3>
          <p style="font-size: var(--font-size-sm); color: var(--text-muted);">Hãy bấm nút "Ghi chép" để thêm khoản thu/chi đầu tiên nhé!</p>
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
          <div class="flex items-center justify-between" style="padding-bottom: var(--space-2); margin-bottom: var(--space-3); border-bottom: 1px dashed var(--border-subtle);">
            <span class="font-semibold text-secondary" style="font-size: var(--font-size-sm);">${formatRelativeDate(date)}</span>
            <span class="text-muted" style="font-size: var(--font-size-xs);">${dayTx.length} giao dịch</span>
          </div>
          <div class="flex flex-col gap-3">
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
      title = `Chuyển: ${wallet?.name || 'Ví'} ➔ ${toWallet?.name || 'Ví'}`;
      iconName = 'arrow-right-left';
    } else {
      iconName = cat?.icon || 'shopping-bag';
    }

    return `
      <div class="flex items-center justify-between gap-3" style="padding: 4px 0;">
        <div class="flex items-center gap-3" style="min-width: 0;">
          <div class="btn-icon" style="flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: var(--bg-subtle);">
            <i data-lucide="${iconName}" style="width: 18px; height: 18px; color: ${cat?.color || 'var(--text-secondary)'};"></i>
          </div>
          <div style="min-width: 0;">
            <div class="font-medium" style="font-size: var(--font-size-sm); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${escapeHtml(title)}
            </div>
            <div class="flex items-center gap-2 text-muted" style="font-size: var(--font-size-xs);">
              <span>${escapeHtml(wallet?.name || 'Ví')}</span>
              ${tx.note ? `<span>•</span><span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(tx.note)}</span>` : ''}
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3" style="flex-shrink: 0;">
          <span class="font-bold ${typeClass}" style="font-size: var(--font-size-base);">${prefix}${formatCurrency(tx.amount)}</span>
          <button type="button" class="btn btn-icon btn-edit-tx" data-id="${tx.id}" title="Sửa" style="width: 32px; height: 32px;">
            <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i>
          </button>
          <button type="button" class="btn btn-icon btn-delete-tx" data-id="${tx.id}" title="Xóa" style="width: 32px; height: 32px; color: var(--expense-primary);">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
          </button>
        </div>
      </div>
    `;
  }

  bindEvents() {
    this.container.addEventListener('change', (e) => {
      if (e.target.id === 'tx-filter-date') { this.filterDate = e.target.value; this.render(); }
      if (e.target.id === 'tx-filter-wallet') { this.filterWallet = e.target.value; this.render(); }
      if (e.target.id === 'tx-filter-category') { this.filterCategory = e.target.value; this.render(); }
    });

    this.container.addEventListener('input', (e) => {
      if (e.target.id === 'tx-search') {
        this.searchQuery = e.target.value;
        const state = stateStore.getState();
        const filteredTx = this.getFilteredTransactions(state.transactions);
        const groupEl = document.getElementById('tx-grouped-container');
        if (groupEl) {
          groupEl.innerHTML = this.renderGroupedTransactions(filteredTx, state);
          if (window.lucide) window.lucide.createIcons();
          this.bindDynamicEvents();
        }
      }
    });
  }

  bindDynamicEvents() {
    this.container.querySelectorAll('.btn-edit-tx').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (window.transactionModal) window.transactionModal.open(id);
      });
    });

    this.container.querySelectorAll('.btn-delete-tx').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) {
          stateStore.deleteTransaction(id);
        }
      });
    });
  }
}
