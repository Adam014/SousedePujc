import Fuse from 'fuse.js'
import type { Item } from './types'

// Remove Czech diacritics for better matching
function removeDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

// Type for normalized item used in search
interface NormalizedItem {
  original: Item
  searchTitle: string
  searchCategory: string
  searchDescription: string
}

// Fuse.js options for fuzzy search on normalized data
const fuseOptions: Fuse.IFuseOptions<NormalizedItem> = {
  keys: [
    { name: 'searchTitle', weight: 0.5 },
    { name: 'searchCategory', weight: 0.3 },
    { name: 'searchDescription', weight: 0.2 }
  ],
  threshold: 0.8,         // Very permissive to allow substring matching with typos
  distance: 1000,         // Large distance for substring matching
  ignoreLocation: true,   // Don't care where in string the match is
  includeScore: true,
  minMatchCharLength: 2,
  findAllMatches: true,
}

// Create a Fuse instance from items with pre-normalized data
export function createItemSearch(items: Item[]): Fuse<NormalizedItem> {
  // Pre-normalize all searchable fields
  const normalizedItems: NormalizedItem[] = items.map(item => ({
    original: item,
    searchTitle: removeDiacritics(item.title || ''),
    searchCategory: removeDiacritics(item.category?.name || ''),
    searchDescription: removeDiacritics(item.description || ''),
  }))

  return new Fuse(normalizedItems, fuseOptions)
}

// Search items using fuzzy matching with fallback to substring search
export function searchItems(fuse: Fuse<NormalizedItem>, query: string): Item[] {
  if (!query || query.length < 2) return []

  // Normalize the query (remove diacritics)
  const normalizedQuery = removeDiacritics(query)

  // Try fuzzy search first
  const fuzzyResults = fuse.search(normalizedQuery)

  if (fuzzyResults.length > 0) {
    return fuzzyResults.map(result => result.item.original)
  }

  // Fallback: manual fuzzy substring matching
  // Get all items from the fuse index and check manually
  const allItems = (fuse as any)._docs as NormalizedItem[]
  if (!allItems) return []

  return allItems
    .filter(item => {
      // Check if normalized query is similar to any substring of the title
      const title = item.searchTitle
      const queryLen = normalizedQuery.length

      // Slide through title checking substrings of same length as query
      for (let i = 0; i <= title.length - queryLen; i++) {
        const substring = title.slice(i, i + queryLen)
        if (levenshteinDistance(normalizedQuery, substring) <= 2) {
          return true
        }
      }

      // Also check slightly longer/shorter substrings (for insertions/deletions)
      for (let i = 0; i <= title.length - queryLen - 1; i++) {
        const substring = title.slice(i, i + queryLen + 1)
        if (levenshteinDistance(normalizedQuery, substring) <= 2) {
          return true
        }
      }
      for (let i = 0; i <= title.length - queryLen + 1 && queryLen > 1; i++) {
        const substring = title.slice(i, i + queryLen - 1)
        if (levenshteinDistance(normalizedQuery, substring) <= 2) {
          return true
        }
      }

      return false
    })
    .map(item => item.original)
}

// Calculate Levenshtein distance between two strings
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

// Check if two strings are similar (allow up to 2 character differences)
function isSimilar(a: string, b: string): boolean {
  if (a.includes(b) || b.includes(a)) return true
  if (Math.abs(a.length - b.length) > 2) return false

  return levenshteinDistance(a, b) <= 2
}

// Simple contains search for fallback
export function simpleSearch(items: Item[], query: string): Item[] {
  if (!query) return items

  const lowerQuery = query.toLowerCase()
  return items.filter(item =>
    item.title.toLowerCase().includes(lowerQuery) ||
    item.description?.toLowerCase().includes(lowerQuery) ||
    item.category?.name.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Professional fuzzy search for items
 * Handles: typos, diacritics (Czech chars), partial matches, substring matches
 */
export function fuzzyMatchItems(items: Item[], query: string): Item[] {
  if (!query || query.length < 2) return []

  const normalizedQuery = removeDiacritics(query)
  const queryLen = normalizedQuery.length

  // Score each item based on match quality
  const scoredItems = items.map(item => {
    const title = removeDiacritics(item.title || '')
    const category = removeDiacritics(item.category?.name || '')
    const description = removeDiacritics(item.description || '')

    let bestScore = Infinity

    // Check exact contains first (best match)
    if (title.includes(normalizedQuery)) {
      bestScore = 0
    } else if (category.includes(normalizedQuery)) {
      bestScore = 0.5
    } else if (description.includes(normalizedQuery)) {
      bestScore = 1
    } else {
      // Fuzzy substring matching on title
      const titleScore = fuzzySubstringScore(title, normalizedQuery, queryLen)
      const categoryScore = fuzzySubstringScore(category, normalizedQuery, queryLen) + 0.5
      const descScore = fuzzySubstringScore(description, normalizedQuery, queryLen) + 1

      bestScore = Math.min(titleScore, categoryScore, descScore)
    }

    return { item, score: bestScore }
  })

  // Filter items with reasonable scores and sort by score
  return scoredItems
    .filter(({ score }) => score <= 3) // Max 3 edits allowed
    .sort((a, b) => a.score - b.score)
    .map(({ item }) => item)
}

// Find best fuzzy substring match score
function fuzzySubstringScore(text: string, query: string, queryLen: number): number {
  if (!text || text.length < queryLen - 2) return Infinity

  let bestDistance = Infinity

  // Check substrings of similar length to query
  for (let len = queryLen - 1; len <= queryLen + 1; len++) {
    if (len <= 0 || len > text.length) continue

    for (let i = 0; i <= text.length - len; i++) {
      const substring = text.slice(i, i + len)
      const distance = levenshteinDistance(query, substring)

      if (distance < bestDistance) {
        bestDistance = distance
        if (distance === 0) return 0 // Perfect match, exit early
      }
    }
  }

  return bestDistance
}
