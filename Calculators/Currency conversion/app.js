import { fetchLatestRates, fetchHistoricalRates, getSupportedCurrencies, getFlagImageMarkup } from './api.js';
import { calculateConversion, formatCurrency } from './calculator.js';
import { initChart, updateChart, clearChart } from './chart.js';

const currencies = getSupportedCurrencies();

const DOM = {
    amountFrom: document.getElementById('amount-from'),
    amountTo: document.getElementById('amount-to'),
    currencyFrom: document.getElementById('currency-from'),
    currencyTo: document.getElementById('currency-to'),
    swapBtn: document.getElementById('swap-btn'),
    feeInput: document.getElementById('fee-input'),
    rateDisplay: document.getElementById('rate-display'),
    rateTrend: document.getElementById('rate-trend'),
    apiStatus: document.getElementById('api-status'),
    convertedAmount: document.getElementById('converted-amount'),
    feeAmount: document.getElementById('fee-amount'),
    totalPay: document.getElementById('total-pay'),
    convertedLabel: document.getElementById('converted-label'),
    feeLabel: document.getElementById('fee-label'),
    totalLabel: document.getElementById('total-label'),
    timeBtns: document.querySelectorAll('.time-btn'),
    historyList: document.getElementById('history-list'),
    quickBtns: document.querySelectorAll('.quick-amount-btn'),
    copyBtn: document.getElementById('copy-btn')
};

let currentRates = null;
let currentBase = 'USD';
let chartDays = 30;
let conversionHistory = [];
try {
    conversionHistory = JSON.parse(localStorage.getItem('currency_history')) || [];
} catch (e) {
    conversionHistory = [];
}
let currentHistoricalData = null;
let historicalRequestId = 0;
let customSelectEventsBound = false;

function init() {
    populateCurrencies();
    initCustomCurrencySelect(DOM.currencyFrom);
    initCustomCurrencySelect(DOM.currencyTo);
    loadSavedState();
    syncCustomCurrencySelect(DOM.currencyFrom);
    syncCustomCurrencySelect(DOM.currencyTo);

    DOM.amountFrom.addEventListener('input', handleInput);
    DOM.currencyFrom.addEventListener('change', handleCurrencyChange);
    DOM.currencyTo.addEventListener('change', handleTargetChange);
    DOM.swapBtn.addEventListener('click', handleSwap);
    DOM.feeInput.addEventListener('input', handleInput);

    DOM.timeBtns.forEach(btn => {
        btn.addEventListener('click', event => {
            DOM.timeBtns.forEach(button => button.classList.remove('active'));
            event.target.classList.add('active');
            chartDays = parseInt(event.target.dataset.days, 10);
            loadHistoricalData();
        });
    });

    DOM.quickBtns.forEach(btn => {
        btn.addEventListener('click', event => {
            DOM.amountFrom.value = event.target.dataset.val;
            handleInput();
            saveHistory();
        });
    });

    DOM.copyBtn.addEventListener('click', () => {
        if (!DOM.amountTo.value) return;

        navigator.clipboard.writeText(DOM.amountTo.value);
        const icon = DOM.copyBtn.innerHTML;
        DOM.copyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--success)"><path d="M20 6L9 17l-5-5"></path></svg>`;
        setTimeout(() => {
            DOM.copyBtn.innerHTML = icon;
        }, 2000);
    });

    bindCustomSelectEvents();
    initChart('rateChart');
    fetchRates();
    renderHistory();

    setInterval(() => {
        if (currentRates) updateRateDisplay();
    }, 30000);
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildCurrencyLabel(code) {
    return `${code} - ${currencies[code].name}`;
}

function formatRateValue(value) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: value >= 1 ? 2 : 4,
        maximumFractionDigits: value >= 1 ? 4 : 8
    }).format(value);
}

function formatUpdatedLabel(fetchedAt) {
    if (!fetchedAt) return 'Updated just now';

    const diffMs = Math.max(0, Date.now() - fetchedAt);
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return 'Updated just now';
    if (diffMinutes < 60) return `Updated ${diffMinutes} min ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    return `Updated ${diffHours} hr${diffHours === 1 ? '' : 's'} ago`;
}

function getCustomSelect(selectEl) {
    return selectEl?.parentElement?.querySelector(`.custom-select[data-for="${selectEl.id}"]`);
}

function closeAllCustomSelects(except = null) {
    document.querySelectorAll('.custom-select.open').forEach(select => {
        if (select === except) return;
        select.classList.remove('open');
        const trigger = select.querySelector('.custom-select-trigger');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
}

const currencySymbols = {
    AED: 'د.إ', AFN: '؋', ALL: 'L', AMD: '֏', ANG: 'ƒ', AOA: 'Kz', ARS: '$', AUD: 'A$', AWG: 'ƒ', AZN: '₼',
    BAM: 'KM', BBD: '$', BDT: '৳', BGN: 'лв', BHD: '.د.ب', BIF: 'FBu', BMD: '$', BND: 'B$', BOB: 'Bs.', BRL: 'R$',
    BSD: '$', BTC: '₿', BTN: 'Nu.', BWP: 'P', BYN: 'Br', BZD: 'BZ$', CAD: 'CA$', CDF: 'FC', CHF: 'CHF', CLP: '$',
    CNY: 'CN¥', COP: '$', CRC: '₡', CUP: '₱', CVE: '$', CZK: 'Kč', DJF: 'Fdj', DKK: 'kr.', DOP: 'RD$', DZD: 'د.ج',
    EGP: '£', ERN: 'Nfk', ETB: 'Br', EUR: '€', FJD: '$', FKP: '£', FOK: 'kr', GBP: '£', GEL: '₾', GGP: '£',
    GHS: 'GH₵', GIP: '£', GMD: 'D', GNF: 'FG', GTQ: 'Q', GYD: '$', HKD: 'HK$', HNL: 'L', HRK: 'kn', HTG: 'G',
    HUF: 'Ft', IDR: 'Rp', ILS: '₪', IMP: '£', INR: '₹', IQD: 'ع.د', IRR: '﷼', ISK: 'kr', JEP: '£', JMD: 'J$',
    JOD: 'د.ا', JPY: '¥', KES: 'KSh', KGS: 'лв', KHR: '៛', KID: '$', KMF: 'CF', KRW: '₩', KWD: 'د.ك', KYD: '$',
    KZT: '₸', LAK: '₭', LBP: 'ل.ل', LKR: '₨', LRD: '$', LSL: 'L', LYD: 'ل.د', MAD: 'د.م.', MDL: 'L', MGA: 'Ar',
    MKD: 'ден', MMK: 'K', MNT: '₮', MOP: 'P', MRU: 'UM', MUR: '₨', MVR: 'Rf', MWK: 'MK', MXN: 'MX$', MYR: 'RM',
    MZN: 'MT', NAD: '$', NGN: '₦', NIO: 'C$', NOK: 'kr', NPR: '₨', NZD: 'NZ$', OMR: 'ر.ع.', PAB: 'B/.', PEN: 'S/',
    PGK: 'K', PHP: '₱', PKR: '₨', PLN: 'zł', PYG: '₲', QAR: 'ر.ق', RON: 'lei', RSD: 'дин', RUB: '₽', RWF: 'FRw',
    SAR: 'ر.س', SBD: '$', SCR: '₨', SDG: '£', SEK: 'kr', SGD: 'S$', SHP: '£', SLE: 'Le', SLL: 'Le', SOS: 'Sh',
    SRD: '$', SSP: '£', STN: 'Db', SYP: '£', SZL: 'L', THB: '฿', TJS: 'SM', TMT: 'm', TND: 'د.ت', TOP: 'T$',
    TRY: '₺', TTD: 'TT$', TVD: '$', TWD: 'NT$', TZS: 'TSh', UAH: '₴', UGX: 'USh', USD: '$', UYU: '$U', UZS: 'лв',
    VES: 'Bs.S', VND: '₫', VUV: 'VT', WST: 'WS$', XAF: 'FCFA', XCD: '$', XDR: 'SDR', XOF: 'CFA', XPF: '₣', YER: '﷼',
    ZAR: 'R', ZMW: 'ZK', ZWL: '$'
};

function getCurrencySymbol(code) {
    return currencySymbols[code] || code;
}

function buildCustomOptionMarkup(code) {
    const name = currencies[code].name;
    const symbol = getCurrencySymbol(code);
    const label = `${code} - ${symbol} · ${name}`;
    return `
        <button type="button" class="custom-select-option" data-value="${code}" role="option" title="${escapeHtml(label)}">
            ${getFlagImageMarkup(code, `${code} flag`)}
            <span class="custom-select-option-text">${escapeHtml(code)} - ${escapeHtml(symbol)} &middot; ${escapeHtml(name)}</span>
        </button>
    `;
}

function initCustomCurrencySelect(selectEl) {
    if (!selectEl || getCustomSelect(selectEl)) return;

    selectEl.classList.add('currency-select-native');

    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select';
    wrapper.dataset.for = selectEl.id;
    wrapper.innerHTML = `
        <button type="button" class="custom-select-trigger" aria-haspopup="listbox" aria-expanded="false"></button>
        <div class="custom-select-menu" role="listbox">
            <div class="custom-select-search-wrapper">
                <input type="text" class="custom-select-search" placeholder="Search currency..." autocomplete="off">
                <button type="button" class="custom-select-search-clear" aria-label="Clear search" style="display: none;">&times;</button>
            </div>
            <div class="custom-select-options"></div>
        </div>
    `;

    selectEl.insertAdjacentElement('afterend', wrapper);
    const optionsContainer = wrapper.querySelector('.custom-select-options');
    const optionsHtml = Object.keys(currencies)
        .map((code, i) => {
            const markup = buildCustomOptionMarkup(code);
            return markup.replace('class="custom-select-option"', `class="custom-select-option" style="--stagger-index: ${i % 20};"`);
        })
        .join('');
    optionsContainer.innerHTML = optionsHtml;
        
    // Add search event listener
    const searchInput = wrapper.querySelector('.custom-select-search');
    const clearBtn = wrapper.querySelector('.custom-select-search-clear');
    
    searchInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        clearBtn.style.display = val ? 'block' : 'none';
        const options = optionsContainer.querySelectorAll('.custom-select-option');
        options.forEach(opt => {
            const text = opt.textContent.toLowerCase();
            if (text.includes(val)) {
                opt.style.display = 'flex';
            } else {
                opt.style.display = 'none';
            }
        });
        positionDropdown(wrapper);
    });
    
    clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input'));
        searchInput.focus();
    });
}

function syncCustomCurrencySelect(selectEl) {
    const customSelect = getCustomSelect(selectEl);
    const currency = currencies[selectEl.value];
    if (!customSelect || !currency) return;

    const symbol = getCurrencySymbol(selectEl.value);
    const fullLabel = buildCurrencyLabel(selectEl.value);
    const codeOnlyLabel = `${selectEl.value} - ${symbol}`;
    const trigger = customSelect.querySelector('.custom-select-trigger');
    trigger.title = fullLabel;
    trigger.innerHTML = `
        <span class="custom-select-value">
            ${getFlagImageMarkup(selectEl.value, `${selectEl.value} flag`)}
            <span class="custom-select-text">${escapeHtml(codeOnlyLabel)}</span>
        </span>
        <span class="custom-select-chevron" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="none">
                <path d="M4 6.5 8 10.5 12 6.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
        </span>
    `;

    customSelect.querySelectorAll('.custom-select-option').forEach(option => {
        const isSelected = option.dataset.value === selectEl.value;
        option.classList.toggle('selected', isSelected);
        option.setAttribute('aria-selected', String(isSelected));
    });
}

function positionDropdown(customSelect) {
    const trigger = customSelect.querySelector('.custom-select-trigger');
    const menu = customSelect.querySelector('.custom-select-menu');
    
    const triggerRect = trigger.getBoundingClientRect();
    
    menu.style.top = '';
    menu.style.bottom = '';
    
    const menuWidth = Math.min(400, window.innerWidth * 0.9);
    menu.style.width = menuWidth + 'px';
    
    let left = triggerRect.left;
    if (left + menuWidth > window.innerWidth) {
        left = window.innerWidth - menuWidth - 10;
    }
    menu.style.left = Math.max(10, left) + 'px';

    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    
    if (spaceBelow < 280 && spaceAbove > spaceBelow) {
        customSelect.classList.add('open-up');
        menu.style.bottom = (window.innerHeight - triggerRect.top + 5) + 'px';
        menu.style.top = 'auto';
    } else {
        customSelect.classList.remove('open-up');
        menu.style.top = (triggerRect.bottom + 5) + 'px';
        menu.style.bottom = 'auto';
    }
}

function bindCustomSelectEvents() {
    if (customSelectEventsBound) return;
    customSelectEventsBound = true;

    document.addEventListener('click', event => {
        const trigger = event.target.closest('.custom-select-trigger');
        if (trigger) {
            const customSelect = trigger.closest('.custom-select');
            const isOpen = customSelect.classList.contains('open');
            closeAllCustomSelects(customSelect);
            
            if (!isOpen) {
                positionDropdown(customSelect);
                const searchInput = customSelect.querySelector('.custom-select-search');
                if (searchInput) {
                    searchInput.value = '';
                    searchInput.dispatchEvent(new Event('input'));
                    setTimeout(() => searchInput.focus(), 10);
                }
            }
            
            customSelect.classList.toggle('open', !isOpen);
            trigger.setAttribute('aria-expanded', String(!isOpen));
            return;
        }

        const option = event.target.closest('.custom-select-option');
        if (option) {
            const customSelect = option.closest('.custom-select');
            const selectEl = document.getElementById(customSelect.dataset.for);
            if (!selectEl) return;

            selectEl.value = option.dataset.value;
            syncCustomCurrencySelect(selectEl);
            closeAllCustomSelects();
            selectEl.dispatchEvent(new Event('change', { bubbles: true }));
            return;
        }

        if (!event.target.closest('.custom-select')) {
            closeAllCustomSelects();
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') closeAllCustomSelects();
    });
    
    window.addEventListener('scroll', () => {
        closeAllCustomSelects();
    }, { passive: true });
    window.addEventListener('resize', () => {
        closeAllCustomSelects();
    });
}

function populateCurrencies() {
    const options = Object.keys(currencies).map(code => {
        return `<option value="${code}" title="${escapeHtml(buildCurrencyLabel(code))}">${buildCurrencyLabel(code)}</option>`;
    }).join('');

    DOM.currencyFrom.innerHTML = options;
    DOM.currencyTo.innerHTML = options;
}

function loadSavedState() {
    const savedFrom = localStorage.getItem('curr_from');
    const savedTo = localStorage.getItem('curr_to');

    DOM.currencyFrom.value = savedFrom || 'USD';
    DOM.currencyTo.value = savedTo || 'EUR';
}

function saveState() {
    localStorage.setItem('curr_from', DOM.currencyFrom.value);
    localStorage.setItem('curr_to', DOM.currencyTo.value);
}

async function fetchRates() {
    currentBase = DOM.currencyFrom.value;

    try {
        DOM.rateDisplay.textContent = 'Loading rate...';
        DOM.rateTrend.textContent = '';
        DOM.rateTrend.className = 'profit-percent';
        DOM.apiStatus.classList.add('hidden');

        const data = await fetchLatestRates(currentBase);
        currentRates = data;

        if (data.isCached) {
            DOM.apiStatus.textContent = 'Using offline cached rates.';
            DOM.apiStatus.classList.remove('hidden');
        }

        updateRateDisplay();
        handleInput();
        await loadHistoricalData();
    } catch (error) {
        DOM.rateDisplay.textContent = 'Error loading rates';
        DOM.apiStatus.textContent = error.message;
        DOM.apiStatus.classList.remove('hidden');
        currentHistoricalData = null;
        clearChart();
    }
}

function updateRateDisplay() {
    if (!currentRates || !currentRates.rates) return;

    const target = DOM.currencyTo.value;

    if (currentBase === target) {
        DOM.rateDisplay.innerHTML = `
            <span class="rate-pair">
                ${getFlagImageMarkup(currentBase, `${currentBase} flag`, '24x18')}
                <span>1 ${currentBase}</span>
            </span>
            <span class="rate-equals">=</span>
            <span class="rate-pair">
                ${getFlagImageMarkup(target, `${target} flag`, '24x18')}
                <span>1 ${target}</span>
            </span>
        `;
        return;
    }

    const rate = currentRates.rates[target];
    if (!rate) return;

    DOM.rateDisplay.innerHTML = `
        <span class="rate-pair">
            ${getFlagImageMarkup(currentBase, `${currentBase} flag`, '24x18')}
            <span>1 ${currentBase}</span>
        </span>
        <span class="rate-equals">=</span>
        <span class="rate-pair">
            ${getFlagImageMarkup(target, `${target} flag`, '24x18')}
            <span>${formatRateValue(rate)} ${target}</span>
        </span>
        <span class="rate-updated">${formatUpdatedLabel(currentRates.fetchedAt ?? currentRates.timestamp)}</span>
    `;
}

function updateTrendDisplay() {
    if (!currentHistoricalData || !currentHistoricalData.rates) return;

    const target = DOM.currencyTo.value;
    const dates = Object.keys(currentHistoricalData.rates).sort();
    if (dates.length < 2) return;

    const latestRate = currentHistoricalData.rates[dates[dates.length - 1]]?.[target];
    const previousRate = currentHistoricalData.rates[dates[dates.length - 2]]?.[target];
    if (!latestRate || !previousRate) return;

    const diff = latestRate - previousRate;
    const percentChange = (diff / previousRate) * 100;

    // Use currentBase as reference, if base is USD and target is EUR, rate is EUR/USD
    // If rate goes up, target currency got weaker, so it's actually negative for the user?
    // Usually, green means target went up in value (i.e. you get less).
    // Let's just make positive green, negative red.
    if (percentChange > 0) {
        DOM.rateTrend.textContent = `↗ +${percentChange.toFixed(2)}% (24h)`;
        DOM.rateTrend.className = 'profit-percent up';
    } else if (percentChange < 0) {
        DOM.rateTrend.textContent = `↘ ${percentChange.toFixed(2)}% (24h)`;
        DOM.rateTrend.className = 'profit-percent down';
    } else {
        DOM.rateTrend.textContent = '→ 0.00% (24h)';
        DOM.rateTrend.className = 'profit-percent';
    }
}

function handleInput() {
    const amount = parseFloat(DOM.amountFrom.value);
    const target = DOM.currencyTo.value;
    const fee = parseFloat(DOM.feeInput.value) || 0;

    if (currentBase === target) {
        updateResults(amount, amount * (fee / 100), amount + (amount * (fee / 100)), target);
        DOM.amountTo.value = amount;
        debouncedSaveHistory();
        return;
    }

    if (!currentRates || !currentRates.rates || !currentRates.rates[target] || Number.isNaN(amount)) {
        DOM.amountTo.value = '';
        updateResults(0, 0, 0, target);
        return;
    }

    const rate = currentRates.rates[target];
    const { convertedAmount, feeAmount, totalToPay } = calculateConversion(amount, rate, fee);

    const cleanConverted = formatCurrency(convertedAmount, target);
    DOM.amountTo.value = cleanConverted;
    
    // Auto-shrink font size for long values
    if (cleanConverted.length > 10) {
        DOM.amountTo.style.fontSize = '0.85rem';
    } else if (cleanConverted.length > 7) {
        DOM.amountTo.style.fontSize = '0.95rem';
    } else {
        DOM.amountTo.style.fontSize = '1.1rem';
    }

    updateResults(convertedAmount, feeAmount, totalToPay, target);
    debouncedSaveHistory();
}

let timeoutId;
function debouncedSaveHistory() {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
        saveHistory();
    }, 1500);
}

function updateResults(converted, fee, total, currency) {
    const fromCurrency = DOM.currencyFrom.value;
    
    if (DOM.convertedLabel) DOM.convertedLabel.textContent = `Converted Amount (${currency})`;
    if (DOM.feeLabel) DOM.feeLabel.textContent = `Estimated Fee (${fromCurrency})`;
    if (DOM.totalLabel) DOM.totalLabel.textContent = `Total to Pay (${fromCurrency})`;

    DOM.convertedAmount.textContent = `${formatCurrency(converted, currency)}`;
    DOM.feeAmount.textContent = `${formatCurrency(fee, fromCurrency)}`;
    DOM.totalPay.textContent = `${formatCurrency(total, fromCurrency)}`;
}

function handleCurrencyChange() {
    syncCustomCurrencySelect(DOM.currencyFrom);
    saveState();
    fetchRates();
}

function handleTargetChange() {
    syncCustomCurrencySelect(DOM.currencyTo);
    saveState();
    updateRateDisplay();
    handleInput();
    loadHistoricalData();
}

function handleSwap() {
    const temp = DOM.currencyFrom.value;
    DOM.currencyFrom.value = DOM.currencyTo.value;
    DOM.currencyTo.value = temp;

    syncCustomCurrencySelect(DOM.currencyFrom);
    syncCustomCurrencySelect(DOM.currencyTo);

    DOM.swapBtn.classList.add('rotate');
    setTimeout(() => {
        DOM.swapBtn.classList.remove('rotate');
    }, 300);

    saveState();
    fetchRates();
}

async function loadHistoricalData() {
    const target = DOM.currencyTo.value;
    const requestId = ++historicalRequestId;

    if (currentBase === target) {
        currentHistoricalData = null;
        clearChart();
        DOM.rateTrend.textContent = '';
        DOM.rateTrend.className = 'profit-percent';
        return;
    }

    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - (chartDays - 1));

    const endStr = end.toISOString().split('T')[0];
    const startStr = start.toISOString().split('T')[0];

    try {
        const data = await fetchHistoricalRates(
            currentBase,
            target,
            startStr,
            endStr,
            currentRates?.rates?.[target]
        );
        if (requestId !== historicalRequestId) return;

        currentHistoricalData = data;
        updateChart(data, target);
        updateTrendDisplay();
    } catch (error) {
        if (requestId !== historicalRequestId) return;

        console.error('Failed to load historical data', error);
        currentHistoricalData = null;
        clearChart();
        DOM.rateTrend.textContent = '';
        DOM.rateTrend.className = 'profit-percent';
    }
}



function saveHistory() {
    const amount = parseFloat(DOM.amountFrom.value);
    if (!amount || amount <= 0) return;

    const from = DOM.currencyFrom.value;
    const to = DOM.currencyTo.value;
    const result = DOM.amountTo.value;

    if (from === to || !result) return;

    const item = {
        amount,
        from,
        to,
        result,
        date: new Date().toLocaleDateString()
    };

    if (conversionHistory.length > 0 && conversionHistory[0].from === from && conversionHistory[0].to === to && conversionHistory[0].amount === amount) {
        return;
    }

    conversionHistory.unshift(item);
    if (conversionHistory.length > 5) conversionHistory.pop();

    localStorage.setItem('currency_history', JSON.stringify(conversionHistory));
    renderHistory();
}

function renderHistory() {
    if (conversionHistory.length === 0) {
        DOM.historyList.innerHTML = '<li class="empty">No recent conversions</li>';
        return;
    }

    DOM.historyList.innerHTML = conversionHistory.map(item => `
        <li>
            <div class="hist-main">
                <span class="hist-amt hist-currency">
                    ${getFlagImageMarkup(item.from, `${item.from} flag`, '24x18')}
                    <span>${formatCurrency(item.amount, item.from)} ${item.from}</span>
                </span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                <span class="hist-res hist-currency">
                    ${getFlagImageMarkup(item.to, `${item.to} flag`, '24x18')}
                    <span>${item.result} ${item.to}</span>
                </span>
            </div>
            <div class="hist-date">${item.date}</div>
        </li>
    `).join('');
}

init();
