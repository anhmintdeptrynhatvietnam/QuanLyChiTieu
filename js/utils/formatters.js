/**
 * Data Formatters (Currency, Date, Numbers)
 */

export function formatCurrency(amount, currency = 'VND') {
  const numericAmount = Number(amount) || 0;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0
  }).format(numericAmount);
}

export function formatNumber(amount) {
  const numericAmount = Number(amount) || 0;
  return new Intl.NumberFormat('vi-VN').format(numericAmount);
}

export function parseFormattedNumber(str) {
  if (typeof str === 'number') return isNaN(str) ? 0 : str;
  if (!str) return 0;
  const isNegative = String(str).trim().startsWith('-');
  const cleanStr = String(str).replace(/\D/g, '');
  if (!cleanStr) return 0;
  const val = parseInt(cleanStr, 10);
  return isNegative ? -val : val;
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export function formatRelativeDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return 'Hôm nay';
  if (isYesterday) return 'Hôm qua';

  return formatDate(dateString);
}

export function getMonthYear(dateString = new Date()) {
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${year}-${month}`;
}

export function formatMonthYearDisplay(monthYearString) {
  if (!monthYearString) return '';
  const [year, month] = monthYearString.split('-');
  return `Tháng ${parseInt(month, 10)}/${year}`;
}
