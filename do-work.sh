#!/bin/zsh
set -e
PROJ="/Users/todd.greco/current_work/pi-day/pi-birthday-finder"

echo "=== STEP 1: git log ==="
cd "$PROJ" && git log --oneline -5

echo "=== STEP 2: git status ==="
cd "$PROJ" && git status

echo "=== STEP 3: run tests ==="
cd "$PROJ" && npx jest --testPathPattern="searchStrategies|funFacts" --no-coverage 2>&1
TEST_EXIT=$?
echo "Test exit code: $TEST_EXIT"

if [ $TEST_EXIT -ne 0 ]; then
  echo "TESTS FAILED - not committing"
  exit 1
fi

echo "=== STEP 4: commits ==="

cd "$PROJ"
git add package.json scripts/download-pi.js
git commit -m "chore: add download-pi npm script and digit validation

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"

git add src/lib/piTrivia.ts
git commit -m "feat: add pi trivia data and shuffle utility

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"

git add src/lib/searchStrategies.ts __tests__/lib/searchStrategies.test.ts
git commit -m "feat: implement search strategies with tests

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"

git add src/lib/funFacts.ts __tests__/lib/funFacts.test.ts
git commit -m "feat: implement fun facts generator with tests

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"

git add src/lib/piLoader.ts
git commit -m "feat: add pi digit loader with caching

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"

echo "=== ALL DONE ==="
cd "$PROJ" && git log --oneline -10
