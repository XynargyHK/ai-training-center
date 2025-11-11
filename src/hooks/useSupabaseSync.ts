// Custom hook to automatically sync state changes to Supabase
// This wraps setState and automatically saves to database

import { useState, useCallback, useRef } from 'react'
import {
  saveFAQ, deleteFAQ,
  saveCannedMessage, deleteCannedMessage,
  saveKnowledge, deleteKnowledge
} from '@/lib/supabase-storage'

type DataType = 'faqs' | 'cannedMessages' | 'knowledge'

export function useSupabaseSync<T extends { id: string }>(
  initialData: T[],
  dataType: DataType
) {
  const [data, setDataInternal] = useState<T[]>(initialData)
  const isSaving = useRef(false)

  // Wrapper that saves to Supabase after updating state
  const setData = useCallback(async (newData: T[] | ((prev: T[]) => T[])) => {
    const updatedData = typeof newData === 'function' ? newData(data) : newData

    // Update UI immediately for responsiveness
    setDataInternal(updatedData)

    // Don't auto-save during bulk operations
    if (isSaving.current) return

    // Note: Individual save operations should be done explicitly
    // This is just to update the local state
  }, [data])

  // Explicit save function for individual items
  const saveItem = useCallback(async (item: T) => {
    try {
      isSaving.current = true

      let saved
      switch (dataType) {
        case 'faqs':
          saved = await saveFAQ(item as any)
          break
        case 'cannedMessages':
          saved = await saveCannedMessage(item as any)
          break
        case 'knowledge':
          saved = await saveKnowledge(item as any)
          break
      }

      // Update local state with saved item (has real UUID from database)
      setDataInternal(prev =>
        prev.map(i => i.id === item.id ? { ...item, id: saved.id } : i)
      )

      console.log(`✅ Saved ${dataType} item to Supabase`)
      return saved
    } catch (error) {
      console.error(`Error saving ${dataType}:`, error)
      throw error
    } finally {
      isSaving.current = false
    }
  }, [dataType])

  // Explicit delete function
  const deleteItem = useCallback(async (id: string) => {
    try {
      isSaving.current = true

      switch (dataType) {
        case 'faqs':
          await deleteFAQ(id)
          break
        case 'cannedMessages':
          await deleteCannedMessage(id)
          break
        case 'knowledge':
          await deleteKnowledge(id)
          break
      }

      // Update local state
      setDataInternal(prev => prev.filter(i => i.id !== id))

      console.log(`✅ Deleted ${dataType} item from Supabase`)
    } catch (error) {
      console.error(`Error deleting ${dataType}:`, error)
      throw error
    } finally {
      isSaving.current = false
    }
  }, [dataType])

  return {
    data,
    setData,
    saveItem,
    deleteItem
  }
}
