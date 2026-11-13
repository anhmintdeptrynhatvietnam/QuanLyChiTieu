/**
 * Firebase Firestore Record-Level Realtime Sync Service
 */
import { loadFirebaseSdk } from './firebase-sdk.js';
import { firebaseAuthService } from './firebase-auth.js';
import { StorageService } from './storage.js';
import { DEFAULT_WALLETS, DEFAULT_CATEGORIES } from '../config.js';
import {
  SYNC_COLLECTIONS,
  SETTINGS_RECORD_ID,
  SYNCED_SETTINGS_KEYS,
  snapshotLocal,
  diffForPush,
  applyPushToBaseline,
  mergeRemoteChanges,
  sortCollectionRecords,
  fromCloudRecord,
  settingsToRecord,
  hashRecord
} from '../domain/sync-diff.js';

// Firestore returns documents sorted by id; built-in wallets/categories keep their config order.
const DEFAULT_ORDER = {
  wallets: DEFAULT_WALLETS.map(w => w.id),
  categories: DEFAULT_CATEGORIES.map(c => c.id)
};

class FirebaseSyncService {
  constructor() {
    this.db = null;
    this.firestoreModule = null;
    this.unsubscribers = [];
    this.userId = null;
    this.isListening = false;
    this.statusListeners = new Set();
    this.currentStatus = { status: 'disconnected', message: 'Chưa kết nối Firebase', lastSync: null };
    this.pushTimeout = null;
    this.isFlushing = false;
    this.isApplyingRemote = false;
    // Pushes are held until every collection delivered its initial snapshot,
    // otherwise an empty baseline would make local defaults overwrite cloud records.
    this.initialSyncDone = false;
    this.baseline = {};
    this.getState = null;
    this.applyCollection = null;
  }

  async initDb() {
    if (this.db && this.firestoreModule) {
      return { db: this.db, fs: this.firestoreModule };
    }
    await firebaseAuthService.ensureReady();
    const { firestore } = await loadFirebaseSdk();
    this.firestoreModule = firestore;
    const app = firebaseAuthService.getAppInstance();
    try {
      this.db = firestore.initializeFirestore(app, {
        localCache: firestore.persistentLocalCache({
          tabManager: firestore.persistentMultipleTabManager()
        })
      });
    } catch (e) {
      this.db = firestore.getFirestore(app);
    }
    return { db: this.db, fs: this.firestoreModule };
  }

  getStatus() {
    return this.currentStatus;
  }

  onStatusChange(listener) {
    this.statusListeners.add(listener);
    listener(this.currentStatus);
    return () => this.statusListeners.delete(listener);
  }

  updateStatus(status, message) {
    this.currentStatus = {
      status, // 'connected' | 'syncing' | 'offline' | 'error' | 'disconnected'
      message,
      lastSync: status === 'connected' ? new Date().toISOString() : this.currentStatus.lastSync
    };
    this.statusListeners.forEach(fn => {
      try { fn(this.currentStatus); } catch (e) { console.error(e); }
    });
  }

  isActive() {
    return !!this.userId && this.isListening;
  }

  /**
   * Start listening to Firestore changes for the user.
   *
   * @param {string} userId
   * @param {{ getState: function(): Object, applyCollection: function(string, Array): void }|function} options
   */
  async startSync(userId, options) {
    if (!userId) return;
    this.stopSync();

    this.userId = userId;
    this.isListening = true;

    if (typeof options === 'function') {
      this.applyCollection = options;
      this.getState = () => ({});
    } else if (options) {
      this.getState = options.getState;
      this.applyCollection = options.applyCollection;
    }

    this.baseline = StorageService.get(`qlct_sync_baseline_${userId}`, {}) || {};
    for (const col of SYNC_COLLECTIONS) {
      if (!this.baseline[col]) this.baseline[col] = {};
    }

    this.updateStatus('syncing', 'Đang kết nối Realtime...');

    try {
      const { db, fs } = await this.initDb();
      if (!this.isActive() || this.userId !== userId) return;

      const pendingCollections = new Set(SYNC_COLLECTIONS);

      SYNC_COLLECTIONS.forEach(col => {
        const colRef = fs.collection(db, 'users', userId, col);
        let isInitial = true;

        const unsub = fs.onSnapshot(colRef, { includeMetadataChanges: false }, (snapshot) => {
          try {
            const cloudIds = isInitial ? new Set(snapshot.docs.map(d => d.id)) : null;
            const changes = snapshot.docChanges().map(change => ({
              type: change.type, // 'added' | 'modified' | 'removed'
              id: change.doc.id,
              data: change.type === 'removed' ? undefined : fromCloudRecord(change.doc.data())
            }));

            const currentState = this.getState ? this.getState() : {};
            let localRecords;
            if (col === 'settings') {
              localRecords = [settingsToRecord(currentState.settings || {})];
            } else {
              localRecords = Array.isArray(currentState[col]) ? currentState[col] : [];
            }

            const baselineMap = this.baseline[col] || {};
            const result = mergeRemoteChanges({
              collection: col,
              localRecords,
              baselineMap,
              changes,
              isInitial,
              cloudIds,
              defaultOrder: DEFAULT_ORDER[col]
            });

            this.baseline[col] = result.baselineMap;
            StorageService.set(`qlct_sync_baseline_${this.userId}`, this.baseline);

            if (result.changed && this.applyCollection) {
              this.isApplyingRemote = true;
              try {
                this.applyCollection(col, result.records);
              } finally {
                this.isApplyingRemote = false;
              }
            }

            if (isInitial) {
              isInitial = false;
              pendingCollections.delete(col);
              if (pendingCollections.size === 0) {
                this.initialSyncDone = true;
                this.updateStatus('connected', 'Đã kết nối Realtime');
                this.scheduleSync();
              }
            }
          } catch (err) {
            console.error(`Lỗi xử lý snapshot [${col}]:`, err);
            this.updateStatus('error', 'Lỗi xử lý dữ liệu Cloud: ' + err.message);
          }
        }, (err) => {
          console.error(`Lỗi realtime listener [${col}]:`, err);
          this.updateStatus('error', 'Lỗi kết nối Realtime: ' + err.message);
        });

        this.unsubscribers.push(unsub);
      });
    } catch (err) {
      console.error('Lỗi khởi tạo startSync:', err);
      this.updateStatus('error', 'Lỗi khởi tạo Realtime: ' + err.message);
    }
  }

  /**
   * Forget what was last synced for a user. Must be called whenever local data is
   * replaced wholesale (account switch, "use cloud data"); otherwise the stale
   * baseline makes the emptied local state look like deletions and wipes the cloud.
   *
   * @param {string} uid
   */
  clearBaseline(uid) {
    if (!uid) return;
    StorageService.remove(`qlct_sync_baseline_${uid}`);
    if (uid === this.userId) {
      this.baseline = {};
      for (const col of SYNC_COLLECTIONS) this.baseline[col] = {};
    }
  }

  stopSync() {
    if (this.pushTimeout) {
      clearTimeout(this.pushTimeout);
      this.pushTimeout = null;
    }
    this.unsubscribers.forEach(unsub => {
      try { unsub(); } catch (e) { console.error(e); }
    });
    this.unsubscribers = [];
    this.isListening = false;
    this.initialSyncDone = false;
    this.userId = null;
    this.updateStatus('disconnected', 'Đã ngắt kết nối');
  }

  /**
   * Debounced sync local changes to Firestore across all collections.
   */
  scheduleSync() {
    // Before the initial snapshots arrive the baseline is incomplete; startSync
    // calls scheduleSync() itself once they have all been merged.
    if (!this.isActive() || this.isApplyingRemote || !this.initialSyncDone) return;

    this.updateStatus('syncing', 'Đang đồng bộ lên Cloud...');

    if (this.pushTimeout) {
      clearTimeout(this.pushTimeout);
    }

    this.pushTimeout = setTimeout(async () => {
      this.pushTimeout = null;
      if (this.isFlushing) {
        this.scheduleSync();
        return;
      }
      this.isFlushing = true;
      try {
        await this.flushSync();
      } finally {
        this.isFlushing = false;
      }
    }, 400);
  }

  async flushSync() {
    if (!this.isActive()) return;

    const currentState = this.getState ? this.getState() : {};
    const localSnap = snapshotLocal(currentState);
    const diff = diffForPush(localSnap, this.baseline);

    if (diff.upserts.length === 0 && diff.deletes.length === 0) {
      this.updateStatus('connected', 'Đã đồng bộ');
      return;
    }

    try {
      const { db, fs } = await this.initDb();
      if (!this.isActive()) return;

      const allOps = [];
      for (const up of diff.upserts) {
        allOps.push({ type: 'upsert', ...up });
      }
      for (const del of diff.deletes) {
        allOps.push({ type: 'delete', ...del });
      }

      const previousBaseline = this.baseline;
      this.baseline = applyPushToBaseline(this.baseline, diff);
      StorageService.set(`qlct_sync_baseline_${this.userId}`, this.baseline);

      for (let i = 0; i < allOps.length; i += 450) {
        const chunk = allOps.slice(i, i + 450);
        try {
          const batch = fs.writeBatch(db);
          for (const op of chunk) {
            const docRef = fs.doc(db, 'users', this.userId, op.collection, String(op.id));
            if (op.type === 'upsert') {
              batch.set(docRef, { ...op.data, _updatedAt: fs.serverTimestamp() });
            } else {
              batch.delete(docRef);
            }
          }
          await batch.commit();
        } catch (err) {
          console.error('Lỗi khi ghi batch Firestore:', err);
          this.updateStatus('error', 'Lỗi đồng bộ: ' + err.message);
          // Roll back this chunk and every later (unwritten) chunk to the
          // pre-push baseline so the next flush retries both upserts and deletes.
          for (const op of allOps.slice(i)) {
            const col = this.baseline[op.collection] || (this.baseline[op.collection] = {});
            const prevHash = previousBaseline[op.collection]?.[op.id];
            if (prevHash === undefined) {
              delete col[op.id];
            } else {
              col[op.id] = prevHash;
            }
          }
          StorageService.set(`qlct_sync_baseline_${this.userId}`, this.baseline);
          return;
        }
      }

      this.updateStatus('connected', 'Đã đồng bộ');
    } catch (err) {
      console.error('Lỗi flushSync:', err);
      this.updateStatus('error', 'Lỗi đồng bộ: ' + err.message);
    }
  }

  /**
   * Overwrite Cloud with all local data.
   *
   * Can run before startSync() (e.g. when the user chooses to overwrite the cloud on first sign-in);
   * the baseline is persisted for that uid so the next startSync() sees everything as synced.
   *
   * @param {Object} state
   * @param {string} [uid] - defaults to the currently synced user
   */
  async pushAllData(state, uid = this.userId) {
    if (!uid) throw new Error('Chưa đăng nhập Firebase');
    const { db, fs } = await this.initDb();
    this.updateStatus('syncing', 'Đang tải toàn bộ dữ liệu lên...');

    try {
      const localSnap = snapshotLocal(state);
      const allOps = [];

      for (const col of SYNC_COLLECTIONS) {
        const colRef = fs.collection(db, 'users', uid, col);
        const snap = await fs.getDocs(colRef);
        const cloudIds = new Set(snap.docs.map(d => d.id));
        const localMap = localSnap[col] || {};

        for (const [id, data] of Object.entries(localMap)) {
          allOps.push({
            type: 'set',
            collection: col,
            id,
            data
          });
          cloudIds.delete(id);
        }

        if (col !== 'settings') {
          for (const cloudId of cloudIds) {
            allOps.push({
              type: 'delete',
              collection: col,
              id: cloudId
            });
          }
        }
      }

      for (let i = 0; i < allOps.length; i += 450) {
        const chunk = allOps.slice(i, i + 450);
        const batch = fs.writeBatch(db);
        for (const op of chunk) {
          const docRef = fs.doc(db, 'users', uid, op.collection, String(op.id));
          if (op.type === 'set') {
            batch.set(docRef, { ...op.data, _updatedAt: fs.serverTimestamp() });
          } else {
            batch.delete(docRef);
          }
        }
        await batch.commit();
      }

      const newBaseline = {};
      for (const col of SYNC_COLLECTIONS) {
        newBaseline[col] = {};
        for (const [id, data] of Object.entries(localSnap[col] || {})) {
          newBaseline[col][id] = hashRecord(data);
        }
      }
      StorageService.set(`qlct_sync_baseline_${uid}`, newBaseline);
      if (uid === this.userId) this.baseline = newBaseline;

      this.updateStatus('connected', 'Đã tải toàn bộ dữ liệu lên Cloud');
    } catch (err) {
      console.error('Lỗi đẩy toàn bộ dữ liệu:', err);
      this.updateStatus('error', 'Lỗi tải lên Cloud: ' + err.message);
      throw err;
    }
  }

  /**
   * Pull all collections from Cloud.
   *
   * @returns {Promise<Object>}
   */
  async pullAllData() {
    if (!this.userId) throw new Error('Chưa đăng nhập Firebase');
    const { db, fs } = await this.initDb();
    this.updateStatus('syncing', 'Đang tải dữ liệu từ Cloud về...');

    try {
      const result = {
        transactions: [],
        wallets: [],
        categories: [],
        budgets: [],
        debts: [],
        settings: {}
      };

      for (const col of ['transactions', 'wallets', 'categories', 'budgets', 'debts']) {
        const colRef = fs.collection(db, 'users', this.userId, col);
        const snap = await fs.getDocs(colRef);
        result[col] = sortCollectionRecords(col, snap.docs.map(d => fromCloudRecord(d.data())), DEFAULT_ORDER[col]);
      }

      const settingsDocRef = fs.doc(db, 'users', this.userId, 'settings', SETTINGS_RECORD_ID);
      const settingsSnap = await fs.getDoc(settingsDocRef);
      if (settingsSnap.exists()) {
        const data = fromCloudRecord(settingsSnap.data());
        const settingsObj = {};
        for (const key of SYNCED_SETTINGS_KEYS) {
          if (data[key] !== undefined) {
            settingsObj[key] = data[key];
          }
        }
        result.settings = settingsObj;
      }

      this.updateStatus('connected', 'Đã tải dữ liệu từ Cloud về máy');
      return result;
    } catch (err) {
      console.error('Lỗi kéo toàn bộ dữ liệu:', err);
      this.updateStatus('error', 'Lỗi tải từ Cloud: ' + err.message);
      throw err;
    }
  }

  async checkHasCloudData() {
    return this.checkHasCloudDataForUser(this.userId);
  }

  async checkHasCloudDataForUser(uid) {
    if (!uid) return false;
    try {
      const { db, fs } = await this.initDb();
      const colRef = fs.collection(db, 'users', uid, 'transactions');
      const q = fs.query(colRef, fs.limit(1));
      const snap = await fs.getDocs(q);
      return !snap.empty;
    } catch (err) {
      console.error('Lỗi kiểm tra dữ liệu Cloud:', err);
      return false;
    }
  }
}

export const firebaseSyncService = new FirebaseSyncService();
