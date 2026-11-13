import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateEntry, resolveEntryDefaults } from '../js/domain/transaction-entry.js';

describe('Transaction Entry Domain Logic', () => {
  describe('validateEntry', () => {
    it('flags missing or non-positive amount', () => {
      assert.equal(validateEntry({ amount: 0, walletId: 'w1', categoryId: 'c1' }).ok, false);
      assert.equal(validateEntry({ amount: -500, walletId: 'w1', categoryId: 'c1' }).ok, false);
      assert.equal(validateEntry({ amount: 'abc', walletId: 'w1', categoryId: 'c1' }).ok, false);
      const res = validateEntry({ amount: 0 });
      assert.ok(res.errors.amount);
    });

    it('requires walletId for all types', () => {
      const res = validateEntry({ amount: 50000, categoryId: 'c1', walletId: '' });
      assert.equal(res.ok, false);
      assert.equal(res.errors.walletId, 'Vui lòng chọn ví');
    });

    it('validates expense requiring category', () => {
      const missingCat = validateEntry({ type: 'expense', amount: 50000, walletId: 'w1', categoryId: '' });
      assert.equal(missingCat.ok, false);
      assert.equal(missingCat.errors.categoryId, 'Vui lòng chọn hạng mục');

      const validExp = validateEntry({ type: 'expense', amount: 50000, walletId: 'w1', categoryId: 'c1' });
      assert.equal(validExp.ok, true);
      assert.deepEqual(validExp.errors, {});
    });

    it('validates income requiring category', () => {
      const missingCat = validateEntry({ type: 'income', amount: 100000, walletId: 'w1', categoryId: '' });
      assert.equal(missingCat.ok, false);
      assert.equal(missingCat.errors.categoryId, 'Vui lòng chọn hạng mục');

      const validInc = validateEntry({ type: 'income', amount: 100000, walletId: 'w1', categoryId: 'c2' });
      assert.equal(validInc.ok, true);
    });

    it('validates transfer requiring destination wallet differing from source wallet', () => {
      const missingTo = validateEntry({ type: 'transfer', amount: 20000, walletId: 'w1', toWalletId: '' });
      assert.equal(missingTo.ok, false);
      assert.equal(missingTo.errors.toWalletId, 'Vui lòng chọn ví nhận');

      const sameWallet = validateEntry({ type: 'transfer', amount: 20000, walletId: 'w1', toWalletId: 'w1' });
      assert.equal(sameWallet.ok, false);
      assert.equal(sameWallet.errors.toWalletId, 'Ví nhận tiền phải khác ví chuyển');

      const validTransfer = validateEntry({ type: 'transfer', amount: 20000, walletId: 'w1', toWalletId: 'w2' });
      assert.equal(validTransfer.ok, true);
    });
  });

  describe('resolveEntryDefaults', () => {
    const mockWallets = [
      { id: 'w1', name: 'Tiền mặt' },
      { id: 'w2', name: 'Ngân hàng' },
      { id: 'w3', name: 'Tiết kiệm' }
    ];

    it('falls back to safe defaults with empty inputs', () => {
      const res = resolveEntryDefaults({ wallets: mockWallets });
      assert.equal(res.type, 'expense');
      assert.equal(res.walletId, 'w1');
      assert.equal(res.toWalletId, 'w2');
    });

    it('prefers lastEntry when valid and available', () => {
      const lastEntry = { type: 'income', walletId: 'w2', toWalletId: 'w3' };
      const res = resolveEntryDefaults({ lastEntry, wallets: mockWallets });
      assert.equal(res.type, 'income');
      assert.equal(res.walletId, 'w2');
      assert.equal(res.toWalletId, 'w3');
    });

    it('ignores stale wallet ids from lastEntry that no longer exist', () => {
      const lastEntry = { type: 'transfer', walletId: 'w_deleted', toWalletId: 'w_also_deleted' };
      const res = resolveEntryDefaults({ lastEntry, wallets: mockWallets });
      assert.equal(res.type, 'transfer');
      assert.equal(res.walletId, 'w1');
      assert.equal(res.toWalletId, 'w2');
    });

    it('allows explicit params to override lastEntry', () => {
      const lastEntry = { type: 'expense', walletId: 'w1', toWalletId: 'w2' };
      const params = { type: 'income', walletId: 'w3' };
      const res = resolveEntryDefaults({ lastEntry, wallets: mockWallets, params });
      assert.equal(res.type, 'income');
      assert.equal(res.walletId, 'w3');
    });
  });
});
