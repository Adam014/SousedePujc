import { supabase } from "./supabase"

export interface UploadAvatarResult {
  success: boolean
  url?: string
  error?: string
}

export const avatarUpload = {
  /**
   * Nahraje avatar pro uživatele
   */
  async uploadAvatar(userId: string, file: File): Promise<UploadAvatarResult> {
    try {
      // Validace souboru
      if (!file.type.startsWith("image/")) {
        return { success: false, error: "Soubor musí být obrázek" }
      }

      if (file.size > 2 * 1024 * 1024) {
        // 2MB limit
        return { success: false, error: "Soubor je příliš velký (max 2MB)" }
      }

      // Vytvoření jedinečného názvu souboru
      const fileExt = file.name.split(".").pop()
      const fileName = `${userId}/avatar.${fileExt}`

      // Nejprve smažeme starý avatar pokud existuje
      await this.deleteAvatar(userId)

      // Upload nového avataru
      const { data, error } = await supabase.storage.from("avatars").upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      })

      if (error) {
        console.error("Upload error:", error)
        return { success: false, error: "Chyba při nahrávání obrázku" }
      }

      // Získání veřejné URL
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName)

      return {
        success: true,
        url: urlData.publicUrl,
      }
    } catch (error) {
      console.error("Avatar upload error:", error)
      return { success: false, error: "Neočekávaná chyba při nahrávání" }
    }
  },

  /**
   * Smaže avatar uživatele
   */
  async deleteAvatar(userId: string): Promise<boolean> {
    try {
      // Najdeme všechny soubory uživatele
      const { data: files } = await supabase.storage.from("avatars").list(userId)

      if (files && files.length > 0) {
        // Smažeme všechny soubory
        const filesToDelete = files.map((file) => `${userId}/${file.name}`)
        await supabase.storage.from("avatars").remove(filesToDelete)
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
  getAvatarUrl(userId: string, fileName?: string): string | null {
    if (!fileName) return null

    const { data } = supabase.storage.from("avatars").getPublicUrl(`${userId}/${fileName}`)

    return data.publicUrl
  },
}
