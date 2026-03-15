// src/lib/piLoader.ts

let cachedDigits: string | null = null

export async function loadPiDigits(): Promise<string> {
  if (cachedDigits) return cachedDigits

  const res = await fetch('/pi-digits.json')
  if (!res.ok) {
    throw new Error(`Failed to load pi digits: ${res.status}`)
  }

  const data = await res.json() as { digits: string }
  cachedDigits = data.digits
  return cachedDigits
}

export function getCachedPiDigits(): string | null {
  return cachedDigits
}
