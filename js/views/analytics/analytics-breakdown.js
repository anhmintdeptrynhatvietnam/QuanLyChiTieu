/**
 * Category Breakdown & Ranked Legend Renderer for Analytics
 */
import { formatCurrency } from '../../utils/formatters.js';
import { escapeHtml, safeColor, safeIconName } from '../../utils/helpers.js';

/**
 * Render Ranked Category Legend items
 * @param {Array<{ categoryId: string, name: string, color: string, icon: string, amount: number, percentage: number }>} items
 * @returns {string} HTML string
 */
export function renderRankedLegend(items = []) {
  if (!items.length) {
    return `
      <div class="analytics-empty-state">
        <i data-lucide="pie-chart" style="width: 32px; height: 32px; color: var(--text-muted);"></i>
        <p class="text-muted" style="margin: var(--space-2) 0 0; font-size: var(--font-size-sm);">
          Chưa có chi tiêu trong tháng này
        </p>
      </div>
    `;
  }

  return `
    <div class="analytics-legend-list">
      ${items.map((item, idx) => `
        <div class="analytics-legend-item">
          <div class="analytics-legend-left">
            <span class="analytics-rank-badge">${idx + 1}</span>
            <span class="analytics-color-dot" style="background-color: ${safeColor(item.color)};"></span>
            <span class="analytics-cat-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
          </div>
          <div class="analytics-legend-right">
            <span class="analytics-cat-amount num font-semibold">${formatCurrency(item.amount)}</span>
            <span class="analytics-cat-pct badge badge-subtle font-medium">${item.percentage}%</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Render detailed category table rows
 * @param {Array<{ categoryId: string, name: string, color: string, icon: string, amount: number, txCount: number, percentage: number }>} items
 * @returns {string} HTML string
 */
export function renderBreakdownTableRows(items = []) {
  if (!items.length) {
    return `
      <tr>
        <td colspan="4" style="text-align: center; padding: 24px; color: var(--text-muted);">
          Không có dữ liệu chi tiêu trong tháng này
        </td>
      </tr>
    `;
  }

  return items.map(item => `
    <tr class="analytics-table-row">
      <td style="padding: 12px 8px;">
        <div class="flex items-center gap-2">
          <span class="analytics-table-dot" style="background-color: ${safeColor(item.color)};"></span>
          <span class="font-medium" style="color: var(--text-primary);">${escapeHtml(item.name)}</span>
        </div>
      </td>
      <td style="padding: 12px 8px; text-align: center;" class="text-secondary num">${item.txCount}</td>
      <td style="padding: 12px 8px; text-align: right;" class="text-expense font-semibold num">${formatCurrency(item.amount)}</td>
      <td style="padding: 12px 8px; text-align: right;" class="font-medium num">${item.percentage}%</td>
    </tr>
  `).join('');
}
