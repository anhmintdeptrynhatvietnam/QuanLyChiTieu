/**
 * Pure Domain Logic for Transaction Form Validation & Defaults
 * Zero dependencies / no external imports.
 */

export const ALLOWED_TYPES = ['expense', 'income', 'transfer', 'debt'];

/**
 * Validate a transaction entry before saving.
 *
 * @param {object} entry
 * @param {string} entry.type - 'expense' | 'income' | 'transfer'
 * @param {number|string} entry.amount
 * @param {string} [entry.categoryId]
 * @param {string} [entry.walletId]
 * @param {string} [entry.toWalletId]
 * @returns {{ ok: boolean, errors: Record<string, string> }}
 */
export function validateEntry({ type = 'expense', amount = 0, categoryId = '', walletId = '', toWalletId = '' } = {}) {
  const errors = {};
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    errors.amount = 'Vui lòng nhập số tiền lớn hơn 0';
  }

  if (!walletId || String(walletId).trim() === '') {
    errors.walletId = 'Vui lòng chọn ví';
  }

  if (type === 'expense' || type === 'income') {
    if (!categoryId || String(categoryId).trim() === '') {
      errors.categoryId = 'Vui lòng chọn hạng mục';
    }
  } else if (type === 'transfer') {
    if (!toWalletId || String(toWalletId).trim() === '') {
      errors.toWalletId = 'Vui lòng chọn ví nhận';
    } else if (String(toWalletId) === String(walletId)) {
      errors.toWalletId = 'Ví nhận tiền phải khác ví chuyển';
    }
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Resolve default form values from last-used entry and current state wallets.
 *
 * @param {object} options
 * @param {object|null} [options.lastEntry] - { type, walletId, toWalletId }
 * @param {Array<object>} [options.wallets] - list of available wallet objects
 * @param {object} [options.params] - explicit overrides { type, walletId }
 * @returns {{ type: string, walletId: string|null, toWalletId: string|null }}
 */
export function resolveEntryDefaults({ lastEntry = null, wallets = [], params = {} } = {}) {
  const validWalletIds = new Set(
    Array.isArray(wallets) ? wallets.map((w) => String(w?.id)) : []
  );

  // 1. Resolve transaction type
  let type = 'expense';
  if (params?.type && ALLOWED_TYPES.includes(params.type)) {
    type = params.type;
  } else if (lastEntry?.type && ALLOWED_TYPES.includes(lastEntry.type)) {
    type = lastEntry.type;
  }

  // 2. Resolve source walletId
  let walletId = null;
  if (params?.walletId && validWalletIds.has(String(params.walletId))) {
    walletId = String(params.walletId);
  } else if (lastEntry?.walletId && validWalletIds.has(String(lastEntry.walletId))) {
    walletId = String(lastEntry.walletId);
  } else if (wallets && wallets.length > 0 && wallets[0]?.id) {
    walletId = String(wallets[0].id);
  }

  // 3. Resolve destination toWalletId (for transfers)
  let toWalletId = null;
  if (lastEntry?.toWalletId && validWalletIds.has(String(lastEntry.toWalletId)) && String(lastEntry.toWalletId) !== walletId) {
    toWalletId = String(lastEntry.toWalletId);
  } else if (wallets && wallets.length > 1) {
    const alternate = wallets.find((w) => String(w?.id) !== walletId);
    if (alternate) {
      toWalletId = String(alternate.id);
    }
  }

  return { type, walletId, toWalletId };
}
