/**
 * Bottom Sheet for Setting, Updating, or Deleting Category Budget
 */
import { openSheet } from '../../ui/bottom-sheet.js';
import { stateStore } from '../../state.js';
import { formatNumber, formatMonthYearDisplay } from '../../utils/formatters.js';
import { escapeHtml, safeColor, safeIconName } from '../../utils/helpers.js';
import { confirmDialog } from '../../components/confirm-dialog.js';
import { showToast } from '../../components/toast.js';
import { attachCurrencyInput, getCurrencyValue } from '../../ui/currency-input.js';
import { refreshIcons } from '../../ui/icons.js';

export function openBudgetSheet({ categoryId, month, onDone = null } = {}) {
  let sheet;
  const state = stateStore.getState();
  const category = state.categories.find(c => c.id === categoryId);
  if (!category) return null;

  const existingBudget = state.budgets.find(b => b.categoryId === categoryId && b.month === month);
  const currentLimit = existingBudget ? Number(existingBudget.limitAmount) || 0 : 0;

  const content = document.createElement('div');
  content.className = 'budget-sheet-container';

  content.innerHTML = `
    <form id="budget-sheet-form" class="flex flex-col gap-4">
      <div class="flex items-center gap-3" style="padding: var(--space-2) 0;">
        <div class="budget-cat-icon" style="background: var(--bg-subtle);">
          <i data-lucide="${safeIconName(category.icon || 'tag')}" style="width: 22px; height: 22px; color: ${safeColor(category.color)};"></i>
        </div>
        <div>
          <h4 style="font-size: var(--font-size-base); font-weight: 700; margin: 0 0 2px;">
            ${escapeHtml(category.name)}
          </h4>
          <small class="text-secondary">Áp dụng cho tháng: <strong>${formatMonthYearDisplay(month)}</strong></small>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="bs-limit-input">Hạn mức chi tối đa (VNĐ) *</label>
        <input type="text" id="bs-limit-input" class="form-input font-bold" placeholder="0" style="font-size: 1.25rem;" required />
      </div>

      <div class="budget-quick-chips">
        <button type="button" class="chip-sm" data-add="500000">+500k</button>
        <button type="button" class="chip-sm" data-add="1000000">+1Tr</button>
        <button type="button" class="chip-sm" data-add="2000000">+2Tr</button>
        <button type="button" class="chip-sm" data-add="5000000">+5Tr</button>
        <button type="button" class="chip-sm chip-clear" id="bs-btn-clear">Xóa</button>
      </div>

      <div class="flex gap-3 justify-between" style="margin-top: var(--space-4);">
        ${existingBudget ? `
          <button type="button" class="btn-v2 btn-v2-danger" id="bs-btn-delete" title="Xóa hạn mức">
            <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
            <span>Xóa</span>
          </button>
        ` : ''}
        <button type="button" class="btn-v2 btn-v2-secondary" id="bs-btn-cancel">Hủy</button>
        <button type="submit" class="btn-v2 btn-v2-primary" style="flex: 1;">
          Lưu Hạn Mức
        </button>
      </div>
    </form>
  `;

  refreshIcons(content);

  const limitInput = content.querySelector('#bs-limit-input');
  const cancelBtn = content.querySelector('#bs-btn-cancel');
  const clearBtn = content.querySelector('#bs-btn-clear');
  const deleteBtn = content.querySelector('#bs-btn-delete');
  const form = content.querySelector('#budget-sheet-form');

  limitInput.value = currentLimit > 0 ? formatNumber(currentLimit) : '';
  attachCurrencyInput(limitInput);

  // Quick chip buttons
  content.querySelectorAll('.budget-quick-chips [data-add]').forEach(chip => {
    chip.addEventListener('click', () => {
      const addVal = Number(chip.getAttribute('data-add')) || 0;
      const current = getCurrencyValue(limitInput);
      limitInput.value = formatNumber(current + addVal);
    });
  });

  clearBtn.addEventListener('click', () => {
    limitInput.value = '';
    limitInput.focus();
  });

  cancelBtn.addEventListener('click', () => sheet?.close());

  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      const confirmed = await confirmDialog('Xóa hạn mức của hạng mục này trong tháng đã chọn?', { danger: true });
      if (confirmed) {
        stateStore.deleteBudget(categoryId, month);
        showToast('Đã xóa hạn mức ngân sách', 'success');
        if (typeof onDone === 'function') onDone();
        sheet?.close();
      }
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const limitAmount = getCurrencyValue(limitInput);
    if (limitAmount <= 0) {
      showToast('Vui lòng nhập hạn mức lớn hơn 0', 'error');
      limitInput.focus();
      return;
    }

    stateStore.setBudget(categoryId, month, limitAmount);
    showToast('Đã lưu hạn mức ngân sách', 'success');
    if (typeof onDone === 'function') onDone();
    sheet?.close();
  });

  sheet = openSheet({
    title: existingBudget ? 'Chỉnh Sửa Hạn Mức' : 'Đặt Hạn Mức Chi Tiêu',
    content
  });

  requestAnimationFrame(() => limitInput.focus());

  return {
    close: sheet.close,
    closed: sheet.closed
  };
}
