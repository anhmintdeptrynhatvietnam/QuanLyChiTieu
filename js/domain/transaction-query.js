/**
 * Transaction Query Domain Functions
 * Pure calculations for filtering, searching, and normalizing transaction data.
 * Zero imports / no external dependencies.
 */

export function normalizeVietnamese(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function formatYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseRefDate(today) {
  if (!today) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (today instanceof Date) {
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }
  if (typeof today === 'string' && today.includes('-')) {
    const parts = today.split('-').map(Number);
    if (parts.length >= 3 && !parts.some(isNaN)) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
  }
  const parsed = new Date(today);
  if (!isNaN(parsed.getTime())) {
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function getDateRange(range = 'this-month', today = null) {
  const ref = parseRefDate(today);

  switch (range) {
    case 'today': {
      const formatted = formatYMD(ref);
      return { start: formatted, end: formatted };
    }
    case 'this-week': {
      const day = ref.getDay();
      const diff = ref.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(ref.getFullYear(), ref.getMonth(), diff);
      const end = new Date(ref.getFullYear(), ref.getMonth(), diff + 6);
      return { start: formatYMD(start), end: formatYMD(end) };
    }
    case 'this-month': {
      const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
      const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
      return { start: formatYMD(start), end: formatYMD(end) };
    }
    case 'last-month': {
      const start = new Date(ref.getFullYear(), ref.getMonth() - 1, 1);
      const end = new Date(ref.getFullYear(), ref.getMonth(), 0);
      return { start: formatYMD(start), end: formatYMD(end) };
    }
    case 'this-year': {
      const start = new Date(ref.getFullYear(), 0, 1);
      const end = new Date(ref.getFullYear(), 11, 31);
      return { start: formatYMD(start), end: formatYMD(end) };
    }
    case 'all':
    default:
      return null;
  }
}

function matchSearch(t, normQuery, rawQuery, catMap, walletMap) {
  if (!normQuery) return true;
  const noteNorm = normalizeVietnamese(t.note || '');
  const catName = t.categoryId ? (catMap.get(String(t.categoryId)) || '') : '';
  const fromName = t.walletId ? (walletMap.get(String(t.walletId)) || '') : '';
  const toName = t.toWalletId ? (walletMap.get(String(t.toWalletId)) || '') : '';
  return (
    noteNorm.includes(normQuery) ||
    normalizeVietnamese(catName).includes(normQuery) ||
    normalizeVietnamese(fromName).includes(normQuery) ||
    normalizeVietnamese(toName).includes(normQuery) ||
    String(t.amount ?? '').includes(rawQuery)
  );
}

export function filterTransactions(
  transactions = [],
  {
    range = 'this-month',
    type = 'all',
    categoryId = 'all',
    walletId = 'all',
    search = '',
    today = null,
    categories = [],
    wallets = []
  } = {}
) {
  if (!Array.isArray(transactions) || transactions.length === 0) return [];
  const dateRange = getDateRange(range, today);

  const catMap = new Map();
  if (Array.isArray(categories)) {
    for (const c of categories) if (c?.id != null) catMap.set(String(c.id), c.name || '');
  }
  const walletMap = new Map();
  if (Array.isArray(wallets)) {
    for (const w of wallets) if (w?.id != null) walletMap.set(String(w.id), w.name || '');
  }

  const queryTrimmed = typeof search === 'string' ? search.trim() : '';
  const normQuery = normalizeVietnamese(queryTrimmed);

  return transactions.filter((t) => {
    if (!t) return false;
    if (dateRange && typeof t.date === 'string') {
      if (t.date < dateRange.start || t.date > dateRange.end) return false;
    }
    if (type && type !== 'all' && t.type !== type) return false;
    if (categoryId && categoryId !== 'all' && String(t.categoryId) !== String(categoryId)) {
      return false;
    }
    if (walletId && walletId !== 'all') {
      const matchW = String(t.walletId) === String(walletId);
      const matchToW = t.toWalletId != null && String(t.toWalletId) === String(walletId);
      if (!matchW && !matchToW) return false;
    }
    return matchSearch(t, normQuery, queryTrimmed, catMap, walletMap);
  });
}

export function calculateTransactionTotals(transactions = []) {
  let income = 0;
  let expense = 0;
  if (Array.isArray(transactions)) {
    for (let i = 0; i < transactions.length; i++) {
      const t = transactions[i];
      if (!t) continue;
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') income += amt;
      else if (t.type === 'expense') expense += amt;
    }
  }
  return {
    income,
    expense,
    count: Array.isArray(transactions) ? transactions.length : 0
  };
}
