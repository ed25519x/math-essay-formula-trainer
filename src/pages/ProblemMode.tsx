import { ArrowLeft, RotateCcw, Sparkles, Trophy } from 'lucide-react'
import { useState } from 'react'
import { ProblemCardView, type ProblemSubmode } from '@/components/ProblemCardView'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { ProblemInstance } from '@/lib/problems'
import { createSession, nextProblem, recordResult, sessionSize, type SessionState } from '@/lib/session'
import type { Unit } from '@/lib/types'

const SESSION_LENGTH = 8

interface View {
  session: SessionState
  /** 방금 푼 세트를 그대로 다시 풀 때 쓰는 고정 목록 */
  queue: ProblemInstance[] | null
  current: ProblemInstance | null
  answered: number
  correct: number
}

function start(scope: Set<Unit>): View {
  const session = createSession({ scope, length: SESSION_LENGTH })
  return { session, queue: null, current: nextProblem(session), answered: 0, correct: 0 }
}

function replay(view: View): View {
  const queue = [...view.session.served]
  return { session: view.session, queue, current: queue[0] ?? null, answered: 0, correct: 0 }
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
  const [view, setView] = useState<View>(() => start(scope))

  const total = view.queue ? view.queue.length : sessionSize(view.session)
  const finished = view.current === null

  function handleResult(correct: boolean) {
    const { session, queue, current } = view
    const answered = view.answered + 1
    if (!queue && current) recordResult(session, current, correct)
    setView({
      session,
      queue,
      current: queue ? (queue[answered] ?? null) : nextProblem(session),
      answered,
      correct: view.correct + (correct ? 1 : 0),
    })
  }

  const accuracy = view.answered > 0 ? Math.round((view.correct / view.answered) * 100) : 0

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

      {!finished && view.current && (
        <>
          <div className="mb-4">
            <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
              <span>
                {view.answered + 1} / {total}
              </span>
              <span>
                맞음 {view.correct} / {view.answered}
              </span>
            </div>
            <Progress value={(view.answered / total) * 100} />
          </div>
          <ProblemCardView
            instance={view.current}
            cardKey={`${view.current.genId}-${view.answered}`}
            submode={submode}
            onResult={handleResult}
            showSource={showSource}
            onToggleSource={setShowSource}
          />
        </>
      )}

      {finished && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 text-center">
          <Trophy className="size-10 text-primary" />
          <div>
            <p className="text-2xl font-bold">
              {view.correct} / {view.answered}
            </p>
            <p className="text-sm text-muted-foreground">정답률 {accuracy}%</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => setView(start(scope))} size="lg">
              <Sparkles className="size-4" /> 새 문제로 다시
            </Button>
            <Button onClick={() => setView(replay(view))} variant="secondary" size="lg">
              <RotateCcw className="size-4" /> 같은 문제 다시
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
