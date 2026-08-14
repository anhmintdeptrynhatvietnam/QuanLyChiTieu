/**
 * Toast Notification Component
 */

export class Toast {
  static show(message, type = 'success', duration = 3000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; pointer-events: none;';
      document.body.appendChild(container);
    }

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

    toast.innerHTML = `
      <i data-lucide="${icon}" style="width: 18px; height: 18px; color: ${color}; flex-shrink: 0;"></i>
      <span>${message}</span>
    `;

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
