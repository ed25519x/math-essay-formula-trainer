import { Delete, Eraser } from 'lucide-react'
import { InlineMath } from 'react-katex'
import { cn } from '@/lib/utils'

export type KeypadAction =
  | { type: 'insert'; text: string; cursorBack?: number }
  | { type: 'backspace' }
  | { type: 'clear' }

interface KeyDef {
  display: string
  action: KeypadAction
}

function k(display: string, text: string, cursorBack?: number): KeyDef {
  return { display, action: { type: 'insert', text, cursorBack } }
}

const GROUPS: KeyDef[][] = [
  [
    k('x^{n}', 'x^{}', 1),
    k('x_{n}', 'x_{}', 1),
    k('\\sqrt{x}', '\\sqrt{}', 1),
    k('\\sqrt[n]{x}', '\\sqrt[]{}', 3),
    k('\\frac{a}{b}', '\\frac{}{}', 3),
  ],
  [
    k('\\pi', '\\pi'),
    k('\\theta', '\\theta'),
    k('\\infty', '\\infty'),
    k('\\pm', '\\pm'),
    k('\\cdot', '\\cdot'),
  ],
  [
    k('\\sin', '\\sin'),
    k('\\cos', '\\cos'),
    k('\\tan', '\\tan'),
    k('\\sec', '\\sec'),
    k('\\csc', '\\csc'),
    k('\\cot', '\\cot'),
  ],
  [
    k('\\log_{a}', '\\log_{}', 1),
    k('\\ln', '\\ln'),
    k('\\lim_{x}', '\\lim_{}', 1),
    k('\\int', '\\int_{}^{}', 4),
    k('\\sum', '\\sum_{}^{}', 4),
  ],
]

interface Props {
  onAction: (action: KeypadAction) => void
  disabled?: boolean
}

export function MathKeypad({ onAction, disabled }: Props) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-2 shadow-sm transition-opacity',
        disabled && 'pointer-events-none opacity-40',
      )}
    >
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {GROUPS.map((group, gi) => (
          <div key={gi} className="flex shrink-0 items-center gap-1 border-r border-border pr-2 last:border-r-0">
            {group.map((key, ki) => (
              <button
                key={ki}
                type="button"
                tabIndex={-1}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onAction(key.action)}
                className="flex h-10 min-w-10 shrink-0 items-center justify-center rounded-lg border border-input bg-background px-2 text-sm active:scale-95 active:bg-accent"
              >
                <InlineMath math={key.display} />
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-border pt-2">
        <span className="text-xs text-muted-foreground">
          {disabled ? '빈칸을 탭해서 선택하세요' : '기호를 탭하면 커서 위치에 삽입돼요'}
        </span>
        <div className="ml-auto flex gap-1.5">
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onAction({ type: 'backspace' })}
            className="flex h-9 items-center gap-1 rounded-lg border border-input bg-background px-2.5 text-xs active:scale-95 active:bg-accent"
          >
            <Delete className="size-3.5" /> 지우기
          </button>
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onAction({ type: 'clear' })}
            className="flex h-9 items-center gap-1 rounded-lg border border-input bg-background px-2.5 text-xs active:scale-95 active:bg-accent"
          >
            <Eraser className="size-3.5" /> 전체
          </button>
        </div>
      </div>
    </div>
  )
}
