import { ROBOT_PERSONALITIES, type RobotId, getConfiguredRobot } from '@/lib/robot-config'

describe('Robot Configuration', () => {
  describe('ROBOT_PERSONALITIES', () => {
    test('should have configured personality', () => {
      const personalityKeys = Object.keys(ROBOT_PERSONALITIES)
      expect(personalityKeys.length).toBeGreaterThan(0)
      expect(ROBOT_PERSONALITIES[personalityKeys[0]]).toBeDefined()
    })

    test('configured robot should have required properties', () => {
      const robot = getConfiguredRobot()
      
      expect(robot).toHaveProperty('id')
      expect(robot).toHaveProperty('name')
      expect(robot).toHaveProperty('emoji')
      expect(robot).toHaveProperty('traits')
      expect(robot).toHaveProperty('voiceId')
      expect(robot).toHaveProperty('tools')
      expect(robot).toHaveProperty('systemPrompt')
      expect(robot).toHaveProperty('welcomeMessage')
      
      // Check property types
      expect(typeof robot.name).toBe('string')
      expect(typeof robot.emoji).toBe('string')
      expect(Array.isArray(robot.traits)).toBe(true)
      expect(typeof robot.voiceId).toBe('string')
      expect(Array.isArray(robot.tools)).toBe(true)
      expect(typeof robot.systemPrompt).toBe('string')
      expect(typeof robot.welcomeMessage).toBe('string')
    })

    test('configured robot should have correct configuration', () => {
      const robot = getConfiguredRobot()
      expect(robot.name).toBe('Robot Friend')
      expect(robot.emoji).toBe('😊')
      expect(robot.traits).toContain('cheerful')
      expect(robot.traits).toContain('supportive')
      expect(robot.traits).toContain('enthusiastic')
      expect(robot.tools).toEqual([])
      expect(robot.voiceId).toBe('21m00Tcm4TlvDq8ikWAM') // Rachel voice
      expect(robot.welcomeMessage).toContain('Hi there!')
      expect(robot.systemPrompt).toContain('cheerful')
    })

    test('should have exactly one robot personality', () => {
      const robotKeys = Object.keys(ROBOT_PERSONALITIES)
      expect(robotKeys).toHaveLength(1)
      // The key should be the configured personality from agent.json (cheerful)
      expect(robotKeys[0]).toBe('cheerful')
    })

    test('robot personality should have valid voice_id', () => {
      const robot = getConfiguredRobot()
      // ElevenLabs voice IDs are typically 20 characters
      expect(robot.voiceId).toMatch(/^[a-zA-Z0-9]{20}$/)
    })
  })
})