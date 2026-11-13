/**
 * Theme Manager Module
 * Supports 'light', 'dark', and 'system' preferences.
 * Pure resolver function resolveTheme() is exported for unit testing.
 */

export const THEME_PREFERENCES = ['light', 'dark', 'system'];

/**
 * Pure function: resolves theme preference into either 'light' or 'dark'
 * @param {string} pref - 'light' | 'dark' | 'system'
 * @param {boolean} prefersDark - boolean from system media query
 * @returns {'light' | 'dark'}
 */
export function resolveTheme(pref, prefersDark = false) {
  if (pref === 'dark') return 'dark';
  if (pref === 'light') return 'light';
  return prefersDark ? 'dark' : 'light';
}

/**
 * Read the user's theme preference from localStorage.
 * Unknown or missing values default to 'system'.
 * @returns {'light' | 'dark' | 'system'}
 */
export function getThemePreference() {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    }
  } catch (err) {
    console.warn('Error reading theme from localStorage:', err);
  }
  return 'system';
}

function getSystemPrefersDark() {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
}

/**
 * Apply the resolved theme to document.documentElement and notify listeners.
 * @param {string} [pref] - optional explicit preference to apply
 * @returns {'light' | 'dark'} the applied theme
 */
export function applyTheme(pref) {
  const currentPref = pref || getThemePreference();
  const theme = resolveTheme(currentPref, getSystemPrefersDark());

  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.dataset.theme = theme;
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('themechange', {
      detail: {
        theme,
        preference: currentPref
      }
    }));
  }

  return theme;
}

/**
 * Save preference to localStorage and apply theme.
 * @param {'light' | 'dark' | 'system'} pref
 * @returns {'light' | 'dark'} the applied theme
 */
export function setThemePreference(pref) {
  const validPref = THEME_PREFERENCES.includes(pref) ? pref : 'system';
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', validPref);
    }
  } catch (err) {
    console.warn('Error writing theme to localStorage:', err);
  }
  return applyTheme(validPref);
}

let mediaQueryListener = null;

/**
 * Initialize theme and listen for system color scheme changes.
 */
export function initTheme() {
  applyTheme();

  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    if (mediaQueryListener && mql.removeEventListener) {
      mql.removeEventListener('change', mediaQueryListener);
    }
    mediaQueryListener = () => {
      if (getThemePreference() === 'system') {
        applyTheme('system');
      }
    };
    if (mql.addEventListener) {
      mql.addEventListener('change', mediaQueryListener);
    } else if (mql.addListener) {
      mql.addListener(mediaQueryListener);
    }
  }
}
