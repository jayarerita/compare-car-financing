import { ScenarioResult } from '@/lib/customTypes'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/calculations'

interface Props {
  scenarios: ScenarioResult[]
  colors: string[]
}

export function SummaryTable({ scenarios, colors }: Props) {
  const valid = scenarios.filter(s => s.isValid && s.data.length > 0)
  if (valid.length === 0) return null

  const cashScenario = valid.find(s => s.isCash)
  const cashFinal = cashScenario ? cashScenario.data[cashScenario.data.length - 1] : undefined

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Scenario</TableHead>
          <TableHead className="text-right">Monthly Payment</TableHead>
          <TableHead className="text-right">Total Interest</TableHead>
          <TableHead className="text-right">Investment Balance</TableHead>
          <TableHead className="text-right">After-Tax Value</TableHead>
          {cashFinal && <TableHead className="text-right">vs. Cash</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {valid.map((scenario, i) => {
          const last = scenario.data[scenario.data.length - 1]!
          const delta = cashFinal ? last.investmentBalance - cashFinal.investmentBalance : 0

          return (
            <TableRow key={scenario.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                  <span className="font-medium">{scenario.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                {scenario.monthlyPayment > 0 ? formatCurrency(scenario.monthlyPayment) : '—'}
              </TableCell>
              <TableCell className="text-right">{formatCurrency(scenario.totalInterestPaid)}</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(last.investmentBalance)}</TableCell>
              <TableCell className="text-right">{formatCurrency(last.afterTaxNetWealth)}</TableCell>
              {cashFinal && (
                <TableCell
                  className={`text-right font-medium ${
                    scenario.isCash ? 'text-muted-foreground' :
                    delta > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {scenario.isCash ? '—' : `${delta >= 0 ? '+' : ''}${formatCurrency(delta)}`}
                </TableCell>
              )}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
