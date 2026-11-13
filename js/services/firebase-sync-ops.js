/**
 * Firebase Firestore Batch Operations
 * Handles batch flushing (flushSync) and full upload (pushAllData).
 */
import { StorageService } from './storage.js';
import {
  SYNC_COLLECTIONS,
  snapshotLocal,
  diffForPush,
  applyPushToBaseline,
  hashRecord
} from '../domain/sync-diff.js';

/**
 * Flush debounced local changes to Firestore.
 *
 * @param {import('./firebase-sync.js').FirebaseSyncService} service
 */
export async function flushSync(service) {
  if (!service.isActive()) return;

  const currentState = service.getState ? service.getState() : {};
  const localSnap = snapshotLocal(currentState);
  const diff = diffForPush(localSnap, service.baseline);

  if (diff.upserts.length === 0 && diff.deletes.length === 0) {
    service.updateStatus('connected', 'Đã đồng bộ');
    return;
  }

  try {
    const { db, fs } = await service.initDb();
    if (!service.isActive()) return;

    const allOps = [];
    for (const up of diff.upserts) {
      allOps.push({ type: 'upsert', ...up });
    }
    for (const del of diff.deletes) {
      allOps.push({ type: 'delete', ...del });
    }

    const previousBaseline = service.baseline;
    service.baseline = applyPushToBaseline(service.baseline, diff);
    StorageService.set(`qlct_sync_baseline_${service.userId}`, service.baseline);

    for (let i = 0; i < allOps.length; i += 450) {
      const chunk = allOps.slice(i, i + 450);
      try {
        const batch = fs.writeBatch(db);
        for (const op of chunk) {
          const docRef = fs.doc(db, 'users', service.userId, op.collection, String(op.id));
          if (op.type === 'upsert') {
            batch.set(docRef, { ...op.data, _updatedAt: fs.serverTimestamp() });
          } else {
            batch.delete(docRef);
          }
        }
        await batch.commit();
      } catch (err) {
        console.error('Lỗi khi ghi batch Firestore:', err);
        service.updateStatus('error', 'Lỗi đồng bộ: ' + err.message);
        // Roll back this chunk and every later chunk to pre-push baseline
        for (const op of allOps.slice(i)) {
          const col = service.baseline[op.collection] || (service.baseline[op.collection] = {});
          const prevHash = previousBaseline[op.collection]?.[op.id];
          if (prevHash === undefined) {
            delete col[op.id];
          } else {
            col[op.id] = prevHash;
          }
        }
        StorageService.set(`qlct_sync_baseline_${service.userId}`, service.baseline);
        return;
      }
    }

    service.updateStatus('connected', 'Đã đồng bộ');
  } catch (err) {
    console.error('Lỗi flushSync:', err);
    service.updateStatus('error', 'Lỗi đồng bộ: ' + err.message);
  }
}

/**
 * Overwrite Cloud with all local data.
 *
 * @param {import('./firebase-sync.js').FirebaseSyncService} service
 * @param {Object} state
 * @param {string} uid
 */
export async function pushAllData(service, state, uid = service.userId) {
  if (!uid) throw new Error('Chưa đăng nhập Firebase');
  const { db, fs } = await service.initDb();
  service.updateStatus('syncing', 'Đang tải toàn bộ dữ liệu lên...');

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
    if (uid === service.userId) service.baseline = newBaseline;

    service.updateStatus('connected', 'Đã tải toàn bộ dữ liệu lên Cloud');
  } catch (err) {
    console.error('Lỗi đẩy toàn bộ dữ liệu:', err);
    service.updateStatus('error', 'Lỗi tải lên Cloud: ' + err.message);
    throw err;
  }
}
