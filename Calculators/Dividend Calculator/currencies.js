///------------2026 Pomerancee. All rights reserved.----------------\\\
///------------https://creativecommons.org/licenses/by-nc-sa/4.0/---\\\
///------------Licensed under CC BY-NC-SA 4.0------------------------\\\

/**
 * Currency data and utilities
 */

window.DividendCalc = window.DividendCalc || {};

// Complete currency list with country codes for flags
window.DividendCalc.currencies = {
    "AED": { name: "UAE Dirham", countryCode: "ae", symbol: "د.إ" },
    "ALL": { name: "Albanian Lek", countryCode: "al", symbol: "L" },
    "AMD": { name: "Armenian Dram", countryCode: "am", symbol: "֏" },
    "ARS": { name: "Argentine Peso", countryCode: "ar", symbol: "$" },
    "AUD": { name: "Australian Dollar", countryCode: "au", symbol: "A$" },
    "AZN": { name: "Azerbaijani Manat", countryCode: "az", symbol: "₼" },
    "BAM": { name: "Bosnian Convertible Mark", countryCode: "ba", symbol: "KM" },
    "BDT": { name: "Bangladeshi Taka", countryCode: "bd", symbol: "৳" },
    "BGN": { name: "Bulgarian Lev", countryCode: "bg", symbol: "лв" },
    "BHD": { name: "Bahraini Dinar", countryCode: "bh", symbol: ".د.ب" },
    "BOB": { name: "Bolivian Boliviano", countryCode: "bo", symbol: "Bs." },
    "BRL": { name: "Brazilian Real", countryCode: "br", symbol: "R$" },
    "BTC": { name: "Bitcoin", countryCode: "xx", symbol: "₿" },
    "BWP": { name: "Botswana Pula", countryCode: "bw", symbol: "P" },
    "BYN": { name: "Belarusian Ruble", countryCode: "by", symbol: "Br" },
    "CAD": { name: "Canadian Dollar", countryCode: "ca", symbol: "CA$" },
    "CHF": { name: "Swiss Franc", countryCode: "ch", symbol: "CHF" },
    "CLP": { name: "Chilean Peso", countryCode: "cl", symbol: "$" },
    "CNY": { name: "Chinese Yuan", countryCode: "cn", symbol: "CN¥" },
    "COP": { name: "Colombian Peso", countryCode: "co", symbol: "$" },
    "CRC": { name: "Costa Rican Colón", countryCode: "cr", symbol: "₡" },
    "CZK": { name: "Czech Koruna", countryCode: "cz", symbol: "Kč" },
    "DKK": { name: "Danish Krone", countryCode: "dk", symbol: "kr." },
    "DOP": { name: "Dominican Peso", countryCode: "do", symbol: "RD$" },
    "DZD": { name: "Algerian Dinar", countryCode: "dz", symbol: "د.ج" },
    "EGP": { name: "Egyptian Pound", countryCode: "eg", symbol: "£" },
    "ETH": { name: "Ethereum", countryCode: "xx", symbol: "Ξ" },
    "ETB": { name: "Ethiopian Birr", countryCode: "et", symbol: "Br" },
    "EUR": { name: "Euro", countryCode: "eu", symbol: "€" },
    "GBP": { name: "British Pound Sterling", countryCode: "gb", symbol: "£" },
    "GEL": { name: "Georgian Lari", countryCode: "ge", symbol: "₾" },
    "GHS": { name: "Ghanaian Cedi", countryCode: "gh", symbol: "GH₵" },
    "HKD": { name: "Hong Kong Dollar", countryCode: "hk", symbol: "HK$" },
    "HRK": { name: "Croatian Kuna", countryCode: "hr", symbol: "kn" },
    "HUF": { name: "Hungarian Forint", countryCode: "hu", symbol: "Ft" },
    "IDR": { name: "Indonesian Rupiah", countryCode: "id", symbol: "Rp" },
    "ILS": { name: "Israeli Shekel", countryCode: "il", symbol: "₪" },
    "INR": { name: "Indian Rupee", countryCode: "in", symbol: "₹" },
    "IRR": { name: "Iranian Rial", countryCode: "ir", symbol: "﷼" },
    "ISK": { name: "Icelandic Krona", countryCode: "is", symbol: "kr" },
    "JMD": { name: "Jamaican Dollar", countryCode: "jm", symbol: "J$" },
    "JOD": { name: "Jordanian Dinar", countryCode: "jo", symbol: "د.ا" },
    "JPY": { name: "Japanese Yen", countryCode: "jp", symbol: "¥" },
    "KES": { name: "Kenyan Shilling", countryCode: "ke", symbol: "KSh" },
    "KGS": { name: "Kyrgyzstani Som", countryCode: "kg", symbol: "лв" },
    "KHR": { name: "Cambodian Riel", countryCode: "kh", symbol: "៛" },
    "KRW": { name: "South Korean Won", countryCode: "kr", symbol: "₩" },
    "KWD": { name: "Kuwaiti Dinar", countryCode: "kw", symbol: "د.ك" },
    "KZT": { name: "Kazakhstani Tenge", countryCode: "kz", symbol: "₸" },
    "LAK": { name: "Laotian Kip", countryCode: "la", symbol: "₭" },
    "LBP": { name: "Lebanese Pound", countryCode: "lb", symbol: "ل.ل" },
    "LKR": { name: "Sri Lankan Rupee", countryCode: "lk", symbol: "₨" },
    "MAD": { name: "Moroccan Dirham", countryCode: "ma", symbol: "د.م." },
    "MDL": { name: "Moldovan Leu", countryCode: "md", symbol: "L" },
    "MKD": { name: "Macedonian Denar", countryCode: "mk", symbol: "ден" },
    "MNT": { name: "Mongolian Tugrik", countryCode: "mn", symbol: "₮" },
    "MXN": { name: "Mexican Peso", countryCode: "mx", symbol: "MX$" },
    "MYR": { name: "Malaysian Ringgit", countryCode: "my", symbol: "RM" },
    "MZN": { name: "Mozambican Metical", countryCode: "mz", symbol: "MT" },
    "NAD": { name: "Namibian Dollar", countryCode: "na", symbol: "$" },
    "NGN": { name: "Nigerian Naira", countryCode: "ng", symbol: "₦" },
    "NOK": { name: "Norwegian Krone", countryCode: "no", symbol: "kr" },
    "NPR": { name: "Nepalese Rupee", countryCode: "np", symbol: "₨" },
    "NZD": { name: "New Zealand Dollar", countryCode: "nz", symbol: "NZ$" },
    "OMR": { name: "Omani Rial", countryCode: "om", symbol: "ر.ع." },
    "PAB": { name: "Panamanian Balboa", countryCode: "pa", symbol: "B/." },
    "PEN": { name: "Peruvian Sol", countryCode: "pe", symbol: "S/" },
    "PHP": { name: "Philippine Peso", countryCode: "ph", symbol: "₱" },
    "PKR": { name: "Pakistani Rupee", countryCode: "pk", symbol: "₨" },
    "PLN": { name: "Polish Zloty", countryCode: "pl", symbol: "zł" },
    "PYG": { name: "Paraguayan Guarani", countryCode: "py", symbol: "₲" },
    "QAR": { name: "Qatari Riyal", countryCode: "qa", symbol: "ر.ق" },
    "RON": { name: "Romanian Leu", countryCode: "ro", symbol: "lei" },
    "RSD": { name: "Serbian Dinar", countryCode: "rs", symbol: "дин" },
    "RUB": { name: "Russian Ruble", countryCode: "ru", symbol: "₽" },
    "SAR": { name: "Saudi Riyal", countryCode: "sa", symbol: "ر.س" },
    "SEK": { name: "Swedish Krona", countryCode: "se", symbol: "kr" },
    "SGD": { name: "Singapore Dollar", countryCode: "sg", symbol: "S$" },
    "THB": { name: "Thai Baht", countryCode: "th", symbol: "฿" },
    "TJS": { name: "Tajikistani Somoni", countryCode: "tj", symbol: "SM" },
    "TMT": { name: "Turkmenistani Manat", countryCode: "tm", symbol: "m" },
    "TND": { name: "Tunisian Dinar", countryCode: "tn", symbol: "د.ت" },
    "TRY": { name: "Turkish Lira", countryCode: "tr", symbol: "₺" },
    "TTD": { name: "Trinidad and Tobago Dollar", countryCode: "tt", symbol: "TT$" },
    "TWD": { name: "Taiwan Dollar", countryCode: "tw", symbol: "NT$" },
    "TZS": { name: "Tanzanian Shilling", countryCode: "tz", symbol: "TSh" },
    "UAH": { name: "Ukrainian Hryvnia", countryCode: "ua", symbol: "₴" },
    "UGX": { name: "Ugandan Shilling", countryCode: "ug", symbol: "USh" },
    "USD": { name: "US Dollar", countryCode: "us", symbol: "$" },
    "UYU": { name: "Uruguayan Peso", countryCode: "uy", symbol: "$U" },
    "UZS": { name: "Uzbekistani Som", countryCode: "uz", symbol: "лв" },
    "VES": { name: "Venezuelan Bolívar", countryCode: "ve", symbol: "Bs.S" },
    "VND": { name: "Vietnamese Dong", countryCode: "vn", symbol: "₫" },
    "XAF": { name: "Central African CFA Franc", countryCode: "cf", symbol: "FCFA" },
    "XCD": { name: "East Caribbean Dollar", countryCode: "ag", symbol: "$" },
    "XDR": { name: "Special Drawing Rights", countryCode: "xx", symbol: "SDR" },
    "XOF": { name: "West African CFA Franc", countryCode: "sn", symbol: "CFA" },
    "XPF": { name: "CFP Franc", countryCode: "pf", symbol: "₣" },
    "ZAR": { name: "South African Rand", countryCode: "za", symbol: "R" },
    "ZMW": { name: "Zambian Kwacha", countryCode: "zm", symbol: "ZK" }
};

/**
 * Gets the flag URL for a currency
 */
window.DividendCalc.getFlagUrl = function(currencyCode, size = '24x18') {
    // Special cases for crypto and special currencies
    if (currencyCode === 'BTC') {
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%23F7931A'/%3E%3Cpath fill='%23FFF' d='M21.78 15.37c.41-2.73-1.68-4.2-4.52-5.12l.92-3.7-2.25-.56-.9 3.61c-.6-.15-1.2-.28-1.81-.43l.91-3.65-2.25-.56-.92 3.68c-.5-.12-.98-.24-1.44-.36L7.1 7.64l-.43 1.74s1.25.29 1.22.3c.68.17.8.62.78 1.01l-1.57 6.32c.07.02.16.05.27.1l-.27-.07-2.2 8.82c-.1.25-.36.16-.78-.04l-.27.3.36 1.45 2.14.53c.55.14 1.12.29 1.68.43l-.93 3.73 2.25.56.92-3.7c.62.17 1.22.33 1.82.48l-.92 3.7 2.25.56.93-3.74c3.85.73 6.75.44 8-3.04.99-2.8-.02-4.41-2.07-5.46 1.48-.34 2.59-1.32 2.87-3.03zm-3.06 6.55c-.65 2.61-5.06 1.2-6.5 1.05l1.15-4.63c1.44.36 6.03 1 5.35 3.58zm.62-6.32c-.59 2.37-4.22 1.15-5.38.86l1.04-4.18c1.16.29 4.96.9 4.34 3.32z'/%3E%3C/svg%3E";
    }
    if (currencyCode === 'ETH') {
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%23627EEA'/%3E%3Cpath fill='%23FFF' d='M15.925 23.96l-7.144-10.05 7.144 4.226 7.153-4.226-7.153 10.05zM16.075 5v12.016l-7.247-4.267L16.075 5zm0 12.016l7.248-4.267L16.075 5v12.016z'/%3E%3C/svg%3E";
    }
    if (currencyCode === 'XDR') {
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%2300529B'/%3E%3Ctext x='50%25' y='55%25' font-family='Arial' font-size='12' font-weight='bold' fill='white' text-anchor='middle' dominant-baseline='middle'%3ESDR%3C/text%3E%3C/svg%3E";
    }
    
    const currency = window.DividendCalc.currencies[currencyCode];
    if (!currency) return '';
    
    const countryCode = currency.countryCode;
    if (countryCode === 'xx') {
        // Placeholder for non-country currencies
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 18'%3E%3Crect width='24' height='18' fill='%23334155'/%3E%3C/svg%3E";
    }
    
    // Use SVG flags from flagcdn.com
    return `https://flagcdn.com/${countryCode}.svg`;
};

/**
 * Gets the currency symbol
 */
window.DividendCalc.getCurrencySymbol = function(currencyCode) {
    const currency = window.DividendCalc.currencies[currencyCode];
    return currency ? currency.symbol : currencyCode;
};
