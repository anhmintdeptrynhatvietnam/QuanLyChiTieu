import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { rankCategoriesByUsage, rankWalletsByUsage } from '../js/domain/usage-ranking.js';

const cats = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
const ids = (list) => list.map(c => c.id);

describe('rankCategoriesByUsage', () => {
  it('keeps the original order when nothing is used', () => {
    assert.deepEqual(ids(rankCategoriesByUsage(cats, [], '2026-11-14')), ['a', 'b', 'c', 'd']);
  });

  it('puts the most used categories of the last 90 days first', () => {
    const tx = [
      { categoryId: 'c', date: '2026-11-10' }, { categoryId: 'c', date: '2026-11-11' },
      { categoryId: 'b', date: '2026-11-12' }
    ];
    assert.deepEqual(ids(rankCategoriesByUsage(cats, tx, '2026-11-14')), ['c', 'b', 'a', 'd']);
  });

  it('ranks recent use above old heavy use, and uses all-time count as the tie-break', () => {
    const tx = [
      { categoryId: 'a', date: '2025-01-01' }, { categoryId: 'a', date: '2025-01-02' }, { categoryId: 'a', date: '2025-01-03' },
      { categoryId: 'd', date: '2026-11-01' },
      { categoryId: 'b', date: '2025-02-01' }
    ];
    assert.deepEqual(ids(rankCategoriesByUsage(cats, tx, '2026-11-14')), ['d', 'a', 'b', 'c']);
  });

  it('ignores transactions without a category, future dates and unknown ids', () => {
    const tx = [{ categoryId: '', date: '2026-11-14' }, { categoryId: 'zz', date: '2026-11-14' }, { categoryId: 'b', date: '2026-12-30' }];
    assert.deepEqual(ids(rankCategoriesByUsage(cats, tx, '2026-11-14')), ['b', 'a', 'c', 'd']);
  });

  it('does not mutate the input', () => {
    const input = [...cats];
    rankCategoriesByUsage(input, [{ categoryId: 'd', date: '2026-11-14' }], '2026-11-14');
    assert.deepEqual(ids(input), ['a', 'b', 'c', 'd']);
  });
});

describe('rankWalletsByUsage', () => {
  const wallets = [{ id: 'cash' }, { id: 'bank' }, { id: 'card' }, { id: 'save' }, { id: 'salary' }];

  it('puts the most used wallets first, counting both sides of a transfer', () => {
    const tx = [
      { walletId: 'salary', date: '2026-11-10' },
      { walletId: 'salary', date: '2026-11-11' },
      { walletId: 'bank', toWalletId: 'card', date: '2026-11-12' },
      { walletId: 'card', date: '2026-11-13' }
    ];
    assert.deepEqual(rankWalletsByUsage(wallets, tx, '2026-11-14').map(w => w.id), ['card', 'salary', 'bank', 'cash', 'save']);
  });

  it('counts a transfer to the same wallet once', () => {
    const tx = [{ walletId: 'save', toWalletId: 'save', date: '2026-11-14' }, { walletId: 'bank', date: '2026-11-14' }, { walletId: 'bank', date: '2026-11-13' }];
    assert.deepEqual(rankWalletsByUsage(wallets, tx, '2026-11-14').map(w => w.id), ['bank', 'save', 'cash', 'card', 'salary']);
  });
});
