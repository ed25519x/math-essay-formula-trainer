import { Check, Code2, Eye, RotateCcw, Sigma, X } from 'lucide-react'
import { InlineMath } from 'react-katex'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { MathKeypad, type KeypadAction } from '@/components/MathKeypad'
import { MathText } from '@/components/MathText'
import { getChoices } from '@/lib/distractors'
import { suggestKeysForEntry } from '@/lib/keySuggest'
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
  preview,
  focused,
  onChange,
  onFocus,
  onBlur,
  registerRef,
}: {
  id: string
  value: string
  correct: boolean | null
  checked: boolean
  /** 포커스가 없을 때 입력한 TeX를 렌더링해서 보여줄지 */
  preview: boolean
  focused: boolean
  onChange: (v: string) => void
  onFocus: () => void
  onBlur: () => void
  registerRef: (el: HTMLInputElement | null) => void
}) {
  if (preview && !focused && value.trim() !== '') {
    return (
      <button
        type="button"
        onClick={onFocus}
        disabled={checked}
        className={cn(
          'mx-1 inline-flex min-w-16 max-w-full items-center justify-center rounded-md border-2 px-2 py-1 text-center align-middle transition-colors',
          !checked && 'border-input bg-background hover:border-primary/50',
          checked && correct && 'border-success bg-success/10',
          checked && correct === false && 'border-destructive bg-destructive/10',
        )}
      >
        <InlineMath math={value} />
      </button>
    )
  }
  return (
    <input
      id={id}
      ref={registerRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      onClick={onFocus}
      onBlur={onBlur}
      disabled={checked}
      placeholder="?"
      autoComplete="off"
      autoCapitalize="off"
      spellCheck={false}
      inputMode="text"
      // 입력한 만큼 칸이 늘어나서 긴 수식도 가로 스크롤 없이 보인다
      style={{ width: `min(100%, ${Math.max(6, value.length + 2)}ch)` }}
      className={cn(
        'mx-1 inline-block max-w-full rounded-md border-2 bg-background px-2 py-1 text-center font-mono text-sm outline-none transition-colors',
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
  renderInput: boolean
  onToggleRenderInput: (v: boolean) => void
}

export function FormulaCardView({
  entry,
  onResult,
  cardKey,
  mode,
  showSource,
  onToggleSource,
  renderInput,
  onToggleRenderInput,
}: Props) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [checked, setChecked] = useState(false)
  const [overridden, setOverridden] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [activeBlankId, setActiveBlankId] = useState<string | null>(null)
  const [focusedBlankId, setFocusedBlankId] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const pendingCaret = useRef<{ id: string; pos: number } | null>(null)

  useEffect(() => {
    setValues({})
    setChecked(false)
    setOverridden(false)
    setRevealed(false)
    setActiveBlankId(null)
    setFocusedBlankId(null)
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
  }, [values, focusedBlankId])

  const blankAnswers: Record<string, string[]> =
    entry.kind === 'formula'
      ? Object.fromEntries(entry.lines.flat().filter(isBlank).map((p) => [p.blank, p.answer]))
      : Object.fromEntries(
          entry.rows.flatMap((r) =>
            r.cells.filter((c) => c.blank).map((c) => [c.blank as string, c.answer ?? []]),
          ),
        )

  const suggestions = useMemo(
    () => (mode === 'type' ? suggestKeysForEntry(entry) : []),
    [entry, mode],
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
    const value = values[part.blank] ?? ''
    return (
      <BlankInput
        key={part.blank}
        id={part.blank}
        value={value}
        checked={checked}
        preview={renderInput}
        focused={focusedBlankId === part.blank}
        correct={checked ? (results[part.blank] ?? false) : null}
        onChange={(v) => setBlankValue(part.blank, v)}
        onFocus={() => {
          setActiveBlankId(part.blank)
          setFocusedBlankId(part.blank)
          // 렌더링 상태에서 탭했을 때 입력칸이 나타난 뒤 커서를 끝에 놓는다
          pendingCaret.current = { id: part.blank, pos: value.length }
        }}
        onBlur={() => setFocusedBlankId((cur) => (cur === part.blank ? null : cur))}
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
            <div key={i} className="whitespace-pre-wrap break-all">
              {sourceOfLine(line, checked)}
            </div>
          ))}
        </div>
      )}

      {mode === 'type' && (
        <div className="mb-3">
          <MathKeypad
            onAction={handleKeypadAction}
            disabled={checked || !activeBlankId}
            suggestions={suggestions}
          />
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

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id={`src-${cardKey}`}
            checked={showSource}
            onCheckedChange={(v) => onToggleSource(v === true)}
          />
          <Label htmlFor={`src-${cardKey}`} className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground">
            <Code2 className="size-3.5" /> LaTeX 코드 보기
          </Label>
        </div>
        {mode === 'type' && (
          <div className="flex items-center gap-2">
            <Checkbox
              id={`prv-${cardKey}`}
              checked={renderInput}
              onCheckedChange={(v) => onToggleRenderInput(v === true)}
            />
            <Label
              htmlFor={`prv-${cardKey}`}
              className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground"
            >
              <Sigma className="size-3.5" /> 입력칸 수식으로 보기
            </Label>
          </div>
        )}
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
