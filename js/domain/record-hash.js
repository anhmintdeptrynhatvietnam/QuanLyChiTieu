/**
 * Record Hashing & Cloud Record Serialization
 * Pure domain logic for stable JSON stringification, FNV-1a hashing,
 * and conversions between local and cloud record shapes.
 */

export const SYNC_COLLECTIONS = ['transactions', 'wallets', 'categories', 'budgets', 'debts', 'settings'];
export const SETTINGS_RECORD_ID = 'main';
export const SYNCED_SETTINGS_KEYS = ['currency', 'currencySymbol', 'theme'];

/**
 * Deterministically serialize a value into JSON with sorted object keys.
 * Arrays preserve element order; undefined values inside objects are omitted.
 *
 * @param {*} value
 * @returns {string|undefined}
 */
export function stableStringify(value) {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    const items = value.map(item => {
      const s = stableStringify(item);
      return s === undefined ? 'null' : s;
    });
    return `[${items.join(',')}]`;
  }
  const keys = Object.keys(value).sort();
  const entries = [];
  for (const k of keys) {
    const v = value[k];
    if (v !== undefined && typeof v !== 'function' && typeof v !== 'symbol') {
      const s = stableStringify(v);
      if (s !== undefined) {
        entries.push(`${JSON.stringify(k)}:${s}`);
      }
    }
  }
  return `{${entries.join(',')}}`;
}

/**
 * 32-bit FNV-1a hash of stableStringify(record), formatted as an 8-char lowercase hex string.
 *
 * @param {*} record
 * @returns {string}
 */
export function hashRecord(record) {
  const str = stableStringify(record);
  if (str === undefined) return '00000000';
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Prepare a local record for cloud storage by stripping '_' metadata keys
 * and stripping derived currentBalance for wallets.
 *
 * @param {string} collection
 * @param {Object} record
 * @returns {Object}
 */
export function toCloudRecord(collection, record) {
  if (!record || typeof record !== 'object') return {};
  const copy = {};
  for (const [key, val] of Object.entries(record)) {
    if (key.startsWith('_')) continue;
    if (collection === 'wallets' && key === 'currentBalance') continue;
    copy[key] = val;
  }
  return copy;
}

/**
 * Convert cloud document data to local record shape by removing '_' metadata keys.
 *
 * @param {Object} data
 * @returns {Object}
 */
export function fromCloudRecord(data) {
  if (!data || typeof data !== 'object') return {};
  const copy = {};
  for (const [key, val] of Object.entries(data)) {
    if (!key.startsWith('_')) {
      copy[key] = val;
    }
  }
  return copy;
}

/**
 * Extract synchronized settings keys into a cloud record with id 'main'.
 *
 * @param {Object} settings
 * @returns {{ id: string, currency?: string, currencySymbol?: string, theme?: string }}
 */
export function settingsToRecord(settings) {
  const record = { id: SETTINGS_RECORD_ID };
  if (settings && typeof settings === 'object') {
    for (const key of SYNCED_SETTINGS_KEYS) {
      if (settings[key] !== undefined) {
        record[key] = settings[key];
      }
    }
  }
  return record;
}
