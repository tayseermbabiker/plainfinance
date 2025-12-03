// Netlify Function: /api/analyze
// Receives financial data, calculates metrics, calls OpenAI for plain English analysis

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const data = JSON.parse(event.body);

        // Validate required fields
        if (!data.current || !data.company) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required data' })
            };
        }

        // Calculate all metrics
        const metrics = calculateMetrics(data.current, data.previous || {});

        // Generate plain English analysis using OpenAI
        const analysis = await generateAnalysis(data, metrics);

        // Get industry benchmarks
        const benchmarks = getIndustryBenchmarks(data.company.industry);

        // Return complete report data
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                company: data.company,
                current: data.current,
                previous: data.previous,
                metrics: metrics,
                benchmarks: benchmarks,
                analysis: analysis
            })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Analysis failed. Please try again.' })
        };
    }
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

function calculateMetrics(current, previous) {
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

    // Cash runway
    const monthlyBurn = opex;
    const cashRunway = monthlyBurn > 0 ? cash / monthlyBurn : 0;

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

async function generateAnalysis(data, metrics) {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
        console.error('OpenAI API key not configured');
        return getDefaultAnalysis(data, metrics);
    }

    const currency = data.company.currency || 'AED';
    const industryType = data.company.industry || 'product';

    const prompt = buildPrompt(data, metrics, currency, industryType);

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
                        content: `You are a friendly financial advisor explaining business finances to a non-finance business owner in the UAE.

Rules:
- Use simple, everyday language. No jargon.
- Be direct and specific with numbers.
- Focus on what matters and what to do about it.
- Do not use emojis.
- Do not use em dashes. Use commas or periods instead.
- Do not use contractions (use "do not" instead of "don't").
- Be encouraging but honest about problems.
- Keep explanations short and actionable.
- Every action must include a clear verb and a specific number (e.g. "Collect AED 50,000 from customers" not "improve collections").
- When a metric is notably good or bad, compare it to typical ranges (e.g. "Your gross margin is 18%, which is below the typical 25-35% for product businesses").`
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

function buildPrompt(data, metrics, currency, industryType) {
    const current = data.current;
    const previous = data.previous || {};

    // Map industry type to readable name
    const industryNames = {
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

1. HERO_SUMMARY: One sentence answering "Did you make money this month?" with the profit/loss amount and what it means per ${currency} 1 of sales.

2. NARRATIVE: 2-3 short paragraphs explaining what happened this month. Start each paragraph with "The good news:", "The concern:", or "Watch out:" as appropriate. Be specific with numbers.

3. CASH_CYCLE_EXPLANATION: One paragraph explaining the cash cycle in simple terms. How long is money tied up? Why? What does it mean for the business?

4. ACTION_1: Most urgent action with specific numbers (title and description)
5. ACTION_2: Second priority action with specific numbers (title and description)
6. ACTION_3: Third action with specific numbers (title and description)

7. MEETING_SUMMARY: A 2-3 sentence script the owner can use when a banker or investor asks "How is your business doing?"

Format your response exactly like this:
HERO_SUMMARY: [your text]
NARRATIVE: [your text]
CASH_CYCLE_EXPLANATION: [your text]
ACTION_1_TITLE: [title]
ACTION_1_DESC: [description]
ACTION_2_TITLE: [title]
ACTION_2_DESC: [description]
ACTION_3_TITLE: [title]
ACTION_3_DESC: [description]
MEETING_SUMMARY: [your text]`;

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
    const regex = new RegExp(`${sectionName}:\\s*(.+?)(?=\\n[A-Z_]+:|$)`, 's');
    const match = content.match(regex);
    return match ? match[1].trim() : null;
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
