/**
 * Central Reactive State Manager (Pub/Sub Store)
 */
import { DEFAULT_CATEGORIES, DEFAULT_WALLETS, DEFAULT_SETTINGS, DEFAULT_FIREBASE_CONFIG, STORAGE_KEYS, CATEGORY_PALETTE, LEGACY_LOCAL_STORAGE_KEYS } from './config.js';
import { StorageService } from './services/storage.js';
import { generateId, getCurrentDateFormatted } from './utils/helpers.js';
import { getMonthYear } from './utils/formatters.js';
import { firebaseAuthService } from './services/firebase-auth.js';
import { firebaseSyncService } from './services/firebase-sync.js';
import { computeWalletBalances, findWalletReferences } from './domain/ledger.js';
import { applyRepayment, canRepay } from './domain/debt-rules.js';
import { sanitizeLegacySettings } from './domain/settings-migration.js';
import { sanitizeImportedSettings } from './domain/export-sanitize.js';
import { SYNCED_SETTINGS_KEYS } from './domain/sync-diff.js';
import { prepareCloudSession } from './services/cloud-session.js';

class StateStore {
  constructor() {
    this.listeners = new Set();
    this.authSeq = 0;
    this.cloudSessionUiReady = new Promise(resolve => { this.resolveCloudSessionUi = resolve; });
    this.state = {
      transactions: StorageService.get(STORAGE_KEYS.TRANSACTIONS, []),
      wallets: StorageService.get(STORAGE_KEYS.WALLETS, DEFAULT_WALLETS),
      categories: StorageService.get(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES),
      budgets: StorageService.get(STORAGE_KEYS.BUDGETS, []),
      debts: StorageService.get(STORAGE_KEYS.DEBTS, []),
      settings: sanitizeLegacySettings(StorageService.get(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS))
    };
    this.ensureUniqueCategoryColors();
    this.recalculateWalletBalances();
    LEGACY_LOCAL_STORAGE_KEYS.forEach(k => StorageService.remove(k));
    this.initFirebase();
  }

  async initFirebase() {
    try {
      const config = this.state.settings?.firebaseConfig || DEFAULT_FIREBASE_CONFIG;
      await firebaseAuthService.init(config);
      firebaseAuthService.onAuthChange(async (user) => {
        // Ignore results of an older auth event if a newer one arrived meanwhile.
        const seq = ++this.authSeq;
        this.state.settings.firebaseUser = user;

        if (!user) {
          firebaseSyncService.stopSync();
          this.saveToStorage();
          this.listeners.forEach(fn => fn('auth:changed', user, this.state));
          return;
        }

        firebaseSyncService.stopSync();
        this.saveToStorage();
        this.listeners.forEach(fn => fn('auth:changed', user, this.state));

        try {
          const ui = await this.cloudSessionUiReady;
          const session = await prepareCloudSession({
            uid: user.uid,
            getState: () => this.state,
            replaceLocal: (collections) => this.replaceLocalCollections(collections),
            ui
          });
          if (seq !== this.authSeq) return;
          if (!session.proceed) {
            firebaseSyncService.updateStatus('error', 'Dữ liệu Cloud cần được nâng cấp trước khi đồng bộ (đăng nhập lại để nâng cấp).');
            return;
          }
          firebaseSyncService.startSync(user.uid, {
            getState: () => this.state,
            applyCollection: (c, r) => this.applyRemoteCollection(c, r)
          });
        } catch (err) {
          console.error('Lỗi chuẩn bị phiên đồng bộ Cloud:', err);
          firebaseSyncService.updateStatus('error', 'Lỗi chuẩn bị đồng bộ Cloud: ' + err.message);
        }
      });
    } catch (err) {
      console.warn('Khởi tạo Firebase thất bại:', err);
      firebaseSyncService.updateStatus('offline', 'Offline / chưa tải được Cloud');
    }
  }

  /**
   * Register the UI used while preparing a cloud session (confirm dialogs,
   * backup download, toasts). Sign-in handling waits until this is called.
   *
   * @param {{ confirm: Function, backupLocal: Function, notify: Function }} ui
   */
  setCloudSessionUi(ui) {
    this.resolveCloudSessionUi(ui);
  }

  /**
   * Replace local data collections wholesale (account switch / using cloud data).
   * Not pushed to the cloud by itself: sync starts afterwards with a cleared baseline.
   *
   * @param {{ transactions?: Array, wallets?: Array, categories?: Array, budgets?: Array, debts?: Array }} collections
   */
  replaceLocalCollections(collections) {
    for (const key of ['transactions', 'wallets', 'categories', 'budgets', 'debts']) {
      if (Array.isArray(collections[key])) this.state[key] = collections[key];
    }
    this.recalculateWalletBalances();
    this.saveToStorage();
    this.listeners.forEach(fn => fn('data:replaced', null, this.state));
  }

  applyRemoteCollection(collection, records) {
    if (!records) return;
    if (collection === 'settings') {
      const settingsRecord = Array.isArray(records) ? records[0] : records;
      if (settingsRecord && typeof settingsRecord === 'object') {
        const mergedSettings = { ...this.state.settings };
        for (const key of SYNCED_SETTINGS_KEYS) {
          if (settingsRecord[key] !== undefined) {
            mergedSettings[key] = settingsRecord[key];
          }
        }
        this.state.settings = mergedSettings;
      }
    } else {
      this.state[collection] = records;
    }

    if (['transactions', 'wallets', 'debts'].includes(collection)) {
      this.recalculateWalletBalances();
    }

    this.saveToStorage();
    this.listeners.forEach(fn => fn('remote:synced', { collection }, this.state));
  }

  ensureUniqueCategoryColors() {
    const usedColors = new Set();
    let hasChanges = false;

    this.state.categories.forEach(cat => {
      const lowerColor = (cat.color || '').toLowerCase();
      if (!cat.color || usedColors.has(lowerColor)) {
        // Find next unused color from palette
        const available = CATEGORY_PALETTE.find(c => !usedColors.has(c.toLowerCase()));
        const newColor = available || CATEGORY_PALETTE[usedColors.size % CATEGORY_PALETTE.length];
        cat.color = newColor;
        usedColors.add(newColor.toLowerCase());
        hasChanges = true;
      } else {
        usedColors.add(lowerColor);
      }
    });

    if (hasChanges) {
      StorageService.set(STORAGE_KEYS.CATEGORIES, this.state.categories);
    }
  }

  getNextCategoryColor(type = 'expense') {
    const usedColors = new Set(this.state.categories.map(c => (c.color || '').toLowerCase()));
    const available = CATEGORY_PALETTE.find(c => !usedColors.has(c.toLowerCase()));
    if (available) return available;
    return CATEGORY_PALETTE[this.state.categories.length % CATEGORY_PALETTE.length];
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(event, payload) {
    this.saveToStorage();
    this.listeners.forEach(fn => fn(event, payload, this.state));

    // Auto-sync with Firebase if active and not a remote update
    if (firebaseSyncService.isActive() && !firebaseSyncService.isApplyingRemote) {
      firebaseSyncService.scheduleSync();
    }
  }

  saveToStorage() {
    StorageService.set(STORAGE_KEYS.TRANSACTIONS, this.state.transactions);
    StorageService.set(STORAGE_KEYS.WALLETS, this.state.wallets);
    StorageService.set(STORAGE_KEYS.CATEGORIES, this.state.categories);
    StorageService.set(STORAGE_KEYS.BUDGETS, this.state.budgets);
    StorageService.set(STORAGE_KEYS.DEBTS, this.state.debts);
    StorageService.set(STORAGE_KEYS.SETTINGS, this.state.settings);
  }

  getState() {
    return this.state;
  }

  // --- Transactions Actions ---
  addTransaction(tx) {
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

    this.state.transactions.unshift(newTx);
    this.recalculateWalletBalances();
    this.notify('transaction:added', newTx);
    return newTx;
  }

  updateTransaction(id, updatedData) {
    const index = this.state.transactions.findIndex(t => t.id === id);
    if (index === -1) return null;

    let amount = this.state.transactions[index].amount;
    if (Object.prototype.hasOwnProperty.call(updatedData, 'amount')) {
      const parsedAmount = Number(updatedData.amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return null;
      amount = parsedAmount;
    }

    this.state.transactions[index] = {
      ...this.state.transactions[index],
      ...updatedData,
      amount,
      updatedAt: new Date().toISOString()
    };

    this.recalculateWalletBalances();
    this.notify('transaction:updated', this.state.transactions[index]);
    return this.state.transactions[index];
  }

  deleteTransaction(id) {
    const index = this.state.transactions.findIndex(t => t.id === id);
    if (index === -1) return false;

    const deleted = this.state.transactions.splice(index, 1)[0];
    this.recalculateWalletBalances();
    this.notify('transaction:deleted', deleted);
    return true;
  }

  // --- Wallets Actions ---
  addWallet(wallet) {
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

    this.state.wallets.push(newWallet);
    this.recalculateWalletBalances();
    this.notify('wallet:added', newWallet);
    return newWallet;
  }

  updateWallet(id, data) {
    const wallet = this.state.wallets.find(w => w.id === id);
    if (!wallet) return null;

    Object.assign(wallet, data);
    if (data.initialBalance !== undefined) {
      wallet.initialBalance = Number(data.initialBalance) || 0;
    }

    this.recalculateWalletBalances();
    this.notify('wallet:updated', wallet);
    return wallet;
  }

  deleteWallet(id) {
    const refs = findWalletReferences(id, this.state);
    if (refs.transactions > 0) return { success: false, reason: 'Ví đã có giao dịch, không thể xóa' };
    if (refs.debts > 0) return { success: false, reason: 'Ví đang được dùng trong khoản vay/nợ hoặc lần trả nợ, không thể xóa' };

    this.state.wallets = this.state.wallets.filter(w => w.id !== id);
    this.recalculateWalletBalances();
    this.notify('wallet:deleted', id);
    return { success: true };
  }

  // --- Categories Actions ---
  addCategory(category) {
    const color = category.color || this.getNextCategoryColor(category.type || 'expense');
    const newCat = {
      id: generateId('cat'),
      name: category.name.trim(),
      type: category.type || 'expense', // 'expense' | 'income'
      icon: category.icon || (category.type === 'income' ? 'plus-circle' : 'tag'),
      color: color,
      createdAt: new Date().toISOString()
    };

    this.state.categories.push(newCat);
    this.notify('category:added', newCat);
    return newCat;
  }

  updateCategory(id, data) {
    const cat = this.state.categories.find(c => c.id === id);
    if (!cat) return null;

    Object.assign(cat, data);
    this.notify('category:updated', cat);
    return cat;
  }

  deleteCategory(id) {
    const hasTransactions = this.state.transactions.some(t => t.categoryId === id);
    if (hasTransactions) return { success: false, reason: 'Hạng mục đã có giao dịch phát sinh, không thể xóa' };

    this.state.categories = this.state.categories.filter(c => c.id !== id);
    this.state.budgets = this.state.budgets.filter(b => b.categoryId !== id);
    this.notify('category:deleted', id);
    return { success: true };
  }

  // --- Debts Actions ---
  addDebt(debt) {
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

    this.state.debts.unshift(newDebt);
    this.recalculateWalletBalances();
    this.notify('debt:added', newDebt);
    return newDebt;
  }

  recordRepayment(debtId, { amount, walletId, date, note }) {
    const debt = this.state.debts.find(d => d.id === debtId);
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

    this.recalculateWalletBalances();
    this.notify('debt:repayment', { debt, repayment });
    return debt;
  }

  updateDebt(id, data) {
    const debt = this.state.debts.find(d => d.id === id);
    if (!debt) return null;

    Object.assign(debt, data);
    debt.updatedAt = new Date().toISOString();
    this.recalculateWalletBalances();
    this.notify('debt:updated', debt);
    return debt;
  }

  deleteDebt(id) {
    this.state.debts = this.state.debts.filter(d => d.id !== id);
    this.recalculateWalletBalances();
    this.notify('debt:deleted', id);
    return { success: true };
  }

  recalculateWalletBalances() {
    const balances = computeWalletBalances(this.state.wallets, this.state.transactions, this.state.debts);
    this.state.wallets.forEach(w => {
      w.currentBalance = balances[w.id] !== undefined ? balances[w.id] : (Number(w.initialBalance) || 0);
    });
  }

  // --- Budgets Actions ---
  setBudget(categoryId, month, limitAmount) {
    const monthStr = month || getMonthYear();
    const existingIndex = this.state.budgets.findIndex(b => b.categoryId === categoryId && b.month === monthStr);
    const limit = Number(limitAmount) || 0;

    if (existingIndex > -1) {
      this.state.budgets[existingIndex].limitAmount = limit;
      this.state.budgets[existingIndex].updatedAt = new Date().toISOString();
    } else {
      this.state.budgets.push({
        id: generateId('budget'),
        categoryId,
        month: monthStr,
        limitAmount: limit,
        createdAt: new Date().toISOString()
      });
    }

    this.notify('budget:updated', { categoryId, month: monthStr });
  }

  deleteBudget(categoryId, month) {
    const initialLength = this.state.budgets.length;
    this.state.budgets = this.state.budgets.filter(b => !(b.categoryId === categoryId && b.month === month));
    if (this.state.budgets.length === initialLength) return false;

    this.notify('budget:deleted', { categoryId, month });
    return true;
  }

  // --- Settings & Bulk Data Import ---
  updateSettings(partialSettings) {
    this.state.settings = { ...this.state.settings, ...partialSettings };
    this.notify('settings:updated', this.state.settings);
  }

  importAllData(payload) {
    if (payload.transactions) {
      const seen = new Set();
      this.state.transactions = payload.transactions.filter(t => {
        if (!t.id || seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      });
    }
    if (payload.wallets) {
      const seen = new Set();
      this.state.wallets = payload.wallets.filter(w => {
        if (!w.id || seen.has(w.id)) return false;
        seen.add(w.id);
        return true;
      });
    }
    if (payload.categories) {
      const seen = new Set();
      this.state.categories = payload.categories.filter(c => {
        if (!c.id || seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      });
    }
    if (payload.budgets) this.state.budgets = payload.budgets;
    if (payload.debts) {
      const seen = new Set();
      this.state.debts = payload.debts.filter(d => {
        if (!d.id || seen.has(d.id)) return false;
        seen.add(d.id);
        return true;
      });
    }
    if (payload.settings) this.state.settings = { ...this.state.settings, ...sanitizeLegacySettings(sanitizeImportedSettings(payload.settings)) };

    this.recalculateWalletBalances();
    this.notify('data:imported', this.state);
  }
}

export const stateStore = new StateStore();
