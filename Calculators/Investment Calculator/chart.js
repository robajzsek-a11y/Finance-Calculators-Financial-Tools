///------------2026 Pomerancee. All rights reserved.----------------\\\
///------------https://creativecommons.org/licenses/by-nc-sa/4.0/---\\\
///------------Licensed under CC BY-NC-SA 4.0------------------------\\\

window.App = window.App || {};

let chartInstance = null;
let currentCurrency = 'USD';
let chartLegendContainer = null;
let activeMobileLegendItemId = null;

const CHART_THEME = {
    dark: {
        gridColor: '#374151',
        textColor: '#ffffff',
        tooltipBg: 'rgba(31, 41, 55, 0.95)',
        tooltipText: '#f9fafb',
        tooltipBorder: '#4b5563',
        investedLineColor: '#ffffff',
        legendBg: 'rgba(17, 24, 39, 0)',
        legendBorder: 'rgba(148, 163, 184, 0)',
        legendMuted: 'rgba(226, 232, 240, 0.88)',
        labelBg: 'rgba(15, 23, 42, 0.92)'
    },
    light: {
        gridColor: '#9ca3af',
        textColor: '#000000',
        tooltipBg: 'rgba(255, 255, 255, 0.95)',
        tooltipText: '#111827',
        tooltipBorder: '#e5e7eb',
        investedLineColor: '#1f2937',
        legendBg: 'rgba(255, 255, 255, 0)',
        legendBorder: 'rgba(148, 163, 184, 0)',
        legendMuted: 'rgba(71, 85, 105, 0.88)',
        labelBg: 'rgba(255, 255, 255, 0.96)'
    }
};

const CHART_ACCENTS = {
    portfolio: '#60a5fa',
    compoundInterest: '#6735c5ff',
    invested: '#94a3b8',
    historicalInterest: '#1d4ed8',
    yearlyInterest: '#14b8a6',
    benchmark: '#fbbf24',
    crossover: '#f59e0b'
};

function getCurrentTheme() {
    return document.body.classList.contains('light-mode') ? CHART_THEME.light : CHART_THEME.dark;
}

function getTickLimit() {
    if (window.innerWidth <= 360) return 4;
    return window.innerWidth < 768 ? 6 : 12;
}

function isCompactMobileChart() {
    return window.innerWidth <= 360;
}

function isMobileLegendMode() {
    return window.innerWidth < 900;
}

function getAxisFontSize() {
    return isCompactMobileChart() ? 10 : 12;
}

function getLegendHeight() {
    const fallbackHeight = window.innerWidth <= 360 ? 42 : window.innerWidth < 768 ? 46 : 52;
    const overlayBar = chartLegendContainer && chartLegendContainer.closest('.chart-overlay-bar');

    if (!overlayBar) {
        return fallbackHeight;
    }

    const overlayHeight = Math.ceil(overlayBar.getBoundingClientRect().height);
    if (!overlayHeight) {
        return fallbackHeight;
    }

    return Math.max(fallbackHeight, overlayHeight + (window.innerWidth < 768 ? 18 : 10));
}

function getChartLayoutPadding() {
    if (isCompactMobileChart()) {
        return {
            left: 4,
            right: 8,
            top: getLegendHeight(),
            bottom: 6
        };
    }

    return {
        left: 10,
        right: 18,
        top: getLegendHeight(),
        bottom: 10
    };
}

function getTranslation(key, fallback) {
    const active = window.App.currentTranslation || (window.App.translations && window.App.translations.en) || {};
    return active[key] || fallback;
}

function formatCurrencyValue(value, currency = currentCurrency, maximumFractionDigits = 0) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        currencyDisplay: 'narrowSymbol',
        maximumFractionDigits
    }).format(value);
}

function formatCompactCurrency(value, currency = currentCurrency) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        currencyDisplay: 'narrowSymbol',
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 2
    }).format(value);
}

function isGrowthComparisonEnabled() {
    return Boolean(window.App.state && window.App.state.advancedGrowthView);
}

function applyResponsiveChartOptions() {
    if (!chartInstance) return;

    chartInstance.options.layout.padding = getChartLayoutPadding();
    chartInstance.options.scales.x.ticks.maxTicksLimit = getTickLimit();
    chartInstance.options.scales.x.ticks.font = {
        family: "'Inter', sans-serif",
        size: getAxisFontSize()
    };
    chartInstance.options.scales.y.ticks.font = {
        family: "'Inter', sans-serif",
        size: getAxisFontSize()
    };
}

function clearChartInteraction() {
    if (!chartInstance) return;

    chartInstance.setActiveElements([]);
    if (chartInstance.tooltip) {
        chartInstance.tooltip.setActiveElements([], { x: 0, y: 0 });
    }
    chartInstance.update('none');
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
}

function buildComparisonMeta(labels, totalInvested, portfolioValue) {
    const cumulativeInterest = portfolioValue.map((value, index) => Math.max(value - totalInvested[index], 0));
    const yearlyDeposits = totalInvested.map((value, index) => {
        if (index === 0) return Math.max(value, 0);
        return Math.max(value - totalInvested[index - 1], 0);
    });
    const yearlyInterest = cumulativeInterest.map((value, index) => {
        if (index === 0) return 0;
        return Math.max(value - cumulativeInterest[index - 1], 0);
    });
    const historicalInterest = cumulativeInterest.map((value, index) => Math.max(value - yearlyInterest[index], 0));
    const firstOutperformIndex = yearlyInterest.findIndex((value, index) => index > 0 && value > yearlyDeposits[index]);

    return {
        labels,
        totalInvested,
        portfolioValue,
        cumulativeInterest,
        yearlyDeposits,
        yearlyInterest,
        historicalInterest,
        firstOutperformIndex
    };
}

function createTooltipCallbacks() {
    return {
        title(tooltipItems) {
            if (!tooltipItems.length) return '';
            return `${getTranslation('year', 'Year')} ${tooltipItems[0].label}`;
        },
        label(context) {
            if (context.datasetIndex !== 2 || !context.chart.$comparisonMeta) return null;

            const comparisonMeta = context.chart.$comparisonMeta;
            const index = context.dataIndex;
            const lines = [
                `${getTranslation('yearlyDeposit', 'Yearly deposit')}: ${formatCurrencyValue(comparisonMeta.yearlyDeposits[index])}`,
                `${getTranslation('yearlyInterest', 'Interest this year')}: ${formatCurrencyValue(comparisonMeta.yearlyInterest[index])}`,
                `${getTranslation('cumulativeInterest', 'Cumulative interest')}: ${formatCurrencyValue(comparisonMeta.cumulativeInterest[index])}`,
                `${getTranslation('portfolioValue', 'Portfolio value')}: ${formatCurrencyValue(comparisonMeta.portfolioValue[index])}`
            ];

            if (comparisonMeta.firstOutperformIndex === index) {
                lines.push(getTranslation('firstInterestCrossover', 'Interest > deposit'));
            }

            if (!context.chart.data.datasets[3].hidden && context.chart.data.datasets[3].data[index] != null) {
                lines.push(`${getTranslation('benchmarkScenario', 'Benchmark Scenario')}: ${formatCurrencyValue(context.chart.data.datasets[3].data[index])}`);
            }

            return lines;
        }
    };
}

function getLegendItems(chart) {
    const items = [
        { id: 'portfolio', label: getTranslation('portfolioValue', 'Portfolio'), color: CHART_ACCENTS.portfolio, type: 'line' }
    ];

    if (isGrowthComparisonEnabled()) {
        items.push(
            { id: 'invested', label: getTranslation('investedCapital', 'Invested'), color: CHART_ACCENTS.invested, type: 'box' },
            { id: 'history', label: getTranslation('historicalInterest', 'History'), color: CHART_ACCENTS.historicalInterest, type: 'box' },
            { id: 'yearly-interest', label: getTranslation('yearlyInterest', 'This year'), color: CHART_ACCENTS.yearlyInterest, type: 'box' }
        );

        if (chart.$comparisonMeta && chart.$comparisonMeta.firstOutperformIndex > 0) {
            items.push({
                id: 'crossover',
                label: getTranslation('firstInterestCrossover', 'Beats deposit'),
                color: CHART_ACCENTS.crossover,
                type: 'line',
                tooltip: `${getTranslation('yearlyInterest', 'Interest this year')} > ${getTranslation('yearlyDeposit', 'Yearly deposit')}`
            });
        }
    } else {
        items.push({ id: 'invested-line', label: getTranslation('totalInvested', 'Invested'), color: chart.data.datasets[0].borderColor, type: 'dashed' });

        if (!chart.data.datasets[1].hidden) {
            items.push({ id: 'interest', label: getTranslation('compoundInterest', 'Interest'), color: CHART_ACCENTS.compoundInterest, type: 'box' });
        }
    }

    if (!chart.data.datasets[3].hidden) {
        items.push({ id: 'benchmark', label: getTranslation('benchmarkScenario', 'Benchmark'), color: CHART_ACCENTS.benchmark, type: 'dashed' });
    }

    return items;
}

function syncMobileLegendExpansion(shouldRefreshChart = true) {
    if (!chartLegendContainer) return;

    const mobileLegendMode = isMobileLegendMode();
    const legendItems = chartLegendContainer.querySelectorAll('.chart-legend-item--mobile');

    legendItems.forEach((legendItem) => {
        const isExpanded = mobileLegendMode && activeMobileLegendItemId === legendItem.dataset.legendId;
        legendItem.classList.toggle('is-expanded', isExpanded);

        const toggle = legendItem.querySelector('.chart-legend-toggle');
        if (toggle) {
            toggle.setAttribute('aria-expanded', String(isExpanded));
        }
    });

    if (!shouldRefreshChart) return;

    applyResponsiveChartOptions();
    if (chartInstance) {
        chartInstance.update('none');
    }
}

function renderHtmlLegend() {
    if (!chartLegendContainer || !chartInstance) return;

    const items = getLegendItems(chartInstance);
    const mobileLegendMode = isMobileLegendMode();

    if (!mobileLegendMode) {
        activeMobileLegendItemId = null;
    } else if (activeMobileLegendItemId && !items.some(item => item.id === activeMobileLegendItemId)) {
        activeMobileLegendItemId = null;
    }

    chartLegendContainer.replaceChildren();

    items.forEach((item) => {
        const legendItem = document.createElement('span');
        legendItem.className = 'chart-legend-item';
        legendItem.dataset.legendId = item.id;
        const isExpanded = mobileLegendMode && activeMobileLegendItemId === item.id;

        if (mobileLegendMode) {
            legendItem.classList.add('chart-legend-item--mobile');
            if (isExpanded) {
                legendItem.classList.add('is-expanded');
            }
        }

        const marker = document.createElement('span');
        marker.className = `chart-legend-marker chart-legend-marker--${item.type}`;
        marker.style.color = item.color;

        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'chart-legend-toggle';
        toggle.textContent = '⋯';
        toggle.setAttribute('aria-label', item.label);
        toggle.setAttribute('title', item.label);
        toggle.setAttribute('aria-expanded', String(isExpanded));
        toggle.addEventListener('click', () => {
            if (!isMobileLegendMode()) return;

            activeMobileLegendItemId = activeMobileLegendItemId === item.id ? null : item.id;
            syncMobileLegendExpansion();
        });

        const label = document.createElement('span');
        label.className = 'chart-legend-label';

        const labelText = document.createElement('span');
        labelText.className = 'chart-legend-text';
        labelText.textContent = item.label;
        label.appendChild(labelText);

        if (item.tooltip) {
            const info = document.createElement('span');
            info.className = 'tooltip-trigger';
            info.textContent = 'i';
            info.setAttribute('data-tooltip', 'legend');
            info.setAttribute('data-tooltip-content', item.tooltip);
            label.appendChild(info);
        }

        legendItem.appendChild(marker);
        legendItem.appendChild(toggle);
        legendItem.appendChild(label);
        chartLegendContainer.appendChild(legendItem);
    });

    syncMobileLegendExpansion(false);
}

function easeOutQuart(progress) {
    return 1 - Math.pow(1 - progress, 4);
}

function easeInQuart(progress) {
    return Math.pow(progress, 4);
}

function getGrowthComparisonProgress(chart) {
    if (!chart) return 0;
    if (typeof chart.$growthComparisonProgress === 'number') {
        return chart.$growthComparisonProgress;
    }
    return isGrowthComparisonEnabled() ? 1 : 0;
}

function animateGrowthComparisonToggle(enabled) {
    if (!chartInstance) return;

    if (chartInstance.$growthComparisonAnimationFrame) {
        cancelAnimationFrame(chartInstance.$growthComparisonAnimationFrame);
    }

    const startProgress = getGrowthComparisonProgress(chartInstance);
    const endProgress = enabled ? 1 : 0;

    if (Math.abs(endProgress - startProgress) < 0.001) {
        chartInstance.$growthComparisonProgress = endProgress;
        chartInstance.update();
        return;
    }

    const duration = 750;
    const startTime = performance.now();

    const tick = (now) => {
        const rawProgress = Math.min((now - startTime) / duration, 1);
        const easedProgress = enabled ? easeOutQuart(rawProgress) : easeInQuart(rawProgress);

        chartInstance.$growthComparisonProgress = startProgress + ((endProgress - startProgress) * easedProgress);
        chartInstance.update('none');

        if (rawProgress < 1) {
            chartInstance.$growthComparisonAnimationFrame = requestAnimationFrame(tick);
        } else {
            chartInstance.$growthComparisonProgress = endProgress;
            chartInstance.$growthComparisonAnimationFrame = null;
            chartInstance.update('none');
        }
    };

    chartInstance.$growthComparisonAnimationFrame = requestAnimationFrame(tick);
}

function getAnimatedPortfolioPoint(chart, index) {
    const point = chart.getDatasetMeta(2)?.data?.[index];
    if (!point || typeof point.getProps !== 'function') return null;
    return point.getProps(['x', 'y'], false);
}

const growthComparisonPlugin = {
    id: 'growthComparisonPlugin',
    beforeDatasetsDraw(chart) {
        const comparisonProgress = getGrowthComparisonProgress(chart);
        if (!chart.$comparisonMeta || !chart.data.datasets[2].data.length || comparisonProgress <= 0.001) return;

        const { ctx, chartArea, scales: { x, y } } = chart;
        const comparisonMeta = chart.$comparisonMeta;
        const activeIndex = chart.tooltip && chart.tooltip.getActiveElements().length
            ? chart.tooltip.getActiveElements()[0].index
            : -1;
        const spacing = comparisonMeta.labels.length > 1
            ? Math.abs(x.getPixelForValue(1) - x.getPixelForValue(0))
            : 18;
        const baseWidth = Math.max(2, Math.min(8, spacing * 0.18));

        ctx.save();
        ctx.lineCap = 'butt';

        const drawSegment = (xPos, startY, endY, color, width, alphaMultiplier) => {
            if (!Number.isFinite(startY) || !Number.isFinite(endY) || Math.abs(endY - startY) < 0.75) return;
            ctx.globalAlpha = alphaMultiplier;
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.beginPath();
            ctx.moveTo(xPos, startY);
            ctx.lineTo(xPos, endY);
            ctx.stroke();
        };

        for (let index = 1; index < comparisonMeta.labels.length; index += 1) {
            const animatedPoint = getAnimatedPortfolioPoint(chart, index);
            const xPos = animatedPoint?.x ?? x.getPixelForValue(index);
            if (!Number.isFinite(xPos) || xPos < chartArea.left || xPos > chartArea.right) continue;

            const bottomY = y.getPixelForValue(0);
            const finalInvestedTopY = y.getPixelForValue(comparisonMeta.totalInvested[index]);
            const finalHistoryTopY = y.getPixelForValue(comparisonMeta.totalInvested[index] + comparisonMeta.historicalInterest[index]);
            const finalTotalY = y.getPixelForValue(comparisonMeta.portfolioValue[index]);
            const animatedTotalY = animatedPoint?.y ?? finalTotalY;
            const totalTravel = bottomY - finalTotalY;
            const lineProgress = totalTravel > 0 ? Math.min(Math.max((bottomY - animatedTotalY) / totalTravel, 0), 1) : 1;
            const progress = Math.min(lineProgress, comparisonProgress);
            const investedTopY = bottomY - ((bottomY - finalInvestedTopY) * progress);
            const historyTopY = bottomY - ((bottomY - finalHistoryTopY) * progress);
            const totalY = bottomY - ((bottomY - finalTotalY) * progress);
            const emphasized = activeIndex === index || comparisonMeta.firstOutperformIndex === index;
            const strokeWidth = baseWidth + (emphasized ? 1.4 : 0);
            const fadeBase = activeIndex === -1 || emphasized ? 0.95 : 0.42;
            const fade = fadeBase * progress;

            drawSegment(xPos, bottomY, investedTopY, CHART_ACCENTS.invested, strokeWidth, fade * 0.72);
            drawSegment(xPos, investedTopY, historyTopY, CHART_ACCENTS.historicalInterest, strokeWidth, fade * 0.88);
            drawSegment(xPos, historyTopY, totalY, CHART_ACCENTS.yearlyInterest, strokeWidth, fade);
        }

        ctx.restore();
    },
    afterDatasetsDraw(chart) {
        const comparisonProgress = getGrowthComparisonProgress(chart);
        if (!chart.$comparisonMeta || chart.$comparisonMeta.firstOutperformIndex < 1 || comparisonProgress <= 0.001) return;

        const comparisonMeta = chart.$comparisonMeta;
        const index = comparisonMeta.firstOutperformIndex;
        const { ctx, chartArea, scales: { x, y } } = chart;
        const animatedPoint = getAnimatedPortfolioPoint(chart, index);
        const xPos = animatedPoint?.x ?? x.getPixelForValue(index);
        const bottomY = y.getPixelForValue(0);
        const finalY = y.getPixelForValue(comparisonMeta.portfolioValue[index]);
        const topY = bottomY - ((bottomY - finalY) * comparisonProgress);
        const markerTopY = Math.max(chartArea.top + 6, topY + 3);
        const markerBottomY = Math.min(chartArea.bottom - 6, bottomY - 6);

        if (!Number.isFinite(xPos) || !Number.isFinite(markerTopY) || !Number.isFinite(markerBottomY) || markerBottomY <= markerTopY) return;

        ctx.save();
        ctx.globalAlpha = 0.9 * comparisonProgress;
        ctx.strokeStyle = CHART_ACCENTS.crossover;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(xPos, markerTopY);
        ctx.lineTo(xPos, markerBottomY);
        ctx.stroke();

        ctx.restore();
    }
};

window.App.initChart = function (canvasContext, isDarkMode = true, currency = 'USD') {
    currentCurrency = currency;
    chartLegendContainer = document.getElementById('chart-overlay-legend');
    const theme = isDarkMode ? CHART_THEME.dark : CHART_THEME.light;

    chartInstance = new Chart(canvasContext, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Total Invested',
                    data: [],
                    borderColor: theme.investedLineColor,
                    backgroundColor: 'rgba(156, 163, 175, 0.2)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Compound Interest',
                    data: [],
                    borderColor: CHART_ACCENTS.compoundInterest,
                    backgroundColor: 'rgba(65, 48, 163, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    fill: false,
                    tension: 0.4,
                    hidden: true
                },
                {
                    label: 'Potential Portfolio Value',
                    data: [],
                    borderColor: CHART_ACCENTS.portfolio,
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Benchmark Scenario',
                    data: [],
                    borderColor: CHART_ACCENTS.benchmark,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [2, 2],
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    fill: false,
                    tension: 0.4,
                    hidden: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: getChartLayoutPadding()
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                tooltip: {
                    backgroundColor: theme.tooltipBg,
                    titleColor: theme.tooltipText,
                    bodyColor: theme.tooltipText,
                    borderColor: theme.tooltipBorder,
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: createTooltipCallbacks()
                },
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        maxTicksLimit: getTickLimit(),
                        color: theme.textColor,
                        font: {
                            family: "'Inter', sans-serif",
                            size: getAxisFontSize()
                        },
                        callback(value) {
                            const label = this.getLabelForValue(value);
                            return isCompactMobileChart() ? label : `${getTranslation('year', 'Year')} ${label}`;
                        }
                    }
                },
                y: {
                    grid: {
                        color: theme.gridColor,
                        drawBorder: false
                    },
                    ticks: {
                        color: theme.textColor,
                        callback(value) {
                            return formatCompactCurrency(value, currentCurrency);
                        },
                        font: {
                            family: "'Inter', sans-serif",
                            size: getAxisFontSize()
                        }
                    },
                    stacked: false,
                    beginAtZero: true
                }
            },
            animation: {
                duration: 750,
                easing: 'easeOutQuart'
            }
        },
        plugins: [growthComparisonPlugin]
    });
    chartInstance.$growthComparisonProgress = isGrowthComparisonEnabled() ? 1 : 0;

    const chartCanvas = canvasContext.canvas;
    chartCanvas.addEventListener('touchend', () => {
        requestAnimationFrame(clearChartInteraction);
    }, { passive: true });
    chartCanvas.addEventListener('touchcancel', clearChartInteraction, { passive: true });
    chartCanvas.addEventListener('mouseleave', clearChartInteraction);
    chartCanvas.addEventListener('pointerleave', clearChartInteraction);
    window.addEventListener('scroll', clearChartInteraction, { passive: true });
    renderHtmlLegend();
    applyResponsiveChartOptions();
    chartInstance.update('none');
};

window.App.updateChart = function (labels, totalInvested, portfolioValue, benchmarkValue = null) {
    if (!chartInstance) return;

    const t = window.App.currentTranslation || (window.App.translations && window.App.translations.en) || {
        portfolioValue: 'Potential Portfolio Value',
        totalInvested: 'Total Invested',
        benchmarkScenario: 'Benchmark Scenario',
        compoundInterest: 'Compound Interest'
    };
    const comparisonMeta = buildComparisonMeta(labels, totalInvested, portfolioValue);

    chartInstance.$comparisonMeta = comparisonMeta;
    chartInstance.data.labels = labels;

    chartInstance.data.datasets[0].data = totalInvested;
    chartInstance.data.datasets[0].label = t.totalInvested;
    chartInstance.data.datasets[2].data = portfolioValue;
    chartInstance.data.datasets[2].label = t.portfolioValue;
    chartInstance.data.datasets[1].label = t.compoundInterest || 'Compound Interest';
    chartInstance.data.datasets[1].data = [];
    chartInstance.data.datasets[1].hidden = true;

    if (benchmarkValue) {
        chartInstance.data.datasets[3].data = benchmarkValue;
        chartInstance.data.datasets[3].hidden = false;
        chartInstance.data.datasets[3].label = t.benchmarkScenario;
    } else {
        chartInstance.data.datasets[3].data = [];
        chartInstance.data.datasets[3].hidden = true;
    }

    renderHtmlLegend();
    applyResponsiveChartOptions();
    chartInstance.update();
};

window.App.updateChartTranslations = function (translations) {
    if (!chartInstance) return;

    chartInstance.data.datasets[0].label = translations.totalInvested;
    chartInstance.data.datasets[1].label = translations.compoundInterest;
    chartInstance.data.datasets[2].label = translations.portfolioValue;
    chartInstance.data.datasets[3].label = translations.benchmarkScenario;
    chartInstance.options.plugins.tooltip.callbacks = createTooltipCallbacks();

    renderHtmlLegend();
    applyResponsiveChartOptions();
    chartInstance.update();
};

window.App.updateChartTheme = function (isDarkMode) {
    if (!chartInstance) return;

    const theme = isDarkMode ? CHART_THEME.dark : CHART_THEME.light;

    chartInstance.options.plugins.tooltip.backgroundColor = theme.tooltipBg;
    chartInstance.options.plugins.tooltip.titleColor = theme.tooltipText;
    chartInstance.options.plugins.tooltip.bodyColor = theme.tooltipText;
    chartInstance.options.plugins.tooltip.borderColor = theme.tooltipBorder;
    chartInstance.options.scales.x.ticks.color = theme.textColor;
    chartInstance.options.scales.y.ticks.color = theme.textColor;
    chartInstance.options.scales.y.grid.color = theme.gridColor;
    chartInstance.data.datasets[0].borderColor = theme.investedLineColor;

    renderHtmlLegend();
    applyResponsiveChartOptions();
    chartInstance.update();
};

window.App.updateChartCurrency = function (currency) {
    if (!chartInstance) return;

    currentCurrency = currency;
    chartInstance.options.scales.y.ticks.callback = function (value) {
        return formatCompactCurrency(value, currentCurrency);
    };
    chartInstance.options.plugins.tooltip.callbacks = createTooltipCallbacks();

    renderHtmlLegend();
    applyResponsiveChartOptions();
    chartInstance.update();
};

window.App.setGrowthVisualizationEnabled = function (enabled) {
    if (!chartInstance) return;

    renderHtmlLegend();
    applyResponsiveChartOptions();
    animateGrowthComparisonToggle(enabled);
};

window.addEventListener('resize', () => {
    if (chartInstance) {
        applyResponsiveChartOptions();
        chartInstance.update('none');
    }
});
