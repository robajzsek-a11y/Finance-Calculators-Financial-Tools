///------------2026 Pomerancee. All rights reserved.----------------\\\
///------------https://creativecommons.org/licenses/by-nc-sa/4.0/---\\\
///------------Licensed under CC BY-NC-SA 4.0------------------------\\\





// Access global dependencies
const { etfs, calculateCompoundInterest, initChart, updateChart, updateChartTheme, updateChartCurrency } = window.App;

/*---------DOM ELEMENT SELECTORS------------*/

// Input Fields
const initialInvestmentInput = document.getElementById('initial-investment');
const contributionInput = document.getElementById('contribution');
const frequencyInput = document.getElementById('frequency');
const durationInput = document.getElementById('duration');
const durationSlider = document.getElementById('duration-slider');
const interestRateInput = document.getElementById('interest-rate');
const inflationRateInput = document.getElementById('inflation-rate');
const inflationInputContainer = document.getElementById('inflation-input-container');
const adjustInflationCheckbox = document.getElementById('adjust-inflation');
const etfSelect = document.getElementById('etf-select');
const etfDescription = document.getElementById('etf-description');

// New DOM Elements
const languageSelect = document.getElementById('language-select');
const currencySelect = document.getElementById('currency-select');
const customCurrencySelect = document.getElementById('custom-currency-select');
const selectedCurrencyDisplay = document.getElementById('selected-currency');
const currencyOptionsContainer = document.getElementById('currency-options');
const taxRateInput = document.getElementById('tax-rate');
const includeTaxCheckbox = document.getElementById('include-tax');
const taxInputContainer = document.getElementById('tax-input-container');
const setBenchmarkBtn = document.getElementById('set-benchmark-btn');
const clearBenchmarkBtn = document.getElementById('clear-benchmark-btn');
const shareBtn = document.getElementById('share-btn');
const downloadCsvBtn = document.getElementById('download-csv-btn');
const milestonesContainer = document.getElementById('milestones-container');
const milestonesList = document.getElementById('milestones-list');
const extraMilestonesContainer = document.getElementById('extra-milestones-container');
const extraMilestonesList = document.getElementById('extra-milestones-list');
const showMoreMilestonesBtn = document.getElementById('show-more-milestones');
const milestonesContainerDesktop = document.getElementById('milestones-container-desktop');
const milestonesListDesktop = document.getElementById('milestones-list-desktop');
const extraMilestonesContainerDesktop = document.getElementById('extra-milestones-container-desktop');
const extraMilestonesListDesktop = document.getElementById('extra-milestones-list-desktop');
const showMoreMilestonesBtnDesktop = document.getElementById('show-more-milestones-desktop');
const fireContainer = document.getElementById('fire-container');
const fireStatusContent = document.getElementById('fire-status-content');
const includeFireCheckbox = document.getElementById('include-fire');
const fireInputContainer = document.getElementById('fire-input-container');
const withdrawalRateInput = document.getElementById('withdrawal-rate');
const monthlyExpensesInput = document.getElementById('monthly-expenses');
const fireSummaryCard = document.getElementById('fire-summary-card');
const summaryCardsContainer = document.querySelector('.summary-cards');

// Custom Select Elements
const customLanguageSelect = document.getElementById('custom-language-select');
const selectedLanguageDisplay = document.getElementById('selected-language');
const languageOptionsContainer = document.getElementById('language-options');

const customFrequencySelect = document.getElementById('custom-frequency-select');
const selectedFrequencyDisplay = document.getElementById('selected-frequency');
const frequencyOptionsContainer = document.getElementById('frequency-options');

const customEtfSelect = document.getElementById('custom-etf-select');
const selectedEtfDisplay = document.getElementById('selected-etf');
const etfOptionsContainer = document.getElementById('etf-options');

const growthVisualToggle = document.getElementById('growth-visual-toggle');
const downloadPdfBtn = document.getElementById('download-pdf-btn');

const totalInvestedDisplay = document.getElementById('total-invested');
const portfolioValueDisplay = document.getElementById('portfolio-value');
const totalProfitDisplay = document.getElementById('total-profit');
const profitPercentDisplay = document.getElementById('profit-percent');
const profitLabelDisplay = document.getElementById('profit-label');
const chartCanvas = document.getElementById('growthChart');
const themeToggleBtn = document.getElementById('theme-toggle');

const toggleTableBtn = document.getElementById('toggle-table-btn');
const tableContainer = document.getElementById('breakdown-table-container');
const tableBody = document.getElementById('breakdown-table-body');

const mobileControlsToggle = document.getElementById('mobile-controls-toggle');
const controlsContent = document.getElementById('controls-content');

const githubStarCountNode = document.querySelector('.gh-star-count');

// State
let state = {
    initialInvestment: 10000,
    contribution: 5000,
    frequency: 12, // Monthly
    duration: 20,
    interestRate: 7,
    inflationRate: 2.5,
    adjustForInflation: false,
    taxRate: 15,
    includeTax: false,
    includeFire: false,
    withdrawalRate: 4,
    monthlyExpenses: 25000,
    advancedGrowthView: true,
    currency: 'USD',
    isDarkMode: true, // Default to dark mode
    benchmark: null // Stores the benchmark result
};

let controlsPanelBorderObserver = null;

/**
 * Initializes the application.
 */
function init() {
    setupCustomSelectListeners(); // Unified listeners
    populateETFOptions();
    initLanguage(); // Setup language properly
    
    // Check URL params
    parseURLParams();

    // Set initial DOM values from state
    syncDOMWithState();
    updateCurrencySymbols();
    updateCustomFrequencyOptions();
    updateCustomEtfOptions();

    // Fetch live stars for GitHub button
    fetchGitHubStars();

    // Check system preference or default to dark
    // state.isDarkMode = true; // Force default dark as requested (already in state)
    
    // Expose state for chart updates
    window.App.state = state;
    
    initChart(chartCanvas.getContext('2d'), state.isDarkMode, state.currency);
    initControlsPanelBorder();
    attachEventListeners();
    updateUIState(); // Set initial UI state
    calculateAndRender();
}

function updateControlsPanelBorder() {
    const controlsPanel = document.querySelector('.controls-panel');
    const borderSvg = controlsPanel?.querySelector('.controls-panel-border');
    const trackPath = borderSvg?.querySelector('.controls-panel-border-track');
    const wavePaths = borderSvg?.querySelectorAll('.controls-panel-border-wave');

    if (!controlsPanel || !borderSvg || !trackPath || !wavePaths?.length) return;

    const { width, height } = controlsPanel.getBoundingClientRect();
    if (width <= 0 || height <= 0) return;

    const computedStyle = window.getComputedStyle(controlsPanel);
    const radiusValue = parseFloat(computedStyle.borderTopLeftRadius);
    const radius = Number.isFinite(radiusValue) ? radiusValue : 16;
    const inset = 1;
    const right = width - inset;
    const bottom = height - inset;
    const cornerRadius = Math.max(0, Math.min(radius, (width - (inset * 2)) / 2, (height - (inset * 2)) / 2));
    const pathData = [
        `M ${inset + cornerRadius} ${inset}`,
        `H ${right - cornerRadius}`,
        `A ${cornerRadius} ${cornerRadius} 0 0 1 ${right} ${inset + cornerRadius}`,
        `V ${bottom - cornerRadius}`,
        `A ${cornerRadius} ${cornerRadius} 0 0 1 ${right - cornerRadius} ${bottom}`,
        `H ${inset + cornerRadius}`,
        `A ${cornerRadius} ${cornerRadius} 0 0 1 ${inset} ${bottom - cornerRadius}`,
        `V ${inset + cornerRadius}`,
        `A ${cornerRadius} ${cornerRadius} 0 0 1 ${inset + cornerRadius} ${inset}`,
        'Z'
    ].join(' ');

    borderSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    trackPath.setAttribute('d', pathData);
    wavePaths.forEach((wavePath) => {
        wavePath.setAttribute('d', pathData);
    });
}

function initControlsPanelBorder() {
    updateControlsPanelBorder();

    const controlsPanel = document.querySelector('.controls-panel');
    if (!controlsPanel || typeof ResizeObserver === 'undefined') return;

    controlsPanelBorderObserver?.disconnect();
    controlsPanelBorderObserver = new ResizeObserver(() => {
        updateControlsPanelBorder();
    });
    controlsPanelBorderObserver.observe(controlsPanel);
}

/**
 * Fetches the live star count from GitHub API for the repo.
 */
async function fetchGitHubStars() {
    if (!githubStarCountNode) return;

    try {
        const response = await fetch('https://api.github.com/repos/robinjiri/Investment-Calculator');
        if (!response.ok) return; // Keep hardcoded count if rate-limited or failed
        
        const data = await response.json();
        const stars = data.stargazers_count;
        
        // Format thousands nicely (e.g., "1.2k")
        if (stars >= 1000) {
            githubStarCountNode.textContent = (stars / 1000).toFixed(1) + 'k';
        } else {
            githubStarCountNode.textContent = stars;
        }
    } catch (e) {
        console.warn('Failed to fetch GitHub stars', e);
    }
}

/**
 * Unified Custom Select Logic
 */
function setupCustomSelectListeners() {
    // Currency Dropdown
    selectedCurrencyDisplay.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllDropdowns(customCurrencySelect);
        customCurrencySelect.classList.toggle('open');
    });

    // Language Dropdown
    selectedLanguageDisplay.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllDropdowns(customLanguageSelect);
        customLanguageSelect.classList.toggle('open');
    });

    // Frequency Dropdown
    selectedFrequencyDisplay.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllDropdowns(customFrequencySelect);
        customFrequencySelect.classList.toggle('open');
    });

    // ETF Dropdown
    selectedEtfDisplay.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllDropdowns(customEtfSelect);
        customEtfSelect.classList.toggle('open');
    });
    
    // Close all when clicking outside
    document.addEventListener('click', () => closeAllDropdowns());
}

function closeAllDropdowns(except = null) {
    const dropdowns = [
        customCurrencySelect,
        customLanguageSelect,
        customFrequencySelect,
        customEtfSelect
    ];
    dropdowns.forEach(d => {
        if (d !== except) d.classList.remove('open');
    });
}

function updateCustomCurrencyOptions() {
    const options = currencySelect.options;
    currencyOptionsContainer.innerHTML = '';
    
    for (let i = 0; i < options.length; i++) {
        const option = options[i];
        const div = document.createElement('div');
        div.className = 'currency-option'; // Keep for styles
        div.classList.add('custom-option'); // Add unified
        div.dataset.value = option.value;
        div.style.setProperty('--stagger-index', i);
        div.textContent = option.textContent;
        
        if (option.selected || option.value === state.currency) {
            div.classList.add('selected');
            updateCustomSelectDisplay(option.value, option.textContent);
        }
        
        div.addEventListener('click', () => {
            selectCurrency(option.value, option.textContent);
            customCurrencySelect.classList.remove('open');
        });
        
        currencyOptionsContainer.appendChild(div);
    }
}

function updateCustomLanguageOptions() {
    const options = languageSelect.options;
    languageOptionsContainer.innerHTML = '';
    
    for (let i = 0; i < options.length; i++) {
        const option = options[i];
        const div = document.createElement('div');
        div.className = 'custom-option';
        div.dataset.value = option.value;
        div.style.setProperty('--stagger-index', i);
        div.textContent = option.textContent;
        
        if (option.selected) {
            div.classList.add('selected');
            selectedLanguageDisplay.querySelector('.option-text').textContent = option.textContent;
        }
        
        div.addEventListener('click', () => {
            languageSelect.value = option.value;
            selectedLanguageDisplay.querySelector('.option-text').textContent = option.textContent;
            changeLanguage(option.value);
            updateCustomOptionHighlight(languageOptionsContainer, option.value);
            customLanguageSelect.classList.remove('open');
        });
        
        languageOptionsContainer.appendChild(div);
    }
}

function updateCustomFrequencyOptions() {
    const options = frequencyInput.options;
    frequencyOptionsContainer.innerHTML = '';
    const t = window.App.currentTranslation || window.App.translations['en'];
    
    for (let i = 0; i < options.length; i++) {
        const option = options[i];
        const div = document.createElement('div');
        div.className = 'custom-option';
        div.dataset.value = option.value;
        div.style.setProperty('--stagger-index', i);
        const text = t[option.getAttribute('data-i18n')] || option.textContent;
        div.textContent = text;
        
        if (option.selected) {
            div.classList.add('selected');
            selectedFrequencyDisplay.querySelector('.option-text').textContent = text;
        }
        
        div.addEventListener('click', () => {
            frequencyInput.value = option.value;
            selectedFrequencyDisplay.querySelector('.option-text').textContent = text;
            handleInputChange();
            updateCustomOptionHighlight(frequencyOptionsContainer, option.value);
            customFrequencySelect.classList.remove('open');
        });
        
        frequencyOptionsContainer.appendChild(div);
    }
}

function updateCustomEtfOptions() {
    const options = etfSelect.options;
    etfOptionsContainer.innerHTML = '';
    const t = window.App.currentTranslation || window.App.translations['en'];
    
    for (let i = 0; i < options.length; i++) {
        const option = options[i];
        const div = document.createElement('div');
        div.className = 'custom-option';
        div.dataset.value = option.value;
        div.style.setProperty('--stagger-index', i);
        
        const i18nKey = option.getAttribute('data-i18n');
        const text = i18nKey ? t[i18nKey] : option.textContent;
        div.textContent = text;
        
        if (option.selected) {
            div.classList.add('selected');
            selectedEtfDisplay.querySelector('.option-text').textContent = text;
        }
        
        div.addEventListener('click', () => {
            etfSelect.value = option.value;
            selectedEtfDisplay.querySelector('.option-text').textContent = text;
            const event = new Event('change');
            etfSelect.dispatchEvent(event);
            updateCustomOptionHighlight(etfOptionsContainer, option.value);
            customEtfSelect.classList.remove('open');
        });
        
        etfOptionsContainer.appendChild(div);
    }
}

function selectCurrency(value, text) {
    // Update original select
    currencySelect.value = value;
    
    // Trigger change event on original select to maintain compatibility
    const event = new Event('change');
    currencySelect.dispatchEvent(event);
    
    // Update custom UI
    updateCustomSelectDisplay(value, text);
    
    // Update selected state in options list
    updateCustomOptionHighlight(currencyOptionsContainer, value);
}

function updateCustomSelectDisplay(value, text) {
    const symbol = getCurrencySymbol(value);
    const shortDisplay = `${symbol} ${value}`; // e.g., "$ USD"
    selectedCurrencyDisplay.querySelector('.currency-short').textContent = shortDisplay;
}

/**
 * Updates the highlight (selected class) for custom dropdown options.
 */
function updateCustomOptionHighlight(container, value) {
    // Ensure container exists
    if (!container) return;
    
    container.querySelectorAll('.custom-option, .currency-option').forEach(opt => {
        // Use loose equality check or convert to string for consistent comparison
        opt.classList.toggle('selected', opt.dataset.value === String(value));
    });
}

/**
 * Populates the ETF options from the data file.
 */
function populateETFOptions() {
    if (!etfs) return;
    etfs.forEach(etf => {
        const option = document.createElement('option');
        option.value = etf.id;
        option.textContent = etf.name;
        etfSelect.appendChild(option);
    });
}

/**
 * Parses URL parameters and updates state.
 */
function parseURLParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('initial')) state.initialInvestment = parseFloat(params.get('initial'));
    if (params.has('contribution')) state.contribution = parseFloat(params.get('contribution'));
    if (params.has('frequency')) state.frequency = parseInt(params.get('frequency'));
    if (params.has('duration')) state.duration = parseInt(params.get('duration'));
    if (params.has('rate')) state.interestRate = parseFloat(params.get('rate'));
    if (params.has('inflation')) state.inflationRate = parseFloat(params.get('inflation'));
    if (params.has('adjustInflation')) state.adjustForInflation = params.get('adjustInflation') === 'true';
    if (params.has('tax')) state.taxRate = parseFloat(params.get('tax'));
    if (params.has('includeTax')) state.includeTax = params.get('includeTax') === 'true';
    if (params.has('currency')) state.currency = params.get('currency');
}

/**
 * Syncs DOM elements with current state.
 */
function syncDOMWithState() {
    initialInvestmentInput.value = state.initialInvestment;
    contributionInput.value = state.contribution;
    frequencyInput.value = state.frequency;
    durationInput.value = state.duration;
    durationSlider.value = state.duration;
    interestRateInput.value = state.interestRate;
    inflationRateInput.value = state.inflationRate;
    adjustInflationCheckbox.checked = state.adjustForInflation;
    taxRateInput.value = state.taxRate;
    includeTaxCheckbox.checked = state.includeTax;
    includeFireCheckbox.checked = state.includeFire;
    withdrawalRateInput.value = state.withdrawalRate;
    monthlyExpensesInput.value = state.monthlyExpenses;
    currencySelect.value = state.currency;
    updateCustomSelectDisplay(state.currency);
}

/**
 * Attaches event listeners to inputs.
 */
function attachEventListeners() {
    // Input listeners for real-time updates
    const inputs = [
        initialInvestmentInput,
        contributionInput,
        interestRateInput,
        inflationRateInput,
        taxRateInput,
        monthlyExpensesInput
    ];

    inputs.forEach(input => {
        input.addEventListener('input', handleInputChange);
    });

    frequencyInput.addEventListener('change', handleInputChange);
    adjustInflationCheckbox.addEventListener('change', handleInputChange);
    includeTaxCheckbox.addEventListener('change', handleInputChange);
    includeFireCheckbox.addEventListener('change', handleInputChange);
    withdrawalRateInput.addEventListener('input', handleInputChange);
    currencySelect.addEventListener('change', handleCurrencyChange);
    
    // Duration sync (slider <-> number input)
    durationInput.addEventListener('input', (e) => {
        durationSlider.value = e.target.value;
        handleInputChange(e);
    });

    durationSlider.addEventListener('input', (e) => {
        durationInput.value = e.target.value;
        handleInputChange(e);
    });

    // ETF Selection
    etfSelect.addEventListener('change', handleETFChange);

    // Theme Toggle — now a checkbox slider
    const themeToggleInput = document.getElementById('theme-toggle-input');
    themeToggleInput.addEventListener('change', toggleTheme);

    // Table Toggle
    toggleTableBtn.addEventListener('click', toggleTableVisibility);

    // Benchmark Buttons
    setBenchmarkBtn.addEventListener('click', setBenchmark);
    clearBenchmarkBtn.addEventListener('click', clearBenchmark);

    // Share Button
    shareBtn.addEventListener('click', shareCalculation);

    // Download CSV
    downloadCsvBtn.addEventListener('click', downloadCSV);

    if (growthVisualToggle) {
        growthVisualToggle.addEventListener('change', (e) => setGrowthVisualizationEnabled(e.target.checked));
    }

    // Download PDF
    downloadPdfBtn.addEventListener('click', downloadPDF);

    // Milestones Toggle
    showMoreMilestonesBtn.addEventListener('click', toggleExtraMilestones);
    showMoreMilestonesBtnDesktop.addEventListener('click', toggleExtraMilestones);

    // Tab Bar Navigation Logic
    const tabbar = document.getElementById('tabbar');
    if (tabbar) {
        document.body.setAttribute('data-active-tab', '0');
        const tabs = tabbar.querySelectorAll('ul li');
        const tabContents = document.querySelectorAll('[data-tab-content]');

        const syncTabbarIndicator = (tab) => {
            const ul = tabbar.querySelector('ul');
            if (!ul) return;

            const tabRect = tab.getBoundingClientRect();
            const tabbarRect = ul.getBoundingClientRect();
            const offset = (tabRect.left - tabbarRect.left) + (tabRect.width / 2);

            tabbar.style.setProperty('--indicator-x', `${offset - 34}px`);
            tabbar.style.setProperty('--active-line-x', `${offset}px`);
        };

        tabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                // Return if already active
                if (tab.classList.contains('active')) return;

                // Remove active from all tabs
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                syncTabbarIndicator(tab);
                
                // Handle content switching
                const targetIndex = tab.getAttribute('data-tab-index');
                document.body.setAttribute('data-active-tab', targetIndex);
                tabContents.forEach(content => {
                    if (content.getAttribute('data-tab-content') === targetIndex) {
                        content.classList.add('tab-active');
                    } else {
                        content.classList.remove('tab-active');
                    }
                });
                
                // Extra logic to trigger chart resize if we switch to chart tab
                if (targetIndex === "1") {
                    setTimeout(() => {
                        window.dispatchEvent(new Event('resize'));
                    }, 50); // slight delay for css display to apply
                }
            });
        });

        // Initialize indicator position on load
        setTimeout(() => {
            const activeTab = tabbar.querySelector('ul li.active');
            if (activeTab) {
                syncTabbarIndicator(activeTab);
            }
        }, 100);

        // Update indicator position on window resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const currentActive = tabbar.querySelector('ul li.active');
                if (currentActive) {
                    const tabRect = currentActive.getBoundingClientRect();
                    if (tabRect.width > 0) {
                        syncTabbarIndicator(currentActive);
                    }
                }
            }, 100);
        });
    }
}

/**
 * Toggles between light and dark mode
 */
function updateThemeToggleAccessibility() {
    const t = window.App.currentTranslation || window.App.translations['en'];
    const toggleLabel = state.isDarkMode ? t.switchToLight : t.switchToDark;

    themeToggleBtn.setAttribute('title', toggleLabel);
    themeToggleBtn.setAttribute('aria-label', toggleLabel);
}

function toggleTheme() {
    const themeToggleInput = document.getElementById('theme-toggle-input');
    // Checked = light mode, unchecked = dark mode
    state.isDarkMode = !themeToggleInput.checked;
    document.body.classList.toggle('light-mode', !state.isDarkMode);

    // Update chart colors
    updateChartTheme(state.isDarkMode);
    updateThemeToggleAccessibility();
}

function setGrowthVisualizationEnabled(enabled) {
    state.advancedGrowthView = enabled;
    if (growthVisualToggle) {
        growthVisualToggle.checked = enabled;
    }

    if (window.App.setGrowthVisualizationEnabled) {
        window.App.setGrowthVisualizationEnabled(enabled);
    }

    if (state.lastResult) {
        const benchmarkValues = state.benchmark ? state.benchmark.portfolioValue : null;
        updateChart(state.lastResult.labels, state.lastResult.totalInvested, state.lastResult.portfolioValue, benchmarkValues);
    }
}

/**
 * Handles general input changes with a debounce to prevent UI lag.
 */
let inputDebounceTimer;
function handleInputChange(e) {
    clearTimeout(inputDebounceTimer);
    inputDebounceTimer = setTimeout(() => {
        updateStateFromDOM();
        updateUIState();
        calculateAndRender();
    }, 300);
}

/**
 * Handles currency change.
 */
function handleCurrencyChange(e) {
    state.currency = e.target.value;
    updateCurrencySymbols();
    updateChartCurrency(state.currency);
    calculateAndRender(); // Re-render summary cards and table
}

/**
 * Handles ETF preset selection.
 */
function handleETFChange(e) {
    const selectedId = e.target.value;
    const selectedETF = etfs.find(etf => etf.id === selectedId);
    const t = window.App.currentTranslation || window.App.translations['en'];

    if (selectedETF) {
        // Update interest rate
        interestRateInput.value = selectedETF.avgReturn;
        
        // Use translated description if available
        const descKey = `etf_${selectedId}_desc`;
        etfDescription.textContent = t[descKey] || selectedETF.description;
    } else {
        etfDescription.textContent = '';
    }

    updateStateFromDOM();
    calculateAndRender();
}

/**
 * Updates the state object from current DOM values.
 */
/*---------INPUT AND FORM HANDLING------------*/

/**
 * Synchronizes the internal 'state' object with current values in the DOM.
 */
function updateStateFromDOM() {
    state.initialInvestment = parseFloat(initialInvestmentInput.value) || 0;
    state.contribution = parseFloat(contributionInput.value) || 0;
    state.frequency = parseInt(frequencyInput.value);
    state.duration = parseInt(durationInput.value) || 1;
    state.interestRate = parseFloat(interestRateInput.value) || 0;
    state.inflationRate = parseFloat(inflationRateInput.value) || 0;
    state.adjustForInflation = adjustInflationCheckbox.checked;
    state.taxRate = parseFloat(taxRateInput.value) || 0;
    state.includeTax = includeTaxCheckbox.checked;
    state.includeFire = includeFireCheckbox.checked;
    state.withdrawalRate = parseFloat(withdrawalRateInput.value) || 4;
    state.monthlyExpenses = parseFloat(monthlyExpensesInput.value) || 0;

    // Boundary checks
    const MAX_AMOUNT = 1000000000000; // 1 Trillion cap
    const MAX_PERCENT = 1000; // 1000% cap

    if (state.duration < 1) state.duration = 1;
    if (state.duration > 150) state.duration = 150;
    
    if (state.initialInvestment < 0) state.initialInvestment = 0;
    if (state.initialInvestment > MAX_AMOUNT) {
        state.initialInvestment = MAX_AMOUNT;
        initialInvestmentInput.value = MAX_AMOUNT;
    }
    
    if (state.contribution < 0) state.contribution = 0;
    if (state.contribution > MAX_AMOUNT) {
        state.contribution = MAX_AMOUNT;
        contributionInput.value = MAX_AMOUNT;
    }
    
    if (state.interestRate < 0) state.interestRate = 0;
    if (state.interestRate > MAX_PERCENT) {
        state.interestRate = MAX_PERCENT;
        interestRateInput.value = MAX_PERCENT;
    }
    
    if (state.inflationRate < 0) state.inflationRate = 0;
    if (state.inflationRate > MAX_PERCENT) {
        state.inflationRate = MAX_PERCENT;
        inflationRateInput.value = MAX_PERCENT;
    }
    
    if (state.taxRate < 0) state.taxRate = 0;
    if (state.taxRate > MAX_PERCENT) {
        state.taxRate = MAX_PERCENT;
        taxRateInput.value = MAX_PERCENT;
    }
    
    updateDurationUI();
}

/**
 * Updates UI elements based on state (animations/visibility).
 */
function updateUIState() {
    // Inflation Input Visibility
    if (state.adjustForInflation) {
        inflationInputContainer.classList.add('expanded');
    } else {
        inflationInputContainer.classList.remove('expanded');
    }

    // Tax Input Visibility
    if (state.includeTax) {
        taxInputContainer.classList.add('expanded');
    } else {
        taxInputContainer.classList.remove('expanded');
    }

    // FIRE Input Visibility
    if (state.includeFire) {
        fireInputContainer.classList.add('expanded');
        fireSummaryCard.classList.remove('hidden');
        summaryCardsContainer.classList.add('with-fire');
    } else {
        fireInputContainer.classList.remove('expanded');
        fireSummaryCard.classList.add('hidden');
        summaryCardsContainer.classList.remove('with-fire');
    }

    // Benchmark Buttons Visibility
    const t = window.App.currentTranslation || window.App.translations['en'];
    clearBenchmarkBtn.textContent = t.clearBenchmark;

    if (state.benchmark) {
        clearBenchmarkBtn.classList.remove('hidden');
        setBenchmarkBtn.textContent = t.updateBenchmark;
    } else {
        clearBenchmarkBtn.classList.add('hidden');
        setBenchmarkBtn.textContent = t.setBenchmark;
    }

    if (growthVisualToggle) {
        growthVisualToggle.checked = state.advancedGrowthView;
    }
}

/**
 * Updates the duration slider UI based on the current duration value.
 */
function updateDurationUI() {
    if (state.duration > 50) {
        durationSlider.classList.add('inactive');
        durationSlider.disabled = true;
    } else {
        durationSlider.classList.remove('inactive');
        durationSlider.disabled = false;
        durationSlider.value = state.duration;
    }
}

/**
 * Updates the currency symbols shown in inputs.
 */
function updateCurrencySymbols() {
    const symbol = getCurrencySymbol(state.currency);
    document.querySelectorAll('.currency-symbol').forEach(el => {
        el.textContent = symbol;
    });
}

/**
 * Performs calculation and updates UI.
 */
/*---------CALCULATION AND RENDERING------------*/

/**
 * Main calculation loop.
 * Triggers Interest calculations and updates all UI components (Cards, Chart, Table).
 */
function calculateAndRender() {
    const result = calculateCompoundInterest(
        state.initialInvestment,
        state.contribution,
        state.frequency,
        state.interestRate,
        state.duration,
        state.inflationRate,
        state.adjustForInflation,
        state.taxRate,
        state.includeTax
    );

    // Store result for CSV export
    state.lastResult = result;

    updateSummaryCards(result.summary, state.duration);
    
    // Pass benchmark value if it exists
    const benchmarkValues = state.benchmark ? state.benchmark.portfolioValue : null;
    
    updateChart(result.labels, result.totalInvested, result.portfolioValue, benchmarkValues);
    updateBreakdownTable(result.breakdown);
    checkMilestones(result.portfolioValue, result.totalInvested);
    if (state.includeFire) updateFIREStatus(result.summary.finalBalance);
}

/**
 * Updates the FIRE status based on the final balance.
 */
function updateFIREStatus(finalBalance) {
    const annualExpenses = state.monthlyExpenses * 12;
    const requiredCapital = annualExpenses / (state.withdrawalRate / 100);
    
    const annualWithdrawal = finalBalance * (state.withdrawalRate / 100);
    const monthlyWithdrawal = annualWithdrawal / 12;
    
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: state.currency,
            currencyDisplay: 'narrowSymbol',
            maximumFractionDigits: 0
        }).format(value);
    };

    const t = window.App.currentTranslation || window.App.translations['en'];

    // Find in which year FIRE is achieved
    let fireYear = -1;
    if (state.lastResult && state.lastResult.portfolioValue) {
        fireYear = state.lastResult.portfolioValue.findIndex(val => val >= requiredCapital);
    }

    let fireYearHtml = '';
    if (fireYear !== -1) {
        fireYearHtml = `<div class="fire-achieved-year">🔥 ${t.fireAchieved} (${t.year} ${fireYear})</div>`;
    }

    fireStatusContent.innerHTML = `
        <div class="fire-stat">
            <span>${t.monthlyPassiveIncome}</span>
            <strong>${formatCurrency(monthlyWithdrawal)}</strong>
        </div>
        <div class="fire-stat">
            <span>${t.targetCapital}</span>
            <strong>${formatCurrency(requiredCapital)}</strong>
        </div>
        ${fireYearHtml}
    `;
}

/**
 * Updates the summary text cards.
 */
function updateSummaryCards(summary, years) {
    const formatValue = (value) => {
        if (value >= 1e9) {
            // Use compact notation for Billions and Trillions
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: state.currency,
                currencyDisplay: 'narrowSymbol',
                notation: "compact",
                compactDisplay: "short",
                maximumFractionDigits: 2
            }).format(value);
        } else {
            // Standard format for smaller numbers
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: state.currency,
                currencyDisplay: 'narrowSymbol',
                maximumFractionDigits: 0
            }).format(value);
        }
    };

    totalInvestedDisplay.textContent = formatValue(summary.totalInvested);
    portfolioValueDisplay.textContent = formatValue(summary.finalBalance);
    totalProfitDisplay.textContent = formatValue(summary.totalInterest);

    // Update profit percentage
    if (summary.totalInvested > 0) {
        const percent = (summary.totalInterest / summary.totalInvested) * 100;
        profitPercentDisplay.textContent = `+${percent.toFixed(1)}%`;
    } else {
        profitPercentDisplay.textContent = '0%';
    }

    // Update dynamic label
    const t = window.App.currentTranslation || window.App.translations['en'];
    profitLabelDisplay.textContent = t.profitAfterYears.replace('{years}', years);
}

/**
 * Toggles the visibility of the breakdown table.
 */
function toggleTableVisibility() {
    const isExpanded = tableContainer.classList.contains('expanded');
    const t = window.App.currentTranslation || window.App.translations['en'];
    
    if (isExpanded) {
        tableContainer.classList.remove('expanded');
        toggleTableBtn.textContent = t.showBreakdown;
    } else {
        tableContainer.classList.add('expanded');
        toggleTableBtn.textContent = t.hideBreakdown;
    }
}

/**
 * Updates the year-by-year breakdown table.
 */
function updateBreakdownTable(breakdownData) {
    // Clear existing rows
    tableBody.innerHTML = '';

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: state.currency,
            currencyDisplay: 'narrowSymbol',
            maximumFractionDigits: 0
        }).format(value);
    };

    breakdownData.forEach(row => {
        const tr = document.createElement('tr');
        
        // Highlight every 5th year for readability
        if (row.year > 0 && row.year % 5 === 0) {
            tr.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        }

        tr.innerHTML = `
            <td>${row.year}</td>
            <td>${formatCurrency(row.invested)}</td>
            <td style="color: var(--text-secondary)">${formatCurrency(row.interest)}</td>
            <td style="color: var(--primary-color); font-weight: bold;">${formatCurrency(row.balance)}</td>
        `;
        
        tableBody.appendChild(tr);
    });
}

/**
 * Sets the current calculation as the benchmark.
 */
function setBenchmark() {
    if (!state.lastResult) return;
    state.benchmark = {
        portfolioValue: [...state.lastResult.portfolioValue]
    };
    updateUIState();
    calculateAndRender();
}

/**
 * Clears the benchmark.
 */
function clearBenchmark() {
    state.benchmark = null;
    updateUIState();
    calculateAndRender();
}

/**
 * Generates and shares the URL.
 */
function shareCalculation() {
    const params = new URLSearchParams();
    params.set('initial', state.initialInvestment);
    params.set('contribution', state.contribution);
    params.set('frequency', state.frequency);
    params.set('duration', state.duration);
    params.set('rate', state.interestRate);
    params.set('inflation', state.inflationRate);
    params.set('adjustInflation', state.adjustForInflation);
    params.set('tax', state.taxRate);
    params.set('includeTax', state.includeTax);
    params.set('currency', state.currency);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);

    const fullUrl = window.location.href;
    
    const t = window.App.currentTranslation || window.App.translations['en'];
    
    const showSuccess = () => {
        const originalText = shareBtn.textContent;
        shareBtn.textContent = t.copiedLink;
        shareBtn.style.backgroundColor = 'var(--success-color)';
        shareBtn.style.color = '#fff';
        shareBtn.style.borderColor = 'var(--success-color)';
        setTimeout(() => {
            shareBtn.textContent = t.shareCalculation;
            shareBtn.style.backgroundColor = '';
            shareBtn.style.color = '';
            shareBtn.style.borderColor = '';
        }, 3000);
    };

    if (navigator.clipboard) {
        navigator.clipboard.writeText(fullUrl).then(showSuccess).catch(err => {
            console.error('Failed to copy: ', err);
            // Even if clipboard fails, show visual feedback so it doesn't look broken
            showSuccess();
        });
    } else {
        // Fallback for older browsers or insecure contexts
        try {
            const textArea = document.createElement("textarea");
            textArea.value = fullUrl;
            textArea.style.position = "fixed";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showSuccess();
        } catch (err) {
            console.error('Fallback copy failed', err);
        }
    }
}

/**
 * Downloads the breakdown data as CSV.
 */
function downloadCSV() {
    if (!state.lastResult || !state.lastResult.breakdown) return;

    const t = window.App.currentTranslation || window.App.translations['en'];
    const breakdown = state.lastResult.breakdown;
    const csvContent = "data:text/csv;charset=utf-8," 
        + `${t.tableYear},${t.tableInvested},${t.tableInterest},${t.tableBalance}\n`
        + breakdown.map(e => `${e.year},${e.invested},${e.interest},${e.balance}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "investment_breakdown.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Downloads the calculation as a PDF report.
 */
function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const symbol = getCurrencySymbol(state.currency);
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(99, 102, 241); // Indigo 500
    doc.text('Smart Investment Report', 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
    
    // Inputs Summary
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('Investment Parameters', 20, 45);
    
    doc.setFontSize(11);
    const inputs = [
        ['Initial Investment:', `${symbol}${state.initialInvestment.toLocaleString()}`],
        ['Regular Contribution:', `${symbol}${state.contribution.toLocaleString()} (${frequencyInput.options[frequencyInput.selectedIndex].text})`],
        ['Investment Duration:', `${state.duration} Years`],
        ['Expected Annual Return:', `${state.interestRate}%`],
        ['Adjusted for Inflation:', state.adjustForInflation ? `Yes (${state.inflationRate}%)` : 'No'],
        ['Including Tax:', state.includeTax ? `Yes (${state.taxRate}%)` : 'No']
    ];
    
    let yPos = 55;
    inputs.forEach(item => {
        doc.text(item[0], 20, yPos);
        doc.text(item[1], 80, yPos);
        yPos += 7;
    });
    
    // Results Summary
    if (state.lastResult) {
        yPos += 10;
        doc.setFontSize(16);
        doc.text('Results Summary', 20, yPos);
        
        yPos += 10;
        doc.setFontSize(11);
        const results = [
            ['Total Invested:', `${symbol}${state.lastResult.summary.totalInvested.toLocaleString()}`],
            ['Total Interest Earned:', `${symbol}${state.lastResult.summary.totalInterest.toLocaleString()}`],
            ['Final Portfolio Value:', `${symbol}${state.lastResult.summary.finalBalance.toLocaleString()}`]
        ];
        
        results.forEach(item => {
            doc.text(item[0], 20, yPos);
            doc.text(item[1], 80, yPos);
            yPos += 7;
        });

        // Add Chart Image
        const chartImg = chartCanvas.toDataURL('image/png', 1.0);
        doc.addImage(chartImg, 'PNG', 20, yPos + 5, 170, 80);
        
        // Breakdown Table
        doc.addPage();
        doc.setFontSize(16);
        doc.text('Year-by-Year Breakdown', 20, 20);
        
        const tableData = state.lastResult.breakdown.map(row => [
            row.year,
            `${symbol}${row.invested.toLocaleString()}`,
            `${symbol}${row.interest.toLocaleString()}`,
            `${symbol}${row.balance.toLocaleString()}`
        ]);
        
        doc.autoTable({
            startY: 30,
            head: [['Year', 'Total Invested', 'Interest Earned', 'Total Balance']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillStyle: [99, 102, 241] }
        });
    }
    
    doc.save('Investment_Report.pdf');
}

/**
 * Toggles the visibility of extra milestones.
 */
function toggleExtraMilestones() {
    const isExpanded = extraMilestonesContainer.classList.contains('expanded');
    const t = window.App.currentTranslation || window.App.translations['en'];
    
    if (isExpanded) {
        extraMilestonesContainer.classList.remove('expanded');
        extraMilestonesContainerDesktop.classList.remove('expanded');
        showMoreMilestonesBtn.textContent = t.showAllMilestones;
        showMoreMilestonesBtnDesktop.textContent = t.showAllMilestones;
    } else {
        extraMilestonesContainer.classList.add('expanded');
        extraMilestonesContainerDesktop.classList.add('expanded');
        showMoreMilestonesBtn.textContent = t.showLess;
        showMoreMilestonesBtnDesktop.textContent = t.showLess;
    }
}

function buildExtraMilestones(maxValue) {
    const extraMilestones = [];
    const linearMilestoneCeiling = 20000000;

    for (let value = 10000000; value <= maxValue && value <= linearMilestoneCeiling; value += 5000000) {
        extraMilestones.push({ value, label: formatMilestoneValueLabel(value), emoji: '🏆' });
    }

    for (let value = 40000000; value <= maxValue; value *= 2) {
        extraMilestones.push({ value, label: formatMilestoneValueLabel(value), emoji: '🏆' });
    }

    return extraMilestones;
}

function formatMilestoneValueLabel(value) {
    const ranges = [
        { divisor: 1000000000000, suffix: ' Trillion' },
        { divisor: 1000000000, suffix: ' Billion' },
        { divisor: 1000000, suffix: ' Million' }
    ];

    for (const range of ranges) {
        if (value >= range.divisor) {
            const scaledValue = value / range.divisor;
            const formattedValue = scaledValue >= 100
                ? scaledValue.toFixed(0)
                : scaledValue >= 10
                    ? scaledValue.toFixed(1)
                    : scaledValue.toFixed(2);

            return `${formattedValue.replace(/\.0+$|(\.\d*[1-9])0+$/, '$1')}${range.suffix}`;
        }
    }

    if (value >= 1000) {
        return `${Math.round(value / 1000)}k`;
    }

    return value.toString();
}

function getBeatsDepositYearIndex(portfolioValueData, totalInvestedData) {
    if (!portfolioValueData || !totalInvestedData || portfolioValueData.length !== totalInvestedData.length) {
        return -1;
    }

    const cumulativeInterest = portfolioValueData.map((value, index) => Math.max(value - totalInvestedData[index], 0));

    for (let index = 1; index < cumulativeInterest.length; index += 1) {
        const yearlyDeposit = Math.max(totalInvestedData[index] - totalInvestedData[index - 1], 0);
        const yearlyInterest = Math.max(cumulativeInterest[index] - cumulativeInterest[index - 1], 0);

        if (yearlyInterest > yearlyDeposit) {
            return index;
        }
    }

    return -1;
}

/**
 * Checks for financial milestones and updates the UI.
 */
/*---------MILESTONE AND CURRENCY UTILITIES------------*/

/**
 * Checks for financial milestones and updates the UI list.
 */
function checkMilestones(portfolioValueData, totalInvestedData) {
    if (!portfolioValueData || portfolioValueData.length === 0) return;
    
    const t = window.App.currentTranslation || window.App.translations['en'];
    
    milestonesList.innerHTML = '';
    milestonesListDesktop.innerHTML = '';
    extraMilestonesList.innerHTML = '';
    extraMilestonesListDesktop.innerHTML = '';
    extraMilestonesContainer.classList.remove('expanded');
    extraMilestonesContainerDesktop.classList.remove('expanded');
    showMoreMilestonesBtn.textContent = t.showAllMilestones;
    showMoreMilestonesBtnDesktop.textContent = t.showAllMilestones;

    const baseMilestones = [
        { value: 100000, label: '100k', emoji: '💰' },
        { value: 500000, label: '500k', emoji: '🚀' },
        { value: 1000000, label: '1 Million', emoji: '🏆' },
        { value: 2000000, label: '2 Million', emoji: '🏆' },
        { value: 5000000, label: '5 Million', emoji: '🏆' }
    ];

    const maxValue = Math.max(...portfolioValueData);
    const extraMilestones = buildExtraMilestones(maxValue);

    let foundMilestones = false;
    let hasExtra = false;
    const symbol = getCurrencySymbol(state.currency);

    const allPotentialMilestones = [...baseMilestones, ...extraMilestones];

    if (state.includeFire) {
        const annualExpenses = state.monthlyExpenses * 12;
        const requiredCapital = annualExpenses / (state.withdrawalRate / 100);
        const fireYearIndex = portfolioValueData.findIndex(val => val >= requiredCapital);
        
        if (fireYearIndex !== -1) {
            allPotentialMilestones.push({
                value: requiredCapital,
                label: `${t.fireAchieved}`,
                emoji: '🔥',
                isFire: true
            });
        }
    }

    const beatsDepositYearIndex = getBeatsDepositYearIndex(portfolioValueData, totalInvestedData);
    if (beatsDepositYearIndex !== -1) {
        allPotentialMilestones.push({
            value: portfolioValueData[beatsDepositYearIndex],
            label: t.firstInterestCrossover || 'Beats deposit',
            emoji: '⚡',
            isBeatsDeposit: true
        });
    }

    allPotentialMilestones.sort((a, b) => a.value - b.value);

    allPotentialMilestones.forEach(milestone => {
        const yearIndex = portfolioValueData.findIndex(val => val >= milestone.value);
        if (yearIndex !== -1) {
            foundMilestones = true;
            let emoji = milestone.emoji;
            if (milestone.value > 1000000 && !milestone.isFire && !milestone.isBeatsDeposit) {
                const randomEmojis = ['💎', '✨', '🤴', '🏝️', '💸', '🦁'];
                emoji = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
            }

            const milestoneLabel = milestone.isFire || milestone.isBeatsDeposit
                ? milestone.label
                : `${symbol}${milestone.label}`;

            const milestoneMarkup = `
                <div class="milestone-item">
                    <span class="milestone-icon">${emoji}</span>
                    <div class="milestone-content">
                        <strong>${milestoneLabel}</strong>
                        <span class="year">${t.year} ${yearIndex}</span>
                    </div>
                </div>
            `;
            
            if (milestone.value <= 1000000) {
                const li = document.createElement('li');
                li.innerHTML = milestoneMarkup;
                milestonesList.appendChild(li);
                const desktopLi = document.createElement('li');
                desktopLi.innerHTML = milestoneMarkup;
                milestonesListDesktop.appendChild(desktopLi);
            } else {
                hasExtra = true;
                const li = document.createElement('li');
                li.innerHTML = milestoneMarkup;
                extraMilestonesList.appendChild(li);
                const desktopLi = document.createElement('li');
                desktopLi.innerHTML = milestoneMarkup;
                extraMilestonesListDesktop.appendChild(desktopLi);
            }
        }
    });

    if (foundMilestones) {
        milestonesContainer.classList.remove('hidden');
        milestonesContainerDesktop.classList.remove('hidden');
        if (hasExtra) {
            showMoreMilestonesBtn.classList.remove('hidden');
            showMoreMilestonesBtnDesktop.classList.remove('hidden');
        } else {
            showMoreMilestonesBtn.classList.add('hidden');
            showMoreMilestonesBtnDesktop.classList.add('hidden');
        }
    } else {
        milestonesContainer.classList.add('hidden');
        milestonesContainerDesktop.classList.add('hidden');
    }
}

/**
 * Helper to get currency symbol.
 */
function getCurrencySymbol(currency) {
    const SYMBOLS = {
        USD: '$', EUR: '€', GBP: '£', CHF: 'Fr', SEK: 'kr', NOK: 'kr', DKK: 'kr',
        PLN: 'zł', CZK: 'Kč', HUF: 'Ft', RON: 'lei', BGN: 'лв', ISK: 'kr', RSD: 'дин',
        MKD: 'ден', BAM: 'KM', ALL: 'L', GEL: '₾', UAH: '₴', BYN: 'Br', MDL: 'L',
        RUB: '₽', TRY: '₺', JPY: '¥'
    };
    if (SYMBOLS[currency]) return SYMBOLS[currency];
    try {
        const parts = new Intl.NumberFormat('en-US', { style: 'currency', currency, currencyDisplay: 'narrowSymbol' }).formatToParts(0);
        const cur = parts.find(p => p.type === 'currency');
        return cur ? cur.value : currency;
    } catch (e) {
        return currency;
    }
}

/**
 * Translates currency options using Intl.DisplayNames if supported based on user language.
 */
function translateCurrencies(langCode) {
    const userLang = langCode || languageSelect.value || 'en-US';
    
    if (Intl && Intl.DisplayNames) {
        try {
            const currencyNames = new Intl.DisplayNames([userLang], { type: 'currency' });
            
            Array.from(currencySelect.options).forEach(option => {
                const code = option.value;
                const translatedName = currencyNames.of(code);
                
                // Extract symbol from existing text (e.g., "$")
                const match = option.textContent.match(/\((.*?)\)/);
                const symbol = match ? match[1] : '';
                
                if (translatedName) {
                    option.textContent = `${translatedName} (${symbol})`;
                }
            });
        } catch (e) {
            console.error("Currency translation not supported", e);
        }
    }
}

/*---------TRANSLATION SYSTEM------------*/

/**
 * Detects user browser language and sets the initial UI translation.
 */
function initLanguage() {
    const userLang = navigator.language || navigator.userLanguage || 'en';
    const baseLang = userLang.split('-')[0];
    
    let selectedLang = 'en';
    if (window.App.translations && window.App.translations[baseLang]) {
        selectedLang = baseLang;
    }
    
    // Set matching option in dropdown or fallback
    const validOpts = Array.from(languageSelect.options).map(o => o.value);
    if (validOpts.includes(selectedLang)) {
        languageSelect.value = selectedLang;
    } else if (validOpts.includes(baseLang)) {
        languageSelect.value = baseLang;
        selectedLang = baseLang;
    } else {
        languageSelect.value = 'en';
        selectedLang = 'en';
    }
    
    changeLanguage(selectedLang);
    languageSelect.addEventListener('change', (e) => changeLanguage(e.target.value));
}

function changeLanguage(langCode) {
    const t = window.App.translations[langCode] || window.App.translations['en'];
    window.App.currentTranslation = t;
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            el.textContent = t[key];
        }
    });

    // Update Tooltips
    document.querySelectorAll('[data-tooltip]').forEach(el => {
        const key = el.getAttribute('data-tooltip');
        if (t[key]) {
            el.setAttribute('data-tooltip-content', t[key]);
        }
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (t[key]) {
            el.setAttribute('title', t[key]);
        }
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
        const key = el.getAttribute('data-i18n-aria-label');
        if (t[key]) {
            el.setAttribute('aria-label', t[key]);
        }
    });

    updateThemeToggleAccessibility();

    // Auto-switch currency based on language selection
    const langToCurrency = {
        'en': 'USD', 'cs': 'CZK', 'de': 'EUR', 'fr': 'EUR', 'es': 'EUR',
        'it': 'EUR', 'sv': 'SEK', 'no': 'NOK', 'da': 'DKK', 'pl': 'PLN',
        'hu': 'HUF', 'ro': 'RON', 'bg': 'BGN', 'ru': 'RUB', 'tr': 'TRY',
        'ja': 'JPY'
    };
    
    if (langToCurrency[langCode]) {
        state.currency = langToCurrency[langCode];
        currencySelect.value = state.currency;
        updateCurrencySymbols();
        if (window.App.updateChartCurrency) {
            window.App.updateChartCurrency(state.currency);
        }
    }

    translateCurrencies(langCode);
    updateCustomCurrencyOptions();
    updateCustomLanguageOptions();
    updateCustomFrequencyOptions();
    updateCustomEtfOptions();
    
    // Refresh ETF description with new language
    if (etfSelect.value) {
        const selectedETF = etfs.find(etf => etf.id === etfSelect.value);
        if (selectedETF) {
            const descKey = `etf_${etfSelect.value}_desc`;
            etfDescription.textContent = t[descKey] || selectedETF.description;
        }
    }
    
    if (window.App.updateChartTranslations) {
        window.App.updateChartTranslations(t);
    }
    
    if (state.lastResult && window.App.state) {
        updateUIState();
        calculateAndRender();
        if (state.benchmark) {
            setBenchmarkBtn.textContent = t.updateBenchmark;
            clearBenchmarkBtn.textContent = t.clearBenchmark;
        } else {
            setBenchmarkBtn.textContent = t.setBenchmark;
        }
    }
}

// Add immersive background ripple on click
document.body.addEventListener('click', function(e) {
    // Exclude clicks inside inputs to prevent visual clutter
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    
    const ripple = document.createElement('div');
    ripple.className = 'bg-click-ripple';
    ripple.style.left = e.clientX + 'px';
    ripple.style.top = e.clientY + 'px';
    document.body.appendChild(ripple);
    
    // Remove after animation completes
    setTimeout(() => {
        ripple.remove();
    }, 1000);
});

// Start the app
/*---------EVENT LISTENERS------------*/

// Initialization and DOM ready
document.addEventListener('DOMContentLoaded', init);
