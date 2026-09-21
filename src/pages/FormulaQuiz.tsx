import { ArrowLeft, Keyboard, ListChecks, RotateCcw, Trophy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { FormulaCardView, type AnswerMode } from '@/components/FormulaCardView'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { FORMULAS } from '@/lib/formulas'
import type { Unit } from '@/lib/types'
import { cn } from '@/lib/utils'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i]!
    a[i] = a[j]!
    a[j] = tmp
  }
  return a
}

export function FormulaQuiz({ scope, onBack }: { scope: Set<Unit>; onBack: () => void }) {
  const [mode, setMode] = useState<AnswerMode>('type')
  const [showSource, setShowSource] = useState(false)
  const [renderInput, setRenderInput] = useState(true)
  const [queue, setQueue] = useState(() => shuffle(FORMULAS.filter((f) => scope.has(f.unit))))
  const [index, setIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [answeredCount, setAnsweredCount] = useState(0)

  const total = queue.length
  const current = queue[index]
  const finished = index >= total

  function restart() {
    setQueue(shuffle(FORMULAS.filter((f) => scope.has(f.unit))))
    setIndex(0)
    setCorrectCount(0)
    setAnsweredCount(0)
  }

  function handleResult(correct: boolean) {
    setAnsweredCount((c) => c + 1)
    if (correct) setCorrectCount((c) => c + 1)
    setIndex((i) => i + 1)
  }

  const accuracy = useMemo(
    () => (answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0),
    [answeredCount, correctCount],
  )

  if (total === 0) {
    return (
      <div className="mx-auto max-w-lg py-10 text-center">
        <p className="mb-4 text-muted-foreground">선택한 범위에 해당하는 공식이 없어요.</p>
        <Button onClick={onBack}>
          <ArrowLeft className="size-4" /> 돌아가기
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:py-10">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Button onClick={onBack} variant="ghost" size="sm">
          <ArrowLeft className="size-4" /> 홈으로
        </Button>
        <div className="flex overflow-hidden rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setMode('type')}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors',
              mode === 'type' ? 'bg-primary text-primary-foreground' : 'bg-transparent text-muted-foreground',
            )}
          >
            <Keyboard className="size-3.5" /> TeX 입력
          </button>
          <button
            type="button"
            onClick={() => setMode('choice')}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors',
              mode === 'choice' ? 'bg-primary text-primary-foreground' : 'bg-transparent text-muted-foreground',
            )}
          >
            <ListChecks className="size-3.5" /> 객관식
          </button>
        </div>
      </div>

      {!finished && (
        <>
          <div className="mb-4">
            <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
              <span>
                {index + 1} / {total}
              </span>
              <span>
                맞음 {correctCount} / {answeredCount}
              </span>
            </div>
            <Progress value={(index / total) * 100} />
          </div>
          {current && (
            <FormulaCardView
              entry={current}
              cardKey={`${current.id}-${index}`}
              onResult={handleResult}
              mode={mode}
              showSource={showSource}
              onToggleSource={setShowSource}
              renderInput={renderInput}
              onToggleRenderInput={setRenderInput}
            />
          )}
        </>
      )}

      {finished && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 text-center">
          <Trophy className="size-10 text-primary" />
          <div>
            <p className="text-2xl font-bold">
              {correctCount} / {total}
            </p>
            <p className="text-sm text-muted-foreground">정답률 {accuracy}%</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={restart} size="lg">
              <RotateCcw className="size-4" /> 다시 풀기
            </Button>
            <Button onClick={onBack} variant="outline" size="lg">
              홈으로
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
