/**
 * 생성된 문제의 정답을 "독립적인 방법"으로 다시 계산하기 위한 수치 도구.
 * 생성기는 닫힌 형태(공식)로 답을 만들고, 테스트는 여기 있는 함수로 같은 값이
 * 나오는지 확인한다. 공식을 잘못 옮겨 적은 문제를 배포 전에 잡아낸다.
 */

/** 심프슨 공식으로 정적분 근사 */
export function simpson(f: (x: number) => number, a: number, b: number, n = 2000): number {
  const m = n % 2 === 0 ? n : n + 1
  const h = (b - a) / m
  let s = f(a) + f(b)
  for (let i = 1; i < m; i++) s += f(a + i * h) * (i % 2 === 0 ? 2 : 4)
  return (s * h) / 3
}

/** 중심차분 미분 */
export function deriv(f: (x: number) => number, x: number, h = 1e-5): number {
  return (f(x + h) - f(x - h)) / (2 * h)
}

/** x0으로 다가갈 때의 극한 근사 (양쪽에서 접근) */
export function limitAt(f: (x: number) => number, x0: number, h = 1e-6): number {
  return (f(x0 + h) + f(x0 - h)) / 2
}

/** n이 커질 때의 극한 근사 */
export function limitInf(f: (x: number) => number, x = 1e6): number {
  return f(x)
}

/** Σ_{k=from}^{to} f(k) */
export function sumRange(f: (k: number) => number, from: number, to: number): number {
  let s = 0
  for (let k = from; k <= to; k++) s += f(k)
  return s
}
