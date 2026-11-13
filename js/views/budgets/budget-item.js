/**
 * Budget Category Item Card Template Renderer
 */
import { computeCategorySpent, computeBudgetProgress } from '../../domain/budget-progress.js';
import { formatCurrency } from '../../utils/formatters.js';
import { escapeHtml, safeColor, safeIconName } from '../../utils/helpers.js';

export function renderBudgetItem(category, transactions, budgets, selectedMonth) {
  const spent = computeCategorySpent(transactions, category.id, selectedMonth);
  const budgetObj = budgets.find(b => b.categoryId === category.id && b.month === selectedMonth);
  const limit = budgetObj ? Number(budgetObj.limitAmount) : 0;
  const progress = computeBudgetProgress(spent, limit);

  let badgeText = `${progress.percent}%`;
  let badgeClass = 'badge-subtle';

  if (progress.isOver) {
    badgeText = `Vượt ${formatCurrency(progress.overAmount)}!`;
    badgeClass = 'badge-expense';
  } else if (!progress.hasBudget) {
    badgeText = 'Chưa đặt';
  } else if (progress.status === 'warning') {
    badgeClass = 'badge-subtle';
  }

  return `
    <div class="card-v2 budget-cat-card" data-cat-id="${escapeHtml(category.id)}">
      <div class="budget-cat-card-top">
        <div class="budget-cat-info">
          <div class="budget-cat-icon">
            <i data-lucide="${safeIconName(category.icon || 'tag')}" style="width: 20px; height: 20px; color: ${safeColor(category.color)};"></i>
          </div>
          <div>
            <h4 class="budget-cat-name">${escapeHtml(category.name)}</h4>
            <div class="budget-cat-amounts">
              Đã chi: <strong class="text-primary">${formatCurrency(spent)}</strong> / 
              ${progress.hasBudget ? `Hạn mức: ${formatCurrency(limit)}` : '<span class="text-muted">Chưa đặt hạn mức</span>'}
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span class="badge ${badgeClass} font-bold" style="color: ${progress.statusColor};">
            ${badgeText}
          </span>
          <button type="button" class="btn-v2 btn-v2-secondary btn-set-cat-budget" data-cat-id="${escapeHtml(category.id)}" style="padding: 4px 10px; min-height: 32px; font-size: 12px;">
            ${progress.hasBudget ? 'Sửa' : '+ Đặt'}
          </button>
        </div>
      </div>

      ${progress.hasBudget ? `
        <div class="budget-bar-bg">
          <div class="budget-bar-fill" style="width: ${progress.barPercent}%; background: ${progress.statusColor};"></div>
        </div>
      ` : ''}
    </div>
  `;
}
