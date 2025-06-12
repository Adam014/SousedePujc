/**
 * Komprimuje obrázek před nahráním
 * @param file Soubor obrázku
 * @param maxWidth Maximální šířka výsledného obrázku
 * @param quality Kvalita komprese (0-1)
 * @returns Promise s komprimovaným souborem
 */
export async function compressImage(file: File, maxWidth = 400, quality = 0.8): Promise<File | null> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let width = img.width
        let height = img.height

        // Zachováme poměr stran, ale omezíme maximální šířku
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        ctx?.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(null)
              return
            }
            const newFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            })
            resolve(newFile)
          },
          "image/jpeg",
          quality,
        )
      }
    }
    reader.onerror = () => resolve(null)
  })
}

/**
 * Validuje soubor obrázku
 * @param file Soubor k validaci
 * @param maxSizeMB Maximální velikost v MB
 * @returns Objekt s výsledkem validace
 */
export function validateImageFile(file: File, maxSizeMB = 2): { valid: boolean; error?: string } {
  // Kontrola typu souboru
  const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Nepodporovaný formát souboru. Povolené formáty jsou: ${validTypes.join(", ")}`,
    }
  }

  // Kontrola velikosti souboru
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `Soubor je příliš velký. Maximální velikost je ${maxSizeMB} MB.`,
    }
  }

  return { valid: true }
}
