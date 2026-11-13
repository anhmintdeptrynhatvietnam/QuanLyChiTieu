/**
 * Transactions View (Danh sách giao dịch)
 * Sticky search bar, date range chips, filter sheet, summary bar, and day-grouped list.
 */
import { stateStore } from '../../state.js';
import { refreshIcons } from '../../ui/icons.js';
import { bindTransactionRows } from '../../ui/transaction-row.js';
import { attachPrivacyListeners } from '../../utils/privacy.js';
import { openTransactionSheet } from '../transaction-sheet/transaction-sheet.js';
import { filterTransactions, calculateTransactionTotals } from '../../domain/transaction-query.js';
import { renderTransactionsHeader } from './transactions-header.js';
import { openFilterSheet } from './transactions-filter-sheet.js';
import { renderTransactionsList } from './transactions-list-renderer.js';

const STORAGE_KEY = 'qlct_ui_tx_range';

function readStoredRange() {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val && ['this-month', 'today', 'this-week', 'last-month', 'all'].includes(val)) return val;
  } catch {}
  return 'this-month';
}

function saveStoredRange(range) {
  try { localStorage.setItem(STORAGE_KEY, range); } catch {}
}

export class TransactionsView {
  constructor(containerId = 'view-transactions') {
    this.container = document.getElementById(containerId);
    this.range = readStoredRange();
    this.search = '';
    this.type = 'all';
    this.categoryId = 'all';
    this.walletId = 'all';
    this.visibleCount = 50;
    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
    this.unsubscribe = stateStore.subscribe(() => this.render());
  }

  destroy() {
    if (typeof this.unsubscribe === 'function') {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  resetFilters() {
    this.range = 'this-month';
    this.search = '';
    this.type = 'all';
    this.categoryId = 'all';
    this.walletId = 'all';
    this.visibleCount = 50;
    saveStoredRange(this.range);
    this.render();
  }

  render() {
    if (!this.container) return;
    const { transactions = [], categories = [], wallets = [] } = stateStore.getState();

    const filtered = filterTransactions(transactions, {
      range: this.range,
      type: this.type,
      categoryId: this.categoryId,
      walletId: this.walletId,
      search: this.search,
      categories,
      wallets
    });

    const totals = calculateTransactionTotals(filtered);
    const prevInput = this.container.querySelector('#tx-search-input');
    const hadFocus = document.activeElement === prevInput;
    const cursorPos = prevInput?.selectionStart;

    this.container.innerHTML = `
      <div class="transactions-container">
        ${renderTransactionsHeader({
          search: this.search,
          range: this.range,
          type: this.type,
          categoryId: this.categoryId,
          walletId: this.walletId,
          totals
        })}
        <div id="tx-list-content-host">
          ${renderTransactionsList({
            transactions: filtered,
            totalCount: transactions.length,
            visibleCount: this.visibleCount,
            wallets,
            categories
          })}
        </div>
      </div>
    `;

    if (hadFocus) {
      const input = this.container.querySelector('#tx-search-input');
      if (input) {
        input.focus();
        if (typeof cursorPos === 'number') input.setSelectionRange(cursorPos, cursorPos);
      }
    }

    bindTransactionRows(this.container);
    attachPrivacyListeners(this.container, () => this.render());
    refreshIcons(this.container);
  }

  handleFilterSheet() {
    const { categories = [], wallets = [] } = stateStore.getState();
    openFilterSheet({
      type: this.type,
      categoryId: this.categoryId,
      walletId: this.walletId,
      categories,
      wallets,
      onApply: ({ type, categoryId, walletId }) => {
        Object.assign(this, { type, categoryId, walletId, visibleCount: 50 });
        this.render();
      },
      onReset: () => {
        Object.assign(this, { type: 'all', categoryId: 'all', walletId: 'all', visibleCount: 50 });
        this.render();
      }
    });
  }

  bindEvents() {
    if (!this.container) return;

    this.container.addEventListener('input', (e) => {
      if (e.target?.id === 'tx-search-input') {
        this.search = e.target.value;
        this.visibleCount = 50;
        this.render();
      }
    });

    this.container.addEventListener('click', (e) => {
      if (e.target.closest('#btn-tx-clear-search')) {
        this.search = '';
        this.visibleCount = 50;
        this.render();
      } else if (e.target.closest('[data-range]')) {
        const nextRange = e.target.closest('[data-range]').getAttribute('data-range');
        if (nextRange && nextRange !== this.range) {
          this.range = nextRange;
          this.visibleCount = 50;
          saveStoredRange(this.range);
          this.render();
        }
      } else if (e.target.closest('#btn-open-filter-sheet')) {
        this.handleFilterSheet();
      } else if (e.target.closest('#btn-tx-load-more')) {
        this.visibleCount += 50;
        this.render();
      } else if (e.target.closest('#btn-tx-empty-add')) {
        openTransactionSheet();
      } else if (e.target.closest('#btn-tx-reset-empty')) {
        this.resetFilters();
      }
    });
  }
}
