const API_BASE = 'https://open.er-api.com/v6/latest';
const FLAG_PLACEHOLDER_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='18' viewBox='0 0 24 18'%3E%3Crect width='24' height='18' rx='2' fill='%2394a3b8' fill-opacity='0.25'/%3E%3C/svg%3E";

const CURRENCY_COUNTRY_CODES = {
    AED: 'ae', AFN: 'kg', ALL: 'al', AMD: 'am', ANG: 'an', AOA: 'ao', ARS: 'ar', AUD: 'au', AWG: 'aw', AZN: 'az',
    BAM: 'ba', BBD: 'bb', BDT: 'bd', BGN: 'bg', BHD: 'bh', BIF: 'et', BMD: 'bb', BND: 'bn', BOB: 'bo', BRL: 'br',
    BSD: 'bs', BTC: 'xx', BTN: 'bt', BWP: 'bw', BYN: 'by', BZD: 'bs', CAD: 'ca', CDF: 'cd', CHF: 'ch', CLP: 'cl',
    CNY: 'cn', COP: 'co', CRC: 'cr', CUP: 'do', CVE: 'cv', CZK: 'cz', DJF: 'dj', DKK: 'dk', DOP: 'do', DZD: 'dz',
    EGP: 'eg', ERN: 'er', ETB: 'et', EUR: 'eu', FJD: 'pf', FKP: 'fk', FOK: 'fo', GBP: 'gb', GEL: 'ge', GGP: 'gg',
    GHS: 'gh', GIP: 'gg', GMD: 'gm', GNF: 'gm', GTQ: 'gt', GYD: 'gy', HKD: 'hk', HNL: 'hn', HRK: 'hr', HTG: 'ht',
    HUF: 'hu', IDR: 'id', ILS: 'il', IMP: 'im', INR: 'in', IQD: 'iq', IRR: 'ir', ISK: 'is', JEP: 'je', JMD: 'jm',
    JOD: 'jo', JPY: 'jp', KES: 'ke', KGS: 'kg', KHR: 'kh', KID: 'ki', KMF: 'km', KRW: 'kr', KWD: 'kw', KYD: 'ky',
    KZT: 'kz', LAK: 'la', LBP: 'lb', LKR: 'lk', LRD: 'lr', LSL: 'lr', LYD: 'ly', MAD: 'ma', MDL: 'md', MGA: 'mg',
    MKD: 'mk', MMK: 'mn', MNT: 'mn', MOP: 'mo', MRU: 'mr', MUR: 'mu', MVR: 'mu', MWK: 'mw', MXN: 'mx', MYR: 'my',
    MZN: 'mz', NAD: 'na', NGN: 'ng', NIO: 'ni', NOK: 'no', NPR: 'np', NZD: 'nz', OMR: 'om', PAB: 'pa', PEN: 'pe',
    PGK: 'py', PHP: 'ph', PKR: 'pk', PLN: 'pl', PYG: 'py', QAR: 'qa', RON: 'ro', RSD: 'rs', RUB: 'ru', RWF: 'rw',
    SAR: 'sa', SBD: 'sb', SCR: 'sc', SDG: 'sd', SEK: 'se', SGD: 'sg', SHP: 'sh', SLE: 'sl', SLL: 'sl', SOS: 'so',
    SRD: 'sh', SSP: 'ss', STN: 'st', SYP: 'sy', SZL: 'sz', THB: 'th', TJS: 'tj', TMT: 'tm', TND: 'tn', TOP: 'to',
    TRY: 'tr', TTD: 'tt', TVD: 'tv', TWD: 'tw', TZS: 'tz', UAH: 'ua', UGX: 'ug', USD: 'us', UYU: 'uy', UZS: 'uz',
    VES: 've', VND: 'vn', VUV: 'tv', WST: 'ws', XAF: 'cf', XCD: 'ag', XDR: 'xx', XOF: 'sn', XPF: 'pf', YER: 'sy',
    ZAR: 'za', ZMW: 'zm', ZWL: 'zw'
};

function formatIsoDate(date) {
    return date.toISOString().split('T')[0];
}

function getApproximateDecimals(rate) {
    if (rate >= 100) return 2;
    if (rate >= 1) return 4;
    return 8;
}

function buildApproximateHistoricalRates(baseCurrency, targetCurrency, startDate, endDate, currentRate) {
    const numericRate = Number(currentRate);
    if (!numericRate || Number.isNaN(numericRate)) return null;

    const start = new Date(`${startDate}T00:00:00Z`);
    const end = new Date(`${endDate}T00:00:00Z`);
    const totalDays = Math.max(1, Math.round((end - start) / 86400000) + 1);
    const amplitude = Math.max(numericRate * 0.012, 0.00015);
    const trendSpan = Math.max(numericRate * 0.009, 0.0001);
    const decimals = getApproximateDecimals(numericRate);
    const rates = {};

    for (let index = 0; index < totalDays; index += 1) {
        const currentDate = new Date(start);
        currentDate.setUTCDate(start.getUTCDate() + index);

        const progress = totalDays === 1 ? 1 : index / (totalDays - 1);
        const wave = Math.sin(index / 3.2) * amplitude;
        const secondaryWave = Math.cos(index / 5.4) * amplitude * 0.45;
        const drift = (progress - 0.5) * trendSpan;
        const approximatedRate = Math.max(
            numericRate * 0.1,
            numericRate + wave + secondaryWave + drift
        );

        rates[formatIsoDate(currentDate)] = {
            [targetCurrency]: Number(approximatedRate.toFixed(decimals))
        };
    }

    rates[endDate] = {
        [targetCurrency]: Number(numericRate.toFixed(decimals))
    };

    return {
        base: baseCurrency,
        start_date: startDate,
        end_date: endDate,
        isApproximate: true,
        rates
    };
}

export async function fetchLatestRates(baseCurrency = 'USD') {
    const isCryptoBase = ['BTC', 'ETH'].includes(baseCurrency);
    const apiBaseCurrency = isCryptoBase ? 'USD' : baseCurrency;

    try {
        const response = await fetch(`${API_BASE}/${apiBaseCurrency}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        if (data.result === 'error') {
            throw new Error(data['error-type'] || 'API Error');
        }
        
        // Fetch crypto rates
        try {
            const cryptoRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbols=%5B%22BTCUSDT%22,%22ETHUSDT%22%5D');
            if (cryptoRes.ok) {
                const cryptoData = await cryptoRes.json();
                const btcUsd = parseFloat(cryptoData.find(c => c.symbol === 'BTCUSDT')?.price);
                const ethUsd = parseFloat(cryptoData.find(c => c.symbol === 'ETHUSDT')?.price);
                
                const usdRate = data.rates["USD"] || (apiBaseCurrency === 'USD' ? 1 : 0);
                
                if (usdRate) {
                    if (btcUsd) data.rates["BTC"] = usdRate / btcUsd;
                    if (ethUsd) data.rates["ETH"] = usdRate / ethUsd;
                }
            }
        } catch (e) {
            console.warn('Failed to fetch crypto rates', e);
        }

        // Adjust base if the original selected base was a crypto
        if (isCryptoBase && data.rates[baseCurrency]) {
            const baseMultiplier = 1 / data.rates[baseCurrency];
            for (const currency in data.rates) {
                data.rates[currency] = data.rates[currency] * baseMultiplier;
            }
            data.base_code = baseCurrency;
        }

        const fetchedAt = Date.now();
        const normalizedData = {
            ...data,
            date: data.time_last_update_utc,
            providerTimestamp: data.time_last_update_unix ? data.time_last_update_unix * 1000 : null,
            fetchedAt,
            timestamp: fetchedAt
        };
        
        // Cache data
        const cacheData = {
            rates: normalizedData.rates,
            date: normalizedData.date,
            providerTimestamp: normalizedData.providerTimestamp,
            fetchedAt: normalizedData.fetchedAt,
            timestamp: normalizedData.timestamp
        };
        localStorage.setItem(`cached_rates_${baseCurrency}`, JSON.stringify(cacheData));
        
        return normalizedData;
    } catch (error) {
        console.error('Failed to fetch latest rates, trying cache...', error);
        const cached = localStorage.getItem(`cached_rates_${baseCurrency}`);
        if (cached) {
            const parsed = JSON.parse(cached);
            return {
                rates: parsed.rates,
                date: parsed.date,
                isCached: true,
                providerTimestamp: parsed.providerTimestamp ?? null,
                fetchedAt: parsed.fetchedAt ?? parsed.timestamp,
                timestamp: parsed.timestamp
            };
        }
        throw new Error('No internet connection and no cached data available.');
    }
}

export async function fetchHistoricalRates(baseCurrency, targetCurrency, startDate, endDate, currentRate) {
    if (baseCurrency === targetCurrency) return null;

    let rateToUse = Number(currentRate);

    if (!rateToUse || Number.isNaN(rateToUse)) {
        try {
            const latestData = await fetchLatestRates(baseCurrency);
            rateToUse = Number(latestData?.rates?.[targetCurrency]);
        } catch (error) {
            console.warn('Falling back to generated historical data without refreshed rate.', error);
        }
    }

    return buildApproximateHistoricalRates(baseCurrency, targetCurrency, startDate, endDate, rateToUse);
}

export function getFlagCountryCode(currencyCode) {
    return CURRENCY_COUNTRY_CODES[currencyCode] || null;
}

export function getFlagUrl(currencyCode, size = '24x18') {
    if (currencyCode === 'BTC') {
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%23F7931A'/%3E%3Cpath fill='%23FFF' d='M21.78 15.37c.41-2.73-1.68-4.2-4.52-5.12l.92-3.7-2.25-.56-.9 3.61c-.6-.15-1.2-.28-1.81-.43l.91-3.65-2.25-.56-.92 3.68c-.5-.12-.98-.24-1.44-.36L7.1 7.64l-.43 1.74s1.25.29 1.22.3c.68.17.8.62.78 1.01l-1.57 6.32c.07.02.16.05.27.1l-.27-.07-2.2 8.82c-.1.25-.36.16-.78-.04l-.27.3.36 1.45 2.14.53c.55.14 1.12.29 1.68.43l-.93 3.73 2.25.56.92-3.7c.62.17 1.22.33 1.82.48l-.92 3.7 2.25.56.93-3.74c3.85.73 6.75.44 8-3.04.99-2.8-.02-4.41-2.07-5.46 1.48-.34 2.59-1.32 2.87-3.03zm-3.06 6.55c-.65 2.61-5.06 1.2-6.5 1.05l1.15-4.63c1.44.36 6.03 1 5.35 3.58zm.62-6.32c-.59 2.37-4.22 1.15-5.38.86l1.04-4.18c1.16.29 4.96.9 4.34 3.32z'/%3E%3C/svg%3E";
    }
    if (currencyCode === 'ETH') {
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%23627EEA'/%3E%3Cpath fill='%23FFF' d='M15.925 23.96l-7.144-10.05 7.144 4.226 7.153-4.226-7.153 10.05zM16.075 5v12.016l-7.247-4.267L16.075 5zm0 12.016l7.248-4.267L16.075 5v12.016z'/%3E%3C/svg%3E";
    }
    if (currencyCode === 'XDR') {
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%2300529B'/%3E%3Ctext x='50%25' y='55%25' font-family='Arial' font-size='12' font-weight='bold' fill='white' text-anchor='middle' dominant-baseline='middle'%3ESDR%3C/text%3E%3C/svg%3E";
    }
    
    const countryCode = getFlagCountryCode(currencyCode);
    if (!countryCode || countryCode === 'xx') return FLAG_PLACEHOLDER_URL;
    return `https://flagcdn.com/${countryCode}.svg`;
}

export function getFlagImageMarkup(currencyCode, altText = currencyCode, size = '24x18', className = 'flag-icon') {
    const safeAltText = String(altText).replace(/"/g, '&quot;');
    return `<img src="${getFlagUrl(currencyCode, size)}" alt="${safeAltText}" width="24" height="18" class="${className}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${FLAG_PLACEHOLDER_URL}';this.classList.add('is-fallback');">`;
}

export function getSupportedCurrencies() {
    return {
        "AED": { name: "UAE Dirham", countryCode: "ae" },
        "ALL": { name: "Albanian Lek", countryCode: "al" },
        "AMD": { name: "Armenian Dram", countryCode: "am" },
        "ARS": { name: "Argentine Peso", countryCode: "ar" },
        "AUD": { name: "Australian Dollar", countryCode: "au" },
        "AZN": { name: "Azerbaijani Manat", countryCode: "az" },
        "BAM": { name: "Bosnian Convertible Mark", countryCode: "ba" },
        "BDT": { name: "Bangladeshi Taka", countryCode: "bd" },
        "BGN": { name: "Bulgarian Lev", countryCode: "bg" },
        "BHD": { name: "Bahraini Dinar", countryCode: "bh" },
        "BOB": { name: "Bolivian Boliviano", countryCode: "bo" },
        "BRL": { name: "Brazilian Real", countryCode: "br" },
        "BTC": { name: "Bitcoin", countryCode: "xx" },
        "BWP": { name: "Botswana Pula", countryCode: "bw" },
        "BYN": { name: "Belarusian Ruble", countryCode: "by" },
        "CAD": { name: "Canadian Dollar", countryCode: "ca" },
        "CHF": { name: "Swiss Franc", countryCode: "ch" },
        "CLP": { name: "Chilean Peso", countryCode: "cl" },
        "CNY": { name: "Chinese Yuan", countryCode: "cn" },
        "COP": { name: "Colombian Peso", countryCode: "co" },
        "CRC": { name: "Costa Rican Colón", countryCode: "cr" },
        "CZK": { name: "Czech Koruna", countryCode: "cz" },
        "DKK": { name: "Danish Krone", countryCode: "dk" },
        "DOP": { name: "Dominican Peso", countryCode: "do" },
        "DZD": { name: "Algerian Dinar", countryCode: "dz" },
        "EGP": { name: "Egyptian Pound", countryCode: "eg" },
        "ETH": { name: "Ethereum", countryCode: "xx" },
        "ETB": { name: "Ethiopian Birr", countryCode: "et" },
        "EUR": { name: "Euro", countryCode: "eu" },
        "GBP": { name: "British Pound Sterling", countryCode: "gb" },
        "GEL": { name: "Georgian Lari", countryCode: "ge" },
        "GHS": { name: "Ghanaian Cedi", countryCode: "gh" },
        "HKD": { name: "Hong Kong Dollar", countryCode: "hk" },
        "HRK": { name: "Croatian Kuna", countryCode: "hr" },
        "HUF": { name: "Hungarian Forint", countryCode: "hu" },
        "IDR": { name: "Indonesian Rupiah", countryCode: "id" },
        "ILS": { name: "Israeli Shekel", countryCode: "il" },
        "INR": { name: "Indian Rupee", countryCode: "in" },
        "IRR": { name: "Iranian Rial", countryCode: "ir" },
        "ISK": { name: "Icelandic Krona", countryCode: "is" },
        "JMD": { name: "Jamaican Dollar", countryCode: "jm" },
        "JOD": { name: "Jordanian Dinar", countryCode: "jo" },
        "JPY": { name: "Japanese Yen", countryCode: "jp" },
        "KES": { name: "Kenyan Shilling", countryCode: "ke" },
        "KGS": { name: "Kyrgyzstani Som", countryCode: "kg" },
        "KHR": { name: "Cambodian Riel", countryCode: "kh" },
        "KRW": { name: "South Korean Won", countryCode: "kr" },
        "KWD": { name: "Kuwaiti Dinar", countryCode: "kw" },
        "KZT": { name: "Kazakhstani Tenge", countryCode: "kz" },
        "LAK": { name: "Laotian Kip", countryCode: "la" },
        "LBP": { name: "Lebanese Pound", countryCode: "lb" },
        "LKR": { name: "Sri Lankan Rupee", countryCode: "lk" },
        "MAD": { name: "Moroccan Dirham", countryCode: "ma" },
        "MDL": { name: "Moldovan Leu", countryCode: "md" },
        "MKD": { name: "Macedonian Denar", countryCode: "mk" },
        "MNT": { name: "Mongolian Tugrik", countryCode: "mn" },
        "MXN": { name: "Mexican Peso", countryCode: "mx" },
        "MYR": { name: "Malaysian Ringgit", countryCode: "my" },
        "MZN": { name: "Mozambican Metical", countryCode: "mz" },
        "NAD": { name: "Namibian Dollar", countryCode: "na" },
        "NGN": { name: "Nigerian Naira", countryCode: "ng" },
        "NOK": { name: "Norwegian Krone", countryCode: "no" },
        "NPR": { name: "Nepalese Rupee", countryCode: "np" },
        "NZD": { name: "New Zealand Dollar", countryCode: "nz" },
        "OMR": { name: "Omani Rial", countryCode: "om" },
        "PAB": { name: "Panamanian Balboa", countryCode: "pa" },
        "PEN": { name: "Peruvian Sol", countryCode: "pe" },
        "PHP": { name: "Philippine Peso", countryCode: "ph" },
        "PKR": { name: "Pakistani Rupee", countryCode: "pk" },
        "PLN": { name: "Polish Zloty", countryCode: "pl" },
        "PYG": { name: "Paraguayan Guarani", countryCode: "py" },
        "QAR": { name: "Qatari Riyal", countryCode: "qa" },
        "RON": { name: "Romanian Leu", countryCode: "ro" },
        "RSD": { name: "Serbian Dinar", countryCode: "rs" },
        "RUB": { name: "Russian Ruble", countryCode: "ru" },
        "SAR": { name: "Saudi Riyal", countryCode: "sa" },
        "SEK": { name: "Swedish Krona", countryCode: "se" },
        "SGD": { name: "Singapore Dollar", countryCode: "sg" },
        "THB": { name: "Thai Baht", countryCode: "th" },
        "TJS": { name: "Tajikistani Somoni", countryCode: "tj" },
        "TMT": { name: "Turkmenistani Manat", countryCode: "tm" },
        "TND": { name: "Tunisian Dinar", countryCode: "tn" },
        "TRY": { name: "Turkish Lira", countryCode: "tr" },
        "TTD": { name: "Trinidad and Tobago Dollar", countryCode: "tt" },
        "TWD": { name: "Taiwan Dollar", countryCode: "tw" },
        "TZS": { name: "Tanzanian Shilling", countryCode: "tz" },
        "UAH": { name: "Ukrainian Hryvnia", countryCode: "ua" },
        "UGX": { name: "Ugandan Shilling", countryCode: "ug" },
        "USD": { name: "US Dollar", countryCode: "us" },
        "UYU": { name: "Uruguayan Peso", countryCode: "uy" },
        "UZS": { name: "Uzbekistani Som", countryCode: "uz" },
        "VES": { name: "Venezuelan Bolívar", countryCode: "ve" },
        "VND": { name: "Vietnamese Dong", countryCode: "vn" },
        "XAF": { name: "Central African CFA Franc", countryCode: "cf" },
        "XCD": { name: "East Caribbean Dollar", countryCode: "ag" },
        "XDR": { name: "Special Drawing Rights", countryCode: "xx" },
        "XOF": { name: "West African CFA Franc", countryCode: "sn" },
        "XPF": { name: "CFP Franc", countryCode: "pf" },
        "ZAR": { name: "South African Rand", countryCode: "za" },
        "ZMW": { name: "Zambian Kwacha", countryCode: "zm" }
    };
}
