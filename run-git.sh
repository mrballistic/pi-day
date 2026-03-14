#!/bin/zsh
set -e
REPO=/Users/todd.greco/current_work/pi-day/pi-birthday-finder
cd "$REPO"
echo "=== git status ==="
git status
echo "=== git diff package.json scripts/download-pi.js ==="
git diff package.json scripts/download-pi.js
echo "=== staging ==="
git add package.json scripts/download-pi.js
echo "=== committing ==="
git commit -m "$(cat <<'EOF'
chore: add download-pi npm script and digit validation

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
echo "=== git log --oneline -4 ==="
git log --oneline -4
