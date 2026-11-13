/**
 * Firebase Firestore read operations: full download (pullAllData) and cloud data probing.
 */
import { DEFAULT_ORDER } from './firebase-sync-listeners.js';
import {
  SETTINGS_RECORD_ID,
  SYNCED_SETTINGS_KEYS,
  sortCollectionRecords,
  fromCloudRecord
} from '../domain/sync-diff.js';

/**
 * Pull all collections from Cloud.
 *
 * @param {import('./firebase-sync.js').FirebaseSyncService} service
 * @returns {Promise<Object>}
 */
export async function pullAllData(service) {
  if (!service.userId) throw new Error('Chưa đăng nhập Firebase');
  const { db, fs } = await service.initDb();
  service.updateStatus('syncing', 'Đang tải dữ liệu từ Cloud về...');

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
      const colRef = fs.collection(db, 'users', service.userId, col);
      const snap = await fs.getDocs(colRef);
      result[col] = sortCollectionRecords(col, snap.docs.map(d => fromCloudRecord(d.data())), DEFAULT_ORDER[col]);
    }

    const settingsDocRef = fs.doc(db, 'users', service.userId, 'settings', SETTINGS_RECORD_ID);
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

    service.updateStatus('connected', 'Đã tải dữ liệu từ Cloud về máy');
    return result;
  } catch (err) {
    console.error('Lỗi kéo toàn bộ dữ liệu:', err);
    service.updateStatus('error', 'Lỗi tải từ Cloud: ' + err.message);
    throw err;
  }
}

/**
 * Check if the given user has any transactions on Firestore.
 *
 * @param {import('./firebase-sync.js').FirebaseSyncService} service
 * @param {string} uid
 * @returns {Promise<boolean>}
 */
export async function checkHasCloudDataForUser(service, uid) {
  if (!uid) return false;
  try {
    const { db, fs } = await service.initDb();
    const colRef = fs.collection(db, 'users', uid, 'transactions');
    const q = fs.query(colRef, fs.limit(1));
    const snap = await fs.getDocs(q);
    return !snap.empty;
  } catch (err) {
    console.error('Lỗi kiểm tra dữ liệu Cloud:', err);
    return false;
  }
}
