import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { reconcileInitialBalance, balanceFromInput, inputFromBalance } from '../js/domain/balance-reconcile.js';
import { computeWalletBalances } from '../js/domain/ledger.js';

describe('reconcileInitialBalance', () => {
  it('raises the initial balance when the real balance is higher', () => {
    assert.equal(reconcileInitialBalance({ initialBalance: 2000000, currentBalance: 1200000, actualBalance: 3500000 }), 4300000);
  });

  it('lowers the initial balance (possibly below zero) when the real balance is lower', () => {
    assert.equal(reconcileInitialBalance({ initialBalance: 100000, currentBalance: 900000, actualBalance: 50000 }), -750000);
  });

  it('is a no-op when the real balance already matches', () => {
    assert.equal(reconcileInitialBalance({ initialBalance: 500, currentBalance: 700, actualBalance: 700 }), 500);
  });

  it('makes the replayed ledger balance equal the real balance', () => {
    const wallet = { id: 'w', initialBalance: 2000000 };
    const transactions = [
      { type: 'expense', amount: 300000, walletId: 'w' },
      { type: 'income', amount: 50000, walletId: 'w' }
    ];
    const debts = [{ type: 'lend', amount: 100000, walletId: 'w', repayments: [{ amount: 40000, walletId: 'w' }] }];
    const current = computeWalletBalances([wallet], transactions, debts).w;
    const initialBalance = reconcileInitialBalance({ initialBalance: wallet.initialBalance, currentBalance: current, actualBalance: 1234567 });
    assert.equal(computeWalletBalances([{ ...wallet, initialBalance }], transactions, debts).w, 1234567);
  });

  it('treats missing values as zero', () => {
    assert.equal(reconcileInitialBalance({ initialBalance: undefined, currentBalance: null, actualBalance: '1000' }), 1000);
  });
});

describe('balanceFromInput / inputFromBalance', () => {
  it('keeps normal wallets positive', () => {
    assert.equal(balanceFromInput('cash', 5000), 5000);
    assert.equal(inputFromBalance('bank', 5000), 5000);
  });

  it('maps credit debt to a negative balance and back', () => {
    assert.equal(balanceFromInput('credit', 3000000), -3000000);
    assert.equal(inputFromBalance('credit', -3000000), 3000000);
  });

  it('never shows a negative amount in the input', () => {
    assert.equal(inputFromBalance('cash', -20000), 0);
    assert.equal(inputFromBalance('credit', 15000), 0);
  });
});
