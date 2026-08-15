/**
 * Firebase Firestore Realtime Sync Service
 */
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  setDoc,
  getDoc,
  onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';
import { firebaseAuthService } from './firebase-auth.js';
import { generateId } from '../utils/helpers.js';

class FirebaseSyncService {
  constructor() {
    this.db = null;
    this.unsubscribers = [];
    this.userId = null;
    this.deviceId = this.getOrCreateDeviceId();
    this.isListening = false;
    this.statusListeners = new Set();
    this.currentStatus = { status: 'disconnected', message: 'Chưa kết nối Firebase', lastSync: null };
    this.pushTimeout = null;
    this.isApplyingRemote = false;
  }

  getOrCreateDeviceId() {
    let id = localStorage.getItem('qlct_device_id');
    if (!id) {
      id = generateId('dev');
      localStorage.setItem('qlct_device_id', id);
    }
    return id;
  }

  initDb() {
    if (this.db) return this.db;
    const app = firebaseAuthService.getAppInstance();
    try {
      this.db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
    } catch (e) {
      // Fallback if already initialized
      this.db = getFirestore(app);
    }
    return this.db;
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
   * Start listening to Firestore changes for the current user
   */
  startSync(userId, onRemoteUpdateCallback) {
    if (!userId) return;
    this.stopSync();

    this.userId = userId;
    this.initDb();
    this.updateStatus('syncing', 'Đang kết nối Realtime...');

    const tables = ['transactions', 'wallets', 'categories', 'budgets', 'debts', 'settings'];

    tables.forEach(table => {
      const docRef = doc(this.db, 'users', userId, 'data', table);
      const unsub = onSnapshot(docRef, { includeMetadataChanges: true }, (snapshot) => {
        // Skip if change originated from this client pending write
        if (snapshot.metadata.hasPendingWrites) {
          return;
        }

        if (snapshot.exists()) {
          const data = snapshot.data();
          // Kiểm tra nếu thay đổi từ chính thiết bị này gửi lên
          if (data && data._lastDeviceId === this.deviceId) {
            return;
          }

          if (data && data.items !== undefined && onRemoteUpdateCallback) {
            this.isApplyingRemote = true;
            try {
              onRemoteUpdateCallback(table, data.items, data.updatedAt);
            } finally {
              this.isApplyingRemote = false;
            }
          }
        }
      }, (err) => {
        console.error(`Lỗi realtime listener [${table}]:`, err);
        this.updateStatus('error', 'Lỗi kết nối Realtime: ' + err.message);
      });

      this.unsubscribers.push(unsub);
    });

    this.isListening = true;
    this.updateStatus('connected', 'Đã kết nối Realtime');
  }

  stopSync() {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
    this.isListening = false;
    this.userId = null;
    this.updateStatus('disconnected', 'Đã ngắt kết nối');
  }

  /**
   * Debounced sync local changes to Firestore
   */
  scheduleSync(table, items) {
    if (!this.isActive() || this.isApplyingRemote) return;

    this.updateStatus('syncing', 'Đang đồng bộ lên Cloud...');

    if (this.pushTimeout) clearTimeout(this.pushTimeout);
    this.pushTimeout = setTimeout(async () => {
      try {
        await this.pushTable(table, items);
        this.updateStatus('connected', 'Đã đồng bộ');
      } catch (err) {
        console.error(`Lỗi khi đẩy dữ liệu [${table}]:`, err);
        this.updateStatus('error', 'Lỗi đồng bộ: ' + err.message);
      }
    }, 400);
  }

  async pushTable(table, items) {
    if (!this.userId) return;
    this.initDb();
    const docRef = doc(this.db, 'users', this.userId, 'data', table);
    await setDoc(docRef, {
      items: items,
      _lastDeviceId: this.deviceId,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Đẩy toàn bộ dữ liệu máy hiện tại lên Cloud (Initial Upload)
   */
  async pushAllData(state) {
    if (!this.userId) throw new Error('Chưa đăng nhập Firebase');
    this.initDb();
    this.updateStatus('syncing', 'Đang tải toàn bộ dữ liệu lên...');

    const tables = {
      transactions: state.transactions || [],
      wallets: state.wallets || [],
      categories: state.categories || [],
      budgets: state.budgets || [],
      debts: state.debts || [],
      settings: {
        currency: state.settings?.currency || 'VND',
        currencySymbol: state.settings?.currencySymbol || '₫',
        theme: state.settings?.theme || 'light'
      }
    };

    for (const [table, items] of Object.entries(tables)) {
      await this.pushTable(table, items);
    }

    this.updateStatus('connected', 'Đã tải toàn bộ dữ liệu lên Cloud');
  }

  /**
   * Kéo toàn bộ dữ liệu từ Cloud về máy
   */
  async pullAllData() {
    if (!this.userId) throw new Error('Chưa đăng nhập Firebase');
    this.initDb();
    this.updateStatus('syncing', 'Đang tải dữ liệu từ Cloud về...');

    const tables = ['transactions', 'wallets', 'categories', 'budgets', 'debts', 'settings'];
    const result = {};

    for (const table of tables) {
      const docRef = doc(this.db, 'users', this.userId, 'data', table);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        result[table] = data.items;
      }
    }

    this.updateStatus('connected', 'Đã tải dữ liệu từ Cloud về máy');
    return result;
  }

  /**
   * Kiểm tra xem Cloud đã có dữ liệu nào chưa
   */
  async checkHasCloudData() {
    return this.checkHasCloudDataForUser(this.userId);
  }

  async checkHasCloudDataForUser(uid) {
    if (!uid) return false;
    this.initDb();
    const docRef = doc(this.db, 'users', uid, 'data', 'transactions');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return Array.isArray(data.items) && data.items.length > 0;
    }
    return false;
  }
}

export const firebaseSyncService = new FirebaseSyncService();
