/**
 * Lucide icon helper
 */

export function refreshIcons(root) {
  if (typeof window !== 'undefined' && window.lucide?.createIcons) {
    if (root) {
      window.lucide.createIcons({ root });
    } else {
      window.lucide.createIcons();
    }
  }
}
