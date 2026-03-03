export interface ContentFilterResult {
  filteredText: string
  wasFiltered: boolean
  filteredWords: string[]
}

// Seznam nevhodných slov (základní sada pro demonstraci)
const INAPPROPRIATE_WORDS = [
  // Vulgarismy
  'kurva', 'píča', 'kokot', 'debil', 'idiot', 'blbec', 'zmrd', 'hajzl',
  // Rasistické výrazy
  'cikán', 'negr', 'žid',
  // Další nevhodné výrazy
  'nazi', 'hitler', 'smrt', 'zabít', 'vražda'
]

// Match word boundaries accounting for Czech diacritics and punctuation.
// A word boundary here = start/end of string, whitespace, or common punctuation.
const BOUNDARY_BEFORE = `(?<=[\\s,.!?;:()\\[\\]{}"'\\-]|^)`
const BOUNDARY_AFTER = `(?=[\\s,.!?;:()\\[\\]{}"'\\-]|$)`

export function filterInappropriateContent(text: string): ContentFilterResult {
  let filteredText = text
  const filteredWords: string[] = []

  for (const word of INAPPROPRIATE_WORDS) {
    const regex = new RegExp(`${BOUNDARY_BEFORE}${word}${BOUNDARY_AFTER}`, 'gi')
    const replaced = filteredText.replace(regex, '*'.repeat(word.length))
    if (replaced !== filteredText) {
      filteredWords.push(word)
      filteredText = replaced
    }
  }

  return {
    filteredText,
    wasFiltered: filteredWords.length > 0,
    filteredWords
  }
}

export function logFilteredContent(
  userId: string,
  filteredWords: string[],
  contextType: string,
  contextId?: string
): void {
  try {
    console.warn('Inappropriate content detected:', {
      userId,
      filteredWords,
      contextType,
      contextId,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error logging inappropriate content:', error)
  }
}
