import {
  generateProblem,
  generatorsForScope,
  type ProblemGenerator,
  type ProblemInstance,
} from './problems'
import { createRng, randomSeed, shuffle, type Rng } from './rng'
import type { Unit } from './types'

/**
 * 문제 출제 엔진.
 *
 * 예전 방식은 "생성기 목록을 섞어서 순서대로 8개"였다. 그래서
 * (1) 잘 푸는 사람도 쉬운 문제만 계속 받고, (2) 틀린 유형은 다시 안 나오고,
 * (3) 같은 단원만 몰리는 일이 있었다. 여기서는 문제를 한 개씩 늦게 만들면서
 * 최근 기록을 보고 다음 문제를 고른다.
 *
 * 고르는 기준(점수가 높은 생성기를 뽑는다):
 *   - 목표 난이도와 가까울수록  (맞히면 목표 난이도가 올라가고 틀리면 내려간다)
 *   - 이번 세션에 덜 나온 단원/유형일수록
 *   - 방금 나온 유형이면 제외
 *   - 틀린 유형은 뒤에서 한 번 더 복습으로 넣는다
 */

export interface SessionOptions {
  scope: Set<Unit>
  length?: number
  seed?: number
}

export interface SessionState {
  rng: Rng
  seed: number
  length: number
  pool: ProblemGenerator[]
  served: ProblemInstance[]
  /** 다시 풀릴 유형 (오답 복습). notBefore 번째 문제 이후에 꺼낸다. */
  reviewQueue: { genId: string; notBefore: number }[]
  usedTopics: Map<string, number>
  usedGens: Map<string, number>
  recent: string[]
  seenKeys: Set<string>
  results: boolean[]
  targetLevel: number
}

const MIN_LEVEL = 1
const MAX_LEVEL = 3

export function createSession({ scope, length = 8, seed }: SessionOptions): SessionState {
  const s = seed ?? randomSeed()
  return {
    rng: createRng(s),
    seed: s,
    length,
    pool: generatorsForScope(scope),
    served: [],
    reviewQueue: [],
    usedTopics: new Map(),
    usedGens: new Map(),
    recent: [],
    seenKeys: new Set(),
    results: [],
    targetLevel: 1.4,
  }
}

export function sessionSize(state: SessionState): number {
  return state.pool.length === 0 ? 0 : state.length
}

function score(state: SessionState, gen: ProblemGenerator): number {
  const diffPenalty = Math.abs(gen.difficulty - state.targetLevel) * 1.6
  const topicPenalty = (state.usedTopics.get(gen.topic) ?? 0) * 1.2
  const genPenalty = (state.usedGens.get(gen.id) ?? 0) * 2.4
  const jitter = state.rng() * 0.9
  return -diffPenalty - topicPenalty - genPenalty + jitter
}

function chooseGenerator(state: SessionState): ProblemGenerator | null {
  if (state.pool.length === 0) return null

  // 예약된 오답 복습이 있으면 우선한다 (바로 다음이 아니라 한두 문제 뒤에)
  const readyIndex = state.reviewQueue.findIndex((v) => v.notBefore <= state.served.length)
  if (readyIndex >= 0) {
    const [review] = state.reviewQueue.splice(readyIndex, 1)
    const gen = state.pool.find((g) => g.id === review!.genId)
    if (gen) return gen
  }

  const blocked = new Set(state.recent.slice(-Math.min(3, Math.floor(state.pool.length / 2))))
  const candidates = state.pool.filter((g) => !blocked.has(g.id))
  const usable = candidates.length > 0 ? candidates : state.pool

  let best: ProblemGenerator | null = null
  let bestScore = -Infinity
  for (const gen of shuffle(state.rng, usable)) {
    const sc = score(state, gen)
    if (sc > bestScore) {
      bestScore = sc
      best = gen
    }
  }
  return best
}

/** 다음 문제를 만들어 돌려준다. 세션이 끝났으면 null. */
export function nextProblem(state: SessionState): ProblemInstance | null {
  if (state.served.length >= sessionSize(state)) return null
  const gen = chooseGenerator(state)
  if (!gen) return null

  // 같은 숫자의 문제가 또 나오지 않도록 몇 번 다시 뽑는다
  let instance = generateProblem(gen, state.rng)
  for (let i = 0; i < 6 && state.seenKeys.has(instance.key); i++) {
    instance = generateProblem(gen, state.rng)
  }

  state.seenKeys.add(instance.key)
  state.served.push(instance)
  state.recent.push(gen.id)
  state.usedGens.set(gen.id, (state.usedGens.get(gen.id) ?? 0) + 1)
  state.usedTopics.set(gen.topic, (state.usedTopics.get(gen.topic) ?? 0) + 1)
  return instance
}

/** 채점 결과를 반영해 다음 문제의 난이도를 조절한다. */
export function recordResult(state: SessionState, instance: ProblemInstance, correct: boolean): void {
  state.results.push(correct)
  const delta = correct ? 0.4 : -0.6
  state.targetLevel = Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, state.targetLevel + delta))

  const remaining = sessionSize(state) - state.served.length
  const known = state.pool.some((g) => g.id === instance.genId)
  const queued = state.reviewQueue.some((v) => v.genId === instance.genId)
  if (!correct && known && !queued && remaining >= 2) {
    state.reviewQueue.push({ genId: instance.genId, notBefore: state.served.length + 1 })
  }
}

export function correctCount(state: SessionState): number {
  return state.results.filter(Boolean).length
}
