import { renderHook, act } from '@testing-library/react'
import { useRobotSelection } from '@/hooks/useRobotSelection'
import { RobotId } from '@/lib/robot-config'

describe('useRobotSelection Hook', () => {
  describe('Robot Selection State Management', () => {
    test('should initialize with no robot selected', () => {
      const { result } = renderHook(() => useRobotSelection())
      
      expect(result.current.selectedRobot).toBeNull()
      expect(result.current.isRobotSelected).toBe(false)
    })

    test('should select a robot', () => {
      const { result } = renderHook(() => useRobotSelection())
      
      act(() => {
        result.current.selectRobot('robot-friend' as RobotId)
      })
      
      expect(result.current.selectedRobot).toBe('robot-friend')
      expect(result.current.isRobotSelected).toBe(true)
    })

    test('should clear robot selection', () => {
      const { result } = renderHook(() => useRobotSelection())
      
      act(() => {
        result.current.selectRobot('robot-friend' as RobotId)
      })
      
      expect(result.current.selectedRobot).toBe('robot-friend')
      
      act(() => {
        result.current.clearSelection()
      })
      
      expect(result.current.selectedRobot).toBeNull()
      expect(result.current.isRobotSelected).toBe(false)
    })

    test('should switch between robots', () => {
      const { result } = renderHook(() => useRobotSelection())
      
      act(() => {
        result.current.selectRobot('robot-friend' as RobotId)
      })
      
      expect(result.current.selectedRobot).toBe('robot-friend')
      
      act(() => {
        result.current.selectRobot('robot-friend' as RobotId)
      })
      
      expect(result.current.selectedRobot).toBe('robot-friend')
    })
  })

  describe('Robot Filtering and Search', () => {
    test('should filter robots by search term', () => {
      const { result } = renderHook(() => useRobotSelection())
      
      act(() => {
        result.current.setSearchTerm('friend')
      })
      
      expect(result.current.filteredRobots).toHaveLength(1)
      expect(result.current.filteredRobots[0]).toBe('robot-friend')
    })

    test('should filter robots by trait', () => {
      const { result } = renderHook(() => useRobotSelection())
      
      act(() => {
        result.current.setSearchTerm('wise')
      })
      
      // RoboZen has wise trait
      // Only robot-friend exists now
      expect(result.current.filteredRobots).toHaveLength(0)
    })

    test('should return all robots when search is empty', () => {
      const { result } = renderHook(() => useRobotSelection())
      
      expect(result.current.filteredRobots).toHaveLength(1)
      expect(result.current.filteredRobots).toEqual(['robot-friend'])
    })

    test('should be case-insensitive in search', () => {
      const { result } = renderHook(() => useRobotSelection())
      
      act(() => {
        result.current.setSearchTerm('FRIEND')
      })
      
      expect(result.current.filteredRobots).toContain('robot-friend')
    })
  })

  describe('Robot Availability', () => {
    test('should check if robot is available', () => {
      const { result } = renderHook(() => useRobotSelection())
      
      expect(result.current.isRobotAvailable('robot-friend')).toBe(true)
      expect(result.current.isRobotAvailable('invalid' as RobotId)).toBe(false)
    })

    test('should get robot info', () => {
      const { result } = renderHook(() => useRobotSelection())
      
      const friendInfo = result.current.getRobotInfo('robot-friend')
      
      expect(friendInfo).toBeDefined()
      expect(friendInfo?.name).toBe('Robot Friend')
      expect(friendInfo?.emoji).toBe('😊')
      expect(friendInfo?.traits).toContain('cheerful')
    })

    test('should return null for invalid robot', () => {
      const { result } = renderHook(() => useRobotSelection())
      
      const info = result.current.getRobotInfo('invalid' as RobotId)
      
      expect(info).toBeNull()
    })
  })

  describe('Selection History', () => {
    test('should track selection history', () => {
      const { result } = renderHook(() => useRobotSelection())
      
      expect(result.current.selectionHistory).toEqual([])
      
      act(() => {
        result.current.selectRobot('robot-friend' as RobotId)
      })
      
      expect(result.current.selectionHistory).toEqual(['robot-friend'])
      
      act(() => {
        result.current.selectRobot('robot-friend' as RobotId)
      })
      
      expect(result.current.selectionHistory).toEqual(['robot-friend', 'robot-friend'])
    })

    test('should limit selection history to last 5', () => {
      const { result } = renderHook(() => useRobotSelection())
      
      const robots: RobotId[] = ['robot-friend', 'robot-friend', 'robot-friend', 'robot-friend', 'robot-friend', 'robot-friend']
      
      robots.forEach(robot => {
        act(() => {
          result.current.selectRobot(robot)
        })
      })
      
      expect(result.current.selectionHistory).toHaveLength(5)
      expect(result.current.selectionHistory).toEqual(['robot-friend', 'robot-friend', 'robot-friend', 'robot-friend', 'robot-friend'])
    })

    test('should get most recent selection', () => {
      const { result } = renderHook(() => useRobotSelection())
      
      act(() => {
        result.current.selectRobot('robot-friend' as RobotId)
        result.current.selectRobot('robot-friend' as RobotId)
      })
      
      expect(result.current.getMostRecentSelection()).toBe('robot-friend')
    })
  })

  describe('Robot Favorites', () => {
    test('should toggle robot as favorite', () => {
      const { result } = renderHook(() => useRobotSelection())
      
      expect(result.current.isFavorite('robot-friend')).toBe(false)
      
      act(() => {
        result.current.toggleFavorite('robot-friend' as RobotId)
      })
      
      expect(result.current.isFavorite('robot-friend')).toBe(true)
      
      act(() => {
        result.current.toggleFavorite('robot-friend' as RobotId)
      })
      
      expect(result.current.isFavorite('robot-friend')).toBe(false)
    })

    test('should get list of favorite robots', () => {
      const { result } = renderHook(() => useRobotSelection())
      
      act(() => {
        result.current.toggleFavorite('robot-friend' as RobotId)
      })
      
      expect(result.current.favoriteRobots).toEqual(['robot-friend'])
    })
  })
})