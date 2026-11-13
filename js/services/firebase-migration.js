/**
 * Firestore schema detection and one-time migration from the legacy layout
 * (users/{uid}/data/{table} holding whole arrays) to per-record documents.
 * Legacy documents are never deleted, so the old data stays available for rollback.
 */
import { firebaseSyncService } from './firebase-sync.js';
import { LEGACY_TABLES, CLOUD_SCHEMA_VERSION, mapLegacyTables, hasLegacyData } from '../domain/legacy-migration.js';
import { SYNC_COLLECTIONS, toCloudRecord, settingsToRecord } from '../domain/sync-diff.js';

const BATCH_LIMIT = 450;

/**
 * Inspect the cloud layout for a user.
 *
 * @param {string} uid
 * @returns {Promise<{ state: 'current'|'legacy'|'empty', legacyDocs?: Object }>}
 */
export async function getCloudSchemaState(uid) {
  const { db, fs } = await firebaseSyncService.initDb();

  const schemaSnap = await fs.getDoc(fs.doc(db, 'users', uid, 'meta', 'schema'));
  if (schemaSnap.exists() && Number(schemaSnap.data().version) >= CLOUD_SCHEMA_VERSION) {
    return { state: 'current' };
  }

  const legacyDocs = {};
  for (const table of LEGACY_TABLES) {
    const snap = await fs.getDoc(fs.doc(db, 'users', uid, 'data', table));
    if (snap.exists()) legacyDocs[table] = snap.data();
  }

  return hasLegacyData(legacyDocs) ? { state: 'legacy', legacyDocs } : { state: 'empty' };
}

/**
 * Copy legacy arrays into per-record documents, then mark the schema as current.
 * Idempotent: documents are written by fixed id, and the schema marker is only
 * written after every batch committed, so an interrupted run is simply repeated.
 *
 * @param {string} uid
 * @param {Object} legacyDocs - from getCloudSchemaState()
 * @returns {Promise<Object>} per-collection stats { kept, skippedNoId, duplicates }
 */
export async function migrateLegacyData(uid, legacyDocs) {
  const { db, fs } = await firebaseSyncService.initDb();
  const { collections, stats } = mapLegacyTables(legacyDocs, toCloudRecord, settingsToRecord);

  const ops = [];
  for (const collection of SYNC_COLLECTIONS) {
    for (const record of collections[collection] || []) {
      ops.push({ collection, id: String(record.id), data: record });
    }
  }

  for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
    const batch = fs.writeBatch(db);
    for (const op of ops.slice(i, i + BATCH_LIMIT)) {
      batch.set(fs.doc(db, 'users', uid, op.collection, op.id), { ...op.data, _updatedAt: fs.serverTimestamp() });
    }
    await batch.commit();
  }

  await fs.setDoc(fs.doc(db, 'users', uid, 'meta', 'schema'), {
    version: CLOUD_SCHEMA_VERSION,
    migratedFrom: 'data-arrays',
    migratedAt: new Date().toISOString(),
    stats
  });

  console.info('Đã nâng cấp dữ liệu Cloud lên định dạng mới:', stats);
  return stats;
}

/**
 * Mark an account that has no legacy data as using the current layout.
 *
 * @param {string} uid
 */
export async function markSchemaCurrent(uid) {
  const { db, fs } = await firebaseSyncService.initDb();
  await fs.setDoc(fs.doc(db, 'users', uid, 'meta', 'schema'), {
    version: CLOUD_SCHEMA_VERSION,
    createdAt: new Date().toISOString()
  });
}
