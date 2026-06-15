# Car Purchase Comparison — Developer Guide

A single-page React app hosted on GitHub Pages that helps users compare paying cash versus financing a car, accounting for investment returns on retained capital and the opportunity cost of capital.

**Live site:** https://jayarerita.github.io/compare-car-financing (deployed via `npm run deploy`)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS + CSS variables (shadcn/ui tokens) |
| UI primitives | Radix UI (`@radix-ui/react-slider`, `@radix-ui/react-radio-group`, `@radix-ui/react-label`) |
| Charts | Recharts |
| Deployment | GitHub Pages (`gh-pages` → `npm run deploy`) |

---

## Running Locally

```bash
npm install
npm run dev        # dev server at http://localhost:5173
npm run build      # production build → dist/
npm run preview    # preview the production build
npm run deploy     # build + push to gh-pages branch
```

TypeScript is strict (`noUnusedLocals`, `noUnusedParameters`). The build target is ES2020, so `.at()` is not available — use `arr[arr.length - 1]` instead.

---

## Project Structure

```
src/
├── index.css                      # Tailwind directives + CSS variable theme (light mode only)
├── main.tsx                       # React entry point
├── App.tsx                        # Root component: all state, scenario computation, layout
├── lib/
│   ├── customTypes.ts             # All TypeScript types
│   ├── calculations.ts            # Financial math (monthly payment, simulation, formatting)
│   └── utils.ts                   # cn() class name helper
└── components/
    ├── ui/                        # Reusable primitives (Input, Label, Slider, Button, Card, Table, RadioGroup)
    ├── FinancingOptionCard.tsx    # Form card for one financing option (name, APR, term, down payment)
    ├── ComparisonChart.tsx        # Recharts line chart with view-mode toggle
    ├── SummaryTable.tsx           # Final-value comparison table across all scenarios
    └── DetailedDataTable.tsx      # Collapsible month-by-month data table (per scenario)
```

---

## Financial Model

### Scenarios

**Cash Purchase**
- Pay the full car price from savings on day 1.
- Starting investment = `availableSavings − carPrice` (invalid if savings < price).
- Every month: full `monthlyBudget` goes to the investment portfolio (no loan payment).

**Financing (down payment D, term N months, APR r%)**
- Pay only down payment D upfront.
- Starting investment = `availableSavings − D` (more capital retained vs. cash).
- Monthly during loan: pay `monthlyLoanPayment`; invest `max(0, monthlyBudget − payment)`.
- Monthly after payoff: invest full `monthlyBudget`.

### Key Formulas

**Monthly loan payment:**
```
M = P × [r(1+r)^N] / [(1+r)^N − 1]
P = loan principal (carPrice − downPayment)
r = APR / 12 (as decimal)
N = loan term in months
```

**Monthly investment growth:**
```
balance = balance × (1 + (annualReturn − expenseRatio) / 12) + dividends + contribution
```

**Net wealth:**
```
netWealth = investmentBalance − loanBalance
```

**After-tax net wealth:**
```
gains = max(0, investmentBalance − costBasis)
afterTaxInvestment = investmentBalance − gains × taxRate
afterTaxNetWealth = afterTaxInvestment − loanBalance
```
Cost basis grows with each contribution (dividends not counted — simplification).
Tax rate default: 23.8% (20% federal LTCG + 3.8% NIIT). State taxes not modeled.

### When Financing Beats Cash

If `investmentReturn > loanAPR`, the larger starting balance in a financing scenario compounds faster than the loan costs. The chart shows where the net-wealth lines cross (the break-even point).

---

## Key Types (`src/lib/customTypes.ts`)

```ts
GlobalInputs         // car price, savings, monthly budget, investment params, tax rate, time horizon
FinancingOption      // id, name, downPayment, loanTermMonths, apr (stored as %, e.g. 6.5)
ScenarioResult       // computed output per scenario: monthly data array + summary stats
MonthlyDataPoint     // per-month: investment balance, loan balance, net wealth, after-tax, contributions
ChartViewMode        // 'netWealth' | 'afterTaxNetWealth' | 'investmentBalance'
```

---

## Adding Features

### Adding a new financing input field
1. Add the field to `FinancingOption` in `customTypes.ts`.
2. Add a default value in `App.tsx` (`DEFAULT_INPUTS` or the `addOption` function).
3. Add the input control in `FinancingOptionCard.tsx`.
4. Use the field in `calculations.ts` → `simulate()` or `calcFinancingScenario()`.

### Adding a new chart metric
1. Compute the value in `simulate()` (add to `MonthlyDataPoint` if needed).
2. Add a new `ChartViewMode` key in `customTypes.ts`.
3. Add a branch in `ComparisonChart.tsx` that maps the mode to the right data key.
4. Add the label to `VIEW_LABELS`.

### Scenario colors
Colors are defined in `App.tsx` as `SCENARIO_COLORS`. Index 0 = cash (dark blue), 1–5 = financing options. Pass the array as a `colors` prop to `ComparisonChart` and `SummaryTable`.

---

## Deployment

The app deploys to GitHub Pages via the `gh-pages` npm package:

```bash
npm run deploy   # runs: npm run build && gh-pages -d dist
```

The `homepage` field in `package.json` sets the base URL for routing. Since this is a pure SPA with no client-side routing, no extra config is needed.
