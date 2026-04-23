///------------2026 Pomerancee. All rights reserved.----------------\\\
///------------https://creativecommons.org/licenses/by-nc-sa/4.0/---\\\
///------------Licensed under CC BY-NC-SA 4.0------------------------\\\

// Access global dependencies
const { calculateDividends, calculateYield, calculateDividendFromYield, initPieChart, initBarChart, updatePieChart, updateBarChart, togglePieChart, toggleBarChart, currencies, getFlagUrl, getCurrencySymbol } = window.DividendCalc;

/*---------DOM ELEMENT SELECTORS------------*/

// Input Fields
const numSharesInput = document.getElementById('num-shares');
const pricePerShareInput = document.getElementById('price-per-share');
const annualDividendInput = document.getElementById('annual-dividend');
const dividendYieldInput = document.getElementById('dividend-yield');

// Toggle Switches
const reinvestToggle = document.getElementById('reinvest-toggle');
const contributionsToggle = document.getElementById('contributions-toggle');

// Contribution Options
const contributionOptions = document.getElementById('contribution-options');
const frequencyButtons = document.querySelectorAll('.freq-btn');
const contributionAmountInput = document.getElementById('contribution-amount');

// Display Elements
const annualIncomeDisplay = document.getElementById('annual-income');
const monthlyIncomeDisplay = document.getElementById('monthly-income');
const annualLabel = document.getElementById('annual-label');
const portfolioValueDisplay = document.getElementById('portfolio-value');
const portfolioYearsDisplay = document.getElementById('portfolio-years');
const portfolioDividendValueDisplay = document.getElementById('portfolio-dividend-value');

// Time Range Buttons
const timeButtons = document.querySelectorAll('.time-btn');

// Chart Canvases
const pieChartCanvas = document.getElementById('pieChart');
const barChartCanvas = document.getElementById('barChart');

// State
let state = {
    numShares: 100,
    pricePerShare: 50,
    annualDividend: 2.50,
    dividendYield: 5.00,
    reinvest: true,
    addContributions: false,
    contributionFreq: 'monthly',
    contributionAmount: 100,
    selectedYears: 10,
    lastUpdatedField: 'dividend', // Track which field was last updated
    currency: 'USD',
    currencySymbol: '$'
};

let pieChart = null;
let barChart = null;

/**
 * Initializes the application
 */
function init() {
    // Initialize charts
    pieChart = initPieChart(pieChartCanvas.getContext('2d'));
    barChart = initBarChart(barChartCanvas.getContext('2d'));

    // Set initial DOM values from state
    syncDOMWithState();

    // Attach event listeners
    attachEventListeners();

    // Initial calculation
    calculateAndRender();

    // Initialize GitHub stars
    if (window.fetchGitHubStars) {
        window.fetchGitHubStars('robajzsek-a11y', 'Investing-Calculator');
    }
}

/**
 * Syncs DOM elements with current state
 */
function syncDOMWithState() {
    numSharesInput.value = state.numShares;
    pricePerShareInput.value = state.pricePerShare;
    annualDividendInput.value = state.annualDividend.toFixed(2);
    dividendYieldInput.value = state.dividendYield.toFixed(2);
    reinvestToggle.checked = state.reinvest;
    contributionsToggle.checked = state.addContributions;
    contributionAmountInput.value = state.contributionAmount;

    // Show/hide contribution options
    if (state.addContributions) {
        contributionOptions.classList.add('expanded');
    } else {
        contributionOptions.classList.remove('expanded');
    }

    // Set active frequency button
    frequencyButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.freq === state.contributionFreq);
    });

    // Set active time button
    timeButtons.forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.years) === state.selectedYears);
    });
}

/**
 * Attaches event listeners to inputs
 */
function attachEventListeners() {
    // Input listeners
    numSharesInput.addEventListener('input', handleInputChange);
    pricePerShareInput.addEventListener('input', handleInputChange);
    
    // Dividend and yield inputs with auto-calculation
    annualDividendInput.addEventListener('input', () => {
        state.lastUpdatedField = 'dividend';
        handleInputChange();
    });
    
    dividendYieldInput.addEventListener('input', () => {
        state.lastUpdatedField = 'yield';
        handleInputChange();
    });

    contributionAmountInput.addEventListener('input', handleInputChange);

    // Toggle switches
    reinvestToggle.addEventListener('change', handleReinvestToggle);
    contributionsToggle.addEventListener('change', handleContributionsToggle);

    // Frequency buttons
    frequencyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            state.contributionFreq = btn.dataset.freq;
            frequencyButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            calculateAndRender();
        });
    });

    // Time range buttons
    timeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            state.selectedYears = parseInt(btn.dataset.years);
            timeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateAnnualLabel();
            calculateAndRender();
        });
    });

    // Currency dropdown
    setupCurrencyDropdown();
}

/**
 * Sets up the currency dropdown functionality
 */
function setupCurrencyDropdown() {
    const customSelect = document.querySelector('.custom-select[data-select-id="currency"]');
    const trigger = customSelect.querySelector('.custom-select-trigger');
    const menu = customSelect.querySelector('.custom-select-menu');
    const optionsContainer = menu.querySelector('.custom-select-options');
    const searchInput = customSelect.querySelector('.custom-select-search');
    const searchClear = customSelect.querySelector('.custom-select-search-clear');
    const nativeSelect = document.getElementById('currency-select');

    // Build all currency options
    const currencyCodes = Object.keys(currencies);
    optionsContainer.innerHTML = currencyCodes.map((code, index) => {
        const currency = currencies[code];
        const symbol = getCurrencySymbol(code);
        const flagUrl = getFlagUrl(code);
        
        return `
            <button type="button" class="custom-select-option ${code === 'USD' ? 'selected' : ''}" data-value="${code}" style="--stagger-index: ${index % 20};">
                <img src="${flagUrl}" alt="${code} flag" width="24" height="18" class="flag-icon" loading="lazy" decoding="async">
                <span class="custom-select-option-text">${code} - ${symbol} · ${currency.name}</span>
            </button>
        `;
    }).join('');

    // Also update native select
    nativeSelect.innerHTML = currencyCodes.map(code => {
        const currency = currencies[code];
        const symbol = getCurrencySymbol(code);
        return `<option value="${code}" ${code === 'USD' ? 'selected' : ''}>${code} - ${symbol} · ${currency.name}</option>`;
    }).join('');

    // Update trigger to show initial selection
    updateCurrencyTrigger(trigger, 'USD');

    // Toggle dropdown
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllDropdowns(customSelect);
        customSelect.classList.toggle('open');
        
        if (customSelect.classList.contains('open')) {
            // Position menu
            const triggerRect = trigger.getBoundingClientRect();
            menu.style.top = `${triggerRect.bottom + 4}px`;
            menu.style.left = `${triggerRect.left}px`;
            menu.style.width = `${triggerRect.width}px`;
            searchInput.focus();
        }
    });

    // Select option
    optionsContainer.addEventListener('click', (e) => {
        const option = e.target.closest('.custom-select-option');
        if (!option) return;
        
        const value = option.dataset.value;
        
        // Update UI
        updateCurrencyTrigger(trigger, value);
        
        // Update selected state
        optionsContainer.querySelectorAll('.custom-select-option').forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.value === value);
        });
        
        // Update native select
        nativeSelect.value = value;
        
        // Update state and currency symbols
        state.currency = value;
        state.currencySymbol = getCurrencySymbol(value);
        updateCurrencySymbols();
        
        // Close dropdown
        customSelect.classList.remove('open');
        
        // Recalculate
        calculateAndRender();
    });

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        searchClear.style.display = searchTerm ? 'block' : 'none';
        
        optionsContainer.querySelectorAll('.custom-select-option').forEach(option => {
            const text = option.querySelector('.custom-select-option-text').textContent.toLowerCase();
            const matches = text.includes(searchTerm);
            option.style.display = matches ? 'flex' : 'none';
        });
    });

    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchClear.style.display = 'none';
        optionsContainer.querySelectorAll('.custom-select-option').forEach(option => {
            option.style.display = 'flex';
        });
        searchInput.focus();
    });

    // Close on outside click
    document.addEventListener('click', () => {
        closeAllDropdowns();
    });
}

/**
 * Updates the currency trigger button display
 */
function updateCurrencyTrigger(trigger, currencyCode) {
    const symbol = getCurrencySymbol(currencyCode);
    const flagUrl = getFlagUrl(currencyCode);
    const displayText = `${currencyCode} - ${symbol}`;
    
    trigger.innerHTML = `
        <span class="custom-select-value">
            <img src="${flagUrl}" alt="${currencyCode} flag" width="24" height="18" class="flag-icon" loading="lazy" decoding="async">
            <span class="custom-select-text">${displayText}</span>
        </span>
        <span class="custom-select-chevron">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </span>
    `;
}

/**
 * Closes all dropdowns except the specified one
 */
function closeAllDropdowns(except = null) {
    const dropdowns = document.querySelectorAll('.custom-select');
    dropdowns.forEach(dropdown => {
        if (dropdown !== except) {
            dropdown.classList.remove('open');
        }
    });
}

/**
 * Updates currency symbols in the UI
 */
function updateCurrencySymbols() {
    const currencySymbolElements = document.querySelectorAll('.currency-symbol');
    currencySymbolElements.forEach(el => {
        el.textContent = state.currencySymbol;
    });
}

/**
 * Handles general input changes
 */
let inputDebounceTimer;
function handleInputChange() {
    clearTimeout(inputDebounceTimer);
    inputDebounceTimer = setTimeout(() => {
        updateStateFromDOM();
        calculateAndRender();
    }, 300);
}

/**
 * Handles reinvest toggle
 */
function handleReinvestToggle() {
    state.reinvest = reinvestToggle.checked;
    
    // Update chart visibility
    updateChartVisibility();
    
    calculateAndRender();
}

/**
 * Handles contributions toggle
 */
function handleContributionsToggle() {
    state.addContributions = contributionsToggle.checked;
    if (state.addContributions) {
        contributionOptions.classList.add('expanded');
    } else {
        contributionOptions.classList.remove('expanded');
    }
    updateAnnualLabel();
    
    // Update chart visibility
    updateChartVisibility();
    
    calculateAndRender();
}

/**
 * Updates chart visibility based on toggle states
 */
function updateChartVisibility() {
    const showCharts = state.reinvest || state.addContributions;
    
    // Show/hide pie chart (visible when reinvesting OR when contributions are enabled)
    const showPieChart = state.reinvest || state.addContributions;
    togglePieChart(showPieChart);
    
    // Show/hide bar chart (visible when either toggle is on)
    toggleBarChart(showCharts);
    
    // Show/hide time range selector (visible when either toggle is on)
    toggleTimeRangeSelector(showCharts);
}

/**
 * Shows or hides the time range selector
 */
function toggleTimeRangeSelector(show) {
    const timeRangeSelector = document.querySelector('.time-range-selector');
    if (timeRangeSelector) {
        if (show) {
            timeRangeSelector.classList.remove('hidden');
        } else {
            timeRangeSelector.classList.add('hidden');
        }
    }
}

/**
 * Updates state from DOM values
 */
function updateStateFromDOM() {
    state.numShares = parseFloat(numSharesInput.value) || 0;
    state.pricePerShare = parseFloat(pricePerShareInput.value) || 0;

    // Auto-calculate between dividend and yield
    if (state.lastUpdatedField === 'dividend') {
        state.annualDividend = parseFloat(annualDividendInput.value) || 0;
        state.dividendYield = calculateYield(state.annualDividend, state.pricePerShare);
        dividendYieldInput.value = state.dividendYield.toFixed(2);
    } else {
        state.dividendYield = parseFloat(dividendYieldInput.value) || 0;
        state.annualDividend = calculateDividendFromYield(state.dividendYield, state.pricePerShare);
        annualDividendInput.value = state.annualDividend.toFixed(2);
    }

    state.contributionAmount = parseFloat(contributionAmountInput.value) || 0;

    // Boundary checks
    if (state.numShares < 0) state.numShares = 0;
    if (state.pricePerShare < 0) state.pricePerShare = 0;
    if (state.annualDividend < 0) state.annualDividend = 0;
    if (state.dividendYield < 0) state.dividendYield = 0;
    if (state.contributionAmount < 0) state.contributionAmount = 0;
}

/**
 * Updates the annual label based on contributions toggle
 */
function updateAnnualLabel() {
    if (state.addContributions) {
        annualLabel.textContent = `Approximately Annual income after ${state.selectedYears} years`;
    } else {
        annualLabel.textContent = 'Annual';
    }
}

/**
 * Calculates and renders results
 */
function calculateAndRender() {
    const result = calculateDividends(
        state.numShares,
        state.pricePerShare,
        state.annualDividend,
        state.selectedYears,
        state.reinvest,
        state.addContributions,
        state.contributionFreq,
        state.contributionAmount
    );

    // Format currency with symbol
    const formatCurrency = (value) => {
        return `${state.currencySymbol}${value.toLocaleString()}`;
    };

    // Update summary displays
    annualIncomeDisplay.textContent = formatCurrency(result.summary.annualIncome);
    monthlyIncomeDisplay.textContent = formatCurrency(result.summary.monthlyIncome);
    
    // Update portfolio value display
    portfolioValueDisplay.textContent = formatCurrency(result.summary.finalPortfolioValue);
    
    // Update portfolio dividend display
    portfolioYearsDisplay.textContent = state.selectedYears;
    portfolioDividendValueDisplay.textContent = formatCurrency(result.summary.totalDividends);

    // Update pie chart (if reinvesting OR contributions are enabled)
    if (state.reinvest || state.addContributions) {
        const reinvestedAmount = state.reinvest ? (result.summary.finalPortfolioValue - result.summary.totalContributed) : 0;
        const contributionsAmount = state.addContributions ? (result.summary.totalContributed - result.summary.originalInvestment) : 0;
        updatePieChart(result.summary.originalInvestment, Math.max(0, reinvestedAmount), contributionsAmount);
    }

    // Update bar chart
    updateBarChart(result.labels, result.dividendIncome);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
