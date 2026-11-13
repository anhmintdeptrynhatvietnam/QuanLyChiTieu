/**
 * Last Entry Storage Helper
 * Remembers user's most recent transaction type and wallet choices in localStorage.
 */

const STORAGE_KEY = 'qlct_ui_last_entry';

/**
 * Retrieve the last remembered entry choices.
 * @returns {{ type?: string, walletId?: string, toWalletId?: string } | null}
 */
export function getLastEntry() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return {
        type: typeof parsed.type === 'string' ? parsed.type : undefined,
        walletId: typeof parsed.walletId === 'string' ? parsed.walletId : undefined,
        toWalletId: typeof parsed.toWalletId === 'string' ? parsed.toWalletId : undefined
      };
    }
  } catch (err) {
    console.warn('Could not read last transaction entry from localStorage:', err);
  }
  return null;
}

/**
 * Save entry choices for next time.
 * @param {object} choices
 * @param {string} [choices.type]
 * @param {string} [choices.walletId]
 * @param {string} [choices.toWalletId]
 */
export function saveLastEntry({ type, walletId, toWalletId } = {}) {
  try {
    if (typeof localStorage === 'undefined') return;
    const data = {
      type: type || 'expense',
      walletId: walletId || null,
      toWalletId: toWalletId || null
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Could not save last transaction entry to localStorage:', err);
  }
}
