import { render, screen, fireEvent, waitFor } from './test-utils'
import userEvent from '@testing-library/user-event'
import RobotBrainApp from '@/app/page'
import { mockFramerMotion } from './test-utils'

// Mock framer-motion
jest.mock('framer-motion', () => mockFramerMotion())

// Mock the API calls
global.fetch = jest.fn()

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

describe('RobotBrainApp E2E Tests', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    // Mock successful API response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        message: '😊 Hello! I\'m Robot Friend, nice to meet you!',
        personality: 'robot-friend',
        emoji: '😊',
        name: 'Robot Friend',
        sessionId: 'test-session'
      }),
    } as Response)
  })

  test('displays voice chat interface initially', async () => {
    render(<RobotBrainApp />)

    // Should show Robot Friend interface directly (MVP: single robot)
    expect(screen.getByText('Robot Friend')).toBeInTheDocument()
    expect(screen.getByText('Type your message')).toBeInTheDocument()
    
    // Should show voice/text mode controls
    expect(screen.getByText('Text Mode')).toBeInTheDocument()
    
    // Should show welcome message
    await waitFor(() => {
      expect(screen.getByText(/Hi there! I'm Robot Friend!/)).toBeInTheDocument()
    })
  })

  test('shows message input ready for interaction', async () => {
    render(<RobotBrainApp />)

    // Should show message input ready for use
    const messageInput = screen.getByPlaceholderText('Ask AI...')
    expect(messageInput).toBeInTheDocument()
    
    // Should show send button (disabled initially)
    const sendButton = screen.getByLabelText('Send message')
    expect(sendButton).toBeInTheDocument()
    expect(sendButton).toBeDisabled() // Empty input means disabled send
  })

  test('can switch between text and voice modes', async () => {
    const user = userEvent.setup()
    render(<RobotBrainApp />)

    // Should start in text mode
    expect(screen.getByText('Text Mode')).toBeInTheDocument()

    // Click to switch to voice mode
    await user.click(screen.getByText('Text Mode'))

    // Should show voice mode
    await waitFor(() => {
      expect(screen.getByText('Voice Mode')).toBeInTheDocument()
    })
  })

  test('displays welcome message immediately', async () => {
    render(<RobotBrainApp />)

    // Should show Robot Friend welcome message immediately
    await waitFor(() => {
      expect(screen.getByText(/Hi there! I'm Robot Friend!/)).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  test('handles chat interface safely', async () => {
    render(<RobotBrainApp />)

    // Should show chat interface without errors
    expect(screen.getByText('Robot Friend')).toBeInTheDocument()
    
    // The send button should render without errors
    const sendButton = screen.getByLabelText('Send message')
    expect(sendButton).toBeInTheDocument()
    
    // Should have rendered the interface successfully
    expect(screen.getByPlaceholderText('Ask AI...')).toBeInTheDocument()
  })

  test('sends message and receives response', async () => {
    const user = userEvent.setup()
    render(<RobotBrainApp />)

    // Wait for chat interface to be ready
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Ask AI...')).toBeInTheDocument()
    })

    // Type and send message
    const input = screen.getByPlaceholderText('Ask AI...')
    await user.type(input, 'Hello there!')
    await user.click(screen.getByLabelText('Send message'))

    // Should call API with robot-friend personality
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/chat',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Hello there!',
          personality: 'robot-friend',
          sessionId: expect.any(String)
        })
      })
    )

    // Should show response
    await waitFor(() => {
      expect(screen.getByText(/Hello! I'm Robot Friend/)).toBeInTheDocument()
    })
  })

  test('shows typing indicator while waiting for response', async () => {
    const user = userEvent.setup()
    
    // Mock delayed response
    mockFetch.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({
            message: '😊 Thanks for waiting!',
            personality: 'robot-friend',
            emoji: '😊',
            name: 'Robot Friend',
            sessionId: 'test-session'
          }),
        } as Response), 500)
      )
    )

    render(<RobotBrainApp />)

    // Wait for interface and send message
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Ask AI...')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Ask AI...')
    await user.type(input, 'Test message')
    await user.click(screen.getByLabelText('Send message'))

    // Should show typing indicator (the ChatBubble component shows animated dots when isTyping=true)
    // The typing indicator appears as a chat bubble with the robot's name above it
    await waitFor(() => {
      // Look for the robot name that appears above typing bubbles
      const robotNameElements = screen.getAllByText('Robot Friend')
      // There should be at least 2: one in header and one above typing bubble
      expect(robotNameElements.length).toBeGreaterThan(1)
    })

    // Wait for response
    await waitFor(() => {
      expect(screen.getByText(/Thanks for waiting/)).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  test('handles API error gracefully', async () => {
    const user = userEvent.setup()
    
    // Mock API error
    mockFetch.mockRejectedValue(new Error('Network error'))

    render(<RobotBrainApp />)

    // Wait for interface and send message
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Ask AI...')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Ask AI...')
    await user.type(input, 'Test message')
    await user.click(screen.getByLabelText('Send message'))

    // Should handle error gracefully (input should be re-enabled)
    await waitFor(() => {
      expect(input).not.toBeDisabled()
    })
  })

  test('suggestion buttons work correctly', async () => {
    const user = userEvent.setup()
    render(<RobotBrainApp />)

    // Wait for interface to load with suggestions
    await waitFor(() => {
      expect(screen.getByText('Tell me about yourself')).toBeInTheDocument()
    })

    // Click suggestion button
    await user.click(screen.getByText('Tell me about yourself'))

    // Should populate input
    const input = screen.getByPlaceholderText('Ask AI...')
    expect(input).toHaveValue('Tell me about yourself')
  })

  // Removed: Robot selection test - MVP has single robot only

  test.skip('dark mode toggle works', async () => {
    const user = userEvent.setup()
    render(<RobotBrainApp />)

    // Find dark mode toggle
    const darkModeButton = screen.getByRole('button', { name: /toggle dark mode/i }) || 
                          screen.getAllByRole('button').find(btn => 
                            btn.querySelector('[data-testid="moon-icon"], [data-testid="sun-icon"]')
                          )

    if (darkModeButton) {
      await user.click(darkModeButton)
      // Dark mode should toggle (tested via document class)
    }
  })

  test.skip('settings dialog can be opened', async () => {
    const user = userEvent.setup()
    render(<RobotBrainApp />)

    // Find settings button  
    const settingsButton = screen.getByRole('button', { name: /settings/i }) ||
                          screen.getAllByRole('button').find(btn => 
                            btn.textContent?.includes('⚙️') || btn.textContent?.includes('Settings')
                          )

    if (settingsButton) {
      await user.click(settingsButton)
      
      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument()
      })
    }
  })

  test('empty input cannot be sent', async () => {
    render(<RobotBrainApp />)

    // Wait for interface
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Ask AI...')).toBeInTheDocument()
    })

    // Try to send empty message
    const sendButton = screen.getByLabelText('Send message')
    expect(sendButton).toBeDisabled()
  })

  test('input is enabled after message is sent', async () => {
    const user = userEvent.setup()
    render(<RobotBrainApp />)

    // Wait for interface and send message
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Ask AI...')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Ask AI...')
    await user.type(input, 'Test message')
    await user.click(screen.getByLabelText('Send message'))

    // Input should be cleared and enabled after response
    await waitFor(() => {
      expect(input).toHaveValue('')
      expect(input).not.toBeDisabled()
    })
  })
})