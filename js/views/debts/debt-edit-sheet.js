/**
 * Bottom Sheet for Editing Existing Debt Info
 */
import { openSheet } from '../../ui/bottom-sheet.js';
import { stateStore } from '../../state.js';
import { formatCurrency } from '../../utils/formatters.js';
import { escapeHtml } from '../../utils/helpers.js';
import { showToast } from '../../components/toast.js';

export function openDebtEditSheet({ debtId, onDone = null } = {}) {
  let sheet;
  const state = stateStore.getState();
  const debt = state.debts?.find(d => d.id === debtId);
  if (!debt) return null;

  const content = document.createElement('div');
  content.className = 'flex flex-col gap-4';

  const isLend = debt.type === 'lend';
  const personRole = isLend ? 'Người vay tiền / Mua hộ *' : 'Người cho bạn vay tiền *';

  content.innerHTML = `
    <form id="debt-edit-form" class="flex flex-col gap-4">
      <div class="form-group">
        <label class="form-label">${escapeHtml(personRole)}</label>
        <input type="text" id="edit-debt-person" class="form-input" value="${escapeHtml(debt.personName || '')}" required />
      </div>

      <div class="form-group">
        <label class="form-label">Số tiền gốc ban đầu</label>
        <input type="text" class="form-input font-bold" value="${formatCurrency(debt.amount)}" disabled style="background: var(--bg-subtle);" />
        <small class="text-muted" style="font-size: 11px;">Số tiền gốc không thể thay đổi sau khi tạo.</small>
      </div>

      <div class="form-group">
        <label class="form-label">Ngày hẹn trả</label>
        <input type="date" id="edit-debt-due-date" class="form-input" value="${escapeHtml(debt.dueDate || '')}" />
      </div>

      <div class="form-group">
        <label class="form-label">Ghi chú</label>
        <input type="text" id="edit-debt-note" class="form-input" value="${escapeHtml(debt.note || '')}" placeholder="Ghi chú thêm..." />
      </div>

      <div class="flex gap-3 justify-between" style="margin-top: var(--space-4);">
        <button type="button" class="btn-v2 btn-v2-secondary" id="btn-cancel-edit-debt">Hủy</button>
        <button type="submit" class="btn-v2 btn-v2-primary" style="flex: 1;">Lưu Thay Đổi</button>
      </div>
    </form>
  `;

  const personInput = content.querySelector('#edit-debt-person');
  const dueDateInput = content.querySelector('#edit-debt-due-date');
  const noteInput = content.querySelector('#edit-debt-note');
  const cancelBtn = content.querySelector('#btn-cancel-edit-debt');
  const form = content.querySelector('#debt-edit-form');

  cancelBtn.addEventListener('click', () => sheet?.close());

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const personName = personInput.value.trim();
    if (!personName) {
      showToast('Vui lòng nhập tên người liên quan', 'error');
      personInput.focus();
      return;
    }

    const dueDate = dueDateInput.value || null;
    const note = noteInput.value.trim();

    stateStore.updateDebt(debtId, { personName, dueDate, note });
    showToast('Đã cập nhật khoản nợ', 'success');

    if (typeof onDone === 'function') onDone();
    sheet?.close();
  });

  sheet = openSheet({
    title: 'Chỉnh Sửa Khoản Vay / Nợ',
    content
  });

  requestAnimationFrame(() => personInput.focus());

  return {
    close: sheet.close,
    closed: sheet.closed
  };
}
