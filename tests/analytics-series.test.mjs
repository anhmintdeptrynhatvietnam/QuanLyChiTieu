import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMonthSummary,
  calculateCategoryExpenseBreakdown,
  calculateSixMonthTrend
} from '../js/domain/analytics-series.js';

describe('analytics-series', () => {
  const sampleCategories = [
    { id: 'food', name: 'Ăn uống', color: '#f97316', icon: 'utensils' },
    { id: 'transport', name: 'Đi lại', color: '#3b82f6', icon: 'car' },
    { id: 'salary', name: 'Lương', color: '#10b981', icon: 'wallet' }
  ];

  describe('calculateMonthSummary', () => {
    it('returns zeroes for empty transactions', () => {
      const summary = calculateMonthSummary([], '2026-11');
      assert.deepEqual(summary, {
        income: 0,
        expense: 0,
        netSavings: 0,
        savingRate: 0,
        txCount: 0
      });
    });

    it('computes correct income, expense, and savings rate', () => {
      const txs = [
        { date: '2026-11-01', type: 'income', amount: 20000000 },
        { date: '2026-11-02', type: 'expense', amount: 5000000 },
        { date: '2026-11-05', type: 'expense', amount: 5000000 },
        { date: '2026-10-15', type: 'income', amount: 10000000 } // other month
      ];

      const summary = calculateMonthSummary(txs, '2026-11');
      assert.equal(summary.income, 20000000);
      assert.equal(summary.expense, 10000000);
      assert.equal(summary.netSavings, 10000000);
      assert.equal(summary.savingRate, 50);
      assert.equal(summary.txCount, 3);
    });

    it('handles negative or zero net savings gracefully', () => {
      const txs = [
        { date: '2026-11-01', type: 'income', amount: 5000000 },
        { date: '2026-11-02', type: 'expense', amount: 8000000 }
      ];

      const summary = calculateMonthSummary(txs, '2026-11');
      assert.equal(summary.income, 5000000);
      assert.equal(summary.expense, 8000000);
      assert.equal(summary.netSavings, -3000000);
      assert.equal(summary.savingRate, 0);
    });
  });

  describe('calculateCategoryExpenseBreakdown', () => {
    it('handles empty transactions', () => {
      const breakdown = calculateCategoryExpenseBreakdown([], sampleCategories, '2026-11');
      assert.equal(breakdown.totalExpense, 0);
      assert.equal(breakdown.items.length, 0);
    });

    it('aggregates and sorts categories descending by expense', () => {
      const txs = [
        { date: '2026-11-01', type: 'expense', amount: 300000, categoryId: 'food' },
        { date: '2026-11-02', type: 'expense', amount: 700000, categoryId: 'food' },
        { date: '2026-11-03', type: 'expense', amount: 500000, categoryId: 'transport' },
        { date: '2026-11-04', type: 'income', amount: 5000000, categoryId: 'salary' }
      ];

      const breakdown = calculateCategoryExpenseBreakdown(txs, sampleCategories, '2026-11');
      assert.equal(breakdown.totalExpense, 1500000);
      assert.equal(breakdown.items.length, 2);

      // Ranked #1: food (1,000,000 = 67%)
      assert.equal(breakdown.items[0].categoryId, 'food');
      assert.equal(breakdown.items[0].amount, 1000000);
      assert.equal(breakdown.items[0].txCount, 2);
      assert.equal(breakdown.items[0].percentage, 67);

      // Ranked #2: transport (500,000 = 33%)
      assert.equal(breakdown.items[1].categoryId, 'transport');
      assert.equal(breakdown.items[1].amount, 500000);
      assert.equal(breakdown.items[1].txCount, 1);
      assert.equal(breakdown.items[1].percentage, 33);
    });

    it('falls back to default info for unknown categoryId', () => {
      const txs = [
        { date: '2026-11-10', type: 'expense', amount: 200000, categoryId: 'unknown-id' }
      ];
      const breakdown = calculateCategoryExpenseBreakdown(txs, sampleCategories, '2026-11');
      assert.equal(breakdown.items.length, 1);
      assert.equal(breakdown.items[0].name, 'Khác');
    });
  });

  describe('calculateSixMonthTrend', () => {
    it('returns 6 consecutive months', () => {
      const refDate = new Date('2026-11-14T00:00:00Z');
      const trend = calculateSixMonthTrend([], refDate);

      assert.equal(trend.length, 6);
      assert.equal(trend[0].monthKey, '2026-06');
      assert.equal(trend[0].label, 'T6');
      assert.equal(trend[5].monthKey, '2026-11');
      assert.equal(trend[5].label, 'T11');
    });

    it('accumulates income and expense per month', () => {
      const refDate = new Date('2026-11-14T00:00:00Z');
      const txs = [
        { date: '2026-11-01', type: 'income', amount: 10000000 },
        { date: '2026-11-05', type: 'expense', amount: 4000000 },
        { date: '2026-10-10', type: 'income', amount: 8000000 },
        { date: '2026-10-12', type: 'expense', amount: 3000000 }
      ];

      const trend = calculateSixMonthTrend(txs, refDate);
      const oct = trend.find(m => m.monthKey === '2026-10');
      const nov = trend.find(m => m.monthKey === '2026-11');

      assert.equal(oct.income, 8000000);
      assert.equal(oct.expense, 3000000);
      assert.equal(oct.net, 5000000);

      assert.equal(nov.income, 10000000);
      assert.equal(nov.expense, 4000000);
      assert.equal(nov.net, 6000000);
    });
  });
});
