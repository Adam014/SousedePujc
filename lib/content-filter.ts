import { supabase } from "./supabase"

// Seznam nevhodných slov, která budou filtrována
const inappropriateWords = [
  // Rasistické výrazy
  "negr",
  "nigga",
  "nigger",
  "cikán",
  "cigan",
  "žid",
  "zid",
  "černoch",
  "cernoch",
  "černoušek",
  "cernoušek",

  // Sexuální výrazy
  "sex",
  "porn",
  "porno",
  "dick",
  "cock",
  "penis",
  "vagina",
  "pussy",
  "fuck",
  "fucking",
  "kurva",
  "píča",
  "pica",
  "prdel",
  "hovno",
  "shit",
  "ass",
  "asshole",
  "bitch",
  "kurva",
  "kurvy",
  "kokot",
  "čurák",
  "curak",
  "mrdka",
  "mrdání",
  "mrdani",
  "šukat",
  "sukat",
  "šukání",
  "sukani",

  // Urážlivé výrazy
  "debil",
  "idiot",
  "kretén",
  "kreten",
  "blbec",
  "blbej",
  "blbý",
  "blby",
  "retard",
  "retardovaný",
  "retardovany",
  "dement",
  "dementní",
  "dementni",
  "píča",
  "pica",
  "kokot",
  "čurák",
  "curak",
  "zmrd",
  "hajzl",
  "svině",
  "svine",

  // Další nevhodné výrazy
  "nazi",
  "nacista",
  "hitler",
  "holocaust",
  "koncentrák",
  "koncentrak",
]

// Funkce pro kontrolu, zda slovo je nevhodné
const isInappropriate = (word: string): string | null => {
  const lowerWord = word.toLowerCase()

  for (const badWord of inappropriateWords) {
    // Přesná shoda
    if (lowerWord === badWord) return badWord

    // Shoda s variantami (s/bez diakritiky)
    if (lowerWord.includes(badWord)) return badWord

    // Kontrola pro slova s mezerami nebo speciálními znaky
    const normalized = lowerWord.replace(/[^a-z0-9]/g, "")
    if (normalized === badWord || normalized.includes(badWord)) return badWord
  }

  return null
}

// Interface pro výsledek filtrování
export interface ContentFilterResult {
  filteredText: string
  wasFiltered: boolean
  filteredWords: string[]
  originalText: string
}

// Funkce pro nahrazení nevhodných slov hvězdičkami
export function filterInappropriateContent(text: string): ContentFilterResult {
  if (!text)
    return {
      filteredText: text,
      wasFiltered: false,
      filteredWords: [],
      originalText: text,
    }

  // Rozdělení textu na slova
  const words = text.split(/\s+/)
  const filteredWords: string[] = []
  let wasFiltered = false

  // Nahrazení nevhodných slov hvězdičkami
  const processedWords = words.map((word) => {
    const inappropriateWord = isInappropriate(word)
    if (inappropriateWord) {
      filteredWords.push(inappropriateWord)
      wasFiltered = true

      // Nahrazení všech znaků kromě prvního a posledního hvězdičkami
      if (word.length <= 2) {
        return "*".repeat(word.length)
      } else {
        return word[0] + "*".repeat(word.length - 2) + word[word.length - 1]
      }
    }
    return word
  })

  return {
    filteredText: processedWords.join(" "),
    wasFiltered,
    filteredWords,
    originalText: text,
  }
}

// Funkce pro logování nevhodného obsahu
export async function logInappropriateContent(
  userId: string,
  originalMessage: string,
  filteredMessage: string,
  filteredWords: string[],
  contextType = "chat_message",
  contextId?: string,
) {
  try {
    const { error } = await supabase.from("content_moderation_logs").insert([
      {
        user_id: userId,
        original_message: originalMessage,
        filtered_message: filteredMessage,
        filtered_words: filteredWords,
        context_type: contextType,
        context_id: contextId,
      },
    ])

    if (error) {
      console.error("Error logging inappropriate content:", error)
    }
  } catch (error) {
    console.error("Error in logInappropriateContent:", error)
  }
}
