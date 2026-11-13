/**
 * Toast Notification Component
 */

export class Toast {
  static show(message, type = 'success', duration = 3000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    container.style.position = 'fixed';
    container.style.zIndex = '99999';
    container.style.pointerEvents = 'none';

    const toast = document.createElement('div');
    toast.className = 'card';
    toast.style.cssText = `
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 18px;
      border-radius: var(--radius-lg);
      font-size: var(--font-size-sm);
      font-weight: 500;
      box-shadow: var(--shadow-lg);
      animation: slideInRight 0.25s ease-out;
      border-left: 4px solid ${type === 'success' ? 'var(--income-primary)' : (type === 'error' ? 'var(--expense-primary)' : 'var(--primary-500)')};
    `;

    const icon = type === 'success' ? 'check-circle' : (type === 'error' ? 'alert-circle' : 'info');
    const color = type === 'success' ? 'var(--income-primary)' : (type === 'error' ? 'var(--expense-primary)' : 'var(--primary-500)');

    const iconEl = document.createElement('i');
    iconEl.setAttribute('data-lucide', icon);
    iconEl.style.width = '18px';
    iconEl.style.height = '18px';
    iconEl.style.color = color;
    iconEl.style.flexShrink = '0';

    const spanEl = document.createElement('span');
    spanEl.textContent = message;

    toast.appendChild(iconEl);
    toast.appendChild(spanEl);

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

export function showToast(message, type = 'success', duration = 3000) {
  Toast.show(message, type, duration);
}
