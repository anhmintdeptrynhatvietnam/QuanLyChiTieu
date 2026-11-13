/**
 * Pure ledger calculation functions.
 * Computes wallet balances by replaying transactions, debts, and repayments.
 */

/**
 * Compute balances for all wallets.
 * @param {Array} [wallets=[]]
 * @param {Array} [transactions=[]]
 * @param {Array} [debts=[]]
 * @returns {Record<string, number>} Map of wallet ID to balance
 */
export function computeWalletBalances(wallets = [], transactions = [], debts = []) {
  const balances = {};
  (wallets || []).forEach(w => {
    balances[w.id] = Number(w.initialBalance) || 0;
  });

  // 1. Transactions impact
  (transactions || []).forEach(t => {
    const amt = Number(t.amount) || 0;
    if (t.type === 'expense' && balances[t.walletId] !== undefined) {
      balances[t.walletId] -= amt;
    } else if (t.type === 'income' && balances[t.walletId] !== undefined) {
      balances[t.walletId] += amt;
    } else if (t.type === 'transfer') {
      if (balances[t.walletId] !== undefined) balances[t.walletId] -= amt;
      if (t.toWalletId && balances[t.toWalletId] !== undefined) balances[t.toWalletId] += amt;
    }
  });

  // 2. Debts impact
  (debts || []).forEach(debt => {
    const amt = Number(debt.amount) || 0;
    if (debt.type === 'lend' && balances[debt.walletId] !== undefined) {
      balances[debt.walletId] -= amt; // Cho vay -> tiền ra khỏi ví
    } else if (debt.type === 'borrow' && balances[debt.walletId] !== undefined) {
      balances[debt.walletId] += amt; // Đi vay -> tiền vào ví
    }

    // Repayments impact
    (debt.repayments || []).forEach(rep => {
      const repAmt = Number(rep.amount) || 0;
      if (debt.type === 'lend' && balances[rep.walletId] !== undefined) {
        balances[rep.walletId] += repAmt; // Thu nợ -> tiền vào ví
      } else if (debt.type === 'borrow' && balances[rep.walletId] !== undefined) {
        balances[rep.walletId] -= repAmt; // Trả nợ -> tiền ra khỏi ví
      }
    });
  });

  return balances;
}

/**
 * Count references to a wallet in transactions and debts.
 *
 * @param {string} walletId
 * @param {{ transactions?: Array, debts?: Array }} [context={}]
 * @returns {{ transactions: number, debts: number }}
 */
export function findWalletReferences(walletId, { transactions = [], debts = [] } = {}) {
  if (!walletId) return { transactions: 0, debts: 0 };
  const txList = transactions || [];
  const debtList = debts || [];

  const txCount = txList.filter(t => t && (t.walletId === walletId || t.toWalletId === walletId)).length;
  const debtCount = debtList.filter(d => d && (d.walletId === walletId || (d.repayments || []).some(r => r && r.walletId === walletId))).length;

  return { transactions: txCount, debts: debtCount };
}
