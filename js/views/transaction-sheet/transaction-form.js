/**
 * Transaction Form Component
 * Handles adding and editing transactions (Chi, Thu, Chuyển, and Vay/Nợ).
 */
import { stateStore } from '../../state.js';
import { formatNumber } from '../../utils/formatters.js';
import { getCurrentDateFormatted } from '../../utils/helpers.js';
import { showToast } from '../../components/toast.js';
import { confirmDialog } from '../../components/confirm-dialog.js';
import { attachCurrencyInput, getCurrencyValue } from '../../ui/currency-input.js';
import { renderCategoryGrid } from '../../ui/category-grid.js';
import { rankCategoriesByUsage } from '../../domain/category-usage.js';
import { renderWalletPicker } from '../../ui/wallet-picker.js';
import { refreshIcons } from '../../ui/icons.js';
import { resolveEntryDefaults } from '../../domain/transaction-entry.js';
import { getLastEntry } from './last-entry.js';
import { openCategoryCreateSheet } from './category-create.js';
import { renderDebtForm } from '../debt-sheet/debt-form.js';
import { getTransactionFormHTML } from './transaction-form-template.js';
import { handleSaveTransaction } from './transaction-save.js';

export function renderTransactionForm({ txId = null, type = null, walletId = null, onDone = null } = {}) {
  const state = stateStore.getState();
  const existingTx = txId ? state.transactions.find((t) => t.id === txId) : null;
  const isEdit = Boolean(existingTx);

  const defaults = resolveEntryDefaults({
    lastEntry: getLastEntry(),
    wallets: state.wallets,
    params: { type: existingTx?.type || type, walletId: existingTx?.walletId || walletId }
  });

  let currentType = existingTx?.type || defaults.type || 'expense';
  let currentWalletId = existingTx?.walletId || defaults.walletId;
  let currentToWalletId = existingTx?.toWalletId || defaults.toWalletId;
  let currentCategoryId = existingTx?.categoryId || '';
  let currentDate = existingTx?.date || getCurrentDateFormatted();

  const container = document.createElement('div');
  container.className = 'transaction-form flex flex-col gap-4';
  container.innerHTML = getTransactionFormHTML({ currentType, currentDate, isEdit, existingTx });

  const amountInput = container.querySelector('#tx-amount-hero');
  attachCurrencyInput(amountInput);
  if (existingTx?.amount) amountInput.value = formatNumber(existingTx.amount);

  function syncUI() {
    const isDebt = currentType === 'debt';
    container.querySelector('#tx-standard-body').style.display = isDebt ? 'none' : 'flex';
    const debtSlot = container.querySelector('#tx-debt-slot');
    debtSlot.style.display = isDebt ? 'block' : 'none';

    if (isDebt) {
      debtSlot.innerHTML = '';
      debtSlot.appendChild(renderDebtForm({ action: 'lend', onDone }));
      refreshIcons(container);
      return;
    }

    const isTransfer = currentType === 'transfer';
    container.querySelector('#tx-category-section').style.display = isTransfer ? 'none' : 'block';
    container.querySelector('#tx-to-wallet-section').style.display = isTransfer ? 'block' : 'none';
    container.querySelector('#tx-wallet-label').textContent = isTransfer ? 'Từ ví *' : 'Tài khoản / Ví *';

    if (!isTransfer) {
      const catSlot = container.querySelector('#tx-category-grid-slot');
      catSlot.innerHTML = '';
      const { categories, transactions } = stateStore.getState();
      catSlot.appendChild(renderCategoryGrid({
        categories: rankCategoriesByUsage(categories, transactions, getCurrentDateFormatted()),
        type: currentType,
        compact: true,
        collapsedCount: 9, // 2 rows of 5 with the "Xem tất cả" tile
        selectedId: currentCategoryId,
        onSelect: (id) => { currentCategoryId = id; },
        onCreate: () => openCategoryCreateSheet({
          type: currentType,
          onCreated: (newCat) => { currentCategoryId = newCat.id; syncUI(); }
        })
      }));
    }

    const wSlot = container.querySelector('#tx-wallet-picker-slot');
    wSlot.innerHTML = '';
    wSlot.appendChild(renderWalletPicker({
      wallets: state.wallets,
      selectedId: currentWalletId,
      onSelect: (wId) => { currentWalletId = wId; if (isTransfer) syncUI(); }
    }));

    if (isTransfer) {
      const toSlot = container.querySelector('#tx-to-wallet-picker-slot');
      toSlot.innerHTML = '';
      toSlot.appendChild(renderWalletPicker({
        wallets: state.wallets,
        selectedId: currentToWalletId,
        excludeId: currentWalletId,
        onSelect: (wId) => { currentToWalletId = wId; }
      }));
    }

    const saveBtn = container.querySelector('#btn-save-tx');
    if (saveBtn) {
      saveBtn.className = `btn-v2 flex-1 btn-save-tx ${currentType === 'income' ? 'btn-save-income' : currentType === 'transfer' ? 'btn-save-transfer' : 'btn-v2-primary'}`;
    }
    refreshIcons(container);
  }

  // Type switching
  container.querySelectorAll('#tx-type-segmented [data-type]').forEach((btn) => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('#tx-type-segmented [data-type]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentType = btn.getAttribute('data-type');
      syncUI();
    });
  });

  // Quick Chips
  container.querySelectorAll('.quick-chip-row [data-add]').forEach((chip) => {
    chip.addEventListener('click', () => {
      amountInput.value = formatNumber(getCurrencyValue(amountInput) + (Number(chip.getAttribute('data-add')) || 0));
    });
  });
  container.querySelector('#btn-tx-amount-clear').addEventListener('click', () => {
    amountInput.value = '';
    amountInput.focus();
  });

  // Date Quick Chips
  container.querySelector('#btn-date-today').addEventListener('click', () => {
    container.querySelector('#tx-date-input').value = getCurrentDateFormatted();
  });
  container.querySelector('#btn-date-yesterday').addEventListener('click', () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    container.querySelector('#tx-date-input').value = d.toISOString().split('T')[0];
  });

  // Note toggle
  container.querySelector('#btn-toggle-note').addEventListener('click', () => {
    const wrap = container.querySelector('#tx-note-wrapper');
    const isHidden = wrap.style.display === 'none';
    wrap.style.display = isHidden ? 'block' : 'none';
    if (isHidden) wrap.querySelector('input').focus();
    refreshIcons(container);
  });

  // Delete transaction in edit mode
  if (isEdit) {
    container.querySelector('#btn-delete-tx')?.addEventListener('click', async () => {
      const confirmed = await confirmDialog('Bạn có chắc chắn muốn xóa giao dịch này?', { danger: true });
      if (confirmed) {
        stateStore.deleteTransaction(txId);
        showToast('Đã xóa giao dịch', 'info');
        if (typeof onDone === 'function') onDone();
      }
    });
  }

  // Save transaction
  container.querySelector('#btn-save-tx').addEventListener('click', () => {
    handleSaveTransaction({
      container,
      isEdit,
      txId,
      currentType,
      currentCategoryId,
      currentWalletId,
      currentToWalletId,
      amountInput,
      onDone
    });
  });

  syncUI();
  refreshIcons(container);
  return container;
}
