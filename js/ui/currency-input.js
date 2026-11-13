/**
 * Currency Input Helper
 * Attaches formatting behavior while typing (###.###.###) and caret preservation.
 */
import { formatAmountInput, parseAmountInput } from '../utils/formatters.js';

/**
 * Get integer currency value from an input element
 * @param {HTMLInputElement} inputEl
 * @returns {number} integer amount, 0 if empty/invalid
 */
export function getCurrencyValue(inputEl) {
  if (!inputEl) return 0;
  return parseAmountInput(inputEl.value);
}

/**
 * Attach formatting behavior to a text/numeric input
 * @param {HTMLInputElement} inputEl
 * @param {object} [options]
 * @param {Function} [options.onChange] - callback with integer value
 * @returns {() => void} cleanup function
 */
export function attachCurrencyInput(inputEl, { onChange } = {}) {
  if (!inputEl) return () => {};

  inputEl.setAttribute('inputmode', 'numeric');

  const onInput = () => {
    const rawVal = inputEl.value;
    const selectionStart = inputEl.selectionStart ?? rawVal.length;
    const digitsBefore = rawVal.slice(0, selectionStart).replace(/\D/g, '').length;

    const formatted = formatAmountInput(rawVal);
    inputEl.value = formatted;

    let newPos = 0;
    let digitCount = 0;
    while (newPos < formatted.length && digitCount < digitsBefore) {
      if (/\d/.test(formatted[newPos])) {
        digitCount++;
      }
      newPos++;
    }

    if (inputEl.setSelectionRange) {
      inputEl.setSelectionRange(newPos, newPos);
    }

    if (typeof onChange === 'function') {
      onChange(getCurrencyValue(inputEl));
    }
  };

  inputEl.addEventListener('input', onInput);

  return () => {
    inputEl.removeEventListener('input', onInput);
  };
}
