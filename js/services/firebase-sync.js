/**
 * Firebase Firestore Record-Level Realtime Sync Service
 * Orchestrates status, listeners, and batch sync operations.
 */
import { loadFirebaseSdk } from './firebase-sdk.js';
import { firebaseAuthService } from './firebase-auth.js';
import { StorageService } from './storage.js';
import { SYNC_COLLECTIONS } from '../domain/sync-diff.js';
import { startSync, stopSync } from './firebase-sync-listeners.js';
import { flushSync, pushAllData } from './firebase-sync-ops.js';
import { pullAllData, checkHasCloudDataForUser } from './firebase-sync-pull.js';

export class FirebaseSyncService {
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

  async startSync(userId, options) {
    return startSync(this, userId, options);
  }

  clearBaseline(uid) {
    if (!uid) return;
    StorageService.remove(`qlct_sync_baseline_${uid}`);
    if (uid === this.userId) {
      this.baseline = {};
      for (const col of SYNC_COLLECTIONS) this.baseline[col] = {};
    }
  }

  stopSync() {
    return stopSync(this);
  }

  scheduleSync() {
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
    return flushSync(this);
  }

  async pushAllData(state, uid = this.userId) {
    return pushAllData(this, state, uid);
  }

  async pullAllData() {
    return pullAllData(this);
  }

  async checkHasCloudData() {
    return this.checkHasCloudDataForUser(this.userId);
  }

  async checkHasCloudDataForUser(uid) {
    return checkHasCloudDataForUser(this, uid);
  }
}

export const firebaseSyncService = new FirebaseSyncService();
