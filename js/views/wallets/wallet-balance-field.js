/**
 * The single balance field of the wallet sheet: "Số dư hiện tại"
 * ("Dư nợ hiện tại" for credit cards).
 * Balances are derived (initial balance + replayed history), so the user only
 * ever sees the current balance; the stored initial balance is computed from it
 * (see js/domain/balance-reconcile.js) and history/reports stay unchanged.
 */
import { attachCurrencyInput, getCurrencyValue } from '../../ui/currency-input.js';
import { formatCurrency, formatNumber } from '../../utils/formatters.js';
import { reconcileInitialBalance, balanceFromInput, inputFromBalance } from '../../domain/balance-reconcile.js';

const CREDIT_NOTE = 'Thẻ tín dụng không được cộng vào Tổng tài sản.';

/**
 * @param {Object} params
 * @param {HTMLElement} params.container - element the field is rendered into
 * @param {Object|null} params.wallet - existing wallet (with derived currentBalance), null when creating
 * @param {HTMLSelectElement} params.typeSelect
 * @returns {{ getInitialBalance: () => number, input: HTMLInputElement }}
 */
export function mountBalanceField({ container, wallet, typeSelect }) {
  const isEdit = Boolean(wallet);
  const storedInitial = isEdit ? (Number(wallet.initialBalance) || 0) : 0;
  const current = isEdit ? (Number(wallet.currentBalance ?? storedInitial) || 0) : 0;

  container.className = 'form-group';
  container.innerHTML = `
    <label class="form-label" for="ws-wallet-balance"></label>
    <input type="text" id="ws-wallet-balance" class="form-input font-bold num" placeholder="0" />
    <small class="text-muted" style="display: block; margin-top: 4px; font-size: 11px;"></small>
  `;
  const label = container.querySelector('label');
  const input = container.querySelector('input');
  const hint = container.querySelector('small');

  // Only a value the user actually typed changes the balance (an untouched field keeps the stored one).
  let touched = false;
  const typedBalance = () => (input.value.trim() === '' ? current : balanceFromInput(typeSelect.value, getCurrencyValue(input)));

  function update() {
    const isCredit = typeSelect.value === 'credit';
    label.textContent = isCredit ? 'Dư nợ hiện tại (VNĐ)' : 'Số dư hiện tại (VNĐ)';
    const extra = isCredit ? ` ${CREDIT_NOTE}` : '';

    if (!isEdit) {
      hint.textContent = (isCredit ? 'Số tiền đang nợ trên thẻ lúc này (nếu có).' : 'Số tiền đang có trong ví lúc này.') + extra;
      return;
    }
    const diff = touched ? typedBalance() - current : 0;
    hint.textContent = diff === 0
      ? `Sửa thành số tiền thực tế nếu chưa khớp — lịch sử giao dịch và báo cáo giữ nguyên.${extra}`
      : `Chênh lệch ${diff > 0 ? '+' : '−'}${formatCurrency(Math.abs(diff))} so với số app đang tính (${formatCurrency(current)}).${extra}`;
  }

  input.value = isEdit ? formatNumber(inputFromBalance(typeSelect.value, current)) : '';
  attachCurrencyInput(input);
  input.addEventListener('input', () => { touched = true; update(); });
  typeSelect.addEventListener('change', update);
  update();

  return {
    input,
    getInitialBalance: () => {
      if (isEdit && !touched) return storedInitial;
      return reconcileInitialBalance({ initialBalance: storedInitial, currentBalance: current, actualBalance: typedBalance() });
    }
  };
}
