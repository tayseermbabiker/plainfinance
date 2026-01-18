// Netlify Function: /api/analyze
// Receives financial data, calculates metrics, calls OpenAI for plain English analysis

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    // CORS headers for all responses
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const data = JSON.parse(event.body);

        // Validate required fields
        if (!data.current || !data.company) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing required data' })
            };
        }

        // Calculate all metrics (industry needed for runway calculation)
        const industryType = data.company.industry || 'other';
        const metrics = calculateMetrics(data.current, data.previous || {}, industryType, data.ytd || null);

        // Build historical context for AI prompt
        const historicalContext = buildHistoricalContext(data.historicalReports, data.previousActions);

        // Generate plain English analysis using OpenAI
        const analysis = await generateAnalysis(data, metrics, historicalContext);

        // Get industry benchmarks
        const benchmarks = getIndustryBenchmarks(data.company.industry);

        // Calculate YTD metrics if YTD data provided
        let ytdMetrics = null;
        if (data.ytd && data.ytd.revenue > 0) {
            ytdMetrics = calculateYtdMetrics(data.ytd);
        }

        // Extract structured action items for saving
        const actionItems = [
            { title: analysis.action1Title, description: analysis.action1Desc, priority: 1 },
            { title: analysis.action2Title, description: analysis.action2Desc, priority: 2 },
            { title: analysis.action3Title, description: analysis.action3Desc, priority: 3 }
        ].filter(item => item.title && item.description);

        // Return complete report data
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                company: data.company,
                current: data.current,
                previous: data.previous,
                ytd: data.ytd,
                metrics: metrics,
                ytdMetrics: ytdMetrics,
                benchmarks: benchmarks,
                analysis: analysis,
                actionItems: actionItems
            })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Analysis failed: ' + error.message })
        };
    }
};

// ===== HISTORICAL CONTEXT BUILDER =====

function buildHistoricalContext(historicalReports, previousActions) {
    let context = '';

    // Add historical trends if available
    if (historicalReports && historicalReports.length > 0) {
        context += '\nHISTORICAL TREND (last ' + historicalReports.length + ' reports):\n';

        historicalReports.slice(0, 3).forEach((report, index) => {
            const month = report.period_month;
            const year = report.period_year;
            context += `- ${month}/${year}: Revenue ${report.revenue?.toLocaleString() || 'N/A'}, `;
            context += `Net Profit ${report.net_profit?.toLocaleString() || 'N/A'}, `;
            context += `Net Margin ${report.net_margin || 'N/A'}%, `;
            context += `Cash ${report.cash?.toLocaleString() || 'N/A'}\n`;
        });

        context += '\nUse this trend to note if this month is better/worse than recent history. ';
        context += 'Mention specific improvements or concerns.\n';
    }

    // Add previous action items if available
    if (previousActions && previousActions.length > 0) {
        context += '\nPREVIOUS RECOMMENDATIONS AND STATUS:\n';

        const completed = previousActions.filter(a => a.status === 'done');
        const pending = previousActions.filter(a => a.status === 'pending');

        if (completed.length > 0) {
            context += 'Completed since last report:\n';
            completed.forEach(action => {
                context += `- [DONE] ${action.title}\n`;
            });
        }

        if (pending.length > 0) {
            context += 'Still pending:\n';
            pending.forEach(action => {
                context += `- [NOT DONE] ${action.title}\n`;
            });
        }

        context += '\nIn your NARRATIVE, briefly acknowledge what was completed. ';
        context += 'If key items are still pending, reinforce them in your new actions.\n';
    }

    return context;
}

// ===== INDUSTRY BENCHMARKS =====
// Typical SME target ranges based on recent industry studies (not strict standards)
// Sources: Perplexity research Dec 2024, compiled from:
// - Deloitte Global Powers of Retailing 2023
// - B2B SaaS Benchmark Reports 2024
// - PwC Law Firm Survey 2023, NetSuite Professional Services
// - Restaurant margin studies (Lightspeed, CloudKitchens, Taqtics)
// - Grant Thornton Manufacturing Benchmarks 2024
// - S&P Global, Macquarie Real Estate Report 2023
// - NCBI Pharmacy studies, Nahdi/Burjeel reports
// - PwC Middle East Working Capital Study 2023
// - McGrath Nicol Working Capital Report 2023
// - CFI, Rho, JPMorgan runway guidance
// Note: Actual ranges vary by business model, geography, and company stage
function getIndustryBenchmarks(industry) {
    const benchmarks = {
        product: {
            name: 'Product/Retail',
            // Sources: Deloitte, Grant Thornton AU retail [1][2][3]
            grossMargin: { min: 20, max: 55, ideal: 40 },
            netMargin: { min: 2, max: 8, ideal: 5 },
            currentRatio: { min: 1.1, max: 2.0, ideal: 1.4 },
            quickRatio: { min: 0.5, max: 1.2, ideal: 0.9 },
            dso: { min: 10, max: 45, ideal: 22 },
            dio: { min: 30, max: 150, ideal: 90 },
            dpo: { min: 20, max: 75, ideal: 50 },
            cashRunway: { min: 6, ideal: 9 }
        },
        online: {
            name: 'Online/SaaS',
            // Sources: B2B SaaS benchmarks 2024 [4][5][6]
            grossMargin: { min: 60, max: 90, ideal: 75 },
            netMargin: { min: -10, max: 20, ideal: 10 },
            currentRatio: { min: 1.0, max: 3.0, ideal: 1.75 },
            quickRatio: { min: 1.0, max: 2.5, ideal: 1.5 },
            dso: { min: 0, max: 60, ideal: 22 },
            dio: { min: 0, max: 0, ideal: 0 },
            dpo: { min: 15, max: 45, ideal: 35 },
            cashRunway: { min: 12, ideal: 18 }
        },
        services: {
            name: 'Services/Consulting',
            // Sources: PwC Law Firm Survey, NetSuite, corporate finance refs [7][8][9]
            grossMargin: { min: 50, max: 80, ideal: 65 },
            netMargin: { min: 10, max: 30, ideal: 20 },
            currentRatio: { min: 1.1, max: 2.5, ideal: 1.75 },
            quickRatio: { min: 1.0, max: 2.0, ideal: 1.4 },
            dso: { min: 20, max: 75, ideal: 37 },
            dio: { min: 0, max: 0, ideal: 0 },
            dpo: { min: 15, max: 45, ideal: 30 },
            cashRunway: { min: 6, ideal: 9 }
        },
        food: {
            name: 'Food & Hospitality',
            // Sources: Lightspeed, CloudKitchens, Taqtics restaurant studies [10][11][12]
            grossMargin: { min: 60, max: 80, ideal: 70 },
            netMargin: { min: 0, max: 15, ideal: 6 },
            currentRatio: { min: 0.9, max: 1.8, ideal: 1.35 },
            quickRatio: { min: 0.4, max: 1.0, ideal: 0.7 },
            dso: { min: 0, max: 30, ideal: 5 },
            dio: { min: 5, max: 30, ideal: 15 },
            dpo: { min: 10, max: 45, ideal: 27 },
            cashRunway: { min: 3, ideal: 6 }
        },
        construction: {
            name: 'Construction/Real Estate',
            // Sources: S&P Global, Macquarie, EY IFRS survey [15][16][20][22]
            grossMargin: { min: 20, max: 45, ideal: 30 },
            netMargin: { min: 5, max: 25, ideal: 15 },
            currentRatio: { min: 1.0, max: 2.5, ideal: 1.55 },
            quickRatio: { min: 0.8, max: 1.5, ideal: 1.1 },
            dso: { min: 30, max: 120, ideal: 60 },
            dio: { min: 10, max: 90, ideal: 40 },
            dpo: { min: 30, max: 90, ideal: 52 },
            cashRunway: { min: 9, ideal: 12 }
        },
        manufacturing: {
            name: 'Manufacturing',
            // Sources: Grant Thornton Manufacturing 2024, Hackett Group [13][14][22][26]
            grossMargin: { min: 20, max: 45, ideal: 30 },
            netMargin: { min: 3, max: 15, ideal: 7 },
            currentRatio: { min: 1.2, max: 2.5, ideal: 1.75 },
            quickRatio: { min: 0.7, max: 1.5, ideal: 1.1 },
            dso: { min: 20, max: 75, ideal: 40 },
            dio: { min: 30, max: 120, ideal: 67 },
            dpo: { min: 30, max: 75, ideal: 52 },
            cashRunway: { min: 9, ideal: 12 }
        },
        healthcare: {
            name: 'Healthcare/Wellness',
            // Sources: NCBI Pharmacy, Nahdi, Burjeel Holdings reports [17][18][19]
            grossMargin: { min: 20, max: 60, ideal: 35 },
            netMargin: { min: 5, max: 20, ideal: 12 },
            currentRatio: { min: 1.1, max: 2.5, ideal: 1.6 },
            quickRatio: { min: 0.7, max: 1.5, ideal: 1.15 },
            dso: { min: 10, max: 90, ideal: 45 },
            dio: { min: 10, max: 90, ideal: 40 },
            dpo: { min: 20, max: 60, ideal: 37 },
            cashRunway: { min: 6, ideal: 9 }
        },
        other: {
            name: 'General Business',
            // Sources: Blended SME/corporate finance guidance [1][3][22][23]
            grossMargin: { min: 30, max: 60, ideal: 45 },
            netMargin: { min: 5, max: 15, ideal: 10 },
            currentRatio: { min: 1.1, max: 2.5, ideal: 1.75 },
            quickRatio: { min: 0.7, max: 1.5, ideal: 1.1 },
            dso: { min: 15, max: 60, ideal: 37 },
            dio: { min: 10, max: 90, ideal: 45 },
            dpo: { min: 20, max: 60, ideal: 37 },
            cashRunway: { min: 6, ideal: 9 }
        }
    };

    return benchmarks[industry] || benchmarks.other;
}

function calculateMetrics(current, previous, industryType = 'other', ytd = null) {
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
    const vatCollected = current.vatCollected || 0;
    const vatPaid = current.vatPaid || 0;

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

    // Working capital cycle (DSO/DIO/DPO)
    // Best practice: Use YTD data when available for more accurate calculation
    // Formula: (Balance Sheet Item / Period Revenue or COGS) × Days in Period
    // Sources: Wall Street Prep, Corporate Finance Institute [11][12][13]
    let dso, dio, dpo, dsoSource, dioSource, dpoSource;

    if (ytd && ytd.revenue > 0 && ytd.monthsElapsed > 1) {
        // Use YTD data - more accurate, smooths monthly fluctuations
        const ytdDays = ytd.monthsElapsed * 30; // Approximate days elapsed
        dso = (receivables / ytd.revenue) * ytdDays;
        dsoSource = 'ytd';

        if (ytd.cogs > 0) {
            dio = (inventory / ytd.cogs) * ytdDays;
            dpo = (payables / ytd.cogs) * ytdDays;
            dioSource = 'ytd';
            dpoSource = 'ytd';
        } else {
            dio = cogs > 0 ? (inventory / cogs) * 30 : 0;
            dpo = cogs > 0 ? (payables / cogs) * 30 : 0;
            dioSource = 'monthly';
            dpoSource = 'monthly';
        }
    } else {
        // Use monthly data - less accurate but only option
        const days = 30;
        dso = revenue > 0 ? (receivables / revenue) * days : 0;
        dio = cogs > 0 ? (inventory / cogs) * days : 0;
        dpo = cogs > 0 ? (payables / cogs) * days : 0;
        dsoSource = 'monthly';
        dioSource = 'monthly';
        dpoSource = 'monthly';
    }

    const ccc = dso + dio - dpo;

    // Cash Runway - using cash-balance-based burn (preferred method)
    // Formula: Cash Runway = Current Cash / Average Monthly Net Burn
    // Net Burn = (Opening Cash - Closing Cash) / Months
    // This automatically includes all cash flows: OPEX, COGS, AP payments, loan principals, etc.
    // Sources: Wall Street Prep, CFI, Perplexity research [1][2][3][5][6][7]
    const openingCash = current.openingCash || 0;
    let cashRunway, avgMonthlyBurn, runwaySource;

    if (ytd && ytd.monthsElapsed > 0 && openingCash > 0) {
        // Cash-balance-based burn (preferred - captures ALL cash movements)
        // Net Burn = (Cash at Start of Year - Cash Now) / Months Elapsed
        avgMonthlyBurn = (openingCash - cash) / ytd.monthsElapsed;

        if (avgMonthlyBurn > 0) {
            // Business is burning cash
            cashRunway = cash / avgMonthlyBurn;
            runwaySource = 'ytd_cash';
        } else {
            // Business is cash-positive (generating cash)
            cashRunway = -1; // Flag for "no burn / cash increasing"
            runwaySource = 'cash_positive';
        }
    } else {
        // Fallback: No opening cash provided, use P&L approximation
        const loanRepayments = current.loanRepayments || 0;
        const monthlyBurn = cogs + opex - netProfit + loanRepayments;

        if (monthlyBurn > 0) {
            cashRunway = cash / monthlyBurn;
            runwaySource = 'monthly_pl';
        } else {
            cashRunway = -1; // Cash positive
            runwaySource = 'cash_positive';
        }
    }

    // VAT
    const vatPayable = vatCollected - vatPaid;
    const hasVatData = vatCollected > 0 || vatPaid > 0;

    // Loan Pressure (based on loan vs cash on hand)
    // More reliable than vs revenue since we only have one month
    // Low: Loan < Cash, Medium: 1-3× Cash, High: > 3× Cash
    const loanToCash = cash > 0 ? shortTermLoans / cash : (shortTermLoans > 0 ? 999 : 0);
    let loanPressure = 'none';
    if (shortTermLoans > 0) {
        if (loanToCash < 1) loanPressure = 'low';
        else if (loanToCash <= 3) loanPressure = 'medium';
        else loanPressure = 'high';
    }
    const hasLoan = shortTermLoans > 0;
    const netCash = cash - shortTermLoans;

    // Changes vs previous
    const revenueChange = previous.revenue ? ((revenue - previous.revenue) / previous.revenue) * 100 : null;
    const profitChange = previous.netProfit !== undefined && previous.netProfit !== 0
        ? ((netProfit - previous.netProfit) / Math.abs(previous.netProfit)) * 100
        : null;
    const cashChange = previous.cash ? ((cash - previous.cash) / previous.cash) * 100 : null;

    return {
        grossProfit: Math.round(grossProfit),
        grossMargin: Math.round(grossMargin * 10) / 10,
        netMargin: Math.round(netMargin * 10) / 10,
        totalCurrentAssets: Math.round(totalCurrentAssets),
        totalCurrentLiabilities: Math.round(totalCurrentLiabilities),
        workingCapital: Math.round(workingCapital),
        currentRatio: Math.round(currentRatio * 100) / 100,
        quickRatio: Math.round(quickRatio * 100) / 100,
        dso: Math.round(dso),
        dio: Math.round(dio),
        dpo: Math.round(dpo),
        ccc: Math.round(ccc),
        // Track data source for DSO/DIO/DPO (ytd = more accurate, monthly = approximate)
        workingCapitalSource: dsoSource,
        // Cash Runway metrics
        cashRunway: cashRunway === -1 ? -1 : Math.round(cashRunway * 10) / 10,
        avgMonthlyBurn: avgMonthlyBurn ? Math.round(avgMonthlyBurn) : 0,
        runwaySource: runwaySource,
        openingCash: Math.round(openingCash),
        vatCollected: Math.round(vatCollected),
        vatPaid: Math.round(vatPaid),
        vatPayable: Math.round(vatPayable),
        hasVatData: hasVatData,
        revenueChange: revenueChange !== null ? Math.round(revenueChange * 10) / 10 : null,
        profitChange: profitChange !== null ? Math.round(profitChange * 10) / 10 : null,
        cashChange: cashChange !== null ? Math.round(cashChange * 10) / 10 : null,
        // Loan pressure metrics
        hasLoan: hasLoan,
        loanBalance: Math.round(shortTermLoans),
        loanToCash: Math.round(loanToCash * 10) / 10,
        loanPressure: loanPressure,
        netCash: Math.round(netCash)
    };
}

function calculateYtdMetrics(ytd) {
    const revenue = ytd.revenue || 0;
    const cogs = ytd.cogs || 0;
    const opex = ytd.opex || 0;
    const netProfit = ytd.netProfit || 0;
    const monthsElapsed = ytd.monthsElapsed || 1;

    const grossProfit = revenue - cogs;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    // Monthly averages
    const avgMonthlyRevenue = revenue / monthsElapsed;
    const avgMonthlyProfit = netProfit / monthsElapsed;

    return {
        revenue: Math.round(revenue),
        cogs: Math.round(cogs),
        opex: Math.round(opex),
        netProfit: Math.round(netProfit),
        grossProfit: Math.round(grossProfit),
        grossMargin: Math.round(grossMargin * 10) / 10,
        netMargin: Math.round(netMargin * 10) / 10,
        monthsElapsed: monthsElapsed,
        avgMonthlyRevenue: Math.round(avgMonthlyRevenue),
        avgMonthlyProfit: Math.round(avgMonthlyProfit)
    };
}

async function generateAnalysis(data, metrics, historicalContext = '') {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
        console.error('OpenAI API key not configured');
        return getDefaultAnalysis(data, metrics);
    }

    const currency = data.company.currency || 'USD';
    const industryType = data.company.industry || 'product';
    const language = data.language || 'en';

    const prompt = buildPrompt(data, metrics, currency, industryType, language, historicalContext);

    // Build system message based on language
    let systemMessage = '';
    if (language === 'ar') {
        systemMessage = `أنت مستشار مالي ودود تشرح الأمور المالية لصاحب عمل غير متخصص في المحاسبة في الإمارات.

أسلوب الكتابة:
- اكتب في فقرات قصيرة ومرئية، وليس نصوصاً طويلة.
- كل فكرة يجب أن تكون جملة أو جملتين كحد أقصى.
- كن مباشراً ومحدداً بالأرقام.
- لا تستخدم الرموز التعبيرية.

تنويع الجمل (استخدم هذه الأنماط):
- "هذا جيد لأن..."
- "هذا خطر لأن..."
- "سيتحسن هذا إذا..."
- "راقب هذا لأن..."

بطاقات الإجراءات:
- العنوان: 3-6 كلمات كحد أقصى، يبدأ بفعل قوي.
- الوصف: جملة واحدة قصيرة تحتوي على فعل ورقم محدد.
- مثال: "اجمع 50,000 درهم هذا الأسبوع" وليس "حسن التحصيل"

المقاييس:
- عندما يكون مقياس جيداً أو سيئاً، قارنه بالنطاقات النموذجية.
- اجعل شرح المقاييس في سطر واحد.
- اكتب التقرير بالكامل باللغة العربية.`;
    } else {
        systemMessage = `You are a friendly financial advisor explaining business finances to a non-finance business owner.

WRITING STYLE:
- Write in short visual blocks, not dense paragraphs.
- Each insight should be 1-2 sentences max, designed to fit in a UI card.
- Be direct and specific with numbers.
- Do not use emojis, em dashes, or contractions.

SENTENCE VARIETY (vary between these structures):
- "This is good because..."
- "This is a risk because..."
- "This will improve if you..."
- "Watch this because..."

ACTION CARDS:
- Title: 3-6 words max, starting with a strong verb.
- Description: One short sentence with a verb and a specific number.
- Examples: "Collect AED 50,000 this week" not "improve collections"

METRICS:
- When a metric is good or bad, compare it to typical ranges.
- Example: "Gross margin: 18%, below the typical 25-35%. This puts pressure on profit."
- Keep metric explanations to single lines that can sit next to charts.`;
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: systemMessage
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1500
            })
        });

        const result = await response.json();

        if (result.choices && result.choices[0]) {
            const content = result.choices[0].message.content;
            return parseAnalysisResponse(content, data, metrics, currency);
        } else {
            console.error('OpenAI response error:', result);
            return getDefaultAnalysis(data, metrics);
        }

    } catch (error) {
        console.error('OpenAI API error:', error);
        return getDefaultAnalysis(data, metrics);
    }
}

function buildPrompt(data, metrics, currency, industryType, language = 'en', historicalContext = '') {
    const current = data.current;
    const previous = data.previous || {};
    const benchmarks = getIndustryBenchmarks(industryType);

    // Map industry type to readable name (Arabic or English)
    const industryNames = language === 'ar' ? {
        'product': 'تجارة المنتجات (تجزئة، جملة، تجارة)',
        'online': 'أعمال إلكترونية (تطبيقات، SaaS، خدمات رقمية)',
        'services': 'أعمال خدمية (وكالات، استشارات، عمل حر)',
        'food': 'أغذية وضيافة',
        'construction': 'بناء وعقارات',
        'manufacturing': 'تصنيع وصناعة',
        'healthcare': 'صحة وعافية',
        'other': 'أخرى'
    } : {
        'product': 'Product-based business (retail, wholesale, trading)',
        'online': 'Online-only business (apps, SaaS, digital services)',
        'services': 'Services business (agency, consulting, freelance)',
        'food': 'Food & hospitality',
        'construction': 'Construction & real estate',
        'manufacturing': 'Manufacturing & industrial',
        'healthcare': 'Healthcare & wellness',
        'other': 'Other'
    };
    const industryName = industryNames[industryType] || industryType;

    let prompt = `Analyze this business's financial data and provide a plain English report.

BUSINESS INFO:
- Company: ${data.company.name}
- Type: ${industryName}
- Period: ${data.company.period.month}/${data.company.period.year}
- Currency: ${currency}

BUSINESS TYPE GUIDANCE:
Use examples and wording that fit this business type. If it is product based, talk about stock, suppliers, and product margins. If it is services, focus on utilization, project pricing, and client payments. If it is food or hospitality, mention covers, food costs, and seasonality. If unknown, stay generic.

CURRENT MONTH NUMBERS:
- Revenue: ${currency} ${current.revenue.toLocaleString()}
- Cost of Goods Sold: ${currency} ${current.cogs.toLocaleString()}
- Operating Expenses: ${currency} ${current.opex.toLocaleString()}
- Net Profit: ${currency} ${current.netProfit.toLocaleString()}
- Cash in Bank: ${currency} ${current.cash.toLocaleString()}
- Accounts Receivable: ${currency} ${current.receivables.toLocaleString()}
- Inventory: ${currency} ${current.inventory.toLocaleString()}
- Accounts Payable: ${currency} ${current.payables.toLocaleString()}
`;

    if (data.previous && data.previous.revenue) {
        prompt += `
LAST MONTH NUMBERS:
- Revenue: ${currency} ${previous.revenue.toLocaleString()}
- Net Profit: ${currency} ${previous.netProfit.toLocaleString()}
- Cash: ${currency} ${previous.cash.toLocaleString()}
`;
    }

    // Add YTD data if available
    if (data.ytd && data.ytd.revenue > 0) {
        const ytd = data.ytd;
        const ytdGrossMargin = ytd.revenue > 0 ? ((ytd.revenue - ytd.cogs) / ytd.revenue * 100).toFixed(1) : 0;
        const ytdNetMargin = ytd.revenue > 0 ? (ytd.netProfit / ytd.revenue * 100).toFixed(1) : 0;
        const avgMonthlyRevenue = Math.round(ytd.revenue / ytd.monthsElapsed);
        const avgMonthlyProfit = Math.round(ytd.netProfit / ytd.monthsElapsed);

        prompt += `
YEAR TO DATE (${ytd.monthsElapsed} months):
- YTD Revenue: ${currency} ${ytd.revenue.toLocaleString()} (avg ${currency} ${avgMonthlyRevenue.toLocaleString()}/month)
- YTD Net Profit: ${currency} ${ytd.netProfit.toLocaleString()} (avg ${currency} ${avgMonthlyProfit.toLocaleString()}/month)
- YTD Gross Margin: ${ytdGrossMargin}%
- YTD Net Margin: ${ytdNetMargin}%

YTD COMPARISON RULES:
- In the HERO_SUMMARY, include YTD context with direction, e.g. "You made AED 55K profit this month (AED 320K YTD, slightly above your usual month)."
- Only mention YTD in the NARRATIVE if this month differs from YTD average by more than 10-15%.
- Keep the focus on THIS MONTH - YTD is context, not the main story.
`;
    }

    // Add historical context (trends and previous actions)
    if (historicalContext) {
        prompt += historicalContext;
    }

    const wcSource = metrics.workingCapitalSource === 'ytd' ? 'YTD data (more accurate)' : 'this month only (approximate)';

    // Runway source description
    let runwaySourceDesc;
    if (metrics.runwaySource === 'ytd_cash') {
        runwaySourceDesc = 'YTD actual cash movement (most accurate)';
    } else if (metrics.runwaySource === 'cash_positive') {
        runwaySourceDesc = 'N/A - business is cash-positive (generating cash)';
    } else {
        runwaySourceDesc = 'P&L approximation (less accurate)';
    }

    // Format runway display
    const runwayDisplay = metrics.cashRunway === -1
        ? 'N/A (cash-positive)'
        : `${metrics.cashRunway} months`;

    prompt += `
CALCULATED METRICS WITH INDUSTRY BENCHMARKS FOR ${benchmarks.name.toUpperCase()}:
- Gross Margin: ${metrics.grossMargin}% (industry typical: ${benchmarks.grossMargin.min}-${benchmarks.grossMargin.max}%, ideal: ${benchmarks.grossMargin.ideal}%)
- Net Margin: ${metrics.netMargin}% (industry typical: ${benchmarks.netMargin.min}-${benchmarks.netMargin.max}%, ideal: ${benchmarks.netMargin.ideal}%)
- Margin Gap: ${(metrics.grossMargin - metrics.netMargin).toFixed(0)} percentage points between GM and NM
- Current Ratio: ${metrics.currentRatio} (industry typical: ${benchmarks.currentRatio.min}-${benchmarks.currentRatio.max}, ideal: ${benchmarks.currentRatio.ideal})
- Cash Runway: ${runwayDisplay} based on ${runwaySourceDesc} (industry minimum: ${benchmarks.cashRunway.min}+ months, ideal: ${benchmarks.cashRunway.ideal}+ months)
${metrics.avgMonthlyBurn > 0 ? `- Average Monthly Cash Burn: ${currency} ${metrics.avgMonthlyBurn.toLocaleString()} per month` : ''}

WORKING CAPITAL CYCLE (calculated using ${wcSource}):
- Days Sales Outstanding (DSO): ${metrics.dso} days (industry typical: ${benchmarks.dso.min}-${benchmarks.dso.max} days, ideal: ${benchmarks.dso.ideal} days)
${benchmarks.dio.ideal > 0 ? `- Days Inventory Outstanding (DIO): ${metrics.dio} days (industry typical: ${benchmarks.dio.min}-${benchmarks.dio.max} days, ideal: ${benchmarks.dio.ideal} days)` : `- Days Inventory Outstanding (DIO): ${metrics.dio} days (not typically applicable for this industry)`}
- Days Payable Outstanding (DPO): ${metrics.dpo} days (industry typical: ${benchmarks.dpo.min}-${benchmarks.dpo.max} days, ideal: ${benchmarks.dpo.ideal} days)
- Cash Conversion Cycle: ${metrics.ccc} days (total days cash is tied up, lower is better)

METRIC EVALUATION:
- Gross Margin is ${metrics.grossMargin >= benchmarks.grossMargin.min ? (metrics.grossMargin >= benchmarks.grossMargin.ideal ? 'GOOD - at or above industry ideal' : 'OK - within industry range') : 'LOW - below industry minimum, needs attention'}
- Net Margin is ${metrics.netMargin >= benchmarks.netMargin.min ? (metrics.netMargin >= benchmarks.netMargin.ideal ? 'GOOD - at or above industry ideal' : 'OK - within industry range') : 'LOW - below industry minimum, needs attention'}
- Current Ratio is ${metrics.currentRatio >= benchmarks.currentRatio.min ? (metrics.currentRatio >= benchmarks.currentRatio.ideal ? 'GOOD - healthy liquidity' : 'OK - adequate') : 'LOW - liquidity risk'}
- Cash Runway is ${metrics.cashRunway === -1 ? 'EXCELLENT - cash-positive, no burn' : (metrics.cashRunway >= benchmarks.cashRunway.ideal ? 'GOOD - comfortable buffer' : (metrics.cashRunway >= benchmarks.cashRunway.min ? 'OK - adequate but watch closely' : 'LOW - needs immediate attention'))}
- DSO is ${metrics.dso <= benchmarks.dso.ideal ? 'GOOD - collecting quickly' : (metrics.dso <= benchmarks.dso.max ? 'OK - within range' : 'HIGH - customers paying too slowly')}

NET MARGIN INSIGHT:
${metrics.grossMargin >= benchmarks.grossMargin.min && metrics.netMargin < benchmarks.netMargin.min && (metrics.grossMargin - metrics.netMargin) >= 15
    ? `IMPORTANT: Gross margin is healthy (${metrics.grossMargin}%) but net margin is low (${metrics.netMargin}%). This ${(metrics.grossMargin - metrics.netMargin).toFixed(0)} point gap indicates high overheads, finance costs, or owner drawings. Mention this in your narrative with specific reference to what is likely eating the profit.`
    : metrics.netMargin < benchmarks.netMargin.min
        ? `Net margin is below industry minimum (${metrics.netMargin}% vs ${benchmarks.netMargin.min}% minimum). This needs attention - mention in narrative.`
        : `Net margin is ${metrics.netMargin >= benchmarks.netMargin.ideal ? 'healthy' : 'acceptable'} for this industry at ${metrics.netMargin}%.`}
${metrics.hasLoan ? `
LOAN SITUATION:
- Short-term Loan Balance: ${currency} ${metrics.loanBalance.toLocaleString()}
- Loan is ${metrics.loanToCash}× current cash (Pressure: ${metrics.loanPressure})
- Net Cash (Cash minus Loan): ${currency} ${metrics.netCash.toLocaleString()}
${metrics.loanPressure === 'high' ? '- HIGH PRESSURE: Loan exceeds 3× cash. Mention this risk in narrative and suggest building cash buffer.' : ''}
${metrics.loanPressure === 'medium' ? '- MEDIUM PRESSURE: Loan is 1-3× cash. Worth mentioning to watch collections closely.' : ''}
${metrics.loanPressure === 'low' ? '- LOW PRESSURE: Loan is less than cash. Manageable position.' : ''}
` : ''}
Use these metrics in your analysis. If any metric is notably above or below the typical range, explain what it means for this business.

Please provide:

1. HERO_SUMMARY: One punchy sentence answering "Did you make money?" with the profit/loss amount. Example: "You made ${currency} 55,000 profit. For every ${currency} 1 of sales, you kept 11 fils."

2. NARRATIVE: 2-3 short blocks (not paragraphs). Each block is 1-2 sentences. Start each with "Good:", "Risk:", or "Watch:" as appropriate. Be specific with numbers.

3. CASH_CYCLE_EXPLANATION: Exactly 2 short sentences only.
   - First sentence: How many days cash is tied up and whether this is good, normal, or risky.
   - Second sentence: What would improve it, with a specific number.
   - Example: "Cash is tied up for 21 days, which is normal. Move supplier payments from 9 to 30 days to free up cash."

4. ACTION_1: The most urgent action.
   - Title: 3-6 words, starts with a verb (e.g. "Collect ${currency} 50,000 from customers")
   - Description: One sentence with a verb and a number (e.g. "Call your top 3 late-paying customers and collect ${currency} 50,000 this week.")

5. ACTION_2: Second priority action. Same format as ACTION_1.

6. ACTION_3: Third action. Same format as ACTION_1.

7. MEETING_SUMMARY: 2-3 sentences an owner can say when asked "How is your business doing?" Include revenue, profit margin, and one key focus area.

Format your response EXACTLY like this (each label on its own line):

HERO_SUMMARY: [your text here]

NARRATIVE: [your text here]

CASH_CYCLE_EXPLANATION: [your text here]

ACTION_1_TITLE: [title here]

ACTION_1_DESC: [description here]

ACTION_2_TITLE: [title here]

ACTION_2_DESC: [description here]

ACTION_3_TITLE: [title here]

ACTION_3_DESC: [description here]

MEETING_SUMMARY: [your text here]

IMPORTANT: Put each section on its own line. Do not combine multiple sections on one line.`;

    return prompt;
}

function parseAnalysisResponse(content, data, metrics, currency) {
    const sections = {
        heroSummary: extractSection(content, 'HERO_SUMMARY'),
        narrative: extractSection(content, 'NARRATIVE'),
        cashCycleExplanation: extractSection(content, 'CASH_CYCLE_EXPLANATION'),
        action1Title: extractSection(content, 'ACTION_1_TITLE'),
        action1Desc: extractSection(content, 'ACTION_1_DESC'),
        action2Title: extractSection(content, 'ACTION_2_TITLE'),
        action2Desc: extractSection(content, 'ACTION_2_DESC'),
        action3Title: extractSection(content, 'ACTION_3_TITLE'),
        action3Desc: extractSection(content, 'ACTION_3_DESC'),
        meetingSummary: extractSection(content, 'MEETING_SUMMARY')
    };

    // If parsing failed, return defaults
    if (!sections.heroSummary || !sections.narrative) {
        return getDefaultAnalysis(data, metrics);
    }

    return sections;
}

function extractSection(content, sectionName) {
    // Split approach: find the section start and extract until next section
    const sectionStart = content.indexOf(sectionName + ':');
    if (sectionStart === -1) return null;

    // Get content after the label
    const afterLabel = content.substring(sectionStart + sectionName.length + 1);

    // Find where the next section starts (pattern: UPPERCASE_WORD:)
    const nextSectionMatch = afterLabel.match(/\s+([A-Z][A-Z0-9_]+):/);

    if (nextSectionMatch) {
        // Extract text before the next section
        const endIndex = afterLabel.indexOf(nextSectionMatch[0]);
        return afterLabel.substring(0, endIndex).trim();
    }

    // No next section found, return everything after label
    return afterLabel.trim();
}

function getDefaultAnalysis(data, metrics) {
    const currency = data.company?.currency || 'USD';
    const current = data.current;

    const profitStatus = current.netProfit > 0 ? 'made a profit' : current.netProfit < 0 ? 'made a loss' : 'broke even';
    const marginPerUnit = (metrics.netMargin / 100).toFixed(2);

    return {
        heroSummary: `You ${profitStatus} of ${currency} ${Math.abs(current.netProfit).toLocaleString()} this month. From every ${currency} 1 of sales, you kept ${currency} ${marginPerUnit} as profit.`,

        narrative: `This month you generated ${currency} ${current.revenue.toLocaleString()} in revenue. Your gross margin is ${metrics.grossMargin}%, which means you keep ${currency} ${(metrics.grossMargin / 100).toFixed(2)} from each ${currency} 1 of sales after product costs.\n\nYour cash position is ${currency} ${current.cash.toLocaleString()}, which gives you about ${metrics.cashRunway} months of runway at current spending levels.${metrics.cashRunway < 3 ? ' This is below the safe level of 3 months.' : ''}`,

        cashCycleExplanation: `Your cash is tied up for ${metrics.ccc} days. Stock sits in your warehouse for ${metrics.dio} days, then customers take ${metrics.dso} days to pay you, but you pay suppliers in ${metrics.dpo} days. ${metrics.ccc > 30 ? 'This cycle is longer than ideal, meaning you need more working capital to keep the business running.' : 'This is a reasonable cycle for your type of business.'}`,

        action1Title: metrics.cashRunway < 3
            ? `Collect ${currency} ${Math.round(current.receivables * 0.3).toLocaleString()} from customers`
            : 'Review your pricing strategy',
        action1Desc: metrics.cashRunway < 3
            ? `You have ${currency} ${current.receivables.toLocaleString()} in receivables. Contact your top 3 customers this week and agree on payment dates.`
            : `Your margins could be improved. Review if your prices reflect your true costs and value.`,

        action2Title: metrics.dpo < 20
            ? 'Negotiate longer payment terms with suppliers'
            : 'Monitor your cash position weekly',
        action2Desc: metrics.dpo < 20
            ? `You are paying suppliers in ${metrics.dpo} days. Ask your main suppliers for 30-day terms to keep cash longer.`
            : 'Set up a weekly check on your bank balance and outstanding invoices.',

        action3Title: metrics.dio > 30
            ? 'Reduce inventory levels'
            : 'Keep building your cash buffer',
        action3Desc: metrics.dio > 30
            ? `Stock sits for ${metrics.dio} days. Order smaller quantities more frequently to free up cash.`
            : `Aim to have at least 3 months of expenses in cash reserves for safety.`,

        meetingSummary: `Our revenue is ${currency} ${current.revenue.toLocaleString()} with a net margin of ${metrics.netMargin}%. We are ${current.netProfit >= 0 ? 'profitable' : 'working to return to profitability'} and focused on ${metrics.cashRunway < 3 ? 'improving our cash position' : 'maintaining healthy cash flow'}. Current ratio is ${metrics.currentRatio}.`
    };
}
