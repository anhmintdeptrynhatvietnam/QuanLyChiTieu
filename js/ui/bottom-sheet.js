/**
 * Bottom Sheet / Dialog Primitive
 * On mobile (<768px): slides up from bottom, drag handle, 24px top radius.
 * On desktop (>=768px): centered modal dialog max-width 520px.
 * Focus trap + restore focus from modal-a11y.js.
 */
import { trapFocus, restoreFocus, getFocusableElements } from '../utils/modal-a11y.js';
import { refreshIcons } from './icons.js';
import { escapeHtml } from '../utils/helpers.js';

let sheetCounter = 0;

/**
 * Open a bottom sheet modal
 * @param {object} options
 * @param {string} [options.title]
 * @param {HTMLElement} [options.content]
 * @param {Function} [options.onClose]
 * @param {string} [options.size]
 * @returns {{ close: (result?: any) => void, element: HTMLElement, closed: Promise<any> }}
 */
export function openSheet({ title = '', content = null, onClose = null, size = '' } = {}) {
  const previousActiveElement = document.activeElement;
  sheetCounter += 1;
  const titleId = `sheet-title-${sheetCounter}`;

  const backdrop = document.createElement('div');
  backdrop.className = 'sheet-backdrop';
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');
  if (title) {
    backdrop.setAttribute('aria-labelledby', titleId);
  }

  const container = document.createElement('div');
  container.className = `sheet-container${size ? ` sheet-size-${size}` : ''}`;
  container.setAttribute('tabindex', '-1');

  container.innerHTML = `
    <div class="sheet-handle" aria-hidden="true"></div>
    <div class="sheet-header">
      <h3 class="sheet-title" id="${titleId}">${escapeHtml(title)}</h3>
      <button type="button" class="sheet-close" aria-label="Đóng">
        <i data-lucide="x" style="width: 20px; height: 20px;"></i>
      </button>
    </div>
    <div class="sheet-body"></div>
  `;

  const bodyEl = container.querySelector('.sheet-body');
  if (content instanceof HTMLElement) {
    bodyEl.appendChild(content);
  }

  backdrop.appendChild(container);
  document.body.appendChild(backdrop);

  refreshIcons(container);

  // Lock the page behind the sheet. iOS Safari ignores overflow:hidden on body,
  // so pin the body in place and restore the scroll position on close.
  const scrollY = window.scrollY;
  const prevBodyStyle = document.body.getAttribute('style') || '';
  Object.assign(document.body.style, { position: 'fixed', top: `-${scrollY}px`, left: '0', right: '0', overflow: 'hidden' });

  // Focus trap
  const cleanupTrap = trapFocus(backdrop);

  let isClosed = false;
  let resolvePromise;
  const closed = new Promise((resolve) => {
    resolvePromise = resolve;
  });

  const close = (result) => {
    if (isClosed) return;
    isClosed = true;

    backdrop.classList.remove('sheet-open');
    document.removeEventListener('keydown', onKeyDown);
    cleanupTrap();

    const finishCleanup = () => {
      document.body.setAttribute('style', prevBodyStyle);
      window.scrollTo(0, scrollY);
      if (backdrop.parentNode) {
        backdrop.parentNode.removeChild(backdrop);
      }
      restoreFocus(previousActiveElement);
      if (typeof onClose === 'function') {
        onClose(result);
      }
      resolvePromise(result);
    };

    const isReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (isReducedMotion) {
      finishCleanup();
    } else {
      setTimeout(finishCleanup, 250);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
    }
  };
  document.addEventListener('keydown', onKeyDown);

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      close();
    }
  });

  const closeBtn = container.querySelector('.sheet-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => close());
  }

  // Trigger animation & initial focus
  requestAnimationFrame(() => {
    backdrop.classList.add('sheet-open');
    const focusable = getFocusableElements(container);
    if (focusable.length > 0) {
      focusable[0].focus();
    } else {
      container.focus();
    }
  });

  return {
    close,
    element: backdrop,
    closed
  };
}
