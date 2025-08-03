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

// Fetch Mock for API calls
export const mockFetchResponse = (data: any, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers({
      'content-type': 'application/json',
    }),
  } as Response);
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

// Response Cache Mock
export const mockResponseCache = {
  get: jest.fn(),
  set: jest.fn(),
  clear: jest.fn(),
  has: jest.fn().mockReturnValue(false),
};

// Performance Monitor Mock
export const mockPerformanceMonitor = {
  startTimer: jest.fn().mockReturnValue('timer-123'),
  endTimer: jest.fn().mockReturnValue(100),
  trackMetric: jest.fn(),
  getMetrics: jest.fn().mockReturnValue({}),
  reset: jest.fn(),
};

// Neon Database Mock
export const mockNeonQuery = jest.fn().mockResolvedValue({ rows: [] });
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
};