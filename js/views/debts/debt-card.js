/**
 * Debt Card Item Template Renderer
 */
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { escapeHtml } from '../../utils/helpers.js';
import { isAmountVisible, renderEyeButton } from '../../utils/privacy.js';

export function renderDebtCard(debt) {
  const isLend = debt.type === 'lend';
  const isPaid = debt.status === 'paid';
  const totalAmount = Number(debt.amount) || 0;
  const remAmount = Number(debt.remainingAmount) || 0;
  const paidAmount = Math.max(0, totalAmount - remAmount);
  const percent = totalAmount > 0 ? Math.min(100, Math.round((paidAmount / totalAmount) * 100)) : 0;

  const today = new Date().toISOString().split('T')[0];
  const isOverdue = Boolean(debt.dueDate && !isPaid && debt.dueDate < today);
  const isVis = isAmountVisible(`debt_${debt.id}`);

  return `
    <div class="card-v2 debt-card-item ${isLend ? 'lend' : 'borrow'}" data-debt-id="${escapeHtml(debt.id)}">
      <div>
        <div class="debt-card-header">
          <span class="badge ${isLend ? 'badge-income' : 'badge-expense'} font-medium">
            ${isLend ? 'Cho vay' : 'Đi vay'}
          </span>
          <span class="badge ${isPaid ? 'badge-income' : 'badge-subtle'}">
            ${isPaid ? 'Đã hoàn tất' : `Đã trả ${percent}%`}
          </span>
        </div>

        <h3 class="debt-card-person">${escapeHtml(debt.personName)}</h3>
        
        <div style="margin: var(--space-2) 0;">
          <span class="text-secondary" style="font-size: 11px; display: block;">Còn lại cần ${isLend ? 'thu' : 'trả'}:</span>
          <div class="flex items-center gap-2">
            <div class="font-bold ${isPaid ? 'text-muted' : (isLend ? 'text-income' : 'text-expense')}" style="font-size: 1.25rem;">
              ${isVis ? formatCurrency(remAmount) : '<span class="masked-amount">••••••••</span>'}
            </div>
            ${renderEyeButton(`debt_${debt.id}`)}
          </div>
          <small class="text-muted" style="font-size: 11px;">Gốc: ${isVis ? formatCurrency(totalAmount) : '••••••••'}</small>
        </div>

        <div class="debt-progress-bar-bg">
          <div class="debt-progress-bar-fill" style="width: ${percent}%; background: ${isPaid ? 'var(--income-primary)' : 'var(--primary-500)'};"></div>
        </div>

        <div class="flex flex-col gap-1 text-muted" style="font-size: 11px; margin-top: var(--space-2);">
          <div>Ngày tạo: <strong>${formatDate(debt.createdAt)}</strong></div>
          ${debt.dueDate ? `
            <div class="${isOverdue ? 'debt-overdue' : ''}">
              Hạn trả: <strong>${formatDate(debt.dueDate)}</strong> ${isOverdue ? '(Quá hạn!)' : ''}
            </div>
          ` : ''}
        </div>
      </div>

      <div style="margin-top: var(--space-3); border-top: 1px solid var(--border-subtle); padding-top: var(--space-2);">
        ${!isPaid ? `
          <button type="button" class="btn-v2 ${isLend ? 'btn-v2-primary' : 'btn-v2-secondary'} w-full btn-quick-repay" data-id="${escapeHtml(debt.id)}">
            <i data-lucide="${isLend ? 'download' : 'upload'}" style="width: 14px; height: 14px;"></i>
            <span>${isLend ? 'Thu nợ' : 'Trả nợ'}</span>
          </button>
        ` : `
          <div class="text-income font-medium text-center" style="font-size: 12px; padding: 4px 0;">
            ✓ Hoàn tất
          </div>
        `}
      </div>
    </div>
  `;
}
