/**
 * Shared Transaction Row & Day Group UI Component
 * Renders individual transaction rows and day headers with proper semantic markup,
 * category icons, wallet/note info, and click handlers.
 */
import { formatCurrency } from '../utils/formatters.js';
import { escapeHtml, safeColor, safeIconName } from '../utils/helpers.js';
import { openTransactionSheet } from '../views/transaction-sheet/transaction-sheet.js';

/**
 * Format date string into Vietnamese label: "Hôm nay, DD/MM/YYYY", "Hôm qua, DD/MM/YYYY", or "Thứ X, DD/MM/YYYY"
 * @param {string} dateString
 * @returns {string}
 */
function formatDayGroupLabel(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayName = daysOfWeek[date.getDay()];
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return `Hôm nay, ${dd}/${mm}/${yyyy}`;
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return `Hôm qua, ${dd}/${mm}/${yyyy}`;
  }
  return `${dayName}, ${dd}/${mm}/${yyyy}`;
}

/**
 * Render day group header HTML
 * @param {{ date: string, items: Array<object>, income: number, expense: number }} group
 * @returns {string}
 */
export function renderDayGroupHeader(group) {
  if (!group) return '';
  const dateLabel = formatDayGroupLabel(group.date);

  let totalsHtml = '';
  if (group.income > 0 || group.expense > 0) {
    totalsHtml = `
      <div class="tx-day-totals num">
        ${group.income > 0 ? `<span class="tx-day-income">+${formatCurrency(group.income)}</span>` : ''}
        ${group.expense > 0 ? `<span class="tx-day-expense">-${formatCurrency(group.expense)}</span>` : ''}
      </div>
    `;
  }

  return `
    <div class="tx-day-header">
      <span class="tx-day-date font-medium">${escapeHtml(dateLabel)}</span>
      ${totalsHtml}
    </div>
  `;
}

/**
 * Render single transaction row HTML
 * @param {object} tx
 * @param {object} options
 * @param {Array<object>} [options.wallets]
 * @param {Array<object>} [options.categories]
 * @returns {string}
 */
export function renderTransactionRow(tx, { wallets = [], categories = [] } = {}) {
  if (!tx) return '';

  const isIncome = tx.type === 'income';
  const isTransfer = tx.type === 'transfer';
  const isExpense = tx.type === 'expense';

  let title = 'Giao dịch';
  let iconName = 'tag';
  let color = '#64748b';
  let amountPrefix = '';
  let amountClass = 'text-muted';

  if (isIncome) {
    const cat = categories.find((c) => String(c.id) === String(tx.categoryId));
    title = cat?.name || 'Thu nhập';
    iconName = safeIconName(cat?.icon || 'plus-circle');
    color = safeColor(cat?.color || '#059669');
    amountPrefix = '+';
    amountClass = 'text-income';
  } else if (isExpense) {
    const cat = categories.find((c) => String(c.id) === String(tx.categoryId));
    title = cat?.name || 'Chi tiêu';
    iconName = safeIconName(cat?.icon || 'shopping-bag');
    color = safeColor(cat?.color || '#e11d48');
    amountPrefix = '-';
    amountClass = 'text-expense';
  } else if (isTransfer) {
    const toW = wallets.find((w) => String(w.id) === String(tx.toWalletId));
    title = toW ? `Chuyển sang ${toW.name}` : 'Chuyển tiền';
    iconName = 'arrow-right-left';
    color = '#7c3aed';
    amountPrefix = '';
    amountClass = 'text-transfer';
  }

  const fromW = wallets.find((w) => String(w.id) === String(tx.walletId));
  const walletName = fromW ? fromW.name : 'Ví';
  const note = (tx.note || '').trim();
  const subtitle = note ? `${walletName} • ${note}` : walletName;
  const amount = Number(tx.amount) || 0;

  return `
    <div class="row-v2 tx-row" data-tx-id="${escapeHtml(tx.id)}" role="button" tabindex="0">
      <div class="tx-row-left">
        <div class="tx-icon-circle" style="background-color: ${color}26; color: ${color};">
          <i data-lucide="${iconName}" style="width: 18px; height: 18px;"></i>
        </div>
        <div class="tx-row-info">
          <div class="tx-row-title font-medium">${escapeHtml(title)}</div>
          <div class="tx-row-subtitle text-muted">${escapeHtml(subtitle)}</div>
        </div>
      </div>
      <div class="tx-row-right">
        <span class="tx-row-amount font-bold num ${amountClass}">
          ${amountPrefix}${formatCurrency(amount)}
        </span>
      </div>
    </div>
  `;
}

/**
 * Bind click and keyboard handlers to all transaction rows within a container
 * Clicking a row opens the transaction edit sheet.
 * @param {HTMLElement} root
 */
export function bindTransactionRows(root) {
  if (!root) return;
  const rows = root.querySelectorAll('.tx-row[data-tx-id]');
  rows.forEach((row) => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('button, a')) return;
      const txId = row.getAttribute('data-tx-id');
      if (txId) {
        openTransactionSheet({ txId });
      }
    });
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const txId = row.getAttribute('data-tx-id');
        if (txId) {
          openTransactionSheet({ txId });
        }
      }
    });
  });
}
