const nextJest = require('next/jest.js')

const createJestConfig = nextJest({ dir: './' })

const config = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
}

module.exports = createJestConfig(config)
