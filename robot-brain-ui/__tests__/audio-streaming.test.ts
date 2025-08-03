/**
 * Audio Streaming Tests
 * Tests for AudioStreamingMetrics class and streamTTSAudio function
 */

// Mock fetch for testing
global.fetch = jest.fn();

// Mock AudioContext
global.AudioContext = jest.fn().mockImplementation(() => ({
  createBufferSource: jest.fn(() => ({
    buffer: null,
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    onended: null
  })),
  destination: {},
  decodeAudioData: jest.fn().mockResolvedValue({}),
  resume: jest.fn().mockResolvedValue(undefined),
  state: 'running',
  close: jest.fn()
}));

// Mock only the AudioStreamManager class, keep everything else real
jest.mock('@/lib/audio-streaming', () => {
  const originalModule = jest.requireActual('@/lib/audio-streaming');
  
  // Create a mock class that inherits the original behavior for AudioStreamingMetrics
  const mockAudioStreamManager = {
    initialize: jest.fn().mockResolvedValue(undefined),
    addAudioChunk: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn(),
    getState: jest.fn().mockReturnValue('running'),
    destroy: jest.fn()
  };
  
  return {
    ...originalModule,
    AudioStreamManager: jest.fn(() => mockAudioStreamManager),
    getAudioStreamManager: jest.fn(() => mockAudioStreamManager),
  };
});

import { AudioStreamingMetrics, streamTTSAudio, getAudioStreamManager } from '@/lib/audio-streaming';

describe('AudioStreamingMetrics', () => {
  beforeEach(() => {
    // Reset metrics before each test
    AudioStreamingMetrics.reset();
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    test('should record streaming requests with proper timing', () => {
      const startTime = Date.now();
      const endTime = startTime + 500; // 500ms streaming time

      AudioStreamingMetrics.recordRequest(startTime, endTime);
      
      const stats = AudioStreamingMetrics.getStats();
      expect(stats.totalRequests).toBe(1);
      expect(stats.averageLatency).toBe(500);
      expect(stats.totalLatency).toBe(500);
    });

    test('should track multiple requests and calculate averages', () => {
      const latencies = [300, 500, 200, 400]; // Various latencies
      const baseTime = Date.now();
      
      latencies.forEach((latency, index) => {
        const start = baseTime + (index * 1000);
        AudioStreamingMetrics.recordRequest(start, start + latency);
      });

      const stats = AudioStreamingMetrics.getStats();
      expect(stats.totalRequests).toBe(4);
      expect(stats.averageLatency).toBe(350); // (300+500+200+400)/4
      expect(stats.totalLatency).toBe(1400);
    });

    test('should track first byte time when provided', () => {
      const startTime = Date.now();
      const firstByteTime = startTime + 50;
      const endTime = startTime + 500;

      AudioStreamingMetrics.recordRequest(startTime, endTime, firstByteTime);
      
      const stats = AudioStreamingMetrics.getStats();
      expect(stats.averageFirstByteLatency).toBe(50);
      expect(stats.totalFirstByteLatency).toBe(50);
    });

    test('should track chunk counts', () => {
      const startTime = Date.now();
      const endTime = startTime + 500;

      AudioStreamingMetrics.recordRequest(startTime, endTime, undefined, 10);
      
      const stats = AudioStreamingMetrics.getStats();
      expect(stats.totalChunks).toBe(10);
      expect(stats.averageChunksPerRequest).toBe(10);
    });

    test('should track errors', () => {
      AudioStreamingMetrics.recordError('Network timeout');
      AudioStreamingMetrics.recordError('Decode failed');
      
      const stats = AudioStreamingMetrics.getStats();
      expect(stats.totalErrors).toBe(2);
      expect(stats.errorRate).toBe(100); // 100% since no successful requests
      expect(stats.errorTypes).toEqual({
        'Network timeout': 1,
        'Decode failed': 1
      });
    });

    test('should calculate error rate correctly with mixed requests', () => {
      // Record successful requests
      const baseTime = Date.now();
      for (let i = 0; i < 8; i++) {
        AudioStreamingMetrics.recordRequest(baseTime + i * 100, baseTime + i * 100 + 200);
      }
      
      // Record errors
      AudioStreamingMetrics.recordError('Network error');
      AudioStreamingMetrics.recordError('Timeout error');
      
      const stats = AudioStreamingMetrics.getStats();
      expect(stats.totalRequests).toBe(8);
      expect(stats.totalErrors).toBe(2);
      expect(stats.errorRate).toBe(20); // 2 errors out of 10 total operations
    });

    test('should provide empty stats when no data recorded', () => {
      const stats = AudioStreamingMetrics.getStats();
      expect(stats.totalRequests).toBe(0);
      expect(stats.totalErrors).toBe(0);
      expect(stats.averageLatency).toBe(0);
      expect(stats.errorRate).toBe(0);
      expect(stats.errorTypes).toEqual({});
    });

    test('should reset all metrics', () => {
      // Record some data
      AudioStreamingMetrics.recordRequest(Date.now(), Date.now() + 100);
      AudioStreamingMetrics.recordError('Test error');
      
      // Verify data exists
      let stats = AudioStreamingMetrics.getStats();
      expect(stats.totalRequests).toBe(1);
      expect(stats.totalErrors).toBe(1);
      
      // Reset and verify cleanup
      AudioStreamingMetrics.reset();
      stats = AudioStreamingMetrics.getStats();
      expect(stats.totalRequests).toBe(0);
      expect(stats.totalErrors).toBe(0);
      expect(stats.errorTypes).toEqual({});
    });
  });

  describe('Performance Tracking', () => {
    test('should maintain performance under load', () => {
      const startTime = Date.now();
      
      // Simulate 100 requests
      for (let i = 0; i < 100; i++) {
        AudioStreamingMetrics.recordRequest(
          startTime + i * 10, 
          startTime + i * 10 + Math.random() * 1000
        );
      }
      
      const operationTime = Date.now() - startTime;
      expect(operationTime).toBeLessThan(100); // Should be very fast
      
      const stats = AudioStreamingMetrics.getStats();
      expect(stats.totalRequests).toBe(100);
    });
  });
});

describe('streamTTSAudio Function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the fetch mock
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Callback Interface', () => {
    test('should call onStart callback when streaming begins', async () => {
      const mockResponse = {
        ok: true,
        headers: new Headers([['content-length', '1000']]),
        body: {
          getReader: () => ({
            read: jest.fn()
              .mockResolvedValueOnce({ done: false, value: new Uint8Array([1, 2, 3]) })
              .mockResolvedValueOnce({ done: true, value: undefined })
          })
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const callbacks = {
        onStart: jest.fn(),
        onChunk: jest.fn(),
        onComplete: jest.fn(),
        onError: jest.fn()
      };

      await streamTTSAudio('Hello world', 'robot-friend', callbacks);

      expect(callbacks.onStart).toHaveBeenCalledWith();
    });

    test('should call onChunk callback for each audio chunk', async () => {
      const chunks = [
        new Uint8Array([1, 2, 3]),
        new Uint8Array([4, 5, 6]),
        new Uint8Array([7, 8, 9])
      ];

      const mockResponse = {
        ok: true,
        headers: new Headers([['content-length', '9']]),
        body: {
          getReader: () => ({
            read: jest.fn()
              .mockResolvedValueOnce({ done: false, value: chunks[0] })
              .mockResolvedValueOnce({ done: false, value: chunks[1] })
              .mockResolvedValueOnce({ done: false, value: chunks[2] })
              .mockResolvedValueOnce({ done: true, value: undefined })
          })
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const callbacks = {
        onStart: jest.fn(),
        onChunk: jest.fn(),
        onComplete: jest.fn(),
        onError: jest.fn()
      };

      await streamTTSAudio('Hello world', 'robot-friend', callbacks);

      expect(callbacks.onChunk).toHaveBeenCalledTimes(3);
      expect(callbacks.onChunk).toHaveBeenNthCalledWith(1, chunks[0], 3, 9);
      expect(callbacks.onChunk).toHaveBeenNthCalledWith(2, chunks[1], 6, 9);
      expect(callbacks.onChunk).toHaveBeenNthCalledWith(3, chunks[2], 9, 9);
    });

    test('should call onComplete callback when streaming finishes', async () => {
      const mockResponse = {
        ok: true,
        headers: new Headers([['content-length', '3']]),
        body: {
          getReader: () => ({
            read: jest.fn()
              .mockResolvedValueOnce({ done: false, value: new Uint8Array([1, 2, 3]) })
              .mockResolvedValueOnce({ done: true, value: undefined })
          })
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const callbacks = {
        onStart: jest.fn(),
        onChunk: jest.fn(),
        onComplete: jest.fn(),
        onError: jest.fn()
      };

      await streamTTSAudio('Hello world', 'robot-friend', callbacks);

      expect(callbacks.onComplete).toHaveBeenCalledWith(3, expect.any(Number));
    });

    test('should call onError callback when fetch fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const callbacks = {
        onStart: jest.fn(),
        onChunk: jest.fn(),
        onComplete: jest.fn(),
        onError: jest.fn()
      };

      await streamTTSAudio('Hello world', 'robot-friend', callbacks);

      expect(callbacks.onError).toHaveBeenCalledWith(expect.any(Error));
    });

    test('should call onError callback when response is not ok', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const callbacks = {
        onStart: jest.fn(),
        onChunk: jest.fn(),
        onComplete: jest.fn(),
        onError: jest.fn()
      };

      await streamTTSAudio('Hello world', 'robot-friend', callbacks);

      expect(callbacks.onError).toHaveBeenCalledWith(expect.any(Error));
    });

    test('should work without callbacks (backward compatibility)', async () => {
      const mockResponse = {
        ok: true,
        headers: new Headers([['content-length', '3']]),
        body: {
          getReader: () => ({
            read: jest.fn()
              .mockResolvedValueOnce({ done: false, value: new Uint8Array([1, 2, 3]) })
              .mockResolvedValueOnce({ done: true, value: undefined })
          })
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      // Should not throw when called without callbacks
      await expect(streamTTSAudio('Hello world', 'robot-friend')).resolves.not.toThrow();
    });
  });

  describe('Integration with AudioStreamManager', () => {
    test('should process audio chunks successfully', async () => {
      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({ done: false, value: new Uint8Array([1, 2, 3]) })
          .mockResolvedValueOnce({ done: false, value: new Uint8Array([4, 5, 6]) })
          .mockResolvedValueOnce({ done: true, value: undefined })
      };
      
      const mockResponse = {
        ok: true,
        headers: new Headers([['content-length', '6']]),
        body: {
          getReader: jest.fn(() => mockReader)
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const callbacks = {
        onError: jest.fn(),
        onStart: jest.fn(),
        onChunk: jest.fn(),
        onComplete: jest.fn()
      };

      await streamTTSAudio('Hello world', 'robot-friend', callbacks);

      // Verify no errors occurred
      expect(callbacks.onError).not.toHaveBeenCalled();
      
      // Verify streaming started
      expect(callbacks.onStart).toHaveBeenCalled();
      
      // Verify chunks were processed
      expect(callbacks.onChunk).toHaveBeenCalledTimes(2);
      expect(callbacks.onChunk).toHaveBeenNthCalledWith(1, new Uint8Array([1, 2, 3]), 3, 6);
      expect(callbacks.onChunk).toHaveBeenNthCalledWith(2, new Uint8Array([4, 5, 6]), 6, 6);
      
      // Verify streaming completed successfully
      expect(callbacks.onComplete).toHaveBeenCalledWith(6, expect.any(Number));
      
      // Verify reader was used
      expect(mockResponse.body.getReader).toHaveBeenCalled();
      expect(mockReader.read).toHaveBeenCalledTimes(3); // 2 chunks + 1 done
    });
  });

  describe('Metrics Integration', () => {
    test('should record metrics for successful streaming', async () => {
      const mockResponse = {
        ok: true,
        headers: new Headers([['content-length', '3']]),
        body: {
          getReader: () => ({
            read: jest.fn()
              .mockResolvedValueOnce({ done: false, value: new Uint8Array([1, 2, 3]) })
              .mockResolvedValueOnce({ done: true, value: undefined })
          })
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      // Reset metrics
      AudioStreamingMetrics.reset();

      const callbacks = {
        onComplete: jest.fn()
      };

      await streamTTSAudio('Hello world', 'robot-friend', callbacks);

      const stats = AudioStreamingMetrics.getStats();
      expect(stats.totalRequests).toBe(1);
      expect(stats.totalErrors).toBe(0);
    });

    test('should record error metrics for failed streaming', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network timeout'));

      // Reset metrics
      AudioStreamingMetrics.reset();

      const callbacks = {
        onError: jest.fn()
      };

      await streamTTSAudio('Hello world', 'robot-friend', callbacks);

      const stats = AudioStreamingMetrics.getStats();
      expect(stats.totalErrors).toBe(1);
      expect(stats.errorTypes['Network timeout']).toBe(1);
    });
  });
});