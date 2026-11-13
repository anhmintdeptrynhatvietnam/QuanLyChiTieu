/**
 * Domain Utilities: Export & Import Data Sanitization and CSV Escaping.
 * Pure module with ZERO imports.
 */

export const SENSITIVE_SETTINGS_KEYS = ['firebaseUser', 'syncStatus', 'lastSyncTime'];

const DANGEROUS_CSV_PREFIXES = ['=', '+', '-', '@', '\t', '\r'];

/**
 * Returns a deep-ish copy of the state with sensitive settings stripped,
 * and settings.firebaseConfig removed when it is deep-equal to defaultFirebaseConfig or missing.
 * Keeps wallets and transactions intact, and never mutates the input.
 *
 * @param {Object} state
 * @param {Object} [defaultFirebaseConfig]
 * @returns {Object}
 */
export function sanitizeForExport(state, defaultFirebaseConfig) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    return {};
  }

  const exported = { ...state };

  if (Array.isArray(state.transactions)) {
    exported.transactions = state.transactions.map(t => ({ ...t }));
  }
  if (Array.isArray(state.wallets)) {
    exported.wallets = state.wallets.map(w => ({ ...w }));
  }
  if (Array.isArray(state.categories)) {
    exported.categories = state.categories.map(c => ({ ...c }));
  }
  if (Array.isArray(state.budgets)) {
    exported.budgets = state.budgets.map(b => ({ ...b }));
  }
  if (Array.isArray(state.debts)) {
    exported.debts = state.debts.map(d => ({
      ...d,
      repayments: Array.isArray(d.repayments) ? d.repayments.map(r => ({ ...r })) : d.repayments
    }));
  }

  const rawSettings = state.settings && typeof state.settings === 'object' && !Array.isArray(state.settings)
    ? { ...state.settings }
    : {};

  for (const key of SENSITIVE_SETTINGS_KEYS) {
    delete rawSettings[key];
  }

  if (rawSettings.firebaseConfig) {
    if (defaultFirebaseConfig && JSON.stringify(rawSettings.firebaseConfig) === JSON.stringify(defaultFirebaseConfig)) {
      delete rawSettings.firebaseConfig;
    } else {
      rawSettings.firebaseConfig = typeof rawSettings.firebaseConfig === 'object' && rawSettings.firebaseConfig !== null
        ? JSON.parse(JSON.stringify(rawSettings.firebaseConfig))
        : rawSettings.firebaseConfig;
    }
  } else {
    delete rawSettings.firebaseConfig;
  }

  exported.settings = rawSettings;

  return exported;
}

/**
 * Returns a copy of settings without sensitive keys.
 * Returns {} for null/undefined/non-object input.
 *
 * @param {Object} settings
 * @returns {Object}
 */
export function sanitizeImportedSettings(settings) {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    return {};
  }

  const copy = { ...settings };
  for (const key of SENSITIVE_SETTINGS_KEYS) {
    delete copy[key];
  }
  return copy;
}

/**
 * Formats a value for a single CSV cell preventing CSV formula injection.
 * null/undefined -> ''
 * numbers -> String(value) unquoted
 * strings -> prefix ' if starts with =, +, -, @, \t, \r; then wrapped in double quotes with internal " doubled.
 *
 * @param {*} value
 * @returns {string}
 */
export function toCsvCell(value) {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'number') {
    return String(value);
  }
  let str = String(value);
  if (str.length > 0 && DANGEROUS_CSV_PREFIXES.includes(str[0])) {
    str = "'" + str;
  }
  return `"${str.replace(/"/g, '""')}"`;
}
