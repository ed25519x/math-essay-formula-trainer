import { Check, Code2, Eye, RotateCcw, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { MathText } from '@/components/MathText'
import { checkNumericAnswer } from '@/lib/mathMatch'
import type { ProblemInstance, ProblemStep } from '@/lib/problems'
import { cn } from '@/lib/utils'

export type ProblemSubmode = 'assisted' | 'manual'

function NumericField({
  value,
  onChange,
  checked,
  correct,
  onCheck,
  autoFocus,
}: {
  value: string
  onChange: (v: string) => void
  checked: boolean
  correct: boolean | null
  onCheck: () => void
  autoFocus?: boolean
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !checked) onCheck()
        }}
        disabled={checked}
        inputMode="decimal"
        autoComplete="off"
        autoFocus={autoFocus}
        placeholder="숫자 입력"
        className={cn(
          'w-32 rounded-md border-2 bg-background px-3 py-2 text-center font-mono text-base outline-none transition-colors sm:w-40',
          !checked && 'border-input focus:border-ring',
          checked && correct && 'border-success bg-success/10',
          checked && correct === false && 'border-destructive bg-destructive/10',
        )}
      />
      {!checked && (
        <Button onClick={onCheck} size="lg">
          <Check className="size-4" /> 확인
        </Button>
      )}
    </div>
  )
}

function StepSource({ step, revealed }: { step: ProblemStep; revealed: boolean }) {
  if (!revealed) return null
  return (
    <div className="mt-1 overflow-x-auto whitespace-pre rounded bg-muted/30 px-2 py-1 font-mono text-[11px] text-muted-foreground">
      {step.prompt}
    </div>
  )
}

interface Props {
  instance: ProblemInstance
  submode: ProblemSubmode
  onResult: (correct: boolean) => void
  cardKey: string
  showSource: boolean
  onToggleSource: (v: boolean) => void
}

export function ProblemCardView({ instance, submode, onResult, cardKey, showSource, onToggleSource }: Props) {
  const [stepIndex, setStepIndex] = useState(0)
  const [stepValues, setStepValues] = useState<Record<string, string>>({})
  const [stepChecked, setStepChecked] = useState<Record<string, boolean>>({})
  const [finalValue, setFinalValue] = useState('')
  const [finalChecked, setFinalChecked] = useState(false)
  const [finalOverridden, setFinalOverridden] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setStepIndex(0)
    setStepValues({})
    setStepChecked({})
    setFinalValue('')
    setFinalChecked(false)
    setFinalOverridden(false)
    setRevealed(false)
    let cancelled = false
    import('gsap').then(({ gsap }) => {
      if (cancelled || !rootRef.current) return
      gsap.fromTo(rootRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' })
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardKey])

  const finalCorrectRaw = checkNumericAnswer(finalValue, instance.final.answer, instance.final.decimals)
  const finalCorrect = finalOverridden || finalCorrectRaw
  const showSteps = submode === 'assisted'
  const allStepsDone = !showSteps || stepIndex >= instance.steps.length

  function checkStep(step: ProblemStep) {
    setStepChecked((prev) => ({ ...prev, [step.id]: true }))
    if (!checkNumericAnswer(stepValues[step.id] ?? '', step.answer, step.decimals) && rootRef.current) {
      import('gsap').then(({ gsap }) => {
        if (!rootRef.current) return
        gsap.fromTo(rootRef.current, { x: -8 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.4)' })
      })
    }
  }

  function handleFinalCheck() {
    setFinalChecked(true)
    setRevealed(true)
    if (!finalCorrectRaw && rootRef.current) {
      import('gsap').then(({ gsap }) => {
        if (!rootRef.current) return
        gsap.fromTo(rootRef.current, { x: -8 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.4)' })
      })
    }
  }

  return (
    <div ref={rootRef}>
      <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
        <Badge variant="outline">{instance.unit}</Badge>
        <Badge variant="secondary">{instance.topic}</Badge>
        <Badge variant={submode === 'assisted' ? 'default' : 'outline'}>
          {submode === 'assisted' ? '어시스트 모드' : '수동 모드'}
        </Badge>
      </div>
      <h3 className="mb-3 text-center text-lg font-semibold">{instance.title}</h3>

      <div className="mb-4 rounded-lg border border-border bg-muted/40 p-4 text-center text-base leading-relaxed">
        <MathText text={instance.statement} />
        {showSource && (
          <div className="mt-2 overflow-x-auto whitespace-pre-wrap rounded bg-muted/30 px-2 py-1 text-left font-mono text-[11px] text-muted-foreground">
            {instance.statement}
          </div>
        )}
      </div>

      {showSteps && (
        <div className="mb-4 space-y-3">
          {instance.steps.map((step, i) => {
            if (i > stepIndex) return null
            const done = stepChecked[step.id]
            const correct = done ? checkNumericAnswer(stepValues[step.id] ?? '', step.answer, step.decimals) : null
            return (
              <div key={step.id} className="rounded-lg border border-border p-3">
                <p className="mb-2 text-center text-sm">
                  <span className="mr-1 text-muted-foreground">Step {i + 1}.</span>
                  <MathText text={step.prompt} />
                </p>
                <StepSource step={step} revealed={showSource} />
                <div className="mt-2">
                  <NumericField
                    value={stepValues[step.id] ?? ''}
                    onChange={(v) => setStepValues((prev) => ({ ...prev, [step.id]: v }))}
                    checked={!!done}
                    correct={correct}
                    onCheck={() => checkStep(step)}
                    autoFocus={i === stepIndex}
                  />
                </div>
                {done && (
                  <div className="mt-2 flex flex-col items-center gap-2">
                    <p className={cn('flex items-center gap-1 text-sm font-medium', correct ? 'text-success' : 'text-destructive')}>
                      {correct ? (
                        <>
                          <Check className="size-4" /> 맞았어요
                        </>
                      ) : (
                        <>
                          <X className="size-4" /> 정답: {step.answer}
                        </>
                      )}
                    </p>
                    {i === stepIndex && (
                      <Button size="sm" variant="secondary" onClick={() => setStepIndex((s) => s + 1)}>
                        다음 단계
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {allStepsDone && (
        <div className="mb-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <p className="mb-2 text-center text-sm font-medium">
            <MathText text={instance.final.prompt} />
          </p>
          <NumericField
            value={finalValue}
            onChange={setFinalValue}
            checked={finalChecked}
            correct={finalChecked ? finalCorrect : null}
            onCheck={handleFinalCheck}
            autoFocus={submode === 'manual'}
          />
        </div>
      )}

      {finalChecked && !finalCorrectRaw && !finalOverridden && (
        <div className="mb-3 flex justify-center">
          <Button variant="secondary" size="sm" onClick={() => setFinalOverridden(true)}>
            <RotateCcw className="size-4" /> 맞은 걸로 인정
          </Button>
        </div>
      )}

      {revealed && (
        <div className="mb-3 rounded-lg border border-border bg-muted/30 p-3 text-sm">
          <p className="mb-1.5 flex items-center gap-1 font-medium text-primary">
            <Eye className="size-4" /> 전체 풀이
          </p>
          <ul className="space-y-1">
            {instance.solution.map((line, i) => (
              <li key={i}>
                <MathText text={line} />
                {showSource && (
                  <div className="mt-0.5 overflow-x-auto whitespace-pre-wrap rounded bg-background/60 px-2 py-1 font-mono text-[11px] text-muted-foreground">
                    {line}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-center gap-2">
        <Checkbox id={`psrc-${cardKey}`} checked={showSource} onCheckedChange={(v) => onToggleSource(v === true)} />
        <Label htmlFor={`psrc-${cardKey}`} className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground">
          <Code2 className="size-3.5" /> LaTeX 코드 보기
        </Label>
      </div>

      {finalChecked && (
        <div className="mt-4 flex flex-col items-center gap-2">
          <p className={cn('flex items-center gap-1 text-sm font-medium', finalCorrect ? 'text-success' : 'text-destructive')}>
            {finalCorrect ? (
              <>
                <Check className="size-4" /> 정답입니다!
              </>
            ) : (
              <>
                <X className="size-4" /> 정답: {instance.final.answer}
              </>
            )}
          </p>
          <Button size="lg" variant={finalCorrect ? 'success' : 'default'} onClick={() => onResult(finalCorrect)}>
            다음 문제
          </Button>
        </div>
      )}
    </div>
  )
}
