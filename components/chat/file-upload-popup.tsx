"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Paperclip, ImageIcon, FileIcon, Upload } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface FileUploadPopupProps {
  onFileUploaded: (url: string, type: "image" | "file", fileName: string) => void
  disabled?: boolean
}

export default function FileUploadPopup({ onFileUploaded, disabled = false }: FileUploadPopupProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    try {
      setUploading(true)

      // Vytvoříme jedinečný název souboru
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `chat-attachments/${fileName}`

      // Upload do Supabase Storage
      const { data, error } = await supabase.storage.from("chat-files").upload(filePath, file)

      if (error) {
        console.error("Error uploading file:", error)
        return
      }

      // Získáme public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("chat-files").getPublicUrl(filePath)

      // Určíme typ souboru
      const isImage = file.type.startsWith("image/")

      onFileUploaded(publicUrl, isImage ? "image" : "file", file.name)
      setIsOpen(false)
    } catch (error) {
      console.error("Error uploading file:", error)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 ml-2" disabled={disabled}>
          <Paperclip className="h-4 w-4 text-gray-500" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Přiložit soubor</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drag & Drop oblast */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 mb-2">Přetáhněte soubor sem nebo klikněte pro výběr</p>
            <p className="text-xs text-gray-500">Podporované formáty: obrázky, dokumenty, max 10MB</p>
          </div>

          {/* Tlačítka pro výběr typu */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-20 flex-col"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = "image/*"
                  fileInputRef.current.click()
                }
              }}
              disabled={uploading}
            >
              <ImageIcon className="h-8 w-8 mb-2 text-blue-500" />
              <span className="text-sm">Obrázek</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex-col"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = ".pdf,.doc,.docx,.txt,.zip,.rar"
                  fileInputRef.current.click()
                }
              }}
              disabled={uploading}
            >
              <FileIcon className="h-8 w-8 mb-2 text-green-500" />
              <span className="text-sm">Dokument</span>
            </Button>
          </div>

          {uploading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Nahrávání...</span>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              handleFileSelect(file)
            }
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
