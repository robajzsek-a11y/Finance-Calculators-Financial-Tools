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
const taxToggle = document.getElementById('tax-toggle');

// Contribution Options
const contributionOptions = document.getElementById('contribution-options');
const frequencyButtons = document.querySelectorAll('.freq-btn');
const contributionAmountInput = document.getElementById('contribution-amount');

// Tax Options
const taxOptions = document.getElementById('tax-options');
const taxRateInput = document.getElementById('tax-rate');

// Display Elements
const annualIncomeDisplay = document.getElementById('annual-income');
const monthlyIncomeDisplay = document.getElementById('monthly-income');
const annualLabel = document.getElementById('annual-label');
const annualTaxDisplay = document.getElementById('annual-tax');
const monthlyTaxDisplay = document.getElementById('monthly-tax');
const portfolioValueDisplay = document.getElementById('portfolio-value');
const portfolioDividendValueDisplay = document.getElementById('portfolio-dividend-value');
const portfolioTaxPaidDisplay = document.getElementById('portfolio-tax-paid');

// KPI Card Elements
const kpiPortfolioValue = document.getElementById('kpi-portfolio-value');
const kpiTotalDividends = document.getElementById('kpi-total-dividends');
const kpiROI = document.getElementById('kpi-roi');
const kpiDivYear = document.getElementById('kpi-div-year');
const kpiDivMonth = document.getElementById('kpi-div-month');
const kpiDivWeek = document.getElementById('kpi-div-week');
const kpiDivDay = document.getElementById('kpi-div-day');
const kpiTaxCard = document.getElementById('kpi-tax-card');
const kpiTotalTax = document.getElementById('kpi-total-tax');
const kpiTaxRate = document.getElementById('kpi-tax-rate');
const kpiYieldOnCost = document.getElementById('kpi-yield-on-cost');
const kpiPaybackProgress = document.getElementById('kpi-payback-progress');
const kpiContributionCard = document.getElementById('kpi-contribution-card');
const kpiTotalContributed = document.getElementById('kpi-total-contributed');
const kpiMarketGrowth = document.getElementById('kpi-market-growth');

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
    applyTax: true,
    taxRate: 15,
    dividendFrequency: 'quarterly',
    selectedYears: 10,
    lastUpdatedField: 'dividend', // Track which field was last updated
    currency: 'USD',
    currencySymbol: '$'
};

let pieChart = null;
let barChart = null;

/*---------TRANSLATION SYSTEM------------*/

window.currentLanguage = 'en';  // Make it globally accessible
let currentLanguage = 'en';
const languageData = {
    en: { name: 'English (US/UK)' },
    cs: { name: 'Čeština (Czech)' },
    de: { name: 'Deutsch (German)' },
    fr: { name: 'Français (French)' },
    es: { name: 'Español (Spanish)' },
    it: { name: 'Italiano (Italian)' },
    sv: { name: 'Svenska (Swedish)' },
    no: { name: 'Norsk (Norwegian)' },
    da: { name: 'Dansk (Danish)' },
    pl: { name: 'Polski (Polish)' },
    hu: { name: 'Magyar (Hungarian)' },
    ro: { name: 'Română (Romanian)' },
    bg: { name: 'Български (Bulgarian)' },
    ru: { name: 'Русский (Russian)' },
    tr: { name: 'Türkçe (Turkish)' },
    ja: { name: '日本語 (Japanese)' }
};

/**
 * Detects the best language based on browser settings
 */
function detectLanguage() {
    if (!window.LanguageAlgorithm || !window.DividendCalc || !window.DividendCalc.translations) {
        return 'en';
    }
    
    const supportedLanguages = Object.keys(window.DividendCalc.translations);
    return window.LanguageAlgorithm.detectBestLanguage(supportedLanguages, 'en');
}

/**
 * Applies translations to the page
 */
function applyTranslations(lang) {
    if (!window.DividendCalc || !window.DividendCalc.translations || !window.DividendCalc.translations[lang]) {
        return;
    }
    
    currentLanguage = lang;
    window.currentLanguage = lang;  // Update global variable
    const t = window.DividendCalc.translations[lang];
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            el.textContent = t[key];
        }
    });
    
    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key]) {
            el.placeholder = t[key];
        }
    });
    
    // Update dynamic "Dividend after X years" label
    updateDividendAfterYearsLabel();
    
    // Update specific dynamic content
    updateAnnualLabel();
    
    // Recalculate to update all displays with new language
    calculateAndRender();
    
    // Save language preference
    try {
        localStorage.setItem('dividendCalc_language', lang);
    } catch (e) {
        // Ignore localStorage errors
    }
}

/**
 * Updates the "Dividend after X years" label with current language
 */
function updateDividendAfterYearsLabel() {
    const dividendAfterYearsLabel = document.getElementById('dividend-after-years-label');
    if (!dividendAfterYearsLabel) return;
    
    const t = window.DividendCalc && window.DividendCalc.translations && window.DividendCalc.translations[currentLanguage] 
        ? window.DividendCalc.translations[currentLanguage] 
        : {};
    
    const years = state ? state.selectedYears : 10;
    if (t.dividendAfterYears) {
        dividendAfterYearsLabel.textContent = t.dividendAfterYears.replace('{years}', years) + ':';
    } else {
        dividendAfterYearsLabel.textContent = `Dividend after ${years} years:`;
    }
}

/**
 * Sets up the language dropdown
 */
function setupLanguageDropdown() {
    const customLanguageSelect = document.getElementById('custom-language-select');
    const selectedLanguage = document.getElementById('selected-language');
    const languageOptions = document.getElementById('language-options');
    const nativeSelect = document.getElementById('language-select');
    
    if (!customLanguageSelect || !selectedLanguage || !languageOptions || !nativeSelect) {
        return;
    }
    
    // Build language options
    const languages = Object.keys(languageData);
    languageOptions.innerHTML = languages.map(code => {
        const lang = languageData[code];
        return `
            <button type="button" data-lang="${code}" class="${code === currentLanguage ? 'selected' : ''}">
                <span>${lang.name}</span>
            </button>
        `;
    }).join('');
    
    // Update selected display
    function updateSelectedDisplay(code) {
        const lang = languageData[code];
        selectedLanguage.innerHTML = `
            <span class="option-text">${lang.name}</span>
            <span class="select-arrow"></span>
        `;
    }
    
    updateSelectedDisplay(currentLanguage);
    
    // Function to position the dropdown menu
    function positionDropdownMenu() {
        const triggerRect = customLanguageSelect.getBoundingClientRect();
        languageOptions.style.top = `${triggerRect.bottom + 4}px`;
        languageOptions.style.left = `${triggerRect.left}px`;
        languageOptions.style.minWidth = `${triggerRect.width}px`;
    }
    
    // Smooth repositioning on scroll using requestAnimationFrame
    let isRepositioning = false;
    function updateDropdownPosition() {
        if (customLanguageSelect.classList.contains('open')) {
            positionDropdownMenu();
            isRepositioning = true;
            requestAnimationFrame(updateDropdownPosition);
        } else {
            isRepositioning = false;
        }
    }
    
    // Toggle dropdown
    selectedLanguage.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllDropdowns(customLanguageSelect);
        customLanguageSelect.classList.toggle('open');
        
        if (customLanguageSelect.classList.contains('open')) {
            positionDropdownMenu();
            if (!isRepositioning) {
                updateDropdownPosition();
            }
        }
    });
    
    // Select language
    languageOptions.addEventListener('click', (e) => {
        const button = e.target.closest('button[data-lang]');
        if (!button) return;
        
        const lang = button.dataset.lang;
        
        // Update UI
        updateSelectedDisplay(lang);
        
        // Update selected state
        languageOptions.querySelectorAll('button').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.lang === lang);
        });
        
        // Update native select
        nativeSelect.value = lang;
        
        // Apply translations
        applyTranslations(lang);
        
        // Close dropdown
        customLanguageSelect.classList.remove('open');
    });
    
    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#custom-language-select')) {
            customLanguageSelect.classList.remove('open');
        }
    });
}

/**
 * Initializes translations
 */
function initTranslations() {
    // Try to get saved language preference
    let savedLang = null;
    try {
        savedLang = localStorage.getItem('dividendCalc_language');
    } catch (e) {
        // Ignore localStorage errors
    }
    
    // Determine initial language
    const initialLang = savedLang || detectLanguage();
    currentLanguage = initialLang;
    
    // Setup language dropdown
    setupLanguageDropdown();
    
    // Apply initial translations
    applyTranslations(initialLang);
}

/**
 * Initializes the application
 */
function init() {
    // Initialize translations first
    initTranslations();
    
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
    taxToggle.checked = state.applyTax;
    taxRateInput.value = state.taxRate;

    // Show/hide contribution options
    if (state.addContributions) {
        contributionOptions.classList.add('expanded');
    } else {
        contributionOptions.classList.remove('expanded');
    }

    // Show/hide tax options
    if (state.applyTax) {
        taxOptions.classList.add('expanded');
    } else {
        taxOptions.classList.remove('expanded');
    }

    // Set active frequency button
    frequencyButtons.forEach(btn => {
        if (btn.closest('#contribution-options')) {
            btn.classList.toggle('active', btn.dataset.freq === state.contributionFreq);
        }
    });

    // Set active dividend frequency button
    const dividendFrequencyButtons = document.querySelectorAll('#tax-options .freq-btn');
    dividendFrequencyButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.freq === state.dividendFrequency);
    });

    // Set active time button
    timeButtons.forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.years) === state.selectedYears);
    });
    
    // Set initial sliding indicator position
    const timeRangeSelector = document.querySelector('.time-range-selector');
    const activeButtonIndex = Array.from(timeButtons).findIndex(btn => parseInt(btn.dataset.years) === state.selectedYears);
    if (timeRangeSelector && activeButtonIndex !== -1) {
        timeRangeSelector.setAttribute('data-active', activeButtonIndex);
    }
}

/**
 * Attaches event listeners to inputs
 */
function attachEventListeners() {
    // Get dividend frequency buttons after DOM is ready
    const dividendFrequencyButtons = document.querySelectorAll('#tax-options .freq-btn');
    
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
    taxRateInput.addEventListener('input', handleInputChange);

    // Toggle switches
    reinvestToggle.addEventListener('change', handleReinvestToggle);
    contributionsToggle.addEventListener('change', handleContributionsToggle);
    taxToggle.addEventListener('change', handleTaxToggle);

    // Frequency buttons (contribution)
    frequencyButtons.forEach(btn => {
        if (btn.closest('#contribution-options')) {
            btn.addEventListener('click', () => {
                state.contributionFreq = btn.dataset.freq;
                frequencyButtons.forEach(b => {
                    if (b.closest('#contribution-options')) {
                        b.classList.remove('active');
                    }
                });
                btn.classList.add('active');
                calculateAndRender();
            });
        }
    });

    // Dividend frequency buttons
    dividendFrequencyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            state.dividendFrequency = btn.dataset.freq;
            dividendFrequencyButtons.forEach(b => b.classList.remove('active'));
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
            
            // Update the sliding indicator position
            const timeRangeSelector = document.querySelector('.time-range-selector');
            const buttonIndex = Array.from(timeButtons).indexOf(btn);
            timeRangeSelector.setAttribute('data-active', buttonIndex);
            
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

    // Function to position the dropdown menu
    function positionDropdownMenu() {
        const triggerRect = trigger.getBoundingClientRect();
        menu.style.top = `${triggerRect.bottom + 4}px`;
        menu.style.left = `${triggerRect.left}px`;
        menu.style.width = `${triggerRect.width}px`;
    }

    // Smooth repositioning on scroll using requestAnimationFrame
    let isRepositioning = false;
    function updateDropdownPosition() {
        if (customSelect.classList.contains('open')) {
            positionDropdownMenu();
            isRepositioning = true;
            requestAnimationFrame(updateDropdownPosition);
        } else {
            isRepositioning = false;
        }
    }

    // Toggle dropdown
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllDropdowns(customSelect);
        customSelect.classList.toggle('open');
        
        if (customSelect.classList.contains('open')) {
            // Position menu and start continuous updates
            positionDropdownMenu();
            searchInput.focus();
            if (!isRepositioning) {
                updateDropdownPosition();
            }
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
 * Handles tax toggle
 */
function handleTaxToggle() {
    state.applyTax = taxToggle.checked;
    
    // Show/hide tax options
    if (state.applyTax) {
        taxOptions.classList.add('expanded');
    } else {
        taxOptions.classList.remove('expanded');
    }
    
    // Show/hide tax paid line in portfolio composition
    const portfolioTaxLine = document.getElementById('portfolio-tax-line');
    if (portfolioTaxLine) {
        if (state.applyTax) {
            portfolioTaxLine.classList.remove('hidden');
        } else {
            portfolioTaxLine.classList.add('hidden');
        }
    }
    
    calculateAndRender();
}

/**
 * Updates chart visibility based on toggle states
 */
function updateChartVisibility() {
    const showCharts = state.reinvest || state.addContributions;
    const chartsContainer = document.querySelector('.charts-container');
    const timeRangeSelector = document.querySelector('.time-range-selector');
    const kpiSection = document.querySelector('.kpi-grid-section');
    
    if (showCharts) {
        // Show charts
        if (chartsContainer) {
            chartsContainer.classList.remove('fade-out');
        }
        if (timeRangeSelector) {
            timeRangeSelector.classList.remove('fade-out');
        }
        if (kpiSection) {
            kpiSection.classList.remove('move-up');
        }
        
        // Show/hide individual charts
        const showPieChart = state.reinvest || state.addContributions;
        togglePieChart(showPieChart);
        toggleBarChart(showCharts);
    } else {
        // Hide charts
        if (chartsContainer) {
            chartsContainer.classList.add('fade-out');
        }
        if (timeRangeSelector) {
            timeRangeSelector.classList.add('fade-out');
        }
        if (kpiSection) {
            kpiSection.classList.add('move-up');
        }
        
        togglePieChart(false);
        toggleBarChart(false);
    }
}

/**
 * Shows or hides the time range selector
 */
function toggleTimeRangeSelector(show) {
    const timeRangeSelector = document.querySelector('.time-range-selector');
    if (timeRangeSelector) {
        if (show) {
            timeRangeSelector.classList.remove('fade-out');
        } else {
            timeRangeSelector.classList.add('fade-out');
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
    state.taxRate = parseFloat(taxRateInput.value) || 0;

    // Boundary checks
    if (state.numShares < 0) state.numShares = 0;
    if (state.pricePerShare < 0) state.pricePerShare = 0;
    if (state.annualDividend < 0) state.annualDividend = 0;
    if (state.dividendYield < 0) state.dividendYield = 0;
    if (state.contributionAmount < 0) state.contributionAmount = 0;
    if (state.taxRate < 0) state.taxRate = 0;
    if (state.taxRate > 100) state.taxRate = 100;
}

/**
 * Updates the annual label based on contributions toggle
 */
function updateAnnualLabel() {
    const t = window.DividendCalc && window.DividendCalc.translations && window.DividendCalc.translations[currentLanguage] 
        ? window.DividendCalc.translations[currentLanguage] 
        : {};
    
    if (state.addContributions) {
        const text = t.approximatelyAnnualIncome || 'Approximately Annual income after {years} years';
        annualLabel.textContent = text.replace('{years}', state.selectedYears);
    } else {
        annualLabel.textContent = t.annual || 'Annual';
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
        state.contributionAmount,
        state.applyTax,
        state.taxRate,
        state.dividendFrequency
    );

    // Format currency with symbol
    const formatCurrency = (value) => {
        return `${state.currencySymbol}${value.toLocaleString()}`;
    };

    // Update summary displays
    annualIncomeDisplay.textContent = formatCurrency(result.summary.annualIncome);
    monthlyIncomeDisplay.textContent = formatCurrency(result.summary.monthlyIncome);
    
    // Update tax displays in Dividend Income card based on payment frequency
    if (state.applyTax && result.summary.totalTaxPaid > 0) {
        // Get the annual tax from final year
        const annualTax = result.summary.annualTax;
        
        // Calculate tax per period based on dividend payment frequency
        const taxPerPeriod = result.summary.taxPerPeriod;
        
        // Use the actual tax rate from state for percentage display
        const taxPercent = state.taxRate.toFixed(1);
        
        // Get frequency label for display
        const frequencyLabels = {
            'monthly': 'Monthly',
            'quarterly': 'Quarterly',
            'semi-annually': 'Semi-Annually',
            'annually': 'Annually'
        };
        const frequencyLabel = frequencyLabels[state.dividendFrequency] || 'Quarterly';
        
        // Update annual tax display (always show annual)
        annualTaxDisplay.querySelector('.tax-value').textContent = `${formatCurrency(annualTax)} (${taxPercent}%)`;
        annualTaxDisplay.classList.remove('hidden');
        
        // Update period tax display (show based on selected frequency)
        // For monthly frequency, show monthly tax
        // For other frequencies, calculate monthly equivalent for consistency
        const monthlyTax = annualTax / 12;
        monthlyTaxDisplay.querySelector('.tax-value').textContent = `${formatCurrency(Math.round(monthlyTax * 100) / 100)} (${taxPercent}%)`;
        monthlyTaxDisplay.classList.remove('hidden');
    } else {
        annualTaxDisplay.classList.add('hidden');
        monthlyTaxDisplay.classList.add('hidden');
    }
    
    // Update tax display visibility and value in Portfolio Composition
    if (state.applyTax && result.summary.totalTaxPaid > 0) {
        // Show tax breakdown
        const taxPaid = result.summary.totalTaxPaid;
        const totalDividendsGross = result.summary.totalDividendsGross || result.summary.totalDividends;
        const taxPercentage = totalDividendsGross > 0 ? ((taxPaid / totalDividendsGross) * 100).toFixed(1) : 0;
        portfolioTaxPaidDisplay.textContent = `${formatCurrency(taxPaid)} (${taxPercentage}%)`;
        portfolioTaxPaidDisplay.parentElement.classList.remove('hidden');
    } else {
        portfolioTaxPaidDisplay.parentElement.classList.add('hidden');
    }
    
    // Update portfolio value display
    portfolioValueDisplay.textContent = formatCurrency(result.summary.finalPortfolioValue);
    
    // Update portfolio dividend display
    updateDividendAfterYearsLabel();
    portfolioDividendValueDisplay.textContent = formatCurrency(result.summary.totalDividends);

    // Update pie chart (if reinvesting OR contributions are enabled)
    if (state.reinvest || state.addContributions) {
        const reinvestedAmount = state.reinvest ? (result.summary.finalPortfolioValue - result.summary.totalContributed) : 0;
        const contributionsAmount = state.addContributions ? (result.summary.totalContributed - result.summary.originalInvestment) : 0;
        updatePieChart(result.summary.originalInvestment, Math.max(0, reinvestedAmount), contributionsAmount);
    }

    // Update bar chart
    updateBarChart(result.labels, result.dividendIncome);
    
    // ========== UPDATE KPI CARDS ==========
    
    // Card 1: Portfolio Overview
    kpiPortfolioValue.textContent = formatCurrency(result.summary.finalPortfolioValue);
    kpiTotalDividends.textContent = formatCurrency(result.summary.totalDividends);
    
    // Calculate Total ROI
    const totalROI = result.summary.originalInvestment > 0 
        ? ((result.summary.totalDividends / result.summary.originalInvestment) * 100).toFixed(1)
        : 0;
    kpiROI.textContent = `${totalROI}%`;
    
    // Card 2: Dividend Breakdown (use net income after tax)
    const annualIncome = result.summary.annualIncome;
    const monthlyIncome = annualIncome / 12;
    const weeklyIncome = annualIncome / 52;
    const dailyIncome = annualIncome / 365;
    
    kpiDivYear.textContent = formatCurrency(Math.round(annualIncome));
    kpiDivMonth.textContent = formatCurrency(Math.round(monthlyIncome * 100) / 100);
    kpiDivWeek.textContent = formatCurrency(Math.round(weeklyIncome * 100) / 100);
    kpiDivDay.textContent = formatCurrency(Math.round(dailyIncome * 100) / 100);
    
    // Card 3: Tax Summary (Conditional)
    if (state.applyTax && result.summary.totalTaxPaid > 0) {
        kpiTotalTax.textContent = formatCurrency(result.summary.totalTaxPaid);
        kpiTaxRate.textContent = `${state.taxRate.toFixed(1)}%`;
        kpiTaxCard.classList.remove('hidden');
    } else {
        kpiTaxCard.classList.add('hidden');
    }
    
    // Card 4: Snowball Milestone
    // Yield on Cost = Current Annual Dividend / Original Investment
    const yieldOnCost = result.summary.originalInvestment > 0
        ? ((annualIncome / result.summary.originalInvestment) * 100).toFixed(1)
        : 0;
    kpiYieldOnCost.textContent = `${yieldOnCost}%`;
    
    // Payback Progress = Total Dividends / Original Investment
    const paybackProgress = result.summary.originalInvestment > 0
        ? ((result.summary.totalDividends / result.summary.originalInvestment) * 100).toFixed(1)
        : 0;
    kpiPaybackProgress.textContent = `${paybackProgress}%`;
    
    // Card 5: Contribution Impact (Conditional)
    if (state.addContributions) {
        const totalContributed = result.summary.totalContributed;
        const marketGrowth = result.summary.finalPortfolioValue - totalContributed;
        
        kpiTotalContributed.textContent = formatCurrency(totalContributed);
        kpiMarketGrowth.textContent = formatCurrency(Math.max(0, marketGrowth));
        kpiContributionCard.classList.remove('hidden');
    } else {
        kpiContributionCard.classList.add('hidden');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
