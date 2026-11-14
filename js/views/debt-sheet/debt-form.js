/**
 * Debt Form Component (Vay / Nợ)
 * Manages actions: Cho vay (lend), Đi vay (borrow), Thu nợ (collect), Trả nợ (repay).
 */
import { stateStore } from '../../state.js';
import { formatCurrency, formatNumber } from '../../utils/formatters.js';
import { getCurrentDateFormatted } from '../../utils/helpers.js';
import { showToast } from '../../components/toast.js';
import { canRepay, describeRepaymentError } from '../../domain/debt-rules.js';
import { attachCurrencyInput, getCurrencyValue } from '../../ui/currency-input.js';
import { renderWalletPicker } from '../../ui/wallet-picker.js';
import { refreshIcons } from '../../ui/icons.js';
import { getDebtFormHTML, DEBT_ACTIONS } from './debt-form-template.js';
import { renderDebtPickerRows } from './debt-picker.js';

export function renderDebtForm({ action = 'lend', debtId = null, onDone = null } = {}) {
  const formEl = document.createElement('div');
  formEl.className = 'debt-form flex flex-col gap-4';

  let currentAction = action;
  let selectedDebtId = debtId;
  const state = stateStore.getState();
  let selectedWalletId = state.wallets?.[0]?.id || null;

  formEl.innerHTML = getDebtFormHTML({ currentAction });

  const amountInput = formEl.querySelector('#debt-amount-input');
  const amountError = formEl.querySelector('#debt-amount-error');
  const personGroup = formEl.querySelector('#debt-person-group');
  const personLabel = formEl.querySelector('#debt-person-label');
  const personInput = formEl.querySelector('#debt-person-name');
  const personError = formEl.querySelector('#debt-person-error');
  const pickerGroup = formEl.querySelector('#debt-picker-group');
  const pickerList = formEl.querySelector('#debt-picker-list');
  const pickerError = formEl.querySelector('#debt-select-error');
  const dueGroup = formEl.querySelector('#debt-due-group');
  const walletLabel = formEl.querySelector('#debt-wallet-label');
  const descEl = formEl.querySelector('#debt-action-desc');

  attachCurrencyInput(amountInput);

  function updateSlots() {
    const act = DEBT_ACTIONS.find((a) => a.id === currentAction);
    descEl.textContent = act?.desc || '';

    const slot = formEl.querySelector('#debt-wallet-slot');
    slot.innerHTML = '';
    slot.appendChild(renderWalletPicker({
      wallets: state.wallets,
      wrap: true,
      showBalance: false,
      selectedId: selectedWalletId,
      onSelect: (wId) => { selectedWalletId = wId; }
    }));

    if (currentAction === 'lend' || currentAction === 'borrow') {
      personGroup.style.display = 'block';
      dueGroup.style.display = 'block';
      pickerGroup.style.display = 'none';
      personLabel.textContent = currentAction === 'lend' ? 'Người vay tiền / Mua hộ *' : 'Người cho vay *';
      walletLabel.textContent = currentAction === 'lend' ? 'Ví xuất tiền cho vay *' : 'Ví nhận tiền vay *';
    } else {
      personGroup.style.display = 'none';
      dueGroup.style.display = 'none';
      pickerGroup.style.display = 'block';
      walletLabel.textContent = currentAction === 'collect' ? 'Ví nhận tiền thu nợ *' : 'Ví thanh toán tiền trả nợ *';

      const targetType = currentAction === 'collect' ? 'lend' : 'borrow';
      const debts = (state.debts || []).filter((d) => d.type === targetType && d.status !== 'paid');

      if (!selectedDebtId || !debts.some((d) => d.id === selectedDebtId)) {
        selectedDebtId = debts[0]?.id || null;
      }
      // Prefill with the remaining amount of the selected debt (also when opened with a debtId).
      const selectedDebt = debts.find((d) => d.id === selectedDebtId);
      if (selectedDebt?.remainingAmount && !amountInput.value) {
        amountInput.value = formatNumber(selectedDebt.remainingAmount);
      }

      renderDebtPickerRows({
        container: pickerList,
        currentAction,
        debts,
        selectedDebtId,
        onSelect: (d) => {
          selectedDebtId = d.id;
          amountInput.value = formatNumber(d.remainingAmount);
          updateSlots();
        }
      });
    }
    refreshIcons(formEl);
  }

  // Segmented action switching
  formEl.querySelectorAll('[data-debt-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      formEl.querySelectorAll('[data-debt-action]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentAction = btn.getAttribute('data-debt-action');
      updateSlots();
    });
  });

  // Quick amount chips
  formEl.querySelectorAll('.quick-chip-row [data-add]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const addVal = Number(chip.getAttribute('data-add')) || 0;
      amountInput.value = formatNumber(getCurrencyValue(amountInput) + addVal);
    });
  });
  formEl.querySelector('#btn-debt-amount-clear').addEventListener('click', () => {
    amountInput.value = '';
    amountInput.focus();
  });

  // Submit Handler
  formEl.querySelector('#btn-submit-debt').addEventListener('click', () => {
    amountError.style.display = 'none';
    personError.style.display = 'none';
    pickerError.style.display = 'none';

    const amount = getCurrencyValue(amountInput);
    if (amount <= 0) {
      amountError.textContent = 'Vui lòng nhập số tiền lớn hơn 0';
      amountError.style.display = 'block';
      amountInput.focus();
      return;
    }

    const note = formEl.querySelector('#debt-note').value.trim();

    if (currentAction === 'lend' || currentAction === 'borrow') {
      const personName = personInput.value.trim();
      if (!personName) {
        personError.textContent = 'Vui lòng nhập tên người vay / cho vay';
        personError.style.display = 'block';
        personInput.focus();
        return;
      }
      const dueDate = formEl.querySelector('#debt-due-date').value || null;
      stateStore.addDebt({ personName, type: currentAction, amount, walletId: selectedWalletId, dueDate, note });
      showToast('Đã ghi nhận khoản Vay / Nợ', 'success');
      if (typeof onDone === 'function') onDone();
    } else {
      if (!selectedDebtId) {
        pickerError.textContent = 'Vui lòng chọn khoản nợ cần thanh toán';
        pickerError.style.display = 'block';
        return;
      }
      const debt = (stateStore.getState().debts || []).find((d) => d.id === selectedDebtId);
      const check = canRepay(debt, amount);
      if (!check.ok) {
        amountError.textContent = describeRepaymentError(check, formatCurrency);
        amountError.style.display = 'block';
        return;
      }
      stateStore.recordRepayment(selectedDebtId, { amount, walletId: selectedWalletId, date: getCurrentDateFormatted(), note });
      showToast('Đã ghi nhận thanh toán nợ', 'success');
      if (typeof onDone === 'function') onDone();
    }
  });

  updateSlots();
  refreshIcons(formEl);
  return formEl;
}
