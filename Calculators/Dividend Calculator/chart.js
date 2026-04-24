///------------2026 Pomerancee. All rights reserved.----------------\\\
///------------https://creativecommons.org/licenses/by-nc-sa/4.0/---\\\
///------------Licensed under CC BY-NC-SA 4.0------------------------\\\

window.DividendCalc = window.DividendCalc || {};

let pieChartInstance = null;
let barChartInstance = null;

const CHART_COLORS = {
    purple: '#a855f7',           // Purple for reinvested dividends
    amber: '#f59e0b',            // Amber/gold for original investment
    green: '#10b981',            // Green for contributions
    purpleOutline: '#9333ea',
    amberOutline: '#d97706',
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
                borderColor: '#0f172a',
                borderWidth: 3,
                hoverBorderColor: '#ffffff',
                hoverBorderWidth: 4,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 1,
            cutout: '65%', // Makes it a donut with larger hole
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1500,
                easing: 'easeInOutQuart'
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        color: CHART_COLORS.textColor,
                        padding: 20,
                        font: {
                            size: 13,
                            family: "'Inter', sans-serif",
                            weight: '600'
                        },
                        usePointStyle: true,
                        pointStyle: 'circle',
                        boxWidth: 12,
                        boxHeight: 12,
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const value = data.datasets[0].data[i];
                                    const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                    
                                    return {
                                        text: `${label} (${percentage}%)`,
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
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: CHART_COLORS.tooltipText,
                    bodyColor: CHART_COLORS.tooltipText,
                    borderColor: 'rgba(217, 70, 239, 0.5)',
                    borderWidth: 2,
                    padding: 16,
                    cornerRadius: 8,
                    displayColors: true,
                    boxWidth: 12,
                    boxHeight: 12,
                    boxPadding: 6,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: $${value.toLocaleString()} (${percentage}%)`;
                        }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                intersect: true
            }
        },
        plugins: [{
            id: 'centerText',
            beforeDraw: function(chart) {
                const ctx = chart.ctx;
                const chartArea = chart.chartArea;
                
                // Calculate center of the chart area (where the donut is)
                const centerX = (chartArea.left + chartArea.right) / 2;
                const centerY = (chartArea.top + chartArea.bottom) / 2;
                
                // Calculate total value
                const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                
                // Responsive font sizes based on screen width
                const isMobile = window.innerWidth <= 480;
                const labelFontSize = isMobile ? 10 : 14;
                const valueFontSize = isMobile ? 18 : 28;
                const labelOffset = isMobile ? 15 : 20;
                const valueOffset = isMobile ? 8 : 10;
                
                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Draw "Total" label
                ctx.fillStyle = 'rgba(156, 163, 175, 0.8)';
                ctx.font = `bold ${labelFontSize}px Inter, sans-serif`;
                ctx.fillText('TOTAL', centerX, centerY - labelOffset);
                
                // Draw total value
                ctx.fillStyle = '#ffffff';
                ctx.font = `bold ${valueFontSize}px Inter, sans-serif`;
                const formattedTotal = '$' + total.toLocaleString();
                ctx.fillText(formattedTotal, centerX, centerY + valueOffset);
                
                ctx.restore();
            },
            id: 'segmentPercentages',
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
                            
                            // Responsive font size based on screen width
                            const isMobile = window.innerWidth <= 480;
                            const percentageFontSize = isMobile ? 11 : 14;
                            
                            ctx.save();
                            ctx.fillStyle = '#ffffff';
                            ctx.font = `bold ${percentageFontSize}px Inter, sans-serif`;
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            
                            // Add text shadow for better readability
                            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                            ctx.shadowBlur = 4;
                            ctx.shadowOffsetX = 0;
                            ctx.shadowOffsetY = 2;
                            
                            ctx.fillText(percentage + '%', x, y);
                            ctx.restore();
                        });
                    }
                });
            },
            id: 'segmentGlow',
            beforeDatasetsDraw: function(chart) {
                const ctx = chart.ctx;
                const meta = chart.getDatasetMeta(0);
                
                if (!meta || !meta.data) return;
                
                // Add glow effect to segments
                meta.data.forEach((element, index) => {
                    const color = chart.data.datasets[0].backgroundColor[index];
                    
                    ctx.save();
                    ctx.shadowColor = color;
                    ctx.shadowBlur = 20;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                    ctx.restore();
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

    // Get translations
    const t = window.DividendCalc && window.DividendCalc.translations && window.DividendCalc.translations[window.currentLanguage || 'en']
        ? window.DividendCalc.translations[window.currentLanguage || 'en']
        : window.DividendCalc.translations.en;

    // Determine which segments to show based on values
    const hasReinvested = reinvestedAmount > 0;
    const hasContributions = contributionsAmount > 0;

    if (hasContributions && hasReinvested) {
        // Show all 3 segments
        pieChartInstance.data.labels = [
            t.originalInvestment || 'Original Investment',
            t.contributions || 'Contributions',
            t.reinvestedDividends || 'Reinvested Dividends'
        ];
        pieChartInstance.data.datasets[0].data = [originalInvestment, contributionsAmount, reinvestedAmount];
        pieChartInstance.data.datasets[0].backgroundColor = [
            CHART_COLORS.amber,      // Original Investment
            CHART_COLORS.green,      // Contributions
            CHART_COLORS.purple      // Reinvested Dividends
        ];
    } else if (hasContributions && !hasReinvested) {
        // Show only Original Investment and Contribution
        pieChartInstance.data.labels = [
            t.originalInvestment || 'Original Investment',
            t.contributions || 'Contributions'
        ];
        pieChartInstance.data.datasets[0].data = [originalInvestment, contributionsAmount];
        pieChartInstance.data.datasets[0].backgroundColor = [
            CHART_COLORS.amber,      // Original Investment
            CHART_COLORS.green       // Contributions
        ];
    } else {
        // Show only Original Investment and Reinvested Dividends
        pieChartInstance.data.labels = [
            t.originalInvestment || 'Original Investment',
            t.reinvestedDividends || 'Reinvested Dividends'
        ];
        pieChartInstance.data.datasets[0].data = [originalInvestment, reinvestedAmount];
        pieChartInstance.data.datasets[0].backgroundColor = [
            CHART_COLORS.amber,
            CHART_COLORS.purple
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

    // Animation state for the arrow
    let arrowAnimationProgress = 0;
    let arrowAnimationStartTime = null;
    const arrowAnimationDuration = 1500; // 1.5 seconds for arrow animation
    const arrowAnimationDelay = 300; // Delay after bars finish (in ms)
    let shouldAnimate = false; // Control whether animation should start
    let hasAnimated = false; // Track if animation has already run

    barChartInstance = new Chart(canvasContext, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Annual Dividend Income',
                    data: [],
                    backgroundColor: CHART_COLORS.purple,
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
                    borderColor: 'transparent', // Will use custom gradient
                    backgroundColor: 'transparent',
                    borderWidth: 3,
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
            aspectRatio: 1,
            animation: {
                duration: function() {
                    // Only animate if shouldAnimate is true
                    return shouldAnimate ? 1200 : 0;
                },
                easing: 'easeInOutCubic',
                onComplete: function(animation) {
                    // Start arrow animation after bars complete
                    if (shouldAnimate && !arrowAnimationStartTime) {
                        arrowAnimationStartTime = Date.now() + arrowAnimationDelay;
                        animateArrow(animation.chart);
                    }
                }
            },
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
                            const t = window.DividendCalc && window.DividendCalc.translations && window.DividendCalc.translations[window.currentLanguage || 'en']
                                ? window.DividendCalc.translations[window.currentLanguage || 'en']
                                : window.DividendCalc.translations.en;
                            const yearLabel = t.year || 'Year';
                            return `${yearLabel} ${tooltipItems[0].label}`;
                        },
                        label: function(context) {
                            if (context.datasetIndex === 0) {
                                const t = window.DividendCalc && window.DividendCalc.translations && window.DividendCalc.translations[window.currentLanguage || 'en']
                                    ? window.DividendCalc.translations[window.currentLanguage || 'en']
                                    : window.DividendCalc.translations.en;
                                const dividendIncomeLabel = t.dividendIncome || 'Dividend Income';
                                return `${dividendIncomeLabel}: ${context.parsed.y.toLocaleString()}`;
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
            id: 'gradientTrendLine',
            beforeDatasetsDraw: function(chart) {
                const ctx = chart.ctx;
                const dataset = chart.data.datasets[1]; // Trend line dataset
                const meta = chart.getDatasetMeta(1);
                
                if (!meta || !meta.data || meta.data.length < 2) return;
                
                // Get current arrow animation progress
                const currentProgress = arrowAnimationProgress;
                
                if (currentProgress <= 0) return; // Don't draw if animation hasn't started
                
                // Create gradient from purple/magenta to orange/amber
                const firstPoint = meta.data[0];
                const lastPoint = meta.data[meta.data.length - 1];
                
                const gradient = ctx.createLinearGradient(
                    firstPoint.x, 
                    firstPoint.y, 
                    lastPoint.x, 
                    lastPoint.y
                );
                
                gradient.addColorStop(0, 'rgba(168, 85, 247, 0.7)');    // Purple start
                gradient.addColorStop(0.3, 'rgba(217, 70, 239, 0.85)'); // Magenta
                gradient.addColorStop(0.7, 'rgba(245, 158, 11, 0.9)');  // Amber
                gradient.addColorStop(1, 'rgba(251, 191, 36, 1)');      // Gold end
                
                // Draw the smooth curved line with animation
                ctx.save();
                ctx.strokeStyle = gradient;
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                
                // Add glow effect
                ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
                ctx.shadowBlur = 12;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                
                // Build the complete path
                const points = meta.data;
                
                // Calculate the clip position based on progress
                const totalWidth = lastPoint.x - firstPoint.x;
                const clipX = firstPoint.x + (totalWidth * currentProgress);
                
                // Apply clipping rectangle
                ctx.save();
                ctx.beginPath();
                ctx.rect(0, 0, clipX, chart.height);
                ctx.clip();
                
                // Draw the full path (clipped)
                ctx.beginPath();
                ctx.moveTo(points[0].x, points[0].y);
                
                for (let i = 1; i < points.length; i++) {
                    const prevPoint = points[i - 1];
                    const currentPoint = points[i];
                    const midX = (prevPoint.x + currentPoint.x) / 2;
                    const midY = (prevPoint.y + currentPoint.y) / 2;
                    
                    ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, midX, midY);
                    
                    if (i === points.length - 1) {
                        ctx.quadraticCurveTo(midX, midY, currentPoint.x, currentPoint.y);
                    }
                }
                
                ctx.stroke();
                ctx.restore();
                ctx.restore();
            },
            afterDatasetsDraw: function(chart) {
                const ctx = chart.ctx;
                const dataset = chart.data.datasets[1]; // Trend line dataset
                const meta = chart.getDatasetMeta(1);
                
                if (!meta || !meta.data || meta.data.length < 2) return;
                
                // Only draw arrowhead after line is fully drawn
                if (arrowAnimationProgress < 1) return;
                
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
                
                // Arrow properties - smaller and sharper
                const arrowLength = 12;
                
                ctx.save();
                
                // Create gradient for arrowhead
                const arrowGradient = ctx.createLinearGradient(
                    x2 - arrowLength, y2,
                    x2, y2
                );
                arrowGradient.addColorStop(0, 'rgba(245, 158, 11, 0.9)');
                arrowGradient.addColorStop(1, 'rgba(251, 191, 36, 1)');
                
                ctx.fillStyle = arrowGradient;
                
                // Add glow to arrowhead
                ctx.shadowColor = 'rgba(245, 158, 11, 0.8)';
                ctx.shadowBlur = 16;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                
                // Draw sharper, more refined arrowhead
                ctx.beginPath();
                ctx.moveTo(x2, y2);
                ctx.lineTo(
                    x2 - arrowLength * Math.cos(angle - Math.PI / 7),
                    y2 - arrowLength * Math.sin(angle - Math.PI / 7)
                );
                ctx.lineTo(
                    x2 - arrowLength * 0.6 * Math.cos(angle),
                    y2 - arrowLength * 0.6 * Math.sin(angle)
                );
                ctx.lineTo(
                    x2 - arrowLength * Math.cos(angle + Math.PI / 7),
                    y2 - arrowLength * Math.sin(angle + Math.PI / 7)
                );
                ctx.closePath();
                ctx.fill();
                
                // Add subtle outline to arrowhead
                ctx.shadowBlur = 0;
                ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
                ctx.lineWidth = 1;
                ctx.stroke();
                
                ctx.restore();
            }
        }]
    });

    // Arrow animation function
    function animateArrow(chart) {
        const now = Date.now();
        
        if (now < arrowAnimationStartTime) {
            // Still in delay period
            requestAnimationFrame(() => animateArrow(chart));
            return;
        }
        
        const elapsed = now - arrowAnimationStartTime;
        const rawProgress = Math.min(elapsed / arrowAnimationDuration, 1);
        
        // Easing function for smooth animation (easeInOutCubic)
        arrowAnimationProgress = rawProgress < 0.5
            ? 4 * rawProgress * rawProgress * rawProgress
            : 1 - Math.pow(-2 * rawProgress + 2, 3) / 2;
        
        // Redraw chart
        chart.draw();
        
        // Continue animation if not complete
        if (rawProgress < 1) {
            requestAnimationFrame(() => animateArrow(chart));
        }
    }

    // Set up Intersection Observer for scroll-triggered animation
    const barChartContainer = document.querySelector('.bar-chart-box');
    if (barChartContainer && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // Trigger animation when chart becomes visible and hasn't animated yet
                if (entry.isIntersecting && !hasAnimated) {
                    hasAnimated = true;
                    shouldAnimate = true;
                    // Reset animation state
                    arrowAnimationProgress = 0;
                    arrowAnimationStartTime = null;
                    // Trigger chart update to start animation
                    if (barChartInstance && barChartInstance.data.datasets[0].data.length > 0) {
                        barChartInstance.update('active');
                    }
                }
            });
        }, {
            threshold: 0.3, // Trigger when 30% of the chart is visible
            rootMargin: '0px'
        });

        observer.observe(barChartContainer);
    } else {
        // If no Intersection Observer support, animate immediately
        shouldAnimate = true;
    }

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
    
    // Reset animation by updating with animation enabled
    barChartInstance.update('active');
};

/**
 * Shows or hides the pie chart container
 */
window.DividendCalc.togglePieChart = function(show) {
    const pieChartContainer = document.getElementById('pie-chart-container');
    if (pieChartContainer) {
        if (show) {
            pieChartContainer.classList.remove('fade-out');
        } else {
            pieChartContainer.classList.add('fade-out');
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
            barChartContainer.classList.remove('fade-out');
        } else {
            barChartContainer.classList.add('fade-out');
        }
    }
};
