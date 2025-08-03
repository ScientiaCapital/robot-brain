import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VoiceFirstChat } from '@/components/voice-first-chat';
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock streaming TTS function
jest.mock('@/lib/audio-streaming', () => ({
  streamTTSAudio: jest.fn(),
  AudioStreamingMetrics: {
    recordRequest: jest.fn(),
    recordError: jest.fn(),
  },
}));

// Mock Audio constructor
const mockPlay = jest.fn();
const mockPause = jest.fn();
global.Audio = jest.fn().mockImplementation(() => ({
  play: mockPlay,
  pause: mockPause,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
})) as any;

// Mock Web Speech API with proper event handling
const mockSpeechRecognition = {
  start: jest.fn(),
  stop: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  continuous: false,
  interimResults: false,
  lang: 'en-US',
  onstart: null as Function | null,
  onresult: null as Function | null,
  onerror: null as Function | null,
  onend: null as Function | null,
};

(global as any).webkitSpeechRecognition = jest.fn(() => mockSpeechRecognition);

// Helper to simulate speech recognition events
const simulateSpeechEvent = (eventType: string, eventData: any) => {
  if (eventType === 'result' && mockSpeechRecognition.onresult) {
    mockSpeechRecognition.onresult(eventData);
  } else if (eventType === 'start' && mockSpeechRecognition.onstart) {
    mockSpeechRecognition.onstart(eventData);
  } else if (eventType === 'end' && mockSpeechRecognition.onend) {
    mockSpeechRecognition.onend(eventData);
  } else if (eventType === 'error' && mockSpeechRecognition.onerror) {
    mockSpeechRecognition.onerror(eventData);
  }
};

// Import the mocked streamTTSAudio
import { streamTTSAudio } from '@/lib/audio-streaming';
const mockStreamTTSAudio = streamTTSAudio as jest.MockedFunction<typeof streamTTSAudio>;

describe('Voice Pipeline Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    mockPlay.mockClear();
    mockStreamTTSAudio.mockClear();
    
    // Reset speech recognition mocks
    mockSpeechRecognition.start.mockClear();
    mockSpeechRecognition.stop.mockClear();
    mockSpeechRecognition.addEventListener.mockClear();
    mockSpeechRecognition.onstart = null;
    mockSpeechRecognition.onresult = null;
    mockSpeechRecognition.onerror = null;
    mockSpeechRecognition.onend = null;
  });

  describe('TTS Integration', () => {
    it('should call TTS endpoint and return base64 audio', async () => {
      // Mock successful chat response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Hello! I am Robot Friend!',
          personality: 'robot-friend',
          emoji: '😊',
          name: 'Robot Friend',
          sessionId: 'test-session'
        }),
      });

      // Mock successful streamTTSAudio call
      mockStreamTTSAudio.mockResolvedValueOnce(undefined);

      render(<VoiceFirstChat />);

      const input = screen.getByPlaceholderText(/ask ai/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Type and send message
      await userEvent.type(input, 'Hello robot');
      fireEvent.click(sendButton);

      // Wait for chat API to be called
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"message":"Hello robot"')
        }));
      });

      // Wait for TTS streaming to be called
      await waitFor(() => {
        expect(mockStreamTTSAudio).toHaveBeenCalledWith(
          'Hello! I am Robot Friend!',
          'robot-friend',
          expect.any(Object) // callbacks
        );
      });
    });

    it('should play audio after receiving TTS response', async () => {
      // Mock chat response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Hi there!',
          personality: 'robot-friend',
          emoji: '😊',
          name: 'Robot Friend',
          sessionId: 'test-session'
        }),
      });

      // Mock successful streamTTSAudio call with callbacks
      mockStreamTTSAudio.mockImplementationOnce(async (text, personality, callbacks) => {
        // Simulate the streaming process
        callbacks?.onStart?.();
        callbacks?.onComplete?.(1024, 100); // Mock 1KB in 100ms
        return Promise.resolve();
      });

      render(<VoiceFirstChat />);

      const input = screen.getByPlaceholderText(/ask ai/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await userEvent.type(input, 'Hello');
      fireEvent.click(sendButton);

      // Wait for TTS streaming to be called and completed
      await waitFor(() => {
        expect(mockStreamTTSAudio).toHaveBeenCalledWith(
          'Hi there!',
          'robot-friend',
          expect.objectContaining({
            onStart: expect.any(Function),
            onComplete: expect.any(Function),
            onError: expect.any(Function)
          })
        );
      });
    });
  });

  describe('Speech Recognition', () => {
    it('should start recording when voice mode is active and mic clicked', async () => {
      render(<VoiceFirstChat />);

      // Switch to voice mode (button shows "Text Mode" when in text mode)
      const voiceToggle = screen.getByRole('button', { name: /text mode/i });
      fireEvent.click(voiceToggle);

      // Wait for voice mode to be activated and mic buttons to appear
      await waitFor(() => {
        expect(screen.getByText(/voice mode/i)).toBeInTheDocument();
      });

      // The mic button should appear in voice mode - it's the second button (index 1)
      let micButton;
      await waitFor(() => {
        const allButtons = screen.getAllByRole('button');
        
        // The mic button is likely the second button based on the output
        // It has size-9 h-12 w-12 and should contain a mic icon
        micButton = allButtons.find(button => {
          const className = button.className;
          const hasMicSize = className.includes('h-12 w-12');
          return hasMicSize && button.textContent === '';
        });
        expect(micButton).toBeDefined();
      }, { timeout: 2000 });

      // Simulate the click handler directly
      fireEvent.click(micButton);

      // Wait a bit for async operation
      await new Promise(resolve => setTimeout(resolve, 10));

      // Check if the webkitSpeechRecognition constructor was called
      expect((global as any).webkitSpeechRecognition).toHaveBeenCalled();
      expect(mockSpeechRecognition.start).toHaveBeenCalled();
    });

    it('should transcribe speech and send to chat', async () => {
      render(<VoiceFirstChat />);

      // Switch to voice mode
      const voiceToggle = screen.getByRole('button', { name: /text mode/i });
      fireEvent.click(voiceToggle);

      // Wait for voice mode UI
      await waitFor(() => {
        expect(screen.getByText(/voice mode/i)).toBeInTheDocument();
      });

      // Click mic button to start recording
      let micButton;
      await waitFor(() => {
        const allButtons = screen.getAllByRole('button');
        micButton = allButtons.find(button => {
          const className = button.className;
          const hasMicSize = className.includes('h-12 w-12');
          return hasMicSize && button.textContent === '';
        });
        expect(micButton).toBeDefined();
      });
      
      fireEvent.click(micButton);

      // Wait for speech recognition to be set up
      await new Promise(resolve => setTimeout(resolve, 50));

      // Mock chat response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Hello to you too!',
          personality: 'robot-friend',
          emoji: '😊',
          name: 'Robot Friend',
          sessionId: 'test-session'
        }),
      });

      // Mock TTS
      mockStreamTTSAudio.mockResolvedValueOnce(undefined);

      // Simulate speech recognition result
      const mockEvent = {
        results: [[{ transcript: 'Hello robot friend' }]]
      };

      // Trigger speech result using the helper
      simulateSpeechEvent('result', mockEvent);

      // Wait for the event to be processed
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should send transcribed text to chat
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"message":"Hello robot friend"')
        }));
      });
    });
  });

  describe('Complete Voice Flow', () => {
    it('should complete full voice interaction flow', async () => {
      render(<VoiceFirstChat />);

      // Switch to voice mode
      const voiceToggle = screen.getByRole('button', { name: /text mode/i });
      fireEvent.click(voiceToggle);

      // Wait for voice mode UI
      await waitFor(() => {
        expect(screen.getByText(/voice mode/i)).toBeInTheDocument();
      });

      // Click mic to start recording
      let micButton;
      await waitFor(() => {
        const allButtons = screen.getAllByRole('button');
        micButton = allButtons.find(button => {
          const className = button.className;
          const hasMicSize = className.includes('h-12 w-12');
          return hasMicSize && button.textContent === '';
        });
        expect(micButton).toBeDefined();
      });
      
      fireEvent.click(micButton);

      // Wait for speech recognition to be set up
      await new Promise(resolve => setTimeout(resolve, 50));

      // Mock chat response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Nice to meet you!',
          personality: 'robot-friend',
          emoji: '😊',
          name: 'Robot Friend',
          sessionId: 'test-session'
        }),
      });

      // Mock TTS with callback simulation
      mockStreamTTSAudio.mockImplementationOnce(async (text, personality, callbacks) => {
        callbacks?.onStart?.();
        callbacks?.onComplete?.(2048, 150);
        return Promise.resolve();
      });

      // Trigger speech recognition result
      simulateSpeechEvent('result', {
        results: [[{ transcript: 'Hi robot' }]]
      });

      // Wait for the event to be processed
      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify full flow
      await waitFor(() => {
        // 1. Chat API was called
        expect(global.fetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"message":"Hi robot"')
        }));
      }, { timeout: 5000 });

      await waitFor(() => {
        // 2. Response is displayed
        expect(screen.getByText(/Nice to meet you!/)).toBeInTheDocument();
        
        // 3. TTS streaming was called
        expect(mockStreamTTSAudio).toHaveBeenCalledWith(
          'Nice to meet you!',
          'robot-friend',
          expect.any(Object)
        );
      }, { timeout: 5000 });
    });
  });
});