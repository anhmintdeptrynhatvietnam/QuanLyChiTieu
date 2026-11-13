/**
 * Settings View ("Cài đặt & Đồng bộ" Screen)
 * Coordinates Account & Cloud, Appearance, Categories, Data Backup/Restore, and PWA sections.
 */
import { stateStore } from '../../state.js';
import { firebaseSyncService } from '../../services/firebase-sync.js';
import { refreshIcons } from '../../ui/icons.js';
import { renderAccountSection, bindAccountEvents } from './settings-account.js';
import { renderAppearanceSection, bindAppearanceEvents } from './settings-appearance.js';
import { renderCategoriesSection, bindCategoriesEvents } from './settings-categories.js';
import { renderDataSection, bindDataEvents } from './settings-data.js';
import { renderPwaSection } from './settings-pwa.js';

export class SettingsView {
  constructor(containerId = 'view-settings') {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.init();
  }

  init() {
    this.render();

    stateStore.subscribe(() => {
      const section = document.getElementById(this.containerId);
      if (section && section.classList.contains('active')) {
        this.render();
      }
    });

    firebaseSyncService.onStatusChange(() => {
      const section = document.getElementById(this.containerId);
      if (section && section.classList.contains('active')) {
        this.render();
      }
    });
  }

  render() {
    if (!this.container) return;
    const state = stateStore.getState();

    this.container.innerHTML = `
      <div class="settings-page">
        <!-- 1. Account & Cloud Sync -->
        ${renderAccountSection(state)}

        <!-- 2. Appearance & Theme -->
        ${renderAppearanceSection()}

        <!-- 3. Categories Management -->
        ${renderCategoriesSection(state)}

        <!-- 4. Data Backup & Reset -->
        ${renderDataSection()}

        <!-- 5. Mobile App PWA Guide -->
        ${renderPwaSection()}
      </div>
    `;

    this.bindEvents();
    refreshIcons(this.container);
  }

  bindEvents() {
    if (!this.container) return;
    bindAccountEvents(this.container);
    bindAppearanceEvents(this.container, () => this.render());
    bindCategoriesEvents(this.container);
    bindDataEvents(this.container);
  }
}
