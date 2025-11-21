import { useEffect } from 'react'

export const useAutoSave = <T,>(key: string, payload: T, onHydrate?: (value: T) => void) => {
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        const parsed = JSON.parse(stored) as T
        onHydrate?.(parsed)
      }
    } catch (error) {
      console.warn('Cannot hydrate project', error)
    }
    // run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(payload))
    } catch (error) {
      console.warn('Cannot persist project', error)
    }
  }, [key, payload])
}
