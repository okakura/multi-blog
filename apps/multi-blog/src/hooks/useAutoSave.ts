import { useCallback, useEffect, useRef, useState } from 'react'

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface AutoSaveData {
  data: any
  timestamp: number
  version: string
}

interface UseAutoSaveOptions {
  key: string
  debounceMs?: number
  enabled?: boolean
  onSave?: (data: any) => Promise<void>
  onRestore?: (data: any) => void
}

interface UseAutoSaveReturn {
  saveStatus: AutoSaveStatus
  lastSaved: Date | null
  hasUnsavedChanges: boolean
  clearAutoSave: () => void
  restoreFromAutoSave: () => any | null
  manualSave: () => void
}

export const useAutoSave = (
  data: any,
  options: UseAutoSaveOptions,
): UseAutoSaveReturn => {
  const { key, debounceMs = 2000, enabled = true, onSave, onRestore } = options

  const [saveStatus, setSaveStatus] = useState<AutoSaveStatus>('idle')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const timeoutRef = useRef<number | null>(null)
  const lastDataRef = useRef<string>('')
  const initializedRef = useRef(false)

  // Create localStorage key with timestamp for uniqueness
  const getStorageKey = useCallback(() => `autosave_${key}`, [key])

  // Save to localStorage
  const saveToStorage = useCallback(
    async (dataToSave: any) => {
      try {
        setSaveStatus('saving')

        const autoSaveData: AutoSaveData = {
          data: dataToSave,
          timestamp: Date.now(),
          version: '1.0',
        }

        localStorage.setItem(getStorageKey(), JSON.stringify(autoSaveData))

        // If onSave callback is provided, call it as well
        if (onSave) {
          await onSave(dataToSave)
        }

        setSaveStatus('saved')
        setLastSaved(new Date())
        setHasUnsavedChanges(false)
      } catch (error) {
        console.error('Auto-save failed:', error)
        setSaveStatus('error')
        // Use a more basic warning since adminToast.warning doesn't exist
        console.warn('Auto-save failed. Your changes are still in the editor.')
      }
    },
    [getStorageKey, onSave],
  )

  // Debounced save function
  const debouncedSave = useCallback(
    (dataToSave: any) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      setHasUnsavedChanges(true)
      setSaveStatus('idle')

      timeoutRef.current = window.setTimeout(() => {
        saveToStorage(dataToSave)
      }, debounceMs)
    },
    [saveToStorage, debounceMs],
  )

  // Manual save function
  const manualSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    saveToStorage(data)
  }, [saveToStorage, data])

  // Clear auto-save data
  const clearAutoSave = useCallback(() => {
    localStorage.removeItem(getStorageKey())
    setLastSaved(null)
    setHasUnsavedChanges(false)
    setSaveStatus('idle')
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [getStorageKey])

  // Restore from auto-save
  const restoreFromAutoSave = useCallback((): any | null => {
    try {
      const saved = localStorage.getItem(getStorageKey())
      if (saved) {
        const autoSaveData: AutoSaveData = JSON.parse(saved)

        // Check if data is not too old (24 hours)
        const maxAge = 24 * 60 * 60 * 1000 // 24 hours
        if (Date.now() - autoSaveData.timestamp < maxAge) {
          setLastSaved(new Date(autoSaveData.timestamp))
          return autoSaveData.data
        }
        // Remove expired data
        localStorage.removeItem(getStorageKey())
      }
    } catch (error) {
      console.error('Failed to restore auto-save:', error)
    }
    return null
  }, [getStorageKey])

  // Check for existing auto-save on mount
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      const restoredData = restoreFromAutoSave()
      if (restoredData && onRestore) {
        onRestore(restoredData)
      }
    }
  }, [restoreFromAutoSave, onRestore])

  // Auto-save when data changes
  useEffect(() => {
    if (!enabled || !initializedRef.current) return

    const dataString = JSON.stringify(data)

    // Only save if data actually changed and has content
    if (
      dataString !== lastDataRef.current &&
      dataString !== '{}' &&
      dataString !== 'null'
    ) {
      // Check if data has meaningful content
      const hasContent =
        data &&
        (data.title?.trim() ||
          data.content?.trim() ||
          data.excerpt?.trim() ||
          data.author?.trim())

      if (hasContent) {
        lastDataRef.current = dataString
        debouncedSave(data)
      }
    }
  }, [data, enabled, debouncedSave])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Add beforeunload warning for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue =
          'You have unsaved changes. Are you sure you want to leave?'
        return 'You have unsaved changes. Are you sure you want to leave?'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  return {
    saveStatus,
    lastSaved,
    hasUnsavedChanges,
    clearAutoSave,
    restoreFromAutoSave,
    manualSave,
  }
}
