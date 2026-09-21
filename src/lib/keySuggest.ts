import type { FormulaEntry } from './formulas'
import { isBlank } from './formulas'

export interface SuggestedKey {
  /** 키에 보여줄 TeX */
  display: string
  /** 입력할 TeX */
  text: string
  /** 삽입 후 커서를 왼쪽으로 옮길 칸 수 (중괄호 안으로 들어가기) */
  cursorBack?: number
}

/** 현재 카드에 등장하는 모든 TeX 문자열 (문제 본문 + 정답) */
export function collectTex(entry: FormulaEntry): string[] {
  const out: string[] = [entry.title, entry.note ?? '']
  if (entry.kind === 'formula') {
    for (const line of entry.lines) {
      for (const part of line) {
        if (isBlank(part)) out.push(...part.answer)
        else out.push(part)
      }
    }
  } else {
    out.push(...entry.headers)
    for (const row of entry.rows) {
      out.push(row.label)
      for (const cell of row.cells) {
        if (cell.tex) out.push(cell.tex)
        if (cell.answer) out.push(...cell.answer)
      }
    }
  }
  return out
}

/** `f(x)`, `f'(a)`, `g(t)`, `f(a+h)` 처럼 그대로 다시 쓰게 될 함수 표기 */
const FUNC_CALL = /\b([fghFGP])\s*(?:'|\^\{?\\prime\}?)?\s*\(\s*([a-zA-Z](?:\s*[+-]\s*[a-zA-Z0-9]+)?|\d+)\s*\)/g

/** 명령어 → 키 정의 */
const COMMAND_KEYS: Record<string, SuggestedKey> = {
  sin: { display: '\\sin', text: '\\sin' },
  cos: { display: '\\cos', text: '\\cos' },
  tan: { display: '\\tan', text: '\\tan' },
  sec: { display: '\\sec', text: '\\sec' },
  csc: { display: '\\csc', text: '\\csc' },
  cot: { display: '\\cot', text: '\\cot' },
  log: { display: '\\log_{a}', text: '\\log_{}', cursorBack: 1 },
  ln: { display: '\\ln', text: '\\ln' },
  lim: { display: '\\lim_{x}', text: '\\lim_{}', cursorBack: 1 },
  int: { display: '\\int', text: '\\int_{}^{}', cursorBack: 4 },
  sum: { display: '\\sum', text: '\\sum_{}^{}', cursorBack: 4 },
  sqrt: { display: '\\sqrt{x}', text: '\\sqrt{}', cursorBack: 1 },
  frac: { display: '\\frac{a}{b}', text: '\\frac{}{}', cursorBack: 3 },
  pi: { display: '\\pi', text: '\\pi' },
  theta: { display: '\\theta', text: '\\theta' },
  infty: { display: '\\infty', text: '\\infty' },
  Delta: { display: '\\Delta', text: '\\Delta' },
  pm: { display: '\\pm', text: '\\pm' },
  cdot: { display: '\\cdot', text: '\\cdot' },
  times: { display: '\\times', text: '\\times' },
  ne: { display: '\\ne', text: '\\ne' },
  le: { display: '\\le', text: '\\le' },
  ge: { display: '\\ge', text: '\\ge' },
  to: { display: '\\to', text: '\\to' },
  iff: { display: '\\iff', text: '\\iff' },
}

/**
 * 카드에 실제로 등장하는 함수 표기·기호를 빈도순으로 뽑아 단축키로 만든다.
 * (f(x), f'(x)처럼 모바일에서 치기 까다로운 것들을 한 번에 넣을 수 있게)
 */
export function suggestKeys(sources: string[], limit = 12): SuggestedKey[] {
  const count = new Map<string, number>()
  const keys = new Map<string, SuggestedKey>()

  const bump = (id: string, key: SuggestedKey) => {
    count.set(id, (count.get(id) ?? 0) + 1)
    if (!keys.has(id)) keys.set(id, key)
  }

  for (const src of sources) {
    if (!src) continue

    for (const m of src.matchAll(FUNC_CALL)) {
      const fn = m[1]!
      const arg = m[2]!.replace(/\s+/g, '')
      const prime = /'|\\prime/.test(m[0])
      const text = `${fn}${prime ? "'" : ''}(${arg})`
      bump(text, { display: text, text })
      // 도함수 표기는 원함수/도함수를 같이 제안한다
      const sibling = `${fn}${prime ? '' : "'"}(${arg})`
      bump(sibling, { display: sibling, text: sibling })
    }

    // n제곱근은 \sqrt 와 구분해서 제안한다
    for (let i = src.indexOf('\\sqrt['); i >= 0; i = src.indexOf('\\sqrt[', i + 1)) {
      bump('\\sqrt[]{}', { display: '\\sqrt[n]{x}', text: '\\sqrt[]{}', cursorBack: 3 })
    }

    for (const m of src.matchAll(/\\([a-zA-Z]+)/g)) {
      const key = COMMAND_KEYS[m[1]!]
      if (key) bump(key.text, key)
    }
  }

  return [...count.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => keys.get(id)!)
}

export function suggestKeysForEntry(entry: FormulaEntry, limit = 12): SuggestedKey[] {
  return suggestKeys(collectTex(entry), limit)
}
