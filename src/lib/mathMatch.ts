/** 수식(TeX) / 숫자 답안 채점 로직 */

/** `\frac{A}{B}` → `A/B` (여러 토큰이면 괄호를 붙인다). 중첩 분수도 처리. */
function expandFractions(input: string): string {
  let s = input
  for (let guard = 0; guard < 20; guard++) {
    const m = /\\[dt]?frac\s*/.exec(s)
    if (!m) break
    const start = m.index
    let i = start + m[0].length
    const groups: string[] = []
    for (let g = 0; g < 2; g++) {
      if (s[i] === '{') {
        let depth = 0
        const from = i + 1
        while (i < s.length) {
          if (s[i] === '{') depth++
          else if (s[i] === '}') {
            depth--
            if (depth === 0) break
          }
          i++
        }
        groups.push(s.slice(from, i))
        i++
      } else {
        // \frac12 처럼 한 글자씩 오는 경우
        groups.push(s[i] ?? '')
        i++
      }
    }
    if (groups.length < 2) break
    const wrap = (g: string) => (/^[A-Za-z0-9\\^_{}.]*$/.test(g) ? g : `(${g})`)
    s = s.slice(0, start) + `${wrap(groups[0]!)}/${wrap(groups[1]!)}` + s.slice(i)
  }
  return s
}

export function normalizeTex(s: string): string {
  return expandFractions(s)
    .replace(/\\displaystyle|\\limits|\\mathrm|\\text|\\operatorname/g, '')
    // 프라임: 모바일 키보드가 넣는 곱슬따옴표·백틱·´·′ 를 모두 ' 로 본다
    .replace(/\^\s*\{?\s*\\prime\s*\}?|\\prime/g, "'")
    .replace(/[`´‘’′ʹʼ]/g, "'")
    .replace(/\\left|\\right/g, '')
    .replace(/\\,|\\!|\\;|\\:|\\quad|\\qquad/g, '')
    .replace(/\\div/g, '/')
    .replace(/\\neq/g, '\\ne')
    .replace(/\\ge(?![a-z])/g, '>=')
    .replace(/\\le(?![a-z])/g, '<=')
    // 곱셈 기호는 생략해도 같은 답으로 본다: 2\cdot x = 2\times x = 2x
    .replace(/\\cdot|\\times|\\ast|\*/g, '')
    .replace(/\s+/g, '')
    .replace(/[{}]/g, '')
    .replace(/[.,]+$/, '')
    .toLowerCase()
}

/** "없다"류 답안. 표기가 제각각이라 넉넉하게 인정한다. */
const NONE_TOKENS = new Set([
  '없다',
  '없음',
  '없습니다',
  '없',
  '무',
  '해없음',
  '근없음',
  '존재하지않는다',
  '존재하지않음',
  '빈칸',
  '공집합',
  'x',
  '×',
  '✗',
  '∅',
  '\\varnothing',
  '\\emptyset',
  'none',
  'null',
  '-',
  'ㅡ',
])

export function isNoneAnswer(s: string): boolean {
  return NONE_TOKENS.has(normalizeTex(s))
}

/** 채점·중복 제거에 쓰는 정규형 ("없다"류는 전부 같은 값으로 모인다) */
export function canonicalTex(s: string): string {
  return isNoneAnswer(s) ? '∅' : normalizeTex(s)
}

export function checkTexAnswer(input: string, accepted: string[]): boolean {
  const n = canonicalTex(input)
  if (!n) return false
  return accepted.some((a) => canonicalTex(a) === n)
}

export function round(x: number, decimals: number): number {
  const f = 10 ** decimals
  return Math.round(x * f) / f
}

/**
 * 숫자 답안 파싱. 소수뿐 아니라 분수(`3/4`, `-7/2`)와 대분수(`1 1/2`),
 * 유니코드 마이너스/분수 기호도 받아준다. 파싱 불가면 null.
 */
export function parseNumericInput(raw: string): number | null {
  const base = raw
    .trim()
    .replace(/[−–—]/g, '-') // − – —
    .replace(/[⁄∕]/g, '/') // ⁄ ∕
    .replace(/,/g, '')
    .replace(/^\+/, '')

  const mixed = /^(-?)(\d+)\s+(\d+)\/(\d+)$/.exec(base) // "1 1/2"
  if (mixed) {
    const d = Number(mixed[4])
    if (d === 0) return null
    const mag = Number(mixed[2]) + Number(mixed[3]) / d
    return mixed[1] === '-' ? -mag : mag
  }

  const s = base.replace(/\s/g, '')
  if (!s) return null

  const frac = /^(-?\d*\.?\d+)\/(-?\d*\.?\d+)$/.exec(s)
  if (frac) {
    const d = Number(frac[2])
    if (d === 0) return null
    return Number(frac[1]) / d
  }

  if (!/^-?\d*\.?\d+(e-?\d+)?$/i.test(s)) return null
  const val = Number(s)
  return Number.isFinite(val) ? val : null
}

/**
 * decimals=0이면 정수 정답이므로 정확히 일치해야 하고,
 * 그 외에는 마지막 자리 반올림 오차까지 허용한다. 분수로 입력하면 언제나 정확히 맞는다.
 */
export function checkNumericAnswer(input: string, correct: number, decimals: number): boolean {
  const val = parseNumericInput(input)
  if (val === null) return false
  const tolerance = decimals <= 0 ? 1e-9 : 0.51 * 10 ** -decimals + 1e-9
  return Math.abs(val - correct) <= tolerance
}
