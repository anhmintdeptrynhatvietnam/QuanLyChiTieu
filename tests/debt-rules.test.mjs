import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyRepayment, getRemainingAmount, canRepay, describeRepaymentError } from '../js/domain/debt-rules.js';

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

  it('retains remainingAmount 0 -> applyRepayment gives remaining 0 and paid', () => {
    const debt = { amount: 1000, remainingAmount: 0 };
    const result = applyRepayment(debt, 300);
    assert.deepEqual(result, {
      remainingAmount: 0,
      status: 'paid'
    });
  });
});

describe('getRemainingAmount', () => {
  it('falls back to debt.amount when remainingAmount is undefined, null, empty string, or non-finite', () => {
    assert.equal(getRemainingAmount({ amount: 1000 }), 1000);
    assert.equal(getRemainingAmount({ amount: 1000, remainingAmount: undefined }), 1000);
    assert.equal(getRemainingAmount({ amount: 1000, remainingAmount: null }), 1000);
    assert.equal(getRemainingAmount({ amount: 1000, remainingAmount: '' }), 1000);
    assert.equal(getRemainingAmount({ amount: 1000, remainingAmount: 'abc' }), 1000);
    assert.equal(getRemainingAmount({ amount: 1000, remainingAmount: NaN }), 1000);
  });

  it('preserves 0 as remainingAmount', () => {
    assert.equal(getRemainingAmount({ amount: 1000, remainingAmount: 0 }), 0);
    assert.equal(getRemainingAmount({ amount: 1000, remainingAmount: '0' }), 0);
  });

  it('parses numeric string remainingAmount', () => {
    assert.equal(getRemainingAmount({ amount: 1000, remainingAmount: '500' }), 500);
    assert.equal(getRemainingAmount({ amount: 1000, remainingAmount: 500 }), 500);
  });
});

describe('canRepay', () => {
  const activeDebt = { amount: 1000, remainingAmount: 800, status: 'partially_paid' };

  it('returns invalid-amount for non-positive or non-finite amounts', () => {
    assert.deepEqual(canRepay(activeDebt, 0), { ok: false, code: 'invalid-amount' });
    assert.deepEqual(canRepay(activeDebt, -5), { ok: false, code: 'invalid-amount' });
    assert.deepEqual(canRepay(activeDebt, NaN), { ok: false, code: 'invalid-amount' });
    assert.deepEqual(canRepay(activeDebt, 'abc'), { ok: false, code: 'invalid-amount' });
  });

  it('returns already-paid when status is paid or remaining is 0', () => {
    const paidDebt = { amount: 1000, remainingAmount: 0, status: 'paid' };
    assert.deepEqual(canRepay(paidDebt, 200), { ok: false, code: 'already-paid', remaining: 0 });

    const zeroRemDebt = { amount: 1000, remainingAmount: 0, status: 'pending' };
    assert.deepEqual(canRepay(zeroRemDebt, 200), { ok: false, code: 'already-paid', remaining: 0 });

    const paidDebtWithRem = { amount: 1000, remainingAmount: 500, status: 'paid' };
    assert.deepEqual(canRepay(paidDebtWithRem, 200), { ok: false, code: 'already-paid', remaining: 0 });
  });

  it('returns exceeds-remaining when amount exceeds remaining debt', () => {
    assert.deepEqual(canRepay(activeDebt, 900), {
      ok: false,
      code: 'exceeds-remaining',
      remaining: 800
    });
  });

  it('returns ok for valid amount within remaining', () => {
    assert.deepEqual(canRepay(activeDebt, 300), { ok: true, remaining: 800 });
    assert.deepEqual(canRepay(activeDebt, 800), { ok: true, remaining: 800 });
  });

  it('accepts amount as numeric string', () => {
    assert.deepEqual(canRepay(activeDebt, '300'), { ok: true, remaining: 800 });
  });
});

describe('describeRepaymentError', () => {
  const stubFormat = n => `${n}d`;

  it('returns empty string when check is ok or falsy', () => {
    assert.equal(describeRepaymentError({ ok: true, remaining: 500 }, stubFormat), '');
    assert.equal(describeRepaymentError(null, stubFormat), '');
  });

  it('maps invalid-amount code to message', () => {
    assert.equal(
      describeRepaymentError({ ok: false, code: 'invalid-amount' }, stubFormat),
      'Vui lòng nhập số tiền thanh toán lớn hơn 0'
    );
  });

  it('maps already-paid code to message', () => {
    assert.equal(
      describeRepaymentError({ ok: false, code: 'already-paid', remaining: 0 }, stubFormat),
      'Khoản nợ này đã được thanh toán hết'
    );
  });

  it('maps exceeds-remaining code to message with formatted remaining amount', () => {
    assert.equal(
      describeRepaymentError({ ok: false, code: 'exceeds-remaining', remaining: 400 }, stubFormat),
      'Số tiền vượt quá số còn nợ (400d)'
    );
  });
});
