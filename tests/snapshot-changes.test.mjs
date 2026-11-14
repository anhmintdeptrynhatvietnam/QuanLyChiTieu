import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { interpretSnapshot } from '../js/domain/snapshot-changes.js';

const doc = (id, data) => ({ id, data: () => data });
const snap = ({ docs = [], changes = [], fromCache = false }) => ({
  docs,
  docChanges: () => changes,
  metadata: { fromCache }
});
const decode = (d) => ({ ...d, decoded: true });

describe('interpretSnapshot', () => {
  it('skips a cached snapshot while waiting for the first server snapshot', () => {
    const r = interpretSnapshot({ snapshot: snap({ docs: [doc('a', { v: 1 })], fromCache: true }), isInitial: true, decode });
    assert.equal(r.skip, true);
    assert.deepEqual(r.changes, []);
  });

  it('merges the first server snapshot as the full document set, not the diff from cache', () => {
    const snapshot = snap({
      docs: [doc('a', { v: 2 }), doc('b', { v: 1 })],
      changes: [{ type: 'modified', doc: doc('a', { v: 2 }) }] // diff vs. the skipped cached snapshot
    });
    const r = interpretSnapshot({ snapshot, isInitial: true, decode });
    assert.equal(r.skip, false);
    assert.deepEqual(r.changes.map(c => [c.type, c.id, c.data.v, c.data.decoded]), [['added', 'a', 2, true], ['added', 'b', 1, true]]);
    assert.deepEqual([...r.cloudIds], ['a', 'b']);
  });

  it('treats an empty server snapshot as an empty cloud', () => {
    const r = interpretSnapshot({ snapshot: snap({}), isInitial: true, decode });
    assert.equal(r.skip, false);
    assert.equal(r.cloudIds.size, 0);
  });

  it('uses docChanges after the initial merge, including cached/offline updates', () => {
    const snapshot = snap({
      fromCache: true,
      changes: [
        { type: 'modified', doc: doc('a', { v: 3 }) },
        { type: 'removed', doc: doc('b', { v: 1 }) }
      ]
    });
    const r = interpretSnapshot({ snapshot, isInitial: false, decode });
    assert.equal(r.skip, false);
    assert.equal(r.cloudIds, null);
    assert.deepEqual(r.changes.map(c => [c.type, c.id, c.data?.v]), [['modified', 'a', 3], ['removed', 'b', undefined]]);
  });

  it('returns no changes for a metadata-only snapshot', () => {
    const r = interpretSnapshot({ snapshot: snap({ changes: [] }), isInitial: false, decode });
    assert.deepEqual(r.changes, []);
  });
});
