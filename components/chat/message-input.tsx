"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Paperclip, ImageIcon } from "lucide-react"
import EmojiPicker from "./emoji-picker"

interface MessageInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  disabled?: boolean
  placeholder?: string
}

export default function MessageInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = "Zadejte zprávu...",
}: MessageInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    if (value.length > 0 && !isTyping) {
      setIsTyping(true)
    } else if (value.length === 0 && isTyping) {
      setIsTyping(false)
    }
  }, [value, isTyping])

  const handleEmojiSelect = (emoji: string) => {
    const newValue = value + emoji
    onChange(newValue)
    inputRef.current?.focus()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSubmit(e as any)
    }
  }

  return (
    <div className="border-t bg-white p-3">
      <form onSubmit={onSubmit} className="flex items-end gap-2">
        <div className="flex-1 relative">
          <div className="flex items-center bg-gray-50 rounded-full border border-gray-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 ml-2" disabled={disabled}>
              <Paperclip className="h-4 w-4 text-gray-500" />
            </Button>

            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={disabled}>
              <ImageIcon className="h-4 w-4 text-gray-500" />
            </Button>

            <Input
              ref={inputRef}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={disabled}
            />

            <div className="mr-2">
              <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={disabled || !value.trim()}
          size="sm"
          className="h-10 w-10 rounded-full p-0 bg-blue-500 hover:bg-blue-600"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
