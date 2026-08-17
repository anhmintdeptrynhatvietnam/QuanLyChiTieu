/**
 * Privacy & Amount Masking Utility
 * Manages individual section visibility state (hidden by default, revealed via eye button)
 */

const STORAGE_PREFIX = 'privacy_show_';

/**
 * Check if the amount for a given section/key is currently visible
 * Default is false (hidden by default)
 * @param {string} key - Unique key for the section/item
 * @param {boolean} defaultVisible - Fallback visibility (default false)
 * @returns {boolean}
 */
export function isAmountVisible(key, defaultVisible = false) {
  try {
    const val = localStorage.getItem(STORAGE_PREFIX + key);
    if (val === null) return defaultVisible;
    return val === 'true';
  } catch {
    return defaultVisible;
  }
}

/**
 * Set the visibility state for a specific section/key
 * @param {string} key
 * @param {boolean} visible
 */
export function setAmountVisible(key, visible) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, String(visible));
  } catch (err) {
    console.error('Error saving privacy state:', err);
  }
}

/**
 * Toggle visibility for a section/key and return the new state
 * @param {string} key
 * @param {boolean} defaultVisible
 * @returns {boolean}
 */
export function toggleAmountVisibility(key, defaultVisible = false) {
  const current = isAmountVisible(key, defaultVisible);
  const next = !current;
  setAmountVisible(key, next);
  return next;
}

/**
 * Render the Eye Toggle Button HTML
 * @param {string} key - Unique key for the section
 * @param {boolean} defaultVisible - Default visibility
 * @returns {string} HTML string
 */
export function renderEyeButton(key, defaultVisible = false) {
  const isShown = isAmountVisible(key, defaultVisible);
  const title = isShown ? 'Ẩn số tiền' : 'Hiện số tiền';
  const icon = isShown ? 'eye' : 'eye-off';

  return `
    <button type="button" class="btn-eye-toggle" data-privacy-key="${key}" title="${title}" aria-label="${title}">
      <i data-lucide="${icon}" style="width: 16px; height: 16px;"></i>
    </button>
  `;
}

/**
 * Attach click listeners to all .btn-eye-toggle elements inside a container
 * @param {HTMLElement} container
 * @param {Function} onToggle - Callback called with (key, isVisible) after toggle
 */
export function attachPrivacyListeners(container, onToggle) {
  if (!container) return;
  const buttons = container.querySelectorAll('.btn-eye-toggle[data-privacy-key]');
  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const key = btn.getAttribute('data-privacy-key');
      if (key) {
        const next = toggleAmountVisibility(key);
        if (typeof onToggle === 'function') {
          onToggle(key, next);
        }
      }
    });
  });
}
