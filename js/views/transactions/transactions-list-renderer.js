/**
 * Transactions List Renderer
 * Renders day-grouped transactions, empty states, and pagination button.
 */
import { renderDayGroupHeader, renderTransactionRow } from '../../ui/transaction-row.js';
import { groupByDay } from '../../domain/period-summary.js';

export function renderTransactionsList({
  transactions = [],
  totalCount = 0,
  visibleCount = 50,
  wallets = [],
  categories = []
} = {}) {
  // Empty State 1: No data in state at all
  if (totalCount === 0) {
    return `
      <div class="card-v2 tx-empty-state">
        <div class="empty-state-icon-circle">
          <i data-lucide="receipt" style="width: 24px; height: 24px;"></i>
        </div>
        <h3 class="empty-state-title">Chưa có giao dịch nào</h3>
        <p class="empty-state-desc text-muted">Bắt đầu ghi lại các khoản thu, chi để theo dõi dòng tiền hàng ngày của bạn.</p>
        <button type="button" id="btn-tx-empty-add" class="btn-v2 btn-v2-primary mt-2">
          <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
          <span>Ghi giao dịch đầu tiên</span>
        </button>
      </div>
    `;
  }

  // Empty State 2: No transactions match filters
  if (transactions.length === 0) {
    return `
      <div class="card-v2 tx-empty-state">
        <div class="empty-state-icon-circle">
          <i data-lucide="search-x" style="width: 24px; height: 24px;"></i>
        </div>
        <h3 class="empty-state-title">Không tìm thấy giao dịch</h3>
        <p class="empty-state-desc text-muted">Không có giao dịch nào khớp với bộ lọc hoặc từ khoá tìm kiếm hiện tại.</p>
        <button type="button" id="btn-tx-reset-empty" class="btn-v2 btn-v2-secondary mt-2">
          <i data-lucide="rotate-ccw" style="width: 16px; height: 16px;"></i>
          <span>Xóa bộ lọc</span>
        </button>
      </div>
    `;
  }

  // Grouped transaction list
  const visibleTx = transactions.slice(0, visibleCount);
  const groups = groupByDay(visibleTx);

  const groupsHtml = groups
    .map(
      (group) => `
      <div class="card-v2 tx-day-card">
        ${renderDayGroupHeader(group)}
        <div class="tx-day-rows">
          ${group.items.map((tx) => renderTransactionRow(tx, { wallets, categories })).join('')}
        </div>
      </div>
    `
    )
    .join('');

  const remaining = transactions.length - visibleCount;
  const loadMoreHtml =
    remaining > 0
      ? `
      <div class="tx-load-more-wrap">
        <button type="button" id="btn-tx-load-more" class="btn-v2 btn-v2-secondary btn-load-more">
          <span>Xem thêm (${remaining} giao dịch)</span>
          <i data-lucide="chevron-down" style="width: 16px; height: 16px;"></i>
        </button>
      </div>
    `
      : '';

  return `
    <div class="tx-groups-container flex flex-col gap-3">
      ${groupsHtml}
      ${loadMoreHtml}
    </div>
  `;
}
