# PlainFinancials — Technical Calculation Stack

## Overview

PlainFinancials takes user financial data (monthly P&L + balance sheet), calculates working capital and cash flow metrics, generates benchmarked insights via OpenAI GPT-4o-mini, and presents findings in an 8-section report.

## Architecture

```
User form (analyze.html) → POST /api/analyze (Netlify Function)
  → calculateMetrics() — all KPIs computed server-side
  → buildPrompt() — creates OpenAI prompt with benchmarks
  → OpenAI gpt-4o-mini (temp: 0.7, max tokens: 1500)
  → parseAnalysisResponse() — extracts 8 labeled sections
  → Returns JSON → localStorage → report-sky.html displays it
```

---

## User Input Fields

### Required
- Company name, industry, month/year, currency
- Revenue, COGS, OPEX, Net Profit
- Cash in bank, Accounts Receivable, Accounts Payable

### Optional
- Inventory, Short-term loans, Other liabilities
- VAT collected/paid
- Loan repayments, Owner drawings, Asset purchases
- Previous month data (revenue, profit, cash, AR, inventory, AP)
- YTD data (revenue, COGS, OPEX, profit, starting cash, months elapsed)

---

## Metric Formulas

### Profitability
```
Gross Profit = Revenue - COGS
Gross Margin % = (Gross Profit / Revenue) x 100
Net Margin % = (Net Profit / Revenue) x 100
```

### Liquidity
```
Total Current Assets = Cash + Receivables + Inventory
Total Current Liabilities = Payables + Short-Term Loans + Other Liabilities
Current Ratio = Total Assets / Total Liabilities
Quick Ratio = (Cash + Receivables) / Total Liabilities
Working Capital = Total Assets - Total Liabilities
```

### Working Capital Cycle

If YTD data available (more accurate):
```
YTD Days = monthsElapsed x 30
DSO = (Receivables / YTD Revenue) x YTD Days
DIO = (Inventory / YTD COGS) x YTD Days
DPO = (Payables / YTD COGS) x YTD Days
```

If only monthly data:
```
DSO = (Receivables / Revenue) x 30
DIO = (Inventory / COGS) x 30
DPO = (Payables / COGS) x 30
```

```
Cash Conversion Cycle (CCC) = DSO + DIO - DPO
```

### Cash Runway

Priority order:
1. **YTD method** (most accurate): Monthly Burn = (Starting Cash - Current Cash) / Months Elapsed
2. **Monthly comparison**: Monthly Burn = Previous Cash - Current Cash
3. **Opex fallback**: Monthly Burn = COGS + OPEX - Net Profit + Loan Repayments

```
Cash Runway = Current Cash / Monthly Burn (in months)
If burn <= 0: runway = -1 (cash positive)
```

### Free Cash Flow (FCF)
```
WC Changes = (AR change) + (Inventory change) - (AP change)
  (If no previous data: estimated from DSO/DIO/DPO deviations from 30 days)
CapEx = Asset Purchases
FCF = Net Profit - WC Changes - CapEx
```

### FCFF (Free Cash Flow to Firm)
```
FCFF = FCF - Loan Repayments
Coverage Ratio = FCF / Loan Repayments
```

### Loan Pressure
```
Loan-to-Cash Ratio = Short-Term Loans / Cash
None (no loans), Low (<1x), Medium (1-3x), High (>3x)
```

---

## Industry Benchmarks

### Sources
- Deloitte Global Powers of Retailing 2023
- B2B SaaS Benchmark Reports 2024
- PwC Law Firm Survey 2023
- Lightspeed, CloudKitchens, Taqtics (restaurant studies)
- Grant Thornton Manufacturing Benchmarks 2024
- S&P Global, Macquarie Real Estate Report 2023
- PwC Middle East Working Capital Study 2023
- McGrath Nicol Working Capital Report 2023
- CreditPulse 2025, ReadyRatios SEC 2024
- Hackett Group 2025

### Benchmark Values (Min / Max / Ideal)

| Industry | Gross Margin | Net Margin | DSO (days) | DIO (days) | DPO (days) | Cash Runway |
|----------|-------------|------------|------------|------------|------------|-------------|
| Product/Retail | 20-55% / 40% | 2-8% / 5% | 10-45 / 22 | 30-150 / 90 | 20-75 / 50 | 6-9 mo |
| Online/SaaS | 60-90% / 75% | -10-20% / 10% | 0-60 / 22 | 0 / 0 | 15-45 / 35 | 12-18 mo |
| Services | 50-80% / 65% | 10-30% / 20% | 20-75 / 37 | 0 / 0 | 15-45 / 30 | 6-9 mo |
| Restaurant | 60-80% / 70% | 0-15% / 6% | 0-30 / 5 | 5-30 / 15 | 10-45 / 27 | 3-6 mo |
| Construction | 20-45% / 30% | 5-25% / 15% | 30-120 / 60 | 10-90 / 40 | 30-90 / 52 | 9-12 mo |
| Manufacturing | 20-45% / 30% | 3-15% / 7% | 20-75 / 40 | 30-120 / 67 | 30-75 / 52 | 9-12 mo |
| Healthcare | 20-60% / 35% | 5-20% / 12% | 10-90 / 45 | 10-90 / 40 | 20-60 / 37 | 6-9 mo |
| General | 30-60% / 45% | 5-15% / 10% | 15-60 / 37 | 10-90 / 45 | 20-60 / 37 | 6-9 mo |

### Client-Side Benchmarks (report-sky.js — older set, used for display)

| Industry | Gross Margin | Net Margin | DSO | DIO | DPO |
|----------|-------------|------------|-----|-----|-----|
| Retail | 25-50% / 35% | 2-10% / 5% | 0-10 / 2 | 30-60 / 45 | 20-45 / 30 |
| Product | 30-55% / 40% | 5-15% / 10% | 20-45 / 30 | 30-60 / 45 | 20-45 / 30 |
| Service | 40-70% / 55% | 10-25% / 15% | 30-60 / 45 | 0 / 0 | 20-45 / 30 |
| E-commerce | 20-45% / 30% | 3-12% / 7% | 0-5 / 1 | 20-45 / 30 | 20-45 / 30 |
| Manufacturing | 20-40% / 30% | 3-12% / 7% | 45-75 / 60 | 60-120 / 90 | 30-60 / 45 |
| Wholesale | 15-30% / 22% | 2-8% / 5% | 25-50 / 35 | 30-60 / 45 | 25-50 / 35 |
| Restaurant | 55-70% / 62% | 3-10% / 6% | 0-3 / 1 | 3-10 / 7 | 14-30 / 21 |
| Construction | 15-35% / 25% | 2-10% / 5% | 60-120 / 90 | 7-30 / 15 | 45-90 / 60 |

**Note:** Two benchmark sets exist — server-side (analyze.js, more detailed) and client-side (report-sky.js, used for visual bars). These should be unified.

---

## OpenAI Integration

### Model
- **GPT-4o-mini** — temperature 0.7, max tokens 1500

### What Gets Sent
The prompt includes:
1. Company info (name, industry, period, currency)
2. All current month financials
3. Previous month data (if provided)
4. YTD data with averages (if provided)
5. Historical trend (last 3 reports if available)
6. Previous action items and their completion status
7. All calculated metrics WITH industry benchmark ranges
8. Metric evaluations (GOOD/OK/LOW for each)
9. Net margin gap analysis (if GM healthy but NM low)
10. Loan situation assessment

### What Comes Back (8 Sections)
```
HERO_SUMMARY: One sentence — "Did you make money?" with specific numbers
NARRATIVE: 2-3 short blocks with "Good:", "Risk:", "Watch:" prefixes
CASH_CYCLE_EXPLANATION: Exactly 2 sentences about CCC
ACTION_1_TITLE + ACTION_1_DESC: Most urgent action (verb + number)
ACTION_2_TITLE + ACTION_2_DESC: Second priority
ACTION_3_TITLE + ACTION_3_DESC: Third action
MEETING_SUMMARY: 2-3 sentences for bank/investor conversations
BENCHMARK_NOTE: One sentence comparing key metric to industry
```

### Fallback (No AI)
Auto-generated text based on metric values and thresholds. Less nuanced but functional.

---

## Industry-Specific Advice

### AR (Receivables) Advice
- Service: Require 50% upfront deposit, transition to retainers
- Wholesale: Offer 2/10 Net 30 discount
- Construction: Standardize progress billings, follow up retentions
- Manufacturing: Implement credit limits for slow distributors
- Retail/E-commerce: Audit payment gateway settlement times
- Restaurant: Move B2B catering to automated credit card billing

### Inventory Advice
- Retail: Flash sale on old stock
- E-commerce: Shift slow-movers to just-in-time
- Manufacturing: Streamline WIP to finished goods
- Wholesale: ABC analysis, stop over-ordering Category C
- Restaurant: Check waste and portion control
- Construction: Align material delivery with project phases

### AP (Payables) Advice
- Construction: Align payments to client milestone receipts
- Retail/Product: Check if early payment discounts beat cost of capital
- Default: Renegotiate for 30-45 day terms

### CCC Advice
- Negative CCC: Self-funding (good) but watch supplier relationships
- CCC 30-60: Moderate, manageable
- CCC > 60: Industry-specific warnings (overtrading, unbilled revenue, etc.)
- CCC > 90: Critical — consider invoice factoring

---

## Report Sections (Display)

1. **Owner Headline** — conversational one-liner based on profit + runway tier
2. **Top 5 Summary** — 5 bullet points with colored status dots
3. **Health Strip** — Safe/Tight/Danger with metrics bar
4. **P&L Snapshot** — Revenue → Gross Profit → EBITDA → Net Income with benchmark bars
5. **Profit Interpretation** — AI narrative or auto-generated
6. **Operational Health** — DSO/DIO/DPO cards, CCC, WCR table with variance
7. **Free Cash Flow** — waterfall (Net Profit → WC changes → CapEx = FCF)
8. **FCFF** — FCF minus loan repayments (conditional)
9. **Cash Runway** — big number + benchmark + cashout date
10. **Bank Meeting Summary** — ready-to-use quote
11. **Weekly Actions** — 3 prioritized with urgency tags

---

## Known Gaps / Enhancement Opportunities

### From Restaurant Test Case
1. **No industry-specific KPIs** — restaurant needs food cost %, prime cost (food + labour), food cost target (28-32%)
2. **No cash bridge** — should show: starting cash → +profit → -inventory → -loan repayments → -owner drawings = ending cash
3. **COGS not relabeled** — should say "Food & Ingredient Cost" for restaurants, "Materials" for manufacturing, etc.
4. **Owner drawings not visible** — hidden in expenses, should be surfaced separately
5. **No prime cost calculation** — food + labour combined is THE restaurant metric
6. **Cash vs AP ratio missing** — critical for restaurants (cash / accounts payable)
7. **Days of revenue in bank** — more intuitive than months of runway for restaurants
8. **Two benchmark sets not unified** — server (analyze.js) and client (report-sky.js) have different values
9. **No industry tag in header** — should show the industry type
10. **Actions too generic** — restaurant should get "Run food cost audit on top 10 menu items" not "Reduce inventory levels"

### General
- Benchmark bars use client-side benchmarks which differ from server-side benchmarks sent to OpenAI
- No scenario analysis implementation (Pro feature listed)
- No historical trend visualization (data is collected but not charted)
