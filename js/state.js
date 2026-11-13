/**
 * Central Reactive State Manager (Pub/Sub Store)
 */
import { firebaseSyncService } from './services/firebase-sync.js';
import { loadInitialState, saveStateToStorage, cleanupLegacyStorage } from './state/persistence.js';
import { addTransaction, updateTransaction, deleteTransaction } from './state/transaction-actions.js';
import { recalculateWalletBalances, addWallet, updateWallet, deleteWallet } from './state/wallet-actions.js';
import {
  ensureUniqueCategoryColors,
  getNextCategoryColor,
  addCategory,
  updateCategory,
  deleteCategory,
  setBudget,
  deleteBudget
} from './state/category-budget-actions.js';
import { addDebt, recordRepayment, updateDebt, deleteDebt } from './state/debt-actions.js';
import {
  initFirebase,
  replaceLocalCollections,
  applyRemoteCollection,
  updateSettings,
  importAllData
} from './state/cloud-session-actions.js';

export class StateStore {
  constructor() {
    this.listeners = new Set();
    this.authSeq = 0;
    this.cloudSessionUiReady = new Promise(resolve => { this.resolveCloudSessionUi = resolve; });
    this.state = loadInitialState();
    this.ensureUniqueCategoryColors();
    this.recalculateWalletBalances();
    cleanupLegacyStorage();
    this.initFirebase();
  }

  async initFirebase() {
    return initFirebase(this);
  }

  setCloudSessionUi(ui) {
    this.resolveCloudSessionUi(ui);
  }

  replaceLocalCollections(collections) {
    return replaceLocalCollections(this, collections);
  }

  applyRemoteCollection(collection, records) {
    return applyRemoteCollection(this, collection, records);
  }

  ensureUniqueCategoryColors() {
    ensureUniqueCategoryColors(this.state.categories);
  }

  getNextCategoryColor(type = 'expense') {
    return getNextCategoryColor(this.state.categories, type);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(event, payload) {
    this.saveToStorage();
    this.listeners.forEach(fn => fn(event, payload, this.state));

    if (firebaseSyncService.isActive() && !firebaseSyncService.isApplyingRemote) {
      firebaseSyncService.scheduleSync();
    }
  }

  saveToStorage() {
    saveStateToStorage(this.state);
  }

  getState() {
    return this.state;
  }

  // --- Transactions Actions ---
  addTransaction(tx) {
    return addTransaction(this, tx);
  }

  updateTransaction(id, updatedData) {
    return updateTransaction(this, id, updatedData);
  }

  deleteTransaction(id) {
    return deleteTransaction(this, id);
  }

  // --- Wallets Actions ---
  addWallet(wallet) {
    return addWallet(this, wallet);
  }

  updateWallet(id, data) {
    return updateWallet(this, id, data);
  }

  deleteWallet(id) {
    return deleteWallet(this, id);
  }

  // --- Categories Actions ---
  addCategory(category) {
    return addCategory(this, category);
  }

  updateCategory(id, data) {
    return updateCategory(this, id, data);
  }

  deleteCategory(id) {
    return deleteCategory(this, id);
  }

  // --- Debts Actions ---
  addDebt(debt) {
    return addDebt(this, debt);
  }

  recordRepayment(debtId, { amount, walletId, date, note }) {
    return recordRepayment(this, debtId, { amount, walletId, date, note });
  }

  updateDebt(id, data) {
    return updateDebt(this, id, data);
  }

  deleteDebt(id) {
    return deleteDebt(this, id);
  }

  recalculateWalletBalances() {
    recalculateWalletBalances(this.state);
  }

  // --- Budgets Actions ---
  setBudget(categoryId, month, limitAmount) {
    return setBudget(this, categoryId, month, limitAmount);
  }

  deleteBudget(categoryId, month) {
    return deleteBudget(this, categoryId, month);
  }

  // --- Settings & Bulk Data Import ---
  updateSettings(partialSettings) {
    return updateSettings(this, partialSettings);
  }

  importAllData(payload) {
    return importAllData(this, payload);
  }
}

export const stateStore = new StateStore();
