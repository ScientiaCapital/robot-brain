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

// Mock Audio constructor
const mockPlay = jest.fn();
const mockPause = jest.fn();
global.Audio = jest.fn().mockImplementation(() => ({
  play: mockPlay,
  pause: mockPause,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
})) as any;

// Mock Web Speech API
const mockSpeechRecognition = {
  start: jest.fn(),
  stop: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

(global as any).webkitSpeechRecognition = jest.fn(() => mockSpeechRecognition);

describe('Voice Pipeline Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    mockPlay.mockClear();
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

      // Mock TTS response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          audio: 'base64audiodata',
          duration: 2.5,
          voice_id: '21m00Tcm4TlvDq8ikWAM'
        }),
      });

      render(<VoiceFirstChat />);

      const input = screen.getByPlaceholderText(/type a message/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Type and send message
      await userEvent.type(input, 'Hello robot');
      fireEvent.click(sendButton);

      // Wait for TTS to be called
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/voice/text-to-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: 'Hello! I am Robot Friend!',
            personality: 'robot-friend'
          })
        });
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

      // Mock TTS response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          audio: 'base64audiodata',
          duration: 1.5,
          voice_id: '21m00Tcm4TlvDq8ikWAM'
        }),
      });

      render(<VoiceFirstChat />);

      const input = screen.getByPlaceholderText(/type a message/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await userEvent.type(input, 'Hello');
      fireEvent.click(sendButton);

      // Wait for audio to be played
      await waitFor(() => {
        expect(global.Audio).toHaveBeenCalledWith('data:audio/mpeg;base64,base64audiodata');
        expect(mockPlay).toHaveBeenCalled();
      });
    });
  });

  describe('Speech Recognition', () => {
    it('should start recording when voice mode is active and mic clicked', async () => {
      render(<VoiceFirstChat />);

      // Switch to voice mode
      const voiceToggle = screen.getByRole('button', { name: /voice mode/i });
      fireEvent.click(voiceToggle);

      // Click mic button
      const micButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(micButton);

      expect(mockSpeechRecognition.start).toHaveBeenCalled();
      expect(screen.getByRole('button', { name: /stop recording/i })).toBeInTheDocument();
    });

    it('should transcribe speech and send to chat', async () => {
      render(<VoiceFirstChat />);

      // Switch to voice mode
      const voiceToggle = screen.getByRole('button', { name: /voice mode/i });
      fireEvent.click(voiceToggle);

      // Start recording
      const micButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(micButton);

      // Simulate speech recognition result
      const onResultHandler = mockSpeechRecognition.addEventListener.mock.calls.find(
        call => call[0] === 'result'
      )?.[1];

      const mockEvent = {
        results: [[{ transcript: 'Hello robot friend' }]]
      };

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

      // Trigger speech result
      if (onResultHandler) {
        onResultHandler(mockEvent);
      }

      // Should send transcribed text to chat
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Hello robot friend',
            personality: 'robot-friend',
            sessionId: expect.any(String)
          })
        });
      });
    });
  });

  describe('Complete Voice Flow', () => {
    it('should complete full voice interaction flow', async () => {
      render(<VoiceFirstChat />);

      // Switch to voice mode
      const voiceToggle = screen.getByRole('button', { name: /voice mode/i });
      fireEvent.click(voiceToggle);

      // Start recording
      const micButton = screen.getByRole('button', { name: /start recording/i });
      fireEvent.click(micButton);

      // Simulate speech recognition
      const onResultHandler = mockSpeechRecognition.addEventListener.mock.calls.find(
        call => call[0] === 'result'
      )?.[1];

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

      // Mock TTS response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          audio: 'base64audiodata',
          duration: 2.0,
          voice_id: '21m00Tcm4TlvDq8ikWAM'
        }),
      });

      // Trigger speech recognition result
      if (onResultHandler) {
        onResultHandler({
          results: [[{ transcript: 'Hi robot' }]]
        });
      }

      // Verify full flow
      await waitFor(() => {
        // 1. Speech was transcribed
        expect(screen.getByText(/Hi robot/)).toBeInTheDocument();
        
        // 2. Chat API was called
        expect(global.fetch).toHaveBeenCalledWith('/api/chat', expect.any(Object));
        
        // 3. Response is displayed
        expect(screen.getByText(/Nice to meet you!/)).toBeInTheDocument();
        
        // 4. TTS was called
        expect(global.fetch).toHaveBeenCalledWith('/api/voice/text-to-speech', expect.any(Object));
        
        // 5. Audio was played
        expect(mockPlay).toHaveBeenCalled();
      });
    });
  });
});