"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"
import EmojiPicker from "./emoji-picker"
import FileUpload from "./file-upload"

interface MessageInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  onFileUpload: (fileUrl: string, fileName: string, fileType: string) => void
  disabled?: boolean
  placeholder?: string
}

export default function MessageInput({
  value,
  onChange,
  onSubmit,
  onFileUpload,
  disabled = false,
  placeholder = "Zadejte zprávu...",
}: MessageInputProps) {
  const handleEmojiSelect = (emoji: string) => {
    onChange(value + emoji)
  }

  return (
    <div className="border-t p-3">
      <form onSubmit={onSubmit} className="flex items-center space-x-2">
        <FileUpload onFileUpload={onFileUpload} />
        <EmojiPicker onEmojiSelect={handleEmojiSelect} />
        <Input
          className="flex-1"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
        <Button type="submit" disabled={disabled || !value.trim()} size="sm">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
