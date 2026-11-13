/**
 * Pure domain calculations for Budgets and Progress
 */

/**
 * Calculate total spent for a specific category in a given month (YYYY-MM).
 * @param {Array<object>} transactions
 * @param {string} categoryId
 * @param {string} month - Format "YYYY-MM"
 * @returns {number}
 */
export function computeCategorySpent(transactions, categoryId, month) {
  if (!Array.isArray(transactions) || !categoryId || !month) return 0;
  return transactions.reduce((sum, t) => {
    if (t?.type === 'expense' && t.categoryId === categoryId && typeof t.date === 'string' && t.date.startsWith(month)) {
      return sum + (Number(t.amount) || 0);
    }
    return sum;
  }, 0);
}

/**
 * Calculate progress metrics for a budget limit and spent amount.
 * Green (< 80%), Amber/Warning (80-100%), Red/Danger (> 100%).
 *
 * @param {number|string} spent
 * @param {number|string} limit
 * @returns {{
 *   spent: number,
 *   limit: number,
 *   hasBudget: boolean,
 *   percent: number,
 *   barPercent: number,
 *   isOver: boolean,
 *   remaining: number,
 *   overAmount: number,
 *   status: 'none'|'safe'|'warning'|'danger',
 *   statusColor: string
 * }}
 */
export function computeBudgetProgress(spent, limit) {
  const numericSpent = Math.max(0, Number(spent) || 0);
  const numericLimit = Math.max(0, Number(limit) || 0);
  const hasBudget = numericLimit > 0;

  if (!hasBudget) {
    return {
      spent: numericSpent,
      limit: 0,
      hasBudget: false,
      percent: 0,
      barPercent: 0,
      isOver: false,
      remaining: 0,
      overAmount: 0,
      status: 'none',
      statusColor: 'var(--text-muted)'
    };
  }

  const rawPercent = Math.round((numericSpent / numericLimit) * 100);
  const barPercent = Math.min(100, rawPercent);
  const isOver = numericSpent > numericLimit;
  const remaining = Math.max(0, numericLimit - numericSpent);
  const overAmount = isOver ? numericSpent - numericLimit : 0;

  let status = 'safe';
  let statusColor = 'var(--income-primary)';

  if (isOver) {
    status = 'danger';
    statusColor = 'var(--expense-primary)';
  } else if (rawPercent >= 80) {
    status = 'warning';
    statusColor = 'var(--warning-primary)';
  }

  return {
    spent: numericSpent,
    limit: numericLimit,
    hasBudget: true,
    percent: rawPercent,
    barPercent,
    isOver,
    remaining,
    overAmount,
    status,
    statusColor
  };
}

/**
 * Calculate overall monthly budget and expenditure summary.
 * @param {Array<object>} categories
 * @param {Array<object>} budgets
 * @param {Array<object>} transactions
 * @param {string} month - Format "YYYY-MM"
 * @returns {object}
 */
export function computeMonthBudgetSummary(categories, budgets, transactions, month) {
  if (!month) return { totalBudget: 0, totalSpent: 0, ...computeBudgetProgress(0, 0) };

  const validBudgets = Array.isArray(budgets) ? budgets.filter(b => b?.month === month) : [];
  const totalBudget = validBudgets.reduce((sum, b) => sum + (Number(b?.limitAmount) || 0), 0);

  const validTransactions = Array.isArray(transactions) ? transactions : [];
  const totalSpent = validTransactions.reduce((sum, t) => {
    if (t?.type === 'expense' && typeof t?.date === 'string' && t.date.startsWith(month)) {
      return sum + (Number(t.amount) || 0);
    }
    return sum;
  }, 0);

  const progress = computeBudgetProgress(totalSpent, totalBudget);

  return {
    month,
    totalBudget,
    totalSpent,
    ...progress
  };
}
