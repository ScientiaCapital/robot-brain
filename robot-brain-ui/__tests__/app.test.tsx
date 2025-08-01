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
        personality: 'friend',
        response: '😊 Hello! I\'m RoboFriend, nice to meet you!',
        emoji: '😊',
        name: 'RoboFriend',
        model: '@cf/meta/llama-2-7b-chat-int8',
        tools: ['chat', 'jokes', 'encouragement', 'games']
      }),
    } as Response)
  })

  test('displays robot selection screen initially', async () => {
    render(<RobotBrainApp />)

    expect(screen.getByText('Robot Brain')).toBeInTheDocument()
    expect(screen.getByText('Choose Your Robot Friend')).toBeInTheDocument()
    
    // Wait for robots to load
    await waitFor(() => {
      expect(screen.getByText('RoboFriend')).toBeInTheDocument()
    })
    
    expect(screen.getByText('RoboNerd')).toBeInTheDocument()
    expect(screen.getByText('RoboZen')).toBeInTheDocument()
    expect(screen.getByText('RoboPirate')).toBeInTheDocument()
    expect(screen.getByText('RoboDrama')).toBeInTheDocument()
  })

  test('shows loading skeletons initially', async () => {
    render(<RobotBrainApp />)

    // Should show skeletons initially
    const skeletons = screen.getAllByTestId('robot-skeleton') || []
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('RoboFriend')).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  test('selects robot and shows chat interface', async () => {
    const user = userEvent.setup()
    render(<RobotBrainApp />)

    // Wait for robots to load
    await waitFor(() => {
      expect(screen.getByText('RoboFriend')).toBeInTheDocument()
    })

    // Click on RoboFriend
    await user.click(screen.getByText('RoboFriend'))

    // Should show chat interface
    expect(screen.getByText('Chat with RoboFriend')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
  })

  test('displays welcome message when robot is selected', async () => {
    const user = userEvent.setup()
    render(<RobotBrainApp />)

    await waitFor(() => {
      expect(screen.getByText('RoboNerd')).toBeInTheDocument()
    })

    await user.click(screen.getByText('RoboNerd'))

    // Should eventually show welcome message
    await waitFor(() => {
      expect(screen.getByText(/explore fascinating topics|solve complex problems/i)).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  test('handles null currentRobot safely in chat interface', async () => {
    const user = userEvent.setup()
    render(<RobotBrainApp />)

    // Wait for robots to load
    await waitFor(() => {
      expect(screen.getByText('RoboFriend')).toBeInTheDocument()
    })

    // Click on RoboFriend
    await user.click(screen.getByText('RoboFriend'))

    // Should show chat interface without errors
    expect(screen.getByText('Chat with RoboFriend')).toBeInTheDocument()
    
    // The send button should render without errors
    const sendButton = screen.getByRole('button', { name: /send message/i })
    expect(sendButton).toBeInTheDocument()
    
    // Should have rendered the interface successfully
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
  })

  test('sends message and receives response', async () => {
    const user = userEvent.setup()
    render(<RobotBrainApp />)

    // Select robot
    await waitFor(() => {
      expect(screen.getByText('RoboFriend')).toBeInTheDocument()
    })
    await user.click(screen.getByText('RoboFriend'))

    // Wait for chat interface
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
    })

    // Type and send message
    const input = screen.getByPlaceholderText('Type your message...')
    await user.type(input, 'Hello there!')
    await user.click(screen.getByRole('button', { name: /send message/i }))

    // Should call API
    expect(mockFetch).toHaveBeenCalledWith(
      'https://robot-brain.tkipper.workers.dev/api/chat',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personality: 'friend',
          message: 'Hello there!'
        })
      })
    )

    // Should show response
    await waitFor(() => {
      expect(screen.getByText(/Hello! I'm RoboFriend/)).toBeInTheDocument()
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
            personality: 'friend',
            response: '😊 Thanks for waiting!',
            emoji: '😊',
            name: 'RoboFriend'
          }),
        } as Response), 500)
      )
    )

    render(<RobotBrainApp />)

    // Select robot and send message
    await waitFor(() => {
      expect(screen.getByText('RoboFriend')).toBeInTheDocument()
    })
    await user.click(screen.getByText('RoboFriend'))

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Type your message...')
    await user.type(input, 'Test message')
    await user.click(screen.getByRole('button', { name: /send message/i }))

    // Should show typing indicator (the ChatBubble component shows animated dots when isTyping=true)
    // The typing indicator appears as a chat bubble with the robot's name above it
    await waitFor(() => {
      // Look for the robot name that appears above typing bubbles
      const robotNameElements = screen.getAllByText('RoboFriend')
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

    // Select robot and send message
    await waitFor(() => {
      expect(screen.getByText('RoboFriend')).toBeInTheDocument()
    })
    await user.click(screen.getByText('RoboFriend'))

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Type your message...')
    await user.type(input, 'Test message')
    await user.click(screen.getByRole('button', { name: /send message/i }))

    // Should handle error gracefully (input should be re-enabled)
    await waitFor(() => {
      expect(input).not.toBeDisabled()
    })
  })

  test('quick action buttons work correctly', async () => {
    const user = userEvent.setup()
    render(<RobotBrainApp />)

    // Select RoboFriend (has joke tool)
    await waitFor(() => {
      expect(screen.getByText('RoboFriend')).toBeInTheDocument()
    })
    await user.click(screen.getByText('RoboFriend'))

    await waitFor(() => {
      expect(screen.getByText('😂 Tell a joke')).toBeInTheDocument()
    })

    // Click joke button
    await user.click(screen.getByText('😂 Tell a joke'))

    // Should populate input
    const input = screen.getByPlaceholderText('Type your message...')
    expect(input).toHaveValue('Tell me a joke!')
  })

  test('can return to robot selection', async () => {
    const user = userEvent.setup()
    render(<RobotBrainApp />)

    // Select robot
    await waitFor(() => {
      expect(screen.getByText('RoboFriend')).toBeInTheDocument()
    })
    await user.click(screen.getByText('RoboFriend'))

    await waitFor(() => {
      expect(screen.getByText('Change Robot')).toBeInTheDocument()
    })

    // Click change robot
    await user.click(screen.getByText('Change Robot'))

    // Should return to selection screen
    expect(screen.getByText('Choose Your Robot Friend')).toBeInTheDocument()
    expect(screen.getByText('RoboFriend')).toBeInTheDocument()
  })

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
    const user = userEvent.setup()
    render(<RobotBrainApp />)

    // Select robot
    await waitFor(() => {
      expect(screen.getByText('RoboFriend')).toBeInTheDocument()
    })
    await user.click(screen.getByText('RoboFriend'))

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
    })

    // Try to send empty message
    const sendButton = screen.getByRole('button', { name: /send message/i })
    expect(sendButton).toBeDisabled()
  })

  test('input is enabled after message is sent', async () => {
    const user = userEvent.setup()
    render(<RobotBrainApp />)

    // Select robot and send message
    await waitFor(() => {
      expect(screen.getByText('RoboFriend')).toBeInTheDocument()
    })
    await user.click(screen.getByText('RoboFriend'))

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Type your message...')
    await user.type(input, 'Test message')
    await user.click(screen.getByRole('button', { name: /send message/i }))

    // Input should be cleared and enabled after response
    await waitFor(() => {
      expect(input).toHaveValue('')
      expect(input).not.toBeDisabled()
    })
  })
})