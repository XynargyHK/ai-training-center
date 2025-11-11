/**
 * Database Auto-Initialization
 * Runs schema upgrades automatically on app start
 */

let initializationPromise: Promise<boolean> | null = null
let isInitialized = false

export async function ensureDatabaseInitialized(): Promise<boolean> {
  // If already initialized, return immediately
  if (isInitialized) {
    return true
  }

  // If initialization is in progress, wait for it
  if (initializationPromise) {
    return initializationPromise
  }

  // Start initialization
  initializationPromise = performInitialization()
  return initializationPromise
}

async function performInitialization(): Promise<boolean> {
  try {
    console.log('🚀 Initializing database...')

    // Call auto-init API
    const response = await fetch('/api/auto-init', {
      method: 'POST'
    })

    const result = await response.json()

    if (result.success) {
      console.log('✅ Database initialized successfully')
      isInitialized = true
      return true
    } else {
      console.warn('⚠️ Database initialization had issues:', result)
      return false
    }

  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    return false
  } finally {
    initializationPromise = null
  }
}

// Check if database needs initialization
export async function checkInitializationStatus(): Promise<boolean> {
  try {
    const response = await fetch('/api/auto-init')
    const result = await response.json()
    isInitialized = result.initialized
    return result.initialized
  } catch {
    return false
  }
}
