/**
 * Chart.js Integration for Analytics View
 * Manages Doughnut and Bar chart instances with theme awareness and safe cleanup.
 */
import { formatCurrency } from '../../utils/formatters.js';

/**
 * Read current CSS variable value from document root
 * @param {string} varName
 * @param {string} fallback
 * @returns {string}
 */
function getCssVar(varName, fallback = '') {
  if (typeof document === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || fallback;
}

/**
 * Render or re-create the Category Expense Doughnut Chart
 * @param {HTMLCanvasElement} canvas
 * @param {Array<{ name: string, color: string, amount: number, percentage: number }>} items
 * @param {number} totalExpense
 * @returns {object|null} Chart instance
 */
export function renderCategoryDoughnut(canvas, items = [], totalExpense = 0) {
  if (!canvas || !window.Chart) return null;

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const borderColor = isDark ? '#131a24' : '#ffffff';
  const textColor = getCssVar('--text-secondary', '#64748b');

  const hasData = items.length > 0 && totalExpense > 0;
  const labels = hasData ? items.map(i => i.name) : ['Chưa có dữ liệu'];
  const data = hasData ? items.map(i => i.amount) : [1];
  const bgColors = hasData ? items.map(i => i.color) : [isDark ? '#243041' : '#e2e8f0'];

  return new window.Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: bgColors,
        borderWidth: 2,
        borderColor
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          display: false // Using custom ranked list legend
        },
        tooltip: {
          enabled: hasData,
          callbacks: {
            label(ctx) {
              const val = ctx.raw || 0;
              const pct = totalExpense > 0 ? Math.round((val / totalExpense) * 100) : 0;
              return ` ${ctx.label}: ${formatCurrency(val)} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

/**
 * Render or re-create the 6-Month Income vs Expense Trend Bar Chart
 * @param {HTMLCanvasElement} canvas
 * @param {Array<{ label: string, income: number, expense: number }>} series
 * @returns {object|null} Chart instance
 */
export function renderTrendBarChart(canvas, series = []) {
  if (!canvas || !window.Chart) return null;

  const textColor = getCssVar('--text-secondary', '#64748b');
  const gridColor = getCssVar('--border-subtle', 'rgba(148, 163, 184, 0.15)');

  const labels = series.map(s => s.label);
  const incomeData = series.map(s => s.income);
  const expenseData = series.map(s => s.expense);

  return new window.Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Thu nhập',
          data: incomeData,
          backgroundColor: '#10b981',
          borderRadius: 4,
          maxBarThickness: 24
        },
        {
          label: 'Chi tiêu',
          data: expenseData,
          backgroundColor: '#ef4444',
          borderRadius: 4,
          maxBarThickness: 24
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            boxHeight: 12,
            font: { family: 'Inter', size: 12 },
            color: textColor
          }
        },
        tooltip: {
          callbacks: {
            label(ctx) {
              return ` ${ctx.dataset.label}: ${formatCurrency(ctx.raw || 0)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textColor, font: { family: 'Inter', size: 11 } }
        },
        y: {
          beginAtZero: true,
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            font: { family: 'Inter', size: 10 },
            callback(val) {
              if (val >= 1e6) return `${(val / 1e6).toFixed(1)}Tr`;
              if (val >= 1e3) return `${(val / 1e3).toFixed(0)}k`;
              return val;
            }
          }
        }
      }
    }
  });
}
