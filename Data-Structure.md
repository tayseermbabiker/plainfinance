# PlainFinance - Data Structure & Input Requirements

## Overview

Two input methods feeding the same analysis engine:
1. **Quick Entry Form** - User types key figures
2. **File Upload** - Excel/CSV/PDF of P&L and Balance Sheet

---

## Required Data Fields

### Section A: Company Info
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Company Name | Text | Yes | For report header |
| Industry | Dropdown | Yes | For benchmarking |
| Reporting Period | Date range | Yes | "November 2024" or "Q3 2024" |
| Currency | Dropdown | Yes | AED, USD, SAR, etc. |

**Industry Options:**
- Trading / Wholesale
- Retail
- E-commerce
- Professional Services
- Manufacturing
- Food & Beverage
- Construction
- Technology / SaaS
- Healthcare
- Other

---

### Section B: Profit & Loss (Income Statement)

| Field | Type | Required | Used For |
|-------|------|----------|----------|
| **Revenue / Sales** | Number | Yes | Top line, all ratios |
| Cost of Goods Sold (COGS) | Number | Yes* | Gross margin, DIO, DPO |
| Gross Profit | Number | Auto-calc | Revenue - COGS |
| Operating Expenses | Number | Yes | Net margin |
| Net Profit | Number | Yes | Bottom line |

*For service businesses, COGS may be zero - that's okay.

**Optional P&L Breakdown:**
| Field | Type | Required |
|-------|------|----------|
| Salaries & Wages | Number | No |
| Rent | Number | No |
| Marketing & Advertising | Number | No |
| Utilities | Number | No |
| Other Expenses | Number | No |

---

### Section C: Balance Sheet

#### Current Assets
| Field | Type | Required | Used For |
|-------|------|----------|----------|
| **Cash & Bank** | Number | Yes | Liquidity, runway |
| **Accounts Receivable (AR)** | Number | Yes | DSO calculation |
| Inventory | Number | Yes* | DIO calculation |
| Other Current Assets | Number | No | Current ratio |
| **Total Current Assets** | Number | Auto-calc | Working capital |

*For service businesses, inventory may be zero.

#### Current Liabilities
| Field | Type | Required | Used For |
|-------|------|----------|----------|
| **Accounts Payable (AP)** | Number | Yes | DPO calculation |
| Short-term Loans | Number | No | Debt analysis |
| Accrued Expenses | Number | No | Liabilities picture |
| Other Current Liabilities | Number | No | Current ratio |
| **Total Current Liabilities** | Number | Auto-calc | Working capital |

#### Non-Current (Optional for MVP)
| Field | Type | Required |
|-------|------|----------|
| Fixed Assets | Number | No |
| Long-term Debt | Number | No |
| Equity | Number | No |

---

### Section D: Comparison Period (For Trend Analysis)

Same fields as above but for previous period:
- Previous month, OR
- Same month last year

This enables:
- "Revenue up 12% vs last month"
- "DSO improved by 5 days"
- "Cash position weakening"

---

## Calculated Metrics

### Profitability
| Metric | Formula | Benchmark |
|--------|---------|-----------|
| Gross Margin % | (Gross Profit / Revenue) × 100 | Industry-specific |
| Net Margin % | (Net Profit / Revenue) × 100 | >10% good for SME |
| EBITDA | Net Profit + Depreciation + Interest + Tax | N/A |

### Liquidity
| Metric | Formula | Benchmark |
|--------|---------|-----------|
| Current Ratio | Current Assets / Current Liabilities | 1.5 - 2.0 ideal |
| Quick Ratio | (Cash + AR) / Current Liabilities | >1.0 healthy |
| Working Capital | Current Assets - Current Liabilities | Positive = good |

### Working Capital Efficiency
| Metric | Formula | Benchmark |
|--------|---------|-----------|
| DSO (Days Sales Outstanding) | (AR / Revenue) × Days in Period | <30 days ideal |
| DPO (Days Payable Outstanding) | (AP / COGS) × Days in Period | 30-45 days normal |
| DIO (Days Inventory Outstanding) | (Inventory / COGS) × Days in Period | Industry-specific |
| Cash Conversion Cycle | DSO + DIO - DPO | Lower = better |

### Cash & Runway
| Metric | Formula | Benchmark |
|--------|---------|-----------|
| Monthly Burn Rate | Operating Expenses / Months | N/A |
| Cash Runway | Cash / Monthly Burn | >6 months safe |
| Cash vs AR | Cash / AR | >0.5 healthy |

---

## Industry Benchmarks

### Trading / Wholesale
| Metric | Poor | Average | Good |
|--------|------|---------|------|
| Gross Margin | <15% | 15-25% | >25% |
| DSO | >60 days | 30-60 | <30 days |
| DIO | >90 days | 45-90 | <45 days |
| Current Ratio | <1.0 | 1.0-1.5 | >1.5 |

### Professional Services
| Metric | Poor | Average | Good |
|--------|------|---------|------|
| Gross Margin | <40% | 40-60% | >60% |
| DSO | >45 days | 30-45 | <30 days |
| Net Margin | <10% | 10-20% | >20% |

### Retail
| Metric | Poor | Average | Good |
|--------|------|---------|------|
| Gross Margin | <25% | 25-40% | >40% |
| DIO | >60 days | 30-60 | <30 days |
| Current Ratio | <1.0 | 1.0-2.0 | >2.0 |

### E-commerce
| Metric | Poor | Average | Good |
|--------|------|---------|------|
| Gross Margin | <30% | 30-50% | >50% |
| DSO | >14 days | 7-14 | <7 days |
| Cash Runway | <3 mo | 3-6 mo | >6 months |

---

## Quick Entry Form Flow

### Screen 1: Company Info
```
Let's understand your business

Company Name: [________________]

Industry: [Dropdown ▼]
  - Trading / Wholesale
  - Retail
  - E-commerce
  - Professional Services
  - ...

Reporting Period: [November ▼] [2024 ▼]

Currency: [AED ▼]
```

### Screen 2: Sales & Profit
```
How did you do this period?

Total Sales/Revenue:        [AED ________]
Cost of Goods Sold:         [AED ________]
                            (what you paid for the stuff you sold)

Operating Expenses:         [AED ________]
                            (salaries, rent, marketing, everything else)

Net Profit:                 [AED ________]
                            (what's left after all expenses)

[Don't know these? Upload your P&L instead →]
```

### Screen 3: Cash & Receivables
```
What's your cash position?

Cash in Bank (today):       [AED ________]

Money Customers Owe You:    [AED ________]
(Accounts Receivable)       (invoices sent but not paid yet)

Inventory Value:            [AED ________]
(Stock on Hand)             (leave blank if service business)
```

### Screen 4: What You Owe
```
What do you owe others?

Money You Owe Suppliers:    [AED ________]
(Accounts Payable)          (bills received but not paid yet)

Short-term Loans:           [AED ________]
                            (due within 12 months)

Other Current Liabilities:  [AED ________]
                            (accruals, credit cards, etc.)
```

### Screen 5: Comparison (Optional)
```
Want to compare with last period?

[Yes, add last month's numbers] → Repeat screens 2-4
[No, just analyze this period] → Generate report
```

---

## File Upload Specifications

### Accepted Formats
- Excel (.xlsx, .xls)
- CSV (.csv)
- PDF (.pdf) - using GPT-4 Vision

### Expected Structure (Excel/CSV)

**P&L Template:**
```
| Description          | Amount    |
|---------------------|-----------|
| Revenue             | 500,000   |
| Cost of Sales       | 325,000   |
| Gross Profit        | 175,000   |
| Operating Expenses  | 120,000   |
| Net Profit          | 55,000    |
```

**Balance Sheet Template:**
```
| Description              | Amount    |
|-------------------------|-----------|
| Cash & Bank             | 85,000    |
| Accounts Receivable     | 127,000   |
| Inventory               | 210,000   |
| Total Current Assets    | 422,000   |
| Accounts Payable        | 98,000    |
| Short-term Loans        | 50,000    |
| Total Current Liab      | 148,000   |
```

### PDF Parsing Strategy
1. Use GPT-4 Vision to read the PDF
2. Extract key fields into structured data
3. Validate numbers make sense (assets = liabilities + equity)
4. Ask user to confirm if uncertain

---

## Data Validation Rules

| Field | Validation |
|-------|------------|
| Revenue | Must be positive |
| COGS | Must be ≤ Revenue |
| Gross Profit | Must equal Revenue - COGS |
| Current Ratio | Flag if < 0.5 (critical) |
| DSO | Flag if > 90 (severe issue) |
| Cash | Flag if negative |

---

## Sample Test Data (Trading Company)

### Company Info
- Name: Gulf Trading LLC
- Industry: Trading / Wholesale
- Period: November 2024
- Currency: AED

### P&L
| Field | Current | Previous |
|-------|---------|----------|
| Revenue | 500,000 | 465,000 |
| COGS | 325,000 | 295,000 |
| Gross Profit | 175,000 | 170,000 |
| Operating Expenses | 120,000 | 110,000 |
| Net Profit | 55,000 | 60,000 |

### Balance Sheet
| Field | Current | Previous |
|-------|---------|----------|
| Cash | 45,000 | 72,000 |
| AR | 187,000 | 145,000 |
| Inventory | 210,000 | 185,000 |
| Total Current Assets | 442,000 | 402,000 |
| AP | 98,000 | 88,000 |
| Short-term Loans | 50,000 | 50,000 |
| Total Current Liabilities | 148,000 | 138,000 |

### Expected Insights
- Revenue up 7.5% ✓
- But Net Profit down 8.3% ⚠️ (expenses grew faster)
- DSO: 11.2 days (187K / 500K × 30) - Reasonable
- Cash dropped 37% despite revenue growth 🔴
- Inventory building up (13.5% increase) ⚠️
- Working Capital: 294,000 (healthy but declining)

---

*Last updated: December 2024*
