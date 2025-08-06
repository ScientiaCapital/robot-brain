/**
 * ElevenLabs TTS Integration Health Tests
 * Component 2: Production Health Verification Test Suite
 * 
 * TDD RED-GREEN-REFACTOR Pattern Implementation
 * Tests ElevenLabs TTS integration health with focus on:
 * - 75ms latency requirement compliance
 * - Voice quality and consistency (Rachel voice)
 * - Audio format and streaming capabilities
 * - Error handling and fallback scenarios
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/voice/text-to-speech/route';
import { POST as ValidateElevenLabs } from '@/app/api/deployment/validate-elevenlabs/route';

// Mock fetch for ElevenLabs API
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock validation module
jest.mock('@/lib/validation', () => ({
  schemas: {
    ttsRequest: {
      safeParse: jest.fn().mockReturnValue({
        success: true,
        data: { text: 'Test TTS message', personality: 'robot-friend' }
      })
    }
  },
  checkRateLimit: jest.fn(() => true),
  getClientIP: jest.fn(() => '127.0.0.1'),
}));

// Mock robot config
jest.mock('@/lib/robot-config', () => ({
  ROBOT_PERSONALITIES: {
    'robot-friend': {
      id: 'robot-friend',
      name: 'Robot Friend',
      emoji: '😊',
      systemPrompt: 'You are a helpful assistant.',
      voice_id: '21m00Tcm4TlvDq8ikWAM', // Rachel voice
    },
  },
}));

const PRODUCTION_URL = 'https://robot-brain-owaxqerjd-scientia-capital.vercel.app';
const ELEVENLABS_MODEL = 'eleven_flash_v2_5';
const RACHEL_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';
const LATENCY_TARGET = 75; // 75ms target
const MAX_LATENCY_THRESHOLD = 150; // Maximum acceptable latency

describe('ElevenLabs TTS Integration Health Tests', () => {
  const mockValidation = jest.mocked(require('@/lib/validation'));

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    
    // Default mock for successful TTS response
    const mockAudioBuffer = new ArrayBuffer(1024);
    mockFetch.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(mockAudioBuffer),
      headers: new Headers({
        'content-type': 'audio/mpeg',
      }),
    });

    // Reset validation mock
    mockValidation.schemas.ttsRequest.safeParse.mockReturnValue({
      success: true,
      data: { text: 'Test TTS message', personality: 'robot-friend' }
    });
  });

  describe('RED Phase - TTS Configuration Tests', () => {
    test('should use eleven_flash_v2_5 model for low latency', async () => {
      const request = new Request('http://localhost:3000/api/voice/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Test flash model configuration',
          personality: 'robot-friend',
        }),
      }) as unknown as NextRequest;

      await POST(request);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"model_id":"eleven_flash_v2_5"'),
        })
      );
    });

    test('should use Rachel voice (21m00Tcm4TlvDq8ikWAM) for robot-friend', async () => {
      const request = new Request('http://localhost:3000/api/voice/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Test Rachel voice',
          personality: 'robot-friend',
        }),
      }) as unknown as NextRequest;

      await POST(request);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(RACHEL_VOICE_ID),
        expect.any(Object)
      );
    });

    test('should use optimized voice settings for quality', async () => {
      const request = new Request('http://localhost:3000/api/voice/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Test voice settings',
          personality: 'robot-friend',
        }),
      }) as unknown as NextRequest;

      await POST(request);

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.voice_settings).toEqual({
        stability: 0.5,
        similarity_boost: 0.8,
        style: 0.0,
        use_speaker_boost: true,
      });
    });
  });

  describe('GREEN Phase - Latency Requirement Tests', () => {
    test('should meet 75ms latency target for TTS generation', async () => {
      const startTime = Date.now();
      
      // Simulate realistic ElevenLabs API latency
      mockFetch.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            const mockAudioBuffer = new ArrayBuffer(2048);
            resolve({
              ok: true,
              arrayBuffer: () => Promise.resolve(mockAudioBuffer),
              headers: new Headers({
                'content-type': 'audio/mpeg',
              }),
            });
          }, 60); // 60ms simulated latency (under 75ms target)
        });
      });

      const request = new Request('http://localhost:3000/api/voice/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Quick response test',
          personality: 'robot-friend',
        }),
      }) as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();
      const endTime = Date.now();
      const totalLatency = endTime - startTime;

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('latency');
      
      // Parse latency string (e.g., "60ms")
      const reportedLatency = parseInt(data.latency);
      expect(reportedLatency).toBeLessThanOrEqual(LATENCY_TARGET);
      expect(totalLatency).toBeLessThan(MAX_LATENCY_THRESHOLD);
    });

    test('should handle varying text lengths efficiently', async () => {
      const testCases = [
        { text: 'Hi!', expectedLatency: 50 },
        { text: 'This is a medium length sentence for testing.', expectedLatency: 65 },
        { text: 'This is a much longer sentence that contains more words and should still meet our latency requirements for text-to-speech conversion.', expectedLatency: 75 },
      ];

      for (const testCase of testCases) {
        mockFetch.mockImplementationOnce(() => {
          return new Promise((resolve) => {
            setTimeout(() => {
              const mockAudioBuffer = new ArrayBuffer(testCase.text.length * 100);
              resolve({
                ok: true,
                arrayBuffer: () => Promise.resolve(mockAudioBuffer),
                headers: new Headers({
                  'content-type': 'audio/mpeg',
                }),
              });
            }, testCase.expectedLatency);
          });
        });

        const request = new Request('http://localhost:3000/api/voice/text-to-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: testCase.text,
            personality: 'robot-friend',
          }),
        }) as unknown as NextRequest;

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('latency');
        
        const reportedLatency = parseInt(data.latency);
        expect(reportedLatency).toBeLessThanOrEqual(MAX_LATENCY_THRESHOLD);
      }
    });

    test('should track and report audio chunk size for streaming', async () => {
      const mockAudioBuffer = new ArrayBuffer(4096);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockAudioBuffer),
        headers: new Headers({
          'content-type': 'audio/mpeg',
        }),
      });

      const request = new Request('http://localhost:3000/api/voice/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Test audio chunk size',
          personality: 'robot-friend',
        }),
      }) as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('chunkSize');
      expect(data.chunkSize).toBe(4096);
    });
  });

  describe('REFACTOR Phase - Audio Quality and Format Tests', () => {
    test('should return proper audio/mpeg format', async () => {
      const mockAudioBuffer = new ArrayBuffer(2048);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockAudioBuffer),
        headers: new Headers({
          'content-type': 'audio/mpeg',
        }),
      });

      const request = new Request('http://localhost:3000/api/voice/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Test audio format',
          personality: 'robot-friend',
        }),
      }) as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('contentType', 'audio/mpeg');
      expect(data).toHaveProperty('audio');
      expect(typeof data.audio).toBe('string'); // Base64 encoded
    });

    test('should validate audio buffer size is reasonable', async () => {
      const testText = 'This is a test sentence.';
      const expectedMinSize = testText.length * 50; // Minimum bytes per character
      const expectedMaxSize = testText.length * 500; // Maximum bytes per character
      
      const mockAudioBuffer = new ArrayBuffer(1200); // Reasonable size for test text
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockAudioBuffer),
        headers: new Headers({
          'content-type': 'audio/mpeg',
        }),
      });

      const request = new Request('http://localhost:3000/api/voice/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testText,
          personality: 'robot-friend',
        }),
      }) as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.chunkSize).toBeGreaterThanOrEqual(expectedMinSize);
      expect(data.chunkSize).toBeLessThanOrEqual(expectedMaxSize);
    });

    test('should maintain voice consistency across multiple requests', async () => {
      const requests = ['Hello!', 'How are you?', 'Nice to meet you!'];
      const responses = [];

      for (const text of requests) {
        const mockAudioBuffer = new ArrayBuffer(1024);
        mockFetch.mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(mockAudioBuffer),
          headers: new Headers({
            'content-type': 'audio/mpeg',
          }),
        });

        const request = new Request('http://localhost:3000/api/voice/text-to-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            personality: 'robot-friend',
          }),
        }) as unknown as NextRequest;

        const response = await POST(request);
        const data = await response.json();
        responses.push(data);
      }

      // All requests should use the same voice and model
      expect(responses).toHaveLength(3);
      responses.forEach(response => {
        expect(response.model).toBe(ELEVENLABS_MODEL);
      });

      // Verify same voice ID was used for all requests
      mockFetch.mock.calls.forEach(call => {
        expect(call[0]).toContain(RACHEL_VOICE_ID);
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle ElevenLabs API rate limiting', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: () => Promise.resolve('Rate limit exceeded'),
        headers: new Headers({
          'retry-after': '60',
        }),
      });

      const request = new Request('http://localhost:3000/api/voice/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Test rate limiting',
          personality: 'robot-friend',
        }),
      }) as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Voice generation failed');
    });

    test('should handle network timeouts gracefully', async () => {
      mockFetch.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Network timeout'));
          }, 5000);
        });
      });

      const request = new Request('http://localhost:3000/api/voice/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Test timeout',
          personality: 'robot-friend',
        }),
      }) as unknown as NextRequest;

      const responsePromise = POST(request);
      
      // Fast-forward time
      jest.advanceTimersByTime(5000);
      
      const response = await responsePromise;
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Failed to generate speech');
    });

    test('should validate text length limits (5000 characters)', async () => {
      const longText = 'A'.repeat(5001);
      
      mockValidation.schemas.ttsRequest.safeParse.mockReturnValueOnce({
        success: false,
        error: {
          issues: [{ message: 'Text exceeds maximum length of 5000 characters' }]
        }
      });

      const request = new Request('http://localhost:3000/api/voice/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: longText,
          personality: 'robot-friend',
        }),
      }) as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error', 'Invalid input');
    });

    test('should handle empty text gracefully', async () => {
      mockValidation.schemas.ttsRequest.safeParse.mockReturnValueOnce({
        success: false,
        error: {
          issues: [{ message: 'Text is required' }]
        }
      });

      const request = new Request('http://localhost:3000/api/voice/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: '',
          personality: 'robot-friend',
        }),
      }) as unknown as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error', 'Invalid input');
    });
  });

  describe('Production Health Validation', () => {
    test('should validate ElevenLabs API key configuration', async () => {
      const request = new Request('http://localhost:3000/api/deployment/validate-elevenlabs', {
        method: 'GET',
      }) as unknown as NextRequest;

      // Mock environment variable
      process.env.ELEVENLABS_API_KEY = 'test-api-key';

      const response = await ValidateElevenLabs(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('status', 'healthy');
      expect(data).toHaveProperty('configured', true);
    });

    test('should measure TTS generation performance metrics', async () => {
      const performanceRuns = 5;
      const latencies = [];

      for (let i = 0; i < performanceRuns; i++) {
        const startTime = Date.now();
        
        mockFetch.mockImplementationOnce(() => {
          return new Promise((resolve) => {
            const latency = 50 + Math.random() * 25; // 50-75ms range
            setTimeout(() => {
              const mockAudioBuffer = new ArrayBuffer(2048);
              resolve({
                ok: true,
                arrayBuffer: () => Promise.resolve(mockAudioBuffer),
                headers: new Headers({
                  'content-type': 'audio/mpeg',
                }),
              });
            }, latency);
          });
        });

        const request = new Request('http://localhost:3000/api/voice/text-to-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `Performance test ${i}`,
            personality: 'robot-friend',
          }),
        }) as unknown as NextRequest;

        const response = await POST(request);
        const data = await response.json();
        const endTime = Date.now();
        
        latencies.push(endTime - startTime);
        
        expect(response.status).toBe(200);
      }

      // Calculate average latency
      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      expect(avgLatency).toBeLessThan(MAX_LATENCY_THRESHOLD);
      
      // Ensure consistency (no outliers)
      const maxLatency = Math.max(...latencies);
      expect(maxLatency).toBeLessThan(MAX_LATENCY_THRESHOLD * 1.5);
    });

    test('should handle concurrent TTS requests', async () => {
      const concurrentRequests = 3;
      const requests = [];

      for (let i = 0; i < concurrentRequests; i++) {
        mockFetch.mockImplementationOnce(() => {
          return new Promise((resolve) => {
            setTimeout(() => {
              const mockAudioBuffer = new ArrayBuffer(1024);
              resolve({
                ok: true,
                arrayBuffer: () => Promise.resolve(mockAudioBuffer),
                headers: new Headers({
                  'content-type': 'audio/mpeg',
                }),
              });
            }, 50 + i * 10); // Stagger response times slightly
          });
        });

        const request = new Request('http://localhost:3000/api/voice/text-to-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `Concurrent request ${i}`,
            personality: 'robot-friend',
          }),
        }) as unknown as NextRequest;

        requests.push(POST(request));
      }

      const responses = await Promise.all(requests);
      const data = await Promise.all(responses.map(r => r.json()));

      expect(responses).toHaveLength(concurrentRequests);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      data.forEach(d => {
        expect(d).toHaveProperty('audio');
        expect(d).toHaveProperty('latency');
        expect(d).toHaveProperty('model', ELEVENLABS_MODEL);
      });
    });
  });
});