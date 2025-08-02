/**
 * @jest-environment node
 */

/**
 * Chat API Tests
 * 
 * RED Phase - TDD Tests for Chat Optimization
 * These tests will initially FAIL to drive improvements:
 * 1. Enforce concise responses (under 100 tokens)
 * 2. Improve conversation history management
 * 3. Validate Neon database storage
 * 4. Optimize response quality and performance
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/chat/route';

// Mock Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn(),
    },
  }));
});

// Mock Neon database
jest.mock('@neondatabase/serverless', () => ({
  neon: jest.fn(() => jest.fn()),
}));

// Mock robot configuration
jest.mock('@/lib/robot-config', () => ({
  ROBOT_PERSONALITIES: {
    'robot-friend': {
      id: 'robot-friend',
      name: 'Robot Friend',
      emoji: '😊',
      systemPrompt: 'You are a helpful, concise assistant. Keep responses brief and clear.',
      voice_id: '21m00Tcm4TlvDq8ikWAM',
    },
  },
}));

const mockAnthropicCreate = jest.fn();
const mockNeonSql = jest.fn();

// Mock environment variables
const mockEnvVars = {
  ANTHROPIC_API_KEY: 'sk-ant-test-key-12345',
  NEON_DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
};

describe('Chat API - Response Optimization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock environment variables
    Object.entries(mockEnvVars).forEach(([key, value]) => {
      process.env[key] = value;
    });

    // Setup mocks
    const Anthropic = require('@anthropic-ai/sdk');
    Anthropic.mockImplementation(() => ({
      messages: {
        create: mockAnthropicCreate,
      },
    }));

    const { neon } = require('@neondatabase/serverless');
    neon.mockReturnValue(mockNeonSql);
  });

  describe('Token Optimization', () => {
    test('should use max_tokens of 100 or less for concise responses', async () => {
      mockAnthropicCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'Brief response' }],
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Hello robot!',
          personality: 'robot-friend',
          sessionId: 'test-session',
        }),
      });

      await POST(request);

      expect(mockAnthropicCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 100, // Should be 100 or less, not 150
        })
      );
    });

    test('should use optimized temperature for consistent responses', async () => {
      mockAnthropicCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'Consistent response' }],
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Tell me a fact',
          personality: 'robot-friend',
          sessionId: 'test-session',
        }),
      });

      await POST(request);

      expect(mockAnthropicCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.3, // Lower temperature for more consistent, less random responses
        })
      );
    });

    test('should validate response length is within token limit', async () => {
      const longResponse = 'A'.repeat(500); // Simulate long response
      mockAnthropicCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: longResponse }],
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Give me a detailed explanation',
          personality: 'robot-friend',
          sessionId: 'test-session',
        }),
      });

      const response = await POST(request);
      const responseData = await response.json();

      // Response should be truncated or system should enforce conciseness
      expect(responseData.message.length).toBeLessThanOrEqual(400); // Roughly 100 tokens
    });
  });

  describe('Enhanced System Prompt', () => {
    test('should include conciseness instruction in system prompt', async () => {
      mockAnthropicCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'Brief response' }],
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Hello',
          personality: 'robot-friend',
          sessionId: 'test-session',
        }),
      });

      await POST(request);

      expect(mockAnthropicCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.stringContaining('concise'),
        })
      );
    });

    test('should discourage excessive emoji use in system prompt', async () => {
      mockAnthropicCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'Response without excessive emojis' }],
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Tell me about yourself',
          personality: 'robot-friend',
          sessionId: 'test-session',
        }),
      });

      await POST(request);

      const systemPrompt = mockAnthropicCreate.mock.calls[0][0].system;
      expect(systemPrompt).toMatch(/use emojis sparingly|limit emojis|minimal emojis/i);
    });

    test('should include age-appropriate guidance in system prompt', async () => {
      mockAnthropicCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'Age-appropriate response' }],
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'What should I know about science?',
          personality: 'robot-friend',
          sessionId: 'test-session',
        }),
      });

      await POST(request);

      const systemPrompt = mockAnthropicCreate.mock.calls[0][0].system;
      expect(systemPrompt).toMatch(/age.appropriate|child.friendly|kid.friendly/i);
    });
  });

  describe('Conversation History Management', () => {
    test('should maintain conversation context across messages', async () => {
      // First message
      mockAnthropicCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'Hi there!' }],
      });

      const firstRequest = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Hello, my name is Alex',
          personality: 'robot-friend',
          sessionId: 'context-test',
        }),
      });

      await POST(firstRequest);

      // Second message
      mockAnthropicCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'Nice to meet you, Alex!' }],
      });

      const secondRequest = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Do you remember my name?',
          personality: 'robot-friend',
          sessionId: 'context-test',
        }),
      });

      await POST(secondRequest);

      // Should include previous conversation in messages
      const secondCallMessages = mockAnthropicCreate.mock.calls[1][0].messages;
      expect(secondCallMessages.length).toBeGreaterThan(1);
      expect(secondCallMessages[0].content).toContain('Alex');
    });

    test('should limit conversation history to prevent token overflow', async () => {
      // Simulate many messages in history
      const manyMessages = Array.from({ length: 20 }, (_, i) => [
        { role: 'user', content: `Message ${i}` },
        { role: 'assistant', content: `Response ${i}` },
      ]).flat();

      // Mock conversation history retrieval
      const originalMap = global.Map;
      const mockHistory = new Map();
      mockHistory.set('long-session', manyMessages);
      global.Map = jest.fn(() => mockHistory) as any;

      mockAnthropicCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'Response with limited history' }],
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Latest message',
          personality: 'robot-friend',
          sessionId: 'long-session',
        }),
      });

      await POST(request);

      const callMessages = mockAnthropicCreate.mock.calls[0][0].messages;
      // Should limit history to reasonable number (e.g., 10 messages)
      expect(callMessages.length).toBeLessThanOrEqual(11); // 10 history + 1 current

      global.Map = originalMap;
    });

    test('should handle empty conversation history gracefully', async () => {
      mockAnthropicCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'First message response' }],
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'This is my first message',
          personality: 'robot-friend',
          sessionId: 'new-session',
        }),
      });

      await POST(request);

      const callMessages = mockAnthropicCreate.mock.calls[0][0].messages;
      expect(callMessages.length).toBe(1);
      expect(callMessages[0].role).toBe('user');
      expect(callMessages[0].content).toBe('This is my first message');
    });
  });

  describe('Neon Database Integration', () => {
    test('should store conversations in Neon database', async () => {
      mockAnthropicCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'Stored response' }],
      });

      mockNeonSql.mockResolvedValueOnce([]);

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Store this conversation',
          personality: 'robot-friend',
          sessionId: 'db-test',
        }),
      });

      await POST(request);

      expect(mockNeonSql).toHaveBeenCalledWith(
        expect.arrayContaining([
          'db-test',
          'robot-friend',
          'Store this conversation',
          'Stored response',
        ])
      );
    });

    test('should handle database errors gracefully', async () => {
      mockAnthropicCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'Response despite DB error' }],
      });

      mockNeonSql.mockRejectedValueOnce(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Test DB error handling',
          personality: 'robot-friend',
          sessionId: 'error-test',
        }),
      });

      const response = await POST(request);

      // Should still return successful response even if DB fails
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.message).toBe('Response despite DB error');
    });

    test('should include conversation metadata in database storage', async () => {
      mockAnthropicCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'Response with metadata' }],
      });

      mockNeonSql.mockResolvedValueOnce([]);

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Test metadata storage',
          personality: 'robot-friend',
          sessionId: 'metadata-test',
        }),
      });

      await POST(request);

      // Should store additional metadata
      expect(mockNeonSql).toHaveBeenCalledWith(
        expect.objectContaining({
          strings: expect.arrayContaining([
            expect.any(String), // session_id
            expect.any(String), // personality
            expect.any(String), // user_message
            expect.any(String), // robot_response
          ]),
        })
      );
    });
  });

  describe('Error Handling and Validation', () => {
    test('should validate required message parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          personality: 'robot-friend',
          sessionId: 'validation-test',
        }),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData).toHaveProperty('error', 'Message is required');
    });

    test('should handle empty message parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: '',
          personality: 'robot-friend',
          sessionId: 'empty-test',
        }),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData).toHaveProperty('error', 'Message is required');
    });

    test('should handle invalid personality gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Test invalid personality',
          personality: 'invalid-robot',
          sessionId: 'invalid-test',
        }),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData).toHaveProperty('error', 'Invalid personality');
    });

    test('should handle Anthropic API failures', async () => {
      mockAnthropicCreate.mockRejectedValueOnce(new Error('Anthropic API error'));

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Test API error',
          personality: 'robot-friend',
          sessionId: 'api-error-test',
        }),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData).toHaveProperty('error', 'Failed to process chat message');
    });

    test('should sanitize user input for security', async () => {
      const maliciousInput = '<script>alert("xss")</script>Tell me about robots';
      
      mockAnthropicCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'Safe response' }],
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: maliciousInput,
          personality: 'robot-friend',
          sessionId: 'security-test',
        }),
      });

      await POST(request);

      const callMessages = mockAnthropicCreate.mock.calls[0][0].messages;
      const sentMessage = callMessages[0].content;
      
      // Should sanitize or escape dangerous content
      expect(sentMessage).not.toContain('<script>');
      expect(sentMessage).toContain('Tell me about robots');
    });
  });

  describe('Response Quality and Performance', () => {
    test('should return properly formatted response with metadata', async () => {
      mockAnthropicCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'Well-formatted response' }],
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Test response format',
          personality: 'robot-friend',
          sessionId: 'format-test',
        }),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData).toHaveProperty('message', 'Well-formatted response');
      expect(responseData).toHaveProperty('personality', 'robot-friend');
      expect(responseData).toHaveProperty('emoji', '😊');
      expect(responseData).toHaveProperty('name', 'Robot Friend');
      expect(responseData).toHaveProperty('sessionId', 'format-test');
    });

    test('should include performance metrics in response', async () => {
      const startTime = Date.now();
      
      mockAnthropicCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'Performance tracked response' }],
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Test performance tracking',
          personality: 'robot-friend',
          sessionId: 'perf-test',
        }),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(responseData).toHaveProperty('responseTime');
      expect(responseData).toHaveProperty('tokensUsed');
      expect(responseData.responseTime).toBeGreaterThan(0);
    });

    test('should handle concurrent requests efficiently', async () => {
      const promises = Array.from({ length: 5 }, (_, i) => {
        mockAnthropicCreate.mockResolvedValueOnce({
          content: [{ type: 'text', text: `Response ${i}` }],
        });

        return POST(new NextRequest('http://localhost:3000/api/chat', {
          method: 'POST',
          body: JSON.stringify({
            message: `Concurrent message ${i}`,
            personality: 'robot-friend',
            sessionId: `concurrent-${i}`,
          }),
        }));
      });

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });
  });
});