/**
 * Period Summary Domain Functions
 * Pure calculations for monthly summaries, budget alerts, and date grouping.
 * Zero imports / no external dependencies.
 */

/**
 * Calculate income, expense, and net savings for a given month.
 * Transfers are excluded from income and expense.
 *
 * @param {Array<object>} transactions
 * @param {string} monthKey - Format 'YYYY-MM'
 * @returns {{ income: number, expense: number, net: number }}
 */
export function monthSummary(transactions = [], monthKey = '') {
  let income = 0;
  let expense = 0;

  if (Array.isArray(transactions) && monthKey) {
    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      if (tx && typeof tx.date === 'string' && tx.date.startsWith(monthKey)) {
        const amt = Number(tx.amount) || 0;
        if (tx.type === 'income') {
          income += amt;
        } else if (tx.type === 'expense') {
          expense += amt;
        }
      }
    }
  }

  return {
    income,
    expense,
    net: income - expense
  };
}

/**
 * Find budgets exceeding or approaching threshold (default 80%) for a given month.
 * Returns sorted list by ratio descending, maximum 3 items.
 *
 * @param {Array<object>} budgets
 * @param {Array<object>} transactions
 * @param {Array<object>} categories
 * @param {string} monthKey - Format 'YYYY-MM'
 * @param {number} [threshold=0.8]
 * @returns {Array<{ categoryId: string, name: string, spent: number, limit: number, ratio: number }>}
 */
export function budgetAlerts(
  budgets = [],
  transactions = [],
  categories = [],
  monthKey = '',
  threshold = 0.8
) {
  if (!Array.isArray(budgets) || !monthKey) return [];

  // Calculate total expense per category in monthKey
  const spentByCat = {};
  if (Array.isArray(transactions)) {
    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      if (
        tx &&
        tx.type === 'expense' &&
        typeof tx.date === 'string' &&
        tx.date.startsWith(monthKey)
      ) {
        const amt = Number(tx.amount) || 0;
        const catId = String(tx.categoryId || '');
        spentByCat[catId] = (spentByCat[catId] || 0) + amt;
      }
    }
  }

  // Create category lookup map
  const catMap = new Map();
  if (Array.isArray(categories)) {
    for (let i = 0; i < categories.length; i++) {
      const c = categories[i];
      if (c && c.id !== undefined) {
        catMap.set(String(c.id), c.name || '');
      }
    }
  }

  const alerts = [];
  for (let i = 0; i < budgets.length; i++) {
    const b = budgets[i];
    if (!b || b.month !== monthKey) continue;

    const limit = Number(b.limitAmount) || 0;
    if (limit <= 0) continue;

    const catId = String(b.categoryId || '');
    const spent = spentByCat[catId] || 0;
    const ratio = spent / limit;

    if (ratio >= threshold) {
      alerts.push({
        categoryId: b.categoryId,
        name: catMap.get(catId) || 'Khác',
        spent,
        limit,
        ratio
      });
    }
  }

  // Sort highest ratio first
  alerts.sort((a, b) => b.ratio - a.ratio);

  return alerts.slice(0, 3);
}

/**
 * Group transactions by day (newest date first).
 *
 * @param {Array<object>} transactions
 * @returns {Array<{ date: string, items: Array<object>, income: number, expense: number }>}
 */
export function groupByDay(transactions = []) {
  if (!Array.isArray(transactions) || transactions.length === 0) return [];

  const groupsMap = new Map();

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    if (!tx) continue;
    const dateKey = tx.date || '';

    let group = groupsMap.get(dateKey);
    if (!group) {
      group = {
        date: dateKey,
        items: [],
        income: 0,
        expense: 0
      };
      groupsMap.set(dateKey, group);
    }

    group.items.push(tx);
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'income') {
      group.income += amt;
    } else if (tx.type === 'expense') {
      group.expense += amt;
    }
  }

  const result = Array.from(groupsMap.values());
  result.sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return b.date.localeCompare(a.date);
  });

  return result;
}
