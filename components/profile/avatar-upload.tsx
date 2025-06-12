"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, X, Loader2, AlertCircle } from "lucide-react"
import { avatarService } from "@/lib/avatar"
import { db } from "@/lib/database"

interface AvatarUploadProps {
  userId: string
  currentAvatarUrl?: string | null
  userName: string
  onAvatarUpdate: (newUrl: string | null) => void
}

export default function AvatarUpload({ userId, currentAvatarUrl, userName, onAvatarUpdate }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError("")
    setSuccess("")
    setUploading(true)

    try {
      // Upload souboru
      const result = await avatarService.uploadAvatar(userId, file)

      if (result.success && result.url) {
        // Aktualizace v databázi
        await db.updateUser(userId, { avatar_url: result.url })

        // Aktualizace v UI
        onAvatarUpdate(result.url)
        setSuccess("Profilová fotografie byla úspěšně nahrána!")

        // Skrytí zprávy po 3 sekundách
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(result.error || "Chyba při nahrávání")
      }
    } catch (error) {
      console.error("Upload error:", error)
      setError("Neočekávaná chyba při nahrávání")
    } finally {
      setUploading(false)
      // Vyčištění input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemoveAvatar = async () => {
    if (!confirm("Opravdu chcete odstranit profilovou fotografii?")) {
      return
    }

    setUploading(true)
    setError("")
    setSuccess("")

    try {
      const success = await avatarService.deleteAvatar(userId)

      if (success) {
        // Aktualizace v databázi
        await db.updateUser(userId, { avatar_url: null })

        // Aktualizace v UI
        onAvatarUpdate(null)
        setSuccess("Profilová fotografie byla odstraněna")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError("Chyba při mazání avataru")
      }
    } catch (error) {
      console.error("Remove avatar error:", error)
      setError("Neočekávaná chyba při mazání")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-6">
        <div className="relative">
          <Avatar className="h-24 w-24">
            <AvatarImage src={currentAvatarUrl || "/placeholder.svg"} />
            <AvatarFallback className="text-2xl">{userName.charAt(0).toUpperCase()}</AvatarFallback>
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
              {currentAvatarUrl ? "Změnit fotografii" : "Přidat fotografii"}
            </Button>

            {currentAvatarUrl && (
              <Button type="button" variant="outline" size="sm" onClick={handleRemoveAvatar} disabled={uploading}>
                <X className="h-4 w-4 mr-2" />
                Odstranit
              </Button>
            )}
          </div>

          <p className="text-sm text-gray-500">JPG, PNG, GIF nebo WebP (max. 2MB)</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
