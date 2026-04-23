///------------2026 Pomerancee. All rights reserved.----------------\\\
///------------https://creativecommons.org/licenses/by-nc-sa/4.0/---\\\
///------------Licensed under CC BY-NC-SA 4.0------------------------\\\

/**
 * Dividend Calculator Logic
 * 
 * Handles dividend income calculations with optional reinvestment and contributions.
 */

window.DividendCalc = window.DividendCalc || {};

/**
 * Calculates dividend income over time with optional reinvestment and contributions.
 * 
 * @param {number} numShares - Number of shares owned
 * @param {number} pricePerShare - Price per share
 * @param {number} annualDividend - Annual dividend per share
 * @param {number} years - Duration in years
 * @param {boolean} reinvest - Whether to reinvest dividends
 * @param {boolean} addContributions - Whether to add regular contributions
 * @param {string} contributionFreq - 'monthly' or 'yearly'
 * @param {number} contributionAmount - Amount to contribute
 * @returns {Object} Result containing yearly breakdown and totals
 */
window.DividendCalc.calculateDividends = function(
    numShares,
    pricePerShare,
    annualDividend,
    years,
    reinvest = false,
    addContributions = false,
    contributionFreq = 'monthly',
    contributionAmount = 0
) {
    const labels = [];
    const portfolioValueData = [];
    const dividendIncomeData = [];
    const sharesOwnedData = [];
    const breakdown = [];

    let currentShares = numShares;
    let totalDividendsReceived = 0;
    let totalContributed = numShares * pricePerShare;

    // Calculate for each year (starting from year 1)
    for (let year = 1; year <= years; year++) {
        // Calculate dividend income for this year
        const yearlyDividendIncome = currentShares * annualDividend;
        totalDividendsReceived += yearlyDividendIncome;

        // Handle contributions
        if (addContributions && contributionAmount > 0) {
            const contributionsPerYear = contributionFreq === 'monthly' ? 12 : 1;
            const yearlyContribution = contributionAmount * contributionsPerYear;
            const sharesFromContributions = yearlyContribution / pricePerShare;
            
            currentShares += sharesFromContributions;
            totalContributed += yearlyContribution;
        }

        // Handle reinvestment
        if (reinvest) {
            const sharesFromDividends = yearlyDividendIncome / pricePerShare;
            currentShares += sharesFromDividends;
        }

        const portfolioValue = currentShares * pricePerShare;

        labels.push(year);
        portfolioValueData.push(Math.round(portfolioValue));
        dividendIncomeData.push(Math.round(yearlyDividendIncome));
        sharesOwnedData.push(Math.round(currentShares * 100) / 100);
        
        breakdown.push({
            year: year,
            shares: Math.round(currentShares * 100) / 100,
            portfolioValue: Math.round(portfolioValue),
            dividendIncome: Math.round(yearlyDividendIncome),
            totalDividends: Math.round(totalDividendsReceived)
        });
    }

    const finalYear = breakdown[breakdown.length - 1];
    const annualIncome = finalYear.dividendIncome;
    const monthlyIncome = annualIncome / 12;

    return {
        labels,
        portfolioValue: portfolioValueData,
        dividendIncome: dividendIncomeData,
        sharesOwned: sharesOwnedData,
        breakdown: breakdown,
        summary: {
            annualIncome: Math.round(annualIncome),
            monthlyIncome: Math.round(monthlyIncome * 100) / 100,
            totalDividends: Math.round(totalDividendsReceived),
            finalShares: Math.round(currentShares * 100) / 100,
            finalPortfolioValue: Math.round(portfolioValueData[portfolioValueData.length - 1]),
            totalContributed: Math.round(totalContributed),
            originalInvestment: Math.round(numShares * pricePerShare)
        }
    };
};

/**
 * Calculates dividend yield from annual dividend and price
 */
window.DividendCalc.calculateYield = function(annualDividend, pricePerShare) {
    if (pricePerShare === 0) return 0;
    return (annualDividend / pricePerShare) * 100;
};

/**
 * Calculates annual dividend from yield and price
 */
window.DividendCalc.calculateDividendFromYield = function(yieldPercent, pricePerShare) {
    return (yieldPercent / 100) * pricePerShare;
};
