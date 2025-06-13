"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Paperclip, ImageIcon, FileText, Upload } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface FileUploadProps {
  onFileUpload: (fileUrl: string, fileName: string, fileType: string) => void
}

export default function FileUpload({ onFileUpload }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File, type: "image" | "document") => {
    try {
      setUploading(true)

      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `chat-files/${type}s/${fileName}`

      const { error: uploadError } = await supabase.storage.from("chat-files").upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("chat-files").getPublicUrl(filePath)

      onFileUpload(publicUrl, file.name, file.type)
    } catch (error) {
      console.error("Error uploading file:", error)
      alert("Chyba při nahrávání souboru")
    } finally {
      setUploading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadFile(file, "image")
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadFile(file, "document")
    }
  }

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={uploading}>
            {uploading ? <Upload className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="end">
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => imageInputRef.current?.click()}
              className="w-full justify-start"
              disabled={uploading}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Obrázek
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="w-full justify-start"
              disabled={uploading}
            >
              <FileText className="h-4 w-4 mr-2" />
              Dokument
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.ppt,.pptx"
        onChange={handleFileUpload}
        className="hidden"
      />
    </>
  )
}
