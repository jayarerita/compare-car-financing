# Compare Car Financing

A personal finance web app that helps you decide how to pay for a car — cash upfront or a financed loan — by modeling the long-term impact on your investment portfolio.

**Live demo:** [jayarerita.github.io/compare-car-financing](https://jayarerita.github.io/compare-car-financing)

---

## Overview

When you finance a car instead of paying cash, you retain more capital in your investment portfolio. If your expected investment return exceeds the loan APR, that extra compounding can more than offset the interest you pay. This tool makes that trade-off concrete.

You can model up to six scenarios side-by-side — any mix of cash purchases and financing options, each with its own car price — so you can compare not just different loan terms but entirely different vehicles.

---

## Features

- **Multiple scenarios** — add up to 6 cash or financing options, each with an independent car price
- **Compare different cars** — evaluate a cheaper car paid cash against a pricier one financed, side by side
- **Investment growth modeling** — configurable annual return, expense ratio, dividend yield, and dividend frequency (monthly / quarterly / annually)
- **After-tax valuation** — portfolio shown net of capital gains tax (default 23.8%: 20% federal LTCG + 3.8% NIIT), applied only to gains above cost basis
- **Inflation adjustment** — optional overlay deflates all values to today's dollars at 2% annual inflation
- **Car depreciation overlay** — optional overlay adds the car's estimated depreciated value to each scenario's plotted wealth, using a three-phase decay model
- **Break-even detection** — chart shows exactly where financing overtakes a cash purchase
- **Month-by-month detail** — collapsible table with full per-month data for any scenario
- **Real-time updates** — all outputs update instantly as you adjust any input

---

## How the financial model works

### Cash purchase
Pay the full car price from savings on day one. Starting investment = `savings − car price`. The full monthly budget goes to the portfolio each month.

### Financing
Pay only the down payment upfront. Starting investment = `savings − down payment` (more capital retained). Each month: pay the loan first, invest whatever remains from the monthly budget. After the loan is paid off, the full budget goes to investing.

### When financing wins
If `investment return > loan APR`, the larger starting balance compounds faster than the loan costs. The chart shows the cross-over point.

### Key formulas

**Monthly loan payment:**
```
M = P × [r(1+r)^N] / [(1+r)^N − 1]
P = loan principal, r = APR/12, N = term in months
```

**Monthly investment growth:**
```
B = B × (1 + (return − expense ratio) / 12) + dividends + contribution
```

**After-tax value:**
```
gains = max(0, balance − cost basis)
after-tax = balance − gains × tax rate
```

**Car depreciation (optional overlay):**

| Phase | Annual rate | Notes |
|---|---|---|
| Year 1 | 20% | Off-the-lot penalty |
| Years 2–5 | 15% | Mid-life decline |
| Year 6+ | 5% | Value stabilises |
| Floor | 10% of purchase price | Approximate salvage value |

Example on a $30,000 car: ~$24,000 after year 1, ~$12,500 after year 5, ~$10,700 after year 10. Assumes a new vehicle purchased at time zero.

---

## Inputs

### Per scenario

| Input | Cash | Financing |
|---|---|---|
| Car price | ✓ | ✓ |
| Down payment | — | ✓ |
| Loan term (months) | — | ✓ |
| APR (%) | — | ✓ |

### Global (shared across all scenarios)

| Input | Description |
|---|---|
| Available savings | Total liquid savings to draw from for the purchase |
| Monthly budget | Total monthly cash for loan payments + investing |
| Time horizon | Projection length in years (1–40) |
| Annual return | Expected portfolio growth rate (%) |
| Expense ratio | Annual fund cost (%) |
| Dividend yield | Annual dividend rate (%) |
| Dividend frequency | Monthly / quarterly / annually |
| Capital gains tax rate | Applied to gains above cost basis (default 23.8%) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS + shadcn/ui CSS variables |
| UI primitives | Radix UI (slider, radio group, label) |
| Charts | Recharts |
| Deployment | GitHub Pages (`gh-pages`) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install and run locally

```bash
git clone https://github.com/jayarerita/compare-car-financing.git
cd compare-car-financing
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`.

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run deploy` | Build and publish to GitHub Pages |

---

## Project Structure

```
src/
├── index.css                      # Tailwind directives + CSS variable theme
├── main.tsx                       # React entry point
├── App.tsx                        # Root component: all state, scenario computation, layout
├── lib/
│   ├── customTypes.ts             # TypeScript types
│   ├── calculations.ts            # Financial math (payments, simulation, depreciation)
│   └── utils.ts                   # cn() class name helper
└── components/
    ├── ui/                        # Reusable primitives (Input, Label, Slider, Button, Card, Table, RadioGroup)
    ├── CashOptionCard.tsx         # Form card for a cash purchase scenario
    ├── FinancingOptionCard.tsx    # Form card for a financing scenario
    ├── ComparisonChart.tsx        # Recharts line chart with view toggles and overlays
    ├── SummaryTable.tsx           # Final-value comparison table across all scenarios
    └── DetailedDataTable.tsx      # Collapsible month-by-month data table (per scenario)
```

---

## Deployment

```bash
npm run deploy
```

Builds the app and pushes `dist/` to the `gh-pages` branch. The `homepage` field in `package.json` sets the base URL.

---

## License

MIT
