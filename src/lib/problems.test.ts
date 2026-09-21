import { describe, expect, test } from 'bun:test'
import katex from 'katex'
import { checkNumericAnswer, checkTexAnswer, normalizeTex, parseNumericInput } from './mathMatch'
import { generateProblem, PROBLEM_GENERATORS } from './problems'
import { createRng } from './rng'
import { createSession, nextProblem, recordResult, sessionSize } from './session'
import { polyTex, ratTex, rat } from './texfmt'
import type { Unit } from './types'

const SAMPLES = 60

/** `$...$` 안의 수식을 모두 KaTeX로 렌더링해 본다 (문법 오류를 잡기 위해) */
function assertRenders(text: string, where: string) {
  const parts = text.split(/(\$[^$]+\$)/g)
  for (const part of parts) {
    if (!part.startsWith('$') || !part.endsWith('$')) continue
    const math = part.slice(1, -1)
    try {
      katex.renderToString(math, { throwOnError: true, displayMode: false })
    } catch (e) {
      throw new Error(`${where}: KaTeX 오류 "${math}" → ${(e as Error).message}`)
    }
  }
  // 수식 바깥에 TeX 명령이 새어나온 경우
  const outside = parts.filter((p) => !(p.startsWith('$') && p.endsWith('$'))).join('')
  expect(outside.includes('\\')).toBe(false)
}

describe('문제 생성기', () => {
  for (const gen of PROBLEM_GENERATORS) {
    test(`${gen.id} — 수식·정답·검산`, () => {
      for (let i = 0; i < SAMPLES; i++) {
        const rng = createRng(1000 + i * 7919)
        const p = generateProblem(gen, rng)

        assertRenders(p.statement, `${gen.id} statement`)
        for (const line of p.solution) assertRenders(line, `${gen.id} solution`)
        for (const s of [...p.steps, p.final]) {
          assertRenders(s.prompt, `${gen.id} ${s.id}`)
          expect(Number.isFinite(s.answer)).toBe(true)
          if (s.decimals === 0) {
            expect(Number.isInteger(s.answer)).toBe(true)
          }
          // 정답을 그대로 입력하면 반드시 맞아야 한다
          const typed = s.decimals === 0 ? `${s.answer}` : s.answer.toFixed(s.decimals)
          expect(checkNumericAnswer(typed, s.answer, s.decimals)).toBe(true)
        }

        expect(p.steps.length).toBeGreaterThan(0)
        expect(p.solution.length).toBeGreaterThan(0)
        expect(p.statement.length).toBeGreaterThan(5)

        // 닫힌 형태로 만든 정답을 수치해석으로 다시 계산해 본다
        if (p.verify) {
          const v = p.verify()
          expect(Number.isFinite(v)).toBe(true)
          const tol = 1e-4 * Math.max(1, Math.abs(p.final.answer))
          if (Math.abs(v - p.final.answer) > tol) {
            throw new Error(
              `${gen.id}: 검산 불일치 (정답 ${p.final.answer}, 수치 ${v})\n문제: ${p.statement}`,
            )
          }
        }
      }
    })
  }

  test('부호가 깨진 수식이 없다', () => {
    for (const gen of PROBLEM_GENERATORS) {
      for (let i = 0; i < 20; i++) {
        const p = generateProblem(gen, createRng(i * 13 + 5))
        const all = [p.statement, ...p.solution, ...p.steps.map((s) => s.prompt), p.final.prompt].join(' ')
        expect(all).not.toMatch(/--|\+-|-\+|\+\+/)
        expect(all).not.toMatch(/undefined|NaN/)
      }
    }
  })
})

describe('세션 엔진', () => {
  const scope = new Set<Unit>(['수1', '수2', '미적분'])

  test('정해진 개수만큼 문제를 내고 끝난다', () => {
    const s = createSession({ scope, length: 8, seed: 42 })
    const seen: string[] = []
    for (let i = 0; i < 8; i++) {
      const p = nextProblem(s)
      expect(p).not.toBeNull()
      seen.push(p!.key)
      recordResult(s, p!, i % 2 === 0)
    }
    expect(nextProblem(s)).toBeNull()
    expect(sessionSize(s)).toBe(8)
    expect(new Set(seen).size).toBe(8) // 같은 문제가 두 번 나오지 않는다
  })

  test('연속으로 같은 유형이 나오지 않는다', () => {
    for (let seed = 0; seed < 30; seed++) {
      const s = createSession({ scope, length: 8, seed })
      const ids: string[] = []
      for (let i = 0; i < 8; i++) {
        const p = nextProblem(s)!
        ids.push(p.genId)
        recordResult(s, p, true)
      }
      for (let i = 1; i < ids.length; i++) expect(ids[i]).not.toBe(ids[i - 1])
    }
  })

  test('계속 맞히면 난이도가 올라간다', () => {
    const s = createSession({ scope, length: 12, seed: 7 })
    const early: number[] = []
    const late: number[] = []
    for (let i = 0; i < 12; i++) {
      const p = nextProblem(s)!
      ;(i < 4 ? early : late).push(p.difficulty)
      recordResult(s, p, true)
    }
    const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
    expect(avg(late)).toBeGreaterThan(avg(early))
  })

  test('틀린 유형은 세션 안에서 다시 나온다', () => {
    const s = createSession({ scope, length: 8, seed: 3 })
    const first = nextProblem(s)!
    recordResult(s, first, false)
    const rest: string[] = []
    for (let i = 1; i < 8; i++) {
      const p = nextProblem(s)!
      rest.push(p.genId)
      recordResult(s, p, true)
    }
    expect(rest).toContain(first.genId)
  })

  test('범위를 좁히면 그 단원만 나온다', () => {
    const s = createSession({ scope: new Set<Unit>(['수2']), length: 6, seed: 11 })
    for (let i = 0; i < 6; i++) {
      const p = nextProblem(s)!
      expect(p.unit).toBe('수2')
      recordResult(s, p, true)
    }
  })
})

describe('채점', () => {
  test('분수·공백·유니코드 기호를 받아준다', () => {
    expect(parseNumericInput(' 3/4 ')).toBeCloseTo(0.75)
    expect(parseNumericInput('-7/2')).toBeCloseTo(-3.5)
    expect(parseNumericInput('−3')).toBe(-3) // 유니코드 마이너스
    expect(parseNumericInput('1 1/2')).toBeCloseTo(1.5)
    expect(parseNumericInput('abc')).toBeNull()
    expect(checkNumericAnswer('1/3', 1 / 3, 3)).toBe(true)
    expect(checkNumericAnswer('0.333', 1 / 3, 3)).toBe(true)
    expect(checkNumericAnswer('0.3', 1 / 3, 3)).toBe(false)
    expect(checkNumericAnswer('5', 5, 0)).toBe(true)
    expect(checkNumericAnswer('5.1', 5, 0)).toBe(false)
  })

  test('공백·곱셈기호·프라임 표기를 무시한다', () => {
    expect(checkTexAnswer(' f(x) ', ['f(x)'])).toBe(true)
    expect(checkTexAnswer('2x', ['2\\cdot x'])).toBe(true)
    expect(checkTexAnswer('a \\times b', ['ab'])).toBe(true)
    expect(checkTexAnswer("f`(x)", ["f'(x)"])).toBe(true)
    expect(checkTexAnswer('f’(x)', ["f'(x)"])).toBe(true)
    expect(checkTexAnswer('f^{\\prime}(x)', ["f'(x)"])).toBe(true)
    expect(checkTexAnswer('1/a^n', ['\\frac{1}{a^n}'])).toBe(true)
    expect(checkTexAnswer('\\dfrac{1}{2}', ['\\frac{1}{2}'])).toBe(true)
  })

  test('"없다"류 답안을 넉넉하게 인정한다', () => {
    for (const s of ['없다', '없음', 'X', 'x', '∅', '-', '빈칸']) {
      expect(checkTexAnswer(s, ['없다'])).toBe(true)
    }
    expect(checkTexAnswer('없다', ['\\sqrt[n]{a}'])).toBe(false)
    expect(checkTexAnswer('', ['없다'])).toBe(false)
  })

  test('normalizeTex는 같은 식을 같게 만든다', () => {
    expect(normalizeTex('\\left(a+b\\right)')).toBe(normalizeTex('(a+b)'))
    expect(normalizeTex('\\log_a M')).toBe(normalizeTex('\\log_{a}{m}'))
  })
})

describe('TeX 포매팅', () => {
  test('다항식 부호가 항상 올바르다', () => {
    expect(
      polyTex([
        [1, 3],
        [0, 2],
        [-4, 1],
        [2, 0],
      ]),
    ).toBe('x^{3}-4x+2')
    expect(
      polyTex([
        [-1, 2],
        [1, 1],
        [-1, 0],
      ]),
    ).toBe('-x^{2}+x-1')
    expect(polyTex([[0, 0]])).toBe('0')
  })

  test('유리수 표기', () => {
    expect(ratTex(rat(4, 2))).toBe('2')
    expect(ratTex(rat(-1, 2))).toBe('-\\frac{1}{2}')
    expect(ratTex(rat(2, -4))).toBe('-\\frac{1}{2}')
  })
})
