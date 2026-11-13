import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeCategorySpent,
  computeBudgetProgress,
  computeMonthBudgetSummary
} from '../js/domain/budget-progress.js';

describe('computeCategorySpent', () => {
  it('returns 0 for empty or invalid inputs', () => {
    assert.equal(computeCategorySpent([], 'cat-1', '2026-11'), 0);
    assert.equal(computeCategorySpent(null, 'cat-1', '2026-11'), 0);
    assert.equal(computeCategorySpent([{ amount: 100 }], null, '2026-11'), 0);
    assert.equal(computeCategorySpent([{ amount: 100 }], 'cat-1', ''), 0);
  });

  it('sums only matching expense transactions for the specified month and category', () => {
    const transactions = [
      { id: '1', type: 'expense', categoryId: 'food', amount: 50000, date: '2026-11-05' },
      { id: '2', type: 'expense', categoryId: 'food', amount: 150000, date: '2026-11-10' },
      { id: '3', type: 'income', categoryId: 'food', amount: 300000, date: '2026-11-12' },
      { id: '4', type: 'expense', categoryId: 'transport', amount: 40000, date: '2026-11-15' },
      { id: '5', type: 'expense', categoryId: 'food', amount: 200000, date: '2026-10-25' }
    ];
    assert.equal(computeCategorySpent(transactions, 'food', '2026-11'), 200000);
    assert.equal(computeCategorySpent(transactions, 'transport', '2026-11'), 40000);
    assert.equal(computeCategorySpent(transactions, 'food', '2026-10'), 200000);
  });
});

describe('computeBudgetProgress', () => {
  it('handles zero or missing limit', () => {
    const res = computeBudgetProgress(50000, 0);
    assert.equal(res.hasBudget, false);
    assert.equal(res.percent, 0);
    assert.equal(res.barPercent, 0);
    assert.equal(res.isOver, false);
    assert.equal(res.status, 'none');
  });

  it('marks green (< 80%) when under 80%', () => {
    const res = computeBudgetProgress(79000, 100000);
    assert.equal(res.hasBudget, true);
    assert.equal(res.percent, 79);
    assert.equal(res.barPercent, 79);
    assert.equal(res.isOver, false);
    assert.equal(res.status, 'safe');
    assert.equal(res.statusColor, 'var(--income-primary)');
    assert.equal(res.remaining, 21000);
    assert.equal(res.overAmount, 0);
  });

  it('marks amber/warning (80% - 100%)', () => {
    const res80 = computeBudgetProgress(80000, 100000);
    assert.equal(res80.status, 'warning');
    assert.equal(res80.statusColor, 'var(--warning-primary)');
    assert.equal(res80.isOver, false);

    const res100 = computeBudgetProgress(100000, 100000);
    assert.equal(res100.status, 'warning');
    assert.equal(res100.statusColor, 'var(--warning-primary)');
    assert.equal(res100.isOver, false);
    assert.equal(res100.barPercent, 100);
    assert.equal(res100.remaining, 0);
  });

  it('marks red/danger (> 100%) when exceeding limit', () => {
    const res = computeBudgetProgress(120000, 100000);
    assert.equal(res.isOver, true);
    assert.equal(res.percent, 120);
    assert.equal(res.barPercent, 100);
    assert.equal(res.status, 'danger');
    assert.equal(res.statusColor, 'var(--expense-primary)');
    assert.equal(res.remaining, 0);
    assert.equal(res.overAmount, 20000);
  });
});

describe('computeMonthBudgetSummary', () => {
  it('calculates total budget and total spent for the month correctly', () => {
    const categories = [{ id: 'c1' }, { id: 'c2' }];
    const budgets = [
      { categoryId: 'c1', month: '2026-11', limitAmount: 5000000 },
      { categoryId: 'c2', month: '2026-11', limitAmount: 3000000 },
      { categoryId: 'c1', month: '2026-12', limitAmount: 6000000 }
    ];
    const transactions = [
      { type: 'expense', categoryId: 'c1', amount: 2000000, date: '2026-11-01' },
      { type: 'expense', categoryId: 'c2', amount: 1500000, date: '2026-11-02' },
      { type: 'income', categoryId: 'salary', amount: 20000000, date: '2026-11-05' },
      { type: 'expense', categoryId: 'c1', amount: 500000, date: '2026-10-30' }
    ];

    const summary = computeMonthBudgetSummary(categories, budgets, transactions, '2026-11');
    assert.equal(summary.totalBudget, 8000000);
    assert.equal(summary.totalSpent, 3500000);
    assert.equal(summary.percent, 44);
    assert.equal(summary.status, 'safe');
  });
});
