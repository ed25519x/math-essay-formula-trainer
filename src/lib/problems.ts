import { pick, randInt, round } from './mathMatch'
import type { Unit } from './types'

export interface ProblemStep {
  id: string
  prompt: string
  answer: number
  decimals: number
}

export interface ProblemInstance {
  genId: string
  unit: Unit
  topic: string
  title: string
  statement: string
  steps: ProblemStep[]
  final: ProblemStep
  solution: string[]
}

export interface ProblemGenerator {
  id: string
  unit: Unit
  topic: string
  title: string
  generate: () => ProblemInstance
}

function piLabel(k: number, m: number): string {
  const num = k === 1 ? '\\pi' : `${k}\\pi`
  return m === 1 ? num : `\\frac{${num}}{${m}}`
}

/** e.g. varTerm(-1, 'x') => '-x', varTerm(3, 'x') => '+3x', varTerm(0, 'x') => '' */
function varTerm(coef: number, v: string): string {
  if (coef === 0) return ''
  const sign = coef < 0 ? '-' : '+'
  const abs = Math.abs(coef)
  return `${sign}${abs === 1 ? '' : abs}${v}`
}

/** e.g. constTerm(3) => '+3', constTerm(-2) => '-2', constTerm(0) => '' */
function constTerm(c: number): string {
  if (c === 0) return ''
  return c > 0 ? `+${c}` : `${c}`
}

const GENS: ProblemGenerator[] = [
  // ───────────── 수1 ─────────────
  {
    id: 'log-sum',
    unit: '수1',
    topic: '지수와 로그',
    title: '로그의 계산',
    generate: () => {
      const a = pick([2, 3, 5])
      const p = randInt(1, 5)
      const q = randInt(1, 4)
      const M = a ** p
      const N = a ** q
      return {
        genId: 'log-sum',
        unit: '수1',
        topic: '지수와 로그',
        title: '로그의 계산',
        statement: `$\\log_{${a}} ${M} + \\log_{${a}} ${N}$ 의 값을 구하시오.`,
        steps: [
          { id: 's1', prompt: `$\\log_{${a}} ${M}$ 의 값은? (즉, $${a}^{\\square}=${M}$)`, answer: p, decimals: 0 },
          { id: 's2', prompt: `$\\log_{${a}} ${N}$ 의 값은? (즉, $${a}^{\\square}=${N}$)`, answer: q, decimals: 0 },
        ],
        final: { id: 'final', prompt: '두 값의 합을 구하시오.', answer: p + q, decimals: 0 },
        solution: [
          `$\\log_{${a}}${M} = ${p}$ (∵ $${a}^{${p}} = ${M}$)`,
          `$\\log_{${a}}${N} = ${q}$ (∵ $${a}^{${q}} = ${N}$)`,
          `합: $${p} + ${q} = ${p + q}$`,
        ],
      }
    },
  },
  {
    id: 'rational-exponent',
    unit: '수1',
    topic: '지수와 로그',
    title: '유리수 지수의 계산',
    generate: () => {
      const c = randInt(2, 4)
      const n = pick([2, 3])
      const k = randInt(1, 3)
      const base = c ** n
      const answer = c ** k
      return {
        genId: 'rational-exponent',
        unit: '수1',
        topic: '지수와 로그',
        title: '유리수 지수의 계산',
        statement: `$${base}^{\\frac{${k}}{${n}}}$ 의 값을 구하시오.`,
        steps: [
          {
            id: 's1',
            prompt: `밑 ${base}를 $\\square^{${n}}$ 꼴로 나타내면 $\\square$의 값은?`,
            answer: c,
            decimals: 0,
          },
        ],
        final: { id: 'final', prompt: '식 전체의 값을 구하시오.', answer, decimals: 0 },
        solution: [
          `$${base} = ${c}^{${n}}$`,
          `$${base}^{\\frac{${k}}{${n}}} = (${c}^{${n}})^{\\frac{${k}}{${n}}} = ${c}^{${k}} = ${answer}$`,
        ],
      }
    },
  },
  {
    id: 'arith-seq-sum',
    unit: '수1',
    topic: '수열',
    title: '등차수열의 합',
    generate: () => {
      const a1 = randInt(-4, 8)
      const d = randInt(1, 5)
      const n = randInt(5, 12)
      const an = a1 + (n - 1) * d
      const Sn = (n * (a1 + an)) / 2
      return {
        genId: 'arith-seq-sum',
        unit: '수1',
        topic: '수열',
        title: '등차수열의 합',
        statement: `첫째항이 $${a1}$, 공차가 $${d}$인 등차수열의 첫째항부터 제${n}항까지의 합을 구하시오.`,
        steps: [
          { id: 's1', prompt: `제${n}항 $a_{${n}}$의 값은?`, answer: an, decimals: 0 },
        ],
        final: { id: 'final', prompt: `첫째항부터 제${n}항까지의 합 $S_{${n}}$은?`, answer: Sn, decimals: 0 },
        solution: [
          `$a_{${n}} = ${a1} + (${n}-1)\\times${d} = ${an}$`,
          `$S_{${n}} = \\dfrac{${n}(${a1}+${an})}{2} = ${Sn}$`,
        ],
      }
    },
  },
  {
    id: 'geo-seq-sum',
    unit: '수1',
    topic: '수열',
    title: '등비수열의 합',
    generate: () => {
      const a1 = randInt(1, 5)
      const r = pick([2, 3])
      const n = randInt(3, 6)
      const an = a1 * r ** (n - 1)
      const Sn = (a1 * (r ** n - 1)) / (r - 1)
      return {
        genId: 'geo-seq-sum',
        unit: '수1',
        topic: '수열',
        title: '등비수열의 합',
        statement: `첫째항이 $${a1}$, 공비가 $${r}$인 등비수열의 첫째항부터 제${n}항까지의 합을 구하시오.`,
        steps: [
          { id: 's1', prompt: `제${n}항 $a_{${n}}$의 값은?`, answer: an, decimals: 0 },
        ],
        final: { id: 'final', prompt: `첫째항부터 제${n}항까지의 합 $S_{${n}}$은?`, answer: Sn, decimals: 0 },
        solution: [
          `$a_{${n}} = ${a1}\\times${r}^{${n - 1}} = ${an}$`,
          `$S_{${n}} = \\dfrac{${a1}(${r}^{${n}}-1)}{${r}-1} = ${Sn}$`,
        ],
      }
    },
  },
  {
    id: 'sector',
    unit: '수1',
    topic: '삼각함수',
    title: '부채꼴의 호의 길이와 넓이',
    generate: () => {
      const r = randInt(2, 8)
      const { k, m } = pick([
        { k: 1, m: 6 },
        { k: 1, m: 4 },
        { k: 1, m: 3 },
        { k: 1, m: 2 },
        { k: 2, m: 3 },
      ])
      const lCoef = round((r * k) / m, 2)
      const sCoef = round((0.5 * r * r * k) / m, 2)
      return {
        genId: 'sector',
        unit: '수1',
        topic: '삼각함수',
        title: '부채꼴의 호의 길이와 넓이',
        statement: `반지름 $r=${r}$, 중심각 $\\theta=${piLabel(k, m)}$인 부채꼴의 호의 길이 $l$과 넓이 $S$를 구하시오. (답은 $\\pi$의 계수만 입력, 예: $l=2\\pi$ → 2)`,
        steps: [
          { id: 's1', prompt: '호의 길이 $l$의 $\\pi$ 계수는?', answer: lCoef, decimals: 2 },
        ],
        final: { id: 'final', prompt: '넓이 $S$의 $\\pi$ 계수는?', answer: sCoef, decimals: 2 },
        solution: [
          `$l = r\\theta = ${r}\\times${piLabel(k, m)} = ${lCoef}\\pi$`,
          `$S = \\dfrac{1}{2}rl = ${sCoef}\\pi$`,
        ],
      }
    },
  },
  {
    id: 'sine-rule',
    unit: '수1',
    topic: '삼각함수',
    title: '사인법칙',
    generate: () => {
      const R = randInt(3, 10)
      const angle = pick([30, 45, 60, 90])
      const sinA = Math.sin((angle * Math.PI) / 180)
      const a = round(2 * R * sinA, 2)
      return {
        genId: 'sine-rule',
        unit: '수1',
        topic: '삼각함수',
        title: '사인법칙',
        statement: `삼각형 ABC의 외접원의 반지름이 $${R}$이고 $A=${angle}°$일 때, 변 $a$의 길이를 구하시오. (소수 둘째 자리까지)`,
        steps: [
          { id: 's1', prompt: `$\\sin ${angle}°$ 의 값은? (소수 셋째 자리까지)`, answer: round(sinA, 3), decimals: 3 },
        ],
        final: { id: 'final', prompt: '변 $a$의 길이는?', answer: a, decimals: 2 },
        solution: [
          `$\\sin ${angle}° = ${round(sinA, 3)}$`,
          `$a = 2R\\sin A = 2\\times${R}\\times${round(sinA, 3)} = ${a}$`,
        ],
      }
    },
  },
  {
    id: 'cosine-rule',
    unit: '수1',
    topic: '삼각함수',
    title: '코사인법칙',
    generate: () => {
      const b = randInt(3, 10)
      const c = randInt(3, 10)
      const angle = pick([60, 90, 120])
      const cosA = round(Math.cos((angle * Math.PI) / 180), 4)
      const aSq = b * b + c * c - 2 * b * c * cosA
      const a = round(Math.sqrt(aSq), 2)
      return {
        genId: 'cosine-rule',
        unit: '수1',
        topic: '삼각함수',
        title: '코사인법칙',
        statement: `삼각형 ABC에서 $b=${b}$, $c=${c}$, $A=${angle}°$일 때, 변 $a$의 길이를 구하시오. (소수 둘째 자리까지)`,
        steps: [
          { id: 's1', prompt: `$\\cos ${angle}°$의 값은?`, answer: cosA, decimals: 4 },
          { id: 's2', prompt: '$a^2$의 값은?', answer: round(aSq, 2), decimals: 2 },
        ],
        final: { id: 'final', prompt: '변 $a$의 길이는?', answer: a, decimals: 2 },
        solution: [
          `$\\cos ${angle}° = ${cosA}$`,
          `$a^2 = ${b}^2+${c}^2-2\\times${b}\\times${c}\\times(${cosA}) = ${round(aSq, 2)}$`,
          `$a = \\sqrt{${round(aSq, 2)}} = ${a}$`,
        ],
      }
    },
  },
  {
    id: 'triangle-area',
    unit: '수1',
    topic: '삼각함수',
    title: '삼각형의 넓이',
    generate: () => {
      const a = randInt(3, 10)
      const bSide = randInt(3, 10)
      const angle = pick([30, 45, 60, 90, 120, 150])
      const sinC = Math.sin((angle * Math.PI) / 180)
      const S = round(0.5 * a * bSide * sinC, 2)
      return {
        genId: 'triangle-area',
        unit: '수1',
        topic: '삼각함수',
        title: '삼각형의 넓이',
        statement: `삼각형 ABC에서 $a=${a}$, $b=${bSide}$, $C=${angle}°$일 때, 삼각형의 넓이 $S$를 구하시오. (소수 둘째 자리까지)`,
        steps: [
          { id: 's1', prompt: `$\\sin ${angle}°$의 값은? (소수 셋째 자리까지)`, answer: round(sinC, 3), decimals: 3 },
        ],
        final: { id: 'final', prompt: '넓이 $S$는?', answer: S, decimals: 2 },
        solution: [
          `$\\sin ${angle}° = ${round(sinC, 3)}$`,
          `$S = \\dfrac{1}{2}\\times${a}\\times${bSide}\\times${round(sinC, 3)} = ${S}$`,
        ],
      }
    },
  },

  // ───────────── 수2 ─────────────
  {
    id: 'limit-factor',
    unit: '수2',
    topic: '함수의 극한과 연속',
    title: '0/0 꼴 극한',
    generate: () => {
      const a = randInt(-5, 5)
      const denom = a >= 0 ? `x-${a}` : `x+${-a}`
      return {
        genId: 'limit-factor',
        unit: '수2',
        topic: '함수의 극한과 연속',
        title: '0/0 꼴 극한',
        statement: `$\\displaystyle\\lim_{x\\to ${a}} \\dfrac{x^2-${a * a}}{${denom}}$ 의 값을 구하시오.`,
        steps: [
          {
            id: 's1',
            prompt: `분자를 인수분해하여 약분한 식 $x+${a}$에 $x=${a}$를 대입한 값은?`,
            answer: 2 * a,
            decimals: 0,
          },
        ],
        final: { id: 'final', prompt: '극한값을 구하시오.', answer: 2 * a, decimals: 0 },
        solution: [
          `$\\dfrac{x^2-${a * a}}{${denom}} = \\dfrac{(x-${a})(x+${a})}{${denom}} = x+${a}$ ($x\\ne${a}$)`,
          `$\\displaystyle\\lim_{x\\to${a}}(x+${a}) = ${2 * a}$`,
        ],
      }
    },
  },
  {
    id: 'tangent-line',
    unit: '수2',
    topic: '미분',
    title: '접선의 방정식',
    generate: () => {
      const a = randInt(1, 5)
      const x0 = randInt(-3, 3)
      const slope = 3 * x0 * x0 - a
      const y0 = x0 ** 3 - a * x0
      const intercept = y0 - slope * x0
      return {
        genId: 'tangent-line',
        unit: '수2',
        topic: '미분',
        title: '접선의 방정식',
        statement: `곡선 $y=x^3${varTerm(-a, 'x')}$ 위의 점 $x=${x0}$에서의 접선의 $y$절편을 구하시오.`,
        steps: [
          { id: 's1', prompt: `$f'(x)=3x^2-${a}$일 때, $f'(${x0})$의 값(접선의 기울기)은?`, answer: slope, decimals: 0 },
          { id: 's2', prompt: `접점의 $y$좌표 $f(${x0})$의 값은?`, answer: y0, decimals: 0 },
        ],
        final: { id: 'final', prompt: '접선의 $y$절편은?', answer: intercept, decimals: 0 },
        solution: [
          `$f'(x) = 3x^2-${a}$, $f'(${x0}) = ${slope}$`,
          `$f(${x0}) = ${x0}^3-${a}\\times${x0} = ${y0}$`,
          `접선: $y-(${y0})=${slope}(x-${x0})$ → $y$절편 $=${intercept}$`,
        ],
      }
    },
  },
  {
    id: 'extreme-value',
    unit: '수2',
    topic: '미분',
    title: '함수의 극값',
    generate: () => {
      const k = randInt(1, 4)
      const aSq = k * k
      const localMin = -2 * k ** 3
      return {
        genId: 'extreme-value',
        unit: '수2',
        topic: '미분',
        title: '함수의 극값',
        statement: `함수 $f(x)=x^3-${3 * aSq}x$의 극솟값을 구하시오.`,
        steps: [
          { id: 's1', prompt: `$f'(x)=3x^2-${3 * aSq}=0$의 양의 해는?`, answer: k, decimals: 0 },
        ],
        final: { id: 'final', prompt: '앞에서 구한 양의 해에서의 극솟값을 구하시오.', answer: localMin, decimals: 0 },
        solution: [
          `$f'(x)=3x^2-${3 * aSq}=3(x-${k})(x+${k})$, $x=\\pm${k}$`,
          `$x=${k}$에서 극소이고 $f(${k})=${k}^3-${3 * aSq}\\times${k}=${localMin}$`,
        ],
      }
    },
  },
  {
    id: 'definite-integral-area',
    unit: '수2',
    topic: '적분',
    title: '정적분과 넓이',
    generate: () => {
      const a = randInt(0, 3)
      const n = randInt(1, 4)
      const area = round(n ** 3 / 3 + a * n, 3)
      return {
        genId: 'definite-integral-area',
        unit: '수2',
        topic: '적분',
        title: '정적분과 넓이',
        statement: `곡선 $y=x^2${constTerm(a)}$와 $x$축, $y$축 및 직선 $x=${n}$으로 둘러싸인 부분의 넓이를 구하시오.`,
        steps: [
          {
            id: 's1',
            prompt: `$F(x)=\\dfrac{x^3}{3}${varTerm(a, 'x')}$일 때 $F(${n})$의 값은? (소수 셋째 자리까지)`,
            answer: area,
            decimals: 3,
          },
        ],
        final: { id: 'final', prompt: '넓이 $S$를 구하시오.', answer: area, decimals: 3 },
        solution: [
          `$F(x)=\\dfrac{x^3}{3}${varTerm(a, 'x')}$`,
          `$S = F(${n})-F(0) = ${area}$`,
        ],
      }
    },
  },

  // ───────────── 미적분 ─────────────
  {
    id: 'trig-limit',
    unit: '미적분',
    topic: '삼각함수의 극한',
    title: '삼각함수의 극한',
    generate: () => {
      const k = randInt(1, 5)
      const m = randInt(1, 5)
      const answer = round(k / m, 3)
      return {
        genId: 'trig-limit',
        unit: '미적분',
        topic: '삼각함수의 극한',
        title: '삼각함수의 극한',
        statement: `$\\displaystyle\\lim_{x\\to0}\\dfrac{\\sin(${k}x)}{${m}x}$ 의 값을 구하시오. (소수 셋째 자리까지)`,
        steps: [
          {
            id: 's1',
            prompt: `$\\dfrac{\\sin(${k}x)}{${k}x}\\to1$ 임을 이용해 식을 $\\dfrac{${k}}{${m}}\\times\\dfrac{\\sin(${k}x)}{${k}x}$ 로 바꿀 때, 앞의 상수 $\\dfrac{${k}}{${m}}$의 값은?`,
            answer,
            decimals: 3,
          },
        ],
        final: { id: 'final', prompt: '극한값을 구하시오.', answer, decimals: 3 },
        solution: [
          `$\\dfrac{\\sin(${k}x)}{${m}x} = \\dfrac{${k}}{${m}}\\cdot\\dfrac{\\sin(${k}x)}{${k}x}$`,
          `$x\\to0$일 때 $\\dfrac{\\sin(${k}x)}{${k}x}\\to1$ 이므로 극한값은 $\\dfrac{${k}}{${m}}=${answer}$`,
        ],
      }
    },
  },
  {
    id: 'quotient-rule',
    unit: '미적분',
    topic: '여러 가지 함수의 미분',
    title: '몫의 미분법',
    generate: () => {
      const a = randInt(1, 5)
      const x0 = randInt(1, 4)
      const gPrime = 2 * x0
      const g = x0 * x0 + a
      const val = round(-gPrime / g ** 2, 4)
      return {
        genId: 'quotient-rule',
        unit: '미적분',
        topic: '여러 가지 함수의 미분',
        title: '몫의 미분법',
        statement: `$g(x)=x^2+${a}$일 때, $h(x)=\\dfrac{1}{g(x)}$의 $h'(${x0})$ 값을 구하시오. (소수 넷째 자리까지)`,
        steps: [
          { id: 's1', prompt: `$g'(${x0})$의 값은?`, answer: gPrime, decimals: 0 },
          { id: 's2', prompt: `$g(${x0})$의 값은?`, answer: g, decimals: 0 },
        ],
        final: { id: 'final', prompt: `$h'(${x0}) = -\\dfrac{g'(x)}{\\{g(x)\\}^2}$의 값은?`, answer: val, decimals: 4 },
        solution: [
          `$g'(x)=2x$, $g'(${x0})=${gPrime}$`,
          `$g(${x0})=${x0}^2+${a}=${g}$`,
          `$h'(${x0}) = -\\dfrac{${gPrime}}{${g}^2} = ${val}$`,
        ],
      }
    },
  },
  {
    id: 'chain-rule',
    unit: '미적분',
    topic: '여러 가지 함수의 미분',
    title: '합성함수의 미분법',
    generate: () => {
      const a = randInt(1, 4)
      const n = pick([2, 3])
      const x0 = randInt(1, 3)
      const inner = x0 * x0 + a
      const val = n * inner ** (n - 1) * 2 * x0
      return {
        genId: 'chain-rule',
        unit: '미적분',
        topic: '여러 가지 함수의 미분',
        title: '합성함수의 미분법',
        statement: `$f(x)=(x^2+${a})^{${n}}$일 때, $f'(${x0})$의 값을 구하시오.`,
        steps: [
          { id: 's1', prompt: `속함수의 값 $x^2+${a}$ ($x=${x0}$)는?`, answer: inner, decimals: 0 },
        ],
        final: {
          id: 'final',
          prompt: `$f'(x)=${n}(x^2+${a})^{${n - 1}}\\cdot2x$에 대입한 값은?`,
          answer: val,
          decimals: 0,
        },
        solution: [
          `속함수 값: $${x0}^2+${a}=${inner}$`,
          `$f'(${x0}) = ${n}\\times${inner}^{${n - 1}}\\times2\\times${x0} = ${val}$`,
        ],
      }
    },
  },
  {
    id: 'trig-def-integral',
    unit: '미적분',
    topic: '여러 가지 함수의 적분',
    title: '삼각함수의 정적분',
    generate: () => {
      const options = [
        {
          label: '\\sec^2 x',
          lowerL: '0',
          upperL: '\\frac{\\pi}{4}',
          anti: (x: number) => Math.tan(x),
          lower: 0,
          upper: Math.PI / 4,
        },
        {
          label: '\\sec^2 x',
          lowerL: '0',
          upperL: '\\frac{\\pi}{3}',
          anti: (x: number) => Math.tan(x),
          lower: 0,
          upper: Math.PI / 3,
        },
        {
          label: '\\cos x',
          lowerL: '0',
          upperL: '\\frac{\\pi}{2}',
          anti: (x: number) => Math.sin(x),
          lower: 0,
          upper: Math.PI / 2,
        },
        {
          label: '\\cos x',
          lowerL: '0',
          upperL: '\\frac{\\pi}{6}',
          anti: (x: number) => Math.sin(x),
          lower: 0,
          upper: Math.PI / 6,
        },
        {
          label: '\\sin x',
          lowerL: '0',
          upperL: '\\frac{\\pi}{3}',
          anti: (x: number) => -Math.cos(x),
          lower: 0,
          upper: Math.PI / 3,
        },
        {
          label: '\\csc^2 x',
          lowerL: '\\frac{\\pi}{6}',
          upperL: '\\frac{\\pi}{4}',
          anti: (x: number) => -1 / Math.tan(x),
          lower: Math.PI / 6,
          upper: Math.PI / 4,
        },
      ]
      const o = pick(options)
      const upperVal = round(o.anti(o.upper), 3)
      const lowerVal = round(o.anti(o.lower), 3)
      const result = round(upperVal - lowerVal, 3)
      return {
        genId: 'trig-def-integral',
        unit: '미적분',
        topic: '여러 가지 함수의 적분',
        title: '삼각함수의 정적분',
        statement: `$\\displaystyle\\int_{${o.lowerL}}^{${o.upperL}} ${o.label}\\,dx$ 의 값을 구하시오. (소수 셋째 자리까지)`,
        steps: [
          { id: 's1', prompt: `원시함수 $F(x)$에 대해 $F(${o.upperL})$의 값은?`, answer: upperVal, decimals: 3 },
          { id: 's2', prompt: `$F(${o.lowerL})$의 값은?`, answer: lowerVal, decimals: 3 },
        ],
        final: { id: 'final', prompt: '정적분의 값 (윗값 $-$ 아랫값)을 구하시오.', answer: result, decimals: 3 },
        solution: [
          `원시함수의 값: $F(${o.upperL})=${upperVal}$, $F(${o.lowerL})=${lowerVal}$`,
          `정적분 값 $= ${upperVal} - ${lowerVal} = ${result}$`,
        ],
      }
    },
  },
  {
    id: 'geo-series',
    unit: '미적분',
    topic: '수열의 극한과 급수',
    title: '등비급수의 합',
    generate: () => {
      const a = randInt(1, 6)
      const denom = randInt(2, 5)
      const r = round(1 / denom, 3)
      const sum = round(a / (1 - r), 3)
      return {
        genId: 'geo-series',
        unit: '미적분',
        topic: '수열의 극한과 급수',
        title: '등비급수의 합',
        statement: `첫째항이 $${a}$, 공비가 $\\dfrac{1}{${denom}}$인 등비급수 $\\displaystyle\\sum_{n=1}^{\\infty} ${a}\\left(\\dfrac{1}{${denom}}\\right)^{n-1}$의 합을 구하시오. (소수 셋째 자리까지)`,
        steps: [
          { id: 's1', prompt: '공비 $r$의 값은? (분수를 소수로, 셋째 자리까지)', answer: r, decimals: 3 },
        ],
        final: { id: 'final', prompt: '급수의 합 $\\dfrac{a}{1-r}$의 값은?', answer: sum, decimals: 3 },
        solution: [
          `$r = \\dfrac{1}{${denom}} = ${r}$`,
          `합 $= \\dfrac{${a}}{1-${r}} = ${sum}$`,
        ],
      }
    },
  },
]

export const PROBLEM_GENERATORS = GENS
