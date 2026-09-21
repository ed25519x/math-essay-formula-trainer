import { Dumbbell, GraduationCap, Home as HomeIcon, PenLine, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { ScopeSelector } from '@/components/ScopeSelector'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ProblemSubmode } from '@/components/ProblemCardView'
import { ALL_UNITS, type Unit } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  scope: Set<Unit>
  onScopeChange: (s: Set<Unit>) => void
  onStartFormula: () => void
  onStartProblem: (submode: ProblemSubmode) => void
}

export function Home({ scope, onScopeChange, onStartFormula, onStartProblem }: Props) {
  const [submode, setSubmode] = useState<ProblemSubmode>('assisted')

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          <GraduationCap className="size-3.5" /> 가천대 · 국민대 논술 수학 대비
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">공식 암기 트레이너</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          수1 · 수2 핵심 공식과 국민대 대비 미적분까지, 빈칸 채우기와 실전 문제로 반복 연습하세요.
        </p>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
          <Sparkles className="size-4" /> 출제 범위 선택
        </h2>
        <ScopeSelector scope={scope} onChange={onScopeChange} />
        {!scope.has('미적분') && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            국민대 논술도 준비한다면 <span className="font-medium text-foreground">미적분</span> 범위를 함께 켜세요.
          </p>
        )}
      </section>

      <Tabs defaultValue="formula">
        <TabsList className="w-full">
          <TabsTrigger value="formula">공식 암기</TabsTrigger>
          <TabsTrigger value="problem">문제 풀이</TabsTrigger>
        </TabsList>

        <TabsContent value="formula">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 pt-5 text-center">
              <p className="text-sm text-muted-foreground">
                공식의 핵심 부분을 빈칸으로 가리고, 직접 입력하거나 객관식으로 골라 암기 상태를 점검해요.
              </p>
              <Button size="xl" className="w-full max-w-xs" onClick={onStartFormula}>
                공식 암기 시작하기
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="problem">
          <Card>
            <CardContent className="flex flex-col gap-5 pt-5">
              <p className="text-center text-sm text-muted-foreground">
                실제 숫자가 들어간 문제를 풀어요. 상황에 맞는 모드를 골라보세요.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setSubmode('assisted')}
                  className={cn(
                    'flex flex-col items-start gap-1.5 rounded-xl border-2 p-4 text-left transition-colors',
                    submode === 'assisted' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
                  )}
                >
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Dumbbell className="size-4" /> 어시스트 모드
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    런닝머신 등 이동 중에도. 풀이를 단계별로 쪼개서 숫자만 입력하면 계산이 진행돼요.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setSubmode('manual')}
                  className={cn(
                    'flex flex-col items-start gap-1.5 rounded-xl border-2 p-4 text-left transition-colors',
                    submode === 'manual' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
                  )}
                >
                  <div className="flex items-center gap-1.5 font-semibold">
                    <PenLine className="size-4" /> 수동 모드
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    집에서 노트에 풀 때. 문제만 보고 끝까지 직접 풀어서 최종 답만 입력해요.
                  </p>
                </button>
              </div>
              <Button size="xl" className="w-full" onClick={() => onStartProblem(submode)}>
                문제 풀이 시작하기
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <footer className="mt-10 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <HomeIcon className="size-3.5" />
        범위: {ALL_UNITS.filter((u) => scope.has(u)).length}/{ALL_UNITS.length} 선택됨
      </footer>
    </div>
  )
}
