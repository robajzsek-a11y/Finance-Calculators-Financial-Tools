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
    lastUpdatedField: 'dividend',
    currency: 'USD',
    currencySymbol: '$',
    additionalStocks: [],
    stockIdCounter: 0
};

// Expose globally so export.js can always read the live state
window.appState = state;

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
    // Load state from URL params first (Share / restore portfolio)
    if (typeof window.loadStateFromURL === 'function') {
        window.loadStateFromURL(state);
    }

    // Initialize translations
    initTranslations();

    // Seed global currency symbol for chart.js centerText plugin
    window.currentCurrencySymbol = state.currencySymbol;

    // Initialize charts
    pieChart = initPieChart(pieChartCanvas.getContext('2d'));
    barChart = initBarChart(barChartCanvas.getContext('2d'));

    // Sync all DOM inputs with (possibly URL-restored) state
    syncDOMWithState();

    // Rebuild additional stock cards if any were decoded from URL
    if (state.additionalStocks.length > 0) {
        renderAdditionalStockCards();
    }

    // Attach event listeners
    attachEventListeners();

    // Initial calculation and render
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

    // Add additional stock button
    const addStockBtn = document.getElementById('add-stock-btn');
    if (addStockBtn) {
        addStockBtn.addEventListener('click', addAdditionalStock);
    }
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
 * Updates currency symbols in the UI (including any additional stock cards)
 */
function updateCurrencySymbols() {
    // .currency-symbol is used in both main inputs and additional stock cards
    const currencySymbolElements = document.querySelectorAll('.currency-symbol');
    currencySymbolElements.forEach(el => {
        el.textContent = state.currencySymbol;
    });
    // Expose globally so chart.js centerText plugin can use the current symbol
    window.currentCurrencySymbol = state.currencySymbol;
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
 * Calculates and renders results — aggregates main stock + all additional stocks
 */
function calculateAndRender() {
    // ── Main stock ───────────────────────────────────────────────────────────
    const mainResult = calculateDividends(
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

    // ── Additional stocks (shared settings; no extra contributions) ──────────
    const additionalResults = state.additionalStocks.map(stock => ({
        stock,
        result: calculateDividends(
            stock.numShares,
            stock.pricePerShare,
            stock.annualDividend,
            state.selectedYears,
            state.reinvest,
            false,                  // contributions belong to main stock only
            state.contributionFreq,
            0,
            state.applyTax,
            state.taxRate,
            state.dividendFrequency
        )
    }));

    // ── Aggregate ────────────────────────────────────────────────────────────
    const allResults = [mainResult, ...additionalResults.map(r => r.result)];

    const combined = {
        annualIncome:        allResults.reduce((s, r) => s + r.summary.annualIncome, 0),
        annualGross:         allResults.reduce((s, r) => s + r.summary.annualGross, 0),
        annualTax:           allResults.reduce((s, r) => s + r.summary.annualTax, 0),
        taxPerPeriod:        allResults.reduce((s, r) => s + r.summary.taxPerPeriod, 0),
        monthlyIncome:       allResults.reduce((s, r) => s + r.summary.monthlyIncome, 0),
        totalDividends:      allResults.reduce((s, r) => s + r.summary.totalDividends, 0),
        totalDividendsGross: allResults.reduce((s, r) => s + (r.summary.totalDividendsGross || r.summary.totalDividends), 0),
        totalTaxPaid:        allResults.reduce((s, r) => s + r.summary.totalTaxPaid, 0),
        finalPortfolioValue: allResults.reduce((s, r) => s + r.summary.finalPortfolioValue, 0),
        originalInvestment:  allResults.reduce((s, r) => s + r.summary.originalInvestment, 0),
        // Contributions only from main stock; additional stocks add their original investment
        totalContributed: mainResult.summary.totalContributed +
            additionalResults.reduce((s, { result: r }) => s + r.summary.originalInvestment, 0)
    };

    // Combined year-by-year dividend income for bar chart
    const combinedDividendIncome = mainResult.dividendIncome.map((_, i) =>
        allResults.reduce((sum, r) => sum + (r.dividendIncome[i] || 0), 0)
    );

    // ── Currency formatter ───────────────────────────────────────────────────
    const formatCurrency = (value) => `${state.currencySymbol}${value.toLocaleString()}`;

    // ── Summary card ─────────────────────────────────────────────────────────
    annualIncomeDisplay.textContent  = formatCurrency(combined.annualIncome);
    monthlyIncomeDisplay.textContent = formatCurrency(combined.monthlyIncome);

    if (state.applyTax && combined.totalTaxPaid > 0) {
        const annualTax  = combined.annualTax;
        const taxPercent = state.taxRate.toFixed(1);
        const monthlyTax = annualTax / 12;

        annualTaxDisplay.querySelector('.tax-value').textContent =
            `${formatCurrency(annualTax)} (${taxPercent}%)`;
        annualTaxDisplay.classList.remove('hidden');

        monthlyTaxDisplay.querySelector('.tax-value').textContent =
            `${formatCurrency(Math.round(monthlyTax * 100) / 100)} (${taxPercent}%)`;
        monthlyTaxDisplay.classList.remove('hidden');
    } else {
        annualTaxDisplay.classList.add('hidden');
        monthlyTaxDisplay.classList.add('hidden');
    }

    // ── Portfolio composition subtitle ───────────────────────────────────────
    if (state.applyTax && combined.totalTaxPaid > 0) {
        const taxPaid       = combined.totalTaxPaid;
        const totalGross    = combined.totalDividendsGross;
        const taxPercentage = totalGross > 0 ? ((taxPaid / totalGross) * 100).toFixed(1) : 0;
        portfolioTaxPaidDisplay.textContent = `${formatCurrency(taxPaid)} (${taxPercentage}%)`;
        portfolioTaxPaidDisplay.parentElement.classList.remove('hidden');
    } else {
        portfolioTaxPaidDisplay.parentElement.classList.add('hidden');
    }

    portfolioValueDisplay.textContent = formatCurrency(combined.finalPortfolioValue);
    updateDividendAfterYearsLabel();
    portfolioDividendValueDisplay.textContent = formatCurrency(combined.totalDividends);

    // ── Charts ───────────────────────────────────────────────────────────────
    if (state.reinvest || state.addContributions) {
        const reinvestedAmount    = state.reinvest
            ? (combined.finalPortfolioValue - combined.totalContributed) : 0;
        const contributionsAmount = state.addContributions
            ? (mainResult.summary.totalContributed - mainResult.summary.originalInvestment) : 0;
        updatePieChart(combined.originalInvestment, Math.max(0, reinvestedAmount), contributionsAmount);
    }
    updateBarChart(mainResult.labels, combinedDividendIncome);

    // ── KPI Card 1: Portfolio Overview ───────────────────────────────────────
    kpiPortfolioValue.textContent = formatCurrency(combined.finalPortfolioValue);
    kpiTotalDividends.textContent = formatCurrency(combined.totalDividends);

    const totalROI = combined.originalInvestment > 0
        ? ((combined.totalDividends / combined.originalInvestment) * 100).toFixed(1) : 0;
    kpiROI.textContent = `${totalROI}%`;

    // ── KPI Card 2: Dividend Breakdown ───────────────────────────────────────
    const annualIncome  = combined.annualIncome;
    const monthlyIncome = annualIncome / 12;
    const weeklyIncome  = annualIncome / 52;
    const dailyIncome   = annualIncome / 365;

    kpiDivYear.textContent  = formatCurrency(Math.round(annualIncome));
    kpiDivMonth.textContent = formatCurrency(Math.round(monthlyIncome * 100) / 100);
    kpiDivWeek.textContent  = formatCurrency(Math.round(weeklyIncome  * 100) / 100);
    kpiDivDay.textContent   = formatCurrency(Math.round(dailyIncome   * 100) / 100);

    // ── KPI Card 3: Tax Summary ───────────────────────────────────────────────
    if (state.applyTax && combined.totalTaxPaid > 0) {
        kpiTotalTax.textContent = formatCurrency(combined.totalTaxPaid);
        kpiTaxRate.textContent  = `${state.taxRate.toFixed(1)}%`;
        kpiTaxCard.classList.remove('hidden');
    } else {
        kpiTaxCard.classList.add('hidden');
    }

    // ── KPI Card 4: Snowball Milestone ───────────────────────────────────────
    const yieldOnCost = combined.originalInvestment > 0
        ? ((annualIncome / combined.originalInvestment) * 100).toFixed(1) : 0;
    kpiYieldOnCost.textContent = `${yieldOnCost}%`;

    const paybackProgress = combined.originalInvestment > 0
        ? ((combined.totalDividends / combined.originalInvestment) * 100).toFixed(1) : 0;
    kpiPaybackProgress.textContent = `${paybackProgress}%`;

    // ── KPI Card 5: Contribution Impact ──────────────────────────────────────
    if (state.addContributions) {
        const totalContributed = combined.totalContributed;
        const marketGrowth     = combined.finalPortfolioValue - totalContributed;
        kpiTotalContributed.textContent = formatCurrency(totalContributed);
        kpiMarketGrowth.textContent     = formatCurrency(Math.max(0, marketGrowth));
        kpiContributionCard.classList.remove('hidden');
    } else {
        kpiContributionCard.classList.add('hidden');
    }

    // ── KPI Card 6: Stock Breakdown (only when additional stocks exist) ───────
    const breakdownCard = document.getElementById('kpi-breakdown-card');
    if (state.additionalStocks.length > 0 && breakdownCard) {
        const t = (window.DividendCalc && window.DividendCalc.translations &&
            window.DividendCalc.translations[currentLanguage]) || {};

        const perStockBreakdown = [
            { name: t.mainStock || 'Main Stock', result: mainResult },
            ...additionalResults.map(({ stock, result }) => ({
                name: stock.label.trim() || `Stock ${stock.id}`,
                result
            }))
        ];
        updateStockBreakdownCard(perStockBreakdown, formatCurrency);
        breakdownCard.classList.remove('hidden');
    } else if (breakdownCard) {
        breakdownCard.classList.add('hidden');
    }

    // Cache results for CSV/Excel export
    window.lastCalcData = {
        combined,
        mainResult,
        additionalResults,
        snapState: {
            numShares:          state.numShares,
            pricePerShare:      state.pricePerShare,
            annualDividend:     state.annualDividend,
            currency:           state.currency,
            currencySymbol:     state.currencySymbol,
            taxRate:            state.taxRate,
            applyTax:           state.applyTax,
            reinvest:           state.reinvest,
            addContributions:   state.addContributions,
            contributionAmount: state.contributionAmount,
            contributionFreq:   state.contributionFreq,
            dividendFrequency:  state.dividendFrequency,
            selectedYears:      state.selectedYears,
            additionalStocks:   state.additionalStocks
        }
    };
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);

/*──────────────────────────────────────────────────────────────────────────
  MULTI-STOCK PORTFOLIO — HELPER FUNCTIONS
──────────────────────────────────────────────────────────────────────────*/

/**
 * Safely escapes a string for insertion into HTML
 */
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Debounced recalculate — used by additional stock inputs
 */
let additionalStockDebounce;
function scheduleRecalc() {
    clearTimeout(additionalStockDebounce);
    additionalStockDebounce = setTimeout(() => calculateAndRender(), 300);
}

/**
 * Adds a new additional stock entry and re-renders
 */
function addAdditionalStock() {
    state.stockIdCounter++;
    state.additionalStocks.push({
        id:             state.stockIdCounter,
        label:          '',
        numShares:      0,
        pricePerShare:  0,
        annualDividend: 0,
        dividendYield:  0,
        lastUpdated:    'dividend'
    });
    renderAdditionalStockCards();
    calculateAndRender();
}

/**
 * Removes an additional stock by ID and re-renders
 */
function removeAdditionalStock(id) {
    state.additionalStocks = state.additionalStocks.filter(s => s.id !== id);
    renderAdditionalStockCards();
    calculateAndRender();
}

/**
 * Rebuilds all additional stock cards from state.additionalStocks
 */
function renderAdditionalStockCards() {
    const container = document.getElementById('additional-stocks-container');
    if (!container) return;

    container.innerHTML = '';

    state.additionalStocks.forEach((stock, index) => {
        const sym  = state.currencySymbol;
        const card = document.createElement('div');
        card.className   = 'additional-stock-card';
        card.dataset.stockId = stock.id;

        card.innerHTML = `
            <div class="stock-card-header">
                <span class="stock-number-badge">Stock ${index + 2}</span>
                <input
                    type="text"
                    class="stock-name-input"
                    placeholder="Ticker / Name (optional)"
                    value="${escapeHtml(stock.label)}"
                    maxlength="32"
                    aria-label="Stock name or ticker"
                >
                <button type="button" class="stock-remove-btn" aria-label="Remove stock" title="Remove this stock">&times;</button>
            </div>

            <div class="input-row">
                <div class="input-group">
                    <label>Number of Shares</label>
                    <div class="input-wrapper">
                        <input type="number" class="stock-shares" value="${stock.numShares || ''}" min="0" step="1" placeholder="0">
                    </div>
                </div>
                <div class="input-group">
                    <label>Price per Share</label>
                    <div class="input-wrapper">
                        <span class="currency-symbol">${escapeHtml(sym)}</span>
                        <input type="number" class="stock-price" value="${stock.pricePerShare || ''}" min="0" step="0.01" placeholder="0.00">
                    </div>
                </div>
            </div>

            <div class="linked-inputs-row">
                <div class="input-group">
                    <label>Annual Dividend / Share</label>
                    <div class="input-wrapper">
                        <span class="currency-symbol">${escapeHtml(sym)}</span>
                        <input type="number" class="stock-dividend" value="${stock.annualDividend || ''}" min="0" step="0.01" placeholder="0.00">
                    </div>
                </div>
                <div class="linked-inputs-divider">OR</div>
                <div class="input-group">
                    <label>Dividend Yield %</label>
                    <div class="input-wrapper">
                        <input type="number" class="stock-yield" value="${stock.dividendYield || ''}" min="0" step="0.01" placeholder="0.00">
                        <span class="percent-symbol">%</span>
                    </div>
                </div>
            </div>
        `;

        // ── Wire up inputs ────────────────────────────────────────────────
        const nameInput     = card.querySelector('.stock-name-input');
        const sharesInput   = card.querySelector('.stock-shares');
        const priceInput    = card.querySelector('.stock-price');
        const dividendInput = card.querySelector('.stock-dividend');
        const yieldInput    = card.querySelector('.stock-yield');
        const removeBtn     = card.querySelector('.stock-remove-btn');

        // Name — no recalc needed (purely cosmetic for breakdown card)
        nameInput.addEventListener('input', () => {
            stock.label = nameInput.value;
        });

        // Unified updater: reads inputs, recalculates linked field, stores to state
        function syncStockFromInputs() {
            const shares = parseFloat(sharesInput.value)   || 0;
            const price  = parseFloat(priceInput.value)    || 0;
            stock.numShares     = shares;
            stock.pricePerShare = price;

            if (stock.lastUpdated === 'dividend') {
                const div            = parseFloat(dividendInput.value) || 0;
                stock.annualDividend = div;
                stock.dividendYield  = price > 0 ? (div / price) * 100 : 0;
                yieldInput.value     = stock.dividendYield.toFixed(2);
            } else {
                const yld            = parseFloat(yieldInput.value) || 0;
                stock.dividendYield  = yld;
                stock.annualDividend = (yld / 100) * price;
                dividendInput.value  = stock.annualDividend.toFixed(2);
            }
        }

        sharesInput.addEventListener('input',   () => { syncStockFromInputs(); scheduleRecalc(); });
        priceInput.addEventListener('input',    () => { syncStockFromInputs(); scheduleRecalc(); });
        dividendInput.addEventListener('input', () => { stock.lastUpdated = 'dividend'; syncStockFromInputs(); scheduleRecalc(); });
        yieldInput.addEventListener('input',    () => { stock.lastUpdated = 'yield';    syncStockFromInputs(); scheduleRecalc(); });

        // Remove button
        removeBtn.addEventListener('click', () => removeAdditionalStock(stock.id));

        container.appendChild(card);
    });
}

/**
 * Renders the per-stock breakdown table inside KPI Card 6
 * @param {Array} perStockBreakdown  - [{ name, result }]
 * @param {Function} formatCurrency  - currency formatter from calculateAndRender scope
 */
function updateStockBreakdownCard(perStockBreakdown, formatCurrency) {
    const body = document.getElementById('kpi-breakdown-body');
    if (!body) return;

    const applyTax = state.applyTax;

    let html = `
        <table class="stock-breakdown-table">
            <thead>
                <tr>
                    <th>Stock</th>
                    <th>Annual Income</th>
                    <th>Monthly Income</th>
                    ${applyTax ? '<th>Annual Tax</th>' : ''}
                </tr>
            </thead>
            <tbody>
    `;

    perStockBreakdown.forEach(({ name, result }) => {
        const annual  = result.summary.annualIncome;
        const monthly = result.summary.monthlyIncome;
        const tax     = result.summary.annualTax;

        html += `
            <tr>
                <td class="sbt-name">${escapeHtml(name)}</td>
                <td class="sbt-annual">${formatCurrency(Math.round(annual))}</td>
                <td class="sbt-monthly">${formatCurrency(Math.round(monthly * 100) / 100)}</td>
                ${applyTax ? `<td class="sbt-tax">${formatCurrency(Math.round(tax))}</td>` : ''}
            </tr>
        `;
    });

    html += `</tbody></table>`;
    body.innerHTML = html;
}

