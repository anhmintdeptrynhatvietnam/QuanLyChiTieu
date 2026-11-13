import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hasUserLocalData, decideOnSignIn, freshLocalCollections } from '../js/domain/account-switch.js';

describe('hasUserLocalData', () => {
  it('ignores default wallets and categories', () => {
    assert.equal(hasUserLocalData({ wallets: [{ id: 'w' }], categories: [{ id: 'c' }], transactions: [], debts: [], budgets: [] }), false);
  });

  it('counts transactions, debts or budgets', () => {
    assert.equal(hasUserLocalData({ transactions: [{ id: 't' }] }), true);
    assert.equal(hasUserLocalData({ debts: [{ id: 'd' }] }), true);
    assert.equal(hasUserLocalData({ budgets: [{ id: 'b' }] }), true);
  });

  it('tolerates missing state', () => {
    assert.equal(hasUserLocalData(null), false);
  });
});

describe('decideOnSignIn', () => {
  const cases = [
    // [lastUid, uid, localHasData, cloudHasData, expected]
    ['A', 'B', true, true, 'reset-local'],
    ['A', 'B', false, false, 'reset-local'],
    ['A', 'A', true, true, 'resume'],
    ['A', 'A', false, true, 'resume'],
    [null, 'A', true, true, 'ask-user'],
    [null, 'A', true, false, 'resume'],
    [null, 'A', false, true, 'resume'],
    [null, 'A', false, false, 'resume']
  ];

  for (const [lastUid, uid, localHasData, cloudHasData, expected] of cases) {
    it(`last=${lastUid} uid=${uid} local=${localHasData} cloud=${cloudHasData} -> ${expected}`, () => {
      assert.equal(decideOnSignIn({ lastUid, uid, localHasData, cloudHasData }), expected);
    });
  }
});

describe('freshLocalCollections', () => {
  const defaults = { defaultWallets: [{ id: 'w' }], defaultCategories: [{ id: 'c' }] };

  it('uses defaults when the cloud is empty', () => {
    const res = freshLocalCollections({ cloudHasData: false, ...defaults });
    assert.deepEqual(res, { transactions: [], wallets: [{ id: 'w' }], categories: [{ id: 'c' }], budgets: [], debts: [] });
  });

  it('starts empty when the cloud has data', () => {
    const res = freshLocalCollections({ cloudHasData: true, ...defaults });
    assert.deepEqual(res.wallets, []);
    assert.deepEqual(res.categories, []);
  });

  it('returns copies, not the default arrays', () => {
    const res = freshLocalCollections({ cloudHasData: false, ...defaults });
    res.wallets[0].id = 'changed';
    assert.equal(defaults.defaultWallets[0].id, 'w');
  });
});
