/**
 * Centralized mock setup for all tests
 * This file contains all the mock implementations used across the test suite
 */

// ElevenLabs Widget Mock
export const mockElevenLabsWidgetInstance = {
  mount: jest.fn(),
  unmount: jest.fn(),
  open: jest.fn(),
  close: jest.fn(),
  setConfig: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
};

export const mockElevenLabsWidget = jest.fn(() => mockElevenLabsWidgetInstance);

// ElevenLabs React Hook Mock
export const mockUseConversation = {
  startConversation: jest.fn(),
  endConversation: jest.fn(),
  sendMessage: jest.fn(),
  status: 'idle',
  isConnected: false,
  isSpeaking: false,
  isListening: false,
  messages: [],
  error: null,
};

// Anthropic SDK Mock
export const mockAnthropicClient = {
  messages: {
    create: jest.fn().mockResolvedValue({
      id: 'msg_123',
      model: 'claude-3-haiku-20240307',
      role: 'assistant',
      content: [{ type: 'text', text: 'Hello! I am Robot Friend!' }],
      usage: { input_tokens: 10, output_tokens: 20 },
    }),
  },
};

// Create a mock ReadableStream for audio streaming
const createMockReadableStream = (chunks: Uint8Array[] = [new Uint8Array([1, 2, 3])]) => {
  let chunkIndex = 0;
  
  return {
    getReader: () => ({
      read: () => {
        if (chunkIndex < chunks.length) {
          const chunk = chunks[chunkIndex++];
          return Promise.resolve({ done: false, value: chunk });
        } else {
          return Promise.resolve({ done: true, value: undefined });
        }
      },
      releaseLock: jest.fn(),
      cancel: jest.fn()
    })
  };
};

// Fetch Mock for API calls with proper streaming support
export const mockFetchResponse = (data: any, status = 200, options?: { 
  streaming?: boolean, 
  chunks?: Uint8Array[],
  contentLength?: number 
}) => {
  const headers = new Headers({
    'content-type': options?.streaming ? 'audio/mpeg' : 'application/json',
  });
  
  if (options?.contentLength) {
    headers.set('content-length', options.contentLength.toString());
  }
  
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers,
    body: options?.streaming ? createMockReadableStream(options.chunks) : undefined,
  } as Response);
};

// Specialized mock for audio streaming responses
export const mockStreamingFetchResponse = (chunks: Uint8Array[], contentLength?: number) => {
  return mockFetchResponse(null, 200, {
    streaming: true,
    chunks,
    contentLength: contentLength || chunks.reduce((total, chunk) => total + chunk.length, 0)
  });
};

// Audio API Mocks
export const mockAudioContext = {
  createBufferSource: jest.fn(() => ({
    buffer: null,
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    playbackRate: { value: 1 },
    loop: false,
    loopStart: 0,
    loopEnd: 0,
    onended: null,
  })),
  createGain: jest.fn(() => ({
    gain: { value: 1, setValueAtTime: jest.fn() },
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
  destination: {},
  currentTime: 0,
  sampleRate: 44100,
  state: 'running' as AudioContextState,
  resume: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
  suspend: jest.fn().mockResolvedValue(undefined),
  decodeAudioData: jest.fn().mockResolvedValue({
    duration: 1,
    length: 44100,
    numberOfChannels: 2,
    sampleRate: 44100,
    getChannelData: jest.fn(),
    copyFromChannel: jest.fn(),
    copyToChannel: jest.fn(),
  }),
};

// Speech Recognition Mock
export const mockSpeechRecognition = {
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  continuous: false,
  interimResults: false,
  lang: 'en-US',
  maxAlternatives: 1,
  onerror: null,
  onresult: null,
  onstart: null,
  onend: null,
};

// Response Cache Mock - More realistic implementation
const cacheStore = new Map<string, string>();

export const mockResponseCache = {
  get: jest.fn((message: string, personality: string) => {
    // Don't cache long messages (>50 chars)
    if (message.length > 50) return null;
    
    const key = `${message}:${personality}`;
    return cacheStore.get(key) || null;
  }),
  set: jest.fn((message: string, personality: string, response: string) => {
    // Don't cache long messages (>50 chars)
    if (message.length > 50) return;
    
    const key = `${message}:${personality}`;
    cacheStore.set(key, response);
  }),
  clear: jest.fn(() => {
    cacheStore.clear();
  }),
  has: jest.fn((message: string, personality: string) => {
    if (message.length > 50) return false;
    const key = `${message}:${personality}`;
    return cacheStore.has(key);
  }),
};

// Performance Monitor Mock - More realistic stateful implementation
const performanceState = {
  metrics: [] as Array<{ name: string; value: number; timestamp: number; tags?: Record<string, string> }>,
  chatResponseTimes: [] as number[],
  ttsResponseTimes: [] as number[],
  errors: [] as Array<{ endpoint: string; error: string; timestamp: number }>,
  cacheHitRate: 0
};

export const mockPerformanceMonitor = {
  startTimer: jest.fn(),
  endTimer: jest.fn().mockReturnValue(100),
  recordMetric: jest.fn((name: string, value: number, tags?: Record<string, string>) => {
    performanceState.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      tags
    });
  }),
  getMetrics: jest.fn(() => performanceState.metrics),
  generateReport: jest.fn(() => {
    const lcpMetrics = performanceState.metrics.filter(m => m.name === 'LCP');
    const fidMetrics = performanceState.metrics.filter(m => m.name === 'FID');
    const clsMetrics = performanceState.metrics.filter(m => m.name === 'CLS');
    
    const hasWebVitals = lcpMetrics.length > 0 || fidMetrics.length > 0 || clsMetrics.length > 0;
    
    let performanceScore = 95;
    const recommendations: string[] = [];
    
    // Check for poor LCP
    const poorLCP = lcpMetrics.some(m => m.value > 2500);
    if (poorLCP) {
      performanceScore -= 30;
      recommendations.push('Improve Largest Contentful Paint (LCP) performance');
    }
    
    // Check for poor FID
    const poorFID = fidMetrics.some(m => m.value > 100);
    if (poorFID) {
      performanceScore -= 25;
      recommendations.push('Reduce First Input Delay (FID)');
    }
    
    // Check for poor CLS
    const poorCLS = clsMetrics.some(m => m.value > 0.1);
    if (poorCLS) {
      performanceScore -= 20;
      recommendations.push('Minimize Cumulative Layout Shift (CLS)');
    }
    
    const report: any = {
      metrics: performanceState.metrics,
      summary: {
        avgResponseTime: 0,
        totalRequests: 0,
        errorRate: 0,
        cacheHitRate: performanceState.cacheHitRate
      },
      performanceScore: Math.max(0, performanceScore)
    };
    
    if (hasWebVitals) {
      report.webVitals = {
        LCP: lcpMetrics,
        FID: fidMetrics,
        CLS: clsMetrics
      };
      report.apiMetrics = {
        chatResponseTime: performanceState.chatResponseTimes,
        ttsResponseTime: performanceState.ttsResponseTimes
      };
      report.recommendations = recommendations;
    }
    
    return report;
  }),
  clear: jest.fn(() => {
    performanceState.metrics = [];
    performanceState.chatResponseTimes = [];
    performanceState.ttsResponseTimes = [];
    performanceState.errors = [];
    performanceState.cacheHitRate = 0;
  }),
  logSummary: jest.fn(),
  // Additional methods expected by tests
  recordAPIResponse: jest.fn((endpoint: string, responseTime: number) => {
    if (endpoint.includes('chat')) {
      performanceState.chatResponseTimes.push(responseTime);
    } else if (endpoint.includes('text-to-speech')) {
      performanceState.ttsResponseTimes.push(responseTime);
    }
  }),
  updateCacheHitRate: jest.fn((rate: number) => {
    performanceState.cacheHitRate = rate;
  }),
  getAPIMetrics: jest.fn(() => ({
    chatResponseTime: performanceState.chatResponseTimes,
    ttsResponseTime: performanceState.ttsResponseTimes,
    avgChatResponse: performanceState.chatResponseTimes.length > 0 
      ? performanceState.chatResponseTimes.reduce((a, b) => a + b, 0) / performanceState.chatResponseTimes.length 
      : 150,
    avgTTSResponse: performanceState.ttsResponseTimes.length > 0 
      ? performanceState.ttsResponseTimes.reduce((a, b) => a + b, 0) / performanceState.ttsResponseTimes.length 
      : 100,
    errorRate: performanceState.errors.length / Math.max(1, performanceState.chatResponseTimes.length + performanceState.ttsResponseTimes.length + performanceState.errors.length) * 100
  })),
  recordError: jest.fn((endpoint: string, error: string) => {
    performanceState.errors.push({
      endpoint,
      error,
      timestamp: Date.now()
    });
  }),
  getPerformanceScore: jest.fn(() => {
    const report = mockPerformanceMonitor.generateReport();
    return report.performanceScore;
  })
};

// Mock standalone functions from performance-monitor
export const mockTrackAPICall = jest.fn().mockImplementation(async (endpoint: string, fn: () => Promise<any>) => {
  const startTime = Date.now();
  const result = await fn();
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // Record the API call in performance monitor
  mockPerformanceMonitor.recordAPIResponse(endpoint, duration);
  
  return result;
});

export const mockMeasureAsync = jest.fn().mockImplementation(async (name, fn, tags) => {
  const result = await fn();
  return result;
});

export const mockMeasureSync = jest.fn().mockImplementation((name, fn, tags) => {
  const result = fn();
  return result;
});

// Audio Streaming Metrics Mock
export const mockAudioStreamingMetrics = {
  recordRequest: jest.fn(),
  recordError: jest.fn(),
  getStats: jest.fn().mockReturnValue({
    totalRequests: 1,
    totalErrors: 0,
    totalLatency: 500,
    totalFirstByteLatency: 0,
    totalChunks: 0,
    averageLatency: 500,
    averageFirstByteLatency: 0,
    averageChunksPerRequest: 0,
    errorRate: 0,
    errorTypes: {}
  }),
  reset: jest.fn()
};

// Audio Stream Manager Mock
export const mockAudioStreamManager = {
  initialize: jest.fn().mockResolvedValue(undefined),
  addAudioChunk: jest.fn().mockResolvedValue(undefined),
  stop: jest.fn(),
  getState: jest.fn().mockReturnValue('running'),
  destroy: jest.fn()
};

// Neon Database Mock - Enhanced to support audio error logging
export const mockNeonQuery = jest.fn().mockImplementation((strings, ...values) => {
  // Handle different query patterns
  const query = strings.join('').toLowerCase();
  
  // For SELECT queries that expect conversations with metadata
  if (query.includes('select') && query.includes('metadata') && query.includes('conversations')) {
    // Return a conversation with proper metadata structure
    return Promise.resolve([{
      id: 'conv-123',
      metadata: {
        audio_errors: [],
        audio_error_count: 0,
        last_audio_error: null
      },
      session_id: 'session-123',
      robot_personality: 'robot-friend',
      user_message: 'Test message',
      robot_response: 'Test response',
      created_at: new Date().toISOString()
    }]);
  }
  
  // For UPDATE queries, return success
  if (query.includes('update')) {
    return Promise.resolve([]);
  }
  
  // Default to empty array for other queries
  return Promise.resolve([]);
});

mockNeonQuery.raw = jest.fn().mockResolvedValue({ rows: [] });

// Request/Response Mocks for API Routes
export class MockRequest {
  public method: string;
  public headers: Headers;
  public url: string;
  private body: any;

  constructor(init: { method?: string; body?: any; headers?: Record<string, string> } = {}) {
    this.method = init.method || 'GET';
    this.headers = new Headers(init.headers || {});
    this.url = 'http://localhost:3000/api/test';
    this.body = init.body;
  }

  async json() {
    return this.body;
  }

  async text() {
    return JSON.stringify(this.body);
  }
}

export class MockResponse {
  public status: number = 200;
  public headers: Headers = new Headers();
  private body: any;

  json(data: any, init?: ResponseInit) {
    this.body = data;
    if (init?.status) this.status = init.status;
    if (init?.headers) {
      Object.entries(init.headers).forEach(([key, value]) => {
        this.headers.set(key, value);
      });
    }
    return this;
  }

  getBody() {
    return this.body;
  }
}

// Utility function to reset all mocks
export const resetAllMocks = () => {
  jest.clearAllMocks();
  
  // Reset ElevenLabs widget
  Object.values(mockElevenLabsWidgetInstance).forEach(fn => {
    if (typeof fn === 'function' && 'mockClear' in fn) {
      fn.mockClear();
    }
  });
  
  // Reset conversation hook
  Object.entries(mockUseConversation).forEach(([key, value]) => {
    if (typeof value === 'function' && 'mockClear' in value) {
      value.mockClear();
    }
  });
  
  // Reset other mocks
  mockAnthropicClient.messages.create.mockClear();
  mockNeonQuery.mockClear();
  mockNeonQuery.raw.mockClear();
  
  // Reset performance monitor mocks and state
  Object.values(mockPerformanceMonitor).forEach(fn => {
    if (typeof fn === 'function' && 'mockClear' in fn) {
      fn.mockClear();
    }
  });
  // Reset performance state
  performanceState.metrics = [];
  performanceState.chatResponseTimes = [];
  performanceState.ttsResponseTimes = [];
  performanceState.errors = [];
  performanceState.cacheHitRate = 0;
  
  mockTrackAPICall.mockClear();
  mockMeasureAsync.mockClear();
  mockMeasureSync.mockClear();
  
  // Reset cache store
  cacheStore.clear();
  
  // Reset audio streaming mocks
  Object.values(mockAudioStreamingMetrics).forEach(fn => {
    if (typeof fn === 'function' && 'mockClear' in fn) {
      fn.mockClear();
    }
  });
  Object.values(mockAudioStreamManager).forEach(fn => {
    if (typeof fn === 'function' && 'mockClear' in fn) {
      fn.mockClear();
    }
  });
};