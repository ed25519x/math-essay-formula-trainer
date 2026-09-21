import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ALL_UNITS, UNIT_LABEL, type Unit } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  scope: Set<Unit>
  onChange: (scope: Set<Unit>) => void
}

const UNIT_DESC: Record<Unit, string> = {
  수1: '지수·로그, 삼각함수, 수열',
  수2: '함수의 극한, 미분, 적분',
  미적분: '국민대 논술 대비 · 수열의 극한, 삼각함수 극한, 여러 함수의 미분·적분',
}

export function ScopeSelector({ scope, onChange }: Props) {
  function toggle(unit: Unit) {
    const next = new Set(scope)
    if (next.has(unit)) {
      if (next.size > 1) next.delete(unit)
    } else {
      next.add(unit)
    }
    onChange(next)
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {ALL_UNITS.map((unit) => {
        const checked = scope.has(unit)
        return (
          <label
            key={unit}
            htmlFor={`unit-${unit}`}
            className={cn(
              'flex cursor-pointer flex-col gap-1.5 rounded-xl border-2 p-4 transition-colors',
              checked ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/40',
            )}
          >
            <div className="flex items-center gap-2">
              <Checkbox id={`unit-${unit}`} checked={checked} onCheckedChange={() => toggle(unit)} />
              <Label htmlFor={`unit-${unit}`} className="cursor-pointer text-base font-semibold">
                {UNIT_LABEL[unit]}
              </Label>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">{UNIT_DESC[unit]}</p>
          </label>
        )
      })}
    </div>
  )
}
