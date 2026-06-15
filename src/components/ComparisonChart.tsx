import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { ScenarioResult, ChartViewMode } from '@/lib/customTypes'
import { Button } from '@/components/ui/button'
import { formatCurrency, carValueAtMonth } from '@/lib/calculations'

const ANNUAL_INFLATION = 0.02
const MONTHLY_INFLATION = ANNUAL_INFLATION / 12

// Net Wealth (investment − loan) is intentionally excluded: the car loan is secured by a
// depreciating asset we don't track, so subtracting it would understate the financing scenario's wealth.
const VIEW_ORDER: ChartViewMode[] = ['investmentBalance', 'afterTaxNetWealth']

const VIEW_LABELS: Record<ChartViewMode, string> = {
  investmentBalance: 'Investment Balance',
  netWealth: 'Net Wealth',
  afterTaxNetWealth: 'After-Tax Value',
}

const VIEW_DESCRIPTIONS: Record<ChartViewMode, string> = {
  investmentBalance: 'Portfolio value over time — cash starts lower (more spent upfront), financing starts higher (more capital retained).',
  netWealth: 'Investment balance minus remaining loan.',
  afterTaxNetWealth: 'Portfolio value after estimated capital gains tax on gains above cost basis.',
}

function formatAxisValue(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`
  return `${sign}$${abs.toFixed(0)}`
}

interface Props {
  scenarios: ScenarioResult[]
  colors: string[]
}

export function ComparisonChart({ scenarios, colors }: Props) {
  const [viewMode, setViewMode] = useState<ChartViewMode>('investmentBalance')
  const [inflationAdjusted, setInflationAdjusted] = useState(false)
  const [includeCarValue, setIncludeCarValue] = useState(false)

  const valid = scenarios.filter(s => s.isValid && s.data.length > 0)
  if (valid.length === 0) return <p className="text-muted-foreground text-sm">No valid scenarios to display.</p>

  const deflate = (nominal: number, month: number) =>
    inflationAdjusted ? nominal / Math.pow(1 + MONTHLY_INFLATION, month) : nominal

  const chartData = valid[0].data.map((dp, i) => {
    const point: Record<string, string | number> = { month: dp.month, date: dp.date }
    for (const s of valid) {
      const d = s.data[i]
      if (!d) continue
      const raw =
        viewMode === 'netWealth' ? d.netWealth :
        viewMode === 'afterTaxNetWealth' ? d.afterTaxNetWealth :
        d.investmentBalance
      const carAdj = includeCarValue ? carValueAtMonth(s.carPrice, d.month) : 0
      point[s.id] = deflate(raw + carAdj, dp.month)
    }
    return point
  })

  const xTicks = chartData
    .filter(d => (d.month as number) % 12 === 0)
    .map(d => d.date as string)

  const description = VIEW_DESCRIPTIONS[viewMode]
    + (includeCarValue ? ' Car\'s estimated depreciated value added to each scenario.' : '')
    + (inflationAdjusted ? ' Values shown in today\'s dollars (2% annual inflation).' : '')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {VIEW_ORDER.map(mode => (
            <Button
              key={mode}
              variant={viewMode === mode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode(mode)}
            >
              {VIEW_LABELS[mode]}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIncludeCarValue(v => !v)}
            className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
              includeCarValue
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-input bg-background text-muted-foreground hover:bg-accent'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-sm border transition-colors ${
                includeCarValue ? 'border-primary bg-primary' : 'border-muted-foreground'
              }`}
            >
              {includeCarValue && (
                <svg viewBox="0 0 10 10" className="h-full w-full text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polyline points="1.5,5 4,7.5 8.5,2" />
                </svg>
              )}
            </span>
            Include car value
          </button>

          <button
            onClick={() => setInflationAdjusted(v => !v)}
            className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
              inflationAdjusted
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-input bg-background text-muted-foreground hover:bg-accent'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-sm border transition-colors ${
                inflationAdjusted ? 'border-primary bg-primary' : 'border-muted-foreground'
              }`}
            >
              {inflationAdjusted && (
                <svg viewBox="0 0 10 10" className="h-full w-full text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polyline points="1.5,5 4,7.5 8.5,2" />
                </svg>
              )}
            </span>
            Adjust for inflation (2%/yr)
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{description}</p>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            ticks={xTicks}
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={formatAxisValue}
            tick={{ fontSize: 11 }}
            width={75}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              const scenario = valid.find(s => s.id === name)
              return [formatCurrency(value), scenario?.name ?? name]
            }}
          />
          <Legend
            formatter={(value) => {
              const s = valid.find(sc => sc.id === value)
              return s?.name ?? value
            }}
          />
          <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="4 4" />
          {valid.map((s, i) => (
            <Line
              key={s.id}
              type="monotone"
              dataKey={s.id}
              stroke={colors[i % colors.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
