"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Camera, Loader2, Trash } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { db } from "@/lib/database"
import type { User } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"

interface AvatarUploadProps {
  user: User
  onAvatarUpdate: (newAvatarUrl: string | null) => void
}

export default function AvatarUpload({ user, onAvatarUpdate }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatar_url)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const uploadAvatar = async (file: File) => {
    try {
      setUploading(true)

      // Kontrola typu souboru
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Neplatný formát souboru",
          description: "Prosím nahrajte obrázek (JPG, PNG, GIF).",
          variant: "destructive",
        })
        return
      }

      // Kontrola velikosti souboru (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Soubor je příliš velký",
          description: "Maximální velikost souboru je 2MB.",
          variant: "destructive",
        })
        return
      }

      // Vytvoření unikátního názvu souboru
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Nahrání souboru do Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        console.error("Error uploading avatar:", uploadError)
        toast({
          title: "Chyba při nahrávání",
          description: "Nepodařilo se nahrát profilovou fotku. Zkuste to prosím znovu.",
          variant: "destructive",
        })
        return
      }

      // Získání veřejné URL
      const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath)
      const publicUrl = publicUrlData.publicUrl

      // Aktualizace uživatele v databázi
      await db.updateUser(user.id, { avatar_url: publicUrl })

      // Aktualizace stavu
      setAvatarUrl(publicUrl)
      onAvatarUpdate(publicUrl)

      toast({
        title: "Profilová fotka nahrána",
        description: "Vaše profilová fotka byla úspěšně aktualizována.",
      })
    } catch (error) {
      console.error("Error uploading avatar:", error)
      toast({
        title: "Chyba při nahrávání",
        description: "Nepodařilo se nahrát profilovou fotku. Zkuste to prosím znovu.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const removeAvatar = async () => {
    try {
      setUploading(true)

      // Pokud nemá avatar, není co odstraňovat
      if (!avatarUrl) return

      // Extrahování názvu souboru z URL
      const fileName = avatarUrl.split("/").pop()
      if (fileName) {
        // Odstranění souboru ze Storage
        const { error } = await supabase.storage.from("avatars").remove([`avatars/${fileName}`])
        if (error) {
          console.error("Error removing avatar from storage:", error)
        }
      }

      // Aktualizace uživatele v databázi
      await db.updateUser(user.id, { avatar_url: null })

      // Aktualizace stavu
      setAvatarUrl(null)
      onAvatarUpdate(null)

      toast({
        title: "Profilová fotka odstraněna",
        description: "Vaše profilová fotka byla úspěšně odstraněna.",
      })
    } catch (error) {
      console.error("Error removing avatar:", error)
      toast({
        title: "Chyba při odstraňování",
        description: "Nepodařilo se odstranit profilovou fotku. Zkuste to prosím znovu.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadAvatar(e.target.files[0])
    }
  }

  return (
    <div className="flex items-center space-x-6">
      <Avatar className="h-24 w-24">
        <AvatarImage src={avatarUrl || "/placeholder-user.jpg"} />
        <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="space-y-2">
        <div className="flex space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Camera className="h-4 w-4 mr-2" />}
            Změnit fotografii
          </Button>
          {avatarUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={removeAvatar}
              disabled={uploading}
              className="text-red-500 hover:text-red-700"
            >
              <Trash className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-gray-500">JPG, PNG nebo GIF (max. 2MB)</p>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={uploading}
        />
      </div>
    </div>
  )
}
