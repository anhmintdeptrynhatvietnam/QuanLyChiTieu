/**
 * Debt Picker Row Component
 * Renders list of open debts for collect / repay actions.
 */
import { formatCurrency } from '../../utils/formatters.js';
import { escapeHtml } from '../../utils/helpers.js';
import { refreshIcons } from '../../ui/icons.js';

export function renderDebtPickerRows({ container, currentAction, debts = [], selectedDebtId = null, onSelect = null } = {}) {
  if (!container) return;
  container.innerHTML = '';

  if (debts.length === 0) {
    const emptyMsg = currentAction === 'collect'
      ? '(Không có ai đang nợ bạn)'
      : '(Bạn không có khoản nợ nào cần trả)';
    container.innerHTML = `<p class="text-muted" style="text-align: center; padding: 12px 0; font-size: var(--font-size-sm);">${emptyMsg}</p>`;
    return;
  }

  debts.forEach((d) => {
    const isSelected = d.id === selectedDebtId;
    const row = document.createElement('button');
    row.type = 'button';
    row.className = `debt-picker-row${isSelected ? ' active' : ''}`;
    row.innerHTML = `
      <div class="flex items-center gap-2">
        <i data-lucide="${isSelected ? 'check-circle-2' : 'circle'}" style="width: 16px; height: 16px; color: ${isSelected ? 'var(--primary-500)' : 'var(--text-muted)'};"></i>
        <span style="font-weight: 600;">${escapeHtml(d.personName)}</span>
      </div>
      <span class="badge badge-subtle num" style="font-size: 12px;">Còn nợ: ${formatCurrency(d.remainingAmount)}</span>
    `;

    row.addEventListener('click', () => {
      if (typeof onSelect === 'function') {
        onSelect(d);
      }
    });

    container.appendChild(row);
  });

  refreshIcons(container);
}
