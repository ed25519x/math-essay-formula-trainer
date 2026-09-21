import { Delete, Eraser } from 'lucide-react'
import { InlineMath } from 'react-katex'
import type { SuggestedKey } from '@/lib/keySuggest'
import { cn } from '@/lib/utils'

export type KeypadAction =
  | { type: 'insert'; text: string; cursorBack?: number }
  | { type: 'backspace' }
  | { type: 'clear' }

interface KeyDef {
  display: string
  /** KaTeX 대신 그냥 글자로 보여줄 때 */
  plain?: string
  action: KeypadAction
}

function k(display: string, text: string, cursorBack?: number): KeyDef {
  return { display, action: { type: 'insert', text, cursorBack } }
}

function p(plain: string, text: string, cursorBack?: number): KeyDef {
  return { display: plain, plain, action: { type: 'insert', text, cursorBack } }
}

interface Group {
  label: string
  keys: KeyDef[]
}

const GROUPS: Group[] = [
  {
    label: '구조',
    keys: [
      k('x^{n}', '^{}', 1),
      k('x_{n}', '_{}', 1),
      k('\\sqrt{x}', '\\sqrt{}', 1),
      k('\\sqrt[n]{x}', '\\sqrt[]{}', 3),
      k('\\frac{a}{b}', '\\frac{}{}', 3),
      p('( )', '()', 1),
      p("f'", "'"),
      k('f(x)', 'f(x)'),
      k("f'(x)", "f'(x)"),
    ],
  },
  {
    label: '기호',
    keys: [
      k('\\pi', '\\pi'),
      k('\\theta', '\\theta'),
      k('\\infty', '\\infty'),
      k('\\pm', '\\pm'),
      k('\\cdot', '\\cdot'),
      k('\\times', '\\times'),
      k('\\ne', '\\ne'),
      k('\\le', '\\le'),
      k('\\ge', '\\ge'),
      k('\\to', '\\to'),
    ],
  },
  {
    label: '삼각함수',
    keys: [
      k('\\sin', '\\sin'),
      k('\\cos', '\\cos'),
      k('\\tan', '\\tan'),
      k('\\sec', '\\sec'),
      k('\\csc', '\\csc'),
      k('\\cot', '\\cot'),
    ],
  },
  {
    label: '로그·극한·적분',
    keys: [
      k('\\log_{a}', '\\log_{}', 1),
      k('\\ln', '\\ln'),
      k('e^{x}', 'e^{}', 1),
      k('\\lim_{x}', '\\lim_{}', 1),
      k('\\int', '\\int_{}^{}', 4),
      k('\\sum', '\\sum_{}^{}', 4),
      k('\\Delta', '\\Delta'),
    ],
  },
]

function KeyButton({ def, onAction }: { def: KeyDef; onAction: (a: KeypadAction) => void }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onAction(def.action)}
      className="flex h-10 min-w-10 flex-none items-center justify-center rounded-lg border border-input bg-background px-2 text-sm active:scale-95 active:bg-accent"
    >
      {def.plain ? <span className="font-mono">{def.plain}</span> : <InlineMath math={def.display} />}
    </button>
  )
}

interface Props {
  onAction: (action: KeypadAction) => void
  disabled?: boolean
  /** 현재 카드에 등장하는 기호로 만든 단축키 (맨 위에 먼저 보여준다) */
  suggestions?: SuggestedKey[]
}

export function MathKeypad({ onAction, disabled, suggestions }: Props) {
  const suggestionKeys: KeyDef[] = (suggestions ?? []).map((s) =>
    /^[a-zA-Z]['(]/.test(s.display)
      ? { display: s.display, plain: s.display, action: { type: 'insert', text: s.text, cursorBack: s.cursorBack } }
      : { display: s.display, action: { type: 'insert', text: s.text, cursorBack: s.cursorBack } },
  )

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-2.5 shadow-sm transition-opacity',
        disabled && 'pointer-events-none opacity-40',
      )}
    >
      <div className="space-y-2.5">
        {suggestionKeys.length > 0 && (
          <div>
            <p className="mb-1 text-[11px] font-medium text-primary">이 공식에 나오는 기호</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestionKeys.map((def, i) => (
                <KeyButton key={`s${i}`} def={def} onAction={onAction} />
              ))}
            </div>
          </div>
        )}

        {GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-1 text-[11px] text-muted-foreground">{group.label}</p>
            <div className="flex flex-wrap gap-1.5">
              {group.keys.map((def, i) => (
                <KeyButton key={i} def={def} onAction={onAction} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-border pt-2.5">
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
