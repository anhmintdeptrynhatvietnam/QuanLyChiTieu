import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SYNC_COLLECTIONS,
  SETTINGS_RECORD_ID,
  SYNCED_SETTINGS_KEYS,
  stableStringify,
  hashRecord,
  toCloudRecord,
  fromCloudRecord,
  settingsToRecord,
  snapshotLocal,
  diffForPush,
  applyPushToBaseline,
  mergeRemoteChanges
} from '../js/domain/sync-diff.js';

describe('stableStringify', () => {
  it('serializes primitives identically to JSON.stringify', () => {
    assert.strictEqual(stableStringify(123), '123');
    assert.strictEqual(stableStringify('hello'), '"hello"');
    assert.strictEqual(stableStringify(true), 'true');
    assert.strictEqual(stableStringify(null), 'null');
    assert.strictEqual(stableStringify(undefined), undefined);
  });

  it('guarantees key order independence for objects', () => {
    const obj1 = { b: 2, a: 1, c: 3 };
    const obj2 = { c: 3, a: 1, b: 2 };
    assert.strictEqual(stableStringify(obj1), '{"a":1,"b":2,"c":3}');
    assert.strictEqual(stableStringify(obj1), stableStringify(obj2));
  });

  it('handles nested objects recursively with sorted keys', () => {
    const nested1 = {
      user: { name: 'Alice', age: 30, address: { city: 'Hanoi', zip: '10000' } },
      active: true
    };
    const nested2 = {
      active: true,
      user: { address: { zip: '10000', city: 'Hanoi' }, age: 30, name: 'Alice' }
    };
    assert.strictEqual(stableStringify(nested1), stableStringify(nested2));
    assert.strictEqual(
      stableStringify(nested1),
      '{"active":true,"user":{"address":{"city":"Hanoi","zip":"10000"},"age":30,"name":"Alice"}}'
    );
  });

  it('preserves array element order while stably stringifying array contents', () => {
    const arr1 = [{ b: 2, a: 1 }, { d: 4, c: 3 }];
    const arr2 = [{ a: 1, b: 2 }, { c: 3, d: 4 }];
    assert.strictEqual(stableStringify(arr1), '[{"a":1,"b":2},{"c":3,"d":4}]');
    assert.strictEqual(stableStringify(arr1), stableStringify(arr2));

    // Order matters for arrays
    const order1 = [1, 2, 3];
    const order2 = [3, 2, 1];
    assert.notStrictEqual(stableStringify(order1), stableStringify(order2));
  });

  it('omits undefined object properties like JSON.stringify', () => {
    const obj = { a: 1, b: undefined, c: 'test' };
    assert.strictEqual(stableStringify(obj), '{"a":1,"c":"test"}');
  });

  it('converts undefined in arrays to null like JSON.stringify', () => {
    assert.strictEqual(stableStringify([undefined, 1]), '[null,1]');
  });
});

describe('hashRecord', () => {
  it('returns equal hash for reordered keys', () => {
    const obj1 = { id: 'w1', name: 'Cash', color: '#10b981' };
    const obj2 = { color: '#10b981', id: 'w1', name: 'Cash' };
    assert.strictEqual(hashRecord(obj1), hashRecord(obj2));
  });

  it('returns exactly an 8-character lowercase hex string', () => {
    const hash = hashRecord({ id: 'tx-1', amount: 50000, note: 'Ăn trưa' });
    assert.match(hash, /^[0-9a-f]{8}$/);
  });

  it('produces different hashes for different contents', () => {
    const h1 = hashRecord({ id: '1', amount: 100 });
    const h2 = hashRecord({ id: '1', amount: 200 });
    assert.notStrictEqual(h1, h2);
  });
});

describe('toCloudRecord and fromCloudRecord', () => {
  it('strips currentBalance for wallets only and removes "_" metadata keys', () => {
    const wallet = {
      id: 'w1',
      name: 'Ví tiền mặt',
      initialBalance: 1000000,
      currentBalance: 500000,
      _updatedAt: '2026-03-01T00:00:00Z',
      _tempMeta: 'meta'
    };

    const cloudWallet = toCloudRecord('wallets', wallet);
    assert.deepEqual(cloudWallet, {
      id: 'w1',
      name: 'Ví tiền mặt',
      initialBalance: 1000000
    });
    assert.strictEqual('currentBalance' in cloudWallet, false);
    assert.strictEqual('_updatedAt' in cloudWallet, false);
    assert.strictEqual('_tempMeta' in cloudWallet, false);
  });

  it('retains currentBalance for non-wallet collections and strips "_" keys', () => {
    const record = {
      id: 'r1',
      currentBalance: 100,
      _meta: 'xyz'
    };
    const cloudRecord = toCloudRecord('transactions', record);
    assert.deepEqual(cloudRecord, {
      id: 'r1',
      currentBalance: 100
    });
    assert.strictEqual('_meta' in cloudRecord, false);
  });

  it('fromCloudRecord strips "_" metadata keys', () => {
    const cloudData = {
      id: 't1',
      amount: 45000,
      note: 'Coffee',
      _updatedAt: '2026-03-01T12:00:00Z',
      _serverTimestamp: 123456
    };
    const local = fromCloudRecord(cloudData);
    assert.deepEqual(local, {
      id: 't1',
      amount: 45000,
      note: 'Coffee'
    });
    assert.strictEqual('_updatedAt' in local, false);
    assert.strictEqual('_serverTimestamp' in local, false);
  });
});

describe('settingsToRecord', () => {
  it('extracts id main and only defined SYNCED_SETTINGS_KEYS', () => {
    const settings = {
      currency: 'VND',
      currencySymbol: '₫',
      theme: 'dark',
      syncProvider: 'firebase',
      firebaseConfig: { projectId: 'my-proj' }
    };
    const record = settingsToRecord(settings);
    assert.deepEqual(record, {
      id: SETTINGS_RECORD_ID,
      currency: 'VND',
      currencySymbol: '₫',
      theme: 'dark'
    });
  });

  it('omits undefined SYNCED_SETTINGS_KEYS and handles empty/null settings', () => {
    const partial = { currency: 'USD' };
    assert.deepEqual(settingsToRecord(partial), {
      id: 'main',
      currency: 'USD'
    });
    assert.deepEqual(settingsToRecord({}), { id: 'main' });
    assert.deepEqual(settingsToRecord(null), { id: 'main' });
  });
});

describe('snapshotLocal', () => {
  it('snapshots all SYNC_COLLECTIONS tolerating null/empty arrays and creates settings main', () => {
    const state = {
      transactions: null,
      wallets: [
        { id: 'w1', name: 'Cash', currentBalance: 200000 },
        { id: null, name: 'Invalid' },
        { name: 'Missing ID' }
      ],
      categories: [
        { id: 'c1', name: 'Ăn uống' }
      ],
      budgets: undefined,
      debts: [],
      settings: { currency: 'VND', theme: 'light' }
    };

    const snap = snapshotLocal(state);

    for (const col of SYNC_COLLECTIONS) {
      assert.ok(snap[col], `Missing collection ${col} in snapshot`);
    }

    assert.deepEqual(snap.transactions, {});
    assert.deepEqual(snap.wallets, {
      w1: { id: 'w1', name: 'Cash' }
    });
    assert.deepEqual(snap.categories, {
      c1: { id: 'c1', name: 'Ăn uống' }
    });
    assert.deepEqual(snap.budgets, {});
    assert.deepEqual(snap.debts, {});
    assert.deepEqual(snap.settings, {
      main: { id: 'main', currency: 'VND', theme: 'light' }
    });
  });
});

describe('diffForPush', () => {
  it('detects new, changed, unchanged, deleted, and multiple collections in one diff', () => {
    const localSnap = {
      transactions: {
        t1: { id: 't1', amount: 50000 }, // unchanged
        t2: { id: 't2', amount: 120000 } // changed
      },
      wallets: {
        w1: { id: 'w1', name: 'New Wallet' } // new
      },
      categories: {}, // c1 deleted
      budgets: {},
      debts: {},
      settings: {
        main: { id: 'main', currency: 'VND', theme: 'light' }
      }
    };

    const baseline = {
      transactions: {
        t1: hashRecord({ id: 't1', amount: 50000 }),
        t2: hashRecord({ id: 't2', amount: 100000 })
      },
      categories: {
        c1: hashRecord({ id: 'c1', name: 'Food' })
      },
      settings: {
        main: hashRecord({ id: 'main', currency: 'VND', theme: 'light' })
      }
    };

    const diff = diffForPush(localSnap, baseline);

    assert.deepEqual(diff.upserts, [
      { collection: 'transactions', id: 't2', data: { id: 't2', amount: 120000 } },
      { collection: 'wallets', id: 'w1', data: { id: 'w1', name: 'New Wallet' } }
    ]);

    assert.deepEqual(diff.deletes, [
      { collection: 'categories', id: 'c1' }
    ]);
  });

  it('never emits a delete for settings even if missing from local snapshot', () => {
    const localSnap = {
      transactions: {},
      wallets: {},
      categories: {},
      budgets: {},
      debts: {},
      settings: {}
    };

    const baseline = {
      settings: {
        main: hashRecord({ id: 'main', currency: 'VND' })
      }
    };

    const diff = diffForPush(localSnap, baseline);
    assert.strictEqual(diff.deletes.some(d => d.collection === 'settings'), false);
  });
});

describe('applyPushToBaseline', () => {
  it('returns a new baseline without mutating input', () => {
    const original = {
      transactions: {
        t1: 'hash-t1'
      },
      categories: {
        c1: 'hash-c1'
      }
    };

    const diff = {
      upserts: [
        { collection: 'transactions', id: 't2', data: { id: 't2', amount: 200 } }
      ],
      deletes: [
        { collection: 'categories', id: 'c1' }
      ]
    };

    const next = applyPushToBaseline(original, diff);

    assert.notStrictEqual(next, original);
    assert.strictEqual(original.categories.c1, 'hash-c1');
    assert.strictEqual(original.transactions.t2, undefined);

    assert.strictEqual(next.categories.c1, undefined);
    assert.strictEqual(next.transactions.t1, 'hash-t1');
    assert.strictEqual(next.transactions.t2, hashRecord({ id: 't2', amount: 200 }));
  });
});

describe('mergeRemoteChanges', () => {
  it('remote add new: appends new record and sets baseline', () => {
    const res = mergeRemoteChanges({
      collection: 'categories',
      localRecords: [{ id: 'c1', name: 'Ăn uống' }],
      baselineMap: { c1: hashRecord({ id: 'c1', name: 'Ăn uống' }) },
      changes: [
        { type: 'added', id: 'c2', data: { id: 'c2', name: 'Mua sắm' } }
      ]
    });

    assert.deepEqual(res.records, [
      { id: 'c1', name: 'Ăn uống' },
      { id: 'c2', name: 'Mua sắm' }
    ]);
    assert.strictEqual(res.baselineMap.c2, hashRecord({ id: 'c2', name: 'Mua sắm' }));
    assert.strictEqual(res.changed, true);
  });

  it('remote modify clean local: updates local record and sets baseline', () => {
    const initialData = { id: 'w1', name: 'Cash' };
    const initialHash = hashRecord(initialData);

    const res = mergeRemoteChanges({
      collection: 'wallets',
      localRecords: [{ id: 'w1', name: 'Cash' }],
      baselineMap: { w1: initialHash },
      changes: [
        { type: 'modified', id: 'w1', data: { id: 'w1', name: 'Cash Wallet' } }
      ]
    });

    assert.deepEqual(res.records, [{ id: 'w1', name: 'Cash Wallet' }]);
    assert.strictEqual(res.baselineMap.w1, hashRecord({ id: 'w1', name: 'Cash Wallet' }));
    assert.strictEqual(res.changed, true);
  });

  it('local dirty + remote unchanged keeps local: unsynced local edit wins', () => {
    const baseData = { id: 't1', amount: 50000 };
    const baseHash = hashRecord(baseData);
    const localData = { id: 't1', amount: 60000 };

    const res = mergeRemoteChanges({
      collection: 'transactions',
      localRecords: [localData],
      baselineMap: { t1: baseHash },
      changes: [
        { type: 'modified', id: 't1', data: baseData }
      ]
    });

    assert.deepEqual(res.records, [localData]);
    assert.strictEqual(res.baselineMap.t1, baseHash);
    assert.strictEqual(res.changed, false);
  });

  it('both changed -> remote wins', () => {
    const baseData = { id: 't1', amount: 50000 };
    const baseHash = hashRecord(baseData);
    const localData = { id: 't1', amount: 60000 };
    const remoteData = { id: 't1', amount: 70000 };

    const res = mergeRemoteChanges({
      collection: 'transactions',
      localRecords: [localData],
      baselineMap: { t1: baseHash },
      changes: [
        { type: 'modified', id: 't1', data: remoteData }
      ]
    });

    assert.deepEqual(res.records, [remoteData]);
    assert.strictEqual(res.baselineMap.t1, hashRecord(remoteData));
    assert.strictEqual(res.changed, true);
  });

  it('pending local delete not re-added: skips remote item matching baseline', () => {
    const baseData = { id: 'b1', limitAmount: 500000 };
    const baseHash = hashRecord(baseData);

    const res = mergeRemoteChanges({
      collection: 'budgets',
      localRecords: [], // deleted locally
      baselineMap: { b1: baseHash },
      changes: [
        { type: 'modified', id: 'b1', data: baseData }
      ]
    });

    assert.deepEqual(res.records, []);
    assert.strictEqual(res.baselineMap.b1, baseHash);
    assert.strictEqual(res.changed, false);
  });

  it('removed clean -> deleted from local records and baseline', () => {
    const cleanData = { id: 'c1', name: 'Food' };
    const baseHash = hashRecord(cleanData);

    const res = mergeRemoteChanges({
      collection: 'categories',
      localRecords: [cleanData],
      baselineMap: { c1: baseHash },
      changes: [
        { type: 'removed', id: 'c1' }
      ]
    });

    assert.deepEqual(res.records, []);
    assert.strictEqual('c1' in res.baselineMap, false);
    assert.strictEqual(res.changed, true);
  });

  it('removed dirty -> kept locally and deleted from baseline for re-upload', () => {
    const baseHash = hashRecord({ id: 'c1', name: 'Food' });
    const dirtyLocal = { id: 'c1', name: 'Food & Drinks' };

    const res = mergeRemoteChanges({
      collection: 'categories',
      localRecords: [dirtyLocal],
      baselineMap: { c1: baseHash },
      changes: [
        { type: 'removed', id: 'c1' }
      ]
    });

    assert.deepEqual(res.records, [dirtyLocal]);
    assert.strictEqual('c1' in res.baselineMap, false);
    assert.strictEqual(res.changed, false);
  });

  it('initial reconcile removes clean local missing from cloud and keeps new/dirty local', () => {
    const cleanOld = { id: '1', name: 'Clean Old' };
    const dirtyEdited = { id: '2', name: 'Dirty Edited' };
    const brandNew = { id: '3', name: 'Brand New' };

    const baselineMap = {
      '1': hashRecord(cleanOld),
      '2': hashRecord({ id: '2', name: 'Original 2' })
    };

    const cloudIds = new Set(['4']); // None of 1, 2, 3 are in cloud

    const res = mergeRemoteChanges({
      collection: 'categories',
      localRecords: [cleanOld, dirtyEdited, brandNew],
      baselineMap,
      changes: [
        { type: 'added', id: '4', data: { id: '4', name: 'Cloud Item 4' } }
      ],
      isInitial: true,
      cloudIds
    });

    // '1' was clean & missing from cloud -> deleted remotely while offline -> removed
    // '2' was dirty -> kept
    // '3' was brand new (no baseline) -> kept
    // '4' added from cloud
    const ids = res.records.map(r => r.id);
    assert.deepEqual(ids, ['2', '3', '4']);
    assert.strictEqual('1' in res.baselineMap, false);
    assert.strictEqual(res.changed, true);
  });

  it('changed is false when the remote echo equals local', () => {
    const item = { id: 't1', amount: 50000, date: '2026-03-01' };
    const baseHash = hashRecord(item);

    const res = mergeRemoteChanges({
      collection: 'transactions',
      localRecords: [item],
      baselineMap: { t1: baseHash },
      changes: [
        { type: 'modified', id: 't1', data: item }
      ]
    });

    assert.strictEqual(res.changed, false);
  });

  it('transactions sorting: sorts by date desc then createdAt desc with missing values last', () => {
    const t1 = { id: 't1', date: '2026-03-01', createdAt: '2026-03-01T10:00:00Z' };
    const t2 = { id: 't2', date: '2026-03-05', createdAt: '2026-03-05T08:00:00Z' };
    const t3 = { id: 't3', date: '2026-03-05', createdAt: '2026-03-05T12:00:00Z' };
    const t4 = { id: 't4', date: null, createdAt: '2026-03-05T15:00:00Z' };

    const res = mergeRemoteChanges({
      collection: 'transactions',
      localRecords: [t1, t4],
      baselineMap: {},
      changes: [
        { type: 'added', id: 't2', data: t2 },
        { type: 'added', id: 't3', data: t3 }
      ]
    });

    assert.deepEqual(res.records.map(r => r.id), ['t3', 't2', 't1', 't4']);
  });

  it('debts sorting: sorts by createdAt desc with missing values last', () => {
    const d1 = { id: 'd1', createdAt: '2026-01-01T00:00:00Z' };
    const d2 = { id: 'd2', createdAt: '2026-02-01T00:00:00Z' };
    const d3 = { id: 'd3', createdAt: null };

    const res = mergeRemoteChanges({
      collection: 'debts',
      localRecords: [d1, d3],
      baselineMap: {},
      changes: [
        { type: 'added', id: 'd2', data: d2 }
      ]
    });

    assert.deepEqual(res.records.map(r => r.id), ['d2', 'd1', 'd3']);
  });

  it('wallets sorting: built-ins in default order first, then user-created by createdAt asc', () => {
    const remote = [
      { id: 'wallet-bank', name: 'Bank' },
      { id: 'wallet-a1', name: 'Later', createdAt: '2026-05-02T00:00:00Z' },
      { id: 'wallet-cash', name: 'Cash' },
      { id: 'wallet-z9', name: 'Earlier', createdAt: '2026-05-01T00:00:00Z' },
      { id: 'wallet-unknown', name: 'Imported without createdAt' }
    ];

    const res = mergeRemoteChanges({
      collection: 'wallets',
      localRecords: [],
      changes: remote.map(r => ({ type: 'added', id: r.id, data: r })),
      isInitial: true,
      cloudIds: new Set(remote.map(r => r.id)),
      defaultOrder: ['wallet-cash', 'wallet-bank']
    });

    assert.deepEqual(res.records.map(r => r.id), ['wallet-cash', 'wallet-bank', 'wallet-unknown', 'wallet-z9', 'wallet-a1']);
  });

  it('categories sorting: order is stable without defaultOrder', () => {
    const res = mergeRemoteChanges({
      collection: 'categories',
      localRecords: [],
      changes: [
        { type: 'added', id: 'c2', data: { id: 'c2', name: 'B' } },
        { type: 'added', id: 'c1', data: { id: 'c1', name: 'A' } }
      ]
    });

    assert.deepEqual(res.records.map(r => r.id), ['c1', 'c2']);
  });

  it('wallets currentBalance ignored in hashing', () => {
    const localWallet = { id: 'w1', name: 'Cash', currentBalance: 9999999 };
    const cloudWallet = { id: 'w1', name: 'Cash' }; // cloud doesn't store currentBalance

    const res = mergeRemoteChanges({
      collection: 'wallets',
      localRecords: [localWallet],
      baselineMap: { w1: hashRecord(cloudWallet) },
      changes: [
        { type: 'modified', id: 'w1', data: cloudWallet }
      ]
    });

    // Since currentBalance is ignored in hashing, the remote echo has the same hash and changed is false
    assert.strictEqual(res.changed, false);
  });
});
