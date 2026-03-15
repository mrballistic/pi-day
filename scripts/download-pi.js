// pi-birthday-finder/scripts/download-pi.js
const https = require('https')
const fs = require('fs')
const path = require('path')

const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'pi-digits.json')
const KNOWN_PREFIX = '14159265358979323846'
const DIGITS_NEEDED = 1_000_000

const PI_URL = 'https://pi2e.ch/blog/wp-content/uploads/2017/03/pi_dec_1m.txt'

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`))
      }
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
      res.on('error', reject)
    }).on('error', reject)
  })
}

async function main() {
  // Skip download if the file already exists and is valid (speeds up incremental Vercel builds)
  if (fs.existsSync(OUTPUT_PATH)) {
    try {
      const existing = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'))
      if (typeof existing.digits === 'string' && existing.digits.length === DIGITS_NEEDED && existing.digits.startsWith(KNOWN_PREFIX)) {
        console.log(`✓ pi-digits.json already present (${existing.digits.length} digits) — skipping download`)
        return
      }
    } catch {
      // File exists but is corrupt — fall through and re-download
    }
  }

  console.log('Downloading pi digits...')
  let raw
  try {
    raw = await fetchUrl(PI_URL)
  } catch (err) {
    console.error('Primary download failed:', err.message)
    console.log('Trying fallback source...')
    try {
      raw = await fetchUrl('https://www.angio.net/pi/pi-million.txt')
    } catch (err2) {
      console.error('Fallback also failed:', err2.message)
      console.error('\nOffline recovery: manually download pi digits and place at public/pi-digits.json')
      console.error('File format: {"digits":"14159265358979..."}  (1,000,000 digits after decimal)')
      console.error('Verified sources: https://pi2e.ch or https://www.angio.net/pi/pi-million.txt')
      process.exit(1)
    }
  }

  // The file may start with "3." — strip the "3." prefix if present
  let digits = raw.trim()
  if (digits.startsWith('3.')) {
    digits = digits.slice(2)
  } else if (digits.startsWith('3')) {
    digits = digits.slice(1)
  }

  // Remove any whitespace or newlines
  digits = digits.replace(/\s/g, '')

  // Validate only digits remain
  if (/[^0-9]/.test(digits.slice(0, DIGITS_NEEDED))) {
    console.error('Validation failed: non-digit characters found in downloaded data')
    process.exit(1)
  }

  // Take exactly 1M digits
  digits = digits.slice(0, DIGITS_NEEDED)

  if (digits.length < DIGITS_NEEDED) {
    console.error(`Only got ${digits.length} digits, need ${DIGITS_NEEDED}`)
    process.exit(1)
  }

  if (!digits.startsWith(KNOWN_PREFIX)) {
    console.error(`Validation failed! Expected digits to start with ${KNOWN_PREFIX}`)
    console.error(`Got: ${digits.slice(0, 20)}`)
    process.exit(1)
  }

  const output = JSON.stringify({ digits })
  fs.mkdirSync(path.join(__dirname, '..', 'public'), { recursive: true })
  fs.writeFileSync(OUTPUT_PATH, output, 'utf8')
  console.log(`✓ Saved ${digits.length} pi digits to ${OUTPUT_PATH}`)
  console.log(`  Starts with: ${digits.slice(0, 20)}...`)
}

main()
