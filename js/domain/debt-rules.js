/**
 * Pure domain rules for debt lifecycle and repayments.
 */

/**
 * Get the remaining amount of a debt.
 * If debt.remainingAmount is undefined, null, empty string, or non-finite,
 * falls back to Number(debt.amount) || 0. Otherwise returns Number(debt.remainingAmount).
 *
 * @param {Object} debt
 * @returns {number}
 */
export function getRemainingAmount(debt) {
  if (!debt) return 0;
  const rem = debt.remainingAmount;
  if (rem === undefined || rem === null || rem === '' || !Number.isFinite(Number(rem))) {
    return Number(debt.amount) || 0;
  }
  return Number(rem);
}

/**
 * Check whether a repayment can be applied to a debt.
 *
 * @param {Object} debt
 * @param {number|string} amount
 * @returns {{ ok: boolean, code?: 'invalid-amount' | 'already-paid' | 'exceeds-remaining', remaining?: number }}
 */
export function canRepay(debt, amount) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return { ok: false, code: 'invalid-amount' };
  }
  const remaining = getRemainingAmount(debt);
  if (debt?.status === 'paid' || remaining <= 0) {
    return { ok: false, code: 'already-paid', remaining: 0 };
  }
  if (numericAmount > remaining) {
    return { ok: false, code: 'exceeds-remaining', remaining };
  }
  return { ok: true, remaining };
}

/**
 * Apply a repayment to a debt record and return updated remainingAmount and status.
 *
 * @param {Object} debt
 * @param {number} repayAmount
 * @returns {{ remainingAmount: number, status: 'paid' | 'partially_paid' }}
 */
export function applyRepayment(debt, repayAmount) {
  const remainingAmount = Math.max(0, getRemainingAmount(debt) - Number(repayAmount));
  const status = remainingAmount === 0 ? 'paid' : 'partially_paid';
  return { remainingAmount, status };
}

/**
 * Return a user-facing error message for a failed repayment check.
 *
 * @param {{ ok: boolean, code?: string, remaining?: number }} check
 * @param {function(number): string} [formatAmount]
 * @returns {string} Error message or empty string when ok
 */
export function describeRepaymentError(check, formatAmount) {
  if (!check || check.ok) return '';
  if (check.code === 'invalid-amount') {
    return 'Vui lòng nhập số tiền thanh toán lớn hơn 0';
  }
  if (check.code === 'already-paid') {
    return 'Khoản nợ này đã được thanh toán hết';
  }
  if (check.code === 'exceeds-remaining') {
    const formatted = typeof formatAmount === 'function' ? formatAmount(check.remaining) : check.remaining;
    return `Số tiền vượt quá số còn nợ (${formatted})`;
  }
  return '';
}

