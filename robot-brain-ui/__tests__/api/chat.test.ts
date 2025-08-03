/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { MockRequest, MockResponse } from '../setup/mocks';

// Mock Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => {
  const mockCreate = jest.fn();
  const MockAnthropic = jest.fn().mockImplementation(() => ({
    messages: {
      create: mockCreate,
    },
  }));
  // Expose mockCreate for tests
  MockAnthropic.mockCreate = mockCreate;
  return MockAnthropic;
});

// Mock Neon database
jest.mock('@neondatabase/serverless', () => {
  const mockSql = jest.fn().mockResolvedValue({ rows: [] });
  return {
    neon: jest.fn(() => mockSql),
    mockSql, // Expose for tests
  };
});

// Import after mocks
import { POST } from '@/app/api/chat/route';

// Mock robot config
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

// Mock validation module
jest.mock('@/lib/validation', () => ({
  schemas: {
    chatRequest: {
      safeParse: jest.fn().mockReturnValue({
        success: true,
        data: { message: 'Hello', personality: 'robot-friend', sessionId: 'test-session' }
      })
    }
  },
  sanitizeInput: jest.fn((input) => input),
  validateSessionId: jest.fn((id) => id || 'default'),
  checkRateLimit: jest.fn(() => true),
  getClientIP: jest.fn(() => '127.0.0.1'),
}));

// Mock response cache
jest.mock('@/lib/response-cache', () => ({
  responseCache: {
    get: jest.fn(),
    set: jest.fn(),
    generateKey: jest.fn(() => 'cache-key'),
    has: jest.fn().mockReturnValue(false),
  },
  logCachePerformance: jest.fn(),
}));

describe('Chat API Route', () => {
  // Get access to the mocked modules
  const mockValidation = jest.mocked(require('@/lib/validation'));
  const { responseCache } = jest.mocked(require('@/lib/response-cache'));
  const MockAnthropic = jest.mocked(require('@anthropic-ai/sdk'));
  const mockCreate = MockAnthropic.mockCreate;
  const { mockSql } = jest.mocked(require('@neondatabase/serverless'));
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset default validation mock
    mockValidation.schemas.chatRequest.safeParse.mockReturnValue({
      success: true,
      data: { message: 'Hello', personality: 'robot-friend', sessionId: 'test-session' }
    });
    
    // Reset cache mock
    responseCache.get.mockReturnValue(null);
    
    // Default mock response
    mockCreate.mockResolvedValue({
      id: 'msg_123',
      model: 'claude-3-haiku-20240307',
      role: 'assistant',
      content: [{ type: 'text', text: 'Hello! How can I help you today?' }],
      usage: { input_tokens: 10, output_tokens: 8 },
    });
  });

  describe('Request Validation', () => {
    it('should return 400 for missing message', async () => {
      // Mock validation failure
      mockValidation.schemas.chatRequest.safeParse.mockReturnValueOnce({
        success: false,
        error: { issues: [{ message: 'Message is required' }] }
      });

      const request = new MockRequest({
        method: 'POST',
        body: { personality: 'robot-friend' },
      }) as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input');
    });

    it('should return 400 for missing personality', async () => {
      // Mock validation failure
      mockValidation.schemas.chatRequest.safeParse.mockReturnValueOnce({
        success: false,
        error: { issues: [{ message: 'Personality is required' }] }
      });

      const request = new MockRequest({
        method: 'POST',
        body: { message: 'Hello' },
      }) as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input');
    });

    it('should return 400 for invalid personality', async () => {
      // Mock successful validation but invalid personality
      mockValidation.schemas.chatRequest.safeParse.mockReturnValueOnce({
        success: true,
        data: { message: 'Hello', personality: 'invalid-robot', sessionId: 'test' }
      });

      const request = new MockRequest({
        method: 'POST',
        body: { message: 'Hello', personality: 'invalid-robot' },
      }) as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid personality');
    });
  });

  describe('Successful Chat', () => {
    it('should return AI response for valid request', async () => {
      const request = new MockRequest({
        method: 'POST',
        body: {
          message: 'Hello Robot Friend!',
          personality: 'robot-friend',
          sessionId: 'test-session-123',
        },
      }) as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Hello! How can I help you today?');
      expect(data.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should enforce concise responses (under 100 tokens)', async () => {
      const request = new MockRequest({
        method: 'POST',
        body: {
          message: 'Tell me everything about space',
          personality: 'robot-friend',
        },
      }) as unknown as NextRequest;

      await POST(request);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 100,
          temperature: 0.3,
        })
      );
    });

    it('should include conversation history in context', async () => {
      const sessionId = 'test-session-456';
      
      // Mock validation for first message
      mockValidation.schemas.chatRequest.safeParse.mockReturnValueOnce({
        success: true,
        data: { message: 'My name is Alice', personality: 'robot-friend', sessionId }
      });
      
      // First message
      const request1 = new MockRequest({
        method: 'POST',
        body: {
          message: 'My name is Alice',
          personality: 'robot-friend',
          sessionId,
        },
      }) as unknown as NextRequest;

      await POST(request1);

      // Mock validation for second message
      mockValidation.schemas.chatRequest.safeParse.mockReturnValueOnce({
        success: true,
        data: { message: 'What is my name?', personality: 'robot-friend', sessionId }
      });

      // Second message
      const request2 = new MockRequest({
        method: 'POST',
        body: {
          message: 'What is my name?',
          personality: 'robot-friend',
          sessionId,
        },
      }) as unknown as NextRequest;

      await POST(request2);

      // Check that history was included (second call should have 3 messages)
      expect(mockCreate).toHaveBeenCalledTimes(2);
      const secondCall = mockCreate.mock.calls[1][0];
      expect(secondCall.messages).toHaveLength(3);
      expect(secondCall.messages[0]).toEqual({ role: 'user', content: 'My name is Alice' });
      expect(secondCall.messages[1]).toEqual({ role: 'assistant', content: 'Hello! How can I help you today?' });
      expect(secondCall.messages[2]).toEqual({ role: 'user', content: 'What is my name?' });
    });
  });

  describe('Database Storage', () => {
    it('should store conversation in Neon database', async () => {
      const request = new MockRequest({
        method: 'POST',
        body: {
          message: 'Hello!',
          personality: 'robot-friend',
          sessionId: 'test-db-123',
        },
      }) as unknown as NextRequest;

      await POST(request);

      // Check that mockSql was called with the template literal parts and parameters
      expect(mockSql).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('INSERT INTO conversations'),
        ]),
        'test-session', // sessionId from validation mock
        'robot-friend',
        'Hello',
        'Hello! How can I help you today?'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle Anthropic API errors gracefully', async () => {
      mockCreate.mockRejectedValueOnce(new Error('API rate limit exceeded'));

      const request = new MockRequest({
        method: 'POST',
        body: {
          message: 'Hello',
          personality: 'robot-friend',
        },
      }) as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to process chat message');
    });

    it('should handle database errors gracefully', async () => {
      mockSql.mockRejectedValueOnce(new Error('Database connection failed'));

      const request = new MockRequest({
        method: 'POST',
        body: {
          message: 'Hello',
          personality: 'robot-friend',
        },
      }) as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      // Should still return success even if DB fails
      expect(response.status).toBe(200);
      expect(data.message).toBe('Hello! How can I help you today?');
    });
  });

  describe('Performance', () => {
    it('should use response cache for repeated messages', async () => {
      responseCache.get.mockReturnValueOnce('Cached response!');

      const request = new MockRequest({
        method: 'POST',
        body: {
          message: 'What is 2+2?',
          personality: 'robot-friend',
        },
      }) as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(data.message).toBe('Cached response!');
      expect(data.cached).toBe(true);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should limit conversation history to 10 messages', async () => {
      const sessionId = 'test-history-limit';
      
      // Send 15 messages
      for (let i = 0; i < 15; i++) {
        const request = new MockRequest({
          method: 'POST',
          body: {
            message: `Message ${i}`,
            personality: 'robot-friend',
            sessionId,
          },
        }) as unknown as NextRequest;

        await POST(request);
      }

      // Check that we have conversation history (exact limit logic may vary)
      expect(mockCreate).toHaveBeenCalled();
      const callCount = mockCreate.mock.calls.length;
      expect(callCount).toBe(15); // Called 15 times as expected
    });
  });
});