import { supabase } from "./supabase"

export interface AvatarUploadResult {
  success: boolean
  url?: string
  error?: string
}

export const avatarService = {
  /**
   * Nahraje avatar pro uživatele
   */
  async uploadAvatar(userId: string, file: File): Promise<AvatarUploadResult> {
    try {
      // Validace souboru
      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
      if (!allowedTypes.includes(file.type)) {
        return {
          success: false,
          error: "Nepodporovaný formát. Použijte JPG, PNG, GIF nebo WebP.",
        }
      }

      if (file.size > 2 * 1024 * 1024) {
        return {
          success: false,
          error: "Soubor je příliš velký. Maximální velikost je 2MB.",
        }
      }

      // Vytvoření názvu souboru
      const fileExt = file.name.split(".").pop()?.toLowerCase()
      const fileName = `${userId}/avatar.${fileExt}`

      // Upload souboru
      const { data, error } = await supabase.storage.from("avatars").upload(fileName, file, {
        cacheControl: "3600",
        upsert: true, // Přepíše existující soubor
      })

      if (error) {
        console.error("Upload error:", error)
        return {
          success: false,
          error: `Chyba při nahrávání: ${error.message}`,
        }
      }

      // Získání veřejné URL
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName)

      return {
        success: true,
        url: urlData.publicUrl,
      }
    } catch (error) {
      console.error("Avatar upload error:", error)
      return {
        success: false,
        error: "Neočekávaná chyba při nahrávání",
      }
    }
  },

  /**
   * Smaže avatar uživatele
   */
  async deleteAvatar(userId: string): Promise<boolean> {
    try {
      // Najdeme všechny soubory uživatele
      const { data: files, error: listError } = await supabase.storage.from("avatars").list(userId)

      if (listError) {
        console.error("List error:", listError)
        return false
      }

      if (files && files.length > 0) {
        // Smažeme všechny soubory
        const filesToDelete = files.map((file) => `${userId}/${file.name}`)
        const { error: deleteError } = await supabase.storage.from("avatars").remove(filesToDelete)

        if (deleteError) {
          console.error("Delete error:", deleteError)
          return false
        }
      }

      return true
    } catch (error) {
      console.error("Delete avatar error:", error)
      return false
    }
  },

  /**
   * Získá URL avataru uživatele
   */
  getAvatarUrl(userId: string): string {
    const { data } = supabase.storage.from("avatars").getPublicUrl(`${userId}/avatar.jpg`) // Defaultní přípona

    return data.publicUrl
  },
}
