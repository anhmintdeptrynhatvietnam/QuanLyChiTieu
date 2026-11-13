/**
 * Pure Domain Calculations for Analytics and Reports
 */
import { getMonthYear } from '../utils/formatters.js';
import { safeColor, safeIconName } from '../utils/helpers.js';

/**
 * Calculate totals and savings for a specific month
 * @param {Array<object>} transactions
 * @param {string} monthKey - Format 'YYYY-MM'
 * @returns {{ income: number, expense: number, netSavings: number, savingRate: number, txCount: number }}
 */
export function calculateMonthSummary(transactions = [], monthKey = getMonthYear()) {
  let income = 0;
  let expense = 0;
  let txCount = 0;

  for (const t of transactions) {
    if (!t || !t.date || !t.date.startsWith(monthKey)) continue;
    const amt = Number(t.amount) || 0;
    if (amt <= 0) continue;

    if (t.type === 'income') {
      income += amt;
      txCount++;
    } else if (t.type === 'expense') {
      expense += amt;
      txCount++;
    }
  }

  const netSavings = income - expense;
  const savingRate = income > 0 ? Math.max(0, Math.round((netSavings / income) * 100)) : 0;

  return {
    income,
    expense,
    netSavings,
    savingRate,
    txCount
  };
}

/**
 * Calculate expense breakdown by category for a specific month
 * @param {Array<object>} transactions
 * @param {Array<object>} categories
 * @param {string} monthKey - Format 'YYYY-MM'
 * @returns {{ totalExpense: number, items: Array<{ categoryId: string, name: string, color: string, icon: string, amount: number, txCount: number, percentage: number }> }}
 */
export function calculateCategoryExpenseBreakdown(transactions = [], categories = [], monthKey = getMonthYear()) {
  const catMap = new Map();
  for (const c of categories) {
    if (c && c.id) {
      catMap.set(c.id, c);
    }
  }

  const expenseTotals = new Map();
  const txCounts = new Map();
  let totalExpense = 0;

  for (const t of transactions) {
    if (!t || !t.date || !t.date.startsWith(monthKey)) continue;
    if (t.type !== 'expense') continue;
    const amt = Number(t.amount) || 0;
    if (amt <= 0) continue;

    const catId = t.categoryId || 'other';
    expenseTotals.set(catId, (expenseTotals.get(catId) || 0) + amt);
    txCounts.set(catId, (txCounts.get(catId) || 0) + 1);
    totalExpense += amt;
  }

  const items = [];
  for (const [catId, amount] of expenseTotals.entries()) {
    const cat = catMap.get(catId);
    const name = cat?.name || 'Khác';
    const color = safeColor(cat?.color || '#64748b');
    const icon = safeIconName(cat?.icon || 'tag');
    const count = txCounts.get(catId) || 0;
    const percentage = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;

    items.push({
      categoryId: catId,
      name,
      color,
      icon,
      amount,
      txCount: count,
      percentage
    });
  }

  // Sort descending by amount
  items.sort((a, b) => b.amount - a.amount);

  return {
    totalExpense,
    items
  };
}

/**
 * Calculate 6-month income vs expense trend leading up to referenceDate
 * @param {Array<object>} transactions
 * @param {Date|string} [referenceDate=new Date()]
 * @returns {Array<{ monthKey: string, label: string, income: number, expense: number, net: number }>}
 */
export function calculateSixMonthTrend(transactions = [], referenceDate = new Date()) {
  const ref = new Date(referenceDate);
  const baseYear = isNaN(ref.getTime()) ? new Date().getFullYear() : ref.getFullYear();
  const baseMonth = isNaN(ref.getTime()) ? new Date().getMonth() : ref.getMonth();

  const series = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(baseYear, baseMonth - i, 1);
    const year = d.getFullYear();
    const monthNum = d.getMonth() + 1;
    const monthKey = `${year}-${String(monthNum).padStart(2, '0')}`;
    const label = `T${monthNum}`;

    let income = 0;
    let expense = 0;

    for (const t of transactions) {
      if (!t || !t.date || !t.date.startsWith(monthKey)) continue;
      const amt = Number(t.amount) || 0;
      if (amt <= 0) continue;

      if (t.type === 'income') income += amt;
      else if (t.type === 'expense') expense += amt;
    }

    series.push({
      monthKey,
      label,
      income,
      expense,
      net: income - expense
    });
  }

  return series;
}
