/**
 * Debt Sheet Dialog Module
 * Opens a dedicated bottom sheet / modal for debt tracking.
 */
import { openSheet } from '../../ui/bottom-sheet.js';
import { renderDebtForm } from './debt-form.js';

/**
 * Open the debt management sheet
 * @param {object} options
 * @param {'lend'|'borrow'|'collect'|'repay'} [options.action='lend']
 * @param {string|null} [options.debtId=null]
 * @returns {{ close: Function, closed: Promise<any> }}
 */
export function openDebtSheet({ action = 'lend', debtId = null } = {}) {
  let sheet;
  const content = renderDebtForm({
    action,
    debtId,
    onDone: () => {
      if (sheet) sheet.close();
    }
  });

  sheet = openSheet({
    title: 'Ghi chép Vay / Nợ',
    content
  });

  return {
    close: sheet.close,
    closed: sheet.closed
  };
}
