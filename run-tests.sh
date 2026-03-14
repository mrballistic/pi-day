#!/bin/bash
cd /Users/todd.greco/current_work/pi-day/pi-birthday-finder
npx jest --testPathPattern="searchStrategies|funFacts" --no-coverage 2>&1
echo "EXIT_CODE:$?"
