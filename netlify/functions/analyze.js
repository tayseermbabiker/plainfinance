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
        const metrics = calculateMetrics(data.current, data.previous || {}, industryType);

        // Generate plain English analysis using OpenAI
        const analysis = await generateAnalysis(data, metrics);

        // Get industry benchmarks
        const benchmarks = getIndustryBenchmarks(data.company.industry);

        // Calculate YTD metrics if YTD data provided
        let ytdMetrics = null;
        if (data.ytd && data.ytd.revenue > 0) {
            ytdMetrics = calculateYtdMetrics(data.ytd);
        }

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
                analysis: analysis
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

// ===== CONFIGURABLE: Fixed cost share of COGS for cash runway =====
// Represents how much of COGS must be paid even with zero sales
// Source: Industry analysis, adjust based on real user feedback
const RUNWAY_COGS_SHARE = {
    product: 0,        // Product/Retail/Trading: COGS is inventory, variable
    online: 1.0,       // SaaS/Software: COGS is hosting + support, fixed
    services: 1.0,     // Services/IT/Consulting: COGS is staff, fixed
    food: 0.3,         // Food & Hospitality: 30% fixed (staff), 70% variable (ingredients)
    construction: 0,   // Construction: COGS is materials, variable per project
    manufacturing: 0.5, // Manufacturing: 50% fixed (labor), 50% variable (materials)
    healthcare: 1.0,   // Healthcare: COGS is mostly staff, fixed
    other: 0.3         // Default: conservative 30%
};

function getIndustryBenchmarks(industry) {
    // UAE/GCC industry benchmarks based on typical ranges
    const benchmarks = {
        product: {
            name: 'Product/Retail',
            grossMargin: { min: 25, max: 40, ideal: 30 },
            netMargin: { min: 3, max: 10, ideal: 5 },
            currentRatio: { min: 1.2, max: 2.0, ideal: 1.5 },
            dso: { min: 15, max: 45, ideal: 30 },
            dio: { min: 30, max: 90, ideal: 45 },
            dpo: { min: 30, max: 60, ideal: 45 }
        },
        online: {
            name: 'Online/SaaS',
            grossMargin: { min: 60, max: 85, ideal: 70 },
            netMargin: { min: 10, max: 30, ideal: 20 },
            currentRatio: { min: 1.5, max: 3.0, ideal: 2.0 },
            dso: { min: 0, max: 30, ideal: 15 },
            dio: { min: 0, max: 0, ideal: 0 },
            dpo: { min: 15, max: 45, ideal: 30 }
        },
        services: {
            name: 'Services/Consulting',
            grossMargin: { min: 40, max: 70, ideal: 50 },
            netMargin: { min: 10, max: 25, ideal: 15 },
            currentRatio: { min: 1.2, max: 2.5, ideal: 1.5 },
            dso: { min: 30, max: 60, ideal: 45 },
            dio: { min: 0, max: 0, ideal: 0 },
            dpo: { min: 15, max: 30, ideal: 20 }
        },
        food: {
            name: 'Food & Hospitality',
            grossMargin: { min: 55, max: 75, ideal: 65 },
            netMargin: { min: 3, max: 12, ideal: 8 },
            currentRatio: { min: 0.8, max: 1.5, ideal: 1.0 },
            dso: { min: 0, max: 15, ideal: 7 },
            dio: { min: 3, max: 14, ideal: 7 },
            dpo: { min: 15, max: 30, ideal: 20 }
        },
        construction: {
            name: 'Construction/Real Estate',
            grossMargin: { min: 15, max: 30, ideal: 20 },
            netMargin: { min: 5, max: 15, ideal: 10 },
            currentRatio: { min: 1.2, max: 2.0, ideal: 1.5 },
            dso: { min: 45, max: 90, ideal: 60 },
            dio: { min: 30, max: 60, ideal: 45 },
            dpo: { min: 30, max: 60, ideal: 45 }
        },
        manufacturing: {
            name: 'Manufacturing',
            grossMargin: { min: 20, max: 40, ideal: 30 },
            netMargin: { min: 5, max: 12, ideal: 8 },
            currentRatio: { min: 1.5, max: 2.5, ideal: 2.0 },
            dso: { min: 30, max: 60, ideal: 45 },
            dio: { min: 45, max: 90, ideal: 60 },
            dpo: { min: 30, max: 60, ideal: 45 }
        },
        healthcare: {
            name: 'Healthcare/Wellness',
            grossMargin: { min: 40, max: 60, ideal: 50 },
            netMargin: { min: 8, max: 20, ideal: 12 },
            currentRatio: { min: 1.2, max: 2.0, ideal: 1.5 },
            dso: { min: 30, max: 60, ideal: 45 },
            dio: { min: 15, max: 45, ideal: 30 },
            dpo: { min: 30, max: 45, ideal: 35 }
        },
        other: {
            name: 'General Business',
            grossMargin: { min: 25, max: 50, ideal: 35 },
            netMargin: { min: 5, max: 15, ideal: 10 },
            currentRatio: { min: 1.2, max: 2.0, ideal: 1.5 },
            dso: { min: 30, max: 60, ideal: 45 },
            dio: { min: 30, max: 60, ideal: 45 },
            dpo: { min: 30, max: 45, ideal: 35 }
        }
    };

    return benchmarks[industry] || benchmarks.other;
}

function calculateMetrics(current, previous, industryType = 'other') {
    const days = 30;

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

    // Working capital cycle
    const dso = revenue > 0 ? (receivables / revenue) * days : 0;
    const dio = cogs > 0 ? (inventory / cogs) * days : 0;
    const dpo = cogs > 0 ? (payables / cogs) * days : 0;
    const ccc = dso + dio - dpo;

    // Cash runway (industry-aware)
    // Formula: Cash / Fixed Monthly Costs
    // Fixed costs = OPEX + (COGS × industry-specific fixed share)
    const cogsShare = RUNWAY_COGS_SHARE[industryType] || RUNWAY_COGS_SHARE.other;
    const fixedMonthlyCosts = opex + (cogs * cogsShare);
    const cashRunway = fixedMonthlyCosts > 0 ? cash / fixedMonthlyCosts : 0;

    // VAT
    const vatPayable = vatCollected - vatPaid;
    const hasVatData = vatCollected > 0 || vatPaid > 0;

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
        cashRunway: Math.round(cashRunway * 10) / 10,
        vatCollected: Math.round(vatCollected),
        vatPaid: Math.round(vatPaid),
        vatPayable: Math.round(vatPayable),
        hasVatData: hasVatData,
        revenueChange: revenueChange !== null ? Math.round(revenueChange * 10) / 10 : null,
        profitChange: profitChange !== null ? Math.round(profitChange * 10) / 10 : null,
        cashChange: cashChange !== null ? Math.round(cashChange * 10) / 10 : null
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

async function generateAnalysis(data, metrics) {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
        console.error('OpenAI API key not configured');
        return getDefaultAnalysis(data, metrics);
    }

    const currency = data.company.currency || 'AED';
    const industryType = data.company.industry || 'product';
    const language = data.language || 'en';

    const prompt = buildPrompt(data, metrics, currency, industryType, language);

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
        systemMessage = `You are a friendly financial advisor explaining business finances to a non-finance business owner in the UAE.

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

function buildPrompt(data, metrics, currency, industryType, language = 'en') {
    const current = data.current;
    const previous = data.previous || {};

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

    prompt += `
CALCULATED METRICS:
- Gross Margin: ${metrics.grossMargin}% (typical for this business type: 25-40%)
- Net Margin: ${metrics.netMargin}% (healthy is 10%+, below 5% is concerning)
- Current Ratio: ${metrics.currentRatio} (healthy is 1.5+, below 1 is risky)
- Cash Runway: ${metrics.cashRunway} months (safe is 3+ months)
- Days Sales Outstanding (DSO): ${metrics.dso} days (how long customers take to pay)
- Days Inventory Outstanding (DIO): ${metrics.dio} days (how long stock sits before selling)
- Days Payable Outstanding (DPO): ${metrics.dpo} days (how long you take to pay suppliers)
- Cash Conversion Cycle: ${metrics.ccc} days (total days cash is tied up, lower is better)

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
    // More robust regex that handles missing newlines
    // Stops at the next SECTION_NAME: pattern or end of string
    const regex = new RegExp(`${sectionName}:\\s*(.+?)(?=\\s*[A-Z_]+:|$)`, 's');
    const match = content.match(regex);
    if (match) {
        // Clean up the result - remove any trailing section labels that got captured
        let result = match[1].trim();
        // Remove any captured trailing labels like "ACTION_2_TITLE:" etc.
        result = result.replace(/\s*(ACTION_\d+_TITLE|ACTION_\d+_DESC|HERO_SUMMARY|NARRATIVE|CASH_CYCLE_EXPLANATION|MEETING_SUMMARY):.*$/s, '');
        return result.trim();
    }
    return null;
}

function getDefaultAnalysis(data, metrics) {
    const currency = data.company?.currency || 'AED';
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
