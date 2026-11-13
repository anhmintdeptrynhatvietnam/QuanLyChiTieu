import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeWalletBalances } from '../js/domain/ledger.js';

describe('computeWalletBalances', () => {
  it('handles empty inputs', () => {
    assert.deepEqual(computeWalletBalances(), {});
    assert.deepEqual(computeWalletBalances([], [], []), {});
  });

  it('computes initialBalance only', () => {
    const wallets = [
      { id: 'w1', initialBalance: 1000 },
      { id: 'w2', initialBalance: 0 },
      { id: 'w3' }
    ];
    const result = computeWalletBalances(wallets, [], []);
    assert.deepEqual(result, { w1: 1000, w2: 0, w3: 0 });
  });

  it('handles expense transactions', () => {
    const wallets = [{ id: 'w1', initialBalance: 1000 }];
    const transactions = [{ walletId: 'w1', type: 'expense', amount: 300 }];
    const result = computeWalletBalances(wallets, transactions, []);
    assert.deepEqual(result, { w1: 700 });
  });

  it('handles income transactions', () => {
    const wallets = [{ id: 'w1', initialBalance: 1000 }];
    const transactions = [{ walletId: 'w1', type: 'income', amount: 500 }];
    const result = computeWalletBalances(wallets, transactions, []);
    assert.deepEqual(result, { w1: 1500 });
  });

  it('handles transfer between two wallets', () => {
    const wallets = [
      { id: 'w1', initialBalance: 1000 },
      { id: 'w2', initialBalance: 500 }
    ];
    const transactions = [
      { walletId: 'w1', toWalletId: 'w2', type: 'transfer', amount: 200 }
    ];
    const result = computeWalletBalances(wallets, transactions, []);
    assert.deepEqual(result, { w1: 800, w2: 700 });
  });

  it('handles transfer with missing toWalletId', () => {
    const wallets = [
      { id: 'w1', initialBalance: 1000 },
      { id: 'w2', initialBalance: 500 }
    ];
    const transactions = [
      { walletId: 'w1', type: 'transfer', amount: 200 }
    ];
    const result = computeWalletBalances(wallets, transactions, []);
    assert.deepEqual(result, { w1: 800, w2: 500 });
  });

  it('ignores transaction on unknown wallet', () => {
    const wallets = [{ id: 'w1', initialBalance: 1000 }];
    const transactions = [
      { walletId: 'unknown', type: 'expense', amount: 200 },
      { walletId: 'unknown', type: 'income', amount: 300 },
      { walletId: 'unknown', toWalletId: 'w1', type: 'transfer', amount: 100 }
    ];
    const result = computeWalletBalances(wallets, transactions, []);
    assert.deepEqual(result, { w1: 1100 });
    assert.equal(result.unknown, undefined);
  });

  it('coerces numeric strings and treats non-numeric or NaN amounts as 0', () => {
    const wallets = [
      { id: 'w1', initialBalance: '1000' },
      { id: 'w2', initialBalance: 'invalid' }
    ];
    const transactions = [
      { walletId: 'w1', type: 'expense', amount: '200' },
      { walletId: 'w1', type: 'income', amount: 'abc' },
      { walletId: 'w1', type: 'expense', amount: NaN }
    ];
    const result = computeWalletBalances(wallets, transactions, []);
    assert.deepEqual(result, { w1: 800, w2: 0 });
  });

  it('handles lend and borrow debt', () => {
    const wallets = [{ id: 'w1', initialBalance: 1000 }];
    const debts = [
      { id: 'd1', walletId: 'w1', type: 'lend', amount: 300 },
      { id: 'd2', walletId: 'w1', type: 'borrow', amount: 500 }
    ];
    const result = computeWalletBalances(wallets, [], debts);
    assert.deepEqual(result, { w1: 1200 });
  });

  it('handles repayment into a different wallet than the debt wallet', () => {
    const wallets = [
      { id: 'w1', initialBalance: 1000 },
      { id: 'w2', initialBalance: 200 }
    ];
    const debts = [
      {
        id: 'd1',
        walletId: 'w1',
        type: 'lend',
        amount: 400,
        repayments: [
          { walletId: 'w2', amount: 150 }
        ]
      },
      {
        id: 'd2',
        walletId: 'w1',
        type: 'borrow',
        amount: 300,
        repayments: [
          { walletId: 'w2', amount: 100 }
        ]
      }
    ];
    const result = computeWalletBalances(wallets, [], debts);
    assert.deepEqual(result, { w1: 900, w2: 250 });
  });

  it('tolerates debts = null or undefined', () => {
    const wallets = [{ id: 'w1', initialBalance: 500 }];
    assert.deepEqual(computeWalletBalances(wallets, [], null), { w1: 500 });
    assert.deepEqual(computeWalletBalances(wallets, [], undefined), { w1: 500 });
  });
});
