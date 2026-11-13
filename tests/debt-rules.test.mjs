import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyRepayment } from '../js/domain/debt-rules.js';

describe('applyRepayment', () => {
  it('handles partial repayment', () => {
    const debt = { amount: 1000, remainingAmount: 800 };
    const result = applyRepayment(debt, 300);
    assert.deepEqual(result, {
      remainingAmount: 500,
      status: 'partially_paid'
    });
  });

  it('handles full repayment -> paid', () => {
    const debt = { amount: 1000, remainingAmount: 1000 };
    const result = applyRepayment(debt, 1000);
    assert.deepEqual(result, {
      remainingAmount: 0,
      status: 'paid'
    });
  });

  it('clamps overpayment to 0 and paid', () => {
    const debt = { amount: 1000, remainingAmount: 400 };
    const result = applyRepayment(debt, 600);
    assert.deepEqual(result, {
      remainingAmount: 0,
      status: 'paid'
    });
  });

  it('falls back to debt.amount when remainingAmount is undefined', () => {
    const debt = { amount: 1000 };
    const result = applyRepayment(debt, 250);
    assert.deepEqual(result, {
      remainingAmount: 750,
      status: 'partially_paid'
    });
  });

  it('falls back to debt.amount when remainingAmount is 0', () => {
    // Current behaviour: remainingAmount 0 is falsy, so it falls back to debt.amount.
    // e.g. paid debt of 1000 repaid 300 -> remaining 700, 'partially_paid'
    const debt = { amount: 1000, remainingAmount: 0 };
    const result = applyRepayment(debt, 300);
    assert.deepEqual(result, {
      remainingAmount: 700,
      status: 'partially_paid'
    });
  });
});
