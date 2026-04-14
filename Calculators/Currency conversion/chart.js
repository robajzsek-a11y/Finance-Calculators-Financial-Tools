let currencyChart = null;

function getChartLocale() {
    return document.documentElement.lang || 'en-US';
}

function formatChartLabel(dateString) {
    return new Date(`${dateString}T00:00:00Z`).toLocaleDateString(getChartLocale(), {
        month: 'short',
        day: 'numeric'
    });
}

function getChartDatasetLabel() {
    return window.App?.currentTranslation?.exchangeRate || 'Exchange rate';
}

export function initChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

    // Ensure Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js not loaded');
        return;
    }

    currencyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: getChartDatasetLabel(),
                data: [],
                borderColor: '#6366f1',
                backgroundColor: gradient,
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
                fill: true,
                tension: 0.3,
                spanGaps: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: '#1e293b',
                    titleColor: '#9ca3af',
                    bodyColor: '#f9fafb',
                    borderColor: '#334155',
                    borderWidth: 1,
                    displayColors: false
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: { display: false, drawBorder: false },
                    ticks: { color: '#9ca3af', maxTicksLimit: 6 }
                },
                y: {
                    display: true,
                    grid: { color: '#334155', drawBorder: false },
                    ticks: { color: '#9ca3af' }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

export function clearChart() {
    if (!currencyChart) return;

    currencyChart.data.labels = [];
    currencyChart.data.datasets[0].data = [];
    delete currencyChart.options.scales.y.min;
    delete currencyChart.options.scales.y.max;
    currencyChart.update();
}

export function syncChartLocale() {
    if (!currencyChart) return;
    currencyChart.data.datasets[0].label = getChartDatasetLabel();
    currencyChart.update('none');
}

export function updateChart(historicalData, targetCurrency) {
    if (!currencyChart || !historicalData || !historicalData.rates) {
        clearChart();
        return null;
    }

    const entries = Object.entries(historicalData.rates)
        .map(([date, rates]) => ({
            date,
            rate: rates?.[targetCurrency]
        }))
        .filter(entry => typeof entry.rate === 'number' && Number.isFinite(entry.rate))
        .sort((a, b) => a.date.localeCompare(b.date));

    if (entries.length === 0) {
        clearChart();
        return null;
    }

    const dates = entries.map(entry => entry.date);
    const rates = entries.map(entry => entry.rate);
    const minRate = Math.min(...rates);
    const maxRate = Math.max(...rates);
    const spread = Math.max(maxRate - minRate, maxRate * 0.02, 0.001);

    currencyChart.data.datasets[0].label = getChartDatasetLabel();
    currencyChart.data.labels = dates.map(formatChartLabel);
    currencyChart.data.datasets[0].data = rates;
    currencyChart.options.scales.y.min = Math.max(0, minRate - spread * 0.25);
    currencyChart.options.scales.y.max = maxRate + spread * 0.25;
    currencyChart.update();

    const currentRate = rates[rates.length - 1];

    return {
        min: minRate,
        max: maxRate,
        current: currentRate
    };
}
