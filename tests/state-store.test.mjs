import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Install an in-memory localStorage stub on globalThis BEFORE importing state.js
const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => (storage.has(key) ? storage.get(key) : null),
  setItem: (key, value) => { storage.set(key, String(value)); },
  removeItem: (key) => { storage.delete(key); },
  clear: () => { storage.clear(); },
  key: (index) => Array.from(storage.keys())[index] || null,
  get length() { return storage.size; }
};

// Dynamically import stateStore after localStorage is installed
const { stateStore } = await import('../js/state.js');

describe('stateStore', () => {
  it('deleteBudget returns true then false', () => {
    stateStore.setBudget('cat-food', '2026-05', 1000000);
    const first = stateStore.deleteBudget('cat-food', '2026-05');
    assert.strictEqual(first, true);

    const second = stateStore.deleteBudget('cat-food', '2026-05');
    assert.strictEqual(second, false);
  });

  it('updateTransaction with amount 0 / "abc" returns null and keeps the old amount', () => {
    const tx = stateStore.addTransaction({
      type: 'expense',
      amount: 50000,
      walletId: 'wallet-cash'
    });

    const res0 = stateStore.updateTransaction(tx.id, { amount: 0 });
    assert.strictEqual(res0, null);
    let currentTx = stateStore.getState().transactions.find(t => t.id === tx.id);
    assert.strictEqual(currentTx.amount, 50000);

    const resAbc = stateStore.updateTransaction(tx.id, { amount: 'abc' });
    assert.strictEqual(resAbc, null);
    currentTx = stateStore.getState().transactions.find(t => t.id === tx.id);
    assert.strictEqual(currentTx.amount, 50000);
  });

  it('updateTransaction without amount keeps amount', () => {
    const tx = stateStore.addTransaction({
      type: 'expense',
      amount: 75000,
      walletId: 'wallet-cash'
    });

    const res = stateStore.updateTransaction(tx.id, { note: 'Lunch with team' });
    assert.ok(res);
    assert.strictEqual(res.amount, 75000);
    assert.strictEqual(res.note, 'Lunch with team');
  });

  it('deleteCategory removes its budgets', () => {
    const cat = stateStore.addCategory({ name: 'Entertainment Test', type: 'expense' });
    stateStore.setBudget(cat.id, '2026-06', 700000);

    const hasBudgetBefore = stateStore.getState().budgets.some(b => b.categoryId === cat.id);
    assert.strictEqual(hasBudgetBefore, true);

    const delRes = stateStore.deleteCategory(cat.id);
    assert.strictEqual(delRes.success, true);

    const hasCategoryAfter = stateStore.getState().categories.some(c => c.id === cat.id);
    assert.strictEqual(hasCategoryAfter, false);

    const hasBudgetAfter = stateStore.getState().budgets.some(b => b.categoryId === cat.id);
    assert.strictEqual(hasBudgetAfter, false);
  });

  it('importAllData strips legacy settings keys', () => {
    stateStore.importAllData({
      settings: {
        currency: 'VND',
        currencySymbol: '₫',
        theme: 'light',
        googleClientId: 'test-google-client-id',
        spreadsheetId: 'test-spreadsheet-id',
        spreadsheetName: 'QuanLyChiTieu_DB',
        autoSync: true,
        lastSyncTime: '2026-01-01T00:00:00.000Z'
      }
    });

    const settings = stateStore.getState().settings;
    assert.strictEqual(settings.currency, 'VND');
    assert.strictEqual(settings.currencySymbol, '₫');
    assert.strictEqual(settings.theme, 'light');
    assert.strictEqual('googleClientId' in settings, false);
    assert.strictEqual('spreadsheetId' in settings, false);
    assert.strictEqual('spreadsheetName' in settings, false);
    assert.strictEqual('autoSync' in settings, false);
    assert.strictEqual('lastSyncTime' in settings, false);
  });
});
