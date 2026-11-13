/**
 * Pure decision rules for what to do with local data when a Firebase user signs in.
 * Zero imports.
 */

/**
 * Local data counts as "user data" only when it holds records the user created;
 * default wallets/categories alone do not.
 *
 * @param {Object} state
 * @returns {boolean}
 */
export function hasUserLocalData(state) {
  if (!state) return false;
  return ['transactions', 'debts', 'budgets'].some(key => Array.isArray(state[key]) && state[key].length > 0);
}

/**
 * Decide how to prepare local state before realtime sync starts.
 *
 *  - 'reset-local': another account was used on this browser; drop its local data.
 *  - 'ask-user'   : first sign-in here, and both this device and the cloud hold data.
 *  - 'resume'     : same account as last time, or nothing conflicting; the 3-way merge handles it
 *                   (an empty cloud simply receives the local data).
 *
 * @param {{ lastUid: string|null, uid: string, localHasData: boolean, cloudHasData: boolean }} input
 * @returns {'reset-local'|'ask-user'|'resume'}
 */
export function decideOnSignIn({ lastUid, uid, localHasData, cloudHasData }) {
  if (lastUid && lastUid !== uid) return 'reset-local';
  if (!lastUid && localHasData && cloudHasData) return 'ask-user';
  return 'resume';
}

/**
 * Local collections to install when local data is discarded.
 * If the cloud already has data, start empty so nothing local (not even
 * default wallets/categories) is pushed into that account; otherwise use defaults.
 *
 * @param {{ cloudHasData: boolean, defaultWallets: Array, defaultCategories: Array }} input
 * @returns {{ transactions: Array, wallets: Array, categories: Array, budgets: Array, debts: Array }}
 */
export function freshLocalCollections({ cloudHasData, defaultWallets, defaultCategories }) {
  const clone = value => JSON.parse(JSON.stringify(value || []));
  return {
    transactions: [],
    wallets: cloudHasData ? [] : clone(defaultWallets),
    categories: cloudHasData ? [] : clone(defaultCategories),
    budgets: [],
    debts: []
  };
}
