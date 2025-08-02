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
        robotId="robot-friend" 
        onClick={mockOnClick}
      />
    )

    expect(screen.getByText('Robot Friend')).toBeInTheDocument()
    expect(screen.getByText('😊')).toBeInTheDocument()
    expect(screen.getByText(/cheerful/)).toBeInTheDocument()
    expect(screen.getByText(/supportive/)).toBeInTheDocument()
  })

  test('displays robot tools as badges', () => {
    render(
      <RobotCard 
        robotId="robot-friend" 
        onClick={mockOnClick}
      />
    )

    // robot-friend only has chat tool
    expect(screen.getByText(/chat/i)).toBeInTheDocument()
  })

  test('calls onClick when card is clicked', () => {
    render(
      <RobotCard 
        robotId="robot-friend" 
        onClick={mockOnClick}
      />
    )

    fireEvent.click(screen.getByText('Robot Friend'))
    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  test('applies selected styling when isSelected is true', () => {
    const { container } = render(
      <RobotCard 
        robotId="robot-friend" 
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
        robotId="robot-friend" 
        isSelected={false}
        onClick={mockOnClick}
      />
    )

    const card = container.querySelector('[role="button"], .cursor-pointer')
    expect(card).not.toHaveClass('ring-2', 'ring-primary')
  })

  test('handles missing onClick gracefully', () => {
    render(
      <RobotCard 
        robotId="robot-friend"
      />
    )

    // Should not throw error when clicked without onClick handler
    expect(() => {
      fireEvent.click(screen.getByText('Robot Friend'))
    }).not.toThrow()
  })

  test('uses correct index for animation delay', () => {
    const { rerender } = render(
      <RobotCard 
        robotId="robot-friend" 
        index={0}
        onClick={mockOnClick}
      />
    )

    // Component should render without error with index
    expect(screen.getByText('Robot Friend')).toBeInTheDocument()

    rerender(
      <RobotCard 
        robotId="robot-friend" 
        index={5}
        onClick={mockOnClick}
      />
    )

    // Should still render correctly with different index
    expect(screen.getByText('Robot Friend')).toBeInTheDocument()
  })
})