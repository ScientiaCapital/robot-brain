import { useState, useCallback, useEffect } from 'react'
import { ROBOT_PERSONALITIES, RobotId } from '@/lib/robot-config'

interface UseMultiRobotSelectionOptions {
  minSelection?: number
  maxSelection?: number
  persistKey?: string
  autoLoad?: boolean
}

type PresetType = 'technical' | 'fun' | 'wisdom'

interface UseMultiRobotSelectionReturn {
  selectedRobots: RobotId[]
  selectionCount: number
  hasMinimumSelection: boolean
  hasReachedMax: boolean
  toggleRobot: (robotId: RobotId) => void
  isRobotSelected: (robotId: string) => boolean
  clearAll: () => void
  selectAll: () => void
  getValidationError: () => string | null
  isSelectionValid: () => boolean
  applyPreset: (preset: PresetType) => void
  saveSelection: () => void
}

const PRESETS: Record<PresetType, RobotId[]> = {
  technical: ['robot-friend'], // MVP: Only one robot available
  fun: ['robot-friend'],
  wisdom: ['robot-friend']
}

export function useMultiRobotSelection(
  options: UseMultiRobotSelectionOptions = {}
): UseMultiRobotSelectionReturn {
  const { 
    minSelection = 2, 
    maxSelection = 5, 
    persistKey,
    autoLoad = false 
  } = options

  const [selectedRobots, setSelectedRobots] = useState<RobotId[]>([])

  // Load saved selection on mount if autoLoad is true
  useEffect(() => {
    if (autoLoad && persistKey) {
      const saved = localStorage.getItem(persistKey)
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as RobotId[]
          setSelectedRobots(parsed)
        } catch (e) {
          console.error('Failed to load saved selection:', e)
        }
      }
    }
  }, [autoLoad, persistKey])

  const toggleRobot = useCallback((robotId: RobotId) => {
    setSelectedRobots(prev => {
      if (prev.includes(robotId)) {
        // Always allow deselection
        return prev.filter(id => id !== robotId)
      }
      
      // Check max limit before adding
      if (prev.length >= maxSelection) {
        return prev // Don't add if at max
      }
      
      return [...prev, robotId]
    })
  }, [maxSelection])

  const isRobotSelected = useCallback((robotId: string): boolean => {
    return selectedRobots.includes(robotId as RobotId)
  }, [selectedRobots])

  const clearAll = useCallback(() => {
    setSelectedRobots([])
  }, [])

  const selectAll = useCallback(() => {
    const allRobots = Object.keys(ROBOT_PERSONALITIES) as RobotId[]
    // Respect max selection
    setSelectedRobots(allRobots.slice(0, maxSelection))
  }, [maxSelection])

  const getValidationError = useCallback((): string | null => {
    if (selectedRobots.length < minSelection) {
      return `Select at least ${minSelection} robots`
    }
    return null
  }, [selectedRobots.length, minSelection])

  const isSelectionValid = useCallback((): boolean => {
    return selectedRobots.length >= minSelection && selectedRobots.length <= maxSelection
  }, [selectedRobots.length, minSelection, maxSelection])

  const applyPreset = useCallback((preset: PresetType) => {
    const presetRobots = PRESETS[preset]
    // Respect max selection
    setSelectedRobots(presetRobots.slice(0, maxSelection))
  }, [maxSelection])

  const saveSelection = useCallback(() => {
    if (persistKey) {
      localStorage.setItem(persistKey, JSON.stringify(selectedRobots))
    }
  }, [persistKey, selectedRobots])

  return {
    selectedRobots,
    selectionCount: selectedRobots.length,
    hasMinimumSelection: selectedRobots.length >= minSelection,
    hasReachedMax: selectedRobots.length >= maxSelection,
    toggleRobot,
    isRobotSelected,
    clearAll,
    selectAll,
    getValidationError,
    isSelectionValid,
    applyPreset,
    saveSelection
  }
}