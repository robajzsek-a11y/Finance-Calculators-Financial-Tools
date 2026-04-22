let currencyChart = null;
let chartCanvas = null;
let chartData = null;
let hoveredCandleIndex = -1;
let tooltip = null;

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

// Generate OHLC data from rates
function generateOHLC(rates) {
    return rates.map((rate, index) => {
        const variation = rate * 0.008; // 0.8% variation for realistic wicks
        
        const open = index > 0 ? rates[index - 1] : rate;
        const close = rate;
        
        // Add randomness to high/low for realistic wicks
        const high = Math.max(open, close) + variation * (0.3 + Math.random() * 0.7);
        const low = Math.min(open, close) - variation * (0.3 + Math.random() * 0.7);
        
        return { open, high, low, close };
    });
}

// Draw candlestick chart
function drawCandlesticks(canvas, ohlcData, labels, minValue, maxValue, animationProgress = 1, highlightIndex = -1) {
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Chart dimensions (use display size, not canvas size)
    const padding = { top: 20, right: 50, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // Draw subtle grid lines
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.06)';
    ctx.lineWidth = 1;
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
        const y = padding.top + (chartHeight / gridLines) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartWidth, y);
        ctx.stroke();
    }
    
    // Calculate candlestick positions
    const candleCount = ohlcData.length;
    const candleSpacing = chartWidth / candleCount;
    const candleWidth = Math.min(8, candleSpacing * 0.6);
    const wickWidth = 2;
    
    const valueRange = maxValue - minValue;
    const scaleY = (value) => {
        // Higher values should be at the top (lower Y coordinate)
        return padding.top + chartHeight * (1 - (value - minValue) / valueRange);
    };
    
    const baselineY = padding.top + chartHeight;
    
    // Draw candlesticks with animation
    ohlcData.forEach((candle, index) => {
        // Stagger animation for each candle
        const candleDelay = index / candleCount;
        const candleProgress = Math.max(0, Math.min(1, (animationProgress - candleDelay) * 2));
        
        if (candleProgress <= 0) return;
        
        const x = padding.left + candleSpacing * index + candleSpacing / 2;
        
        const highY = scaleY(candle.high);
        const lowY = scaleY(candle.low);
        const openY = scaleY(candle.open);
        const closeY = scaleY(candle.close);
        
        // Animate from baseline
        const animatedHighY = baselineY - (baselineY - highY) * candleProgress;
        const animatedLowY = baselineY - (baselineY - lowY) * candleProgress;
        const animatedOpenY = baselineY - (baselineY - openY) * candleProgress;
        const animatedCloseY = baselineY - (baselineY - closeY) * candleProgress;
        
        const isBullish = candle.close >= candle.open;
        const bodyTop = Math.min(animatedOpenY, animatedCloseY);
        const bodyBottom = Math.max(animatedOpenY, animatedCloseY);
        const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
        
        const isHighlighted = index === highlightIndex;
        
        // Fade in effect
        ctx.globalAlpha = candleProgress * (isHighlighted ? 1 : 0.85);
        
        // Draw wick (high-low line)
        ctx.strokeStyle = isHighlighted ? '#FCD34D' : '#FBBF24';
        ctx.lineWidth = isHighlighted ? wickWidth + 1 : wickWidth;
        ctx.beginPath();
        ctx.moveTo(x, animatedHighY);
        ctx.lineTo(x, animatedLowY);
        ctx.stroke();
        
        // Draw body with glow for bullish
        if (isBullish) {
            // Bullish - filled bright amber with glow
            ctx.shadowColor = isHighlighted ? 'rgba(252, 211, 77, 0.8)' : 'rgba(251, 191, 36, 0.6)';
            ctx.shadowBlur = isHighlighted ? 8 * candleProgress : 4 * candleProgress;
            ctx.fillStyle = isHighlighted ? '#FCD34D' : '#FBBF24';
            ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
            ctx.shadowBlur = 0;
        } else {
            // Bearish - outlined or dark transparent fill
            ctx.fillStyle = isHighlighted ? 'rgba(252, 211, 77, 0.3)' : 'rgba(251, 191, 36, 0.2)';
            ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
            
            // Add outline
            ctx.strokeStyle = isHighlighted ? '#FCD34D' : '#FBBF24';
            ctx.lineWidth = isHighlighted ? 2 : 1.5;
            ctx.strokeRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
        }
        
        ctx.globalAlpha = 1;
    });
    
    // Draw X-axis labels
    ctx.fillStyle = 'rgba(251, 191, 36, 0.6)';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    
    const labelStep = Math.ceil(candleCount / 6);
    labels.forEach((label, index) => {
        if (index % labelStep === 0 || index === labels.length - 1) {
            const x = padding.left + candleSpacing * index + candleSpacing / 2;
            ctx.fillText(label, x, height - padding.bottom + 20);
        }
    });
    
    // Draw Y-axis labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= gridLines; i++) {
        const value = minValue + (valueRange / gridLines) * (gridLines - i);
        const y = padding.top + (chartHeight / gridLines) * i;
        ctx.fillText(value.toFixed(4), padding.left - 10, y + 4);
    }
}

export function initChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    chartCanvas = canvas;
    
    // Create tooltip element
    tooltip = document.createElement('div');
    tooltip.className = 'chart-tooltip';
    tooltip.style.cssText = `
        position: absolute;
        background: rgba(30, 41, 59, 0.95);
        border: 1px solid rgba(251, 191, 36, 0.3);
        border-radius: 0.5rem;
        padding: 0.75rem;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s;
        font-size: 0.85rem;
        color: #f9fafb;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    canvas.parentElement.style.position = 'relative';
    canvas.parentElement.appendChild(tooltip);
    
    // Set canvas size to match container
    const container = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    
    // Draw empty state
    ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Loading chart...', rect.width / 2, rect.height / 2);
    
    // Add mouse move handler for tooltips
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    
    // Handle resize
    window.addEventListener('resize', () => {
        if (chartData) {
            const newRect = container.getBoundingClientRect();
            canvas.width = newRect.width * dpr;
            canvas.height = newRect.height * dpr;
            canvas.style.width = newRect.width + 'px';
            canvas.style.height = newRect.height + 'px';
            ctx.scale(dpr, dpr);
            
            drawCandlesticks(
                canvas,
                chartData.ohlc,
                chartData.labels,
                chartData.min,
                chartData.max,
                1,
                hoveredCandleIndex
            );
        }
    });
}

function handleMouseMove(event) {
    if (!chartData || !chartCanvas) return;
    
    const rect = chartCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Chart dimensions
    const padding = { top: 20, right: 50, bottom: 40, left: 50 };
    const chartWidth = rect.width - padding.left - padding.right;
    
    // Calculate which candle is hovered
    const candleCount = chartData.ohlc.length;
    const candleSpacing = chartWidth / candleCount;
    
    const relativeX = x - padding.left;
    const candleIndex = Math.floor(relativeX / candleSpacing);
    
    if (candleIndex >= 0 && candleIndex < candleCount && x >= padding.left && x <= rect.width - padding.right) {
        if (hoveredCandleIndex !== candleIndex) {
            hoveredCandleIndex = candleIndex;
            
            // Redraw with highlight
            drawCandlesticks(
                chartCanvas,
                chartData.ohlc,
                chartData.labels,
                chartData.min,
                chartData.max,
                1,
                hoveredCandleIndex
            );
            
            // Show tooltip
            const candle = chartData.ohlc[candleIndex];
            const label = chartData.labels[candleIndex];
            
            tooltip.innerHTML = `
                <div style="color: #FBBF24; font-weight: 600; margin-bottom: 0.25rem;">${label}</div>
                <div style="display: grid; grid-template-columns: auto auto; gap: 0.25rem 0.75rem; font-size: 0.8rem;">
                    <span style="color: #9ca3af;">Open:</span><span>${candle.open.toFixed(4)}</span>
                    <span style="color: #9ca3af;">High:</span><span style="color: #10b981;">${candle.high.toFixed(4)}</span>
                    <span style="color: #9ca3af;">Low:</span><span style="color: #ef4444;">${candle.low.toFixed(4)}</span>
                    <span style="color: #9ca3af;">Close:</span><span>${candle.close.toFixed(4)}</span>
                </div>
            `;
            
            // Position tooltip
            const tooltipX = Math.min(x + 15, rect.width - tooltip.offsetWidth - 10);
            const tooltipY = Math.max(10, y - tooltip.offsetHeight - 10);
            
            tooltip.style.left = tooltipX + 'px';
            tooltip.style.top = tooltipY + 'px';
            tooltip.style.opacity = '1';
        }
    } else {
        handleMouseLeave();
    }
}

function handleMouseLeave() {
    if (hoveredCandleIndex !== -1) {
        hoveredCandleIndex = -1;
        
        if (chartData && chartCanvas) {
            drawCandlesticks(
                chartCanvas,
                chartData.ohlc,
                chartData.labels,
                chartData.min,
                chartData.max,
                1,
                -1
            );
        }
        
        if (tooltip) {
            tooltip.style.opacity = '0';
        }
    }
}

export function clearChart() {
    if (!chartCanvas) return;
    
    const ctx = chartCanvas.getContext('2d');
    const rect = chartCanvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    chartData = null;
}

export function syncChartLocale() {
    // Re-render with updated locale if data exists
    if (chartData) {
        chartData.labels = chartData.dates.map(formatChartLabel);
        drawCandlesticks(
            chartCanvas,
            chartData.ohlc,
            chartData.labels,
            chartData.min,
            chartData.max,
            1,
            hoveredCandleIndex
        );
    }
}

export function updateChart(historicalData, targetCurrency) {
    if (!chartCanvas || !historicalData || !historicalData.rates) {
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
    const ohlc = generateOHLC(rates);
    
    // Calculate min/max from OHLC data
    const allValues = ohlc.flatMap(c => [c.high, c.low]);
    const minRate = Math.min(...allValues);
    const maxRate = Math.max(...allValues);
    const spread = Math.max(maxRate - minRate, maxRate * 0.02, 0.001);

    chartData = {
        dates,
        labels: dates.map(formatChartLabel),
        ohlc,
        min: Math.max(0, minRate - spread * 0.15),
        max: maxRate + spread * 0.15
    };

    // Animate chart drawing
    const duration = 1200; // 1.2 seconds
    const startTime = Date.now();
    
    const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeProgress = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        drawCandlesticks(
            chartCanvas,
            chartData.ohlc,
            chartData.labels,
            chartData.min,
            chartData.max,
            easeProgress
        );
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };
    
    animate();

    const currentRate = rates[rates.length - 1];

    return {
        min: minRate,
        max: maxRate,
        current: currentRate
    };
}
