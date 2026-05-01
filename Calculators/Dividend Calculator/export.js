///------------2026 Pomerancee. All rights reserved.----------------\\\
///------------https://creativecommons.org/licenses/by-nc-sa/4.0/---\\\
///------------Licensed under CC BY-NC-SA 4.0------------------------\\\

/**
 * export.js — Share, Save HTML, and Table export functionality
 */

/*──────────────────────────────────────────────────────────────────────────
  MODAL HELPERS
──────────────────────────────────────────────────────────────────────────*/
function openExportModal() {
    const modal = document.getElementById('export-modal');
    if (!modal) return;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeExportModal() {
    const modal = document.getElementById('export-modal');
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
}

function openShareFallback(url) {
    const modal = document.getElementById('share-fallback-modal');
    const inp   = document.getElementById('share-fallback-url');
    if (!modal || !inp) return;
    inp.value = url;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => { inp.select(); });
}

function closeShareFallback() {
    const modal = document.getElementById('share-fallback-modal');
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
}

/*──────────────────────────────────────────────────────────────────────────
  SHARE — Serialize state → URL → clipboard
──────────────────────────────────────────────────────────────────────────*/
function serializeStateToURL() {
    const s = window.appState;
    if (!s) return window.location.href;

    const params = new URLSearchParams();
    params.set('sh',  s.numShares);
    params.set('pr',  s.pricePerShare);
    params.set('div', s.annualDividend);
    params.set('cur', s.currency);
    params.set('tax', s.taxRate);
    params.set('taxOn', s.applyTax       ? '1' : '0');
    params.set('ri',    s.reinvest        ? '1' : '0');
    params.set('cont',  s.addContributions ? '1' : '0');
    params.set('ca',  s.contributionAmount);
    params.set('cf',  s.contributionFreq === 'monthly' ? 'm' : 'y');
    const dfMap = { monthly: 'm', quarterly: 'q', 'semi-annually': 's', annually: 'a' };
    params.set('df',  dfMap[s.dividendFrequency] || 'q');
    params.set('yr',  s.selectedYears);

    s.additionalStocks.forEach((stock, i) => {
        const n = i + 1;
        if (stock.label)          params.set(`s${n}_nm`,  stock.label);
        if (stock.numShares)      params.set(`s${n}_sh`,  stock.numShares);
        if (stock.pricePerShare)  params.set(`s${n}_pr`,  stock.pricePerShare);
        if (stock.annualDividend) params.set(`s${n}_div`, stock.annualDividend);
    });

    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

async function copyShareURL() {
    const btn   = document.getElementById('btn-share');
    const label = btn ? btn.querySelector('.action-btn-label') : null;
    const url   = serializeStateToURL();

    try {
        await navigator.clipboard.writeText(url);
        if (btn && label) {
            const orig = label.textContent;
            btn.classList.add('btn-success');
            label.textContent = 'Copied!';
            setTimeout(() => { btn.classList.remove('btn-success'); label.textContent = orig; }, 2000);
        }
    } catch (_) {
        openShareFallback(url);
    }
}

/*──────────────────────────────────────────────────────────────────────────
  LOAD STATE FROM URL (called by app.js on init)
──────────────────────────────────────────────────────────────────────────*/
window.loadStateFromURL = function(state) {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('sh') && !params.has('div')) return false;

    if (params.has('sh'))    state.numShares          = parseFloat(params.get('sh'))  || 0;
    if (params.has('pr'))    state.pricePerShare       = parseFloat(params.get('pr'))  || 0;
    if (params.has('div'))   state.annualDividend      = parseFloat(params.get('div')) || 0;
    state.dividendYield = state.pricePerShare > 0
        ? (state.annualDividend / state.pricePerShare) * 100 : 0;

    if (params.has('cur'))   state.currency            = params.get('cur');
    if (params.has('tax'))   state.taxRate             = parseFloat(params.get('tax')) || 0;
    if (params.has('taxOn')) state.applyTax            = params.get('taxOn') === '1';
    if (params.has('ri'))    state.reinvest            = params.get('ri')    === '1';
    if (params.has('cont'))  state.addContributions    = params.get('cont')  === '1';
    if (params.has('ca'))    state.contributionAmount  = parseFloat(params.get('ca'))  || 0;
    if (params.has('cf'))    state.contributionFreq    = params.get('cf') === 'y' ? 'yearly' : 'monthly';
    const dfRev = { m: 'monthly', q: 'quarterly', s: 'semi-annually', a: 'annually' };
    if (params.has('df'))    state.dividendFrequency   = dfRev[params.get('df')] || 'quarterly';
    if (params.has('yr'))    state.selectedYears       = parseInt(params.get('yr')) || 10;

    // Additional stocks
    state.additionalStocks = [];
    state.stockIdCounter   = 0;
    let i = 1;
    while (params.has(`s${i}_sh`) || params.has(`s${i}_div`) || params.has(`s${i}_nm`)) {
        state.stockIdCounter++;
        const price = parseFloat(params.get(`s${i}_pr`))  || 0;
        const div   = parseFloat(params.get(`s${i}_div`)) || 0;
        state.additionalStocks.push({
            id:             state.stockIdCounter,
            label:          params.get(`s${i}_nm`) || '',
            numShares:      parseFloat(params.get(`s${i}_sh`)) || 0,
            pricePerShare:  price,
            annualDividend: div,
            dividendYield:  price > 0 ? (div / price) * 100 : 0,
            lastUpdated:    'dividend'
        });
        i++;
    }
    return true;
};

/*──────────────────────────────────────────────────────────────────────────
  SAVE AS HTML — Smart Link File (auto-redirect with full state in URL)
──────────────────────────────────────────────────────────────────────────*/
function saveAsHTML() {
    const btn   = document.getElementById('btn-save-html');
    const label = btn ? btn.querySelector('.action-btn-label') : null;

    // Build the full state URL (same logic as Share button)
    const stateURL = serializeStateToURL();
    const dateStr  = new Date().toISOString().slice(0, 10);
    const dateFull = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

    // Generate the lightweight redirect HTML
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dividend Calculator Snapshot — ${dateFull}</title>
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            background: #0f172a;
            color: #e5e7eb;
            font-family: Inter, system-ui, -apple-system, sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        }
        .card {
            background: linear-gradient(145deg, #1e293b, #0f172a);
            border: 1px solid rgba(139, 92, 246, 0.25);
            border-radius: 1.25rem;
            padding: 2.5rem 2rem;
            max-width: 480px;
            width: 100%;
            text-align: center;
            box-shadow: 0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.1);
        }
        .icon { font-size: 2.5rem; margin-bottom: 1rem; }
        h1 {
            font-size: 1.35rem;
            font-weight: 700;
            letter-spacing: -0.03em;
            color: #f1f5f9;
            margin-bottom: 0.5rem;
        }
        .subtitle {
            font-size: 0.9rem;
            color: #94a3b8;
            margin-bottom: 2rem;
            line-height: 1.5;
        }
        .spinner {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.85rem;
            color: #8b5cf6;
            font-weight: 600;
            margin-bottom: 1.5rem;
            letter-spacing: 0.02em;
        }
        .dot {
            width: 6px; height: 6px;
            background: #8b5cf6;
            border-radius: 50%;
            animation: bounce 1.2s ease-in-out infinite;
        }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
            40%            { transform: scale(1);   opacity: 1; }
        }
        .btn {
            display: inline-block;
            padding: 0.75rem 1.75rem;
            background: linear-gradient(135deg, #7c3aed, #8b5cf6);
            color: #fff;
            text-decoration: none;
            border-radius: 0.625rem;
            font-size: 0.9rem;
            font-weight: 700;
            letter-spacing: 0.01em;
            transition: box-shadow 0.2s, transform 0.2s;
            box-shadow: 0 4px 16px rgba(139,92,246,0.35);
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 28px rgba(139,92,246,0.55);
        }
        .url-note {
            margin-top: 1.5rem;
            padding: 0.75rem;
            background: rgba(15,23,42,0.7);
            border: 1px solid rgba(148,163,184,0.1);
            border-radius: 0.5rem;
            font-size: 0.68rem;
            color: #64748b;
            word-break: break-all;
            text-align: left;
            line-height: 1.5;
        }
        .url-note strong { color: #94a3b8; display: block; margin-bottom: 0.25rem; }
        .saved-date {
            margin-top: 1.25rem;
            font-size: 0.72rem;
            color: #475569;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon">📊</div>
        <h1>Dividend Calculator Snapshot</h1>
        <p class="subtitle">Opening your saved portfolio in the live calculator…</p>
        <div class="spinner">
            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            Redirecting
        </div>
        <br>
        <a class="btn" href="${stateURL}" id="open-btn">Open Calculator</a>
        <div class="url-note">
            <strong>Saved URL</strong>${stateURL}
        </div>
        <p class="saved-date">Snapshot saved on ${dateFull}</p>
    </div>
    <script>
        // Auto-redirect immediately; show button as fallback
        try { window.location.replace("${stateURL.replace(/"/g, '\\"')}"); }
        catch(e) { document.getElementById('open-btn').focus(); }
    <\/script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    triggerDownload(blob, `dividend-calculator-link-${dateStr}.html`);

    // Brief button feedback
    if (btn && label) {
        const orig = label.textContent;
        btn.classList.add('btn-success');
        label.textContent = 'Saved!';
        setTimeout(() => { btn.classList.remove('btn-success'); label.textContent = orig; }, 2000);
    }
}

/*──────────────────────────────────────────────────────────────────────────
  CSV EXPORT
──────────────────────────────────────────────────────────────────────────*/
function exportToCSV() {
    const data = window.lastCalcData;
    if (!data) return;
    const { combined, mainResult, additionalResults, snapState: s } = data;
    const sym     = s.currencySymbol;
    const dateStr = new Date().toISOString().slice(0, 10);

    const allStocks = buildAllStocks(s, mainResult, additionalResults);

    let csv = '\uFEFF'; // UTF-8 BOM

    csv += '# Portfolio Summary\r\n';
    csv += 'Metric,Value\r\n';
    csv += `Total Portfolio Value,${sym}${combined.finalPortfolioValue.toLocaleString()}\r\n`;
    csv += `Annual Dividend Income,${sym}${combined.annualIncome.toLocaleString()}\r\n`;
    csv += `Monthly Dividend Income,${sym}${combined.monthlyIncome.toFixed(2)}\r\n`;
    csv += `Total Tax Paid (period),${sym}${combined.totalTaxPaid.toLocaleString()}\r\n`;
    csv += `Tax Rate,${s.taxRate}%\r\n`;
    csv += `Time Period,${s.selectedYears} years\r\n`;
    csv += `Reinvest Dividends,${s.reinvest ? 'Yes' : 'No'}\r\n`;
    csv += `Dividend Frequency,${s.dividendFrequency}\r\n`;
    csv += '\r\n';

    csv += '# Stock Breakdown\r\n';
    csv += `Stock Name,Shares,Price/Share,Annual Div/Share,Annual Income,Monthly Income,Annual Tax\r\n`;
    allStocks.forEach(({ name, numShares, pricePerShare, annualDividend, result }) => {
        csv += `"${name}",${numShares},${pricePerShare},${annualDividend},`
            + `${result.summary.annualIncome},${result.summary.monthlyIncome.toFixed(2)},`
            + `${result.summary.annualTax}\r\n`;
    });
    csv += '\r\n';

    csv += '# Year by Year Projection\r\n';
    csv += 'Year,Portfolio Value,Annual Dividend,Cumulative Dividends,Tax Paid\r\n';
    if (mainResult.breakdown) {
        mainResult.breakdown.forEach((row, i) => {
            const pv   = allStocks.reduce((sum, st) => sum + (st.result.breakdown[i]?.portfolioValue  || 0), 0);
            const div  = allStocks.reduce((sum, st) => sum + (st.result.breakdown[i]?.dividendIncome  || 0), 0);
            const cum  = allStocks.reduce((sum, st) => sum + (st.result.breakdown[i]?.totalDividends  || 0), 0);
            const tax  = allStocks.reduce((sum, st) => sum + (st.result.breakdown[i]?.taxPaid         || 0), 0);
            csv += `${row.year},${pv},${div},${cum},${tax}\r\n`;
        });
    }

    triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8' }),
        `dividend-portfolio-${dateStr}.csv`);
}

/*──────────────────────────────────────────────────────────────────────────
  EXCEL EXPORT
──────────────────────────────────────────────────────────────────────────*/
async function exportToExcel() {
    const data = window.lastCalcData;
    if (!data) return;
    const { combined, mainResult, additionalResults, snapState: s } = data;
    const sym     = s.currencySymbol;
    const dateStr = new Date().toISOString().slice(0, 10);

    let XLSX;
    try {
        XLSX = await loadSheetJS();
    } catch (_) {
        alert('Could not load Excel library. Please check your internet connection and try again.');
        return;
    }

    const wb = XLSX.utils.book_new();
    const allStocks = buildAllStocks(s, mainResult, additionalResults);

    // ── Sheet 1: Portfolio Summary ──────────────────────────────────────────
    const ws1 = XLSX.utils.aoa_to_sheet([
        ['Metric', 'Value'],
        ['Total Portfolio Value',   `${sym}${combined.finalPortfolioValue.toLocaleString()}`],
        ['Annual Dividend Income',  `${sym}${combined.annualIncome.toLocaleString()}`],
        ['Monthly Dividend Income', `${sym}${combined.monthlyIncome.toFixed(2)}`],
        ['Total Tax Paid (period)', `${sym}${combined.totalTaxPaid.toLocaleString()}`],
        ['Tax Rate',                `${s.taxRate}%`],
        ['Time Period',             `${s.selectedYears} years`],
        ['Reinvest Dividends',      s.reinvest ? 'Yes' : 'No'],
        ['Dividend Frequency',      s.dividendFrequency],
        ['Currency',                s.currency],
    ]);
    ws1['!cols'] = [{ wch: 30 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Portfolio Summary');

    // ── Sheet 2: Stock Breakdown ────────────────────────────────────────────
    const breakRows = [
        ['Stock Name', 'Shares', `Price (${sym})`, `Annual Div/Share (${sym})`,
            'Annual Income', 'Monthly Income', 'Annual Tax']
    ];
    allStocks.forEach(({ name, numShares, pricePerShare, annualDividend, result }) => {
        breakRows.push([
            name, numShares, pricePerShare, annualDividend,
            result.summary.annualIncome,
            parseFloat(result.summary.monthlyIncome.toFixed(2)),
            result.summary.annualTax
        ]);
    });
    const ws2 = XLSX.utils.aoa_to_sheet(breakRows);
    ws2['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 12 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Stock Breakdown');

    // ── Sheet 3: Year by Year Projection ───────────────────────────────────
    const projRows = [['Year', 'Portfolio Value', 'Annual Dividend', 'Cumulative Dividends', 'Tax Paid']];
    if (mainResult.breakdown) {
        mainResult.breakdown.forEach((row, i) => {
            const pv  = allStocks.reduce((sum, st) => sum + (st.result.breakdown[i]?.portfolioValue || 0), 0);
            const div = allStocks.reduce((sum, st) => sum + (st.result.breakdown[i]?.dividendIncome || 0), 0);
            const cum = allStocks.reduce((sum, st) => sum + (st.result.breakdown[i]?.totalDividends || 0), 0);
            const tax = allStocks.reduce((sum, st) => sum + (st.result.breakdown[i]?.taxPaid        || 0), 0);
            projRows.push([row.year, pv, div, cum, tax]);
        });
    }
    const ws3 = XLSX.utils.aoa_to_sheet(projRows);
    ws3['!cols'] = [{ wch: 8 }, { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws3, 'Year by Year');

    XLSX.writeFile(wb, `dividend-portfolio-${dateStr}.xlsx`);
}

/*──────────────────────────────────────────────────────────────────────────
  UTILITIES
──────────────────────────────────────────────────────────────────────────*/
function buildAllStocks(s, mainResult, additionalResults) {
    return [
        { name: 'Main Stock', numShares: s.numShares, pricePerShare: s.pricePerShare,
          annualDividend: s.annualDividend, result: mainResult },
        ...(additionalResults || []).map(({ stock, result }) => ({
            name: stock.label || `Stock ${stock.id}`,
            numShares: stock.numShares, pricePerShare: stock.pricePerShare,
            annualDividend: stock.annualDividend, result
        }))
    ];
}

function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href    = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}

let _xlsxLoading = null;
function loadSheetJS() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (_xlsxLoading)  return _xlsxLoading;
    _xlsxLoading = new Promise((resolve, reject) => {
        const s  = document.createElement('script');
        s.src    = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
        s.onload  = () => resolve(window.XLSX);
        s.onerror = () => reject(new Error('SheetJS failed to load'));
        document.head.appendChild(s);
    });
    return _xlsxLoading;
}

/*──────────────────────────────────────────────────────────────────────────
  INIT — Wire up all buttons and modal events
──────────────────────────────────────────────────────────────────────────*/
document.addEventListener('DOMContentLoaded', () => {

    // Action bar buttons
    document.getElementById('btn-share')?.addEventListener('click', copyShareURL);
    document.getElementById('btn-save-html')?.addEventListener('click', saveAsHTML);
    document.getElementById('btn-export-table')?.addEventListener('click', openExportModal);

    // Export modal
    const exportModal = document.getElementById('export-modal');
    if (exportModal) {
        document.getElementById('export-modal-close')?.addEventListener('click', closeExportModal);
        exportModal.addEventListener('click', e => { if (e.target === exportModal) closeExportModal(); });
        document.getElementById('export-xlsx-btn')?.addEventListener('click', () => { closeExportModal(); exportToExcel(); });
        document.getElementById('export-csv-btn')?.addEventListener('click',  () => { closeExportModal(); exportToCSV(); });
    }

    // Share fallback modal
    const fallbackModal = document.getElementById('share-fallback-modal');
    if (fallbackModal) {
        document.getElementById('share-fallback-close')?.addEventListener('click', closeShareFallback);
        fallbackModal.addEventListener('click', e => { if (e.target === fallbackModal) closeShareFallback(); });
        document.getElementById('share-fallback-copy')?.addEventListener('click', () => {
            const inp = document.getElementById('share-fallback-url');
            if (inp) { inp.select(); document.execCommand('copy'); closeShareFallback(); }
        });
    }

    // ESC closes any open modal
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') { closeExportModal(); closeShareFallback(); }
    });
});
