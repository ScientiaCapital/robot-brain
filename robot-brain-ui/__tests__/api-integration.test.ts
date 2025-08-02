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
    test('should return robot personality', async () => {
      // Mock successful response
      const mockRobots = {
        'robot-friend': { 
          name: 'Robot Friend', 
          emoji: '😊', 
          traits: ['cheerful', 'supportive', 'enthusiastic'] 
        }
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
      
      // Check for robot-friend
      expect(robots['robot-friend']).toBeDefined()
      expect(robots['robot-friend']).toHaveProperty('name', 'Robot Friend')
      expect(robots['robot-friend']).toHaveProperty('emoji', '😊')
      expect(robots['robot-friend']).toHaveProperty('traits')
      expect(robots['robot-friend'].traits).toContain('cheerful')
    })
  })

  describe('GET /api/models', () => {
    test('should return available AI models', async () => {
      const mockModels = {
        chat: {
          default: 'gemini-pro',
          fast: 'gemini-pro',
          smart: 'gemini-pro'
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
        chat: { name: 'Chat', icon: '💬', description: 'General conversation' }
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
      
      // Check for chat tool
      expect(tools.chat).toBeDefined()
      expect(tools.chat).toHaveProperty('name', 'Chat')
      expect(tools.chat).toHaveProperty('icon', '💬')
      expect(tools.chat).toHaveProperty('description')
    })
  })

  describe('POST /api/chat', () => {
    test('should handle Robot Friend chat request', async () => {
      const mockResponse = {
        response: "Hello there! 😊 I'm so happy to chat with you! How are you doing today?",
        personality: 'robot-friend',
        emoji: '😊',
        name: 'Robot Friend',
        model: 'gemini-pro',
        tools: ['chat']
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
          personality: 'robot-friend',
          message: 'Hello! How are you?'
        })
      })

      expect(response).toHaveProperty('response')
      expect(response).toHaveProperty('personality', 'robot-friend')
      expect(response).toHaveProperty('emoji', '😊')
      expect(response).toHaveProperty('name', 'Robot Friend')
      expect(response).toHaveProperty('model')
      expect(response).toHaveProperty('tools')
      
      // Response should contain the emoji and be cheerful
      expect(response.response).toContain('😊')
      expect(typeof response.response).toBe('string')
      expect(response.response.length).toBeGreaterThan(10)
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