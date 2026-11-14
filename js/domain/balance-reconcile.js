/**
 * Pure helpers to match a wallet with the real-world balance.
 * Balances are derived (initial balance + replayed history), so matching the real
 * balance means shifting the initial balance by the difference; the history and
 * monthly reports stay untouched.
 * Credit wallets hold a negative balance while money is owed, so the user enters
 * the outstanding debt as a positive number.
 */

/**
 * New initial balance that makes the derived balance equal `actualBalance`.
 *
 * @param {{ initialBalance: number, currentBalance: number, actualBalance: number }} params
 * @returns {number}
 */
export function reconcileInitialBalance({ initialBalance, currentBalance, actualBalance }) {
  const initial = Number(initialBalance) || 0;
  const current = Number(currentBalance) || 0;
  const actual = Number(actualBalance) || 0;
  return initial + (actual - current);
}

/**
 * Convert the amount typed by the user (always ≥ 0) into a signed balance.
 *
 * @param {string} walletType
 * @param {number} amount
 * @returns {number}
 */
export function balanceFromInput(walletType, amount) {
  const value = Math.abs(Number(amount) || 0);
  return walletType === 'credit' ? -value : value;
}

/**
 * Convert a signed balance into the non-negative amount shown in the input.
 *
 * @param {string} walletType
 * @param {number} balance
 * @returns {number}
 */
export function inputFromBalance(walletType, balance) {
  const value = Number(balance) || 0;
  return Math.max(0, walletType === 'credit' ? -value : value);
}
