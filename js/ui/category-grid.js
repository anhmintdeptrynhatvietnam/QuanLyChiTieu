/**
 * Category Grid Component
 * Renders a grid of category buttons with tinted icon circles and names.
 * 4 columns on mobile (<768px), 6 columns on desktop (>=768px).
 */
import { escapeHtml, safeColor, safeIconName } from '../utils/helpers.js';
import { refreshIcons } from './icons.js';

/**
 * Render category selection grid
 * @param {object} options
 * @param {Array<object>} [options.categories]
 * @param {string} [options.type] - filter by 'expense' | 'income'
 * @param {string|number|null} [options.selectedId]
 * @param {Function} [options.onSelect] - (categoryId, categoryObj) => void
 * @param {Function} [options.onCreate] - () => void
 * @returns {HTMLElement}
 */
export function renderCategoryGrid({
  categories = [],
  type = null,
  selectedId = null,
  onSelect = null,
  onCreate = null
} = {}) {
  const container = document.createElement('div');
  container.className = 'category-grid';
  container.setAttribute('role', 'radiogroup');
  container.setAttribute('aria-label', 'Lưới chọn hạng mục');

  const filtered = Array.isArray(categories)
    ? (type ? categories.filter((c) => c.type === type) : categories)
    : [];

  let currentSelectedId = selectedId;

  filtered.forEach((cat) => {
    const isSelected = String(cat.id) === String(currentSelectedId);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `category-grid-item${isSelected ? ' active' : ''}`;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
    btn.setAttribute('data-id', String(cat.id));

    const color = safeColor(cat.color || '#4f46e5');
    const iconName = safeIconName(cat.icon || 'tag');

    btn.innerHTML = `
      <div class="category-icon-circle" style="background-color: ${color}26; color: ${color};">
        <i data-lucide="${iconName}" style="width: 22px; height: 22px;"></i>
      </div>
      <span class="category-name">${escapeHtml(cat.name)}</span>
    `;

    btn.addEventListener('click', () => {
      container.querySelectorAll('.category-grid-item').forEach((item) => {
        item.classList.remove('active');
        item.setAttribute('aria-checked', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-checked', 'true');
      currentSelectedId = cat.id;

      if (typeof onSelect === 'function') {
        onSelect(cat.id, cat);
      }
    });

    container.appendChild(btn);
  });

  if (typeof onCreate === 'function') {
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'category-grid-item category-add-item';
    addBtn.setAttribute('aria-label', 'Thêm hạng mục mới');
    addBtn.innerHTML = `
      <div class="category-icon-circle category-icon-add">
        <i data-lucide="plus" style="width: 20px; height: 20px;"></i>
      </div>
      <span class="category-name">+ Thêm</span>
    `;
    addBtn.addEventListener('click', () => {
      onCreate();
    });
    container.appendChild(addBtn);
  }

  refreshIcons(container);

  return container;
}
