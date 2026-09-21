/**
 * 문제 문자열을 만들 때 쓰는 TeX 포매팅 도구.
 *
 * 생성기가 `x^2-${a*a}` 처럼 직접 문자열을 이어 붙이면 a가 음수일 때
 * `x^2--9` 같은 깨진 수식이 나온다. 부호·괄호·분수 표기는 전부 여기서 처리한다.
 */

export function gcd(a: number, b: number): number {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y) {
    const t = x % y
    x = y
    y = t
  }
  return x || 1
}

// ───────────────────────── 유리수 ─────────────────────────

export interface Rat {
  n: number
  d: number
}

/** 기약분수로 정규화된 유리수 (분모는 항상 양수) */
export function rat(n: number, d = 1): Rat {
  if (d === 0) throw new Error('rat: zero denominator')
  const s = d < 0 ? -1 : 1
  const g = gcd(n, d)
  return { n: (s * n) / g, d: (s * d) / g }
}

export const ratAdd = (a: Rat, b: Rat): Rat => rat(a.n * b.d + b.n * a.d, a.d * b.d)
export const ratSub = (a: Rat, b: Rat): Rat => rat(a.n * b.d - b.n * a.d, a.d * b.d)
export const ratMul = (a: Rat, b: Rat): Rat => rat(a.n * b.n, a.d * b.d)
export const ratDiv = (a: Rat, b: Rat): Rat => rat(a.n * b.d, a.d * b.n)
export const ratNum = (a: Rat): number => a.n / a.d
export const isInt = (a: Rat): boolean => a.d === 1

/** 유리수를 TeX로. 음수는 분수 바깥에 부호를 둔다: -\frac{1}{2} */
export function ratTex(a: Rat): string {
  if (a.d === 1) return `${a.n}`
  const sign = a.n < 0 ? '-' : ''
  return `${sign}\\frac{${Math.abs(a.n)}}{${a.d}}`
}

/** 음수인 유리수는 괄호로 감싼다 (뺄셈 뒤에 올 때) */
export function ratParen(a: Rat): string {
  return a.n < 0 ? `\\left(${ratTex(a)}\\right)` : ratTex(a)
}

/** 유리수를 사람이 입력할 답으로 쓸 때 필요한 소수 자릿수 (유한소수면 그 자릿수, 아니면 3) */
export function ratDecimals(a: Rat): number {
  if (a.d === 1) return 0
  let d = a.d
  let twos = 0
  let fives = 0
  while (d % 2 === 0) {
    d /= 2
    twos++
  }
  while (d % 5 === 0) {
    d /= 5
    fives++
  }
  if (d !== 1) return 3 // 무한소수 → 소수 셋째 자리까지 (분수 입력도 허용됨)
  return Math.min(Math.max(twos, fives), 4)
}

// ───────────────────────── 부호 / 항 ─────────────────────────

/** 3 → "+3", -3 → "-3" */
export function signed(x: number): string {
  return x < 0 ? `${x}` : `+${x}`
}

/** 뒤에 이어 붙일 상수항. 0이면 빈 문자열 */
export function addConst(x: number): string {
  return x === 0 ? '' : signed(x)
}

/** 계수 c와 식 expr의 곱. c=1 → expr, c=-1 → -expr, c=0 → '' */
export function coefTerm(c: number, expr: string): string {
  if (c === 0) return ''
  if (c === 1) return expr
  if (c === -1) return `-${expr}`
  return `${c}${expr}`
}

/** 앞 항에 이어 붙일 때 쓰는 형태. 2,"x" → "+2x" / -1,"x" → "-x" */
export function addTerm(c: number, expr: string): string {
  if (c === 0) return ''
  const sign = c < 0 ? '-' : '+'
  const a = Math.abs(c)
  return `${sign}${a === 1 ? '' : a}${expr}`
}

/** 음수면 괄호로 감싼다. 대입 과정을 보여줄 때 사용: f(-2) = (-2)^3 */
export function paren(x: number): string {
  return x < 0 ? `(${x})` : `${x}`
}

// ───────────────────────── 다항식 ─────────────────────────

export type PolyTerm = [coef: number, degree: number]

/**
 * 내림차순 항 목록을 다항식 TeX로. 계수 0인 항은 생략되고 부호가 올바르게 붙는다.
 * polyTex([[1,3],[0,2],[-4,1],[2,0]]) → "x^3-4x+2"
 */
export function polyTex(terms: PolyTerm[], v = 'x'): string {
  let out = ''
  for (const [c, deg] of terms) {
    if (c === 0) continue
    const body = deg === 0 ? '' : deg === 1 ? v : `${v}^{${deg}}`
    if (out === '') {
      out += deg === 0 ? `${c}` : coefTerm(c, body)
    } else {
      out += deg === 0 ? signed(c) : addTerm(c, body)
    }
  }
  return out === '' ? '0' : out
}

/** 다항식 값 계산 (polyTex와 같은 항 목록을 쓴다) */
export function polyEval(terms: PolyTerm[], x: number): number {
  return terms.reduce((s, [c, d]) => s + c * x ** d, 0)
}

/** 도함수의 항 목록 */
export function polyDeriv(terms: PolyTerm[]): PolyTerm[] {
  return terms.filter(([, d]) => d > 0).map(([c, d]) => [c * d, d - 1] as PolyTerm)
}

/** 부정적분의 항 목록 (적분상수 제외). 계수가 유리수가 될 수 있어 Rat을 함께 돌려준다. */
export function polyIntegralEval(terms: PolyTerm[], x: number): Rat {
  return terms.reduce<Rat>((s, [c, d]) => ratAdd(s, ratMul(rat(c, d + 1), rat(x ** (d + 1)))), rat(0))
}

/** 괄호 없는 x-r 꼴 (분모 등에 쓸 때) */
export function linearBare(r: number, v = 'x'): string {
  if (r === 0) return v
  return r > 0 ? `${v}-${r}` : `${v}+${-r}`
}

/** (x - r) 꼴. r이 음수면 (x+|r|) */
export function linearFactor(r: number, v = 'x'): string {
  if (r === 0) return v
  return r > 0 ? `(${v}-${r})` : `(${v}+${-r})`
}

// ───────────────────────── π / 각도 ─────────────────────────

/** 유리수 c에 대해 cπ를 TeX로: \frac{2\pi}{3}, \pi, -\frac{\pi}{2}, 2\pi */
export function piTex(c: Rat): string {
  if (c.n === 0) return '0'
  const sign = c.n < 0 ? '-' : ''
  const n = Math.abs(c.n)
  const num = n === 1 ? '\\pi' : `${n}\\pi`
  return c.d === 1 ? `${sign}${num}` : `${sign}\\frac{${num}}{${c.d}}`
}

/** 도(degree) → 라디안 유리수 계수 (π의 계수) */
export function degToPiRat(deg: number): Rat {
  return rat(deg, 180)
}

// ───────────────────────── 숫자 표시 ─────────────────────────

/** 소수점 이하 불필요한 0을 없앤 문자열 */
export function fmt(x: number, decimals = 4): string {
  const v = Number(x.toFixed(decimals))
  return Object.is(v, -0) ? '0' : `${v}`
}
