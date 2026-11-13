/**
 * Pure helpers to convert the legacy Firestore layout
 * (users/{uid}/data/{table} = { items: [...] | {...}, updatedAt, _lastDeviceId })
 * into per-record documents (users/{uid}/{collection}/{id}).
 * Zero imports: callers pass the cloud-record transformer in.
 */

export const LEGACY_TABLES = ['transactions', 'wallets', 'categories', 'budgets', 'debts', 'settings'];
export const CLOUD_SCHEMA_VERSION = 2;

/**
 * Keep one record per id. On duplicates the record with the later
 * `updatedAt` (ISO string compare) wins; ties or missing values keep the later occurrence.
 * Records without a usable id are dropped.
 *
 * @param {Array} records
 * @returns {{ records: Array, skippedNoId: number, duplicates: number }}
 */
export function dedupeById(records) {
  const byId = new Map();
  let skippedNoId = 0;
  let duplicates = 0;

  for (const record of Array.isArray(records) ? records : []) {
    const id = record && record.id;
    if (id === undefined || id === null || id === '') {
      skippedNoId++;
      continue;
    }
    const key = String(id);
    const existing = byId.get(key);
    if (existing) {
      duplicates++;
      const prev = String(existing.updatedAt || '');
      const next = String(record.updatedAt || '');
      if (next < prev) continue;
    }
    byId.set(key, record);
  }

  return { records: [...byId.values()], skippedNoId, duplicates };
}

/**
 * Convert legacy table documents into per-collection record arrays.
 *
 * @param {Record<string, { items?: any }|undefined>} legacyDocs - keyed by table name
 * @param {(collection: string, record: Object) => Object} toCloudRecord - strips derived/meta fields
 * @param {(settings: Object) => Object} settingsToRecord - builds the settings record
 * @returns {{ collections: Record<string, Array>, stats: Record<string, { kept: number, skippedNoId: number, duplicates: number }> }}
 */
export function mapLegacyTables(legacyDocs, toCloudRecord, settingsToRecord) {
  const collections = {};
  const stats = {};

  for (const table of LEGACY_TABLES) {
    const items = legacyDocs && legacyDocs[table] ? legacyDocs[table].items : undefined;

    if (table === 'settings') {
      const hasSettings = items && typeof items === 'object' && !Array.isArray(items);
      collections.settings = hasSettings ? [settingsToRecord(items)] : [];
      stats.settings = { kept: collections.settings.length, skippedNoId: 0, duplicates: 0 };
      continue;
    }

    const { records, skippedNoId, duplicates } = dedupeById(items);
    collections[table] = records.map(r => ({ ...toCloudRecord(table, r), id: String(r.id) }));
    stats[table] = { kept: collections[table].length, skippedNoId, duplicates };
  }

  return { collections, stats };
}

/**
 * True when any legacy table document exists with data worth migrating.
 *
 * @param {Record<string, { items?: any }|undefined>} legacyDocs
 * @returns {boolean}
 */
export function hasLegacyData(legacyDocs) {
  if (!legacyDocs) return false;
  return LEGACY_TABLES.some(table => {
    const items = legacyDocs[table] && legacyDocs[table].items;
    if (Array.isArray(items)) return items.length > 0;
    return !!items && typeof items === 'object';
  });
}
