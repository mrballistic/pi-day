// __tests__/lib/searchStrategies.test.ts
import { getSearchCandidates } from '@/lib/searchStrategies'

describe('getSearchCandidates', () => {
  const july4_1990 = new Date(1990, 6, 4) // month is 0-indexed

  it('returns candidates in priority order', () => {
    const candidates = getSearchCandidates(july4_1990)
    expect(candidates[0].pattern).toBe('07041990') // MMDDYYYY
    expect(candidates[1].pattern).toBe('04071990') // DDMMYYYY
    expect(candidates[2].pattern).toBe('0704')     // MMDD
    expect(candidates[3].pattern).toBe('070490')   // MMDDYY
    expect(candidates[4].pattern).toBe('74')       // MD (single digits)
  })

  it('includes correct match type labels', () => {
    const candidates = getSearchCandidates(july4_1990)
    expect(candidates[0].matchType).toBe('full-mmddyyyy')
    expect(candidates[1].matchType).toBe('full-ddmmyyyy')
    expect(candidates[2].matchType).toBe('month-day-mmdd')
    expect(candidates[3].matchType).toBe('month-day-mmddyy')
    expect(candidates[4].matchType).toBe('partial-md')
  })

  it('does NOT include MD partial for double-digit month', () => {
    const oct31 = new Date(2000, 9, 31) // October 31
    const candidates = getSearchCandidates(oct31)
    expect(candidates.some(c => c.matchType === 'partial-md')).toBe(false)
    expect(candidates[2].pattern).toBe('1031') // MMDD covers it
  })

  it('does NOT include MD partial for double-digit day', () => {
    const jan15 = new Date(2000, 0, 15) // January 15
    const candidates = getSearchCandidates(jan15)
    expect(candidates.some(c => c.matchType === 'partial-md')).toBe(false)
  })

  it('pads single-digit month and day correctly', () => {
    const jan1 = new Date(2000, 0, 1) // January 1
    const candidates = getSearchCandidates(jan1)
    expect(candidates[0].pattern).toBe('01012000') // MMDDYYYY
    expect(candidates[2].pattern).toBe('0101')     // MMDD
    expect(candidates[4].pattern).toBe('11')       // MD (both single digit)
  })
})
