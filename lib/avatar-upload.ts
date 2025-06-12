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

      // Nejprve smažeme starý avatar pokud existuje (bez čekání na výsledek)
      this.deleteAvatar(userId).catch(console.error)

      // Upload nového avataru
      const { data, error } = await supabase.storage.from("avatars").upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      })

      if (error) {
        console.error("Upload error:", error)

        // Specifické chybové zprávy
        if (error.message.includes("Bucket not found") || error.message.includes("bucket_not_found")) {
          return {
            success: false,
            error: "Storage bucket neexistuje. Vytvořte bucket 'avatars' v Supabase Dashboard.",
          }
        }
        if (error.message.includes("Policy") || error.message.includes("policy")) {
          return {
            success: false,
            error: "Nemáte oprávnění k nahrání souboru. Zkontrolujte RLS policies.",
          }
        }
        if (error.message.includes("File size") || error.message.includes("size")) {
          return { success: false, error: "Soubor je příliš velký." }
        }
        if (error.message.includes("JSON.parse")) {
          return {
            success: false,
            error: "Chyba komunikace se storage. Zkontrolujte konfiguraci Supabase.",
          }
        }

        return {
          success: false,
          error: `Chyba při nahrávání: ${error.message}`,
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
    } catch (error: any) {
      console.error("Avatar upload error:", error)

      if (error.message?.includes("JSON.parse")) {
        return {
          success: false,
          error: "Chyba komunikace se storage. Zkontrolujte, zda je bucket 'avatars' vytvořen v Supabase Dashboard.",
        }
      }

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
        if (listError.message.includes("not found") || listError.message.includes("does not exist")) {
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
}
