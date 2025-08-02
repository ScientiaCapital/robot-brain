// Import React first for mocks
const React = require('react')

// Mock react-markdown to avoid ES module issues
jest.mock('react-markdown', () => {
  return function ReactMarkdown({ children }) {
    return React.createElement('div', { 'data-testid': 'markdown-content' }, children)
  }
})

// Mock remark-gfm
jest.mock('remark-gfm', () => ({
  __esModule: true,
  default: () => {}
}))

import '@testing-library/jest-dom'
import 'whatwg-fetch'
import { setupDomMocks } from './__tests__/test-utils'

// Mock localStorage
class LocalStorageMock {
  constructor() {
    this.store = {}
  }

  getItem = jest.fn((key) => {
    return this.store[key] || null
  })

  setItem = jest.fn((key, value) => {
    this.store[key] = value.toString()
  })

  removeItem = jest.fn((key) => {
    delete this.store[key]
  })

  clear = jest.fn(() => {
    this.store = {}
  })

  key = jest.fn((index) => {
    const keys = Object.keys(this.store)
    return keys[index] || null
  })

  get length() {
    return Object.keys(this.store).length
  }
}

global.localStorage = new LocalStorageMock()

// Setup all DOM mocks
setupDomMocks()

// Mock console methods to reduce noise in tests
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  console.error = (...args) => {
    // Ignore React DOM warnings about unknown props
    if (
      typeof args[0] === 'string' && 
      (args[0].includes('React does not recognize') || 
       args[0].includes('Warning: Unknown prop'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
  
  console.warn = (...args) => {
    // Ignore specific warnings if needed
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
})