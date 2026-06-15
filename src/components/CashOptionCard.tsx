import { CashOption } from '@/lib/customTypes'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface Props {
  option: CashOption
  color: string
  onChange: (updated: CashOption) => void
  onDelete: () => void
}

export function CashOptionCard({ option, color, onChange, onDelete }: Props) {
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
        <p className="text-xs text-muted-foreground pl-5">No loan · No interest</p>
      </CardHeader>

      <CardContent>
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
      </CardContent>
    </Card>
  )
}
