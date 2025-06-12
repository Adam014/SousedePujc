"use client"

import type React from "react"

import { useState, useRef } from "react"
import { X, ImageIcon } from "lucide-react"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"

interface ImageUploadProps {
  maxImages?: number
  onImagesChange: (urls: string[]) => void
  initialImages?: string[]
}

export default function ImageUpload({ maxImages = 3, onImagesChange, initialImages = [] }: ImageUploadProps) {
  const [images, setImages] = useState<string[]>(initialImages)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Kontrola počtu souborů
    if (images.length + files.length > maxImages) {
      setError(`Můžete nahrát maximálně ${maxImages} obrázků.`)
      return
    }

    setUploading(true)
    setError(null)

    const newImages: string[] = [...images]
    const uploadPromises = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Kontrola typu souboru
      if (!file.type.startsWith("image/")) {
        setError("Můžete nahrát pouze obrázky.")
        setUploading(false)
        return
      }

      // Kontrola velikosti souboru (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Maximální velikost souboru je 5MB.")
        setUploading(false)
        return
      }

      const fileExt = file.name.split(".").pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `items/${fileName}`

      uploadPromises.push(
        supabase.storage
          .from("images")
          .upload(filePath, file)
          .then(({ data, error }) => {
            if (error) {
              console.error("Error uploading image:", error)
              throw error
            }

            // Získání veřejné URL
            const {
              data: { publicUrl },
            } = supabase.storage.from("images").getPublicUrl(filePath)

            newImages.push(publicUrl)
          }),
      )
    }

    try {
      await Promise.all(uploadPromises)
      setImages(newImages)
      onImagesChange(newImages)

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Error uploading images:", error)
      setError("Došlo k chybě při nahrávání obrázků.")
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = (index: number) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    setImages(newImages)
    onImagesChange(newImages)
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {images.map((url, index) => (
          <div key={index} className="relative aspect-square rounded-md overflow-hidden border border-gray-200">
            <Image src={url || "/placeholder.svg"} alt={`Obrázek ${index + 1}`} fill className="object-cover" />
            <button
              type="button"
              onClick={() => handleRemoveImage(index)}
              className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
              aria-label="Odstranit obrázek"
            >
              <X className="h-4 w-4 text-gray-700" />
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <button
            type="button"
            onClick={handleButtonClick}
            disabled={uploading}
            className="aspect-square rounded-md border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-gray-400 transition-colors"
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            ) : (
              <>
                <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Přidat obrázek</span>
              </>
            )}
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
        disabled={uploading || images.length >= maxImages}
      />

      <div className="text-sm text-gray-500">
        <p>• Nahrajte až {maxImages} obrázků</p>
        <p>• Podporované formáty: JPG, PNG, GIF</p>
        <p>• Maximální velikost: 5MB</p>
      </div>
    </div>
  )
}
