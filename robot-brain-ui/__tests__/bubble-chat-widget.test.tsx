import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BubbleChatWidget } from '@/components/bubble-chat-widget';
import '@testing-library/jest-dom';

// Mock ElevenLabs widget core
jest.mock('@elevenlabs/convai-widget-core', () => ({
  ElevenLabsWidget: jest.fn().mockImplementation(() => ({
    mount: jest.fn(),
    unmount: jest.fn(),
    open: jest.fn(),
    close: jest.fn(),
    setConfig: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  })),
}));

describe('Bubble Chat Widget', () => {
  let mockWidgetInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset widget instance
    const { ElevenLabsWidget } = require('@elevenlabs/convai-widget-core');
    mockWidgetInstance = new ElevenLabsWidget();
  });

  describe('Widget Initialization', () => {
    it('should render bubble button', () => {
      render(<BubbleChatWidget />);
      
      const bubbleButton = screen.getByRole('button', { name: /open chat/i });
      expect(bubbleButton).toBeInTheDocument();
    });

    it('should initialize widget with correct configuration', () => {
      const { ElevenLabsWidget } = require('@elevenlabs/convai-widget-core');
      
      render(<BubbleChatWidget />);
      
      expect(ElevenLabsWidget).toHaveBeenCalledWith({
        agent_id: expect.any(String),
        widget_config: expect.objectContaining({
          position: 'bottom-right',
          bubble_text: 'Chat with Robot Friend',
          theme: expect.objectContaining({
            primary_color: expect.any(String),
            bubble_color: expect.any(String),
          }),
        }),
      });
    });

    it('should mount widget on component mount', () => {
      render(<BubbleChatWidget />);
      
      expect(mockWidgetInstance.mount).toHaveBeenCalled();
    });

    it('should unmount widget on component unmount', () => {
      const { unmount } = render(<BubbleChatWidget />);
      
      unmount();
      
      expect(mockWidgetInstance.unmount).toHaveBeenCalled();
    });
  });

  describe('User Interactions', () => {
    it('should open widget when bubble clicked', async () => {
      const user = userEvent.setup();
      
      render(<BubbleChatWidget />);
      
      const bubbleButton = screen.getByRole('button', { name: /open chat/i });
      await user.click(bubbleButton);
      
      expect(mockWidgetInstance.open).toHaveBeenCalled();
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
      
      // Open widget first
      const bubbleButton = screen.getByRole('button', { name: /open chat/i });
      await user.click(bubbleButton);
      
      // Then close it
      const closeButton = screen.getByRole('button', { name: /close chat/i });
      await user.click(closeButton);
      
      expect(mockWidgetInstance.close).toHaveBeenCalled();
    });
  });

  describe('Widget Events', () => {
    it('should handle conversation started event', async () => {
      let conversationStartedCallback: any;
      
      mockWidgetInstance.on.mockImplementation((event: string, callback: any) => {
        if (event === 'conversation_started') {
          conversationStartedCallback = callback;
        }
      });
      
      render(<BubbleChatWidget />);
      
      // Simulate conversation started
      act(() => {
        conversationStartedCallback({ conversationId: 'test-123' });
      });
      
      await waitFor(() => {
        expect(screen.getByText(/conversation started/i)).toBeInTheDocument();
      });
    });

    it('should handle message received event', async () => {
      let messageReceivedCallback: any;
      
      mockWidgetInstance.on.mockImplementation((event: string, callback: any) => {
        if (event === 'message_received') {
          messageReceivedCallback = callback;
        }
      });
      
      render(<BubbleChatWidget />);
      
      // Simulate message received
      act(() => {
        messageReceivedCallback({ 
          message: 'Hello from Robot Friend!',
          role: 'assistant' 
        });
      });
      
      await waitFor(() => {
        expect(screen.getByText(/new message/i)).toBeInTheDocument();
      });
    });

    it('should handle error event', async () => {
      let errorCallback: any;
      
      mockWidgetInstance.on.mockImplementation((event: string, callback: any) => {
        if (event === 'error') {
          errorCallback = callback;
        }
      });
      
      render(<BubbleChatWidget />);
      
      // Simulate error
      act(() => {
        errorCallback({ 
          error: 'Connection failed',
          code: 'CONNECTION_ERROR' 
        });
      });
      
      await waitFor(() => {
        expect(screen.getByText(/connection failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Configuration Updates', () => {
    it('should update widget configuration', async () => {
      const user = userEvent.setup();
      
      render(<BubbleChatWidget />);
      
      // Open settings
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await user.click(settingsButton);
      
      // Change position
      const positionSelect = screen.getByLabelText(/position/i);
      await user.selectOptions(positionSelect, 'bottom-left');
      
      expect(mockWidgetInstance.setConfig).toHaveBeenCalledWith({
        widget_config: expect.objectContaining({
          position: 'bottom-left',
        }),
      });
    });

    it('should update theme colors', async () => {
      const user = userEvent.setup();
      
      render(<BubbleChatWidget />);
      
      // Open settings
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await user.click(settingsButton);
      
      // Change theme color
      const colorInput = screen.getByLabelText(/primary color/i);
      await user.clear(colorInput);
      await user.type(colorInput, '#ff0000');
      
      expect(mockWidgetInstance.setConfig).toHaveBeenCalledWith({
        widget_config: expect.objectContaining({
          theme: expect.objectContaining({
            primary_color: '#ff0000',
          }),
        }),
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<BubbleChatWidget />);
      
      const bubbleButton = screen.getByRole('button', { name: /open chat/i });
      expect(bubbleButton).toHaveAttribute('aria-label');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      
      render(<BubbleChatWidget />);
      
      const bubbleButton = screen.getByRole('button', { name: /open chat/i });
      
      // Tab to button
      await user.tab();
      expect(bubbleButton).toHaveFocus();
      
      // Press Enter to open
      await user.keyboard('{Enter}');
      expect(mockWidgetInstance.open).toHaveBeenCalled();
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should adjust for mobile viewport', () => {
      // Mock mobile viewport
      global.innerWidth = 375;
      global.innerHeight = 667;
      
      render(<BubbleChatWidget />);
      
      expect(mockWidgetInstance.setConfig).toHaveBeenCalledWith({
        widget_config: expect.objectContaining({
          mobile_config: expect.objectContaining({
            full_screen: true,
          }),
        }),
      });
    });
  });
});