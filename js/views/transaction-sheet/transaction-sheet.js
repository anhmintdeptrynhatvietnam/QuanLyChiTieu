/**
 * Transaction Bottom Sheet Orchestrator
 * Public entrypoint to open the transaction quick-add/edit modal sheet.
 */
import { openSheet } from '../../ui/bottom-sheet.js';
import { renderTransactionForm } from './transaction-form.js';

/**
 * Open the Transaction bottom sheet
 * @param {object} [options]
 * @param {string|null} [options.txId=null] - transaction id if editing
 * @param {'expense'|'income'|'transfer'|'debt'|null} [options.type=null]
 * @param {string|null} [options.walletId=null]
 * @returns {{ close: Function, closed: Promise<any> }}
 */
export function openTransactionSheet({ txId = null, type = null, walletId = null } = {}) {
  let sheet;

  const content = renderTransactionForm({
    txId,
    type,
    walletId,
    onDone: () => {
      if (sheet) sheet.close();
    }
  });

  const title = txId ? 'Sửa giao dịch' : 'Ghi giao dịch';

  sheet = openSheet({
    title,
    content
  });

  // Autofocus large amount input
  requestAnimationFrame(() => {
    const amountInput = content.querySelector('#tx-amount-hero');
    if (amountInput) {
      amountInput.focus();
    }
  });

  return {
    close: sheet.close,
    closed: sheet.closed
  };
}
