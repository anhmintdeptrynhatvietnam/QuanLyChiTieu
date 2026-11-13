/**
 * Wallet Actions & Balance Recalculation for State Store
 */
import { generateId } from '../utils/helpers.js';
import { computeWalletBalances, findWalletReferences } from '../domain/ledger.js';

export function recalculateWalletBalances(state) {
  const balances = computeWalletBalances(state.wallets, state.transactions, state.debts);
  state.wallets.forEach(w => {
    w.currentBalance = balances[w.id] !== undefined ? balances[w.id] : (Number(w.initialBalance) || 0);
  });
}

export function addWallet(store, wallet) {
  const newWallet = {
    id: generateId('wallet'),
    name: wallet.name.trim(),
    type: wallet.type || 'bank',
    initialBalance: Number(wallet.initialBalance) || 0,
    currentBalance: Number(wallet.initialBalance) || 0,
    icon: wallet.icon || 'wallet',
    color: wallet.color || '#3b82f6',
    createdAt: new Date().toISOString()
  };

  store.state.wallets.push(newWallet);
  store.recalculateWalletBalances();
  store.notify('wallet:added', newWallet);
  return newWallet;
}

export function updateWallet(store, id, data) {
  const wallet = store.state.wallets.find(w => w.id === id);
  if (!wallet) return null;

  Object.assign(wallet, data);
  if (data.initialBalance !== undefined) {
    wallet.initialBalance = Number(data.initialBalance) || 0;
  }

  store.recalculateWalletBalances();
  store.notify('wallet:updated', wallet);
  return wallet;
}

export function deleteWallet(store, id) {
  const refs = findWalletReferences(id, store.state);
  if (refs.transactions > 0) return { success: false, reason: 'Ví đã có giao dịch, không thể xóa' };
  if (refs.debts > 0) return { success: false, reason: 'Ví đang được dùng trong khoản vay/nợ hoặc lần trả nợ, không thể xóa' };

  store.state.wallets = store.state.wallets.filter(w => w.id !== id);
  store.recalculateWalletBalances();
  store.notify('wallet:deleted', id);
  return { success: true };
}
