import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeLegacySettings, LEGACY_SETTINGS_KEYS } from '../js/domain/settings-migration.js';

describe('sanitizeLegacySettings', () => {
  it('removes each legacy key individually', () => {
    for (const key of LEGACY_SETTINGS_KEYS) {
      const input = { currency: 'VND', [key]: 'test_value' };
      const result = sanitizeLegacySettings(input);
      assert.strictEqual(result[key], undefined);
      assert.strictEqual(result.currency, 'VND');
    }
  });

  it('removes all legacy keys together', () => {
    const input = {
      currency: 'VND',
      currencySymbol: '₫',
      theme: 'light',
      googleClientId: 'test-client-id',
      spreadsheetId: 'test-sheet-id',
      spreadsheetName: 'QuanLyChiTieu_DB',
      autoSync: true,
      lastSyncTime: '2026-01-01T00:00:00.000Z',
      syncProvider: 'firebase',
      firebaseConfig: { projectId: 'test-proj' },
      firebaseUser: { uid: 'u123' }
    };

    const result = sanitizeLegacySettings(input);

    for (const key of LEGACY_SETTINGS_KEYS) {
      assert.strictEqual(key in result, false);
    }
    assert.strictEqual(result.currency, 'VND');
    assert.strictEqual(result.currencySymbol, '₫');
    assert.strictEqual(result.theme, 'light');
    assert.strictEqual(result.syncProvider, 'firebase');
    assert.deepEqual(result.firebaseConfig, { projectId: 'test-proj' });
    assert.deepEqual(result.firebaseUser, { uid: 'u123' });
  });

  it('keeps other keys and preserves object references for nested properties', () => {
    const firebaseConfig = { projectId: 'proj-1' };
    const firebaseUser = { uid: 'user-1' };
    const input = {
      currency: 'USD',
      theme: 'dark',
      googleClientId: 'legacy',
      firebaseConfig,
      firebaseUser
    };

    const result = sanitizeLegacySettings(input);

    assert.strictEqual(result.currency, 'USD');
    assert.strictEqual(result.theme, 'dark');
    assert.strictEqual(result.firebaseConfig, firebaseConfig);
    assert.strictEqual(result.firebaseUser, firebaseUser);
  });

  it('does not mutate input', () => {
    const input = {
      currency: 'VND',
      googleClientId: 'client-123',
      spreadsheetId: 'sheet-456'
    };
    const inputCopy = { ...input };

    const result = sanitizeLegacySettings(input);

    assert.deepEqual(input, inputCopy);
    assert.notStrictEqual(result, input);
  });

  it('returns {} for null, undefined, and non-object inputs', () => {
    assert.deepEqual(sanitizeLegacySettings(null), {});
    assert.deepEqual(sanitizeLegacySettings(undefined), {});
    assert.deepEqual(sanitizeLegacySettings('string'), {});
    assert.deepEqual(sanitizeLegacySettings(123), {});
    assert.deepEqual(sanitizeLegacySettings(true), {});
    assert.deepEqual(sanitizeLegacySettings(false), {});
    assert.deepEqual(sanitizeLegacySettings([]), {});
    assert.deepEqual(sanitizeLegacySettings(['googleClientId']), {});
  });

  it('returns equal copy when input has no legacy keys', () => {
    const input = {
      currency: 'VND',
      theme: 'light',
      syncProvider: 'firebase'
    };

    const result = sanitizeLegacySettings(input);

    assert.deepEqual(result, input);
    assert.notStrictEqual(result, input);
  });
});
