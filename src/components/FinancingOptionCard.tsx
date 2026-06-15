import { FinancingOption } from '@/lib/customTypes'
import { calcMonthlyPayment, formatCurrency } from '@/lib/calculations'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'

const TERM_OPTIONS = [12, 24, 36, 48, 60, 72, 84]

interface Props {
  option: FinancingOption
  monthlyBudget: number
  onChange: (updated: FinancingOption) => void
  onDelete: () => void
  color: string
}

export function FinancingOptionCard({ option, monthlyBudget, onChange, onDelete, color }: Props) {
  const loanPrincipal = Math.max(0, option.carPrice - option.downPayment)
  const payment = calcMonthlyPayment(loanPrincipal, option.apr, option.loanTermMonths)
  const totalPaid = payment * option.loanTermMonths + option.downPayment
  const totalInterest = payment * option.loanTermMonths - loanPrincipal
  const canAfford = payment <= monthlyBudget

  return (
    <Card className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-3 right-3 h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
        onClick={onDelete}
        aria-label="Remove option"
      >
        ✕
      </Button>

      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 pr-8">
          <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <Input
            value={option.name}
            onChange={e => onChange({ ...option, name: e.target.value })}
            className="border-none p-0 h-auto text-base font-semibold shadow-none focus-visible:ring-0 bg-transparent"
          />
        </div>
        <p className="text-sm font-medium text-primary pl-5">
          {formatCurrency(payment)}/mo
          {!canAfford && (
            <span className="ml-2 text-xs text-destructive font-normal">
              (exceeds monthly budget)
            </span>
          )}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label>Car Price</Label>
          <Input
            type="number"
            min={0}
            step={500}
            value={option.carPrice}
            onChange={e => onChange({ ...option, carPrice: Number(e.target.value) })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Down Payment</Label>
            <Input
              type="number"
              min={0}
              max={option.carPrice}
              step={500}
              value={option.downPayment}
              onChange={e => onChange({ ...option, downPayment: Math.min(Number(e.target.value), option.carPrice) })}
            />
          </div>

          <div className="space-y-1">
            <Label>Loan Term</Label>
            <select
              value={option.loanTermMonths}
              onChange={e => onChange({ ...option, loanTermMonths: Number(e.target.value) })}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {TERM_OPTIONS.map(t => (
                <option key={t} value={t}>
                  {t} mo ({t / 12} yr)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <Label>APR</Label>
            <span className="text-muted-foreground">{option.apr.toFixed(2)}%</span>
          </div>
          <Slider
            value={[option.apr]}
            onValueChange={([v]) => onChange({ ...option, apr: v })}
            min={0}
            max={30}
            step={0.05}
          />
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground border-t pt-3">
          <span>Loan principal</span>
          <span className="text-right">{formatCurrency(loanPrincipal)}</span>
          <span>Total interest</span>
          <span className="text-right">{formatCurrency(Math.max(0, totalInterest))}</span>
          <span>Total cost</span>
          <span className="text-right font-medium text-foreground">{formatCurrency(totalPaid)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
