import { deriv, limitAt, simpson, sumRange } from './numeric'
import { coin, pick, randInt, randIntExcept, type Rng } from './rng'
import type { Unit } from './types'
import {
  addConst,
  addTerm,
  coefTerm,
  linearBare,
  linearFactor,
  paren,
  piTex,
  polyDeriv,
  polyEval,
  polyTex,
  rat,
  ratDecimals,
  ratNum,
  ratParen,
  ratTex,
  type PolyTerm,
  type Rat,
} from './texfmt'

/** 1: 공식 대입 / 2: 두세 단계 / 3: 조건 해석이 필요한 문제 */
export type Difficulty = 1 | 2 | 3

export interface ProblemStep {
  id: string
  prompt: string
  answer: number
  decimals: number
  /** 답 형식 안내 (예: 분수 입력 가능) */
  format?: string
}

export interface ProblemInstance {
  genId: string
  unit: Unit
  topic: string
  title: string
  difficulty: Difficulty
  statement: string
  steps: ProblemStep[]
  final: ProblemStep
  solution: string[]
  /** 같은 문제가 반복되는지 판별하는 키 */
  key: string
  /** 정답을 독립적인 방법으로 다시 계산한다 (테스트 전용) */
  verify?: () => number
}

interface StepDef {
  prompt: string
  answer: number | Rat
  decimals?: number
  format?: string
}

interface GenOutput {
  statement: string
  steps: StepDef[]
  final: StepDef
  solution: string[]
  verify?: () => number
}

export interface ProblemGenerator {
  id: string
  unit: Unit
  topic: string
  title: string
  difficulty: Difficulty
  gen: (r: Rng) => GenOutput
}

const FRACTION_NOTE = '분수로 입력해도 돼요 (예: 3/4)'

function isRat(v: number | Rat): v is Rat {
  return typeof v === 'object'
}

function toStep(id: string, def: StepDef): ProblemStep {
  if (isRat(def.answer)) {
    const decimals = def.decimals ?? ratDecimals(def.answer)
    return {
      id,
      prompt: def.prompt,
      answer: ratNum(def.answer),
      decimals,
      format: def.format ?? (decimals > 0 ? FRACTION_NOTE : undefined),
    }
  }
  return {
    id,
    prompt: def.prompt,
    answer: def.answer,
    decimals: def.decimals ?? 0,
    format: def.format ?? (def.decimals && def.decimals > 0 ? FRACTION_NOTE : undefined),
  }
}

export function generateProblem(gen: ProblemGenerator, rng: Rng): ProblemInstance {
  const out = gen.gen(rng)
  return {
    genId: gen.id,
    unit: gen.unit,
    topic: gen.topic,
    title: gen.title,
    difficulty: gen.difficulty,
    statement: out.statement,
    steps: out.steps.map((s, i) => toStep(`s${i + 1}`, s)),
    final: toStep('final', out.final),
    solution: out.solution,
    key: `${gen.id}|${out.statement}`,
    verify: out.verify,
  }
}

// ─────────────────────────────────────────────────────────────
// 미리 계산해 두는 표 (정수 답이 나오는 조합만 골라 쓴다)
// ─────────────────────────────────────────────────────────────

/** 코사인법칙에서 a까지 정수로 떨어지는 (b, c, A) 조합 */
const COSINE_TRIPLES: { b: number; c: number; angle: number; a: number }[] = (() => {
  const out: { b: number; c: number; angle: number; a: number }[] = []
  for (const angle of [60, 90, 120]) {
    const cos = angle === 60 ? 0.5 : angle === 90 ? 0 : -0.5
    for (let b = 2; b <= 14; b++) {
      for (let c = b; c <= 14; c++) {
        const sq = b * b + c * c - 2 * b * c * cos
        const a = Math.round(Math.sqrt(sq))
        if (a * a === sq && a >= 2) out.push({ b, c, angle, a })
      }
    }
  }
  return out
})()

/** 로그방정식 log_a(x-p) + log_a(x+p) = k 가 정수해를 갖는 조합 */
const LOG_EQUATIONS: { base: number; k: number; x: number; p: number }[] = (() => {
  const out: { base: number; k: number; x: number; p: number }[] = []
  for (let x = 3; x <= 12; x++) {
    for (let p = 1; p < x; p++) {
      const v = x * x - p * p
      for (const base of [2, 3, 5]) {
        const k = Math.round(Math.log(v) / Math.log(base))
        if (k >= 2 && base ** k === v && x - p > 0) out.push({ base, k, x, p })
      }
    }
  }
  return out
})()

const PY_TRIPLES: [number, number, number][] = [
  [3, 4, 5],
  [4, 3, 5],
  [5, 12, 13],
  [12, 5, 13],
  [8, 15, 17],
  [15, 8, 17],
  [7, 24, 25],
]

// ─────────────────────────────────────────────────────────────
// 생성기
// ─────────────────────────────────────────────────────────────

const GENERATORS: ProblemGenerator[] = [
  // ───────────── 수1 · 지수와 로그 ─────────────
  {
    id: 'log-basic',
    unit: '수1',
    topic: '지수와 로그',
    title: '로그의 계산',
    difficulty: 1,
    gen: (r) => {
      const a = pick(r, [2, 3, 5])
      const p = randInt(r, 1, 4)
      const q = randInt(r, 1, 4)
      const plus = coin(r)
      const M = a ** p
      const N = a ** q
      const ans = plus ? p + q : p - q
      const op = plus ? '+' : '-'
      return {
        statement: `$\\log_{${a}} ${M} ${op} \\log_{${a}} ${N}$ 의 값을 구하시오.`,
        steps: [
          { prompt: `$\\log_{${a}} ${M}$ 의 값은? (즉 $${a}^{\\square}=${M}$)`, answer: p },
          { prompt: `$\\log_{${a}} ${N}$ 의 값은?`, answer: q },
        ],
        final: { prompt: `두 값을 ${plus ? '더하면' : '빼면'}?`, answer: ans },
        solution: [
          `$\\log_{${a}}${M}=${p}$, $\\log_{${a}}${N}=${q}$`,
          `$${p} ${op} ${q} = ${ans}$`,
        ],
        verify: () => Math.log(M) / Math.log(a) + (plus ? 1 : -1) * (Math.log(N) / Math.log(a)),
      }
    },
  },
  {
    id: 'log-chain',
    unit: '수1',
    topic: '지수와 로그',
    title: '로그의 밑변환',
    difficulty: 2,
    gen: (r) => {
      const b = pick(r, [3, 5, 6, 7])
      const i = pick(r, [2, 3])
      const c = 2 ** i
      const k = randIntExcept(r, 2, 6, [i])
      const d = 2 ** k
      return {
        statement: `$\\log_{2} ${b} \\times \\log_{${b}} ${c} \\times \\log_{${c}} ${d}$ 의 값을 구하시오.`,
        steps: [
          {
            prompt: `밑변환공식으로 앞의 두 개를 합치면 $\\log_{2} ${c}$ 이다. 그 값은?`,
            answer: i,
          },
          { prompt: `$\\log_{${c}} ${d}$ 의 값은?`, answer: rat(k, i) },
        ],
        final: { prompt: '전체의 값은?', answer: k },
        solution: [
          `$\\log_{2}${b}\\times\\log_{${b}}${c} = \\log_{2}${c} = ${i}$`,
          `$\\log_{${c}}${d} = \\dfrac{\\log_2 ${d}}{\\log_2 ${c}} = ${ratTex(rat(k, i))}$`,
          `$${i}\\times${ratTex(rat(k, i))} = ${k}$ (즉 $\\log_2 ${d} = ${k}$)`,
        ],
        verify: () => Math.log(d) / Math.log(2),
      }
    },
  },
  {
    id: 'rational-exponent',
    unit: '수1',
    topic: '지수와 로그',
    title: '유리수 지수의 계산',
    difficulty: 1,
    gen: (r) => {
      const c = randInt(r, 2, 5)
      const n = pick(r, [2, 3])
      const k = randIntExcept(r, 2, 4, [n])
      const base = c ** n
      return {
        statement: `$${base}^{\\frac{${k}}{${n}}}$ 의 값을 구하시오.`,
        steps: [
          { prompt: `밑 $${base}$ 를 $\\square^{${n}}$ 꼴로 나타낼 때 $\\square$의 값은?`, answer: c },
        ],
        final: { prompt: '식의 값은?', answer: c ** k },
        solution: [
          `$${base} = ${c}^{${n}}$`,
          `$(${c}^{${n}})^{\\frac{${k}}{${n}}} = ${c}^{${k}} = ${c ** k}$`,
        ],
        verify: () => base ** (k / n),
      }
    },
  },
  {
    id: 'exp-equation',
    unit: '수1',
    topic: '지수와 로그',
    title: '지수방정식 (치환)',
    difficulty: 3,
    gen: (r) => {
      const u = randInt(r, 0, 2)
      const v = randInt(r, u + 1, 4)
      const t1 = 2 ** u
      const t2 = 2 ** v
      const k = t1 + t2
      const m = t1 * t2
      return {
        statement: `방정식 $4^{x} - ${k}\\cdot 2^{x} + ${m} = 0$ 의 모든 실근의 합을 구하시오.`,
        steps: [
          {
            prompt: `$t=2^{x}\\,(t>0)$ 로 놓으면 $t^{2}-${k}t+${m}=0$ 이다. 두 근 중 작은 것은?`,
            answer: t1,
          },
          { prompt: '두 근 중 큰 것은?', answer: t2 },
          { prompt: `$2^{x}=${t1}$ 에서 $x$의 값은?`, answer: u },
        ],
        final: { prompt: '모든 실근의 합은?', answer: u + v },
        solution: [
          `$t=2^x$ 로 치환하면 $t^2-${k}t+${m}=(t-${t1})(t-${t2})=0$`,
          `$2^x=${t1} \\Rightarrow x=${u}$, $2^x=${t2} \\Rightarrow x=${v}$`,
          `합: $${u}+${v}=${u + v}$`,
        ],
        verify: () => Math.log2(m),
      }
    },
  },
  {
    id: 'log-equation',
    unit: '수1',
    topic: '지수와 로그',
    title: '로그방정식',
    difficulty: 3,
    gen: (r) => {
      const { base, k, x, p } = pick(r, LOG_EQUATIONS)
      const v = base ** k
      return {
        statement: `방정식 $\\log_{${base}}(x-${p}) + \\log_{${base}}(x+${p}) = ${k}$ 의 해를 구하시오.`,
        steps: [
          { prompt: `좌변을 하나의 로그로 묶으면 $\\log_{${base}}(x^{2}-${p * p})$ 이다. $${base}^{${k}}$ 의 값은?`, answer: v },
          { prompt: `$x^{2}-${p * p}=${v}$ 에서 $x^{2}$의 값은?`, answer: v + p * p },
        ],
        final: { prompt: `진수 조건 $x>${p}$ 를 만족시키는 $x$의 값은?`, answer: x },
        solution: [
          `$\\log_{${base}}(x-${p})(x+${p})=${k}$ 이므로 $x^2-${p * p}=${base}^{${k}}=${v}$`,
          `$x^2=${v + p * p}$, $x=\\pm${x}$`,
          `진수 조건에서 $x>${p}$ 이므로 $x=${x}$`,
        ],
        verify: () => Math.sqrt(v + p * p),
      }
    },
  },

  // ───────────── 수1 · 수열 ─────────────
  {
    id: 'arith-seq',
    unit: '수1',
    topic: '수열',
    title: '등차수열의 합',
    difficulty: 1,
    gen: (r) => {
      const a1 = randInt(r, -5, 8)
      const d = randIntExcept(r, -4, 5, [0])
      const n = randInt(r, 6, 12)
      const an = a1 + (n - 1) * d
      const Sn = (n * (a1 + an)) / 2
      return {
        statement: `첫째항이 $${a1}$, 공차가 $${d}$ 인 등차수열 $\\{a_n\\}$ 에서 $S_{${n}}$ 을 구하시오.`,
        steps: [{ prompt: `제${n}항 $a_{${n}}$ 의 값은?`, answer: an }],
        final: { prompt: `$S_{${n}}$ 의 값은?`, answer: Sn },
        solution: [
          `$a_{${n}} = ${a1} + (${n}-1)\\times(${d}) = ${an}$`,
          `$S_{${n}} = \\dfrac{${n}\\{${a1}+(${an})\\}}{2} = ${Sn}$`,
        ],
        verify: () => sumRange((k) => a1 + (k - 1) * d, 1, n),
      }
    },
  },
  {
    id: 'arith-seq-unknown',
    unit: '수1',
    topic: '수열',
    title: '등차수열의 결정',
    difficulty: 2,
    gen: (r) => {
      const d = randIntExcept(r, -4, 5, [0])
      const a1 = randInt(r, -5, 7)
      const p = randInt(r, 2, 5)
      const q = randInt(r, p + 2, 10)
      const n = randInt(r, 8, 15)
      const A = a1 + (p - 1) * d
      const B = a1 + (q - 1) * d
      const Sn = (n * (2 * a1 + (n - 1) * d)) / 2
      return {
        statement: `등차수열 $\\{a_n\\}$ 에서 $a_{${p}}=${A}$, $a_{${q}}=${B}$ 일 때 $S_{${n}}$ 을 구하시오.`,
        steps: [
          { prompt: `공차 $d = \\dfrac{a_{${q}}-a_{${p}}}{${q}-${p}}$ 의 값은?`, answer: d },
          { prompt: '첫째항 $a_1$ 의 값은?', answer: a1 },
        ],
        final: { prompt: `$S_{${n}}$ 의 값은?`, answer: Sn },
        solution: [
          `$d = \\dfrac{${B}-(${A})}{${q}-${p}} = ${d}$`,
          `$a_1 = a_{${p}} - (${p}-1)d = ${A} - (${p - 1})\\times(${d}) = ${a1}$`,
          `$S_{${n}} = \\dfrac{${n}\\{2\\times(${a1})+(${n}-1)(${d})\\}}{2} = ${Sn}$`,
        ],
        verify: () => sumRange((k) => a1 + (k - 1) * d, 1, n),
      }
    },
  },
  {
    id: 'geo-seq',
    unit: '수1',
    topic: '수열',
    title: '등비수열의 합',
    difficulty: 2,
    gen: (r) => {
      const a1 = randInt(r, 1, 5)
      const ratio = pick(r, [2, 3, -2])
      const n = randInt(r, 3, 6)
      const an = a1 * ratio ** (n - 1)
      const Sn = (a1 * (ratio ** n - 1)) / (ratio - 1)
      return {
        statement: `첫째항이 $${a1}$, 공비가 $${ratio}$ 인 등비수열 $\\{a_n\\}$ 에서 $S_{${n}}$ 을 구하시오.`,
        steps: [{ prompt: `제${n}항 $a_{${n}}$ 의 값은?`, answer: an }],
        final: { prompt: `$S_{${n}}$ 의 값은?`, answer: Sn },
        solution: [
          `$a_{${n}} = ${a1}\\times(${ratio})^{${n - 1}} = ${an}$`,
          `$S_{${n}} = \\dfrac{${a1}\\{(${ratio})^{${n}}-1\\}}{${ratio}-1} = ${Sn}$`,
        ],
        verify: () => sumRange((k) => a1 * ratio ** (k - 1), 1, n),
      }
    },
  },
  {
    id: 'sigma-poly',
    unit: '수1',
    topic: '수열',
    title: '시그마의 계산',
    difficulty: 2,
    gen: (r) => {
      const n = randInt(r, 5, 10)
      const a = randInt(r, 1, 3)
      const b = randIntExcept(r, -3, 3, [0])
      const c = randInt(r, -3, 3)
      const sq = (n * (n + 1) * (2 * n + 1)) / 6
      const li = (n * (n + 1)) / 2
      const total = a * sq + b * li + c * n
      return {
        statement: `$\\displaystyle\\sum_{k=1}^{${n}} \\left(${polyTex(
          [
            [a, 2],
            [b, 1],
            [c, 0],
          ],
          'k',
        )}\\right)$ 의 값을 구하시오.`,
        steps: [
          { prompt: `$\\displaystyle\\sum_{k=1}^{${n}} k^{2} = \\dfrac{n(n+1)(2n+1)}{6}$ 의 값은?`, answer: sq },
          { prompt: `$\\displaystyle\\sum_{k=1}^{${n}} k = \\dfrac{n(n+1)}{2}$ 의 값은?`, answer: li },
        ],
        final: { prompt: '전체 시그마의 값은?', answer: total },
        solution: [
          `$\\sum k^2 = ${sq}$, $\\sum k = ${li}$, $\\sum ${c} = ${c}\\times${n} = ${c * n}$`,
          `$${a}\\times${sq} ${addConst(b * li)} ${addConst(c * n)} = ${total}$`,
        ],
        verify: () => sumRange((k) => a * k * k + b * k + c, 1, n),
      }
    },
  },
  {
    id: 'seq-recurrence',
    unit: '수1',
    topic: '수열',
    title: '귀납적으로 정의된 수열',
    difficulty: 2,
    gen: (r) => {
      const a1 = randInt(r, 1, 4)
      const p = pick(r, [2, 3])
      const q = randIntExcept(r, -3, 3, [0])
      const seq = [a1]
      for (let i = 1; i < 5; i++) seq.push(p * seq[i - 1]! + q)
      return {
        statement: `$a_1=${a1}$, $a_{n+1}=${coefTerm(p, 'a_n')}${addConst(q)}$ 로 정의된 수열에서 $a_5$ 의 값을 구하시오.`,
        steps: [
          { prompt: '$a_2$ 의 값은?', answer: seq[1]! },
          { prompt: '$a_3$ 의 값은?', answer: seq[2]! },
          { prompt: '$a_4$ 의 값은?', answer: seq[3]! },
        ],
        final: { prompt: '$a_5$ 의 값은?', answer: seq[4]! },
        solution: [`$${seq.map((v, i) => `a_${i + 1}=${v}`).join('$, $')}$`],
        verify: () => {
          let v = a1
          for (let i = 1; i < 5; i++) v = p * v + q
          return v
        },
      }
    },
  },

  // ───────────── 수1 · 삼각함수 ─────────────
  {
    id: 'sector',
    unit: '수1',
    topic: '삼각함수',
    title: '부채꼴의 호의 길이와 넓이',
    difficulty: 1,
    gen: (r) => {
      const { k, m } = pick(r, [
        { k: 1, m: 6 },
        { k: 1, m: 4 },
        { k: 1, m: 3 },
        { k: 1, m: 2 },
        { k: 2, m: 3 },
        { k: 3, m: 4 },
        { k: 5, m: 6 },
      ])
      const t = randInt(r, 1, 3)
      const radius = m * t
      const lCoef = t * k
      const sCoef = rat(radius * lCoef, 2)
      return {
        statement: `반지름이 $${radius}$, 중심각이 $${piTex(rat(k, m))}$ 인 부채꼴의 호의 길이 $l$ 과 넓이 $S$ 를 구하시오. (답은 $\\pi$ 의 계수만 입력)`,
        steps: [{ prompt: `$l=r\\theta$ 이다. $l$ 의 $\\pi$ 계수는?`, answer: lCoef }],
        final: { prompt: `$S=\\dfrac{1}{2}rl$ 이다. $S$ 의 $\\pi$ 계수는?`, answer: sCoef },
        solution: [
          `$l = ${radius}\\times${piTex(rat(k, m))} = ${coefTerm(lCoef, '\\pi')}$`,
          `$S = \\dfrac{1}{2}\\times${radius}\\times${lCoef}\\pi = ${ratTex(sCoef)}\\pi$`,
        ],
        verify: () => 0.5 * radius * radius * (k / m),
      }
    },
  },
  {
    id: 'trig-quadrant',
    unit: '수1',
    topic: '삼각함수',
    title: '삼각함수 사이의 관계',
    difficulty: 2,
    gen: (r) => {
      const [p, q, h] = pick(r, PY_TRIPLES)
      const sin = rat(p, h)
      const cosAbs = rat(q, h)
      const cos = rat(-q, h)
      const tan = rat(-p, q)
      return {
        statement: `$\\dfrac{\\pi}{2} < \\theta < \\pi$ 이고 $\\sin\\theta = ${ratTex(sin)}$ 일 때, $\\tan\\theta$ 의 값을 구하시오.`,
        steps: [
          {
            prompt: `$\\sin^{2}\\theta+\\cos^{2}\\theta=1$ 에서 $|\\cos\\theta|$ 의 값은?`,
            answer: cosAbs,
          },
          { prompt: '$\\theta$ 가 제2사분면의 각이므로 $\\cos\\theta$ 의 값은?', answer: cos },
        ],
        final: { prompt: `$\\tan\\theta = \\dfrac{\\sin\\theta}{\\cos\\theta}$ 의 값은?`, answer: tan },
        solution: [
          `$\\cos^2\\theta = 1-\\left(${ratTex(sin)}\\right)^2$ 이므로 $|\\cos\\theta| = ${ratTex(cosAbs)}$`,
          `제2사분면에서 $\\cos\\theta<0$ 이므로 $\\cos\\theta = ${ratTex(cos)}$`,
          `$\\tan\\theta = ${ratTex(sin)} \\div ${ratTex(cos)} = ${ratTex(tan)}$`,
        ],
        verify: () => {
          const theta = Math.PI - Math.asin(p / h)
          return Math.tan(theta)
        },
      }
    },
  },
  {
    id: 'sine-rule',
    unit: '수1',
    topic: '삼각함수',
    title: '사인법칙',
    difficulty: 1,
    gen: (r) => {
      const [p, , h] = pick(r, PY_TRIPLES.filter(([, , hh]) => hh <= 13))
      const t = randInt(r, 1, 2)
      const R = h * t
      const a = 2 * t * p
      return {
        statement: `삼각형 ABC 의 외접원의 반지름이 $${R}$ 이고 $\\sin A = ${ratTex(rat(p, h))}$ 일 때, 변 $a$ 의 길이를 구하시오.`,
        steps: [{ prompt: '$2R$ 의 값은?', answer: 2 * R }],
        final: { prompt: `$a = 2R\\sin A$ 의 값은?`, answer: a },
        solution: [
          `사인법칙 $\\dfrac{a}{\\sin A}=2R$ 에서 $a = 2R\\sin A$`,
          `$a = ${2 * R}\\times${ratTex(rat(p, h))} = ${a}$`,
        ],
        verify: () => 2 * R * (p / h),
      }
    },
  },
  {
    id: 'cosine-rule',
    unit: '수1',
    topic: '삼각함수',
    title: '코사인법칙',
    difficulty: 2,
    gen: (r) => {
      const { b, c, angle, a } = pick(r, COSINE_TRIPLES)
      const cos = angle === 60 ? rat(1, 2) : angle === 90 ? rat(0) : rat(-1, 2)
      return {
        statement: `삼각형 ABC 에서 $b=${b}$, $c=${c}$, $A=${angle}°$ 일 때 변 $a$ 의 길이를 구하시오.`,
        steps: [
          { prompt: `$\\cos ${angle}°$ 의 값은?`, answer: cos },
          { prompt: `$a^{2}=b^{2}+c^{2}-2bc\\cos A$ 의 값은?`, answer: a * a },
        ],
        final: { prompt: '$a$ 의 값은?', answer: a },
        solution: [
          `$\\cos ${angle}° = ${ratTex(cos)}$`,
          `$a^2 = ${b}^2+${c}^2-2\\times${b}\\times${c}\\times${paren(ratNum(cos))} = ${a * a}$`,
          `$a = \\sqrt{${a * a}} = ${a}$`,
        ],
        verify: () => Math.sqrt(b * b + c * c - 2 * b * c * Math.cos((angle * Math.PI) / 180)),
      }
    },
  },
  {
    id: 'triangle-area',
    unit: '수1',
    topic: '삼각함수',
    title: '삼각형의 넓이',
    difficulty: 1,
    gen: (r) => {
      const angle = pick(r, [30, 90, 150])
      const sin = angle === 90 ? rat(1) : rat(1, 2)
      const a = 2 * randInt(r, 2, 6)
      const b = 2 * randInt(r, 2, 6)
      const S = rat(a * b * sin.n, 2 * sin.d)
      return {
        statement: `삼각형 ABC 에서 $a=${a}$, $b=${b}$, $C=${angle}°$ 일 때 넓이 $S$ 를 구하시오.`,
        steps: [{ prompt: `$\\sin ${angle}°$ 의 값은?`, answer: sin }],
        final: { prompt: `$S=\\dfrac{1}{2}ab\\sin C$ 의 값은?`, answer: S },
        solution: [
          `$\\sin ${angle}° = ${ratTex(sin)}$`,
          `$S = \\dfrac{1}{2}\\times${a}\\times${b}\\times${ratTex(sin)} = ${ratTex(S)}$`,
        ],
        verify: () => 0.5 * a * b * Math.sin((angle * Math.PI) / 180),
      }
    },
  },
  {
    id: 'trig-graph',
    unit: '수1',
    topic: '삼각함수',
    title: '삼각함수의 그래프',
    difficulty: 2,
    gen: (r) => {
      const a = randInt(r, 2, 5)
      const b = randInt(r, 1, 4)
      const c = randInt(r, -4, 4)
      const useCos = coin(r)
      const fn = useCos ? '\\cos' : '\\sin'
      const period = rat(2, b)
      return {
        statement: `함수 $y = ${a}${fn} ${coefTerm(b, 'x')} ${addConst(c)}$ 의 최댓값 $M$, 최솟값 $m$, 주기를 구하시오.`,
        steps: [
          { prompt: '최댓값 $M$ 의 값은?', answer: a + c },
          { prompt: '최솟값 $m$ 의 값은?', answer: -a + c },
        ],
        final: { prompt: `주기는 $\\dfrac{2\\pi}{|b|}$ 이다. 주기의 $\\pi$ 계수는?`, answer: period },
        solution: [
          `$-1\\le ${fn} ${coefTerm(b, 'x')} \\le 1$ 이므로 $M=${a}${addConst(c)}=${a + c}$, $m=-${a}${addConst(c)}=${-a + c}$`,
          `주기 $= \\dfrac{2\\pi}{${b}} = ${ratTex(period)}\\pi$`,
        ],
        verify: () => 2 / b,
      }
    },
  },
  {
    id: 'trig-equation',
    unit: '수1',
    topic: '삼각함수',
    title: '삼각방정식',
    difficulty: 2,
    gen: (r) => {
      const item = pick(r, [
        { eq: '2\\sin x = 1', s: [rat(1, 6), rat(5, 6)] },
        { eq: '2\\sin x = -1', s: [rat(7, 6), rat(11, 6)] },
        { eq: '2\\cos x = 1', s: [rat(1, 3), rat(5, 3)] },
        { eq: '2\\cos x = -1', s: [rat(2, 3), rat(4, 3)] },
        { eq: '2\\sin x = \\sqrt{3}', s: [rat(1, 3), rat(2, 3)] },
        { eq: '2\\cos x = \\sqrt{3}', s: [rat(1, 6), rat(11, 6)] },
        { eq: '\\sqrt{2}\\sin x = 1', s: [rat(1, 4), rat(3, 4)] },
        { eq: '\\sqrt{2}\\cos x = -1', s: [rat(3, 4), rat(5, 4)] },
        { eq: '\\tan x = 1', s: [rat(1, 4), rat(5, 4)] },
        { eq: '\\tan x = \\sqrt{3}', s: [rat(1, 3), rat(4, 3)] },
      ])
      const [s1, s2] = item.s as [Rat, Rat]
      const sum = rat(s1.n * s2.d + s2.n * s1.d, s1.d * s2.d)
      return {
        statement: `$0 \\le x < 2\\pi$ 에서 방정식 $${item.eq}$ 의 모든 해의 합을 구하시오. (답은 $\\pi$ 의 계수만 입력)`,
        steps: [
          { prompt: '작은 해의 $\\pi$ 계수는?', answer: s1 },
          { prompt: '큰 해의 $\\pi$ 계수는?', answer: s2 },
        ],
        final: { prompt: '두 해의 합의 $\\pi$ 계수는?', answer: sum },
        solution: [
          `해: $x=${piTex(s1)}$, $x=${piTex(s2)}$`,
          `합 $= ${piTex(sum)}$`,
        ],
        verify: () => ratNum(s1) + ratNum(s2),
      }
    },
  },

  // ───────────── 수2 · 함수의 극한과 연속 ─────────────
  {
    id: 'limit-factor',
    unit: '수2',
    topic: '함수의 극한과 연속',
    title: '0/0 꼴의 극한',
    difficulty: 1,
    gen: (r) => {
      const a = randInt(r, -4, 4)
      const b = randIntExcept(r, -4, 4, [a])
      const terms: PolyTerm[] = [
        [1, 2],
        [-(a + b), 1],
        [a * b, 0],
      ]
      return {
        statement: `$\\displaystyle\\lim_{x\\to ${a}} \\dfrac{${polyTex(terms)}}{${linearBare(a)}}$ 의 값을 구하시오.`,
        steps: [
          {
            prompt: `분자를 $${linearFactor(a)}(x-\\square)$ 로 인수분해할 때 $\\square$ 의 값은?`,
            answer: b,
          },
        ],
        final: { prompt: '극한값은?', answer: a - b },
        solution: [
          `$${polyTex(terms)} = ${linearFactor(a)}${linearFactor(b)}$`,
          `약분하면 $x-${paren(b)}$ 이므로 극한값은 $${a}-${paren(b)} = ${a - b}$`,
        ],
        verify: () => limitAt((x) => (x * x - (a + b) * x + a * b) / (x - a), a),
      }
    },
  },
  {
    id: 'limit-rationalize',
    unit: '수2',
    topic: '함수의 극한과 연속',
    title: '무리식의 극한 (유리화)',
    difficulty: 3,
    gen: (r) => {
      const t = randInt(r, 2, 6)
      const k = t * t
      const ans = rat(1, 2 * t)
      return {
        statement: `$\\displaystyle\\lim_{x\\to 0} \\dfrac{\\sqrt{x+${k}}-${t}}{x}$ 의 값을 구하시오.`,
        steps: [
          {
            prompt: `분자를 유리화하면 $\\dfrac{x}{x(\\sqrt{x+${k}}+${t})}$ 이다. $x\\to0$ 일 때 $\\sqrt{x+${k}}+${t}$ 의 값은?`,
            answer: 2 * t,
          },
        ],
        final: { prompt: '극한값은?', answer: ans },
        solution: [
          `분모·분자에 $\\sqrt{x+${k}}+${t}$ 를 곱하면 $\\dfrac{(x+${k})-${k}}{x(\\sqrt{x+${k}}+${t})} = \\dfrac{1}{\\sqrt{x+${k}}+${t}}$`,
          `$x\\to0$ 이면 $\\dfrac{1}{${2 * t}} = ${ratTex(ans)}$`,
        ],
        verify: () => limitAt((x) => (Math.sqrt(x + k) - t) / x, 0, 1e-5),
      }
    },
  },
  {
    id: 'limit-infinity',
    unit: '수2',
    topic: '함수의 극한과 연속',
    title: '∞/∞ 꼴의 극한',
    difficulty: 2,
    gen: (r) => {
      const a = randInt(r, 1, 6)
      const b = randIntExcept(r, -5, 5, [0])
      const c = randInt(r, 1, 6)
      const d = randIntExcept(r, -5, 5, [0])
      const ans = rat(a, c)
      return {
        statement: `$\\displaystyle\\lim_{x\\to\\infty} \\dfrac{${polyTex([
          [a, 2],
          [b, 1],
        ])}}{${polyTex([
          [c, 2],
          [d, 1],
          [1, 0],
        ])}}$ 의 값을 구하시오.`,
        steps: [
          {
            prompt: `분모·분자를 $x^{2}$ 으로 나누면 분자는 $${a}+\\dfrac{${b}}{x}$ 이다. $x\\to\\infty$ 일 때 이 값은?`,
            answer: a,
          },
          { prompt: '같은 방법으로 분모의 극한값은?', answer: c },
        ],
        final: { prompt: '극한값은?', answer: ans },
        solution: [
          `분모·분자를 $x^2$ 으로 나누면 $\\dfrac{${a}+\\frac{${b}}{x}}{${c}+\\frac{${d}}{x}+\\frac{1}{x^2}}$`,
          `$x\\to\\infty$ 이면 $\\dfrac{${a}}{${c}} = ${ratTex(ans)}$`,
        ],
        verify: () => {
          const x = 1e7
          return (a * x * x + b * x) / (c * x * x + d * x + 1)
        },
      }
    },
  },
  {
    id: 'continuity',
    unit: '수2',
    topic: '함수의 극한과 연속',
    title: '함수의 연속',
    difficulty: 2,
    gen: (r) => {
      const a = randInt(r, -3, 4)
      const b = randIntExcept(r, -4, 4, [0])
      const terms: PolyTerm[] = [
        [1, 2],
        [b - a, 1],
        [-a * b, 0],
      ]
      return {
        statement: `함수 $f(x)=\\begin{cases} \\dfrac{${polyTex(terms)}}{${linearBare(
          a,
        )}} & (x \\ne ${a}) \\\\ k & (x = ${a}) \\end{cases}$ 가 $x=${a}$ 에서 연속일 때 $k$ 의 값을 구하시오.`,
        steps: [
          {
            prompt: `$x\\ne${a}$ 일 때 $f(x)$ 를 약분하면 $x+\\square$ 꼴이다. $\\square$ 의 값은?`,
            answer: b,
          },
        ],
        final: { prompt: `$k$ 의 값은?`, answer: a + b },
        solution: [
          `$${polyTex(terms)} = ${linearFactor(a)}(x${addConst(b)})$`,
          `$\\lim_{x\\to${a}} f(x) = ${a}${addConst(b)} = ${a + b}$ 이고, 연속이므로 $k=${a + b}$`,
        ],
        verify: () =>
          limitAt((x) => (x * x + (b - a) * x - a * b) / (x - a), a),
      }
    },
  },
  {
    id: 'diff-definition',
    unit: '수2',
    topic: '미분',
    title: '미분계수의 정의',
    difficulty: 2,
    gen: (r) => {
      const p = randIntExcept(r, -4, 4, [0])
      const q = randInt(r, -5, 5)
      const x0 = randIntExcept(r, -3, 3, [0])
      const m = pick(r, [2, 3])
      const terms: PolyTerm[] = [
        [1, 3],
        [p, 1],
        [q, 0],
      ]
      const d = polyDeriv(terms)
      const fp = polyEval(d, x0)
      return {
        statement: `함수 $f(x)=${polyTex(terms)}$ 에 대하여 $\\displaystyle\\lim_{h\\to 0}\\dfrac{f(${x0}+${m}h)-f(${x0})}{h}$ 의 값을 구하시오.`,
        steps: [
          { prompt: `$f'(x)=${polyTex(d)}$ 이다. $f'(${x0})$ 의 값은?`, answer: fp },
        ],
        final: { prompt: `주어진 극한값은? (힌트: $${m}f'(${x0})$)`, answer: m * fp },
        solution: [
          `$\\lim_{h\\to0}\\dfrac{f(${x0}+${m}h)-f(${x0})}{${m}h}\\times${m} = ${m}f'(${x0})$`,
          `$f'(x)=${polyTex(d)}$, $f'(${x0})=${fp}$ 이므로 답은 $${m}\\times${paren(fp)}=${m * fp}$`,
        ],
        verify: () => {
          const f = (x: number) => polyEval(terms, x)
          return m * deriv(f, x0)
        },
      }
    },
  },

  // ───────────── 수2 · 미분 ─────────────
  {
    id: 'tangent-line',
    unit: '수2',
    topic: '미분',
    title: '접선의 방정식',
    difficulty: 2,
    gen: (r) => {
      const p = randIntExcept(r, -6, 6, [0])
      const q = randInt(r, -5, 5)
      const x0 = randIntExcept(r, -3, 3, [0])
      const terms: PolyTerm[] = [
        [1, 3],
        [p, 1],
        [q, 0],
      ]
      const d = polyDeriv(terms)
      const slope = polyEval(d, x0)
      const y0 = polyEval(terms, x0)
      const intercept = y0 - slope * x0
      return {
        statement: `곡선 $y=${polyTex(terms)}$ 위의 점 $x=${x0}$ 에서의 접선의 $y$ 절편을 구하시오.`,
        steps: [
          { prompt: `접선의 기울기 $f'(${x0})$ 의 값은?`, answer: slope },
          { prompt: `접점의 $y$ 좌표 $f(${x0})$ 의 값은?`, answer: y0 },
        ],
        final: { prompt: '접선의 $y$ 절편은?', answer: intercept },
        solution: [
          `$f'(x)=${polyTex(d)}$ 이므로 기울기는 $${slope}$`,
          `접점은 $(${x0},\\, ${y0})$`,
          `접선 $y-${paren(y0)}=${slope}(x-${paren(x0)})$ 에서 $y$ 절편 $=${intercept}$`,
        ],
        verify: () => polyEval(terms, x0) - deriv((x) => polyEval(terms, x), x0) * x0,
      }
    },
  },
  {
    id: 'extreme-value',
    unit: '수2',
    topic: '미분',
    title: '삼차함수의 극값',
    difficulty: 2,
    gen: (r) => {
      // 극점이 정수가 되도록 f'(x)=3(x-p)(x-q) 에서 역산한다 (p+q 는 짝수)
      const p = randInt(r, -4, 2)
      const q = p + 2 * randInt(r, 1, 3)
      const A = (-3 * (p + q)) / 2
      const B = 3 * p * q
      const terms: PolyTerm[] = [
        [1, 3],
        [A, 2],
        [B, 1],
      ]
      const localMin = polyEval(terms, q)
      const localMax = polyEval(terms, p)
      return {
        statement: `함수 $f(x)=${polyTex(terms)}$ 의 극솟값을 구하시오.`,
        steps: [
          { prompt: `$f'(x)=0$ 의 두 근 중 작은 값은? (극대가 되는 $x$)`, answer: p },
          { prompt: '두 근 중 큰 값은? (극소가 되는 $x$)', answer: q },
        ],
        final: { prompt: `극솟값 $f(${q})$ 의 값은?`, answer: localMin },
        solution: [
          `$f'(x)=${polyTex(polyDeriv(terms))}=3${linearFactor(p)}${linearFactor(q)}$`,
          `$x=${p}$ 에서 극대 $(${localMax})$, $x=${q}$ 에서 극소`,
          `$f(${q})=${localMin}$`,
        ],
        verify: () => polyEval(terms, q),
      }
    },
  },
  {
    id: 'max-min-closed',
    unit: '수2',
    topic: '미분',
    title: '닫힌구간에서의 최대·최소',
    difficulty: 3,
    gen: (r) => {
      const p = randInt(r, -3, 1)
      const q = p + 2 * randInt(r, 1, 2)
      const A = (-3 * (p + q)) / 2
      const B = 3 * p * q
      const terms: PolyTerm[] = [
        [1, 3],
        [A, 2],
        [B, 1],
      ]
      const L = p - randInt(r, 1, 2)
      const R = q + randInt(r, 1, 2)
      const candidates = [L, p, q, R]
      const values = candidates.map((x) => polyEval(terms, x))
      const max = Math.max(...values)
      return {
        statement: `닫힌구간 $[${L},\\, ${R}]$ 에서 함수 $f(x)=${polyTex(terms)}$ 의 최댓값을 구하시오.`,
        steps: [
          { prompt: `극댓값 $f(${p})$ 의 값은?`, answer: polyEval(terms, p) },
          { prompt: `오른쪽 끝 $f(${R})$ 의 값은?`, answer: polyEval(terms, R) },
        ],
        final: { prompt: '최댓값은?', answer: max },
        solution: [
          `$f'(x)=3${linearFactor(p)}${linearFactor(q)}$ 이므로 극점은 $x=${p},\\ ${q}$`,
          `$f(${L})=${polyEval(terms, L)}$, $f(${p})=${polyEval(terms, p)}$, $f(${q})=${polyEval(
            terms,
            q,
          )}$, $f(${R})=${polyEval(terms, R)}$`,
          `최댓값 $=${max}$`,
        ],
        verify: () => {
          let best = -Infinity
          for (let i = 0; i <= 4000; i++) {
            const x = L + ((R - L) * i) / 4000
            best = Math.max(best, polyEval(terms, x))
          }
          return best
        },
      }
    },
  },
  {
    id: 'velocity',
    unit: '수2',
    topic: '미분',
    title: '속도와 가속도',
    difficulty: 1,
    gen: (r) => {
      const A = randIntExcept(r, -6, 6, [0])
      const B = randIntExcept(r, -8, 8, [0])
      const t0 = randInt(r, 1, 4)
      const terms: PolyTerm[] = [
        [1, 3],
        [A, 2],
        [B, 1],
      ]
      const v = polyDeriv(terms)
      const acc = polyDeriv(v)
      return {
        statement: `수직선 위를 움직이는 점 P 의 시각 $t$ 에서의 위치가 $x(t)=${polyTex(
          terms,
          't',
        )}$ 일 때, $t=${t0}$ 에서의 가속도를 구하시오.`,
        steps: [
          { prompt: `속도 $v(t)=${polyTex(v, 't')}$ 이다. $v(${t0})$ 의 값은?`, answer: polyEval(v, t0) },
        ],
        final: { prompt: `가속도 $a(${t0})$ 의 값은?`, answer: polyEval(acc, t0) },
        solution: [
          `$v(t)=x'(t)=${polyTex(v, 't')}$, $v(${t0})=${polyEval(v, t0)}$`,
          `$a(t)=v'(t)=${polyTex(acc, 't')}$, $a(${t0})=${polyEval(acc, t0)}$`,
        ],
        verify: () => deriv((t) => polyEval(v, t), t0),
      }
    },
  },

  // ───────────── 수2 · 적분 ─────────────
  {
    id: 'definite-integral-poly',
    unit: '수2',
    topic: '적분',
    title: '다항함수의 정적분',
    difficulty: 2,
    gen: (r) => {
      // 원시함수의 계수가 정수가 되도록 3a', 2b' 꼴로 만든다
      const a2 = randInt(r, 1, 3)
      const b2 = randIntExcept(r, -3, 3, [0])
      const c = randInt(r, -4, 4)
      const lower = randInt(r, -2, 1)
      const upper = lower + randInt(r, 1, 3)
      const f: PolyTerm[] = [
        [3 * a2, 2],
        [2 * b2, 1],
        [c, 0],
      ]
      const F: PolyTerm[] = [
        [a2, 3],
        [b2, 2],
        [c, 1],
      ]
      const Fu = polyEval(F, upper)
      const Fl = polyEval(F, lower)
      return {
        statement: `$\\displaystyle\\int_{${lower}}^{${upper}} \\left(${polyTex(f)}\\right) dx$ 의 값을 구하시오.`,
        steps: [
          { prompt: `$F(x)=${polyTex(F)}$ 일 때 $F(${upper})$ 의 값은?`, answer: Fu },
          { prompt: `$F(${lower})$ 의 값은?`, answer: Fl },
        ],
        final: { prompt: `$F(${upper})-F(${lower})$ 의 값은?`, answer: Fu - Fl },
        solution: [
          `$F(x)=${polyTex(F)}$`,
          `$F(${upper})=${Fu}$, $F(${lower})=${Fl}$`,
          `정적분의 값 $=${Fu}-${paren(Fl)}=${Fu - Fl}$`,
        ],
        verify: () => simpson((x) => polyEval(f, x), lower, upper),
      }
    },
  },
  {
    id: 'area-between',
    unit: '수2',
    topic: '적분',
    title: '두 곡선 사이의 넓이',
    difficulty: 3,
    gen: (r) => {
      const k = randInt(r, 2, 6)
      const area = rat(k ** 3, 6)
      return {
        statement: `곡선 $y=x^{2}$ 과 직선 $y=${k}x$ 로 둘러싸인 부분의 넓이를 구하시오.`,
        steps: [
          { prompt: '두 그래프의 교점의 $x$ 좌표 중 큰 값은?', answer: k },
          {
            prompt: `넓이는 $\\displaystyle\\int_{0}^{${k}}(${k}x-x^{2})dx$ 이다. $\\dfrac{${k}x^{2}}{2}$ 에 $x=${k}$ 를 대입한 값은?`,
            answer: rat(k ** 3, 2),
          },
        ],
        final: { prompt: '넓이 $S$ 의 값은?', answer: area },
        solution: [
          `$x^2=${k}x$ 에서 $x=0$ 또는 $x=${k}$`,
          `$S=\\displaystyle\\int_0^{${k}}(${k}x-x^2)dx = \\left[\\dfrac{${k}x^2}{2}-\\dfrac{x^3}{3}\\right]_0^{${k}}$`,
          `$= ${ratTex(rat(k ** 3, 2))} - ${ratTex(rat(k ** 3, 3))} = ${ratTex(area)}$`,
        ],
        verify: () => simpson((x) => k * x - x * x, 0, k),
      }
    },
  },
  {
    id: 'integral-equation',
    unit: '수2',
    topic: '적분',
    title: '적분을 포함한 함수의 결정',
    difficulty: 3,
    gen: (r) => {
      const s = randInt(r, 1, 4)
      const a = 3 * s
      const k = 2 * s // k = ∫₀¹ f(t)dt
      return {
        statement: `모든 실수 $x$ 에 대하여 $f(x) = ${a}x^{2} + x\\displaystyle\\int_{0}^{1} f(t)\\,dt$ 를 만족시키는 함수 $f$ 에 대하여 $f(1)$ 의 값을 구하시오.`,
        steps: [
          {
            prompt: `$\\displaystyle\\int_{0}^{1}f(t)dt = k$ 로 놓으면 $f(t)=${a}t^{2}+kt$ 이다. $\\displaystyle\\int_{0}^{1}${a}t^{2}dt$ 의 값은?`,
            answer: s,
          },
          { prompt: `$k = ${s} + \\dfrac{k}{2}$ 에서 $k$ 의 값은?`, answer: k },
        ],
        final: { prompt: `$f(1)$ 의 값은?`, answer: a + k },
        solution: [
          `$k=\\displaystyle\\int_0^1(${a}t^2+kt)dt = ${s} + \\dfrac{k}{2}$`,
          `$\\dfrac{k}{2}=${s}$ 이므로 $k=${k}$, 즉 $f(x)=${a}x^2+${k}x$`,
          `$f(1)=${a}+${k}=${a + k}$`,
        ],
        verify: () => a + simpson((t) => a * t * t + k * t, 0, 1),
      }
    },
  },
  {
    id: 'integral-upper-limit',
    unit: '수2',
    topic: '적분',
    title: '적분과 미분의 관계',
    difficulty: 2,
    gen: (r) => {
      const A = randIntExcept(r, -4, 4, [0])
      const B = randIntExcept(r, -5, 5, [0])
      const C = -(1 + A + B)
      const t0 = randInt(r, 2, 4)
      const G: PolyTerm[] = [
        [1, 3],
        [A, 2],
        [B, 1],
        [C, 0],
      ]
      const f = polyDeriv(G)
      return {
        statement: `함수 $f$ 가 모든 실수 $x$ 에 대하여 $\\displaystyle\\int_{1}^{x} f(t)\\,dt = ${polyTex(
          G,
        )}$ 를 만족시킬 때 $f(${t0})$ 의 값을 구하시오.`,
        steps: [
          {
            prompt: `양변을 $x$ 에 대하여 미분하면 $f(x)=3x^{2}+\\square x ${addConst(B)}$ 이다. $\\square$ 의 값은?`,
            answer: 2 * A,
          },
        ],
        final: { prompt: `$f(${t0})$ 의 값은?`, answer: polyEval(f, t0) },
        solution: [
          `양변을 미분하면 $f(x)=${polyTex(f)}$`,
          `$f(${t0})=${polyEval(f, t0)}$`,
        ],
        verify: () => deriv((x) => polyEval(G, x), t0),
      }
    },
  },

  // ───────────── 미적분 ─────────────
  {
    id: 'seq-limit',
    unit: '미적분',
    topic: '수열의 극한과 급수',
    title: '수열의 극한',
    difficulty: 1,
    gen: (r) => {
      const a = randInt(r, 1, 6)
      const b = randIntExcept(r, -5, 5, [0])
      const c = randInt(r, 1, 6)
      const d = randIntExcept(r, -5, 5, [0])
      const ans = rat(a, c)
      return {
        statement: `$\\displaystyle\\lim_{n\\to\\infty} \\dfrac{${polyTex(
          [
            [a, 2],
            [b, 1],
          ],
          'n',
        )}}{${polyTex(
          [
            [c, 2],
            [d, 1],
          ],
          'n',
        )}}$ 의 값을 구하시오.`,
        steps: [
          { prompt: '분모·분자의 최고차항의 계수는 각각 얼마인가? (분자의 계수)', answer: a },
          { prompt: '분모의 최고차항의 계수는?', answer: c },
        ],
        final: { prompt: '극한값은?', answer: ans },
        solution: [
          `분모·분자를 $n^2$ 으로 나누면 $\\dfrac{${a}+\\frac{${b}}{n}}{${c}+\\frac{${d}}{n}}$`,
          `$n\\to\\infty$ 이면 $\\dfrac{${a}}{${c}}=${ratTex(ans)}$`,
        ],
        verify: () => {
          const n = 1e7
          return (a * n * n + b * n) / (c * n * n + d * n)
        },
      }
    },
  },
  {
    id: 'geo-series',
    unit: '미적분',
    topic: '수열의 극한과 급수',
    title: '등비급수의 합',
    difficulty: 2,
    gen: (r) => {
      const a = randInt(r, 1, 6)
      const q = randInt(r, 2, 5)
      const num = pick(
        r,
        [1, -1, 2, -2].filter((v) => Math.abs(v) < q),
      )
      const ratio = rat(num, q)
      const oneMinus = rat(q - num, q)
      const sum = rat(a * q, q - num)
      return {
        statement: `등비급수 $\\displaystyle\\sum_{n=1}^{\\infty} ${coefTerm(a, '')}\\left(${ratTex(
          ratio,
        )}\\right)^{n-1}$ 의 합을 구하시오.`,
        steps: [{ prompt: `$1-r$ 의 값은?`, answer: oneMinus }],
        final: { prompt: `$\\dfrac{a}{1-r}$ 의 값은?`, answer: sum },
        solution: [
          `$|r|=\\left|${ratTex(ratio)}\\right|<1$ 이므로 수렴한다.`,
          `$S=\\dfrac{${a}}{1-${ratParen(ratio)}} = \\dfrac{${a}}{${ratTex(oneMinus)}} = ${ratTex(sum)}$`,
        ],
        verify: () => sumRange((n) => a * ratNum(ratio) ** (n - 1), 1, 400),
      }
    },
  },
  {
    id: 'trig-limit',
    unit: '미적분',
    topic: '삼각함수의 극한',
    title: '삼각함수의 극한',
    difficulty: 2,
    gen: (r) => {
      const a = randInt(r, 1, 5)
      const b = randIntExcept(r, 1, 5, [a])
      const ax = coefTerm(a, 'x')
      const bx = coefTerm(b, 'x')
      if (coin(r)) {
        const ans = rat(a, b)
        return {
          statement: `$\\displaystyle\\lim_{x\\to 0} \\dfrac{\\sin ${ax}}{\\sin ${bx}}$ 의 값을 구하시오.`,
          steps: [
            {
              prompt: `분모·분자를 $x$ 로 나눌 때 $\\displaystyle\\lim_{x\\to0}\\dfrac{\\sin ${ax}}{x}$ 의 값은?`,
              answer: a,
            },
            { prompt: `$\\displaystyle\\lim_{x\\to0}\\dfrac{\\sin ${bx}}{x}$ 의 값은?`, answer: b },
          ],
          final: { prompt: '극한값은?', answer: ans },
          solution: [
            `$\\dfrac{\\sin ${ax}}{x}=${a}\\cdot\\dfrac{\\sin ${ax}}{${ax}}\\to ${a}$`,
            `$\\dfrac{\\sin ${bx}}{x}\\to ${b}$ 이므로 극한값은 $${ratTex(ans)}$`,
          ],
          verify: () => limitAt((x) => Math.sin(a * x) / Math.sin(b * x), 0, 1e-5),
        }
      }
      const ans = rat(a * a, 2)
      return {
        statement: `$\\displaystyle\\lim_{x\\to 0} \\dfrac{1-\\cos ${ax}}{x^{2}}$ 의 값을 구하시오.`,
        steps: [
          {
            prompt: `$1-\\cos ${ax} = \\dfrac{\\sin^{2} ${ax}}{1+\\cos ${ax}}$ 이다. $x\\to0$ 일 때 $1+\\cos ${ax}$ 의 값은?`,
            answer: 2,
          },
          {
            prompt: `$\\displaystyle\\lim_{x\\to0}\\dfrac{\\sin^{2} ${ax}}{x^{2}}$ 의 값은?`,
            answer: a * a,
          },
        ],
        final: { prompt: '극한값은?', answer: ans },
        solution: [
          `$\\dfrac{1-\\cos ${ax}}{x^2} = \\dfrac{\\sin^2 ${ax}}{x^2(1+\\cos ${ax})}$`,
          `$\\to \\dfrac{${a * a}}{2} = ${ratTex(ans)}$`,
        ],
        verify: () => limitAt((x) => (1 - Math.cos(a * x)) / (x * x), 0, 1e-4),
      }
    },
  },
  {
    id: 'exp-log-limit',
    unit: '미적분',
    topic: '지수·로그함수의 극한',
    title: '지수·로그함수의 극한',
    difficulty: 2,
    gen: (r) => {
      const a = randInt(r, 1, 5)
      const b = randIntExcept(r, 1, 5, [a])
      const ax = coefTerm(a, 'x')
      const bx = coefTerm(b, 'x')
      const ans = rat(a, b)
      const useExp = coin(r)
      const expr = useExp
        ? `\\dfrac{e^{${ax}}-1}{\\ln(1+${bx})}`
        : `\\dfrac{\\ln(1+${ax})}{${bx}}`
      return {
        statement: `$\\displaystyle\\lim_{x\\to 0} ${expr}$ 의 값을 구하시오.`,
        steps: useExp
          ? [
              { prompt: `$\\displaystyle\\lim_{x\\to0}\\dfrac{e^{${ax}}-1}{x}$ 의 값은?`, answer: a },
              { prompt: `$\\displaystyle\\lim_{x\\to0}\\dfrac{\\ln(1+${bx})}{x}$ 의 값은?`, answer: b },
            ]
          : [{ prompt: `$\\displaystyle\\lim_{x\\to0}\\dfrac{\\ln(1+${ax})}{x}$ 의 값은?`, answer: a }],
        final: { prompt: '극한값은?', answer: ans },
        solution: useExp
          ? [
              `$\\dfrac{e^{${ax}}-1}{x}\\to${a}$, $\\dfrac{\\ln(1+${bx})}{x}\\to${b}$`,
              `따라서 극한값은 $${ratTex(ans)}$`,
            ]
          : [`$\\dfrac{\\ln(1+${ax})}{x}\\to${a}$ 이므로 $\\dfrac{${a}}{${b}}=${ratTex(ans)}$`],
        verify: () =>
          limitAt(
            (x) =>
              useExp
                ? (Math.exp(a * x) - 1) / Math.log(1 + b * x)
                : Math.log(1 + a * x) / (b * x),
            0,
            1e-5,
          ),
      }
    },
  },
  {
    id: 'chain-rule',
    unit: '미적분',
    topic: '여러 가지 미분법',
    title: '합성함수의 미분법',
    difficulty: 2,
    gen: (r) => {
      const a = randInt(r, 1, 5)
      const n = pick(r, [2, 3])
      const x0 = randIntExcept(r, -3, 3, [0])
      const inner = x0 * x0 + a
      const val = n * inner ** (n - 1) * 2 * x0
      return {
        statement: `$f(x)=(x^{2}+${a})^{${n}}$ 일 때 $f'(${x0})$ 의 값을 구하시오.`,
        steps: [{ prompt: `$x=${x0}$ 일 때 속함수 $x^{2}+${a}$ 의 값은?`, answer: inner }],
        final: { prompt: `$f'(x)=${n}(x^{2}+${a})^{${n - 1}}\\cdot 2x$ 에 대입한 값은?`, answer: val },
        solution: [
          `$f'(x)=${n}(x^2+${a})^{${n - 1}}\\times 2x$`,
          `$f'(${x0})=${n}\\times${inner}^{${n - 1}}\\times 2\\times${paren(x0)}=${val}$`,
        ],
        verify: () => deriv((x) => (x * x + a) ** n, x0),
      }
    },
  },
  {
    id: 'quotient-rule',
    unit: '미적분',
    topic: '여러 가지 미분법',
    title: '몫의 미분법',
    difficulty: 2,
    gen: (r) => {
      const p = randIntExcept(r, -4, 4, [0])
      const q = randInt(r, -4, 4)
      const a = randInt(r, 1, 5)
      const x0 = randInt(r, 1, 3)
      const g = x0 * x0 + a
      const numer = -p * x0 * x0 - 2 * q * x0 + p * a
      const ans = rat(numer, g * g)
      return {
        statement: `$f(x)=\\dfrac{${polyTex([
          [p, 1],
          [q, 0],
        ])}}{x^{2}+${a}}$ 일 때 $f'(${x0})$ 의 값을 구하시오.`,
        steps: [
          { prompt: `분모 $(x^{2}+${a})^{2}$ 에 $x=${x0}$ 을 대입한 값은?`, answer: g * g },
          {
            prompt: `분자 $${p}(x^{2}+${a}) - (${polyTex([
              [p, 1],
              [q, 0],
            ])})\\cdot 2x$ 에 $x=${x0}$ 을 대입한 값은?`,
            answer: numer,
          },
        ],
        final: { prompt: `$f'(${x0})$ 의 값은?`, answer: ans },
        solution: [
          `$f'(x)=\\dfrac{${p}(x^2+${a})-(${polyTex([
            [p, 1],
            [q, 0],
          ])})\\cdot 2x}{(x^2+${a})^2}$`,
          `$f'(${x0})=\\dfrac{${numer}}{${g * g}}=${ratTex(ans)}$`,
        ],
        verify: () => deriv((x) => (p * x + q) / (x * x + a), x0),
      }
    },
  },
  {
    id: 'exp-derivative',
    unit: '미적분',
    topic: '여러 가지 미분법',
    title: '지수함수의 미분 (곱의 미분법)',
    difficulty: 2,
    gen: (r) => {
      const a = randIntExcept(r, -5, 5, [0])
      return {
        statement: `$f(x)=(x^{2}${addTerm(a, 'x')})e^{x}$ 일 때 $f'(1)=ke$ 를 만족시키는 상수 $k$ 의 값을 구하시오.`,
        steps: [
          {
            prompt: `$f'(x)=\\left(x^{2}+\\square x ${addConst(a)}\\right)e^{x}$ 이다. $\\square$ 의 값은?`,
            answer: a + 2,
          },
        ],
        final: { prompt: `$k$ 의 값은?`, answer: 2 * a + 3 },
        solution: [
          `$f'(x)=(2x${addConst(a)})e^x+(x^2${addTerm(a, 'x')})e^x = (x^2${addTerm(a + 2, 'x')}${addConst(a)})e^x$`,
          `$f'(1)=(1${addConst(a + 2)}${addConst(a)})e=${2 * a + 3}e$ 이므로 $k=${2 * a + 3}$`,
        ],
        verify: () => deriv((x) => (x * x + a * x) * Math.exp(x), 1) / Math.E,
      }
    },
  },
  {
    id: 'log-derivative',
    unit: '미적분',
    topic: '여러 가지 미분법',
    title: '로그함수의 미분',
    difficulty: 2,
    gen: (r) => {
      const a = randInt(r, 1, 6)
      const x0 = randInt(r, 1, 4)
      const inner = x0 * x0 + a
      const ans = rat(2 * x0, inner)
      return {
        statement: `$f(x)=\\ln(x^{2}+${a})$ 일 때 $f'(${x0})$ 의 값을 구하시오.`,
        steps: [{ prompt: `$x=${x0}$ 일 때 $x^{2}+${a}$ 의 값은?`, answer: inner }],
        final: { prompt: `$f'(x)=\\dfrac{2x}{x^{2}+${a}}$ 에 대입한 값은?`, answer: ans },
        solution: [
          `$f'(x)=\\dfrac{2x}{x^2+${a}}$`,
          `$f'(${x0})=\\dfrac{${2 * x0}}{${inner}}=${ratTex(ans)}$`,
        ],
        verify: () => deriv((x) => Math.log(x * x + a), x0),
      }
    },
  },
  {
    id: 'inverse-derivative',
    unit: '미적분',
    topic: '여러 가지 미분법',
    title: '역함수의 미분법',
    difficulty: 3,
    gen: (r) => {
      const p = randInt(r, 1, 5)
      const q = randInt(r, -3, 3)
      const a = randInt(r, 1, 3)
      const terms: PolyTerm[] = [
        [1, 3],
        [p, 1],
        [q, 0],
      ]
      const b = polyEval(terms, a)
      const fp = polyEval(polyDeriv(terms), a)
      const ans = rat(1, fp)
      return {
        statement: `함수 $f(x)=${polyTex(terms)}$ 의 역함수를 $g$ 라 할 때 $g'(${b})$ 의 값을 구하시오.`,
        steps: [
          { prompt: `$f(x)=${b}$ 를 만족시키는 $x$ 의 값은?`, answer: a },
          { prompt: `$f'(${a})$ 의 값은?`, answer: fp },
        ],
        final: { prompt: `$g'(${b})=\\dfrac{1}{f'(${a})}$ 의 값은?`, answer: ans },
        solution: [
          `$f(${a})=${b}$ 이므로 $g(${b})=${a}$`,
          `$f'(x)=${polyTex(polyDeriv(terms))}$, $f'(${a})=${fp}$`,
          `$g'(${b})=\\dfrac{1}{${fp}}=${ratTex(ans)}$`,
        ],
        verify: () => 1 / deriv((x) => polyEval(terms, x), a),
      }
    },
  },
  {
    id: 'substitution-integral',
    unit: '미적분',
    topic: '여러 가지 적분법',
    title: '치환적분',
    difficulty: 3,
    gen: (r) => {
      const n = randInt(r, 1, 3)
      const ans = rat(2 ** (n + 1) - 1, 2 * (n + 1))
      return {
        statement: `$\\displaystyle\\int_{0}^{1} x(x^{2}+1)^{${n}}\\,dx$ 의 값을 구하시오.`,
        steps: [
          {
            prompt: `$t=x^{2}+1$ 로 치환하면 $dt=2x\\,dx$ 이다. $x=1$ 일 때 $t$ 의 값은?`,
            answer: 2,
          },
          {
            prompt: `$\\dfrac{1}{2}\\displaystyle\\int_{1}^{2} t^{${n}}dt = \\left[\\dfrac{t^{${
              n + 1
            }}}{${2 * (n + 1)}}\\right]_{1}^{2}$ 이다. $t=2$ 를 대입한 값은?`,
            answer: rat(2 ** (n + 1), 2 * (n + 1)),
          },
        ],
        final: { prompt: '정적분의 값은?', answer: ans },
        solution: [
          `$t=x^2+1$ 로 치환하면 적분은 $\\dfrac{1}{2}\\displaystyle\\int_1^2 t^{${n}}dt$`,
          `$=\\left[\\dfrac{t^{${n + 1}}}{${2 * (n + 1)}}\\right]_1^2 = ${ratTex(ans)}$`,
        ],
        verify: () => simpson((x) => x * (x * x + 1) ** n, 0, 1),
      }
    },
  },
  {
    id: 'parts-integral',
    unit: '미적분',
    topic: '여러 가지 적분법',
    title: '부분적분',
    difficulty: 3,
    gen: (r) => {
      const a = randInt(r, 2, 5)
      const kind = randInt(r, 0, 2)
      if (kind === 0) {
        return {
          statement: `$${a}\\displaystyle\\int_{0}^{1} xe^{x}\\,dx$ 의 값을 구하시오.`,
          steps: [
            { prompt: `$\\left[xe^{x}\\right]_{0}^{1} = ke$ 일 때 $k$ 의 값은?`, answer: 1 },
            {
              prompt: `$\\displaystyle\\int_{0}^{1}e^{x}dx = e-\\square$ 일 때 $\\square$ 의 값은?`,
              answer: 1,
            },
          ],
          final: { prompt: `정적분 전체의 값은? (상수 $${a}$ 를 잊지 마세요)`, answer: a },
          solution: [
            `$\\displaystyle\\int_0^1 xe^x dx = \\left[xe^x\\right]_0^1 - \\int_0^1 e^x dx = e-(e-1) = 1$`,
            `$${a}\\times 1 = ${a}$`,
          ],
          verify: () => simpson((x) => a * x * Math.exp(x), 0, 1),
        }
      }
      if (kind === 1) {
        return {
          statement: `$\\displaystyle\\int_{1}^{e} ${a}\\ln x\\,dx$ 의 값을 구하시오.`,
          steps: [
            {
              prompt: `$\\displaystyle\\int \\ln x\\,dx = x\\ln x - x$ 이다. $x=e$ 를 대입한 값은?`,
              answer: 0,
            },
            { prompt: `$x=1$ 을 대입한 값은?`, answer: -1 },
          ],
          final: { prompt: '정적분의 값은?', answer: a },
          solution: [
            `$\\displaystyle\\int_1^e ${a}\\ln x\\,dx = ${a}\\left[x\\ln x-x\\right]_1^e$`,
            `$= ${a}\\{0-(-1)\\} = ${a}$`,
          ],
          verify: () => simpson((x) => a * Math.log(x), 1, Math.E),
        }
      }
      return {
        statement: `$\\displaystyle\\int_{0}^{\\pi} ${a}x\\sin x\\,dx$ 의 값을 구하시오. (답은 $\\pi$ 의 계수만 입력)`,
        steps: [
          {
            prompt: `$\\displaystyle\\int x\\sin x\\,dx = -x\\cos x + \\sin x$ 이다. $x=\\pi$ 를 대입한 값의 $\\pi$ 계수는?`,
            answer: 1,
          },
          { prompt: `$x=0$ 을 대입한 값은?`, answer: 0 },
        ],
        final: { prompt: `정적분의 값의 $\\pi$ 계수는?`, answer: a },
        solution: [
          `$\\displaystyle\\int_0^{\\pi} ${a}x\\sin x\\,dx = ${a}\\left[-x\\cos x+\\sin x\\right]_0^{\\pi}$`,
          `$= ${a}\\{\\pi - 0\\} = ${coefTerm(a, '\\pi')}$`,
        ],
        verify: () => simpson((x) => a * x * Math.sin(x), 0, Math.PI) / Math.PI,
      }
    },
  },
  {
    id: 'trig-def-integral',
    unit: '미적분',
    topic: '여러 가지 적분법',
    title: '삼각함수의 정적분',
    difficulty: 2,
    gen: (r) => {
      const item = pick(r, [
        {
          f: '\\sec^{2} x',
          lo: '0',
          hi: '\\frac{\\pi}{4}',
          anti: '\\tan x',
          loV: rat(0),
          hiV: rat(1),
          fn: (x: number) => 1 / Math.cos(x) ** 2,
          a: 0,
          b: Math.PI / 4,
        },
        {
          f: '\\cos x',
          lo: '0',
          hi: '\\frac{\\pi}{2}',
          anti: '\\sin x',
          loV: rat(0),
          hiV: rat(1),
          fn: (x: number) => Math.cos(x),
          a: 0,
          b: Math.PI / 2,
        },
        {
          f: '\\cos x',
          lo: '0',
          hi: '\\frac{\\pi}{6}',
          anti: '\\sin x',
          loV: rat(0),
          hiV: rat(1, 2),
          fn: (x: number) => Math.cos(x),
          a: 0,
          b: Math.PI / 6,
        },
        {
          f: '\\sin x',
          lo: '0',
          hi: '\\frac{\\pi}{3}',
          anti: '-\\cos x',
          loV: rat(-1),
          hiV: rat(-1, 2),
          fn: (x: number) => Math.sin(x),
          a: 0,
          b: Math.PI / 3,
        },
        {
          f: '\\csc^{2} x',
          lo: '\\frac{\\pi}{4}',
          hi: '\\frac{\\pi}{2}',
          anti: '-\\cot x',
          loV: rat(-1),
          hiV: rat(0),
          fn: (x: number) => 1 / Math.sin(x) ** 2,
          a: Math.PI / 4,
          b: Math.PI / 2,
        },
      ])
      const k = randInt(r, 1, 4)
      const diff = rat(item.hiV.n * item.loV.d - item.loV.n * item.hiV.d, item.hiV.d * item.loV.d)
      const ans = rat(k * diff.n, diff.d)
      return {
        statement: `$\\displaystyle\\int_{${item.lo}}^{${item.hi}} ${coefTerm(k, item.f)}\\,dx$ 의 값을 구하시오.`,
        steps: [
          { prompt: `원시함수 $F(x)=${item.anti}$ 에 $x=${item.hi}$ 를 대입한 값은?`, answer: item.hiV },
          { prompt: `$x=${item.lo}$ 를 대입한 값은?`, answer: item.loV },
        ],
        final: { prompt: `정적분의 값은? (상수 $${k}$ 를 곱하는 것을 잊지 마세요)`, answer: ans },
        solution: [
          `$\\displaystyle\\int ${item.f}dx = ${item.anti}$`,
          `$${k}\\left(${ratTex(item.hiV)} - ${paren(ratNum(item.loV))}\\right) = ${ratTex(ans)}$`,
        ],
        verify: () => simpson((x) => k * item.fn(x), item.a, item.b),
      }
    },
  },
]

export const PROBLEM_GENERATORS = GENERATORS

export function generatorsForScope(scope: Set<Unit>): ProblemGenerator[] {
  return GENERATORS.filter((g) => scope.has(g.unit))
}
