import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VoiceFirstChat } from '@/components/voice-first-chat';
import { useConversation } from '@elevenlabs/react';
import '@testing-library/jest-dom';

// Mock ElevenLabs React hooks
jest.mock('@elevenlabs/react', () => ({
  useConversation: jest.fn(),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('Conversational AI Integration', () => {
  const mockStartConversation = jest.fn();
  const mockEndConversation = jest.fn();
  const mockSendTextInput = jest.fn();

  const defaultMockConversation = {
    status: 'idle',
    isSpeaking: false,
    isConnected: false,
    isListening: false,
    isProcessing: false,
    startConversation: mockStartConversation,
    endConversation: mockEndConversation,
    sendTextInput: mockSendTextInput,
    conversation: null,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    (useConversation as jest.Mock).mockReturnValue(defaultMockConversation);
  });

  describe('Mode Switching', () => {
    it('should toggle between standard and conversational AI modes', async () => {
      const user = userEvent.setup();
      
      const { rerender } = render(<VoiceFirstChat />);
      
      // Initially in standard mode
      expect(screen.getByText(/Standard/)).toBeInTheDocument();
      expect(screen.getByText(/Text Mode/)).toBeInTheDocument();
      
      // Switch to Conversational AI mode
      const convAIButton = screen.getByText(/Standard/);
      await user.click(convAIButton);
      
      // Should now show Conversational AI interface
      expect(screen.getByText(/Start Conversation/)).toBeInTheDocument();
      expect(screen.queryByText(/Text Mode/)).not.toBeInTheDocument();
    });

    it('should maintain separate state between modes', async () => {
      const user = userEvent.setup();
      
      // Mock standard chat response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Hello from standard mode!',
          personality: 'robot-friend',
        }),
      });

      render(<VoiceFirstChat />);
      
      // Send message in standard mode
      const input = screen.getByPlaceholderText(/type a message/i);
      await user.type(input, 'Hello in standard mode');
      
      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);
      
      // Wait for message to appear
      await waitFor(() => {
        expect(screen.getByText('Hello in standard mode')).toBeInTheDocument();
      });
      
      // Switch to Conversational AI mode
      const convAIButton = screen.getByText(/Standard/);
      await user.click(convAIButton);
      
      // Should not see standard mode messages in Conversational AI mode
      expect(screen.queryByText('Hello in standard mode')).not.toBeInTheDocument();
      expect(screen.getByText(/Start Conversation/)).toBeInTheDocument();
    });
  });

  describe('Conversational AI Features', () => {
    beforeEach(() => {
      (useConversation as jest.Mock).mockReturnValue({
        ...defaultMockConversation,
        status: 'connected',
        isConnected: true,
      });
    });

    it('should initialize with correct configuration', async () => {
      const user = userEvent.setup();
      
      render(<VoiceFirstChat />);
      
      // Switch to Conversational AI mode
      const convAIButton = screen.getByText(/Standard/);
      await user.click(convAIButton);
      
      // Start conversation
      const startButton = screen.getByRole('button', { name: /start conversation/i });
      await user.click(startButton);
      
      expect(mockStartConversation).toHaveBeenCalledWith({
        agentId: 'robot-friend-agent',
        clientTools: expect.objectContaining({
          displayMessage: expect.any(Function),
          updateSystemPrompt: expect.any(Function),
        }),
        overrides: expect.objectContaining({
          agent: expect.objectContaining({
            prompt: expect.objectContaining({
              prompt: expect.stringContaining('Robot Friend'),
            }),
            firstMessage: expect.stringContaining("Hi! I'm Robot Friend!"),
          }),
          tts: expect.objectContaining({
            voiceId: '21m00Tcm4TlvDq8ikWAM',
            model: 'eleven_flash_v2_5',
          }),
        }),
      });
    });

    it('should handle real-time streaming responses', async () => {
      const user = userEvent.setup();
      
      // Mock conversation with messages
      const mockConversation = {
        conversationId: 'test-123',
        messages: [
          { role: 'user', message: 'Hello' },
          { role: 'agent', message: 'Hi there! How can I help you?' },
        ],
      };

      (useConversation as jest.Mock).mockReturnValue({
        ...defaultMockConversation,
        status: 'connected',
        isConnected: true,
        conversation: mockConversation,
      });

      render(<VoiceFirstChat />);
      
      // Switch to Conversational AI mode
      const convAIButton = screen.getByText(/Standard/);
      await user.click(convAIButton);
      
      // Should see streaming messages
      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
        expect(screen.getByText('Hi there! How can I help you?')).toBeInTheDocument();
      });
    });

    it('should handle interruption properly', async () => {
      const user = userEvent.setup();
      
      (useConversation as jest.Mock).mockReturnValue({
        ...defaultMockConversation,
        status: 'connected',
        isConnected: true,
        isSpeaking: true,
      });

      render(<VoiceFirstChat />);
      
      // Switch to Conversational AI mode
      const convAIButton = screen.getByText(/Standard/);
      await user.click(convAIButton);
      
      // Should show interrupt button when speaking
      const interruptButton = screen.getByRole('button', { name: /interrupt/i });
      await user.click(interruptButton);
      
      expect(mockEndConversation).toHaveBeenCalled();
    });
  });

  describe('Performance Optimization', () => {
    it('should use flash model for low latency', async () => {
      const user = userEvent.setup();
      
      render(<VoiceFirstChat />);
      
      // Switch to Conversational AI mode
      const convAIButton = screen.getByText(/Standard/);
      await user.click(convAIButton);
      
      // Start conversation
      const startButton = screen.getByRole('button', { name: /start conversation/i });
      await user.click(startButton);
      
      expect(mockStartConversation).toHaveBeenCalledWith(
        expect.objectContaining({
          overrides: expect.objectContaining({
            tts: expect.objectContaining({
              model: 'eleven_flash_v2_5',
            }),
          }),
        })
      );
    });

    it('should maintain optimized voice settings', async () => {
      const user = userEvent.setup();
      
      render(<VoiceFirstChat />);
      
      // Switch to Conversational AI mode
      const convAIButton = screen.getByText(/Standard/);
      await user.click(convAIButton);
      
      // Start conversation
      const startButton = screen.getByRole('button', { name: /start conversation/i });
      await user.click(startButton);
      
      expect(mockStartConversation).toHaveBeenCalledWith(
        expect.objectContaining({
          overrides: expect.objectContaining({
            tts: expect.objectContaining({
              stability: 0.5,
              similarityBoost: 0.8,
              style: 0.0,
              useSpeakerBoost: true,
            }),
          }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors gracefully', async () => {
      const user = userEvent.setup();
      
      (useConversation as jest.Mock).mockReturnValue({
        ...defaultMockConversation,
        error: new Error('Connection failed'),
      });

      render(<VoiceFirstChat />);
      
      // Switch to Conversational AI mode
      const convAIButton = screen.getByText(/Standard/);
      await user.click(convAIButton);
      
      // Should show error message
      expect(screen.getByText(/Connection failed/)).toBeInTheDocument();
      
      // Should show retry button
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should fallback to standard mode on critical errors', async () => {
      const user = userEvent.setup();
      
      // Mock critical error during hook initialization
      (useConversation as jest.Mock).mockImplementation(() => {
        throw new Error('Hook initialization failed');
      });

      render(<VoiceFirstChat />);
      
      // Should render in standard mode by default
      expect(screen.getByText(/Standard/)).toBeInTheDocument();
      expect(screen.getByText(/Text Mode/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should provide proper ARIA labels for conversational AI controls', async () => {
      const user = userEvent.setup();
      
      render(<VoiceFirstChat />);
      
      // Switch to Conversational AI mode
      const convAIButton = screen.getByText(/Standard/);
      await user.click(convAIButton);
      
      // Check for proper labeling
      const startButton = screen.getByRole('button', { name: /start conversation/i });
      expect(startButton).toHaveAttribute('aria-label', 'Start conversation');
    });

    it('should announce status changes to screen readers', async () => {
      const user = userEvent.setup();
      
      (useConversation as jest.Mock).mockReturnValue({
        ...defaultMockConversation,
        status: 'connected',
        isConnected: true,
        isListening: true,
      });

      render(<VoiceFirstChat />);
      
      // Switch to Conversational AI mode
      const convAIButton = screen.getByText(/Standard/);
      await user.click(convAIButton);
      
      // Should announce listening state
      expect(screen.getByText(/Listening.../)).toBeInTheDocument();
    });
  });
});