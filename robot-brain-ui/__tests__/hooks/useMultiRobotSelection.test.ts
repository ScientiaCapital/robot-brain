import { renderHook, act } from '@testing-library/react'
import { useMultiRobotSelection } from '@/hooks/useMultiRobotSelection'
import { RobotId } from '@/lib/robot-config'

describe('useMultiRobotSelection Hook', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    // Clear localStorage
    if (global.localStorage && global.localStorage.clear) {
      global.localStorage.clear()
    }
  })
  describe('Multi-Robot Selection', () => {
    test('should initialize with empty selection', () => {
      const { result } = renderHook(() => useMultiRobotSelection())
      
      expect(result.current.selectedRobots).toEqual([])
      expect(result.current.selectionCount).toBe(0)
      expect(result.current.hasMinimumSelection).toBe(false)
    })

    test('should add robot to selection', () => {
      const { result } = renderHook(() => useMultiRobotSelection())
      
      act(() => {
        result.current.toggleRobot('friend' as RobotId)
      })
      
      expect(result.current.selectedRobots).toEqual(['friend'])
      expect(result.current.selectionCount).toBe(1)
    })

    test('should remove robot from selection when toggled again', () => {
      const { result } = renderHook(() => useMultiRobotSelection())
      
      act(() => {
        result.current.toggleRobot('friend' as RobotId)
        result.current.toggleRobot('friend' as RobotId)
      })
      
      expect(result.current.selectedRobots).toEqual([])
    })

    test('should handle multiple robot selections', () => {
      const { result } = renderHook(() => useMultiRobotSelection())
      
      act(() => {
        result.current.toggleRobot('friend' as RobotId)
        result.current.toggleRobot('nerd' as RobotId)
        result.current.toggleRobot('zen' as RobotId)
      })
      
      expect(result.current.selectedRobots).toEqual(['friend', 'nerd', 'zen'])
      expect(result.current.selectionCount).toBe(3)
      expect(result.current.hasMinimumSelection).toBe(true)
    })

    test('should check if robot is selected', () => {
      const { result } = renderHook(() => useMultiRobotSelection())
      
      act(() => {
        result.current.toggleRobot('friend' as RobotId)
      })
      
      expect(result.current.isRobotSelected('friend')).toBe(true)
      expect(result.current.isRobotSelected('nerd')).toBe(false)
    })

    test('should clear all selections', () => {
      const { result } = renderHook(() => useMultiRobotSelection())
      
      act(() => {
        result.current.toggleRobot('friend' as RobotId)
        result.current.toggleRobot('nerd' as RobotId)
        result.current.clearAll()
      })
      
      expect(result.current.selectedRobots).toEqual([])
      expect(result.current.selectionCount).toBe(0)
    })

    test('should select all robots', () => {
      const { result } = renderHook(() => useMultiRobotSelection())
      
      act(() => {
        result.current.selectAll()
      })
      
      expect(result.current.selectedRobots).toHaveLength(5)
      expect(result.current.selectedRobots).toContain('friend')
      expect(result.current.selectedRobots).toContain('nerd')
      expect(result.current.selectedRobots).toContain('zen')
      expect(result.current.selectedRobots).toContain('pirate')
      expect(result.current.selectedRobots).toContain('drama')
    })

    test('should respect maximum selection limit', () => {
      const { result } = renderHook(() => useMultiRobotSelection({ maxSelection: 3 }))
      
      act(() => {
        result.current.toggleRobot('friend' as RobotId)
        result.current.toggleRobot('nerd' as RobotId)
        result.current.toggleRobot('zen' as RobotId)
        result.current.toggleRobot('pirate' as RobotId) // Should not be added
      })
      
      expect(result.current.selectedRobots).toHaveLength(3)
      expect(result.current.selectedRobots).not.toContain('pirate')
      expect(result.current.hasReachedMax).toBe(true)
    })

    test('should allow deselection even at max limit', () => {
      const { result } = renderHook(() => useMultiRobotSelection({ maxSelection: 2 }))
      
      act(() => {
        result.current.toggleRobot('friend' as RobotId)
        result.current.toggleRobot('nerd' as RobotId)
      })
      
      expect(result.current.hasReachedMax).toBe(true)
      
      act(() => {
        result.current.toggleRobot('friend' as RobotId) // Deselect
      })
      
      expect(result.current.selectedRobots).toEqual(['nerd'])
      expect(result.current.hasReachedMax).toBe(false)
    })
  })

  describe('Selection Validation', () => {
    test('should validate minimum selection requirement', () => {
      const { result } = renderHook(() => useMultiRobotSelection({ minSelection: 2 }))
      
      expect(result.current.hasMinimumSelection).toBe(false)
      
      act(() => {
        result.current.toggleRobot('friend' as RobotId)
      })
      
      expect(result.current.hasMinimumSelection).toBe(false)
      
      act(() => {
        result.current.toggleRobot('nerd' as RobotId)
      })
      
      expect(result.current.hasMinimumSelection).toBe(true)
    })

    test('should get validation errors', () => {
      const { result } = renderHook(() => useMultiRobotSelection({ minSelection: 2, maxSelection: 4 }))
      
      expect(result.current.getValidationError()).toBe('Select at least 2 robots')
      
      act(() => {
        result.current.toggleRobot('friend' as RobotId)
      })
      
      expect(result.current.getValidationError()).toBe('Select at least 2 robots')
      
      act(() => {
        result.current.toggleRobot('nerd' as RobotId)
      })
      
      expect(result.current.getValidationError()).toBeNull()
    })

    test('should validate selection is ready', () => {
      const { result } = renderHook(() => useMultiRobotSelection({ minSelection: 2 }))
      
      expect(result.current.isSelectionValid()).toBe(false)
      
      act(() => {
        result.current.toggleRobot('friend' as RobotId)
        result.current.toggleRobot('nerd' as RobotId)
      })
      
      expect(result.current.isSelectionValid()).toBe(true)
    })
  })

  describe('Selection Presets', () => {
    test('should apply preset selection', () => {
      const { result } = renderHook(() => useMultiRobotSelection())
      
      act(() => {
        result.current.applyPreset('technical') // Should select nerd and pirate
      })
      
      expect(result.current.selectedRobots).toContain('nerd')
    })

    test('should have fun preset', () => {
      const { result } = renderHook(() => useMultiRobotSelection())
      
      act(() => {
        result.current.applyPreset('fun') // Should select friend, pirate, drama
      })
      
      expect(result.current.selectedRobots).toContain('friend')
      expect(result.current.selectedRobots).toContain('pirate')
      expect(result.current.selectedRobots).toContain('drama')
    })

    test('should have wisdom preset', () => {
      const { result } = renderHook(() => useMultiRobotSelection())
      
      act(() => {
        result.current.applyPreset('wisdom') // Should select zen, nerd
      })
      
      expect(result.current.selectedRobots).toContain('zen')
      expect(result.current.selectedRobots).toContain('nerd')
    })
  })

  describe('Selection Persistence', () => {
    test('should save selection to storage', () => {
      const { result } = renderHook(() => useMultiRobotSelection({ persistKey: 'test-selection' }))
      
      act(() => {
        result.current.toggleRobot('friend' as RobotId)
        result.current.toggleRobot('nerd' as RobotId)
      })
      
      // Need to save after state has updated
      act(() => {
        result.current.saveSelection()
      })
      
      // Verify the value was saved
      const savedValue = global.localStorage.getItem('test-selection')
      expect(savedValue).toBe(JSON.stringify(['friend', 'nerd']))
    })

    test('should load saved selection on init', () => {
      // First set up data in localStorage
      global.localStorage.setItem('test-init', JSON.stringify(['zen']))
      
      const { result } = renderHook(() => useMultiRobotSelection({ persistKey: 'test-init', autoLoad: true }))
      
      // Verify it loaded the saved selection
      expect(result.current.selectedRobots).toEqual(['zen'])
    })
  })
})