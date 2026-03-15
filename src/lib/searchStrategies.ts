// src/lib/searchStrategies.ts

export type MatchType =
  | 'full-mmddyyyy'
  | 'month-day-mmdd'
  | 'month-day-mmddyy'
  | 'partial-md'

export interface SearchCandidate {
  pattern: string
  matchType: MatchType
  label: string
}

export function getSearchCandidates(date: Date): SearchCandidate[] {
  const month = date.getMonth() + 1  // 1–12
  const day = date.getDate()          // 1–31
  const year = date.getFullYear()

  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  const yyyy = String(year)
  const yy = yyyy.slice(-2)

  const candidates: SearchCandidate[] = [
    { pattern: mm + dd + yyyy, matchType: 'full-mmddyyyy',     label: '🌟 Full Date Match' },
    { pattern: mm + dd + yy,   matchType: 'month-day-mmddyy',  label: '🎂 Date Match (Short Year)' },
    { pattern: mm + dd,        matchType: 'month-day-mmdd',    label: '🎂 Month+Day Match' },
  ]

  // Unpadded MD — only when both month and day are single digits
  if (month <= 9 && day <= 9) {
    candidates.push({
      pattern: String(month) + String(day),
      matchType: 'partial-md',
      label: '🔍 Partial Match',
    })
  }

  return candidates
}
