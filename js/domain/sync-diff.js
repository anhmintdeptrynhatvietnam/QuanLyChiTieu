/**
 * Pure domain logic for sync diffing, hashing, and 3-way merge.
 * Zero external imports; no DOM, localStorage, or Firebase dependencies.
 */

export const SYNC_COLLECTIONS = ['transactions', 'wallets', 'categories', 'budgets', 'debts', 'settings'];
export const SETTINGS_RECORD_ID = 'main';
export const SYNCED_SETTINGS_KEYS = ['currency', 'currencySymbol', 'theme'];

/**
 * Deterministically serialize a value into JSON with sorted object keys.
 * Arrays preserve element order; undefined values inside objects are omitted.
 *
 * @param {*} value
 * @returns {string|undefined}
 */
export function stableStringify(value) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    const items = value.map(item => {
      const s = stableStringify(item);
      return s === undefined ? 'null' : s;
    });
    return `[${items.join(',')}]`;
  }
  const keys = Object.keys(value).sort();
  const entries = [];
  for (const k of keys) {
    const v = value[k];
    if (v !== undefined && typeof v !== 'function' && typeof v !== 'symbol') {
      const s = stableStringify(v);
      if (s !== undefined) {
        entries.push(`${JSON.stringify(k)}:${s}`);
      }
    }
  }
  return `{${entries.join(',')}}`;
}

/**
 * 32-bit FNV-1a hash of stableStringify(record), formatted as an 8-char lowercase hex string.
 *
 * @param {*} record
 * @returns {string}
 */
export function hashRecord(record) {
  const str = stableStringify(record);
  if (str === undefined) return '00000000';
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Prepare a local record for cloud storage by stripping '_' metadata keys
 * and stripping derived currentBalance for wallets.
 *
 * @param {string} collection
 * @param {Object} record
 * @returns {Object}
 */
export function toCloudRecord(collection, record) {
  if (!record || typeof record !== 'object') return {};
  const copy = {};
  for (const [key, val] of Object.entries(record)) {
    if (key.startsWith('_')) continue;
    if (collection === 'wallets' && key === 'currentBalance') continue;
    copy[key] = val;
  }
  return copy;
}

/**
 * Convert cloud document data to local record shape by removing '_' metadata keys.
 *
 * @param {Object} data
 * @returns {Object}
 */
export function fromCloudRecord(data) {
  if (!data || typeof data !== 'object') return {};
  const copy = {};
  for (const [key, val] of Object.entries(data)) {
    if (!key.startsWith('_')) {
      copy[key] = val;
    }
  }
  return copy;
}

/**
 * Extract synchronized settings keys into a cloud record with id 'main'.
 *
 * @param {Object} settings
 * @returns {{ id: string, currency?: string, currencySymbol?: string, theme?: string }}
 */
export function settingsToRecord(settings) {
  const record = { id: SETTINGS_RECORD_ID };
  if (settings && typeof settings === 'object') {
    for (const key of SYNCED_SETTINGS_KEYS) {
      if (settings[key] !== undefined) {
        record[key] = settings[key];
      }
    }
  }
  return record;
}

/**
 * Snapshot local state into { [collection]: { [id]: cloudRecord } } for all SYNC_COLLECTIONS.
 *
 * @param {Object} state
 * @returns {Record<string, Record<string, Object>>}
 */
export function snapshotLocal(state) {
  const snap = {};
  for (const col of SYNC_COLLECTIONS) {
    snap[col] = {};
    if (col === 'settings') {
      snap[col][SETTINGS_RECORD_ID] = settingsToRecord(state?.settings || {});
    } else {
      const list = state && Array.isArray(state[col]) ? state[col] : [];
      for (const item of list) {
        if (!item || (typeof item.id !== 'string' && typeof item.id !== 'number') || item.id === '') {
          continue;
        }
        snap[col][String(item.id)] = toCloudRecord(col, item);
      }
    }
  }
  return snap;
}

/**
 * Compute differences for pushing to Firestore given local snapshot and baseline hashes.
 *
 * @param {Record<string, Record<string, Object>>} localSnap
 * @param {Record<string, Record<string, string>>} baseline
 * @returns {{ upserts: Array<{ collection: string, id: string, data: Object }>, deletes: Array<{ collection: string, id: string }> }}
 */
export function diffForPush(localSnap, baseline) {
  const upserts = [];
  const deletes = [];

  for (const col of SYNC_COLLECTIONS) {
    const localMap = (localSnap && localSnap[col]) || {};
    const baseMap = (baseline && baseline[col]) || {};

    for (const [id, data] of Object.entries(localMap)) {
      const baseHash = baseMap[id];
      if (baseHash === undefined || hashRecord(data) !== baseHash) {
        upserts.push({ collection: col, id, data });
      }
    }

    if (col !== 'settings') {
      for (const id of Object.keys(baseMap)) {
        if (!(id in localMap)) {
          deletes.push({ collection: col, id });
        }
      }
    }
  }

  return { upserts, deletes };
}

/**
 * Return a new baseline with diff upserts set and deletes removed without mutating input.
 *
 * @param {Record<string, Record<string, string>>} baseline
 * @param {{ upserts?: Array<{ collection: string, id: string, data: Object }>, deletes?: Array<{ collection: string, id: string }> }} diff
 * @returns {Record<string, Record<string, string>>}
 */
export function applyPushToBaseline(baseline, diff) {
  const next = {};
  if (baseline && typeof baseline === 'object') {
    for (const [col, map] of Object.entries(baseline)) {
      next[col] = { ...map };
    }
  }

  if (diff) {
    if (Array.isArray(diff.upserts)) {
      for (const { collection, id, data } of diff.upserts) {
        if (!next[collection]) {
          next[collection] = {};
        }
        next[collection][id] = hashRecord(data);
      }
    }

    if (Array.isArray(diff.deletes)) {
      for (const { collection, id } of diff.deletes) {
        if (next[collection]) {
          delete next[collection][id];
        }
      }
    }
  }

  return next;
}

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
