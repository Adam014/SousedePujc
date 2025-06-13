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
const isInappropriate = (word: string): boolean => {
  const lowerWord = word.toLowerCase()
  return inappropriateWords.some((badWord) => {
    // Přesná shoda
    if (lowerWord === badWord) return true

    // Shoda s variantami (s/bez diakritiky)
    if (lowerWord.includes(badWord)) return true

    // Kontrola pro slova s mezerami nebo speciálními znaky
    const normalized = lowerWord.replace(/[^a-z0-9]/g, "")
    return normalized === badWord || normalized.includes(badWord)
  })
}

// Funkce pro nahrazení nevhodných slov hvězdičkami
export function filterInappropriateContent(text: string): string {
  if (!text) return text

  // Rozdělení textu na slova
  const words = text.split(/\s+/)

  // Nahrazení nevhodných slov hvězdičkami
  const filteredWords = words.map((word) => {
    if (isInappropriate(word)) {
      // Nahrazení všech znaků kromě prvního a posledního hvězdičkami
      if (word.length <= 2) {
        return "*".repeat(word.length)
      } else {
        return word[0] + "*".repeat(word.length - 2) + word[word.length - 1]
      }
    }
    return word
  })

  // Spojení slov zpět do textu
  return filteredWords.join(" ")
}
