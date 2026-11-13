import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { dedupeById, mapLegacyTables, hasLegacyData, LEGACY_TABLES } from '../js/domain/legacy-migration.js';
import { toCloudRecord, settingsToRecord } from '../js/domain/sync-diff.js';

describe('dedupeById', () => {
  it('drops records without id and counts them', () => {
    const res = dedupeById([{ id: 'a' }, { name: 'x' }, null, { id: '' }]);
    assert.deepEqual(res.records, [{ id: 'a' }]);
    assert.equal(res.skippedNoId, 3);
    assert.equal(res.duplicates, 0);
  });

  it('keeps the record with the later updatedAt', () => {
    const res = dedupeById([
      { id: 'a', v: 'new', updatedAt: '2026-05-02T00:00:00Z' },
      { id: 'a', v: 'old', updatedAt: '2026-05-01T00:00:00Z' }
    ]);
    assert.deepEqual(res.records.map(r => r.v), ['new']);
    assert.equal(res.duplicates, 1);
  });

  it('keeps the later occurrence when updatedAt ties or is missing', () => {
    const res = dedupeById([{ id: 'a', v: 1 }, { id: 'a', v: 2 }]);
    assert.deepEqual(res.records, [{ id: 'a', v: 2 }]);
  });

  it('treats numeric and string ids as the same key', () => {
    const res = dedupeById([{ id: 1, v: 'n' }, { id: '1', v: 's' }]);
    assert.equal(res.records.length, 1);
    assert.equal(res.duplicates, 1);
  });

  it('tolerates non-array input', () => {
    assert.deepEqual(dedupeById(undefined), { records: [], skippedNoId: 0, duplicates: 0 });
  });
});

describe('mapLegacyTables', () => {
  const legacyDocs = {
    transactions: { items: [{ id: 't1', amount: 5 }, { id: 't1', amount: 6, updatedAt: '2026-01-02' }, { amount: 1 }], _lastDeviceId: 'dev' },
    wallets: { items: [{ id: 'w1', name: 'Cash', initialBalance: 10, currentBalance: 99 }] },
    debts: { items: [{ id: 7, personName: 'A', repayments: [{ id: 'r1', amount: 1 }] }] },
    settings: { items: { currency: 'VND', currencySymbol: '₫', theme: 'dark', firebaseUser: { uid: 'x' } } }
  };

  it('converts every legacy table and reports stats', () => {
    const { collections, stats } = mapLegacyTables(legacyDocs, toCloudRecord, settingsToRecord);
    assert.deepEqual(Object.keys(collections).sort(), [...LEGACY_TABLES].sort());
    assert.deepEqual(collections.transactions, [{ id: 't1', amount: 6, updatedAt: '2026-01-02' }]);
    assert.deepEqual(stats.transactions, { kept: 1, skippedNoId: 1, duplicates: 1 });
    assert.deepEqual(collections.categories, []);
    assert.deepEqual(collections.budgets, []);
  });

  it('strips derived wallet balance and stringifies ids', () => {
    const { collections } = mapLegacyTables(legacyDocs, toCloudRecord, settingsToRecord);
    assert.deepEqual(collections.wallets, [{ id: 'w1', name: 'Cash', initialBalance: 10 }]);
    assert.equal(collections.debts[0].id, '7');
    assert.deepEqual(collections.debts[0].repayments, [{ id: 'r1', amount: 1 }]);
  });

  it('keeps only synced settings keys', () => {
    const { collections } = mapLegacyTables(legacyDocs, toCloudRecord, settingsToRecord);
    assert.deepEqual(collections.settings, [{ id: 'main', currency: 'VND', currencySymbol: '₫', theme: 'dark' }]);
  });

  it('handles missing documents', () => {
    const { collections, stats } = mapLegacyTables({}, toCloudRecord, settingsToRecord);
    assert.deepEqual(collections.settings, []);
    assert.equal(stats.wallets.kept, 0);
  });
});

describe('hasLegacyData', () => {
  it('detects non-empty arrays or a settings object', () => {
    assert.equal(hasLegacyData({ transactions: { items: [{ id: 'a' }] } }), true);
    assert.equal(hasLegacyData({ settings: { items: { theme: 'dark' } } }), true);
  });

  it('is false for nothing or empty arrays', () => {
    assert.equal(hasLegacyData(null), false);
    assert.equal(hasLegacyData({}), false);
    assert.equal(hasLegacyData({ transactions: { items: [] }, wallets: {} }), false);
  });
});
