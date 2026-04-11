///------------2026 Pomerancee. All rights reserved.----------------\\\
///------------https://creativecommons.org/licenses/by-nc-sa/4.0/---\\\
///------------Licensed under CC BY-NC-SA 4.0------------------------\\\












/**
 * Investment Calculator Logic
 * 
 * Handles compound interest calculations based on user inputs.
 */

window.App = window.App || {};

/**
 * Calculates the future value of an investment with regular contributions.
 * 
 * @param {number} initialInvestment - The starting amount.
 * @param {number} contribution - The regular contribution amount.
 * @param {number} frequency - Contributions per year (e.g., 12 for monthly).
 * @param {number} rate - Annual interest rate in percentage.
 * @param {number} years - Duration of investment in years.
 * @param {number} inflationRate - Annual inflation rate in percentage.
 * @param {boolean} adjustForInflation - Whether to adjust results for inflation.
 * @param {number} taxRate - Tax rate on profits in percentage.
 * @param {boolean} includeTax - Whether to apply tax on profits.
 * @returns {Object} Result containing arrays for the chart, final totals, and detailed breakdown.
 */
window.App.calculateCompoundInterest = function(initialInvestment, contribution, frequency, rate, years, inflationRate = 0, adjustForInflation = false, taxRate = 0, includeTax = false) {
    const labels = [];
    const totalInvestedData = [];
    const portfolioValueData = [];
    const totalProfitData = [];
    const breakdown = [];

    let currentBalance = initialInvestment;
    let totalInvested = initialInvestment;
    
    // Convert rates to decimal
    const r = rate / 100;
    const inf = inflationRate / 100;
    const tr = taxRate / 100;
    
    // Total number of periods
    const n = frequency;
    
    // Initial data point (Year 0)
    labels.push(0);
    totalInvestedData.push(Math.round(totalInvested));
    portfolioValueData.push(Math.round(currentBalance));
    totalProfitData.push(0);
    
    breakdown.push({
        year: 0,
        invested: Math.round(totalInvested),
        interest: 0,
        balance: Math.round(currentBalance)
    });

    // Safe max bounds to prevent Javascript Infinity which crashes Intl.NumberFormat
    const SAFE_MAX = 1e300;

    // Loop through each year
    for (let year = 1; year <= years; year++) {
        // Calculate for n periods in this year
        for (let i = 0; i < n; i++) {
            // Apply interest for this period
            if (currentBalance < SAFE_MAX) {
                currentBalance = currentBalance * (1 + r / n);
                currentBalance += contribution;
            }
            if (totalInvested < SAFE_MAX) {
                totalInvested += contribution;
            }
        }

        let displayBalance = currentBalance;
        let displayInvested = totalInvested;

        // Apply Tax if requested (Nominal)
        // We assume tax is paid on gains at the end of the period (liquidation view)
        if (includeTax) {
            const profit = displayBalance - displayInvested;
            if (profit > 0) {
                const tax = profit * tr;
                displayBalance -= tax;
            }
        }

        // Apply inflation adjustment if requested
        if (adjustForInflation) {
            // Discount factor = 1 / (1 + inflation)^year
            const discountFactor = 1 / Math.pow(1 + inf, year);
            displayBalance = displayBalance * discountFactor;
        }

        // Safety cap the outputs for rendering arrays
        displayInvested = Math.min(displayInvested, SAFE_MAX);
        displayBalance = Math.min(displayBalance, SAFE_MAX);
        
        // Prevent NaN on profit calculation if maxed out
        let profit = displayBalance - displayInvested;
        if (displayBalance >= SAFE_MAX && displayInvested >= SAFE_MAX) profit = 0;
        else if (profit < 0) profit = 0;

        labels.push(year);
        totalInvestedData.push(Math.round(displayInvested));
        portfolioValueData.push(Math.round(displayBalance));
        totalProfitData.push(Math.round(profit));
        
        breakdown.push({
            year: year,
            invested: Math.round(displayInvested),
            interest: Math.round(profit),
            balance: Math.round(displayBalance)
        });
    }

    const finalBalance = portfolioValueData[portfolioValueData.length - 1];
    const finalInvested = totalInvestedData[totalInvestedData.length - 1];

    return {
        labels,
        totalInvested: totalInvestedData,
        portfolioValue: portfolioValueData,
        totalProfit: totalProfitData,
        breakdown: breakdown,
        summary: {
            finalBalance: finalBalance,
            totalInvested: finalInvested,
            totalInterest: finalBalance - finalInvested
        }
    };
};
