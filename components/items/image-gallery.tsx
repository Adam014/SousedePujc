"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

interface ImageGalleryProps {
  images: string[]
  alt: string
}

export default function ImageGallery({ images, alt }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1))
  }

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index)
  }

  const handleOpenGallery = () => {
    setIsOpen(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      handlePrevious()
    } else if (e.key === "ArrowRight") {
      handleNext()
    } else if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  // Pokud nemáme žádné obrázky, zobrazíme placeholder
  if (images.length === 0) {
    return (
      <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
        <Image src="/placeholder.svg?height=400&width=600" alt={alt} fill className="object-cover" />
      </div>
    )
  }

  return (
    <div className="space-y-4" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Hlavní obrázek */}
      <div className="relative aspect-video rounded-lg overflow-hidden mb-4 cursor-pointer" onClick={handleOpenGallery}>
        <Image
          src={images[currentIndex] || "/placeholder.svg"}
          alt={`${alt} - obrázek ${currentIndex + 1}`}
          fill
          className="object-cover"
        />

        {images.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full"
              onClick={(e) => {
                e.stopPropagation()
                handlePrevious()
              }}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Předchozí</span>
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full"
              onClick={(e) => {
                e.stopPropagation()
                handleNext()
              }}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Další</span>
            </Button>

            <div className="absolute bottom-2 left-0 right-0 flex justify-center">
              <div className="bg-black/50 rounded-full px-3 py-1 text-white text-xs">
                {currentIndex + 1} / {images.length}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Miniatury */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <div
              key={index}
              className={`relative aspect-square rounded overflow-hidden cursor-pointer ${
                index === currentIndex ? "ring-2 ring-blue-600" : ""
              }`}
              onClick={() => handleThumbnailClick(index)}
            >
              <Image
                src={image || "/placeholder.svg"}
                alt={`${alt} - miniatura ${index + 1}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Modální galerie */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl p-0 bg-black border-none">
          <div className="relative h-[80vh] flex items-center justify-center">
            <Image
              src={images[currentIndex] || "/placeholder.svg"}
              alt={`${alt} - obrázek ${currentIndex + 1}`}
              fill
              className="object-contain"
            />

            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-2 bg-black/50 hover:bg-black/70 border-none text-white rounded-full"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Zavřít</span>
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 border-none text-white rounded-full"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-6 w-6" />
              <span className="sr-only">Předchozí</span>
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 border-none text-white rounded-full"
              onClick={handleNext}
            >
              <ChevronRight className="h-6 w-6" />
              <span className="sr-only">Další</span>
            </Button>

            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <div className="bg-black/70 rounded-full px-4 py-2 text-white">
                {currentIndex + 1} / {images.length}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
