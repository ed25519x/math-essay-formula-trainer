import { Check, Code2, Eye, RotateCcw, X } from 'lucide-react'
import { InlineMath } from 'react-katex'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { MathKeypad, type KeypadAction } from '@/components/MathKeypad'
import { MathText } from '@/components/MathText'
import { getChoices } from '@/lib/distractors'
import { checkTexAnswer } from '@/lib/mathMatch'
import type { FormulaEntry, Part } from '@/lib/formulas'
import { isBlank } from '@/lib/formulas'
import { cn } from '@/lib/utils'

export type AnswerMode = 'type' | 'choice'

function BlankInput({
  id,
  value,
  correct,
  checked,
  onChange,
  onFocus,
  registerRef,
}: {
  id: string
  value: string
  correct: boolean | null
  checked: boolean
  onChange: (v: string) => void
  onFocus: () => void
  registerRef: (el: HTMLInputElement | null) => void
}) {
  return (
    <input
      id={id}
      ref={registerRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      onClick={onFocus}
      disabled={checked}
      placeholder="?"
      autoComplete="off"
      autoCapitalize="off"
      spellCheck={false}
      inputMode="text"
      className={cn(
        'mx-1 inline-block w-24 sm:w-28 rounded-md border-2 bg-background px-2 py-1 text-center font-mono text-sm outline-none transition-colors',
        !checked && 'border-input focus:border-ring',
        checked && correct && 'border-success bg-success/10 text-success-foreground',
        checked && correct === false && 'border-destructive bg-destructive/10',
      )}
    />
  )
}

function ChoiceBlank({
  choices,
  value,
  checked,
  correctAnswers,
  onSelect,
}: {
  choices: string[]
  value: string
  checked: boolean
  correctAnswers: string[]
  onSelect: (v: string) => void
}) {
  return (
    <span className="mx-1 inline-flex flex-wrap justify-center gap-1.5 align-middle">
      {choices.map((c) => {
        const isSelected = value === c
        const isCorrectChoice = checked && checkTexAnswer(c, correctAnswers)
        return (
          <button
            key={c}
            type="button"
            disabled={checked}
            onClick={() => onSelect(c)}
            className={cn(
              'rounded-md border-2 px-2.5 py-1.5 font-mono text-sm transition-colors',
              !checked && isSelected && 'border-primary bg-primary/10',
              !checked && !isSelected && 'border-input bg-background hover:border-primary/50',
              checked && isCorrectChoice && 'border-success bg-success/10',
              checked && isSelected && !isCorrectChoice && 'border-destructive bg-destructive/10',
              checked && !isSelected && !isCorrectChoice && 'border-input opacity-50',
            )}
          >
            <InlineMath math={c} />
          </button>
        )
      })}
    </span>
  )
}

function sourceOfLine(line: Part[], checked: boolean): string {
  return line
    .map((part) => (isBlank(part) ? (checked ? part.answer[0] : '\\underline{\\ \\ \\ \\ }') : part))
    .join('')
}

interface Props {
  entry: FormulaEntry
  onResult: (allCorrect: boolean) => void
  cardKey: string
  mode: AnswerMode
  showSource: boolean
  onToggleSource: (v: boolean) => void
}

export function FormulaCardView({ entry, onResult, cardKey, mode, showSource, onToggleSource }: Props) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [checked, setChecked] = useState(false)
  const [overridden, setOverridden] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [activeBlankId, setActiveBlankId] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const pendingCaret = useRef<{ id: string; pos: number } | null>(null)

  useEffect(() => {
    setValues({})
    setChecked(false)
    setOverridden(false)
    setRevealed(false)
    setActiveBlankId(null)
    inputRefs.current = {}
    let cancelled = false
    import('gsap').then(({ gsap }) => {
      if (cancelled || !rootRef.current) return
      gsap.fromTo(
        rootRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' },
      )
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardKey])

  useEffect(() => {
    if (pendingCaret.current) {
      const { id, pos } = pendingCaret.current
      const el = inputRefs.current[id]
      if (el) {
        el.focus()
        el.setSelectionRange(pos, pos)
      }
      pendingCaret.current = null
    }
  }, [values])

  const blankAnswers: Record<string, string[]> =
    entry.kind === 'formula'
      ? Object.fromEntries(entry.lines.flat().filter(isBlank).map((p) => [p.blank, p.answer]))
      : Object.fromEntries(
          entry.rows.flatMap((r) =>
            r.cells.filter((c) => c.blank).map((c) => [c.blank as string, c.answer ?? []]),
          ),
        )

  const choicesByBlank = useMemo(() => {
    if (mode !== 'choice') return {}
    const map: Record<string, string[]> = {}
    for (const [id, answers] of Object.entries(blankAnswers)) {
      map[id] = getChoices(entry, id, answers[0] ?? '', 4)
    }
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardKey, mode])

  const results: Record<string, boolean> = {}
  for (const id of Object.keys(blankAnswers)) {
    results[id] = checkTexAnswer(values[id] ?? '', blankAnswers[id] ?? [])
  }
  const allCorrect = Object.values(results).every(Boolean)
  const finalCorrect = overridden || allCorrect

  function handleCheck() {
    setChecked(true)
    if (rootRef.current && !allCorrect) {
      import('gsap').then(({ gsap }) => {
        if (!rootRef.current) return
        gsap.fromTo(rootRef.current, { x: -8 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.4)' })
      })
    }
  }

  function setBlankValue(id: string, v: string) {
    setValues((prev) => ({ ...prev, [id]: v }))
  }

  function handleKeypadAction(action: KeypadAction) {
    if (!activeBlankId) return
    const el = inputRefs.current[activeBlankId]
    const current = values[activeBlankId] ?? ''

    if (action.type === 'clear') {
      pendingCaret.current = { id: activeBlankId, pos: 0 }
      setBlankValue(activeBlankId, '')
      return
    }

    const start = el?.selectionStart ?? current.length
    const end = el?.selectionEnd ?? current.length

    if (action.type === 'backspace') {
      if (start === end && start > 0) {
        const next = current.slice(0, start - 1) + current.slice(end)
        pendingCaret.current = { id: activeBlankId, pos: start - 1 }
        setBlankValue(activeBlankId, next)
      } else if (start !== end) {
        const next = current.slice(0, start) + current.slice(end)
        pendingCaret.current = { id: activeBlankId, pos: start }
        setBlankValue(activeBlankId, next)
      }
      return
    }

    const next = current.slice(0, start) + action.text + current.slice(end)
    const newPos = start + action.text.length - (action.cursorBack ?? 0)
    pendingCaret.current = { id: activeBlankId, pos: newPos }
    setBlankValue(activeBlankId, next)
  }

  function renderBlank(part: { blank: string }) {
    if (mode === 'choice') {
      return (
        <ChoiceBlank
          key={part.blank}
          choices={choicesByBlank[part.blank] ?? []}
          value={values[part.blank] ?? ''}
          checked={checked}
          correctAnswers={blankAnswers[part.blank] ?? []}
          onSelect={(v) => setBlankValue(part.blank, v)}
        />
      )
    }
    return (
      <BlankInput
        key={part.blank}
        id={part.blank}
        value={values[part.blank] ?? ''}
        checked={checked}
        correct={checked ? (results[part.blank] ?? false) : null}
        onChange={(v) => setBlankValue(part.blank, v)}
        onFocus={() => setActiveBlankId(part.blank)}
        registerRef={(el) => {
          inputRefs.current[part.blank] = el
        }}
      />
    )
  }

  function handleOverride() {
    setOverridden(true)
  }

  function handleNext() {
    onResult(finalCorrect)
  }

  return (
    <div ref={rootRef}>
      <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
        <Badge variant="outline">{entry.unit}</Badge>
        <Badge variant="secondary">{entry.topic}</Badge>
      </div>
      <h3 className="mb-1 text-center text-lg font-semibold">
        <MathText text={entry.title} />
      </h3>
      {entry.note && (
        <p className="mb-3 text-center text-sm text-muted-foreground">
          (<MathText text={entry.note} />)
        </p>
      )}

      <div className="my-4 rounded-lg border border-border bg-muted/40 p-4">
        {entry.kind === 'formula' ? (
          entry.lines.map((line, i) => (
            <div key={i} className="flex flex-wrap items-center justify-center gap-y-2 py-1.5 text-base sm:text-lg">
              {line.map((part, j) => (isBlank(part) ? renderBlank(part) : <InlineMath key={j} math={part} />))}
            </div>
          ))
        ) : (
          <div className="overflow-x-auto">
            <table className="mx-auto border-collapse text-sm sm:text-base">
              <thead>
                <tr>
                  <th className="p-2" />
                  {entry.headers.map((h) => (
                    <th key={h} className="border border-border p-2 font-medium">
                      <InlineMath math={h} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entry.rows.map((row) => (
                  <tr key={row.label}>
                    <th className="border border-border p-2 font-medium">{row.label}</th>
                    {row.cells.map((cell, ci) => (
                      <td key={ci} className="border border-border p-2">
                        {cell.blank ? renderBlank({ blank: cell.blank }) : <InlineMath math={cell.tex ?? ''} />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showSource && entry.kind === 'formula' && (
        <div className="mb-3 space-y-1 rounded-lg border border-dashed border-border bg-muted/30 p-3 font-mono text-xs text-muted-foreground">
          {entry.lines.map((line, i) => (
            <div key={i} className="overflow-x-auto whitespace-pre">
              {sourceOfLine(line, checked)}
            </div>
          ))}
        </div>
      )}

      {mode === 'type' && (
        <div className="mb-3">
          <MathKeypad onAction={handleKeypadAction} disabled={checked || !activeBlankId} />
        </div>
      )}

      {revealed && (
        <div className="mb-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-center text-sm">
          <p className="mb-1 font-medium text-primary">정답</p>
          {entry.kind === 'formula'
            ? entry.lines.map((line, i) => (
                <div key={i} className="py-0.5">
                  {line.map((part, j) =>
                    isBlank(part) ? (
                      <span key={j} className="mx-1 font-semibold text-primary">
                        <InlineMath math={part.answer[0] ?? ''} />
                      </span>
                    ) : (
                      <InlineMath key={j} math={part} />
                    ),
                  )}
                </div>
              ))
            : entry.rows.map((row) => (
                <div key={row.label} className="py-0.5">
                  {row.label}:{' '}
                  {row.cells.map((c, i) => (
                    <span key={i} className="mx-1 font-semibold text-primary">
                      <InlineMath math={c.blank ? (c.answer?.[0] ?? '') : (c.tex ?? '')} />
                    </span>
                  ))}
                </div>
              ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2">
        {!checked && (
          <Button onClick={handleCheck} size="lg">
            <Check className="size-4" /> 채점하기
          </Button>
        )}
        {checked && !finalCorrect && !overridden && (
          <Button onClick={handleOverride} variant="secondary" size="lg">
            <RotateCcw className="size-4" /> 맞은 걸로 인정
          </Button>
        )}
        <Button onClick={() => setRevealed((r) => !r)} variant="outline" size="lg">
          <Eye className="size-4" /> {revealed ? '정답 숨기기' : '정답 보기'}
        </Button>
        {checked && (
          <Button onClick={handleNext} size="lg" variant={finalCorrect ? 'success' : 'default'}>
            다음
          </Button>
        )}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        <Checkbox
          id={`src-${cardKey}`}
          checked={showSource}
          onCheckedChange={(v) => onToggleSource(v === true)}
        />
        <Label htmlFor={`src-${cardKey}`} className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground">
          <Code2 className="size-3.5" /> LaTeX 코드 보기
        </Label>
      </div>

      {checked && (
        <p
          className={cn(
            'mt-3 flex items-center justify-center gap-1 text-sm font-medium',
            finalCorrect ? 'text-success' : 'text-destructive',
          )}
        >
          {finalCorrect ? (
            <>
              <Check className="size-4" /> 정답입니다!
            </>
          ) : (
            <>
              <X className="size-4" /> 다시 한 번 확인해보세요.
            </>
          )}
        </p>
      )}
    </div>
  )
}
