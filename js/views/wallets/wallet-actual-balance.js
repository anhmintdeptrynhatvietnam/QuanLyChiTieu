/**
 * "Số dư thực tế hiện tại" field of the edit-wallet sheet.
 * Typing the real-world balance shifts the wallet's initial balance by the
 * difference (see js/domain/balance-reconcile.js), so the derived balance matches
 * while transaction history and monthly reports stay unchanged.
 */
import { attachCurrencyInput, getCurrencyValue } from '../../ui/currency-input.js';
import { formatCurrency, formatNumber } from '../../utils/formatters.js';
import { reconcileInitialBalance, balanceFromInput, inputFromBalance } from '../../domain/balance-reconcile.js';

function formatSigned(value) {
  return value < 0 ? `−${formatNumber(-value)}` : formatNumber(value);
}

/**
 * @param {Object} params
 * @param {HTMLElement} params.anchor - the field is inserted before this element
 * @param {Object} params.wallet - existing wallet (with derived currentBalance)
 * @param {HTMLSelectElement} params.typeSelect
 * @param {HTMLInputElement} params.initialInput - "Số dư ban đầu" input
 * @returns {{ getInitialOverride: () => number|null }}
 */
export function mountActualBalanceField({ anchor, wallet, typeSelect, initialInput }) {
  const storedInitial = Number(wallet.initialBalance) || 0;
  const current = Number(wallet.currentBalance ?? storedInitial) || 0;
  const originalInitialText = initialInput.value;
  let pendingInitial = null;

  const group = document.createElement('div');
  group.className = 'form-group';
  group.innerHTML = `
    <label class="form-label" for="ws-wallet-actual"></label>
    <input type="text" id="ws-wallet-actual" class="form-input font-bold num" placeholder="0" />
    <small class="text-muted" style="display: block; margin-top: 4px; font-size: 11px;"></small>
  `;
  anchor.parentNode.insertBefore(group, anchor);

  const label = group.querySelector('label');
  const input = group.querySelector('input');
  const hint = group.querySelector('small');

  function baseHint() {
    return `App đang tính: ${formatCurrency(current)}. Nhập số tiền ngoài đời để khớp — lịch sử và báo cáo giữ nguyên.`;
  }

  function update() {
    const type = typeSelect.value;
    label.textContent = type === 'credit' ? 'Dư nợ thực tế hiện tại (VNĐ)' : 'Số dư thực tế hiện tại (VNĐ)';
    const typed = input.value.trim() === '' ? null : getCurrencyValue(input);
    const actual = typed === null ? current : balanceFromInput(type, typed);

    if (actual === current) {
      pendingInitial = null;
      initialInput.disabled = false;
      initialInput.value = originalInitialText;
      hint.textContent = baseHint();
      return;
    }

    pendingInitial = reconcileInitialBalance({ initialBalance: storedInitial, currentBalance: current, actualBalance: actual });
    initialInput.disabled = true;
    initialInput.value = formatSigned(pendingInitial);
    const diff = actual - current;
    hint.textContent = `Chênh lệch ${diff > 0 ? '+' : '−'}${formatCurrency(Math.abs(diff))} so với app. Số dư ban đầu sẽ được chỉnh thành ${formatSigned(pendingInitial)} ₫.`;
  }

  input.value = formatNumber(inputFromBalance(typeSelect.value, current));
  attachCurrencyInput(input);
  input.addEventListener('input', update);
  typeSelect.addEventListener('change', update);
  update();

  return {
    getInitialOverride: () => pendingInitial
  };
}
