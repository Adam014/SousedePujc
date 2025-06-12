"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Camera, Trash, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { compressImage, validateImageFile } from "@/lib/image-utils"
import { supabase } from "@/lib/supabase"
import { db } from "@/lib/database"
import type { User } from "@/lib/types"

interface AvatarUploadProps {
  user: User
  onAvatarUpdate: (newAvatarUrl: string | null) => void
}

export default function AvatarUpload({ user, onAvatarUpdate }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatar_url || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validace souboru
    const validation = validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error)
      return
    }

    setError(null)
    setIsUploading(true)

    try {
      // Komprese obrázku
      const compressedFile = await compressImage(file)
      if (!compressedFile) {
        throw new Error("Nepodařilo se komprimovat obrázek")
      }

      // Vytvoření cesty pro soubor
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      // Nahrání souboru do Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, compressedFile, { upsert: true })

      if (uploadError) {
        throw uploadError
      }

      // Získání veřejné URL
      const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath)
      const publicUrl = publicUrlData.publicUrl

      // Aktualizace uživatele v databázi
      await db.updateUser(user.id, { avatar_url: publicUrl })

      // Aktualizace stavu
      setAvatarUrl(publicUrl)
      onAvatarUpdate(publicUrl)
    } catch (err) {
      console.error("Error uploading avatar:", err)
      setError("Došlo k chybě při nahrávání profilové fotky. Zkuste to prosím znovu.")
    } finally {
      setIsUploading(false)
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemoveAvatar = async () => {
    if (!avatarUrl) return
    if (!confirm("Opravdu chcete odstranit profilovou fotku?")) return

    setIsUploading(true)
    setError(null)

    try {
      // Aktualizace uživatele v databázi
      await db.updateUser(user.id, { avatar_url: null })

      // Aktualizace stavu
      setAvatarUrl(null)
      onAvatarUpdate(null)
    } catch (err) {
      console.error("Error removing avatar:", err)
      setError("Došlo k chybě při odstraňování profilové fotky. Zkuste to prosím znovu.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage src={avatarUrl || "/placeholder.svg"} />
          <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Camera className="h-4 w-4 mr-2" />
          {avatarUrl ? "Změnit fotku" : "Nahrát fotku"}
        </Button>

        {avatarUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemoveAvatar}
            disabled={isUploading}
            className="text-red-500 hover:text-red-700"
          >
            <Trash className="h-4 w-4 mr-2" />
            Odstranit
          </Button>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
        />
      </div>

      <p className="text-sm text-gray-500">JPG, PNG nebo GIF (max. 2MB)</p>
    </div>
  )
}
