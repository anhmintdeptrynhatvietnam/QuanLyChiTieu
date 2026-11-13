import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SENSITIVE_SETTINGS_KEYS,
  sanitizeForExport,
  sanitizeImportedSettings,
  toCsvCell
} from '../js/domain/export-sanitize.js';

describe('export-sanitize domain', () => {
  const defaultFirebaseConfig = {
    apiKey: 'default-key',
    projectId: 'default-project',
    authDomain: 'default-project.firebaseapp.com'
  };

  describe('sanitizeForExport', () => {
    it('removes firebaseUser, syncStatus, and lastSyncTime from exported settings', () => {
      const state = {
        transactions: [],
        wallets: [],
        categories: [],
        budgets: [],
        debts: [],
        settings: {
          currency: 'VND',
          theme: 'dark',
          firebaseUser: { uid: 'user-123', email: 'test@example.com' },
          syncStatus: 'connected',
          lastSyncTime: '2026-05-15T12:00:00.000Z'
        }
      };

      const exported = sanitizeForExport(state, defaultFirebaseConfig);

      assert.strictEqual(exported.settings.currency, 'VND');
      assert.strictEqual(exported.settings.theme, 'dark');
      assert.strictEqual('firebaseUser' in exported.settings, false);
      assert.strictEqual('syncStatus' in exported.settings, false);
      assert.strictEqual('lastSyncTime' in exported.settings, false);
    });

    it('removes settings.firebaseConfig when it is deep-equal to defaultFirebaseConfig', () => {
      const state = {
        settings: {
          currency: 'VND',
          firebaseConfig: { ...defaultFirebaseConfig }
        }
      };

      const exported = sanitizeForExport(state, defaultFirebaseConfig);

      assert.strictEqual('firebaseConfig' in exported.settings, false);
    });

    it('removes settings.firebaseConfig when missing or undefined', () => {
      const state = {
        settings: {
          currency: 'VND'
        }
      };

      const exported = sanitizeForExport(state, defaultFirebaseConfig);

      assert.strictEqual('firebaseConfig' in exported.settings, false);
    });

    it('keeps custom firebaseConfig when it differs from defaultFirebaseConfig', () => {
      const customConfig = {
        apiKey: 'custom-key',
        projectId: 'custom-project',
        authDomain: 'custom-project.firebaseapp.com'
      };
      const state = {
        settings: {
          currency: 'VND',
          firebaseConfig: customConfig
        }
      };

      const exported = sanitizeForExport(state, defaultFirebaseConfig);

      assert.deepEqual(exported.settings.firebaseConfig, customConfig);
    });

    it('does not mutate the input state', () => {
      const originalFirebaseUser = { uid: 'u-secret' };
      const originalTransactions = [{ id: 'tx-1', amount: 50000 }];
      const originalWallets = [{ id: 'w-1', name: 'Ví tiền mặt', currentBalance: 2000000 }];
      const state = {
        transactions: originalTransactions,
        wallets: originalWallets,
        settings: {
          currency: 'VND',
          firebaseUser: originalFirebaseUser,
          syncStatus: 'syncing',
          lastSyncTime: '2026-05-15T00:00:00.000Z',
          firebaseConfig: { ...defaultFirebaseConfig }
        }
      };

      const exported = sanitizeForExport(state, defaultFirebaseConfig);

      assert.strictEqual(state.settings.firebaseUser, originalFirebaseUser);
      assert.strictEqual(state.settings.syncStatus, 'syncing');
      assert.strictEqual(state.settings.lastSyncTime, '2026-05-15T00:00:00.000Z');
      assert.deepEqual(state.settings.firebaseConfig, defaultFirebaseConfig);
      assert.strictEqual(state.transactions[0].id, 'tx-1');
      assert.strictEqual(state.wallets[0].currentBalance, 2000000);

      // Verify that mutating the returned exported object does not affect state
      exported.settings.currency = 'USD';
      assert.strictEqual(state.settings.currency, 'VND');
    });

    it('keeps transactions, wallets (including currentBalance), categories, budgets, and debts intact', () => {
      const state = {
        transactions: [{ id: 't1', amount: 100000, type: 'expense', note: 'Ăn trưa' }],
        wallets: [{ id: 'w1', name: 'Tiền mặt', initialBalance: 500000, currentBalance: 400000 }],
        categories: [{ id: 'c1', name: 'Ăn uống', icon: 'utensils', color: '#f97316' }],
        budgets: [{ categoryId: 'c1', month: '2026-05', limitAmount: 2000000 }],
        debts: [{ id: 'd1', personName: 'Bạn Nam', amount: 500000, remainingAmount: 200000, repayments: [{ amount: 300000 }] }],
        settings: { currency: 'VND' }
      };

      const exported = sanitizeForExport(state, defaultFirebaseConfig);

      assert.deepEqual(exported.transactions, state.transactions);
      assert.deepEqual(exported.wallets, state.wallets);
      assert.strictEqual(exported.wallets[0].currentBalance, 400000);
      assert.deepEqual(exported.categories, state.categories);
      assert.deepEqual(exported.budgets, state.budgets);
      assert.deepEqual(exported.debts, state.debts);
    });

    it('handles null, undefined, or non-object state gracefully', () => {
      assert.deepEqual(sanitizeForExport(null, defaultFirebaseConfig), {});
      assert.deepEqual(sanitizeForExport(undefined, defaultFirebaseConfig), {});
      assert.deepEqual(sanitizeForExport('invalid', defaultFirebaseConfig), {});
      assert.deepEqual(sanitizeForExport([], defaultFirebaseConfig), {});
    });
  });

  describe('sanitizeImportedSettings', () => {
    it('removes SENSITIVE_SETTINGS_KEYS from imported settings', () => {
      const imported = {
        currency: 'VND',
        currencySymbol: '₫',
        theme: 'dark',
        firebaseUser: { uid: 'injected-user', email: 'attacker@evil.com' },
        syncStatus: 'connected',
        lastSyncTime: '2026-01-01T00:00:00.000Z',
        customKey: 'allowed'
      };

      const result = sanitizeImportedSettings(imported);

      for (const key of SENSITIVE_SETTINGS_KEYS) {
        assert.strictEqual(key in result, false);
      }
      assert.strictEqual(result.currency, 'VND');
      assert.strictEqual(result.currencySymbol, '₫');
      assert.strictEqual(result.theme, 'dark');
      assert.strictEqual(result.customKey, 'allowed');
    });

    it('returns {} for non-objects or null/undefined', () => {
      assert.deepEqual(sanitizeImportedSettings(null), {});
      assert.deepEqual(sanitizeImportedSettings(undefined), {});
      assert.deepEqual(sanitizeImportedSettings('invalid'), {});
      assert.deepEqual(sanitizeImportedSettings(12345), {});
      assert.deepEqual(sanitizeImportedSettings([]), {});
    });

    it('does not mutate the input settings object', () => {
      const original = {
        currency: 'VND',
        firebaseUser: { uid: 'u1' },
        syncStatus: 'offline'
      };

      const result = sanitizeImportedSettings(original);

      assert.strictEqual('firebaseUser' in original, true);
      assert.strictEqual('syncStatus' in original, true);
      assert.strictEqual('firebaseUser' in result, false);
      assert.strictEqual('syncStatus' in result, false);
    });
  });

  describe('toCsvCell', () => {
    it('returns empty string for null and undefined', () => {
      assert.strictEqual(toCsvCell(null), '');
      assert.strictEqual(toCsvCell(undefined), '');
    });

    it('formats numbers unquoted', () => {
      assert.strictEqual(toCsvCell(5000), '5000');
      assert.strictEqual(toCsvCell(0), '0');
      assert.strictEqual(toCsvCell(123.45), '123.45');
    });

    it('keeps a negative number passed as a number as -5 unquoted', () => {
      assert.strictEqual(toCsvCell(-5), '-5');
      assert.strictEqual(toCsvCell(-50000), '-50000');
    });

    it('wraps plain strings in double quotes', () => {
      assert.strictEqual(toCsvCell('plain string'), '"plain string"');
      assert.strictEqual(toCsvCell('Chi tiêu ăn uống'), '"Chi tiêu ăn uống"');
      assert.strictEqual(toCsvCell(''), '""');
    });

    it('escapes internal double quotes by doubling them', () => {
      assert.strictEqual(toCsvCell('a"b'), '"a""b"');
      assert.strictEqual(toCsvCell('He said "hello" to her'), '"He said ""hello"" to her"');
      assert.strictEqual(toCsvCell('"""'), '""""""""');
    });

    it('prefixes single quote for strings starting with =', () => {
      assert.strictEqual(toCsvCell('=1+1'), '"\'=1+1"');
      assert.strictEqual(toCsvCell('=SUM(A1:A10)'), '"\'=SUM(A1:A10)"');
    });

    it('prefixes single quote for strings starting with +', () => {
      assert.strictEqual(toCsvCell('+1'), '"\'+1"');
      assert.strictEqual(toCsvCell('+cmd|'), '"\'+cmd|"');
    });

    it('prefixes single quote for strings starting with -', () => {
      assert.strictEqual(toCsvCell('-5'), '"\'-5"');
      assert.strictEqual(toCsvCell('-1000'), '"\'-1000"');
    });

    it('prefixes single quote for strings starting with @', () => {
      assert.strictEqual(toCsvCell('@cmd'), '"\'@cmd"');
      assert.strictEqual(toCsvCell('@SUM(B1)'), '"\'@SUM(B1)"');
    });

    it('prefixes single quote for strings starting with tab', () => {
      assert.strictEqual(toCsvCell('\ttabbed'), '"\'\ttabbed"');
    });

    it('prefixes single quote for strings starting with carriage return', () => {
      assert.strictEqual(toCsvCell('\rcarriage'), '"\'\rcarriage"');
    });

    it('correctly handles strings with dangerous prefix and internal quotes', () => {
      assert.strictEqual(toCsvCell('=cmd|"foo"'), '"\'=cmd|""foo"""');
    });
  });
});
