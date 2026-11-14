/**
 * Order categories / wallets by how often they are used, so the quick-add sheet
 * can show the usual ones first. Pure, zero imports.
 */

const RECENT_DAYS = 90;

function daysBetween(fromDate, toDate) {
  const a = Date.parse(`${fromDate}T00:00:00Z`);
  const b = Date.parse(`${toDate}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return Infinity;
  return Math.round((b - a) / 86400000);
}

/**
 * @param {Array<{ id: string }>} items
 * @param {Array<Object>} transactions
 * @param {string} today - 'YYYY-MM-DD'
 * @param {(tx: Object) => Array<string>} idsOf - ids a transaction counts for
 * @returns {Array} items sorted by recent use (last 90 days), then all-time use, then original order
 */
export function rankByUsage(items = [], transactions = [], today = '', idsOf = () => []) {
  const recent = new Map();
  const total = new Map();
  for (const tx of transactions || []) {
    const isRecent = (() => { const age = daysBetween(tx?.date, today); return age >= 0 && age <= RECENT_DAYS; })();
    for (const id of new Set(idsOf(tx).filter(Boolean))) {
      total.set(id, (total.get(id) || 0) + 1);
      if (isRecent) recent.set(id, (recent.get(id) || 0) + 1);
    }
  }
  return (items || [])
    .map((item, index) => ({ item, index }))
    .sort((a, b) =>
      (recent.get(b.item.id) || 0) - (recent.get(a.item.id) || 0) ||
      (total.get(b.item.id) || 0) - (total.get(a.item.id) || 0) ||
      a.index - b.index)
    .map(({ item }) => item);
}

/** Categories ranked by the transactions filed under them. */
export function rankCategoriesByUsage(categories = [], transactions = [], today = '') {
  return rankByUsage(categories, transactions, today, (tx) => [tx?.categoryId]);
}

/** Wallets ranked by transactions touching them (both sides of a transfer count). */
export function rankWalletsByUsage(wallets = [], transactions = [], today = '') {
  return rankByUsage(wallets, transactions, today, (tx) => [tx?.walletId, tx?.toWalletId]);
}
