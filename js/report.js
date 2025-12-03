// ===== PlainFinance - Report Page Logic (Simplified Language) =====

// Load data from localStorage (from API response)
document.addEventListener('DOMContentLoaded', () => {
    // First try the new API response format
    const storedReport = localStorage.getItem('plainfinance_report');

    if (storedReport) {
        const reportData = JSON.parse(storedReport);
        populateReportFromAPI(reportData);
    } else {
        // Fallback to old format or sample data
        const storedData = localStorage.getItem('plainfinance_data');
        if (storedData) {
            const data = JSON.parse(storedData);
            populateReport(data);
        } else {
            // Use sample data for demo
            populateReportWithSampleData();
        }
    }

    // Set generated date
    document.getElementById('generatedDate').textContent = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
});

// Populate report from API response (includes AI analysis)
function populateReportFromAPI(reportData) {
    const currency = reportData.company?.currency || 'AED';
    const current = reportData.current;
    const previous = reportData.previous || {};
    const metrics = reportData.metrics;
    const analysis = reportData.analysis;

    // Company Info
    if (reportData.company) {
        document.getElementById('companyName').textContent = reportData.company.name || 'Your Company';
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const period = `${monthNames[parseInt(reportData.company.period.month) - 1]} ${reportData.company.period.year}`;
        document.getElementById('reportPeriod').textContent = period;
        document.getElementById('currency').textContent = currency;
    }

    if (current && metrics) {
        // Section 1: Did You Make Money? (with AI hero summary)
        updateHeroSectionFromAPI(current, metrics, currency, analysis);

        // Section 2: 5 Key Numbers
        updateKeyMetrics(current, previous, metrics, currency);

        // Section 3: Comparison Chart
        if (previous && previous.revenue) {
            renderComparisonChart(current, previous, currency);
        }

        // Section 4: Industry Benchmarks
        if (reportData.benchmarks) {
            updateBenchmarkSection(metrics, reportData.benchmarks);
        }

        // Section 5: Cash Flow Story (with AI explanation)
        updateCashFlowStoryFromAPI(metrics, currency, analysis);

        // Section 5: Actions (from AI)
        updateActionsFromAPI(current, metrics, currency, analysis);

        // Section 6: Bills Check
        updateBillsCheck(metrics, currency);

        // Section 7: VAT Summary (if data available)
        if (metrics.hasVatData) {
            updateVatSection(metrics, currency);
        }

        // Section 8: Meeting Summary (from AI)
        updateMeetingSummaryFromAPI(analysis);
    }
}

function updateHeroSectionFromAPI(current, metrics, currency, analysis) {
    const netProfit = current.netProfit || 0;
    const heroAnswer = document.getElementById('heroAnswer');

    // Update profit amount
    document.getElementById('netProfitAmount').textContent = formatNumber(Math.abs(netProfit));

    // Update status
    const statusEl = heroAnswer.querySelector('.hero-status');
    if (netProfit > 0) {
        statusEl.className = 'hero-status good';
        statusEl.innerHTML = '<span class="status-text">Yes, you made a profit</span>';
    } else if (netProfit === 0) {
        statusEl.className = 'hero-status warning';
        statusEl.innerHTML = '<span class="status-text">You broke even (no profit, no loss)</span>';
    } else {
        statusEl.className = 'hero-status danger';
        statusEl.innerHTML = '<span class="status-text">No, you made a loss</span>';
    }

    // Use AI-generated explanation if available
    if (analysis && analysis.heroSummary) {
        document.getElementById('heroExplanation').innerHTML = analysis.heroSummary;
    } else {
        const marginPerAED = (metrics.netMargin / 100).toFixed(2);
        document.getElementById('heroExplanation').innerHTML = `
            From every <strong>${currency} 1</strong> of sales, you kept <strong>${currency} ${marginPerAED}</strong> as profit after all expenses.
        `;
    }
}

function updateCashFlowStoryFromAPI(metrics, currency, analysis) {
    document.getElementById('dioDisplay').textContent = `${metrics.dio} days`;
    document.getElementById('dsoDisplay').textContent = `${metrics.dso} days`;
    document.getElementById('dpoDisplay').textContent = `${metrics.dpo} days`;
    document.getElementById('cccDisplay').textContent = `${metrics.ccc} days`;

    // Update cycle result with AI explanation if available
    const cycleResult = document.getElementById('cashCycleResult');
    let status = metrics.ccc > 45 ? 'danger' : metrics.ccc > 20 ? 'warning' : 'good';

    let message;
    if (analysis && analysis.cashCycleExplanation) {
        message = `<strong>Your cash is tied up for ${metrics.ccc} days</strong>
            <p>${analysis.cashCycleExplanation}</p>`;
    } else {
        if (metrics.ccc > 45) {
            message = `<strong>Your cash is tied up for ${metrics.ccc} days</strong>
                <p>That's too long. You're financing your customers and inventory while waiting to get paid.</p>`;
        } else if (metrics.ccc > 20) {
            message = `<strong>Your cash is tied up for ${metrics.ccc} days</strong>
                <p>You pay suppliers in ${metrics.dpo} days but wait ${metrics.dso} days to get paid. Plus stock sits for ${metrics.dio} days.</p>`;
        } else {
            message = `<strong>Your cash cycle is healthy at ${metrics.ccc} days</strong>
                <p>Money moves through your business efficiently. Keep it this way.</p>`;
        }
    }

    cycleResult.innerHTML = `<div class="cycle-summary ${status}">
        <div class="cycle-number">${metrics.ccc} days</div>
        <div class="cycle-text">${message}</div>
    </div>`;
}

function updateActionsFromAPI(current, metrics, currency, analysis) {
    const actionList = document.getElementById('actionList');

    // Use AI-generated actions if available
    if (analysis && analysis.action1Title) {
        const actions = [
            { title: analysis.action1Title, description: analysis.action1Desc },
            { title: analysis.action2Title, description: analysis.action2Desc },
            { title: analysis.action3Title, description: analysis.action3Desc }
        ].filter(a => a.title && a.description);

        actionList.innerHTML = actions.map((action, i) => `
            <div class="action-item priority-${i + 1}">
                <div class="action-number">${i + 1}</div>
                <div class="action-content">
                    <h3>${action.title}</h3>
                    <p>${action.description}</p>
                </div>
            </div>
        `).join('');
    } else {
        // Fallback to default logic
        updateActions(current, metrics, currency);
    }
}

function updateMeetingSummaryFromAPI(analysis) {
    const summary = document.getElementById('meetingSummary');

    if (analysis && analysis.meetingSummary) {
        summary.innerHTML = `<blockquote>"${analysis.meetingSummary}"</blockquote>`;
    }
}

function populateReportWithSampleData() {
    const sampleData = {
        company: {
            name: 'Gulf Trading LLC',
            industry: 'product',
            period: { month: '11', year: '2024' },
            currency: 'AED'
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
            otherLiabilities: 0
        },
        previous: {
            revenue: 465000,
            netProfit: 60000,
            cash: 72000,
            receivables: 145000,
            inventory: 185000,
            payables: 88000
        },
        includeComparison: true
    };
    populateReport(sampleData);
}

function populateReport(data) {
    const currency = data.company?.currency || 'AED';
    const current = data.current;
    const previous = data.previous || {};
    const daysInMonth = 30;

    // Company Info
    if (data.company) {
        document.getElementById('companyName').textContent = data.company.name || 'Your Company';
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const period = `${monthNames[parseInt(data.company.period.month) - 1]} ${data.company.period.year}`;
        document.getElementById('reportPeriod').textContent = period;
        document.getElementById('currency').textContent = currency;
    }

    if (current) {
        // Calculate all metrics
        const metrics = calculateMetrics(current, previous, daysInMonth);

        // Section 1: Did You Make Money?
        updateHeroSection(current, metrics, currency);

        // Section 2: 5 Key Numbers
        updateKeyMetrics(current, previous, metrics, currency);

        // Section 3: Comparison Chart
        if (data.includeComparison && previous.revenue) {
            renderComparisonChart(current, previous, currency);
        }

        // Section 4: Cash Flow Story
        updateCashFlowStory(metrics, currency);

        // Section 5: Actions
        updateActions(current, metrics, currency);

        // Section 6: Bills Check
        updateBillsCheck(metrics, currency);

        // Section 7: Meeting Summary
        updateMeetingSummary(current, previous, metrics, currency);
    }
}

function calculateMetrics(current, previous, days) {
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

    // Profitability
    const grossProfit = revenue - cogs;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    // Balance sheet
    const totalCurrentAssets = cash + receivables + inventory;
    const totalCurrentLiabilities = payables + shortTermLoans + otherLiabilities;
    const workingCapital = totalCurrentAssets - totalCurrentLiabilities;

    // Ratios
    const currentRatio = totalCurrentLiabilities > 0 ? totalCurrentAssets / totalCurrentLiabilities : 0;
    const quickRatio = totalCurrentLiabilities > 0 ? (cash + receivables) / totalCurrentLiabilities : 0;

    // Working capital cycle
    const dso = revenue > 0 ? (receivables / revenue) * days : 0;
    const dio = cogs > 0 ? (inventory / cogs) * days : 0;
    const dpo = cogs > 0 ? (payables / cogs) * days : 0;
    const ccc = dso + dio - dpo;

    // Cash runway
    const monthlyBurn = opex;
    const cashRunway = monthlyBurn > 0 ? cash / monthlyBurn : 0;

    // Changes
    const revenueChange = previous.revenue ? ((revenue - previous.revenue) / previous.revenue) * 100 : null;
    const profitChange = previous.netProfit !== undefined ? ((netProfit - previous.netProfit) / Math.abs(previous.netProfit || 1)) * 100 : null;
    const cashChange = previous.cash ? ((cash - previous.cash) / previous.cash) * 100 : null;

    return {
        grossProfit, grossMargin, netMargin,
        totalCurrentAssets, totalCurrentLiabilities, workingCapital,
        currentRatio, quickRatio,
        dso, dio, dpo, ccc,
        cashRunway,
        revenueChange, profitChange, cashChange
    };
}

function updateHeroSection(current, metrics, currency) {
    const netProfit = current.netProfit || 0;
    const heroAnswer = document.getElementById('heroAnswer');

    // Update profit amount
    document.getElementById('netProfitAmount').textContent = formatNumber(Math.abs(netProfit));

    // Update status
    const statusEl = heroAnswer.querySelector('.hero-status');
    if (netProfit > 0) {
        statusEl.className = 'hero-status good';
        statusEl.innerHTML = '<span class="status-text">Yes, you made a profit</span>';
    } else if (netProfit === 0) {
        statusEl.className = 'hero-status warning';
        statusEl.innerHTML = '<span class="status-text">You broke even (no profit, no loss)</span>';
    } else {
        statusEl.className = 'hero-status danger';
        statusEl.innerHTML = '<span class="status-text">No, you made a loss</span>';
    }

    // Update explanation
    const marginPerAED = (metrics.netMargin / 100).toFixed(2);
    document.getElementById('heroExplanation').innerHTML = `
        From every <strong>${currency} 1</strong> of sales, you kept <strong>${currency} ${marginPerAED}</strong> as profit after all expenses.
    `;
}

function updateKeyMetrics(current, previous, metrics, currency) {
    // Revenue
    document.getElementById('revenueValue').textContent = `${currency} ${formatNumber(current.revenue)}`;
    if (metrics.revenueChange !== null) {
        const revenueChangeEl = document.getElementById('revenueChange');
        revenueChangeEl.textContent = `${metrics.revenueChange >= 0 ? '▲' : '▼'} ${Math.abs(metrics.revenueChange).toFixed(1)}% vs last month`;
        revenueChangeEl.className = `metric-change ${metrics.revenueChange >= 0 ? 'positive' : 'negative'}`;
        updateMetricStatus('revenueMetric', metrics.revenueChange >= 0 ? 'good' : 'warning');
    }

    // Gross Margin
    document.getElementById('grossMarginValue').textContent = `${metrics.grossMargin.toFixed(0)}%`;
    const marginStatus = metrics.grossMargin >= 25 ? 'good' : metrics.grossMargin >= 15 ? 'warning' : 'danger';
    updateMetricStatus('marginMetric', marginStatus);

    // Cash
    document.getElementById('cashValue').textContent = `${currency} ${formatNumber(current.cash)}`;
    if (metrics.cashChange !== null) {
        const cashChangeEl = document.getElementById('cashChange');
        cashChangeEl.textContent = `${metrics.cashChange >= 0 ? '▲' : '▼'} ${Math.abs(metrics.cashChange).toFixed(0)}% vs last month`;
        cashChangeEl.className = `metric-change ${metrics.cashChange >= 0 ? 'positive' : 'negative'}`;
    }
    const cashStatus = metrics.cashRunway >= 3 ? 'good' : metrics.cashRunway >= 1 ? 'warning' : 'danger';
    updateMetricStatus('cashMetric', cashStatus);

    // Cash Runway
    document.getElementById('runwayValue').textContent = `${metrics.cashRunway.toFixed(1)} months`;
    updateMetricStatus('runwayMetric', cashStatus);

    // Receivables
    document.getElementById('arValue').textContent = `${currency} ${formatNumber(current.receivables)}`;
    document.getElementById('arChange').textContent = `They pay in ~${Math.round(metrics.dso)} days`;
    const arStatus = metrics.dso <= 30 ? 'good' : metrics.dso <= 45 ? 'warning' : 'danger';
    updateMetricStatus('arMetric', arStatus);
}

function updateMetricStatus(metricId, status) {
    const metric = document.getElementById(metricId);
    if (metric) {
        const statusEl = metric.querySelector('.metric-status');
        if (statusEl) {
            statusEl.className = `metric-status ${status}`;
        }
    }
}

function updateBenchmarkSection(metrics, benchmarks) {
    const grid = document.getElementById('benchmarkGrid');
    const industryName = document.getElementById('industryName');

    if (!grid) return;

    industryName.textContent = benchmarks.name || 'businesses';

    const benchmarkItems = [
        {
            label: 'Gross Margin',
            value: metrics.grossMargin,
            unit: '%',
            benchmark: benchmarks.grossMargin,
            higherIsBetter: true
        },
        {
            label: 'Net Margin',
            value: metrics.netMargin,
            unit: '%',
            benchmark: benchmarks.netMargin,
            higherIsBetter: true
        },
        {
            label: 'Current Ratio',
            value: metrics.currentRatio,
            unit: '',
            benchmark: benchmarks.currentRatio,
            higherIsBetter: true
        },
        {
            label: 'Days Sales Outstanding',
            value: metrics.dso,
            unit: ' days',
            benchmark: benchmarks.dso,
            higherIsBetter: false
        }
    ];

    grid.innerHTML = benchmarkItems.map(item => {
        const status = getBenchmarkStatus(item.value, item.benchmark, item.higherIsBetter);
        const position = getBenchmarkPosition(item.value, item.benchmark);

        return `
            <div class="benchmark-item ${status}">
                <div class="benchmark-header">
                    <span class="benchmark-label">${item.label}</span>
                    <span class="benchmark-status-icon">${status === 'good' ? '✓' : status === 'warning' ? '!' : '✗'}</span>
                </div>
                <div class="benchmark-value">${item.value}${item.unit}</div>
                <div class="benchmark-bar">
                    <div class="benchmark-range" style="left: 0%; width: 100%;"></div>
                    <div class="benchmark-ideal" style="left: ${position.idealPos}%"></div>
                    <div class="benchmark-marker ${status}" style="left: ${position.valuePos}%"></div>
                </div>
                <div class="benchmark-range-labels">
                    <span>${item.benchmark.min}${item.unit}</span>
                    <span class="benchmark-typical">Typical: ${item.benchmark.min}-${item.benchmark.max}${item.unit}</span>
                    <span>${item.benchmark.max}${item.unit}</span>
                </div>
            </div>
        `;
    }).join('');
}

function getBenchmarkStatus(value, benchmark, higherIsBetter) {
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

function getBenchmarkPosition(value, benchmark) {
    const range = benchmark.max - benchmark.min;
    const extendedMin = benchmark.min - range * 0.3;
    const extendedMax = benchmark.max + range * 0.3;
    const totalRange = extendedMax - extendedMin;

    const valuePos = Math.max(0, Math.min(100, ((value - extendedMin) / totalRange) * 100));
    const idealPos = ((benchmark.ideal - extendedMin) / totalRange) * 100;

    return { valuePos, idealPos };
}

function renderComparisonChart(current, previous, currency) {
    const ctx = document.getElementById('comparisonChart').getContext('2d');

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Revenue', 'Profit', 'Cash', 'Receivables'],
            datasets: [
                {
                    label: 'Last Month',
                    data: [previous.revenue || 0, previous.netProfit || 0, previous.cash || 0, previous.receivables || 0],
                    backgroundColor: '#94a3b8',
                    borderRadius: 6
                },
                {
                    label: 'This Month',
                    data: [current.revenue, current.netProfit, current.cash, current.receivables],
                    backgroundColor: '#1e3a5f',
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${currency} ${formatNumber(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                            if (value >= 1000) return (value / 1000).toFixed(0) + 'K';
                            return value;
                        }
                    }
                }
            }
        }
    });
}

function updateCashFlowStory(metrics, currency) {
    document.getElementById('dioDisplay').textContent = `${Math.round(metrics.dio)} days`;
    document.getElementById('dsoDisplay').textContent = `${Math.round(metrics.dso)} days`;
    document.getElementById('dpoDisplay').textContent = `${Math.round(metrics.dpo)} days`;
    document.getElementById('cccDisplay').textContent = `${Math.round(metrics.ccc)} days`;

    // Update cycle result
    const cycleResult = document.getElementById('cashCycleResult');
    let status, message;

    if (metrics.ccc > 45) {
        status = 'danger';
        message = `<strong>Your cash is tied up for ${Math.round(metrics.ccc)} days</strong>
            <p>That's too long. You're financing your customers and inventory while waiting to get paid. This is why cash feels tight even when business is good.</p>`;
    } else if (metrics.ccc > 20) {
        status = 'warning';
        message = `<strong>Your cash is tied up for ${Math.round(metrics.ccc)} days</strong>
            <p>You pay suppliers in ${Math.round(metrics.dpo)} days but wait ${Math.round(metrics.dso)} days to get paid. Plus stock sits for ${Math.round(metrics.dio)} days. That's ${Math.round(metrics.ccc)} days where your money is stuck and you can't use it.</p>`;
    } else {
        status = 'good';
        message = `<strong>Your cash cycle is healthy at ${Math.round(metrics.ccc)} days</strong>
            <p>Money moves through your business efficiently. Keep it this way by maintaining your collection and payment habits.</p>`;
    }

    cycleResult.innerHTML = `<div class="cycle-summary ${status}">
        <div class="cycle-number">${Math.round(metrics.ccc)} days</div>
        <div class="cycle-text">${message}</div>
    </div>`;
}

function updateActions(current, metrics, currency) {
    const actionList = document.getElementById('actionList');
    const actions = [];

    // Priority 1: Cash/Runway issues
    if (metrics.cashRunway < 3) {
        const collectTarget = Math.round(current.receivables * 0.3);
        actions.push({
            priority: 1,
            title: `Collect ${currency} ${formatNumber(collectTarget)} from customers`,
            description: `You have ${currency} ${formatNumber(current.receivables)} waiting to be collected. Call or WhatsApp your top 3 customers who owe you money and agree on payment dates this week.`,
            result: `This adds ${currency} ${formatNumber(collectTarget)} to your bank account`
        });
    } else if (metrics.dso > 30) {
        actions.push({
            priority: 1,
            title: 'Speed up customer payments',
            description: `Customers take ${Math.round(metrics.dso)} days to pay you. Send reminders earlier (at day 15, not day 30) and offer a small discount for early payment.`,
            result: 'Gets cash into your account faster'
        });
    }

    // Priority 2: DPO issues
    if (metrics.dpo < 20) {
        actions.push({
            priority: actions.length + 1,
            title: 'Ask suppliers for 30-day payment terms',
            description: `You are paying suppliers in ${Math.round(metrics.dpo)} days, which is very fast. Call your main suppliers and ask if you can pay in 30 days instead.`,
            result: `Keeps cash in your account ${30 - Math.round(metrics.dpo)} days longer`
        });
    }

    // Priority 3: Expense/Margin issues
    if (metrics.grossMargin < 25) {
        actions.push({
            priority: actions.length + 1,
            title: 'Improve your profit per sale',
            description: `You keep only ${currency} ${(metrics.grossMargin / 100).toFixed(2)} from each ${currency} 1 of sales. Look at raising prices slightly or finding cheaper suppliers.`,
            result: 'More money stays with you from each sale'
        });
    }

    // Default: Cash protection
    if (metrics.cashRunway < 3 && actions.length < 3) {
        actions.push({
            priority: actions.length + 1,
            title: 'Pause non-essential spending',
            description: `With only ${metrics.cashRunway.toFixed(1)} months of cash safety, hold off on anything that is not critical: extra marketing, office upgrades, new equipment.`,
            result: 'Protects your cash buffer'
        });
    }

    // Fill remaining slots
    if (actions.length < 3 && metrics.dio > 30) {
        actions.push({
            priority: actions.length + 1,
            title: 'Reduce inventory levels',
            description: `Stock sits for ${Math.round(metrics.dio)} days before selling. Order smaller quantities more often instead of big bulk orders.`,
            result: `Frees up ${currency} ${formatNumber(current.inventory * 0.2)} tied up in stock`
        });
    }

    // Render actions
    actionList.innerHTML = actions.slice(0, 3).map((action, i) => `
        <div class="action-item priority-${i + 1}">
            <div class="action-number">${i + 1}</div>
            <div class="action-content">
                <h3>${action.title}</h3>
                <p>${action.description}</p>
                <div class="action-result">
                    <span>Result: ${action.result}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function updateVatSection(metrics, currency) {
    const vatSection = document.getElementById('vatSection');
    if (!vatSection) return;

    vatSection.style.display = 'block';

    document.getElementById('vatCollectedDisplay').textContent = `${currency} ${formatNumber(metrics.vatCollected)}`;
    document.getElementById('vatPaidDisplay').textContent = `${currency} ${formatNumber(metrics.vatPaid)}`;

    const vatPayableDisplay = document.getElementById('vatPayableDisplay');
    const vatResultItem = document.getElementById('vatResultItem');
    const vatResultHint = document.getElementById('vatResultHint');

    if (metrics.vatPayable > 0) {
        vatPayableDisplay.textContent = `${currency} ${formatNumber(metrics.vatPayable)}`;
        vatResultItem.className = 'vat-item result payable';
        vatResultHint.textContent = 'Amount due to Federal Tax Authority';
    } else if (metrics.vatPayable < 0) {
        vatPayableDisplay.textContent = `${currency} ${formatNumber(Math.abs(metrics.vatPayable))}`;
        vatResultItem.className = 'vat-item result refund';
        vatResultHint.textContent = 'VAT refund claimable from FTA';
    } else {
        vatPayableDisplay.textContent = `${currency} 0`;
        vatResultItem.className = 'vat-item result neutral';
        vatResultHint.textContent = 'No VAT due or refundable';
    }
}

function updateBillsCheck(metrics, currency) {
    const billsCheck = document.querySelector('.bills-check');

    let shortTermStatus, shortTermMessage;
    if (metrics.currentRatio >= 1.5) {
        shortTermStatus = 'good';
        shortTermMessage = `<strong>Short-term: Yes</strong>
            <p>You have ${currency} ${metrics.currentRatio.toFixed(2)} of assets for every ${currency} 1 you owe soon. That's healthy.</p>`;
    } else if (metrics.currentRatio >= 1) {
        shortTermStatus = 'warning';
        shortTermMessage = `<strong>Short-term: Just about</strong>
            <p>You have ${currency} ${metrics.currentRatio.toFixed(2)} of assets for every ${currency} 1 you owe. That's tight - aim for 1.5 or higher.</p>`;
    } else {
        shortTermStatus = 'danger';
        shortTermMessage = `<strong>Short-term: Risky</strong>
            <p>You have only ${currency} ${metrics.currentRatio.toFixed(2)} for every ${currency} 1 you owe. You may struggle to pay upcoming bills.</p>`;
    }

    let cashWarning = '';
    if (metrics.quickRatio < metrics.currentRatio * 0.7) {
        cashWarning = `<div class="bills-item warning">
            <div class="bills-content">
                <strong>But watch your cash</strong>
                <p>Most of your assets are in stock and customer IOUs, not actual cash. If customers pay late or stock does not sell, you could still face a crunch.</p>
            </div>
        </div>`;
    }

    billsCheck.innerHTML = `
        <div class="bills-item ${shortTermStatus}">
            <div class="bills-content">${shortTermMessage}</div>
        </div>
        ${cashWarning}
    `;
}

function updateMeetingSummary(current, previous, metrics, currency) {
    const summary = document.getElementById('meetingSummary');

    let revenueStatement = `Sales are ${currency} ${formatNumber(current.revenue)} this month`;
    if (metrics.revenueChange !== null) {
        revenueStatement = `Sales are ${metrics.revenueChange >= 0 ? 'up' : 'down'} ${Math.abs(metrics.revenueChange).toFixed(1)}% this month at ${currency} ${formatNumber(current.revenue)}`;
    }

    let profitStatement = '';
    if (current.netProfit > 0) {
        profitStatement = `, and we are profitable with ${currency} ${formatNumber(current.netProfit)} net profit (${metrics.netMargin.toFixed(0)}% margin)`;
    } else if (current.netProfit === 0) {
        profitStatement = `, and we are breaking even this month`;
    } else {
        profitStatement = `, though we had a loss of ${currency} ${formatNumber(Math.abs(current.netProfit))} this month`;
    }

    let focusStatement = '';
    if (metrics.cashRunway < 3) {
        focusStatement = `Our main focus right now is improving cash flow. We have ${metrics.cashRunway.toFixed(1)} months of runway and ${currency} ${formatNumber(current.receivables)} in receivables to collect.`;
    } else if (metrics.dpo < 20) {
        focusStatement = `We are working on cash flow optimization, specifically extending our payment terms with suppliers beyond the current ${Math.round(metrics.dpo)} days.`;
    } else {
        focusStatement = `Cash position is stable with ${metrics.cashRunway.toFixed(1)} months runway.`;
    }

    summary.innerHTML = `<blockquote>
        "${revenueStatement}${profitStatement}. ${focusStatement} Current ratio is ${metrics.currentRatio >= 1.5 ? 'healthy' : 'adequate'} at ${metrics.currentRatio.toFixed(2)}."
    </blockquote>`;
}

function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    return Math.abs(num).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

// ===== WhatsApp Share =====

function shareWhatsApp() {
    const companyName = document.getElementById('companyName').textContent || 'My Company';
    const period = document.getElementById('reportPeriod').textContent || '';
    const currency = document.getElementById('currency').textContent || 'AED';
    const netProfit = document.getElementById('netProfitAmount').textContent || '0';
    const revenue = document.getElementById('revenueValue').textContent || '';
    const cashRunway = document.getElementById('runwayValue').textContent || '';
    const heroStatus = document.querySelector('.hero-status .status-text')?.textContent || '';

    // Build summary message
    const message = `*${companyName} - ${period}*

${heroStatus}

Key Numbers:
- Revenue: ${revenue}
- Net Profit: ${currency} ${netProfit}
- Cash Runway: ${cashRunway}

Generated by PlainFinance
https://plainfinance.co`;

    // Encode for WhatsApp URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
}

// ===== PDF Download =====

function downloadPDF() {
    const reportContainer = document.querySelector('.report-container');
    const companyName = document.getElementById('companyName').textContent || 'Report';
    const period = document.getElementById('reportPeriod').textContent || '';
    const filename = `${companyName.replace(/\s+/g, '_')}_${period.replace(/\s+/g, '_')}.pdf`;

    // Hide nav for PDF
    const nav = document.querySelector('.nav-report');
    nav.style.display = 'none';

    const options = {
        margin: [10, 10, 10, 10],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(options).from(reportContainer).save().then(() => {
        nav.style.display = '';
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

async function sendEmail() {
    const emailInput = document.getElementById('emailAddress');
    const email = emailInput.value.trim();
    const statusEl = document.getElementById('emailStatus');
    const sendBtn = document.getElementById('sendEmailBtn');

    // Validate email
    if (!email || !email.includes('@')) {
        statusEl.textContent = 'Please enter a valid email address';
        statusEl.className = 'modal-status error';
        return;
    }

    // Show loading
    statusEl.textContent = 'Generating PDF and sending...';
    statusEl.className = 'modal-status loading';
    sendBtn.disabled = true;

    try {
        // Generate PDF as base64
        const reportContainer = document.querySelector('.report-container');
        const nav = document.querySelector('.nav-report');
        nav.style.display = 'none';

        const options = {
            margin: [10, 10, 10, 10],
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        const pdfBlob = await html2pdf().set(options).from(reportContainer).outputPdf('blob');
        nav.style.display = '';

        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(pdfBlob);

        reader.onloadend = async () => {
            const base64data = reader.result.split(',')[1];
            const companyName = document.getElementById('companyName').textContent || 'Your Company';
            const period = document.getElementById('reportPeriod').textContent || '';

            // Send to API
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    companyName: companyName,
                    period: period,
                    pdfBase64: base64data
                })
            });

            const result = await response.json();

            if (result.success) {
                statusEl.textContent = 'Report sent successfully. Check your inbox.';
                statusEl.className = 'modal-status success';
                setTimeout(() => {
                    closeEmailModal();
                }, 2000);
            } else {
                throw new Error(result.error || 'Failed to send email');
            }
        };

    } catch (error) {
        console.error('Email error:', error);
        statusEl.textContent = 'Failed to send email. Please try again.';
        statusEl.className = 'modal-status error';
    } finally {
        sendBtn.disabled = false;
    }
}

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeEmailModal();
    }
});

// Close modal on overlay click
document.getElementById('emailModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'emailModal') {
        closeEmailModal();
    }
});
