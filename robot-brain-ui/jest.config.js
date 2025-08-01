const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  testMatch: [
    '<rootDir>/__tests__/**/*.test.{js,jsx,ts,tsx}'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  // Extended timeout for integration tests
  testTimeout: 10000,
  // Maximum workers for parallel tests
  maxWorkers: 2,
  // Test environment variables
  globals: {
    'process.env': {
      NODE_ENV: 'test',
      API_BASE_URL: 'http://localhost:8000'
    }
  }
}

module.exports = createJestConfig(customJestConfig)