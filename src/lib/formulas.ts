import type { Unit } from './types'

export interface BlankPart {
  blank: string
  answer: string[]
}
export type Part = string | BlankPart

export interface FormulaCard {
  kind: 'formula'
  id: string
  unit: Unit
  topic: string
  title: string
  lines: Part[][]
  note?: string
}

export interface TableCell {
  tex?: string
  blank?: string
  answer?: string[]
}
export interface FormulaTable {
  kind: 'table'
  id: string
  unit: Unit
  topic: string
  title: string
  headers: string[]
  rows: { label: string; cells: TableCell[] }[]
  note?: string
}

export type FormulaEntry = FormulaCard | FormulaTable

export function isBlank(p: Part): p is BlankPart {
  return typeof p !== 'string'
}

function b(id: string, answer: string[]): BlankPart {
  return { blank: id, answer }
}

let uid = 0
function nb(answer: string[]): BlankPart {
  uid += 1
  return b(`bk${uid}`, answer)
}

export const FORMULAS: FormulaEntry[] = [
  // ───────────────────────── 수1 · 지수와 로그 ─────────────────────────
  {
    kind: 'table',
    id: 'exp-log-1',
    unit: '수1',
    topic: '지수와 로그',
    title: '거듭제곱근의 뜻과 성질 (a의 n제곱근)',
    note: '$n$은 2 이상의 자연수',
    headers: ['a>0', 'a=0', 'a<0'],
    rows: [
      {
        label: 'n이 짝수',
        cells: [
          { blank: 't1', answer: ['\\pm\\sqrt[n]{a}', '\\sqrt[n]{a},-\\sqrt[n]{a}'] },
          { blank: 't2', answer: ['0'] },
          { blank: 't3', answer: ['없다', 'x'] },
        ],
      },
      {
        label: 'n이 홀수',
        cells: [
          { blank: 't4', answer: ['\\sqrt[n]{a}'] },
          { blank: 't5', answer: ['0'] },
          { blank: 't6', answer: ['\\sqrt[n]{a}'] },
        ],
      },
    ],
  },
  {
    kind: 'formula',
    id: 'exp-log-2',
    unit: '수1',
    topic: '지수와 로그',
    title: '지수법칙의 확장 (정수·유리수 지수)',
    note: '$a>0$, $m,n$은 정수 ($n\\ge2$)',
    lines: [
      ['a^0 = ', nb(['1'])],
      ['a^{-n} = ', nb(['\\frac{1}{a^n}', '1/a^n'])],
      ['a^{\\frac{m}{n}} = ', nb(['\\sqrt[n]{a^m}'])],
      ['a^{\\frac{1}{n}} = ', nb(['\\sqrt[n]{a}'])],
    ],
  },
  {
    kind: 'formula',
    id: 'exp-log-3',
    unit: '수1',
    topic: '지수와 로그',
    title: '로그의 정의',
    note: '$a>0, a\\ne1, N>0$',
    lines: [['\\log_a N = x \\iff ', nb(['a^x=n', 'a^x=N'])]],
  },
  {
    kind: 'formula',
    id: 'exp-log-4',
    unit: '수1',
    topic: '지수와 로그',
    title: '로그의 성질 (곱·몫·거듭제곱)',
    note: '$a>0, a\\ne1, M>0, N>0$',
    lines: [
      ['\\log_a MN = ', nb(['\\log_am+\\log_an', '\\log_aM+\\log_aN'])],
      ['\\log_a \\frac{M}{N} = ', nb(['\\log_am-\\log_an', '\\log_aM-\\log_aN'])],
      ['\\log_a M^k = ', nb(['k\\log_am', 'k\\log_aM'])],
    ],
  },
  {
    kind: 'formula',
    id: 'exp-log-5',
    unit: '수1',
    topic: '지수와 로그',
    title: '로그의 밑의 변환',
    note: '$a,b,c>0, a\\ne1, c\\ne1$',
    lines: [
      ['\\log_a b = ', nb(['\\frac{\\log_cb}{\\log_ca}', '\\log_cb/\\log_ca'])],
      ['\\log_a b = ', nb(['\\frac{1}{\\log_ba}', '1/\\log_ba'])],
    ],
  },
  {
    kind: 'formula',
    id: 'exp-log-6',
    unit: '수1',
    topic: '지수와 로그',
    title: '로그의 기본값',
    note: '$a>0, a\\ne1$',
    lines: [
      ['\\log_a a = ', nb(['1'])],
      ['\\log_a 1 = ', nb(['0'])],
      ['a^{\\log_a N} = ', nb(['n', 'N'])],
    ],
  },

  // ───────────────────────── 수1 · 삼각함수 ─────────────────────────
  {
    kind: 'formula',
    id: 'trig-1',
    unit: '수1',
    topic: '삼각함수',
    title: '호도법과 부채꼴의 호의 길이·넓이',
    note: '반지름 $r$, 중심각 $\\theta$(라디안)',
    lines: [
      ['l = ', nb(['r\\theta'])],
      ['S = ', nb(['\\frac{1}{2}r^2\\theta', '\\frac12r^2\\theta'])],
      ['S = ', nb(['\\frac{1}{2}rl', '\\frac12rl'])],
    ],
  },
  {
    kind: 'formula',
    id: 'trig-2',
    unit: '수1',
    topic: '삼각함수',
    title: '삼각함수 사이의 관계',
    lines: [
      ['\\sin^2\\theta + \\cos^2\\theta = ', nb(['1'])],
      ['\\tan\\theta = ', nb(['\\frac{\\sin\\theta}{\\cos\\theta}', '\\sin\\theta/\\cos\\theta'])],
    ],
  },
  {
    kind: 'formula',
    id: 'trig-3',
    unit: '수1',
    topic: '삼각함수',
    title: '각의 변환 — 음각 공식',
    lines: [
      ['\\sin(-\\theta) = ', nb(['-\\sin\\theta'])],
      ['\\cos(-\\theta) = ', nb(['\\cos\\theta'])],
      ['\\tan(-\\theta) = ', nb(['-\\tan\\theta'])],
    ],
  },
  {
    kind: 'formula',
    id: 'trig-4',
    unit: '수1',
    topic: '삼각함수',
    title: '각의 변환 — $\\frac{\\pi}{2} \\pm \\theta$',
    lines: [
      ['\\sin\\left(\\frac{\\pi}{2}-\\theta\\right) = ', nb(['\\cos\\theta'])],
      ['\\cos\\left(\\frac{\\pi}{2}-\\theta\\right) = ', nb(['\\sin\\theta'])],
      ['\\sin\\left(\\frac{\\pi}{2}+\\theta\\right) = ', nb(['\\cos\\theta'])],
      ['\\cos\\left(\\frac{\\pi}{2}+\\theta\\right) = ', nb(['-\\sin\\theta'])],
    ],
  },
  {
    kind: 'formula',
    id: 'trig-5',
    unit: '수1',
    topic: '삼각함수',
    title: '각의 변환 — \\pi \\pm \\theta',
    lines: [
      ['\\sin(\\pi-\\theta) = ', nb(['\\sin\\theta'])],
      ['\\cos(\\pi-\\theta) = ', nb(['-\\cos\\theta'])],
      ['\\tan(\\pi-\\theta) = ', nb(['-\\tan\\theta'])],
      ['\\sin(\\pi+\\theta) = ', nb(['-\\sin\\theta'])],
      ['\\cos(\\pi+\\theta) = ', nb(['-\\cos\\theta'])],
      ['\\tan(\\pi+\\theta) = ', nb(['\\tan\\theta'])],
    ],
  },
  {
    kind: 'formula',
    id: 'trig-6',
    unit: '수1',
    topic: '삼각함수',
    title: '사인법칙',
    note: '외접원의 반지름 $R$',
    lines: [
      [
        '\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C} = ',
        nb(['2r', '2R']),
      ],
    ],
  },
  {
    kind: 'formula',
    id: 'trig-7',
    unit: '수1',
    topic: '삼각함수',
    title: '코사인법칙',
    lines: [
      ['a^2 = ', nb(['b^2+c^2-2bc\\cos A', 'b^2+c^2-2bc\\cos{a}'])],
      [
        '\\cos A = ',
        nb(['\\frac{b^2+c^2-a^2}{2bc}', '(b^2+c^2-a^2)/2bc']),
      ],
    ],
  },
  {
    kind: 'formula',
    id: 'trig-8',
    unit: '수1',
    topic: '삼각함수',
    title: '삼각형의 넓이',
    lines: [
      ['S = ', nb(['\\frac{1}{2}ab\\sin C', '\\frac12ab\\sin C'])],
    ],
  },

  // ───────────────────────── 수1 · 수열 ─────────────────────────
  {
    kind: 'formula',
    id: 'seq-1',
    unit: '수1',
    topic: '수열',
    title: '등차수열의 일반항',
    note: '첫째항 $a$, 공차 $d$',
    lines: [['a_n = ', nb(['a+(n-1)d'])]],
  },
  {
    kind: 'formula',
    id: 'seq-2',
    unit: '수1',
    topic: '수열',
    title: '등차수열의 합',
    lines: [
      ['S_n = ', nb(['\\frac{n\\{2a+(n-1)d\\}}{2}', '\\frac{n(2a+(n-1)d)}{2}'])],
      ['S_n = ', nb(['\\frac{n(a+l)}{2}'])],
    ],
  },
  {
    kind: 'formula',
    id: 'seq-3',
    unit: '수1',
    topic: '수열',
    title: '등비수열의 일반항',
    note: '첫째항 $a$, 공비 $r$',
    lines: [['a_n = ', nb(['ar^{n-1}'])]],
  },
  {
    kind: 'formula',
    id: 'seq-4',
    unit: '수1',
    topic: '수열',
    title: '등비수열의 합',
    note: '$r\\ne1$',
    lines: [
      ['S_n = ', nb(['\\frac{a(r^n-1)}{r-1}', '\\frac{a(1-r^n)}{1-r}'])],
    ],
  },
  {
    kind: 'formula',
    id: 'seq-5',
    unit: '수1',
    topic: '수열',
    title: '자연수의 거듭제곱의 합 ($\\Sigma$ 공식)',
    lines: [
      ['\\sum_{k=1}^{n} k = ', nb(['\\frac{n(n+1)}{2}'])],
      ['\\sum_{k=1}^{n} k^2 = ', nb(['\\frac{n(n+1)(2n+1)}{6}'])],
      [
        '\\sum_{k=1}^{n} k^3 = ',
        nb(['\\left\\{\\frac{n(n+1)}{2}\\right\\}^2', '\\left(\\frac{n(n+1)}{2}\\right)^2']),
      ],
    ],
  },

  // ───────────────────────── 수2 · 함수의 극한과 연속 ─────────────────────────
  {
    kind: 'formula',
    id: 'lim-1',
    unit: '수2',
    topic: '함수의 극한과 연속',
    title: '함수의 극한의 성질',
    note: '$\\lim f(x)=L$, $\\lim g(x)=M$ (실수)',
    lines: [
      ['\\lim_{x\\to a}\\{f(x)+g(x)\\} = ', nb(['l+m', 'L+M'])],
      ['\\lim_{x\\to a}f(x)g(x) = ', nb(['lm', 'LM'])],
      [
        '\\lim_{x\\to a}\\frac{f(x)}{g(x)} = ',
        nb(['\\frac{l}{m}', 'L/M', '\\frac{L}{M}']),
      ],
    ],
  },
  {
    kind: 'formula',
    id: 'lim-2',
    unit: '수2',
    topic: '함수의 극한과 연속',
    title: '미분계수와 극한의 관계 (핵심 꼴)',
    lines: [
      [
        'f\'(a) = ',
        nb(['\\lim_{h\\to0}\\frac{f(a+h)-f(a)}{h}']),
      ],
    ],
  },

  // ───────────────────────── 수2 · 미분 ─────────────────────────
  {
    kind: 'formula',
    id: 'diff-1',
    unit: '수2',
    topic: '미분',
    title: '미분계수의 정의',
    lines: [
      [
        'f\'(a) = ',
        nb([
          '\\lim_{h\\to0}\\frac{f(a+h)-f(a)}{h}',
          '\\lim_{x\\to a}\\frac{f(x)-f(a)}{x-a}',
        ]),
      ],
    ],
  },
  {
    kind: 'formula',
    id: 'diff-2',
    unit: '수2',
    topic: '미분',
    title: '도함수의 정의',
    lines: [
      ['f\'(x) = ', nb(['\\lim_{h\\to0}\\frac{f(x+h)-f(x)}{h}'])],
    ],
  },
  {
    kind: 'formula',
    id: 'diff-3',
    unit: '수2',
    topic: '미분',
    title: '다항함수의 미분법',
    note: '$n$은 양의 정수, $c$는 상수',
    lines: [
      ['(x^n)\' = ', nb(['nx^{n-1}'])],
      ['(c)\' = ', nb(['0'])],
    ],
  },
  {
    kind: 'formula',
    id: 'diff-4',
    unit: '수2',
    topic: '미분',
    title: '접선의 방정식',
    note: '곡선 $y=f(x)$ 위의 점 $(a,f(a))$에서의 접선',
    lines: [['y - f(a) = ', nb(['f\'(a)(x-a)'])]],
  },

  // ───────────────────────── 수2 · 적분 ─────────────────────────
  {
    kind: 'formula',
    id: 'int-1',
    unit: '수2',
    topic: '적분',
    title: '다항함수의 부정적분',
    note: '$n$은 0 또는 양의 정수, $C$는 적분상수',
    lines: [
      ['\\int x^n\\,dx = ', nb(['\\frac{1}{n+1}x^{n+1}+c', '\\frac{x^{n+1}}{n+1}+C'])],
    ],
  },
  {
    kind: 'formula',
    id: 'int-2',
    unit: '수2',
    topic: '적분',
    title: '미적분의 기본정리',
    note: '$F\'(x)=f(x)$',
    lines: [['\\int_{a}^{b} f(x)\\,dx = ', nb(['f(b)-f(a)', 'F(b)-F(a)'])]],
  },
  {
    kind: 'formula',
    id: 'int-3',
    unit: '수2',
    topic: '적분',
    title: '정적분과 넓이',
    note: '구간 $[a,b]$에서 $f(x)\\ge g(x)$',
    lines: [
      ['S = ', nb(['\\int_{a}^{b}\\{f(x)-g(x)\\}\\,dx', '\\int_a^b(f(x)-g(x))dx'])],
    ],
  },

  // ───────────────────────── 미적분 · 수열의 극한과 급수 ─────────────────────────
  {
    kind: 'formula',
    id: 'calc-lim-1',
    unit: '미적분',
    topic: '수열의 극한과 급수',
    title: '등비수열의 극한',
    note: '$\\lim_{n\\to\\infty} r^n$',
    lines: [
      ['|r|<1 \\; \\Rightarrow\\; \\lim_{n\\to\\infty} r^n = ', nb(['0'])],
      ['r=1 \\; \\Rightarrow\\; \\lim_{n\\to\\infty} r^n = ', nb(['1'])],
    ],
  },
  {
    kind: 'formula',
    id: 'calc-lim-2',
    unit: '미적분',
    topic: '수열의 극한과 급수',
    title: '등비급수의 합',
    note: '$|r|<1$',
    lines: [
      [
        '\\sum_{n=1}^{\\infty} ar^{n-1} = ',
        nb(['\\frac{a}{1-r}', 'a/(1-r)']),
      ],
    ],
  },

  // ───────────────────────── 미적분 · 삼각함수의 극한 ─────────────────────────
  {
    kind: 'formula',
    id: 'calc-trig-lim-1',
    unit: '미적분',
    topic: '삼각함수의 극한',
    title: '삼각함수의 극한 공식',
    lines: [
      ['\\lim_{x\\to0} \\frac{\\sin x}{x} = ', nb(['1'])],
      ['\\lim_{x\\to0} \\frac{\\tan x}{x} = ', nb(['1'])],
      ['\\lim_{x\\to0} \\frac{x}{\\sin x} = ', nb(['1'])],
      ['\\lim_{x\\to0} \\frac{1-\\cos x}{x^2} = ', nb(['\\frac{1}{2}', '1/2'])],
    ],
  },

  // ───────────────────────── 미적분 · 여러 가지 함수의 미분 ─────────────────────────
  {
    kind: 'formula',
    id: 'calc-diff-1',
    unit: '미적분',
    topic: '여러 가지 함수의 미분',
    title: '삼각함수의 도함수 (기본 3개)',
    lines: [
      ['(\\sin x)\' = ', nb(['\\cos x'])],
      ['(\\cos x)\' = ', nb(['-\\sin x'])],
      ['(\\tan x)\' = ', nb(['\\sec^2 x'])],
    ],
  },
  {
    kind: 'formula',
    id: 'calc-diff-1b',
    unit: '미적분',
    topic: '여러 가지 함수의 미분',
    title: '삼각함수의 도함수 (역수함수 3개)',
    lines: [
      ['(\\csc x)\' = ', nb(['-\\csc x\\cot x'])],
      ['(\\sec x)\' = ', nb(['\\sec x\\tan x'])],
      ['(\\cot x)\' = ', nb(['-\\csc^2 x'])],
    ],
  },
  {
    kind: 'formula',
    id: 'calc-diff-2',
    unit: '미적분',
    topic: '여러 가지 함수의 미분',
    title: '삼각함수의 제곱 관계',
    lines: [
      ['1+\\tan^2 x = ', nb(['\\sec^2x'])],
      ['1+\\cot^2 x = ', nb(['\\csc^2x'])],
    ],
  },
  {
    kind: 'formula',
    id: 'calc-diff-3',
    unit: '미적분',
    topic: '여러 가지 함수의 미분',
    title: '지수함수·로그함수의 도함수',
    note: '$a>0, a\\ne1$',
    lines: [
      ['(e^x)\' = ', nb(['e^x'])],
      ['(a^x)\' = ', nb(['a^x\\ln a', 'a^x\\ln{a}'])],
      ['(\\ln x)\' = ', nb(['\\frac{1}{x}', '1/x'])],
      ['(\\log_a x)\' = ', nb(['\\frac{1}{x\\ln a}', '1/(x\\ln{a})'])],
    ],
  },
  {
    kind: 'formula',
    id: 'calc-diff-4',
    unit: '미적분',
    topic: '여러 가지 함수의 미분',
    title: '곱의 미분법',
    lines: [['\\{f(x)g(x)\\}\' = ', nb(['f\'(x)g(x)+f(x)g\'(x)'])]],
  },
  {
    kind: 'formula',
    id: 'calc-diff-5',
    unit: '미적분',
    topic: '여러 가지 함수의 미분',
    title: '몫의 미분법',
    note: '$g(x)\\ne0$',
    lines: [
      [
        '\\left\\{\\frac{f(x)}{g(x)}\\right\\}\' = ',
        nb(['\\frac{f\'(x)g(x)-f(x)g\'(x)}{\\{g(x)\\}^2}', '\\frac{f\'(x)g(x)-f(x)g\'(x)}{g(x)^2}']),
      ],
      [
        '\\left\\{\\frac{1}{g(x)}\\right\\}\' = ',
        nb(['-\\frac{g\'(x)}{\\{g(x)\\}^2}', '-\\frac{g\'(x)}{g(x)^2}', '-g\'(x)/g(x)^2']),
      ],
    ],
  },
  {
    kind: 'formula',
    id: 'calc-diff-6',
    unit: '미적분',
    topic: '여러 가지 함수의 미분',
    title: '합성함수의 미분법 (연쇄법칙)',
    lines: [
      [
        '\\{f(g(x))\\}\' = ',
        nb(['f\'(g(x))g\'(x)']),
      ],
      ['\\frac{dy}{dx} = ', nb(['\\frac{dy}{du}\\cdot\\frac{du}{dx}', '\\frac{dy}{du}\\frac{du}{dx}'])],
    ],
  },
  {
    kind: 'formula',
    id: 'calc-diff-7',
    unit: '미적분',
    topic: '여러 가지 함수의 미분',
    title: '매개변수로 나타낸 함수의 미분법',
    note: '$x=f(t)$, $y=g(t)$',
    lines: [
      [
        '\\frac{dy}{dx} = ',
        nb(['\\frac{dy/dt}{dx/dt}', '\\frac{g\'(t)}{f\'(t)}']),
      ],
    ],
  },

  // ───────────────────────── 미적분 · 여러 가지 함수의 적분 ─────────────────────────
  {
    kind: 'formula',
    id: 'calc-int-1',
    unit: '미적분',
    topic: '여러 가지 함수의 적분',
    title: '삼각함수의 부정적분 (기본 4개)',
    note: '$C$는 적분상수',
    lines: [
      ['\\int \\sin x\\,dx = ', nb(['-\\cos x+c', '-\\cos{x}+C'])],
      ['\\int \\cos x\\,dx = ', nb(['\\sin x+c', '\\sin{x}+C'])],
      ['\\int \\sec^2 x\\,dx = ', nb(['\\tan x+c', '\\tan{x}+C'])],
      ['\\int \\csc^2 x\\,dx = ', nb(['-\\cot x+c', '-\\cot{x}+C'])],
    ],
  },
  {
    kind: 'formula',
    id: 'calc-int-1b',
    unit: '미적분',
    topic: '여러 가지 함수의 적분',
    title: '삼각함수의 부정적분 (곱꼴 2개)',
    lines: [
      ['\\int \\sec x\\tan x\\,dx = ', nb(['\\sec x+c', '\\sec{x}+C'])],
      ['\\int \\csc x\\cot x\\,dx = ', nb(['-\\csc x+c', '-\\csc{x}+C'])],
    ],
  },
  {
    kind: 'formula',
    id: 'calc-int-2',
    unit: '미적분',
    topic: '여러 가지 함수의 적분',
    title: '지수함수·로그함수의 부정적분',
    note: '$a>0, a\\ne1$',
    lines: [
      ['\\int e^x\\,dx = ', nb(['e^x+c', 'e^x+C'])],
      ['\\int a^x\\,dx = ', nb(['\\frac{a^x}{\\ln a}+c', '\\frac{a^x}{\\ln{a}}+C'])],
      ['\\int \\frac{1}{x}\\,dx = ', nb(['\\ln|x|+c', '\\ln|x|+C'])],
    ],
  },
  {
    kind: 'formula',
    id: 'calc-int-3',
    unit: '미적분',
    topic: '여러 가지 함수의 적분',
    title: '치환적분법',
    note: '$x=g(t)$로 치환',
    lines: [
      [
        '\\int f(x)\\,dx = ',
        nb(['\\int f(g(t))g\'(t)\\,dt']),
      ],
    ],
  },
  {
    kind: 'formula',
    id: 'calc-int-4',
    unit: '미적분',
    topic: '여러 가지 함수의 적분',
    title: '부분적분법',
    lines: [
      [
        '\\int f(x)g\'(x)\\,dx = ',
        nb(['f(x)g(x)-\\int f\'(x)g(x)\\,dx']),
      ],
    ],
  },
  {
    kind: 'formula',
    id: 'calc-int-5',
    unit: '미적분',
    topic: '여러 가지 함수의 적분',
    title: '정적분의 활용 — 속도와 거리',
    note: '시각 $t=a$일 때 위치 $x(a)$, 속도 $v(t)$',
    lines: [
      [
        'x(b) = ',
        nb(['x(a)+\\int_{a}^{b}v(t)\\,dt']),
      ],
      [
        '\\text{이동거리} = ',
        nb(['\\int_{a}^{b}|v(t)|\\,dt']),
      ],
    ],
  },
]

export const TOPIC_ORDER: string[] = Array.from(
  new Set(FORMULAS.map((f) => f.topic)),
)
