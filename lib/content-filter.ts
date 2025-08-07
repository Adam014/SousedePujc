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
  let wasFiltered = false

  // Procházíme všechna nevhodná slova
  INAPPROPRIATE_WORDS.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    if (regex.test(filteredText)) {
      filteredWords.push(word)
      wasFiltered = true
      // Nahradíme nevhodné slovo hvězdičkami
      filteredText = filteredText.replace(regex, '*'.repeat(word.length))
    }
  })

  return {
    originalText: text,
    filteredText,
    wasFiltered,
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
      originalText,
      filteredText,
      filteredWords,
      contextType,
      contextId,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error logging inappropriate content:', error)
  }
}
