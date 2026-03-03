"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
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
  placeholder = "Aa",
}: MessageInputProps) {
  const handleEmojiSelect = (emoji: string) => {
    onChange(value + emoji)
  }

  return (
    <div className="border-t px-3 py-2 flex-shrink-0">
      <form onSubmit={onSubmit} className="flex items-center gap-1">
        <FileUpload onFileUpload={onFileUpload} />
        <EmojiPicker onEmojiSelect={handleEmojiSelect} />
        <input
          className="flex-1 rounded-full bg-gray-100 border-0 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 placeholder:text-gray-400"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
        <Button
          type="submit"
          disabled={disabled || !value.trim()}
          size="icon"
          className="rounded-full h-9 w-9 bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
