const { execSync } = require('child_process')

const cwd = '/Users/todd.greco/current_work/pi-day/pi-birthday-finder'

function run(cmd, opts) {
  console.log('\n$ ' + cmd)
  try {
    const out = execSync(cmd, Object.assign({ cwd, encoding: 'utf8' }, opts || {}))
    if (out) console.log(out)
    return out
  } catch (e) {
    console.error(e.stdout || '')
    console.error(e.stderr || '')
    throw e
  }
}

console.log('=== STEP 1: git log --oneline -5 ===')
run('git log --oneline -5')

console.log('=== STEP 2: git status ===')
run('git status')

console.log('=== STEP 3: Run tests ===')
run('npx jest --testPathPattern="searchStrategies|funFacts" --no-coverage', { stdio: [0,1,2] })

console.log('=== STEP 4: Commits ===')

run('git add package.json scripts/download-pi.js')
run('git commit -m "chore: add download-pi npm script and digit validation\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"')

run('git add src/lib/piTrivia.ts')
run('git commit -m "feat: add pi trivia data and shuffle utility\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"')

run('git add src/lib/searchStrategies.ts __tests__/lib/searchStrategies.test.ts')
run('git commit -m "feat: implement search strategies with tests\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"')

run('git add src/lib/funFacts.ts __tests__/lib/funFacts.test.ts')
run('git commit -m "feat: implement fun facts generator with tests\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"')

run('git add src/lib/piLoader.ts')
run('git commit -m "feat: add pi digit loader with caching\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"')

console.log('=== FINAL: git log --oneline -10 ===')
run('git log --oneline -10')

console.log('All done!')
