import { getSearchCandidates, type MatchType } from '@/lib/searchStrategies'

export interface PiSearchResult {
  position: number       // 1-based position in pi digits
  matchType: MatchType
  label: string
  matchStr: string
  contextBefore: string  // up to 20 digits before match
  contextAfter: string   // up to 20 digits after match
}

/** Pure search function — usable in tests and hooks */
export function searchPiDigits(digits: string, date: Date): PiSearchResult | null {
  const candidates = getSearchCandidates(date)

  for (const candidate of candidates) {
    const index = digits.indexOf(candidate.pattern)
    if (index !== -1) {
      const contextStart = Math.max(0, index - 20)
      const contextEnd = Math.min(digits.length, index + candidate.pattern.length + 20)
      return {
        position: index + 1,  // convert to 1-based
        matchType: candidate.matchType,
        label: candidate.label,
        matchStr: candidate.pattern,
        contextBefore: digits.slice(contextStart, index),
        contextAfter: digits.slice(index + candidate.pattern.length, contextEnd),
      }
    }
  }
  return null
}
