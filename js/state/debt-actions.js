/**
 * Debt & Repayment Actions for State Store
 */
import { generateId, getCurrentDateFormatted } from '../utils/helpers.js';
import { applyRepayment, canRepay } from '../domain/debt-rules.js';

export function addDebt(store, debt) {
  const amount = Number(debt.amount) || 0;
  const newDebt = {
    id: generateId('debt'),
    personName: debt.personName.trim(),
    type: debt.type || 'lend', // 'lend' (Tôi cho vay) | 'borrow' (Tôi đi vay)
    amount: amount,
    remainingAmount: amount,
    walletId: debt.walletId,
    dueDate: debt.dueDate || null,
    note: debt.note?.trim() || '',
    status: 'pending', // 'pending' | 'partially_paid' | 'paid'
    repayments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  store.state.debts.unshift(newDebt);
  store.recalculateWalletBalances();
  store.notify('debt:added', newDebt);
  return newDebt;
}

export function recordRepayment(store, debtId, { amount, walletId, date, note }) {
  const debt = store.state.debts.find(d => d.id === debtId);
  if (!debt) return null;

  const check = canRepay(debt, amount);
  if (!check.ok) return null;

  const repayAmount = Number(amount);

  const repayment = {
    id: generateId('rep'),
    amount: repayAmount,
    walletId: walletId || debt.walletId,
    date: date || getCurrentDateFormatted(),
    note: note?.trim() || '',
    createdAt: new Date().toISOString()
  };

  debt.repayments = debt.repayments || [];
  debt.repayments.push(repayment);

  const { remainingAmount, status } = applyRepayment(debt, repayAmount);
  debt.remainingAmount = remainingAmount;
  debt.status = status;
  debt.updatedAt = new Date().toISOString();

  store.recalculateWalletBalances();
  store.notify('debt:repayment', { debt, repayment });
  return debt;
}

export function updateDebt(store, id, data) {
  const debt = store.state.debts.find(d => d.id === id);
  if (!debt) return null;

  Object.assign(debt, data);
  debt.updatedAt = new Date().toISOString();
  store.recalculateWalletBalances();
  store.notify('debt:updated', debt);
  return debt;
}

export function deleteDebt(store, id) {
  store.state.debts = store.state.debts.filter(d => d.id !== id);
  store.recalculateWalletBalances();
  store.notify('debt:deleted', id);
  return { success: true };
}
