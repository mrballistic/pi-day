// __tests__/lib/funFacts.test.ts
import { getFunFact } from '@/lib/funFacts'

describe('getFunFact', () => {
  it('returns "practically at the start" for very early positions', () => {
    expect(getFunFact(1)).toContain('practically at the start')
    expect(getFunFact(10000)).toContain('practically at the start')
  })

  it('returns percentage for mid-early positions', () => {
    const fact = getFunFact(50000)
    expect(fact).toContain('%')
    expect(fact).toContain('5.0')
  })

  it('returns "most humans" message for 50k–200k range', () => {
    expect(getFunFact(51000)).toContain('most humans')
    expect(getFunFact(200000)).toContain('most humans')
  })

  it('returns memorization message for 200k–500k range', () => {
    const fact = getFunFact(300000)
    expect(fact).toContain('memorize')
    expect(fact).toContain('300,000')
  })

  it('returns "second half" for 500k–900k range', () => {
    expect(getFunFact(600000)).toContain('second half')
  })

  it('returns "very end" message for 900k+ positions', () => {
    const fact = getFunFact(950000)
    expect(fact).toContain('last')
    expect(fact).toContain('50,000')
  })

  it('handles -1 (no match) gracefully', () => {
    expect(getFunFact(-1)).toContain('beyond the first million')
  })
})
