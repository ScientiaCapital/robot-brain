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
  transformIgnorePatterns: [
    'node_modules/(?!(react-markdown|remark-gfm|micromark|remark|unified|bail|is-plain-obj|trough|vfile|vfile-message|mdast-util-from-markdown|mdast-util-to-string|unist-util-stringify-position|property-information|hast-util-whitespace|space-separated-tokens|comma-separated-tokens|decode-named-character-reference|character-entities|micromark-util-decode-numeric-character-reference|micromark-util-decode-string)/)'
  ],
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