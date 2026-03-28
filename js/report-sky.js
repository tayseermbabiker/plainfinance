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
    // TEMPORARILY DISABLED for testing — re-enable when going live
    // if (shouldAutoSend) {
    //     setTimeout(() => autoSendReportEmail(), 500);
    // }
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

// ===== View Mode Toggle =====

function setViewMode(mode) {
    document.getElementById('plain-mode').style.display = mode === 'plain' ? 'block' : 'none';
    document.getElementById('technical-mode').style.display = mode === 'technical' ? 'block' : 'none';
    document.querySelectorAll('.mode-btn, .toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.id === (mode === 'plain' ? 'btn-plain' : 'btn-tech') || btn.dataset.mode === mode);
    });
}

// ===== Owner Headline =====

function updateOwnerHeadline(current, metrics, currency) {
    const el = document.getElementById('ownerHeadline');
    const textEl = document.getElementById('ownerHeadlineText');
    if (!el || !textEl) return;

    const profitable = (current.netProfit || 0) > 0;
    const rawRunway = metrics.runwayMonths || metrics.cashRunway || 0;
    // -1 means cash is growing (infinite runway) — treat as best case
    const runwayMonths = rawRunway === -1 ? 999 : rawRunway;
    const cashPositive = rawRunway === -1;
    const cash = current.cash || 0;
    const revenue = current.revenue || 0;

    // Check for operational stress even when cash/profit look safe
    const hasOperationalStress = (metrics.netMargin < 5 && metrics.netMargin > 0)
        || metrics.ccc > 20
        || (metrics.grossMargin < 40 && metrics.grossMargin > 0);

    let headline = '';
    let tier = 'danger';

    if (profitable && cashPositive && !hasOperationalStress) {
        tier = 'safe';
        headline = `Good month. Your business is profitable and generating cash. You're in a strong position — focus on growth and reinvestment.`;
    } else if (profitable && cashPositive && hasOperationalStress) {
        tier = 'safe';
        headline = `Profitable and cash is growing, but watch your costs — margins are thin and some operational metrics need attention. Read the details below.`;
    } else if (profitable && runwayMonths >= 6 && !hasOperationalStress) {
        tier = 'safe';
        headline = `Good month. Your business is profitable and you have ${runwayMonths.toFixed(1)} months of cash runway. Keep doing what you're doing.`;
    } else if (profitable && runwayMonths >= 6 && hasOperationalStress) {
        tier = 'safe';
        headline = `Profitable with ${runwayMonths.toFixed(1)} months of runway, but margins are tight and some numbers need your attention. You have time to fix them.`;
    } else if (profitable && runwayMonths >= 3) {
        tier = 'safe';
        headline = `Profitable month, but cash runway is ${runwayMonths.toFixed(1)} months. You have time, but start tightening collections.`;
    } else if (profitable && runwayMonths >= 1) {
        tier = 'tight';
        headline = `You're making money, but cash is getting tight at ${runwayMonths.toFixed(1)} months of runway. Collect receivables faster and hold off on big expenses.`;
    } else if (profitable && runwayMonths < 1) {
        tier = 'tight';
        headline = `Profitable on paper, but almost no cash left. Your money is likely stuck in inventory or unpaid invoices. Read the cash section carefully.`;
    } else if (!profitable && runwayMonths >= 3) {
        tier = 'tight';
        headline = `You lost ${currency} ${formatNumber(Math.abs(current.netProfit))} this month, but you have ${runwayMonths.toFixed(1)} months of cash to work with. Focus on cutting costs or growing revenue.`;
    } else if (!profitable && runwayMonths >= 1) {
        tier = 'danger';
        headline = `Your business lost money this month and cash is running low. You have about ${runwayMonths.toFixed(1)} months before it runs out. Take action this week.`;
    } else {
        tier = 'danger';
        headline = `Your business made sales but ended the month losing money, and cash is critically low. Read this before anything else.`;
    }

    el.className = `headline ${tier === 'tight' ? 'warn' : tier}`;
    textEl.textContent = headline;

    // Set headline icon based on tier
    const iconEl = document.getElementById('headlineIcon');
    if (iconEl) {
        if (tier === 'safe') iconEl.textContent = '\u2705';
        else if (tier === 'tight') iconEl.textContent = '\u26A0\uFE0F';
        else iconEl.textContent = '\uD83D\uDD34';
    }
}

// ===== Top 5 Summary =====

// ===== COGS Label Mapping =====

const COGS_LABELS = {
    'food': 'Food & Beverage Cost', 'restaurant': 'Food & Beverage Cost',
    'product': 'Cost of Goods', 'retail': 'Cost of Goods',
    'online': 'Cost of Service', 'ecommerce': 'Product & Shipping Cost',
    'services': 'Direct Delivery Cost', 'service': 'Direct Delivery Cost',
    'construction': 'Project Costs',
    'manufacturing': 'Production Cost',
    'wholesale': 'Cost of Goods Purchased',
    'healthcare': 'Clinical / Treatment Cost',
    'other': 'Cost of Goods Sold'
};

const INDUSTRY_NAMES = {
    'food': 'Restaurant / Food', 'restaurant': 'Restaurant / Food',
    'product': 'Product / Retail', 'retail': 'Product / Retail',
    'online': 'SaaS / Digital', 'ecommerce': 'E-commerce',
    'services': 'Services / Consulting', 'service': 'Services / Consulting',
    'construction': 'Construction / Real Estate',
    'manufacturing': 'Manufacturing',
    'wholesale': 'Wholesale / Distribution',
    'healthcare': 'Healthcare / Wellness',
    'other': 'General Business'
};

// ===== 4 Pillars Grid =====

function updateFourPillars(current, metrics, currency, industry, previous) {
    const grid = document.getElementById('pillarsGrid');
    if (!grid) return;

    const prev = previous || {};
    const revenue = current.revenue || 0;
    const netProfit = current.netProfit || 0;
    const cash = current.cash || 0;
    const payables = current.payables || 0;
    const cogsPercent = revenue > 0 ? ((current.cogs || 0) / revenue * 100) : 0;
    const cashVsAP = payables > 0 ? cash / payables : (cash > 0 ? 999 : 0);
    const daysRevInBank = revenue > 0 ? cash / (revenue / 30) : 0;

    // Previous month values for trend arrows
    const prevRevenue = prev.revenue;
    const prevCash = prev.cash;
    const prevCogsPercent = prev.revenue > 0 && prev.cogs !== undefined ? (prev.cogs / prev.revenue * 100) : undefined;
    const prevNetMargin = prev.revenue > 0 && prev.netProfit !== undefined ? (prev.netProfit / prev.revenue * 100) : undefined;

    // Helpers for pillar construction
    const cashBadge = cashVsAP < 1 ? 'Critical' : daysRevInBank < 15 ? 'Low' : 'Adequate';
    const cashStatus = cashVsAP >= 1.5 ? 'good' : cashVsAP >= 1 ? 'warning' : 'danger';
    const cashInsight = cashVsAP < 1 ? 'You owe more than you have' : '';

    function pillarRevenue(sub) {
        return { label: 'Revenue', value: `${currency} ${formatNumber(revenue)}`, sub: sub || 'This month', status: 'neutral', badge: revenue > 0 ? 'Active' : 'No Sales', insight: '', currNumeric: revenue, prevValue: prevRevenue };
    }
    function pillarCash() {
        return { label: 'Cash in Bank', value: `${currency} ${formatNumber(cash)}`, sub: `You owe suppliers ${currency} ${formatNumber(payables)}`, status: cashStatus, badge: cashBadge, insight: cashInsight, currNumeric: cash, prevValue: prevCash };
    }
    function pillarBottomLine(goodThresh, warnThresh) {
        const g = goodThresh || 5, w = warnThresh || 0;
        return { label: 'Net Margin', value: `${metrics.netMargin.toFixed(1)}%`, sub: `${currency} ${formatNumber(Math.abs(netProfit))} ${netProfit >= 0 ? 'profit' : 'loss'}`, status: metrics.netMargin >= g ? 'good' : metrics.netMargin >= w ? 'warning' : 'danger', badge: metrics.netMargin >= g ? 'Healthy' : metrics.netMargin >= 0 ? 'Thin' : 'Loss', insight: '', currNumeric: metrics.netMargin, prevValue: prevNetMargin };
    }
    function pillarKeyCost(label, healthyMax, warnMax) {
        const s = cogsPercent <= healthyMax ? 'good' : cogsPercent <= warnMax ? 'warning' : 'danger';
        const b = cogsPercent <= healthyMax ? 'On Target' : cogsPercent <= warnMax ? 'High' : 'Too High';
        const ins = cogsPercent > healthyMax ? `Every 1% reduction adds ${currency} ${formatNumber(revenue * 0.01)}/month` : '';
        return { label, value: `${cogsPercent.toFixed(0)}%`, sub: `Target: under ${healthyMax}%`, status: s, badge: b, insight: ins, currNumeric: cogsPercent, prevValue: prevCogsPercent };
    }

    // Spec v2: P1=Revenue, P2=Key Cost Metric, P3=Cash Position, P4=Bottom Line
    const configs = {
        'food': [
            pillarRevenue('This month\'s sales'),
            pillarKeyCost('Food Cost %', 32, 36),
            pillarCash(),
            pillarBottomLine(6, 3)
        ],
        'product': [
            pillarRevenue(),
            pillarKeyCost('COGS %', 45, 55),
            pillarCash(),
            pillarBottomLine(5, 2)
        ],
        'online': [
            pillarRevenue(),
            pillarKeyCost('Cost of Service %', 30, 40),
            pillarCash(),
            pillarBottomLine(10, 5)
        ],
        'services': [
            pillarRevenue(),
            pillarKeyCost('Direct Cost %', 50, 65),
            pillarCash(),
            pillarBottomLine(10, 5)
        ],
        'construction': [
            pillarRevenue('Billed this month'),
            pillarKeyCost('Project Cost %', 80, 85),
            pillarCash(),
            pillarBottomLine(5, 3)
        ],
        'manufacturing': [
            pillarRevenue(),
            pillarKeyCost('Production Cost %', 70, 80),
            pillarCash(),
            pillarBottomLine(5, 3)
        ],
        'healthcare': [
            pillarRevenue(),
            pillarKeyCost('Clinical Cost %', 60, 75),
            pillarCash(),
            pillarBottomLine(10, 5)
        ],
        'other': [
            pillarRevenue(),
            pillarKeyCost('COGS %', 60, 75),
            pillarCash(),
            pillarBottomLine(5, 2)
        ]
    };

    const ind = industry?.toLowerCase();
    const aliases = { 'restaurant': 'food', 'service': 'services', 'ecommerce': 'online', 'retail': 'product', 'wholesale': 'product' };
    const key = aliases[ind] || ind;
    const config = configs[key] || configs['other'];

    // Set pillars hint
    const hintEl = document.getElementById('pillarsHint');
    if (hintEl) hintEl.textContent = 'Revenue, key cost, cash, and bottom line at a glance';

    config.forEach((p, i) => {
        const idx = i + 1;
        const card = document.getElementById(`pillar${idx}`);
        if (!card) return;

        card.className = `pillar pillar-${p.status}`;
        document.getElementById(`pillar${idx}Label`).textContent = p.label;
        document.getElementById(`pillar${idx}Value`).textContent = p.value;

        const subEl = document.getElementById(`pillar${idx}Sub`);
        if (subEl) subEl.textContent = p.sub || '';

        const badgeEl = document.getElementById(`pillar${idx}Badge`);
        if (badgeEl) {
            if (p.badge) {
                badgeEl.textContent = p.badge;
                badgeEl.className = `pillar-badge badge-${p.status === 'neutral' ? 'neutral' : p.status}`;
            } else {
                badgeEl.textContent = '';
                badgeEl.className = 'pillar-badge';
            }
        }

        const insightEl = document.getElementById(`pillar${idx}Insight`);
        if (insightEl) insightEl.textContent = p.insight || '';

        // Trend arrow (if previous month data available for this pillar)
        const arrowEl = document.getElementById(`pillar${idx}Arrow`);
        if (arrowEl && p.prevValue !== undefined && p.currNumeric !== undefined) {
            const change = p.prevValue !== 0 ? ((p.currNumeric - p.prevValue) / Math.abs(p.prevValue)) * 100 : 0;
            if (Math.abs(change) < 1) {
                arrowEl.className = 'pillar-arrow arrow-flat';
                arrowEl.textContent = '\u2192 0%';
            } else if (change > 0) {
                arrowEl.className = 'pillar-arrow arrow-up';
                arrowEl.textContent = `\u2191 +${Math.round(change)}%`;
            } else {
                arrowEl.className = 'pillar-arrow arrow-down';
                arrowEl.textContent = `\u2193 ${Math.round(change)}%`;
            }
        } else if (arrowEl) {
            arrowEl.textContent = '';
            arrowEl.className = 'pillar-arrow';
        }
    });
}

// ===== Cash Bridge =====

function updateCashBridge(current, previous, metrics, currency, ytd, industry, company) {
    const bridgeSection = document.getElementById('cashBridgeSection');
    const driversSection = document.getElementById('cashDriversSection');
    if (!bridgeSection) return;

    const hasPrevious = previous && previous.cash !== undefined;
    const reportMonth = company?.period?.month ? parseInt(company.period.month) : 0;

    // Determine starting cash:
    // 1. Previous month cash (best — bridge spans 1 month)
    // 2. Opening cash / YTD starting cash (spans multiple months — hint adjusts)
    let startCash = 0;
    let bridgeSpan = 'month';
    if (hasPrevious && previous.cash > 0) {
        startCash = previous.cash;
    } else {
        startCash = current.openingCash || (ytd && ytd.startingCash) || metrics?.openingCash || 0;
        if (startCash > 0 && reportMonth > 1) bridgeSpan = 'ytd';
    }

    // Update hint based on span
    const hintEl = document.getElementById('bridgeHint');
    if (hintEl) hintEl.textContent = bridgeSpan === 'ytd' ? 'January to end of month (year to date)' : 'Start to end of month';

    const endCash = current.cash || 0;
    const hasPrevWC = previous && previous.receivables !== undefined;

    // If no starting cash → show Cash Drivers fallback instead
    if (startCash === 0) {
        bridgeSection.style.display = 'none';
        showCashDriversFallback(current, currency, industry);
        return;
    }

    bridgeSection.style.display = 'block';
    if (driversSection) driversSection.style.display = 'none';

    const profit = current.netProfit || 0;
    const arChange = hasPrevWC ? ((current.receivables || 0) - (previous.receivables || 0)) : 0;
    const invChange = hasPrevWC ? ((current.inventory || 0) - (previous.inventory || 0)) : 0;
    const apChange = hasPrevWC ? ((current.payables || 0) - (previous.payables || 0)) : 0;
    const loanRepay = current.loanRepayments || 0;
    const drawings = current.ownerDrawings || 0;
    const capex = current.assetPurchases || 0;
    const taxCollected = current.vatCollected || 0;
    const taxPaid = current.vatPaid || 0;
    const taxNet = taxCollected - taxPaid;
    const revenue = current.revenue || 0;

    // Industry-specific labels for AR and Inventory
    const arLabels = {
        'food': 'Receivables change<small>Tabs and catering invoices</small>',
        'restaurant': 'Receivables change<small>Tabs and catering invoices</small>',
        'product': 'Receivables change<small>Customers still owe you</small>',
        'retail': 'Receivables change<small>Customers still owe you</small>',
        'online': 'Subscription receivables<small>Unpaid subscriptions</small>',
        'ecommerce': 'Receivables change<small>Customers still owe you</small>',
        'services': 'Unpaid invoices<small>Clients still owe you</small>',
        'service': 'Unpaid invoices<small>Clients still owe you</small>',
        'construction': 'Progress billings<small>Retention and milestone payments</small>',
        'manufacturing': 'Receivables change<small>Customers still owe you</small>',
        'healthcare': 'Patient/insurer receivables<small>Unpaid claims and bills</small>',
        'other': 'Receivables change<small>Customers still owe you</small>'
    };
    const invLabels = {
        'food': 'Food & beverage stock<small>Perishable inventory</small>',
        'restaurant': 'Food & beverage stock<small>Perishable inventory</small>',
        'product': 'Inventory change<small>Stock sitting in storage</small>',
        'retail': 'Inventory change<small>Stock sitting in storage</small>',
        'online': '', // hidden
        'ecommerce': 'Inventory change<small>Stock in warehouse</small>',
        'services': '', // hidden
        'service': '', // hidden
        'construction': 'Work in progress<small>Materials on site</small>',
        'manufacturing': 'Materials & WIP<small>Raw materials and work in progress</small>',
        'healthcare': 'Medical supplies<small>Consumables and stock</small>',
        'other': 'Inventory change<small>Stock sitting in storage</small>'
    };

    const ind = industry?.toLowerCase() || 'other';
    const arLabelEl = document.getElementById('bridgeARLabel');
    if (arLabelEl) arLabelEl.innerHTML = arLabels[ind] || arLabels['other'];
    const invLabelEl = document.getElementById('bridgeInvLabel');
    if (invLabelEl) invLabelEl.innerHTML = invLabels[ind] || invLabels['other'];

    // Populate bridge values
    document.getElementById('bridgeStartCash').textContent = `${currency} ${formatNumber(startCash)}`;
    document.getElementById('bridgeProfit').textContent = profit >= 0 ? `+ ${currency} ${formatNumber(profit)}` : `- ${currency} ${formatNumber(Math.abs(profit))}`;

    // Collect all absolute values for bar width calculation
    const allVals = [Math.abs(profit), Math.abs(arChange), Math.abs(invChange), Math.abs(apChange), Math.abs(taxNet), Math.abs(loanRepay), Math.abs(drawings), Math.abs(capex)];
    const maxVal = Math.max(...allVals.filter(v => v > 0)) || 1;

    function setBar(barId, val) {
        const bar = document.getElementById(barId);
        if (bar) bar.style.width = `${(Math.abs(val) / maxVal) * 100}%`;
    }

    // Profit bar
    setBar('bridgeProfitBar', profit);

    // Helper to show/hide a WC row
    function showWCRow(rowId, valId, barId, change, isInverse) {
        const row = document.getElementById(rowId);
        const valEl = document.getElementById(valId);
        if (!row) return;
        // For inventory rows in service/SaaS industries, hide entirely (they don't carry stock)
        if (rowId === 'bridgeInvRow' && ['online', 'services', 'service'].includes(ind)) {
            row.style.display = 'none';
            return;
        }
        if (change !== 0) {
            row.style.display = '';
            const isPos = isInverse ? change > 0 : change < 0;
            valEl.textContent = isPos ? `+ ${currency} ${formatNumber(Math.abs(change))}` : `- ${currency} ${formatNumber(Math.abs(change))}`;
            valEl.className = isPos ? 'b-val pos' : 'b-val neg';
            setBar(barId, change);
        } else {
            row.style.display = 'none';
        }
    }

    // AR change (increase = cash drain)
    showWCRow('bridgeARRow', 'bridgeAR', 'bridgeARBar', arChange, false);
    // Inventory change (increase = cash drain)
    showWCRow('bridgeInvRow', 'bridgeInventory', 'bridgeInvBar', invChange, false);
    // AP change (increase = cash saved)
    showWCRow('bridgeAPRow', 'bridgeAP', 'bridgeAPBar', apChange, true);

    // Tax row — show when tax data exists
    const taxRow = document.getElementById('bridgeTaxRow');
    if (taxNet > 0 && taxRow) {
        taxRow.style.display = '';
        document.getElementById('bridgeTax').textContent = `- ${currency} ${formatNumber(taxNet)}`;
        setBar('bridgeTaxBar', taxNet);
    } else if (taxRow) {
        taxRow.style.display = 'none';
    }

    // Outflow rows
    function showOutflow(rowId, valId, barId, val) {
        const row = document.getElementById(rowId);
        if (val > 0 && row) {
            row.style.display = '';
            document.getElementById(valId).textContent = `- ${currency} ${formatNumber(val)}`;
            setBar(barId, val);
        } else if (row) {
            row.style.display = 'none';
        }
    }

    showOutflow('bridgeLoanRow', 'bridgeLoanRepay', 'bridgeLoanBar', loanRepay);
    showOutflow('bridgeDrawingsRow', 'bridgeDrawings', 'bridgeDrawingsBar', drawings);
    showOutflow('bridgeCapexRow', 'bridgeCapex', 'bridgeCapexBar', capex);

    document.getElementById('bridgeEndCash').textContent = `${currency} ${formatNumber(endCash)}`;

    // Gap note — threshold scales with revenue: max(1% of revenue, 250)
    const calculated = startCash + profit - arChange - invChange + apChange - taxNet - loanRepay - drawings - capex;
    const gap = endCash - calculated;
    const gapThreshold = Math.max(revenue * 0.01, 250);
    const gapNote = document.getElementById('bridgeGapNote');
    if (gapNote && Math.abs(gap) > gapThreshold) {
        gapNote.textContent = `Note: ${currency} ${formatNumber(Math.abs(gap))} difference between calculated and actual ending cash. Common causes: sales tax remittance, loan interest, payroll timing, bank fees, or items not captured in this report.`;
    } else if (gapNote) {
        gapNote.textContent = '';
    }

    // Tax warning note — when tax collected but bridge doesn't fully account for it
    const taxNote = document.getElementById('bridgeTaxNote');
    if (taxNote && taxCollected > 0 && taxPaid === 0) {
        const usableCash = endCash - taxCollected;
        taxNote.style.display = '';
        taxNote.textContent = `You collected ${currency} ${formatNumber(taxCollected)} in sales tax. This is not your money — your usable cash is approximately ${currency} ${formatNumber(Math.max(usableCash, 0))}.`;
    } else if (taxNote) {
        taxNote.style.display = 'none';
    }

    // Summary sentence — find biggest cash drain and make it actionable
    const summaryEl = document.getElementById('bridgeSummary');
    if (summaryEl) {
        const drains = [];
        if (arChange > 0) drains.push({ label: 'unpaid customer invoices', val: arChange, fix: `Collecting half would add ${currency} ${formatNumber(Math.round(arChange / 2))} to your bank.` });
        if (invChange > 0) drains.push({ label: 'inventory purchases', val: invChange, fix: `Reducing stock orders could free up ${currency} ${formatNumber(Math.round(invChange * 0.5))}.` });
        if (apChange < 0) drains.push({ label: 'paying down suppliers', val: Math.abs(apChange), fix: `Stretching payment terms would keep more cash in the business.` });
        if (drawings > 0) drains.push({ label: 'owner drawings', val: drawings, fix: '' });
        if (loanRepay > 0) drains.push({ label: 'loan repayments', val: loanRepay, fix: '' });
        if (capex > 0) drains.push({ label: 'asset purchases', val: capex, fix: '' });
        if (profit < 0) drains.push({ label: 'the operating loss', val: Math.abs(profit), fix: 'Focus on revenue growth or cost reduction.' });

        if (drains.length > 0) {
            drains.sort((a, b) => b.val - a.val);
            const top = drains[0];
            summaryEl.textContent = `Your biggest cash drain this month was ${top.label} (${currency} ${formatNumber(top.val)}). ${top.fix}`;
        } else {
            summaryEl.textContent = '';
        }
    }

    // KPIs — cash conversion and WC absorption
    // Only show when bridge spans 1 month (previous month data). YTD bridges mix timeframes.
    const kpiSection = document.getElementById('bridgeKPIs');
    if (kpiSection && profit !== 0 && bridgeSpan === 'month') {
        const cashChange = endCash - startCash;
        const wcChange = arChange + invChange - apChange;
        const cashConversion = Math.round((cashChange / profit) * 100);
        const wcAbsorption = Math.round((wcChange / Math.abs(profit)) * 100);

        const ccEl = document.getElementById('kpiCashConversion');
        const wcEl = document.getElementById('kpiWCAbsorption');

        if (ccEl) {
            if (profit > 0) {
                ccEl.textContent = `${cashConversion}% of profit became cash`;
                ccEl.className = `bridge-kpi-value ${cashConversion >= 80 ? 'kpi-good' : cashConversion >= 50 ? 'kpi-warn' : 'kpi-danger'}`;
            } else {
                ccEl.textContent = 'N/A (loss)';
                ccEl.className = 'bridge-kpi-value';
            }
        }
        if (wcEl && hasPrevWC) {
            if (profit <= 0) {
                // Don't show % of profit when there's no profit
                if (wcChange > 0) {
                    wcEl.textContent = `Working capital drained ${currency} ${formatNumber(wcChange)}`;
                    wcEl.className = 'bridge-kpi-value kpi-danger';
                } else if (wcChange < 0) {
                    wcEl.textContent = `Working capital released ${currency} ${formatNumber(Math.abs(wcChange))}`;
                    wcEl.className = 'bridge-kpi-value kpi-good';
                } else {
                    wcEl.textContent = 'No working capital movement';
                    wcEl.className = 'bridge-kpi-value';
                }
            } else if (wcChange > 0) {
                wcEl.textContent = `Working capital absorbed ${wcAbsorption}% of profit`;
                wcEl.className = `bridge-kpi-value ${wcAbsorption <= 30 ? 'kpi-good' : wcAbsorption <= 70 ? 'kpi-warn' : 'kpi-danger'}`;
            } else {
                wcEl.textContent = `Working capital released ${currency} ${formatNumber(Math.abs(wcChange))}`;
                wcEl.className = 'bridge-kpi-value kpi-good';
            }
        } else if (wcEl) {
            wcEl.textContent = 'Need previous month data';
            wcEl.className = 'bridge-kpi-value';
        }

        kpiSection.style.display = '';
    } else if (kpiSection) {
        kpiSection.style.display = 'none';
    }
}

// ===== Cash Drivers Fallback =====

function showCashDriversFallback(current, currency, industry) {
    const section = document.getElementById('cashDriversSection');
    const list = document.getElementById('cashDriversList');
    if (!section || !list) return;

    const ar = current.receivables || 0;
    const inv = current.inventory || 0;
    const ap = current.payables || 0;
    const cash = current.cash || 0;
    const ind = industry?.toLowerCase() || 'other';

    // Hide if no meaningful balance sheet data
    if (ar === 0 && inv === 0 && ap === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';

    const hideInv = ['online', 'services', 'service'].includes(ind);
    const arLabel = { 'services': 'Unpaid client invoices', 'service': 'Unpaid client invoices', 'construction': 'Progress billings owed', 'healthcare': 'Patient/insurer receivables' }[ind] || 'Accounts Receivable';
    const invLabel = { 'food': 'Food & beverage stock', 'restaurant': 'Food & beverage stock', 'construction': 'Work in progress', 'manufacturing': 'Materials & WIP', 'healthcare': 'Medical supplies' }[ind] || 'Inventory';

    let html = `
        <div class="driver-row"><span class="driver-label">Cash in Bank</span><span class="driver-value">${currency} ${formatNumber(cash)}</span></div>
        <div class="driver-row"><span class="driver-label">${arLabel}</span><span class="driver-value">${currency} ${formatNumber(ar)}</span><small>Customers owe you this</small></div>
    `;
    if (!hideInv && inv > 0) {
        html += `<div class="driver-row"><span class="driver-label">${invLabel}</span><span class="driver-value">${currency} ${formatNumber(inv)}</span><small>Cash tied up in stock</small></div>`;
    }
    html += `<div class="driver-row"><span class="driver-label">Accounts Payable</span><span class="driver-value">${currency} ${formatNumber(ap)}</span><small>You owe suppliers this</small></div>`;

    list.innerHTML = html;
}

// ===== Investigation Points =====

function updateInvestigationSection(industry) {
    const section = document.getElementById('investigationSection');
    const list = document.getElementById('investigationList');
    if (!section || !list) return;

    const isHealthy = globalTier === 'safe';

    // Healthy = optimization/growth focus. Danger = survival/cash protection focus.
    const factors = {
        'food': isHealthy ? [
            { question: 'Which menu items generate the highest margin?', why: 'Double down on what works — promote high-margin dishes more prominently.' },
            { question: 'Can you negotiate better prices with your top 3 suppliers?', why: 'Even 2-3% savings on food costs goes straight to your bottom line.' },
            { question: 'Is your average check size growing?', why: 'Upselling and menu engineering can increase revenue without more customers.' },
            { question: 'Are you tracking food waste weekly?', why: 'Even well-run kitchens can save 2-5% by tightening waste controls.' }
        ] : [
            { question: 'Food waste percentage (target: under 5%)', why: 'High waste directly erodes your gross margin — fix this first.' },
            { question: 'Portion control adherence in the kitchen', why: 'Inconsistent portions are the hidden cause of food cost overruns.' },
            { question: 'Which menu items lose money?', why: 'Remove or reprice unprofitable items immediately.' },
            { question: 'Can you renegotiate supplier terms this week?', why: 'Extending payment terms keeps cash in your account longer.' }
        ],
        'product': isHealthy ? [
            { question: 'Which product categories have the highest margins?', why: 'Focus marketing and shelf space on your most profitable items.' },
            { question: 'Can you negotiate volume discounts with suppliers?', why: 'Strong cash position gives you leverage to buy better.' },
            { question: 'What is your sell-through rate by category?', why: 'High sell-through = efficient inventory. Low = cash trapped in stock.' },
            { question: 'Are there pricing tiers you haven\'t tested?', why: 'Premium and bundle pricing can lift margins without losing customers.' }
        ] : [
            { question: 'Shrinkage rate (target: under 2%)', why: 'Shrinkage from theft, damage, or miscounts silently kills margins.' },
            { question: 'Which products are sitting longest?', why: 'Clear slow-movers immediately — dead stock is cash you can\'t use.' },
            { question: 'Return rate by product line', why: 'High returns erode revenue — find and fix the root cause.' },
            { question: 'Can you cut any standing orders this week?', why: 'Stop automatic reorders on items that aren\'t selling.' }
        ],
        'online': isHealthy ? [
            { question: 'What is your LTV/CAC ratio? (target: 3x+)', why: 'This tells you if your growth is sustainable and profitable.' },
            { question: 'Which acquisition channels have the lowest CAC?', why: 'Shift budget to what works — cut what doesn\'t.' },
            { question: 'Monthly churn rate (target: under 5%)', why: 'Reducing churn is often cheaper than acquiring new customers.' },
            { question: 'Can you increase prices without losing customers?', why: 'SaaS businesses often underprice — test a 10% increase on new signups.' }
        ] : [
            { question: 'Monthly churn rate — is it accelerating?', why: 'Rising churn in a cash-tight situation is an emergency.' },
            { question: 'Which customers are most likely to cancel?', why: 'Proactive outreach can save accounts before they leave.' },
            { question: 'Can you cut any tools or services this week?', why: 'Every subscription you cancel extends your runway.' },
            { question: 'Are there invoices you can collect faster?', why: 'Switch annual clients to monthly prepay if possible.' }
        ],
        'services': isHealthy ? [
            { question: 'Team utilization rate (target: 65%+)', why: 'Higher utilization = more revenue from the same payroll.' },
            { question: 'Client concentration — is any client over 30% of revenue?', why: 'Diversifying reduces risk of a sudden revenue drop.' },
            { question: 'Are you billing for all the work you do?', why: 'Scope creep and unbilled hours are hidden margin killers.' },
            { question: 'Can you raise rates on your next contract renewal?', why: 'Strong performance gives you pricing leverage.' }
        ] : [
            { question: 'Which clients are paying slowest?', why: 'Chase overdue invoices — this is your most immediate cash source.' },
            { question: 'Can you bill weekly instead of monthly?', why: 'Shorter billing cycles get cash in faster.' },
            { question: 'Are there projects losing money?', why: 'Stop bleeding on unprofitable work — renegotiate or exit.' },
            { question: 'Can you reduce contractor spend this month?', why: 'Cut variable costs before fixed costs.' }
        ],
        'construction': isHealthy ? [
            { question: 'Retention amounts held by clients', why: 'Retentions are real money owed to you — follow up on completed projects.' },
            { question: 'Variation/change order capture rate', why: 'Uncaptured variations mean extra work for free.' },
            { question: 'Can you negotiate better subcontractor rates?', why: 'Strong pipeline gives you leverage on pricing.' },
            { question: 'Are your project estimates accurate vs actuals?', why: 'Accurate estimates prevent margin surprises.' }
        ] : [
            { question: 'Outstanding progress billings — who owes you?', why: 'This is your fastest path to cash. Chase it today.' },
            { question: 'Can you pause material orders on non-urgent projects?', why: 'Stop buying ahead — align purchases with project milestones.' },
            { question: 'Are any projects over budget?', why: 'Identify and contain losses before they spread.' },
            { question: 'Can you demand deposits on new work?', why: 'Never start a project without upfront payment.' }
        ],
        'manufacturing': isHealthy ? [
            { question: 'Yield rate (target: 95%+)', why: 'Higher yield = less material waste = better margins.' },
            { question: 'Can you reduce batch sizes?', why: 'Smaller batches reduce WIP and free up cash.' },
            { question: 'Machine utilization rate', why: 'Idle capacity is a fixed cost you\'re already paying for.' },
            { question: 'Are your BOMs accurate vs actual costs?', why: 'Inaccurate BOMs lead to wrong pricing decisions.' }
        ] : [
            { question: 'Scrap/waste rate — is it above 2%?', why: 'Every % of scrap directly increases your COGS.' },
            { question: 'Can you delay non-urgent production runs?', why: 'Reduce WIP and free up cash for essentials.' },
            { question: 'Which raw materials can you source cheaper?', why: 'Renegotiate with suppliers or find alternatives.' },
            { question: 'Are there finished goods you can sell at a discount?', why: 'Cash from discounted stock is better than cash locked in warehouse.' }
        ],
        'healthcare': isHealthy ? [
            { question: 'Provider utilization rate (target: 70%+)', why: 'Empty appointment slots are revenue that can never be recovered.' },
            { question: 'Revenue per patient visit — is it growing?', why: 'Higher revenue per visit means more efficient operations.' },
            { question: 'Insurance claim denial rate', why: 'Even small improvements in claim accuracy add up quickly.' },
            { question: 'Can you add ancillary services?', why: 'Supplements, cosmetics, or wellness programs boost margins.' }
        ] : [
            { question: 'Claim denial rate — how much revenue are you losing?', why: 'Fix denied claims immediately — this is revenue you already earned.' },
            { question: 'Which payers are slowest to reimburse?', why: 'Follow up aggressively on outstanding claims.' },
            { question: 'Can you reduce supply costs this month?', why: 'Switch to generics or negotiate bulk pricing with distributors.' },
            { question: 'Are there underperforming service lines?', why: 'Cut or restructure services that cost more than they earn.' }
        ],
        'other': isHealthy ? [
            { question: 'Customer concentration — is any client over 30% of revenue?', why: 'Diversifying reduces risk of a sudden revenue drop.' },
            { question: 'Revenue per employee', why: 'A key productivity metric — are you getting enough value from your team?' },
            { question: 'Repeat purchase / retention rate', why: 'Retaining customers is far cheaper than acquiring new ones.' },
            { question: 'Are there expenses you can renegotiate?', why: 'Review contracts annually — vendors often offer better rates if you ask.' }
        ] : [
            { question: 'Who owes you money right now?', why: 'Make a list and start calling — receivables are your fastest cash source.' },
            { question: 'Which expenses can you cut this week?', why: 'Cancel anything non-essential until cash improves.' },
            { question: 'Can you offer discounts for early payment?', why: '2% off beats waiting 60 days for full payment.' },
            { question: 'Are you tracking cash daily?', why: 'In tight times, check your bank balance every morning.' }
        ]
    };

    const ind = industry?.toLowerCase();
    const aliases = { 'restaurant': 'food', 'service': 'services', 'ecommerce': 'online', 'retail': 'product' };
    const key = aliases[ind] || ind;
    const items = factors[key] || factors['other'];

    section.style.display = 'block';
    list.innerHTML = items.map(item => `
        <li class="nf-item">
            <div class="nf-body">
                <div class="nf-question">${item.question}</div>
                <div class="nf-why">${item.why}</div>
            </div>
        </li>
    `).join('');
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
        updateOwnerHeadline(current, metrics, currency);
        updateFourPillars(current, metrics, currency, industry, previous);
        updateStatusBadge(metrics);
        updateMiniPL(current, metrics, currency, industry);
        updateProfitInterpretation(current, metrics, currency, analysis, industry);
        updateOperationalHealth(metrics, currency, analysis, industry, current, reportData.ytd);
        const fcfValue = updateFCF(current, previous, metrics, currency);
        updateCashBridge(current, previous, metrics, currency, reportData.ytd, industry, reportData.company);
        updateFCFF(current, currency, fcfValue);
        updateCashRunway(metrics, currency, current, industry);
        updateBankMeetingSummary(current, metrics, currency, analysis);
        updateWeeklyActions(current, metrics, currency, analysis, industry);
        updateInvestigationSection(industry);
        updateTechnicalMode(current, metrics, currency, industry, null);
        updateTechnicalMode(current, metrics, currency, industry);
    }

    // Default to plain mode
    setViewMode('plain');
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

        updateOwnerHeadline(current, metrics, currency);
        updateFourPillars(current, metrics, currency, industry, previous);
        updateStatusBadge(metrics);
        updateMiniPL(current, metrics, currency, industry);
        updateProfitInterpretation(current, metrics, currency, null, industry);
        updateOperationalHealth(metrics, currency, null, industry, current, ytd);
        const fcfValue = updateFCF(current, previous, metrics, currency);
        updateCashBridge(current, previous, metrics, currency, ytd, industry, data.company);
        updateFCFF(current, currency, fcfValue);
        updateCashRunway(metrics, currency, current, industry);
        updateBankMeetingSummary(current, metrics, currency, null);
        updateWeeklyActions(current, metrics, currency, null, industry);
        updateInvestigationSection(industry);
        updateTechnicalMode(current, metrics, currency, industry, null);
    }

    // Default to plain mode
    setViewMode('plain');
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

    // Industry tag
    const tagEl = document.getElementById('industryTag');
    if (tagEl && company.industry) {
        tagEl.textContent = INDUSTRY_NAMES[company.industry] || '';
    }

    // Generated date and footer date
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const genDateEl = document.getElementById('generatedDate');
    if (genDateEl) genDateEl.textContent = dateStr;
    const footerDateEl = document.getElementById('footerDate');
    if (footerDateEl) footerDateEl.textContent = dateStr;
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

    // Use YTD data for DSO/DIO/DPO when available (matches server calculation)
    let dso, dio, dpo;
    if (ytd && ytd.revenue > 0 && ytd.monthsElapsed > 1) {
        const ytdDays = ytd.monthsElapsed * 30;
        dso = (receivables / ytd.revenue) * ytdDays;
        dio = ytd.cogs > 0 ? (inventory / ytd.cogs) * ytdDays : (cogs > 0 ? (inventory / cogs) * days : 0);
        dpo = ytd.cogs > 0 ? (payables / ytd.cogs) * ytdDays : (cogs > 0 ? (payables / cogs) * days : 0);
    } else {
        dso = revenue > 0 ? (receivables / revenue) * days : 0;
        dio = cogs > 0 ? (inventory / cogs) * days : 0;
        dpo = cogs > 0 ? (payables / cogs) * days : 0;
    }
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
        // Fallback: use P&L approximation for burn rate
        // monthlyBurn = -netProfit + drawings + capex (net cash outflow)
        runwayMethod = 'opex';
        const drawings = current.ownerDrawings || 0;
        const capex = current.assetPurchases || 0;
        const monthlyBurn = -netProfit + drawings + capex;
        cashRunway = monthlyBurn > 0 ? cash / monthlyBurn : -1;
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
        'retail':        { name: 'Retail',        grossMargin: { min: 30, max: 55, ideal: 40 }, netMargin: { min: 2, max: 8, ideal: 5 },  dso: { min: 0, max: 10, industry: 5 },  dio: { min: 30, max: 60, industry: 45 }, dpo: { min: 20, max: 45, industry: 30 } },
        'product':       { name: 'Product',       grossMargin: { min: 30, max: 55, ideal: 40 }, netMargin: { min: 2, max: 8, ideal: 5 },  dso: { min: 0, max: 10, industry: 5 },  dio: { min: 30, max: 60, industry: 45 }, dpo: { min: 20, max: 45, industry: 30 } },
        'service':       { name: 'Service',       grossMargin: { min: 50, max: 70, ideal: 60 }, netMargin: { min: 10, max: 25, ideal: 15 }, dso: { min: 20, max: 60, industry: 40 }, dio: { min: 0, max: 0, industry: 0 },  dpo: { min: 15, max: 45, industry: 30 } },
        'ecommerce':     { name: 'E-commerce',    grossMargin: { min: 30, max: 50, ideal: 40 }, netMargin: { min: 3, max: 12, ideal: 7 }, dso: { min: 0, max: 5, industry: 2 },  dio: { min: 20, max: 45, industry: 30 }, dpo: { min: 20, max: 45, industry: 30 } },
        'manufacturing': { name: 'Manufacturing', grossMargin: { min: 20, max: 40, ideal: 30 }, netMargin: { min: 3, max: 12, ideal: 7 }, dso: { min: 20, max: 60, industry: 40 }, dio: { min: 30, max: 90, industry: 60 }, dpo: { min: 30, max: 60, industry: 45 } },
        'wholesale':     { name: 'Wholesale',     grossMargin: { min: 15, max: 30, ideal: 22 }, netMargin: { min: 2, max: 8, ideal: 5 },  dso: { min: 20, max: 45, industry: 35 }, dio: { min: 30, max: 60, industry: 45 }, dpo: { min: 25, max: 50, industry: 35 } },
        'restaurant':    { name: 'Restaurant',    grossMargin: { min: 60, max: 80, ideal: 70 }, netMargin: { min: 3, max: 9, ideal: 6 },  dso: { min: 0, max: 5, industry: 2 },  dio: { min: 5, max: 15, industry: 10 }, dpo: { min: 10, max: 30, industry: 20 } },
        'construction':  { name: 'Construction',  grossMargin: { min: 15, max: 35, ideal: 25 }, netMargin: { min: 3, max: 10, ideal: 6 }, dso: { min: 30, max: 90, industry: 60 }, dio: { min: 7, max: 30, industry: 15 }, dpo: { min: 30, max: 90, industry: 60 } },
        'healthcare':    { name: 'Healthcare',    grossMargin: { min: 40, max: 60, ideal: 50 }, netMargin: { min: 5, max: 15, ideal: 10 }, dso: { min: 10, max: 60, industry: 35 }, dio: { min: 5, max: 30, industry: 15 }, dpo: { min: 15, max: 45, industry: 30 } },
        'general':       { name: 'General',       grossMargin: { min: 30, max: 60, ideal: 45 }, netMargin: { min: 5, max: 15, ideal: 10 }, dso: { min: 15, max: 60, industry: 35 }, dio: { min: 10, max: 60, industry: 30 }, dpo: { min: 20, max: 60, industry: 35 } }
    };
    // Map form values to benchmark keys
    const aliases = { 'food': 'restaurant', 'services': 'service', 'online': 'ecommerce', 'other': 'general' };
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
        <div class="bench-item-top">
            <span class="bench-item-label">${label}</span>
            <span class="bench-item-vals">
                <span class="bench-bar-you ${status}">You: ${displayVal}</span>
                <span>Industry: ${Math.round(benchmark.min)}${unit}–${Math.round(benchmark.max)}${unit}</span>
            </span>
        </div>
        <div class="bench-bar-track">
            <div class="bench-bar-range" style="left:${rangeLeft}%;width:${rangeWidth}%"></div>
            <div class="bench-bar-ideal" style="left:${idealPos}%"></div>
            <div class="bench-marker ${status}" style="left:${dotPos}%"></div>
        </div>
        <div class="bench-bar-range-labels">
            <span>${Math.round(extMin)}${unit}</span>
            <span>${Math.round(extMax)}${unit}</span>
        </div>`;
}

// ===== Health Strip =====

// Global report tier — shared across all sections for consistent tone
let globalTier = 'safe';

function updateStatusBadge(metrics) {
    const badgeEl = document.getElementById('healthStatus');
    const rawRunway = metrics.runwayMonths || metrics.cashRunway || 0;
    const runway = rawRunway === -1 ? 999 : rawRunway; // -1 = cash positive = best case
    const netMargin = metrics.netMargin || 0;
    const profitable = netMargin > 0;

    // Determine status
    let status, tier;
    if (profitable && runway >= 3) {
        tier = 'safe';
        status = 'Safe';
    } else if (profitable && runway >= 1) {
        tier = 'warn';
        status = 'Tight';
    } else if (!profitable && runway >= 3) {
        tier = 'warn';
        status = 'Tight';
    } else {
        tier = 'danger';
        status = 'Danger';
    }

    // Set global tier for tone consistency across all sections
    globalTier = tier === 'warn' ? 'tight' : tier;

    if (badgeEl) {
        badgeEl.className = `status-badge ${tier}`;
        badgeEl.innerHTML = `<span class="status-dot"></span> ${status}`;
    }
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

    // COGS row
    const cogsLabel = COGS_LABELS[industry] || 'Cost of Goods Sold';
    const cogsLabelEl = document.getElementById('plCogsLabel');
    if (cogsLabelEl) cogsLabelEl.textContent = cogsLabel;
    const cogsEl = document.getElementById('plCogs');
    if (cogsEl) cogsEl.textContent = `${currency} ${formatNumber(cogs)}`;
    const cogsPctEl = document.getElementById('plCogsPct');
    if (cogsPctEl) cogsPctEl.textContent = revenue > 0 ? `${((cogs / revenue) * 100).toFixed(0)}%` : '0%';

    document.getElementById('plGrossProfit').textContent = `${grossProfit < 0 ? '-' : ''}${currency} ${formatNumber(grossProfit)}`;
    document.getElementById('plGrossMargin').textContent = `${gm}%`;

    // OPEX row
    const opexEl = document.getElementById('plOpex');
    if (opexEl) opexEl.textContent = `${currency} ${formatNumber(opex)}`;
    const opexPctEl = document.getElementById('plOpexPct');
    if (opexPctEl) opexPctEl.textContent = revenue > 0 ? `${((opex / revenue) * 100).toFixed(0)}%` : '0%';

    // EBITDA* = Operating Profit (no D&A to split)
    document.getElementById('plEBITDA').textContent = `${operatingProfit < 0 ? '-' : ''}${currency} ${formatNumber(operatingProfit)}`;
    document.getElementById('plEBITDAMargin').textContent = `${om}%`;
    document.getElementById('plNetIncome').textContent = `${netProfit < 0 ? '-' : ''}${currency} ${formatNumber(netProfit)}`;
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
    if (!el) return;
    el.classList.toggle('negative', val < 0);
}

// ===== Section 2: Profit Interpretation =====

function updateProfitInterpretation(current, metrics, currency, analysis, industry) {
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
    const gm = metrics.grossMargin;
    const runway = metrics.cashRunway;

    // Industry-specific GM thresholds for text descriptors
    const gmThresholds = {
        'food': { strong: 70, solid: 60 }, 'restaurant': { strong: 70, solid: 60 },
        'product': { strong: 40, solid: 30 }, 'retail': { strong: 40, solid: 30 },
        'online': { strong: 40, solid: 30 }, 'ecommerce': { strong: 40, solid: 30 },
        'services': { strong: 60, solid: 50 }, 'service': { strong: 60, solid: 50 },
        'construction': { strong: 25, solid: 15 },
        'manufacturing': { strong: 30, solid: 20 },
        'healthcare': { strong: 50, solid: 40 },
        'other': { strong: 45, solid: 30 }
    };
    const ind = industry?.toLowerCase() || 'other';
    const thresh = gmThresholds[ind] || gmThresholds['other'];

    // Industry-specific OPEX-to-GP warning threshold (proportion of GP consumed by OPEX)
    // Higher threshold = more tolerant for industries with naturally high overhead
    const opexThresholds = {
        'food': 0.7, 'restaurant': 0.7,
        'product': 0.6, 'retail': 0.6,
        'online': 0.5, 'ecommerce': 0.5,
        'services': 0.5, 'service': 0.5,
        'construction': 0.7,
        'manufacturing': 0.65,
        'healthcare': 0.65,
        'other': 0.6
    };
    const opexWarnRatio = opexThresholds[ind] || 0.6;

    let text = '';

    if (netProfit > 0) {
        // GM descriptor — industry-aware
        if (gm >= thresh.strong) {
            text = `Strong performance. Your gross margin of ${gm.toFixed(0)}% means you keep a healthy share of revenue after direct costs. `;
        } else if (gm >= thresh.solid) {
            text = `Your business is profitable with a solid ${gm.toFixed(0)}% gross margin. `;
        } else {
            text = `You're profitable, but your ${gm.toFixed(0)}% gross margin is tight for your industry. `;
        }

        // OPEX check — industry-aware threshold
        if (grossProfit > 0 && opex > grossProfit * opexWarnRatio) {
            text += `However, operating expenses are consuming ${Math.round((opex / grossProfit) * 100)}% of your gross profit. Review your overhead costs.`;
        } else {
            text += `Operating costs are well controlled, leaving a healthy operating profit.`;
        }
    } else if (netProfit === 0) {
        text = 'You broke even this month. Every dollar earned was spent. Focus on growing revenue or reducing costs to move into profit.';
    } else {
        // Loss scenarios
        if (grossProfit <= 0) {
            text = `You're selling below cost. This is unsustainable and needs immediate pricing or sourcing changes.`;
        } else {
            // GP positive but net loss — OPEX caused it
            const gmDesc = gm >= thresh.solid ? 'reasonable' : 'thin';
            text = `Your gross margin is ${gmDesc} at ${gm.toFixed(0)}%, but operating expenses of ${currency} ${formatNumber(opex)} pushed the business into a loss of ${currency} ${formatNumber(Math.abs(netProfit))}. Focus on cutting overhead or increasing sales volume.`;
        }
    }

    // Cash sentence — ties P&L to cash position
    const cash = current.cash || 0;
    if (runway === -1 && cash > 0) {
        text += ' Your cash position is strong and growing.';
    } else if (runway >= 6) {
        text += ' Cash reserves provide a comfortable buffer.';
    } else if (runway >= 3) {
        text += ' Keep an eye on cash — your runway is adequate but not long.';
    } else if (cash > 0) {
        text += ' Cash is critically low — address this before anything else.';
    }

    el.textContent = text;
}

// ===== Section 3: Operational Health =====

function updateOperationalHealth(metrics, currency, analysis, industry, current, ytd) {
    const ind = industry?.toLowerCase() || 'other';
    const bench = getDefaultBenchmarks(industry);
    const dso = Math.round(metrics.dso);
    const dio = Math.round(metrics.dio);
    const dpo = Math.round(metrics.dpo);
    const ccc = Math.round(metrics.ccc);

    // Industry-specific CCC thresholds
    const cccThresholds = {
        'food': { good: 10, warn: 20 }, 'restaurant': { good: 10, warn: 20 },
        'product': { good: 20, warn: 45 }, 'retail': { good: 20, warn: 45 },
        'online': { good: 10, warn: 25 }, 'ecommerce': { good: 10, warn: 25 },
        'services': { good: 30, warn: 60 }, 'service': { good: 30, warn: 60 },
        'construction': { good: 45, warn: 75 },
        'manufacturing': { good: 40, warn: 70 },
        'healthcare': { good: 25, warn: 50 },
        'other': { good: 30, warn: 60 }
    };
    const cccT = cccThresholds[ind] || cccThresholds['other'];

    // Hide irrelevant cards per industry
    const hideInventory = ['online', 'services', 'service'].includes(ind);
    const hideAR = ind === 'food' || ind === 'restaurant';
    const dsoCard = document.getElementById('wcDSOCard');
    const dioCard = document.getElementById('wcDIOCard');
    const wcrInvRow = document.getElementById('wcrInvRow');
    const wcrArRow = document.getElementById('wcrArRow');

    if (dioCard) dioCard.style.display = hideInventory ? 'none' : '';
    if (wcrInvRow) wcrInvRow.style.display = hideInventory ? 'none' : '';
    // Only hide DSO/AR for food if AR is actually 0
    const arIsZero = hideAR && (current?.receivables || 0) === 0;
    if (dsoCard) dsoCard.style.display = arIsZero ? 'none' : '';
    if (wcrArRow) wcrArRow.style.display = arIsZero ? 'none' : '';

    // Populate card numbers
    document.getElementById('opDSO').textContent = `${dso}`;
    document.getElementById('opDIO').textContent = `${dio}`;
    document.getElementById('opDPO').textContent = `${dpo}`;

    // DSO badge
    const dsoStatus = metrics.dso <= bench.dso.max ? 'ok' : metrics.dso <= bench.dso.max * 1.3 ? 'warn' : 'danger';
    if (dsoCard) dsoCard.className = `wc-card ${dsoStatus}`;
    const dsoBadge = document.getElementById('opDSOBadge');
    if (dsoBadge) {
        dsoBadge.className = `wc-badge ${dsoStatus}`;
        dsoBadge.textContent = dsoStatus === 'ok' ? 'Good' : dsoStatus === 'warn' ? 'Slow' : 'Critical';
    }
    const dsoNum = document.getElementById('opDSO');
    if (dsoNum) dsoNum.className = `wc-number ${dsoStatus}`;

    // DIO badge
    if (!hideInventory) {
        const dioStatus = metrics.dio <= bench.dio.max ? 'ok' : metrics.dio <= bench.dio.max * 1.3 ? 'warn' : 'danger';
        if (dioCard) dioCard.className = `wc-card ${dioStatus}`;
        const dioBadge = document.getElementById('opDIOBadge');
        if (dioBadge) {
            dioBadge.className = `wc-badge ${dioStatus}`;
            dioBadge.textContent = dioStatus === 'ok' ? 'Good' : dioStatus === 'warn' ? 'High' : 'Critical';
        }
        const dioNum = document.getElementById('opDIO');
        if (dioNum) dioNum.className = `wc-number ${dioStatus}`;
    }

    // DPO badge (higher DPO = better, so inverted)
    const dpoStatus = metrics.dpo >= bench.dpo.min ? 'ok' : metrics.dpo >= bench.dpo.min * 0.7 ? 'warn' : 'danger';
    const dpoCard = document.getElementById('wcDPOCard');
    if (dpoCard) dpoCard.className = `wc-card ${dpoStatus}`;
    const dpoBadge = document.getElementById('opDPOBadge');
    if (dpoBadge) {
        dpoBadge.className = `wc-badge ${dpoStatus}`;
        dpoBadge.textContent = dpoStatus === 'ok' ? 'Good' : dpoStatus === 'warn' ? 'Fast' : 'Too Fast';
    }
    const dpoNum = document.getElementById('opDPO');
    if (dpoNum) dpoNum.className = `wc-number ${dpoStatus}`;

    // CCC — industry-specific thresholds
    const cccEl = document.getElementById('cccValue');
    if (cccEl) cccEl.textContent = `${ccc} days`;
    const cccResult = document.getElementById('cccResult');
    const cccStatus = ccc >= cccT.warn ? 'danger' : ccc >= cccT.good ? 'warning' : 'good';
    if (cccResult) cccResult.className = `ccc-row ${cccStatus}`;

    // Summary sentence — lead with the story
    const summaryEl = document.getElementById('wcSummary');
    if (summaryEl) {
        let summary = '';
        if (ccc < 0) {
            summary = `Your cash cycle is ${Math.abs(ccc)} days negative — you collect money before you need to pay it out. This is an excellent position.`;
        } else if (cccStatus === 'good') {
            summary = `Your cash takes ${ccc} days to flow through the business — that's healthy for your industry.`;
        } else if (cccStatus === 'warning') {
            summary = `Your cash takes ${ccc} days to flow through the business — that's slower than ideal. Here's what's causing it.`;
        } else {
            summary = `Your cash is tied up for ${ccc} days before it comes back — this is too long and puts pressure on your bank balance.`;
        }

        // Name the villain
        if (ccc > cccT.good) {
            if (dsoStatus !== 'ok' && dso >= dio && dso >= dpo) {
                summary += ` Slow customer payments are the main issue.`;
            } else if (!hideInventory && metrics.dio > bench.dio.max) {
                summary += ` Stock is sitting too long before selling.`;
            } else if (dpoStatus !== 'ok') {
                summary += ` You're paying suppliers faster than you need to.`;
            }
        }
        summaryEl.textContent = summary;
    }

    // Benchmark bar for DSO
    renderBenchBar('benchDSO', 'How fast customers pay you (DSO)', metrics.dso, bench.dso, ' days', false);

    // WCR table
    if (current) {
        updateWCRTable(current, metrics, bench, currency, industry, ytd);
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

function updateWCRTable(current, metrics, bench, currency, industry, ytd) {
    // Use YTD revenue/cogs when available (matches DSO/DIO/DPO calculation base)
    let periodDays, revenueBase, cogsBase;
    if (ytd && ytd.revenue > 0 && ytd.monthsElapsed > 1) {
        periodDays = ytd.monthsElapsed * 30;
        revenueBase = ytd.revenue;
        cogsBase = ytd.cogs || current.cogs || 0;
    } else {
        periodDays = 30;
        revenueBase = current.revenue || 0;
        cogsBase = current.cogs || 0;
    }

    // Actuals
    const arActual = current.receivables || 0;
    const invActual = current.inventory || 0;
    const apActual = current.payables || 0;
    const wcrActual = arActual + invActual - apActual;

    // Industry targets using industry average days
    const arTarget = revenueBase > 0 ? (bench.dso.industry / periodDays) * revenueBase : 0;
    const invTarget = cogsBase > 0 ? (bench.dio.industry / periodDays) * cogsBase : 0;
    const apTarget = cogsBase > 0 ? (bench.dpo.industry / periodDays) * cogsBase : 0;
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

    // CCC insight — industry-specific thresholds
    const cccInsightEl = document.getElementById('opCashMovement');
    if (cccInsightEl) {
        const ind2 = industry?.toLowerCase() || 'other';
        const cccThresh = {
            'food': { good: 10, warn: 20 }, 'restaurant': { good: 10, warn: 20 },
            'product': { good: 20, warn: 45 }, 'retail': { good: 20, warn: 45 },
            'online': { good: 10, warn: 25 }, 'ecommerce': { good: 10, warn: 25 },
            'services': { good: 30, warn: 60 }, 'service': { good: 30, warn: 60 },
            'construction': { good: 45, warn: 75 },
            'manufacturing': { good: 40, warn: 70 },
            'healthcare': { good: 25, warn: 50 },
            'other': { good: 30, warn: 60 }
        };
        const ct = cccThresh[ind2] || cccThresh['other'];
        const roundCCC = Math.round(metrics.ccc);
        const roundDSO = Math.round(metrics.dso);
        const roundDPO = Math.round(metrics.dpo);

        let insight = '';
        if (metrics.ccc < 0) {
            insight = getCCCNegativeAdvice(bench.name);
        } else if (roundCCC >= ct.warn * 1.5) {
            insight = `Your capital is locked up for ${roundCCC} days — this is critical for your industry. Consider invoice factoring to collect receivables quickly. Review slow-paying clients and halt non-essential purchasing.`;
        } else if (roundCCC >= ct.warn) {
            insight = getCCC60Advice(bench.name, roundCCC);
        } else if (roundCCC >= ct.good) {
            insight = `Your cash cycle is ${roundCCC} days. You pay suppliers in ${roundDPO} days but wait ${roundDSO} days to collect. That's ${roundCCC} days your money is stuck in operations.`;
        } else {
            if (globalTier === 'danger') {
                insight = `Cash cycle is ${roundCCC} days — short for your industry. But your overall cash position is critical — focus on the cash runway and liquidity issues above.`;
            } else {
                insight = `Cash cycle is ${roundCCC} days — cash moves through your business at a healthy pace.`;
            }
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
    if (npEl) {
        npEl.textContent = signedAmount(netProfit, currency);
        npEl.className = `fcf-value ${netProfit >= 0 ? 'positive' : 'negative'}`;
    }

    const wcEl = document.getElementById('fcfWCChanges');
    if (wcEl) {
        wcEl.textContent = wcChanges >= 0 ? `- ${currency} ${formatNumber(wcChanges)}` : `+ ${currency} ${formatNumber(Math.abs(wcChanges))}`;
        wcEl.className = `fcf-value ${wcChanges >= 0 ? 'negative' : 'positive'}`;
    }

    const capexEl = document.getElementById('fcfCapex');
    if (capexEl) {
        capexEl.textContent = capex > 0 ? `- ${currency} ${formatNumber(capex)}` : `${currency} 0`;
        capexEl.className = `fcf-value ${capex > 0 ? 'negative' : ''}`;
    }

    const totalEl = document.getElementById('fcfTotal');
    if (totalEl) {
        totalEl.textContent = signedAmount(fcf, currency);
        totalEl.className = `fcf-value ${fcf >= 0 ? 'positive' : 'negative'}`;
    }

    // Insight
    const insightEl = document.getElementById('fcfInsight');
    let fcfInsightText = '';
    if (fcf > 0) {
        fcfInsightText = `<p>Your business generated <strong>${currency} ${formatNumber(fcf)}</strong> in cash this month. This is real money available to pay down debt, distribute to owners, or reinvest.</p>`;
    } else if (fcf === 0) {
        fcfInsightText = `<p>Cash generated is zero — the business produces just enough to sustain operations. Growth will need external funding or cost cuts.</p>`;
    } else {
        fcfInsightText = `<p>Your business consumed <strong>${currency} ${formatNumber(Math.abs(fcf))}</strong> more cash than it generated. This is being funded from your cash reserves.</p>`;
    }

    // Flag owner drawings when they exceed free cash flow (the real cash strain trigger)
    const ownerDrawings = current.ownerDrawings || 0;
    if (ownerDrawings > 0 && ownerDrawings > fcf && fcf > 0) {
        fcfInsightText += `<p style="margin-top: 8px;"><strong>Owner drawings:</strong> You took ${currency} ${formatNumber(ownerDrawings)} out of the business, but it only generated ${currency} ${formatNumber(fcf)} in cash. The difference (${currency} ${formatNumber(ownerDrawings - fcf)}) came from your cash reserves — that's why your balance dropped despite being profitable.</p>`;
    } else if (ownerDrawings > 0 && netProfit <= 0) {
        fcfInsightText += `<p style="margin-top: 8px;"><strong>Owner drawings:</strong> You took ${currency} ${formatNumber(ownerDrawings)} out of the business while making a loss. This directly reduces your cash reserves.</p>`;
    } else if (ownerDrawings > 0 && fcf <= 0) {
        fcfInsightText += `<p style="margin-top: 8px;"><strong>Owner drawings:</strong> You took ${currency} ${formatNumber(ownerDrawings)} while the business generated no free cash. This is being funded entirely from reserves.</p>`;
    }

    insightEl.innerHTML = fcfInsightText;

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
    document.getElementById('fcffFCF').className = `debt-card-number ${fcfValue >= 0 ? 'positive' : 'negative'}`;

    document.getElementById('fcffLoanRepayments').textContent = `- ${currency} ${formatNumber(loanRepayments)}`;
    document.getElementById('fcffLoanRepayments').className = 'debt-card-number negative';

    const surplusEl = document.getElementById('fcffSurplus');
    surplusEl.textContent = signedAmount(surplus, currency);
    surplusEl.className = `debt-card-number ${surplus >= 0 ? 'positive' : 'negative'}`;

    const insightEl = document.getElementById('fcffInsight');
    if (surplus > 0) {
        const ratio = fcfValue / loanRepayments;
        if (ratio >= 2 && globalTier === 'safe') {
            insightEl.innerHTML = `<p>You can comfortably afford your loan payments. Your business produces <strong>${ratio.toFixed(1)}x</strong> more cash than your loan requires.</p>`;
        } else if (ratio >= 2) {
            insightEl.innerHTML = `<p>Loan payments are covered (<strong>${ratio.toFixed(1)}x</strong> coverage), but your overall cash position needs attention — focus on building your cash buffer.</p>`;
        } else {
            insightEl.innerHTML = `<p>Loan payments are covered, but barely — your buffer is only <strong>${ratio.toFixed(1)}x</strong>. One bad month could make this tight. Speed up collections to build a cushion.</p>`;
        }
    } else if (globalTier === 'safe') {
        // Negative FCF but business is overall healthy — WC absorbed cash this month, not a crisis
        insightEl.innerHTML = `<p>Free cash flow was negative this month, so loan payments of <strong>${currency} ${formatNumber(loanRepayments)}</strong> came from reserves. This is manageable with your cash buffer, but watch the trend — if this continues, it will erode your position.</p>`;
    } else {
        insightEl.innerHTML = `<p><strong>Your loan payments are draining cash faster than the business can generate it.</strong> You're dipping into reserves by <strong>${currency} ${formatNumber(Math.abs(surplus))}</strong> per month. This is not sustainable — talk to your lender about restructuring.</p>`;
    }
}

// ===== Section 6: Cash Runway =====

function updateCashRunway(metrics, currency, current, industry) {
    const bigValueEl = document.getElementById('runwayBigValue');
    const unitEl = document.querySelector('.runway-unit');
    const methodEl = document.getElementById('runwayMethodDisplay');
    const cashoutEl = document.getElementById('runwayCashout');
    const driversEl = document.getElementById('runwayDrivers');
    const interpEl = document.getElementById('runwayInterpretation');
    const boosterEl = document.getElementById('runwayBooster');

    const ind = industry?.toLowerCase() || 'other';
    const cash = current.cash || 0;
    const revenue = current.revenue || 0;
    const runway = metrics.cashRunway; // months, or -1 for cash-positive

    // Method tooltip (hidden from UI, shown on hover)
    const methodTooltip = {
        'ytd': 'Calculated from your year-to-date cash movement',
        'monthly': 'Calculated from last month\'s cash change',
        'opex': 'Estimated from your monthly expenses'
    }[metrics.runwayMethod] || 'Estimated from your monthly expenses';
    if (methodEl) methodEl.title = methodTooltip;

    // Industry-specific thresholds (all in months — converted to days for display-only industries)
    const thresholds = {
        'food': { safe: 6, warn: 3, useDays: true },
        'restaurant': { safe: 6, warn: 3, useDays: true },
        'product': { safe: 6, warn: 3, useDays: true },
        'retail': { safe: 6, warn: 3, useDays: true },
        'ecommerce': { safe: 6, warn: 3, useDays: true },
        'online': { safe: 12, warn: 6, useDays: false },
        'services': { safe: 6, warn: 3, useDays: false },
        'service': { safe: 6, warn: 3, useDays: false },
        'construction': { safe: 9, warn: 4, useDays: false },
        'manufacturing': { safe: 6, warn: 3, useDays: false },
        'healthcare': { safe: 6, warn: 3, useDays: false },
        'other': { safe: 6, warn: 3, useDays: false }
    };
    const t = thresholds[ind] || thresholds['other'];
    const useDays = t.useDays;

    // Always calculate runway in months first (burn-based), then convert to days for display
    const runwayMonths = runway === -1 ? 999 : runway;
    const daysDisplay = useDays && revenue > 0 ? Math.round(cash / (revenue / 30)) : 0;

    // ALWAYS determine tier from months (burn-based) to avoid contradictions
    let tier;
    if (runway === -1) tier = 'positive';
    else if (runwayMonths >= t.safe) tier = 'safe';
    else if (runwayMonths >= t.warn) tier = 'warn';
    else if (runwayMonths >= 1) tier = 'low';
    else tier = 'critical';

    // For daily industries: show days only when both metrics agree on the tier
    // If burn-based runway is safe but days-of-revenue looks bad, show months instead
    const daysAgree = daysDisplay >= t.warn * 30; // days also look at least OK
    const effectiveUseDays = useDays && (daysAgree || tier === 'low' || tier === 'critical');
    const displayVal = effectiveUseDays ? daysDisplay : runwayMonths;
    const displayUnit = effectiveUseDays ? 'days' : 'months';

    if (unitEl) unitEl.textContent = displayUnit;

    // Industry-specific interpretation
    const interpTexts = {
        positive: {
            'food': 'Your restaurant generates more cash than it uses. Reinvest in equipment, marketing, or staff development.',
            'online': 'Your business is cash-positive. Consider investing in product development or customer acquisition.',
            'construction': 'Cash is growing — use this buffer for project delays or equipment investment.',
            'services': 'You generate more cash than you spend. Consider hiring, marketing, or building reserves.',
            '_default': 'Your business generates more cash than it uses. You can invest, hire, or build reserves.'
        },
        safe: {
            'food': `At this pace, you have enough cash to cover about ${effectiveUseDays ? Math.round(daysDisplay / 7) + ' weeks' : Math.floor(runwayMonths) + ' months'} of food, labor, and overhead costs.`,
            'online': `At your current burn rate, you have ${Math.floor(runwayMonths)} months of runway. This gives you time to grow or optimize before needing funding.`,
            'construction': `This covers approximately ${Math.floor(runwayMonths)} months of overhead between projects. Comfortable buffer for project delays.`,
            'manufacturing': `You have ${Math.floor(runwayMonths)} months of cash to cover production costs and overhead. Solid position for planning.`,
            '_default': `You have time to plan, invest, and weather surprises. Cash balance: ${currency} ${formatNumber(cash)}.`
        },
        warn: {
            'food': `Cash covers about ${effectiveUseDays ? Math.round(daysDisplay / 7) + ' weeks' : runwayMonths.toFixed(1) + ' months'} of expenses. Start tightening — reduce waste, speed up catering collections.`,
            'online': `${runwayMonths.toFixed(1)} months of runway. If not yet profitable, start planning your next funding round or path to breakeven.`,
            'construction': `${runwayMonths.toFixed(1)} months of overhead coverage. Chase outstanding progress billings and delay non-critical equipment purchases.`,
            '_default': `Not critical yet, but start improving cash flow. Collect receivables faster and delay non-essential spending.`
        },
        low: {
            'food': `Cash is dangerously low — only ${effectiveUseDays ? daysDisplay + ' days' : runwayMonths.toFixed(1) + ' months'} left. Negotiate supplier terms, reduce portions or menu items, collect catering invoices immediately.`,
            'online': `Only ${runwayMonths.toFixed(1)} months of runway left. Cut non-essential costs immediately and accelerate revenue.`,
            'construction': `${runwayMonths.toFixed(1)} months left. Demand milestone payments on active projects and pause new commitments until cash improves.`,
            '_default': `Action needed. Collect receivables urgently, cut non-essential spending, and consider short-term credit.`
        },
        critical: {
            'food': `Your cash is nearly gone. Contact suppliers about extended terms today. Collect every outstanding invoice this week.`,
            'online': `Cash will run out within weeks. Cut all non-essential expenses immediately and focus on revenue.`,
            'construction': `Cash is critical. Do not start new projects. Collect all outstanding billings and retention money immediately.`,
            '_default': `Your cash is very low — take action this week. Collect receivables, pause spending, and talk to your bank.`
        }
    };

    function getInterp(tier) {
        const tierTexts = interpTexts[tier];
        return tierTexts[ind] || tierTexts['_default'];
    }

    // Render based on tier
    if (tier === 'positive') {
        bigValueEl.textContent = 'Cash Positive';
        bigValueEl.className = 'runway-big ok runway-text';
        if (unitEl) unitEl.textContent = ''; // hide "days"/"months" for cash-positive
        if (methodEl) methodEl.textContent = '';
        if (cashoutEl) cashoutEl.textContent = '';
        if (driversEl) driversEl.innerHTML = `<p>Cash balance: <strong>${currency} ${formatNumber(cash)}</strong> and increasing.</p>`;
        if (interpEl) interpEl.innerHTML = `<p>${getInterp('positive')}</p>`;
    } else {
        bigValueEl.textContent = effectiveUseDays ? Math.round(displayVal) : displayVal.toFixed(1);
        bigValueEl.className = `runway-big ${tier === 'safe' ? 'ok' : tier === 'warn' ? 'warn' : 'danger'}`;
        if (methodEl) methodEl.textContent = '';

        // Cash-out date: only for warn/low/critical
        if (tier !== 'safe' && cashoutEl) {
            const cashOutDate = getCashOutDate(runwayMonths);
            cashoutEl.textContent = `Cash runs out around ${cashOutDate}`;
        } else if (cashoutEl) {
            cashoutEl.textContent = '';
        }

        if (driversEl) driversEl.innerHTML = `<p>Cash balance: <strong>${currency} ${formatNumber(cash)}</strong>.</p>`;
        if (interpEl) interpEl.innerHTML = `<p>${getInterp(tier)}</p>`;
    }

    // Runway Booster insight — show what would extend runway
    if (boosterEl && tier !== 'positive' && tier !== 'safe') {
        const ar = current.receivables || 0;
        const inv = current.inventory || 0;
        const drawings = current.ownerDrawings || 0;
        const monthlyBurn = runwayMonths > 0 ? cash / runwayMonths : 0;
        let booster = '';

        if (ar > 0 && monthlyBurn > 0) {
            const arBoost = (ar * 0.5) / monthlyBurn;
            booster = `If you collected 50% of receivables (${currency} ${formatNumber(Math.round(ar * 0.5))}), runway extends to ${(runwayMonths + arBoost).toFixed(1)} months.`;
        } else if (inv > 0 && monthlyBurn > 0) {
            const invBoost = (inv * 0.2) / monthlyBurn;
            booster = `Reducing inventory by 20% (${currency} ${formatNumber(Math.round(inv * 0.2))}) adds ${invBoost.toFixed(1)} months of runway.`;
        } else if (drawings > 0 && monthlyBurn > 0) {
            const drawBoost = (drawings * 0.5) / monthlyBurn;
            booster = `Cutting drawings by half adds ${drawBoost.toFixed(1)} months of runway.`;
        }

        if (booster) {
            boosterEl.style.display = '';
            boosterEl.textContent = booster;
        } else {
            boosterEl.style.display = 'none';
        }
    } else if (boosterEl) {
        boosterEl.style.display = 'none';
    }

    // Industry benchmark bar (uses display units)
    if (effectiveUseDays) {
        const benchDays = runway === -1 ? t.safe * 30 : daysDisplay;
        renderBenchBar('benchRunway', 'How long your cash will last', benchDays, { min: t.warn * 30, max: t.safe * 30, ideal: t.safe * 30 }, ' days', true);
    } else {
        const benchMonths = runway === -1 ? t.safe : runwayMonths;
        renderBenchBar('benchRunway', 'How long your cash will last', benchMonths, { min: t.warn, max: t.safe, ideal: t.safe }, ' months', true);
    }
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
        quoteEl.textContent = analysis.meetingSummary;
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
        cash = `Cash position is strong at ${currency} ${formatNumber(current.cash || 0)} and growing.`;
    } else if (metrics.cashRunway >= 6) {
        cash = `We have ${currency} ${formatNumber(current.cash || 0)} in cash — about ${metrics.cashRunway.toFixed(0)} months of runway.`;
    } else if (metrics.cashRunway >= 3) {
        cash = `Cash is ${currency} ${formatNumber(current.cash || 0)} with ${metrics.cashRunway.toFixed(1)} months of runway. We're focused on improving that.`;
    } else {
        cash = `Cash is tight at ${currency} ${formatNumber(current.cash || 0)}. We have ${currency} ${formatNumber(current.receivables || 0)} in receivables we're actively collecting.`;
    }

    quoteEl.textContent = `${sales}${profit}. ${cash}`;
}

// ===== Section 8: Weekly Actions =====

function updateWeeklyActions(current, metrics, currency, analysis, industry) {
    const actionList = document.getElementById('actionList');
    if (!actionList) return;

    // Determine urgency tier (used by both AI and auto-generated paths)
    const runwaySafe = metrics.cashRunway === -1 || metrics.cashRunway >= 6;
    const runwayDanger = metrics.cashRunway >= 0 && metrics.cashRunway < 3;
    const urgencyMap = runwayDanger
        ? ['Do Today', 'This Week', 'This Week']
        : runwaySafe
        ? ['This Month', 'This Month', 'This Month']
        : ['This Week', 'This Week', 'This Month'];

    // Use AI actions if available
    if (analysis && analysis.action1Title) {
        let actions = [
            { title: analysis.action1Title, desc: analysis.action1Desc },
            { title: analysis.action2Title, desc: analysis.action2Desc },
            { title: analysis.action3Title, desc: analysis.action3Desc }
        ].filter(a => a.title && a.desc);

        // Safety filter: fix common AI errors
        actions = actions.map(a => {
            let title = a.title.replace(/collect.*from.*supplier/i, 'Negotiate extended terms with suppliers');
            let desc = a.desc.replace(/collect.*from.*supplier/i, 'negotiate payment terms with your suppliers');
            return { title, desc };
        });

        actionList.innerHTML = actions.map((a, i) =>
            actionCard(i + 1, a.title, a.desc, null, urgencyMap[i])
        ).join('');
        return;
    }

    // Auto-generate actions — industry-aware with dynamic urgency
    const actions = [];
    const bench = getDefaultBenchmarks(industry);

    // Danger/Watch: urgent cash actions
    if (runwayDanger) {
        const target = Math.round((current.receivables || 0) * 0.3);
        if (target > 0) {
            actions.push({
                title: `Collect ${currency} ${formatNumber(target)} from customers`,
                desc: `You have ${currency} ${formatNumber(current.receivables || 0)} outstanding. Call your top 3 customers and agree on payment dates this week.`,
                impact: target
            });
        }
    }

    // DSO too high for industry
    if (actions.length < 3 && metrics.dso > bench.dso.max) {
        actions.push({
            title: 'Speed up customer payments',
            desc: `Customers take ${Math.round(metrics.dso)} days to pay (industry target: ${bench.dso.max}). Send reminders earlier or offer small discounts for early payment.`,
            impact: Math.round((current.receivables || 0) * 0.15)
        });
    }

    // DPO too low for industry
    if (actions.length < 3 && metrics.dpo < bench.dpo.min) {
        actions.push({
            title: 'Negotiate longer supplier payment terms',
            desc: `You pay suppliers in ${Math.round(metrics.dpo)} days (industry norm: ${bench.dpo.min}+). Ask your top 3 suppliers for 30-day terms.`,
            impact: Math.round((current.payables || 0) * 0.1)
        });
    }

    // Gross margin below industry
    if (actions.length < 3 && metrics.grossMargin < bench.grossMargin.min) {
        actions.push({
            title: 'Improve your margins',
            desc: `Gross margin is ${metrics.grossMargin.toFixed(0)}% (industry minimum: ${bench.grossMargin.min}%). Review pricing or negotiate better supplier rates.`,
            impact: Math.round((current.revenue || 0) * 0.03)
        });
    }

    // DIO too high for industry
    if (actions.length < 3 && metrics.dio > bench.dio.max && bench.dio.max > 0) {
        actions.push({
            title: 'Reduce stock levels',
            desc: `Stock sits for ${Math.round(metrics.dio)} days (industry target: ${bench.dio.max}). Order smaller quantities more often.`,
            impact: Math.round((current.inventory || 0) * 0.2)
        });
    }

    // Cash critically low
    if (actions.length < 3 && runwayDanger) {
        actions.push({
            title: 'Pause non-essential spending',
            desc: `Cash is critically low. Hold off on anything not essential until your runway exceeds 3 months.`,
            impact: Math.round((current.opex || 0) * 0.1)
        });
    }

    // Healthy business — growth/optimization actions
    if (actions.length < 3 && runwaySafe && metrics.netMargin > 0) {
        const healthyActions = [
            { title: 'Review your pricing', desc: 'With strong margins, test raising prices 3-5% on your best-selling items. Even a small increase goes straight to profit.' },
            { title: 'Automate invoice reminders', desc: 'Set up automatic payment reminders to collect faster without chasing customers manually.' },
            { title: 'Identify your most profitable products', desc: 'Know which items or services generate the most margin — double down on what works.' }
        ];
        while (actions.length < 3 && healthyActions.length > 0) {
            actions.push(healthyActions.shift());
        }
    }

    // Fallback — varied generic actions
    const fallbacks = [
        { title: 'Review operating expenses', desc: 'Look for subscriptions, services, or costs that can be renegotiated or eliminated.' },
        { title: 'Set up a weekly cash check', desc: 'Spend 10 minutes every Monday reviewing your bank balance and outstanding invoices.' },
        { title: 'Talk to your accountant', desc: 'Share this report and ask for their top recommendation based on your numbers.' }
    ];
    let fi = 0;
    while (actions.length < 3) {
        actions.push(fallbacks[fi % fallbacks.length]);
        fi++;
    }

    actionList.innerHTML = actions.slice(0, 3).map((a, i) =>
        actionCard(i + 1, a.title, a.desc,
            a.impact ? `Estimated impact: ~${currency} ${formatNumber(a.impact)}` : null,
            urgencyMap[i])
    ).join('');
}

function actionCard(num, title, desc, impact, urgencyLabel) {
    urgencyLabel = urgencyLabel || (num === 1 ? 'Do Today' : num === 2 ? 'This Week' : 'This Month');
    const urgencyClass = urgencyLabel === 'Do Today' ? 'u-today' : urgencyLabel === 'This Week' ? 'u-week' : 'u-month';
    const metricTag = impact ? `<span class="action-metric">${impact}</span>` : '';
    return `
        <li class="action-item">
            <div class="action-num">0${num}</div>
            <div class="action-body">
                <span class="urgency-tag ${urgencyClass}">${urgencyLabel}</span>
                <div class="action-title">${title}</div>
                <p class="action-desc">${desc}</p>
                ${metricTag}
            </div>
        </li>
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
https://plainfinancials.com`;

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
        margin: [10, 12, 10, 12],
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
    document.getElementById('inv-runway').textContent = metrics.cashRunway === -1 ? 'Cash positive' : `${(metrics.cashRunway || 0).toFixed(1)} mo`;

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
        margin: [10, 12, 10, 12],
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

// ===== Technical Mode =====

function updateTechnicalMode(current, metrics, currency, industry, benchmarks) {
    const bench = benchmarks || getDefaultBenchmarks(industry);
    const revenue = current.revenue || 0;
    const cogs = current.cogs || 0;
    const opex = current.opex || 0;
    const grossProfit = revenue - cogs;
    const operatingProfit = grossProfit - opex;
    const netProfit = current.netProfit || 0;
    const gm = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const nm = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    const quickAssets = (current.cash || 0) + (current.receivables || 0);
    const totalCurrentLiabilities = (current.payables || 0) + (current.shortTermLoans || 0) + (current.otherLiabilities || 0);
    const quickRatio = totalCurrentLiabilities > 0 ? quickAssets / totalCurrentLiabilities : 0;
    const cashVsAP = (current.payables || 0) > 0 ? (current.cash || 0) / (current.payables || 0) : 0;
    const overheadPct = revenue > 0 ? (opex / revenue) * 100 : 0;
    const runwayVal = metrics.cashRunway === -1 ? 'Cash positive' : `${(metrics.cashRunway || 0).toFixed(1)} mo`;

    // Industry-specific CCC and runway thresholds for technical view
    const ind = industry?.toLowerCase() || 'other';
    const cccT = {
        'food': { good: 10, warn: 20 }, 'restaurant': { good: 10, warn: 20 },
        'product': { good: 20, warn: 45 }, 'retail': { good: 20, warn: 45 },
        'online': { good: 10, warn: 25 }, 'ecommerce': { good: 10, warn: 25 },
        'services': { good: 30, warn: 60 }, 'service': { good: 30, warn: 60 },
        'construction': { good: 45, warn: 75 },
        'manufacturing': { good: 40, warn: 70 },
        'healthcare': { good: 25, warn: 50 },
        'other': { good: 30, warn: 60 }
    }[ind] || { good: 30, warn: 60 };
    const runT = {
        'online': { safe: 12, warn: 6 },
        'construction': { safe: 9, warn: 4 },
        '_default': { safe: 6, warn: 3 }
    }[ind] || { safe: 6, warn: 3 };

    // Ratio grid
    const ratioGrid = document.getElementById('techRatioGrid');
    if (ratioGrid) {
        const cccVal = Math.round(metrics.ccc || 0);
        const ratios = [
            { label: 'Gross Margin', value: `${gm.toFixed(1)}%`, status: gm >= bench.grossMargin.min ? 'ok' : 'warn' },
            { label: 'Net Margin', value: `${nm.toFixed(1)}%`, status: nm >= bench.netMargin.min ? 'ok' : nm >= 0 ? 'warn' : 'danger' },
            { label: 'Current Ratio', value: `${(metrics.currentRatio || 0).toFixed(2)}x`, status: metrics.currentRatio >= 1.5 ? 'ok' : metrics.currentRatio >= 1 ? 'warn' : 'danger' },
            { label: 'Quick Ratio', value: `${quickRatio.toFixed(2)}x`, status: quickRatio >= 1 ? 'ok' : quickRatio >= 0.5 ? 'warn' : 'danger' },
            { label: 'CCC', value: `${cccVal} days`, status: cccVal < cccT.good ? 'ok' : cccVal < cccT.warn ? 'warn' : 'danger' },
            { label: 'Cash Runway', value: runwayVal, status: metrics.cashRunway === -1 || metrics.cashRunway >= runT.safe ? 'ok' : metrics.cashRunway >= runT.warn ? 'warn' : 'danger' },
            { label: 'Cash vs AP', value: `${cashVsAP.toFixed(2)}x`, status: cashVsAP >= 1.5 ? 'ok' : cashVsAP >= 1 ? 'warn' : 'danger' },
            { label: 'Overhead %', value: `${overheadPct.toFixed(1)}%`, status: overheadPct <= 40 ? 'ok' : overheadPct <= 60 ? 'warn' : 'danger' }
        ];
        ratioGrid.innerHTML = ratios.map(r => `
            <div class="ratio-card ${r.status}">
                <div class="ratio-label">${r.label}</div>
                <div class="ratio-value">${r.value}</div>
            </div>
        `).join('');
    }

    // Income statement table
    const incomeBody = document.getElementById('techIncomeBody');
    const incomeFoot = document.getElementById('techIncomeFoot');
    if (incomeBody) {
        const gmBench = bench.grossMargin.ideal || bench.grossMargin.min;
        const nmBench = bench.netMargin.ideal || bench.netMargin.min;
        const cogsPct = revenue > 0 ? (cogs / revenue * 100) : 0;
        const opexPct = revenue > 0 ? (opex / revenue * 100) : 0;
        const ebitdaPct = revenue > 0 ? (operatingProfit / revenue * 100) : 0;
        incomeBody.innerHTML = `
            <tr><td>Revenue</td><td>${currency} ${formatNumber(revenue)}</td><td>100%</td><td>-</td><td>-</td></tr>
            <tr><td>${COGS_LABELS[industry] || 'COGS'}</td><td>(${currency} ${formatNumber(cogs)})</td><td>${cogsPct.toFixed(1)}%</td><td>-</td><td>-</td></tr>
            <tr class="subtotal"><td>Gross Profit</td><td>${currency} ${formatNumber(grossProfit)}</td><td>${gm.toFixed(1)}%</td><td>${gmBench}%</td><td>${(gm - gmBench).toFixed(1)}%</td></tr>
            <tr><td>Operating Expenses</td><td>(${currency} ${formatNumber(opex)})</td><td>${opexPct.toFixed(1)}%</td><td>-</td><td>-</td></tr>
            <tr class="subtotal"><td>Operating Profit (EBITDA*)</td><td>${currency} ${formatNumber(operatingProfit)}</td><td>${ebitdaPct.toFixed(1)}%</td><td>-</td><td>-</td></tr>
        `;
    }
    if (incomeFoot) {
        const nmBench = bench.netMargin.ideal || bench.netMargin.min;
        incomeFoot.innerHTML = `
            <tr><td>Net Income</td><td>${currency} ${formatNumber(netProfit)}</td><td>${nm.toFixed(1)}%</td><td>${nmBench}%</td><td>${(nm - nmBench).toFixed(1)}%</td></tr>
        `;
    }

    // Working capital table
    const wcBody = document.getElementById('techWCBody');
    if (wcBody) {
        const dsoTarget = bench.dso.industry;
        const dioTarget = bench.dio.industry;
        const dpoTarget = bench.dpo.industry;
        const cccTarget = dsoTarget + dioTarget - dpoTarget;
        const dso = Math.round(metrics.dso || 0);
        const dio = Math.round(metrics.dio || 0);
        const dpo = Math.round(metrics.dpo || 0);
        const ccc = Math.round(metrics.ccc || 0);
        const statusIcon = (actual, target, lowerBetter) => {
            if (lowerBetter) return actual <= target ? 'ok' : actual <= target * 1.3 ? 'warn' : 'danger';
            return actual >= target ? 'ok' : actual >= target * 0.7 ? 'warn' : 'danger';
        };
        wcBody.innerHTML = `
            <tr><td>DSO</td><td>${dso} days</td><td>${dsoTarget} days</td><td class="${statusIcon(dso, bench.dso.max, true)}">${dso <= bench.dso.max ? 'On target' : 'Over'}</td></tr>
            <tr><td>DIO</td><td>${dio} days</td><td>${dioTarget} days</td><td class="${statusIcon(dio, bench.dio.max, true)}">${dio <= bench.dio.max ? 'On target' : 'Over'}</td></tr>
            <tr><td>DPO</td><td>${dpo} days</td><td>${dpoTarget} days</td><td class="${statusIcon(dpo, bench.dpo.min, false)}">${dpo >= bench.dpo.min ? 'On target' : 'Under'}</td></tr>
            <tr class="subtotal"><td>CCC</td><td>${ccc} days</td><td>${Math.max(cccTarget, 0)} days</td><td class="${ccc <= Math.max(cccTarget, cccT.good) ? 'ok' : ccc <= cccT.warn ? 'warn' : 'danger'}">${ccc <= Math.max(cccTarget, cccT.good) ? 'On target' : 'Over'}</td></tr>
        `;
    }

    // FCF table
    const fcfBody = document.getElementById('techFCFBody');
    if (fcfBody) {
        const loanRepayments = current.loanRepayments || 0;
        const capex = current.assetPurchases || 0;
        // Rough FCF calc for display
        const wcChanges = 0; // simplified — detailed WC changes would need previous data
        const fcf = netProfit - capex;
        const surplus = fcf - loanRepayments;
        fcfBody.innerHTML = `
            <tr><td>Net Profit</td><td>${currency} ${formatNumber(netProfit)}</td></tr>
            <tr><td>Equipment & asset purchases</td><td>(${currency} ${formatNumber(capex)})</td></tr>
            <tr class="subtotal"><td>Cash Generated (FCF)</td><td>${currency} ${formatNumber(fcf)}</td></tr>
            ${loanRepayments > 0 ? `
            <tr><td>Loan payments</td><td>(${currency} ${formatNumber(loanRepayments)})</td></tr>
            <tr class="subtotal"><td>Cash after loan payments</td><td>${currency} ${formatNumber(surplus)}</td></tr>
            ` : ''}
        `;
    }
}

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
