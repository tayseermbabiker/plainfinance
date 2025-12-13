// ===== PlainFinancials - Report Page Logic (Simplified Language) =====

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
    const ytdMetrics = reportData.ytdMetrics || null;
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
        updateHeroSectionFromAPI(current, metrics, currency, analysis, ytdMetrics);

        // Section 2: 5 Key Numbers
        updateKeyMetrics(current, previous, metrics, currency, ytdMetrics);

        // Section 3: Comparison Chart
        if (previous && previous.revenue) {
            renderComparisonChart(current, previous, currency);
        }

        // Section 4: Industry Benchmarks
        const benchmarks = reportData.benchmarks || getDefaultBenchmarks(reportData.company?.industry);
        if (benchmarks) {
            updateBenchmarkSection(metrics, benchmarks);
        }

        // Section 5: Cash Flow Story (with AI explanation)
        updateCashFlowStoryFromAPI(metrics, currency, analysis);

        // Section 5.5: Cash Bridge (Why Profit ≠ Cash) - Admin only for now
        updateCashBridge(current, previous, metrics, currency);

        // Section 5: Actions (from AI)
        updateActionsFromAPI(current, metrics, currency, analysis);

        // Section 6: Bills Check
        updateBillsCheck(metrics, currency);

        // Section 7: Cash Flow Forecast
        updateCashForecast(current, metrics, currency, reportData.company?.period);

        // Section 8: VAT Summary (if data available)
        if (metrics.hasVatData) {
            updateVatSection(metrics, currency);
        }

        // Section 9: Meeting Summary (from AI)
        updateMeetingSummaryFromAPI(analysis, metrics, current, currency);

        // Section 10: YTD Summary (if YTD data available)
        if (ytdMetrics) {
            updateYtdSummary(current, metrics, currency, ytdMetrics);
        }

        // Health Strip (Traffic Light)
        updateHealthStrip(current, metrics);

        // Owner Summary Box (WhatsApp-ready)
        updateOwnerSummary(current, metrics, currency, analysis);

        // Story of the Month - removed (redundant with hero + metrics)

        // Wins Celebration
        updateWinsCelebration(current, previous, metrics);

        // Go Deeper Box
        updateGoDeeperBox(current, metrics);
    }
}

function updateHeroSectionFromAPI(current, metrics, currency, analysis, ytdMetrics = null) {
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

    // YTD badge removed - YTD has its own section lower in the report
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

// Cash Bridge: Why Profit ≠ Cash
function updateCashBridge(current, previous, metrics, currency) {
    const section = document.getElementById('cashBridgeSection');
    if (!section) return;

    const netProfit = current.netProfit || 0;

    // Calculate changes in working capital items
    let receivablesChange = 0;
    let inventoryChange = 0;
    let payablesChange = 0;

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

    // Big cash movements (loans, drawings, assets)
    const loanRepayments = current.loanRepayments || 0;
    const ownerDrawings = current.ownerDrawings || 0;
    const assetPurchases = current.assetPurchases || 0;
    const hasBigMoves = loanRepayments > 0 || ownerDrawings > 0 || assetPurchases > 0;

    // Calculate totals
    const tiedUpTotal = receivablesChange + inventoryChange - payablesChange; // Positive = cash tied up
    const bigMovesTotal = loanRepayments + ownerDrawings + assetPurchases;
    const cashMovement = netProfit - tiedUpTotal - bigMovesTotal;

    // === STEP 1: Profit ===
    const profitEl = document.getElementById('bridgeNetProfit');
    profitEl.textContent = netProfit >= 0 ? `+ ${currency} ${formatNumber(netProfit)}` : `- ${currency} ${formatNumber(Math.abs(netProfit))}`;
    profitEl.className = netProfit >= 0 ? 'positive' : 'negative';

    // === STEP 2: Cash tied up in customers and stock ===
    const receivablesItem = document.getElementById('bridgeReceivablesItem');
    const receivablesEl = document.getElementById('bridgeReceivablesChange');
    if (receivablesChange !== 0) {
        receivablesItem.style.display = 'flex';
        receivablesItem.querySelector('span').textContent = receivablesChange > 0 ? 'Customers haven\'t paid you yet:' : 'Customers paid old invoices:';
        receivablesEl.textContent = receivablesChange > 0 ? `- ${currency} ${formatNumber(receivablesChange)}` : `+ ${currency} ${formatNumber(Math.abs(receivablesChange))}`;
        receivablesEl.className = receivablesChange > 0 ? 'negative' : 'positive';
    } else {
        receivablesItem.style.display = 'none';
    }

    const inventoryItem = document.getElementById('bridgeInventoryItem');
    const inventoryEl = document.getElementById('bridgeInventoryChange');
    if (inventoryChange !== 0) {
        inventoryItem.style.display = 'flex';
        inventoryItem.querySelector('span').textContent = inventoryChange > 0 ? 'You bought more stock:' : 'You sold down stock:';
        inventoryEl.textContent = inventoryChange > 0 ? `- ${currency} ${formatNumber(inventoryChange)}` : `+ ${currency} ${formatNumber(Math.abs(inventoryChange))}`;
        inventoryEl.className = inventoryChange > 0 ? 'negative' : 'positive';
    } else {
        inventoryItem.style.display = 'none';
    }

    const payablesItem = document.getElementById('bridgePayablesItem');
    const payablesEl = document.getElementById('bridgePayablesChange');
    if (payablesChange !== 0) {
        payablesItem.style.display = 'flex';
        document.getElementById('bridgePayablesLabel').textContent = payablesChange > 0 ? 'Delayed paying suppliers:' : 'Paid suppliers faster:';
        payablesEl.textContent = payablesChange > 0 ? `+ ${currency} ${formatNumber(payablesChange)}` : `- ${currency} ${formatNumber(Math.abs(payablesChange))}`;
        payablesEl.className = payablesChange > 0 ? 'positive' : 'negative';
    } else {
        payablesItem.style.display = 'none';
    }

    // Tied up total
    const tiedUpEl = document.getElementById('bridgeTiedUpTotal');
    tiedUpEl.textContent = tiedUpTotal >= 0 ? `- ${currency} ${formatNumber(tiedUpTotal)}` : `+ ${currency} ${formatNumber(Math.abs(tiedUpTotal))}`;
    tiedUpEl.className = tiedUpTotal >= 0 ? 'negative' : 'positive';

    // === STEP 3: Big cash movements ===
    const bigMovesSection = document.getElementById('bridgeBigMovesSection');
    if (hasBigMoves) {
        bigMovesSection.style.display = 'block';

        const loanItem = document.getElementById('bridgeLoanItem');
        if (loanRepayments > 0) {
            loanItem.style.display = 'flex';
            document.getElementById('bridgeLoanRepayments').textContent = `- ${currency} ${formatNumber(loanRepayments)}`;
        } else {
            loanItem.style.display = 'none';
        }

        const drawingsItem = document.getElementById('bridgeDrawingsItem');
        if (ownerDrawings > 0) {
            drawingsItem.style.display = 'flex';
            document.getElementById('bridgeOwnerDrawings').textContent = `- ${currency} ${formatNumber(ownerDrawings)}`;
        } else {
            drawingsItem.style.display = 'none';
        }

        const assetsItem = document.getElementById('bridgeAssetsItem');
        if (assetPurchases > 0) {
            assetsItem.style.display = 'flex';
            document.getElementById('bridgeAssetPurchases').textContent = `- ${currency} ${formatNumber(assetPurchases)}`;
        } else {
            assetsItem.style.display = 'none';
        }

        document.getElementById('bridgeBigMovesTotal').textContent = `- ${currency} ${formatNumber(bigMovesTotal)}`;
    } else {
        bigMovesSection.style.display = 'none';
    }

    // === STEP 4: Final reconciliation ===
    const finalProfitEl = document.getElementById('bridgeFinalProfit');
    finalProfitEl.textContent = netProfit >= 0 ? `+ ${currency} ${formatNumber(netProfit)}` : `- ${currency} ${formatNumber(Math.abs(netProfit))}`;
    finalProfitEl.className = netProfit >= 0 ? 'positive' : 'negative';

    const finalTiedUpEl = document.getElementById('bridgeFinalTiedUp');
    finalTiedUpEl.textContent = tiedUpTotal >= 0 ? `- ${currency} ${formatNumber(tiedUpTotal)}` : `+ ${currency} ${formatNumber(Math.abs(tiedUpTotal))}`;
    finalTiedUpEl.className = tiedUpTotal >= 0 ? 'negative' : 'positive';

    const finalBigMovesLine = document.getElementById('bridgeFinalBigMovesLine');
    const finalBigMovesEl = document.getElementById('bridgeFinalBigMoves');
    if (hasBigMoves) {
        finalBigMovesLine.style.display = 'flex';
        finalBigMovesEl.textContent = `- ${currency} ${formatNumber(bigMovesTotal)}`;
    } else {
        finalBigMovesLine.style.display = 'none';
    }

    // Final total
    const cashMovementEl = document.getElementById('bridgeCashMovement');
    cashMovementEl.textContent = cashMovement >= 0 ? `+ ${currency} ${formatNumber(cashMovement)}` : `- ${currency} ${formatNumber(Math.abs(cashMovement))}`;
    cashMovementEl.className = cashMovement >= 0 ? 'positive' : 'negative';

    // Update title based on cash direction
    const titleEl = document.getElementById('bridgeTitle');
    const subtitleEl = document.getElementById('bridgeSubtitle');
    const finalHeaderEl = document.getElementById('bridgeFinalHeader');

    if (cashMovement < 0) {
        titleEl.textContent = 'Why your cash dropped this month';
        subtitleEl.textContent = `Your bank balance fell by ${currency} ${formatNumber(Math.abs(cashMovement))}. Here's where the cash went.`;
        finalHeaderEl.textContent = 'How your bank balance changed';
    } else {
        titleEl.textContent = 'Where did your cash go this month?';
        subtitleEl.textContent = 'Start from your profit, then see how customers, stock, loans and big purchases changed your bank balance.';
        finalHeaderEl.textContent = 'How your bank balance changed';
    }

    // === EXPLANATION ===
    let explanation = '';
    const reasons = [];

    if (netProfit < 0) reasons.push('you made a loss');
    else if (netProfit > 0) reasons.push('you made a profit');

    if (tiedUpTotal > 0) reasons.push('cash got tied up in customers and stock');
    if (hasBigMoves) reasons.push('large loan and equipment payments went out');

    if (cashMovement < 0) {
        if (reasons.length > 0) {
            explanation = `Cash dropped because ${reasons.join(', ')}.`;
        } else {
            explanation = 'Cash dropped this month.';
        }
    } else if (cashMovement > 0) {
        explanation = 'Your profit turned into actual cash this month.';
    } else {
        explanation = 'Cash stayed roughly the same.';
    }

    document.getElementById('bridgeSummaryExplanation').textContent = explanation;

    // === CASH WARNING (for severe drops) ===
    const warningEl = document.getElementById('bridgeWarning');
    const warningTitleEl = document.getElementById('bridgeWarningTitle');
    const warningTextEl = document.getElementById('bridgeWarningText');
    const endingCash = current.cash || 0;

    // Show warning if cash dropped significantly (more than 50% of ending cash, or if ending cash is very low)
    const severeDropThreshold = endingCash * 0.5;
    const isSevereDrop = cashMovement < 0 && Math.abs(cashMovement) > severeDropThreshold;
    const isLowCash = endingCash < (current.opex || 0); // Less than 1 month of expenses

    if (isSevereDrop || isLowCash) {
        warningEl.style.display = 'flex';

        if (endingCash <= 0) {
            warningTitleEl.textContent = 'URGENT: Cash is exhausted';
            warningTextEl.textContent = 'Your ending cash is effectively zero or negative. You need immediate action (cut payments, raise cash, or both) to avoid bounced payments.';
            warningEl.className = 'bridge-warning bridge-warning-critical';
        } else if (isLowCash) {
            warningTitleEl.textContent = 'Cash warning - running very low';
            warningTextEl.textContent = `You have less than 1 month of expenses in the bank. This is a high-risk situation that needs urgent attention.`;
            warningEl.className = 'bridge-warning bridge-warning-severe';
        } else {
            warningTitleEl.textContent = 'Cash warning - your bank balance plunged';
            warningTextEl.textContent = 'This is a severe cash outflow. If this continues, you risk running out of cash soon.';
            warningEl.className = 'bridge-warning bridge-warning-severe';
        }
    } else {
        warningEl.style.display = 'none';
    }
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

function updateMeetingSummaryFromAPI(analysis, metrics, current, currency) {
    const summary = document.getElementById('meetingSummary');

    if (analysis && analysis.meetingSummary) {
        summary.innerHTML = `<blockquote>"${analysis.meetingSummary}"</blockquote>`;
    }

    // Update strength and risk talking points
    updateTalkingPoints(metrics, current, currency);
}

function updateTalkingPoints(metrics, current, currency) {
    const strengthEl = document.getElementById('summaryStrength');
    const riskEl = document.getElementById('summaryRisk');

    if (!strengthEl || !riskEl || !metrics) return;

    // Determine strength
    let strength = '';
    if (metrics.grossMargin >= 25) {
        strength = `Gross margin is healthy at ${metrics.grossMargin.toFixed(0)}%`;
    } else if (metrics.currentRatio >= 1.5) {
        strength = `Current ratio is strong at ${metrics.currentRatio.toFixed(2)}`;
    } else if (metrics.dso <= 30) {
        strength = `Collecting from customers quickly (${Math.round(metrics.dso)} days)`;
    } else if (current.netProfit > 0) {
        strength = `Profitable this month (${currency} ${formatNumber(current.netProfit)})`;
    } else {
        strength = 'Business fundamentals are stable';
    }

    // Determine risk
    let risk = '';
    if (metrics.cashRunway >= 0 && metrics.cashRunway < 3) {
        risk = `Cash runway is only ${metrics.cashRunway.toFixed(1)} months`;
    } else if (metrics.dio > 60) {
        risk = `Cash tied up in inventory for ${Math.round(metrics.dio)} days`;
    } else if (metrics.dso > 45) {
        risk = `Customers taking ${Math.round(metrics.dso)} days to pay`;
    } else if (metrics.netMargin < 5) {
        risk = `Net margin is tight at ${metrics.netMargin.toFixed(1)}%`;
    } else if (metrics.dpo < 15) {
        risk = `Paying suppliers too fast (${Math.round(metrics.dpo)} days)`;
    } else {
        risk = 'No major concerns this month';
    }

    strengthEl.textContent = strength;
    riskEl.textContent = risk;
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
        const ytd = data.ytd || {};
        const metrics = calculateMetrics(current, previous, daysInMonth, ytd);

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

    // Cash runway - based on actual cash movement (Perplexity formula)
    // Priority: 1) YTD average burn, 2) Previous month burn, 3) OPEX fallback
    let monthlyBurn = 0;
    let cashRunway = 0;
    let runwayMethod = 'opex'; // Track which method was used

    // Priority 1: Use YTD average burn if we have starting cash and months elapsed
    if (ytd && ytd.startingCash > 0 && ytd.monthsElapsed > 0) {
        // Average Monthly Burn = (YTD Starting Cash - Current Cash) / Months Elapsed
        const ytdBurn = ytd.startingCash - cash;
        monthlyBurn = ytdBurn / ytd.monthsElapsed;
        runwayMethod = 'ytd';

        if (monthlyBurn > 0) {
            cashRunway = cash / monthlyBurn;
        } else {
            // Cash is growing over YTD period - no burn
            cashRunway = -1; // Special value: cash positive
        }
    }
    // Priority 2: Use previous month burn if available
    else if (previous && previous.cash !== undefined && previous.cash > 0) {
        monthlyBurn = previous.cash - cash; // Positive = burning, Negative = growing
        runwayMethod = 'monthly';

        if (monthlyBurn > 0) {
            cashRunway = cash / monthlyBurn;
        } else {
            cashRunway = -1; // Cash positive
        }
    }
    // Priority 3: Fallback to OPEX-based estimate
    else {
        monthlyBurn = opex;
        runwayMethod = 'opex';
        cashRunway = monthlyBurn > 0 ? cash / monthlyBurn : 0;
    }

    // Changes
    const revenueChange = previous.revenue ? ((revenue - previous.revenue) / previous.revenue) * 100 : null;
    const profitChange = previous.netProfit !== undefined ? ((netProfit - previous.netProfit) / Math.abs(previous.netProfit || 1)) * 100 : null;
    const cashChange = previous.cash ? ((cash - previous.cash) / previous.cash) * 100 : null;

    return {
        grossProfit, grossMargin, netMargin,
        totalCurrentAssets, totalCurrentLiabilities, workingCapital,
        currentRatio, quickRatio,
        dso, dio, dpo, ccc,
        cashRunway, runwayMethod,
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

function updateKeyMetrics(current, previous, metrics, currency, ytdMetrics = null) {
    // Revenue - always show vs last month (YTD has its own section)
    document.getElementById('revenueValue').textContent = `${currency} ${formatNumber(current.revenue)}`;
    const revenueChangeEl = document.getElementById('revenueChange');
    if (metrics.revenueChange !== null && metrics.revenueChange !== undefined) {
        revenueChangeEl.textContent = `${metrics.revenueChange >= 0 ? '▲' : '▼'} ${Math.abs(metrics.revenueChange).toFixed(1)}% vs last month`;
        revenueChangeEl.className = `metric-change ${metrics.revenueChange >= 0 ? 'positive' : 'negative'}`;
        updateMetricStatus('revenueMetric', metrics.revenueChange >= -10 ? 'good' : 'warning');
    } else {
        revenueChangeEl.textContent = 'No prior month data';
        revenueChangeEl.className = 'metric-change neutral';
        updateMetricStatus('revenueMetric', 'good');
    }

    // Gross Margin - show current month with industry benchmark
    document.getElementById('grossMarginValue').textContent = `${metrics.grossMargin.toFixed(0)}%`;
    const marginChangeEl = document.getElementById('marginChange');
    marginChangeEl.textContent = `Industry: 25-35% typical`;
    marginChangeEl.className = 'metric-change neutral';
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
    const runwayValueEl = document.getElementById('runwayValue');
    const runwayChangeEl = document.getElementById('runwayChange');

    // Determine method label for display
    const methodLabel = {
        'ytd': 'Based on YTD average burn',
        'monthly': 'Based on last month burn',
        'opex': 'Based on monthly expenses'
    }[metrics.runwayMethod] || 'Based on monthly expenses';

    if (metrics.cashRunway === -1) {
        // Cash positive - no burn
        runwayValueEl.textContent = 'Cash positive';
        runwayChangeEl.textContent = 'Your cash is growing, not burning';
        updateMetricStatus('runwayMetric', 'good');
    } else {
        runwayValueEl.textContent = `${metrics.cashRunway.toFixed(1)} months`;
        // Show method used and cash-out date
        const cashOutDate = new Date();
        cashOutDate.setMonth(cashOutDate.getMonth() + Math.floor(metrics.cashRunway));
        cashOutDate.setDate(cashOutDate.getDate() + Math.round((metrics.cashRunway % 1) * 30));
        const dateStr = cashOutDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        runwayChangeEl.textContent = `${methodLabel}`;
        updateMetricStatus('runwayMetric', cashStatus);
    }

    // Net Profit Margin (5th KPI) - show industry benchmark (YTD has its own section)
    const netMarginEl = document.getElementById('netMarginValue');
    const netMarginChangeEl = document.getElementById('netMarginChange');
    if (netMarginEl) {
        netMarginEl.textContent = `${metrics.netMargin.toFixed(0)}%`;
        // Always show industry benchmark - YTD comparison is in separate YTD section
        netMarginChangeEl.textContent = `Industry: 5-15% typical`;
        netMarginChangeEl.className = 'metric-change neutral';

        // Status logic: Green if healthy for industry, Amber if low but positive, Red if near zero/negative
        let netMarginStatus = 'good';
        if (metrics.netMargin < 3) {
            netMarginStatus = 'danger';
        } else if (metrics.netMargin < 8) {
            netMarginStatus = 'warning';
        }
        updateMetricStatus('netMarginMetric', netMarginStatus);

        // Check for GM vs NM gap - if gross margin is healthy but net margin is much lower
        updateMarginGapAlert(metrics);
    }
}

function updateMarginGapAlert(metrics) {
    const alertEl = document.getElementById('marginGapAlert');
    const alertTextEl = document.getElementById('marginGapText');
    if (!alertEl || !alertTextEl) return;

    // Show alert if:
    // 1. Gross margin is healthy (>=20%)
    // 2. Net margin is significantly lower (GM - NM gap >= 15 percentage points)
    // 3. Net margin is below 10%
    const marginGap = metrics.grossMargin - metrics.netMargin;
    const gmHealthy = metrics.grossMargin >= 20;
    const nmLow = metrics.netMargin < 10;
    const significantGap = marginGap >= 15;

    if (gmHealthy && nmLow && significantGap) {
        alertEl.style.display = 'flex';

        // Customize message based on situation
        if (metrics.netMargin < 3) {
            alertTextEl.textContent = `Your gross margin is ${metrics.grossMargin}% which is healthy, but your net margin is only ${metrics.netMargin}%. This ${marginGap.toFixed(0)} percentage point gap means overheads, finance costs, or owner drawings are consuming most of your profit.`;
        } else {
            alertTextEl.textContent = `Your gross margin is healthy at ${metrics.grossMargin}%, but net margin is ${metrics.netMargin}%. The ${marginGap.toFixed(0)} point gap suggests high operating costs or finance charges are eating into your profit. Review your overheads and loan interest.`;
        }
    } else {
        alertEl.style.display = 'none';
    }
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

// Default benchmark data when API doesn't return benchmarks
function getDefaultBenchmarks(industry) {
    const benchmarksByIndustry = {
        'retail': {
            name: 'Retail businesses',
            grossMargin: { min: 25, max: 50, ideal: 35 },
            netMargin: { min: 2, max: 10, ideal: 5 },
            currentRatio: { min: 1.2, max: 2.5, ideal: 1.8 },
            dso: { min: 15, max: 45, ideal: 30 }
        },
        'product': {
            name: 'Product-based businesses',
            grossMargin: { min: 30, max: 55, ideal: 40 },
            netMargin: { min: 5, max: 15, ideal: 10 },
            currentRatio: { min: 1.2, max: 2.5, ideal: 1.8 },
            dso: { min: 20, max: 45, ideal: 30 }
        },
        'service': {
            name: 'Service businesses',
            grossMargin: { min: 40, max: 70, ideal: 55 },
            netMargin: { min: 10, max: 25, ideal: 15 },
            currentRatio: { min: 1.0, max: 2.0, ideal: 1.5 },
            dso: { min: 25, max: 60, ideal: 40 }
        },
        'ecommerce': {
            name: 'E-commerce businesses',
            grossMargin: { min: 20, max: 45, ideal: 30 },
            netMargin: { min: 3, max: 12, ideal: 7 },
            currentRatio: { min: 1.0, max: 2.0, ideal: 1.5 },
            dso: { min: 5, max: 20, ideal: 10 }
        },
        'manufacturing': {
            name: 'Manufacturing businesses',
            grossMargin: { min: 20, max: 40, ideal: 30 },
            netMargin: { min: 3, max: 12, ideal: 7 },
            currentRatio: { min: 1.3, max: 2.5, ideal: 1.8 },
            dso: { min: 30, max: 60, ideal: 45 }
        },
        'wholesale': {
            name: 'Wholesale businesses',
            grossMargin: { min: 15, max: 30, ideal: 22 },
            netMargin: { min: 2, max: 8, ideal: 5 },
            currentRatio: { min: 1.2, max: 2.0, ideal: 1.5 },
            dso: { min: 25, max: 50, ideal: 35 }
        },
        'restaurant': {
            name: 'Restaurant businesses',
            grossMargin: { min: 55, max: 70, ideal: 62 },
            netMargin: { min: 3, max: 10, ideal: 6 },
            currentRatio: { min: 0.8, max: 1.5, ideal: 1.2 },
            dso: { min: 5, max: 15, ideal: 7 }
        },
        'construction': {
            name: 'Construction businesses',
            grossMargin: { min: 15, max: 35, ideal: 25 },
            netMargin: { min: 2, max: 10, ideal: 5 },
            currentRatio: { min: 1.2, max: 2.5, ideal: 1.7 },
            dso: { min: 45, max: 90, ideal: 60 }
        }
    };

    // Return industry-specific benchmarks or default to product-based
    return benchmarksByIndustry[industry?.toLowerCase()] || benchmarksByIndustry['product'];
}

function renderComparisonChart(current, previous, currency) {
    const chartEl = document.getElementById('comparisonChart');
    if (!chartEl) return; // Skip if comparison chart section was removed
    const ctx = chartEl.getContext('2d');

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

// YTD Summary Card
function updateYtdSummary(current, metrics, currency, ytdMetrics) {
    const ytdSection = document.getElementById('ytdSummarySection');
    if (!ytdSection || !ytdMetrics) {
        if (ytdSection) ytdSection.style.display = 'none';
        return;
    }

    ytdSection.style.display = 'block';

    // Calculate comparisons
    const revenueVsAvg = ytdMetrics.avgMonthlyRevenue > 0
        ? ((current.revenue - ytdMetrics.avgMonthlyRevenue) / ytdMetrics.avgMonthlyRevenue * 100).toFixed(0)
        : 0;
    const profitVsAvg = ytdMetrics.avgMonthlyProfit !== 0
        ? ((current.netProfit - ytdMetrics.avgMonthlyProfit) / Math.abs(ytdMetrics.avgMonthlyProfit) * 100).toFixed(0)
        : 0;
    const marginDiff = (metrics.grossMargin - ytdMetrics.grossMargin).toFixed(1);

    // Populate YTD values
    document.getElementById('ytdRevenue').textContent = `${currency} ${formatNumber(ytdMetrics.revenue)}`;
    // Handle negative YTD profit properly
    const ytdProfitEl = document.getElementById('ytdProfit');
    if (ytdMetrics.netProfit < 0) {
        ytdProfitEl.textContent = `- ${currency} ${formatNumber(ytdMetrics.netProfit)}`;
        ytdProfitEl.classList.add('negative-value');
    } else {
        ytdProfitEl.textContent = `${currency} ${formatNumber(ytdMetrics.netProfit)}`;
        ytdProfitEl.classList.remove('negative-value');
    }
    document.getElementById('ytdGrossMargin').textContent = `${ytdMetrics.grossMargin.toFixed(1)}%`;
    document.getElementById('ytdNetMargin').textContent = `${ytdMetrics.netMargin.toFixed(1)}%`;
    document.getElementById('ytdMonths').textContent = `${ytdMetrics.monthsElapsed} month${ytdMetrics.monthsElapsed > 1 ? 's' : ''}`;

    // Populate MTD vs YTD comparison - plain English
    const revenueCompEl = document.getElementById('ytdRevenueComp');
    if (revenueVsAvg > 15) {
        revenueCompEl.textContent = 'Better than usual';
        revenueCompEl.className = 'ytd-comp positive';
    } else if (revenueVsAvg < -15) {
        revenueCompEl.textContent = 'Below your usual';
        revenueCompEl.className = 'ytd-comp negative';
    } else {
        revenueCompEl.textContent = 'About normal';
        revenueCompEl.className = 'ytd-comp neutral';
    }

    const profitCompEl = document.getElementById('ytdProfitComp');
    if (profitVsAvg > 15) {
        profitCompEl.textContent = 'Better than usual';
        profitCompEl.className = 'ytd-comp positive';
    } else if (profitVsAvg < -15) {
        profitCompEl.textContent = 'Below your usual';
        profitCompEl.className = 'ytd-comp negative';
    } else {
        profitCompEl.textContent = 'About normal';
        profitCompEl.className = 'ytd-comp neutral';
    }

    const marginCompEl = document.getElementById('ytdMarginComp');
    if (marginDiff > 2) {
        marginCompEl.textContent = 'Better margins this month';
        marginCompEl.className = 'ytd-comp positive';
    } else if (marginDiff < -2) {
        marginCompEl.textContent = 'Margins slipped this month';
        marginCompEl.className = 'ytd-comp negative';
    } else {
        marginCompEl.textContent = 'Margins holding steady';
        marginCompEl.className = 'ytd-comp neutral';
    }

    // Generate insight
    const insightEl = document.getElementById('ytdInsight');
    let insight = '';

    if (Math.abs(revenueVsAvg) > 15) {
        if (revenueVsAvg > 0) {
            insight = `Strong month! Revenue is ${revenueVsAvg}% above your YTD average. `;
        } else {
            insight = `Revenue is ${Math.abs(revenueVsAvg)}% below your YTD average. `;
        }
    }

    if (Math.abs(profitVsAvg) > 15 && ytdMetrics.avgMonthlyProfit !== 0) {
        if (profitVsAvg > 0) {
            insight += `Profit significantly outperforming YTD trend.`;
        } else {
            insight += `Profit below YTD trend - review costs.`;
        }
    }

    if (!insight) {
        insight = 'This month is tracking close to your year-to-date averages.';
    }

    insightEl.textContent = insight;
}

// Health Strip (Traffic Light Summary)
function updateHealthStrip(current, metrics) {
    const strip = document.getElementById('healthStrip');
    const icon = strip.querySelector('.health-icon');
    const statusEl = document.getElementById('healthStatus');
    const reasonEl = document.getElementById('healthReason');
    const runwayEl = document.getElementById('healthRunway');
    const marginEl = document.getElementById('healthMargin');

    if (!strip) return;

    const cashRunway = metrics.cashRunway || 0;
    const netMargin = metrics.netProfitMargin || metrics.netMargin || 0;
    const netProfit = current.netProfit || 0;

    // Update metric values (cashRunway is in months)
    if (cashRunway === -1) {
        runwayEl.textContent = 'Positive';
    } else {
        runwayEl.textContent = `${cashRunway.toFixed(1)} mo`;
    }
    marginEl.textContent = `${netMargin.toFixed(1)}%`;

    // Determine health status
    let status, statusText, reason;

    // Danger: Loss OR very low runway (less than 1 month)
    if (netProfit < 0 || (cashRunway >= 0 && cashRunway < 1)) {
        status = 'danger';
        if (netProfit < 0 && cashRunway >= 0 && cashRunway < 1) {
            statusText = 'Danger';
            reason = 'Making a loss with critically low cash';
        } else if (netProfit < 0) {
            statusText = 'At Risk';
            reason = 'Making a loss this period';
        } else {
            statusText = 'Danger';
            reason = 'Cash runway below 1 month';
        }
        icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
    }
    // Tight: Low margin OR moderate runway concerns (1-3 months)
    else if (netMargin < 5 || (cashRunway >= 0 && cashRunway < 3)) {
        status = 'tight';
        if (netMargin < 5 && cashRunway >= 0 && cashRunway < 3) {
            statusText = 'Tight';
            reason = 'Low margin with limited cash buffer';
        } else if (netMargin < 5) {
            statusText = 'Tight';
            reason = 'Profit margin below 5%';
        } else {
            statusText = 'Tight';
            reason = 'Cash runway below 3 months';
        }
        icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    }
    // Safe: Good profit and runway (3+ months or cash positive)
    else {
        status = 'safe';
        statusText = 'Safe';
        if (cashRunway === -1) {
            reason = 'Profitable with growing cash';
        } else {
            reason = 'Profitable with healthy cash runway';
        }
        icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    }

    // Apply status class
    strip.className = `health-strip ${status}`;
    statusEl.textContent = statusText;
    reasonEl.textContent = reason;

    // Loan Pressure Tag (only show if there's a loan)
    const loanPressureTag = document.getElementById('loanPressureTag');
    const loanPressureValue = document.getElementById('loanPressureValue');

    if (metrics.hasLoan && loanPressureTag && loanPressureValue) {
        loanPressureTag.style.display = 'flex';

        const pressureLabels = {
            'low': 'Low',
            'medium': 'Medium',
            'high': 'High'
        };

        loanPressureValue.textContent = pressureLabels[metrics.loanPressure] || 'None';
        loanPressureTag.className = `health-metric loan-pressure-tag pressure-${metrics.loanPressure}`;
    } else if (loanPressureTag) {
        loanPressureTag.style.display = 'none';
    }

    // Sleep Test badge - can you sleep at night?
    const sleepTest = document.getElementById('sleepTest');
    const sleepTestValue = document.getElementById('sleepTestValue');
    if (sleepTest && sleepTestValue) {
        if (status === 'safe') {
            sleepTestValue.textContent = 'Pass';
            sleepTestValue.title = 'Sleep well - business is healthy';
            sleepTest.className = 'health-metric sleep-test sleep-good';
        } else if (status === 'tight') {
            sleepTestValue.textContent = 'Watch';
            sleepTestValue.title = 'Light sleep - keep an eye on things';
            sleepTest.className = 'health-metric sleep-test sleep-tight';
        } else {
            sleepTestValue.textContent = 'Fail';
            sleepTestValue.title = 'Wide awake - needs immediate attention';
            sleepTest.className = 'health-metric sleep-test sleep-danger';
        }
    }
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
            result: `This adds ${currency} ${formatNumber(collectTarget)} to your bank account`,
            cashImpact: collectTarget
        });
    } else if (metrics.dso > 30) {
        const dsoImprovement = Math.round(current.receivables * 0.15); // Faster collection frees ~15%
        actions.push({
            priority: 1,
            title: 'Speed up customer payments',
            description: `Customers take ${Math.round(metrics.dso)} days to pay you. Send reminders earlier (at day 15, not day 30) and offer a small discount for early payment.`,
            result: 'Gets cash into your account faster',
            cashImpact: dsoImprovement
        });
    }

    // Priority 2: DPO issues
    if (metrics.dpo < 20) {
        const dpoSavings = Math.round((current.payables || 0) * 0.1); // Delayed payment keeps ~10%
        actions.push({
            priority: actions.length + 1,
            title: 'Ask suppliers for 30-day payment terms',
            description: `You are paying suppliers in ${Math.round(metrics.dpo)} days, which is very fast. Call your main suppliers and ask if you can pay in 30 days instead.`,
            result: `Keeps cash in your account ${30 - Math.round(metrics.dpo)} days longer`,
            cashImpact: dpoSavings
        });
    }

    // Priority 3: Expense/Margin issues
    if (metrics.grossMargin < 25) {
        const marginGain = Math.round((current.revenue || 0) * 0.05); // 5% price increase impact
        actions.push({
            priority: actions.length + 1,
            title: 'Improve your gross margin',
            description: `Your gross margin is only ${metrics.grossMargin.toFixed(0)}%. Raise prices by 5-10% or negotiate better rates with suppliers.`,
            result: 'More profit from each sale',
            cashImpact: marginGain
        });
    }

    // Default: Cash protection
    if (metrics.cashRunway < 3 && actions.length < 3) {
        const burnReduction = Math.round((current.opex || 0) * 0.1); // 10% spend reduction
        actions.push({
            priority: actions.length + 1,
            title: 'Pause non-essential spending',
            description: `With only ${metrics.cashRunway.toFixed(1)} months of cash safety, hold off on anything that is not critical: extra marketing, office upgrades, new equipment.`,
            result: 'Protects your cash buffer',
            cashImpact: burnReduction
        });
    }

    // Fill remaining slots
    if (actions.length < 3 && metrics.dio > 30) {
        const inventoryRelease = Math.round(current.inventory * 0.2);
        actions.push({
            priority: actions.length + 1,
            title: 'Reduce inventory levels',
            description: `Stock sits for ${Math.round(metrics.dio)} days before selling. Order smaller quantities more often instead of big bulk orders.`,
            result: `Frees up ${currency} ${formatNumber(inventoryRelease)} tied up in stock`,
            cashImpact: inventoryRelease
        });
    }

    // Render actions with cash impact badges
    actionList.innerHTML = actions.slice(0, 3).map((action, i) => {
        const impactBadge = action.cashImpact && action.cashImpact > 0
            ? `<span class="cash-impact-badge">Cash impact: +${currency} ${formatNumber(action.cashImpact)}</span>`
            : '';
        const isMain = i === 0;

        return `
        <div class="action-item priority-${i + 1}${isMain ? ' main-action' : ''}">
            <div class="action-number">${i + 1}</div>
            <div class="action-content">
                <h3>${action.title}${isMain ? impactBadge : ''}</h3>
                <p>${action.description}</p>
                <div class="action-result">
                    <span>Result: ${action.result}</span>
                </div>
            </div>
        </div>
    `;
    }).join('');

    // Update inaction warning if runway is concerning
    const inactionWarning = document.getElementById('inactionWarning');
    const inactionText = document.getElementById('inactionText');
    if (inactionWarning && inactionText && metrics.cashRunway >= 0 && metrics.cashRunway < 6) {
        const cashOutDate = new Date();
        cashOutDate.setMonth(cashOutDate.getMonth() + Math.floor(metrics.cashRunway));
        cashOutDate.setDate(cashOutDate.getDate() + Math.round((metrics.cashRunway % 1) * 30));
        const dateStr = cashOutDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

        inactionText.textContent = `If you do nothing: your cash could run out by ${dateStr}`;
        inactionWarning.style.display = 'flex';
    } else if (inactionWarning) {
        inactionWarning.style.display = 'none';
    }
}

function updateCashForecast(current, metrics, currency, period) {
    const timeline = document.getElementById('forecastTimeline');
    const insight = document.getElementById('forecastInsight');
    if (!timeline || !insight) return;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Current values
    const currentCash = current.cash || 0;
    const monthlyBurn = current.opex || 0;
    const netProfit = current.netProfit || 0;
    const receivables = current.receivables || 0;
    const payables = current.payables || 0;

    // Working capital timing (DSO/DPO-based forecast)
    // Collections per month = AR / DSO × 30 (how much you collect monthly)
    // Payments per month = AP / DPO × 30 (how much you pay monthly)
    const dso = metrics.dso || 30;  // Default 30 days if not available
    const dpo = metrics.dpo || 30;  // Default 30 days if not available

    // Monthly cash flows based on working capital cycle
    const monthlyCollections = dso > 0 ? (receivables / dso) * 30 : 0;
    const monthlyPayments = dpo > 0 ? (payables / dpo) * 30 : 0;

    // Working capital effect on cash
    // If you pay suppliers slower than you collect = positive cash effect
    // If you collect slower than you pay = negative cash effect
    const workingCapitalEffect = monthlyPayments - monthlyCollections;

    // Calculate monthly cash change
    // = Net Profit + Working Capital Effect (AP timing - AR timing)
    let monthlyCashChange = netProfit + workingCapitalEffect;

    // Safety caps to avoid unrealistic projections
    // 1. If too optimistic (> 150% of net profit), cap at 50% of net profit
    if (netProfit > 0 && monthlyCashChange > netProfit * 1.5) {
        monthlyCashChange = netProfit * 0.5;
    }

    // 2. If loss-making, don't make it look better than the loss
    if (netProfit < 0) {
        monthlyCashChange = Math.min(monthlyCashChange, netProfit);
    }

    // 3. Floor at negative of monthly burn (can't lose more than fixed costs + some variable)
    const maxMonthlyLoss = -(monthlyBurn * 1.5);
    if (monthlyCashChange < maxMonthlyLoss) {
        monthlyCashChange = maxMonthlyLoss;
    }

    // Generate 3 month forecast
    const startMonth = period?.month ? parseInt(period.month) : new Date().getMonth() + 1;
    const startYear = period?.year ? parseInt(period.year) : new Date().getFullYear();

    const forecast = [];
    let runningCash = currentCash;

    // Current month
    forecast.push({
        label: `${monthNames[startMonth - 1]} (Now)`,
        cash: runningCash,
        isNow: true
    });

    // Next 3 months
    for (let i = 1; i <= 3; i++) {
        runningCash += monthlyCashChange;
        const monthIdx = (startMonth - 1 + i) % 12;
        const year = startYear + Math.floor((startMonth - 1 + i) / 12);
        forecast.push({
            label: `${monthNames[monthIdx]} '${year.toString().slice(-2)}`,
            cash: runningCash,
            isNow: false
        });
    }

    // Render timeline
    const maxCash = Math.max(...forecast.map(f => f.cash), 0);
    const minCash = Math.min(...forecast.map(f => f.cash), 0);
    const range = maxCash - minCash || 1;

    timeline.innerHTML = forecast.map((f, idx) => {
        const heightPct = ((f.cash - minCash) / range) * 100;
        const isNegative = f.cash < 0;
        // Color logic: Red only for negative, orange for low positive, green for healthy
        let statusClass;
        if (isNegative) {
            statusClass = 'danger'; // Red only for negative cash
        } else if (f.cash > monthlyBurn * 3) {
            statusClass = 'good'; // Green: > 3 months runway
        } else {
            statusClass = 'warning'; // Orange: positive but < 3 months runway
        }
        // Show negative sign for negative values
        const displayValue = isNegative
            ? `- ${currency} ${formatNumber(f.cash)}`
            : `${currency} ${formatNumber(f.cash)}`;

        return `
            <div class="forecast-month ${f.isNow ? 'current' : ''} ${statusClass}">
                <div class="forecast-bar-container">
                    <div class="forecast-bar ${isNegative ? 'negative' : ''}" style="height: ${Math.max(heightPct, 10)}%"></div>
                </div>
                <div class="forecast-value ${isNegative ? 'negative' : ''}">${displayValue}</div>
                <div class="forecast-label">${f.label}</div>
            </div>
        `;
    }).join('');

    // Generate insight based on projection
    const finalCash = forecast[forecast.length - 1].cash;
    const cashChange = finalCash - currentCash;
    let insightHtml = '';

    if (finalCash < 0) {
        insightHtml = `
            <div class="insight-box danger">
                <strong>Warning: Cash may run out</strong>
                <p>Based on your current collection and payment patterns, you could be ${currency} ${formatNumber(Math.abs(finalCash))} short within 3 months. Speed up collections or slow down payments.</p>
            </div>
        `;
    } else if (finalCash < monthlyBurn) {
        insightHtml = `
            <div class="insight-box warning">
                <strong>Cash buffer shrinking</strong>
                <p>At this pace, you may have less than 1 month of expenses in reserve. Consider collecting faster or delaying some payments.</p>
            </div>
        `;
    } else if (monthlyCashChange > 0) {
        insightHtml = `
            <div class="insight-box good">
                <strong>Cash position improving</strong>
                <p>If patterns continue, you could have ${currency} ${formatNumber(finalCash)} in 3 months (+${currency} ${formatNumber(cashChange)} from today).</p>
            </div>
        `;
    } else if (monthlyCashChange < 0) {
        insightHtml = `
            <div class="insight-box warning">
                <strong>Cash position declining</strong>
                <p>Your payment cycle is consuming cash. In 3 months you may have ${currency} ${formatNumber(finalCash)} (${currency} ${formatNumber(Math.abs(cashChange))} less than today).</p>
            </div>
        `;
    } else {
        insightHtml = `
            <div class="insight-box neutral">
                <strong>Cash position stable</strong>
                <p>Based on current patterns, your cash should remain around ${currency} ${formatNumber(finalCash)} over the next 3 months.</p>
            </div>
        `;
    }

    insight.innerHTML = insightHtml;
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

    // Update strength and risk talking points
    updateTalkingPoints(metrics, current, currency);
}

function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    return Math.abs(num).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

// ===== Dropdown Toggle =====

function toggleDropdown(btn) {
    const dropdown = btn.closest('.dropdown');
    dropdown.classList.toggle('open');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
    }
});

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

Generated by PlainFinancials
https://plainfinance.co`;

    // Encode for WhatsApp URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
}

// ===== PDF Download =====

// Check if user can download PDF (Owner, Pro, or Admin)
async function canDownloadPDF() {
    // Check if Supabase is available
    if (typeof getUserProfile !== 'function') {
        return true; // Allow if Supabase not loaded (testing mode)
    }

    try {
        // Check admin status first
        if (typeof canCreateReport === 'function') {
            const reportCheck = await canCreateReport();
            if (reportCheck.isAdmin) {
                return true; // Admins can always download
            }
        }

        const { data: profile } = await getUserProfile();
        const plan = profile?.subscription_plan || 'free';
        return plan === 'owner' || plan === 'pro';
    } catch (e) {
        console.log('Could not check subscription');
        return true; // Allow on error (be permissive during testing)
    }
}

async function downloadInvestorPDF() {
    // Check if user can download
    const canDownload = await canDownloadPDF();
    if (!canDownload) {
        if (confirm('PDF downloads are available on Owner and Pro plans. Would you like to upgrade?')) {
            window.location.href = 'index.html#pricing';
        }
        return;
    }
    // Get stored report data
    const storedReport = localStorage.getItem('plainfinance_report');
    if (!storedReport) {
        alert('Report data not found');
        return;
    }

    const reportData = JSON.parse(storedReport);
    const currency = reportData.company?.currency || 'AED';
    const current = reportData.current || {};
    const metrics = reportData.metrics || {};

    // Populate investor summary template
    document.getElementById('inv-company').textContent = reportData.company?.name || 'Company';
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const period = reportData.company?.period;
    document.getElementById('inv-period').textContent = period ?
        `Financial Summary - ${monthNames[parseInt(period.month) - 1]} ${period.year}` : 'Financial Summary';
    document.getElementById('inv-date').textContent = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    // Key metrics
    document.getElementById('inv-revenue').textContent = `${currency} ${formatNumber(current.revenue)}`;
    const profitEl = document.getElementById('inv-profit');
    profitEl.textContent = `${currency} ${formatNumber(current.netProfit)}`;
    profitEl.style.color = current.netProfit >= 0 ? '#059669' : '#dc2626';
    document.getElementById('inv-cash').textContent = `${currency} ${formatNumber(current.cash)}`;
    document.getElementById('inv-runway').textContent = `${metrics.cashRunway || 0} mo`;

    // Profitability
    document.getElementById('inv-gross-margin').textContent = `${metrics.grossMargin || 0}%`;
    document.getElementById('inv-net-margin').textContent = `${metrics.netMargin || 0}%`;
    document.getElementById('inv-opex').textContent = `${currency} ${formatNumber(current.opex)}`;

    // Liquidity
    document.getElementById('inv-current-ratio').textContent = `${metrics.currentRatio || 0}x`;
    document.getElementById('inv-receivables').textContent = `${currency} ${formatNumber(current.receivables)}`;
    document.getElementById('inv-payables').textContent = `${currency} ${formatNumber(current.payables)}`;

    // Working capital cycle
    document.getElementById('inv-dso').textContent = metrics.dso || 0;
    document.getElementById('inv-dio').textContent = metrics.dio || 0;
    document.getElementById('inv-dpo').textContent = metrics.dpo || 0;
    const cccEl = document.getElementById('inv-ccc');
    cccEl.textContent = metrics.ccc || 0;
    cccEl.style.color = metrics.ccc > 45 ? '#dc2626' : metrics.ccc > 20 ? '#d97706' : '#059669';

    // Executive summary
    const summaryText = document.querySelector('.meeting-summary blockquote')?.textContent ||
        `Revenue of ${currency} ${formatNumber(current.revenue)} with ${metrics.netMargin || 0}% net margin. Current ratio at ${metrics.currentRatio || 0}x.`;
    document.getElementById('inv-summary').textContent = summaryText.replace(/^"|"$/g, '');

    // Generate PDF
    const investorPage = document.getElementById('investorSummary');
    investorPage.style.display = 'block';
    investorPage.style.position = 'static';

    const companyName = reportData.company?.name || 'Report';
    const filename = `${companyName.replace(/\s+/g, '_')}_Executive_Summary.pdf`;

    const options = {
        margin: 0,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(options).from(investorPage.querySelector('.investor-page')).save().then(() => {
        investorPage.style.display = 'none';
        investorPage.style.position = 'absolute';
    });
}

async function downloadPDF() {
    // Check if user can download
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

// ===== Alert System =====

// Load saved alert settings
function loadAlertSettings() {
    const saved = localStorage.getItem('plainfinance_alerts');
    if (saved) {
        const settings = JSON.parse(saved);

        // Apply saved values
        if (settings.runway !== undefined) {
            document.getElementById('alertRunway').checked = settings.runway.enabled;
            document.getElementById('alertRunwayValue').value = settings.runway.value;
        }
        if (settings.margin !== undefined) {
            document.getElementById('alertMargin').checked = settings.margin.enabled;
            document.getElementById('alertMarginValue').value = settings.margin.value;
        }
        if (settings.dso !== undefined) {
            document.getElementById('alertDSO').checked = settings.dso.enabled;
            document.getElementById('alertDSOValue').value = settings.dso.value;
        }
        if (settings.cash !== undefined) {
            document.getElementById('alertCash').checked = settings.cash.enabled;
            document.getElementById('alertCashValue').value = settings.cash.value;
        }
    }
}

// Save alert settings
function saveAlertSettings() {
    const settings = {
        runway: {
            enabled: document.getElementById('alertRunway').checked,
            value: parseInt(document.getElementById('alertRunwayValue').value) || 4
        },
        margin: {
            enabled: document.getElementById('alertMargin').checked,
            value: parseInt(document.getElementById('alertMarginValue').value) || 10
        },
        dso: {
            enabled: document.getElementById('alertDSO').checked,
            value: parseInt(document.getElementById('alertDSOValue').value) || 45
        },
        cash: {
            enabled: document.getElementById('alertCash').checked,
            value: parseInt(document.getElementById('alertCashValue').value) || 50000
        }
    };

    localStorage.setItem('plainfinance_alerts', JSON.stringify(settings));

    // Show confirmation
    const btn = document.querySelector('.alert-config .btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Saved';
    btn.style.background = '#10b981';
    btn.style.color = 'white';

    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '';
        btn.style.color = '';
    }, 2000);

    // Re-check alerts with new settings
    checkAlerts();
}

// Check if any thresholds are crossed
function checkAlerts() {
    const storedReport = localStorage.getItem('plainfinance_report');
    if (!storedReport) return;

    const reportData = JSON.parse(storedReport);
    const metrics = reportData.metrics;
    const current = reportData.current;
    const company = reportData.company;
    const currency = company?.currency || 'AED';

    if (!metrics) return;

    const savedSettings = localStorage.getItem('plainfinance_alerts');
    const settings = savedSettings ? JSON.parse(savedSettings) : {
        runway: { enabled: true, value: 4 },
        margin: { enabled: true, value: 10 },
        dso: { enabled: false, value: 45 },
        cash: { enabled: false, value: 50000 }
    };

    const alerts = [];

    // Check cash runway (in months)
    if (settings.runway.enabled && metrics.cashRunway !== undefined) {
        const runwayMonths = metrics.cashRunway;
        if (runwayMonths < settings.runway.value) {
            alerts.push({
                type: runwayMonths < 1 ? 'danger' : 'warning',
                title: 'Low Cash Runway',
                message: `Your cash runway is ${runwayMonths.toFixed(1)} months. This is below your threshold of ${settings.runway.value} months.`,
                whatsappMsg: `ALERT: ${company?.name || 'Company'} - Cash runway is only ${runwayMonths.toFixed(1)} months. Immediate attention needed.`
            });
        }
    }

    // Check profit margin
    if (settings.margin.enabled && metrics.netProfitMargin !== undefined) {
        const margin = metrics.netProfitMargin;
        if (margin < settings.margin.value) {
            alerts.push({
                type: margin < 0 ? 'danger' : 'warning',
                title: 'Low Profit Margin',
                message: `Your net profit margin is ${margin.toFixed(1)}%. This is below your threshold of ${settings.margin.value}%.`,
                whatsappMsg: `ALERT: ${company?.name || 'Company'} - Net profit margin dropped to ${margin.toFixed(1)}%. Review expenses and pricing.`
            });
        }
    }

    // Check DSO (Days Sales Outstanding)
    if (settings.dso.enabled && metrics.dso !== undefined) {
        const dso = metrics.dso;
        if (dso > settings.dso.value) {
            alerts.push({
                type: dso > 60 ? 'danger' : 'warning',
                title: 'Slow Customer Payments',
                message: `Customers are taking ${dso.toFixed(0)} days to pay. This exceeds your threshold of ${settings.dso.value} days.`,
                whatsappMsg: `ALERT: ${company?.name || 'Company'} - Customers taking ${dso.toFixed(0)} days to pay. Follow up on overdue invoices.`
            });
        }
    }

    // Check cash balance
    if (settings.cash.enabled && current?.cash !== undefined) {
        const cash = current.cash;
        if (cash < settings.cash.value) {
            alerts.push({
                type: cash < settings.cash.value / 2 ? 'danger' : 'warning',
                title: 'Low Cash Balance',
                message: `Your cash balance is ${currency} ${formatNumber(cash)}. This is below your threshold of ${currency} ${formatNumber(settings.cash.value)}.`,
                whatsappMsg: `ALERT: ${company?.name || 'Company'} - Cash balance is ${currency} ${formatNumber(cash)}. Below threshold of ${currency} ${formatNumber(settings.cash.value)}.`
            });
        }
    }

    renderAlerts(alerts);
}

// Render alerts in the UI
function renderAlerts(alerts) {
    const container = document.getElementById('activeAlerts');
    if (!container) return;

    if (alerts.length === 0) {
        container.innerHTML = `
            <div class="no-alerts">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <p>All metrics are within your thresholds. You are doing well.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = alerts.map(alert => `
        <div class="alert-item ${alert.type}">
            <div class="alert-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
            </div>
            <div class="alert-content">
                <h4>${alert.title}</h4>
                <p>${alert.message}</p>
            </div>
            <div class="alert-action">
                <button class="btn btn-whatsapp" onclick="sendAlertWhatsApp('${encodeURIComponent(alert.whatsappMsg)}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Notify via WhatsApp
                </button>
            </div>
        </div>
    `).join('');
}

// Send alert via WhatsApp
function sendAlertWhatsApp(encodedMessage) {
    const message = decodeURIComponent(encodedMessage);
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

// Initialize alerts on page load
document.addEventListener('DOMContentLoaded', () => {
    // Load saved settings
    loadAlertSettings();

    // Check for alerts based on current report data
    setTimeout(() => {
        checkAlerts();
    }, 500); // Small delay to ensure report data is loaded

    // Initialize scenario analysis for Pro users
    initScenarioAnalysis();
});

// ===== Scenario Analysis (Pro Only) =====

let scenarioBaseData = null;

async function initScenarioAnalysis() {
    const scenarioSection = document.getElementById('scenarioSection');
    if (!scenarioSection) return;

    // Check if user is Pro
    const isPro = await checkIfProUser();

    if (isPro) {
        scenarioSection.style.display = 'block';
        setupScenarioListeners();
        loadScenarioBaseData();
    }
}

async function checkIfProUser() {
    if (typeof getUserProfile !== 'function') {
        return false; // Supabase not loaded
    }

    try {
        const { data: profile } = await getUserProfile();
        return profile?.subscription_plan === 'pro';
    } catch (e) {
        return false;
    }
}

function loadScenarioBaseData() {
    const storedReport = localStorage.getItem('plainfinance_report');
    if (!storedReport) return;

    const reportData = JSON.parse(storedReport);
    const current = reportData.current || {};
    const metrics = reportData.metrics || {};

    scenarioBaseData = {
        revenue: current.revenue || 0,
        cogs: current.cogs || 0,
        opex: current.opex || 0,
        netProfit: current.netProfit || 0,
        netMargin: metrics.netMargin || 0,
        cash: current.cash || 0,
        cashRunway: metrics.cashRunway || 0,
        currency: reportData.company?.currency || 'AED'
    };

    // Set initial values
    updateScenarioResults();
}

function setupScenarioListeners() {
    const revenueSlider = document.getElementById('scenarioRevenue');
    const opexSlider = document.getElementById('scenarioOpex');
    const cogsSlider = document.getElementById('scenarioCogs');

    if (revenueSlider) {
        revenueSlider.addEventListener('input', (e) => {
            document.getElementById('scenarioRevenueValue').textContent = e.target.value + '%';
            calculateScenario();
        });
    }

    if (opexSlider) {
        opexSlider.addEventListener('input', (e) => {
            document.getElementById('scenarioOpexValue').textContent = e.target.value + '%';
            calculateScenario();
        });
    }

    if (cogsSlider) {
        cogsSlider.addEventListener('input', (e) => {
            document.getElementById('scenarioCogsValue').textContent = e.target.value + '%';
            calculateScenario();
        });
    }
}

function calculateScenario() {
    if (!scenarioBaseData) return;

    const revenueChange = parseInt(document.getElementById('scenarioRevenue').value) / 100;
    const opexChange = parseInt(document.getElementById('scenarioOpex').value) / 100;
    const cogsChange = parseInt(document.getElementById('scenarioCogs').value) / 100;

    // Calculate new values
    const newRevenue = scenarioBaseData.revenue * (1 + revenueChange);
    const newCogs = scenarioBaseData.cogs * (1 + cogsChange);
    const newOpex = scenarioBaseData.opex * (1 + opexChange);

    const newGrossProfit = newRevenue - newCogs;
    const newNetProfit = newGrossProfit - newOpex;
    const newNetMargin = newRevenue > 0 ? (newNetProfit / newRevenue) * 100 : 0;

    // Calculate new runway
    const monthlyBurn = newOpex > 0 ? newOpex : scenarioBaseData.opex;
    const newRunway = monthlyBurn > 0 ? Math.round(scenarioBaseData.cash / monthlyBurn) : 12;

    // Calculate changes
    const profitChange = scenarioBaseData.netProfit !== 0
        ? ((newNetProfit - scenarioBaseData.netProfit) / Math.abs(scenarioBaseData.netProfit)) * 100
        : (newNetProfit > 0 ? 100 : -100);

    // Update display
    updateScenarioDisplay(newNetProfit, newNetMargin, newRunway, profitChange);
}

function updateScenarioDisplay(newProfit, newMargin, newRunway, profitChange) {
    const currency = scenarioBaseData?.currency || 'AED';

    // Current values
    document.getElementById('scenarioCurrentProfit').textContent =
        `${currency} ${formatNumber(scenarioBaseData.netProfit)}`;
    document.getElementById('scenarioCurrentMargin').textContent =
        `${scenarioBaseData.netMargin.toFixed(1)}%`;
    document.getElementById('scenarioCurrentRunway').textContent =
        `${scenarioBaseData.cashRunway} months`;

    // New values
    const newProfitEl = document.getElementById('scenarioNewProfit');
    newProfitEl.textContent = `${currency} ${formatNumber(newProfit)}`;
    newProfitEl.className = 'new-value ' + (newProfit >= scenarioBaseData.netProfit ? 'positive' : 'negative');

    const newMarginEl = document.getElementById('scenarioNewMargin');
    newMarginEl.textContent = `${newMargin.toFixed(1)}%`;
    newMarginEl.className = 'new-value ' + (newMargin >= scenarioBaseData.netMargin ? 'positive' : 'negative');

    const newRunwayEl = document.getElementById('scenarioNewRunway');
    newRunwayEl.textContent = `${Math.max(0, newRunway)} months`;
    newRunwayEl.className = 'new-value ' + (newRunway >= scenarioBaseData.cashRunway ? 'positive' : 'negative');

    // Change percentage
    const changeEl = document.getElementById('scenarioProfitChange');
    const changeSign = profitChange >= 0 ? '+' : '';
    changeEl.textContent = `${changeSign}${profitChange.toFixed(0)}%`;
    changeEl.className = 'change-value ' + (profitChange >= 0 ? 'positive' : 'negative');

    // Insight
    updateScenarioInsight(newProfit, newMargin, newRunway);
}

function updateScenarioInsight(newProfit, newMargin, newRunway) {
    const insightEl = document.getElementById('scenarioInsight');
    let insight = '';

    if (newProfit < 0 && scenarioBaseData.netProfit >= 0) {
        insight = '⚠️ This scenario would push you into a loss position.';
    } else if (newRunway < 3) {
        insight = '⚠️ Warning: Cash runway drops below 3 months in this scenario.';
    } else if (newProfit > scenarioBaseData.netProfit * 1.2) {
        insight = '✅ Strong improvement! This scenario increases profit by 20%+.';
    } else if (newMargin < 5 && scenarioBaseData.netMargin >= 5) {
        insight = '⚠️ Net margin drops below 5% - tight territory.';
    } else {
        insight = 'Adjust the sliders to explore different scenarios.';
    }

    insightEl.textContent = insight;
}

function updateScenarioResults() {
    if (!scenarioBaseData) return;
    calculateScenario();
}

function resetScenario() {
    document.getElementById('scenarioRevenue').value = 0;
    document.getElementById('scenarioOpex').value = 0;
    document.getElementById('scenarioCogs').value = 0;

    document.getElementById('scenarioRevenueValue').textContent = '0%';
    document.getElementById('scenarioOpexValue').textContent = '0%';
    document.getElementById('scenarioCogsValue').textContent = '0%';

    calculateScenario();
}

// ===== Owner Summary Box (WhatsApp-ready) =====

function updateOwnerSummary(current, metrics, currency, analysis) {
    const netProfit = current.netProfit || 0;
    const cashRunway = metrics.cashRunway || 0;

    // Profit line
    const profitIcon = document.getElementById('summaryProfitIcon');
    const profitText = document.getElementById('summaryProfit');

    if (netProfit > 0) {
        profitIcon.textContent = '✓';
        profitIcon.className = 'summary-icon good';
        profitText.textContent = `Made ${currency} ${formatNumber(netProfit)} profit`;
    } else if (netProfit < 0) {
        profitIcon.textContent = '✗';
        profitIcon.className = 'summary-icon danger';
        profitText.textContent = `Lost ${currency} ${formatNumber(Math.abs(netProfit))}`;
    } else {
        profitIcon.textContent = '—';
        profitIcon.className = 'summary-icon warning';
        profitText.textContent = 'Broke even (no profit, no loss)';
    }

    // Cash runway line
    const cashIcon = document.getElementById('summaryCashIcon');
    const cashText = document.getElementById('summaryCash');

    // Calculate cash-out date
    const getCashOutDate = (months) => {
        const date = new Date();
        date.setMonth(date.getMonth() + Math.floor(months));
        date.setDate(date.getDate() + Math.round((months % 1) * 30));
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (cashRunway === -1) {
        // Cash positive
        cashIcon.textContent = '✓';
        cashIcon.className = 'summary-icon good';
        cashText.textContent = 'Cash is growing (positive cash flow)';
    } else if (cashRunway >= 3) {
        cashIcon.textContent = '✓';
        cashIcon.className = 'summary-icon good';
        cashText.textContent = `Cash runway: ${cashRunway.toFixed(1)} months`;
    } else if (cashRunway >= 1) {
        cashIcon.textContent = '⚠';
        cashIcon.className = 'summary-icon warning';
        cashText.textContent = `Cash out by ~${getCashOutDate(cashRunway)} — getting tight`;
    } else {
        cashIcon.textContent = '!';
        cashIcon.className = 'summary-icon danger';
        cashText.textContent = `Cash out by ~${getCashOutDate(cashRunway)} — action needed`;
    }

    // Priority action line
    const actionText = document.getElementById('summaryAction');

    // Try to get first action from AI analysis
    if (analysis && analysis.actions && analysis.actions.length > 0) {
        const firstAction = analysis.actions[0];
        // Extract just the headline (first part before detailed explanation)
        const headline = firstAction.title || firstAction.headline || firstAction;
        actionText.textContent = `Priority: ${headline}`;
    } else {
        // Fallback based on metrics
        if (cashRunway < 3 && cashRunway >= 0) {
            actionText.textContent = `Priority: Collect ${currency} ${formatNumber(current.receivables || 0)} from customers`;
        } else if (metrics.grossMargin < 20) {
            actionText.textContent = 'Priority: Review pricing — margins are low';
        } else {
            actionText.textContent = 'Priority: Review the full report below';
        }
    }
}

function copySummary() {
    const profitText = document.getElementById('summaryProfit').textContent;
    const cashText = document.getElementById('summaryCash').textContent;
    const actionText = document.getElementById('summaryAction').textContent;

    // Get company name and period
    const companyName = document.getElementById('companyName')?.textContent || 'My Company';
    const period = document.getElementById('reportPeriod')?.textContent || '';

    const summaryText = `${companyName} — ${period}
✓ ${profitText}
⚠ ${cashText}
→ ${actionText}

Generated by PlainFinancials.com`;

    navigator.clipboard.writeText(summaryText).then(() => {
        // Show feedback
        const btn = document.querySelector('.copy-summary-btn');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        btn.style.background = 'rgba(74, 222, 128, 0.3)';

        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.background = '';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy. Please select and copy manually.');
    });
}

// ===== Story of the Month =====

function updateStoryOfMonth(current, previous, metrics, currency) {
    const storyText = document.getElementById('storyText');
    if (!storyText) return;

    const parts = [];

    // Part 1: Revenue trend
    if (metrics.revenueChange !== null) {
        if (metrics.revenueChange > 5) {
            parts.push(`Revenue up ${Math.abs(metrics.revenueChange).toFixed(0)}%`);
        } else if (metrics.revenueChange < -5) {
            parts.push(`Revenue down ${Math.abs(metrics.revenueChange).toFixed(0)}%`);
        } else {
            parts.push('Revenue steady');
        }
    } else {
        parts.push(`Revenue at ${currency} ${formatNumber(current.revenue)}`);
    }

    // Part 2: Profit status
    if (current.netProfit > 0) {
        parts.push(`profit healthy at ${metrics.netMargin.toFixed(0)}% margin`);
    } else if (current.netProfit < 0) {
        parts.push(`but making a loss`);
    } else {
        parts.push('breaking even');
    }

    // Part 3: Cash movement reason
    if (metrics.cashChange !== null && metrics.cashChange < -10) {
        if (metrics.dio > 60) {
            parts.push('Cash down due to inventory build-up');
        } else if (metrics.dso > 45) {
            parts.push('Cash down — customers slow to pay');
        } else {
            parts.push('Cash decreased this month');
        }
    } else if (metrics.cashChange !== null && metrics.cashChange > 10) {
        parts.push('Cash position improved');
    }

    // Part 4: Runway status
    if (metrics.cashRunway === -1) {
        parts.push('Runway comfortable — cash positive');
    } else if (metrics.cashRunway >= 3) {
        parts.push(`Runway healthy at ${metrics.cashRunway.toFixed(1)} months`);
    } else if (metrics.cashRunway >= 1) {
        parts.push(`Watch runway — only ${metrics.cashRunway.toFixed(1)} months left`);
    } else {
        parts.push('Runway critical — needs immediate action');
    }

    // Combine into flowing narrative
    storyText.textContent = `This month: ${parts.join('. ')}.`;
}

// ===== Wins Celebration =====

function updateWinsCelebration(current, previous, metrics) {
    const container = document.getElementById('winsCelebration');
    const list = document.getElementById('winsList');
    if (!container || !list) return;

    const wins = [];

    // Check for wins
    if (current.netProfit > 0 && metrics.netMargin >= 10) {
        wins.push('Healthy profit margin');
    }
    if (metrics.revenueChange !== null && metrics.revenueChange > 10) {
        wins.push(`Revenue up ${metrics.revenueChange.toFixed(0)}%`);
    }
    if (metrics.profitChange !== null && metrics.profitChange > 20) {
        wins.push('Profit growth');
    }
    if (metrics.dso <= 25) {
        wins.push('Fast customer payments');
    }
    if (metrics.currentRatio >= 2) {
        wins.push('Strong liquidity');
    }
    if (metrics.cashRunway === -1 || metrics.cashRunway >= 6) {
        wins.push('Comfortable cash runway');
    }
    if (metrics.grossMargin >= 40) {
        wins.push('Strong gross margin');
    }
    if (metrics.cashChange !== null && metrics.cashChange > 15) {
        wins.push('Cash position improved');
    }

    // Show or hide based on wins
    if (wins.length > 0) {
        list.innerHTML = wins.slice(0, 4).map(w => `<span class="win-badge">${w}</span>`).join('');
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}

// ===== Go Deeper Box =====

function updateGoDeeperBox(current, metrics) {
    const list = document.getElementById('goDeeperList');
    if (!list) return;

    const topics = [];

    // Suggest based on metrics
    if (metrics.dio > 45) {
        topics.push('Review your inventory purchasing plan — stock is sitting too long');
    }
    if (metrics.dso > 30) {
        topics.push('Discuss collection strategy for slow-paying customers');
    }
    if (metrics.cashRunway >= 0 && metrics.cashRunway < 3) {
        topics.push('Build a 90-day cash flow forecast with realistic scenarios');
    }
    if (metrics.netMargin < 5) {
        topics.push('Analyze expense breakdown to find margin improvement opportunities');
    }
    if (metrics.hasLoan && metrics.loanPressure === 'high') {
        topics.push('Revisit loan repayment timing and refinancing options');
    }
    if (metrics.dpo < 15) {
        topics.push('Negotiate better payment terms with key suppliers');
    }

    // Default topics if none triggered
    if (topics.length === 0) {
        topics.push('Model different sales scenarios for next quarter');
        topics.push('Review pricing strategy and competitor positioning');
        topics.push('Plan for seasonal cash flow fluctuations');
    }

    // Limit to 3 topics
    list.innerHTML = topics.slice(0, 3).map(t => `<li>${t}</li>`).join('');
}

// ===== Blur Strategy for Non-Signup Users =====

async function applyBlurStrategy() {
    // Check if user is logged in
    const isLoggedIn = await checkIfUserLoggedIn();

    if (isLoggedIn) {
        // Remove any blur overlays
        removeBlurOverlays();
        return;
    }

    // Apply blur to specific sections for non-logged-in users
    applyBlurToSections();
}

async function checkIfUserLoggedIn() {
    // Check if Supabase is available
    if (typeof supabase === 'undefined' || !supabase) {
        return true; // Allow if Supabase not loaded (testing mode)
    }

    try {
        const { data: { user } } = await supabase.auth.getUser();
        return !!user;
    } catch (e) {
        console.error('Error checking auth:', e);
        return true; // Allow on error
    }
}

function applyBlurToSections() {
    // Sections to blur for non-logged-in users (to create intrigue)
    const sectionsToBlur = [
        { selector: '#actionList', label: 'Your 3 Actions' },
        { selector: '.cash-forecast', label: 'Cash Forecast' },
        { selector: '#meetingSummary', label: 'Bank Summary' }
    ];

    sectionsToBlur.forEach(({ selector, label }) => {
        const section = document.querySelector(selector);
        if (section && !section.classList.contains('blurred-section')) {
            section.classList.add('blurred-section');

            // Add signup overlay
            const overlay = document.createElement('div');
            overlay.className = 'blur-signup-overlay';
            overlay.innerHTML = `
                <div class="blur-overlay-content">
                    <h4>Sign up free to unlock</h4>
                    <p>${label}</p>
                    <a href="signup.html" class="btn-signup">Create Free Account</a>
                </div>
            `;
            section.style.position = 'relative';
            section.appendChild(overlay);
        }
    });
}

function removeBlurOverlays() {
    // Remove all blur classes and overlays
    document.querySelectorAll('.blurred-section').forEach(el => {
        el.classList.remove('blurred-section');
    });

    document.querySelectorAll('.blur-signup-overlay').forEach(el => {
        el.remove();
    });
}

// Apply blur strategy on page load
document.addEventListener('DOMContentLoaded', () => {
    // Delay slightly to ensure Supabase is loaded
    setTimeout(applyBlurStrategy, 500);
});
