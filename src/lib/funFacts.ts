// src/lib/funFacts.ts

export function getFunFact(position: number): string {
  if (position < 0) {
    return "Your birthday is beyond the first million digits — truly hidden in π!"
  }
  if (position <= 10_000) {
    return "That's in the first 1% of π — your birthday is practically at the start!"
  }
  if (position <= 50_000) {
    const pct = ((position / 1_000_000) * 100).toFixed(1)
    return `That's ${pct}% of the way through the first million digits.`
  }
  if (position <= 200_000) {
    return "Further than most humans have ever memorized!"
  }
  if (position <= 500_000) {
    return `You'd need to memorize π to ${position.toLocaleString()} digits to reach your birthday.`
  }
  if (position <= 900_000) {
    return "Hiding deep — in the second half of the first million digits."
  }
  const remaining = 1_000_000 - position
  return `Almost at the very end — your birthday is in the last ${remaining.toLocaleString()} digits!`
}
