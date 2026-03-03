// Jednoduchý content filter pro filtrování nevhodného obsahu
export interface ContentFilterResult {
  originalText: string
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

export function filterInappropriateContent(text: string): ContentFilterResult {
  let filteredText = text
  const filteredWords: string[] = []

  // Procházíme všechna nevhodná slova
  // Using lookarounds instead of \b because JS \b doesn't work with Czech diacritics
  INAPPROPRIATE_WORDS.forEach(word => {
    const regex = new RegExp(`(?<=\\s|^)${word}(?=\\s|$)`, 'gi')
    const replaced = filteredText.replace(regex, '*'.repeat(word.length))
    if (replaced !== filteredText) {
      filteredWords.push(word)
      filteredText = replaced
    }
  })

  return {
    originalText: text,
    filteredText,
    wasFiltered: filteredWords.length > 0,
    filteredWords
  }
}

export async function logInappropriateContent(
  userId: string,
  originalText: string,
  filteredText: string,
  filteredWords: string[],
  contextType: string,
  contextId?: string
): Promise<void> {
  try {
    // V reálné aplikaci bychom zde logovali do databáze
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
