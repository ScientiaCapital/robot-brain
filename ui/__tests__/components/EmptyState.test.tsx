import { render, screen } from '@testing-library/react'
import { EmptyState } from '@/components/EmptyState'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h3: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
}))

describe('EmptyState', () => {
  test('renders with robot name and emoji', () => {
    render(
      <EmptyState 
        robotName="RoboFriend"
        robotEmoji="😊"
      />
    )

    expect(screen.getByText('😊')).toBeInTheDocument()
    expect(screen.getByText('Chat with RoboFriend')).toBeInTheDocument()
  })

  test('displays helpful instructions', () => {
    render(
      <EmptyState 
        robotName="RoboNerd"
        robotEmoji="🤓"
      />
    )

    expect(screen.getByText(/Start a conversation by typing a message below/)).toBeInTheDocument()
    expect(screen.getByText(/or use one of the quick actions/)).toBeInTheDocument()
  })

  test('shows example conversation starters', () => {
    render(
      <EmptyState 
        robotName="RoboZen"
        robotEmoji="🧘"
      />
    )

    expect(screen.getByText(/Try saying:/)).toBeInTheDocument()
    expect(screen.getByText(/Hello!/)).toBeInTheDocument()
    expect(screen.getByText(/Tell me about yourself/)).toBeInTheDocument()
    expect(screen.getByText(/What can you do?/)).toBeInTheDocument()
  })

  test('works with all robot personalities', () => {
    const robots = [
      { name: 'RoboFriend', emoji: '😊' },
      { name: 'RoboNerd', emoji: '🤓' },
      { name: 'RoboZen', emoji: '🧘' },
      { name: 'RoboPirate', emoji: '🏴‍☠️' },
      { name: 'RoboDrama', emoji: '🎭' }
    ]

    robots.forEach(robot => {
      const { unmount } = render(
        <EmptyState 
          robotName={robot.name}
          robotEmoji={robot.emoji}
        />
      )

      expect(screen.getByText(robot.emoji)).toBeInTheDocument()
      expect(screen.getByText(`Chat with ${robot.name}`)).toBeInTheDocument()

      unmount()
    })
  })

  test('handles special characters in robot name', () => {
    render(
      <EmptyState 
        robotName="Robo-Friend 2.0"
        robotEmoji="🤖"
      />
    )

    expect(screen.getByText('Chat with Robo-Friend 2.0')).toBeInTheDocument()
  })

  test('has proper semantic structure', () => {
    render(
      <EmptyState 
        robotName="RoboFriend"
        robotEmoji="😊"
      />
    )

    // Should have proper heading structure
    const heading = screen.getByRole('heading', { level: 3 })
    expect(heading).toHaveTextContent('Chat with RoboFriend')
  })

  test('is centered and accessible', () => {
    const { container } = render(
      <EmptyState 
        robotName="RoboFriend"
        robotEmoji="😊"
      />
    )

    // Should have centering classes
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center')
  })

  test('displays with proper text hierarchy', () => {
    render(
      <EmptyState 
        robotName="RoboFriend"
        robotEmoji="😊"
      />
    )

    // Main heading should be more prominent
    const heading = screen.getByText('Chat with RoboFriend')
    expect(heading).toHaveClass('text-xl', 'font-semibold')

    // Description should be muted
    const description = screen.getByText(/Start a conversation/)
    expect(description).toHaveClass('text-muted-foreground')
  })

  test('emoji is prominently displayed', () => {
    const { container } = render(
      <EmptyState 
        robotName="RoboFriend"
        robotEmoji="😊"
      />
    )

    // Emoji should be large and prominent
    const emojiElement = screen.getByText('😊')
    expect(emojiElement).toHaveClass('text-6xl')
  })
})