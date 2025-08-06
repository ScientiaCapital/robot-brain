/**
 * @jest-environment node
 */

/**
 * Audio Error Logging Tests
 * Tests for the Neon database integration for audio error tracking
 */

import { jest } from '@jest/globals';

// Mock the Neon database
jest.mock('@neondatabase/serverless', () => ({
  neon: jest.fn(() => jest.fn())
}));

import { logAudioError, getAudioErrorStats, createAudioError } from '@/lib/audio-error-logging';
import { mockNeonQuery } from './setup/mocks';

// Mock the database environment variable
process.env.NEON_DATABASE_URL = 'postgresql://test@test.com/test';

describe('Audio Error Logging', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup the mock to be the neon function
    const { neon } = require('@neondatabase/serverless');
    neon.mockReturnValue(mockNeonQuery);
  });

  describe('logAudioError', () => {
    test('should log audio error successfully when conversation exists', async () => {
      const sessionId = 'test-session-123';
      const audioError = createAudioError('tts_streaming', 'Test error message', 500, 5);

      const result = await logAudioError(sessionId, audioError);

      expect(result).toBe(true);
      expect(mockNeonQuery).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('SELECT id, metadata')]),
        sessionId
      );
      expect(mockNeonQuery).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('UPDATE conversations')]),
        expect.any(String),
        'conv-123'
      );
    });

    test('should return false when no conversation found', async () => {
      // Mock empty result for this test
      mockNeonQuery.mockResolvedValueOnce([]);

      const sessionId = 'nonexistent-session';
      const audioError = createAudioError('network', 'Network error', 1000);

      const result = await logAudioError(sessionId, audioError);

      expect(result).toBe(false);
      expect(mockNeonQuery).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('SELECT id, metadata')]),
        sessionId
      );
    });

    test('should handle database errors gracefully', async () => {
      // Mock database error
      mockNeonQuery.mockRejectedValueOnce(new Error('Database connection failed'));

      const sessionId = 'test-session';
      const audioError = createAudioError('audio_decode', 'Decode error');

      const result = await logAudioError(sessionId, audioError);

      expect(result).toBe(false);
    });

    test('should handle conversation with null metadata', async () => {
      // Mock conversation with null metadata
      mockNeonQuery.mockResolvedValueOnce([{
        id: 'conv-456',
        metadata: null,
        session_id: 'test-session',
        robot_personality: 'robot-friend',
        user_message: 'Test',
        robot_response: 'Response',
        created_at: new Date().toISOString()
      }]);

      const sessionId = 'test-session';
      const audioError = createAudioError('unknown', 'Unknown error');

      const result = await logAudioError(sessionId, audioError);

      expect(result).toBe(true);
      // Should still update with the error
      expect(mockNeonQuery).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('UPDATE conversations')]),
        expect.stringContaining('audio_errors'),
        'conv-456'
      );
    });
  });

  describe('getAudioErrorStats', () => {
    test('should return stats when errors exist', async () => {
      const mockConversations = [{
        metadata: {
          audio_errors: [
            { type: 'tts_streaming', message: 'Error 1', timestamp: 1000 },
            { type: 'network', message: 'Error 2', timestamp: 2000 }
          ],
          audio_error_count: 2,
          last_audio_error: 2000
        }
      }];
      
      mockNeonQuery.mockResolvedValueOnce(mockConversations);

      const stats = await getAudioErrorStats('test-session');

      expect(stats).toEqual({
        totalErrors: 2,
        errorsByType: {
          'tts_streaming': 1,
          'network': 1
        },
        lastError: { type: 'network', message: 'Error 2', timestamp: 2000 }
      });
    });

    test('should return null when no errors found', async () => {
      mockNeonQuery.mockResolvedValueOnce([]);

      const stats = await getAudioErrorStats('test-session');

      expect(stats).toBeNull();
    });

    test('should handle database errors gracefully', async () => {
      mockNeonQuery.mockRejectedValueOnce(new Error('Database error'));

      const stats = await getAudioErrorStats('test-session');

      expect(stats).toBeNull();
    });
  });

  describe('createAudioError', () => {
    test('should create proper audio error object', () => {
      const error = createAudioError('tts_streaming', 'Test message', 500, 10);

      expect(error).toEqual({
        type: 'tts_streaming',
        message: 'Test message',
        timestamp: expect.any(Number),
        duration: 500,
        chunkCount: 10
      });
    });

    test('should create error without optional parameters', () => {
      const error = createAudioError('network', 'Network failed');

      expect(error).toEqual({
        type: 'network',
        message: 'Network failed',
        timestamp: expect.any(Number),
        duration: undefined,
        chunkCount: undefined
      });
    });
  });
});