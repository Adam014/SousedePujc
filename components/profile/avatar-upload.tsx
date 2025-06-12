"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, Upload, Trash2, Loader2 } from "lucide-react"
import { imageUtils } from "@/lib/image-utils"
import { db } from "@/lib/database"
import type { User } from "@/lib/types"

interface AvatarUploadProps {
  user: User
  onAvatarUpdate: (newAvatarUrl: string) => void
}

export default function AvatarUpload({ user, onAvatarUpdate }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError("")
    setSuccess("")

    // Validace souboru
    const validation = imageUtils.validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error || "Neplatný soubor")
      return
    }

    // Vytvoření náhledu
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return

    setUploading(true)
    setError("")

    try {
      // Nahrajeme avatar
      const avatarUrl = await imageUtils.uploadAvatar(user.id, file)

      if (!avatarUrl) {
        setError("Nepodařilo se nahrát obrázek")
        return
      }

      // Aktualizujeme v databázi
      await db.updateUserAvatar(user.id, avatarUrl)

      // Zavoláme callback pro aktualizaci v parent komponentě
      onAvatarUpdate(avatarUrl)

      setSuccess("Profilová fotka byla úspěšně aktualizována!")
      setPreviewUrl(null)

      // Vyčistíme input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Error uploading avatar:", error)
      setError("Došlo k chybě při nahrávání obrázku")
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!user.avatar_url) return

    setUploading(true)
    setError("")

    try {
      // Smažeme avatar ze storage
      await imageUtils.deleteAvatar(user.id)

      // Aktualizujeme v databázi
      await db.updateUserAvatar(user.id, "")

      // Zavoláme callback
      onAvatarUpdate("")

      setSuccess("Profilová fotka byla odstraněna")
      setPreviewUrl(null)
    } catch (error) {
      console.error("Error removing avatar:", error)
      setError("Došlo k chybě při odstraňování obrázku")
    } finally {
      setUploading(false)
    }
  }

  const cancelPreview = () => {
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const currentAvatarUrl = previewUrl || user.avatar_url

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center space-x-6">
        <div className="relative">
          <Avatar className="h-24 w-24">
            <AvatarImage src={currentAvatarUrl || "/placeholder.svg"} />
            <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
          </Avatar>

          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Camera className="h-4 w-4 mr-2" />
              {user.avatar_url ? "Změnit fotografii" : "Přidat fotografii"}
            </Button>

            {user.avatar_url && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveAvatar}
                disabled={uploading}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Odstranit
              </Button>
            )}
          </div>

          {previewUrl && (
            <div className="flex space-x-2">
              <Button type="button" size="sm" onClick={handleUpload} disabled={uploading}>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Nahrávání..." : "Uložit"}
              </Button>

              <Button type="button" variant="outline" size="sm" onClick={cancelPreview} disabled={uploading}>
                Zrušit
              </Button>
            </div>
          )}

          <p className="text-sm text-gray-500">JPG, PNG nebo WebP (max. 5MB)</p>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
    </div>
  )
}
