import { ROBOT_PERSONALITIES, type RobotId } from '@/lib/robot-config'

describe('Robot Configuration', () => {
  describe('ROBOT_PERSONALITIES', () => {
    test('should have robot-friend personality', () => {
      expect(ROBOT_PERSONALITIES['robot-friend']).toBeDefined()
    })

    test('robot-friend should have required properties', () => {
      const robot = ROBOT_PERSONALITIES['robot-friend']
      
      expect(robot).toHaveProperty('id', 'robot-friend')
      expect(robot).toHaveProperty('name')
      expect(robot).toHaveProperty('emoji')
      expect(robot).toHaveProperty('traits')
      expect(robot).toHaveProperty('voice_id')
      expect(robot).toHaveProperty('tools')
      expect(robot).toHaveProperty('systemPrompt')
      expect(robot).toHaveProperty('welcomeMessage')
      
      // Check property types
      expect(typeof robot.name).toBe('string')
      expect(typeof robot.emoji).toBe('string')
      expect(Array.isArray(robot.traits)).toBe(true)
      expect(typeof robot.voice_id).toBe('string')
      expect(Array.isArray(robot.tools)).toBe(true)
      expect(typeof robot.systemPrompt).toBe('string')
      expect(typeof robot.welcomeMessage).toBe('string')
    })

    test('robot-friend should have correct configuration', () => {
      const friend = ROBOT_PERSONALITIES['robot-friend']
      expect(friend.name).toBe('Robot Friend')
      expect(friend.emoji).toBe('😊')
      expect(friend.traits).toContain('cheerful')
      expect(friend.traits).toContain('supportive')
      expect(friend.traits).toContain('enthusiastic')
      expect(friend.tools).toContain('chat')
      expect(friend.voice_id).toBe('21m00Tcm4TlvDq8ikWAM') // Rachel voice
      expect(friend.welcomeMessage).toContain('Hi there!')
      expect(friend.systemPrompt).toContain('Robot Friend')
    })

    test('should have exactly one robot personality', () => {
      const robotKeys = Object.keys(ROBOT_PERSONALITIES)
      expect(robotKeys).toHaveLength(1)
      expect(robotKeys[0]).toBe('robot-friend')
    })

    test('robot personality should have valid voice_id', () => {
      const friend = ROBOT_PERSONALITIES['robot-friend']
      // ElevenLabs voice IDs are typically 20 characters
      expect(friend.voice_id).toMatch(/^[a-zA-Z0-9]{20}$/)
    })
  })
})