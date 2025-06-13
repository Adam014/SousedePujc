"use client"

import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import type { ChatMessage } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface MessageReplyProps {
  replyTo: ChatMessage | null
  onCancelReply: () => void
}

export default function MessageReply({ replyTo, onCancelReply }: MessageReplyProps) {
  if (!replyTo) return null

  return (
    <div className="border-t bg-gray-50 p-3">
      <div className="flex items-start space-x-2">
        <div className="w-1 h-12 bg-blue-400 rounded-full"></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <Avatar className="h-4 w-4">
              <AvatarImage
                src={replyTo.sender?.avatar_url || "/placeholder-user.jpg"}
                alt={replyTo.sender?.name || ""}
              />
              <AvatarFallback className="text-xs">{replyTo.sender?.name?.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium text-gray-600">
              Odpovídáte na zprávu od {replyTo.sender?.name || "Neznámý uživatel"}
            </span>
          </div>
          <p className="text-sm text-gray-700 line-clamp-2">{replyTo.message}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancelReply} className="h-6 w-6 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
