/**
 * Pure domain rules for debt lifecycle and repayments.
 */

/**
 * Apply a repayment to a debt record and return updated remainingAmount and status.
 *
 * Current behaviour: if remainingAmount is 0 (or falsy), the fallback evaluates
 * (Number(debt.remainingAmount) || debt.amount) which falls back to debt.amount,
 * treating a fully paid debt as having its original amount remaining.
 *
 * @param {Object} debt
 * @param {number} repayAmount
 * @returns {{ remainingAmount: number, status: 'paid' | 'partially_paid' }}
 */
export function applyRepayment(debt, repayAmount) {
  const remainingAmount = Math.max(0, (Number(debt.remainingAmount) || debt.amount) - repayAmount);
  const status = remainingAmount === 0 ? 'paid' : 'partially_paid';
  return { remainingAmount, status };
}
