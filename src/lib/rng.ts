/**
 * Seeded pseudo-random number generator (mulberry32).
 *
 * 문제 생성이 시드에 의존하도록 만들면 "같은 세트 다시 풀기"가 가능하고,
 * 테스트에서 수천 개의 인스턴스를 재현 가능하게 검증할 수 있다.
 */
export interface Rng {
  (): number
  seed: number
}

export function createRng(seed: number): Rng {
  let s = seed >>> 0
  const fn = (() => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }) as Rng
  fn.seed = seed >>> 0
  return fn
}

export function randomSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0
}

export function randInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1))
}

/** min..max 중 exclude에 없는 정수 */
export function randIntExcept(rng: Rng, min: number, max: number, exclude: number[]): number {
  const pool: number[] = []
  for (let v = min; v <= max; v++) if (!exclude.includes(v)) pool.push(v)
  if (pool.length === 0) throw new Error('randIntExcept: empty range')
  return pool[Math.floor(rng() * pool.length)]!
}

/** 0이 아닌 정수 (부호 랜덤) */
export function randNonZero(rng: Rng, min: number, max: number): number {
  return randIntExcept(rng, min, max, [0])
}

export function pick<T>(rng: Rng, arr: readonly T[]): T {
  const item = arr[Math.floor(rng() * arr.length)]
  if (item === undefined) throw new Error('pick() called on empty array')
  return item
}

/** 서로 다른 n개를 뽑는다 (arr.length >= n 이어야 함) */
export function pickMany<T>(rng: Rng, arr: readonly T[], n: number): T[] {
  return shuffle(rng, arr).slice(0, n)
}

export function shuffle<T>(rng: Rng, arr: readonly T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = a[i]!
    a[i] = a[j]!
    a[j] = tmp
  }
  return a
}

export function coin(rng: Rng, p = 0.5): boolean {
  return rng() < p
}

/** ±1 */
export function randSign(rng: Rng): number {
  return rng() < 0.5 ? -1 : 1
}
