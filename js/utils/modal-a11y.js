/**
 * Shared modal accessibility wiring: ARIA dialog semantics + Escape-to-close.
 * Every modal component calls this once (in its constructor) after its
 * overlay element exists in the DOM.
 */
export function attachModalA11y(overlayEl, titleId, closeFn) {
  overlayEl.setAttribute('role', 'dialog');
  overlayEl.setAttribute('aria-modal', 'true');
  if (titleId) overlayEl.setAttribute('aria-labelledby', titleId);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlayEl.classList.contains('active')) {
      closeFn();
    }
  });
}
