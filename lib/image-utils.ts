import { supabase } from "./supabase"

export const imageUtils = {
  // Komprese obrázku před nahráním
  async compressImage(file: File, maxWidth = 400, quality = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!
      const img = new Image()

      img.onload = () => {
        // Vypočítáme nové rozměry při zachování poměru stran
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio

        // Nakreslíme komprimovaný obrázek
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        // Převedeme na blob a pak na file
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            } else {
              resolve(file)
            }
          },
          "image/jpeg",
          quality,
        )
      }

      img.src = URL.createObjectURL(file)
    })
  },

  // Nahrání avataru do Supabase Storage
  async uploadAvatar(userId: string, file: File): Promise<string | null> {
    try {
      // Komprimujeme obrázek
      const compressedFile = await this.compressImage(file, 400, 0.8)

      // Vytvoříme jedinečný název souboru
      const fileExt = compressedFile.name.split(".").pop()
      const fileName = `${userId}/avatar.${fileExt}`

      // Smažeme starý avatar pokud existuje
      await supabase.storage.from("avatars").remove([fileName])

      // Nahrajeme nový avatar
      const { data, error } = await supabase.storage.from("avatars").upload(fileName, compressedFile, {
        cacheControl: "3600",
        upsert: true,
      })

      if (error) {
        console.error("Error uploading avatar:", error)
        return null
      }

      // Získáme veřejnou URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error("Error in uploadAvatar:", error)
      return null
    }
  },

  // Smazání avataru
  async deleteAvatar(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from("avatars")
        .remove([`${userId}/avatar.jpg`, `${userId}/avatar.png`, `${userId}/avatar.jpeg`])

      return !error
    } catch (error) {
      console.error("Error deleting avatar:", error)
      return false
    }
  },

  // Validace souboru
  validateImageFile(file: File): { valid: boolean; error?: string } {
    // Kontrola typu souboru
    if (!file.type.startsWith("image/")) {
      return { valid: false, error: "Soubor musí být obrázek" }
    }

    // Kontrola velikosti (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { valid: false, error: "Soubor je příliš velký (max 5MB)" }
    }

    // Kontrola formátu
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: "Podporované formáty: JPG, PNG, WebP" }
    }

    return { valid: true }
  },
}
