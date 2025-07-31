import { render, screen, fireEvent } from '@testing-library/react'
import { RobotCard } from '@/components/RobotCard'

// Mock framer-motion to avoid animation issues in testing
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

describe('RobotCard', () => {
  const mockOnClick = jest.fn()

  beforeEach(() => {
    mockOnClick.mockClear()
  })

  test('renders robot card with correct content', () => {
    render(
      <RobotCard 
        robotId="friend" 
        onClick={mockOnClick}
      />
    )

    expect(screen.getByText('RoboFriend')).toBeInTheDocument()
    expect(screen.getByText('😊')).toBeInTheDocument()
    expect(screen.getByText(/cheerful/)).toBeInTheDocument()
    expect(screen.getByText(/supportive/)).toBeInTheDocument()
  })

  test('displays robot tools as badges', () => {
    render(
      <RobotCard 
        robotId="nerd" 
        onClick={mockOnClick}
      />
    )

    // Should show first 3 tools
    expect(screen.getByText(/Chat/)).toBeInTheDocument()
    expect(screen.getByText(/Calculator/)).toBeInTheDocument()
    expect(screen.getByText(/Explainer/)).toBeInTheDocument()
  })

  test('shows "+X more" when robot has more than 3 tools', () => {
    render(
      <RobotCard 
        robotId="nerd" 
        onClick={mockOnClick}
      />
    )

    // RoboNerd has more than 3 tools, should show "+X more"
    expect(screen.getByText(/\+\d+ more/)).toBeInTheDocument()
  })

  test('calls onClick when card is clicked', () => {
    render(
      <RobotCard 
        robotId="friend" 
        onClick={mockOnClick}
      />
    )

    fireEvent.click(screen.getByText('RoboFriend'))
    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  test('applies selected styling when isSelected is true', () => {
    const { container } = render(
      <RobotCard 
        robotId="friend" 
        isSelected={true}
        onClick={mockOnClick}
      />
    )

    const card = container.querySelector('[role="button"], .cursor-pointer')
    expect(card).toHaveClass('ring-2', 'ring-primary')
  })

  test('does not apply selected styling when isSelected is false', () => {
    const { container } = render(
      <RobotCard 
        robotId="friend" 
        isSelected={false}
        onClick={mockOnClick}
      />
    )

    const card = container.querySelector('[role="button"], .cursor-pointer')
    expect(card).not.toHaveClass('ring-2', 'ring-primary')
  })

  test('renders all robot personalities correctly', () => {
    const robotIds = ['friend', 'nerd', 'zen', 'pirate', 'drama'] as const

    robotIds.forEach(robotId => {
      const { unmount } = render(
        <RobotCard 
          robotId={robotId} 
          onClick={mockOnClick}
        />
      )

      // Each robot should have its emoji and name visible
      const robotConfig = {
        friend: { name: 'RoboFriend', emoji: '😊' },
        nerd: { name: 'RoboNerd', emoji: '🤓' },
        zen: { name: 'RoboZen', emoji: '🧘' },
        pirate: { name: 'RoboPirate', emoji: '🏴‍☠️' },
        drama: { name: 'RoboDrama', emoji: '🎭' }
      }

      expect(screen.getByText(robotConfig[robotId].name)).toBeInTheDocument()
      expect(screen.getByText(robotConfig[robotId].emoji)).toBeInTheDocument()

      unmount()
    })
  })

  test('handles missing onClick gracefully', () => {
    render(
      <RobotCard 
        robotId="friend"
      />
    )

    // Should not throw error when clicked without onClick handler
    expect(() => {
      fireEvent.click(screen.getByText('RoboFriend'))
    }).not.toThrow()
  })

  test('uses correct index for animation delay', () => {
    const { rerender } = render(
      <RobotCard 
        robotId="friend" 
        index={0}
        onClick={mockOnClick}
      />
    )

    // Component should render without error with index
    expect(screen.getByText('RoboFriend')).toBeInTheDocument()

    rerender(
      <RobotCard 
        robotId="friend" 
        index={5}
        onClick={mockOnClick}
      />
    )

    // Should still render correctly with different index
    expect(screen.getByText('RoboFriend')).toBeInTheDocument()
  })
})