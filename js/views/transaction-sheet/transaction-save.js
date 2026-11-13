/**
 * Transaction Save Action Handler
 * Validates inputs, shows inline errors, persists payload, and shows toast.
 */
import { stateStore } from '../../state.js';
import { getCurrentDateFormatted } from '../../utils/helpers.js';
import { showToast } from '../../components/toast.js';
import { getCurrencyValue } from '../../ui/currency-input.js';
import { validateEntry } from '../../domain/transaction-entry.js';
import { saveLastEntry } from './last-entry.js';

export function handleSaveTransaction({
  container,
  isEdit,
  txId,
  currentType,
  currentCategoryId,
  currentWalletId,
  currentToWalletId,
  amountInput,
  onDone
}) {
  const amount = getCurrencyValue(amountInput);
  const date = container.querySelector('#tx-date-input').value || getCurrentDateFormatted();
  const note = container.querySelector('#tx-note-input').value.trim();

  container.querySelectorAll('.sheet-field-error').forEach((el) => {
    el.style.display = 'none';
  });

  const check = validateEntry({
    type: currentType,
    amount,
    categoryId: currentCategoryId,
    walletId: currentWalletId,
    toWalletId: currentToWalletId
  });

  if (!check.ok) {
    if (check.errors.amount) {
      const el = container.querySelector('#tx-amount-error');
      el.textContent = check.errors.amount;
      el.style.display = 'block';
      amountInput.focus();
    }
    if (check.errors.categoryId) {
      const el = container.querySelector('#tx-category-error');
      el.textContent = check.errors.categoryId;
      el.style.display = 'block';
    }
    if (check.errors.walletId) {
      const el = container.querySelector('#tx-wallet-error');
      el.textContent = check.errors.walletId;
      el.style.display = 'block';
    }
    if (check.errors.toWalletId) {
      const el = container.querySelector('#tx-to-wallet-error');
      el.textContent = check.errors.toWalletId;
      el.style.display = 'block';
    }
    return;
  }

  const payload = {
    type: currentType,
    amount,
    walletId: currentWalletId,
    toWalletId: currentType === 'transfer' ? currentToWalletId : null,
    categoryId: currentType !== 'transfer' ? currentCategoryId : '',
    date,
    note
  };

  saveLastEntry({ type: currentType, walletId: currentWalletId, toWalletId: currentToWalletId });

  if (isEdit) {
    stateStore.updateTransaction(txId, payload);
    showToast('Đã cập nhật giao dịch', 'success');
  } else {
    stateStore.addTransaction(payload);
    showToast('Đã ghi nhận giao dịch', 'success');
  }

  if (typeof onDone === 'function') {
    onDone();
  }
}
