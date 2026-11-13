/**
 * Analytics View ("Báo cáo" Screen)
 * Visual financial reports: Category expense donut, 6-month trend bar, ranked breakdown.
 */
import { stateStore } from '../../state.js';
import { getMonthYear, formatMonthYearDisplay, formatCurrency } from '../../utils/formatters.js';
import { escapeHtml } from '../../utils/helpers.js';
import { refreshIcons } from '../../ui/icons.js';
import { calculateMonthSummary, calculateCategoryExpenseBreakdown, calculateSixMonthTrend } from '../../domain/analytics-series.js';
import { renderCategoryDoughnut, renderTrendBarChart } from './analytics-charts.js';
import { renderRankedLegend, renderBreakdownTableRows } from './analytics-breakdown.js';

export class AnalyticsView {
  constructor(containerId = 'view-analytics') {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.selectedMonth = getMonthYear();
    this.doughnutChart = null;
    this.barChart = null;
    this.init();
  }

  init() {
    this.render();
    this.bindEvents();

    stateStore.subscribe(() => {
      const section = document.getElementById(this.containerId);
      if (section && section.classList.contains('active')) {
        this.render();
      }
    });

    window.addEventListener('themechange', () => {
      const section = document.getElementById(this.containerId);
      if (section && section.classList.contains('active')) {
        this.renderCharts();
      }
    });
  }

  destroyCharts() {
    if (this.doughnutChart) {
      this.doughnutChart.destroy();
      this.doughnutChart = null;
    }
    if (this.barChart) {
      this.barChart.destroy();
      this.barChart = null;
    }
  }

  render() {
    if (!this.container) return;
    const state = stateStore.getState();
    const summary = calculateMonthSummary(state.transactions, this.selectedMonth);
    const breakdown = calculateCategoryExpenseBreakdown(state.transactions, state.categories, this.selectedMonth);
    this.currentBreakdown = breakdown;

    this.container.innerHTML = `
      <div class="analytics-page">
        <!-- Header & Month Selector -->
        <div class="card-v2 analytics-header-card">
          <div class="analytics-header-info">
            <h2 class="analytics-page-title">Báo Cáo Tài Chính</h2>
            <div class="analytics-stat-chips">
              <span class="analytics-chip">
                <span class="text-secondary">Thu:</span>
                <strong class="text-income num">+${formatCurrency(summary.income)}</strong>
              </span>
              <span class="analytics-chip">
                <span class="text-secondary">Chi:</span>
                <strong class="text-expense num">-${formatCurrency(summary.expense)}</strong>
              </span>
              <span class="analytics-chip">
                <span class="text-secondary">Tiết kiệm:</span>
                <strong class="num" style="color: ${summary.netSavings >= 0 ? 'var(--income-primary)' : 'var(--expense-primary)'};">
                  ${summary.netSavings >= 0 ? '+' : ''}${formatCurrency(summary.netSavings)} (${summary.savingRate}%)
                </strong>
              </span>
            </div>
          </div>
          <div class="analytics-month-wrap">
            <input type="month" id="analytics-month-picker" class="form-input analytics-month-input" value="${escapeHtml(this.selectedMonth)}">
          </div>
        </div>

        <!-- Charts Grid (2 Columns on Desktop) -->
        <div class="analytics-charts-grid">
          <!-- Category Doughnut Card -->
          <div class="card-v2 analytics-chart-card">
            <div class="analytics-card-title-wrap">
              <h3 class="analytics-card-title">Cơ Cấu Chi Tiêu</h3>
              <span class="badge badge-subtle font-medium">${formatMonthYearDisplay(this.selectedMonth)}</span>
            </div>
            <div class="analytics-doughnut-layout">
              <div class="analytics-canvas-container">
                <canvas id="chart-category-doughnut"></canvas>
              </div>
              <div class="analytics-legend-container">
                ${renderRankedLegend(breakdown.items)}
              </div>
            </div>
          </div>

          <!-- 6-Month Trend Bar Card -->
          <div class="card-v2 analytics-chart-card">
            <div class="analytics-card-title-wrap">
              <h3 class="analytics-card-title">Xu Hướng Thu vs Chi (6 Tháng)</h3>
            </div>
            <div class="analytics-bar-container">
              <canvas id="chart-trend-bar"></canvas>
            </div>
          </div>
        </div>

        <!-- Detailed Breakdown Table -->
        <div class="card-v2 analytics-breakdown-card">
          <div class="analytics-card-title-wrap" style="margin-bottom: var(--space-3);">
            <h3 class="analytics-card-title">Chi Tiết Theo Danh Mục</h3>
            <span class="text-muted" style="font-size: var(--font-size-xs);">${breakdown.items.length} hạng mục phát sinh</span>
          </div>
          <div class="analytics-table-wrap">
            <table class="analytics-table">
              <thead>
                <tr class="analytics-table-head">
                  <th style="padding: 10px 8px; text-align: left;">Danh mục</th>
                  <th style="padding: 10px 8px; text-align: center;">Số GD</th>
                  <th style="padding: 10px 8px; text-align: right;">Tổng tiền</th>
                  <th style="padding: 10px 8px; text-align: right;">Tỷ trọng</th>
                </tr>
              </thead>
              <tbody>
                ${renderBreakdownTableRows(breakdown.items)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    refreshIcons(this.container);
    requestAnimationFrame(() => this.renderCharts());
  }

  renderCharts() {
    this.destroyCharts();
    const state = stateStore.getState();
    const breakdown = this.currentBreakdown || calculateCategoryExpenseBreakdown(state.transactions, state.categories, this.selectedMonth);
    const doughnutCanvas = this.container?.querySelector('#chart-category-doughnut');
    if (doughnutCanvas) {
      this.doughnutChart = renderCategoryDoughnut(doughnutCanvas, breakdown.items, breakdown.totalExpense);
    }

    const [year, month] = this.selectedMonth.split('-');
    const refDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    const trendSeries = calculateSixMonthTrend(state.transactions, refDate);
    const barCanvas = this.container?.querySelector('#chart-trend-bar');
    if (barCanvas) {
      this.barChart = renderTrendBarChart(barCanvas, trendSeries);
    }
  }

  bindEvents() {
    this.container.addEventListener('change', (e) => {
      if (e.target && e.target.id === 'analytics-month-picker') {
        const val = e.target.value;
        if (val && val !== this.selectedMonth) {
          this.selectedMonth = val;
          this.render();
        }
      }
    });
  }
}
