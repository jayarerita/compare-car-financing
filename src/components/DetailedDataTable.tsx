import { useState } from 'react'
import { ScenarioResult } from '@/lib/customTypes'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/calculations'

interface Props {
  scenarios: ScenarioResult[]
}

export function DetailedDataTable({ scenarios }: Props) {
  const valid = scenarios.filter(s => s.isValid && s.data.length > 0)
  const [selectedId, setSelectedId] = useState<string>(valid[0]?.id ?? '')
  const [expanded, setExpanded] = useState(false)

  if (valid.length === 0) return null

  const active = valid.find(s => s.id === selectedId) ?? valid[0]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">View month-by-month data for each scenario.</p>
        <Button variant="outline" size="sm" onClick={() => setExpanded(e => !e)}>
          {expanded ? 'Collapse' : 'Expand Table'}
        </Button>
      </div>

      {expanded && (
        <>
          <div className="flex gap-2 flex-wrap">
            {valid.map(s => (
              <Button
                key={s.id}
                variant={active.id === s.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedId(s.id)}
              >
                {s.name}
              </Button>
            ))}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Investment</TableHead>
                <TableHead className="text-right">After-Tax Value</TableHead>
                <TableHead className="text-right">Loan Balance</TableHead>
                <TableHead className="text-right">Loan Payment</TableHead>
                <TableHead className="text-right">Invest Contrib</TableHead>
                <TableHead className="text-right">Cumul. Interest</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {active.data.map(dp => (
                <TableRow key={dp.month}>
                  <TableCell>{dp.month}</TableCell>
                  <TableCell>{dp.date}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(dp.investmentBalance)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(dp.afterTaxNetWealth)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(dp.loanBalance)}</TableCell>
                  <TableCell className="text-right">
                    {dp.loanPayment > 0 ? formatCurrency(dp.loanPayment) : '—'}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(dp.investmentContribution)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(dp.cumulativeInterest)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  )
}
