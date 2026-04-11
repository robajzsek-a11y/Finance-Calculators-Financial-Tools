/**
 * ETF Presets
 * 
 * This file contains a list of common ETFs with their historical average returns.
 * Used to populate the ETF selector and automatically set the interest rate.
 */
window.App = window.App || {};

window.App.etfs = [
    {
        id: 'voo',
        name: 'S&P 500 (VOO)',
        ticker: 'VOO',
        avgReturn: 10.5, // Historical average approx. 10.5%
        description: 'Tracks the S&P 500 index, representing 500 large U.S. companies.'
    },
    {
        id: 'iwda',
        name: 'MSCI World (IWDA)',
        ticker: 'IWDA',
        avgReturn: 8.5, // Historical average approx. 8-9%
        description: 'Exposure to companies from 23 developed countries.'
    },
    {
        id: 'qqq',
        name: 'NASDAQ-100 (QQQ)',
        ticker: 'QQQ',
        avgReturn: 13.5, // Historical average higher due to tech focus
        description: 'Includes 100 of the largest non-financial companies on Nasdaq.'
    },
    {
        id: 'vwce',
        name: 'FTSE All-World (VWCE)',
        ticker: 'VWCE',
        avgReturn: 8.0, // Broad global exposure
        description: 'Covers large and mid-cap stocks from developed and emerging markets.'
    }
];
