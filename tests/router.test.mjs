import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseHash, VIEW_TITLES, MORE_SUB_VIEWS } from '../js/ui/router.js';

describe('Router', () => {
  describe('parseHash', () => {
    it('defaults to dashboard for empty or invalid hashes', () => {
      assert.equal(parseHash(''), 'dashboard');
      assert.equal(parseHash('#'), 'dashboard');
      assert.equal(parseHash('#/'), 'dashboard');
      assert.equal(parseHash('#/unknown-route'), 'dashboard');
      assert.equal(parseHash('#random'), 'dashboard');
    });

    it('correctly resolves all valid view routes', () => {
      assert.equal(parseHash('#/dashboard'), 'dashboard');
      assert.equal(parseHash('#/transactions'), 'transactions');
      assert.equal(parseHash('#/analytics'), 'analytics');
      assert.equal(parseHash('#/more'), 'more');
      assert.equal(parseHash('#/wallets'), 'wallets');
      assert.equal(parseHash('#/debts'), 'debts');
      assert.equal(parseHash('#/budgets'), 'budgets');
      assert.equal(parseHash('#/settings'), 'settings');
    });

    it('handles hashes without leading slash', () => {
      assert.equal(parseHash('#transactions'), 'transactions');
      assert.equal(parseHash('#wallets'), 'wallets');
    });
  });

  describe('VIEW_TITLES and subviews', () => {
    it('defines Vietnamese page titles for all supported views', () => {
      assert.equal(VIEW_TITLES.dashboard, 'Tổng quan');
      assert.equal(VIEW_TITLES.transactions, 'Giao dịch');
      assert.equal(VIEW_TITLES.analytics, 'Báo cáo & Phân tích');
      assert.equal(VIEW_TITLES.more, 'Thêm');
      assert.equal(VIEW_TITLES.wallets, 'Sổ ví & Tài khoản');
      assert.equal(VIEW_TITLES.debts, 'Sổ Vay & Nợ');
      assert.equal(VIEW_TITLES.budgets, 'Hạn mức ngân sách');
      assert.equal(VIEW_TITLES.settings, 'Cài đặt & Đồng bộ');
    });

    it('identifies sub-views of "Thêm" correctly', () => {
      assert.ok(MORE_SUB_VIEWS.has('wallets'));
      assert.ok(MORE_SUB_VIEWS.has('debts'));
      assert.ok(MORE_SUB_VIEWS.has('budgets'));
      assert.ok(MORE_SUB_VIEWS.has('settings'));
      assert.ok(!MORE_SUB_VIEWS.has('dashboard'));
      assert.ok(!MORE_SUB_VIEWS.has('transactions'));
      assert.ok(!MORE_SUB_VIEWS.has('analytics'));
      assert.ok(!MORE_SUB_VIEWS.has('more'));
    });
  });
});
