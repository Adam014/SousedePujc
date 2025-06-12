"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, X, Loader2, AlertCircle, Info } from "lucide-react"
import { avatarUpload } from "@/lib/avatar-upload"
import { db } from "@/lib/database"

interface AvatarUploadProps {
  userId: string
  currentAvatarUrl?: string
  userName: string
  onAvatarUpdate: (newUrl: string | null) => void
}

export default function AvatarUpload({ userId, currentAvatarUrl, userName, onAvatarUpdate }: AvatarUploadProps) {
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

    // Validace
    if (!file.type.startsWith("image/")) {
      setError("Vyberte prosím obrázek (JPG, PNG, GIF, WebP)")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Soubor je příliš velký (max 2MB)")
      return
    }

    // Vytvoření preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.onerror = () => {
      setError("Chyba při čtení souboru")
    }
    reader.readAsDataURL(file)

    // Upload
    handleUpload(file)
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    setError("")
    setSuccess("")

    try {
      const result = await avatarUpload.uploadAvatar(userId, file)

      if (result.success && result.url) {
        // Aktualizujeme URL v databázi
        await db.updateUser(userId, { avatar_url: result.url })
        onAvatarUpdate(result.url)
        setPreviewUrl(null)
        setSuccess("Profilová fotografie byla úspěšně nahrána!")

        // Skryjeme success zprávu po 3 sekundách
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(result.error || "Chyba při nahrávání")
        setPreviewUrl(null)
      }
    } catch (error) {
      console.error("Upload error:", error)
      setError("Neočekávaná chyba při nahrávání")
      setPreviewUrl(null)
    } finally {
      setUploading(false)
      // Vyčistíme input
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
      const success = await avatarUpload.deleteAvatar(userId)
      if (success) {
        await db.updateUser(userId, { avatar_url: null })
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

  const displayUrl = previewUrl || currentAvatarUrl

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-6">
        <div className="relative">
          <Avatar className="h-24 w-24">
            <AvatarImage src={displayUrl || "/placeholder.svg"} />
            <AvatarFallback className="text-2xl">{userName.charAt(0)}</AvatarFallback>
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
          <AlertDescription>
            {error}
            {error.includes("bucket") && (
              <div className="mt-2 text-sm">
                <strong>Řešení:</strong> Jděte do Supabase Dashboard → Storage → vytvořte bucket s názvem "avatars"
                (public: true)
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Informační zpráva o konfiguraci */}
      {!currentAvatarUrl && !error && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>První použití:</strong> Pokud se zobrazí chyba, ujistěte se, že máte vytvořený bucket "avatars" v
            Supabase Dashboard → Storage.
          </AlertDescription>
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
