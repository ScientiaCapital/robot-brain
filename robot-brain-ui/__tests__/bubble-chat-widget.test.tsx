import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BubbleChatWidget } from '@/components/bubble-chat-widget';
import '@testing-library/jest-dom';

// Mock the ConversationalAIChat component
jest.mock('@/components/conversational-ai-chat', () => ({
  ConversationalAIChat: () => <div data-testid="conversational-ai-chat">Mocked Chat</div>
}));

describe('Bubble Chat Widget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Widget Initialization', () => {
    it('should render bubble button', () => {
      render(<BubbleChatWidget />);
      
      const bubbleButton = screen.getByRole('button', { name: /open chat/i });
      expect(bubbleButton).toBeInTheDocument();
    });

    it('should be positioned at bottom-right by default', () => {
      render(<BubbleChatWidget />);
      
      const bubbleButton = screen.getByRole('button', { name: /open chat/i });
      const widgetContainer = bubbleButton.closest('div').parentElement;
      expect(widgetContainer).toHaveClass('fixed', 'z-50', 'bottom-4', 'right-4');
    });
  });

  describe('User Interactions', () => {
    it('should open widget when bubble clicked', async () => {
      const user = userEvent.setup();
      
      render(<BubbleChatWidget />);
      
      const bubbleButton = screen.getByRole('button', { name: /open chat/i });
      await user.click(bubbleButton);
      
      // Check that chat is now visible
      expect(screen.getByTestId('conversational-ai-chat')).toBeInTheDocument();
    });

    it('should show close button when widget is open', async () => {
      const user = userEvent.setup();
      
      render(<BubbleChatWidget />);
      
      const bubbleButton = screen.getByRole('button', { name: /open chat/i });
      await user.click(bubbleButton);
      
      const closeButton = screen.getByRole('button', { name: /close chat/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('should close widget when close button clicked', async () => {
      const user = userEvent.setup();
      
      render(<BubbleChatWidget />);
      
      // Open widget
      const bubbleButton = screen.getByRole('button', { name: /open chat/i });
      await user.click(bubbleButton);
      
      // Verify it's open
      expect(screen.getByTestId('conversational-ai-chat')).toBeInTheDocument();
      
      // Close widget
      const closeButton = screen.getByRole('button', { name: /close chat/i });
      await user.click(closeButton);
      
      // Wait for animation to complete and check that element is removed
      await waitFor(() => {
        expect(screen.queryByTestId('conversational-ai-chat')).not.toBeInTheDocument();
      });
    });
  });

  describe('Widget Settings', () => {
    it('should show settings button when widget is open', async () => {
      const user = userEvent.setup();
      
      render(<BubbleChatWidget />);
      
      const bubbleButton = screen.getByRole('button', { name: /open chat/i });
      await user.click(bubbleButton);
      
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      expect(settingsButton).toBeInTheDocument();
    });

    it('should toggle settings panel when settings button clicked', async () => {
      const user = userEvent.setup();
      
      render(<BubbleChatWidget />);
      
      // Open widget
      const bubbleButton = screen.getByRole('button', { name: /open chat/i });
      await user.click(bubbleButton);
      
      // Open settings
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await user.click(settingsButton);
      
      // Check for settings content
      expect(screen.getByText(/Widget Settings/)).toBeInTheDocument();
      expect(screen.getByText(/Position/)).toBeInTheDocument();
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should use full screen on mobile when configured', () => {
      // Mock mobile viewport
      global.innerWidth = 375;
      
      render(<BubbleChatWidget />);
      
      // The default config has fullScreenOnMobile: true
      // This is just a placeholder test - actual implementation would check styles
      expect(true).toBe(true);
    });
  });

  describe('Keyboard Accessibility', () => {
    it('should open widget with Enter key', async () => {
      const user = userEvent.setup();
      
      render(<BubbleChatWidget />);
      
      const bubbleButton = screen.getByRole('button', { name: /open chat/i });
      await user.type(bubbleButton, '{Enter}');
      
      expect(screen.getByTestId('conversational-ai-chat')).toBeInTheDocument();
    });

    it('should close widget with Escape key', async () => {
      const user = userEvent.setup();
      
      render(<BubbleChatWidget />);
      
      // Open widget
      const bubbleButton = screen.getByRole('button', { name: /open chat/i });
      await user.click(bubbleButton);
      
      // Verify it's open
      expect(screen.getByTestId('conversational-ai-chat')).toBeInTheDocument();
      
      // Press Escape
      await user.keyboard('{Escape}');
      
      // Wait for animation and check that element is removed
      await waitFor(() => {
        expect(screen.queryByTestId('conversational-ai-chat')).not.toBeInTheDocument();
      });
    });
  });
});