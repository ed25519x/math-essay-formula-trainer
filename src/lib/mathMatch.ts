export function normalizeTex(s: string): string {
  return s
    .replace(/\\left|\\right/g, '')
    .replace(/\\,|\\!|\\;|\\:/g, '')
    .replace(/\s+/g, '')
    .replace(/[{}]/g, '')
    .replace(/\\cdot/g, '*')
    .toLowerCase()
}

export function checkTexAnswer(input: string, accepted: string[]): boolean {
  const n = normalizeTex(input)
  if (!n) return false
  return accepted.some((a) => normalizeTex(a) === n)
}

export function round(x: number, decimals: number): number {
  const f = 10 ** decimals
  return Math.round(x * f) / f
}

export function checkNumericAnswer(
  input: string,
  correct: number,
  decimals: number,
): boolean {
  const val = Number.parseFloat(input.trim())
  if (Number.isNaN(val)) return false
  const tolerance = Math.max(10 ** -decimals * 0.6, 0.015)
  return Math.abs(val - correct) <= tolerance
}

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function pick<T>(arr: T[]): T {
  const item = arr[Math.floor(Math.random() * arr.length)]
  if (item === undefined) throw new Error('pick() called on empty array')
  return item
}
