/**
 * Bottom Sheet for Viewing Debt Details and Repayment History
 */
import { openSheet } from '../../ui/bottom-sheet.js';
import { stateStore } from '../../state.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { escapeHtml } from '../../utils/helpers.js';
import { confirmDialog } from '../../components/confirm-dialog.js';
import { showToast } from '../../components/toast.js';
import { refreshIcons } from '../../ui/icons.js';
import { openDebtSheet } from '../debt-sheet/debt-sheet.js';
import { openDebtEditSheet } from './debt-edit-sheet.js';

export function openDebtDetailSheet({ debtId, onDone = null } = {}) {
  let sheet;
  const state = stateStore.getState();
  const debt = state.debts?.find(d => d.id === debtId);
  if (!debt) return null;

  const isLend = debt.type === 'lend';
  const isPaid = debt.status === 'paid';
  const wallet = state.wallets?.find(w => w.id === debt.walletId);
  const totalAmount = Number(debt.amount) || 0;
  const remAmount = Number(debt.remainingAmount) || 0;
  const paidAmount = Math.max(0, totalAmount - remAmount);
  const percent = totalAmount > 0 ? Math.min(100, Math.round((paidAmount / totalAmount) * 100)) : 0;

  const today = new Date().toISOString().split('T')[0];
  const isOverdue = Boolean(debt.dueDate && !isPaid && debt.dueDate < today);

  const content = document.createElement('div');
  content.className = 'debt-detail-container';

  content.innerHTML = `
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="badge ${isLend ? 'badge-income' : 'badge-expense'} font-bold">
          ${isLend ? 'Cho vay / Mua hộ' : 'Đi vay mượn'}
        </span>
        <span class="badge ${isPaid ? 'badge-income' : 'badge-subtle'} font-semibold">
          ${isPaid ? 'Đã hoàn tất' : `Đã trả ${percent}%`}
        </span>
      </div>
      <div class="flex items-center gap-1">
        <button type="button" class="btn-v2 btn-v2-secondary" id="btn-detail-edit" style="padding: 6px 12px; min-height: 36px; font-size: 13px;">
          <i data-lucide="edit-2" style="width: 14px; height: 14px;"></i>
          <span>Sửa</span>
        </button>
        <button type="button" class="btn-v2 btn-v2-danger" id="btn-detail-delete" style="padding: 6px 12px; min-height: 36px; font-size: 13px;">
          <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
          <span>Xóa</span>
        </button>
      </div>
    </div>

    <div>
      <span class="text-secondary font-medium" style="font-size: 12px; display: block;">Đối tác liên quan:</span>
      <h3 style="font-size: var(--font-size-xl); font-weight: 800; margin: 2px 0 8px;">${escapeHtml(debt.personName)}</h3>
      
      <div class="card-v2" style="background: var(--bg-subtle); padding: 12px 16px;">
        <div class="flex items-center justify-between">
          <span class="text-secondary font-medium" style="font-size: 13px;">Còn lại cần ${isLend ? 'thu' : 'trả'}:</span>
          <span class="font-bold ${isPaid ? 'text-muted' : (isLend ? 'text-income' : 'text-expense')}" style="font-size: 1.25rem;">
            ${formatCurrency(remAmount)}
          </span>
        </div>
        <div class="flex items-center justify-between text-muted" style="font-size: 11px; margin-top: 4px;">
          <span>Gốc: <strong>${formatCurrency(totalAmount)}</strong> (Ví: ${escapeHtml(wallet?.name || 'Mặc định')})</span>
          <span>Đã thanh toán: <strong>${formatCurrency(paidAmount)}</strong></span>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-1 text-muted" style="font-size: var(--font-size-xs);">
      <div class="flex items-center gap-1">
        <i data-lucide="calendar" style="width: 14px; height: 14px;"></i>
        <span>Ngày tạo: <strong>${formatDate(debt.createdAt)}</strong></span>
      </div>
      ${debt.dueDate ? `
        <div class="flex items-center gap-1 ${isOverdue ? 'debt-overdue' : ''}">
          <i data-lucide="clock" style="width: 14px; height: 14px;"></i>
          <span>Hạn trả: <strong>${formatDate(debt.dueDate)}</strong> ${isOverdue ? '(Quá hạn!)' : ''}</span>
        </div>
      ` : ''}
      ${debt.note ? `
        <div class="flex items-center gap-1" style="font-style: italic; margin-top: 2px;">
          <i data-lucide="pencil" style="width: 14px; height: 14px; flex-shrink: 0;"></i>
          <span>"${escapeHtml(debt.note)}"</span>
        </div>
      ` : ''}
    </div>

    <div>
      <h4 style="font-size: var(--font-size-sm); font-weight: 700; margin-bottom: 8px;">
        Lịch sử thanh toán (${debt.repayments?.length || 0})
      </h4>
      <div class="flex flex-col gap-2" id="debt-detail-history">
        ${(!debt.repayments || debt.repayments.length === 0) ? `
          <small class="text-muted" style="font-style: italic;">Chưa có lần thanh toán nào.</small>
        ` : debt.repayments.map(r => `
          <div class="debt-history-item">
            <div>
              <span class="font-medium">${formatDate(r.date)}</span>
              ${r.note ? `<small class="text-muted" style="display: block;">${escapeHtml(r.note)}</small>` : ''}
            </div>
            <strong class="text-primary">+${formatCurrency(r.amount)}</strong>
          </div>
        `).join('')}
      </div>
    </div>

    <div style="margin-top: var(--space-2); border-top: 1px solid var(--border-subtle); padding-top: var(--space-3);">
      ${!isPaid ? `
        <button type="button" class="btn-v2 ${isLend ? 'btn-v2-primary' : 'btn-v2-secondary'} w-full" id="btn-detail-repay">
          <i data-lucide="${isLend ? 'download' : 'upload'}" style="width: 16px; height: 16px;"></i>
          <span>${isLend ? 'Thu Nợ Đợt Này' : 'Trả Nợ Đợt Này'}</span>
        </button>
      ` : `
        <div class="flex items-center justify-center gap-2 text-income font-bold" style="font-size: 13px; padding: 6px 0;">
          <i data-lucide="check-circle-2" style="width: 16px; height: 16px;"></i>
          <span>Khoản nợ đã thanh toán hoàn tất</span>
        </div>
      `}
    </div>
  `;

  refreshIcons(content);

  // Edit button
  content.querySelector('#btn-detail-edit').addEventListener('click', () => {
    sheet?.close();
    openDebtEditSheet({
      debtId,
      onDone: () => {
        if (typeof onDone === 'function') onDone();
        openDebtDetailSheet({ debtId, onDone });
      }
    });
  });

  // Delete button
  content.querySelector('#btn-detail-delete').addEventListener('click', async () => {
    const confirmed = await confirmDialog('Bạn có chắc chắn muốn xóa khoản nợ này? Số dư ví sẽ được hoàn lại.', { danger: true });
    if (confirmed) {
      stateStore.deleteDebt(debtId);
      showToast('Đã xóa khoản nợ', 'success');
      sheet?.close();
      if (typeof onDone === 'function') onDone();
    }
  });

  // Repay button
  const repayBtn = content.querySelector('#btn-detail-repay');
  if (repayBtn) {
    repayBtn.addEventListener('click', () => {
      sheet?.close();
      openDebtSheet({
        action: isLend ? 'collect' : 'repay',
        debtId: debt.id
      });
    });
  }

  sheet = openSheet({
    title: 'Chi tiết Khoản Vay / Nợ',
    content
  });

  return {
    close: sheet.close,
    closed: sheet.closed
  };
}
