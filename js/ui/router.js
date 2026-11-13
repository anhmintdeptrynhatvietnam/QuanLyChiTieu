/**
 * SPA Hash Router
 * Manages view switching via location.hash (#/dashboard, #/wallets, ...)
 * Supports browser/Android back button and updates UI state.
 */

export const VIEW_TITLES = {
  dashboard: 'Tổng quan',
  transactions: 'Giao dịch',
  analytics: 'Báo cáo & Phân tích',
  more: 'Thêm',
  wallets: 'Sổ ví & Tài khoản',
  debts: 'Sổ Vay & Nợ',
  budgets: 'Hạn mức ngân sách',
  settings: 'Cài đặt & Đồng bộ'
};

export const MORE_SUB_VIEWS = new Set(['wallets', 'debts', 'budgets', 'settings']);

let activeView = 'dashboard';
let changeListener = null;

/**
 * Get current active view ID
 * @returns {string}
 */
export function currentView() {
  return activeView;
}

/**
 * Extract normalized viewId from hash string
 * @param {string} hash
 * @returns {string}
 */
export function parseHash(hash) {
  const raw = (hash || '').replace(/^#\/?/, '').trim();
  return VIEW_TITLES[raw] ? raw : 'dashboard';
}

/**
 * Apply the view change to the DOM
 * @param {string} viewId
 * @param {boolean} [notify=true]
 */
function applyView(viewId, notify = true) {
  const targetId = VIEW_TITLES[viewId] ? viewId : 'dashboard';
  activeView = targetId;

  // Toggle .active on view sections
  if (typeof document !== 'undefined') {
    document.querySelectorAll('.view-section').forEach((section) => {
      section.classList.toggle('active', section.id === `view-${targetId}`);
    });

    // Toggle .active on all [data-view] nav elements
    const isSubOfMore = MORE_SUB_VIEWS.has(targetId);
    document.querySelectorAll('[data-view]').forEach((el) => {
      const viewAttr = el.getAttribute('data-view');
      const isDirectMatch = viewAttr === targetId;
      const isMoreMatch = isSubOfMore && viewAttr === 'more';
      el.classList.toggle('active', isDirectMatch || isMoreMatch);
    });

    // Update #page-title
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
      pageTitle.textContent = VIEW_TITLES[targetId] || 'Sổ Thu Chi';
    }

    // Toggle back button for sub-views on mobile header
    const backBtn = document.getElementById('btn-header-back');
    if (backBtn) {
      backBtn.style.display = isSubOfMore ? 'inline-flex' : 'none';
    }

    // Scroll to top on change
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  if (notify && typeof changeListener === 'function') {
    changeListener(targetId);
  }
}

/**
 * Navigate to a specific view
 * @param {string} viewId
 */
export function navigate(viewId) {
  const targetId = VIEW_TITLES[viewId] ? viewId : 'dashboard';
  const targetHash = `#/${targetId}`;

  if (typeof window !== 'undefined') {
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    } else {
      applyView(targetId, true);
    }
  } else {
    applyView(targetId, true);
  }
}

/**
 * Initialize the router
 * @param {object} [options]
 * @param {Function} [options.onChange] - Callback called with (viewId) on route change
 * @returns {{ navigate: Function, currentView: Function }}
 */
export function initRouter({ onChange } = {}) {
  changeListener = onChange || null;

  if (typeof document !== 'undefined') {
    // Delegated click listener for [data-view]
    document.addEventListener('click', (e) => {
      const navItem = e.target.closest('[data-view]');
      if (navItem) {
        const targetView = navItem.getAttribute('data-view');
        if (targetView) {
          e.preventDefault();
          navigate(targetView);
        }
      }

      // Back button click listener
      const backBtn = e.target.closest('#btn-header-back');
      if (backBtn) {
        e.preventDefault();
        if (typeof window !== 'undefined' && window.history && window.history.length > 1) {
          window.history.back();
        } else {
          navigate('more');
        }
      }
    });
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('hashchange', () => {
      const viewId = parseHash(window.location.hash);
      applyView(viewId, true);
    });

    // Handle initial route
    const initialView = parseHash(window.location.hash);
    if (!window.location.hash || window.location.hash !== `#/${initialView}`) {
      window.location.replace(`#/${initialView}`);
    }
    applyView(initialView, true);
  }

  return { navigate, currentView };
}
