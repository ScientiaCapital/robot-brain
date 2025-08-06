import { useState, useMemo, useCallback } from 'react'
import { ROBOT_PERSONALITIES, RobotId } from '@/lib/robot-config'

interface UseRobotSelectionReturn {
  selectedRobot: RobotId | null
  isRobotSelected: boolean
  selectRobot: (robotId: RobotId) => void
  clearSelection: () => void
  searchTerm: string
  setSearchTerm: (term: string) => void
  filteredRobots: RobotId[]
  isRobotAvailable: (robotId: string) => boolean
  getRobotInfo: (robotId: string) => typeof ROBOT_PERSONALITIES[RobotId] | null
  selectionHistory: RobotId[]
  getMostRecentSelection: () => RobotId | null
  isFavorite: (robotId: string) => boolean
  toggleFavorite: (robotId: RobotId) => void
  favoriteRobots: RobotId[]
}

export function useRobotSelection(): UseRobotSelectionReturn {
  const [selectedRobot, setSelectedRobot] = useState<RobotId | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectionHistory, setSelectionHistory] = useState<RobotId[]>([])
  const [favoriteRobots, setFavoriteRobots] = useState<RobotId[]>([])

  const selectRobot = useCallback((robotId: RobotId) => {
    setSelectedRobot(robotId)
    setSelectionHistory(prev => {
      const newHistory = [...prev, robotId]
      // Keep only last 5 selections
      return newHistory.slice(-5)
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedRobot(null)
  }, [])

  const filteredRobots = useMemo(() => {
    if (!searchTerm.trim()) {
      return Object.keys(ROBOT_PERSONALITIES) as RobotId[]
    }

    const term = searchTerm.toLowerCase()
    return Object.entries(ROBOT_PERSONALITIES)
      .filter(([id, robot]) => {
        const matchesName = robot.name.toLowerCase().includes(term)
        const matchesId = id.toLowerCase().includes(term)
        const matchesTraits = robot.traits.some(trait => 
          trait.toLowerCase().includes(term)
        )
        return matchesName || matchesId || matchesTraits
      })
      .map(([id]) => id as RobotId)
  }, [searchTerm])

  const isRobotAvailable = useCallback((robotId: string): boolean => {
    return robotId in ROBOT_PERSONALITIES
  }, [])

  const getRobotInfo = useCallback((robotId: string) => {
    if (!isRobotAvailable(robotId)) {
      return null
    }
    return ROBOT_PERSONALITIES[robotId as RobotId]
  }, [isRobotAvailable])

  const getMostRecentSelection = useCallback(() => {
    if (selectionHistory.length === 0) {
      return null
    }
    return selectionHistory[selectionHistory.length - 1]
  }, [selectionHistory])

  const isFavorite = useCallback((robotId: string): boolean => {
    return favoriteRobots.includes(robotId as RobotId)
  }, [favoriteRobots])

  const toggleFavorite = useCallback((robotId: RobotId) => {
    setFavoriteRobots(prev => {
      if (prev.includes(robotId)) {
        return prev.filter(id => id !== robotId)
      }
      return [...prev, robotId]
    })
  }, [])

  return {
    selectedRobot,
    isRobotSelected: selectedRobot !== null,
    selectRobot,
    clearSelection,
    searchTerm,
    setSearchTerm,
    filteredRobots,
    isRobotAvailable,
    getRobotInfo,
    selectionHistory,
    getMostRecentSelection,
    isFavorite,
    toggleFavorite,
    favoriteRobots
  }
}