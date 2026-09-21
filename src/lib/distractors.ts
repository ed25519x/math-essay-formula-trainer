import { FORMULAS, isBlank, type FormulaEntry } from './formulas'
import { canonicalTex } from './mathMatch'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i]!
    a[i] = a[j]!
    a[j] = tmp
  }
  return a
}

function collect(entry: FormulaEntry, excludeBlank: string): string[] {
  if (entry.kind === 'table') {
    return entry.rows.flatMap((row) =>
      row.cells
        .filter((c) => c.blank !== excludeBlank)
        .map((c) => (c.blank ? c.answer?.[0] : c.tex))
        .filter((v): v is string => Boolean(v)),
    )
  }
  return entry.lines
    .flat()
    .filter(isBlank)
    .filter((p) => p.blank !== excludeBlank)
    .map((p) => p.answer[0])
    .filter((v): v is string => Boolean(v))
}

/** Builds a shuffled multiple-choice list (correct answer + plausible distractors). */
export function getChoices(
  entry: FormulaEntry,
  blankId: string,
  correctAnswer: string,
  count = 4,
): string[] {
  const seen = new Set<string>([canonicalTex(correctAnswer)])
  const pool: string[] = []

  function addAll(candidates: string[]) {
    for (const c of candidates) {
      const key = canonicalTex(c)
      if (!seen.has(key)) {
        seen.add(key)
        pool.push(c)
      }
    }
  }

  addAll(collect(entry, blankId))

  for (const other of FORMULAS) {
    if (other.id === entry.id || other.topic !== entry.topic) continue
    addAll(collect(other, ''))
    if (pool.length >= count * 4) break
  }

  if (pool.length < count - 1) {
    for (const other of FORMULAS) {
      if (other.id === entry.id || other.unit !== entry.unit) continue
      addAll(collect(other, ''))
      if (pool.length >= count * 4) break
    }
  }

  const distractors = shuffle(pool).slice(0, count - 1)
  return shuffle([correctAnswer, ...distractors])
}
