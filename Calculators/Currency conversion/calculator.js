export function calculateConversion(amount, rate, feePercentage = 0.5) {
    const safeAmount = Number(amount);
    const safeRate = Number(rate);
    const safeFeePercentage = Number(feePercentage) || 0;

    if (!safeAmount || Number.isNaN(safeAmount) || !safeRate || Number.isNaN(safeRate)) {
        return { convertedAmount: 0, feeAmount: 0, totalToPay: 0 };
    }

    const convertedAmount = safeAmount * safeRate;
    const feeAmount = safeAmount * (safeFeePercentage / 100);
    const totalToPay = safeAmount + feeAmount;

    return {
        convertedAmount,
        feeAmount,
        totalToPay
    };
}

export function formatCurrency(value, currencyCode) {
    const noDecimalCurrencies = ['JPY', 'KRW', 'HUF', 'IDR', 'ISK', 'CLP', 'PYG', 'VND'];
    const cryptoCurrencies = ['BTC', 'ETH'];
    
    let minDecimals = 2;
    let maxDecimals = 2;

    if (noDecimalCurrencies.includes(currencyCode)) {
        minDecimals = 0;
        maxDecimals = 0;
    } else if (cryptoCurrencies.includes(currencyCode)) {
        minDecimals = 2;
        maxDecimals = 8;
    }

    const locale = document.documentElement.lang || 'en-US';

    return new Intl.NumberFormat(locale, {
        style: 'decimal',
        minimumFractionDigits: minDecimals,
        maximumFractionDigits: maxDecimals
    }).format(value);
}
