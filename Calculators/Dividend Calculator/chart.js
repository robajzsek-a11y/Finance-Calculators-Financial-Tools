///------------2026 Pomerancee. All rights reserved.----------------\\\
///------------https://creativecommons.org/licenses/by-nc-sa/4.0/---\\\
///------------Licensed under CC BY-NC-SA 4.0------------------------\\\

window.DividendCalc = window.DividendCalc || {};

let pieChartInstance = null;
let barChartInstance = null;

const CHART_COLORS = {
    magenta: '#5a2bacff',
    amber: '#a06212ff',
    magentaOutline: '#5a2bacff',
    amberOutline: '#a06212ff',
    magentaLight: '#e879f9',
    amberLight: '#a06212ff',
    gridColor: '#374151',
    textColor: '#ffffff',
    tooltipBg: 'rgba(31, 41, 55, 0.95)',
    tooltipText: '#f9fafb',
    tooltipBorder: '#4b5563'
};

/**
 * Initializes the pie chart showing portfolio composition
 */
window.DividendCalc.initPieChart = function(canvasContext) {
    if (pieChartInstance) {
        pieChartInstance.destroy();
    }

    pieChartInstance = new Chart(canvasContext, {
        type: 'doughnut',
        data: {
            labels: ['Original Investment', 'Reinvested Dividends'],
            datasets: [{
                data: [100, 0],
                backgroundColor: [
                    CHART_COLORS.amber,
                    CHART_COLORS.magenta
                ],
                borderColor: '#1e293b',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        color: CHART_COLORS.textColor,
                        padding: 15,
                        font: {
                            size: 12,
                            family: "'Inter', sans-serif"
                        },
                        usePointStyle: true,
                        pointStyle: 'circle',
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    return {
                                        text: label,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        fontColor: '#ffffff',
                                        hidden: false,
                                        index: i
                                    };
                                });
                            }
                            return [];
                        }
                    }
                },
                tooltip: {
                    backgroundColor: CHART_COLORS.tooltipBg,
                    titleColor: CHART_COLORS.tooltipText,
                    bodyColor: CHART_COLORS.tooltipText,
                    borderColor: CHART_COLORS.tooltipBorder,
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: $${value.toLocaleString()} (${percentage}%)`;
                        }
                    }
                },
                datalabels: {
                    color: '#ffffff',
                    font: {
                        size: 16,
                        weight: 'bold',
                        family: "'Inter', sans-serif"
                    },
                    formatter: function(value, context) {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return percentage > 5 ? percentage + '%' : ''; // Only show if > 5%
                    }
                }
            }
        },
        plugins: [{
            id: 'datalabels',
            afterDatasetsDraw: function(chart) {
                const ctx = chart.ctx;
                chart.data.datasets.forEach((dataset, datasetIndex) => {
                    const meta = chart.getDatasetMeta(datasetIndex);
                    if (!meta.hidden) {
                        meta.data.forEach((element, index) => {
                            const data = dataset.data[index];
                            const total = dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((data / total) * 100).toFixed(1) : 0;
                            
                            // Only show percentage if > 5%
                            if (percentage <= 5) return;
                            
                            const {x, y} = element.tooltipPosition();
                            
                            ctx.fillStyle = '#ffffff';
                            ctx.font = 'bold 16px Inter, sans-serif';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillText(percentage + '%', x, y);
                        });
                    }
                });
            }
        }]
    });

    return pieChartInstance;
};

/**
 * Updates the pie chart with new data
 * @param {number} originalInvestment - Initial investment amount
 * @param {number} reinvestedAmount - Amount from reinvested dividends
 * @param {number} contributionsAmount - Amount from additional contributions (optional)
 */
window.DividendCalc.updatePieChart = function(originalInvestment, reinvestedAmount, contributionsAmount = 0) {
    if (!pieChartInstance) return;

    // Determine which segments to show based on values
    const hasReinvested = reinvestedAmount > 0;
    const hasContributions = contributionsAmount > 0;

    if (hasContributions && hasReinvested) {
        // Show all 3 segments
        pieChartInstance.data.labels = ['Original Investment', 'Contribution', 'Reinvested Dividends'];
        pieChartInstance.data.datasets[0].data = [originalInvestment, contributionsAmount, reinvestedAmount];
        pieChartInstance.data.datasets[0].backgroundColor = [
            CHART_COLORS.amber,      // Original Investment
            '#10b981',                // Contribution (green)
            CHART_COLORS.magenta     // Reinvested Dividends
        ];
    } else if (hasContributions && !hasReinvested) {
        // Show only Original Investment and Contribution
        pieChartInstance.data.labels = ['Original Investment', 'Contribution'];
        pieChartInstance.data.datasets[0].data = [originalInvestment, contributionsAmount];
        pieChartInstance.data.datasets[0].backgroundColor = [
            CHART_COLORS.amber,      // Original Investment
            '#10b981'                 // Contribution (green)
        ];
    } else {
        // Show only Original Investment and Reinvested Dividends
        pieChartInstance.data.labels = ['Original Investment', 'Reinvested Dividends'];
        pieChartInstance.data.datasets[0].data = [originalInvestment, reinvestedAmount];
        pieChartInstance.data.datasets[0].backgroundColor = [
            CHART_COLORS.amber,
            CHART_COLORS.magenta
        ];
    }
    
    pieChartInstance.update();
};

/**
 * Initializes the bar chart showing dividend growth
 */
window.DividendCalc.initBarChart = function(canvasContext) {
    if (barChartInstance) {
        barChartInstance.destroy();
    }

    barChartInstance = new Chart(canvasContext, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Annual Dividend Income',
                    data: [],
                    backgroundColor: CHART_COLORS.magenta,
                    borderColor: 'transparent',
                    borderWidth: 0,
                    barPercentage: 0.6,
                    categoryPercentage: 0.7,
                    order: 2
                },
                {
                    label: 'Growth Trend',
                    data: [],
                    type: 'line',
                    borderColor: CHART_COLORS.amber,
                    backgroundColor: 'transparent',
                    borderWidth: 4,
                    pointRadius: 0,
                    pointHoverRadius: 0,
                    tension: 0.4,
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: CHART_COLORS.tooltipBg,
                    titleColor: CHART_COLORS.tooltipText,
                    bodyColor: CHART_COLORS.tooltipText,
                    borderColor: CHART_COLORS.tooltipBorder,
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        title: function(tooltipItems) {
                            return `Year ${tooltipItems[0].label}`;
                        },
                        label: function(context) {
                            if (context.datasetIndex === 0) {
                                return `Dividend Income: $${context.parsed.y.toLocaleString()}`;
                            }
                            return null;
                        }
                    },
                    filter: function(tooltipItem) {
                        return tooltipItem.datasetIndex === 0; // Only show tooltip for bars
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        color: CHART_COLORS.textColor,
                        font: {
                            family: "'Inter', sans-serif",
                            size: 11
                        }
                    }
                },
                y: {
                    grid: {
                        color: CHART_COLORS.gridColor,
                        drawBorder: false
                    },
                    ticks: {
                        color: CHART_COLORS.textColor,
                        font: {
                            family: "'Inter', sans-serif",
                            size: 11
                        },
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    },
                    beginAtZero: true
                }
            }
        },
        plugins: [{
            id: 'arrowhead',
            afterDatasetsDraw: function(chart) {
                const ctx = chart.ctx;
                const dataset = chart.data.datasets[1]; // Trend line dataset
                const meta = chart.getDatasetMeta(1);
                
                if (!meta || !meta.data || meta.data.length < 2) return;
                
                // Get the last two points to draw arrow direction
                const lastPoint = meta.data[meta.data.length - 1];
                const secondLastPoint = meta.data[meta.data.length - 2];
                
                if (!lastPoint || !secondLastPoint) return;
                
                const x1 = secondLastPoint.x;
                const y1 = secondLastPoint.y;
                const x2 = lastPoint.x;
                const y2 = lastPoint.y;
                
                // Calculate angle
                const angle = Math.atan2(y2 - y1, x2 - x1);
                
                // Arrow properties
                const arrowLength = 16;
                const arrowWidth = 10;
                
                ctx.save();
                ctx.fillStyle = CHART_COLORS.amber;
                ctx.strokeStyle = CHART_COLORS.amber;
                ctx.lineWidth = 4;
                
                // Draw arrowhead
                ctx.beginPath();
                ctx.moveTo(x2, y2);
                ctx.lineTo(
                    x2 - arrowLength * Math.cos(angle - Math.PI / 6),
                    y2 - arrowLength * Math.sin(angle - Math.PI / 6)
                );
                ctx.lineTo(
                    x2 - arrowLength * Math.cos(angle + Math.PI / 6),
                    y2 - arrowLength * Math.sin(angle + Math.PI / 6)
                );
                ctx.closePath();
                ctx.fill();
                
                ctx.restore();
            }
        }]
    });

    return barChartInstance;
};

/**
 * Updates the bar chart with new data
 */
window.DividendCalc.updateBarChart = function(labels, dividendData) {
    if (!barChartInstance) return;

    // Calculate offset for trend line (15% above the bars)
    const maxValue = Math.max(...dividendData);
    const offset = maxValue * 0.15;
    const trendData = dividendData.map(value => value + offset);

    barChartInstance.data.labels = labels;
    barChartInstance.data.datasets[0].data = dividendData;
    barChartInstance.data.datasets[1].data = trendData; // Offset trend line above bars
    barChartInstance.update();
};

/**
 * Shows or hides the pie chart container
 */
window.DividendCalc.togglePieChart = function(show) {
    const pieChartContainer = document.getElementById('pie-chart-container');
    if (pieChartContainer) {
        if (show) {
            pieChartContainer.classList.remove('hidden');
        } else {
            pieChartContainer.classList.add('hidden');
        }
    }
};

/**
 * Shows or hides the bar chart container
 */
window.DividendCalc.toggleBarChart = function(show) {
    const barChartContainer = document.querySelector('.bar-chart-box');
    if (barChartContainer) {
        if (show) {
            barChartContainer.classList.remove('hidden');
        } else {
            barChartContainer.classList.add('hidden');
        }
    }
};
