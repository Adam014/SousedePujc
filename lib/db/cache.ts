import type { Item, Category } from "../types"

export const CACHE_DURATION = 30000 // 30 seconds for items
export const CATEGORY_CACHE_DURATION = 300000 // 5 minutes for categories

interface CacheEntry<T> {
  data: T[] | null
  timestamp: number
}

export const cacheState = {
  items: { data: null, timestamp: 0 } as CacheEntry<Item>,
  categories: { data: null, timestamp: 0 } as CacheEntry<Category>,
}

export const invalidateCache = {
  items: () => { cacheState.items = { data: null, timestamp: 0 } },
  categories: () => { cacheState.categories = { data: null, timestamp: 0 } },
  all: () => {
    cacheState.items = { data: null, timestamp: 0 }
    cacheState.categories = { data: null, timestamp: 0 }
  },
}
