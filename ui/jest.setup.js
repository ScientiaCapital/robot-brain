// Import React first for mocks
const React = require('react')

// Load test environment variables first
require('dotenv').config({ path: '.env.test' })
const { 
  mockElevenLabsWidget, 
  mockElevenLabsWidgetInstance,
  mockUseConversation,
  mockAnthropicClient,
  mockNeonQuery,
  mockResponseCache,
  mockPerformanceMonitor,
  mockTrackAPICall,
  mockMeasureAsync,
  mockMeasureSync,
  mockAudioStreamingMetrics,
  mockAudioStreamManager,
  mockAudioContext,
  mockSpeechRecognition
} = require('./__tests__/setup/mocks')
const { mockFramerMotion } = require('./__tests__/test-utils')

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

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => mockFramerMotion())

import '@testing-library/jest-dom'
import 'whatwg-fetch'
import { TextDecoder, TextEncoder } from 'util'
import { setupDomMocks } from './__tests__/test-utils'

// ==================== GLOBAL SETUP ====================

// Add TextDecoder/TextEncoder to global scope for Neon
global.TextDecoder = TextDecoder
global.TextEncoder = TextEncoder

// Load real environment variables from .env.local for integration testing
require('dotenv').config({ path: '.env.local' })

// Only set test-specific overrides if needed
if (!process.env.NEON_DATABASE_URL) {
  process.env.NEON_DATABASE_URL = 'postgresql://neondb_owner:npg_TVtQA82WDdcE@ep-plain-pond-afedblyp-pooler.c-2.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require'
}
process.env.NODE_ENV = 'test'

// ==================== MODULE MOCKS ====================

// Mock Neon database for tests - DISABLED for real database testing
// jest.mock('@neondatabase/serverless', () => ({
//   neon: jest.fn(() => mockNeonQuery)
// }))

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
  performanceMonitor: mockPerformanceMonitor,
  trackAPICall: mockTrackAPICall,
  measureAsync: mockMeasureAsync,
  measureSync: mockMeasureSync
}))

jest.mock('./src/lib/response-cache', () => ({
  responseCache: mockResponseCache,
  logCachePerformance: jest.fn()
}))

// Mock audio streaming utilities with ReadableStream support
jest.mock('./src/lib/audio-streaming', () => ({
  AudioStreamingMetrics: mockAudioStreamingMetrics,
  getAudioStreamManager: jest.fn(() => mockAudioStreamManager),
  AudioStreamManager: jest.fn(() => mockAudioStreamManager),
  streamTTSAudio: jest.fn().mockResolvedValue(undefined),
  ELEVENLABS_STREAM_CONFIG: {
    optimizeStreamingLatency: 1,
    outputFormat: 'mp3_44100_128',
    voiceSettings: {
      stability: 0.5,
      similarityBoost: 0.8,
      style: 0.0,
      useSpeakerBoost: true
    }
  }
}))

// ==================== INTERNAL MODULE MOCKS ====================

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

// ==================== GLOBAL API MOCKS ====================

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

// ==================== BROWSER API MOCKS ====================

// Setup all DOM mocks
setupDomMocks()

// Mock fetch for ReadableStream support in audio streaming
global.fetch = jest.fn()

// ==================== NEXT.JS API MOCKS ====================

// Mock Next.js NextResponse and NextRequest
global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body
    this.status = init.status || 200
    this.statusText = init.statusText || 'OK'
    this.headers = new Headers(init.headers)
    this.ok = this.status >= 200 && this.status < 300
  }

  static json(data, init = {}) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init.headers
      }
    })
  }

  static error() {
    return new Response(null, { status: 500, statusText: 'Internal Server Error' })
  }

  async json() {
    return JSON.parse(this.body || '{}')
  }

  async text() {
    return this.body || ''
  }
}

global.Request = class Request {
  constructor(url, init = {}) {
    this.url = url
    this.method = init.method || 'GET'
    this.headers = new Headers(init.headers)
    this.body = init.body
  }

  async json() {
    return JSON.parse(this.body || '{}')
  }

  async text() {
    return this.body || ''
  }
}

global.Headers = class Headers {
  constructor(init = {}) {
    this._headers = {}
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this.set(key, value)
      })
    }
  }

  get(name) {
    return this._headers[name.toLowerCase()]
  }

  set(name, value) {
    this._headers[name.toLowerCase()] = value
  }

  has(name) {
    return name.toLowerCase() in this._headers
  }

  delete(name) {
    delete this._headers[name.toLowerCase()]
  }

  entries() {
    return Object.entries(this._headers)
  }
}

// Mock Next.js NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init = {}) => {
      return global.Response.json(data, init)
    }),
    error: jest.fn(() => {
      return global.Response.error()
    })
  },
  NextRequest: jest.fn((url, init) => new global.Request(url, init))
}))

// Mock ReadableStream for audio streaming tests
global.ReadableStream = class ReadableStream {
  constructor(source) {
    this.source = source
  }
  
  getReader() {
    return {
      read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
      releaseLock: jest.fn(),
      cancel: jest.fn()
    }
  }
  
  pipeTo(dest) {
    return Promise.resolve()
  }
  
  tee() {
    return [this, this]
  }
}

// ==================== TEST LIFECYCLE MANAGEMENT ====================

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