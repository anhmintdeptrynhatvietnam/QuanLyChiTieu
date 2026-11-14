/**
 * Firebase Realtime Sync Listeners
 * Manages startSync/stopSync lifecycle and Firestore onSnapshot collection listeners.
 */
import { DEFAULT_WALLETS, DEFAULT_CATEGORIES } from '../config.js';
import { StorageService } from './storage.js';
import {
  SYNC_COLLECTIONS,
  fromCloudRecord,
  settingsToRecord,
  mergeRemoteChanges
} from '../domain/sync-diff.js';
import { interpretSnapshot } from '../domain/snapshot-changes.js';

export const DEFAULT_ORDER = {
  wallets: DEFAULT_WALLETS.map(w => w.id),
  categories: DEFAULT_CATEGORIES.map(c => c.id)
};

/**
 * Start listening to Firestore changes for the user.
 *
 * @param {import('./firebase-sync.js').FirebaseSyncService} service
 * @param {string} userId
 * @param {{ getState: function(): Object, applyCollection: function(string, Array): void }|function} options
 */
export async function startSync(service, userId, options) {
  if (!userId) return;
  service.stopSync();

  service.userId = userId;
  service.isListening = true;

  if (typeof options === 'function') {
    service.applyCollection = options;
    service.getState = () => ({});
  } else if (options) {
    service.getState = options.getState;
    service.applyCollection = options.applyCollection;
  }

  service.baseline = StorageService.get(`qlct_sync_baseline_${userId}`, {}) || {};
  for (const col of SYNC_COLLECTIONS) {
    if (!service.baseline[col]) service.baseline[col] = {};
  }

  service.updateStatus('syncing', 'Đang kết nối Realtime...');

  try {
    const { db, fs } = await service.initDb();
    if (!service.isActive() || service.userId !== userId) return;

    const pendingCollections = new Set(SYNC_COLLECTIONS);

    SYNC_COLLECTIONS.forEach(col => {
      const colRef = fs.collection(db, 'users', userId, col);
      let isInitial = true;

      // Metadata changes are needed to be told when the server confirms a snapshot that
      // Firestore first served from its on-device cache (see interpretSnapshot).
      const unsub = fs.onSnapshot(colRef, { includeMetadataChanges: true }, (snapshot) => {
        try {
          const { skip, changes, cloudIds } = interpretSnapshot({ snapshot, isInitial, decode: fromCloudRecord });
          if (skip) return;

          const currentState = service.getState ? service.getState() : {};
          let localRecords;
          if (col === 'settings') {
            localRecords = [settingsToRecord(currentState.settings || {})];
          } else {
            localRecords = Array.isArray(currentState[col]) ? currentState[col] : [];
          }

          const baselineMap = service.baseline[col] || {};
          const result = mergeRemoteChanges({
            collection: col,
            localRecords,
            baselineMap,
            changes,
            isInitial,
            cloudIds,
            defaultOrder: DEFAULT_ORDER[col]
          });

          service.baseline[col] = result.baselineMap;
          StorageService.set(`qlct_sync_baseline_${service.userId}`, service.baseline);

          if (result.changed && service.applyCollection) {
            service.isApplyingRemote = true;
            try {
              service.applyCollection(col, result.records);
            } finally {
              service.isApplyingRemote = false;
            }
          }

          if (isInitial) {
            isInitial = false;
            pendingCollections.delete(col);
            if (pendingCollections.size === 0) {
              service.initialSyncDone = true;
              service.updateStatus('connected', 'Đã kết nối Realtime');
              service.scheduleSync();
            }
          }
        } catch (err) {
          console.error(`Lỗi xử lý snapshot [${col}]:`, err);
          service.updateStatus('error', 'Lỗi xử lý dữ liệu Cloud: ' + err.message);
        }
      }, (err) => {
        console.error(`Lỗi realtime listener [${col}]:`, err);
        service.updateStatus('error', 'Lỗi kết nối Realtime: ' + err.message);
      });

      service.unsubscribers.push(unsub);
    });
  } catch (err) {
    console.error('Lỗi khởi tạo startSync:', err);
    service.updateStatus('error', 'Lỗi khởi tạo Realtime: ' + err.message);
  }
}

/**
 * Stop listening to Firestore changes and reset sync state.
 *
 * @param {import('./firebase-sync.js').FirebaseSyncService} service
 */
export function stopSync(service) {
  if (service.pushTimeout) {
    clearTimeout(service.pushTimeout);
    service.pushTimeout = null;
  }
  service.unsubscribers.forEach(unsub => {
    try { unsub(); } catch (e) { console.error(e); }
  });
  service.unsubscribers = [];
  service.isListening = false;
  service.initialSyncDone = false;
  service.userId = null;
  service.updateStatus('disconnected', 'Đã ngắt kết nối');
}
