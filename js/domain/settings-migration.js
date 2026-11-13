/**
 * Settings migration utilities.
 * Sanitizes legacy settings keys from older versions.
 */

export const LEGACY_SETTINGS_KEYS = [
  'googleClientId',
  'spreadsheetId',
  'spreadsheetName',
  'autoSync',
  'lastSyncTime'
];

/**
 * Returns a new object without legacy settings keys.
 * Returns {} for null/undefined/non-object input.
 * Never mutates input.
 *
 * @param {Object} settings
 * @returns {Object}
 */
export function sanitizeLegacySettings(settings) {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    return {};
  }

  const sanitized = { ...settings };
  for (const key of LEGACY_SETTINGS_KEYS) {
    delete sanitized[key];
  }
  return sanitized;
}
