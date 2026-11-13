import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  monthSummary,
  budgetAlerts,
  groupByDay
} from '../js/domain/period-summary.js';

describe('Period Summary Domain', () => {
  describe('monthSummary', () => {
    it('calculates income, expense, and net correctly for matching month', () => {
      const txs = [
        { id: '1', type: 'income', amount: 10000000, date: '2026-11-01' },
        { id: '2', type: 'expense', amount: 3000000, date: '2026-11-05' },
        { id: '3', type: 'expense', amount: 2000000, date: '2026-11-10' },
        { id: '4', type: 'transfer', amount: 5000000, date: '2026-11-12' },
        { id: '5', type: 'income', amount: 5000000, date: '2026-10-31' },
        { id: '6', type: 'expense', amount: 1000000, date: '2026-10-15' }
      ];

      const res = monthSummary(txs, '2026-11');
      assert.strictEqual(res.income, 10000000);
      assert.strictEqual(res.expense, 5000000);
      assert.strictEqual(res.net, 5000000);
    });

    it('returns negative net when expense exceeds income', () => {
      const txs = [
        { id: '1', type: 'income', amount: 2000000, date: '2026-11-01' },
        { id: '2', type: 'expense', amount: 5000000, date: '2026-11-05' }
      ];

      const res = monthSummary(txs, '2026-11');
      assert.strictEqual(res.income, 2000000);
      assert.strictEqual(res.expense, 5000000);
      assert.strictEqual(res.net, -3000000);
    });

    it('handles empty or missing input gracefully', () => {
      assert.deepStrictEqual(monthSummary([], '2026-11'), { income: 0, expense: 0, net: 0 });
      assert.deepStrictEqual(monthSummary(null, '2026-11'), { income: 0, expense: 0, net: 0 });
      assert.deepStrictEqual(monthSummary(undefined, ''), { income: 0, expense: 0, net: 0 });
    });

    it('excludes transfers from both income and expense', () => {
      const txs = [
        { id: '1', type: 'transfer', amount: 10000000, date: '2026-11-05' }
      ];

      const res = monthSummary(txs, '2026-11');
      assert.strictEqual(res.income, 0);
      assert.strictEqual(res.expense, 0);
      assert.strictEqual(res.net, 0);
    });
  });

  describe('budgetAlerts', () => {
    const categories = [
      { id: 'cat-food', name: 'Ăn uống' },
      { id: 'cat-shopping', name: 'Mua sắm' },
      { id: 'cat-bills', name: 'Hoá đơn' },
      { id: 'cat-travel', name: 'Du lịch' },
      { id: 'cat-health', name: 'Sức khoẻ' }
    ];

    const budgets = [
      { id: 'b1', categoryId: 'cat-food', month: '2026-11', limitAmount: 5000000 },
      { id: 'b2', categoryId: 'cat-shopping', month: '2026-11', limitAmount: 2000000 },
      { id: 'b3', categoryId: 'cat-bills', month: '2026-11', limitAmount: 3000000 },
      { id: 'b4', categoryId: 'cat-travel', month: '2026-11', limitAmount: 10000000 },
      { id: 'b5', categoryId: 'cat-health', month: '2026-11', limitAmount: 1000000 },
      { id: 'b6', categoryId: 'cat-food', month: '2026-10', limitAmount: 5000000 }
    ];

    it('returns items exceeding default threshold (0.8) sorted descending by ratio, max 3', () => {
      const txs = [
        // Food: 4.5m / 5m = 0.9 (90%)
        { type: 'expense', categoryId: 'cat-food', amount: 4500000, date: '2026-11-02' },
        // Shopping: 2.4m / 2m = 1.2 (120%)
        { type: 'expense', categoryId: 'cat-shopping', amount: 2400000, date: '2026-11-04' },
        // Bills: 2.7m / 3m = 0.9 (90%)
        { type: 'expense', categoryId: 'cat-bills', amount: 2700000, date: '2026-11-06' },
        // Travel: 8.5m / 10m = 0.85 (85%)
        { type: 'expense', categoryId: 'cat-travel', amount: 8500000, date: '2026-11-08' },
        // Health: 500k / 1m = 0.5 (50% - below threshold)
        { type: 'expense', categoryId: 'cat-health', amount: 500000, date: '2026-11-09' }
      ];

      const alerts = budgetAlerts(budgets, txs, categories, '2026-11');
      assert.strictEqual(alerts.length, 3, 'Must cap at max 3 alerts');

      // Order should be Shopping (1.2) -> Food (0.9) or Bills (0.9) -> Travel (0.85)
      assert.strictEqual(alerts[0].categoryId, 'cat-shopping');
      assert.strictEqual(alerts[0].ratio, 1.2);
      assert.strictEqual(alerts[0].name, 'Mua sắm');
      assert.strictEqual(alerts[0].spent, 2400000);
      assert.strictEqual(alerts[0].limit, 2000000);

      // Remaining two must have ratio >= 0.85
      assert.ok(alerts[1].ratio >= 0.85);
      assert.ok(alerts[2].ratio >= 0.85);
    });

    it('respects custom threshold', () => {
      const txs = [
        { type: 'expense', categoryId: 'cat-food', amount: 4500000, date: '2026-11-02' }, // 90%
        { type: 'expense', categoryId: 'cat-shopping', amount: 2400000, date: '2026-11-04' } // 120%
      ];

      const alerts = budgetAlerts(budgets, txs, categories, '2026-11', 1.0);
      assert.strictEqual(alerts.length, 1);
      assert.strictEqual(alerts[0].categoryId, 'cat-shopping');
    });

    it('ignores budgets from other months or with non-positive limits', () => {
      const customBudgets = [
        { id: 'b-old', categoryId: 'cat-food', month: '2026-10', limitAmount: 1000 },
        { id: 'b-zero', categoryId: 'cat-bills', month: '2026-11', limitAmount: 0 }
      ];
      const txs = [
        { type: 'expense', categoryId: 'cat-food', amount: 5000, date: '2026-11-01' },
        { type: 'expense', categoryId: 'cat-bills', amount: 5000, date: '2026-11-01' }
      ];

      const alerts = budgetAlerts(customBudgets, txs, categories, '2026-11');
      assert.strictEqual(alerts.length, 0);
    });

    it('provides fallback name when category not found in categories list', () => {
      const customBudgets = [
        { id: 'b1', categoryId: 'cat-unknown', month: '2026-11', limitAmount: 1000000 }
      ];
      const txs = [
        { type: 'expense', categoryId: 'cat-unknown', amount: 900000, date: '2026-11-05' }
      ];

      const alerts = budgetAlerts(customBudgets, txs, [], '2026-11');
      assert.strictEqual(alerts.length, 1);
      assert.strictEqual(alerts[0].name, 'Khác');
    });
  });

  describe('groupByDay', () => {
    it('groups transactions by day and sorts newest date first', () => {
      const txs = [
        { id: '1', date: '2026-11-10', type: 'expense', amount: 50000 },
        { id: '2', date: '2026-11-12', type: 'income', amount: 200000 },
        { id: '3', date: '2026-11-10', type: 'expense', amount: 150000 },
        { id: '4', date: '2026-11-14', type: 'expense', amount: 80000 },
        { id: '5', date: '2026-11-12', type: 'transfer', amount: 500000 }
      ];

      const groups = groupByDay(txs);
      assert.strictEqual(groups.length, 3);

      assert.strictEqual(groups[0].date, '2026-11-14');
      assert.strictEqual(groups[0].items.length, 1);
      assert.strictEqual(groups[0].expense, 80000);
      assert.strictEqual(groups[0].income, 0);

      assert.strictEqual(groups[1].date, '2026-11-12');
      assert.strictEqual(groups[1].items.length, 2);
      assert.strictEqual(groups[1].income, 200000);
      assert.strictEqual(groups[1].expense, 0); // transfer is excluded from expense

      assert.strictEqual(groups[2].date, '2026-11-10');
      assert.strictEqual(groups[2].items.length, 2);
      assert.strictEqual(groups[2].expense, 200000);
      assert.strictEqual(groups[2].income, 0);
    });

    it('returns empty array when given empty or null array', () => {
      assert.deepStrictEqual(groupByDay([]), []);
      assert.deepStrictEqual(groupByDay(null), []);
      assert.deepStrictEqual(groupByDay(undefined), []);
    });
  });
});
