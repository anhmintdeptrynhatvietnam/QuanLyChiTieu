/**
 * Order categories by how often they are used, so the quick-add sheet can show
 * the usual ones first. Pure, zero imports.
 */

const RECENT_DAYS = 90;

function daysBetween(fromDate, toDate) {
  const a = Date.parse(`${fromDate}T00:00:00Z`);
  const b = Date.parse(`${toDate}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return Infinity;
  return Math.round((b - a) / 86400000);
}

/**
 * @param {Array<{ id: string }>} categories - already filtered by type
 * @param {Array<{ categoryId?: string, date?: string }>} transactions
 * @param {string} today - 'YYYY-MM-DD'
 * @returns {Array} categories sorted by recent use (last 90 days), then all-time use, then original order
 */
export function rankCategoriesByUsage(categories = [], transactions = [], today = '') {
  const recent = new Map();
  const total = new Map();
  for (const tx of transactions || []) {
    const id = tx?.categoryId;
    if (!id) continue;
    total.set(id, (total.get(id) || 0) + 1);
    const age = daysBetween(tx.date, today);
    if (age >= 0 && age <= RECENT_DAYS) recent.set(id, (recent.get(id) || 0) + 1);
  }
  return (categories || [])
    .map((cat, index) => ({ cat, index }))
    .sort((a, b) =>
      (recent.get(b.cat.id) || 0) - (recent.get(a.cat.id) || 0) ||
      (total.get(b.cat.id) || 0) - (total.get(a.cat.id) || 0) ||
      a.index - b.index)
    .map(({ cat }) => cat);
}
