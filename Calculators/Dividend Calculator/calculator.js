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
 * Calculates dividend income over time with optional reinvestment, contributions, and tax.
 * 
 * @param {number} numShares - Number of shares owned
 * @param {number} pricePerShare - Price per share
 * @param {number} annualDividend - Annual dividend per share
 * @param {number} years - Duration in years
 * @param {boolean} reinvest - Whether to reinvest dividends
 * @param {boolean} addContributions - Whether to add regular contributions
 * @param {string} contributionFreq - 'monthly' or 'yearly'
 * @param {number} contributionAmount - Amount to contribute
 * @param {boolean} applyTax - Whether to apply withholding tax
 * @param {number} taxRate - Tax rate as percentage (default 15)
 * @param {string} dividendFrequency - 'monthly', 'quarterly', 'semi-annually', 'annually'
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
    contributionAmount = 0,
    applyTax = false,
    taxRate = 15,
    dividendFrequency = 'quarterly'
) {
    const labels = [];
    const portfolioValueData = [];
    const dividendIncomeData = [];
    const sharesOwnedData = [];
    const breakdown = [];

    let currentShares = numShares;
    let totalDividendsReceived = 0;
    let totalDividendsPaid = 0; // Before tax
    let totalTaxPaid = 0;
    let totalContributed = numShares * pricePerShare;

    // Determine payment frequency
    const paymentsPerYear = {
        'monthly': 12,
        'quarterly': 4,
        'semi-annually': 2,
        'annually': 1
    }[dividendFrequency] || 4;

    const contributionsPerYear = contributionFreq === 'monthly' ? 12 : 1;

    // Calculate for each year
    for (let year = 1; year <= years; year++) {
        let yearlyDividendIncome = 0;
        let yearlyDividendGross = 0;
        let yearlyTaxPaid = 0;
        let yearStartShares = currentShares;

        // Process each dividend payment period within the year
        for (let period = 1; period <= paymentsPerYear; period++) {
            // STEP 1: Calculate GROSS dividend for this period (before tax)
            // The gross dividend per period is the annual dividend divided by payment frequency
            // multiplied by the CURRENT number of shares (which grows with reinvestment)
            const periodDividendGross = (annualDividend / paymentsPerYear) * currentShares;
            yearlyDividendGross += periodDividendGross;

            // STEP 2: Apply TAX to the gross dividend
            // Tax per period = (Gross Dividend per period) × (Tax Rate / 100)
            // This tax is DEDUCTED and is NOT available for reinvestment
            // Example: $100 gross × 15% tax = $15 tax, leaving $85 net
            const taxAmount = applyTax ? (periodDividendGross * taxRate / 100) : 0;
            
            // STEP 3: Calculate NET dividend (after tax deduction)
            // This is the actual amount the investor receives and can reinvest
            // Net Dividend = Gross Dividend - Tax
            // The tax money is "gone" and will NOT generate future returns
            const netDividend = periodDividendGross - taxAmount;
            
            yearlyDividendIncome += netDividend;
            yearlyTaxPaid += taxAmount;

            // STEP 4: Reinvest ONLY the NET dividend (if reinvestment is enabled)
            // CRITICAL: Only the NET amount (after tax) is reinvested
            // This creates "tax drag" on compounding:
            // - Monthly with 15% tax: Reinvest 85% of dividend 12 times/year
            // - Annually with 15% tax: Reinvest 85% of dividend 1 time/year
            // More frequent reinvestment of NET amounts = more compounding despite tax drag
            if (reinvest && netDividend > 0) {
                const sharesFromDividends = netDividend / pricePerShare;
                currentShares += sharesFromDividends;
            }

            // Handle contributions within the year (distributed across periods)
            if (addContributions && contributionAmount > 0) {
                const periodsPerContribution = paymentsPerYear / contributionsPerYear;
                
                // Add contribution if this period aligns with contribution frequency
                if (period % Math.max(1, Math.round(periodsPerContribution)) === 0 || periodsPerContribution >= 1) {
                    const contributionThisPeriod = contributionAmount * (contributionsPerYear / paymentsPerYear);
                    const sharesFromContributions = contributionThisPeriod / pricePerShare;
                    
                    currentShares += sharesFromContributions;
                    totalContributed += contributionThisPeriod;
                }
            }
        }

        totalDividendsReceived += yearlyDividendIncome;
        totalDividendsPaid += yearlyDividendGross;
        totalTaxPaid += yearlyTaxPaid;

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
            dividendGross: Math.round(yearlyDividendGross),
            taxPaid: Math.round(yearlyTaxPaid),
            totalDividends: Math.round(totalDividendsReceived),
            totalTax: Math.round(totalTaxPaid)
        });
    }

    const finalYear = breakdown[breakdown.length - 1];
    const annualIncome = finalYear.dividendIncome;
    const annualGross = finalYear.dividendGross;
    const annualTax = finalYear.taxPaid;

    // Calculate per-period values based on payment frequency
    const incomePerPeriod = annualIncome / paymentsPerYear;
    const grossPerPeriod = annualGross / paymentsPerYear;
    const taxPerPeriod = annualTax / paymentsPerYear;

    return {
        labels,
        portfolioValue: portfolioValueData,
        dividendIncome: dividendIncomeData,
        sharesOwned: sharesOwnedData,
        breakdown: breakdown,
        summary: {
            annualIncome: Math.round(annualIncome),
            annualGross: Math.round(annualGross),
            annualTax: Math.round(annualTax),
            incomePerPeriod: Math.round(incomePerPeriod * 100) / 100,
            grossPerPeriod: Math.round(grossPerPeriod * 100) / 100,
            taxPerPeriod: Math.round(taxPerPeriod * 100) / 100,
            paymentsPerYear: paymentsPerYear,
            monthlyIncome: Math.round((annualIncome / 12) * 100) / 100,
            totalDividends: Math.round(totalDividendsReceived),
            totalDividendsGross: Math.round(totalDividendsPaid),
            totalTaxPaid: Math.round(totalTaxPaid),
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
