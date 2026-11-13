/**
 * Analytics & Reports Component (Chart.js Integration)
 */
import { stateStore } from '../state.js';
import { CATEGORY_PALETTE } from '../config.js';
import { formatCurrency, formatMonthYearDisplay, getMonthYear } from '../utils/formatters.js';
import { escapeHtml, safeColor } from '../utils/helpers.js';

export class Analytics {
  constructor(containerId = 'view-analytics') {
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
      const activeSection = document.getElementById('view-analytics');
      if (activeSection && activeSection.classList.contains('active')) {
        this.render();
      }
    });
  }

  render() {
    const state = stateStore.getState();

    // 1. Calculate stats for selected month
    let monthIncome = 0;
    let monthExpense = 0;
    const catExpenseMap = {};
    const catTxCountMap = {};

    state.transactions.forEach(t => {
      if (t.date && t.date.startsWith(this.selectedMonth)) {
        const amt = Number(t.amount) || 0;
        if (t.type === 'income') monthIncome += amt;
        if (t.type === 'expense') {
          monthExpense += amt;
          catExpenseMap[t.categoryId] = (catExpenseMap[t.categoryId] || 0) + amt;
          catTxCountMap[t.categoryId] = (catTxCountMap[t.categoryId] || 0) + 1;
        }
      }
    });

    const netSavings = monthIncome - monthExpense;
    const savingRate = monthIncome > 0 ? Math.max(0, Math.round((netSavings / monthIncome) * 100)) : 0;

    this.container.innerHTML = `
      <div class="flex flex-col gap-6">
        <!-- Time Filter & Summary -->
        <div class="card flex items-center justify-between" style="flex-wrap: wrap; gap: var(--space-4);">
          <div>
            <h2 style="font-size: 1.25rem;">Báo Cáo Tài Chính</h2>
            <div class="flex gap-4" style="margin-top: var(--space-2); flex-wrap: wrap;">
              <small class="text-secondary">Thu: <strong class="text-income">+${formatCurrency(monthIncome)}</strong></small>
              <small class="text-secondary">Chi: <strong class="text-expense">-${formatCurrency(monthExpense)}</strong></small>
              <small class="text-secondary">Tỷ lệ tiết kiệm: <strong class="text-primary">${savingRate}%</strong></small>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <input type="month" id="analytics-month-picker" class="form-input" value="${escapeHtml(this.selectedMonth)}" style="width: auto;">
          </div>
        </div>

        <!-- Charts Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--space-6);">
          <!-- Category Doughnut Chart -->
          <div class="card">
            <h3 style="font-size: var(--font-size-base); margin-bottom: var(--space-4);">Cơ Cấu Chi Tiêu (${formatMonthYearDisplay(this.selectedMonth)})</h3>
            <div style="position: relative; height: 260px; display: flex; align-items: center; justify-content: center;">
              <canvas id="chart-category-doughnut"></canvas>
            </div>
          </div>

          <!-- 6-Month Income vs Expense Trend Bar Chart -->
          <div class="card">
            <h3 style="font-size: var(--font-size-base); margin-bottom: var(--space-4);">Xu Hướng Thu vs Chi 6 Tháng Gần Nhất</h3>
            <div style="position: relative; height: 260px;">
              <canvas id="chart-trend-bar"></canvas>
            </div>
          </div>
        </div>

        <!-- Detailed Breakdown Table Card -->
        <div class="card">
          <h3 style="font-size: var(--font-size-base); margin-bottom: var(--space-4);">Chi Tiết Chi Tiêu Theo Danh Mục</h3>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: var(--font-size-sm);">
              <thead>
                <tr style="border-bottom: 1px solid var(--border-subtle); text-align: left; color: var(--text-muted);">
                  <th style="padding: 10px 8px;">Danh mục</th>
                  <th style="padding: 10px 8px; text-align: center;">Số GD</th>
                  <th style="padding: 10px 8px; text-align: right;">Tổng tiền</th>
                  <th style="padding: 10px 8px; text-align: right;">Tỷ trọng</th>
                </tr>
              </thead>
              <tbody>
                ${this.renderBreakdownRows(catExpenseMap, catTxCountMap, monthExpense, state)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.bindCardEvents();
    setTimeout(() => this.initCharts(catExpenseMap, state), 50);
  }

  renderBreakdownRows(expenseMap, countMap, totalExpense, state) {
    const entries = Object.entries(expenseMap).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) {
      return '<tr><td colspan="4" style="text-align: center; padding: 24px; color: var(--text-muted);">Không có dữ liệu chi tiêu trong tháng này</td></tr>';
    }

    return entries.map(([catId, amount]) => {
      const cat = state.categories.find(c => c.id === catId);
      const count = countMap[catId] || 0;
      const percent = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;

      return `
        <tr style="border-bottom: 1px solid var(--border-subtle);">
          <td style="padding: 10px 8px; font-weight: 500;">
            <div class="flex items-center gap-2">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${safeColor(cat?.color || '#3b82f6')};"></span>
              ${escapeHtml(cat?.name || 'Khác')}
            </div>
          </td>
          <td style="padding: 10px 8px; text-align: center;" class="text-muted">${count}</td>
          <td style="padding: 10px 8px; text-align: right; font-weight: 600;" class="text-expense">${formatCurrency(amount)}</td>
          <td style="padding: 10px 8px; text-align: right; font-weight: 600;">${percent}%</td>
        </tr>
      `;
    }).join('');
  }

  initCharts(expenseMap, state) {
    if (!window.Chart) return;

    const themeTextColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();

    // 1. Render Doughnut Chart
    const doughnutCanvas = document.getElementById('chart-category-doughnut');
    if (doughnutCanvas) {
      if (this.doughnutChart) this.doughnutChart.destroy();

      const labels = [];
      const data = [];
      const bgColors = [];
      const usedChartColors = new Set();

      Object.entries(expenseMap).forEach(([catId, amount], idx) => {
        const cat = state.categories.find(c => c.id === catId);
        labels.push(cat?.name || 'Khác');
        data.push(amount);

        let color = cat?.color;
        if (!color || usedChartColors.has(color.toLowerCase())) {
          const available = CATEGORY_PALETTE.find(c => !usedChartColors.has(c.toLowerCase()));
          color = available || CATEGORY_PALETTE[idx % CATEGORY_PALETTE.length];
        }
        usedChartColors.add(color.toLowerCase());
        bgColors.push(color);
      });

      this.doughnutChart = new window.Chart(doughnutCanvas, {
        type: 'doughnut',
        data: {
          labels: labels.length ? labels : ['Chưa có dữ liệu'],
          datasets: [{
            data: data.length ? data : [1],
            backgroundColor: bgColors.length ? bgColors : ['#e2e8f0'],
            borderWidth: 2,
            borderColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#111827' : '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Inter' }, color: themeTextColor } } }
        }
      });
    }

    // 2. Render 6-Month Trend Bar Chart
    const barCanvas = document.getElementById('chart-trend-bar');
    if (barCanvas) {
      if (this.barChart) this.barChart.destroy();

      const months = [];
      const incomeData = [];
      const expenseData = [];

      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        months.push(`T${d.getMonth() + 1}`);

        let inc = 0;
        let exp = 0;
        state.transactions.forEach(t => {
          if (t.date && t.date.startsWith(mKey)) {
            if (t.type === 'income') inc += Number(t.amount) || 0;
            if (t.type === 'expense') exp += Number(t.amount) || 0;
          }
        });
        incomeData.push(inc);
        expenseData.push(exp);
      }

      this.barChart = new window.Chart(barCanvas, {
        type: 'bar',
        data: {
          labels: months,
          datasets: [
            { label: 'Thu nhập', data: incomeData, backgroundColor: '#10b981', borderRadius: 4 },
            { label: 'Chi tiêu', data: expenseData, backgroundColor: '#ef4444', borderRadius: 4 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Inter' }, color: themeTextColor } } },
          scales: {
            x: { ticks: { color: themeTextColor } },
            y: { beginAtZero: true, ticks: { color: themeTextColor, callback: (v) => formatCurrency(v).replace('₫', '') } }
          }
        }
      });
    }
  }

  bindEvents() {
    this.container.addEventListener('change', (e) => {
      if (e.target.id === 'analytics-month-picker') {
        this.selectedMonth = e.target.value;
        this.render();
      }
    });
  }

  bindCardEvents() {}
}
