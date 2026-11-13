/**
 * Push Diffing & Baseline Updates
 * Pure domain logic to snapshot local state, compute differences for cloud push,
 * and apply push results to the sync baseline.
 */
import {
  SYNC_COLLECTIONS,
  SETTINGS_RECORD_ID,
  hashRecord,
  toCloudRecord,
  settingsToRecord
} from './record-hash.js';

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
