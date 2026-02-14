// ===== PlainFinancials - Sky/Air Report Page Logic =====
// 8-section CFO narrative: P&L → Why → Engine → Cash → Debt → Runway → Bank → Actions

const urlParams = new URLSearchParams(window.location.search);
const isSampleMode = urlParams.get('sample') === 'true';

document.addEventListener('DOMContentLoaded', async () => {
    if (isSampleMode) {
        populateReportWithSampleData();
        showSampleBanner();
        document.getElementById('generatedDate').textContent = new Date().toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        return;
    }

    let shouldAutoSend = false;

    const storedReport = localStorage.getItem('plainfinance_report');
    if (storedReport) {
        const reportData = JSON.parse(storedReport);
        populateReportFromAPI(reportData);
        shouldAutoSend = true;
    } else {
        const storedData = localStorage.getItem('plainfinance_data');
        if (storedData) {
            populateReport(JSON.parse(storedData));
            shouldAutoSend = true;
        } else {
            populateReportWithSampleData();
        }
    }

    document.getElementById('generatedDate').textContent = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    setTimeout(() => applyBlurStrategy(), 100);

    // Auto-send report email (fire-and-forget, only for real data)
    if (shouldAutoSend) {
        setTimeout(() => autoSendReportEmail(), 500);
    }
});

// ===== Sample Banner =====

function showSampleBanner() {
    const banner = document.createElement('div');
    banner.className = 'sample-banner';
    banner.innerHTML = `
        <div class="sample-banner-content">
            <span class="sample-badge">Sample Report</span>
            <span class="sample-text">This is a demo report for Atlas Retail Inc. See what you will get.</span>
            <a href="analyze.html" class="btn btn-primary btn-sm">Try With Your Numbers</a>
        </div>
    `;
    document.body.insertBefore(banner, document.body.firstChild);
}

// ===== Populate from API =====

function populateReportFromAPI(reportData) {
    const currency = reportData.company?.currency || 'AED';
    const industry = reportData.company?.industry || 'product';
    const current = reportData.current;
    const previous = reportData.previous || {};
    const metrics = reportData.metrics;
    const analysis = reportData.analysis;

    setCompanyInfo(reportData.company, currency);

    if (current && metrics) {
        updateHealthStrip(metrics);
        updateMiniPL(current, metrics, currency, industry);
        updateProfitInterpretation(current, metrics, currency, analysis);
        updateOperationalHealth(metrics, currency, analysis, industry, current);
        const fcfValue = updateFCF(current, previous, metrics, currency);
        updateFCFF(current, currency, fcfValue);
        updateCashRunway(metrics, currency, current, industry);
        updateBankMeetingSummary(current, metrics, currency, analysis);
        updateWeeklyActions(current, metrics, currency, analysis);
    }
}

// ===== Populate from legacy data =====

function populateReport(data) {
    const currency = data.company?.currency || 'AED';
    const industry = data.company?.industry || 'product';
    const current = data.current;
    const previous = data.previous || {};
    const daysInMonth = 30;

    setCompanyInfo(data.company, currency);

    if (current) {
        const ytd = data.ytd || {};
        const metrics = calculateMetrics(current, previous, daysInMonth, ytd);

        updateHealthStrip(metrics);
        updateMiniPL(current, metrics, currency, industry);
        updateProfitInterpretation(current, metrics, currency, null);
        updateOperationalHealth(metrics, currency, null, industry, current);
        const fcfValue = updateFCF(current, previous, metrics, currency);
        updateFCFF(current, currency, fcfValue);
        updateCashRunway(metrics, currency, current, industry);
        updateBankMeetingSummary(current, metrics, currency, null);
        updateWeeklyActions(current, metrics, currency, null);
    }
}

// ===== Sample Data =====

function populateReportWithSampleData() {
    const sampleData = {
        company: {
            name: 'Atlas Retail Inc',
            industry: 'product',
            period: { month: '11', year: '2024' },
            currency: 'USD'
        },
        current: {
            revenue: 500000,
            cogs: 325000,
            opex: 120000,
            netProfit: 55000,
            cash: 45000,
            receivables: 187000,
            inventory: 210000,
            payables: 98000,
            shortTermLoans: 50000,
            otherLiabilities: 0,
            loanRepayments: 15000,
            ownerDrawings: 10000,
            assetPurchases: 5000
        },
        previous: {
            revenue: 465000,
            netProfit: 60000,
            cash: 72000,
            receivables: 145000,
            inventory: 185000,
            payables: 88000
        }
    };
    populateReport(sampleData);
}

// ===== Helpers =====

function setCompanyInfo(company, currency) {
    if (!company) return;
    document.getElementById('companyName').textContent = company.name || 'Your Company';
    const monthNames = ['January','February','March','April','May','June',
                       'July','August','September','October','November','December'];
    const period = `${monthNames[parseInt(company.period.month) - 1]} ${company.period.year}`;
    document.getElementById('reportPeriod').textContent = period;
}

function calculateMetrics(current, previous, days, ytd = {}) {
    const revenue = current.revenue || 0;
    const cogs = current.cogs || 0;
    const opex = current.opex || 0;
    const netProfit = current.netProfit || 0;
    const cash = current.cash || 0;
    const receivables = current.receivables || 0;
    const inventory = current.inventory || 0;
    const payables = current.payables || 0;
    const shortTermLoans = current.shortTermLoans || 0;
    const otherLiabilities = current.otherLiabilities || 0;

    const grossProfit = revenue - cogs;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    const totalCurrentAssets = cash + receivables + inventory;
    const totalCurrentLiabilities = payables + shortTermLoans + otherLiabilities;
    const currentRatio = totalCurrentLiabilities > 0 ? totalCurrentAssets / totalCurrentLiabilities : 0;

    const dso = revenue > 0 ? (receivables / revenue) * days : 0;
    const dio = cogs > 0 ? (inventory / cogs) * days : 0;
    const dpo = cogs > 0 ? (payables / cogs) * days : 0;
    const ccc = dso + dio - dpo;

    let cashRunway = 0;
    let runwayMethod = 'opex';

    if (ytd && ytd.startingCash > 0 && ytd.monthsElapsed > 0) {
        const monthlyBurn = (ytd.startingCash - cash) / ytd.monthsElapsed;
        runwayMethod = 'ytd';
        cashRunway = monthlyBurn > 0 ? cash / monthlyBurn : -1;
    } else if (previous && previous.cash !== undefined && previous.cash > 0) {
        const monthlyBurn = previous.cash - cash;
        runwayMethod = 'monthly';
        cashRunway = monthlyBurn > 0 ? cash / monthlyBurn : -1;
    } else {
        runwayMethod = 'opex';
        cashRunway = opex > 0 ? cash / opex : 0;
    }

    const revenueChange = previous.revenue ? ((revenue - previous.revenue) / previous.revenue) * 100 : null;

    return {
        grossProfit, grossMargin, netMargin,
        totalCurrentAssets, totalCurrentLiabilities, currentRatio,
        dso, dio, dpo, ccc,
        cashRunway, runwayMethod, revenueChange
    };
}

function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    return Math.abs(num).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function signedAmount(val, currency) {
    if (val >= 0) return `+ ${currency} ${formatNumber(val)}`;
    return `- ${currency} ${formatNumber(Math.abs(val))}`;
}

// ===== Industry Benchmarks =====

function getDefaultBenchmarks(industry) {
    // Industry benchmarks — DSO/DIO/DPO sourced from CreditPulse 2025, ReadyRatios SEC 2024, PwC Working Capital Study 24/25, Hackett Group 2025
    const b = {
        'retail':        { name: 'Retail',        grossMargin: { min: 25, max: 50, ideal: 35 }, netMargin: { min: 2, max: 10, ideal: 5 }, dso: { min: 0, max: 10, industry: 2 }, dio: { min: 30, max: 60, industry: 45 }, dpo: { min: 20, max: 45, industry: 30 } },
        'product':       { name: 'Product',       grossMargin: { min: 30, max: 55, ideal: 40 }, netMargin: { min: 5, max: 15, ideal: 10 }, dso: { min: 20, max: 45, industry: 30 }, dio: { min: 30, max: 60, industry: 45 }, dpo: { min: 20, max: 45, industry: 30 } },
        'service':       { name: 'Service',       grossMargin: { min: 40, max: 70, ideal: 55 }, netMargin: { min: 10, max: 25, ideal: 15 }, dso: { min: 30, max: 60, industry: 45 }, dio: { min: 0, max: 0, industry: 0 }, dpo: { min: 20, max: 45, industry: 30 } },
        'ecommerce':     { name: 'E-commerce',    grossMargin: { min: 20, max: 45, ideal: 30 }, netMargin: { min: 3, max: 12, ideal: 7 }, dso: { min: 0, max: 5, industry: 1 }, dio: { min: 20, max: 45, industry: 30 }, dpo: { min: 20, max: 45, industry: 30 } },
        'manufacturing': { name: 'Manufacturing', grossMargin: { min: 20, max: 40, ideal: 30 }, netMargin: { min: 3, max: 12, ideal: 7 }, dso: { min: 45, max: 75, industry: 60 }, dio: { min: 60, max: 120, industry: 90 }, dpo: { min: 30, max: 60, industry: 45 } },
        'wholesale':     { name: 'Wholesale',     grossMargin: { min: 15, max: 30, ideal: 22 }, netMargin: { min: 2, max: 8, ideal: 5 }, dso: { min: 25, max: 50, industry: 35 }, dio: { min: 30, max: 60, industry: 45 }, dpo: { min: 25, max: 50, industry: 35 } },
        'restaurant':    { name: 'Restaurant',    grossMargin: { min: 55, max: 70, ideal: 62 }, netMargin: { min: 3, max: 10, ideal: 6 }, dso: { min: 0, max: 3, industry: 1 }, dio: { min: 3, max: 10, industry: 7 }, dpo: { min: 14, max: 30, industry: 21 } },
        'construction':  { name: 'Construction',  grossMargin: { min: 15, max: 35, ideal: 25 }, netMargin: { min: 2, max: 10, ideal: 5 }, dso: { min: 60, max: 120, industry: 90 }, dio: { min: 7, max: 30, industry: 15 }, dpo: { min: 45, max: 90, industry: 60 } }
    };
    // Map form values to benchmark keys
    const aliases = { 'food': 'restaurant', 'services': 'service', 'online': 'ecommerce', 'healthcare': 'service', 'other': 'product' };
    const key = aliases[industry?.toLowerCase()] || industry?.toLowerCase();
    return b[key] || b['product'];
}

function benchStatus(value, benchmark, higherIsBetter) {
    if (higherIsBetter) {
        if (value >= benchmark.min) return 'good';
        if (value >= benchmark.min * 0.7) return 'warning';
        return 'danger';
    } else {
        if (value <= benchmark.max) return 'good';
        if (value <= benchmark.max * 1.3) return 'warning';
        return 'danger';
    }
}

function renderBenchBar(containerId, label, value, benchmark, unit, higherIsBetter) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const status = benchStatus(value, benchmark, higherIsBetter);
    const range = benchmark.max - benchmark.min;
    const extMin = benchmark.min - range * 0.3;
    const extMax = benchmark.max + range * 0.3;
    const total = extMax - extMin;

    const dotPos = Math.max(0, Math.min(100, ((value - extMin) / total) * 100));
    const idealVal = benchmark.ideal !== undefined ? benchmark.ideal : benchmark.industry;
    const idealPos = ((idealVal - extMin) / total) * 100;
    const rangeLeft = ((benchmark.min - extMin) / total) * 100;
    const rangeWidth = (range / total) * 100;

    const displayVal = unit === '%' ? `${value.toFixed(1)}%` : `${Math.round(value)} ${unit}`;

    el.innerHTML = `
        <div class="bench-bar-header">
            <span class="bench-bar-label">${label} — Industry: ${Math.round(benchmark.min)}${unit}–${Math.round(benchmark.max)}${unit}</span>
            <span class="bench-bar-you ${status}">You: ${displayVal}</span>
        </div>
        <div class="bench-bar-track">
            <div class="bench-bar-range" style="left:${rangeLeft}%;width:${rangeWidth}%"></div>
            <div class="bench-bar-ideal" style="left:${idealPos}%"></div>
            <div class="bench-bar-dot ${status}" style="left:${dotPos}%"></div>
        </div>
        <div class="bench-bar-range-labels">
            <span>${Math.round(extMin)}${unit}</span>
            <span>${Math.round(extMax)}${unit}</span>
        </div>`;
}

// ===== Health Strip =====

function updateHealthStrip(metrics) {
    const strip = document.getElementById('healthStrip');
    const runway = metrics.runwayMonths || 0;
    const netMargin = metrics.netMargin || 0;
    const grossMargin = metrics.grossMargin || 0;
    const profitable = netMargin > 0;

    // Determine status
    let status, reason, tier;
    if (profitable && runway >= 3) {
        tier = 'safe';
        status = 'Safe';
        reason = 'Profitable with healthy cash runway';
    } else if (profitable && runway >= 1) {
        tier = 'tight';
        status = 'Tight';
        reason = 'Profitable but cash runway is short';
    } else if (!profitable && runway >= 3) {
        tier = 'tight';
        status = 'Tight';
        reason = 'Losing money but cash reserves provide buffer';
    } else {
        tier = 'danger';
        status = 'Danger';
        reason = profitable ? 'Cash is running out fast' : 'Unprofitable with low cash reserves';
    }

    strip.className = `health-strip ${tier}`;
    document.getElementById('healthStatus').textContent = status;
    document.getElementById('healthReason').textContent = reason;

    // Icon SVGs
    const icons = {
        safe: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
        tight: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
        danger: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>'
    };
    document.getElementById('healthIcon').innerHTML = icons[tier];

    // Runway display
    const runwayWeeks = Math.round(runway * 4.33);
    document.getElementById('healthRunway').textContent = runway >= 1 ? `${runwayWeeks} weeks` : `${Math.round(runway * 30)} days`;

    // Margins
    document.getElementById('healthNetMargin').textContent = `${netMargin.toFixed(1)}%`;
    document.getElementById('healthGrossMargin').textContent = `${grossMargin.toFixed(1)}%`;

    // Sleep test
    let sleep;
    if (profitable && runway >= 6) sleep = 'Pass';
    else if (profitable || runway >= 3) sleep = 'Okay';
    else sleep = 'Fail';
    document.getElementById('healthSleep').textContent = sleep;
}

// ===== Section 1: Mini P&L Snapshot =====

function updateMiniPL(current, metrics, currency, industry) {
    const revenue = current.revenue || 0;
    const cogs = current.cogs || 0;
    const opex = current.opex || 0;
    const grossProfit = revenue - cogs;
    const operatingProfit = grossProfit - opex; // = EBITDA = EBIT (no D&A data)
    const netProfit = current.netProfit || 0;

    const gm = revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(0) : '0';
    const om = revenue > 0 ? ((operatingProfit / revenue) * 100).toFixed(0) : '0';
    const nm = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(0) : '0';

    document.getElementById('plRevenue').textContent = `${currency} ${formatNumber(revenue)}`;
    document.getElementById('plGrossProfit').textContent = `${currency} ${formatNumber(grossProfit)}`;
    document.getElementById('plGrossMargin').textContent = `${gm}%`;

    // EBITDA = EBIT = Operating Profit (no D&A to split)
    document.getElementById('plEBITDA').textContent = `${currency} ${formatNumber(operatingProfit)}`;
    document.getElementById('plEBITDAMargin').textContent = `${om}%`;
    document.getElementById('plNetIncome').textContent = `${currency} ${formatNumber(netProfit)}`;
    document.getElementById('plNetMargin').textContent = `${nm}%`;

    // Color negative values
    setNegativeClass('plGrossProfit', grossProfit);
    setNegativeClass('plEBITDA', operatingProfit);
    setNegativeClass('plNetIncome', netProfit);

    // Industry benchmarks
    const bench = getDefaultBenchmarks(industry);
    renderBenchBar('benchGrossMargin', 'Gross Margin', metrics.grossMargin, bench.grossMargin, '%', true);
    renderBenchBar('benchNetMargin', 'Net Margin', metrics.netMargin, bench.netMargin, '%', true);
}

function setNegativeClass(id, val) {
    const el = document.getElementById(id);
    if (el) el.className = `pl-value${val < 0 ? ' negative' : ''}`;
}

// ===== Section 2: Profit Interpretation =====

function updateProfitInterpretation(current, metrics, currency, analysis) {
    const el = document.getElementById('interpretationText');
    if (!el) return;

    // Use AI analysis if available
    if (analysis && analysis.heroSummary) {
        el.innerHTML = analysis.heroSummary;
        return;
    }

    const revenue = current.revenue || 0;
    const cogs = current.cogs || 0;
    const opex = current.opex || 0;
    const netProfit = current.netProfit || 0;
    const grossProfit = revenue - cogs;
    const operatingProfit = grossProfit - opex;
    let text = '';

    if (netProfit > 0) {
        if (metrics.grossMargin >= 40) {
            text = `Strong performance. Your gross margin of ${metrics.grossMargin.toFixed(0)}% means you keep a healthy share of revenue after direct costs. `;
        } else if (metrics.grossMargin >= 25) {
            text = `Your business is profitable with a solid ${metrics.grossMargin.toFixed(0)}% gross margin. `;
        } else {
            text = `You're profitable, but your ${metrics.grossMargin.toFixed(0)}% gross margin is tight. `;
        }
        if (operatingProfit < grossProfit * 0.5) {
            text += `However, operating expenses are consuming more than half your gross profit. Review your overhead costs.`;
        } else {
            text += `Operating costs are well controlled, leaving a healthy operating profit.`;
        }
    } else if (netProfit === 0) {
        text = 'You broke even this month. Every dollar earned was spent. Focus on growing revenue or reducing costs to move into profit.';
    } else {
        if (grossProfit <= 0) {
            text = `You're selling below cost. This is unsustainable and needs immediate pricing or sourcing changes.`;
        } else if (operatingProfit <= 0) {
            text = `Your products have a healthy margin (${metrics.grossMargin.toFixed(0)}%), but operating expenses pushed you into a loss. Cut overheads or grow sales volume.`;
        } else {
            text = `Operations are profitable, but other costs pushed the bottom line into a loss.`;
        }
    }

    el.textContent = text;
}

// ===== Section 3: Operational Health =====

function updateOperationalHealth(metrics, currency, analysis, industry, current) {
    document.getElementById('opDIO').textContent = `${Math.round(metrics.dio)} days`;
    document.getElementById('opDSO').textContent = `${Math.round(metrics.dso)} days`;
    document.getElementById('opDPO').textContent = `${Math.round(metrics.dpo)} days`;
    document.getElementById('opDIOExplain').textContent = `Your stock sits for ${Math.round(metrics.dio)} days`;
    document.getElementById('opDSOExplain').textContent = `Your customers pay you in ${Math.round(metrics.dso)} days`;
    document.getElementById('opDPOExplain').textContent = `You pay suppliers in ${Math.round(metrics.dpo)} days`;

    // CCC
    const cccEl = document.getElementById('cccValue');
    cccEl.textContent = `${Math.round(metrics.ccc)} days`;

    const cccResult = document.getElementById('cccResult');
    let cccStatus = metrics.ccc > 45 ? 'danger' : metrics.ccc > 20 ? 'warning' : 'good';
    cccResult.className = `ccc-result ${cccStatus}`;

    // CCC insight is now generated in updateWCRTable() with industry-specific advice

    // Industry benchmark for DSO
    const bench = getDefaultBenchmarks(industry);
    renderBenchBar('benchDSO', 'Days Sales Outstanding', metrics.dso, bench.dso, ' days', false);

    // WCR table
    if (current) {
        updateWCRTable(current, metrics, bench, currency, industry);
    }

    // Interpretation from AI or generated
    const interpEl = document.getElementById('opInterpretation');
    if (interpEl) {
        if (analysis && analysis.cashCycleExplanation) {
            interpEl.innerHTML = `<p>${analysis.cashCycleExplanation}</p>`;
        } else {
            interpEl.innerHTML = '';
        }
    }
}

function updateWCRTable(current, metrics, bench, currency, industry) {
    const periodDays = 30;
    const revenue = current.revenue || 0;
    const cogs = current.cogs || 0;

    // Actuals
    const arActual = current.receivables || 0;
    const invActual = current.inventory || 0;
    const apActual = current.payables || 0;
    const wcrActual = arActual + invActual - apActual;

    // Industry targets using industry average days
    const arTarget = revenue > 0 ? (bench.dso.industry / periodDays) * revenue : 0;
    const invTarget = cogs > 0 ? (bench.dio.industry / periodDays) * cogs : 0;
    const apTarget = cogs > 0 ? (bench.dpo.industry / periodDays) * cogs : 0;
    const wcrIndustry = arTarget + invTarget - apTarget;

    // Variance
    const arVar = arActual - arTarget;
    const invVar = invActual - invTarget;
    const apVar = apActual - apTarget;
    const wcrVar = wcrActual - wcrIndustry;

    const fmtCell = (val) => `${currency} ${formatNumber(val)}`;
    const fmtVar = (val) => {
        const sign = val > 0 ? '+' : val < 0 ? '-' : '';
        const cls = val > 0 ? 'wcr-over' : val < 0 ? 'wcr-under' : '';
        return `<span class="${cls}">${sign} ${currency} ${formatNumber(Math.abs(val))}</span>`;
    };
    // For AP, positive variance is good (you're stretching payments)
    const fmtVarAP = (val) => {
        const sign = val > 0 ? '+' : val < 0 ? '-' : '';
        const cls = val > 0 ? 'wcr-under' : val < 0 ? 'wcr-over' : '';
        return `<span class="${cls}">${sign} ${currency} ${formatNumber(Math.abs(val))}</span>`;
    };

    // Populate table cells
    document.getElementById('wcrArActual').textContent = fmtCell(arActual);
    document.getElementById('wcrArIndustry').textContent = fmtCell(arTarget);
    document.getElementById('wcrArVariance').innerHTML = fmtVar(arVar);

    document.getElementById('wcrInvActual').textContent = fmtCell(invActual);
    document.getElementById('wcrInvIndustry').textContent = fmtCell(invTarget);
    document.getElementById('wcrInvVariance').innerHTML = fmtVar(invVar);

    document.getElementById('wcrApActual').textContent = fmtCell(apActual);
    document.getElementById('wcrApIndustry').textContent = fmtCell(apTarget);
    document.getElementById('wcrApVariance').innerHTML = fmtVarAP(apVar);

    document.getElementById('wcrTotalActual').textContent = fmtCell(wcrActual);
    document.getElementById('wcrTotalIndustry').textContent = fmtCell(wcrIndustry);
    document.getElementById('wcrTotalVariance').innerHTML = fmtVar(wcrVar);

    // Narrative with industry-specific advice
    const narrativeEl = document.getElementById('wcrNarrative');
    if (narrativeEl) {
        const ind = bench.name;
        let narrative = '';

        if (Math.abs(wcrVar) < 1) {
            narrative = 'Your working capital requirement is in line with industry averages.';
        } else if (wcrVar > 0) {
            narrative = `If you matched industry averages, you would free up ${currency} ${formatNumber(wcrVar)} in cash. `;
            // Find biggest driver and give specific advice
            const highAR = arVar > 0 && arVar >= invVar && arVar >= Math.abs(apVar);
            const highInv = invVar > 0 && invVar >= arVar && invVar >= Math.abs(apVar);
            const lowAP = apVar < 0 && Math.abs(apVar) >= arVar && Math.abs(apVar) >= invVar;

            if (highAR) {
                narrative += getARAdvice(ind);
            } else if (highInv) {
                narrative += getInventoryAdvice(ind);
            } else if (lowAP) {
                narrative += getAPAdvice(ind);
            }
        } else {
            narrative = `You are running ${currency} ${formatNumber(Math.abs(wcrVar))} leaner than the industry average — strong working capital management.`;
        }

        narrativeEl.textContent = narrative;
    }

    // CCC insight
    const ccc = metrics.ccc;
    const cccInsightEl = document.getElementById('opCashMovement');
    if (cccInsightEl) {
        let insight = '';
        if (ccc < 0) {
            insight = getCCCNegativeAdvice(bench.name);
        } else if (ccc > 90) {
            insight = `Your capital is locked up for ${Math.round(ccc)} days — this is critical. Consider invoice factoring to get 80-90% of your receivables in 24 hours. Halt non-essential purchasing and review slow-paying clients who are draining your liquidity.`;
        } else if (ccc > 60) {
            insight = getCCC60Advice(bench.name, ccc);
        } else if (ccc > 30) {
            insight = `Your cash cycle is ${Math.round(ccc)} days. You pay suppliers in ${Math.round(metrics.dpo)} days but wait ${Math.round(metrics.dso)} days to collect. That's ${Math.round(ccc)} days your money is stuck in operations.`;
        } else {
            insight = `Cash cycle is healthy at ${Math.round(ccc)} days. Money moves efficiently through your business.`;
        }
        cccInsightEl.innerHTML = `<p>${insight}</p>`;
    }
}

// ===== Industry-Specific Advice =====

function getARAdvice(industry) {
    const advice = {
        'Service': 'Require a 50% upfront deposit for new projects and transition to retainers paid on the 1st of the month.',
        'Wholesale': 'Offer a 2/10 Net 30 discount — the 2% cost is often cheaper than interest on a working capital loan.',
        'Construction': 'Standardize progress billings and aggressively follow up on retentions, which often get forgotten.',
        'Manufacturing': 'Implement credit limits for distributors who consistently exceed their payment terms.',
        'Retail': 'Audit your payment gateway — if funds take more than 3 days to reach your bank, switch providers.',
        'E-commerce': 'Audit your payment gateway — if funds take more than 3 days to reach your bank, switch providers.',
        'Restaurant': 'If you have B2B catering accounts, move them to automated credit card billing instead of manual invoicing.',
        'Product': 'Tighten your collections process — send reminders earlier and consider early payment discounts.'
    };
    return advice[industry] || 'Speed up collections by sending reminders earlier and offering small discounts for early payment.';
}

function getInventoryAdvice(industry) {
    const advice = {
        'Retail': 'Run a flash sale on old stock — holding stale items costs more in opportunity cost than the margin loss.',
        'E-commerce': 'Shift slow-movers to a just-in-time or print-on-demand model to reduce warehouse overhead.',
        'Manufacturing': 'Your work-in-progress is likely clogged. Streamline your production line to move units to finished goods faster.',
        'Wholesale': 'Use ABC analysis — stop over-ordering Category C items that only move once a quarter.',
        'Restaurant': 'Check for waste and portion control. High inventory in food usually means high spoilage and theft risk.',
        'Construction': 'Stop ordering materials for the whole project at once. Align material delivery with specific project phases.',
        'Product': 'Order smaller quantities more often. Dead stock on shelves is cash that could be in your bank.',
        'Service': 'As a service business, you should carry minimal inventory. Review what stock you are holding and why.'
    };
    return advice[industry] || 'Order smaller quantities more often to reduce the cash sitting idle on your shelves.';
}

function getAPAdvice(industry) {
    const advice = {
        'Construction': 'Align supplier payments to match your client milestone receipts — stop bridging the gap yourself.',
        'Retail': 'If you pay early for discounts, check if the discount rate beats your cost of capital. If not, stop.',
        'Product': 'If you pay early for discounts, check if the discount rate beats your cost of capital. If not, stop.'
    };
    return advice[industry] || 'Renegotiate for 30 or 45-day terms. Every day you delay payment is a 0% interest loan from your supplier.';
}

function getCCCNegativeAdvice(industry) {
    const advice = {
        'Restaurant': 'Your business is self-funding — you collect cash before paying suppliers. Use this surplus to reinvest in equipment or marketing rather than letting it sit idle.',
        'E-commerce': 'Negative cash cycle is a scaling green light — your sales fund your stock before you pay for it. But watch for supplier fragility if you stretch terms too hard.'
    };
    return advice[industry] || 'You collect money before you pay it out. This is ideal for growth — but watch supplier relationships if you stretch payment terms too aggressively.';
}

function getCCC60Advice(industry, ccc) {
    const advice = {
        'Manufacturing': `Your cash is locked for ${Math.round(ccc)} days — risk of overtrading. Secure a revolving credit line before accepting large new orders.`,
        'Service': `Cash cycle of ${Math.round(ccc)} days means unbilled revenue is too high. Shorten billing cycles from monthly to bi-weekly for large projects.`,
        'Wholesale': `At ${Math.round(ccc)} days, you are carrying the weight for your supply chain. Demand better terms from manufacturers to offset slow-paying retailers.`,
        'Construction': `${Math.round(ccc)}-day cycle is common in construction but dangerous. Ensure milestone billings are tied to actual costs to avoid funding the gap from your own cash.`
    };
    return advice[industry] || `Your cash is trapped in operations for ${Math.round(ccc)} days. Even if profitable, you risk a liquidity crunch if you grow too fast. Consider factoring invoices or negotiating longer supplier terms.`;
}

// ===== Section 4: Free Cash Flow =====

function updateFCF(current, previous, metrics, currency) {
    const netProfit = current.netProfit || 0;

    let receivablesChange = 0, inventoryChange = 0, payablesChange = 0;

    if (previous && previous.receivables !== undefined) {
        receivablesChange = (current.receivables || 0) - (previous.receivables || 0);
        inventoryChange = (current.inventory || 0) - (previous.inventory || 0);
        payablesChange = (current.payables || 0) - (previous.payables || 0);
    } else {
        const dailyRevenue = (current.revenue || 0) / 30;
        const dailyCOGS = (current.cogs || 0) / 30;
        if (metrics.dso > 30) receivablesChange = Math.round(dailyRevenue * (metrics.dso - 30) * 0.5);
        if (metrics.dio > 30) inventoryChange = Math.round(dailyCOGS * (metrics.dio - 30) * 0.3);
        if (metrics.dpo < 30) payablesChange = Math.round(dailyCOGS * (30 - metrics.dpo) * -0.3);
    }

    const wcChanges = receivablesChange + inventoryChange - payablesChange;
    const capex = current.assetPurchases || 0;
    const fcf = netProfit - wcChanges - capex;

    // Display
    const npEl = document.getElementById('fcfNetProfit');
    npEl.textContent = signedAmount(netProfit, currency);
    npEl.className = `fcf-value ${netProfit >= 0 ? 'positive' : 'negative'}`;

    const wcEl = document.getElementById('fcfWCChanges');
    wcEl.textContent = wcChanges >= 0 ? `- ${currency} ${formatNumber(wcChanges)}` : `+ ${currency} ${formatNumber(Math.abs(wcChanges))}`;
    wcEl.className = `fcf-value ${wcChanges >= 0 ? 'negative' : 'positive'}`;

    const capexEl = document.getElementById('fcfCapex');
    capexEl.textContent = capex > 0 ? `- ${currency} ${formatNumber(capex)}` : `${currency} 0`;
    capexEl.className = `fcf-value ${capex > 0 ? 'negative' : ''}`;

    const totalEl = document.getElementById('fcfTotal');
    totalEl.textContent = signedAmount(fcf, currency);
    totalEl.className = `fcf-value ${fcf >= 0 ? 'positive' : 'negative'}`;

    // Insight
    const insightEl = document.getElementById('fcfInsight');
    if (fcf > 0) {
        insightEl.innerHTML = `<p>Your business generated <strong>${currency} ${formatNumber(fcf)}</strong> in free cash flow. This is real cash available to pay down debt, distribute to owners, or reinvest.</p>`;
    } else if (fcf === 0) {
        insightEl.innerHTML = `<p>Free cash flow is zero. The business generates just enough cash to sustain operations. Growth will need external funding.</p>`;
    } else {
        insightEl.innerHTML = `<p>Your business consumed <strong>${currency} ${formatNumber(Math.abs(fcf))}</strong> more cash than it generated. This is funded from reserves.</p>`;
    }

    return fcf;
}

// ===== Section 5: FCFF / Cash After Debt =====

function updateFCFF(current, currency, fcfValue) {
    const section = document.getElementById('fcffSection');
    if (!section) return;

    const loanRepayments = current.loanRepayments || 0;

    if (loanRepayments <= 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    const surplus = fcfValue - loanRepayments;

    document.getElementById('fcffFCF').textContent = signedAmount(fcfValue, currency);
    document.getElementById('fcffFCF').className = `fcff-value ${fcfValue >= 0 ? 'positive' : 'negative'}`;

    document.getElementById('fcffLoanRepayments').textContent = `- ${currency} ${formatNumber(loanRepayments)}`;
    document.getElementById('fcffLoanRepayments').className = 'fcff-value negative';

    const surplusEl = document.getElementById('fcffSurplus');
    surplusEl.textContent = signedAmount(surplus, currency);
    surplusEl.className = `fcff-value ${surplus >= 0 ? 'positive' : 'negative'}`;

    const insightEl = document.getElementById('fcffInsight');
    if (surplus > 0) {
        const ratio = fcfValue / loanRepayments;
        if (ratio >= 2) {
            insightEl.innerHTML = `<p>Your business generates enough cash to comfortably cover interest and debt. Coverage ratio: <strong>${ratio.toFixed(1)}x</strong> — plenty of breathing room.</p>`;
        } else {
            insightEl.innerHTML = `<p>Debt is covered, but the buffer is thin at <strong>${ratio.toFixed(1)}x</strong>. A bad month could make this tight. Consider accelerating collections.</p>`;
        }
    } else {
        insightEl.innerHTML = `<p><strong>Debt is eating your cash.</strong> Free cash flow doesn't cover loan repayments. You're dipping into reserves by <strong>${currency} ${formatNumber(Math.abs(surplus))}</strong> per month. This is not sustainable.</p>`;
    }
}

// ===== Section 6: Cash Runway =====

function updateCashRunway(metrics, currency, current, industry) {
    const bigValueEl = document.getElementById('runwayBigValue');
    const methodEl = document.getElementById('runwayMethodDisplay');
    const cashoutEl = document.getElementById('runwayCashout');
    const driversEl = document.getElementById('runwayDrivers');
    const interpEl = document.getElementById('runwayInterpretation');

    const methodLabel = {
        'ytd': 'Based on YTD average burn',
        'monthly': 'Based on last month burn',
        'opex': 'Based on monthly expenses'
    }[metrics.runwayMethod] || 'Based on monthly expenses';

    if (metrics.cashRunway === -1) {
        bigValueEl.textContent = 'Cash positive';
        bigValueEl.className = 'runway-big-number good';
        methodEl.textContent = 'Your cash is growing, not burning';
        if (cashoutEl) cashoutEl.innerHTML = '';
        if (driversEl) driversEl.innerHTML = `<p>Cash balance: <strong>${currency} ${formatNumber(current.cash)}</strong> and increasing.</p>`;
        if (interpEl) interpEl.innerHTML = `<p>Your business generates more cash than it uses. This is the healthiest position.</p>`;
    } else if (metrics.cashRunway >= 6) {
        bigValueEl.textContent = `${metrics.cashRunway.toFixed(1)} months`;
        bigValueEl.className = 'runway-big-number good';
        methodEl.textContent = methodLabel;
        if (cashoutEl) cashoutEl.innerHTML = '';
        if (driversEl) driversEl.innerHTML = `<p>Cash balance: <strong>${currency} ${formatNumber(current.cash)}</strong>. Comfortable buffer for ${Math.floor(metrics.cashRunway)}+ months.</p>`;
        if (interpEl) interpEl.innerHTML = `<p>You have time to plan, invest, and weather surprises.</p>`;
    } else if (metrics.cashRunway >= 3) {
        bigValueEl.textContent = `${metrics.cashRunway.toFixed(1)} months`;
        bigValueEl.className = 'runway-big-number warning';
        methodEl.textContent = methodLabel;
        const cashOutDate = getCashOutDate(metrics.cashRunway);
        if (cashoutEl) cashoutEl.innerHTML = `<p class="cashout-date">Cash runs out around <strong>${cashOutDate}</strong></p>`;
        if (driversEl) driversEl.innerHTML = `<p>Cash balance: <strong>${currency} ${formatNumber(current.cash)}</strong>.</p>`;
        if (interpEl) interpEl.innerHTML = `<p>Not critical, but start improving cash flow. Collect faster, delay non-essential spending.</p>`;
    } else if (metrics.cashRunway >= 1) {
        bigValueEl.textContent = `${metrics.cashRunway.toFixed(1)} months`;
        bigValueEl.className = 'runway-big-number danger';
        methodEl.textContent = methodLabel;
        const cashOutDate = getCashOutDate(metrics.cashRunway);
        if (cashoutEl) cashoutEl.innerHTML = `<p class="cashout-date danger">Cash runs out around <strong>${cashOutDate}</strong></p>`;
        if (driversEl) driversEl.innerHTML = `<p>Cash balance: <strong>${currency} ${formatNumber(current.cash)}</strong>.</p>`;
        if (interpEl) interpEl.innerHTML = `<p><strong>Action needed.</strong> Collect receivables urgently, cut non-essential spending, consider short-term credit.</p>`;
    } else {
        bigValueEl.textContent = `${metrics.cashRunway.toFixed(1)} months`;
        bigValueEl.className = 'runway-big-number danger';
        methodEl.textContent = methodLabel;
        if (cashoutEl) cashoutEl.innerHTML = `<p class="cashout-date danger"><strong>Cash runway is critical.</strong></p>`;
        if (driversEl) driversEl.innerHTML = `<p>Cash balance: <strong>${currency} ${formatNumber(current.cash)}</strong>.</p>`;
        if (interpEl) interpEl.innerHTML = `<p><strong>Critical.</strong> Risk of bounced payments. Pause all non-essential payments, collect overdue receivables today, speak to your bank.</p>`;
    }

    // Industry benchmark for runway
    const runwayMonths = metrics.cashRunway === -1 ? 12 : metrics.cashRunway;
    renderBenchBar('benchRunway', 'Cash Runway', runwayMonths, { min: 3, max: 6, ideal: 6 }, ' months', true);
}

function getCashOutDate(months) {
    const date = new Date();
    date.setMonth(date.getMonth() + Math.floor(months));
    date.setDate(date.getDate() + Math.round((months % 1) * 30));
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

// ===== Section 7: Bank-Meeting Summary =====

function updateBankMeetingSummary(current, metrics, currency, analysis) {
    const quoteEl = document.getElementById('bankSummaryQuote');
    if (!quoteEl) return;

    if (analysis && analysis.meetingSummary) {
        quoteEl.textContent = `"${analysis.meetingSummary}"`;
        return;
    }

    // Build auto summary
    let sales = `Sales are ${currency} ${formatNumber(current.revenue)} this month`;
    if (metrics.revenueChange !== null) {
        sales = `Sales are ${metrics.revenueChange >= 0 ? 'up' : 'down'} ${Math.abs(metrics.revenueChange).toFixed(1)}% at ${currency} ${formatNumber(current.revenue)}`;
    }

    let profit = '';
    if (current.netProfit > 0) {
        profit = `, profitable with ${currency} ${formatNumber(current.netProfit)} net profit (${metrics.netMargin.toFixed(0)}% margin)`;
    } else if (current.netProfit === 0) {
        profit = `, breaking even`;
    } else {
        profit = `, with a loss of ${currency} ${formatNumber(Math.abs(current.netProfit))}`;
    }

    let cash = '';
    if (metrics.cashRunway === -1) {
        cash = `Cash position is strong and growing.`;
    } else if (metrics.cashRunway >= 3) {
        cash = `Cash runway is ${metrics.cashRunway.toFixed(1)} months.`;
    } else {
        cash = `Cash runway is tight at ${metrics.cashRunway.toFixed(1)} months. We have ${currency} ${formatNumber(current.receivables || 0)} in receivables to collect.`;
    }

    const cr = metrics.currentRatio >= 1.5 ? 'healthy' : 'adequate';
    const crVal = metrics.currentRatio.toFixed(2);

    quoteEl.textContent = `"${sales}${profit}. ${cash} Current ratio is ${cr} at ${crVal}."`;
}

// ===== Section 8: Weekly Actions =====

function updateWeeklyActions(current, metrics, currency, analysis) {
    const actionList = document.getElementById('actionList');
    if (!actionList) return;

    // Use AI actions if available
    if (analysis && analysis.action1Title) {
        const actions = [
            { title: analysis.action1Title, desc: analysis.action1Desc },
            { title: analysis.action2Title, desc: analysis.action2Desc },
            { title: analysis.action3Title, desc: analysis.action3Desc }
        ].filter(a => a.title && a.desc);

        actionList.innerHTML = actions.map((a, i) => actionCard(i + 1, a.title, a.desc, null)).join('');
        return;
    }

    // Auto-generate actions
    const actions = [];

    if (metrics.cashRunway >= 0 && metrics.cashRunway < 3) {
        const target = Math.round((current.receivables || 0) * 0.3);
        actions.push({
            title: `Collect ${currency} ${formatNumber(target)} from customers`,
            desc: `You have ${currency} ${formatNumber(current.receivables || 0)} in receivables. Call your top 3 customers and agree on payment dates this week.`,
            impact: target
        });
    } else if (metrics.dso > 30) {
        actions.push({
            title: 'Speed up customer payments',
            desc: `Customers take ${Math.round(metrics.dso)} days to pay. Send reminders earlier and offer small discounts for early payment.`,
            impact: Math.round((current.receivables || 0) * 0.15)
        });
    }

    if (metrics.dpo < 20) {
        actions.push({
            title: 'Ask suppliers for 30-day payment terms',
            desc: `You pay suppliers in ${Math.round(metrics.dpo)} days. Negotiating 30-day terms keeps cash in your account ${30 - Math.round(metrics.dpo)} days longer.`,
            impact: Math.round((current.payables || 0) * 0.1)
        });
    }

    if (metrics.grossMargin < 25 && actions.length < 3) {
        actions.push({
            title: 'Improve your gross margin',
            desc: `Gross margin is only ${metrics.grossMargin.toFixed(0)}%. Raise prices 5-10% or negotiate better supplier rates.`,
            impact: Math.round((current.revenue || 0) * 0.05)
        });
    }

    if (metrics.cashRunway >= 0 && metrics.cashRunway < 3 && actions.length < 3) {
        actions.push({
            title: 'Pause non-essential spending',
            desc: `With only ${metrics.cashRunway.toFixed(1)} months of cash, hold off on anything not critical until runway exceeds 3 months.`,
            impact: Math.round((current.opex || 0) * 0.1)
        });
    }

    if (actions.length < 3 && metrics.dio > 30) {
        actions.push({
            title: 'Reduce inventory levels',
            desc: `Stock sits for ${Math.round(metrics.dio)} days. Order smaller quantities more often.`,
            impact: Math.round((current.inventory || 0) * 0.2)
        });
    }

    // Ensure at least 3 actions
    if (actions.length < 3) {
        actions.push({
            title: 'Review operating expenses',
            desc: 'Look for subscriptions, services, or costs that can be renegotiated or eliminated.',
            impact: Math.round((current.opex || 0) * 0.05)
        });
    }

    actionList.innerHTML = actions.slice(0, 3).map((a, i) =>
        actionCard(i + 1, a.title, a.desc, a.impact ? `Cash impact: +${currency} ${formatNumber(a.impact)}` : null)
    ).join('');
}

function actionCard(num, title, desc, impact) {
    const impactBadge = impact ? `<span class="cash-impact-badge">${impact}</span>` : '';
    return `
        <div class="action-item priority-${num}">
            <div class="action-number">${num}</div>
            <div class="action-content">
                <h3>${title}${num === 1 ? impactBadge : ''}</h3>
                <p>${desc}</p>
            </div>
        </div>
    `;
}

// ===== Dropdown Toggle =====

function toggleDropdown(btn) {
    const dropdown = btn.closest('.dropdown');
    dropdown.classList.toggle('open');
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
    }
});

// ===== WhatsApp Share =====

function shareWhatsApp() {
    const companyName = document.getElementById('companyName').textContent || 'My Company';
    const period = document.getElementById('reportPeriod').textContent || '';
    const revenue = document.getElementById('plRevenue')?.textContent || '';
    const netIncome = document.getElementById('plNetIncome')?.textContent || '';
    const runway = document.getElementById('runwayBigValue')?.textContent || '';

    const message = `*${companyName} - ${period}*

Key Numbers:
- Revenue: ${revenue}
- Net Income: ${netIncome}
- Cash Runway: ${runway}

Generated by PlainFinancials
https://plainfinance.co`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
}

// ===== PDF Download =====

async function canDownloadPDF() {
    if (typeof getUserProfile !== 'function') return true;
    try {
        if (typeof canCreateReport === 'function') {
            const reportCheck = await canCreateReport();
            if (reportCheck.isAdmin) return true;
        }
        const { data: profile } = await getUserProfile();
        const plan = profile?.subscription_plan || 'free';
        return plan === 'owner' || plan === 'pro';
    } catch (e) {
        return true;
    }
}

async function downloadPDF() {
    const canDownload = await canDownloadPDF();
    if (!canDownload) {
        if (confirm('PDF downloads are available on Owner and Pro plans. Would you like to upgrade?')) {
            window.location.href = 'index.html#pricing';
        }
        return;
    }

    const reportContainer = document.querySelector('.report-container');
    const companyName = document.getElementById('companyName').textContent || 'Report';
    const period = document.getElementById('reportPeriod').textContent || '';
    const filename = `${companyName.replace(/\s+/g, '_')}_${period.replace(/\s+/g, '_')}.pdf`;

    document.body.classList.add('pdf-export-mode');

    const pdfCompanyName = document.getElementById('pdfCompanyName');
    const pdfPeriod = document.getElementById('pdfPeriod');
    const pdfDate = document.getElementById('pdfDate');
    if (pdfCompanyName) pdfCompanyName.textContent = companyName;
    if (pdfPeriod) pdfPeriod.textContent = period;
    if (pdfDate) pdfDate.textContent = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const options = {
        margin: [15, 15, 15, 15],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(options).from(reportContainer).save().then(() => {
        document.body.classList.remove('pdf-export-mode');
    });
}

async function downloadInvestorPDF() {
    const canDownload = await canDownloadPDF();
    if (!canDownload) {
        if (confirm('PDF downloads are available on Owner and Pro plans. Would you like to upgrade?')) {
            window.location.href = 'index.html#pricing';
        }
        return;
    }

    const storedReport = localStorage.getItem('plainfinance_report');
    if (!storedReport) { alert('Report data not found'); return; }

    const reportData = JSON.parse(storedReport);
    const currency = reportData.company?.currency || 'AED';
    const current = reportData.current || {};
    const metrics = reportData.metrics || {};

    document.getElementById('inv-company').textContent = reportData.company?.name || 'Company';
    const monthNames = ['January','February','March','April','May','June',
                       'July','August','September','October','November','December'];
    const period = reportData.company?.period;
    document.getElementById('inv-period').textContent = period ?
        `Financial Summary - ${monthNames[parseInt(period.month) - 1]} ${period.year}` : 'Financial Summary';
    document.getElementById('inv-date').textContent = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    document.getElementById('inv-revenue').textContent = `${currency} ${formatNumber(current.revenue)}`;
    const profitEl = document.getElementById('inv-profit');
    profitEl.textContent = `${currency} ${formatNumber(current.netProfit)}`;
    profitEl.style.color = current.netProfit >= 0 ? '#059669' : '#dc2626';
    document.getElementById('inv-cash').textContent = `${currency} ${formatNumber(current.cash)}`;
    document.getElementById('inv-runway').textContent = `${metrics.cashRunway || 0} mo`;

    document.getElementById('inv-gross-margin').textContent = `${metrics.grossMargin || 0}%`;
    document.getElementById('inv-net-margin').textContent = `${metrics.netMargin || 0}%`;
    document.getElementById('inv-opex').textContent = `${currency} ${formatNumber(current.opex)}`;

    document.getElementById('inv-current-ratio').textContent = `${metrics.currentRatio || 0}x`;
    document.getElementById('inv-receivables').textContent = `${currency} ${formatNumber(current.receivables)}`;
    document.getElementById('inv-payables').textContent = `${currency} ${formatNumber(current.payables)}`;

    document.getElementById('inv-dso').textContent = metrics.dso || 0;
    document.getElementById('inv-dio').textContent = metrics.dio || 0;
    document.getElementById('inv-dpo').textContent = metrics.dpo || 0;
    const cccEl = document.getElementById('inv-ccc');
    cccEl.textContent = metrics.ccc || 0;
    cccEl.style.color = metrics.ccc > 45 ? '#dc2626' : metrics.ccc > 20 ? '#d97706' : '#059669';

    const summaryText = document.getElementById('bankSummaryQuote')?.textContent ||
        `Revenue of ${currency} ${formatNumber(current.revenue)} with ${metrics.netMargin || 0}% net margin.`;
    document.getElementById('inv-summary').textContent = summaryText.replace(/^"|"$/g, '');

    const investorPage = document.getElementById('investorSummary');
    investorPage.style.display = 'block';
    investorPage.style.position = 'static';

    const companyName = reportData.company?.name || 'Report';
    const filename = `${companyName.replace(/\s+/g, '_')}_Executive_Summary.pdf`;

    html2pdf().set({
        margin: 0, filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(investorPage.querySelector('.investor-page')).save().then(() => {
        investorPage.style.display = 'none';
        investorPage.style.position = 'absolute';
    });
}

// ===== Email Modal =====

function openEmailModal() {
    document.getElementById('emailModal').classList.add('active');
    document.getElementById('emailAddress').focus();
    document.getElementById('emailStatus').textContent = '';
    document.getElementById('emailStatus').className = 'modal-status';
}

function closeEmailModal() {
    document.getElementById('emailModal').classList.remove('active');
}

// ===== Generate PDF as Base64 =====

async function generateReportPDFBase64() {
    const reportContainer = document.querySelector('.report-container');
    const companyName = document.getElementById('companyName').textContent || 'Report';
    const period = document.getElementById('reportPeriod').textContent || '';

    document.body.classList.add('pdf-export-mode');

    const pdfCompanyName = document.getElementById('pdfCompanyName');
    const pdfPeriod = document.getElementById('pdfPeriod');
    const pdfDate = document.getElementById('pdfDate');
    if (pdfCompanyName) pdfCompanyName.textContent = companyName;
    if (pdfPeriod) pdfPeriod.textContent = period;
    if (pdfDate) pdfDate.textContent = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const options = {
        margin: [15, 15, 15, 15],
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    const pdfBlob = await html2pdf().set(options).from(reportContainer).outputPdf('blob');
    document.body.classList.remove('pdf-export-mode');

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(pdfBlob);
    });
}

// ===== Send Report Email via Resend =====

async function sendEmail() {
    const emailInput = document.getElementById('emailAddress');
    const email = emailInput.value.trim();
    const statusEl = document.getElementById('emailStatus');
    const sendBtn = document.getElementById('sendEmailBtn');

    if (!email || !email.includes('@')) {
        statusEl.textContent = 'Please enter a valid email address';
        statusEl.className = 'modal-status error';
        return;
    }

    statusEl.textContent = 'Generating PDF and sending...';
    statusEl.className = 'modal-status loading';
    sendBtn.disabled = true;

    try {
        const companyName = document.getElementById('companyName').textContent || 'Your Company';
        const period = document.getElementById('reportPeriod').textContent || '';
        const pdfBase64 = await generateReportPDFBase64();

        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, pdfBase64, companyName, period })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            statusEl.textContent = 'Report sent! Check your inbox.';
            statusEl.className = 'modal-status success';
            setTimeout(() => { closeEmailModal(); emailInput.value = ''; }, 2000);
        } else {
            throw new Error(result.error || 'Failed to send');
        }
    } catch (error) {
        console.error('Email error:', error);
        statusEl.textContent = 'Failed to send. Please try again.';
        statusEl.className = 'modal-status error';
    } finally {
        sendBtn.disabled = false;
    }
}

// ===== Auto-send report email after analysis =====

async function autoSendReportEmail() {
    try {
        if (typeof getUser !== 'function') return;
        const user = await getUser();
        if (!user || !user.email) return;

        const companyName = document.getElementById('companyName').textContent || 'Your Company';
        const period = document.getElementById('reportPeriod').textContent || '';
        const pdfBase64 = await generateReportPDFBase64();

        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: user.email,
                pdfBase64,
                companyName,
                period
            })
        });

        if (response.ok) {
            showEmailToast('Report sent to your email');
        }
    } catch (error) {
        console.error('Auto-send email error:', error);
    }
}

function showEmailToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#1e3a5f;color:#fff;padding:12px 20px;border-radius:8px;font-size:14px;z-index:9999;opacity:0;transition:opacity 0.3s;';
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => { toast.style.opacity = '1'; });
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeEmailModal(); });
document.getElementById('emailModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'emailModal') closeEmailModal();
});

// ===== Blur Strategy (Disabled) =====

async function applyBlurStrategy() {
    removeBlurOverlays();
    return;
}

function removeBlurOverlays() {
    document.querySelectorAll('.blurred-section').forEach(el => el.classList.remove('blurred-section'));
    document.querySelectorAll('.peek-blurred').forEach(el => el.classList.remove('peek-blurred'));
    document.querySelectorAll('.blur-signup-overlay, .peek-blur-overlay').forEach(el => el.remove());
}
