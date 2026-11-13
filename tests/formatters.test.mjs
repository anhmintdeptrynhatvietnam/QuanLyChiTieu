import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatCurrency,
  formatNumber,
  parseFormattedNumber,
  formatDate,
  getMonthYear,
  formatMonthYearDisplay,
  formatAmountInput,
  parseAmountInput
} from '../js/utils/formatters.js';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('formats currency for VND', () => {
      const formatted = formatCurrency(1234567);
      assert.ok(formatted.startsWith('1.234.567'));
      assert.ok(formatted.endsWith('₫'));

      const expected = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
      }).format(1234567);
      assert.equal(formatted, expected);
    });
  });

  describe('formatNumber', () => {
    it('formats numbers using vi-VN grouping', () => {
      assert.equal(formatNumber(1234567), '1.234.567');
      assert.equal(formatNumber(0), '0');
      assert.equal(formatNumber(-5000), '-5.000');
    });
  });

  describe('parseFormattedNumber', () => {
    it('parses formatted numeric strings', () => {
      assert.equal(parseFormattedNumber('1.234.567'), 1234567);
      assert.equal(parseFormattedNumber('-5.000'), -5000);
      assert.equal(parseFormattedNumber(''), 0);
    });

    it('handles number passthrough', () => {
      assert.equal(parseFormattedNumber(1234), 1234);
      assert.equal(parseFormattedNumber(-5000), -5000);
      assert.equal(parseFormattedNumber(0), 0);
    });

    it('returns 0 for NaN', () => {
      assert.equal(parseFormattedNumber(NaN), 0);
      assert.equal(parseFormattedNumber('abc'), 0);
    });
  });

  describe('formatDate', () => {
    it('formats local datetime string to DD/MM/YYYY', () => {
      assert.equal(formatDate('2026-03-05T10:00:00'), '05/03/2026');
    });

    it('returns original input when date string is invalid', () => {
      assert.equal(formatDate('abc'), 'abc');
    });
  });

  describe('getMonthYear', () => {
    it('extracts YYYY-MM from datetime string', () => {
      assert.equal(getMonthYear('2026-03-05T10:00:00'), '2026-03');
    });
  });

  describe('formatMonthYearDisplay', () => {
    it('formats YYYY-MM into readable month/year', () => {
      assert.equal(formatMonthYearDisplay('2026-03'), 'Tháng 3/2026');
    });
  });

  describe('formatAmountInput', () => {
    it('formats numbers and numeric strings with dot grouping', () => {
      assert.equal(formatAmountInput(1000), '1.000');
      assert.equal(formatAmountInput('1000000'), '1.000.000');
      assert.equal(formatAmountInput(1234567), '1.234.567');
      assert.equal(formatAmountInput('123'), '123');
    });

    it('handles zero values correctly', () => {
      assert.equal(formatAmountInput(0), '0');
      assert.equal(formatAmountInput('0'), '0');
      assert.equal(formatAmountInput('000'), '0');
    });

    it('strips non-digits and leading zeros', () => {
      assert.equal(formatAmountInput('05000'), '5.000');
      assert.equal(formatAmountInput('1.500.000'), '1.500.000');
      assert.equal(formatAmountInput('abc1234def'), '1.234');
    });

    it('returns empty string for empty or non-numeric inputs', () => {
      assert.equal(formatAmountInput(''), '');
      assert.equal(formatAmountInput(null), '');
      assert.equal(formatAmountInput(undefined), '');
      assert.equal(formatAmountInput('abc'), '');
    });
  });

  describe('parseAmountInput', () => {
    it('parses formatted numeric strings to integer', () => {
      assert.equal(parseAmountInput('1.234.567'), 1234567);
      assert.equal(parseAmountInput('100.000'), 100000);
      assert.equal(parseAmountInput('500'), 500);
    });

    it('handles numeric input passthrough', () => {
      assert.equal(parseAmountInput(1234567), 1234567);
      assert.equal(parseAmountInput(100.75), 100);
      assert.equal(parseAmountInput(0), 0);
    });

    it('returns 0 for empty or invalid inputs', () => {
      assert.equal(parseAmountInput(''), 0);
      assert.equal(parseAmountInput(null), 0);
      assert.equal(parseAmountInput(undefined), 0);
      assert.equal(parseAmountInput('abc'), 0);
      assert.equal(parseAmountInput(NaN), 0);
    });
  });
});
