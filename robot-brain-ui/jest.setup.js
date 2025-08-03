// Import React first for mocks
const React = require('react')
const { 
  mockElevenLabsWidget, 
  mockElevenLabsWidgetInstance,
  mockUseConversation,
  mockAnthropicClient,
  mockNeonQuery,
  mockResponseCache,
  mockPerformanceMonitor,
  mockAudioContext,
  mockSpeechRecognition
} = require('./__tests__/setup/mocks')

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
import { TextDecoder, TextEncoder } from 'util'
import { setupDomMocks } from './__tests__/test-utils'

// Add TextDecoder/TextEncoder to global scope for Neon
global.TextDecoder = TextDecoder
global.TextEncoder = TextEncoder

// Mock environment variables for tests
process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key'
process.env.NEON_DATABASE_URL = 'postgresql://test:test@ep-test.neon.tech/testdb?sslmode=require'
process.env.ELEVENLABS_API_KEY = 'sk_test_elevenlabs_key'
process.env.NODE_ENV = 'test'

// Mock Neon database for tests
jest.mock('@neondatabase/serverless', () => ({
  neon: jest.fn(() => mockNeonQuery)
}))

// Mock ElevenLabs packages
jest.mock('@elevenlabs/convai-widget-core', () => ({
  ElevenLabsWidget: mockElevenLabsWidget
}))

jest.mock('@elevenlabs/react', () => ({
  useConversation: jest.fn(() => mockUseConversation)
}))

// Mock Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn(() => mockAnthropicClient)
}))

// Mock performance utilities
jest.mock('./src/lib/performance-monitor', () => ({
  performanceMonitor: mockPerformanceMonitor
}))

jest.mock('./src/lib/response-cache', () => ({
  responseCache: mockResponseCache,
  logCachePerformance: jest.fn()
}))

// Mock validation utilities
jest.mock('./src/lib/validation', () => ({
  schemas: {
    chatRequest: { 
      safeParse: jest.fn((data) => ({ 
        success: true, 
        data: data 
      }))
    },
    ttsRequest: { 
      safeParse: jest.fn((data) => ({ 
        success: true, 
        data: data 
      }))
    }
  },
  sanitizeInput: jest.fn((input) => input),
  validateSessionId: jest.fn((id) => id),
  checkRateLimit: jest.fn(() => true),
  getClientIP: jest.fn(() => '127.0.0.1')
}))

// Mock Audio APIs
global.AudioContext = jest.fn(() => mockAudioContext)
global.webkitAudioContext = jest.fn(() => mockAudioContext)
global.SpeechRecognition = jest.fn(() => mockSpeechRecognition)
global.webkitSpeechRecognition = jest.fn(() => mockSpeechRecognition)

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