# PlainFinancials — Industry-Adaptive Report Implementation Plan

## Reference Files
- `TECHNICAL-STACK.md` — current calculation system documented
- `COPILOT-KPI-PACKS.md` — 10 industry KPI packs from Copilot
- `PERPLEXITY-ACTION-LIBRARY.md` — trigger-based action library from Perplexity
- `C:\Users\LENOVO\Downloads\plainfinancials_report_template.html` — Claude's restaurant report template (design target)

## Core Principle
Keep the same form inputs. Change what we do with the data. Industry-specific labels, benchmarks, insights, and actions — all derived from the financial data we already collect.

## Industries (10)
1. Product/Retail
2. E-commerce
3. SaaS/Subscription
4. Services/Consulting
5. Restaurant/Food & Hospitality
6. Construction/Real Estate
7. Manufacturing
8. Wholesale/Distribution
9. Healthcare/Wellness
10. General Business (fallback)

---

## Phase 1 Changes

### 1. Industry-Specific COGS Labels
| Industry | COGS Label |
|----------|-----------|
| Restaurant | Food & Beverage Cost |
| Retail | Cost of Goods |
| E-commerce | Product & Shipping Cost |
| Manufacturing | Material & Production Cost |
| Wholesale | Cost of Goods Purchased |
| Construction | Project Costs |
| Services | Direct Delivery Cost |
| SaaS | Cost of Service |
| Healthcare | Clinical/Treatment Cost |
| General | Cost of Goods Sold |

### 2. New Universal KPIs (from existing data)
- **Cash vs AP Ratio** = Cash / Accounts Payable
- **Days of Revenue in Bank** = Cash / (Revenue / 30)
- **COGS % of Revenue** = COGS / Revenue (relabeled per industry)
- **Overhead Ratio** = OPEX / Revenue
- **Owner Drawings % of Profit** = Owner Drawings / Net Profit (if both provided)

### 3. Cash Bridge (new section)
Show waterfall: Starting Cash → +Profit → -AR increase → -Inventory increase → +AP increase → -Loan Repayments → -Owner Drawings → -CapEx = Ending Cash

### 4. Industry Health Section (new section)
Dedicated section with industry-specific benchmarks and language:
- Restaurant: "Food Cost %" with 28-32% target
- Retail: "Inventory Turns" with industry target
- SaaS: "Burn Rate" and "Runway"
- Construction: "Project Margin" and "DSO"
- etc.

### 5. 4 Pillars Grid (replace Top 5 Summary)
Industry-specific at-a-glance grid:
- Restaurant: Revenue / Food Cost % / Cash in Bank / Net Profit
- SaaS: Revenue / Burn Rate / Cash Runway / Gross Margin
- Construction: Revenue / Project Margin / DSO / Cash vs AP
- Retail: Revenue / DIO / Gross Margin / Cash Runway
- etc.

### 6. Industry-Adaptive Actions
Use Perplexity's trigger-based action library for triggers we can calculate:
- GM low → industry-specific margin advice
- Cash < AP → industry-specific liquidity advice
- DSO high → industry-specific collections advice
- DIO high → industry-specific inventory advice
- DPO too low → industry-specific supplier terms advice
- COGS % high → industry-specific cost advice

For triggers we CAN'T calculate, mention as investigation points in insights.

### 7. OpenAI Prompt Update
- Inject industry-specific vocabulary
- Highlight top 3 industry KPIs
- Instruct GPT to use industry language in actions
- Add industry-specific investigation suggestions for non-financial metrics

### 8. Unify Benchmark Sets
Merge server-side (analyze.js) and client-side (report-sky.js) benchmarks into one source of truth.

### 9. One New Optional Input
"Labour/Staff Cost" — separate from OPEX. Unlocks:
- Restaurant: Prime Cost % = (Food Cost + Labour) / Revenue
- Services: Labour overhead ratio
- All: Staff cost visibility

---

## Files to Modify
1. `netlify/functions/analyze.js` — benchmarks, prompt, label mapping
2. `js/report-sky.js` — new sections, industry logic, action triggers
3. `report-sky.html` — cash bridge section, industry health section, 4 pillars grid
4. `css/report-sky.css` — styles for new sections
5. `js/analyze.js` — add labour cost field, industry-specific form labels
6. `analyze.html` — add optional labour cost input

## Not Changing
- OpenAI model (stays gpt-4o-mini)
- Core calculation formulas (DSO, DIO, DPO, CCC, FCF, FCFF, runway)
- PDF export mechanism
- Email/WhatsApp sharing
- Stripe/Supabase integration
- Authentication flow
