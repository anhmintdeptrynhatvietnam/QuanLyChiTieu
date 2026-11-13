/**
 * Transaction Actions for State Store
 */
import { generateId, getCurrentDateFormatted } from '../utils/helpers.js';

export function addTransaction(store, tx) {
  const newTx = {
    id: generateId('tx'),
    type: tx.type, // 'expense' | 'income' | 'transfer'
    amount: Number(tx.amount) || 0,
    categoryId: tx.categoryId || '',
    walletId: tx.walletId,
    toWalletId: tx.toWalletId || null,
    date: tx.date || getCurrentDateFormatted(),
    note: tx.note?.trim() || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  store.state.transactions.unshift(newTx);
  store.recalculateWalletBalances();
  store.notify('transaction:added', newTx);
  return newTx;
}

export function updateTransaction(store, id, updatedData) {
  const index = store.state.transactions.findIndex(t => t.id === id);
  if (index === -1) return null;

  let amount = store.state.transactions[index].amount;
  if (Object.prototype.hasOwnProperty.call(updatedData, 'amount')) {
    const parsedAmount = Number(updatedData.amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return null;
    amount = parsedAmount;
  }

  store.state.transactions[index] = {
    ...store.state.transactions[index],
    ...updatedData,
    amount,
    updatedAt: new Date().toISOString()
  };

  store.recalculateWalletBalances();
  store.notify('transaction:updated', store.state.transactions[index]);
  return store.state.transactions[index];
}

export function deleteTransaction(store, id) {
  const index = store.state.transactions.findIndex(t => t.id === id);
  if (index === -1) return false;

  const deleted = store.state.transactions.splice(index, 1)[0];
  store.recalculateWalletBalances();
  store.notify('transaction:deleted', deleted);
  return true;
}
