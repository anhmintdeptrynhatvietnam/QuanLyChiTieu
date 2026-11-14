/**
 * Turn a Firestore query snapshot into the change list used by mergeRemoteChanges.
 * Zero imports: the snapshot is duck-typed ({ docs, docChanges(), metadata.fromCache })
 * and the record decoder is injected, so this is unit-testable without Firebase.
 *
 * The first merge of a session must reflect the server, not Firestore's on-device
 * cache (which can be days old): cached snapshots are skipped until the first
 * server snapshot, and that one is merged as the FULL document set because its
 * docChanges() would only describe the difference from the skipped cached snapshot.
 */

/**
 * @param {Object} params
 * @param {{ docs: Array, docChanges: Function, metadata?: { fromCache?: boolean } }} params.snapshot
 * @param {boolean} params.isInitial - no server snapshot merged yet for this collection
 * @param {(data: Object) => Object} params.decode - Firestore data → app record
 * @returns {{ skip: boolean, changes: Array<{ type: string, id: string, data?: Object }>, cloudIds: Set<string>|null }}
 */
export function interpretSnapshot({ snapshot, isInitial, decode }) {
  const fromCache = Boolean(snapshot?.metadata?.fromCache);

  if (isInitial) {
    if (fromCache) return { skip: true, changes: [], cloudIds: null };
    const docs = snapshot.docs || [];
    return {
      skip: false,
      changes: docs.map(doc => ({ type: 'added', id: doc.id, data: decode(doc.data()) })),
      cloudIds: new Set(docs.map(doc => doc.id))
    };
  }

  const changes = (snapshot.docChanges() || []).map(change => ({
    type: change.type, // 'added' | 'modified' | 'removed'
    id: change.doc.id,
    data: change.type === 'removed' ? undefined : decode(change.doc.data())
  }));
  return { skip: false, changes, cloudIds: null };
}
