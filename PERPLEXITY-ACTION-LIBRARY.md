Here is an implementation‑ready **Industry‑Adaptive Action Library** you can wire directly to your KPI/insight engine. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/92489585/83441b59-7190-450f-a570-cd6862cac455/text.txt)

***

## Structure to implement

For each rule, store:  
- `industry_code`  
- `trigger_kpi`  
- `trigger_condition` (e.g. `DIO > 90`)  
- `action_category` (Pricing, Cost, Revenue, Process, Cash, Risk)  
- `action_id` (stable key)  
- `action_label` (short)  
- `action_details` (1–3 lines, optional)  

***

## Product / Retail (physical stores)

- Low margin: `Gross Margin % < 25%`  
  - Review pricing on top sellers; test small price increases on non‑sensitive categories.  
  - Renegotiate supplier terms, consolidate vendors to gain volume discounts.  
  - Reduce discounting and promotions that do not drive volume uplift.  

- Excess stock: `DIO > 90`  
  - Identify top 5 slow‑moving SKUs and mark down or bundle to clear.  
  - Cut purchase orders on slow movers; tighten reorder points and safety stock rules.  
  - Shift open‑to‑buy budget toward proven fast‑moving lines.  

- High shrinkage: `Shrinkage % > 2%`  
  - Run cycle counts on high‑value categories; investigate process gaps and fraud risk.  
  - Improve stockroom and POS controls (access rights, approvals, CCTV where appropriate).  
  - Train staff on loss‑prevention procedures and variance root‑cause logging.  

- Liquidity stress: `Cash vs AP < 1x`  
  - Prioritize payments to critical suppliers; negotiate extended terms or payment plans.  
  - Slow non‑essential capex and discretionary opex until cash stabilizes.  
  - Accelerate cash inflows (e.g., gift card campaigns, pre‑paid offers).  

***

## E‑commerce (online retail)

- Returns issue: `Return Rate % > 15%`  
  - Analyze returns by SKU, channel, and reason; remove or fix problematic products.  
  - Improve product content (photos, sizing charts, descriptions) to set accurate expectations.  
  - Tighten return policy on chronic abusers or high‑risk SKUs.  

- Unprofitable logistics: `Fulfillment Cost % > 25%`  
  - Re‑quote with 3PL and carriers; optimize packaging sizes and weight.  
  - Introduce free shipping thresholds to lift average order value.  
  - Consolidate shipments (fewer partials) and rationalize remote delivery areas.  

- Weak conversion: `Conversion Rate < 1%`  
  - A/B test landing pages, product pages, and checkout flows for friction.  
  - Review traffic quality by channel; cut low‑intent traffic that never converts.  
  - Add trust signals (reviews, guarantees, payment options) at checkout.  

- CAC not paying back: `CAC Payback > 6 months`  
  - Shift spend from low‑ROAS to high‑ROAS channels; cap bids on under‑performers.  
  - Improve onboarding and retention flows to lift LTV (email flows, loyalty programs).  
  - Narrow targeting to higher‑value segments even at smaller volume.  

***

## SaaS / Subscription

- High churn: `Churn % > 5%`  
  - Segment churned customers and run exit interviews or surveys to identify root causes.  
  - Improve onboarding, activation, and in‑app guidance for new customers.  
  - Introduce save offers or downgrade paths before cancellation.  

- Weak unit economics: `LTV/CAC < 2x`  
  - Reduce CAC by pausing low‑ROI campaigns and sharpening ICP definition.  
  - Increase ARPU via packaging, upsells, and price optimization.  
  - Target higher‑retention segments and expand within existing accounts.  

- Poor expansion: `NRR < 100%`  
  - Build structured account management for upsell and cross‑sell motions.  
  - Launch add‑ons or tiers that monetize power users and large teams.  
  - Review discounting policies that suppress expansion at renewal.  

- Cost‑to‑serve too high: `Gross Margin % < 50%`  
  - Optimize cloud and hosting spend; right‑size infrastructure to actual usage.  
  - Reduce expensive manual support through self‑service and better documentation.  
  - Rationalize low‑margin integrations or features that are costly to maintain.  

***

## Services / Consulting

- Under‑utilized team: `Utilization < 50%`  
  - Rebalance work across team; assign under‑utilized staff to billable projects.  
  - Tighten scope management; avoid excessive non‑billable work.  
  - Adjust hiring plan and contractor use to match demand.  

- Low realization: `Realization < 70%`  
  - Review pricing, discounts, and write‑offs by client and project.  
  - Improve scoping and change‑order discipline to bill for out‑of‑scope work.  
  - Educate managers on target rates and minimum margin expectations.  

- Margin pressure: `Gross Margin % < 35%`  
  - Adjust rates for underpriced services or high‑cost roles.  
  - Replace high‑cost contractors with employees where demand is stable.  
  - Standardize delivery playbooks to reduce rework and over‑servicing.  

- Concentration risk: `Client Concentration % > 40%`  
  - Build a targeted BD plan to win 2–3 sizeable new clients.  
  - Limit incremental exposure to the dominant client (credit terms, resource allocation).  
  - Scenario‑plan for partial or full loss of that client.  

***

## Restaurant / Food & Hospitality

- Food cost overruns: `Food Cost % > 36%`  
  - Re‑cost menus and adjust prices on high‑cost/low‑margin items.  
  - Enforce portion control and recipe adherence to reduce waste.  
  - Negotiate supplier pricing and switch to equivalent, more economical ingredients.  

- Labour too high: `Labour Cost % > 40%`  
  - Rebuild staff schedules based on demand patterns by day and hour.  
  - Cross‑train staff to cover multiple stations with fewer people.  
  - Reduce overtime and use part‑time for peaks.  

- Unsustainable prime cost: `Prime Cost % > 70%`  
  - Combine food and labour actions; remove or rework unprofitable menu items.  
  - Simplify menu to reduce complexity and prep time.  
  - Push higher‑margin items through training and menu design.  

- Cash short: `Cash Runway < 15 days` or `Cash < AP`  
  - Prioritize payroll and essential suppliers; negotiate payment plans.  
  - Run short‑term promotions and pre‑paid offers to bring cash forward.  
  - Defer non‑critical repairs and capex until runway improves.  

***

## Construction / Real Estate

- Excess WIP: `WIP/Revenue > 50%`  
  - Accelerate billing milestones and site valuations where contractually possible.  
  - Review project management for delays and scope changes.  
  - Pause starting new projects until current WIP is better converted to cash.  

- High retention: `Retention > 20% of AR`  
  - Negotiate retention percentages or early partial releases on completed phases.  
  - Ensure documentation and certifications are submitted promptly to trigger release.  
  - Review contract terms for future bids to improve cash profile.  

- Slow collections: `DSO > 75 days`  
  - Tighten credit control; introduce structured follow‑up cadence.  
  - Require deposits or better payment terms on new contracts.  
  - Escalate chronically late customers and consider limiting new work.  

- Weak project margin: `Project Margin % < 10%`  
  - Analyze project P&L by job to identify loss‑making contracts.  
  - Improve estimating and bidding discipline; factor in risk contingencies.  
  - Renegotiate scope, variations, and change orders where feasible.  

***

## Manufacturing

- Low yield / high scrap: `Yield % < 90%` or `Scrap Rate % > 5%`  
  - Run root‑cause analysis on top defect types and scrap reasons.  
  - Adjust process parameters, training, and maintenance routines.  
  - Improve incoming material inspection to catch quality issues early.  

- Under‑used equipment: `Machine Utilization < 50%`  
  - Consolidate production on fewer lines and shut idle capacity where possible.  
  - Review scheduling and changeover practices to reduce downtime.  
  - Redirect sales effort to products that use under‑utilized assets.  

- Margin erosion: `Gross Margin % < target`  
  - Re‑cost BOMs, update standard costs, and correct pricing misalignments.  
  - Rationalize low‑margin SKUs that consume disproportionate capacity.  
  - Negotiate raw material contracts and explore alternative suppliers.  

- Excess inventory: `Inventory Days > target`  
  - Reduce production batch sizes where feasible.  
  - Implement pull‑based or reorder‑point planning for slow movers.  
  - Clear obsolete and non‑moving stock through discounts or scrap.  

***

## Wholesale / Distribution

- Customers paying too slowly: `DSO > 50 days`  
  - Tighten credit limits and terms for slow‑pay customers.  
  - Offer early‑payment discounts where ROI is positive.  
  - Enforce holds on new orders for severely overdue accounts.  

- Paying suppliers too fast: `DPO < 20 days` (and no early‑payment discount)  
  - Negotiate longer terms with key suppliers.  
  - Align payment runs closer to due dates while preserving relationships.  
  - Avoid prepayments unless commercially required.  

- Low gross margin: `Gross Margin % < 10%`  
  - Review pricing by customer and SKU; correct chronic underpricing.  
  - Introduce minimum order values and fees for low‑margin small orders.  
  - Optimize mix toward higher‑margin product lines and brands.  

- Service issues: `Order Fill Rate < 90%`  
  - Improve demand forecasting and safety stock for key SKUs.  
  - Rationalize catalogue to focus on items that can be reliably stocked.  
  - Work with suppliers on lead times and allocation for constrained items.  

***

## Healthcare / Wellness

- Under‑utilized providers: `Provider Utilization < 50%`  
  - Adjust scheduling templates to increase appointment slots in peak hours.  
  - Improve referral and recall processes to fill diaries.  
  - Reallocate marketing to under‑utilized locations or specialties.  

- Slow insurer collections: `AR Days (Insurance) > 60`  
  - Strengthen claim submission accuracy and timeliness.  
  - Work with insurers to resolve recurring denial reasons.  
  - Implement follow‑up protocols on overdue claims by age bucket.  

- Margin squeeze: `Gross Margin % < 25%`  
  - Review payer mix and renegotiate low‑rate contracts where possible.  
  - Optimize staffing mix (e.g., use mid‑levels where clinically appropriate).  
  - Re‑price ancillary services and products to reflect cost inflation.  

- Low revenue per visit: `Revenue per Visit below target`  
  - Increase uptake of ancillary services and diagnostics per visit.  
  - Train clinicians on recommending appropriate add‑on services.  
  - Review pricing schedule and discount policies.  

***

## General Business (fallback)

- Margin low: `Gross Margin % < target` or `Net Margin % < target`  
  - Review pricing, discounting, and unprofitable customers/products.  
  - Cut or renegotiate low‑value overhead costs.  
  - Focus sales effort on higher‑margin segments.  

- Cash runway short: `Cash Runway < 3 months`  
  - Reduce discretionary spend and delay non‑essential projects.  
  - Accelerate collections and renegotiate payment terms with suppliers.  
  - Explore short‑term financing options if structurally needed.  

- Working capital tight: `DSO + DIO − DPO increasing`  
  - Improve billing speed, accuracy, and follow‑up on overdue invoices.  
  - Optimize inventory levels, especially slow‑moving items.  
  - Negotiate longer supplier terms or spread large payments over time.  

- Productivity weak: `Revenue per Employee below peers/target`  
  - Automate low‑value tasks and streamline processes.  
  - Reprioritize projects toward revenue‑generating activities.  
  - Reassess org structure and span of control.  

If you like this structure, I can next convert it into a clean JSON/YAML schema with `industry_code + trigger + actions[]` so your devs can plug it straight into the rules engine.