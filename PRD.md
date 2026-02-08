# PlainFinance - Product Requirements Document (PRD)

**Version:** 2.0
**Date:** December 2024
**Author:** Tayseer Mohammed, FCCA
**Status:** Final

---

## Executive Summary

**PlainFinance** transforms confusing financial data into clear, actionable insights that any business owner can understand - no finance degree required.

### The One-Liner
> "Your numbers, finally explained."

### Business Model
```
Software (Primary):     Upload financials → Get plain English report
Service (Premium):      Talk to Tayseer for complex situations
```

---

## Problem Statement

### The Reality

**94% of UAE businesses are SMEs.** Most are run by people who are experts in their craft - not in finance.

They get reports from their accountant that look like this:

```
Revenue: AED 1,245,892
COGS: AED 891,204
Gross Margin: 28.48%
EBITDA: AED 156,402
Operating Cash Flow: (AED 23,891)
DSO: 47 days
Current Ratio: 1.2
```

**And they think:** "What does this even mean? Is this good or bad? What should I do?"

### Who Has This Problem?

| Person | Their Background | Their Problem |
|--------|------------------|---------------|
| Startup Founder | Engineer, Designer, Sales | "I built the product, but I don't understand my own financials" |
| SME Owner | 20 years in trading | "My accountant sends reports but never explains them" |
| Department Manager | Operations, HR, Marketing | "I have budget responsibility but finance is Greek to me" |
| First-time CEO | Promoted from within | "I nod along in board meetings pretending I understand" |

### Current Solutions (All Bad)

| Solution | Problem |
|----------|---------|
| Call a finance friend | Not scalable, feel like a burden |
| Google the terms | Generic, not specific to YOUR numbers |
| Hire a CFO | AED 25,000+/month - way too expensive |
| Ask your accountant | They speak jargon too, or are too busy |
| Ignore it | Make gut decisions, get burned |

---

## Solution

### PlainFinance: Finance for Humans

**Input:** Your financial data (Excel, accounting export, even screenshots)

**Output:** A beautiful, simple report that explains:
- What happened this month (in plain English)
- Is this good or bad? (compared to your targets & benchmarks)
- What should you do about it? (specific action items)

### Sample Output

```
┌─────────────────────────────────────────────────────────────┐
│  PLAINFINANCE MONTHLY BRIEFING                              │
│  November 2024 | ABC Trading LLC                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  THE BOTTOM LINE                                             │
│  ─────────────────                                           │
│  "Good month for sales, but you're spending faster than     │
│   you're collecting. Cash will be tight in 6 weeks unless   │
│   you collect what customers owe you."                      │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  YOUR NUMBERS AT A GLANCE                                    │
│                                                              │
│  💰 Revenue      AED 1.24M    ▲ 12% vs last month           │
│                               "Sales are growing nicely"     │
│                                                              │
│  📊 Profit       AED 156K     ▼ 5% vs last month            │
│                               "Made money, but margins       │
│                                slipped - costs grew faster   │
│                                than revenue"                 │
│                                                              │
│  🏦 Cash         AED 89K      ⚠️ 6 weeks runway             │
│                               "This is getting tight.        │
│                                You need to collect faster."  │
│                                                              │
│  📑 Owed to You  AED 234K     ⚠️ AED 78K overdue            │
│                               "Customers owe you money.      │
│                                AED 78K is late."             │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  YOUR 3 ACTIONS THIS WEEK                                    │
│  ─────────────────────────                                   │
│  1. 📞 Call Ahmed at XYZ Co - they owe AED 52K (45 days     │
│        overdue). This is your biggest risk.                  │
│                                                              │
│  2. 💳 Delay the new laptop purchase (AED 15K) until        │
│        January when cash improves.                           │
│                                                              │
│  3. 📊 Check why shipping costs jumped 23%. That's          │
│        AED 8K more than usual - is this a one-time thing?   │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  LOOKING AHEAD                                               │
│  ─────────────                                               │
│  If nothing changes, your cash will drop to AED 12K by      │
│  mid-January. But if you collect the AED 78K overdue,       │
│  you'll be comfortable at AED 90K+.                         │
│                                                              │
│  [View Full Report]  [Download PDF]  [Talk to Expert]       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Target Customer

### Primary Persona: "The Capable Non-Finance Founder"

**Name:** Sarah
**Age:** 35
**Role:** Founder/CEO of an e-commerce business
**Revenue:** AED 3M/year
**Team:** 12 people

**Background:**
- Started business 4 years ago
- Expert in marketing and product
- Has a bookkeeper who does VAT
- Gets monthly reports but doesn't really understand them
- Makes financial decisions based on bank balance

**Pain Quotes:**
- "I feel stupid asking my accountant basic questions"
- "I know I should understand this, but I just don't"
- "I wish someone would just tell me what my numbers mean"
- "I'm flying blind - I only know there's a problem when cash runs out"

**What She Wants:**
- To understand her business without getting a finance degree
- Clear answers: "Are we doing well or not?"
- Specific actions: "What should I do this week?"
- Not feel judged for not knowing finance

### Secondary Personas

**"The First-Time Manager"** - Now has budget responsibility, never learned finance
**"The Family Business Successor"** - Took over from parents, they never explained the numbers
**"The Investor/Board Member"** - Wants simple updates, not spreadsheets

---

## Product Definition

### Core Features (MVP)

#### Feature 1: Financial Report Translator
```
User uploads: Excel/CSV financial data
             ↓
AI analyzes: Identifies key metrics, calculates ratios
             ↓
AI explains: Writes plain English explanations
             ↓
Output:      Beautiful, simple PDF/web report
```

**Key Components:**
- Revenue & Profitability explained
- Cash position & runway
- What customers owe you (receivables)
- What you owe others (payables)
- Comparison to last month/budget
- 3 specific action items

#### Feature 2: Jargon Translator
```
User asks:  "What is EBITDA?"
            "What does 'DSO of 45 days' mean?"
            "Is a current ratio of 1.2 good?"
            ↓
AI answers: Plain English explanation
            + What it means for YOUR business
            + UAE context if relevant
```

#### Feature 3: Ask Anything Chat
```
User asks:  "Why did my profit drop this month?"
            "Can I afford to hire someone?"
            "Should I take this loan?"
            ↓
AI answers: Based on their uploaded data
            Specific to their situation
            With clear recommendations
```

### Future Features (Post-MVP)

- **Automated Monthly Reports:** Connect accounting software, get reports automatically
- **Benchmark Comparisons:** "Your margins are below average for UAE retail"
- **Cash Flow Forecaster:** "You'll run out of cash in 8 weeks"
- **WhatsApp Integration:** Send reports via WhatsApp
- **Arabic Language:** Full Arabic support
- **Team Access:** Share reports with co-founders, investors

---

## Pricing Strategy

### Philosophy
- **Low barrier to entry** - people should try it easily
- **Value-based tiers** - pay for what you need
- **Premium human option** - for those who want expert access

### Pricing Tiers

#### Free Tier
**Price:** AED 0
**Includes:**
- 2 reports per month
- Basic explanations
- Jargon translator
- Email support

**Purpose:** Let people try and fall in love

---

#### Starter
**Price:** AED 99/month (~$27)
**Includes:**
- 10 reports per month
- Full explanations with action items
- Ask Anything chat (20 questions/month)
- Priority email support

**Best for:** Freelancers, micro-businesses

---

#### Professional
**Price:** AED 249/month (~$68)
**Includes:**
- Unlimited reports
- Unlimited chat questions
- Cash flow projections
- Benchmark comparisons
- Priority support (24hr response)

**Best for:** SME owners, startup founders

---

#### Premium + Expert
**Price:** AED 499/month (~$136)
**Includes:**
- Everything in Professional
- 1 hour monthly call with Tayseer (FCCA)
- Custom report templates
- WhatsApp support
- Team access (3 users)

**Best for:** Growing businesses wanting human expertise

---

### One-Time Services (Upsells)

| Service | Price | Description |
|---------|-------|-------------|
| Financial Health Check | AED 500 | 30-min call + detailed analysis |
| Investor Readiness Report | AED 1,500 | Full report for funding prep |
| Custom Dashboard Setup | AED 1,000 | Connect accounting software |
| Annual Budget Creation | AED 3,000 | Full budget with guidance |

---

## Technical Architecture

### MVP Stack

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│                   Next.js + Tailwind                         │
│                   Hosted on Netlify                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│                    n8n Workflows                             │
│              (File processing, AI calls)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      AI LAYER                                │
│                   OpenAI GPT-4o                              │
│         (Analysis, explanations, chat)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
│                      Supabase                                │
│            (Users, reports, usage tracking)                  │
└─────────────────────────────────────────────────────────────┘
```

### Key Technical Decisions

| Component | Choice | Reason |
|-----------|--------|--------|
| Frontend | Next.js | Fast, SEO-friendly, can scale |
| Hosting | Netlify | Free tier, easy deploys |
| Backend | n8n | Tayseer knows it, visual workflows |
| AI | OpenAI GPT-4o | Best for financial text, vision for screenshots |
| Database | Supabase | Free tier, PostgreSQL, auth included |
| Payments | Stripe | Works in UAE, handles subscriptions |
| Email | SendGrid | Free tier, reliable |

### API Cost Estimate

| Action | Cost per Request | Monthly Volume | Total |
|--------|------------------|----------------|-------|
| Report generation | ~$0.15 | 500 reports | $75 |
| Chat questions | ~$0.03 | 2,000 questions | $60 |
| Jargon lookups | ~$0.01 | 3,000 lookups | $30 |
| **Total** | | | **~$165/month** |

At 100 paying customers averaging AED 175/month = AED 17,500 revenue vs ~AED 600 AI costs = **96% gross margin**

---

## Go-to-Market Strategy

### Phase 1: Soft Launch (Month 1)

**Target:** Tayseer's network (friends who already call for help)

**Actions:**
1. LinkedIn announcement with new positioning
2. WhatsApp to 20 friends who've asked for finance help
3. Free access for first 10 users (in exchange for feedback)

**Goal:** 10 active users, validate the concept

---

### Phase 2: Public Launch (Month 2)

**Target:** UAE startup/SME founders

**Channels:**
| Channel | Action | Budget |
|---------|--------|--------|
| LinkedIn | 3 posts/week + ads | AED 500/month |
| Startup communities | Post in Dubai Startup Hub, etc. | Free |
| ACCA network | Referral program | Free |
| Content marketing | "Finance 101" blog posts | Free |

**Goal:** 50 registered users, 15 paying

---

### Phase 3: Growth (Month 3-6)

**Target:** Broader UAE SME market

**Channels:**
| Channel | Action | Budget |
|---------|--------|--------|
| Google Ads | "understand financial statements" | AED 1,000/month |
| Partnerships | Accounting firms, accelerators | Rev share |
| Referral program | "Give AED 50, Get AED 50" | Per referral |
| Content SEO | Rank for finance questions | Free |

**Goal:** 200 users, 80 paying, AED 15,000 MRR

---

## Financial Projections

### Year 1

| Month | Users | Paying | MRR (AED) | Notes |
|-------|-------|--------|-----------|-------|
| 1 | 20 | 5 | 750 | Soft launch |
| 2 | 50 | 15 | 2,250 | Public launch |
| 3 | 100 | 35 | 5,250 | |
| 4 | 150 | 55 | 8,250 | |
| 5 | 200 | 80 | 12,000 | |
| 6 | 280 | 110 | 16,500 | |
| 7 | 350 | 140 | 21,000 | |
| 8 | 420 | 170 | 25,500 | |
| 9 | 500 | 200 | 30,000 | |
| 10 | 580 | 235 | 35,250 | |
| 11 | 660 | 270 | 40,500 | |
| 12 | 750 | 310 | 46,500 | |

**Year 1 Total Revenue: ~AED 244,000 (~$66,500)**

### Costs (Monthly at Scale)

| Category | Amount (AED) |
|----------|--------------|
| OpenAI API | 600 |
| Hosting/Tools | 300 |
| Marketing | 1,500 |
| Misc | 300 |
| **Total** | **2,700** |

**Year 1 Profit: ~AED 210,000 (~$57,000)**

---

## Competitive Advantage (Moat)

### Why Competitors Can't Easily Copy This

| Moat | Description |
|------|-------------|
| **Domain Expertise** | 17 years of finance experience - knows what actually matters to explain |
| **UAE Context** | Understands VAT, corporate tax, local banks, Ramadan seasonality |
| **Arabic + English** | Can serve entire UAE market |
| **Tone of Voice** | Not robotic AI - actually sounds like a helpful friend |
| **Premium Tier** | Human expert access can't be automated by competitors |
| **First Mover** | No one doing "plain English finance" for UAE SMEs specifically |

---

## Success Metrics

### North Star Metric
**"Reports that led to action"** - Did the user do something based on our report?

### Supporting Metrics

| Metric | Month 3 Target | Month 6 Target | Month 12 Target |
|--------|----------------|----------------|-----------------|
| Registered users | 100 | 280 | 750 |
| Paying customers | 35 | 110 | 310 |
| MRR | AED 5,250 | AED 16,500 | AED 46,500 |
| Reports generated | 200 | 800 | 3,000 |
| Chat questions asked | 500 | 2,500 | 10,000 |
| NPS score | 40+ | 50+ | 60+ |
| Churn rate | <15% | <10% | <8% |

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| AI gives wrong advice | Medium | High | Human review for first 100 reports, disclaimers |
| Users don't understand how to upload data | High | Medium | Video tutorials, CSV templates, screenshot option |
| Market too small | Low | High | Expand to GCC, then global |
| OpenAI costs spike | Low | Medium | Cache common explanations, use cheaper models where possible |
| Competitor enters | Medium | Medium | Build brand, add human layer they can't copy |

---

## Immediate Next Steps

### Week 1
- [x] Finalize PRD
- [ ] Build landing page
- [ ] Set up Netlify deployment
- [ ] Create waitlist signup

### Week 2
- [ ] Build basic report generator (n8n + OpenAI)
- [ ] Test with 5 sample datasets
- [ ] Soft launch to friends

### Week 3
- [ ] Iterate based on feedback
- [ ] Add chat feature
- [ ] Launch publicly on LinkedIn

### Week 4
- [ ] Stripe integration
- [ ] First paying customers
- [ ] Begin content marketing

---

## Appendix

### A. Jargon Dictionary (Sample)
*[To be built into product]*

### B. Report Templates
*[To be designed]*

### C. Sample Data Files for Testing
*[To be created]*

---

**Document Control**

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | Dec 2024 | Initial CFOLabs version | Tayseer |
| 2.0 | Dec 2024 | Pivoted to PlainFinance | Tayseer |

