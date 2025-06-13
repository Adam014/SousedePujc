"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Upload, X, AlertCircle } from "lucide-react"
import Image from "next/image"
import { v4 as uuidv4 } from "uuid"
import { supabase } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ImageUploadProps {
  maxImages: number
  onImagesChange: (images: string[]) => void
  initialImages?: string[]
}

export default function ImageUpload({ maxImages, onImagesChange, initialImages = [] }: ImageUploadProps) {
  const [images, setImages] = useState<string[]>(initialImages)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    // Pokud se změní initialImages, aktualizujeme stav
    if (initialImages.length > 0) {
      setImages(initialImages)
    }
  }, [initialImages])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Kontrola počtu obrázků
    if (images.length + files.length > maxImages) {
      setError(`Můžete nahrát maximálně ${maxImages} obrázků`)
      return
    }

    setUploading(true)
    setError("")

    const newImages: string[] = [...images]

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Kontrola velikosti souboru (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(`Soubor ${file.name} je příliš velký. Maximální velikost je 5MB.`)
        continue
      }

      // Kontrola typu souboru
      if (!file.type.startsWith("image/")) {
        setError(`Soubor ${file.name} není obrázek.`)
        continue
      }

      try {
        const fileExt = file.name.split(".").pop()
        const fileName = `${uuidv4()}.${fileExt}`
        const filePath = `items/${fileName}`

        const { error: uploadError, data } = await supabase.storage.from("images").upload(filePath, file)

        if (uploadError) {
          throw uploadError
        }

        const { data: urlData } = supabase.storage.from("images").getPublicUrl(filePath)
        newImages.push(urlData.publicUrl)
      } catch (error) {
        console.error("Error uploading image:", error)
        setError("Došlo k chybě při nahrávání obrázku. Zkuste to prosím znovu.")
      }
    }

    setImages(newImages)
    onImagesChange(newImages)
    setUploading(false)
    e.target.value = "" // Reset input
  }

  const handleRemoveImage = (index: number) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    setImages(newImages)
    onImagesChange(newImages)
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-3 gap-4">
        {images.map((image, index) => (
          <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
            <Image src={image || "/placeholder.svg"} alt={`Obrázek ${index + 1}`} fill className="object-cover" />
            <button
              type="button"
              onClick={() => handleRemoveImage(index)}
              className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <label className="border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer aspect-square hover:border-gray-400 transition-all">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
              multiple={maxImages - images.length > 1}
            />
            <Upload className="h-8 w-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">
              {uploading ? "Nahrávání..." : `Přidat obrázek (${images.length}/${maxImages})`}
            </span>
          </label>
        )}
      </div>

      <div className="text-xs text-gray-500">
        <p>• Podporované formáty: JPG, PNG, GIF</p>
        <p>• Maximální velikost: 5MB</p>
        <p>• Doporučené rozlišení: min. 800x600px</p>
      </div>
    </div>
  )
}
