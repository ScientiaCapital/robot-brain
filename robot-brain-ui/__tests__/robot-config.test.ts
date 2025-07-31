import { ROBOT_PERSONALITIES, ROBOT_TOOLS, type RobotId } from '@/lib/robot-config'

describe('Robot Configuration', () => {
  describe('ROBOT_PERSONALITIES', () => {
    test('should have all required robot personalities', () => {
      const expectedRobots: RobotId[] = ['friend', 'nerd', 'zen', 'pirate', 'drama']
      expectedRobots.forEach(robotId => {
        expect(ROBOT_PERSONALITIES[robotId]).toBeDefined()
      })
    })

    test('each robot should have required properties', () => {
      Object.entries(ROBOT_PERSONALITIES).forEach(([robotId, robot]) => {
        expect(robot).toHaveProperty('name')
        expect(robot).toHaveProperty('emoji')
        expect(robot).toHaveProperty('traits')
        expect(robot).toHaveProperty('model')
        expect(robot).toHaveProperty('tools')
        expect(robot).toHaveProperty('welcomeMessage')
        
        // Check property types
        expect(typeof robot.name).toBe('string')
        expect(typeof robot.emoji).toBe('string')
        expect(Array.isArray(robot.traits)).toBe(true)
        expect(typeof robot.model).toBe('string')
        expect(Array.isArray(robot.tools)).toBe(true)
        expect(typeof robot.welcomeMessage).toBe('string')
      })
    })

    test('RoboFriend should have correct configuration', () => {
      const friend = ROBOT_PERSONALITIES.friend
      expect(friend.name).toBe('RoboFriend')
      expect(friend.emoji).toBe('😊')
      expect(friend.traits).toContain('cheerful')
      expect(friend.traits).toContain('supportive')
      expect(friend.tools).toContain('chat')
      expect(friend.tools).toContain('jokes')
    })

    test('RoboNerd should have correct configuration', () => {
      const nerd = ROBOT_PERSONALITIES.nerd
      expect(nerd.name).toBe('RoboNerd')
      expect(nerd.emoji).toBe('🤓')
      expect(nerd.traits).toContain('analytical')
      expect(nerd.tools).toContain('calculate')
      expect(nerd.tools).toContain('research')
    })

    test('RoboZen should have correct configuration', () => {
      const zen = ROBOT_PERSONALITIES.zen
      expect(zen.name).toBe('RoboZen')
      expect(zen.emoji).toBe('🧘')
      expect(zen.traits).toContain('wise')
      expect(zen.tools).toContain('wisdom')
      expect(zen.tools).toContain('meditate')
    })

    test('RoboPirate should have correct configuration', () => {
      const pirate = ROBOT_PERSONALITIES.pirate
      expect(pirate.name).toBe('RoboPirate')
      expect(pirate.emoji).toBe('🏴‍☠️')
      expect(pirate.traits).toContain('adventurous')
      expect(pirate.tools).toContain('treasure_hunt')
    })

    test('RoboDrama should have correct configuration', () => {
      const drama = ROBOT_PERSONALITIES.drama
      expect(drama.name).toBe('RoboDrama')
      expect(drama.emoji).toBe('🎭')
      expect(drama.traits).toContain('dramatic')
      expect(drama.tools).toContain('perform')
      expect(drama.tools).toContain('shakespeare')
    })

    test('all robot tools should exist in ROBOT_TOOLS', () => {
      Object.values(ROBOT_PERSONALITIES).forEach(robot => {
        robot.tools.forEach(toolId => {
          expect(ROBOT_TOOLS[toolId]).toBeDefined()
        })
      })
    })

    test('welcome messages should be appropriate for each robot', () => {
      const friend = ROBOT_PERSONALITIES.friend
      expect(friend.welcomeMessage).toMatch(/friend|hello|hi/i)
      
      const nerd = ROBOT_PERSONALITIES.nerd
      expect(nerd.welcomeMessage).toMatch(/learn|knowledge|analytical/i)
      
      const zen = ROBOT_PERSONALITIES.zen
      expect(zen.welcomeMessage).toMatch(/peace|calm|wisdom/i)
      
      const pirate = ROBOT_PERSONALITIES.pirate
      expect(pirate.welcomeMessage).toMatch(/ahoy|adventure|treasure/i)
      
      const drama = ROBOT_PERSONALITIES.drama
      expect(drama.welcomeMessage).toMatch(/dramatic|performance|stage/i)
    })
  })

  describe('ROBOT_TOOLS', () => {
    test('should have all required tool properties', () => {
      Object.entries(ROBOT_TOOLS).forEach(([toolId, tool]) => {
        expect(tool).toHaveProperty('name')
        expect(tool).toHaveProperty('icon')
        expect(tool).toHaveProperty('description')
        
        expect(typeof tool.name).toBe('string')
        expect(typeof tool.icon).toBe('string')
        expect(typeof tool.description).toBe('string')
      })
    })

    test('should have expected core tools', () => {
      const expectedTools = ['chat', 'jokes', 'calculate', 'wisdom', 'treasure_hunt', 'perform'] as const
      expectedTools.forEach(toolId => {
        expect(ROBOT_TOOLS[toolId]).toBeDefined()
      })
    })

    test('tool icons should be emojis', () => {
      Object.values(ROBOT_TOOLS).forEach(tool => {
        // Basic emoji pattern check (Unicode ranges for common emojis)
        const emojiPattern = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u
        expect(tool.icon).toMatch(emojiPattern)
      })
    })

    test('tool descriptions should be helpful', () => {
      Object.values(ROBOT_TOOLS).forEach(tool => {
        expect(tool.description.length).toBeGreaterThan(5)
        expect(tool.description).not.toBe(tool.name)
      })
    })
  })

  describe('Robot-Tool Relationships', () => {
    test('each robot should have at least 3 tools', () => {
      Object.values(ROBOT_PERSONALITIES).forEach(robot => {
        expect(robot.tools.length).toBeGreaterThanOrEqual(3)
      })
    })

    test('all robots should have chat tool', () => {
      Object.values(ROBOT_PERSONALITIES).forEach(robot => {
        expect(robot.tools).toContain('chat')
      })
    })

    test('specialized tools should be assigned appropriately', () => {
      // RoboNerd should have analytical tools
      expect(ROBOT_PERSONALITIES.nerd.tools).toContain('calculate')
      expect(ROBOT_PERSONALITIES.nerd.tools).toContain('research')
      
      // RoboZen should have mindfulness tools
      expect(ROBOT_PERSONALITIES.zen.tools).toContain('wisdom')
      expect(ROBOT_PERSONALITIES.zen.tools).toContain('meditate')
      
      // RoboPirate should have adventure tools
      expect(ROBOT_PERSONALITIES.pirate.tools).toContain('treasure_hunt')
      
      // RoboDrama should have performance tools
      expect(ROBOT_PERSONALITIES.drama.tools).toContain('perform')
      expect(ROBOT_PERSONALITIES.drama.tools).toContain('shakespeare')
    })
  })

  describe('Model Configuration', () => {
    test('all robots should have valid model assignments', () => {
      Object.values(ROBOT_PERSONALITIES).forEach(robot => {
        expect(robot.model).toBeDefined()
        expect(typeof robot.model).toBe('string')
        expect(robot.model.length).toBeGreaterThan(0)
      })
    })

    test('specialized robots should use appropriate models', () => {
      // RoboNerd should use a smart/analytical model
      const nerdModel = ROBOT_PERSONALITIES.nerd.model
      expect(nerdModel).toMatch(/(smart|analytical|mistral|instruct)/i)
      
      // RoboPirate should use a fast/lightweight model for quick responses
      const pirateModel = ROBOT_PERSONALITIES.pirate.model
      expect(pirateModel).toMatch(/(fast|tiny|lightweight|1b)/i)
    })
  })
})