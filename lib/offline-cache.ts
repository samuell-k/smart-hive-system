// Offline cache utilities for local storage
const CACHE_PREFIX = "smart_hive_"
const CACHE_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours

interface CacheItem<T> {
  data: T
  timestamp: number
}

export function setCacheItem<T>(key: string, data: T): void {
  try {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
    }
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheItem))
  } catch (error) {
    console.error("[v0] Error setting cache item:", error)
  }
}

export function getCacheItem<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(CACHE_PREFIX + key)
    if (!item) return null

    const cacheItem: CacheItem<T> = JSON.parse(item)

    // Check if cache is expired
    if (Date.now() - cacheItem.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_PREFIX + key)
      return null
    }

    return cacheItem.data
  } catch (error) {
    console.error("[v0] Error getting cache item:", error)
    return null
  }
}

export function clearCache(key?: string): void {
  try {
    if (key) {
      localStorage.removeItem(CACHE_PREFIX + key)
    } else {
      // Clear all cache items
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(k)
        }
      })
    }
  } catch (error) {
    console.error("[v0] Error clearing cache:", error)
  }
}

export function isCacheValid(key: string): boolean {
  try {
    const item = localStorage.getItem(CACHE_PREFIX + key)
    if (!item) return false

    const cacheItem: CacheItem<any> = JSON.parse(item)
    return Date.now() - cacheItem.timestamp <= CACHE_EXPIRY
  } catch (error) {
    return false
  }
}
