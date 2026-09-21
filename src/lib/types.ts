export type Unit = '수1' | '수2' | '미적분'

export const UNIT_LABEL: Record<Unit, string> = {
  수1: '수학 I',
  수2: '수학 II',
  미적분: '미적분 (국민대 대비)',
}

export const ALL_UNITS: Unit[] = ['수1', '수2', '미적분']
