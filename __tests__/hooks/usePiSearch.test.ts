import { searchPiDigits } from '@/hooks/usePiSearch'

describe('searchPiDigits', () => {
  it('finds 8-digit MMDDYYYY match first (highest priority)', () => {
    // Build a string where both MMDD and MMDDYYYY exist
    const digits = '00000000' + '07041990' + '0000' + '0704' + '0'.repeat(100)
    const result = searchPiDigits(digits, new Date(1990, 6, 4))
    expect(result).not.toBeNull()
    expect(result!.matchType).toBe('full-mmddyyyy')
    expect(result!.matchStr).toBe('07041990')
    expect(result!.position).toBe(9) // 1-based: index 8 + 1
  })

  it('falls back to MMDD when no 8-digit match', () => {
    const digits = '0'.repeat(10) + '0704' + '0'.repeat(100)
    const result = searchPiDigits(digits, new Date(1990, 6, 4))
    expect(result).not.toBeNull()
    expect(result!.matchType).toBe('month-day-mmdd')
    expect(result!.position).toBe(11) // 1-based: index 10 + 1
  })

  it('falls back to MD partial for single-digit month+day when no longer match', () => {
    const digits = '0'.repeat(10) + '74' + '0'.repeat(100)
    const result = searchPiDigits(digits, new Date(1990, 6, 4))
    expect(result).not.toBeNull()
    expect(result!.matchType).toBe('partial-md')
    expect(result!.position).toBe(11)
  })

  it('returns correct context strips', () => {
    // 10 chars before match, 10 chars after match, then padding
    // contextBefore = slice(max(0, 10-20), 10) = slice(0,10) = '1234567890'
    // contextAfter  = slice(14, min(len, 14+20)) = '9876543210' + '0'.repeat(10)
    const digits = '1234567890' + '0704' + '9876543210' + '0'.repeat(80)
    const result = searchPiDigits(digits, new Date(1990, 6, 4))
    expect(result!.contextBefore).toBe('1234567890')
    expect(result!.contextAfter).toBe('9876543210' + '0'.repeat(10))
  })

  it('returns null if no match found', () => {
    const digits = '9'.repeat(100)
    const result = searchPiDigits(digits, new Date(2024, 1, 29)) // Feb 29
    // "02292024", "02291924", "0229", "022924" — none in all-9s
    expect(result).toBeNull()
  })

  it('position is 1-based', () => {
    const digits = '07041990' + '0'.repeat(100)
    const result = searchPiDigits(digits, new Date(1990, 6, 4))
    expect(result!.position).toBe(1) // first digit = position 1
  })
})
