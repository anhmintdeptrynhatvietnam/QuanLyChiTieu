/**
 * Pure domain logic for sync diffing, hashing, and 3-way merge.
 * Re-exports from record-hash.js, push-diff.js, and remote-merge.js.
 * Zero external imports; no DOM, localStorage, or Firebase dependencies.
 */

export {
  SYNC_COLLECTIONS,
  SETTINGS_RECORD_ID,
  SYNCED_SETTINGS_KEYS,
  stableStringify,
  hashRecord,
  toCloudRecord,
  fromCloudRecord,
  settingsToRecord
} from './record-hash.js';

export {
  snapshotLocal,
  diffForPush,
  applyPushToBaseline
} from './push-diff.js';

export {
  compareCreationOrder,
  sortCollectionRecords,
  mergeRemoteChanges
} from './remote-merge.js';
