import { useState, useMemo } from 'react'
import { GlobalInputs, CashOption, FinancingOption, DividendFrequency } from '@/lib/customTypes'
import { calcCashScenario, calcFinancingScenario } from '@/lib/calculations'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { CashOptionCard } from '@/components/CashOptionCard'
import { FinancingOptionCard } from '@/components/FinancingOptionCard'
import { ComparisonChart } from '@/components/ComparisonChart'
import { SummaryTable } from '@/components/SummaryTable'
import { DetailedDataTable } from '@/components/DetailedDataTable'

export const SCENARIO_COLORS = [
  '#1e3a5f', // cash — dark blue (primary)
  '#16a34a', // green
  '#ea580c', // orange
  '#7c3aed', // purple
  '#dc2626', // red
  '#0891b2', // cyan
]

const DEFAULT_INPUTS: GlobalInputs = {
  availableSavings: 50000,
  monthlyBudget: 500,
  investmentReturnPct: 7,
  expenseRatioPct: 0.05,
  dividendYieldPct: 1.5,
  dividendFrequency: 'quarterly',
  capitalGainsTaxRatePct: 23.8,
  timeHorizonYears: 7,
}

let nextCashId = 2
let nextFinId = 2

export default function App() {
  const [inputs, setInputs] = useState<GlobalInputs>(DEFAULT_INPUTS)
  const [cashOptions, setCashOptions] = useState<CashOption[]>([
    { id: 'cash_1', name: 'Cash Purchase', carPrice: 30000 },
  ])
  const [financingOptions, setFinancingOptions] = useState<FinancingOption[]>([
    { id: 'fin_1', name: 'Standard Finance', carPrice: 30000, downPayment: 5000, loanTermMonths: 60, apr: 6 },
  ])

  function updateInput<K extends keyof GlobalInputs>(key: K, value: GlobalInputs[K]) {
    setInputs(prev => ({ ...prev, [key]: value }))
  }

  function addCashOption() {
    const id = `cash_${nextCashId++}`
    const refPrice = cashOptions[cashOptions.length - 1]?.carPrice ?? 30000
    setCashOptions(prev => [
      ...prev,
      { id, name: `Cash Option ${prev.length + 1}`, carPrice: refPrice },
    ])
  }

  function addFinancingOption() {
    const id = `fin_${nextFinId++}`
    const refPrice = cashOptions[0]?.carPrice ?? 30000
    setFinancingOptions(prev => [
      ...prev,
      { id, name: `Option ${prev.length + 1}`, carPrice: refPrice, downPayment: 3000, loanTermMonths: 60, apr: 7 },
    ])
  }

  const scenarios = useMemo(() => {
    const results = [
      ...cashOptions.map(opt => calcCashScenario(opt, inputs)),
      ...financingOptions.map(opt => calcFinancingScenario(opt, inputs)),
    ]
    return results
  }, [cashOptions, inputs, financingOptions])

  const invalidScenarios = scenarios.filter(s => !s.isValid)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary">Car Purchase Comparison</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
            Compare paying cash versus financing a car purchase, across different vehicles and loan terms.
            Each scenario can have its own car price so you can evaluate entirely different cars side by side.
          </p>
        </div>

        {/* Scenarios */}
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Scenarios</h2>
              <p className="text-sm text-muted-foreground">
                Set a car price per scenario to compare different vehicles or deal structures.
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={addCashOption}
                disabled={cashOptions.length + financingOptions.length >= 6}
              >
                + Cash
              </Button>
              <Button
                size="sm"
                onClick={addFinancingOption}
                disabled={cashOptions.length + financingOptions.length >= 6}
              >
                + Financing
              </Button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cashOptions.map((opt, i) => (
              <CashOptionCard
                key={opt.id}
                option={opt}
                color={SCENARIO_COLORS[i % SCENARIO_COLORS.length]}
                onChange={updated =>
                  setCashOptions(prev => prev.map(o => o.id === updated.id ? updated : o))
                }
                onDelete={() => setCashOptions(prev => prev.filter(o => o.id !== opt.id))}
              />
            ))}

            {financingOptions.map((opt, i) => (
              <FinancingOptionCard
                key={opt.id}
                option={opt}
                monthlyBudget={inputs.monthlyBudget}
                onChange={updated =>
                  setFinancingOptions(prev => prev.map(o => o.id === updated.id ? updated : o))
                }
                onDelete={() => setFinancingOptions(prev => prev.filter(o => o.id !== opt.id))}
                color={SCENARIO_COLORS[(cashOptions.length + i) % SCENARIO_COLORS.length]}
              />
            ))}
          </div>

          {cashOptions.length === 0 && financingOptions.length === 0 && (
            <p className="text-sm text-muted-foreground italic">
              No scenarios yet — add a cash or financing option above.
            </p>
          )}
        </div>

        {/* Financial Parameters */}
        <div className="grid md:grid-cols-2 gap-6">

          <Card>
            <CardHeader>
              <CardTitle>Your Finances</CardTitle>
              <CardDescription>Savings and monthly budget shared across all scenarios.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="savings">Available Savings</Label>
                <Input
                  id="savings"
                  type="number"
                  min={0}
                  step={1000}
                  value={inputs.availableSavings}
                  onChange={e => updateInput('availableSavings', Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Total liquid savings. Cash scenarios spend the car price from this; financing scenarios
                  spend only the down payment, keeping the rest invested.
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="budget">Monthly Budget</Label>
                <Input
                  id="budget"
                  type="number"
                  min={0}
                  step={50}
                  value={inputs.monthlyBudget}
                  onChange={e => updateInput('monthlyBudget', Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Total monthly cash for car payments + investing. Cash scenarios invest the full amount;
                  financing scenarios subtract the loan payment first.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <Label>Time Horizon</Label>
                  <span className="text-muted-foreground">{inputs.timeHorizonYears} years</span>
                </div>
                <Slider
                  value={[inputs.timeHorizonYears]}
                  onValueChange={([v]) => updateInput('timeHorizonYears', v)}
                  min={1}
                  max={40}
                  step={1}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Investment Parameters</CardTitle>
              <CardDescription>How retained capital grows when invested.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <Label>Annual Return</Label>
                  <span className="text-muted-foreground">{inputs.investmentReturnPct.toFixed(1)}%</span>
                </div>
                <Slider
                  value={[inputs.investmentReturnPct]}
                  onValueChange={([v]) => updateInput('investmentReturnPct', v)}
                  min={0} max={20} step={0.1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <Label>Expense Ratio</Label>
                  <span className="text-muted-foreground">{inputs.expenseRatioPct.toFixed(2)}%</span>
                </div>
                <Slider
                  value={[inputs.expenseRatioPct]}
                  onValueChange={([v]) => updateInput('expenseRatioPct', v)}
                  min={0} max={2} step={0.01}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <Label>Dividend Yield</Label>
                  <span className="text-muted-foreground">{inputs.dividendYieldPct.toFixed(1)}%</span>
                </div>
                <Slider
                  value={[inputs.dividendYieldPct]}
                  onValueChange={([v]) => updateInput('dividendYieldPct', v)}
                  min={0} max={10} step={0.1}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Dividend Frequency</Label>
                <RadioGroup
                  value={inputs.dividendFrequency}
                  onValueChange={v => updateInput('dividendFrequency', v as DividendFrequency)}
                  className="flex gap-4 flex-row"
                >
                  {(['monthly', 'quarterly', 'annually'] as DividendFrequency[]).map(f => (
                    <div key={f} className="flex items-center gap-1.5">
                      <RadioGroupItem value={f} id={`div_${f}`} />
                      <Label htmlFor={`div_${f}`} className="font-normal capitalize text-sm cursor-pointer">{f}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <Label>Capital Gains Tax Rate</Label>
                  <span className="text-muted-foreground">{inputs.capitalGainsTaxRatePct.toFixed(1)}%</span>
                </div>
                <Slider
                  value={[inputs.capitalGainsTaxRatePct]}
                  onValueChange={([v]) => updateInput('capitalGainsTaxRatePct', v)}
                  min={0} max={40} step={0.1}
                />
                <p className="text-xs text-muted-foreground">
                  Default 23.8% = 20% federal LTCG + 3.8% NIIT. Applied to gains only.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Validation alerts */}
        {invalidScenarios.length > 0 && (
          <div className="space-y-2">
            {invalidScenarios.map(s => (
              <div key={s.id} className="rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                <strong>{s.name}:</strong> {s.validationError}
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Results</h2>

          <Card>
            <CardHeader>
              <CardTitle>Scenario Comparison Over Time</CardTitle>
              <CardDescription>
                Investment Balance shows your portfolio value over time — cash scenarios start lower
                because more capital was spent upfront. Switch to Net Wealth to see the loan subtracted as a liability.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ComparisonChart scenarios={scenarios} colors={SCENARIO_COLORS} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Summary at {inputs.timeHorizonYears}-Year Horizon</CardTitle>
              <CardDescription>
                Green "vs. Cash" values mean that financing option leaves you better off than paying cash.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SummaryTable scenarios={scenarios} colors={SCENARIO_COLORS} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How It's Calculated</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-1">Cash Purchase</h4>
                    <p className="text-muted-foreground text-xs">
                      Pay the full car price from savings on day one. Starting investment = savings − car price.
                      The full monthly budget compounds in the investment portfolio each month, since there's no loan payment.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Financing</h4>
                    <p className="text-muted-foreground text-xs">
                      Pay only the down payment upfront. Starting investment = savings − down payment (more capital retained).
                      Each month: pay the loan, invest whatever remains from the monthly budget. After payoff, the full budget goes to investing.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">When financing wins</h4>
                    <p className="text-muted-foreground text-xs">
                      If investment return &gt; loan APR, the larger capital base compounds faster than the interest costs,
                      resulting in more net wealth over time.
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-1">Monthly loan payment</h4>
                    <p className="font-mono text-xs bg-muted rounded px-2 py-1">
                      M = P × [r(1+r)^N] / [(1+r)^N − 1]
                    </p>
                    <p className="text-muted-foreground text-xs mt-1">P = principal, r = APR÷12, N = term months</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Monthly investment growth</h4>
                    <p className="font-mono text-xs bg-muted rounded px-2 py-1">
                      B = B × (1 + (return − fees) / 12) + dividends + contribution
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">After-tax net wealth</h4>
                    <p className="font-mono text-xs bg-muted rounded px-2 py-1">
                      = (balance − gains × tax rate) − loan balance
                    </p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Tax applies to gains above cost basis only (contributions + starting balance).
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Car depreciation (optional overlay)</h4>
                    <p className="text-muted-foreground text-xs mb-1">
                      Based on NADA/KBB averages for new vehicles. Three-phase compound decay with a 10% salvage floor:
                    </p>
                    <ul className="text-muted-foreground text-xs space-y-0.5 list-none">
                      <li><span className="font-medium text-foreground">Year 1:</span> 20%/yr — largest drop immediately after purchase</li>
                      <li><span className="font-medium text-foreground">Years 2–5:</span> 15%/yr — continued mid-life decline</li>
                      <li><span className="font-medium text-foreground">Year 6+:</span> 5%/yr — slower rate as value stabilises</li>
                      <li><span className="font-medium text-foreground">Floor:</span> 10% of purchase price (approximate salvage value)</li>
                    </ul>
                    <p className="text-muted-foreground text-xs mt-1">
                      Example on a $30,000 car: ~$24,000 after year 1, ~$12,500 after year 5, ~$10,700 after year 10.
                      Assumes new vehicle purchased at time zero. Used-car scenarios will overstate early depreciation.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Detail</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailedDataTable scenarios={scenarios} />
            </CardContent>
          </Card>
        </div>

      </div>

      <footer className="border-t mt-12 py-6 text-center text-xs text-muted-foreground">
        Built by{' '}
        <a
          href="https://jakerita.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground transition-colors"
        >
          Jake Rita
        </a>
      </footer>
    </div>
  )
}
