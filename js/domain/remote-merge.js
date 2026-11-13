/**
 * Remote Changes 3-Way Merge & Sorting
 * Pure domain logic to merge remote Firestore changes against local records and baseline,
 * and sort collections into display order.
 */
import { hashRecord, toCloudRecord } from './record-hash.js';

function compareDesc(a, b) {
  if (a == null && b == null) return 0;
  if (a == null || a === '') return 1;
  if (b == null || b === '') return -1;
  const sa = String(a);
  const sb = String(b);
  if (sa === sb) return 0;
  return sa < sb ? 1 : -1;
}

/**
 * Comparator reproducing the local insertion order of wallets/categories, which
 * Firestore does not keep (documents come back sorted by id): built-in records
 * (no createdAt) first in `defaultOrder`, then user-created ones by createdAt ascending.
 *
 * @param {string[]} defaultOrder
 * @returns {(a: Object, b: Object) => number}
 */
export function compareCreationOrder(defaultOrder = []) {
  const rank = new Map(defaultOrder.map((id, i) => [String(id), i]));
  const rankOf = (r) => (rank.has(String(r?.id)) ? rank.get(String(r?.id)) : Infinity);
  const byId = (a, b) => (String(a?.id) < String(b?.id) ? -1 : String(a?.id) > String(b?.id) ? 1 : 0);

  return (a, b) => {
    const ca = a?.createdAt ? String(a.createdAt) : '';
    const cb = b?.createdAt ? String(b.createdAt) : '';
    if (!ca !== !cb) return ca ? 1 : -1;
    if (!ca) {
      const diff = rankOf(a) - rankOf(b);
      if (diff !== 0 && !Number.isNaN(diff)) return diff;
      return byId(a, b);
    }
    if (ca !== cb) return ca < cb ? -1 : 1;
    return byId(a, b);
  };
}

/**
 * Sort records of a collection (in place) into the order the app displays/stores them.
 * Needed whenever records come from Firestore, which returns documents sorted by id.
 *
 * @param {string} collection
 * @param {Array} records
 * @param {string[]} [defaultOrder=[]] - ids of built-in wallets/categories in display order
 * @returns {Array} the same array
 */
export function sortCollectionRecords(collection, records, defaultOrder = []) {
  if (collection === 'transactions') {
    records.sort((t1, t2) => {
      const dComp = compareDesc(t1?.date, t2?.date);
      if (dComp !== 0) return dComp;
      return compareDesc(t1?.createdAt, t2?.createdAt);
    });
  } else if (collection === 'debts') {
    records.sort((d1, d2) => compareDesc(d1?.createdAt, d2?.createdAt));
  } else if (collection === 'wallets' || collection === 'categories') {
    records.sort(compareCreationOrder(defaultOrder));
  }
  return records;
}

/**
 * 3-way merge remote collection changes against local records and baseline map.
 *
 * @param {Object} options
 * @param {string} options.collection
 * @param {Array} options.localRecords
 * @param {Record<string, string>} [options.baselineMap={}]
 * @param {Array<{ type: 'added'|'modified'|'removed', id: string, data?: Object }>} [options.changes=[]]
 * @param {boolean} [options.isInitial=false]
 * @param {Set<string>|null} [options.cloudIds=null]
 * @param {string[]} [options.defaultOrder=[]] - ids of built-in wallets/categories in display order
 * @returns {{ records: Array, baselineMap: Record<string, string>, changed: boolean }}
 */
export function mergeRemoteChanges({
  collection,
  localRecords = [],
  baselineMap = {},
  changes = [],
  isInitial = false,
  cloudIds = null,
  defaultOrder = []
}) {
  let records = Array.isArray(localRecords) ? localRecords.map(r => ({ ...r })) : [];
  const newBaseline = { ...(baselineMap || {}) };

  for (const change of (changes || [])) {
    const { type, id, data } = change;
    const strId = String(id);
    const idx = records.findIndex(r => r && String(r.id) === strId);
    const local = idx !== -1 ? records[idx] : null;
    const localHash = local ? hashRecord(toCloudRecord(collection, local)) : null;
    const base = newBaseline[strId];

    if (type === 'added' || type === 'modified') {
      const remoteData = data || {};
      const remoteHash = hashRecord(remoteData);

      if (local && base !== undefined && localHash !== base && remoteHash === base) {
        // Unsynced local edit wins over unchanged remote
      } else if (!local && base !== undefined && remoteHash === base) {
        // A local delete is pending; do not re-add
      } else {
        const mergedRecord = { ...remoteData, id: remoteData.id || strId };
        if (local) {
          records[idx] = mergedRecord;
        } else {
          records.push(mergedRecord);
        }
        newBaseline[strId] = remoteHash;
      }
    } else if (type === 'removed') {
      if (local && base !== undefined && localHash !== base) {
        // Local edit wins; it will be re-uploaded
        delete newBaseline[strId];
      } else {
        if (local) {
          records.splice(idx, 1);
        }
        delete newBaseline[strId];
      }
    }
  }

  if (isInitial && cloudIds && typeof cloudIds.has === 'function') {
    const retained = [];
    for (const record of records) {
      const strId = String(record.id);
      if (!cloudIds.has(strId)) {
        const localHash = hashRecord(toCloudRecord(collection, record));
        const base = newBaseline[strId];
        if (base !== undefined && localHash === base) {
          // Deleted remotely while offline
          delete newBaseline[strId];
          continue;
        }
      }
      retained.push(record);
    }
    records = retained;
  }

  sortCollectionRecords(collection, records, defaultOrder);

  const inputMap = new Map();
  for (const r of (localRecords || [])) {
    if (r && r.id != null) {
      inputMap.set(String(r.id), hashRecord(toCloudRecord(collection, r)));
    }
  }

  const resultMap = new Map();
  for (const r of records) {
    if (r && r.id != null) {
      resultMap.set(String(r.id), hashRecord(toCloudRecord(collection, r)));
    }
  }

  let changed = false;
  if (inputMap.size !== resultMap.size) {
    changed = true;
  } else {
    for (const [id, hash] of inputMap.entries()) {
      if (resultMap.get(id) !== hash) {
        changed = true;
        break;
      }
    }
  }

  return { records, baselineMap: newBaseline, changed };
}
