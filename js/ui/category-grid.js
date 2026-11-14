/**
 * Category Grid Component
 * Renders a grid of category buttons with tinted icon circles and names.
 * Default: 4 columns on mobile, 6 on desktop. `compact`: smaller icons, one-line
 * names, 5 columns on mobile. `collapsedCount`: show only the first N categories
 * plus a "Xem tất cả" tile (the selected category always stays visible).
 */
import { escapeHtml, safeColor, safeIconName } from '../utils/helpers.js';
import { refreshIcons } from './icons.js';

function tile({ className, icon, label, ariaLabel }) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `category-grid-item ${className}`;
  if (ariaLabel) btn.setAttribute('aria-label', ariaLabel);
  btn.innerHTML = `
    <div class="category-icon-circle category-icon-add">
      <i data-lucide="${icon}" class="category-icon"></i>
    </div>
    <span class="category-name">${label}</span>
  `;
  return btn;
}

/**
 * Render category selection grid
 * @param {object} options
 * @param {Array<object>} [options.categories] - rendered in the given order
 * @param {string} [options.type] - filter by 'expense' | 'income'
 * @param {string|number|null} [options.selectedId]
 * @param {Function} [options.onSelect] - (categoryId, categoryObj) => void
 * @param {Function} [options.onCreate] - () => void
 * @param {boolean} [options.compact=false]
 * @param {number} [options.collapsedCount=0] - 0 shows every category
 * @returns {HTMLElement}
 */
export function renderCategoryGrid({
  categories = [],
  type = null,
  selectedId = null,
  onSelect = null,
  onCreate = null,
  compact = false,
  collapsedCount = 0
} = {}) {
  const container = document.createElement('div');
  container.className = `category-grid${compact ? ' category-grid-compact' : ''}`;
  container.setAttribute('role', 'radiogroup');
  container.setAttribute('aria-label', 'Lưới chọn hạng mục');

  const filtered = Array.isArray(categories)
    ? (type ? categories.filter((c) => c.type === type) : categories)
    : [];

  let currentSelectedId = selectedId;
  // Collapsing only helps when it hides at least two tiles.
  let expanded = !collapsedCount || filtered.length <= collapsedCount + 1;

  function visibleCategories() {
    if (expanded) return filtered;
    const head = filtered.slice(0, collapsedCount);
    const selected = filtered.find((c) => String(c.id) === String(currentSelectedId));
    if (selected && !head.includes(selected)) head[head.length - 1] = selected;
    return head;
  }

  function categoryTile(cat) {
    const isSelected = String(cat.id) === String(currentSelectedId);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `category-grid-item${isSelected ? ' active' : ''}`;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
    btn.setAttribute('data-id', String(cat.id));
    btn.title = cat.name || '';

    const color = safeColor(cat.color || '#4f46e5');
    btn.innerHTML = `
      <div class="category-icon-circle" style="background-color: ${color}26; color: ${color};">
        <i data-lucide="${safeIconName(cat.icon || 'tag')}" class="category-icon"></i>
      </div>
      <span class="category-name">${escapeHtml(cat.name)}</span>
    `;

    btn.addEventListener('click', () => {
      container.querySelectorAll('.category-grid-item[role="radio"]').forEach((item) => {
        item.classList.remove('active');
        item.setAttribute('aria-checked', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-checked', 'true');
      currentSelectedId = cat.id;
      if (typeof onSelect === 'function') onSelect(cat.id, cat);
    });
    return btn;
  }

  function render() {
    container.innerHTML = '';
    visibleCategories().forEach((cat) => container.appendChild(categoryTile(cat)));

    if (!expanded) {
      const more = tile({ className: 'category-toggle-item', icon: 'chevron-down', label: 'Xem tất cả', ariaLabel: `Xem tất cả ${filtered.length} hạng mục` });
      more.addEventListener('click', () => { expanded = true; render(); });
      container.appendChild(more);
    } else {
      if (typeof onCreate === 'function') {
        const addBtn = tile({ className: 'category-add-item', icon: 'plus', label: '+ Thêm', ariaLabel: 'Thêm hạng mục mới' });
        addBtn.addEventListener('click', () => onCreate());
        container.appendChild(addBtn);
      }
      if (collapsedCount && filtered.length > collapsedCount + 1) {
        const less = tile({ className: 'category-toggle-item', icon: 'chevron-up', label: 'Thu gọn' });
        less.addEventListener('click', () => { expanded = false; render(); });
        container.appendChild(less);
      }
    }
    refreshIcons(container);
  }

  render();
  return container;
}
