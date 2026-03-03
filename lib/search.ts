import type { Item } from './types'

// Remove Czech diacritics for matching
function removeDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

// Levenshtein distance
function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) matrix[i] = [i]
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

// Max allowed typos based on query length
function maxTypos(queryLen: number): number {
  if (queryLen <= 3) return 0
  if (queryLen <= 5) return 1
  if (queryLen <= 8) return 2
  return 3
}

// Split text into words
function getWords(text: string): string[] {
  return text.split(/\s+/).filter(w => w.length > 0)
}

interface ScoredItem {
  item: Item
  score: number
}

/**
 * Search items with proper relevance scoring.
 * Priority: exact substring > word-start match > word fuzzy match
 */
export function fuzzyMatchItems(items: Item[], query: string): Item[] {
  if (!query || query.length < 2) return []

  const q = removeDiacritics(query.trim())
  if (q.length < 2) return []

  const typoLimit = maxTypos(q.length)
  const scored: ScoredItem[] = []

  for (const item of items) {
    const title = removeDiacritics(item.title || '')
    const category = removeDiacritics(item.category?.name || '')
    const description = removeDiacritics(item.description || '')

    let score = Infinity

    // --- Tier 0: Exact substring in title (score 0) ---
    if (title.includes(q)) {
      // Bonus if it starts at word boundary
      const idx = title.indexOf(q)
      score = (idx === 0 || title[idx - 1] === ' ') ? 0 : 0.1
    }
    // --- Tier 1: Exact substring in category (score 1) ---
    else if (category.includes(q)) {
      score = 1
    }
    // --- Tier 2: Exact substring in description (score 2) ---
    else if (description.includes(q)) {
      score = 2
    }
    // --- Tier 3: Fuzzy word match in title (score 3+) ---
    else if (typoLimit > 0) {
      const titleWords = getWords(title)
      for (const word of titleWords) {
        // Compare query against each word (or word prefix if word is longer)
        const compareTarget = word.length > q.length + 2 ? word.slice(0, q.length + 1) : word
        const dist = levenshtein(q, compareTarget)
        if (dist <= typoLimit) {
          score = Math.min(score, 3 + dist)
        }
      }

      // Also try matching query against word prefixes (user typing partial word)
      if (score === Infinity) {
        for (const word of titleWords) {
          if (word.length >= q.length && word.startsWith(q.slice(0, -1))) {
            score = Math.min(score, 3.5)
          }
        }
      }

      // Fuzzy word match in category
      if (score === Infinity) {
        const catWords = getWords(category)
        for (const word of catWords) {
          const compareTarget = word.length > q.length + 2 ? word.slice(0, q.length + 1) : word
          const dist = levenshtein(q, compareTarget)
          if (dist <= typoLimit) {
            score = Math.min(score, 4 + dist)
          }
        }
      }
    }

    if (score < Infinity) {
      scored.push({ item, score })
    }
  }

  return scored
    .sort((a, b) => a.score - b.score)
    .map(({ item }) => item)
}
