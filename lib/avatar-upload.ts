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

      // Podporované formáty
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
      if (!allowedTypes.includes(file.type)) {
        return { success: false, error: "Nepodporovaný formát obrázku. Použijte JPG, PNG, GIF nebo WebP." }
      }

      // Vytvoření jedinečného názvu souboru s timestamp
      const fileExt = file.name.split(".").pop()?.toLowerCase()
      const timestamp = Date.now()
      const fileName = `${userId}/avatar-${timestamp}.${fileExt}`

      // Nejprve smažeme starý avatar pokud existuje
      await this.deleteAvatar(userId)

      // Upload nového avataru s explicitními options
      const { data, error } = await supabase.storage.from("avatars").upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      })

      if (error) {
        console.error("Upload error:", error)

        // Specifické chybové zprávy
        if (error.message.includes("Bucket not found")) {
          return { success: false, error: "Storage není správně nakonfigurován. Kontaktujte administrátora." }
        }
        if (error.message.includes("Policy")) {
          return { success: false, error: "Nemáte oprávnění k nahrání souboru." }
        }
        if (error.message.includes("File size")) {
          return { success: false, error: "Soubor je příliš velký." }
        }

        return {
          success: false,
          error: error.message || "Chyba při nahrávání obrázku",
        }
      }

      if (!data?.path) {
        return { success: false, error: "Nepodařilo se získat cestu k souboru" }
      }

      // Získání veřejné URL
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(data.path)

      if (!urlData?.publicUrl) {
        return { success: false, error: "Nepodařilo se získat veřejnou URL" }
      }

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
        // Pokud složka neexistuje, není to chyba
        if (listError.message.includes("not found")) {
          return true
        }
        console.error("List files error:", listError)
        return false
      }

      if (files && files.length > 0) {
        // Smažeme všechny soubory
        const filesToDelete = files.map((file) => `${userId}/${file.name}`)
        const { error: deleteError } = await supabase.storage.from("avatars").remove(filesToDelete)

        if (deleteError) {
          console.error("Delete files error:", deleteError)
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
  getAvatarUrl(userId: string, fileName?: string): string | null {
    if (!fileName) return null

    try {
      const { data } = supabase.storage.from("avatars").getPublicUrl(`${userId}/${fileName}`)

      return data.publicUrl
    } catch (error) {
      console.error("Get avatar URL error:", error)
      return null
    }
  },

  /**
   * Zkontroluje, zda bucket existuje a je správně nakonfigurován
   */
  async checkBucketHealth(): Promise<{ healthy: boolean; error?: string }> {
    try {
      // Zkusíme získat informace o bucket
      const { data, error } = await supabase.storage.getBucket("avatars")

      if (error) {
        console.error("Bucket health check failed:", error)
        return {
          healthy: false,
          error: error.message.includes("not found")
            ? "Storage bucket 'avatars' neexistuje. Vytvořte ho v Supabase Dashboard."
            : error.message,
        }
      }

      if (!data) {
        return { healthy: false, error: "Bucket data nejsou dostupná" }
      }

      // Zkusíme test upload (malý soubor)
      const testFile = new Blob(["test"], { type: "text/plain" })
      const testFileName = `test-${Date.now()}.txt`

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(`health-check/${testFileName}`, testFile)

      if (uploadError) {
        return {
          healthy: false,
          error: `Upload test selhal: ${uploadError.message}`,
        }
      }

      // Smažeme test soubor
      await supabase.storage.from("avatars").remove([`health-check/${testFileName}`])

      return { healthy: true }
    } catch (error) {
      console.error("Bucket health check error:", error)
      return {
        healthy: false,
        error: "Neočekávaná chyba při kontrole storage",
      }
    }
  },
}
