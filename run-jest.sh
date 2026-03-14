#!/bin/zsh
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
cd /Users/todd.greco/current_work/pi-day/pi-birthday-finder
npx jest --testPathPattern="searchStrategies|funFacts" --no-coverage
echo "EXIT_CODE:$?"
