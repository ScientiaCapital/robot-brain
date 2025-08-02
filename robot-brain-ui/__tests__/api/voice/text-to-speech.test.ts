/**
 * @jest-environment node
 */

/**
 * Voice Configuration Tests
 * 
 * RED Phase - TDD Tests for Voice Optimization
 * These tests will initially FAIL to drive improvements:
 * 1. Use eleven_flash_v2_5 model for low latency
 * 2. Support speed parameter for clarity
 * 3. Optimize voice settings for better quality
 * 4. Improve error handling
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/voice/text-to-speech/route';
import { createMockRequest } from '../../test-utils';

// Mock fetch for ElevenLabs API calls
global.fetch = jest.fn();

// Mock environment variables
const mockEnvVars = {
  ELEVENLABS_API_KEY: 'sk_test_api_key_12345'
};

// Helper function to create NextRequest with proper mocking for TTS API
function createMockTTSRequest(body: any) {
  return createMockRequest('http://localhost:3000/api/voice/text-to-speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  }) as NextRequest;
}

describe('Text-to-Speech API - Voice Optimization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock environment variables
    Object.entries(mockEnvVars).forEach(([key, value]) => {
      process.env[key] = value;
    });
  });

  describe('Low Latency Model Configuration', () => {
    test('should use eleven_flash_v2_5 model for reduced latency', async () => {
      const mockAudioBuffer = new ArrayBuffer(1024);
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockAudioBuffer),
      });

      const request = createMockTTSRequest({
        text: 'Hello, I am Robot Friend!',
        personality: 'robot-friend'
      });

      await POST(request);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('text-to-speech'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'xi-api-key': mockEnvVars.ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('"model_id":"eleven_flash_v2_5"'),
        })
      );
    });

    test('should support speed parameter for clarity control', async () => {
      const mockAudioBuffer = new ArrayBuffer(1024);
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockAudioBuffer),
      });

      const request = createMockTTSRequest({
        text: 'Testing speed control',
        personality: 'robot-friend',
        speed: 0.95
      });

      await POST(request);

      const requestBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      expect(requestBody).toHaveProperty('speed', 0.95);
    });

    test('should default to optimal speed when not specified', async () => {
      const mockAudioBuffer = new ArrayBuffer(1024);
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockAudioBuffer),
      });

      const request = createMockTTSRequest({
        text: 'Testing default speed',
        personality: 'robot-friend'
      });

      await POST(request);

      const requestBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      expect(requestBody).toHaveProperty('speed', 0.95);
    });
  });

  describe('Optimized Voice Settings', () => {
    test('should use optimized stability setting (0.5)', async () => {
      const mockAudioBuffer = new ArrayBuffer(1024);
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockAudioBuffer),
      });

      const request = createMockTTSRequest({
        text: 'Testing voice settings',
        personality: 'robot-friend'
      });

      await POST(request);

      const requestBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      expect(requestBody.voice_settings.stability).toBe(0.5);
    });

    test('should use optimized similarity_boost setting (0.8)', async () => {
      const mockAudioBuffer = new ArrayBuffer(1024);
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockAudioBuffer),
      });

      const request = createMockTTSRequest({
        text: 'Testing similarity boost',
        personality: 'robot-friend'
      });

      await POST(request);

      const requestBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      expect(requestBody.voice_settings.similarity_boost).toBe(0.8);
    });

    test('should include style parameter for enhanced voice quality', async () => {
      const mockAudioBuffer = new ArrayBuffer(1024);
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockAudioBuffer),
      });

      const request = createMockTTSRequest({
        text: 'Testing style parameter',
        personality: 'robot-friend'
      });

      await POST(request);

      const requestBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      expect(requestBody.voice_settings).toHaveProperty('style', 0.0);
    });

    test('should include use_speaker_boost for clearer audio', async () => {
      const mockAudioBuffer = new ArrayBuffer(1024);
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockAudioBuffer),
      });

      const request = createMockTTSRequest({
        text: 'Testing speaker boost',
        personality: 'robot-friend'
      });

      await POST(request);

      const requestBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      expect(requestBody.voice_settings).toHaveProperty('use_speaker_boost', true);
    });
  });

  describe('Voice Quality and Performance', () => {
    test('should use correct voice ID for robot-friend personality', async () => {
      const mockAudioBuffer = new ArrayBuffer(1024);
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockAudioBuffer),
      });

      const request = createMockTTSRequest({
        text: 'Testing voice ID',
        personality: 'robot-friend'
      });

      await POST(request);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('21m00Tcm4TlvDq8ikWAM'),
        expect.any(Object)
      );
    });

    test('should handle text length optimization for faster processing', async () => {
      const longText = 'A'.repeat(1001); // Text longer than 1000 character limit
      
      const request = createMockTTSRequest({
        text: longText,
        personality: 'robot-friend'
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData).toHaveProperty('error', 'Text too long. Maximum 1000 characters.');
    });

    test('should use flash model for low latency instead of optimize_streaming_latency', async () => {
      const mockAudioBuffer = new ArrayBuffer(1024);
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockAudioBuffer),
      });

      const request = createMockTTSRequest({
        text: 'Testing streaming optimization',
        personality: 'robot-friend'
      });

      await POST(request);

      const requestBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      expect(requestBody).toHaveProperty('model_id', 'eleven_flash_v2_5');
      expect(requestBody).not.toHaveProperty('optimize_streaming_latency');
    });
  });

  describe('Enhanced Error Handling', () => {
    test('should handle missing text parameter gracefully', async () => {
      const request = createMockTTSRequest({
        personality: 'robot-friend'
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData).toHaveProperty('error', 'Text is required');
    });

    test('should handle empty text parameter', async () => {
      const request = createMockTTSRequest({
        text: '',
        personality: 'robot-friend'
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData).toHaveProperty('error', 'Text is required');
    });

    test('should handle ElevenLabs API failures with detailed errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Rate Limit Exceeded',
        text: () => Promise.resolve('Rate limit exceeded error'),
      });

      const request = createMockTTSRequest({
        text: 'Testing error handling',
        personality: 'robot-friend'
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(429);
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toContain('Voice generation failed');
    });

    test('should handle network failures gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const request = createMockTTSRequest({
        text: 'Testing network error',
        personality: 'robot-friend'
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData).toHaveProperty('error', 'Failed to generate speech: Network error');
    });

    test('should handle invalid personality gracefully', async () => {
      const mockAudioBuffer = new ArrayBuffer(1024);
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockAudioBuffer),
      });

      const request = createMockTTSRequest({
        text: 'Testing invalid personality',
        personality: 'invalid-robot'
      });

      const response = await POST(request);

      // Should fallback to default voice
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('21m00Tcm4TlvDq8ikWAM'), // Default robot-friend voice
        expect.any(Object)
      );
    });
  });

  describe('Response Format and Performance', () => {
    test('should return properly formatted audio response', async () => {
      const mockAudioBuffer = new ArrayBuffer(1024);
      const expectedBase64 = Buffer.from(mockAudioBuffer).toString('base64');
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockAudioBuffer),
      });

      const request = createMockTTSRequest({
        text: 'Testing audio response',
        personality: 'robot-friend'
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData).toHaveProperty('audio', expectedBase64);
      expect(responseData).toHaveProperty('contentType', 'audio/mpeg');
    });

    test('should include performance metadata in response', async () => {
      const mockAudioBuffer = new ArrayBuffer(1024);
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockAudioBuffer),
      });

      const request = createMockTTSRequest({
        text: 'Testing performance metadata',
        personality: 'robot-friend'
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(responseData).toHaveProperty('model', 'eleven_flash_v2_5');
      expect(responseData).toHaveProperty('contentType', 'audio/mpeg');
      expect(responseData).toHaveProperty('latency', '~75ms');
    });
  });
});