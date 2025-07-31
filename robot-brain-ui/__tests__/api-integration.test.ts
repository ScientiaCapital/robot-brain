/**
 * API Integration Tests
 * Tests the actual deployed Cloudflare Worker API endpoints
 */

const API_BASE_URL = 'https://robot-brain.tkipper.workers.dev'

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
  describe('GET /api/robots', () => {
    test('should return all robot personalities', async () => {
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

    test('should handle RoboPirate adventure request', async () => {
      const response = await apiRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          personality: 'pirate',
          message: 'Tell me about treasure hunting'
        })
      })

      expect(response.personality).toBe('pirate')
      expect(response.emoji).toBe('🏴‍☠️')
      expect(response.name).toBe('RoboPirate')
      expect(response.response).toContain('🏴‍☠️')
    })

    test('should handle RoboDrama performance request', async () => {
      const response = await apiRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          personality: 'drama',
          message: 'Perform something dramatic'
        })
      })

      expect(response.personality).toBe('drama')
      expect(response.emoji).toBe('🎭')
      expect(response.name).toBe('RoboDrama')
      expect(response.response).toContain('🎭')
    })

    test('should handle invalid personality gracefully', async () => {
      try {
        await apiRequest('/api/chat', {
          method: 'POST',
          body: JSON.stringify({
            personality: 'invalid',
            message: 'Hello'
          })
        })
        fail('Should have thrown an error for invalid personality')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    test('should handle empty message gracefully', async () => {
      const response = await apiRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          personality: 'friend',
          message: ''
        })
      })

      expect(response).toHaveProperty('response')
      expect(response.response).toBeDefined()
    })

    test('should respect model parameter', async () => {
      const response = await apiRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          personality: 'friend',
          message: 'Hello',
          model: '@cf/tinyllama/tinyllama-1.1b-chat-v1.0'
        })
      })

      expect(response.model).toBe('@cf/tinyllama/tinyllama-1.1b-chat-v1.0')
    })

    test('should return all required response fields', async () => {
      const response = await apiRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          personality: 'friend',
          message: 'Test message'
        })
      })

      const requiredFields = ['personality', 'response', 'emoji', 'name', 'model', 'tools']
      requiredFields.forEach(field => {
        expect(response).toHaveProperty(field)
      })
    })
  })

  describe('CORS and Headers', () => {
    test('should include proper CORS headers', async () => {
      const response = await fetch(`${API_BASE_URL}/api/robots`)
      
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET')
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST')
      expect(response.headers.get('Content-Type')).toBe('application/json')
    })

    test('should handle OPTIONS preflight request', async () => {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'OPTIONS'
      })
      
      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    })
  })

  describe('Performance and Reliability', () => {
    test('should respond within reasonable time', async () => {
      const startTime = Date.now()
      
      await apiRequest('/api/robots')
      
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      // Should respond within 5 seconds
      expect(responseTime).toBeLessThan(5000)
    })

    test('should handle multiple concurrent requests', async () => {
      const requests = Array(5).fill(null).map(() => 
        apiRequest('/api/chat', {
          method: 'POST',
          body: JSON.stringify({
            personality: 'friend',
            message: 'Concurrent test'
          })
        })
      )

      const responses = await Promise.all(requests)
      
      responses.forEach(response => {
        expect(response).toHaveProperty('response')
        expect(response.personality).toBe('friend')
      })
    })
  })
})