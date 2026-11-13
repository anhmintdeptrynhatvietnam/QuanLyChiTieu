import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeVietnamese,
  getDateRange,
  filterTransactions,
  calculateTransactionTotals
} from '../js/domain/transaction-query.js';

describe('Transaction Query Domain', () => {
  describe('normalizeVietnamese', () => {
    it('handles empty and non-string inputs safely', () => {
      assert.strictEqual(normalizeVietnamese(''), '');
      assert.strictEqual(normalizeVietnamese(null), '');
      assert.strictEqual(normalizeVietnamese(undefined), '');
      assert.strictEqual(normalizeVietnamese(12345), '12345');
    });

    it('lowercases and removes diacritics', () => {
      assert.strictEqual(normalizeVietnamese('Ăn Uống'), 'an uong');
      assert.strictEqual(normalizeVietnamese('Cà phê & Trà sữa'), 'ca phe & tra sua');
      assert.strictEqual(normalizeVietnamese('Tiền lương tháng 11'), 'tien luong thang 11');
      assert.strictEqual(normalizeVietnamese('Quần áo & Mỹ phẩm'), 'quan ao & my pham');
    });

    it('replaces đ and Đ with d', () => {
      assert.strictEqual(normalizeVietnamese('Đi chợ'), 'di cho');
      assert.strictEqual(normalizeVietnamese('ĐỒNG NAI'), 'dong nai');
      assert.strictEqual(normalizeVietnamese('Điện nước sinh hoạt'), 'dien nuoc sinh hoat');
    });
  });

  describe('getDateRange', () => {
    it('calculates "today" range correctly', () => {
      const res = getDateRange('today', '2026-11-14');
      assert.deepStrictEqual(res, { start: '2026-11-14', end: '2026-11-14' });
    });

    it('calculates "this-week" range with Monday as start', () => {
      // Wednesday 2026-11-11 -> Mon Nov 09 to Sun Nov 15
      const resWed = getDateRange('this-week', '2026-11-11');
      assert.deepStrictEqual(resWed, { start: '2026-11-09', end: '2026-11-15' });

      // Sunday 2026-11-15 -> Mon Nov 09 to Sun Nov 15
      const resSun = getDateRange('this-week', '2026-11-15');
      assert.deepStrictEqual(resSun, { start: '2026-11-09', end: '2026-11-15' });
    });

    it('calculates "this-week" across month boundary', () => {
      // Sunday 2026-11-01 -> Monday Oct 26 to Sunday Nov 01
      const res = getDateRange('this-week', '2026-11-01');
      assert.deepStrictEqual(res, { start: '2026-10-26', end: '2026-11-01' });
    });

    it('calculates "this-month" range', () => {
      const res = getDateRange('this-month', '2026-11-14');
      assert.deepStrictEqual(res, { start: '2026-11-01', end: '2026-11-30' });
    });

    it('calculates "last-month" range across years', () => {
      const resNov = getDateRange('last-month', '2026-11-14');
      assert.deepStrictEqual(resNov, { start: '2026-10-01', end: '2026-10-31' });

      const resJan = getDateRange('last-month', '2026-01-15');
      assert.deepStrictEqual(resJan, { start: '2025-12-01', end: '2025-12-31' });
    });

    it('returns null for "all" range', () => {
      assert.strictEqual(getDateRange('all', '2026-11-14'), null);
    });
  });

  describe('filterTransactions', () => {
    const categories = [
      { id: 'c1', name: 'Ăn uống' },
      { id: 'c2', name: 'Tiền điện' },
      { id: 'c3', name: 'Lương' }
    ];
    const wallets = [
      { id: 'w1', name: 'Tiền mặt' },
      { id: 'w2', name: 'Vietcombank' }
    ];
    const txs = [
      { id: 't1', type: 'expense', amount: 50000, date: '2026-11-14', categoryId: 'c1', walletId: 'w1', note: 'Đi ăn phở' },
      { id: 't2', type: 'expense', amount: 300000, date: '2026-11-10', categoryId: 'c2', walletId: 'w2', note: 'Điện tháng 10' },
      { id: 't3', type: 'income', amount: 15000000, date: '2026-11-05', categoryId: 'c3', walletId: 'w2', note: 'Lương công ty' },
      { id: 't4', type: 'transfer', amount: 1000000, date: '2026-11-12', walletId: 'w2', toWalletId: 'w1', note: 'Rút tiền ATM' },
      { id: 't5', type: 'expense', amount: 80000, date: '2026-10-25', categoryId: 'c1', walletId: 'w1', note: 'Cà phê sáng' }
    ];

    it('filters by date range', () => {
      const todayOnly = filterTransactions(txs, { range: 'today', today: '2026-11-14' });
      assert.strictEqual(todayOnly.length, 1);
      assert.strictEqual(todayOnly[0].id, 't1');

      const thisMonth = filterTransactions(txs, { range: 'this-month', today: '2026-11-14' });
      assert.strictEqual(thisMonth.length, 4);

      const lastMonth = filterTransactions(txs, { range: 'last-month', today: '2026-11-14' });
      assert.strictEqual(lastMonth.length, 1);
      assert.strictEqual(lastMonth[0].id, 't5');

      const all = filterTransactions(txs, { range: 'all' });
      assert.strictEqual(all.length, 5);
    });

    it('filters by type', () => {
      const expenses = filterTransactions(txs, { range: 'all', type: 'expense' });
      assert.strictEqual(expenses.length, 3);
      assert.ok(expenses.every(t => t.type === 'expense'));

      const transfers = filterTransactions(txs, { range: 'all', type: 'transfer' });
      assert.strictEqual(transfers.length, 1);
      assert.strictEqual(transfers[0].id, 't4');
    });

    it('filters by wallet including transfer source and destination', () => {
      // w1 is source of t1, t5 AND destination of t4 (transfer)
      const w1Txs = filterTransactions(txs, { range: 'all', walletId: 'w1' });
      assert.strictEqual(w1Txs.length, 3);
      const ids = w1Txs.map(t => t.id).sort();
      assert.deepStrictEqual(ids, ['t1', 't4', 't5']);
    });

    it('filters by category', () => {
      const c1Txs = filterTransactions(txs, { range: 'all', categoryId: 'c1' });
      assert.strictEqual(c1Txs.length, 2);
    });

    it('searches diacritics-insensitively by note, category name, wallet name, and amount', () => {
      // Note search with/without diacritics and "đ"
      assert.strictEqual(filterTransactions(txs, { range: 'all', search: 'di an pho' }).length, 1);
      assert.strictEqual(filterTransactions(txs, { range: 'all', search: 'Đi ăn phở' }).length, 1);
      assert.strictEqual(filterTransactions(txs, { range: 'all', search: 'đ' }).length, 2);
      assert.strictEqual(filterTransactions(txs, { range: 'all', search: 'd' }).length, 2);

      // Category name search without diacritics
      const catSearch = filterTransactions(txs, { range: 'all', search: 'an uong', categories, wallets });
      assert.strictEqual(catSearch.length, 2); // t1 and t5 have cat Ăn uống

      // Wallet name search
      const walletSearch = filterTransactions(txs, { range: 'all', search: 'tien mat', categories, wallets });
      assert.strictEqual(walletSearch.length, 3); // t1, t4 (dest), t5

      // Amount search
      const amtSearch = filterTransactions(txs, { range: 'all', search: '15000000' });
      assert.strictEqual(amtSearch.length, 1);
      assert.strictEqual(amtSearch[0].id, 't3');
    });
  });

  describe('calculateTransactionTotals', () => {
    it('calculates income and expense correctly excluding transfers', () => {
      const list = [
        { type: 'income', amount: 1000000 },
        { type: 'expense', amount: 300000 },
        { type: 'expense', amount: 200000 },
        { type: 'transfer', amount: 5000000 }
      ];
      const res = calculateTransactionTotals(list);
      assert.strictEqual(res.income, 1000000);
      assert.strictEqual(res.expense, 500000);
      assert.strictEqual(res.count, 4);
    });
  });
});
