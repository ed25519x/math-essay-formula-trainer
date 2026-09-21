import { ArrowLeft, RotateCcw, Trophy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ProblemCardView, type ProblemSubmode } from '@/components/ProblemCardView'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { PROBLEM_GENERATORS, type ProblemInstance } from '@/lib/problems'
import type { Unit } from '@/lib/types'

const SESSION_LENGTH = 8

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

function buildSession(scope: Set<Unit>): ProblemInstance[] {
  const gens = PROBLEM_GENERATORS.filter((g) => scope.has(g.unit))
  if (gens.length === 0) return []
  const picks: ProblemInstance[] = []
  const shuffled = shuffle(gens)
  for (let i = 0; i < SESSION_LENGTH; i++) {
    const gen = shuffled[i % shuffled.length]!
    picks.push(gen.generate())
  }
  return shuffle(picks)
}

export function ProblemMode({
  scope,
  submode,
  onBack,
}: {
  scope: Set<Unit>
  submode: ProblemSubmode
  onBack: () => void
}) {
  const [showSource, setShowSource] = useState(false)
  const [queue, setQueue] = useState(() => buildSession(scope))
  const [index, setIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [answeredCount, setAnsweredCount] = useState(0)

  const total = queue.length
  const current = queue[index]
  const finished = index >= total

  function restart() {
    setQueue(buildSession(scope))
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
        <p className="mb-4 text-muted-foreground">선택한 범위에 해당하는 문제가 없어요.</p>
        <Button onClick={onBack}>
          <ArrowLeft className="size-4" /> 돌아가기
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:py-10">
      <div className="mb-4">
        <Button onClick={onBack} variant="ghost" size="sm">
          <ArrowLeft className="size-4" /> 홈으로
        </Button>
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
            <ProblemCardView
              instance={current}
              cardKey={`${current.genId}-${index}`}
              submode={submode}
              onResult={handleResult}
              showSource={showSource}
              onToggleSource={setShowSource}
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
