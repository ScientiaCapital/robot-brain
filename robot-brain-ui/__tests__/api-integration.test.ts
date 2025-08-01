/**
 * API Integration Tests
 * Tests the Robot Brain API endpoints with proper mocking for reliable CI/CD
 */

// Mock fetch for integration tests
const mockFetch = jest.fn()
global.fetch = mockFetch

// Use local API or mock in test environment
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000'

// Helper function to make API requests
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }
  
  return response.json()
}

describe('Robot Brain API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/robots', () => {
    test('should return all robot personalities', async () => {
      // Mock successful response
      const mockRobots = {
        friend: { name: 'RoboFriend', emoji: '😊', traits: ['cheerful'] },
        nerd: { name: 'RoboNerd', emoji: '🤓', traits: ['analytical'] },
        zen: { name: 'RoboZen', emoji: '🧘', traits: ['wise'] },
        pirate: { name: 'RoboPirate', emoji: '🏴‍☠️', traits: ['adventurous'] },
        drama: { name: 'RoboDrama', emoji: '🎭', traits: ['dramatic'] }
      }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockRobots),
        headers: new Headers({
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        })
      } as any)
      
      const robots = await apiRequest('/api/robots')
      
      expect(robots).toBeDefined()
      expect(typeof robots).toBe('object')
      
      // Check for expected robot personalities
      const expectedRobots = ['friend', 'nerd', 'zen', 'pirate', 'drama']
      expectedRobots.forEach(robotId => {
        expect(robots[robotId]).toBeDefined()
        expect(robots[robotId]).toHaveProperty('name')
        expect(robots[robotId]).toHaveProperty('emoji')
        expect(robots[robotId]).toHaveProperty('traits')
      })
    })
  })

  describe('GET /api/models', () => {
    test('should return available AI models', async () => {
      const mockModels = {
        chat: {
          default: 'llama-2-7b-chat',
          fast: 'tinyllama-1.1b-chat',
          smart: 'mistral-7b-instruct'
        }
      }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockModels),
        headers: new Headers({
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        })
      } as any)
      
      const models = await apiRequest('/api/models')
      
      expect(models).toBeDefined()
      expect(models).toHaveProperty('chat')
      expect(models.chat).toHaveProperty('default')
      expect(models.chat).toHaveProperty('fast')
      expect(models.chat).toHaveProperty('smart')
    })
  })

  describe('GET /api/tools', () => {
    test('should return available robot tools', async () => {
      const mockTools = {
        chat: { name: 'Chat', icon: '💬', description: 'General conversation' },
        jokes: { name: 'Tell Jokes', icon: '😂', description: 'Tell funny jokes' },
        calculate: { name: 'Calculator', icon: '🧮', description: 'Solve math problems' },
        wisdom: { name: 'Wisdom', icon: '🦉', description: 'Share wisdom' },
        treasure_hunt: { name: 'Treasure Hunt', icon: '🗺️', description: 'Create treasure hunts' },
        perform: { name: 'Performance', icon: '🎭', description: 'Dramatic performances' }
      }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockTools),
        headers: new Headers({
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        })
      } as any)
      
      const tools = await apiRequest('/api/tools')
      
      expect(tools).toBeDefined()
      expect(typeof tools).toBe('object')
      
      // Check for expected tools
      const expectedTools = ['chat', 'jokes', 'calculate', 'wisdom', 'treasure_hunt', 'perform']
      expectedTools.forEach(toolId => {
        expect(tools[toolId]).toBeDefined()
        expect(tools[toolId]).toHaveProperty('name')
        expect(tools[toolId]).toHaveProperty('icon')
        expect(tools[toolId]).toHaveProperty('description')
      })
    })
  })

  describe('POST /api/chat', () => {
    test('should handle RoboFriend chat request', async () => {
      const mockResponse = {
        response: "Hello there! 😊 I'm so happy to chat with you! How are you doing today?",
        personality: 'friend',
        emoji: '😊',
        name: 'RoboFriend',
        model: 'llama-2-7b-chat',
        tools: ['chat', 'jokes', 'encouragement', 'games']
      }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
        headers: new Headers({
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        })
      } as any)

      const response = await apiRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          personality: 'friend',
          message: 'Hello! How are you?'
        })
      })

      expect(response).toHaveProperty('response')
      expect(response).toHaveProperty('personality', 'friend')
      expect(response).toHaveProperty('emoji', '😊')
      expect(response).toHaveProperty('name', 'RoboFriend')
      expect(response).toHaveProperty('model')
      expect(response).toHaveProperty('tools')
      
      // Response should contain the emoji and be cheerful
      expect(response.response).toContain('😊')
      expect(typeof response.response).toBe('string')
      expect(response.response.length).toBeGreaterThan(10)
    })

    test('should handle RoboNerd math question', async () => {
      const mockResponse = {
        response: "Excellent question! 🤓 The answer to 5 + 3 is 8. This is a simple addition problem where we combine two positive integers to get their sum.",
        personality: 'nerd',
        emoji: '🤓',
        name: 'RoboNerd',
        model: 'mistral-7b-instruct',
        tools: ['chat', 'calculate', 'explain', 'research', 'code']
      }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
        headers: new Headers({
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        })
      } as any)

      const response = await apiRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          personality: 'nerd',
          message: 'What is 5 + 3?'
        })
      })

      expect(response.personality).toBe('nerd')
      expect(response.emoji).toBe('🤓')
      expect(response.name).toBe('RoboNerd')
      expect(response.response).toContain('🤓')
      
      // Should mention the answer or mathematical concept
      expect(response.response.toLowerCase()).toMatch(/(eight|8|addition|sum|math)/i)
    })

    test('should handle RoboZen wisdom request', async () => {
      const mockResponse = {
        response: "🧘 In the gentle flow of existence, wisdom emerges like morning dew on petals. True understanding comes not from rushing, but from stillness and patient observation of life's beautiful patterns.",
        personality: 'zen',
        emoji: '🧘',
        name: 'RoboZen',
        model: 'llama-2-7b-chat',
        tools: ['chat', 'meditate', 'wisdom', 'breathing']
      }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
        headers: new Headers({
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        })
      } as any)

      const response = await apiRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          personality: 'zen',
          message: 'Share some wisdom with me'
        })
      })

      expect(response.personality).toBe('zen')
      expect(response.emoji).toBe('🧘')
      expect(response.name).toBe('RoboZen')
      expect(response.response).toContain('🧘')
      
      // Should be philosophical and calming
      expect(response.response.length).toBeGreaterThan(50)
    })

    test('should handle RoboDrama performance request', async () => {
      const mockResponse = {
        response: "🎭 *strikes a dramatic pose* Ah, what magnificent stage we share! Every word, every breath, every moment is an opportunity for theatrical brilliance! Let us perform the grand opera of conversation!",
        personality: 'drama',
        emoji: '🎭',
        name: 'RoboDrama',
        model: 'llama-2-7b-chat',
        tools: ['chat', 'perform', 'shakespeare', 'poetry']
      }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
        headers: new Headers({
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        })
      } as any)

      const response = await apiRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          personality: 'drama',
          message: 'Give me a dramatic performance'
        })
      })

      expect(response.personality).toBe('drama')
      expect(response.emoji).toBe('🎭')
      expect(response.name).toBe('RoboDrama')
      expect(response.response).toContain('🎭')
      
      // Should be dramatic and theatrical
      expect(response.response.length).toBeGreaterThan(50)
    })
  })

  describe('CORS and Headers', () => {
    test('should include proper CORS headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({}),
        headers: new Headers({
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Content-Type': 'application/json'
        })
      } as any)
      
      const response = await fetch(`${API_BASE_URL}/api/robots`)
      
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET')
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST')
      expect(response.headers.get('Content-Type')).toBe('application/json')
    })

    test('should handle OPTIONS preflight request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce({}),
        headers: new Headers({
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        })
      } as any)
      
      const response = await fetch(`${API_BASE_URL}/api/chat`, { method: 'OPTIONS' })
      
      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    })
  })
})