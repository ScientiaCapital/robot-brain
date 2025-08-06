import { render, screen } from '@testing-library/react'
import { ChatBubble } from '@/components/ChatBubble'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

describe('ChatBubble', () => {
  test('renders user message correctly', () => {
    render(
      <ChatBubble 
        message="Hello there!"
        sender="user"
      />
    )

    expect(screen.getByText('Hello there!')).toBeInTheDocument()
    expect(screen.getByText('You')).toBeInTheDocument()
  })

  test('renders robot message correctly', () => {
    render(
      <ChatBubble 
        message="Hello! How can I help you?"
        sender="robot"
        robotEmoji="😊"
        robotName="RoboFriend"
      />
    )

    expect(screen.getByText('Hello! How can I help you?')).toBeInTheDocument()
    expect(screen.getByText('😊')).toBeInTheDocument()
    expect(screen.getByText('RoboFriend')).toBeInTheDocument()
  })

  test('displays typing indicator when isTyping is true', () => {
    const { container } = render(
      <ChatBubble 
        message=""
        sender="robot"
        robotEmoji="😊"
        robotName="RoboFriend"
        isTyping={true}
      />
    )

    // Should show animated typing dots (three div elements with specific classes)
    const typingDots = container.querySelectorAll('.w-2.h-2.bg-current.rounded-full')
    expect(typingDots).toHaveLength(3)
    expect(screen.getByText('RoboFriend')).toBeInTheDocument()
  })

  test('applies correct styling for user messages', () => {
    const { container } = render(
      <ChatBubble 
        message="User message"
        sender="user"
      />
    )

    // User messages should be right-aligned (justify-end class)
    const messageContainer = container.querySelector('.justify-end')
    expect(messageContainer).toBeInTheDocument()
  })

  test('applies correct styling for robot messages', () => {
    const { container } = render(
      <ChatBubble 
        message="Robot message"
        sender="robot"
        robotEmoji="😊"
        robotName="RoboFriend"
      />
    )

    // Robot messages should be left-aligned (justify-start class)
    const messageContainer = container.querySelector('.justify-start')
    expect(messageContainer).toBeInTheDocument()
  })

  test('handles long messages properly', () => {
    const longMessage = 'This is a very long message that should wrap properly across multiple lines and maintain readability while being displayed in the chat bubble component.'
    
    render(
      <ChatBubble 
        message={longMessage}
        sender="user"
      />
    )

    expect(screen.getByText(longMessage)).toBeInTheDocument()
  })

  test('handles empty messages gracefully', () => {
    render(
      <ChatBubble 
        message=""
        sender="user"
      />
    )

    // Should still render the bubble structure
    expect(screen.getByText('You')).toBeInTheDocument()
  })

  test('handles special characters and emojis in messages', () => {
    const messageWithEmojis = 'Hello! 😊 How are you doing today? 🌟'
    
    render(
      <ChatBubble 
        message={messageWithEmojis}
        sender="robot"
        robotEmoji="🤓"
        robotName="RoboNerd"
      />
    )

    expect(screen.getByText(messageWithEmojis)).toBeInTheDocument()
    expect(screen.getByText('🤓')).toBeInTheDocument()
  })

  test('displays robot info only for robot messages', () => {
    render(
      <ChatBubble 
        message="User message"
        sender="user"
        robotEmoji="😊"  // These should be ignored for user messages
        robotName="RoboFriend"
      />
    )

    expect(screen.queryByText('😊')).not.toBeInTheDocument()
    expect(screen.queryByText('RoboFriend')).not.toBeInTheDocument()
    expect(screen.getByText('You')).toBeInTheDocument()
  })

  test('handles missing robot info for robot messages', () => {
    render(
      <ChatBubble 
        message="Robot message without info"
        sender="robot"
      />
    )

    expect(screen.getByText('Robot message without info')).toBeInTheDocument()
    // Should still render as robot message but without specific robot info
  })

  test('typing indicator shows correct animation', () => {
    const { container } = render(
      <ChatBubble 
        message=""
        sender="robot"
        robotEmoji="😊"
        robotName="RoboFriend"
        isTyping={true}
      />
    )

    // Check for typing animation dots (should have 3 animated dots)
    const typingDotsContainer = container.querySelector('div.flex.gap-1.py-1')
    expect(typingDotsContainer).toBeInTheDocument()
    
    const typingDots = container.querySelectorAll('.w-2.h-2.bg-current.rounded-full.opacity-60')
    expect(typingDots).toHaveLength(3)
  })

  test('preserves message formatting', () => {
    const formattedMessage = 'Line 1\nLine 2\n\nLine 4 with spaces   here'
    
    const { container } = render(
      <ChatBubble 
        message={formattedMessage}
        sender="robot"
        robotEmoji="😊"
        robotName="RoboFriend"
      />
    )

    // Should preserve the formatting (target the p element specifically)
    const messageElement = container.querySelector('p.text-sm.sm\\:text-base.leading-relaxed')
    expect(messageElement).toBeInTheDocument()
    expect(messageElement?.textContent).toBe(formattedMessage)
  })
})