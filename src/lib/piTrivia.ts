// src/lib/piTrivia.ts

export const PI_TRIVIA: string[] = [
  'π has been calculated to over 105 trillion digits — and counting.',
  'Albert Einstein was born on Pi Day — March 14, 1879.',
  'π is irrational — its decimal representation never ends and never repeats.',
  'If you write π to 39 digits, you can calculate the circumference of the observable universe to within the width of a hydrogen atom.',
  'The probability that two random integers share no common factors is 6/π².',
  'In 1897, an Indiana bill nearly legislated π to be 3.2. It failed.',
  'π appears in the normal distribution formula — the bell curve.',
  'The Feynman point — six consecutive 9s — begins at position 762 in π.',
  'Archimedes was the first to rigorously approximate π using 96-sided polygons.',
  'William Shanks calculated π to 707 decimal places by hand in 1873. He was wrong after digit 527.',
  'March 14 at 1:59:26 AM is the most precise Pi Moment — 3.1415926.',
  'π is transcendental — it cannot be the root of any polynomial with rational coefficients.',
  'The Greek letter π was first used for this ratio by William Jones in 1706.',
  "Buffon's needle problem: dropping needles on lined paper can approximate π.",
  'There is a poetic form called Pilish where word lengths match successive digits of π.',
  'The ancient Egyptians approximated π as (16/9)² ≈ 3.1605 around 1650 BCE.',
  'In Star Trek\'s "Wolf in the Fold," Spock defeats a computer by asking it to compute π to the last digit.',
  'The current record for memorizing π is 70,030 digits, set by Suresh Kumar Sharma in 2015.',
  'π is normal — statistically, every digit 0–9 appears with equal frequency in the long run.',
  'If you search long enough in π, you can find any finite sequence of digits — including your birthday.',
  'The ratio of a circle\'s circumference to its diameter is π, regardless of the circle\'s size.',
  'Euler\'s identity, e^(iπ) + 1 = 0, connects π with five fundamental mathematical constants.',
  'The first 144 digits of π sum to 666.',
  'A supercomputer calculated π to 100 trillion digits in 2022 — the computation took 157 days.',
]

/** Fisher-Yates shuffle — returns a new shuffled array */
export function shuffleTrivia(arr: string[]): string[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
